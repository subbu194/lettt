import axios from 'axios';
import type { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:80';
const API_PREFIX = '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Store tokens in module scope
let userToken: string | undefined;
let adminToken: string | undefined;

export function setAuthToken(token?: string) {
  userToken = token;
  updateAuthHeader();
}

export function setAdminToken(token?: string) {
  adminToken = token;
  updateAuthHeader();
}

// Default to user token so user-facing routes (orders/tickets/profile) stay correct.
function updateAuthHeader() {
  const token = userToken || adminToken;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

function isAdminRequest(url?: string) {
  if (!url) return false;
  return /(^|\/)admin(\/|$|\?)/i.test(url);
}

apiClient.interceptors.request.use((config) => {
  const requestUrl = config.url || '';
  const token = isAdminRequest(requestUrl)
    ? (adminToken || userToken)
    : (userToken || adminToken);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers && 'Authorization' in config.headers) {
    delete config.headers.Authorization;
  }

  return config;
});

// Initialize tokens from localStorage
const storedUserToken = localStorage.getItem('token');
const storedAdminToken = localStorage.getItem('adminToken');
if (storedUserToken) userToken = storedUserToken;
if (storedAdminToken) adminToken = storedAdminToken;
updateAuthHeader();

export default apiClient;
