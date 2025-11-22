"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

function HomeContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Welcome to Floral ERP
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            {user ? `Hello, ${user.email}` : "Please log in to continue"}
          </p>
          {user && (
            <div className="mt-8">
              <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-lg">
                <span className="text-sm font-medium">
                  Role: {user.role} {user.is_admin && "(Admin)"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
