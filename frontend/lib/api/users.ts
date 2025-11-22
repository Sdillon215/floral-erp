import { apiClient } from "./client";
import { User, UserCreate, UserUpdate } from "@/types/user";
import { PaginationParams } from "@/types/api";

// Get all users with pagination
export const getUsers = async (params?: PaginationParams): Promise<User[]> => {
  const response = await apiClient.get<User[]>("/api/v1/users/", { 
    params: {
      skip: params?.skip || 0,
      limit: params?.limit || 100,
    }
  });
  return response.data;
};

// Get user by ID
export const getUser = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(`/api/v1/users/${id}`);
  return response.data;
};

// Create user
export const createUser = async (userData: UserCreate): Promise<User> => {
  const response = await apiClient.post<User>("/api/v1/users/", userData);
  return response.data;
};

// Update user
export const updateUser = async (id: number, userData: UserUpdate): Promise<User> => {
  const response = await apiClient.put<User>(`/api/v1/users/${id}`, userData);
  return response.data;
};

// Delete user
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/v1/users/${id}`);
};

