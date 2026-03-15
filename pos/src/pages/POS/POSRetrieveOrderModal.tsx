import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { PosOrderType, PosOrderStatus, type PosOrderListDto } from '@/types/pos.types';

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
  [PosOrderStatus.SentToKitchen]: 'Sent to Kitchen',
  [PosOrderStatus.Preparing]: 'Preparing',
  [PosOrderStatus.Served]: 'Served',
  [PosOrderStatus.Billed]: 'Billed',
  [PosOrderStatus.Closed]: 'Closed',
  [PosOrderStatus.Cancelled]: 'Cancelled',
};

export type POSRetrieveOrderModalProps = {
  open: boolean;
  onClose: () => void;
  orders: PosOrderListDto[];
  statusFilters: number[];
  onStatusFiltersChange: (statuses: number[]) => void;
  onLoadOrder: (order: PosOrderListDto) => void;
  isFetching: boolean;
};

const ALL_STATUSES = [
  PosOrderStatus.Open,
  PosOrderStatus.SentToKitchen,
  PosOrderStatus.Preparing,
  PosOrderStatus.Served,
  PosOrderStatus.Billed,
  PosOrderStatus.Closed,
  PosOrderStatus.Cancelled,
] as const;

export const POSRetrieveOrderModal = ({
  open,
  onClose,
  orders,
  statusFilters,
  onStatusFiltersChange,
  onLoadOrder,
  isFetching,
}: POSRetrieveOrderModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (order) =>
        (order.orderNumber ?? '').toLowerCase().includes(q) ||
        (order.guestName ?? '').toLowerCase().includes(q) ||
        (order.tableNumber ?? '').toLowerCase().includes(q) ||
        (order.outletName ?? '').toLowerCase().includes(q) ||
        (order.serverStaffName ?? '').toLowerCase().includes(q) ||
        (order.notes ?? '').toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setSearchQuery('');
  }, [open]);

  return (
    <Dialog open={open} onClose={() => { }} className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-black/50 pointer-events-none" aria-hidden />
      <div className="relative z-10 flex min-h-full items-start justify-center pt-6 pb-6 pl-4 pr-4 pointer-events-none">
        <DialogPanel className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800 pointer-events-auto">
          <div className="shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between gap-3">
              <DialogTitle as="h3" className="text-lg font-semibold text-gray-900 dark:text-white">
                Retrieve Order
              </DialogTitle>

              <button
                type="button"
                onClick={onClose}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                <div className="flex flex-wrap gap-3">
                  {ALL_STATUSES.map((status) => (
                    <label key={status} className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={statusFilters.includes(status)}
                        onChange={() => {
                          if (statusFilters.includes(status)) {
                            onStatusFiltersChange(statusFilters.filter((s) => s !== status));
                          } else {
                            onStatusFiltersChange([...statusFilters, status].sort((a, b) => a - b));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                      {ORDER_STATUS_LABELS[status]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Order #, guest, table, outlet, server…"
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            {isFetching ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">Loading orders…</p>
            ) : filteredOrders.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                {orders.length === 0 ? 'No orders found.' : 'No orders match your search.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left dark:border-gray-700">
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Order #</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Outlet</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Table</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Guest</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Type</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Status</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300 text-right">Total</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Server</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Notes</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Opened</th>
                      <th className="p-2 font-medium text-gray-700 dark:text-gray-300"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="p-2 font-medium text-gray-900 dark:text-white">{order.orderNumber}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{order.outletName}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{order.tableNumber || '—'}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">{order.guestName || '—'}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300">
                          {ORDER_TYPE_LABELS[order.orderType] ?? order.orderType}
                        </td>
                        <td className="p-2">
                          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                            {ORDER_STATUS_LABELS[order.status] ?? order.status}
                          </span>
                        </td>
                        <td className="p-2 text-right font-medium text-gray-900 dark:text-white">
                          ₱{formatMoney(order.itemsTotal)}
                        </td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 max-w-[8rem] truncate" title={order.serverStaffName || undefined}>
                          {order.serverStaffName || '—'}
                        </td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 max-w-[10rem] truncate" title={order.notes || undefined}>
                          {order.notes || '—'}
                        </td>
                        <td className="p-2 text-gray-600 dark:text-gray-400">
                          {new Date(order.openedAt).toLocaleString()}
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => onLoadOrder(order)}
                            className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
