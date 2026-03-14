import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { POSLayout } from '@components/layout/POSLayout';
import { POSSidebar } from '@components/layout/POSSidebar';
import { posService } from '@services/pos.service';
import { resortService } from '@services/resort.service';
import {
  PosOrderType,
  PosOrderStatus,
  OrderItemStatus,
  PosSessionStatus,
  type PosOutletListDto,
  type PosTableListDto,
  type MenuCategoryListDto,
  type MenuItemListDto,
  type PosOrderListDto,
  type OrderItemDto,
} from '@/types/pos.types';
import { usePOSSession } from '@contexts/POSSessionContext';
import { RemoveItemDialog } from './RemoveItemDialog';
import type { StayListDto } from '@/types/resort.types';
import { AddEditOrderItemDialog } from './AddEditOrderItemDialog';
import { AddItemWithOptionsDialog } from './AddItemWithOptionsDialog';
import { POSPaymentModal } from './POSPaymentModal';
import { POSRoomChargeModal } from './POSRoomChargeModal';
import { POSRetrieveOrderModal } from './POSRetrieveOrderModal';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

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

const PENDING_STATUSES = [PosOrderStatus.Open, PosOrderStatus.SentToKitchen, PosOrderStatus.Preparing, PosOrderStatus.Served];

type LocalCartItem = {
  menuItemId: string;
  menuItemName: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  amount?: number;
  notes?: string;
  selectedOptionIds?: string[];
  selectedOptionNames?: string[];
};
type LocalCart = {
  outletId: string;
  outletName: string;
  tableId: string;
  tableNumber: string;
  orderType: number;
  guestName: string;
  roomNumber: string;
  notes?: string;
  serverStaffId?: string;
  serverStaffName?: string;
  items: LocalCartItem[];
};

