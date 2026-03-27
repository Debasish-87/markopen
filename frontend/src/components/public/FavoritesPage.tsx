// src/components/public/FavoritesPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CatTag, StatusBadge } from '../shared';
import { fetchShops } from '../../api/client';
import { CAT_META } from '../../lib/constants';
import { useFavoritesStore } from '../../hooks/useFavoritesStore';
import { useUserAuthStore } from '../../hooks/useUserAuthStore';
import type { Shop } from '../../types';

interface Props {
    onBack: () => void;
    onShopClick: (shop: Shop) => void;
}

const FavoritesPage: React.FC<Props> = ({ onBack, onShopClick }) => {
    const { username, logout } = useUserAuthStore();
    const { getFavorites, toggleFavorite, isFavorite } = useFavoritesStore();
    const [allShops, setAllShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchShops()
            .then(setAllShops)
            .finally(() => setLoading(false));
    }, []);

    const favIds = username ? getFavorites(username) : [];
    const favShops = allShops.filter(s => favIds.includes(s.id));

    return (
        <motion.div
            style={{ minHeight: '100vh', background: 'var(--bg)' }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
        >
            {/* Header */}
            <header style={{
                position: 'sticky', top: 0, zIndex: 100,
                background: 'var(--dark)', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                padding: '0 2.5rem', height: 66,
                borderBottom: '2.5px solid var(--amber)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none', border: '1.5px solid #2e2e2e',
                            borderRadius: 5, color: '#aaa', padding: '6px 12px',
                            fontFamily: "'Syne', sans-serif", fontSize: '.75rem',
                            cursor: 'pointer', transition: 'border-color .15s, color .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2e2e'; e.currentTarget.style.color = '#aaa'; }}
                    >
                        ← Back
                    </button>
                    <div style={{
                        fontFamily: "'Syne', sans-serif", fontSize: '1.9rem',
                        fontWeight: 800, color: '#fff', letterSpacing: -1,
                    }}>
                        Mark<span style={{ color: 'var(--amber)' }}>o</span>pen
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span style={{ fontSize: '.75rem', color: '#aaa', fontFamily: "'Syne', sans-serif" }}>
                        👤 {username}
                    </span>
                    <button
                        onClick={logout}
                        style={{
                            fontSize: '.72rem', padding: '6px 13px',
                            border: '1.5px solid rgba(248,113,113,.25)',
                            borderRadius: 5, color: 'var(--red)',
                            background: 'rgba(248,113,113,.07)',
                            fontFamily: "'Syne', sans-serif", cursor: 'pointer',
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section style={{ padding: '3.5rem 2.5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
                <p style={{
                    fontFamily: "'Syne', sans-serif", fontSize: '.62rem',
                    letterSpacing: '.25em', textTransform: 'uppercase',
                    color: 'var(--amber)', marginBottom: '.6rem',
                }}>✦ Your Collection</p>
                <h1 style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 'clamp(2.2rem,4vw,3.8rem)',
                    lineHeight: 1.08, marginBottom: '.7rem',
                }}>
                    Saved <em style={{ color: 'var(--amber)', fontStyle: 'italic' }}>Favourites</em>
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.7 }}>
                    {favShops.length === 0
                        ? 'No favourites yet — tap the ♥ on any shop to save it here.'
                        : `${favShops.length} shop${favShops.length !== 1 ? 's' : ''} saved · ${favShops.filter(s => s.is_open).length} open now`}
                </p>
            </section>

            {/* Grid */}
            <main style={{
                maxWidth: 1100, margin: '0 auto',
                padding: '0 2.5rem 5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                gap: '1.2rem',
            }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>
                        Loading…
                    </div>
                ) : favShops.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', color: 'var(--muted)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🤍</div>
                        <h3 style={{
                            fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem',
                            color: 'var(--dark)', marginBottom: '.4rem',
                        }}>No favourites yet</h3>
                        <p style={{ fontSize: '.9rem' }}>Browse shops and tap ♥ to save them here.</p>
                        <button
                            onClick={onBack}
                            style={{
                                marginTop: '1.5rem', padding: '10px 24px',
                                background: 'var(--amber)', color: '#1A1208',
                                border: 'none', borderRadius: 8,
                                fontFamily: "'Syne', sans-serif", fontSize: '.85rem',
                                fontWeight: 700, cursor: 'pointer',
                            }}
                        >
                            Browse Shops →
                        </button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {favShops.map((shop, i) => (
                            <FavCard
                                key={shop.id}
                                shop={shop}
                                index={i}
                                isFav={username ? isFavorite(username, shop.id) : false}
                                onToggleFav={() => username && toggleFavorite(username, shop.id)}
                                onClick={() => onShopClick(shop)}
                            />
                        ))}
                    </AnimatePresence>
                )}
            </main>
        </motion.div>
    );
};

