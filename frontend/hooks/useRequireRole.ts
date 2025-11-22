"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";
import { UserRole } from "@/types/user";

export function useRequireRole(role: UserRole) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin && user.role !== role) {
        // User doesn't have required role
        router.push("/"); // Redirect to home/dashboard
      }
    }
  }, [user, isAdmin, role, isLoading, router]);

  return { user, isAdmin, isLoading };
}

