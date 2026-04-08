import { create } from 'zustand';
import { useCartStore } from './useCartStore';
import apiClient from '@/api/client';

type UserLike = Record<string, unknown>;

type UserState = {
  isAuthenticated: boolean;
  user: UserLike | null;
  login: (user?: UserLike) => void;
  logout: () => void;
  setUser: (user: UserLike | null) => void;
  validateToken: () => Promise<boolean>;
};

const IS_AUTH_KEY = 'isAuthenticated';
const USER_KEY = 'user';

function loadInitialUser(): UserLike | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as UserLike) : null;
  } catch {
    return null;
  }
}

function persistUser(user: UserLike | null) {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const initialIsAuth = localStorage.getItem(IS_AUTH_KEY) === 'true';
const initialUser = loadInitialUser();

export const useUserStore = create<UserState>((set, get) => ({
  isAuthenticated: initialIsAuth,
  user: initialUser,
  
  login: (user) => {
    useCartStore.getState().clearCart();
    localStorage.setItem(IS_AUTH_KEY, 'true');
    persistUser(user ?? null);
    set({ isAuthenticated: true, user: user ?? null });
  },
  
  logout: async () => {
    useCartStore.getState().clearCart();
    localStorage.removeItem(IS_AUTH_KEY);
    persistUser(null);
    set({ isAuthenticated: false, user: null });
    // Attempt to hit backend logout to clear HttpOnly cookie
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors - local state is cleared
    }
  },
  
  setUser: (user) => {
    persistUser(user);
    set({ user });
  },
  
  validateToken: async () => {
    const { logout } = get();
    
    // Make API call to verify cookie with server
    try {
      const response = await apiClient.get('/auth/verify');
      
      if (response.status !== 200) {
        logout();
        return false;
      }

      return true;
    } catch {
      // If verification fails on network error, don't logout
      return false;
    }
  },
}));

// Auto-validate session on page load if flag is set
if (initialIsAuth) {
  useUserStore.getState().validateToken().catch(() => {});

  // Hydrate user profile for refresh scenarios
  if (!initialUser) {
    apiClient.get('/auth/profile')
      .then((response) => {
        const data = response.data as { user?: UserLike };
        if (data?.user) {
          persistUser(data.user);
          useUserStore.setState({ user: data.user, isAuthenticated: true });
        }
      })
      .catch(() => {
        // Keep existing session on transient failures
      });
  }
}
