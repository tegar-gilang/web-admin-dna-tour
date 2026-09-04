import { apiClient } from './apiClient';
import { LoginCredentials, LoginResponse, User } from '@/types/auth';

export const authService = {
  /**
   * POST /api/login
   * Kirim email & password, mengembalikan user & token Sanctum
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiClient<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });
  },

  /**
   * POST /api/logout
   * Revoke current access token
   */
  async logout(token?: string): Promise<{ message: string }> {
    return apiClient<{ message: string }>('/logout', {
      method: 'POST',
      token,
    });
  },

  /**
   * GET /api/me
   * Ambil profil user terautentikasi berdasarkan Bearer Token
   */
  async getMe(token?: string): Promise<User> {
    return apiClient<User>('/me', {
      method: 'GET',
      token,
    });
  },
};
