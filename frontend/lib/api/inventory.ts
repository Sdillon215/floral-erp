import { apiClient } from "./client";
import {
  InventoryItem,
  InventoryTransaction,
  InventoryAdjustmentCreate,
  InventoryAdjustmentOut,
} from "@/types/inventory";
import { PaginationParams } from "@/types/api";

// Get all inventory items with pagination
export const getInventoryItems = async (
  params?: PaginationParams
): Promise<InventoryItem[]> => {
  const response = await apiClient.get<InventoryItem[]>("/api/v1/inventory/", {
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    },
  });
  return response.data;
};

// Get inventory item by product ID
export const getInventoryItem = async (productId: number): Promise<InventoryItem> => {
  const response = await apiClient.get<InventoryItem>(`/api/v1/inventory/${productId}`);
  return response.data;
};

// Get inventory transactions for a product
export const getInventoryTransactions = async (
  productId: number,
  params?: PaginationParams
): Promise<InventoryTransaction[]> => {
  const response = await apiClient.get<InventoryTransaction[]>(
    `/api/v1/inventory/${productId}/transactions`,
    {
      params: {
        skip: params?.skip || 0,
        limit: params?.limit || 100,
      },
    }
  );
  return response.data;
};

// Adjust inventory (Admin only)
export const adjustInventory = async (
  adjustment: InventoryAdjustmentCreate
): Promise<InventoryAdjustmentOut> => {
  const response = await apiClient.post<InventoryAdjustmentOut>(
    "/api/v1/inventory/adjust",
    adjustment
  );
  return response.data;
};

