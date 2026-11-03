export interface User {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
  role?: string;
  role_id?: string;
  status?: string;
  phone?: string;
  created_by?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}
