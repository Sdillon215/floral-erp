"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getInventoryItems } from "@/lib/api/inventory";
import { getProducts } from "@/lib/api/products";
import { InventoryItem } from "@/types/inventory";
import { Product } from "@/types/product";
import { UserRole } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

const LOW_STOCK_THRESHOLD = 10; // Highlight items with available quantity below this

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [inventoryData, productsData] = await Promise.all([
        getInventoryItems({ skip: 0, limit: 100 }),
        getProducts({ skip: 0, limit: 100 }),
      ]);

      setInventoryItems(inventoryData);

      // Create a map of products by ID
      const productMap: Record<number, Product> = {};
      productsData.forEach((product) => {
        productMap[product.id] = product;
      });
      setProducts(productMap);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch inventory");
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const isLowStock = (item: InventoryItem) => {
    return item.available < LOW_STOCK_THRESHOLD;
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.available === 0) {
      return "bg-red-100 text-red-800";
    }
    if (isLowStock(item)) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-green-100 text-green-800";
  };

  const getStockStatusText = (item: InventoryItem) => {
    if (item.available === 0) {
      return "Out of Stock";
    }
    if (isLowStock(item)) {
      return "Low Stock";
    }
    return "In Stock";
  };

  return (
    <RequireRole allowedRoles={[UserRole.BUYER, UserRole.SALES, UserRole.PICKER_PACKER]}>
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-500 mt-1">
                Track on-hand, allocated, and available quantities
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/inventory/adjust"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Adjust Inventory
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On Hand
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Allocated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No inventory items found
                      </td>
                    </tr>
                  ) : (
                    inventoryItems.map((item) => {
                      const product = products[item.product_id];
                      return (
                        <tr
                          key={item.product_id}
                          className={`hover:bg-gray-50 ${
                            isLowStock(item) ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {product ? product.name : `Product ID: ${item.product_id}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product ? product.sku : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.on_hand}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.allocated}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            {item.available}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(
                                item
                              )}`}
                            >
                              {getStockStatusText(item)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/inventory/${item.product_id}`}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              View Details
                            </Link>
                            {product && (
                              <Link
                                href={`/products/${product.id}`}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Product
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {inventoryItems.some(isLowStock) && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="shrink-0">
                  <svg
                    className="h-5 w-5 text-yellow-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Some items have low available inventory (below {LOW_STOCK_THRESHOLD} units).
                      Consider restocking these items.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>
    </RequireRole>
  );
}

