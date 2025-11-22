export enum UserRole {
  SALES = "sales",
  PICKER_PACKER = "picker_packer",
  BUYER = "buyer",
}

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_admin: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
  role: UserRole;
  is_admin?: boolean;
}

export interface UserUpdate {
  email?: string;
  password?: string;
  role?: UserRole;
  is_active?: boolean;
  is_admin?: boolean;
}

