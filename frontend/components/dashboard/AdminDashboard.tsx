"use client";

import { useAuth } from "@/hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Admin Dashboard
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Welcome, {user?.email}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Full system access and management
          </p>
        </div>
      </div>
    </div>
  );
}

