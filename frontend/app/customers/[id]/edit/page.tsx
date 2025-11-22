"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getCustomer, updateCustomer } from "@/lib/api/customers";
import { Customer } from "@/types/customer";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";

const updateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(50, "Phone must be 50 characters or less").optional().nullable(),
  billing_address: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_active: z.boolean(),
});

type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = parseInt(params.id as string);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateCustomerFormData>({
    resolver: zodResolver(updateCustomerSchema),
  });

  useEffect(() => {
    fetchCustomer();
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const customerData = await getCustomer(customerId);
      setCustomer(customerData);
      reset({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone || "",
        billing_address: customerData.billing_address || "",
        shipping_address: customerData.shipping_address || "",
        notes: customerData.notes || "",
        is_active: customerData.is_active,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch customer";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateCustomerFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // Convert empty strings to null
      const customerData = {
        ...data,
        phone: data.phone?.trim() || null,
        billing_address: data.billing_address?.trim() || null,
        shipping_address: data.shipping_address?.trim() || null,
        notes: data.notes?.trim() || null,
      };
      await updateCustomer(customerId, customerData);
      toast.success("Customer updated successfully");
      router.push("/customers");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to update customer";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <RequireRole allowedRoles={[UserRole.SALES]}>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !customer) {
    return (
      <RequireRole allowedRoles={[UserRole.SALES]}>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowedRoles={[UserRole.SALES]}>
      <MainLayout>
        <div className="p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Customer</h1>

          {error && <ErrorMessage message={error} className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  {...register("email")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register("phone")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., +1 (555) 123-4567"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              {/* Billing Address */}
              <div>
                <label htmlFor="billing_address" className="block text-sm font-medium text-gray-700">
                  Billing Address
                </label>
                <textarea
                  id="billing_address"
                  {...register("billing_address")}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Street address, City, State, ZIP"
                />
                {errors.billing_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.billing_address.message}</p>
                )}
              </div>

              {/* Shipping Address */}
              <div>
                <label htmlFor="shipping_address" className="block text-sm font-medium text-gray-700">
                  Shipping Address
                </label>
                <textarea
                  id="shipping_address"
                  {...register("shipping_address")}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Street address, City, State, ZIP"
                />
                {errors.shipping_address && (
                  <p className="mt-1 text-sm text-red-600">{errors.shipping_address.message}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Additional notes about the customer..."
                />
                {errors.notes && (
                  <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
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
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/customers")}
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
                  "Update Customer"
                )}
              </button>
            </div>
          </form>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

