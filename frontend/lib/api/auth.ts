import { apiClient } from "./client";
import { LoginRequest, LoginResponse } from "@/types/auth";

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const formData = new URLSearchParams();
  formData.append("username", credentials.username);
  formData.append("password", credentials.password);

  const response = await apiClient.post<LoginResponse>("/api/v1/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const logout = async (): Promise<void> => {
  // For now, logout is handled client-side by clearing the token
  // If backend has a logout endpoint, we can add it here later
};

