import type { AxiosInstance } from 'axios';
import client from '../utils/client';

// NOTE:
// - The production axios instance lives at `src/utils/client.ts` (per mandatory structure).
// - This file keeps your convenient typed wrapper helpers.
// - If your backend uses a prefix like `/api/v1`, set `VITE_API_URL` to include it, e.g.:
//   VITE_API_URL=http://localhost:80/api/v1

export type ApiResponse<T> = { data?: T; error?: string };

const apiClient: AxiosInstance = client;

export function setAuthToken(token?: string) {
  if (token) {
    localStorage.setItem('token', token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

async function request<T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  try {
    const resp = await apiClient.request<T>({ method, url: endpoint, data });
    return { data: resp.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: message };
  }
}

export async function get<T>(endpoint: string) {
  return request<T>('get', endpoint);
}

export async function post<T>(endpoint: string, body?: unknown) {
  return request<T>('post', endpoint, body);
}

export async function put<T>(endpoint: string, body?: unknown) {
  return request<T>('put', endpoint, body);
}

export async function del<T>(endpoint: string) {
  return request<T>('delete', endpoint);
}

export async function healthCheck() {
  return get<{ status: string; message: string; timestamp: string }>('/health');
}

export default apiClient;