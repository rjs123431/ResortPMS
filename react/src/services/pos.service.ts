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
};
