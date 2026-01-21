import { create } from 'zustand';
import { setAdminToken } from '@/api/client';

type AdminLike = Record<string, unknown>;

type AdminState = {
  adminToken: string | null;
  isAdminAuthenticated: boolean;
  admin: AdminLike | null;
  loginAdmin: (token: string, admin?: AdminLike) => void;
  logoutAdmin: () => void;
  setAdmin: (admin: AdminLike | null) => void;
};

const ADMIN_TOKEN_KEY = 'adminToken';

const initialAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
// Set the admin token in the API client on initialization
if (initialAdminToken) setAdminToken(initialAdminToken);

export const useAdminStore = create<AdminState>((set) => ({
  adminToken: initialAdminToken,
  isAdminAuthenticated: Boolean(initialAdminToken),
  admin: null,
  loginAdmin: (token, admin) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    setAdminToken(token);
    set({ adminToken: token, isAdminAuthenticated: true, admin: admin ?? null });
  },
  logoutAdmin: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setAdminToken(undefined);
    set({ adminToken: null, isAdminAuthenticated: false, admin: null });
  },
  setAdmin: (admin) => set({ admin }),
}));
