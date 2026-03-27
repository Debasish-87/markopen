import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { skLogin, skSignup } from '../api/client';

interface ShopkeeperSession {
  username: string | null;
  phone: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

export const useShopkeeperStore = create<ShopkeeperSession>()(
  persist(
    (set) => ({
      username: null,
      phone: null,
      isLoggedIn: false,
      signup: async (username, password, phone) => {
        const data = await skSignup({ username: username.trim(), password, phone: phone || '' });
        localStorage.setItem('markopen_sk_token', data.token);
        set({ username: username.trim(), phone: phone?.trim() || null, isLoggedIn: true });
      },
      login: async (username, password) => {
        const data = await skLogin({ username: username.trim(), password });
        localStorage.setItem('markopen_sk_token', data.token);
        set({ username: username.trim(), phone: null, isLoggedIn: true });
      },
      logout: () => {
        localStorage.removeItem('markopen_sk_token');
        set({ username: null, phone: null, isLoggedIn: false });
      },
    }),
    { name: 'markopen_sk_session' }
  )
);