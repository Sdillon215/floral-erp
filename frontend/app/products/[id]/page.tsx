"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getProduct, deleteProduct } from "@/lib/api/products";
import { getInventoryItem } from "@/lib/api/inventory";
import { Product } from "@/types/product";
import { InventoryItem } from "@/types/inventory";
import { UserRole } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuth();
  const productId = parseInt(params.id as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, [productId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [productData, inventoryData] = await Promise.all([
        getProduct(productId),
        getInventoryItem(productId).catch(() => null), // Inventory might not exist
      ]);
      setProduct(productData);
      setInventoryItem(inventoryData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch product";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProduct(product.id);
      toast.success("Product deleted successfully");
      setDeleteDialog(false);
      router.push("/products");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <RequireRole allowedRoles={[UserRole.SALES, UserRole.BUYER]}>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !product) {
    return (
      <RequireRole allowedRoles={[UserRole.SALES, UserRole.BUYER]}>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (!product) {
    return null;
  }

  const canEdit = isAdmin || user?.role === UserRole.SALES || user?.role === UserRole.BUYER;
  const canDelete = isAdmin;

  return (
    <RequireRole allowedRoles={[UserRole.SALES, UserRole.BUYER]}>
      <MainLayout>
        <div className="p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
            </div>
            <div className="flex space-x-3">
              {canEdit && (
                <Link
                  href={`/products/${product.id}/edit`}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Edit
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteDialog(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              )}
              <Link
                href="/products"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to List
              </Link>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>
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
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Information */}
          {inventoryItem ? (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Inventory</h2>
                <Link
                  href={`/inventory/${product.id}`}
                  className="text-sm text-[#5A9367] hover:text-[#4a7a56]"
                >
                  View Full Inventory Details →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">On Hand</label>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    {inventoryItem.on_hand}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Allocated</label>
                  <p className="mt-1 text-2xl font-semibold text-[#5A9367]">
                    {inventoryItem.allocated}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Available</label>
                  <p className="mt-1 text-2xl font-semibold text-green-600">
                    {inventoryItem.available}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        inventoryItem.available === 0
                          ? "bg-red-100 text-red-800"
                          : inventoryItem.available < 10
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {inventoryItem.available === 0
                        ? "Out of Stock"
                        : inventoryItem.available < 10
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Inventory</h2>
              <p className="text-sm text-gray-500">
                No inventory record found. Inventory will be created when a purchase order is
                received.
              </p>
            </div>
          )}

          <ConfirmDialog
            isOpen={deleteDialog}
            title="Delete Product"
            message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDelete}
            onCancel={() => setDeleteDialog(false)}
            variant="danger"
          />
        </div>
      </MainLayout>
    </RequireRole>
  );
}

