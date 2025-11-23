export interface InventoryItem {
  product_id: number;
  on_hand: number;
  allocated: number;
  available: number;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  quantity_delta: number;
  reference: string | null;
  type: string;
  created_at: string; // ISO datetime string
}

export interface InventoryAdjustmentCreate {
  product_id: number;
  quantity_delta: number;
  reference?: string | null;
}

export interface InventoryAdjustmentOut {
  item: InventoryItem;
  transaction: InventoryTransaction;
}

