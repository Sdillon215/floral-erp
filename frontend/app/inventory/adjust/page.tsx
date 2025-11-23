"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { adjustInventory, getInventoryItem } from "@/lib/api/inventory";
import { getProducts } from "@/lib/api/products";
import { InventoryItem } from "@/types/inventory";
import { Product } from "@/types/product";
import { UserRole } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

const adjustmentSchema = z.object({
  product_id: z.number().min(1, "Product is required"),
  quantity_delta: z.number().refine((val) => val !== 0, {
    message: "Quantity change cannot be zero",
  }),
  reference: z.string().max(100, "Reference must be 100 characters or less").optional().nullable(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

export default function AdjustInventoryPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      product_id: 0,
      quantity_delta: 0,
      reference: null,
    },
  });

  const selectedProductId = watch("product_id");
  const quantityDelta = watch("quantity_delta");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId && selectedProductId > 0) {
      fetchInventoryItem(selectedProductId);
    } else {
      setSelectedInventory(null);
    }
  }, [selectedProductId]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const productsData = await getProducts({ skip: 0, limit: 100 });
      setProducts(productsData.filter((p) => p.is_active));
    } catch (err: any) {
      toast.error("Failed to load products");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchInventoryItem = async (productId: number) => {
    try {
      setIsLoadingInventory(true);
      const inventoryData = await getInventoryItem(productId);
      setSelectedInventory(inventoryData);
    } catch (err: any) {
      // Inventory might not exist yet, that's okay
      setSelectedInventory(null);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Validate that adjustment won't result in negative inventory
      if (selectedInventory) {
        const newOnHand = selectedInventory.on_hand + data.quantity_delta;
        if (newOnHand < 0) {
          setError(
            `This adjustment would result in negative inventory. Current on-hand: ${selectedInventory.on_hand}, Adjustment: ${data.quantity_delta}`
          );
          return;
        }
      } else if (data.quantity_delta < 0) {
        setError("Cannot reduce inventory for a product that has no inventory record");
        return;
      }

      await adjustInventory({
        product_id: data.product_id,
        quantity_delta: data.quantity_delta,
        reference: data.reference || null,
      });

      toast.success("Inventory adjusted successfully");
      reset();
      setSelectedInventory(null);
      router.push("/inventory");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to adjust inventory";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateNewOnHand = () => {
    if (!selectedInventory) {
      return quantityDelta > 0 ? quantityDelta : 0;
    }
    const newValue = selectedInventory.on_hand + (quantityDelta || 0);
    return Math.max(0, newValue);
  };

  const isNegativeInventory = () => {
    if (!selectedInventory) {
      return quantityDelta < 0;
    }
    return selectedInventory.on_hand + (quantityDelta || 0) < 0;
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="p-6">
          <ErrorMessage message="Access denied. Admin privileges required." />
        </div>
      </MainLayout>
    );
  }

  return (
    <RequireRole requireAdmin={true}>
      <MainLayout>
        <div className="p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Adjust Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manually adjust inventory quantities. Use positive values to increase, negative to
                decrease.
              </p>
            </div>
            <button
              onClick={() => router.push("/inventory")}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Inventory
            </button>
          </div>

          {error && <ErrorMessage message={error} className="mb-4" />}

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              {/* Product Selection */}
              <div>
                <label htmlFor="product_id" className="block text-sm font-medium text-gray-700">
                  Product <span className="text-red-500">*</span>
                </label>
                {isLoadingProducts ? (
                  <div className="mt-1">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <select
                    id="product_id"
                    {...register("product_id", { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-[#5A9367] focus:ring-[#5A9367] sm:text-sm"
                  >
                    <option value={0}>Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </option>
                    ))}
                  </select>
                )}
                {errors.product_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.product_id.message}</p>
                )}
              </div>

              {/* Current Inventory Display */}
              {selectedProductId && selectedProductId > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Inventory</h3>
                  {isLoadingInventory ? (
                    <LoadingSpinner size="sm" />
                  ) : selectedInventory ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">On Hand</label>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {selectedInventory.on_hand}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Allocated</label>
                        <p className="mt-1 text-lg font-semibold text-[#5A9367]">
                          {selectedInventory.allocated}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">Available</label>
                        <p className="mt-1 text-lg font-semibold text-green-600">
                          {selectedInventory.available}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No inventory record found. This adjustment will create a new inventory record.
                    </p>
                  )}
                </div>
              )}

              {/* Quantity Delta */}
              <div>
                <label htmlFor="quantity_delta" className="block text-sm font-medium text-gray-700">
                  Quantity Change <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Use positive numbers to increase inventory, negative to decrease (e.g., +10 or -5)
                </p>
                <input
                  type="number"
                  id="quantity_delta"
                  step="1"
                  {...register("quantity_delta", { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-[#5A9367] focus:ring-[#5A9367] sm:text-sm"
                  placeholder="0"
                />
                {errors.quantity_delta && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity_delta.message}</p>
                )}
                {isNegativeInventory() && (
                  <p className="mt-1 text-sm text-red-600">
                    Warning: This adjustment would result in negative inventory.
                  </p>
                )}
              </div>

              {/* Preview of New On-Hand */}
              {selectedProductId && selectedProductId > 0 && quantityDelta !== 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-[#4a7a56] mb-2">Preview</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#4a7a56]">Current On Hand</label>
                      <p className="mt-1 text-lg font-semibold text-[#4a7a56]">
                        {selectedInventory?.on_hand || 0}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#4a7a56]">New On Hand</label>
                      <p
                        className={`mt-1 text-lg font-semibold ${
                          isNegativeInventory() ? "text-red-600" : "text-[#4a7a56]"
                        }`}
                      >
                        {calculateNewOnHand()}
                        {isNegativeInventory() && " (Invalid)"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference/Notes */}
              <div>
                <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                  Reference/Notes (Optional)
                </label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Add a reference or note for this adjustment (e.g., "Physical count correction",
                  "Damaged goods")
                </p>
                <input
                  type="text"
                  id="reference"
                  maxLength={100}
                  {...register("reference")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-gray-900 placeholder:text-gray-400 focus:border-[#5A9367] focus:ring-[#5A9367] sm:text-sm"
                  placeholder="e.g., Physical count correction"
                />
                {errors.reference && (
                  <p className="mt-1 text-sm text-red-600">{errors.reference.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push("/inventory")}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A9367]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isNegativeInventory()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5A9367] hover:bg-[#4a7a56] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5A9367] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Adjusting...
                  </span>
                ) : (
                  "Adjust Inventory"
                )}
              </button>
            </div>
          </form>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

