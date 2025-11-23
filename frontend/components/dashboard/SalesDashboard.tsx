"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getSalesOrders } from "@/lib/api/sales_orders";
import { getInventoryItems } from "@/lib/api/inventory";
import { getProducts } from "@/lib/api/products";
import { SalesOrder } from "@/types/sales_order";
import { InventoryItem } from "@/types/inventory";
import { Product } from "@/types/product";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { format } from "date-fns";

const LOW_STOCK_THRESHOLD = 10;

export default function SalesDashboard() {
  const { user } = useAuth();
  const [recentSOs, setRecentSOs] = useState<SalesOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [pendingSOCount, setPendingSOCount] = useState(0);
  const [allocatedSOCount, setAllocatedSOCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch sales orders
      const sos = await getSalesOrders({ skip: 0, limit: 100 });
      setRecentSOs(sos.slice(0, 5)); // Show 5 most recent
      
      // Count pending and allocated sales orders
      const pending = sos.filter(so => so.status === "created");
      const allocated = sos.filter(so => so.status === "allocated");
      setPendingSOCount(pending.length);
      setAllocatedSOCount(allocated.length);

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
      case "allocated":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Dashboard</h1>
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
                href="/sales-orders/new"
                className="bg-[#5A9367] hover:bg-[#4a7a56] text-white rounded-lg p-6 shadow-sm transition-colors"
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
                    <h3 className="text-lg font-semibold">Create SO</h3>
                    <p className="text-sm text-green-100">New Sales Order</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/sales-orders"
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
                    <h3 className="text-lg font-semibold text-gray-900">View SOs</h3>
                    <p className="text-sm text-gray-500">All Sales Orders</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/customers"
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
                    <p className="text-sm text-gray-500">Manage Customers</p>
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
            {/* Recent Sales Orders */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Recent Sales Orders</h2>
                <Link
                  href="/sales-orders"
                  className="text-sm text-[#5A9367] hover:text-[#4a7a56]"
                >
                  View All
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {recentSOs.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No sales orders yet</p>
                    <Link
                      href="/sales-orders/new"
                      className="mt-2 text-sm text-[#5A9367] hover:text-[#4a7a56]"
                    >
                      Create your first SO
                    </Link>
                  </div>
                ) : (
                  recentSOs.map((so) => (
                    <Link
                      key={so.id}
                      href={`/sales-orders/${so.id}`}
                      className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">SO #{so.id}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(so.order_date)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            so.status
                          )}`}
                        >
                          {so.status}
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
                      <p className="text-sm font-medium text-gray-500">Pending SOs</p>
                      <p className="text-2xl font-semibold text-gray-900">{pendingSOCount}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white shadow rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-[#5A9367]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Ready to Ship</p>
                      <p className="text-2xl font-semibold text-gray-900">{allocatedSOCount}</p>
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
                      className="text-sm text-[#5A9367] hover:text-[#4a7a56]"
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
