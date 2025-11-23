"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
import PickerPackerDashboard from "@/components/dashboard/PickerPackerDashboard";
import SalesDashboard from "@/components/dashboard/SalesDashboard";
import BuyerDashboard from "@/components/dashboard/BuyerDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";

function HomeContent() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xl text-gray-600">Please log in to continue</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  switch (user.role) {
    case UserRole.PICKER_PACKER:
      return <PickerPackerDashboard />;
    case UserRole.SALES:
      return <SalesDashboard />;
    case UserRole.BUYER:
      return <BuyerDashboard />;
    default:
      // Admin or fallback
      return user.is_admin ? <AdminDashboard /> : <SalesDashboard />;
  }
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <HomeContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
