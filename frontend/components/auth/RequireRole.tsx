"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";

interface RequireRoleProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (!isAdmin && !allowedRoles.includes(user.role)) {
        // User doesn't have required role - redirect to home
        router.push("/");
      }
    }
  }, [user, isAdmin, allowedRoles, isLoading, router]);

  // Show nothing while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Show nothing if not authenticated or unauthorized (redirect is happening)
  if (!user || (!isAdmin && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}

