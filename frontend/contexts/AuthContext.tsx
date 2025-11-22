"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types/user";
import { login as apiLogin } from "@/lib/api/auth";
import { LoginRequest } from "@/types/auth";
import { getToken, setToken, removeToken } from "@/lib/utils/token";
import { getUser } from "@/lib/api/users";
import { apiClient } from "@/lib/api/client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Try to fetch current user to validate token
      // For now, we'll decode basic info from token or fetch user
      // Since backend doesn't have a /me endpoint, we'll need to store user in context after login
      // For MVP, we can decode token or fetch user by ID if we store it
      setIsLoading(false);
    } catch (error) {
      // Token is invalid, clear it
      removeToken();
      setUser(null);
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await apiLogin(credentials);
      setToken(response.access_token);

      // After login, we need to get user info
      // Since we don't have a /me endpoint, we'll need to decode the token
      // For MVP, we can fetch user by decoding token payload
      // For now, we'll create a minimal user object from token
      // In a real app, you'd decode JWT or call /me endpoint
      
      // Decode token to get user ID (basic implementation)
      const tokenPayload = JSON.parse(atob(response.access_token.split(".")[1]));
      const userId = parseInt(tokenPayload.sub);
      
      // Fetch full user data
      const userData = await getUser(userId);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
    // Redirect will be handled by protected routes
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    if (user.is_admin) return true; // Admins have all roles
    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    isAdmin: user?.is_admin ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

