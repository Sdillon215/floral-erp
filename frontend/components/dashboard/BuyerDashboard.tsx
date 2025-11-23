"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getPurchaseOrders } from "@/lib/api/purchase_orders";
import { getInventoryItems } from "@/lib/api/inventory";
import { getProducts } from "@/lib/api/products";
import { PurchaseOrder } from "@/types/purchase_order";
import { InventoryItem } from "@/types/inventory";
import { Product } from "@/types/product";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { format } from "date-fns";

const LOW_STOCK_THRESHOLD = 10;

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [recentPOs, setRecentPOs] = useState<PurchaseOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [pendingPOCount, setPendingPOCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch purchase orders
      const pos = await getPurchaseOrders({ skip: 0, limit: 10 });
      setRecentPOs(pos.slice(0, 5)); // Show 5 most recent
      
      // Count pending POs (created status)
      const pending = pos.filter(po => po.status === "created");
      setPendingPOCount(pending.length);

      // Fetch inventory for low stock check
      try {
        const inventory = await getInventoryItems({ skip: 0, limit: 100 });
        const lowStock = inventory.filter(
          item => item.available > 0 && item.available < LOW_STOCK_THRESHOLD
        );
        setLowStockItems(lowStock.slice(0, 5)); // Show top 5 low stock items

        // Fetch products for low stock items
        if (lowStock.length > 0) {
          const allProducts = await getProducts({ skip: 0, limit: 100 });
          const productMap: Record<number, Product> = {};
          allProducts.forEach(product => {
            productMap[product.id] = product;
          });
          setProducts(productMap);
        }
      } catch (err) {
        // Inventory fetch might fail, but that's okay
        console.error("Failed to fetch inventory:", err);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-yellow-100 text-yellow-800";
      case "received":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome, {user?.email}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/purchase-orders/new"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 shadow-sm transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold">Create PO</h3>
                    <p className="text-sm text-blue-100">New Purchase Order</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/purchase-orders"
                className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-6 shadow-sm transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">View POs</h3>
                    <p className="text-sm text-gray-500">All Purchase Orders</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/suppliers"
                className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-6 shadow-sm transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
                    <p className="text-sm text-gray-500">Manage Suppliers</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/inventory"
                className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-6 shadow-sm transition-colors"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Inventory</h3>
                    <p className="text-sm text-gray-500">View Stock Levels</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Purchase Orders */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recent Purchase Orders</h2>
                <Link
                  href="/purchase-orders"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {recentPOs.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No purchase orders yet</p>
                    <Link
                      href="/purchase-orders/new"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Create your first PO
                    </Link>
                  </div>
                ) : (
                  recentPOs.map((po) => (
                    <Link
                      key={po.id}
                      href={`/purchase-orders/${po.id}`}
                      className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">PO #{po.id}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(po.order_date)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            po.status
                          )}`}
                        >
                          {po.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Stats & Alerts */}
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-yellow-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Pending POs</p>
                      <p className="text-2xl font-semibold text-gray-900">{pendingPOCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                      <p className="text-2xl font-semibold text-gray-900">{lowStockItems.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Low Stock Alert */}
              {lowStockItems.length > 0 && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Low Stock Alert</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {lowStockItems.map((item) => {
                      const product = products[item.product_id];
                      return (
                        <Link
                          key={item.product_id}
                          href={`/inventory/${item.product_id}`}
                          className="block px-6 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {product ? product.name : `Product #${item.product_id}`}
                              </p>
                              {product && (
                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Available: {item.available} units
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Low Stock
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <Link
                      href="/inventory"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View all inventory →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
