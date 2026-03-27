// src/types/index.ts

// ─────────────────────────────────────────
// CATEGORY + FILTER TYPES
// ─────────────────────────────────────────

export type Category = 'Food' | 'Medical' | 'Petrol';
export type StatusFilter = 'all' | 'open' | 'closed';

// ─────────────────────────────────────────
// SHOP TYPES
// ─────────────────────────────────────────

export interface Shop {
  id: number;
  name: string;
  category: Category;
  subcat: string;
  icon: string;
  address: string;
  phone: string;
  show_phone: boolean;
  hours: string;
  is_open: boolean;
  description: string;
  photo_url: string;
  logo_url: string;
  map_query: string;
  created_at: string;
  updated_at: string;
}

export interface CreateShopPayload {
  name: string;
  category: Category;
  subcat: string;
  icon: string;
  address: string;
  phone: string;
  show_phone: boolean;
  hours: string;
  is_open: boolean;
  description: string;
  photo_url: string;
  logo_url: string;
  map_query: string;
}

export type UpdateShopPayload = Partial<CreateShopPayload>;

// ─────────────────────────────────────────
// AUTH TYPES
// ─────────────────────────────────────────

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  message: string;
}

// ─────────────────────────────────────────
// STATS
// ─────────────────────────────────────────

export interface StatsResponse {
  total: number;
  open: number;
  closed: number;
  open_rate: number;
}

// ─────────────────────────────────────────
// API GENERIC RESPONSE
// ─────────────────────────────────────────

export interface APIResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// ─────────────────────────────────────────
// SHOP FILTERS
// ─────────────────────────────────────────

export interface ShopFilters {
  category: Category | '';
  subcat: string;
  status: StatusFilter;
  search: string;
}

// ─────────────────────────────────────────
// TOAST NOTIFICATION
// ─────────────────────────────────────────

export interface ToastNotification {
  msg: string;
  type: 'success' | 'error';
}

// ─────────────────────────────────────────
// FEEDBACK TYPES
// ─────────────────────────────────────────

export interface FeedbackFormData {
  name: string;
  email: string;
  message: string;
  starRating: number;
  types: FeedbackType[];
}

export type FeedbackType =
  | 'General'
  | 'Bug Report'
  | 'Feature Idea'
  | 'Shop Issue'
  | 'Compliment';

export const FEEDBACK_TYPES: { label: FeedbackType; icon: string }[] = [
  { label: 'General', icon: '💬' },
  { label: 'Bug Report', icon: '🐛' },
  { label: 'Feature Idea', icon: '💡' },
  { label: 'Shop Issue', icon: '🏪' },
  { label: 'Compliment', icon: '👍' }
];

export * from "./feedback";