const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface RequestOptions extends RequestInit {
  token?: string | null;
  skipAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, skipAuth = false, headers: customHeaders, ...customOptions } = options;

  // Determine authorization token
  let authToken = token;
  if (!skipAuth && authToken === undefined) {
    authToken = localStorage.getItem('auth_token');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...customHeaders,
  };

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const config: RequestInit = {
    ...customOptions,
    headers,
  };

  const response = await fetch(url, config);

  // Handle HTTP 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  let data: any;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status} Error`;

    if (data) {
      if (data.message) {
        errorMessage = data.message;
      } else if (data.errors && typeof data.errors === 'object') {
        const messages = Object.values(data.errors).flat().join(', ');
        if (messages) {
          errorMessage = messages;
        }
      }
    }

    // Auto-clear auth storage if token is unauthenticated (401)
    if (response.status === 401 && !skipAuth) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    throw new Error(errorMessage);
  }

  return data as T;
}
