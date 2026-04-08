import { create } from 'zustand';
import apiClient from '@/api/client';
import { clearAdminTokens, setAdminTokens } from '@/api/client';

type AdminLike = Record<string, unknown>;

type AdminState = {
  isAdminAuthenticated: boolean;
  admin: AdminLike | null;
  loginAdmin: (admin?: AdminLike, tokens?: { accessToken?: string; refreshToken?: string }) => void;
  logoutAdmin: () => void;
  setAdmin: (admin: AdminLike | null) => void;
};

const IS_ADMIN_KEY = 'isAdminAuthenticated';
const ADMIN_KEY = 'admin';

function loadInitialAdmin(): AdminLike | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as AdminLike) : null;
  } catch {
    return null;
  }
}

function persistAdmin(admin: AdminLike | null) {
  try {
    if (admin) {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    } else {
      localStorage.removeItem(ADMIN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const initialIsAdmin = localStorage.getItem(IS_ADMIN_KEY) === 'true';
const initialAdmin = loadInitialAdmin();

export const useAdminStore = create<AdminState>((set) => ({
  isAdminAuthenticated: initialIsAdmin,
  admin: initialAdmin,
  loginAdmin: (admin, tokens) => {
    localStorage.setItem(IS_ADMIN_KEY, 'true');
    persistAdmin(admin ?? null);
    setAdminTokens(tokens);
    set({ isAdminAuthenticated: true, admin: admin ?? null });
  },
  logoutAdmin: async () => {
    localStorage.removeItem(IS_ADMIN_KEY);
    persistAdmin(null);
    clearAdminTokens();
    set({ isAdminAuthenticated: false, admin: null });
    // Clear HttpOnly cookies on backend
    try {
      await apiClient.post('/auth/admin/logout');
    } catch {
      // Ignore errors - local state is cleared
    }
  },
  setAdmin: (admin) => {
    persistAdmin(admin);
    set({ admin });
  },
}));
