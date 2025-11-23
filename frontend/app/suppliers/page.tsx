"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSuppliers, deleteSupplier } from "@/lib/api/suppliers";
import { Supplier } from "@/types/supplier";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    supplierId: number | null;
    supplierName: string;
  }>({
    isOpen: false,
    supplierId: null,
    supplierName: "",
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSuppliers({ skip: 0, limit: 100 });
      setSuppliers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch suppliers");
      toast.error("Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.supplierId) return;

    try {
      await deleteSupplier(deleteDialog.supplierId);
      toast.success("Supplier deleted successfully");
      setDeleteDialog({ isOpen: false, supplierId: null, supplierName: "" });
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete supplier");
    }
  };

  const openDeleteDialog = (supplierId: number, supplierName: string) => {
    setDeleteDialog({ isOpen: true, supplierId, supplierName });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, supplierId: null, supplierName: "" });
  };

  return (
    <RequireRole allowedRoles={[UserRole.BUYER]}>
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
            <Link
              href="/suppliers/new"
              className="px-4 py-2 bg-[#5A9367] text-white rounded-md hover:bg-[#4a7a56] focus:outline-none focus:ring-2 focus:ring-[#5A9367]"
            >
              Create New Supplier
            </Link>
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
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Website
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
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        No suppliers found
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {supplier.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.contact_name || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {supplier.email || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.phone || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {supplier.website ? (
                            <a
                              href={supplier.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#5A9367] hover:text-[#4a7a56]"
                            >
                              {supplier.website.length > 30
                                ? `${supplier.website.substring(0, 30)}...`
                                : supplier.website}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              supplier.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {supplier.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/suppliers/${supplier.id}/edit`}
                            className="text-[#5A9367] hover:text-[#4a7a56] mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => openDeleteDialog(supplier.id, supplier.name)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <ConfirmDialog
            isOpen={deleteDialog.isOpen}
            title="Delete Supplier"
            message={`Are you sure you want to delete supplier "${deleteDialog.supplierName}"? This action cannot be undone.`}
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDelete}
            onCancel={closeDeleteDialog}
            variant="danger"
          />
        </div>
      </MainLayout>
    </RequireRole>
  );
}

