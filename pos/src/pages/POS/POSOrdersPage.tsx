import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { POSRoomChargeModal } from './POSRoomChargeModal';
import { CancelOrderDialog } from './CancelOrderDialog';
import { posService } from '@services/pos.service';
import { resortService } from '@services/resort.service';
import { invalidatePosQueries, posKeys } from '@/lib/posQueries';
import {
  PosOrderType,
  PosOrderStatus,
  type PosOrderListDto,
} from '@/types/pos.types';
import type { StayListDto } from '@/types/resort.types';
import { notifySuccess, notifyError } from '@/utils/alerts';

const formatMoney = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ORDER_TYPE_LABELS: Record<number, string> = {
  [PosOrderType.DineIn]: 'Dine-in',
  [PosOrderType.Takeaway]: 'Takeaway',
  [PosOrderType.RoomCharge]: 'Room Charge',
  [PosOrderType.PoolService]: 'Pool Service',
  [PosOrderType.RoomService]: 'Room Service',
};

const ORDER_STATUS_LABELS: Record<number, string> = {
  [PosOrderStatus.Open]: 'Open',
  [PosOrderStatus.SentToKitchen]: 'Kitchen',
  [PosOrderStatus.Preparing]: 'Preparing',
  [PosOrderStatus.Served]: 'Served',
  [PosOrderStatus.Billed]: 'Billed',
  [PosOrderStatus.Closed]: 'Closed',
  [PosOrderStatus.Cancelled]: 'Cancelled',
};

const CAN_CANCEL_STATUSES = [
  PosOrderStatus.Open,
  PosOrderStatus.SentToKitchen,
  PosOrderStatus.Preparing,
  PosOrderStatus.Served,
  PosOrderStatus.Billed,
];
const CAN_CHARGE_STATUSES = [
  PosOrderStatus.Open,
  PosOrderStatus.SentToKitchen,
  PosOrderStatus.Preparing,
  PosOrderStatus.Served,
  PosOrderStatus.Billed,
];

export const POSOrdersPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chargeOrder, setChargeOrder] = useState<PosOrderListDto | null>(null);
  const [cancelOrder, setCancelOrder] = useState<PosOrderListDto | null>(null);
  const [selectedStayForCharge, setSelectedStayForCharge] = useState<StayListDto | null>(null);

  const { data: orders = [], isFetching } = useQuery({
    queryKey: posKeys.ordersList(statusFilter),
    queryFn: () =>
      posService.getPosOrders({
        status: statusFilter === '' ? undefined : statusFilter,
        maxResultCount: 100,
      }),
  });

  const { data: inHouseStaysData, isFetching: isFetchingStays } = useQuery({
    queryKey: ['pos-in-house-stays'],
    queryFn: () => resortService.getInHouseStays('', 0, 200),
    enabled: chargeOrder !== null,
  });
  const inHouseStays = inHouseStaysData?.items ?? [];

  const cancelOrderMutation = useMutation({
    mutationFn: (input: { orderId: string; reasonType: number; reason: string }) =>
      posService.cancelPosOrder(input),
    onSuccess: () => {
      setCancelOrder(null);
      invalidatePosQueries(queryClient, 'orderDetailListAndTables');
      notifySuccess('Order cancelled.');
    },
    onError: (err: Error) => notifyError(err.message || 'Failed to cancel order.'),
  });

  const chargeToRoomMutation = useMutation({
    mutationFn: (input: { orderId: string; roomNumber: string }) =>
      posService.chargeOrderToRoom({ orderId: input.orderId, roomNumber: input.roomNumber }),
    onSuccess: () => {
      setChargeOrder(null);
      setSelectedStayForCharge(null);
      invalidatePosQueries(queryClient, 'orderDetailListAndTables');
      notifySuccess('Charged to room.');
    },
    onError: (err: Error) => notifyError(err.message || 'Failed to charge to room.'),
  });

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (order: PosOrderListDto) =>
        (order.orderNumber ?? '').toLowerCase().includes(q) ||
        (order.guestName ?? '').toLowerCase().includes(q) ||
        (order.tableNumber ?? '').toLowerCase().includes(q) ||
        (order.outletName ?? '').toLowerCase().includes(q) ||
        (order.serverStaffName ?? '').toLowerCase().includes(q) ||
        (order.notes ?? '').toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  const handleCancelOrderClick = (order: PosOrderListDto) => {
    setCancelOrder(order);
  };

  const handleChargeToRoom = () => {
    if (!chargeOrder || !selectedStayForCharge?.roomNumber) return;
    chargeToRoomMutation.mutate({ orderId: chargeOrder.id, roomNumber: selectedStayForCharge.roomNumber });
  };

  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="rounded-lg bg-white shadow dark:bg-gray-800">
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View list of orders. Open an order to manage it, cancel, or charge to room.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select
                value={statusFilter === '' ? '' : statusFilter}
                onChange={(e) => setStatusFilter(e.target.value === '' ? '' : Number(e.target.value))}
                className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order #, guest, table, outlet, server…"
              className="min-w-[16rem] rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {isFetching ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">Loading orders…</p>
          ) : filteredOrders.length === 0 ? (
            <p className="py-12 text-center text-gray-500 dark:text-gray-400">
              {orders.length === 0 ? 'No orders found.' : 'No orders match your search.'}
            </p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left dark:border-gray-700 dark:bg-gray-700/50">
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Order #</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Outlet</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Table</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Guest</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Type</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300 text-right">Total</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Server</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Opened</th>
                  <th className="p-3 font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: PosOrderListDto) => {
                  const canCancel = CAN_CANCEL_STATUSES.includes(order.status);
                  const canCharge = CAN_CHARGE_STATUSES.includes(order.status) && order.itemsTotal > 0;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    >
                      <td className="p-3 font-medium text-gray-900 dark:text-white">{order.orderNumber}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{order.outletName}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{order.tableNumber || '—'}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{order.guestName || '—'}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium text-gray-900 dark:text-white">
                        ₱{formatMoney(order.itemsTotal)}
                      </td>
                      <td className="p-3 text-gray-700 dark:text-gray-300 max-w-[8rem] truncate" title={order.serverStaffName || undefined}>
                        {order.serverStaffName || '—'}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {new Date(order.openedAt).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1">
                          <Link
                            to={`/order/${order.id}`}
                            className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            View
                          </Link>
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrderClick(order)}
                              disabled={cancelOrderMutation.isPending}
                              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                          {canCharge && (
                            <button
                              type="button"
                              onClick={() => {
                                setChargeOrder(order);
                                setSelectedStayForCharge(null);
                              }}
                              className="rounded bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700"
                            >
                              Charge to room
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <POSRoomChargeModal
        open={chargeOrder !== null}
        onClose={() => {
          setChargeOrder(null);
          setSelectedStayForCharge(null);
        }}
        orderItemsTotal={chargeOrder?.itemsTotal ?? 0}
        inHouseStays={inHouseStays}
        isFetchingStays={isFetchingStays}
        selectedStay={selectedStayForCharge}
        onSelectStay={setSelectedStayForCharge}
        onCharge={handleChargeToRoom}
        isPending={chargeToRoomMutation.isPending}
      />

      <CancelOrderDialog
        open={cancelOrder !== null}
        onClose={() => setCancelOrder(null)}
        order={cancelOrder}
        onConfirm={(reasonType, reason) => {
          if (cancelOrder)
            cancelOrderMutation.mutate({
              orderId: cancelOrder.id,
              reasonType,
              reason,
            });
        }}
        isPending={cancelOrderMutation.isPending}
      />
    </POSLayout>
  );
};
