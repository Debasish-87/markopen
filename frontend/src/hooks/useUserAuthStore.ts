// src/hooks/useUserAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserAuthState {
  username: string | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Simulated user store using localStorage as a simple user "database"
// In a real app this would call a backend API endpoint
const USERS_KEY = 'shopen_users';

interface StoredUser {
  username: string;
  passwordHash: string; // simple btoa hash for demo
}

function getUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUser(user: StoredUser): void {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(password: string): string {
  return btoa(password); // demo only — not secure
}

export const useUserAuthStore = create<UserAuthState>()(
  persist(
    (set) => ({
      username: null,
      isLoggedIn: false,

      signup: async (username: string, password: string) => {
        const users = getUsers();
        if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
          throw new Error('Username already taken.');
        }
        if (username.trim().length < 3) throw new Error('Username must be at least 3 characters.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        saveUser({ username: username.trim(), passwordHash: hashPassword(password) });
        set({ username: username.trim(), isLoggedIn: true });
      },

      login: async (username: string, password: string) => {
        const users = getUsers();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user || user.passwordHash !== hashPassword(password)) {
          throw new Error('Invalid username or password.');
        }
        set({ username: user.username, isLoggedIn: true });
      },

      logout: () => {
        set({ username: null, isLoggedIn: false });
      },
    }),
    { name: 'shopen_user_session' }
  )
);
