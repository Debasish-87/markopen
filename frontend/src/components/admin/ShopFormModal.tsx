// src/components/admin/ShopFormModal.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Shop, Category, CreateShopPayload } from '../../types';
import { AdminInput, AdminSelect } from '../shared';
import { CAT_META, SUBCATS, CATEGORIES } from '../../lib/constants';
import {
  validateShopName,
  validatePhone,
  validateImageFile,
  validateDescription,
  charCount,
} from '../../lib/validation';

interface Props {
  shop: Shop | null;
  onSave: (data: CreateShopPayload) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

const initialForm = (): CreateShopPayload => ({
  name: '', category: 'Food', subcat: 'Restaurant', icon: '',
  address: '', phone: '', show_phone: false, hours: '', is_open: true,
  description: '', photo_url: '', logo_url: '', map_query: '',
});

const shopToForm = (shop: Shop): CreateShopPayload => ({
  name: shop.name, category: shop.category, subcat: shop.subcat, icon: shop.icon ?? '',
  address: shop.address, phone: shop.phone, show_phone: shop.show_phone ?? false, hours: shop.hours, is_open: shop.is_open,
  description: shop.description, photo_url: shop.photo_url, logo_url: shop.logo_url, map_query: shop.map_query,
});

const SectionTitle: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase',
    color: 'var(--adm-amber)', margin: '1.3rem 0 .8rem',
    paddingBottom: '.5rem', borderBottom: '1px solid var(--adm-border)',
  }}>{text}</div>
);

// ─── IMAGE UPLOAD ZONE ────────────────────────────────────────────────────────
interface UploadZoneProps {
  label: string;
  hint: string;
  placeholder: string;
  preview: string | null;
  shape: 'circle' | 'rect';
  onFile: (b64: string) => void;
  onClear: () => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({
  label, hint, placeholder, preview, shape, onFile, onClear,
}) => {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback((file: File) => {
    const result = validateImageFile(file);
    if (!result.valid) {
      alert(result.message);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onFile(reader.result as string);
    reader.readAsDataURL(file);
  }, [onFile]);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase',
        color: 'var(--adm-muted)', marginBottom: '.45rem', fontWeight: 700,
      }}>{label}</div>

      <div
        onDragOver={e => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => {
          e.preventDefault(); setDrag(false);
          const f = e.dataTransfer.files[0]; if (f) readFile(f);
        }}
        onClick={() => { if (!preview) inputRef.current?.click(); }}
        style={{
          border: `2px dashed ${drag ? 'var(--adm-amber)' : 'var(--adm-border)'}`,
          borderRadius: 10,
          minHeight: 160,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: preview ? 'default' : 'pointer',
          background: drag ? 'rgba(212,136,10,.06)' : 'var(--adm-surf2)',
          transition: 'all .2s', padding: '1rem',
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              style={{
                width: shape === 'circle' ? 84 : '100%',
                height: shape === 'circle' ? 84 : 110,
                objectFit: 'cover',
                borderRadius: shape === 'circle' ? '50%' : 8,
                border: shape === 'circle'
                  ? '2.5px solid var(--adm-amber)'
                  : '1px solid var(--adm-border)',
                marginBottom: '.6rem',
                display: 'block',
              }}
            />
            <div style={{ display: 'flex', gap: '.4rem' }}>
              <button
                onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                style={{
                  padding: '5px 12px', borderRadius: 5,
                  border: '1.5px solid var(--adm-border)',
                  background: 'transparent', color: 'var(--adm-muted)',
                  fontSize: '.68rem', cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  transition: 'border-color .15s, color .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--adm-amber)'; e.currentTarget.style.color = 'var(--adm-amber)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--adm-border)'; e.currentTarget.style.color = 'var(--adm-muted)'; }}
              >✎ Change</button>
              <button
                onClick={e => { e.stopPropagation(); onClear(); }}
                style={{
                  padding: '5px 12px', borderRadius: 5,
                  border: '1.5px solid rgba(248,113,113,.3)',
                  background: 'rgba(248,113,113,.08)', color: 'var(--adm-red)',
                  fontSize: '.68rem', cursor: 'pointer',
                  fontFamily: "'Syne', sans-serif", fontWeight: 700,
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.08)'; }}
              >🗑 Delete</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.4rem', marginBottom: '.4rem', opacity: .35 }}>{placeholder}</div>
            <p style={{ fontWeight: 700, color: 'var(--adm-text)', fontSize: '.8rem', marginBottom: '.2rem', textAlign: 'center' }}>{hint}</p>
            <p style={{ fontSize: '.66rem', color: 'var(--adm-muted)' }}>Drag & drop or click · max 5 MB</p>
          </>
        )}
      </div>

      <input
        ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }}
      />
    </div>
  );
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
// Returns true if the string is a base64 data URL (not a remote URL the backend can store)
const isBase64 = (s: string | null): boolean => !!s && s.startsWith('data:');

