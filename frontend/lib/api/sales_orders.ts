import { apiClient } from "./client";
import { SalesOrder, SalesOrderCreate, SalesOrderUpdate } from "@/types/sales_order";
import { PaginationParams } from "@/types/api";

// Get all sales orders with pagination
export const getSalesOrders = async (params?: PaginationParams): Promise<SalesOrder[]> => {
  const response = await apiClient.get<SalesOrder[]>("/api/v1/sales-orders/", {
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    },
  });
  return response.data;
};

// Get sales order by ID
export const getSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await apiClient.get<SalesOrder>(`/api/v1/sales-orders/${id}`);
  return response.data;
};

// Create sales order
export const createSalesOrder = async (salesOrderData: SalesOrderCreate): Promise<SalesOrder> => {
  const response = await apiClient.post<SalesOrder>("/api/v1/sales-orders/", salesOrderData);
  return response.data;
};

// Update sales order
export const updateSalesOrder = async (
  id: number,
  salesOrderData: SalesOrderUpdate
): Promise<SalesOrder> => {
  const response = await apiClient.put<SalesOrder>(`/api/v1/sales-orders/${id}`, salesOrderData);
  return response.data;
};

// Delete sales order
export const deleteSalesOrder = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/sales-orders/${id}`);
};

// Allocate sales order (sales role)
export const allocateSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await apiClient.post<SalesOrder>(`/api/v1/sales-orders/${id}/allocate`);
  return response.data;
};

// Ship sales order (picker_packer role)
export const shipSalesOrder = async (id: number): Promise<SalesOrder> => {
  const response = await apiClient.post<SalesOrder>(`/api/v1/sales-orders/${id}/ship`);
  return response.data;
};

