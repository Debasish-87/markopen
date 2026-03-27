import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { Spinner, Toast } from '../shared';
import ShopFormModal from './ShopFormModal';
import { login, fetchAdminShops, fetchStats, toggleShopStatus, deleteShop as deleteShop_api, createShop, updateShop } from '../../api/client';
import { CAT_META } from '../../lib/constants';
import type { Shop, StatsResponse, CreateShopPayload, ToastNotification } from '../../types';
import ImageApprovalPanel from './ImageApprovalPanel';

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)',
    borderRadius: 7, color: 'var(--adm-text)',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '.88rem',
    outline: 'none', marginBottom: '.9rem', display: 'block',
    transition: 'border-color .2s',
  };

  const handleLogin = async (): Promise<void> => {
    if (!username || !password) { setError('Both fields are required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await login({ username, password });
      setAuth(res.token, res.username);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Login failed. Check credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 16, padding: '2.8rem', width: 370, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--adm-text)', marginBottom: '.2rem' }}>
          Mark<span style={{ color: 'var(--adm-amber)' }}>o</span>pen
        </div>
        <div style={{ color: 'var(--adm-muted)', fontSize: '.7rem', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '2rem' }}>Admin Access</div>
        <input
          style={inputStyle} placeholder="Username" value={username} autoComplete="username"
          onChange={e => setUsername(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--adm-amber)'}
          onBlur={e => e.target.style.borderColor = 'var(--adm-border)'}
          onKeyDown={e => e.key === 'Enter' && document.getElementById('pw-input')?.focus()}
        />
        <input
          id="pw-input" style={inputStyle} placeholder="Password" type="password" value={password} autoComplete="current-password"
          onChange={e => setPassword(e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--adm-amber)'}
          onBlur={e => e.target.style.borderColor = 'var(--adm-border)'}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button
          onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: 12, background: loading ? '#888' : 'var(--adm-amber)', color: '#1A1208', border: 'none', borderRadius: 7, fontFamily: "'Syne', sans-serif", fontSize: '.88rem', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'opacity .2s' }}
        >
          {loading ? 'Signing in…' : 'Sign In →'}
        </button>
        {error && <div style={{ color: 'var(--adm-red)', fontSize: '.78rem', marginTop: '.6rem' }}>{error}</div>}
        <div style={{ marginTop: '1.4rem', fontSize: '.7rem', color: 'var(--adm-muted)', fontFamily: "'JetBrains Mono', monospace" }}>Default: admin / admin123</div>
      </div>
    </div>
  );
};

