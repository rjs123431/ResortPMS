import { api } from './api.service';
import type { ApiResponse } from '@/types/resort.types';
import type {
  PosOutletListDto,
  PosTableListDto,
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
  CreateMenuItemDto,
  UpdateMenuItemDto,
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
      '/api/services/app/PosSettings/GetMenuItems',
      { params: categoryId ? { categoryId } : {} }
    );
    return response.data.result ?? [];
  },

  getSettingsMenuItem: async (id: string): Promise<MenuItemListDto> => {
    const response = await api.get<ApiResponse<MenuItemListDto>>(
      '/api/services/app/PosSettings/GetMenuItem',
      { params: { id } }
    );
    return response.data.result;
  },

  createMenuItem: async (input: CreateMenuItemDto): Promise<string> => {
    const response = await api.post<ApiResponse<string>>(
      '/api/services/app/PosSettings/CreateMenuItem',
      input
    );
    return response.data.result;
  },

  updateMenuItem: async (
    id: string,
    input: UpdateMenuItemDto
  ): Promise<void> => {
    await api.put('/api/services/app/PosSettings/UpdateMenuItem', input, {
      params: { id },
    });
  },
};
