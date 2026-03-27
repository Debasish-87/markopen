// src/hooks/useShopkeeperStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ShopkeeperSession {
  username: string | null;
  phone: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const SK_USERS_KEY = 'markopen_shopkeeper_users';

interface StoredSK {
  username: string;
  passwordHash: string;
  phone?: string;
}

function getSKUsers(): StoredSK[] {
  try { return JSON.parse(localStorage.getItem(SK_USERS_KEY) || '[]'); }
  catch { return []; }
}

export const useShopkeeperStore = create<ShopkeeperSession>()(
  persist(
    (set) => ({
      username: null,
      phone: null,
      isLoggedIn: false,

      signup: async (username, password, phone) => {
        const users = getSKUsers();
        if (username.trim().length < 3) throw new Error('Username must be at least 3 characters.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        const normalizedPhone = (phone || '').replace(/\D/g, '');
        if (!normalizedPhone || normalizedPhone.length < 10) throw new Error('A valid phone number is required.');
        if (users.find(u => (u.phone || '').replace(/\D/g, '') === normalizedPhone))
          throw new Error('This phone number is already registered.');
        const updated = [...users, { username: username.trim(), passwordHash: btoa(password), phone: phone?.trim() }];
        localStorage.setItem(SK_USERS_KEY, JSON.stringify(updated));
        set({ username: username.trim(), phone: phone?.trim() || null, isLoggedIn: true });
      },

      login: async (username, password) => {
        const users = getSKUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user || user.passwordHash !== btoa(password))
          throw new Error('Invalid username or password.');
        set({ username: user.username, phone: user.phone || null, isLoggedIn: true });
      },

      logout: () => set({ username: null, phone: null, isLoggedIn: false }),
    }),
    { name: 'markopen_sk_session' }
  )
);