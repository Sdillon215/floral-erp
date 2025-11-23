"use client";

import { useState, useEffect } from "react";
import { getSalesOrders, getSalesOrder, shipSalesOrder } from "@/lib/api/sales_orders";
import { getCustomer } from "@/lib/api/customers";
import { getProduct } from "@/lib/api/products";
import { SalesOrder } from "@/types/sales_order";
import { Customer } from "@/types/customer";
import { Product } from "@/types/product";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

interface PickedItem {
  lineId: number;
  picked: boolean;
}

export default function PickerPackerDashboard() {
  const [allocatedOrders, setAllocatedOrders] = useState<SalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Record<number, Product>>({});
  const [pickedItems, setPickedItems] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isShipping, setIsShipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shipDialog, setShipDialog] = useState(false);

  useEffect(() => {
    fetchAllocatedOrders();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      // Clear previous order's data before fetching new one
      setCustomer(null);
      setProducts({});
      setPickedItems({});
      fetchOrderDetails(selectedOrderId);
    }
  }, [selectedOrderId]);

  const fetchAllocatedOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orders = await getSalesOrders({ skip: 0, limit: 100 });
      // Filter for allocated orders only
      const allocated = orders.filter((order) => order.status === "allocated");
      setAllocatedOrders(allocated);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch orders");
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setIsLoadingOrder(true);
      const orderData = await getSalesOrder(orderId);
      const customerData = await getCustomer(orderData.customer_id);

      // Only update if this is still the selected order
      setSelectedOrder((prev) => {
        if (prev?.id === orderId || selectedOrderId === orderId) {
          return orderData;
        }
        return prev;
      });
      setCustomer(customerData);

      // Fetch all products
      const productPromises = orderData.lines.map((line) => getProduct(line.product_id));
      const productData = await Promise.all(productPromises);
      const productMap: Record<number, Product> = {};
      productData.forEach((product) => {
        productMap[product.id] = product;
      });
      setProducts(productMap);

      // Initialize picked items (all unchecked)
      const initialPicked: Record<number, boolean> = {};
      orderData.lines.forEach((line) => {
        initialPicked[line.id] = false;
      });
      setPickedItems(initialPicked);
    } catch (err: any) {
      toast.error("Failed to load order details");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleItemToggle = (lineId: number) => {
    setPickedItems((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  };

  const allItemsPicked = () => {
    if (!selectedOrder) return false;
    return selectedOrder.lines.every((line) => pickedItems[line.id] === true);
  };

  const handleShipOrder = async () => {
    if (!selectedOrder) return;

    if (!allItemsPicked()) {
      toast.error("Please check off all items before shipping");
      return;
    }

    try {
      setIsShipping(true);
      await shipSalesOrder(selectedOrder.id);
      toast.success("Order shipped successfully!");
      setShipDialog(false);
      setSelectedOrder(null);
      setSelectedOrderId(null);
      setCustomer(null);
      setProducts({});
      setPickedItems({});
      fetchAllocatedOrders(); // Refresh the list
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to ship order");
    } finally {
      setIsShipping(false);
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

  const calculateTotal = (order: SalesOrder) => {
    return order.lines.reduce((sum, line) => {
      return sum + line.unit_price * line.quantity;
    }, 0);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Picker & Packer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Orders ready to be picked and packed</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Allocated Orders ({allocatedOrders.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {allocatedOrders.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>No orders ready for picking</p>
                  <p className="text-sm mt-1">All allocated orders have been shipped</p>
                </div>
              ) : (
                allocatedOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => {
                      setSelectedOrder(order);
                      setSelectedOrderId(order.id);
                    }}
                    className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedOrder?.id === order.id ? "bg-blue-50 border-l-4 border-blue-600" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.lines.length} item{order.lines.length !== 1 ? "s" : ""} •{" "}
                          {formatDate(order.order_date)}
                        </p>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          ${calculateTotal(order).toFixed(2)}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Allocated
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Order Details & Picking Interface */}
          <div className="bg-white shadow rounded-lg">
            {!selectedOrder ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <p className="text-lg">Select an order to begin picking</p>
                <p className="text-sm mt-2">Choose an order from the list to see details and start picking items</p>
              </div>
            ) : isLoadingOrder ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-medium text-gray-900">Order #{selectedOrder.id}</h2>
                      {customer && (
                        <p className="text-sm text-gray-500 mt-1">{customer.name}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Order Date: {formatDate(selectedOrder.order_date)}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Ready to Pick
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Items to Pick</h3>
                  <div className="space-y-3">
                    {selectedOrder.lines.map((line) => {
                      const product = products[line.product_id];
                      const isPicked = pickedItems[line.id] || false;
                      return (
                        <div
                          key={line.id}
                          className={`border rounded-lg p-4 ${
                            isPicked
                              ? "bg-green-50 border-green-200"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              checked={isPicked}
                              onChange={() => handleItemToggle(line.id)}
                              className="mt-1 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {product ? product.name : `Product ID: ${line.product_id}`}
                                  </p>
                                  {product && (
                                    <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    Qty: {line.quantity}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ${line.unit_price.toFixed(2)} each
                                  </p>
                                </div>
                              </div>
                              {isPicked && (
                                <div className="mt-2 flex items-center text-sm text-green-700">
                                  <svg
                                    className="h-4 w-4 mr-1"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Picked
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-500">
                      {selectedOrder.lines.filter((line) => pickedItems[line.id]).length} /{" "}
                      {selectedOrder.lines.length} items picked
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (selectedOrder.lines.filter((line) => pickedItems[line.id]).length /
                            selectedOrder.lines.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => setShipDialog(true)}
                    disabled={!allItemsPicked() || isShipping}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isShipping ? (
                      <span className="flex items-center justify-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Shipping...
                      </span>
                    ) : allItemsPicked() ? (
                      "Confirm Shipment"
                    ) : (
                      `Pick All Items First (${selectedOrder.lines.length - selectedOrder.lines.filter((line) => pickedItems[line.id]).length} remaining)`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={shipDialog}
        title="Confirm Shipment"
        message={`Are you sure you want to ship Order #${selectedOrder?.id}? This will update inventory and mark the order as shipped.`}
        confirmText="Ship Order"
        cancelText="Cancel"
        onConfirm={handleShipOrder}
        onCancel={() => setShipDialog(false)}
        variant="default"
      />
    </div>
  );
}

