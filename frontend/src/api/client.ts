import axios from 'axios';
import type { AxiosInstance } from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:80';
const API_PREFIX = '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
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

// Prioritize admin token over user token when both exist
function updateAuthHeader() {
  const token = adminToken || userToken;
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

// Initialize tokens from localStorage
const storedUserToken = localStorage.getItem('token');
const storedAdminToken = localStorage.getItem('adminToken');
if (storedUserToken) userToken = storedUserToken;
if (storedAdminToken) adminToken = storedAdminToken;
updateAuthHeader();

export default apiClient;
