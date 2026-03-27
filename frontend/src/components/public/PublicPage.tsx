// src/components/public/PublicPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatTag, StatusBadge, SkeletonCard, EmptyState } from '../shared';
import { fetchShops } from '../../api/client';
import { CAT_META, SUBCATS, CATEGORIES, POLL_INTERVAL_MS, DEBOUNCE_DELAY_MS } from '../../lib/constants';
import { useDebounce } from '../../hooks/useDebounce';
import type { Shop, Category, StatusFilter, ShopFilters } from '../../types';
import FeedbackSection from "../shared/FeedbackSection";
import { useUserAuthStore } from '../../hooks/useUserAuthStore';
import { useFavoritesStore } from '../../hooks/useFavoritesStore';
import UserAuthModal from './UserAuthModal';
import Pagination from "../shared/Pagination";
import { useSEO, buildWebSiteSchema, buildItemListSchema } from '../../hooks/useSEO';

// ─── SHOP CARD ────────────────────────────────────────────────────────────────
const ShopCard: React.FC<{
  shop: Shop; index: number;
  onClick: (s: Shop) => void;
  isFav: boolean;
  onToggleFav: (e: React.MouseEvent) => void;
  isPinned?: boolean;
}> = ({ shop, index, onClick, isFav, onToggleFav, isPinned }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.article
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      role="button" tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter") onClick(shop); }}
      aria-label={`View details for ${shop.name}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        background: 'var(--card)',
        border: `1.5px solid ${isPinned ? 'rgba(217,48,37,.3)' : hovered ? '#c8c4bc' : 'var(--border)'}`,
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isPinned
          ? '0 0 0 3px rgba(217,48,37,.08), var(--shadow-sm)'
          : hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-sm)',
        transition: 'transform .22s, box-shadow .22s, border-color .22s',
        outline: hovered ? '2px solid var(--amber)' : 'none',
        outlineOffset: 2, position: 'relative',
      }}
    >
      {isPinned && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, rgba(217,48,37,.6), rgba(217,48,37,.2))',
        }} />
      )}

      <button
        onClick={onToggleFav}
        title={isFav ? 'Remove from favourites' : 'Save to favourites'}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 10,
          width: 30, height: 30, borderRadius: '50%',
          background: isFav ? 'rgba(217,48,37,.1)' : 'var(--card)',
          border: `1.5px solid ${isFav ? 'rgba(217,48,37,.3)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.85rem', cursor: 'pointer',
          transition: 'all .2s', backdropFilter: 'blur(4px)',
        }}
      >
        {isFav ? '❤️' : '🤍'}
      </button>

      <div onClick={() => onClick(shop)} style={{ padding: '1.2rem 1.2rem .7rem', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0, background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {(shop.logo_url || shop.photo_url)
            ? <img src={shop.logo_url || shop.photo_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : CAT_META[shop.category].icon}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
          <div style={{ marginBottom: 4 }}><CatTag cat={shop.category} subcat={shop.subcat} /></div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '.98rem', fontWeight: 700, color: 'var(--dark)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.name}</div>
        </div>
        <StatusBadge open={shop.is_open} />
      </div>
      <div style={{ borderTop: '1px solid var(--border)', margin: '0 1.2rem' }} />
      <div onClick={() => onClick(shop)} style={{ padding: '.8rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
        <div style={{ fontSize: '.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
          <span style={{ flexShrink: 0 }}>📍</span>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.address || 'Address not set'}</span>
        </div>
        <div style={{ fontSize: '.73rem', background: 'var(--bg2)', color: 'var(--dark)', padding: '4px 10px', borderRadius: 5, fontWeight: 500, flexShrink: 0, border: '1px solid var(--border)' }}>{shop.hours || '—'}</div>
      </div>
    </motion.article>
  );
};

// ─── SHOP MODAL ───────────────────────────────────────────────────────────────
const ShopModal: React.FC<{ shop: Shop; onClose: () => void }> = ({ shop, onClose }) => {
  const m = CAT_META[shop.category];

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label={`${shop.name} details`}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(10,10,8,.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 500, backdropFilter: 'blur(7px)', padding: '1rem',
        animation: 'fadeIn .2s ease',
      }}
    >
      <div style={{
        background: 'var(--card)', borderRadius: 20, width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto',
        animation: 'slideIn .25s ease', boxShadow: '0 24px 64px rgba(0,0,0,.35)',
      }}>

        {/* ── Banner ── */}
        <div style={{ position: 'relative' }}>
          {/* Banner image / fallback */}
          <div style={{ height: 200, borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
            {shop.photo_url ? (
              <img
                src={shop.photo_url}
                alt={shop.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: `linear-gradient(135deg, ${m.bg} 0%, ${m.color}44 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '5rem',
              }}>
                {m.icon}
              </div>
            )}
          </div>

          {/* Gradient overlay on banner */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 200,
            background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.6) 100%)',
            pointerEvents: 'none', borderRadius: '20px 20px 0 0',
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 13, right: 13,
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,0,0,.5)', border: 'none', color: '#fff',
              fontSize: '1rem', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(6px)',
            }}
          >✕</button>

          {/* Open/Closed pill */}
          <div style={{
            position: 'absolute', bottom: 44, right: 16,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 30,
            fontFamily: "'Syne', sans-serif", fontSize: '.72rem', fontWeight: 700,
            letterSpacing: '.07em', backdropFilter: 'blur(8px)',
            background: shop.is_open ? 'rgba(26,158,92,.88)' : 'rgba(217,48,37,.88)',
            color: '#fff',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#fff',
              display: 'inline-block',
              animation: shop.is_open ? 'blinkDot 1.3s infinite' : 'none',
            }} />
            {shop.is_open ? 'Open Now' : 'Closed'}
          </div>

          {/* Logo circle — overlaps banner/body seam */}
          <div style={{
            position: 'absolute', bottom: -28, left: 20,
            width: 68, height: 68, borderRadius: '50%',
            border: '3.5px solid var(--card)',
            background: 'var(--card)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', zIndex: 10,
          }}>
            {(shop.logo_url || shop.photo_url)
              ? <img src={shop.logo_url || shop.photo_url} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              : <span>{m.icon}</span>
            }
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '2.6rem 1.7rem 1.7rem' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.45rem', fontWeight: 800, color: 'var(--dark)', marginBottom: '.35rem', lineHeight: 1.15 }}>
            {shop.name}
          </h2>
          <div style={{ marginBottom: '.6rem' }}>
            <CatTag cat={shop.category} subcat={shop.subcat} size="md" />
          </div>
          <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            📍 {shop.address || 'Address not set'}
          </div>

          {shop.description && (
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.76, borderLeft: '3px solid var(--amber)', paddingLeft: 13, marginBottom: '1.4rem' }}>
              {shop.description}
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem', marginBottom: '1.4rem' }}>
            {([
              ...(shop.show_phone ? [['📞 Phone', shop.phone || '—'] as [string, string]] : []),
              ['🕐 Hours', shop.hours || '—'],
              ['🏷 Category', shop.category],
              ['🍴 Type', shop.subcat],
            ] as [string, string][]).map(([lbl, val]) => (
              <div key={lbl} style={{ background: 'var(--bg)', borderRadius: 8, padding: '.8rem 1rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{lbl}</div>
                <div style={{ fontSize: '.86rem', fontWeight: 500, color: 'var(--dark)' }}>{val}</div>
              </div>
            ))}
          </div>

          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1.5px solid var(--border)', height: 185 }}>
            {shop.map_query
              ? <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(shop.map_query)}`}
                target="_blank"
                rel="noreferrer noopener"
                style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--bg2)', textDecoration: 'none', transition: 'background .18s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg2)'; }}
              >
                <span style={{ fontSize: '2rem' }}>📍</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.88rem', color: 'var(--dark)' }}>Open in Google Maps</span>
                <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{shop.map_query}</span>
                <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--amber)', letterSpacing: '.06em' }}>Tap to get directions ↗</span>
              </a>
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', color: 'var(--muted)' }}>📍 Location not set</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PUBLIC PAGE ──────────────────────────────────────────────────────────────
const PublicPage: React.FC<{ onGoAdmin?: () => void; onGoFavorites: () => void; onGoShopkeeper: () => void; initialFilter?: string | null; onFilterApplied?: () => void }> = ({ onGoFavorites, onGoShopkeeper, initialFilter, onFilterApplied }) => {
  const { isLoggedIn, username, logout } = useUserAuthStore();
  const { toggleFavorite, isFavorite, getFavorites } = useFavoritesStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Shop | null>(null);
  const [filters, setFilters] = useState<ShopFilters>({ category: '', subcat: '', status: 'all', search: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const shopsPerPage = 9;

  useEffect(() => {
    if (!initialFilter) return;
    if (initialFilter === 'all') {
      setFilters({ category: '', subcat: '', status: 'all', search: '' });
    } else if (initialFilter === 'open') {
      setFilters({ category: '', subcat: '', status: 'open', search: '' });
    } else {
      setFilters({ category: initialFilter as Category, subcat: '', status: 'all', search: '' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onFilterApplied?.();
  }, [initialFilter]);

  const seoDescription = filters.category
    ? `Browse ${filters.category} shops near you — check hours and find what's open right now.`
    : `Find open shops near you — browse local businesses by category, check hours, and discover what's open right now.`;

  useSEO({
    title: filters.category ? `${filters.category} Shops` : undefined,
    description: seoDescription,
    structuredData: [
      buildWebSiteSchema(),
      ...(shops.length > 0 ? [buildItemListSchema(shops.map(s => ({
        name: s.name,
        url: `https://markopen.app?shop=${s.id}`,
        description: s.description || `${s.name} — ${s.category} at ${s.address}`,
        image: s.photo_url || undefined,
      })))] : []),
    ],
  });

  interface OpenToast { id: number; name: string; isFav: boolean; }
  const [openToasts, setOpenToasts] = useState<OpenToast[]>([]);
  const prevShopsRef = React.useRef<Shop[]>([]);
  const isFirstLoad = React.useRef(true);

  const addOpenToast = useCallback((shop: Shop, isFav: boolean) => {
    const id = Date.now() + Math.random();
    setOpenToasts(t => [...t, { id, name: shop.name, isFav }]);
    setTimeout(() => setOpenToasts(t => t.filter(x => x.id !== id)), 5000);
  }, []);

  const debouncedSearch = useDebounce(filters.search, DEBOUNCE_DELAY_MS);
  const activeFilters = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);

  const load = useCallback(async () => {
    try {
      const data = await fetchShops(activeFilters);

      if (!isFirstLoad.current && prevShopsRef.current.length > 0) {
        const currentFavIds = isLoggedIn && username
          ? (JSON.parse(localStorage.getItem('markopen_favorites') || '{}') as Record<string, number[]>)[username] ?? []
          : [];
        data.forEach(newShop => {
          const prev = prevShopsRef.current.find(s => s.id === newShop.id);
          if (prev && !prev.is_open && newShop.is_open) {
            addOpenToast(newShop, currentFavIds.includes(newShop.id));
          }
        });
      }

      isFirstLoad.current = false;
      prevShopsRef.current = data;
      setShops(data); setError('');
    } catch {
      setError('Failed to load shops. Is the backend running?');
    } finally { setLoading(false); }
  }, [activeFilters, isLoggedIn, username, addOpenToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id = setInterval(load, POLL_INTERVAL_MS); return () => clearInterval(id); }, [load]);

  const handleHeartClick = (e: React.MouseEvent, shopId: number) => {
    e.stopPropagation();
    if (!isLoggedIn) { setShowAuthModal(true); return; }
    toggleFavorite(username!, shopId);
  };

  const favIds = useMemo(() => isLoggedIn && username ? getFavorites(username) : [], [isLoggedIn, username, getFavorites, shops]); // eslint-disable-line
  const favCount = favIds.length;
  const [openFirst, setOpenFirst] = useState(false);
  const openCount = useMemo(() => shops.filter(s => s.is_open).length, [shops]);

  const sortedShops = useMemo(() => {
    let list = openFirst
      ? [...shops].sort((a, b) => (b.is_open ? 1 : 0) - (a.is_open ? 1 : 0))
      : [...shops];
    if (isLoggedIn && username && favIds.length > 0) {
      list = [...list.filter(s => favIds.includes(s.id)), ...list.filter(s => !favIds.includes(s.id))];
    }
    return list;
  }, [shops, openFirst, isLoggedIn, username, favIds]);

  const paginatedShops = sortedShops.slice((currentPage - 1) * shopsPerPage, currentPage * shopsPerPage);
  const totalPages = Math.ceil(sortedShops.length / shopsPerPage);

  const catBtnStyle = (cat: Category | 'all'): React.CSSProperties => {
    const isActive = cat === 'all' ? !filters.category : filters.category === cat;
    const color = cat === 'all' ? '#111108' : CAT_META[cat as Category].color;
    return {
      display: 'flex', alignItems: 'center', gap: 9, padding: '10px 20px', borderRadius: 50,
      fontFamily: "'Syne', sans-serif", fontSize: '.84rem', fontWeight: 700, cursor: 'pointer',
      transition: 'all .22s',
      border: `2px solid ${isActive ? color : 'var(--border)'}`,
      background: isActive ? color : '#fff',
      color: isActive ? '#fff' : 'var(--dark)',
      boxShadow: isActive ? `0 4px 12px ${color}33` : 'none',
    };
  };

  return (
    <motion.div
      style={{ minHeight: '100vh', background: 'var(--bg)' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', height: 66, borderBottom: '2.5px solid var(--amber)' }}>
        <div
          role="button"
          tabIndex={0}
          aria-label="Go to home"
          onClick={() => {
            setFilters({ category: '', subcat: '', status: 'all', search: '' });
            setCurrentPage(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setFilters({ category: '', subcat: '', status: 'all', search: '' });
              setCurrentPage(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.9rem', fontWeight: 800, color: '#fff', letterSpacing: -1, cursor: 'pointer', userSelect: 'none' }}
        >Mark<span style={{ color: 'var(--amber)' }}>o</span>pen</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--glow)', display: 'inline-block', animation: 'blinkDot 1.4s infinite' }} />
            <span style={{ fontSize: '.65rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#aaa' }}>Live</span>
          </div>

          {isLoggedIn ? (
            <button
              onClick={onGoFavorites}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.75rem', padding: '7px 14px', border: '1.5px solid rgba(217,48,37,.35)', borderRadius: 5, color: '#f87171', background: 'rgba(217,48,37,.08)', fontFamily: "'Syne', sans-serif", cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217,48,37,.08)'; }}
            >
              ❤️
              {favCount > 0 && <span style={{ background: 'var(--red)', color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: 10, lineHeight: 1.6 }}>{favCount}</span>}
              Favourites
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.75rem', padding: '7px 14px', border: '1.5px solid #2e2e2e', borderRadius: 5, color: '#aaa', background: 'transparent', fontFamily: "'Syne', sans-serif", cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.color = '#aaa'; }}
            >🤍 Sign in to Save</button>
          )}

          {isLoggedIn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <span style={{ fontSize: '.72rem', color: '#888', fontFamily: "'Syne', sans-serif" }}>👤 {username}</span>
              <button onClick={logout} style={{ fontSize: '.68rem', padding: '5px 10px', border: '1px solid #333', borderRadius: 4, color: '#666', background: 'transparent', cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>Sign Out</button>
            </div>
          )}

          <button onClick={onGoShopkeeper}
            style={{ fontSize: '.75rem', padding: '7px 15px', border: '1.5px solid #2e2e2e', borderRadius: 5, color: '#aaa', background: 'transparent', fontFamily: "'Syne', sans-serif", transition: 'border-color .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4880A'; e.currentTarget.style.color = '#D4880A'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.color = '#aaa'; }}
          >🏪 Shopkeeper</button>


        </div>
      </header>

      <AnimatePresence>
        import UserAuthModal from '../../components/public/UserAuthModal';
      </AnimatePresence>

      {/* Ticker */}
      <div style={{ background: 'var(--amber)', overflow: 'hidden', whiteSpace: 'nowrap', padding: '6px 0' }}>
        <span style={{ display: 'inline-block', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dark)', animation: 'ticker 30s linear infinite' }}>
          {shops.filter(s => s.is_open).map(s => `✦ ${s.name} is OPEN`).join('   ') || '✦ Fetching live status…'}
        </span>
      </div>

      {/* Hero */}
      <section style={{ padding: '4rem 2.5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '.62rem', letterSpacing: '.25em', textTransform: 'uppercase', color: 'var(--amber)', marginBottom: '.75rem' }}>✦ Real-time Shop Status</p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2.6rem,5vw,4.8rem)', lineHeight: 1.06, marginBottom: '.9rem' }}>
          Find What's <em style={{ color: 'var(--amber)', fontStyle: 'italic' }}>Open</em><br />Right Now.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.97rem', maxWidth: 400, lineHeight: 1.72 }}>
          Search shops, browse by category, and check live status — all in one place.
        </p>
      </section>

      {/* Search */}
      <div style={{ maxWidth: 1100, margin: '1.5rem auto 0', padding: '0 2.5rem' }}>
        <div style={{ position: 'relative', maxWidth: 540 }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, subcat: '' }))}
            placeholder="Search shop name, type, location…"
            aria-label="Search shops"
            style={{ width: '100%', padding: '14px 18px 14px 50px', border: '2px solid var(--border)', borderRadius: 10, background: 'var(--card)', fontSize: '.94rem', color: 'var(--dark)', outline: 'none', transition: 'border-color .15s, box-shadow .15s', boxShadow: 'var(--shadow-sm)' }}
            onFocus={e => { e.target.style.borderColor = 'var(--amber)'; e.target.style.boxShadow = '0 0 0 3px rgba(212,136,10,.12)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
          />
        </div>
      </div>

      {/* Category chips */}
      <div style={{ maxWidth: 1100, margin: '2rem auto 0', padding: '0 2.5rem' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '.62rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '.9rem' }}>Browse by Category</div>
        <div style={{ display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
          <button style={catBtnStyle('all')} onClick={() => setFilters(f => ({ ...f, category: '', subcat: '', status: 'all' }))}>
            <span>🏪</span> All Shops
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} style={catBtnStyle(cat)} onClick={() => setFilters(f => ({ ...f, category: cat, subcat: '', status: 'all' }))}>
              <span>{CAT_META[cat].icon}</span> {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter */}
      {filters.category && (
        <div style={{ maxWidth: 1100, margin: '1.1rem auto 0', padding: '0 2.5rem', animation: 'fadeUp .2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginRight: '.3rem' }}>Status:</span>
            {(['all', 'open', 'closed'] as StatusFilter[]).map(s => {
              const active = filters.status === s;
              const colors: Record<StatusFilter, string> = { all: 'var(--dark)', open: 'var(--green)', closed: 'var(--red)' };
              const labels = { all: 'All', open: '🟢 Open', closed: '🔴 Closed' };
              return (
                <button key={s} onClick={() => setFilters(f => ({ ...f, status: s }))} style={{ padding: '7px 17px', borderRadius: 50, fontFamily: "'Syne', sans-serif", fontSize: '.79rem', fontWeight: 700, cursor: 'pointer', border: `2px solid ${active ? colors[s] : 'var(--border)'}`, background: active ? colors[s] : 'var(--card)', color: active ? '#fff' : 'var(--muted)', transition: 'all .15s' }}>{labels[s]}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subcategory pills */}
      {filters.category && SUBCATS[filters.category] && (
        <div style={{ maxWidth: 1100, margin: '.9rem auto 0', padding: '0 2.5rem', animation: 'fadeUp .25s ease' }}>
          <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
            {SUBCATS[filters.category].map(sub => {
              const active = filters.subcat === sub;
              return (
                <button key={sub} onClick={() => setFilters(f => ({ ...f, subcat: active ? '' : sub }))} style={{ padding: '6px 14px', borderRadius: 50, fontSize: '.77rem', fontWeight: 500, cursor: 'pointer', border: `1.5px solid ${active ? 'var(--dark)' : 'var(--border)'}`, background: active ? 'var(--dark)' : 'transparent', color: active ? '#fff' : 'var(--muted)', transition: 'all .15s' }}>{sub}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* Results header */}
      <div style={{ maxWidth: 1100, margin: '1.75rem auto .65rem', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '.78rem', color: 'var(--muted)' }}>
          {loading ? 'Loading…' : `${shops.length} shop${shops.length !== 1 ? 's' : ''} found`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{openCount}</span> open now
          </span>
          <button
            onClick={() => setOpenFirst(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: '.73rem', fontWeight: 700, transition: 'all .2s', border: `1.5px solid ${openFirst ? 'var(--green)' : 'var(--border)'}`, background: openFirst ? '#EDFAF3' : '#fff', color: openFirst ? 'var(--green)' : 'var(--muted)' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0, background: openFirst ? 'var(--green)' : '#bbb', animation: openFirst ? 'glowPulse 1.4s ease-in-out infinite' : 'none' }} />
            Open First
          </button>
        </div>
      </div>

      {/* Grid */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2.5rem 5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.2rem' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : error ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--red)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>⚠️</div>
            <p>{error}</p>
          </div>
        ) : sortedShops.length === 0 ? (
          <EmptyState title="No shops found" subtitle="Try a different search or filter." />
        ) : (
          <>
            {isLoggedIn && favIds.length > 0 && sortedShops.some(s => favIds.includes(s.id)) && (
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '-.2rem' }}>
                <span style={{ fontSize: '.62rem', fontFamily: "'Syne', sans-serif", letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--red)', fontWeight: 700 }}>❤ Favourites</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(217,48,37,.15)' }} />
              </div>
            )}
            {paginatedShops.map((shop, i) => {
              const isPinned = isLoggedIn && favIds.includes(shop.id);
              const prevIsPinned = i > 0 && isLoggedIn && favIds.includes(sortedShops[i - 1].id);
              const showDivider = isLoggedIn && favIds.length > 0 && !isPinned && prevIsPinned;
              return (
                <React.Fragment key={shop.id}>
                  {showDivider && (
                    <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: '.6rem', marginTop: '.4rem' }}>
                      <span style={{ fontSize: '.62rem', fontFamily: "'Syne', sans-serif", letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700 }}>All Shops</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                  )}
                  <ShopCard
                    shop={shop} index={i}
                    onClick={setSelected}
                    isFav={isLoggedIn ? isFavorite(username!, shop.id) : false}
                    onToggleFav={(e) => handleHeartClick(e, shop.id)}
                    isPinned={isPinned}
                  />
                </React.Fragment>
              );
            })}
          </>
        )}
      </main>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <Pagination totalPages={totalPages} currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </div>
      )}

      {selected && <ShopModal shop={selected} onClose={() => setSelected(null)} />}

      <FeedbackSection />

      {/* Open Notifications */}
      <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 800, display: 'flex', flexDirection: 'column', gap: '.6rem', pointerEvents: 'none' }}>
        {openToasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            style={{
              background: toast.isFav ? '#1A1208' : 'var(--card)',
              border: `1.5px solid ${toast.isFav ? 'var(--amber)' : 'var(--border)'}`,
              borderLeft: `4px solid ${toast.isFav ? 'var(--amber)' : 'var(--green)'}`,
              borderRadius: 10, padding: '.85rem 1.2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,.15)',
              display: 'flex', alignItems: 'center', gap: '.75rem',
              maxWidth: 300, pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{toast.isFav ? '❤️' : '🟢'}</span>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '.78rem', fontWeight: 800, color: toast.isFav ? 'var(--amber)' : 'var(--dark)', marginBottom: 2 }}>
                {toast.isFav ? '❤ Favourite is Open!' : 'Now Open'}
              </div>
              <div style={{ fontSize: '.82rem', color: toast.isFav ? '#ccc' : 'var(--dark)', fontWeight: 600 }}>
                {toast.name} is open now
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default PublicPage;