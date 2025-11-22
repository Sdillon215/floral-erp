export interface LoginRequest {
  username: string; // Backend uses 'username' field for email
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface TokenPayload {
  sub: string; // User ID
  is_admin: boolean;
  exp?: number;
}

