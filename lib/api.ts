// Core API client for SIH Tracker
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as HeadersInit || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, init?: RequestInit) => fetchApi<T>(endpoint, { ...init, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, init?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...init,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: unknown, init?: RequestInit) =>
    fetchApi<T>(endpoint, {
      ...init,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, init?: RequestInit) =>
    fetchApi<T>(endpoint, { ...init, method: 'DELETE' }),
};