// ─── ACTION BUTTON ────────────────────────────────────────────────────────────
const ActionButton: React.FC<{ label: string; onClick: () => void; hoverColor: string }> = ({ label, onClick, hoverColor }) => (
  <button
    onClick={onClick}
    style={{ padding: '6px 11px', borderRadius: 6, border: '1.5px solid var(--adm-border)', background: 'transparent', color: 'var(--adm-muted)', fontSize: '.78rem', cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = hoverColor; e.currentTarget.style.color = hoverColor; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--adm-border)'; e.currentTarget.style.color = 'var(--adm-muted)'; }}
  >{label}</button>
);

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// ─── DELETE CONFIRM MODAL (2-step) ───────────────────────────────────────────
const DeleteConfirmModal: React.FC<{
  shop: Shop;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}> = ({ shop, onConfirm, onCancel }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [typedName, setTypedName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (step === 2) setTimeout(() => inputRef.current?.focus(), 80);
  }, [step]);

  const handleFinalDelete = async () => {
    if (typedName !== shop.name) return;
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '1rem' }}
    >
      <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,.6)', overflow: 'hidden' }}>

        {/* Red danger header */}
        <div style={{ background: 'rgba(248,113,113,.12)', borderBottom: '1px solid rgba(248,113,113,.2)', padding: '1.4rem 1.8rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(248,113,113,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🗑</div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1rem', color: 'var(--adm-red)' }}>Delete Shop</div>
            <div style={{ fontSize: '.72rem', color: 'var(--adm-muted)', marginTop: 2 }}>Step {step} of 2 — This cannot be undone</div>
          </div>
          <button onClick={onCancel} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--adm-muted)', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '1.6rem 1.8rem' }}>

          {step === 1 && (
            <>
              {/* Shop preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--adm-surf2)', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--adm-bg)', border: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', overflow: 'hidden', flexShrink: 0 }}>
                  {shop.photo_url ? <img src={shop.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : shop.icon || '🏪'}
                </div>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.95rem', color: 'var(--adm-text)' }}>{shop.name}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--adm-muted)', marginTop: 2 }}>{shop.category} · {shop.subcat}</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>{shop.address}</div>
                </div>
              </div>

              <p style={{ fontSize: '.86rem', color: 'var(--adm-text)', lineHeight: 1.6, marginBottom: '1.4rem' }}>
                You are about to permanently delete <strong style={{ color: 'var(--adm-red)' }}>{shop.name}</strong>. All shop data, photos, and associated records will be removed and <strong>cannot be recovered</strong>.
              </p>

              <div style={{ display: 'flex', gap: '.7rem' }}>
                <button onClick={onCancel} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--adm-border)', background: 'transparent', color: 'var(--adm-muted)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.84rem', cursor: 'pointer' }}>Cancel</button>
                <button
                  onClick={() => setStep(2)}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'rgba(248,113,113,.15)', color: 'var(--adm-red)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.84rem', cursor: 'pointer', transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.15)'; }}
                >
                  Yes, continue →
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, padding: '.85rem 1rem', marginBottom: '1.2rem', fontSize: '.82rem', color: 'var(--adm-red)', lineHeight: 1.55 }}>
                ⚠ Final confirmation required. Type the shop name exactly to proceed.
              </div>

              <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.5rem', fontWeight: 700 }}>
                Type <span style={{ color: 'var(--adm-red)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0, textTransform: 'none', fontWeight: 700 }}>{shop.name}</span> to confirm
              </label>
              <input
                ref={inputRef}
                value={typedName}
                onChange={e => setTypedName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && typedName === shop.name && handleFinalDelete()}
                placeholder={shop.name}
                style={{ width: '100%', padding: '11px 13px', background: 'var(--adm-surf2)', border: `1.5px solid ${typedName && typedName !== shop.name ? 'var(--adm-red)' : typedName === shop.name ? 'var(--adm-green)' : 'var(--adm-border)'}`, borderRadius: 8, color: 'var(--adm-text)', fontFamily: "'JetBrains Mono', monospace", fontSize: '.88rem', outline: 'none', boxSizing: 'border-box', marginBottom: '.3rem', transition: 'border-color .15s' }}
              />
              {typedName && typedName !== shop.name && (
                <p style={{ fontSize: '.7rem', color: 'var(--adm-red)', marginBottom: '.8rem' }}>Name doesn't match — check spelling and capitalisation</p>
              )}
              {typedName === shop.name && (
                <p style={{ fontSize: '.7rem', color: 'var(--adm-green)', marginBottom: '.8rem' }}>✓ Name confirmed</p>
              )}

              <div style={{ display: 'flex', gap: '.7rem', marginTop: '.8rem' }}>
                <button onClick={() => { setStep(1); setTypedName(''); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid var(--adm-border)', background: 'transparent', color: 'var(--adm-muted)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.84rem', cursor: 'pointer' }}>← Back</button>
                <button
                  onClick={handleFinalDelete}
                  disabled={typedName !== shop.name || deleting}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: typedName === shop.name && !deleting ? 'var(--adm-red)' : 'rgba(248,113,113,.2)', color: typedName === shop.name && !deleting ? '#fff' : 'rgba(248,113,113,.5)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.84rem', cursor: typedName === shop.name && !deleting ? 'pointer' : 'not-allowed', transition: 'all .15s' }}
                >
                  {deleting ? 'Deleting…' : '🗑 Delete Forever'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard: React.FC<{ onGoPublic: () => void }> = ({ onGoPublic }) => {
  const { username, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'shops' | 'images'>('shops');
  const [shops, setShops] = useState<Shop[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [editShop, setEditShop] = useState<Shop | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [deleteShop, setDeleteShop] = useState<Shop | null>(null);

  const showToast = useCallback((msg: string, type: ToastNotification['type'] = 'success') => setToast({ msg, type }), []);

  const loadStats = useCallback(async () => {
    try { const st = await fetchStats(); setStats(st); } catch { /* non-critical */ }
  }, []);

  const loadShops = useCallback(async () => {
    try {
      const data = await fetchAdminShops({ search: searchQ });
      setShops(data);
    } catch { showToast('Failed to fetch shops.', 'error'); }
    finally { setLoading(false); }
  }, [searchQ, showToast]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadShops(), loadStats()]);
  }, [loadShops, loadStats]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleToggle = async (id: number): Promise<void> => {
    try {
      const updated = await toggleShopStatus(id);
      // Optimistic local update — only refresh stats, not the whole list
      setShops(prev => prev.map(s => s.id === id ? updated : s));
      await loadStats();
      showToast(`${updated.name} is now ${updated.is_open ? '🟢 Open' : '🔴 Closed'}`);
    } catch { showToast('Failed to toggle status.', 'error'); }
  };

  const handleDelete = async (shop: Shop): Promise<void> => {
    setDeleteShop(shop);
  };

  const confirmDelete = async (): Promise<void> => {
    if (!deleteShop) return;
    try {
      await deleteShop_api(deleteShop.id);
      setShops(prev => prev.filter(s => s.id !== deleteShop.id));
      await loadStats();
      showToast(`${deleteShop.name} deleted.`, 'error');
    } catch { showToast('Failed to delete shop.', 'error'); }
    finally { setDeleteShop(null); }
  };

  const handleSave = async (data: CreateShopPayload): Promise<void> => {
    setSaving(true);
    try {
      if (editShop != null && editShop.id != null) {
        const updated = await updateShop(editShop.id, data);
        setShops(prev => prev.map(s => s.id === editShop.id ? updated : s));
        showToast(`${updated.name} updated!`);
      } else {
        const created = await createShop(data);
        setShops(prev => [created, ...prev]);
        showToast(`${created.name} added!`);
      }
      await loadStats();
      setEditShop(undefined);
    } catch (err: unknown) {
      console.error('Save shop error:', err);
      const axiosErr = err as { response?: { data?: { error?: string; message?: string }; status?: number } };
      const backendMsg = axiosErr?.response?.data?.error || axiosErr?.response?.data?.message;
      const status = axiosErr?.response?.status;
      const displayMsg = backendMsg
        ? `Save failed (${status}): ${backendMsg}`
        : 'Save failed — check browser console for details';
      showToast(displayMsg, 'error');
    }
    finally { setSaving(false); }
  };

  const statCards = useMemo(() => stats ? [
    { label: 'Total', value: stats.total, color: 'var(--adm-amber)' },
    { label: 'Open', value: stats.open, color: 'var(--adm-green)' },
    { label: 'Closed', value: stats.closed, color: 'var(--adm-red)' },
    { label: 'Rate', value: `${stats.open_rate}%`, color: 'var(--adm-amber)' },
  ] : [], [stats]);

  // Client-side filtering — server already filters by search term, this handles
  // instant filtering while the user types before the debounce fires
  const filtered = useMemo(() => {
    const q = searchQ.toLowerCase();
    if (!q) return shops;
    return shops.filter(s => [s.name, s.category, s.subcat, s.address].some(x => x.toLowerCase().includes(q)));
  }, [shops, searchQ]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--adm-bg)', color: 'var(--adm-text)' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--adm-surf)', borderBottom: '1px solid var(--adm-border)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', fontWeight: 800 }}>Mark<span style={{ color: 'var(--adm-amber)' }}>o</span>pen</div>
          <span style={{ background: 'var(--adm-amber)', color: '#1A1208', fontSize: '.58rem', fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 4 }}>Admin</span>
          {username && <span style={{ fontSize: '.75rem', color: 'var(--adm-muted)' }}>👤 {username}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <button
            onClick={onGoPublic}
            style={{ padding: '8px 17px', borderRadius: 7, border: '1.5px solid var(--adm-border)', background: 'transparent', color: 'var(--adm-muted)', fontFamily: "'Syne', sans-serif", fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'color .15s, border-color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--adm-text)'; e.currentTarget.style.borderColor = 'var(--adm-text)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--adm-muted)'; e.currentTarget.style.borderColor = 'var(--adm-border)'; }}
          >← Public Site</button>

          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '.3rem', background: 'var(--adm-surf2)', borderRadius: 8, padding: '3px' }}>
            {([['shops', '🏪 Shops'], ['images', '📋 Shop Requests']] as const).map(([tab, label]) => {
              const pendingCount = tab === 'images' ? (JSON.parse(localStorage.getItem('markopen_sk_requests') || '[]') as { status: string }[]).filter(r => r.status === 'pending').length : 0;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', fontFamily: "'Syne', sans-serif", fontSize: '.76rem', fontWeight: 700, cursor: 'pointer', transition: 'all .15s', background: activeTab === tab ? 'var(--adm-amber)' : 'transparent', color: activeTab === tab ? '#1A1208' : 'var(--adm-muted)', position: 'relative' }}
                >
                  {label}
                  {pendingCount > 0 && (
                    <span style={{ position: 'absolute', top: -4, right: -4, background: '#F87171', color: '#fff', fontSize: '.55rem', fontWeight: 800, padding: '1px 5px', borderRadius: 10, lineHeight: 1.6 }}>{pendingCount}</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setEditShop(null)}
            style={{ padding: '8px 17px', borderRadius: 7, border: 'none', background: 'var(--adm-amber)', color: '#1A1208', fontFamily: "'Syne', sans-serif", fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity .15s' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >＋ Add Shop</button>
          <button
            onClick={logout}
            style={{ padding: '8px 17px', borderRadius: 7, border: '1.5px solid rgba(248,113,113,.2)', background: 'rgba(248,113,113,.08)', color: 'var(--adm-red)', fontFamily: "'Syne', sans-serif", fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'background .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.08)'; }}
          >Sign Out</button>
        </div>
      </div>

      {activeTab === 'images' ? (
        <ImageApprovalPanel />
      ) : (
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '2.2rem 2rem' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '.9rem', marginBottom: '2.2rem' }}>
            {statCards.map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '1.2rem 1.4rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.6 }} />
                <div style={{ fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--adm-muted)', marginBottom: '.4rem' }}>{label}</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.3rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.35rem', fontWeight: 800 }}>Shop Directory</h2>
            <input
              value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="🔍  Search shops…" aria-label="Search shops"
              style={{ padding: '9px 13px', background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)', borderRadius: 7, color: 'var(--adm-text)', fontSize: '.83rem', outline: 'none', width: 220, transition: 'border-color .2s' }}
              onFocus={e => e.target.style.borderColor = 'var(--adm-amber)'}
              onBlur={e => e.target.style.borderColor = 'var(--adm-border)'}
            />
          </div>

          {/* Table */}
          <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 12, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
                <Spinner color="var(--adm-amber)" /><span style={{ color: 'var(--adm-muted)' }}>Loading…</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-surf2)', borderBottom: '1px solid var(--adm-border)' }}>
                    {['Shop', 'Category', 'Hours', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: '.62rem', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--adm-muted)', fontWeight: 700 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--adm-muted)', fontStyle: 'italic' }}>No shops found.</td></tr>
                  ) : filtered.map(s => {
                    const m = CAT_META[s.category];
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--adm-border)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--adm-surf2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--adm-border)' }}>
                              {s.photo_url ? <img src={s.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : s.icon}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '.87rem' }}>{s.name}</div>
                              <div style={{ fontSize: '.68rem', color: 'var(--adm-muted)', marginTop: 2 }}>{s.address}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ display: 'inline-block', fontSize: '.62rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: m.bg + '33', color: m.color }}>{s.category}</span>
                          <span style={{ fontSize: '.78rem', color: 'var(--adm-muted)', marginLeft: 6 }}>{s.subcat}</span>
                        </td>
                        <td style={{ padding: '14px 18px', fontSize: '.82rem', color: 'var(--adm-muted)' }}>{s.hours || '—'}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <button
                            onClick={() => handleToggle(s.id)}
                            title={`Click to mark as ${s.is_open ? 'closed' : 'open'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 20, fontSize: '.7rem', fontWeight: 700, fontFamily: "'Syne', sans-serif", border: 'none', cursor: 'pointer', background: s.is_open ? 'rgba(52,211,153,.1)' : 'rgba(248,113,113,.1)', color: s.is_open ? 'var(--adm-green)' : 'var(--adm-red)', transition: 'opacity .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '.75'; }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                          >
                            <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: s.is_open ? 'var(--adm-green)' : 'var(--adm-red)', animation: s.is_open ? 'adminPulse 1.4s infinite' : 'none' }} />
                            {s.is_open ? 'Open' : 'Closed'}
                          </button>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', gap: '.4rem' }}>
                            <ActionButton label="✏ Edit" hoverColor="var(--adm-amber)" onClick={() => setEditShop(s)} />
                            <ActionButton label="🗑 Delete" hoverColor="var(--adm-red)" onClick={() => handleDelete(s)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {editShop !== undefined && (
        <ShopFormModal shop={editShop} onSave={handleSave} onClose={() => setEditShop(undefined)} saving={saving} />
      )}
      {deleteShop && (
        <DeleteConfirmModal shop={deleteShop} onConfirm={confirmDelete} onCancel={() => setDeleteShop(null)} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
};

// ─── ADMIN PAGE (auth gate) ───────────────────────────────────────────────────
const AdminPage: React.FC<{ onGoPublic: () => void }> = ({ onGoPublic }) => {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const h = () => logout();
    window.addEventListener('auth:logout', h);
    return () => window.removeEventListener('auth:logout', h);
  }, [logout]);

  if (!isAuthenticated) return <LoginScreen />;
  return <Dashboard onGoPublic={onGoPublic} />;
};

export default AdminPage;