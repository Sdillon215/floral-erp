import { apiClient } from "./client";
import { Supplier, SupplierCreate, SupplierUpdate } from "@/types/supplier";
import { PaginationParams } from "@/types/api";

// Get all suppliers with pagination
export const getSuppliers = async (params?: PaginationParams): Promise<Supplier[]> => {
  const response = await apiClient.get<Supplier[]>("/api/v1/suppliers/", {
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    },
  });
  return response.data;
};

// Get supplier by ID
export const getSupplier = async (id: number): Promise<Supplier> => {
  const response = await apiClient.get<Supplier>(`/api/v1/suppliers/${id}`);
  return response.data;
};

// Create supplier
export const createSupplier = async (supplierData: SupplierCreate): Promise<Supplier> => {
  const response = await apiClient.post<Supplier>("/api/v1/suppliers/", supplierData);
  return response.data;
};

// Update supplier
export const updateSupplier = async (
  id: number,
  supplierData: SupplierUpdate
): Promise<Supplier> => {
  const response = await apiClient.put<Supplier>(`/api/v1/suppliers/${id}`, supplierData);
  return response.data;
};

// Delete supplier
export const deleteSupplier = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/suppliers/${id}`);
};

