"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSalesOrders, deleteSalesOrder } from "@/lib/api/sales_orders";
import { SalesOrder } from "@/types/sales_order";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function SalesOrdersPage() {
  const router = useRouter();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    salesOrderId: number | null;
    salesOrderNumber: string;
  }>({
    isOpen: false,
    salesOrderId: null,
    salesOrderNumber: "",
  });

  useEffect(() => {
    fetchSalesOrders();
  }, []);

  const fetchSalesOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSalesOrders({ skip: 0, limit: 100 });
      // Sort by order_date descending (newest first), then by id descending as fallback
      const sorted = [...data].sort((a, b) => {
        const dateA = a.order_date ? new Date(a.order_date).getTime() : 0;
        const dateB = b.order_date ? new Date(b.order_date).getTime() : 0;
        if (dateB !== dateA) {
          return dateB - dateA; // Descending order (newest first)
        }
        return b.id - a.id; // Fallback to ID descending
      });
      setSalesOrders(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch sales orders");
      toast.error("Failed to load sales orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.salesOrderId) return;

    try {
      await deleteSalesOrder(deleteDialog.salesOrderId);
      toast.success("Sales order deleted successfully");
      setDeleteDialog({ isOpen: false, salesOrderId: null, salesOrderNumber: "" });
      fetchSalesOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete sales order");
    }
  };

  const openDeleteDialog = (salesOrderId: number, salesOrderNumber: string) => {
    setDeleteDialog({ isOpen: true, salesOrderId, salesOrderNumber });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, salesOrderId: null, salesOrderNumber: "" });
  };

  const getStatusBadgeColor = (status: string) => {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  const calculateTotal = (so: SalesOrder) => {
    return so.lines.reduce((sum, line) => {
      const lineTotal = line.unit_price * line.quantity;
      return sum + lineTotal;
    }, 0);
  };

  return (
    <RequireRole allowedRoles={[UserRole.SALES, UserRole.PICKER_PACKER]}>
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
            <Link
              href="/sales-orders/new"
              className="px-4 py-2 bg-[#5A9367] text-white rounded-md hover:bg-[#4a7a56] focus:outline-none focus:ring-2 focus:ring-[#5A9367]"
            >
              Create New Sales Order
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
                      SO #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shipped Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                  {salesOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No sales orders found
                      </td>
                    </tr>
                  ) : (
                    salesOrders.map((so) => (
                      <tr key={so.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{so.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {so.customer_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(so.order_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(so.shipped_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {so.lines.length} item{so.lines.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${calculateTotal(so).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                              so.status
                            )}`}
                          >
                            {so.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/sales-orders/${so.id}`}
                            className="text-[#5A9367] hover:text-[#4a7a56] mr-4"
                          >
                            View
                          </Link>
                          {so.status === "created" && (
                            <>
                              <Link
                                href={`/sales-orders/${so.id}/edit`}
                                className="text-[#5A9367] hover:text-[#4a7a56] mr-4"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => openDeleteDialog(so.id, `#${so.id}`)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </>
                          )}
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
            title="Delete Sales Order"
            message={`Are you sure you want to delete sales order ${deleteDialog.salesOrderNumber}? This action cannot be undone.`}
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

