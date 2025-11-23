"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";
import { MainLayout } from "@/components/layout/MainLayout";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getSalesOrder, allocateSalesOrder, shipSalesOrder } from "@/lib/api/sales_orders";
import { getCustomer } from "@/lib/api/customers";
import { getProduct } from "@/lib/api/products";
import { SalesOrder } from "@/types/sales_order";
import { Customer } from "@/types/customer";
import { Product } from "@/types/product";
import { UserRole } from "@/types/user";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

export default function SalesOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const salesOrderId = parseInt(params.id as string);
  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allocateDialog, setAllocateDialog] = useState(false);
  const [shipDialog, setShipDialog] = useState(false);

  useEffect(() => {
    fetchSalesOrder();
  }, [salesOrderId]);

  const fetchSalesOrder = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const so = await getSalesOrder(salesOrderId);
      setSalesOrder(so);

      // Fetch customer
      const customerData = await getCustomer(so.customer_id);
      setCustomer(customerData);

      // Fetch all products
      const productPromises = so.lines.map((line) => getProduct(line.product_id));
      const productData = await Promise.all(productPromises);
      const productMap: Record<number, Product> = {};
      productData.forEach((product) => {
        productMap[product.id] = product;
      });
      setProducts(productMap);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to fetch sales order";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!salesOrder) return;

    try {
      setIsAllocating(true);
      await allocateSalesOrder(salesOrderId);
      toast.success("Sales order allocated successfully");
      setAllocateDialog(false);
      fetchSalesOrder(); // Refresh to get updated data
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to allocate sales order");
    } finally {
      setIsAllocating(false);
    }
  };

  const handleShip = async () => {
    if (!salesOrder) return;

    try {
      setIsShipping(true);
      await shipSalesOrder(salesOrderId);
      toast.success("Sales order shipped successfully");
      setShipDialog(false);
      fetchSalesOrder(); // Refresh to get updated data
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to ship sales order");
    } finally {
      setIsShipping(false);
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

  const calculateLineTotal = (quantity: number, unitPrice: number) => {
    return unitPrice * quantity;
  };

  const calculateTotal = () => {
    if (!salesOrder) return 0;
    return salesOrder.lines.reduce((sum, line) => {
      return sum + calculateLineTotal(line.quantity, line.unit_price);
    }, 0);
  };

  const canAllocate = salesOrder?.status === "created" && user?.role === UserRole.SALES;
  const canShip = salesOrder?.status === "allocated" && user?.role === UserRole.PICKER_PACKER;

  if (isLoading) {
    return (
      <RequireRole allowedRoles={[UserRole.SALES, UserRole.PICKER_PACKER]}>
        <MainLayout>
          <div className="p-6 flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (error && !salesOrder) {
    return (
      <RequireRole allowedRoles={[UserRole.SALES, UserRole.PICKER_PACKER]}>
        <MainLayout>
          <div className="p-6">
            <ErrorMessage message={error} />
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  if (!salesOrder) {
    return null;
  }

  return (
    <RequireRole allowedRoles={[UserRole.SALES, UserRole.PICKER_PACKER]}>
      <MainLayout>
        <div className="p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sales Order #{salesOrder.id}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {customer ? customer.name : `Customer ID: ${salesOrder.customer_id}`}
              </p>
            </div>
            <div className="flex space-x-3">
              {salesOrder.status === "created" && user?.role === UserRole.SALES && (
                <>
                  <Link
                    href={`/sales-orders/${salesOrder.id}/edit`}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setAllocateDialog(true)}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#5A9367] hover:bg-[#4a7a56]"
                  >
                    Allocate Order
                  </button>
                </>
              )}
              {canShip && (
                <button
                  onClick={() => setShipDialog(true)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Ship Order
                </button>
              )}
              <Link
                href="/sales-orders"
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
                      salesOrder.status === "created"
                        ? "bg-yellow-100 text-yellow-800"
                        : salesOrder.status === "allocated"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {salesOrder.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Order Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(salesOrder.order_date)}</p>
              </div>
              {salesOrder.shipped_date && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Shipped Date</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(salesOrder.shipped_date)}</p>
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
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesOrder.lines.map((line) => {
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
                          ${line.unit_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          ${calculateLineTotal(line.quantity, line.unit_price).toFixed(2)}
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
            isOpen={allocateDialog}
            title="Allocate Sales Order"
            message="Are you sure you want to allocate this sales order? This will reserve inventory for the order."
            confirmText="Allocate"
            cancelText="Cancel"
            onConfirm={handleAllocate}
            onCancel={() => setAllocateDialog(false)}
            variant="default"
          />

          <ConfirmDialog
            isOpen={shipDialog}
            title="Ship Sales Order"
            message="Are you sure you want to ship this sales order? This will update the inventory and mark the order as shipped."
            confirmText="Ship"
            cancelText="Cancel"
            onConfirm={handleShip}
            onCancel={() => setShipDialog(false)}
            variant="default"
          />
        </div>
      </MainLayout>
    </RequireRole>
  );
}

