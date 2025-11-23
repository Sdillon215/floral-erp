export interface SalesOrderLine {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SalesOrder {
  id: number;
  customer_id: number;
  status: "created" | "allocated" | "shipped";
  order_date: string; // ISO datetime string
  shipped_date: string | null; // ISO datetime string
  created_by_user_id: number | null;
  created_by_customer_id: number | null;
  lines: SalesOrderLine[];
}

export interface SalesOrderLineCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SalesOrderCreate {
  customer_id: number;
  status?: "created" | "allocated" | "shipped";
  order_date?: string; // ISO datetime string
  shipped_date?: string | null; // ISO datetime string
  created_by_user_id?: number | null;
  created_by_customer_id?: number | null;
  lines: SalesOrderLineCreate[];
}

export interface SalesOrderUpdate {
  status?: "created" | "allocated" | "shipped";
  shipped_date?: string | null; // ISO datetime string
  lines?: SalesOrderLineCreate[];
}

