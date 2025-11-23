"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { getInventoryItem, getInventoryTransactions } from "@/lib/api/inventory";
import { getProduct } from "@/lib/api/products";
import { InventoryItem, InventoryTransaction } from "@/types/inventory";
import { Product } from "@/types/product";
import { UserRole } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryItemDetailsPage() {
  const params = useParams();
  const { isAdmin } = useAuth();
  const productId = parseInt(params.product_id as string);
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [itemData, productData] = await Promise.all([
        getInventoryItem(productId),
        getProduct(productId),
      ]);
      setInventoryItem(itemData);
      setProduct(productData);
      await fetchTransactions();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch inventory item";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const transactionsData = await getInventoryTransactions(productId, {
        skip: 0,
        limit: 50,
      });
      setTransactions(transactionsData);
    } catch (err: any) {
      toast.error("Failed to load transaction history");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const formatTransactionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.available === 0) {
      return "bg-red-100 text-red-800";
    }
    if (item.available < LOW_STOCK_THRESHOLD) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-green-100 text-green-800";
  };

  const getStockStatusText = (item: InventoryItem) => {
    if (item.available === 0) {
      return "Out of Stock";
    }
    if (item.available < LOW_STOCK_THRESHOLD) {
      return "Low Stock";
    }
    return "In Stock";
  };

  if (isLoading) {
    return (
      <RequireRole allowedRoles={[UserRole.BUYER, UserRole.SALES, UserRole.PICKER_PACKER]}>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !inventoryItem) {
    return (
      <RequireRole allowedRoles={[UserRole.BUYER, UserRole.SALES, UserRole.PICKER_PACKER]}>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (!inventoryItem) {
    return null;
  }

  return (
    <RequireRole allowedRoles={[UserRole.BUYER, UserRole.SALES, UserRole.PICKER_PACKER]}>
      <MainLayout>
        <div className="p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {product ? product.name : `Inventory Item #${productId}`}
              </h1>
              {product && (
                <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
              )}
            </div>
            <div className="flex space-x-3">
              {isAdmin && (
                <Link
                  href="/inventory/adjust"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Adjust Inventory
                </Link>
              )}
              <Link
                href="/inventory"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Inventory
              </Link>
            </div>
          </div>

          {/* Inventory Summary */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">On Hand</label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {inventoryItem.on_hand}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total quantity in warehouse</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Allocated</label>
                <p className="mt-1 text-2xl font-semibold text-blue-600">
                  {inventoryItem.allocated}
                </p>
                <p className="text-xs text-gray-500 mt-1">Reserved for orders</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Available</label>
                <p className="mt-1 text-2xl font-semibold text-green-600">
                  {inventoryItem.available}
                </p>
                <p className="text-xs text-gray-500 mt-1">Available for sale</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(
                      inventoryItem
                    )}`}
                  >
                    {getStockStatusText(inventoryItem)}
                  </span>
                </div>
                {inventoryItem.available < LOW_STOCK_THRESHOLD && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Below threshold ({LOW_STOCK_THRESHOLD})
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Information */}
          {product && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Name</label>
                  <p className="mt-1 text-sm text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">SKU</label>
                  <p className="mt-1 text-sm text-gray-900">{product.sku}</p>
                </div>
                {product.description && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{product.description}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit Price</label>
                  <p className="mt-1 text-sm text-gray-900">${product.unit_price.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit of Measure</label>
                  <p className="mt-1 text-sm text-gray-900">{product.unit_of_measure}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/products/${product.id}`}
                  className="text-sm text-blue-600 hover:text-blue-900"
                >
                  View Product Details →
                </Link>
              </div>
            </div>
          )}

          {/* Transaction History */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
              {isLoadingTransactions && <LoadingSpinner size="sm" />}
            </div>
            {transactions.length === 0 ? (
              <p className="text-sm text-gray-500">No transactions found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity Change
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.created_at)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatTransactionType(transaction.type)}
                        </td>
                        <td
                          className={`px-4 py-4 whitespace-nowrap text-sm font-medium text-right ${
                            transaction.quantity_delta >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.quantity_delta >= 0 ? "+" : ""}
                          {transaction.quantity_delta}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.reference || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

