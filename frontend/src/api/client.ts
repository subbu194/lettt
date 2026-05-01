import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:80';
const API_PREFIX = '/api/v1';

const USER_ACCESS_TOKEN_KEY = 'userAccessToken';
const USER_REFRESH_TOKEN_KEY = 'userRefreshToken';
const ADMIN_ACCESS_TOKEN_KEY = 'adminAccessToken';
const ADMIN_REFRESH_TOKEN_KEY = 'adminRefreshTokenLS';

function getToken(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setToken(key: string, value?: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
}

export function setUserTokens(tokens?: { accessToken?: string; refreshToken?: string }) {
  setToken(USER_ACCESS_TOKEN_KEY, tokens?.accessToken);
  setToken(USER_REFRESH_TOKEN_KEY, tokens?.refreshToken);
}

export function clearUserTokens() {
  setToken(USER_ACCESS_TOKEN_KEY);
  setToken(USER_REFRESH_TOKEN_KEY);
}

export function setAdminTokens(tokens?: { accessToken?: string; refreshToken?: string }) {
  setToken(ADMIN_ACCESS_TOKEN_KEY, tokens?.accessToken);
  setToken(ADMIN_REFRESH_TOKEN_KEY, tokens?.refreshToken);
}

export function clearAdminTokens() {
  setToken(ADMIN_ACCESS_TOKEN_KEY);
  setToken(ADMIN_REFRESH_TOKEN_KEY);
}

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

apiClient.interceptors.request.use((config) => {
  const url = config.url ?? '';
  const isInAdminPanel = window.location.pathname.startsWith('/admin');
  const isAdminRequest =
    isInAdminPanel ||
    url.includes('/admin') ||
    url.includes('/auth/admin');

  if (isAdminRequest) {
    const adminToken = getToken(ADMIN_ACCESS_TOKEN_KEY);
    if (adminToken) {
      config.headers['x-admin-authorization'] = `Bearer ${adminToken}`;
    }
  } else {
    const userToken = getToken(USER_ACCESS_TOKEN_KEY);
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  }

  return config;
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
    const url = originalRequest.url ?? '';
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      url.includes('/auth/login') ||
      url.includes('/auth/signup') ||
      url.includes('/auth/admin/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/admin/refresh')
    ) {
      return Promise.reject(error);
    }

    // Determine if the failing request belongs to admin flows.
    // Some admin-only endpoints do not include /admin in the URL path.
    const isInAdminPanel = window.location.pathname.startsWith('/admin');
    const isAdminRequest =
      isInAdminPanel ||
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
      const refreshToken = isAdminRequest
        ? getToken(ADMIN_REFRESH_TOKEN_KEY)
        : getToken(USER_REFRESH_TOKEN_KEY);

      const refreshResp = await apiClient.post<{ accessToken?: string; refreshToken?: string }>(
        refreshUrl,
        refreshToken ? { refreshToken } : {}
      );

      if (isAdminRequest) {
        setAdminTokens({
          accessToken: refreshResp.data?.accessToken,
          refreshToken: refreshResp.data?.refreshToken,
        });
      } else {
        setUserTokens({
          accessToken: refreshResp.data?.accessToken,
          refreshToken: refreshResp.data?.refreshToken,
        });
      }

      processQueue(null);
      // Retry the original request (cookies are now refreshed)
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      console.error('[Auth Service] Silently refreshing session failed. Redirecting to login...');

      // Session is truly gone. Clear all local auth state and redirect.
      if (isAdminRequest) {
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('admin');
        clearAdminTokens();
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login?error=SessionExpired';
        }
      } else {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        clearUserTokens();
        if (!window.location.pathname.includes('/auth') && !window.location.pathname.includes('/login')) {
          window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname) + '&msg=SessionExpired';
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Token handling relies entirely on HttpOnly cookies sent by the backend.
export const setAuthToken = () => {};
export const setAdminToken = () => {};
export default apiClient;
