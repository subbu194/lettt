import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:80';
const API_PREFIX = '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// ─── Automatic Token Refresh Interceptor ──────────────────────
// When a 401 is received (access token expired), try to silently
// refresh using the HttpOnly refresh-token cookie, then retry.

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}> = [];

function processQueue(error: unknown | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(apiClient(prom.config));
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Only handle 401s, and don't retry refresh/login endpoints themselves
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/signup') ||
      originalRequest.url?.includes('/auth/admin/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/admin/refresh')
    ) {
      return Promise.reject(error);
    }

    // Determine if the failing request was an admin endpoint
    const isAdminRequest =
      originalRequest.url?.includes('/admin') ||
      originalRequest.url?.includes('/auth/admin');
    const refreshUrl = isAdminRequest ? '/auth/admin/refresh' : '/auth/refresh';

    if (isRefreshing) {
      // Queue this request until the ongoing refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await apiClient.post(refreshUrl);
      processQueue(null);
      // Retry the original request (cookies are now refreshed)
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Token handling logic removed cleanly to rely entirely on HttpOnly cookies sent by the backend.
export const setAuthToken = () => {};
export const setAdminToken = () => {};
export default apiClient;

