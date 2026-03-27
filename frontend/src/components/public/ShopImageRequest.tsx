// src/components/public/ShopImageRequest.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { fetchShops } from '../../api/client';
import type { Shop } from '../../types';

interface ImageRequest {
  id: string;
  shopId: number;
  shopName: string;
  ownerName: string;
  phone: string;
  logoBase64: string;
  logoFile: string;
  shopPhotoBase64: string;
  shopPhotoFile: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  note?: string;
}

interface Props {
  onBack: () => void;
}

const STORAGE_KEY = 'markopen_image_requests';

export function getImageRequests(): ImageRequest[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

export function saveImageRequest(req: ImageRequest): void {
  const all = getImageRequests();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([req, ...all]));
}

// ─── UPLOAD ZONE ──────────────────────────────────────────────────────────────
const UploadZone: React.FC<{
  label: string;
  sublabel: string;
  icon: string;
  preview: string | null;
  fileName: string;
  error?: string;
  shape?: 'circle' | 'rect';
  onFile: (file: File) => void;
}> = ({ label, sublabel, icon, preview, fileName, error, shape = 'rect', onFile }) => {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div style={{ flex: 1, minWidth: 220 }}>
      <div style={{ fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#7A7468', marginBottom: '.45rem', fontWeight: 600 }}>
        {label} <span style={{ color: '#D93025' }}>*</span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? '#D4880A' : error ? '#D93025' : '#DEDAD2'}`,
          borderRadius: 12, padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer',
          background: dragging ? 'rgba(212,136,10,.05)' : '#F7F4EF',
          transition: 'all .2s', minHeight: 170,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {preview ? (
          <>
            <img src={preview} alt="preview"
              style={{
                width: shape === 'circle' ? 88 : '100%',
                height: shape === 'circle' ? 88 : 110,
                objectFit: 'cover',
                borderRadius: shape === 'circle' ? '50%' : 8,
                marginBottom: '.6rem',
                border: shape === 'circle' ? '3px solid #D4880A' : '1.5px solid #DEDAD2',
              }}
            />
            <p style={{ fontSize: '.72rem', color: '#7A7468', marginBottom: '.15rem' }}>{fileName}</p>
            <p style={{ fontSize: '.68rem', color: '#D4880A' }}>Click to change</p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2.2rem', marginBottom: '.5rem' }}>{icon}</div>
            <p style={{ fontWeight: 700, color: '#111108', fontSize: '.84rem', marginBottom: '.25rem' }}>{sublabel}</p>
            <p style={{ fontSize: '.72rem', color: '#7A7468' }}>Drag & drop or click · max 5MB</p>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      {error && <p style={{ color: '#D93025', fontSize: '.72rem', marginTop: '.3rem' }}>{error}</p>}
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const ShopImageRequest: React.FC<Props> = ({ onBack }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [shops, setShops] = useState<Shop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<number | ''>('');

  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState('');
  const [shopPhotoPreview, setShopPhotoPreview] = useState<string | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load all shops for the dropdown
  useEffect(() => {
    fetchShops()
      .then(data => setShops(data))
      .catch(() => setShops([]))
      .finally(() => setShopsLoading(false));
  }, []);

  const selectedShop = shops.find(s => s.id === selectedShopId) ?? null;

  const handleFile = (type: 'logo' | 'shopPhoto') => (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors(e => ({ ...e, [type]: 'Please upload an image file (JPG, PNG, WebP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(e => ({ ...e, [type]: 'Image must be under 5MB.' }));
      return;
    }
    setErrors(e => ({ ...e, [type]: '' }));
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'logo') { setLogoPreview(result); setLogoFile(file.name); }
      else { setShopPhotoPreview(result); setShopPhotoFile(file.name); }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!selectedShopId) errs.shop = 'Please select your shop.';
    if (!ownerName.trim()) errs.ownerName = 'Your name is required.';
    if (!phone.trim()) errs.phone = 'Phone number is required.';
    if (!logoPreview) errs.logo = 'Please upload a shop logo.';
    if (!shopPhotoPreview) errs.shopPhoto = 'Please upload a photo of the shop with owner.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedShop) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    saveImageRequest({
      id: `req_${Date.now()}`,
      shopId: selectedShop.id,
      shopName: selectedShop.name,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      logoBase64: logoPreview!,
      logoFile,
      shopPhotoBase64: shopPhotoPreview!,
      shopPhotoFile,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      note: note.trim(),
    });
    setSubmitting(false);
    setStep('success');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 15px',
    background: '#F7F4EF', border: '2px solid #DEDAD2',
    borderRadius: 8, color: '#111108',
    fontFamily: "'DM Sans', sans-serif", fontSize: '.92rem',
    outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '.62rem', letterSpacing: '.15em',
    textTransform: 'uppercase', color: '#7A7468', marginBottom: '.45rem', fontWeight: 600,
  };

  if (step === 'success') {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '3rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginBottom: '1.4rem' }}>
            <div style={{ textAlign: 'center' }}>
              <img src={logoPreview!} alt="logo" style={{ width: 76, height: 76, borderRadius: '50%', objectFit: 'cover', border: '3px solid #D4880A', display: 'block', marginBottom: '.3rem' }} />
              <p style={{ fontSize: '.62rem', color: '#7A7468', letterSpacing: '.1em', textTransform: 'uppercase' }}>Logo</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src={shopPhotoPreview!} alt="shop" style={{ width: 76, height: 76, borderRadius: 10, objectFit: 'cover', border: '3px solid #DEDAD2', display: 'block', marginBottom: '.3rem' }} />
              <p style={{ fontSize: '.62rem', color: '#7A7468', letterSpacing: '.1em', textTransform: 'uppercase' }}>Shop Photo</p>
            </div>
          </div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#111108', marginBottom: '.5rem' }}>Request Submitted! 🎉</h2>
          <p style={{ color: '#7A7468', fontSize: '.93rem', lineHeight: 1.7, marginBottom: '1rem' }}>
            Images for <strong style={{ color: '#111108' }}>{selectedShop?.name}</strong> sent for admin review.
          </p>
          <div style={{ background: '#F7F4EF', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1.8rem', fontSize: '.8rem', color: '#7A7468', display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.72rem', color: '#D4880A', fontWeight: 700 }}>Shop ID #{selectedShop?.id}</span>
            <span>· Usually reviewed within 24 hours</span>
          </div>
          <button onClick={onBack} style={{ padding: '12px 28px', background: '#D4880A', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>
            ← Back to Shops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF' }}>
      {/* Header */}
      <header style={{ background: '#111108', borderBottom: '2.5px solid #D4880A', padding: '0 2.5rem', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.9rem', fontWeight: 800, color: '#fff', letterSpacing: -1 }}>
          Mark<span style={{ color: '#D4880A' }}>o</span>pen
        </div>
        <button onClick={onBack}
          style={{ padding: '7px 16px', border: '1.5px solid #2e2e2e', borderRadius: 6, background: 'transparent', color: '#aaa', fontSize: '.78rem', fontFamily: "'Syne', sans-serif", cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#555'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = '#2e2e2e'; }}
        >← Back</button>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '.62rem', letterSpacing: '.25em', textTransform: 'uppercase', color: '#D4880A', marginBottom: '.5rem' }}>✦ Shopkeeper Portal</p>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, color: '#111108', marginBottom: '.5rem' }}>Upload Your Shop Images</h1>
          <p style={{ color: '#7A7468', fontSize: '.93rem', lineHeight: 1.7 }}>Select your shop, upload your logo and a photo with you in it. Admin reviews before it goes live.</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>

          {/* Shop selector */}
          <div style={{ marginBottom: '1.4rem' }}>
            <label style={labelStyle}>Select Your Shop *</label>
            {shopsLoading ? (
              <div style={{ ...inputStyle, color: '#7A7468', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #D4880A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
                Loading shops…
              </div>
            ) : (
              <select
                value={selectedShopId}
                onChange={e => setSelectedShopId(e.target.value ? Number(e.target.value) : '')}
                style={{ ...inputStyle, appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%237A7468' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px', ...(errors.shop ? { borderColor: '#D93025' } : {}) }}
                onFocus={e => { if (!errors.shop) e.target.style.borderColor = '#D4880A'; }}
                onBlur={e => { e.target.style.borderColor = errors.shop ? '#D93025' : '#DEDAD2'; }}
              >
                <option value="">— Choose your shop —</option>
                {shops.map(s => (
                  <option key={s.id} value={s.id}>#{s.id} · {s.name} ({s.category})</option>
                ))}
              </select>
            )}
            {errors.shop && <p style={{ color: '#D93025', fontSize: '.72rem', marginTop: '.3rem' }}>{errors.shop}</p>}

            {/* Show selected shop preview */}
            {selectedShop && (
              <div style={{ marginTop: '.75rem', background: '#F7F4EF', border: '1.5px solid #D4880A', borderRadius: 8, padding: '.75rem 1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 6, background: '#EDEAE3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', overflow: 'hidden', flexShrink: 0 }}>
                  {selectedShop.photo_url
                    ? <img src={selectedShop.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : selectedShop.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#111108' }}>{selectedShop.name}</div>
                  <div style={{ fontSize: '.72rem', color: '#7A7468' }}>{selectedShop.category} · {selectedShop.address}</div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '.7rem', color: '#D4880A', fontWeight: 700, background: 'rgba(212,136,10,.1)', padding: '3px 8px', borderRadius: 4 }}>
                  ID #{selectedShop.id}
                </div>
              </div>
            )}
          </div>

          {/* Owner + Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.8rem' }}>
            <div>
              <label style={labelStyle}>Owner Name *</label>
              <input value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Your full name"
                style={{ ...inputStyle, ...(errors.ownerName ? { borderColor: '#D93025' } : {}) }}
                onFocus={e => { if (!errors.ownerName) e.target.style.borderColor = '#D4880A'; }}
                onBlur={e => { e.target.style.borderColor = errors.ownerName ? '#D93025' : '#DEDAD2'; }}
              />
              {errors.ownerName && <p style={{ color: '#D93025', fontSize: '.72rem', marginTop: '.3rem' }}>{errors.ownerName}</p>}
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" type="tel"
                style={{ ...inputStyle, ...(errors.phone ? { borderColor: '#D93025' } : {}) }}
                onFocus={e => { if (!errors.phone) e.target.style.borderColor = '#D4880A'; }}
                onBlur={e => { e.target.style.borderColor = errors.phone ? '#D93025' : '#DEDAD2'; }}
              />
              {errors.phone && <p style={{ color: '#D93025', fontSize: '.72rem', marginTop: '.3rem' }}>{errors.phone}</p>}
            </div>
          </div>

          {/* Two upload zones */}
          <div style={{ marginBottom: '1.6rem' }}>
            <div style={{ fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#D4880A', fontWeight: 700, borderBottom: '1px solid #DEDAD2', paddingBottom: '.5rem', marginBottom: '1.1rem' }}>
              Shop Images
            </div>
            <div style={{ display: 'flex', gap: '1.2rem' }}>
              <UploadZone label="Shop Logo" sublabel="Square logo or icon" icon="🏷️"
                preview={logoPreview} fileName={logoFile} error={errors.logo} shape="circle"
                onFile={handleFile('logo')} />
              <UploadZone label="Shop Photo with Owner" sublabel="You standing in your shop" icon="🤝"
                preview={shopPhotoPreview} fileName={shopPhotoFile} error={errors.shopPhoto} shape="rect"
                onFile={handleFile('shopPhoto')} />
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', marginTop: '.9rem' }}>
              <div style={{ flex: 1, background: 'rgba(212,136,10,.06)', border: '1px solid rgba(212,136,10,.2)', borderRadius: 8, padding: '.75rem', fontSize: '.72rem', color: '#7A7468', lineHeight: 1.55 }}>
                <strong style={{ color: '#D4880A', display: 'block', marginBottom: '.2rem' }}>🏷️ Logo tips</strong>
                Square image preferred. Clear background is best. This shows as your shop icon on the listing.
              </div>
              <div style={{ flex: 1, background: 'rgba(26,158,92,.06)', border: '1px solid rgba(26,158,92,.2)', borderRadius: 8, padding: '.75rem', fontSize: '.72rem', color: '#7A7468', lineHeight: 1.55 }}>
                <strong style={{ color: '#1A9E5C', display: 'block', marginBottom: '.2rem' }}>🤝 Photo tips</strong>
                Owner clearly visible. Good lighting, shop interior in background. Builds trust with customers.
              </div>
            </div>
          </div>

          {/* Note */}
          <div style={{ marginBottom: '1.8rem' }}>
            <label style={labelStyle}>Note to Admin (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Any context or special instructions for the admin…" rows={2}
              style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = '#D4880A'; }}
              onBlur={e => { e.target.style.borderColor = '#DEDAD2'; }}
            />
          </div>

          <button onClick={handleSubmit} disabled={submitting}
            style={{ width: '100%', padding: '13px', background: submitting ? '#bbb' : '#D4880A', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.92rem', cursor: submitting ? 'wait' : 'pointer', transition: 'opacity .2s' }}
          >
            {submitting ? 'Submitting…' : '📤 Submit Images for Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopImageRequest;