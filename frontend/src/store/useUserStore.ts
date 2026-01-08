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
};

const TOKEN_KEY = 'token';

const initialToken = localStorage.getItem(TOKEN_KEY);
if (initialToken) setAuthToken(initialToken);

export const useUserStore = create<UserState>((set) => ({
  token: initialToken,
  isAuthenticated: Boolean(initialToken),
  user: null,
  login: (token, user) => {
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
}));

