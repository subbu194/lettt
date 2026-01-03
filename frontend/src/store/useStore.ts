import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TicketSelection, UserProfile, Video } from '../types';

type UserState = {
  token: string | null;
  isAuthed: boolean;
  profile: UserProfile | null;
  setToken: (token: string | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: localStorage.getItem('token'),
      isAuthed: Boolean(localStorage.getItem('token')),
      profile: null,
      setToken: (token) => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ token, isAuthed: Boolean(token) });
      },
      setProfile: (profile) => set({ profile }),
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, isAuthed: false, profile: null });
      },
    }),
    {
      name: 'artrise_user',
      partialize: (s) => ({ token: s.token, isAuthed: s.isAuthed, profile: s.profile }),
    }
  )
);

type CartState = {
  selectedTickets: TicketSelection[];
  addTicket: (item: TicketSelection) => void;
  removeEvent: (eventId: string) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      selectedTickets: [],
      addTicket: (item) => {
        const current = get().selectedTickets;
        const idx = current.findIndex((t) => t.eventId === item.eventId);
        if (idx >= 0) {
          const next = [...current];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity, unitPrice: item.unitPrice };
          set({ selectedTickets: next });
          return;
        }
        set({ selectedTickets: [...current, item] });
      },
      removeEvent: (eventId) => set({ selectedTickets: get().selectedTickets.filter((t) => t.eventId !== eventId) }),
      clearCart: () => set({ selectedTickets: [] }),
    }),
    {
      name: 'artrise_cart',
    }
  )
);

type UiModalState =
  | { open: false; type: null; payload: null }
  | { open: true; type: 'video'; payload: { video: Video } };

type UiState = {
  modal: UiModalState;
  navbarScrolled: boolean;
  openVideoModal: (video: Video) => void;
  closeModal: () => void;
  setNavbarScrolled: (scrolled: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  modal: { open: false, type: null, payload: null },
  navbarScrolled: false,
  openVideoModal: (video) => set({ modal: { open: true, type: 'video', payload: { video } } }),
  closeModal: () => set({ modal: { open: false, type: null, payload: null } }),
  setNavbarScrolled: (navbarScrolled) => set({ navbarScrolled }),
}));


