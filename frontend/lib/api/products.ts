import { apiClient } from "./client";
import { Product, ProductCreate, ProductUpdate } from "@/types/product";
import { PaginationParams } from "@/types/api";

// Get all products with pagination
export const getProducts = async (params?: PaginationParams): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>("/api/v1/products/", {
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    },
  });
  return response.data;
};

// Get product by ID
export const getProduct = async (id: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/api/v1/products/${id}`);
  return response.data;
};

// Create product
export const createProduct = async (productData: ProductCreate): Promise<Product> => {
  const response = await apiClient.post<Product>("/api/v1/products/", productData);
  return response.data;
};

// Update product
export const updateProduct = async (
  id: number,
  productData: ProductUpdate
): Promise<Product> => {
  const response = await apiClient.put<Product>(`/api/v1/products/${id}`, productData);
  return response.data;
};

// Delete product
export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/products/${id}`);
};

