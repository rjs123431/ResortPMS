import { api } from './api.service';
import type { ApiResponse } from '@/types/resort.types';
import type {
  PosOutletListDto,
  PosTableListDto,
  PosTableWithOrderDto,
  MenuCategoryListDto,
  MenuItemListDto,
  PosOrderDto,
  PosOrderListDto,
  GetPosOrdersInput,
  CreatePosOrderDto,
  CreatePosOrderWithItemsDto,
  AddOrderItemDto,
  AddOrderItemsDto,
  UpdateOrderItemDto,
  AddOrderPaymentDto,
  ChargeToRoomDto,
  VerifyStayForRoomChargeDto,
  PosSessionListDto,
  OpenPosSessionInput,
  ClosePosSessionInput,
  PosOutletDto,
  CreatePosOutletDto,
  UpdatePosOutletDto,
  CreatePosTableDto,
  UpdatePosTableDto,
  PosTerminalListDto,
  CreatePosTerminalDto,
  UpdatePosTerminalDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  OptionGroupListDto,
  OptionGroupDto,
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  MenuItemPriceAdjustmentListDto,
  MenuItemPriceAdjustmentDto,
  CreateMenuItemPriceAdjustmentDto,
  UpdateMenuItemPriceAdjustmentDto,
  MenuItemPromoListDto,
  MenuItemPromoDto,
  CreateMenuItemPromoDto,
  UpdateMenuItemPromoDto,
  UpdateOrderDiscountsDto,
} from '@/types/pos.types';

