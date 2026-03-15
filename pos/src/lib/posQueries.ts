import type { QueryClient } from '@tanstack/react-query';

/**
 * POS query keys and cache invalidation.
 *
 * Use posKeys.* for all POS queryKey so invalidation stays correct.
 * After any POS mutation, call invalidatePosQueries(queryClient, scope, context?):
 *
 * - createOrder / createOrderWithItems → orderDetailListAndTables (outletId)
 * - addOrderItems / addOrderItemsAndSendToKitchen / updateItem / cancelItem → orderDetailAndList or orderDetailListAndTables (outletId if table order)
 * - updateOrderDiscounts → orderDetail
 * - sendToKitchen → orderDetailAndList
 * - addPayment → orderDetailAndList
 * - closeOrder / cancelOrder / chargeToRoom → orderDetailListAndTables (outletId when known)
 * - openSession / closeSession → session
 
 * Use these keys everywhere so invalidatePosQueries can target the right caches.
 * Keys use the existing string prefixes (e.g. pos-outlets) so partial invalidation works.
 */
export const posKeys = {
  outlets: () => ['pos-outlets'] as const,
  tables: (outletId: string) => ['pos-tables', outletId] as const,
  tablesWithOrders: (outletId: string) => ['pos-tables-with-orders', outletId] as const,
  order: (orderId: string) => ['pos-order', orderId] as const,
  ordersList: (statusFilter?: number | '') => ['pos-orders-list', statusFilter ?? ''] as const,
  ordersRetrieve: (statuses: number[]) =>
    ['pos-orders-retrieve', [...statuses].sort((a, b) => a - b).join(',')] as const,
  menuCategories: () => ['pos-menu-categories'] as const,
  menuItems: (categoryId?: string | null) => ['pos-menu-items', categoryId ?? 'all'] as const,
  mySessions: () => ['pos-my-sessions'] as const,
  currentSession: () => ['pos-my-current-open-session'] as const,
  /** Reporting */
  salesSummary: (from: string, to: string, outletId?: string | null) =>
    ['pos-sales-summary', from, to, outletId ?? 'all'] as const,
  zReport: (date: string, outletId?: string | null) =>
    ['pos-zreport', date, outletId ?? 'all'] as const,
  /** Settings */
  settingsTables: (outletId: string) => ['pos-settings-tables', outletId] as const,
  settingsTerminals: (outletId: string) => ['pos-settings-terminals', outletId] as const,
  settingsOptionGroups: () => ['pos-settings-option-groups'] as const,
} as const;

export type PosInvalidateScope =
  | 'orderDetail'                 // single order cache
  | 'orderList'                   // orders list + retrieve
  | 'tablesWithOrders'            // table floor view (all or one outlet)
  | 'orderDetailAndList'          // order + list
  | 'orderDetailListAndTables'    // order + list + tables with orders
  | 'session'                     // my sessions / current session
  | 'all';                        // all pos-* queries

export interface PosInvalidateContext {
  orderId?: string;
  outletId?: string;
  tableId?: string;
}

/**
 * Invalidate POS-related queries after a mutation.
 * Call from every POS mutation's onSuccess with the appropriate scope and context.
 */
export function invalidatePosQueries(
  queryClient: QueryClient,
  scope: PosInvalidateScope,
  context?: PosInvalidateContext
): void {
  switch (scope) {
    case 'orderDetail':
      if (context?.orderId) {
        void queryClient.invalidateQueries({ queryKey: posKeys.order(context.orderId) });
      }
      break;
    case 'orderList':
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-list'] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      break;
    case 'tablesWithOrders':
      if (context?.outletId) {
        void queryClient.invalidateQueries({ queryKey: posKeys.tablesWithOrders(context.outletId) });
      } else {
        void queryClient.invalidateQueries({ queryKey: ['pos-tables-with-orders'] });
      }
      break;
    case 'orderDetailAndList':
      if (context?.orderId) {
        void queryClient.invalidateQueries({ queryKey: posKeys.order(context.orderId) });
      }
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-list'] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      break;
    case 'orderDetailListAndTables':
      if (context?.orderId) {
        void queryClient.invalidateQueries({ queryKey: posKeys.order(context.orderId) });
      }
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-list'] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      void queryClient.invalidateQueries({ queryKey: ['pos-tables-with-orders'] });
      break;
    case 'session':
      void queryClient.invalidateQueries({ queryKey: posKeys.mySessions() });
      void queryClient.invalidateQueries({ queryKey: posKeys.currentSession() });
      break;
    case 'all':
      void queryClient.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith('pos-') });
      break;
    default:
      break;
  }
}
