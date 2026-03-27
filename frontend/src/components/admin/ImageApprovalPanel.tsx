// src/components/admin/ImageApprovalPanel.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSKRequests, getSKMessages, saveSKMessage, SKRequest, SKMessage } from '../shopkeeper/ShopkeeperPage';
import { fetchAdminShops, updateShop, createShop } from '../../api/client';
import type { Shop } from '../../types';

const SK_REQUESTS_KEY = 'markopen_sk_requests';

function updateRequest(id: string, update: Partial<SKRequest>) {
  const all: SKRequest[] = JSON.parse(localStorage.getItem(SK_REQUESTS_KEY) || '[]');
  localStorage.setItem(SK_REQUESTS_KEY, JSON.stringify(all.map(r => r.id === id ? { ...r, ...update } : r)));
}

const REQUEST_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  new_shop: { label: 'New Shop Listing', icon: '🏪', color: 'rgba(212,136,10,.15)' },
  add_another_shop: { label: 'Add Another Shop', icon: '➕', color: 'rgba(52,211,153,.15)' },
  update_info: { label: 'Update Shop Info', icon: '✏️', color: 'rgba(96,165,250,.15)' },
  suggest_feature: { label: 'Suggest a Feature', icon: '💡', color: 'rgba(167,139,250,.15)' },
  report_issue: { label: 'Report an Issue', icon: '🐞', color: 'rgba(248,113,113,.15)' },
  other: { label: 'Other / General', icon: '💬', color: 'rgba(148,163,184,.15)' },
};