export const POSOrderPage = () => {
  const queryClient = useQueryClient();
  const { orderId: orderIdParam } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const { currentSession, setCurrentSession } = usePOSSession();
  const [localCart, setLocalCart] = useState<LocalCart | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const effectiveOrderId = orderIdParam ?? currentOrderId;
  const isNewOrderMode = orderIdParam === 'new';

  useEffect(() => {
    if (orderIdParam && orderIdParam !== 'new') setCurrentOrderId(orderIdParam);
  }, [orderIdParam]);

  const initedNewOrderRef = useRef(false);
  const [selectedStayForCharge, setSelectedStayForCharge] = useState<StayListDto | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRoomChargeModal, setShowRoomChargeModal] = useState(false);
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrieveStatusFilter, setRetrieveStatusFilter] = useState<number | ''>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newOrderOutletId, setNewOrderOutletId] = useState<string>('');
  const [newOrderOrderType, setNewOrderOrderType] = useState<number>(PosOrderType.DineIn);
  const [newOrderTableId, setNewOrderTableId] = useState<string>('');
  const [newOrderGuestName, setNewOrderGuestName] = useState('');
  const [newOrderRoomNumber, setNewOrderRoomNumber] = useState('');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderServerStaffId, setNewOrderServerStaffId] = useState('');
  const [pendingOrderItems, setPendingOrderItems] = useState<LocalCartItem[]>([]);
  const [addEditDialog, setAddEditDialog] = useState<
    | { mode: 'add'; menuItem: MenuItemListDto }
    | { mode: 'edit-cart'; cartItem: LocalCartItem; cartIndex: number }
    | { mode: 'edit-pending'; cartItem: LocalCartItem; pendingIndex: number }
    | { mode: 'edit-saved'; orderItem: OrderItemDto }
    | null
  >(null);
  const [addWithOptionsMenuItem, setAddWithOptionsMenuItem] = useState<MenuItemListDto | null>(null);
  const [removeItemDialog, setRemoveItemDialog] = useState<OrderItemDto | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('');
  const [seniorCitizenDiscount, setSeniorCitizenDiscount] = useState<string>('');

  const { data: outlets = [] } = useQuery({
    queryKey: ['pos-outlets'],
    queryFn: () => posService.getPosOutlets(),
  });

  const { data: mySessions = [] } = useQuery({
    queryKey: ['pos-my-sessions'],
    queryFn: () => posService.getMyPosSessions(),
    enabled: currentSession === null,
  });

  useEffect(() => {
    if (currentSession !== null || mySessions.length === 0) return;
    const openSession = mySessions.find((s) => s.status === PosSessionStatus.Open);
    if (openSession) setCurrentSession(openSession);
  }, [currentSession, mySessions, setCurrentSession]);

  useEffect(() => {
    if (orderIdParam !== 'new') {
      initedNewOrderRef.current = false;
      return;
    }
    if (outlets.length === 0 || initedNewOrderRef.current) return;
    initedNewOrderRef.current = true;
    const outletId =
      (currentSession && outlets.some((o: PosOutletListDto) => o.id === currentSession.outletId))
        ? currentSession.outletId
        : outlets[0]?.id ?? '';
    const outlet = outlets.find((o: PosOutletListDto) => o.id === outletId);
    setNewOrderOutletId(outletId);
    setNewOrderOrderType(PosOrderType.DineIn);
    setNewOrderTableId('');
    setNewOrderGuestName('');
    setNewOrderRoomNumber('');
    setNewOrderNotes('');
    setNewOrderServerStaffId('');
    setCurrentOrderId(null);
    setPendingOrderItems([]);
    setLocalCart({
      outletId,
      outletName: outlet?.name ?? (currentSession?.outletName ?? ''),
      tableId: '',
      tableNumber: '',
      orderType: PosOrderType.DineIn,
      guestName: '',
      roomNumber: '',
      notes: undefined,
      serverStaffId: undefined,
      serverStaffName: undefined,
      items: [],
    });
  }, [orderIdParam, outlets, currentSession]);

  const { data: newOrderTables = [] } = useQuery({
    queryKey: ['pos-tables', newOrderOutletId],
    queryFn: () => posService.getPosTables(newOrderOutletId),
    enabled: isNewOrderMode && !!newOrderOutletId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['pos-menu-categories'],
    queryFn: () => posService.getMenuCategories(),
  });

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryId === null) {
      const first = [...categories].sort((a: MenuCategoryListDto, b: MenuCategoryListDto) => a.displayOrder - b.displayOrder)[0];
      setSelectedCategoryId(first.id);
    }
  }, [categories, selectedCategoryId]);

  const { data: menuItems = [] } = useQuery({
    queryKey: ['pos-menu-items'],
    queryFn: () => posService.getMenuItems(),
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['resort-payment-methods-pos'],
    queryFn: () => resortService.getPaymentMethods(),
  });

  const { data: currentOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['pos-order', effectiveOrderId],
    queryFn: () => posService.getPosOrder(effectiveOrderId!),
    enabled: !!effectiveOrderId && effectiveOrderId !== 'new',
  });

  useEffect(() => {
    if (currentOrder) {
      setDiscountPercent(currentOrder.discountPercent != null ? String(currentOrder.discountPercent) : '');
      setDiscountAmount(currentOrder.discountAmount != null ? String(currentOrder.discountAmount) : '');
      setSeniorCitizenDiscount(currentOrder.seniorCitizenDiscount != null ? String(currentOrder.seniorCitizenDiscount) : '');
    }
  }, [currentOrder?.id, currentOrder?.discountPercent, currentOrder?.discountAmount, currentOrder?.seniorCitizenDiscount]);

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

  const { data: staffList = [] } = useQuery({
    queryKey: ['resort-staff-active'],
    queryFn: () => resortService.getStaffs(),
    enabled: isNewOrderMode,
  });

  const sendToKitchenMutation = useMutation({
    mutationFn: ({ orderId, orderItemIds }: { orderId: string; orderItemIds?: string[] }) =>
      posService.sendOrderToKitchen(orderId, orderItemIds),
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
      navigate('/pos');
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Charged to room.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to charge to room.' }),
  });

  const closeOrderMutation = useMutation({
    mutationFn: (orderId: string) => posService.closePosOrder(orderId),
    onSuccess: () => {
      setCurrentOrderId(null);
      navigate('/pos');
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Order closed.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to close order.' }),
  });

  const updateOrderDiscountsMutation = useMutation({
    mutationFn: (input: { orderId: string; discountPercent: number; discountAmount: number; seniorCitizenDiscount: number }) =>
      posService.updateOrderDiscounts(input.orderId, {
        discountPercent: input.discountPercent,
        discountAmount: input.discountAmount,
        seniorCitizenDiscount: input.seniorCitizenDiscount,
      }),
    onSuccess: () => {
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-order', effectiveOrderId] });
      setMessage({ type: 'success', text: 'Discounts updated.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to update discounts.' }),
  });

  const cancelItemMutation = useMutation({
    mutationFn: (input: { orderItemId: string; reasonType: number; reason: string }) =>
      posService.cancelOrderItem(input),
    onSuccess: () => {
      setRemoveItemDialog(null);
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

  const isCartMode = localCart !== null && (effectiveOrderId === null || effectiveOrderId === 'new');
  const isSavedOrderMode = effectiveOrderId !== null && effectiveOrderId !== 'new';

  const handleOpenNewOrder = useCallback(() => {
    navigate('/pos/order/new');
  }, [navigate]);


  const openAddItemDialog = useCallback((menuItem: MenuItemListDto) => {
    const hasOptions = (menuItem.optionGroups?.length ?? 0) > 0;
    if (hasOptions) {
      setAddWithOptionsMenuItem(menuItem);
    } else {
      setAddEditDialog({ mode: 'add', menuItem });
    }
  }, []);

  const addToCartFromDialog = useCallback(
    (
      menuItem: MenuItemListDto,
      quantity: number,
      notes: string,
      price?: number,
      selectedOptionIds?: string[],
      selectedOptionNames?: string[]
    ) => {
      const unitPrice = price ?? menuItem.price;
      const orig = menuItem.originalPrice ?? menuItem.price;
      setLocalCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: [
            ...prev.items,
            {
              menuItemId: menuItem.id,
              menuItemName: menuItem.name,
              price: unitPrice,
              originalPrice: orig,
              quantity,
              amount: unitPrice * quantity,
              notes: notes || undefined,
              selectedOptionIds,
              selectedOptionNames,
            },
          ],
        };
      });
      setAddEditDialog(null);
      setAddWithOptionsMenuItem(null);
    },
    []
  );

  const addToPendingOrderItems = useCallback(
    (
      menuItem: MenuItemListDto,
      quantity: number,
      notes: string,
      price?: number,
      selectedOptionIds?: string[],
      selectedOptionNames?: string[]
    ) => {
      const unitPrice = price ?? menuItem.price;
      const orig = menuItem.originalPrice ?? menuItem.price;
      setPendingOrderItems((prev) => [
        ...prev,
        {
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          price: unitPrice,
          originalPrice: orig,
          quantity,
          amount: unitPrice * quantity,
          notes: notes || undefined,
          selectedOptionIds,
          selectedOptionNames,
        },
      ]);
      setAddEditDialog(null);
      setAddWithOptionsMenuItem(null);
    },
    []
  );

  const updatePendingOrderItemByIndex = useCallback((index: number, quantity: number, notes: string) => {
    setPendingOrderItems((prev) => {
      if (quantity <= 0) return prev.filter((_, i) => i !== index);
      const next = [...prev];
      const it = next[index];
      next[index] = { ...it, quantity, amount: it.price * quantity, notes: notes || undefined };
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
          selectedOptionIds: line.selectedOptionIds ?? undefined,
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
    if (!effectiveOrderId || pendingOrderItems.length === 0) return;
    addOrderItemsMutation.mutate({ orderId: effectiveOrderId, items: pendingOrderItems });
  }, [effectiveOrderId, pendingOrderItems, addOrderItemsMutation]);

  const saveAndSendToKitchenMutation = useMutation({
    mutationFn: () =>
      posService.addOrderItemsAndSendToKitchen({
        orderId: effectiveOrderId!,
        items: pendingOrderItems.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          price: line.price,
          notes: line.notes ?? '',
          selectedOptionIds: line.selectedOptionIds ?? undefined,
        })),
      }),
    onSuccess: () => {
      setPendingOrderItems([]);
      void refetchOrder();
      void queryClient.invalidateQueries({ queryKey: ['pos-order', effectiveOrderId] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Items saved and sent to kitchen.' });
    },
    onError: (err: Error) => setMessage({ type: 'error', text: err.message || 'Failed to save or send to kitchen.' }),
  });

  const handleSaveAndSendToKitchen = useCallback(() => {
    if (!effectiveOrderId || pendingOrderItems.length === 0) return;
    saveAndSendToKitchenMutation.mutate();
  }, [effectiveOrderId, pendingOrderItems.length, saveAndSendToKitchenMutation]);

  const updateCartItemByIndex = useCallback((index: number, quantity: number, notes: string) => {
    setLocalCart((prev) => {
      if (!prev) return prev;
      const next =
        quantity > 0
          ? prev.items.map((item, i) =>
              i === index
                ? { ...item, quantity, amount: item.price * quantity, notes: notes || undefined }
                : item
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
        notes: localCart.notes ?? '',
        serverStaffId: localCart.serverStaffId || undefined,
        items: localCart.items.map((line) => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          price: line.price,
          notes: line.notes ?? '',
          selectedOptionIds: line.selectedOptionIds ?? undefined,
        })),
      });
      setLocalCart(null);
      setCurrentOrderId(orderId);
      navigate(`/pos/order/${orderId}`);
      void queryClient.invalidateQueries({ queryKey: ['pos-order', orderId] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: 'Order saved.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save order.' });
    }
  }, [localCart, navigate, queryClient]);

  const handleLoadOrder = useCallback(
    (order: PosOrderListDto) => {
      setLocalCart(null);
      setPendingOrderItems([]);
      setShowRetrieveModal(false);
      navigate(`/pos/order/${order.id}`);
      void queryClient.invalidateQueries({ queryKey: ['pos-order', order.id] });
      void queryClient.invalidateQueries({ queryKey: ['pos-orders-retrieve'] });
      setMessage({ type: 'success', text: `Order #${order.orderNumber} loaded.` });
    },
    [navigate, queryClient]
  );

  const handleChargeToRoom = () => {
    if (!effectiveOrderId || !selectedStayForCharge?.roomNumber) return;
    chargeToRoomMutation.mutate({ orderId: effectiveOrderId, roomNumber: selectedStayForCharge.roomNumber });
  };

  const handleAddPayment = () => {
    const amount = Number(paymentAmount);
    if (!effectiveOrderId || !paymentMethodId || amount <= 0) return;
    addPaymentMutation.mutate({ orderId: effectiveOrderId, paymentMethodId, amount });
  };

  const canModifyOrder = currentOrder && PENDING_STATUSES.includes(currentOrder.status);
  const outletHasKitchen =
    isCartMode && localCart
      ? (outlets.find((o: PosOutletListDto) => o.id === localCart.outletId)?.hasKitchen ?? false)
      : (currentOrder?.outletHasKitchen ?? false);
  const showSaveAndSendToKitchen =
    currentOrder &&
    currentOrder.status !== PosOrderStatus.Open &&
    pendingOrderItems.length > 0 &&
    canModifyOrder &&
    outletHasKitchen;
  const activeSavedItems = currentOrder?.items.filter((i) => i.status !== OrderItemStatus.Cancelled) ?? [];
  const pendingItemsForKitchen = currentOrder?.items.filter((i) => i.status === OrderItemStatus.Pending) ?? [];
  const cartItems = localCart?.items ?? [];
  const cartTotal = cartItems.reduce((sum, i) => sum + (i.amount ?? i.price * i.quantity), 0);
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
          notes: localCart.notes,
          serverStaffName: localCart.serverStaffName,
        }
      : currentOrder
        ? {
            typeLabel: ORDER_TYPE_LABELS[currentOrder.orderType] ?? '',
            tableNumber: currentOrder.tableNumber || '—',
            guestOrRoom: currentOrder.guestName || '—',
            notes: currentOrder.notes,
            serverStaffName: currentOrder.serverStaffName,
          }
        : null;

  return (
    <POSLayout
      sidebar={<POSSidebar />}
      headerCenter={
        <>
          {currentSession ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-gray-800 dark:text-gray-200">Session:</span>
              <span>
                {currentSession.outletName ?? currentSession.outletId} — {currentSession.terminalName ?? currentSession.terminalId}
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                (opened {currentSession.openedAt ? new Date(currentSession.openedAt).toLocaleString() : ''})
              </span>
            </div>
          ) : null}
          {message ? (
            <div
              className={`rounded px-4 py-2 text-sm ${
                message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          ) : null}
        </>
      }
      headerRight={
        <>
          <button
            type="button"
            onClick={handleOpenNewOrder}
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
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-[calc(100vh-6rem)] flex-1 grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] lg:items-stretch">
          {/* Menu - 2/3 */}
          <section className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <div className="mb-3 flex flex-wrap gap-2">
              {categories
                .slice()
                .sort((a: MenuCategoryListDto, b: MenuCategoryListDto) => a.displayOrder - b.displayOrder)
                .map((cat: MenuCategoryListDto) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      selectedCategoryId === cat.id
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {(() => {
                const effectiveCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;
                const items = effectiveCategoryId
                  ? menuItems.filter((m: MenuItemListDto) => m.categoryId === effectiveCategoryId)
                  : [];
                return (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {items.map((item: MenuItemListDto) => (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!canAddItems || !item.isAvailable}
                        onClick={() => openAddItemDialog(item)}
                        className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-center transition hover:bg-indigo-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-indigo-900/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="flex aspect-square w-full shrink-0 items-center justify-center bg-gray-200 dark:bg-gray-600">
                          <svg className="h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex flex-1 flex-col justify-end p-2 text-center">
                          <span className="block truncate font-medium text-gray-900 dark:text-white">{item.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {item.originalPrice != null && item.originalPrice !== item.price ? (
                              <>
                                <span className="line-through">₱{formatMoney(item.originalPrice)}</span>
                                {' '}
                                ₱{formatMoney(item.price)}
                              </>
                            ) : (
                              <>₱{formatMoney(item.price)}</>
                            )}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </section>

          {/* Right: Current Order / Cart - 1/3 */}
          <section className="flex min-h-0 flex-col rounded-lg bg-white p-4 shadow dark:bg-gray-800 lg:min-h-full">
            <div className="mb-2 flex shrink-0 flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isCartMode ? 'New Order (unsaved)' : currentOrder ? `Order #${currentOrder.orderNumber}` : 'No Current Order'}
              </h2>
              {currentOrder && (
                <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                  {ORDER_STATUS_LABELS[currentOrder.status] ?? 'Unknown'}
                </span>
              )}
              {canModifyOrder && currentOrder && pendingItemsForKitchen.length > 0 && outletHasKitchen && (
                <button
                  type="button"
                  onClick={() =>
                    sendToKitchenMutation.mutate({
                      orderId: currentOrder.id,
                      orderItemIds: pendingItemsForKitchen.map((i) => i.id),
                    })
                  }
                  disabled={sendToKitchenMutation.isPending}
                  className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Send to Kitchen ({pendingItemsForKitchen.length})
                </button>
              )}
            </div>
            {isNewOrderMode && localCart && (
              <div className="mb-3 shrink-0 space-y-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-600 dark:bg-gray-700/50">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Outlet</label>
                  <select
                    value={newOrderOutletId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const outlet = outlets.find((o: PosOutletListDto) => o.id === id);
                      setNewOrderOutletId(id);
                      setNewOrderTableId('');
                      setLocalCart((prev) =>
                        prev ? { ...prev, outletId: id, outletName: outlet?.name ?? '', tableId: '', tableNumber: '' } : null
                      );
                    }}
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {outlets.map((o: PosOutletListDto) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Order type</span>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {Object.entries(ORDER_TYPE_LABELS).map(([k, v]) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          const n = Number(k);
                          setNewOrderOrderType(n);
                          setLocalCart((prev) => (prev ? { ...prev, orderType: n } : null));
                        }}
                        className={`rounded border px-2 py-1.5 text-xs font-medium transition ${
                          newOrderOrderType === Number(k)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-300'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                {newOrderOrderType === PosOrderType.DineIn && (
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Table</span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewOrderTableId('');
                          setLocalCart((prev) => (prev ? { ...prev, tableId: '', tableNumber: '' } : null));
                        }}
                        className={`rounded border px-2 py-1 text-xs font-medium ${
                          !newOrderTableId ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700'
                        }`}
                      >
                        None
                      </button>
                      {newOrderTables.map((t: PosTableListDto) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setNewOrderTableId(t.id);
                            setLocalCart((prev) =>
                              prev ? { ...prev, tableId: t.id, tableNumber: t.tableNumber } : null
                            );
                          }}
                          className={`rounded border px-2 py-1 text-xs font-medium ${
                            newOrderTableId === t.id ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/30' : 'border-gray-200 dark:border-gray-600 dark:bg-gray-700'
                          }`}
                        >
                          {t.tableNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-xs text-gray-500 dark:text-gray-400">Guest</label>
                    <input
                      type="text"
                      value={newOrderGuestName}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewOrderGuestName(v);
                        setLocalCart((prev) => (prev ? { ...prev, guestName: v } : null));
                      }}
                      placeholder="Guest name"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-gray-500 dark:text-gray-400">Room #</label>
                    <input
                      type="text"
                      value={newOrderRoomNumber}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNewOrderRoomNumber(v);
                        setLocalCart((prev) => (prev ? { ...prev, roomNumber: v } : null));
                      }}
                      placeholder="Room"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-gray-500 dark:text-gray-400">Server</label>
                  <select
                    value={newOrderServerStaffId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const server = staffList.find((s: { id: string; fullName?: string }) => s.id === id);
                      setNewOrderServerStaffId(id);
                      setLocalCart((prev) =>
                        prev ? { ...prev, serverStaffId: id || undefined, serverStaffName: server?.fullName } : null
                      );
                    }}
                    className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">No server</option>
                    {staffList.map((s: { id: string; fullName?: string }) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName ?? s.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-gray-500 dark:text-gray-400">Notes</label>
                  <textarea
                    value={newOrderNotes}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewOrderNotes(v);
                      setLocalCart((prev) => (prev ? { ...prev, notes: v || undefined } : null));
                    }}
                    placeholder="Order notes…"
                    rows={2}
                    className="w-full resize-none rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
            {orderInfoBlock && !isNewOrderMode && (
              <div className="mb-3 shrink-0 rounded border border-gray-200 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-700/50">
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
                {orderInfoBlock.serverStaffName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Server</span>
                    <span className="font-medium text-gray-900 dark:text-white">{orderInfoBlock.serverStaffName}</span>
                  </div>
                )}
                {orderInfoBlock.notes && (
                  <div className="mt-1 border-t border-gray-200 pt-1 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400">Notes</span>
                    <p className="mt-0.5 text-gray-900 dark:text-white">{orderInfoBlock.notes}</p>
                  </div>
                )}
              </div>
            )}
            <div ref={orderItemsListRef} className="min-h-0 flex-1 overflow-y-auto">
              {isCartMode && cartItems.length === 0 && (
                <p className="py-4 text-center text-gray-500 dark:text-gray-400">Click a menu item to add it to the order.</p>
              )}
              {isCartMode && cartItems.length > 0 && (
                <ul className="space-y-3">
                  {cartItems.map((item, index) => (
                    <li key={`cart-${index}`} className="border-b border-gray-100 pb-3 dark:border-gray-700">
                      <div className="flex justify-between gap-2">
                        <span className="min-w-0 flex-1 font-medium text-gray-900 dark:text-white">{item.menuItemName}</span>
                        <span className="shrink-0 text-right font-medium text-gray-900 dark:text-white">
                          {item.originalPrice != null && item.originalPrice !== item.price ? (
                            <span className="mr-1 text-xs font-normal text-gray-500 line-through dark:text-gray-400">
                              ₱{formatMoney((item.originalPrice ?? item.price) * item.quantity)}
                            </span>
                          ) : null}
                          ₱{formatMoney(item.amount ?? item.price * item.quantity)}
                        </span>
                      </div>
                      {item.selectedOptionNames?.length ? (
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.selectedOptionNames.join(' · ')}</p>
                      ) : null}
                      <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <span>× {item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setAddEditDialog({ mode: 'edit-cart', cartItem: item, cartIndex: index })}
                          className="rounded p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCartItemByIndex(index)}
                          className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Remove"
                        >
                          <TrashIcon className="h-4 w-4" />
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
                          <span className="min-w-0 flex-1 font-medium text-gray-900 dark:text-white">
                            {item.menuItemName}
                            {item.status === OrderItemStatus.Pending && (
                              <span className="ml-1.5 inline rounded bg-amber-100 px-1.5 py-0.5 text-xs font-normal text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                Pending
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-right font-medium text-gray-900 dark:text-white">
                            {item.originalPrice != null && item.originalPrice !== item.price ? (
                              <span className="mr-1 text-xs font-normal text-gray-500 line-through dark:text-gray-400">
                                ₱{formatMoney(item.originalPrice * item.quantity)}
                              </span>
                            ) : null}
                            ₱{formatMoney(item.amount ?? item.lineTotal)}
                          </span>
                        </div>
                        {item.selectedOptions?.length ? (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {item.selectedOptions.map((s) => `${s.groupName}: ${s.optionName}`).join(' · ')}
                          </p>
                        ) : null}
                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>× {item.quantity}</span>
                          {canModifyOrder && (
                            <>
                              <button
                                type="button"
                                onClick={() => setAddEditDialog({ mode: 'edit-saved', orderItem: item })}
                                className="rounded p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                title="Edit"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRemoveItemDialog(item)}
                                className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                title="Remove"
                              >
                                <TrashIcon className="h-4 w-4" />
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
                              <span className="shrink-0 text-right font-medium text-gray-900 dark:text-white">
                                {item.originalPrice != null && item.originalPrice !== item.price ? (
                                  <span className="mr-1 text-xs font-normal text-gray-500 line-through dark:text-gray-400">
                                    ₱{formatMoney((item.originalPrice ?? item.price) * item.quantity)}
                                  </span>
                                ) : null}
                                ₱{formatMoney(item.amount ?? item.price * item.quantity)}
                              </span>
                            </div>
                            {item.selectedOptionNames?.length ? (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.selectedOptionNames.join(' · ')}</p>
                            ) : null}
                            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                              <span>× {item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => setAddEditDialog({ mode: 'edit-pending', cartItem: item, pendingIndex: index })}
                                className="rounded p-1 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
                                title="Edit"
                              >
                                <PencilSquareIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removePendingOrderItem(index)}
                                className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                                title="Remove"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                            {item.notes && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleSavePendingOrderItems}
                          disabled={addOrderItemsMutation.isPending || saveAndSendToKitchenMutation.isPending}
                          className="flex-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {addOrderItemsMutation.isPending ? 'Saving…' : 'Save'}
                        </button>
                        {showSaveAndSendToKitchen && (
                          <button
                            type="button"
                            onClick={handleSaveAndSendToKitchen}
                            disabled={addOrderItemsMutation.isPending || saveAndSendToKitchenMutation.isPending}
                            className="flex-1 rounded bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {saveAndSendToKitchenMutation.isPending ? 'Saving & sending…' : 'Save and Send to Kitchen'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {isCartMode && cartItems.length > 0 && (
              <>
                <div className="mt-3 shrink-0 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₱{formatMoney(cartTotal)}</span>
                  </div>
                </div>
                <div className="mt-3 shrink-0 flex flex-wrap gap-2">
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
                {canModifyOrder && (
                  <div className="mt-3 shrink-0 border-t border-gray-200 pt-3 dark:border-gray-700">
                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Discounts</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Discount %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={discountPercent}
                          onChange={(e) => setDiscountPercent(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">Discount ₱</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400">SC Discount ₱</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={seniorCitizenDiscount}
                          onChange={(e) => setSeniorCitizenDiscount(e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!effectiveOrderId) return;
                        updateOrderDiscountsMutation.mutate({
                          orderId: effectiveOrderId,
                          discountPercent: parseFloat(discountPercent) || 0,
                          discountAmount: parseFloat(discountAmount) || 0,
                          seniorCitizenDiscount: parseFloat(seniorCitizenDiscount) || 0,
                        });
                      }}
                      disabled={updateOrderDiscountsMutation.isPending}
                      className="mt-2 w-full rounded bg-slate-600 px-2 py-1.5 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      {updateOrderDiscountsMutation.isPending ? 'Updating…' : 'Apply Discounts'}
                    </button>
                  </div>
                )}
                <div className="mt-3 shrink-0 border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>₱{formatMoney(currentOrder.itemsTotal)}</span>
                  </div>
                  {(currentOrder.discountPercent > 0 || currentOrder.discountAmount > 0 || currentOrder.seniorCitizenDiscount > 0) && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>After discounts</span>
                      <span>₱{formatMoney(currentOrder.totalAfterDiscount ?? currentOrder.itemsTotal)}</span>
                    </div>
                  )}
                  {(currentOrder.serviceChargeAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Service charge</span>
                      <span>₱{formatMoney(currentOrder.serviceChargeAmount ?? 0)}</span>
                    </div>
                  )}
                  {(currentOrder.roomServiceChargeAmount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Room service charge</span>
                      <span>₱{formatMoney(currentOrder.roomServiceChargeAmount ?? 0)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>₱{formatMoney(currentOrder.orderTotal ?? currentOrder.totalAfterDiscount ?? currentOrder.itemsTotal)}</span>
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
                <div className="mt-4 shrink-0 flex flex-wrap gap-2">
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

      <POSPaymentModal
        open={showPaymentModal && !!currentOrder}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentAmount('');
          setPaymentMethodId('');
        }}
        paymentMethodId={paymentMethodId}
        setPaymentMethodId={setPaymentMethodId}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMethods={paymentMethods}
        onAddPayment={handleAddPayment}
        isPending={addPaymentMutation.isPending}
      />

      <POSRoomChargeModal
        open={showRoomChargeModal && !!currentOrder}
        onClose={() => {
          setShowRoomChargeModal(false);
          setSelectedStayForCharge(null);
        }}
        orderItemsTotal={currentOrder?.itemsTotal ?? 0}
        inHouseStays={inHouseStays}
        isFetchingStays={isFetchingInHouseStays}
        selectedStay={selectedStayForCharge}
        onSelectStay={setSelectedStayForCharge}
        onCharge={handleChargeToRoom}
        isPending={chargeToRoomMutation.isPending}
      />

      <POSRetrieveOrderModal
        open={showRetrieveModal}
        onClose={() => setShowRetrieveModal(false)}
        orders={retrieveOrders}
        statusFilter={retrieveStatusFilter}
        onStatusFilterChange={setRetrieveStatusFilter}
        onLoadOrder={handleLoadOrder}
        isFetching={isFetchingRetrieveOrders}
      />

      {/* Add item with options (when menu item has option groups) */}
      {addWithOptionsMenuItem && (
        <AddItemWithOptionsDialog
          open={true}
          onClose={() => setAddWithOptionsMenuItem(null)}
          menuItem={addWithOptionsMenuItem}
          onConfirm={(quantity, notes, selectedOptionIds, totalPrice) => {
            const selectedOptionNames =
              addWithOptionsMenuItem.optionGroups?.flatMap((g) => {
                const opt = g.options.find((o) => selectedOptionIds.includes(o.id));
                return opt ? [`${g.name}: ${opt.name}`] : [];
              }) ?? [];
            if (isCartMode) {
              addToCartFromDialog(addWithOptionsMenuItem, quantity, notes, totalPrice, selectedOptionIds, selectedOptionNames);
            } else {
              addToPendingOrderItems(addWithOptionsMenuItem, quantity, notes, totalPrice, selectedOptionIds, selectedOptionNames);
            }
          }}
        />
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

      <RemoveItemDialog
        open={removeItemDialog !== null}
        onClose={() => setRemoveItemDialog(null)}
        item={removeItemDialog}
        onConfirm={(reasonType, reason) => {
          if (removeItemDialog)
            cancelItemMutation.mutate({
              orderItemId: removeItemDialog.id,
              reasonType,
              reason,
            });
        }}
        isPending={cancelItemMutation.isPending}
      />
    </POSLayout>
  );
};
