import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POSLayout } from '@components/layout/POSLayout';
import { posService } from '@services/pos.service';
import { resortService } from '@services/resort.service';
import {
  PosOrderType,
  PosOrderStatus,
  type PosOutletListDto,
  type PosTableListDto,
  type MenuCategoryListDto,
  type MenuItemListDto,
  type PosOrderListDto,
  type OrderItemDto,
} from '@/types/pos.types';
import type { StayListDto } from '@/types/resort.types';
import { AddEditOrderItemDialog } from './AddEditOrderItemDialog';

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

const PENDING_STATUSES = [PosOrderStatus.Open, PosOrderStatus.SentToKitchen, PosOrderStatus.Preparing, PosOrderStatus.Served];

type LocalCartItem = { menuItemId: string; menuItemName: string; price: number; quantity: number; notes?: string };
type LocalCart = {
  outletId: string;
  outletName: string;
  tableId: string;
  tableNumber: string;
  orderType: number;
  guestName: string;
  roomNumber: string;
  items: LocalCartItem[];
};

export const POSPage = () => {
  const queryClient = useQueryClient();
  const [localCart, setLocalCart] = useState<LocalCart | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [selectedStayForCharge, setSelectedStayForCharge] = useState<StayListDto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRoomChargeModal, setShowRoomChargeModal] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [retrieveStatusFilter, setRetrieveStatusFilter] = useState<number | ''>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newOrderOutletId, setNewOrderOutletId] = useState<string>('');
  const [newOrderOrderType, setNewOrderOrderType] = useState<number>(PosOrderType.DineIn);
  const [newOrderTableId, setNewOrderTableId] = useState<string>('');
  const [newOrderGuestName, setNewOrderGuestName] = useState('');
  const [newOrderRoomNumber, setNewOrderRoomNumber] = useState('');
  const [pendingOrderItems, setPendingOrderItems] = useState<LocalCartItem[]>([]);
  const [addEditDialog, setAddEditDialog] = useState<
    | { mode: 'add'; menuItem: MenuItemListDto }
    | { mode: 'edit-cart'; cartItem: LocalCartItem; cartIndex: number }
    | { mode: 'edit-pending'; cartItem: LocalCartItem; pendingIndex: number }
    | { mode: 'edit-saved'; orderItem: OrderItemDto }
    | null
  >(null);

  const { data: outlets = [] } = useQuery({
    queryKey: ['pos-outlets'],
    queryFn: () => posService.getPosOutlets(),
  });

  const { data: newOrderTables = [] } = useQuery({
    queryKey: ['pos-tables', newOrderOutletId],
    queryFn: () => posService.getPosTables(newOrderOutletId),
    enabled: showNewOrderModal && !!newOrderOutletId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['pos-menu-categories'],
    queryFn: () => posService.getMenuCategories(),
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ['pos-menu-items'],
    queryFn: () => posService.getMenuItems(),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['resort-payment-methods-pos'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: currentOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['pos-order', currentOrderId],
    queryFn: () => posService.getPosOrder(currentOrderId!),
    enabled: !!currentOrderId,
  });

  const { data: retrieveOrders = [], isFetching: isFetchingRetrieveOrders } = useQuery({
    queryKey: ['pos-orders-retrieve', retrieveStatusFilter],
    queryFn: () =>
      posService.getPosOrders({
        status: retrieveStatusFilter === '' ? undefined : retrieveStatusFilter,
        maxResultCount: 50,
      }),
    enabled: showRetrieveModal,
  });

  const { data: inHouseStaysData, isFetching: isFetchingInHouseStays } = useQuery({
    queryKey: ['pos-in-house-stays'],
    queryFn: () => resortService.getInHouseStays('', 0, 200),
    enabled: showRoomChargeModal,
  });
  const inHouseStays = inHouseStaysData?.items ?? [];

  const sendToKitchenMutation = useMutation({
    mutationFn: (orderId: string) => posService.sendOrderToKitchen(orderId),
    onSuccess: () => {
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Order sent to kitchen.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to send.' }),
  });

  const addPaymentMutation = useMutation({
    mutationFn: (input: { orderId: string; paymentMethodId: string; amount: number }) =>
      posService.addOrderPayment({
        orderId: input.orderId,
        paymentMethodId: input.paymentMethodId,
        amount: input.amount,
      }),
    onSuccess: () => {
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentMethodId('');
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Payment added.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to add payment.' }),
  });

  const chargeToRoomMutation = useMutation({
    mutationFn: (input: { orderId: string; roomNumber: string }) =>
      posService.chargeOrderToRoom({ orderId: input.orderId, roomNumber: input.roomNumber }),
    onSuccess: () => {
      setShowRoomChargeModal(false);
      setSelectedStayForCharge(null);
      setCurrentOrderId(null);
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Charged to room.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to charge to room.' }),
  });

  const closeOrderMutation = useMutation({
    mutationFn: (orderId: string) => posService.closePosOrder(orderId),
    onSuccess: () => {
      setCurrentOrderId(null);
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Order closed.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to close order.' }),
  });

  const cancelItemMutation = useMutation({
    mutationFn: (orderItemId: string) => posService.cancelOrderItem(orderItemId),
    onSuccess: () => {
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to cancel item.' }),
  });

  const updateOrderItemMutation = useMutation({
    mutationFn: (input: { orderItemId: string; quantity: number; notes?: string }) =>
      posService.updateOrderItem({
        orderItemId: input.orderItemId,
        quantity: input.quantity,
        notes: input.notes ?? '',
      }),
    onSuccess: () => {
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to update item.' }),
  });

  const isCartMode = localCart !== null && currentOrderId === null;
  const isSavedOrderMode = currentOrderId !== null;

  const handleOpenNewOrderModal = useCallback(() => {
    setNewOrderOutletId(outlets[0]?.id ?? '');
    setNewOrderOrderType(PosOrderType.DineIn);
    setNewOrderTableId('');
    setNewOrderGuestName('');
    setNewOrderRoomNumber('');
    setShowNewOrderModal(true);
  }, [outlets]);

  const handleConfirmNewOrder = useCallback(() => {
    if (!newOrderOutletId) {
      setMessage({ type: 'error', text: 'Select an outlet.' });
      return;
    }
    const outlet = outlets.find((o: PosOutletListDto) => o.id === newOrderOutletId);
    const table = newOrderTables.find((t: PosTableListDto) => t.id === newOrderTableId);
    setCurrentOrderId(null);
    setPendingOrderItems([]);
    setLocalCart({
      outletId: newOrderOutletId,
      outletName: outlet?.name ?? '',
      tableId: newOrderTableId,
      tableNumber: table?.tableNumber ?? '',
      orderType: newOrderOrderType,
      guestName: newOrderGuestName,
      roomNumber: newOrderRoomNumber,
      items: [],
    });
    setShowNewOrderModal(false);
    setMessage(null);
  }, [newOrderOutletId, newOrderOrderType, newOrderTableId, newOrderGuestName, newOrderRoomNumber, outlets, newOrderTables]);

  const openAddItemDialog = useCallback((menuItem: MenuItemListDto) => {
    setAddEditDialog({ mode: 'add', menuItem });
  }, []);

  const addToCartFromDialog = useCallback((menuItem: MenuItemListDto, quantity: number, notes: string) => {
    setLocalCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            menuItemId: menuItem.id,
            menuItemName: menuItem.name,
            price: menuItem.price,
            quantity,
            notes: notes || undefined,
          },
        ],
      };
    });
    setAddEditDialog(null);
  }, []);

  const addToPendingOrderItems = useCallback((menuItem: MenuItemListDto, quantity: number, notes: string) => {
    setPendingOrderItems((prev) => [
      ...prev,
      {
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        price: menuItem.price,
        quantity,
        notes: notes || undefined,
      },
    ]);
    setAddEditDialog(null);
  }, []);

  const updatePendingOrderItemByIndex = useCallback((index: number, quantity: number, notes: string) => {
    setPendingOrderItems((prev) => {
      if (quantity <= 0) return prev.filter((_, i) => i !== index);
      const next = [...prev];
      next[index] = { ...next[index], quantity, notes: notes || undefined };
      return next;
    });
    setAddEditDialog(null);
  }, []);

  const removePendingOrderItem = useCallback((index: number) => {
    setPendingOrderItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addOrderItemsMutation = useMutation({
    mutationFn: (input: { orderId: string; items: LocalCartItem[] }) =>
      posService.addOrderItems({
        orderId: input.orderId,
        items: input.items.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          price: line.price,
          notes: line.notes ?? '',
        })),
      }),
    onSuccess: (_, { orderId }) => {
      setPendingOrderItems([]);
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Items saved to order.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to save items.' }),
  });

  const handleSavePendingOrderItems = useCallback(() => {
    if (!currentOrderId || pendingOrderItems.length === 0) return;
    addOrderItemsMutation.mutate({ orderId: currentOrderId, items: pendingOrderItems });
  }, [currentOrderId, pendingOrderItems, addOrderItemsMutation]);

  const updateCartItemByIndex = useCallback((index: number, quantity: number, notes: string) => {
    setLocalCart((prev) => {
      if (!prev) return prev;
      const next =
        quantity > 0
          ? prev.items.map((item, i) =>
              i === index ? { ...item, quantity, notes: notes || undefined } : item
            )
          : prev.items.filter((_, i) => i !== index);
      return { ...prev, items: next };
    });
    setAddEditDialog(null);
  }, []);

  const removeCartItemByIndex = useCallback((index: number) => {
    setLocalCart((prev) => {
      if (!prev) return prev;
      return { ...prev, items: prev.items.filter((_, i) => i !== index) };
    });
  }, []);

  const updateOrderItemFromDialog = useCallback(
    (orderItemId: string, quantity: number, notes: string) => {
      updateOrderItemMutation.mutate(
        { orderItemId, quantity, notes },
        { onSettled: () => setAddEditDialog(null) }
      );
    },
    [updateOrderItemMutation]
  );

  const handleSaveOrder = useCallback(async () => {
    if (!localCart || localCart.items.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one item before saving.' });
      return;
    }
    try {
      const orderId = await posService.createPosOrderWithItems({
        outletId: localCart.outletId,
        tableId: localCart.tableId || undefined,
        orderType: localCart.orderType,
        guestName: localCart.guestName || undefined,
        items: localCart.items.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          price: line.price,
          notes: line.notes ?? '',
        })),
      });
      setLocalCart(null);
      setCurrentOrderId(orderId);
      void queryClient.invalidateQueries({ queryKey: ['pos-order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Order saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save order.' });
    }
  }, [localCart, queryClient]);

  const handleLoadOrder = useCallback(
    (order: PosOrderListDto) => {
      setCurrentOrderId(order.id);
      setLocalCart(null);
      setPendingOrderItems([]);
      setShowRetrieveModal(false);
      void queryClient.invalidateQueries({ queryKey: ['pos-order', order.id] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: `Order #${order.orderNumber} loaded.` });
    },
    [queryClient]
  );

  const handleChargeToRoom = () => {
    if (!currentOrderId || !selectedStayForCharge?.roomNumber) return;
    chargeToRoomMutation.mutate({ orderId: currentOrderId, roomNumber: selectedStayForCharge.roomNumber });
  };

  const handleAddPayment = () => {
    const amount = Number(paymentAmount);
    if (!currentOrderId || !paymentMethodId || amount <= 0) return;
    addPaymentMutation.mutate({ orderId: currentOrderId, paymentMethodId, amount });
  };

  const canModifyOrder = currentOrder && PENDING_STATUSES.includes(currentOrder.status);
  const activeSavedItems = currentOrder?.items.filter((i) => i.status !== 3) ?? [];
  const cartItems = localCart?.items ?? [];
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const canAddItems = isCartMode || (isSavedOrderMode && canModifyOrder);

  const orderItemsListRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = orderItemsListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [cartItems.length, pendingOrderItems.length]);

  const orderInfoBlock =
    isCartMode && localCart
      ? {
          typeLabel: ORDER_TYPE_LABELS[localCart.orderType] ?? '',
          tableNumber: localCart.tableNumber || '—',
          guestOrRoom: localCart.roomNumber ? `Room ${localCart.roomNumber}` : localCart.guestName || '—',
        }
      : currentOrder
        ? {
            typeLabel: ORDER_TYPE_LABELS[currentOrder.orderType] ?? '',
            tableNumber: currentOrder.tableNumber || '—',
            guestOrRoom: currentOrder.guestName || '—',
          }
        : null;

  return (
    <POSLayout
      headerCenter={
        message ? (
          <div
            className={`rounded px-4 py-2 text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        ) : undefined
      }
      headerRight={
        <>
          <button
            type="button"
            onClick={handleOpenNewOrderModal}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            New Order
          </button>
          <button
            type="button"
            onClick={() => setShowRetrieveModal(true)}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Retrieve Order
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
          {/* Menu - 2/3 */}
          <section className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Menu</h2>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto">
              {categories.map((cat: MenuCategoryListDto) => {
                const items = menuItems.filter((m: MenuItemListDto) => m.categoryId === cat.id);
                if (items.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-300">{cat.name}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((item: MenuItemListDto) => (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!canAddItems}
                          onClick={() => openAddItemDialog(item)}
                          className="rounded border border-gray-200 bg-gray-50 p-3 text-left transition hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-indigo-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="block font-medium text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">₱{formatMoney(item.price)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right: Current Order / Cart - 1/3 */}
          <section className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isCartMode ? 'New Order (unsaved)' : currentOrder ? `Order #${currentOrder.orderNumber}` : 'No Current Order'}
              </h2>
              {currentOrder && (
                <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                  {ORDER_STATUS_LABELS[currentOrder.status] ?? 'Unknown'}
                </span>
              )}
            </div>
            {orderInfoBlock && (
              <div className="mb-3 rounded border border-gray-200 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700/50">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Type</span>
                  <span className="font-medium text-gray-900 dark:text-white">{orderInfoBlock.typeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Table</span>
                  <span className="font-medium text-gray-900 dark:text-white">{orderInfoBlock.tableNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Guest / Room</span>
                  <span className="font-medium text-gray-900 dark:text-white">{orderInfoBlock.guestOrRoom}</span>
                </div>
              </div>
            )}
            <div ref={orderItemsListRef} className="max-h-[35vh] overflow-y-auto">
              {isCartMode && cartItems.length === 0 && (
                <p className="py-4 text-center text-gray-500 dark:text-gray-400">Click a menu item to add it to the order.</p>
              )}
              {isCartMode && cartItems.length > 0 && (
                <ul className="space-y-3">
                  {cartItems.map((item, index) => (
                    <li key={`cart-${index}`} className="border-b border-gray-100 pb-3 dark:border-gray-700">
                      <div className="flex justify-between gap-2">
                        <span className="min-w-0 flex-1 font-medium text-gray-900 dark:text-white">{item.menuItemName}</span>
                        <span className="shrink-0 font-medium text-gray-900 dark:text-white">₱{formatMoney(item.price * item.quantity)}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>× {item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setAddEditDialog({ mode: 'edit-cart', cartItem: item, cartIndex: index })}
                          className="text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItemByIndex(index)}
                          className="text-red-600 hover:underline dark:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                      {item.notes && (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {isSavedOrderMode && activeSavedItems.length === 0 && pendingOrderItems.length === 0 && (
                <p className="py-4 text-center text-gray-500 dark:text-gray-400">No items yet. Click a menu item to add.</p>
              )}
              {isSavedOrderMode && (
                <>
                  <ul className="space-y-3">
                    {activeSavedItems.map((item) => (
                      <li key={item.id} className="border-b border-gray-100 pb-3 dark:border-gray-700">
                        <div className="flex justify-between gap-2">
                          <span className="min-w-0 flex-1 font-medium text-gray-900 dark:text-white">{item.menuItemName}</span>
                          <span className="shrink-0 font-medium text-gray-900 dark:text-white">₱{formatMoney(item.lineTotal)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>× {item.quantity}</span>
                          {canModifyOrder && (
                            <>
                              <button
                                type="button"
                                onClick={() => setAddEditDialog({ mode: 'edit-saved', orderItem: item })}
                                className="text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelItemMutation.mutate(item.id)}
                                className="text-red-600 hover:underline dark:text-red-400"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                        {item.notes && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {pendingOrderItems.length > 0 && (
                    <div className="mt-3 border-t border-amber-200 pt-3 dark:border-amber-800">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Unsaved
                      </p>
                      <ul className="space-y-3">
                        {pendingOrderItems.map((item, index) => (
                          <li key={`pending-${index}`} className="border-b border-gray-100 pb-3 dark:border-gray-700">
                            <div className="flex justify-between gap-2">
                              <span className="min-w-0 flex-1 font-medium text-gray-900 dark:text-white">{item.menuItemName}</span>
                              <span className="shrink-0 font-medium text-gray-900 dark:text-white">₱{formatMoney(item.price * item.quantity)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>× {item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setAddEditDialog({ mode: 'edit-pending', cartItem: item, pendingIndex: index })}
                                className="text-indigo-600 hover:underline dark:text-indigo-400"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removePendingOrderItem(index)}
                                className="text-red-600 hover:underline dark:text-red-400"
                              >
                                Remove
                              </button>
                            </div>
                            {item.notes && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={handleSavePendingOrderItems}
                        disabled={addOrderItemsMutation.isPending}
                        className="mt-2 w-full rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {addOrderItemsMutation.isPending ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {isCartMode && cartItems.length > 0 && (
              <>
                <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₱{formatMoney(cartTotal)}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSaveOrder}
                    disabled={cartItems.length === 0}
                    className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Save Order
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLocalCart(null); setMessage(null); }}
                    className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
            {currentOrder && (
              <>
                <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₱{formatMoney(currentOrder.itemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>Paid</span>
                    <span>₱{formatMoney(currentOrder.paymentsTotal)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-900 dark:text-white">
                    <span>Balance Due</span>
                    <span>₱{formatMoney(currentOrder.balanceDue)}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {canModifyOrder && currentOrder.status === PosOrderStatus.Open && activeSavedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => sendToKitchenMutation.mutate(currentOrder.id)}
                      disabled={sendToKitchenMutation.isPending}
                      className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Send to Kitchen
                    </button>
                  )}
                  {canModifyOrder && currentOrder.balanceDue > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentAmount(currentOrder.balanceDue.toString());
                          setShowPaymentModal(true);
                        }}
                        className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
                      >
                        Add Payment
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRoomChargeModal(true)}
                        className="rounded bg-slate-600 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                      >
                        Charge to Room
                      </button>
                    </>
                  )}
                  {canModifyOrder && currentOrder.balanceDue <= 0 && (
                    <button
                      type="button"
                      onClick={() => closeOrderMutation.mutate(currentOrder.id)}
                      disabled={closeOrderMutation.isPending}
                      className="rounded bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Close Order
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Payment</h3>
            <div className="mt-3 space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select</option>
                  {paymentMethods.map((pm: { id: string; name: string }) => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); setPaymentMethodId(''); }}
                className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPayment}
                disabled={!paymentMethodId || Number(paymentAmount) <= 0 || addPaymentMutation.isPending}
                className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Charge Modal - list of current stays */}
      {showRoomChargeModal && currentOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800">
            <div className="border-b border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Charge to Room</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Select a stay to charge this order to the guest folio.</p>
              <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">
                Amount to charge: ₱{formatMoney(currentOrder.itemsTotal)}
              </p>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isFetchingInHouseStays ? (
                <p className="py-6 text-center text-gray-500 dark:text-gray-400">Loading stays…</p>
              ) : inHouseStays.length === 0 ? (
                <p className="py-6 text-center text-gray-500 dark:text-gray-400">No in-house stays found.</p>
              ) : (
                <ul className="space-y-1">
                  {inHouseStays.map((stay: StayListDto) => (
                    <li key={stay.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedStayForCharge(selectedStayForCharge?.id === stay.id ? null : stay)}
                        className={`w-full rounded-lg border p-3 text-left transition ${
                          selectedStayForCharge?.id === stay.id
                            ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30'
                            : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">Room {stay.roomNumber}</span>
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({stay.stayNo})</span>
                          </div>
                          {selectedStayForCharge?.id === stay.id && (
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Selected</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{stay.guestName}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => { setShowRoomChargeModal(false); setSelectedStayForCharge(null); }}
                className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleChargeToRoom}
                disabled={!selectedStayForCharge || chargeToRoomMutation.isPending}
                className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Charge to Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Dialog */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Order</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Outlet</label>
                <select
                  value={newOrderOutletId}
                  onChange={(e) => { setNewOrderOutletId(e.target.value); setNewOrderTableId(''); }}
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select outlet</option>
                  {outlets.map((o: PosOutletListDto) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Order Type</label>
                <select
                  value={newOrderOrderType}
                  onChange={(e) => setNewOrderOrderType(Number(e.target.value))}
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              {newOrderOrderType === PosOrderType.DineIn && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Table #</label>
                  <select
                    value={newOrderTableId}
                    onChange={(e) => setNewOrderTableId(e.target.value)}
                    className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No table</option>
                    {newOrderTables.map((t: PosTableListDto) => (
                      <option key={t.id} value={t.id}>Table {t.tableNumber}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Guest name (optional)</label>
                <input
                  type="text"
                  value={newOrderGuestName}
                  onChange={(e) => setNewOrderGuestName(e.target.value)}
                  placeholder="Guest name"
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Room # (optional)</label>
                <input
                  type="text"
                  value={newOrderRoomNumber}
                  onChange={(e) => setNewOrderRoomNumber(e.target.value)}
                  placeholder="For room charge"
                  className="w-full rounded border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewOrderModal(false)}
                className="rounded border border-gray-300 px-3 py-1.5 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNewOrder}
                disabled={!newOrderOutletId}
                className="rounded bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retrieve Order Modal - list/grid with status filter */}
      {showRetrieveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Retrieve Order</h3>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={retrieveStatusFilter === '' ? '' : retrieveStatusFilter}
                  onChange={(e) => setRetrieveStatusFilter(e.target.value === '' ? '' : Number(e.target.value))}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All</option>
                  {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowRetrieveModal(false)}
                  className="rounded border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isFetchingRetrieveOrders ? (
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">Loading orders…</p>
              ) : retrieveOrders.length === 0 ? (
                <p className="py-8 text-center text-gray-500 dark:text-gray-400">No orders found.</p>
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
                        <th className="p-2 font-medium text-gray-700 dark:text-gray-300">Opened</th>
                        <th className="p-2 font-medium text-gray-700 dark:text-gray-300"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {retrieveOrders.map((order: PosOrderListDto) => (
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
                          <td className="p-2 text-gray-600 dark:text-gray-400">
                            {new Date(order.openedAt).toLocaleString()}
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => handleLoadOrder(order)}
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
          </div>
        </div>
      )}

      {/* Add / Edit Order Item Dialog */}
      {addEditDialog?.mode === 'add' && (
        <AddEditOrderItemDialog
          open={true}
          onClose={() => setAddEditDialog(null)}
          title="Add item"
          itemName={addEditDialog.menuItem.name}
          itemPrice={addEditDialog.menuItem.price}
          initialQuantity={1}
          initialNotes=""
          confirmLabel="Add"
          onConfirm={(quantity, notes) => {
            if (isCartMode) {
              addToCartFromDialog(addEditDialog.menuItem, quantity, notes);
            } else {
              addToPendingOrderItems(addEditDialog.menuItem, quantity, notes);
            }
          }}
        />
      )}
      {addEditDialog?.mode === 'edit-pending' && (
        <AddEditOrderItemDialog
          open={true}
          onClose={() => setAddEditDialog(null)}
          title="Edit item"
          itemName={addEditDialog.cartItem.menuItemName}
          itemPrice={addEditDialog.cartItem.price}
          initialQuantity={addEditDialog.cartItem.quantity}
          initialNotes={addEditDialog.cartItem.notes ?? ''}
          confirmLabel="Update"
          onConfirm={(quantity, notes) =>
            updatePendingOrderItemByIndex(addEditDialog.pendingIndex, quantity, notes)
          }
        />
      )}
      {addEditDialog?.mode === 'edit-cart' && (
        <AddEditOrderItemDialog
          open={true}
          onClose={() => setAddEditDialog(null)}
          title="Edit item"
          itemName={addEditDialog.cartItem.menuItemName}
          itemPrice={addEditDialog.cartItem.price}
          initialQuantity={addEditDialog.cartItem.quantity}
          initialNotes={addEditDialog.cartItem.notes ?? ''}
          confirmLabel="Update"
          onConfirm={(quantity, notes) =>
            updateCartItemByIndex(addEditDialog.cartIndex, quantity, notes)
          }
        />
      )}
      {addEditDialog?.mode === 'edit-saved' && (
        <AddEditOrderItemDialog
          open={true}
          onClose={() => setAddEditDialog(null)}
          title="Edit item"
          itemName={addEditDialog.orderItem.menuItemName}
          itemPrice={addEditDialog.orderItem.price}
          initialQuantity={addEditDialog.orderItem.quantity}
          initialNotes={addEditDialog.orderItem.notes ?? ''}
          confirmLabel="Update"
          onConfirm={(quantity, notes) =>
            updateOrderItemFromDialog(addEditDialog.orderItem.id, quantity, notes)
          }
          isPending={updateOrderItemMutation.isPending}
        />
      )}
    </POSLayout>
  );
};
