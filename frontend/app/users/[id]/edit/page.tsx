"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getUser, updateUser } from "@/lib/api/users";
import { User, UserRole } from "@/types/user";
import { toast } from "react-hot-toast";

const updateUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  role: z.nativeEnum(UserRole),
  is_active: z.boolean(),
  is_admin: z.boolean(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await getUser(userId);
      setUser(userData);
      reset({
        email: userData.email,
        password: "",
        role: userData.role,
        is_active: userData.is_active,
        is_admin: userData.is_admin,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch user";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateUserFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Only include password if it's provided
      const updateData: any = {
        email: data.email,
        role: data.role,
        is_active: data.is_active,
        is_admin: data.is_admin,
      };
      
      if (data.password && data.password.trim() !== "") {
        updateData.password = data.password;
      }
      
      await updateUser(userId, updateData);
      toast.success("User updated successfully");
      router.push("/users");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to update user";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <RequireRole requireAdmin>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !user) {
    return (
      <RequireRole requireAdmin>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  return (
    <RequireRole requireAdmin>
      <MainLayout>
        <div className="p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h1>

          {error && <ErrorMessage message={error} className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Password (optional) */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password (leave blank to keep current password)
                </label>
                <input
                  type="password"
                  id="password"
                  {...register("password")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter new password or leave blank"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  {...register("role")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value={UserRole.SALES}>Sales</option>
                  <option value={UserRole.BUYER}>Buyer</option>
                  <option value={UserRole.PICKER_PACKER}>Picker/Packer</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  {...register("is_active")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              {/* Admin Toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  {...register("is_admin")}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                  Admin User
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/users")}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </span>
                ) : (
                  "Update User"
                )}
              </button>
            </div>
          </form>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

