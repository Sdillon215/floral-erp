import { apiClient } from "./client";
import { Customer, CustomerCreate, CustomerUpdate } from "@/types/customer";
import { PaginationParams } from "@/types/api";

// Get all customers with pagination
export const getCustomers = async (params?: PaginationParams): Promise<Customer[]> => {
  const response = await apiClient.get<Customer[]>("/api/v1/customers/", {
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    },
  });
  return response.data;
};

// Get customer by ID
export const getCustomer = async (id: number): Promise<Customer> => {
  const response = await apiClient.get<Customer>(`/api/v1/customers/${id}`);
  return response.data;
};

// Create customer
export const createCustomer = async (customerData: CustomerCreate): Promise<Customer> => {
  const response = await apiClient.post<Customer>("/api/v1/customers/", customerData);
  return response.data;
};

// Update customer
export const updateCustomer = async (
  id: number,
  customerData: CustomerUpdate
): Promise<Customer> => {
  const response = await apiClient.put<Customer>(`/api/v1/customers/${id}`, customerData);
  return response.data;
};

// Delete customer
export const deleteCustomer = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/customers/${id}`);
};

