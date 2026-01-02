import axios from 'axios';
import type { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:80';
const API_PREFIX = '/api/v1';

type ApiResponse<T> = { data?: T; error?: string };

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export function setAuthToken(token?: string) {
  if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete apiClient.defaults.headers.common['Authorization'];
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