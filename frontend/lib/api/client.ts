import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { getToken } from "@/lib/utils/token";
import { ApiError } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        window.location.href = "/login";
      }
    }

    // Return error with consistent format
    return Promise.reject(error);
  }
);

