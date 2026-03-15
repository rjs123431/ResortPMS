import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { posService } from '@services/pos.service';
import { invalidatePosQueries, posKeys } from '@/lib/posQueries';
import {
  type PosTableWithOrderDto,
  PosOrderType,
  PosOrderStatus,
} from '@/types/pos.types';
import { LogoSpinner } from '@components/common/LogoSpinner';
import { formatCurrency } from '@utils/helpers';

const POS_TABLE_STATUS_LABELS: Record<number, string> = {
  0: 'Available',
  1: 'Occupied',
  2: 'Reserved',
  3: 'Cleaning',
};

const POS_ORDER_STATUS_LABELS: Record<number, string> = {
  [PosOrderStatus.Open]: 'Open',
  [PosOrderStatus.SentToKitchen]: 'Kitchen',
  [PosOrderStatus.Preparing]: 'Preparing',
  [PosOrderStatus.Served]: 'Served',
  [PosOrderStatus.Billed]: 'Billed',
  [PosOrderStatus.Closed]: 'Closed',
  [PosOrderStatus.Cancelled]: 'Cancelled',
};

export const POSTablesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [outletId, setOutletId] = useState<string>('');
  const { data: outlets = [] } = useQuery({
    queryKey: posKeys.outlets(),
    queryFn: () => posService.getPosOutlets(),
  });
  const createOrderMutation = useMutation({
    mutationFn: (input: { outletId: string; tableId: string }) =>
      posService.createPosOrder({
        outletId: input.outletId,
        tableId: input.tableId,
        orderType: PosOrderType.DineIn,
        guestName: '',
        notes: '',
      }),
    onSuccess: (orderId, variables) => {
      invalidatePosQueries(queryClient, 'orderDetailListAndTables', { outletId: variables.outletId });
      navigate(`/order/${orderId}`);
    },
  });

  useEffect(() => {
    if (!outletId && outlets.length > 0) setOutletId(outlets[0].id);
  }, [outlets, outletId]);
  const effectiveOutletId = outletId || outlets[0]?.id || '';

  const { data: tables = [], isLoading } = useQuery({
    queryKey: posKeys.tablesWithOrders(effectiveOutletId),
    queryFn: () => posService.getTablesWithOrders(effectiveOutletId),
    enabled: !!effectiveOutletId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return (
    <POSLayout sidebar={<POSSidebar />}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tables
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              View tables and their current order. Open an order or go to the order.
            </p>
          </div>
          <div className="min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Outlet
            </label>
            <select
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={effectiveOutletId}
              onChange={(e) => setOutletId(e.target.value)}
            >
              <option value="">Select outlet</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!effectiveOutletId && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Select an outlet to view tables.
          </div>
        )}

        {effectiveOutletId && isLoading && (
          <div className="flex justify-center py-12">
            <LogoSpinner sizeClassName="h-10 w-10" logoSizeClassName="h-6 w-6" />
          </div>
        )}

        {effectiveOutletId && !isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onNewOrder={() =>
                  createOrderMutation.mutate({
                    outletId: table.outletId,
                    tableId: table.id,
                  })
                }
                isCreating={
                  createOrderMutation.isPending &&
                  createOrderMutation.variables?.tableId === table.id
                }
              />
            ))}
          </div>
        )}

        {effectiveOutletId && !isLoading && tables.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
            No tables defined for this outlet. Add tables in POS Settings → Outlets.
          </div>
        )}
      </div>
    </POSLayout>
  );
};

function TableCard({
  table,
  onNewOrder,
  isCreating,
}: {
  table: PosTableWithOrderDto;
  onNewOrder: () => void;
  isCreating: boolean;
}) {
  const statusLabel = POS_TABLE_STATUS_LABELS[table.status] ?? 'Unknown';
  const isAvailable = table.status === 0;
  const hasOrder = !!table.activeOrder;
  const orderStatusLabel = table.activeOrder
    ? POS_ORDER_STATUS_LABELS[table.activeOrder.status] ?? 'Open'
    : '';

  return (
    <div
      className={`rounded-xl border-2 bg-white p-4 shadow-sm transition dark:bg-gray-800 ${
        hasOrder
          ? 'border-amber-400/60 dark:border-amber-500/50'
          : 'border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Table {table.tableNumber}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {table.capacity} seats
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            isAvailable
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {hasOrder && table.activeOrder && (
        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Order</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {table.activeOrder.orderNumber}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className="font-medium">{orderStatusLabel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Items</span>
            <span>{table.activeOrder.itemsCount}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-600 dark:text-gray-300">Total</span>
            <span>{formatCurrency(table.activeOrder.orderTotal)}</span>
          </div>
          {table.activeOrder.guestName && (
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {table.activeOrder.guestName}
            </p>
          )}
          <Link
            to={`/order/${table.activeOrder.orderId}`}
            className="mt-2 flex w-full justify-center rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            View order
          </Link>
        </div>
      )}

      {!hasOrder && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onNewOrder}
            disabled={isCreating}
            className="w-full rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-primary-500 dark:hover:bg-primary-900/20 dark:hover:text-primary-300"
          >
            {isCreating ? 'Creating…' : 'New order'}
          </button>
        </div>
      )}
    </div>
  );
}
