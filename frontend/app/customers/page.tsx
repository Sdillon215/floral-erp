"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getCustomers, deleteCustomer } from "@/lib/api/customers";
import { Customer } from "@/types/customer";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    customerId: number | null;
    customerName: string;
  }>({
    isOpen: false,
    customerId: null,
    customerName: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getCustomers({ skip: 0, limit: 100 });
      setCustomers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch customers");
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.customerId) return;

    try {
      await deleteCustomer(deleteDialog.customerId);
      toast.success("Customer deleted successfully");
      setDeleteDialog({ isOpen: false, customerId: null, customerName: "" });
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete customer");
    }
  };

  const openDeleteDialog = (customerId: number, customerName: string) => {
    setDeleteDialog({ isOpen: true, customerId, customerName });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, customerId: null, customerName: "" });
  };

  return (
    <RequireRole allowedRoles={[UserRole.SALES]}>
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <Link
              href="/customers/new"
              className="px-4 py-2 bg-[#5A9367] text-white rounded-md hover:bg-[#4a7a56] focus:outline-none focus:ring-2 focus:ring-[#5A9367]"
            >
              Create New Customer
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
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Address
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
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {customer.billing_address || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              customer.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {customer.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/customers/${customer.id}/edit`}
                            className="text-[#5A9367] hover:text-[#4a7a56] mr-4"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => openDeleteDialog(customer.id, customer.name)}
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
            title="Delete Customer"
            message={`Are you sure you want to delete customer "${deleteDialog.customerName}"? This action cannot be undone.`}
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

