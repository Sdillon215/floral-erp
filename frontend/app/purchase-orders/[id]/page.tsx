"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getPurchaseOrder, markPurchaseOrderAsReceived } from "@/lib/api/purchase_orders";
import { getSupplier } from "@/lib/api/suppliers";
import { getProduct } from "@/lib/api/products";
import { PurchaseOrder } from "@/types/purchase_order";
import { Supplier } from "@/types/supplier";
import { Product } from "@/types/product";
import { UserRole } from "@/types/user";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function PurchaseOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const purchaseOrderId = parseInt(params.id as string);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingReceived, setIsMarkingReceived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiveDialog, setReceiveDialog] = useState(false);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [purchaseOrderId]);

  const fetchPurchaseOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const po = await getPurchaseOrder(purchaseOrderId);
      setPurchaseOrder(po);

      // Fetch supplier
      const supplierData = await getSupplier(po.supplier_id);
      setSupplier(supplierData);

      // Fetch all products
      const productPromises = po.lines.map((line) => getProduct(line.product_id));
      const productData = await Promise.all(productPromises);
      const productMap: Record<number, Product> = {};
      productData.forEach((product) => {
        productMap[product.id] = product;
      });
      setProducts(productMap);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch purchase order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsReceived = async () => {
    if (!purchaseOrder) return;

    try {
      setIsMarkingReceived(true);
      await markPurchaseOrderAsReceived(purchaseOrderId);
      toast.success("Purchase order marked as received");
      setReceiveDialog(false);
      fetchPurchaseOrder(); // Refresh to get updated data
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to mark as received");
    } finally {
      setIsMarkingReceived(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const calculateLineTotal = (quantity: number, unitCost: number | null) => {
    return (unitCost || 0) * quantity;
  };

  const calculateTotal = () => {
    if (!purchaseOrder) return 0;
    return purchaseOrder.lines.reduce((sum, line) => {
      return sum + calculateLineTotal(line.quantity, line.unit_cost);
    }, 0);
  };

  if (isLoading) {
    return (
      <RequireRole allowedRoles={[UserRole.BUYER]}>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !purchaseOrder) {
    return (
      <RequireRole allowedRoles={[UserRole.BUYER]}>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (!purchaseOrder) {
    return null;
  }

  return (
    <RequireRole allowedRoles={[UserRole.BUYER]}>
      <MainLayout>
        <div className="p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchase Order #{purchaseOrder.id}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {supplier ? supplier.name : `Supplier ID: ${purchaseOrder.supplier_id}`}
              </p>
            </div>
            <div className="flex space-x-3">
              {purchaseOrder.status === "created" && (
                <>
                  <Link
                    href={`/purchase-orders/${purchaseOrder.id}/edit`}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setReceiveDialog(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    Mark as Received
                  </button>
                </>
              )}
              <Link
                href="/purchase-orders"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to List
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      purchaseOrder.status === "created"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {purchaseOrder.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseOrder.order_date)}</p>
              </div>
              {purchaseOrder.received_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Received Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(purchaseOrder.received_date)}</p>
                </div>
              )}
            </div>

            <h2 className="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseOrder.lines.map((line) => {
                    const product = products[line.product_id];
                    return (
                      <tr key={line.id}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product ? product.name : `Product ID: ${line.product_id}`}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {line.quantity}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${(line.unit_cost || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ${calculateLineTotal(line.quantity, line.unit_cost).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-sm font-medium text-gray-900 text-right">
                      Total:
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-gray-900 text-right">
                      ${calculateTotal().toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <ConfirmDialog
            isOpen={receiveDialog}
            title="Mark as Received"
            message="Are you sure you want to mark this purchase order as received? This will update the inventory."
            confirmText="Mark as Received"
            cancelText="Cancel"
            onConfirm={handleMarkAsReceived}
            onCancel={() => setReceiveDialog(false)}
            variant="default"
          />
        </div>
      </MainLayout>
    </RequireRole>
  );
}

