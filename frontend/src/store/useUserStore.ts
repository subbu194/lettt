import { create } from 'zustand';
import { setAuthToken } from '@/api/client';

type UserLike = Record<string, unknown>;

type UserState = {
  token: string | null;
  isAuthenticated: boolean;
  user: UserLike | null;
  login: (token: string, user?: UserLike) => void;
  logout: () => void;
  setUser: (user: UserLike | null) => void;
  validateToken: () => Promise<boolean>;
};

const TOKEN_KEY = 'token';

// Validate JWT token format (no expiry enforcement)
function isValidTokenFormat(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64Url = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64Url.padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, '=');
    JSON.parse(atob(padded));

    return true;
  } catch {
    return false;
  }
}

// Initialize from localStorage but validate first
const initialToken = localStorage.getItem(TOKEN_KEY);
let validatedToken: string | null = null;

if (initialToken && isValidTokenFormat(initialToken)) {
  validatedToken = initialToken;
  setAuthToken(initialToken);
} else if (initialToken) {
  // Remove invalid token
  localStorage.removeItem(TOKEN_KEY);
}

export const useUserStore = create<UserState>((set, get) => ({
  token: validatedToken,
  isAuthenticated: Boolean(validatedToken),
  user: null,
  
  login: (token, user) => {
    if (!isValidTokenFormat(token)) {
      console.error('Invalid token format');
      return;
    }
    localStorage.setItem(TOKEN_KEY, token);
    setAuthToken(token);
    set({ token, isAuthenticated: true, user: user ?? null });
  },
  
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(undefined);
    set({ token: null, isAuthenticated: false, user: null });
  },
  
  setUser: (user) => set({ user }),
  
  validateToken: async () => {
    const { token, logout } = get();
    
    if (!token) return false;
    
    // Check token format
    if (!isValidTokenFormat(token)) {
      logout();
      return false;
    }
    
    // Optionally: Make a lightweight API call to verify token with server
    // This is recommended for production
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:80'}/api/v1/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        return false;
      }

      return true;
    } catch {
      // If verification fails, don't logout (might be network issue)
      // Return false to indicate validation couldn't complete
      return false;
    }
  },
}));

// Auto-validate token on page load
if (validatedToken) {
  // Run validation in background
  useUserStore.getState().validateToken().catch(() => {
    // Silent fail - validation already handles logout if needed
  });
}

