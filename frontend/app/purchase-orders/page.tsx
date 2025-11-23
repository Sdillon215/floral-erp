"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getPurchaseOrders, deletePurchaseOrder } from "@/lib/api/purchase_orders";
import { PurchaseOrder } from "@/types/purchase_order";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    purchaseOrderId: number | null;
    purchaseOrderNumber: string;
  }>({
    isOpen: false,
    purchaseOrderId: null,
    purchaseOrderNumber: "",
  });

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPurchaseOrders({ skip: 0, limit: 100 });
      setPurchaseOrders(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch purchase orders");
      toast.error("Failed to load purchase orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.purchaseOrderId) return;

    try {
      await deletePurchaseOrder(deleteDialog.purchaseOrderId);
      toast.success("Purchase order deleted successfully");
      setDeleteDialog({ isOpen: false, purchaseOrderId: null, purchaseOrderNumber: "" });
      fetchPurchaseOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete purchase order");
    }
  };

  const openDeleteDialog = (purchaseOrderId: number, purchaseOrderNumber: string) => {
    setDeleteDialog({ isOpen: true, purchaseOrderId, purchaseOrderNumber });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, purchaseOrderId: null, purchaseOrderNumber: "" });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-yellow-100 text-yellow-800";
      case "received":
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

  const calculateTotal = (po: PurchaseOrder) => {
    return po.lines.reduce((sum, line) => {
      const lineTotal = (line.unit_cost || 0) * line.quantity;
      return sum + lineTotal;
    }, 0);
  };

  return (
    <RequireRole allowedRoles={[UserRole.BUYER]}>
      <MainLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <Link
              href="/purchase-orders/new"
              className="px-4 py-2 bg-[#5A9367] text-white rounded-md hover:bg-[#4a7a56] focus:outline-none focus:ring-2 focus:ring-[#5A9367]"
            >
              Create New Purchase Order
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
                      PO #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received Date
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
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{po.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {po.supplier_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(po.order_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(po.received_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {po.lines.length} item{po.lines.length !== 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${calculateTotal(po).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                              po.status
                            )}`}
                          >
                            {po.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/purchase-orders/${po.id}`}
                            className="text-[#5A9367] hover:text-[#4a7a56] mr-4"
                          >
                            View
                          </Link>
                          {po.status === "created" && (
                            <>
                              <Link
                                href={`/purchase-orders/${po.id}/edit`}
                                className="text-[#5A9367] hover:text-[#4a7a56] mr-4"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => openDeleteDialog(po.id, `#${po.id}`)}
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
            title="Delete Purchase Order"
            message={`Are you sure you want to delete purchase order ${deleteDialog.purchaseOrderNumber}? This action cannot be undone.`}
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

