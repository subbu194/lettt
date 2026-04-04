import { create } from 'zustand';
import apiClient from '@/api/client';

type AdminLike = Record<string, unknown>;

type AdminState = {
  isAdminAuthenticated: boolean;
  admin: AdminLike | null;
  loginAdmin: (admin?: AdminLike) => void;
  logoutAdmin: () => void;
  setAdmin: (admin: AdminLike | null) => void;
};

const IS_ADMIN_KEY = 'isAdminAuthenticated';

const initialIsAdmin = localStorage.getItem(IS_ADMIN_KEY) === 'true';

export const useAdminStore = create<AdminState>((set) => ({
  isAdminAuthenticated: initialIsAdmin,
  admin: null,
  loginAdmin: (admin) => {
    localStorage.setItem(IS_ADMIN_KEY, 'true');
    set({ isAdminAuthenticated: true, admin: admin ?? null });
  },
  logoutAdmin: () => {
    localStorage.removeItem(IS_ADMIN_KEY);
    set({ isAdminAuthenticated: false, admin: null });
    // Clear HttpOnly cookies on backend
    apiClient.post('/auth/admin/logout').catch(() => {});
  },
  setAdmin: (admin) => set({ admin }),
}));
