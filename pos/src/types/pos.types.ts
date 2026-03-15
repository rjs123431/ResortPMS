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

export enum OrderItemStatus {
  Pending = 0,
  SentToKitchen = 1,
  Served = 2,
  Cancelled = 3,
}

export enum OrderItemCancelReasonType {
  GuestRequest = 0,
  WrongOrder = 1,
  OutOfStock = 2,
  Duplicate = 3,
  Other = 4,
}

export enum OrderCancelReasonType {
  GuestRequest = 0,
  WrongOrder = 1,
  OutOfStock = 2,
  Duplicate = 3,
  Other = 4,
}

export interface PosOutletListDto {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  hasKitchen: boolean;
}

export interface PosTableListDto {
  id: string;
  outletId: string;
  outletName: string;
  tableNumber: string;
  capacity: number;
  status: number;
}

export interface PosTableActiveOrderDto {
  orderId: string;
  orderNumber: string;
  status: number;
  itemsCount: number;
  orderTotal: number;
  openedAt: string;
  guestName?: string | null;
}

export interface PosTableWithOrderDto {
  id: string;
  outletId: string;
  outletName: string;
  tableNumber: string;
  capacity: number;
  status: number;
  activeOrder?: PosTableActiveOrderDto | null;
}

export interface MenuCategoryListDto {
  id: string;
  name: string;
  displayOrder: number;
}

// Option groups (global, assigned to menu items)
export interface OptionDto {
  id: string;
  name: string;
  /** Base price adjustment from the option definition. */
  basePriceAdjustment?: number;
  priceAdjustment: number;
  displayOrder: number;
  /** True when this option is the (effective) default for its group. */
  isDefault?: boolean;
}

export interface OptionGroupDto {
  id: string;
  name: string;
  displayOrder: number;
  minSelections: number;
  maxSelections: number;
  options: OptionDto[];
  /** When in menu-item context: override which option is default. Null = use group default. */
  defaultOptionIdOverride?: string | null;
}

export interface OptionGroupListDto {
  id: string;
  name: string;
  displayOrder: number;
  minSelections: number;
  maxSelections: number;
  optionCount: number;
}

export interface OptionInputDto {
  name: string;
  priceAdjustment: number;
  displayOrder: number;
  isDefault: boolean;
}

export interface CreateOptionGroupDto {
  name: string;
  displayOrder: number;
  minSelections: number;
  maxSelections: number;
  options: OptionInputDto[];
}

export interface UpdateOptionGroupDto {
  name: string;
  displayOrder: number;
  minSelections: number;
  maxSelections: number;
  options: OptionInputDto[];
}

export interface MenuItemListDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  /** Base or adjusted price (no promo). */
  originalPrice: number;
  /** Best price (promo price when a promo applies, otherwise same as originalPrice). */
  price: number;
  isAvailable: boolean;
  optionGroups?: OptionGroupDto[];
}

export interface SelectedOptionDto {
  groupName: string;
  optionName: string;
}

export interface OrderItemDto {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  /** Base/adjusted price at time of order (before promo). */
  originalPrice: number;
  /** Quantity × price (line total). */
  amount: number;
  lineTotal: number;
  status: number;
  notes: string;
  selectedOptions?: SelectedOptionDto[];
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
  notes: string;
  serverStaffId?: string;
  serverStaffName: string;
}

export interface GetPosOrdersInput {
  status?: number | null;
  maxResultCount?: number;
}

/** Charge type for outlet: None, Percent, or FixedAmount. */
export enum RoomServiceChargeType {
  None = 0,
  Percent = 1,
  FixedAmount = 2,
}

/** Charge type for outlet general service charge. */
export enum ServiceChargeType {
  None = 0,
  Percent = 1,
  FixedAmount = 2,
}

export interface PosOrderDto {
  id: string;
  outletId: string;
  outletName: string;
  outletHasKitchen: boolean;
  tableId?: string;
  tableNumber: string;
  stayId?: string;
  guestName: string;
  orderNumber: string;
  orderType: number;
  status: number;
  notes: string;
  serverStaffId?: string;
  serverStaffName: string;
  discountPercent: number;
  discountAmount: number;
  seniorCitizenDiscount: number;
  openedAt: string;
  closedAt?: string;
  items: OrderItemDto[];
  payments: OrderPaymentDto[];
  itemsTotal: number;
  paymentsTotal: number;
  /** Items total after discount %, discount amount, and SC discount. */
  totalAfterDiscount: number;
  /** General service charge amount (from outlet). */
  serviceChargeAmount: number;
  /** Room service charge amount (from outlet; only when order type is Room Service). */
  roomServiceChargeAmount: number;
  /** Total after discounts + service charge + room service charge. */
  orderTotal: number;
  balanceDue: number;
}

export interface UpdateOrderDiscountsDto {
  discountPercent: number;
  discountAmount: number;
  seniorCitizenDiscount: number;
}

export interface CreatePosOrderDto {
  outletId: string;
  posTerminalId?: string;
  tableId?: string;
  orderType: number;
  guestName?: string;
  notes?: string;
  serverStaffId?: string;
}

