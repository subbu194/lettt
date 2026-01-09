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

export function setAuthToken(token?: string) {
  if (token) apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete apiClient.defaults.headers.common['Authorization'];
}

export default apiClient;