const StatusBadge: React.FC<{ status: SKRequest['status'] }> = ({ status }) => {
  const map = {
    pending: { bg: 'rgba(240,165,0,.12)', color: '#F0A500', border: 'rgba(240,165,0,.25)', label: '⏳ Pending' },
    approved: { bg: 'rgba(52,211,153,.12)', color: '#34D399', border: 'rgba(52,211,153,.25)', label: '✅ Approved' },
    rejected: { bg: 'rgba(248,113,113,.12)', color: '#F87171', border: 'rgba(248,113,113,.25)', label: '❌ Rejected' },
  }[status];
  return (
    <span style={{ background: map.bg, color: map.color, border: `1px solid ${map.border}`, fontSize: '.65rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, letterSpacing: '.06em', fontFamily: "'Syne', sans-serif" }}>
      {map.label}
    </span>
  );
};

// ─── MESSAGING PANEL (admin side) ─────────────────────────────────────────────
const AdminMessagingPanel: React.FC<{ request: SKRequest }> = ({ request }) => {
  const [messages, setMessages] = useState<SKMessage[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    const all = getSKMessages().filter(m => m.requestId === request.id);
    setMessages(all);
    // Mark shopkeeper messages as read (from admin perspective)
    const updated = getSKMessages().map(m =>
      m.requestId === request.id && !m.fromAdmin ? { ...m, read: true } : m
    );
    localStorage.setItem('markopen_sk_messages', JSON.stringify(updated));
  }, [request.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    const msg: SKMessage = {
      id: `adm_msg_${Date.now()}`, requestId: request.id, fromAdmin: true,
      sender: 'Admin', text: text.trim(), sentAt: new Date().toISOString(), read: false,
    };
    saveSKMessage(msg); setMessages(prev => [...prev, msg]); setText('');
  };

  const unreadFromSK = messages.filter(m => !m.fromAdmin && !m.read).length;

  return (
    <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 340, marginTop: '1.4rem' }}>
      <div style={{ padding: '.8rem 1rem', borderBottom: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.88rem', color: 'var(--adm-text)' }}>
          💬 Chat with {request.shopkeeperName}
        </div>
        {unreadFromSK > 0 && (
          <span style={{ background: '#F87171', color: '#fff', fontSize: '.6rem', fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>{unreadFromSK} new</span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '.8rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--adm-muted)', fontSize: '.8rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>💬</div>
            No messages yet. Start a conversation after approving.
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.fromAdmin ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '78%', padding: '.6rem .9rem', borderRadius: msg.fromAdmin ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: msg.fromAdmin ? 'var(--adm-amber)' : 'var(--adm-surf2)', color: msg.fromAdmin ? '#1A1208' : 'var(--adm-text)', fontSize: '.82rem', lineHeight: 1.5 }}>
              {!msg.fromAdmin && <div style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--adm-amber)', marginBottom: '.15rem' }}>{msg.sender}</div>}
              <div>{msg.text}</div>
              <div style={{ fontSize: '.58rem', opacity: 0.6, marginTop: '.25rem', textAlign: 'right' }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '.6rem .8rem', borderTop: '1px solid var(--adm-border)', display: 'flex', gap: '.5rem' }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Reply to shopkeeper..."
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1, padding: '8px 12px', background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)', borderRadius: 7, color: 'var(--adm-text)', fontSize: '.82rem', outline: 'none' }}
          onFocus={e => { e.target.style.borderColor = 'var(--adm-amber)'; }}
          onBlur={e => { e.target.style.borderColor = 'var(--adm-border)'; }} />
        <button onClick={send} disabled={!text.trim()}
          style={{ padding: '8px 16px', background: text.trim() ? 'var(--adm-amber)' : 'var(--adm-surf2)', color: text.trim() ? '#1A1208' : 'var(--adm-muted)', border: 'none', borderRadius: 7, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.78rem', cursor: text.trim() ? 'pointer' : 'default' }}>
          Send ↑
        </button>
      </div>
    </div>
  );
};

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
const ImageApprovalPanel: React.FC = () => {
  const [requests, setRequests] = useState<SKRequest[]>([]);
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [filter, setFilter] = useState<'all' | SKRequest['status']>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selected, setSelected] = useState<SKRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [activeImg, setActiveImg] = useState<'logo' | 'photo'>('photo');
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState('');

  const load = useCallback(() => { setRequests(getSKRequests()); }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchAdminShops().then(setAllShops).catch(() => { }); }, []);
  const [linkShopId, setLinkShopId] = useState<number | ''>('');

  useEffect(() => {
    setApproveError(''); setShowRejectInput(false); setRejectNote(''); setActiveImg('photo'); setLinkShopId('');
  }, [selected?.id]);

  const handleApprove = async (req: SKRequest) => {
    setApproving(true); setApproveError('');
    try {
      let targetId: number | null = req.shopId ?? (linkShopId !== '' ? Number(linkShopId) : null);
      if (req.requestType === 'new_shop' || req.requestType === 'add_another_shop') {
        const newShop = await createShop({
          name: req.shopName,
          phone: req.phone,
          show_phone: req.showPhone ?? false,
          category: 'Food',
          subcat: '',
          icon: '',
          address: '',
          hours: '',
          is_open: true,
          description: req.description ?? '',
          photo_url: req.shopPhotoBase64 ?? '',
          logo_url: req.logoBase64 ?? '',
          map_query: req.mapLink ?? '',
        });
        targetId = newShop.id;
      } else if (targetId) {
        await updateShop(targetId, {
          ...(req.shopPhotoBase64 && { photo_url: req.shopPhotoBase64 }),
          ...(req.logoBase64 && { logo_url: req.logoBase64 }),
          show_phone: req.showPhone ?? false,
        });
      }
      updateRequest(req.id, { status: 'approved', shopId: targetId as number | null });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
      setSelected(prev => prev ? { ...prev, status: 'approved' } : prev);
    } catch {
      setApproveError('Failed to update shop. Make sure you are logged in as admin.');
    } finally { setApproving(false); }
  };

  const handleReject = (req: SKRequest) => {
    updateRequest(req.id, { status: 'rejected', adminNote: rejectNote });
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected', adminNote: rejectNote } : r));
    setSelected(prev => prev ? { ...prev, status: 'rejected', adminNote: rejectNote } : prev);
    setShowRejectInput(false); setRejectNote('');
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this request permanently?')) return;
    const all = JSON.parse(localStorage.getItem(SK_REQUESTS_KEY) || '[]');
    localStorage.setItem(SK_REQUESTS_KEY, JSON.stringify(all.filter((r: SKRequest) => r.id !== id)));
    setRequests(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const getUnreadFromSK = (reqId: string) => getSKMessages().filter(m => m.requestId === reqId && !m.fromAdmin && !m.read).length;

  const filtered = requests.filter(r => {
    const statusOk = filter === 'all' || r.status === filter;
    const typeOk = typeFilter === 'all' || r.requestType === typeFilter;
    return statusOk && typeOk;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const hasLogo = (req: SKRequest) => !!req.logoBase64;
  const hasPhoto = (req: SKRequest) => !!req.shopPhotoBase64;
  const hasImages = (req: SKRequest) => hasLogo(req) || hasPhoto(req);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>

      {/* ── Left list ── */}
      <div style={{ width: 380, flexShrink: 0, borderRight: '1px solid var(--adm-border)', overflowY: 'auto', background: 'var(--adm-surf)' }}>
        <div style={{ padding: '1.2rem 1.2rem .8rem', borderBottom: '1px solid var(--adm-border)', position: 'sticky', top: 0, background: 'var(--adm-surf)', zIndex: 10 }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--adm-text)', marginBottom: '.8rem' }}>📋 Shop Requests</h2>

          {/* Status filter */}
          <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.6rem' }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '4px 11px', borderRadius: 20, fontSize: '.68rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif", border: filter === f ? 'none' : '1.5px solid var(--adm-border)', background: filter === f ? 'var(--adm-amber)' : 'transparent', color: filter === f ? '#1A1208' : 'var(--adm-muted)' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ width: '100%', padding: '6px 10px', background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)', borderRadius: 6, color: 'var(--adm-text)', fontSize: '.75rem', outline: 'none' }}>
            <option value="all">All Request Types</option>
            {Object.entries(REQUEST_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--adm-muted)', fontSize: '.85rem' }}>
            No requests found.
          </div>
        ) : filtered.map(req => {
          const rtMeta = REQUEST_TYPE_LABELS[req.requestType || 'new_shop'];
          const unread = getUnreadFromSK(req.id);
          return (
            <div key={req.id} onClick={() => setSelected(req)}
              style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--adm-border)', cursor: 'pointer', background: selected?.id === req.id ? 'var(--adm-surf2)' : 'transparent', borderLeft: selected?.id === req.id ? '3px solid var(--adm-amber)' : '3px solid transparent', transition: 'background .15s' }}
              onMouseEnter={e => { if (selected?.id !== req.id) e.currentTarget.style.background = 'rgba(255,255,255,.03)'; }}
              onMouseLeave={e => { if (selected?.id !== req.id) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Type icon */}
                <div style={{ width: 40, height: 40, borderRadius: 9, background: rtMeta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {rtMeta.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--adm-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.shopName}</div>
                  <div style={{ fontSize: '.68rem', color: 'var(--adm-muted)', marginBottom: 3 }}>👤 {req.shopkeeperName} · 📞 {req.phone}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <StatusBadge status={req.status} />
                    <span style={{ fontSize: '.6rem', background: 'var(--adm-surf2)', color: 'var(--adm-muted)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--adm-border)' }}>{rtMeta.label}</span>
                    {unread > 0 && <span style={{ background: '#F87171', color: '#fff', fontSize: '.58rem', fontWeight: 800, padding: '1px 6px', borderRadius: 10 }}>{unread} msg</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '.6rem', color: 'var(--adm-muted)', marginTop: '.4rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{req.submittedBy}</span>
                <span>{new Date(req.submittedAt).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right detail ── */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--adm-bg)' }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--adm-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 600 }}>Select a request to review</p>
            <p style={{ fontSize: '.8rem', marginTop: '.4rem' }}>Click any item on the left</p>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.5rem' }}>{REQUEST_TYPE_LABELS[selected.requestType || 'new_shop']?.icon}</span>
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.25rem', fontWeight: 800, color: 'var(--adm-text)' }}>{selected.shopName}</h2>
                </div>
                <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <StatusBadge status={selected.status} />
                  <span style={{ fontSize: '.65rem', background: 'var(--adm-surf)', color: 'var(--adm-muted)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--adm-border)' }}>
                    {REQUEST_TYPE_LABELS[selected.requestType || 'new_shop']?.label}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(selected.id)}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1.5px solid rgba(248,113,113,.3)', background: 'rgba(248,113,113,.08)', color: '#F87171', fontSize: '.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.08)'; }}>
                🗑 Delete
              </button>
            </div>

            {/* Description (if present) */}
            {selected.description && (
              <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '1rem', marginBottom: '1.2rem' }}>
                <div style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.4rem' }}>Request Description</div>
                <div style={{ fontSize: '.87rem', color: 'var(--adm-text)', lineHeight: 1.6 }}>{selected.description}</div>
              </div>
            )}

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.9rem', marginBottom: '1.2rem' }}>
              {[
                ['Shop Name', selected.shopName],
                ['Shopkeeper', selected.shopkeeperName],
                ['Phone', selected.phone],
                ['Submitted by', selected.submittedBy],
                ['Submitted', new Date(selected.submittedAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '.8rem 1rem' }}>
                  <div style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.3rem' }}>{label}</div>
                  <div style={{ fontSize: '.84rem', color: 'var(--adm-text)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
              {/* Map Link — fixed: opens in new tab */}
              <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '.8rem 1rem' }}>
                <div style={{ fontSize: '.6rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.3rem' }}>Map Link</div>
                <div style={{ fontSize: '.84rem', color: 'var(--adm-text)', fontWeight: 500 }}>
                  {selected.mapLink
                    ? <a href={selected.mapLink} target="_blank" rel="noreferrer noopener" style={{ color: 'var(--adm-amber)', textDecoration: 'none', fontWeight: 600 }} onClick={e => e.stopPropagation()}>
                      📍 Open in Maps ↗
                    </a>
                    : <span style={{ color: 'var(--adm-muted)', fontStyle: 'italic' }}>Not provided</span>}
                </div>
              </div>
            </div>

            {/* Images */}
            {hasImages(selected) && (
              <>
                <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
                  {hasPhoto(selected) && (
                    <button onClick={() => setActiveImg('photo')}
                      style={{ padding: '8px 18px', borderRadius: 8, border: activeImg === 'photo' ? 'none' : '1.5px solid var(--adm-border)', background: activeImg === 'photo' ? 'var(--adm-amber)' : 'transparent', color: activeImg === 'photo' ? '#1A1208' : 'var(--adm-muted)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>
                      🖼️ Banner
                    </button>
                  )}
                  {hasLogo(selected) && (
                    <button onClick={() => setActiveImg('logo')}
                      style={{ padding: '8px 18px', borderRadius: 8, border: activeImg === 'logo' ? 'none' : '1.5px solid var(--adm-border)', background: activeImg === 'logo' ? 'var(--adm-amber)' : 'transparent', color: activeImg === 'logo' ? '#1A1208' : 'var(--adm-muted)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>
                      🏷️ Logo
                    </button>
                  )}
                </div>
                <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: '1.4rem', border: '1px solid var(--adm-border)', background: 'var(--adm-surf)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
                  {activeImg === 'logo' && hasLogo(selected)
                    ? <img src={selected.logoBase64!} alt="Logo" style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', padding: '1.5rem', display: 'block' }} />
                    : hasPhoto(selected)
                      ? <img src={selected.shopPhotoBase64!} alt="Shop" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', display: 'block' }} />
                      : null
                  }
                </div>
              </>
            )}

            {!hasImages(selected) && (
              <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 10, padding: '1.2rem', textAlign: 'center', color: 'var(--adm-muted)', fontSize: '.85rem', marginBottom: '1.2rem', fontStyle: 'italic' }}>
                No images submitted with this request.
              </div>
            )}

            {approveError && (
              <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.82rem', color: '#F87171' }}>
                ⚠ {approveError}
              </div>
            )}

            {/* Actions */}
            {selected.status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>

                {/* Link to shop */}
                <div style={{ background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.5rem', fontWeight: 700 }}>
                    🔗 Link to Shop <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--adm-muted)', fontWeight: 400 }}>(required to apply images)</span>
                  </label>
                  <select
                    value={linkShopId}
                    onChange={e => setLinkShopId(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ width: '100%', padding: '8px 10px', background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)', borderRadius: 7, color: linkShopId !== '' ? 'var(--adm-text)' : 'var(--adm-muted)', fontSize: '.84rem', outline: 'none' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--adm-amber)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--adm-border)'; }}
                  >
                    <option value=''>— Select a shop to apply images to —</option>
                    {allShops.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category} · {s.subcat})</option>
                    ))}
                  </select>
                  {linkShopId !== '' && (
                    <div style={{ marginTop: '.6rem', fontSize: '.75rem', color: 'var(--adm-muted)', display: 'flex', gap: '1.2rem' }}>
                      {selected.shopPhotoBase64 && <span style={{ color: '#34D399' }}>✓ Shop photo → banner</span>}
                      {selected.logoBase64 && <span style={{ color: '#34D399' }}>✓ Logo → shop card icon</span>}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '.8rem' }}>
                  <button onClick={() => handleApprove(selected)} disabled={approving}
                    style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid rgba(52,211,153,.3)', background: approving ? 'rgba(52,211,153,.04)' : 'rgba(52,211,153,.1)', color: '#34D399', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.88rem', cursor: approving ? 'wait' : 'pointer' }}
                    onMouseEnter={e => { if (!approving) e.currentTarget.style.background = 'rgba(52,211,153,.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = approving ? 'rgba(52,211,153,.04)' : 'rgba(52,211,153,.1)'; }}>
                    {approving ? 'Approving…' : '✅ Approve Request'}
                  </button>
                  <button onClick={() => setShowRejectInput(v => !v)}
                    style={{ flex: 1, padding: '12px', borderRadius: 8, border: '1px solid rgba(248,113,113,.3)', background: 'rgba(248,113,113,.1)', color: '#F87171', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,.1)'; }}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}

            {selected.status === 'approved' && (
              <div style={{ background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.2)', borderRadius: 8, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#34D399', fontSize: '.88rem' }}>Approved — Shopkeeper can now message you</div>
                  <div style={{ fontSize: '.76rem', color: 'var(--adm-muted)', marginTop: 2 }}>Use the chat below to communicate.</div>
                </div>
                <button onClick={() => { updateRequest(selected.id, { status: 'rejected' }); setRequests(prev => prev.map(r => r.id === selected.id ? { ...r, status: 'rejected' } : r)); setSelected(prev => prev ? { ...prev, status: 'rejected' } : prev); }}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(248,113,113,.3)', background: 'transparent', color: '#F87171', fontSize: '.72rem', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Revoke</button>
              </div>
            )}

            {selected.status === 'rejected' && (
              <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 8, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
                <span style={{ fontSize: '1.4rem' }}>❌</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#F87171', fontSize: '.88rem' }}>Rejected</div>
                  {selected.adminNote && <div style={{ fontSize: '.76rem', color: 'var(--adm-muted)', marginTop: 2 }}>Reason: {selected.adminNote}</div>}
                </div>
                <button onClick={() => handleApprove(selected)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(52,211,153,.3)', background: 'transparent', color: '#34D399', fontSize: '.72rem', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Re-approve</button>
              </div>
            )}

            {showRejectInput && selected.status === 'pending' && (
              <div style={{ marginTop: '1rem', background: 'var(--adm-surf)', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.4rem' }}>Reason for rejection (optional)</label>
                <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                  placeholder="e.g. Missing information, please resubmit..." rows={2}
                  style={{ width: '100%', padding: '9px 12px', background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)', borderRadius: 6, color: 'var(--adm-text)', fontSize: '.85rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--adm-amber)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--adm-border)'; }} />
                <div style={{ display: 'flex', gap: '.6rem', marginTop: '.7rem' }}>
                  <button onClick={() => handleReject(selected)} style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#F87171', color: '#fff', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>Confirm Reject</button>
                  <button onClick={() => setShowRejectInput(false)} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--adm-border)', background: 'transparent', color: 'var(--adm-muted)', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.8rem', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}

            {/* Messaging (only for approved) */}
            {selected.status === 'approved' && (
              <AdminMessagingPanel request={selected} />
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default ImageApprovalPanel;