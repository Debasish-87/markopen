// src/hooks/useFavoritesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  // Map of username -> set of shop ids
  favsByUser: Record<string, number[]>;
  toggleFavorite: (username: string, shopId: number) => void;
  isFavorite: (username: string, shopId: number) => boolean;
  getFavorites: (username: string) => number[];
  clearFavorites: (username: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favsByUser: {},

      toggleFavorite: (username, shopId) => {
        set(state => {
          const current = state.favsByUser[username] ?? [];
          const exists = current.includes(shopId);
          return {
            favsByUser: {
              ...state.favsByUser,
              [username]: exists
                ? current.filter(id => id !== shopId)
                : [...current, shopId],
            },
          };
        });
      },

      isFavorite: (username, shopId) => {
        return (get().favsByUser[username] ?? []).includes(shopId);
      },

      getFavorites: (username) => {
        return get().favsByUser[username] ?? [];
      },

      clearFavorites: (username) => {
        set(state => ({
          favsByUser: { ...state.favsByUser, [username]: [] },
        }));
      },
    }),
    { name: 'markopen_favorites' }
  )
);