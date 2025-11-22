"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAdmin?: boolean;
}

export function RequireRole({ children, allowedRoles = [], requireAdmin = false }: RequireRoleProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (requireAdmin && !isAdmin) {
        // Require admin but user is not admin - redirect to home
        router.push("/");
      } else if (!requireAdmin && !isAdmin && !allowedRoles.includes(user.role)) {
        // User doesn't have required role - redirect to home
        router.push("/");
      }
    }
  }, [user, isAdmin, allowedRoles, requireAdmin, isLoading, router]);

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show nothing if not authenticated or unauthorized (redirect is happening)
  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (!requireAdmin && !isAdmin && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

