"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getPurchaseOrder, updatePurchaseOrder } from "@/lib/api/purchase_orders";
import { getProducts } from "@/lib/api/products";
import { PurchaseOrder } from "@/types/purchase_order";
import { Product } from "@/types/product";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";

const lineItemSchema = z.object({
  product_id: z.number().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unit_cost: z.number().min(0, "Unit cost must be 0 or greater").optional().nullable(),
});

const updatePurchaseOrderSchema = z.object({
  lines: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

type UpdatePurchaseOrderFormData = z.infer<typeof updatePurchaseOrderSchema>;

export default function EditPurchaseOrderPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseOrderId = parseInt(params.id as string);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<UpdatePurchaseOrderFormData>({
    resolver: zodResolver(updatePurchaseOrderSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  useEffect(() => {
    fetchData();
  }, [purchaseOrderId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [po, productsData] = await Promise.all([
        getPurchaseOrder(purchaseOrderId),
        getProducts({ skip: 0, limit: 100 }),
      ]);

      if (po.status !== "created") {
        toast.error("Only purchase orders with 'created' status can be edited");
        router.push(`/purchase-orders/${purchaseOrderId}`);
        return;
      }

      setPurchaseOrder(po);
      setProducts(productsData.filter((p) => p.is_active));

      // Reset form with existing data
      reset({
        lines: po.lines.map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
        })),
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch purchase order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdatePurchaseOrderFormData) => {
    if (!purchaseOrder) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await updatePurchaseOrder(purchaseOrderId, {
        lines: data.lines.map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost || null,
        })),
      });
      toast.success("Purchase order updated successfully");
      router.push(`/purchase-orders/${purchaseOrderId}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to update purchase order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLineItem = () => {
    append({ product_id: 0, quantity: 1, unit_cost: null });
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    } else {
      toast.error("At least one line item is required");
    }
  };

  if (isLoading) {
    return (
      <RequireRole allowedRoles={[UserRole.BUYER]}>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !purchaseOrder) {
    return (
      <RequireRole allowedRoles={[UserRole.BUYER]}>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (!purchaseOrder) {
    return null;
  }

  return (
    <RequireRole allowedRoles={[UserRole.BUYER]}>
      <MainLayout>
        <div className="p-6 max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Edit Purchase Order #{purchaseOrder.id}
          </h1>

          {error && <ErrorMessage message={error} className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              {/* Supplier (read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Supplier</label>
                <p className="mt-1 text-sm text-gray-900">Supplier ID: {purchaseOrder.supplier_id}</p>
                <p className="text-xs text-gray-500">Supplier cannot be changed</p>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Line Items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-sm text-[#5A9367] hover:text-[#4a7a56]"
                  >
                    + Add Item
                  </button>
                </div>

                {errors.lines && (
                  <p className="mb-2 text-sm text-red-600">{errors.lines.message}</p>
                )}

                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Item {index + 1}</h3>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Product */}
                        <div>
                          <label
                            htmlFor={`lines.${index}.product_id`}
                            className="block text-xs font-medium text-gray-700"
                          >
                            Product <span className="text-red-500">*</span>
                          </label>
                          <select
                            {...register(`lines.${index}.product_id`, { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-[#5A9367] focus:ring-[#5A9367] sm:text-sm"
                          >
                            <option value={0}>Select a product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </option>
                            ))}
                          </select>
                          {errors.lines?.[index]?.product_id && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.lines[index]?.product_id?.message}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label
                            htmlFor={`lines.${index}.quantity`}
                            className="block text-xs font-medium text-gray-700"
                          >
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            {...register(`lines.${index}.quantity`, { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-[#5A9367] focus:ring-[#5A9367] sm:text-sm"
                          />
                          {errors.lines?.[index]?.quantity && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.lines[index]?.quantity?.message}
                            </p>
                          )}
                        </div>

                        {/* Unit Cost */}
                        <div>
                          <label
                            htmlFor={`lines.${index}.unit_cost`}
                            className="block text-xs font-medium text-gray-700"
                          >
                            Unit Cost
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register(`lines.${index}.unit_cost`, { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-[#5A9367] focus:ring-[#5A9367] sm:text-sm"
                            placeholder="0.00"
                          />
                          {errors.lines?.[index]?.unit_cost && (
                            <p className="mt-1 text-xs text-red-600">
                              {errors.lines[index]?.unit_cost?.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push(`/purchase-orders/${purchaseOrderId}`)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A9367]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5A9367] hover:bg-[#4a7a56] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A9367] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating...
                  </span>
                ) : (
                  "Update Purchase Order"
                )}
              </button>
            </div>
          </form>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

