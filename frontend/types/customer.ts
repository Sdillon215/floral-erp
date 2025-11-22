export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface CustomerCreate {
  name: string;
  email: string;
  phone?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
}

export interface CustomerUpdate {
  name?: string;
  email?: string;
  phone?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  notes?: string | null;
  is_active?: boolean;
}

