export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit_of_measure: string;
  is_active: boolean;
}

export interface ProductCreate {
  sku: string;
  name: string;
  description?: string | null;
  unit_price: number;
  unit_of_measure?: string;
}

export interface ProductUpdate {
  sku?: string;
  name?: string;
  description?: string | null;
  unit_price?: number;
  unit_of_measure?: string;
  is_active?: boolean;
}