const FavCard: React.FC<{
    shop: Shop; index: number;
    isFav: boolean; onToggleFav: () => void;
    onClick: () => void;
}> = ({ shop, index, isFav, onToggleFav, onClick }) => {
    const [hovered, setHovered] = useState(false);
    const m = CAT_META[shop.category];

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            style={{
                background: 'var(--card)',
                border: `1.5px solid ${hovered ? '#c8c4bc' : 'var(--border)'}`,
                borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-sm)',
                transition: 'transform .22s, box-shadow .22s, border-color .22s',
                position: 'relative',
            }}
        >
            {/* ── Banner ── */}
            <div onClick={onClick} style={{ position: 'relative', height: 110, overflow: 'hidden' }}>
                {shop.photo_url ? (
                    <img
                        src={shop.photo_url} alt={shop.name}
                        style={{
                            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                            transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'transform .4s ease',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%', height: '100%',
                        background: `linear-gradient(135deg, ${m.bg} 0%, ${m.color}22 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '3rem', opacity: .7,
                    }}>{m.icon}</div>
                )}
                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.55) 100%)',
                }} />
                {/* Heart button */}
                <button
                    onClick={e => { e.stopPropagation(); onToggleFav(); }}
                    title={isFav ? 'Remove from favourites' : 'Add to favourites'}
                    style={{
                        position: 'absolute', top: 9, right: 9, zIndex: 10,
                        width: 30, height: 30, borderRadius: '50%',
                        background: isFav ? 'rgba(217,48,37,.85)' : 'rgba(0,0,0,.4)',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '.82rem', cursor: 'pointer',
                        transition: 'all .2s', backdropFilter: 'blur(6px)',
                    }}
                >{isFav ? '❤️' : '🤍'}</button>
                {/* Logo circle */}
                <div style={{
                    position: 'absolute', bottom: -20, left: 14,
                    width: 44, height: 44, borderRadius: '50%',
                    border: '2.5px solid var(--card)', background: 'var(--card)',
                    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.3rem', zIndex: 5,
                }}>
                    {shop.photo_url
                        ? <img src={shop.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span>{m.icon}</span>}
                </div>
            </div>

            {/* ── Body ── */}
            <div onClick={onClick} style={{ padding: '1.6rem 1.1rem .7rem 1.1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                    <CatTag cat={shop.category} subcat={shop.subcat} />
                    <StatusBadge open={shop.is_open} />
                </div>
                <div style={{
                    fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700,
                    color: 'var(--dark)', lineHeight: 1.2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{shop.name}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '0 1.1rem' }} />

            <div onClick={onClick} style={{ padding: '.7rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem' }}>
                <div style={{ fontSize: '.76rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
                    <span style={{ flexShrink: 0 }}>📍</span>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.address || 'Address not set'}</span>
                </div>
                <div style={{ fontSize: '.71rem', background: 'var(--bg2)', color: 'var(--dark)', padding: '3px 9px', borderRadius: 5, fontWeight: 500, flexShrink: 0, border: '1px solid var(--border)' }}>
                    {shop.hours || '—'}
                </div>
            </div>
        </motion.article>
    );
};

export default FavoritesPage;