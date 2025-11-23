import { apiClient } from "./client";
import { PurchaseOrder, PurchaseOrderCreate, PurchaseOrderUpdate } from "@/types/purchase_order";
import { PaginationParams } from "@/types/api";

// Get all purchase orders with pagination
export const getPurchaseOrders = async (params?: PaginationParams): Promise<PurchaseOrder[]> => {
  const response = await apiClient.get<PurchaseOrder[]>("/api/v1/purchase-orders/", {
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    },
  });
  return response.data;
};

// Get purchase order by ID
export const getPurchaseOrder = async (id: number): Promise<PurchaseOrder> => {
  const response = await apiClient.get<PurchaseOrder>(`/api/v1/purchase-orders/${id}`);
  return response.data;
};

// Create purchase order
export const createPurchaseOrder = async (
  purchaseOrderData: PurchaseOrderCreate
): Promise<PurchaseOrder> => {
  const response = await apiClient.post<PurchaseOrder>("/api/v1/purchase-orders/", purchaseOrderData);
  return response.data;
};

// Update purchase order
export const updatePurchaseOrder = async (
  id: number,
  purchaseOrderData: PurchaseOrderUpdate
): Promise<PurchaseOrder> => {
  const response = await apiClient.put<PurchaseOrder>(
    `/api/v1/purchase-orders/${id}`,
    purchaseOrderData
  );
  return response.data;
};

// Delete purchase order
export const deletePurchaseOrder = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/purchase-orders/${id}`);
};

// Mark purchase order as received
export const markPurchaseOrderAsReceived = async (id: number): Promise<PurchaseOrder> => {
  return updatePurchaseOrder(id, { status: "received" });
};

