"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { createProduct } from "@/lib/api/products";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";

const createProductSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(64, "SKU must be 64 characters or less"),
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional().nullable(),
  unit_price: z.number().min(0, "Unit price must be 0 or greater"),
  unit_of_measure: z.string().max(50, "Unit of measure must be 50 characters or less").optional(),
});

type CreateProductFormData = z.infer<typeof createProductSchema>;

export default function CreateProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      unit_of_measure: "each",
      unit_price: 0.0,
    },
  });

  const onSubmit = async (data: CreateProductFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      // Convert empty description to null
      const productData = {
        ...data,
        description: data.description?.trim() || null,
      };
      await createProduct(productData);
      toast.success("Product created successfully");
      router.push("/products");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to create product";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RequireRole allowedRoles={[UserRole.SALES, UserRole.BUYER]}>
      <MainLayout>
        <div className="p-6 max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Product</h1>

          {error && <ErrorMessage message={error} className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-4">
              {/* SKU */}
              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  {...register("sku")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., ROSE-001"
                />
                {errors.sku && (
                  <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Product description..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Unit Price */}
              <div>
                <label htmlFor="unit_price" className="block text-sm font-medium text-gray-700">
                  Unit Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="unit_price"
                  step="0.01"
                  min="0"
                  {...register("unit_price", { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                {errors.unit_price && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit_price.message}</p>
                )}
              </div>

              {/* Unit of Measure */}
              <div>
                <label htmlFor="unit_of_measure" className="block text-sm font-medium text-gray-700">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  id="unit_of_measure"
                  {...register("unit_of_measure")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., each, bunch, box"
                />
                {errors.unit_of_measure && (
                  <p className="mt-1 text-sm text-red-600">{errors.unit_of_measure.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/products")}
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
                    Creating...
                  </span>
                ) : (
                  "Create Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

