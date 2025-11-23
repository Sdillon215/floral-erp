export interface PurchaseOrderLine {
  id: number;
  product_id: number;
  quantity: number;
  unit_cost: number | null;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  status: "created" | "received";
  order_date: string; // ISO datetime string
  received_date: string | null; // ISO datetime string
  lines: PurchaseOrderLine[];
}

export interface PurchaseOrderLineCreate {
  product_id: number;
  quantity: number;
  unit_cost?: number | null;
}

export interface PurchaseOrderCreate {
  supplier_id: number;
  status?: "created" | "received";
  order_date?: string; // ISO datetime string
  received_date?: string | null; // ISO datetime string
  lines: PurchaseOrderLineCreate[];
}

export interface PurchaseOrderUpdate {
  status?: "created" | "received";
  received_date?: string | null; // ISO datetime string
  lines?: PurchaseOrderLineCreate[];
}

