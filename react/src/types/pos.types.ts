export enum PosOrderType {
  DineIn = 0,
  Takeaway = 1,
  RoomCharge = 2,
  PoolService = 3,
  RoomService = 4,
}

export enum PosOrderStatus {
  Open = 0,
  SentToKitchen = 1,
  Preparing = 2,
  Served = 3,
  Billed = 4,
  Closed = 5,
  Cancelled = 6,
}

export interface PosOutletListDto {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface PosTableListDto {
  id: string;
  outletId: string;
  outletName: string;
  tableNumber: string;
  capacity: number;
  status: number;
}

export interface MenuCategoryListDto {
  id: string;
  name: string;
  displayOrder: number;
}

export interface MenuItemListDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  lineTotal: number;
  status: number;
  notes: string;
}

export interface OrderPaymentDto {
  id: string;
  orderId: string;
  paymentMethodId: string;
  paymentMethodName: string;
  amount: number;
  paidAt: string;
  referenceNo: string;
}

export interface PosOrderListDto {
  id: string;
  orderNumber: string;
  outletName: string;
  tableNumber: string;
  guestName: string;
  orderType: number;
  status: number;
  itemsTotal: number;
  openedAt: string;
}

export interface GetPosOrdersInput {
  status?: number | null;
  maxResultCount?: number;
}

export interface PosOrderDto {
  id: string;
  outletId: string;
  outletName: string;
  tableId?: string;
  tableNumber: string;
  stayId?: string;
  guestName: string;
  orderNumber: string;
  orderType: number;
  status: number;
  openedAt: string;
  closedAt?: string;
  items: OrderItemDto[];
  payments: OrderPaymentDto[];
  itemsTotal: number;
  paymentsTotal: number;
  balanceDue: number;
}

export interface CreatePosOrderDto {
  outletId: string;
  tableId?: string;
  orderType: number;
  guestName?: string;
}

export interface CreatePosOrderLineDto {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CreatePosOrderWithItemsDto {
  outletId: string;
  tableId?: string;
  orderType: number;
  guestName?: string;
  items: CreatePosOrderLineDto[];
}

export interface AddOrderItemDto {
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface AddOrderItemsDto {
  orderId: string;
  items: CreatePosOrderLineDto[];
}

export interface UpdateOrderItemDto {
  orderItemId: string;
  quantity: number;
  notes?: string;
}

export interface AddOrderPaymentDto {
  orderId: string;
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
}

export interface ChargeToRoomDto {
  orderId: string;
  roomNumber: string;
}

export interface VerifyStayForRoomChargeDto {
  stayId: string;
  stayNo: string;
  guestName: string;
  roomNumber: string;
  isValid: boolean;
}