export interface CreatePosOrderLineDto {
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  selectedOptionIds?: string[];
}

export interface CreatePosOrderWithItemsDto {
  outletId: string;
  posTerminalId?: string;
  tableId?: string;
  orderType: number;
  guestName?: string;
  notes?: string;
  serverStaffId?: string;
  items: CreatePosOrderLineDto[];
}

export interface AddOrderItemDto {
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  notes?: string;
  selectedOptionIds?: string[];
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

/** POS session lifecycle: Open → (Orders & Payments) → Shift Closing → Cash Count → Close */
export enum PosSessionStatus {
  Open = 0,
  Closed = 1,
  Suspended = 2,
}

export interface PosSessionListDto {
  id: string;
  outletId: string;
  outletName: string;
  terminalId: string;
  terminalName?: string;
  userId: string;
  userName: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash?: number;
  cashDifference?: number;
  status: number;
}

export interface OpenPosSessionInput {
  outletId: string;
  terminalId: string;
  openingCash: number;
}

export interface ClosePosSessionInput {
  sessionId?: string;
  closingCash: number;
}

// ── POS Settings (CRUD) ─────────────────────────────────────────────────────

export interface PosOutletDto {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  hasKitchen: boolean;
  chargeTypeId: string | null;
  roomServiceChargeType: number;
  roomServiceChargePercent: number;
  roomServiceChargeAmount: number;
  serviceChargeType: number;
  serviceChargePercent: number;
  serviceChargeFixedAmount: number;
}

export interface CreatePosOutletDto {
  name: string;
  location: string;
  isActive: boolean;
  hasKitchen: boolean;
  chargeTypeId: string | null;
  roomServiceChargeType: number;
  roomServiceChargePercent: number;
  roomServiceChargeAmount: number;
  serviceChargeType: number;
  serviceChargePercent: number;
  serviceChargeFixedAmount: number;
}

export interface UpdatePosOutletDto {
  name: string;
  location: string;
  isActive: boolean;
  hasKitchen: boolean;
  chargeTypeId: string | null;
  roomServiceChargeType: number;
  roomServiceChargePercent: number;
  roomServiceChargeAmount: number;
  serviceChargeType: number;
  serviceChargePercent: number;
  serviceChargeFixedAmount: number;
}

export interface CreatePosTableDto {
  outletId: string;
  tableNumber: string;
  capacity: number;
}

export interface UpdatePosTableDto {
  tableNumber: string;
  capacity: number;
}

export interface PosTerminalListDto {
  id: string;
  outletId: string;
  outletName: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreatePosTerminalDto {
  outletId: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface UpdatePosTerminalDto {
  code: string;
  name: string;
  isActive: boolean;
}

export interface CreateMenuCategoryDto {
  name: string;
  displayOrder: number;
}

export interface UpdateMenuCategoryDto {
  name: string;
  displayOrder: number;
}

export interface OptionPriceOverrideDto {
  optionId: string;
  priceAdjustment: number;
}

export interface DefaultOptionOverrideDto {
  optionGroupId: string;
  defaultOptionId: string | null;
}

export interface CreateMenuItemDto {
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  assignedOptionGroupIds?: string[];
  optionPriceOverrides?: OptionPriceOverrideDto[];
  defaultOptionOverrides?: DefaultOptionOverrideDto[];
}

export interface UpdateMenuItemDto {
  categoryId: string;
  name: string;
  price: number;
  isAvailable: boolean;
  assignedOptionGroupIds?: string[];
  optionPriceOverrides?: OptionPriceOverrideDto[];
  defaultOptionOverrides?: DefaultOptionOverrideDto[];
}

// ── Price adjustments (effective date) ─────────────────────────────────────

export interface MenuItemPriceAdjustmentListDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  categoryName: string;
  newPrice: number;
  effectiveDate: string;
}

export interface MenuItemPriceAdjustmentDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  newPrice: number;
  effectiveDate: string;
}

export interface CreateMenuItemPriceAdjustmentDto {
  menuItemId: string;
  newPrice: number;
  effectiveDate: string;
}

export interface UpdateMenuItemPriceAdjustmentDto {
  newPrice: number;
  effectiveDate: string;
}

// ── Promos ────────────────────────────────────────────────────────────────

export interface MenuItemPromoListDto {
  id: string;
  promoName: string;
  dateFrom: string;
  dateTo: string;
  percentageDiscount: number;
  menuItemCount: number;
}

export interface MenuItemPromoDto {
  id: string;
  promoName: string;
  dateFrom: string;
  dateTo: string;
  percentageDiscount: number;
  menuItemIds: string[];
}

export interface CreateMenuItemPromoDto {
  promoName: string;
  dateFrom: string;
  dateTo: string;
  percentageDiscount: number;
  menuItemIds: string[];
}

export interface UpdateMenuItemPromoDto {
  promoName: string;
  dateFrom: string;
  dateTo: string;
  percentageDiscount: number;
  menuItemIds: string[];
}
