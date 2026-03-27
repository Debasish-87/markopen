// src/lib/constants.ts
import type { Category } from '../types';

export const CAT_META: Record<Category, { icon: string; color: string; bg: string }> = {
  Food:    { icon: '🍽️', color: '#E8752A', bg: '#FEF1E8' },
  Medical: { icon: '💊', color: '#2A7FE8', bg: '#EBF3FE' },
  Petrol:  { icon: '⛽', color: '#16A34A', bg: '#DCFCE7' },
};

export const SUBCATS: Record<Category, string[]> = {
  Food:    ['Restaurant', 'Canteen', 'Hotel','Cloud Kitchen (Delivery-only)', 'Dhaba','Fast Food', 'Street Food', 'Café','Bakery', 'Sweets',  ],
  Medical: ['Medicine store 💊', 'Clinic', 'Nursing Homes', 'Ayurvedic'],
  Petrol:  ['Petrol Pump', 'Petrol'],
};

export const CATEGORIES: Category[] = ['Food', 'Medical',  'Petrol'];

export const POLL_INTERVAL_MS  = 10_000;
export const DEBOUNCE_DELAY_MS = 300;
export const TOAST_DURATION_MS = 3_000;