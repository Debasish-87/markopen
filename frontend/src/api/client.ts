// src/api/client.ts
import axios from 'axios';
import type {
  Shop, CreateShopPayload, UpdateShopPayload,
  LoginPayload, LoginResponse, StatsResponse,
  APIResponse, ShopFilters,
} from '../types';

const BASE_URL = import.meta.env["VITE_API_URL"] ?? '';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('markopen_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to admin login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('markopen_token');
      localStorage.removeItem('markopen_admin');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(err);
  }
);

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

export async function fetchShops(filters: Partial<ShopFilters> = {}): Promise<Shop[]> {
  const params: Record<string, string> = {};
  if (filters.category) params.category = filters.category;
  if (filters.subcat)   params.subcat   = filters.subcat;
  if (filters.status && filters.status !== 'all') params.status = filters.status;
  if (filters.search)   params.search   = filters.search;

  const res = await api.get<APIResponse<Shop[]>>('/shops', { params });
  return res.data.data ?? [];
}

export async function fetchShop(id: number): Promise<Shop> {
  const res = await api.get<APIResponse<Shop>>(`/shops/${id}`);
  return res.data.data!;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post<APIResponse<LoginResponse>>('/auth/login', payload);
  return res.data.data!;
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export async function fetchAdminShops(filters: Partial<ShopFilters> = {}): Promise<Shop[]> {
  const params: Record<string, string> = {};
  if (filters.category) params.category = filters.category;
  if (filters.search)   params.search   = filters.search;

  const res = await api.get<APIResponse<Shop[]>>('/admin/shops', { params });
  return res.data.data ?? [];
}

export async function fetchStats(): Promise<StatsResponse> {
  const res = await api.get<APIResponse<StatsResponse>>('/admin/stats');
  return res.data.data!;
}

export async function createShop(payload: CreateShopPayload): Promise<Shop> {
  const res = await api.post<APIResponse<Shop>>('/admin/shops', payload);
  return res.data.data!;
}

export async function updateShop(id: number, payload: UpdateShopPayload): Promise<Shop> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) clean[k] = v;
  }
  if (!clean.phone) clean.phone = '';
  const res = await api.put<APIResponse<Shop>>(`/admin/shops/${id}`, clean);
  return res.data.data!;
}

export async function deleteShop(id: number): Promise<void> {
  await api.delete(`/admin/shops/${id}`);
}

export async function toggleShopStatus(id: number): Promise<Shop> {
  const res = await api.patch<APIResponse<Shop>>(`/admin/shops/${id}/toggle`);
  return res.data.data!;
}