// Resolve what URL to actually send to the backend:
//   null        → user explicitly cleared the image → send ''
//   base64      → local preview only (no upload endpoint) → keep original remote URL
//   http/https  → already a remote URL → send as-is
const resolveImageUrl = (preview: string | null, originalUrl: string): string => {
  if (preview === null) return '';
  if (isBase64(preview)) return originalUrl;
  return preview;
};

// ─── MODAL ────────────────────────────────────────────────────────────────────
const ShopFormModal: React.FC<Props> = ({ shop, onSave, onClose, saving }) => {
  const [form, setForm] = useState<CreateShopPayload>(() => shop ? shopToForm(shop) : initialForm());
  const [errors, setErrors] = useState<Partial<Record<keyof CreateShopPayload, string>>>({});
  const [shopLogoPreview, setShopLogoPreview] = useState<string | null>(shop?.logo_url || null);
  const [shopPhotoPreview, setShopPhotoPreview] = useState<string | null>(shop?.photo_url || null);
  const [skPhotoPreview, setSkPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  useEffect(() => {
    const subs = SUBCATS[form.category];
    if (!subs.includes(form.subcat)) setForm(f => ({ ...f, subcat: subs[0] }));
  }, [form.category, form.subcat]);

  const set = <K extends keyof CreateShopPayload>(k: K, v: CreateShopPayload[K]): void => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: undefined }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};

    const nameResult = validateShopName(form.name);
    if (!nameResult.valid) next.name = nameResult.message;

    if (form.phone.trim()) {
      const phoneResult = validatePhone(form.phone);
      if (!phoneResult.valid) next.phone = phoneResult.message;
    }

    const descResult = validateDescription(form.description);
    if (!descResult.valid) next.description = descResult.message;

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (): void => {
    if (!validate()) return;
    const logo_url = resolveImageUrl(shopLogoPreview, shop?.logo_url ?? '');
    const photo_url = resolveImageUrl(shopPhotoPreview, shop?.photo_url ?? '');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { icon: _icon, ...formWithoutIcon } = form;
    onSave({ ...formWithoutIcon, logo_url, photo_url, icon: '' });
  };

  const m = CAT_META[form.category];

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300, backdropFilter: 'blur(5px)',
        padding: '1rem', animation: 'fadeIn .2s ease',
      }}
    >
      <div style={{
        background: 'var(--adm-surf)', border: '1px solid var(--adm-border)',
        borderRadius: 16, width: '100%', maxWidth: 600,
        maxHeight: '94vh', overflowY: 'auto',
        animation: 'slideIn .22s ease', boxShadow: '0 24px 64px rgba(0,0,0,.6)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.6rem 1.8rem 0',
        }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--adm-text)' }}>
            {shop ? 'Edit Shop Profile' : 'Add New Shop'}
          </div>
          <button
            onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--adm-muted)', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1, padding: 4 }}
          >✕</button>
        </div>

        <div style={{ padding: '1.4rem 1.8rem 1.8rem' }}>

          {/* ── Live preview card ── */}
          <div style={{
            background: 'var(--adm-surf2)', border: `1.5px solid ${m.color}33`,
            borderRadius: 10, padding: '1rem', marginBottom: '1.4rem',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 9, overflow: 'hidden', flexShrink: 0,
              background: 'var(--adm-bg)', border: '1px solid var(--adm-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {shopLogoPreview
                ? <img src={shopLogoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.5rem', opacity: .3 }}>🏪</span>}
            </div>
            {skPhotoPreview && (
              <div style={{
                width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: '2px solid var(--adm-amber)',
              }}>
                <img src={skPhotoPreview} alt="SK" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--adm-text)' }}>
                {form.name || <span style={{ opacity: .4 }}>Shop name…</span>}
              </div>
              <div style={{ fontSize: '.73rem', color: 'var(--adm-muted)', marginTop: 2 }}>
                {form.category} · {form.subcat}
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5,
                fontSize: '.66rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20,
                background: form.is_open ? 'rgba(52,211,153,.12)' : 'rgba(248,113,113,.12)',
                color: form.is_open ? 'var(--adm-green)' : 'var(--adm-red)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                  background: form.is_open ? 'var(--adm-green)' : 'var(--adm-red)',
                  animation: form.is_open ? 'adminPulse 1.4s infinite' : 'none',
                }} />
                {form.is_open ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          {/* ── Images ── */}
          <SectionTitle text="Images" />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
            <UploadZone
              label="Shop Logo"
              hint="Square shop logo"
              placeholder="🏷️"
              preview={shopLogoPreview}
              shape="rect"
              onFile={b64 => setShopLogoPreview(b64)}
              onClear={() => setShopLogoPreview(null)}
            />
            <UploadZone
              label="Shop Photo"
              hint="Banner photo of shop"
              placeholder="📸"
              preview={shopPhotoPreview}
              shape="rect"
              onFile={b64 => setShopPhotoPreview(b64)}
              onClear={() => setShopPhotoPreview(null)}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem' }}>
            <UploadZone
              label="Shopkeeper Photo"
              hint="Owner or staff portrait"
              placeholder="🧑‍💼"
              preview={skPhotoPreview}
              shape="circle"
              onFile={b64 => setSkPhotoPreview(b64)}
              onClear={() => setSkPhotoPreview(null)}
            />
          </div>

          {/* ── Basic Info ── */}
          <SectionTitle text="Basic Info" />
          <div style={{ marginBottom: errors.name ? '.3rem' : '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.45rem' }}>
              <label style={{ fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)' }}>
                Shop Name *
              </label>
              <span style={{
                fontSize: '.62rem', fontWeight: 600,
                color: form.name.trim().length > 100 ? 'var(--adm-red)' : form.name.trim().length < 2 && form.name.length > 0 ? '#D4880A' : 'var(--adm-muted)',
              }}>
                {form.name.trim().length} / 100
              </span>
            </div>
            <AdminInput
              label=""
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Golden Bakery (2–100 characters)"
              style={errors.name ? { borderColor: 'var(--adm-red)' } : undefined}
            />
          </div>
          {errors.name && (
            <p style={{ fontSize: '.68rem', color: 'var(--adm-red)', marginTop: '-.7rem', marginBottom: '.7rem' }}>
              {errors.name}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
            <AdminSelect label="Category *" value={form.category} onChange={e => set('category', e.target.value as Category)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{CAT_META[c].icon} {c}</option>)}
            </AdminSelect>
            <AdminSelect label="Sub-type *" value={form.subcat} onChange={e => set('subcat', e.target.value)}>
              {SUBCATS[form.category].map(s => <option key={s} value={s}>{s}</option>)}
            </AdminSelect>
          </div>

          {/* ── Contact & Hours ── */}
          <SectionTitle text="Contact & Hours" />
          <AdminInput label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 12 MG Road, Bhubaneswar" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem' }}>
            <div>
              <AdminInput
                label="Phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                type="tel"
                style={errors.phone ? { borderColor: 'var(--adm-red)' } : undefined}
              />
              {errors.phone && (
                <p style={{ fontSize: '.68rem', color: 'var(--adm-red)', marginTop: '-.7rem', marginBottom: '.7rem' }}>
                  {errors.phone}
                </p>
              )}
              {!errors.phone && form.phone.trim() && (
                <p style={{ fontSize: '.65rem', color: 'var(--adm-muted)', marginTop: '-.7rem', marginBottom: '.7rem' }}>
                  Enter exactly 10 digits
                </p>
              )}
              <div
                onClick={() => set('show_phone', !form.show_phone)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', marginTop: '.2rem' }}
              >
                <div style={{
                  width: 36, height: 20, borderRadius: 10, position: 'relative', transition: 'background .2s',
                  background: form.show_phone ? 'var(--adm-amber)' : 'var(--adm-border)',
                  flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 2, left: form.show_phone ? 18 : 2,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                  }} />
                </div>
                <span style={{ fontSize: '.72rem', color: form.show_phone ? 'var(--adm-amber)' : 'var(--adm-muted)', fontWeight: 600 }}>
                  {form.show_phone ? 'Phone visible to public' : 'Phone hidden from public'}
                </span>
              </div>
            </div>
            <AdminInput label="Business Hours" value={form.hours} onChange={e => set('hours', e.target.value)} placeholder="9 AM – 9 PM" />
          </div>

          {/* ── About ── */}
          <SectionTitle text="About" />
          <div style={{ marginBottom: '1.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.45rem' }}>
              <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)' }}>
                Description
              </label>
              <span style={{
                fontSize: '.62rem', fontWeight: 600,
                color: charCount(form.description, 500).over ? 'var(--adm-red)' : charCount(form.description, 500).remaining <= 50 ? '#D4880A' : 'var(--adm-muted)',
              }}>
                {charCount(form.description, 500).remaining} / 500
              </span>
            </div>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Tell customers about your shop…"
              rows={3}
              style={{
                width: '100%', padding: '10px 13px', boxSizing: 'border-box',
                background: 'var(--adm-surf2)',
                border: `1.5px solid ${errors.description ? 'var(--adm-red)' : 'var(--adm-border)'}`,
                borderRadius: 7, color: 'var(--adm-text)', fontSize: '.88rem',
                outline: 'none', resize: 'vertical', lineHeight: 1.6,
                transition: 'border-color .2s', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--adm-amber)'}
              onBlur={e => e.target.style.borderColor = errors.description ? 'var(--adm-red)' : 'var(--adm-border)'}
            />
            {errors.description && (
              <p style={{ fontSize: '.68rem', color: 'var(--adm-red)', marginTop: '.2rem' }}>{errors.description}</p>
            )}
          </div>
          <AdminInput
            label="Google Maps Query"
            value={form.map_query}
            onChange={e => set('map_query', e.target.value)}
            placeholder="e.g. Spice+Garden+MG+Road+Bhubaneswar"
          />

          {/* ── Status ── */}
          <SectionTitle text="Status" />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)',
            borderRadius: 7, padding: '10px 13px', marginBottom: '1.6rem',
          }}>
            <span style={{ fontSize: '.88rem', color: 'var(--adm-text)', fontWeight: 500 }}>
              {form.is_open ? '🟢 Currently Open' : '🔴 Currently Closed'}
            </span>
            <div
              role="switch" aria-checked={form.is_open} tabIndex={0}
              onClick={() => set('is_open', !form.is_open)}
              onKeyDown={e => e.key === ' ' && set('is_open', !form.is_open)}
              style={{
                width: 44, height: 24, borderRadius: 24, cursor: 'pointer',
                background: form.is_open ? 'var(--adm-green)' : 'var(--adm-border)',
                position: 'relative', transition: 'background .3s',
              }}
            >
              <div style={{
                position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                background: '#fff', top: 3, left: form.is_open ? 23 : 3,
                transition: 'left .3s', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
              }} />
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.7rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px', borderRadius: 7,
                border: '1.5px solid var(--adm-border)',
                background: 'transparent', color: 'var(--adm-muted)',
                fontFamily: "'Syne', sans-serif", fontSize: '.82rem', fontWeight: 700, cursor: 'pointer',
              }}
            >Cancel</button>
            <button
              onClick={handleSubmit} disabled={saving}
              style={{
                padding: '9px 22px', borderRadius: 7, border: 'none',
                background: saving ? '#888' : 'var(--adm-amber)',
                color: '#1A1208', fontFamily: "'Syne', sans-serif",
                fontSize: '.82rem', fontWeight: 700,
                cursor: saving ? 'wait' : 'pointer',
                minWidth: 120, transition: 'opacity .15s',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '.85'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {saving ? 'Saving…' : shop ? '✓ Save Changes' : '＋ Add Shop'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShopFormModal;