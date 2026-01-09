import { create } from 'zustand';

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

export const useAdminStore = create<AdminState>((set) => ({
  adminToken: initialAdminToken,
  isAdminAuthenticated: Boolean(initialAdminToken),
  admin: null,
  loginAdmin: (token, admin) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    set({ adminToken: token, isAdminAuthenticated: true, admin: admin ?? null });
  },
  logoutAdmin: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    set({ adminToken: null, isAdminAuthenticated: false, admin: null });
  },
  setAdmin: (admin) => set({ admin }),
}));