export const posService = {
  getPosOutlets: async () => {
    const response = await api.get<ApiResponse<PosOutletListDto[]>>('/api/services/app/PosOrder/GetOutlets');
    return response.data.result;
  },

  getPosTables: async (outletId: string) => {
    const response = await api.get<ApiResponse<PosTableListDto[]>>('/api/services/app/PosOrder/GetTables', {
      params: { outletId },
    });
    return response.data.result;
  },

  getTablesWithOrders: async (outletId: string) => {
    const response = await api.get<ApiResponse<PosTableWithOrderDto[]>>(
      '/api/services/app/PosOrder/GetTablesWithOrders',
      { params: { outletId } }
    );
    return response.data.result;
  },

  getMenuCategories: async () => {
    const response = await api.get<ApiResponse<MenuCategoryListDto[]>>('/api/services/app/PosOrder/GetMenuCategories');
    return response.data.result;
  },

  getMenuItems: async (categoryId?: string) => {
    const response = await api.get<ApiResponse<MenuItemListDto[]>>('/api/services/app/PosOrder/GetMenuItems', {
      params: categoryId ? { categoryId } : {},
    });
    return response.data.result;
  },

  getPosOrder: async (orderId: string) => {
    const response = await api.get<ApiResponse<PosOrderDto>>('/api/services/app/PosOrder/GetOrder', {
      params: { orderId },
    });
    return response.data.result;
  },

  getPosOrderByOrderNumber: async (orderNumber: string) => {
    const response = await api.get<ApiResponse<PosOrderDto>>('/api/services/app/PosOrder/GetOrderByOrderNumber', {
      params: { orderNumber: orderNumber.trim() },
    });
    return response.data.result;
  },

  getPosOrders: async (input?: GetPosOrdersInput) => {
    const response = await api.get<ApiResponse<PosOrderListDto[]>>('/api/services/app/PosOrder/GetOrders', {
      params: input ?? {},
    });
    return response.data.result;
  },

  createPosOrder: async (input: CreatePosOrderDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/PosOrder/CreateOrder', input);
    return response.data.result;
  },

  createPosOrderWithItems: async (input: CreatePosOrderWithItemsDto) => {
    const response = await api.post<ApiResponse<string>>('/api/services/app/PosOrder/CreateOrderWithItems', input);
    return response.data.result;
  },

  addOrderItem: async (input: AddOrderItemDto) => {
    await api.post('/api/services/app/PosOrder/AddItem', input);
  },

  addOrderItems: async (input: AddOrderItemsDto) => {
    await api.post('/api/services/app/PosOrder/AddItems', input);
  },

  addOrderItemsAndSendToKitchen: async (input: AddOrderItemsDto) => {
    await api.post('/api/services/app/PosOrder/AddItemsAndSendToKitchen', input);
  },

  updateOrderItem: async (input: UpdateOrderItemDto) => {
    await api.put('/api/services/app/PosOrder/UpdateItem', input);
  },

  cancelOrderItem: async (input: { orderItemId: string; reasonType: number; reason: string }) => {
    await api.post('/api/services/app/PosOrder/CancelItem', {
      orderItemId: input.orderItemId,
      reasonType: input.reasonType,
      reason: input.reason,
    });
  },

  sendOrderToKitchen: async (orderId: string, orderItemIds?: string[]) => {
    await api.post('/api/services/app/PosOrder/SendToKitchen', {
      orderId,
      orderItemIds: orderItemIds?.length ? orderItemIds : undefined,
    });
  },

  closePosOrder: async (orderId: string) => {
    await api.post('/api/services/app/PosOrder/CloseOrder', null, { params: { orderId } });
  },

  cancelPosOrder: async (input: { orderId: string; reasonType: number; reason: string }) => {
    await api.post('/api/services/app/PosOrder/CancelOrder', {
      orderId: input.orderId,
      reasonType: input.reasonType,
      reason: input.reason,
    });
  },

  updateOrderDiscounts: async (orderId: string, input: UpdateOrderDiscountsDto) => {
    await api.put('/api/services/app/PosOrder/UpdateOrderDiscounts', input, {
      params: { orderId },
    });
  },

  addOrderPayment: async (input: AddOrderPaymentDto) => {
    await api.post('/api/services/app/PosOrder/AddPayment', input);
  },

  verifyStayByRoomNumber: async (roomNumber: string) => {
    const response = await api.get<ApiResponse<VerifyStayForRoomChargeDto>>('/api/services/app/PosOrder/VerifyStayByRoomNumber', {
      params: { roomNumber },
    });
    return response.data.result;
  },

  chargeOrderToRoom: async (input: ChargeToRoomDto) => {
    await api.post('/api/services/app/PosOrder/ChargeToRoom', input);
  },

  /** List POS sessions for the current user (open, closed, suspended). */
  getMyPosSessions: async (): Promise<PosSessionListDto[]> => {
    const response = await api.get<ApiResponse<PosSessionListDto[]>>(
      '/api/services/app/PosSession/GetMySessions'
    );
    return response.data.result ?? [];
  },

  /** Get current user's open session id, if any. */
  getMyCurrentOpenSessionId: async (): Promise<string | null> => {
    const response = await api.get<ApiResponse<string | null>>(
      '/api/services/app/PosSession/GetMyCurrentOpenSessionId'
    );
    const id = response.data.result;
    return id ?? null;
  },

  /** Open a new POS session (fails if user already has an open session). */
  openPosSession: async (input: OpenPosSessionInput): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSession/OpenSession',
      input
    );
    return response.data.result;
  },

  /** Close the current POS session (end of shift). */
  closePosSession: async (input: ClosePosSessionInput): Promise<void> => {
    await api.post('/api/services/app/PosSession/CloseSession', {
      sessionId: input.sessionId ?? null,
      closingCash: input.closingCash,
    });
  },

  // ── POS Settings (outlets, tables, menu CRUD) ─────────────────────────────

  getSettingsOutlets: async (): Promise<PosOutletListDto[]> => {
    const response = await api.get<ApiResponse<PosOutletListDto[]>>(
      '/api/services/app/PosSettings/GetOutlets'
    );
    return response.data.result ?? [];
  },

  getSettingsOutlet: async (id: string): Promise<PosOutletDto> => {
    const response = await api.get<ApiResponse<PosOutletDto>>(
      '/api/services/app/PosSettings/GetOutlet',
      { params: { id } }
    );
    return response.data.result;
  },

  createOutlet: async (input: CreatePosOutletDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSettings/CreateOutlet',
      input
    );
    return response.data.result;
  },

  updateOutlet: async (id: string, input: UpdatePosOutletDto): Promise<void> => {
    await api.put('/api/services/app/PosSettings/UpdateOutlet', input, {
      params: { id },
    });
  },

  getSettingsTerminals: async (outletId: string): Promise<PosTerminalListDto[]> => {
    const response = await api.get<ApiResponse<PosTerminalListDto[]>>(
      '/api/services/app/PosSettings/GetTerminals',
      { params: { outletId } }
    );
    return response.data.result ?? [];
  },

  createTerminal: async (input: CreatePosTerminalDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSettings/CreateTerminal',
      input
    );
    return response.data.result;
  },

  updateTerminal: async (id: string, input: UpdatePosTerminalDto): Promise<void> => {
    await api.put('/api/services/app/PosSettings/UpdateTerminal', input, {
      params: { id },
    });
  },

  getSettingsTables: async (outletId: string): Promise<PosTableListDto[]> => {
    const response = await api.get<ApiResponse<PosTableListDto[]>>(
      '/api/services/app/PosSettings/GetTables',
      { params: { outletId } }
    );
    return response.data.result ?? [];
  },

  createTable: async (input: CreatePosTableDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSettings/CreateTable',
      input
    );
    return response.data.result;
  },

  updateTable: async (id: string, input: UpdatePosTableDto): Promise<void> => {
    await api.put('/api/services/app/PosSettings/UpdateTable', input, {
      params: { id },
    });
  },

  getSettingsMenuCategories: async (): Promise<MenuCategoryListDto[]> => {
    const response = await api.get<ApiResponse<MenuCategoryListDto[]>>(
      '/api/services/app/PosSettings/GetMenuCategories'
    );
    return response.data.result ?? [];
  },

  getOptionGroups: async (): Promise<OptionGroupListDto[]> => {
    const response = await api.get<ApiResponse<OptionGroupListDto[]>>(
      '/api/services/app/PosSettings/GetOptionGroups'
    );
    return response.data.result ?? [];
  },

  getOptionGroup: async (id: string): Promise<OptionGroupDto> => {
    const response = await api.get<ApiResponse<OptionGroupDto>>(
      '/api/services/app/PosSettings/GetOptionGroup',
      { params: { id } }
    );
    return response.data.result!;
  },

  createOptionGroup: async (input: CreateOptionGroupDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSettings/CreateOptionGroup',
      input
    );
    return response.data.result!;
  },

  updateOptionGroup: async (
    id: string,
    input: UpdateOptionGroupDto
  ): Promise<void> => {
    await api.put('/api/services/app/PosSettings/UpdateOptionGroup', input, {
      params: { id },
    });
  },

  deleteOptionGroup: async (id: string): Promise<void> => {
    await api.delete('/api/services/app/PosSettings/DeleteOptionGroup', {
      params: { id },
    });
  },

  getSettingsMenuCategory: async (id: string): Promise<MenuCategoryListDto> => {
    const response = await api.get<ApiResponse<MenuCategoryListDto>>(
      '/api/services/app/PosSettings/GetMenuCategory',
      { params: { id } }
    );
    return response.data.result;
  },

  createMenuCategory: async (input: CreateMenuCategoryDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSettings/CreateMenuCategory',
      input
    );
    return response.data.result;
  },

  updateMenuCategory: async (
    id: string,
    input: UpdateMenuCategoryDto
  ): Promise<void> => {
    await api.put('/api/services/app/PosSettings/UpdateMenuCategory', input, {
      params: { id },
    });
  },

  getSettingsMenuItems: async (
    categoryId?: string | null
  ): Promise<MenuItemListDto[]> => {
    const response = await api.get<ApiResponse<MenuItemListDto[]>>(
      '/api/services/app/PosMenuItem/GetMenuItems',
      { params: categoryId ? { categoryId } : {} }
    );
    return response.data.result ?? [];
  },

  getSettingsMenuItem: async (id: string): Promise<MenuItemListDto> => {
    const response = await api.get<ApiResponse<MenuItemListDto>>(
      '/api/services/app/PosMenuItem/GetMenuItem',
      { params: { id } }
    );
    return response.data.result;
  },

  createMenuItem: async (input: CreateMenuItemDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosMenuItem/CreateMenuItem',
      input
    );
    return response.data.result;
  },

  updateMenuItem: async (
    id: string,
    input: UpdateMenuItemDto
  ): Promise<void> => {
    await api.put('/api/services/app/PosMenuItem/UpdateMenuItem', input, {
      params: { id },
    });
  },

  // ── Price adjustments & promos ───────────────────────────────────────────

  getPriceAdjustments: async (
    menuItemId?: string | null
  ): Promise<MenuItemPriceAdjustmentListDto[]> => {
    const response = await api.get<ApiResponse<MenuItemPriceAdjustmentListDto[]>>(
      '/api/services/app/PosPricing/GetPriceAdjustments',
      { params: menuItemId ? { menuItemId } : {} }
    );
    return response.data.result ?? [];
  },

  getPriceAdjustment: async (id: string): Promise<MenuItemPriceAdjustmentDto> => {
    const response = await api.get<ApiResponse<MenuItemPriceAdjustmentDto>>(
      '/api/services/app/PosPricing/GetPriceAdjustment',
      { params: { id } }
    );
    return response.data.result!;
  },

  createPriceAdjustment: async (
    input: CreateMenuItemPriceAdjustmentDto
  ): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosPricing/CreatePriceAdjustment',
      input
    );
    return response.data.result!;
  },

  updatePriceAdjustment: async (
    id: string,
    input: UpdateMenuItemPriceAdjustmentDto
  ): Promise<void> => {
    await api.put('/api/services/app/PosPricing/UpdatePriceAdjustment', input, {
      params: { id },
    });
  },

  deletePriceAdjustment: async (id: string): Promise<void> => {
    await api.delete('/api/services/app/PosPricing/DeletePriceAdjustment', {
      params: { id },
    });
  },

  getPromos: async (): Promise<MenuItemPromoListDto[]> => {
    const response = await api.get<ApiResponse<MenuItemPromoListDto[]>>(
      '/api/services/app/PosPricing/GetPromos'
    );
    return response.data.result ?? [];
  },

  getPromo: async (id: string): Promise<MenuItemPromoDto> => {
    const response = await api.get<ApiResponse<MenuItemPromoDto>>(
      '/api/services/app/PosPricing/GetPromo',
      { params: { id } }
    );
    return response.data.result!;
  },

  createPromo: async (input: CreateMenuItemPromoDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosPricing/CreatePromo',
      input
    );
    return response.data.result!;
  },

  updatePromo: async (
    id: string,
    input: UpdateMenuItemPromoDto
  ): Promise<void> => {
    await api.put('/api/services/app/PosPricing/UpdatePromo', input, {
      params: { id },
    });
  },

  deletePromo: async (id: string): Promise<void> => {
    await api.delete('/api/services/app/PosPricing/DeletePromo', {
      params: { id },
    });
  },
};
