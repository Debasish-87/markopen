// src/components/shopkeeper/ShopkeeperPage.tsx - UPDATED
import React, { useState, useRef, useEffect } from 'react';
import { useShopkeeperStore } from '../../hooks/useShopkeeperStore';
import {
  validateShopName,
  validatePhone,
  validateImageFile,
  validateDescription,
  validateEmail,
  charCount,
} from '../../lib/validation';

const SK_REQUESTS_KEY = 'markopen_sk_requests';
const SK_MESSAGES_KEY = 'markopen_sk_messages';

export type RequestType = 'new_shop' | 'update_info' | 'add_another_shop' | 'suggest_feature' | 'report_issue' | 'other';

export interface SKRequest {
  id: string; submittedBy: string; shopId: number | null; shopName: string;
  shopkeeperName: string; phone: string; logoBase64: string | null;
  shopPhotoBase64: string | null; mapLink: string;
  status: 'pending' | 'approved' | 'rejected'; submittedAt: string;
  adminNote?: string; requestType: RequestType; description?: string; showPhone?: boolean;
}

export interface SKMessage {
  id: string; requestId: string; fromAdmin: boolean; sender: string;
  text: string; sentAt: string; read: boolean;
}

export function getSKRequests(): SKRequest[] {
  try { return JSON.parse(localStorage.getItem(SK_REQUESTS_KEY) || '[]'); } catch { return []; }
}
export function getSKMessages(): SKMessage[] {
  try { return JSON.parse(localStorage.getItem(SK_MESSAGES_KEY) || '[]'); } catch { return []; }
}
function saveSKRequest(req: SKRequest) {
  const all = getSKRequests(); const idx = all.findIndex(r => r.id === req.id);
  if (idx >= 0) all[idx] = req; else all.unshift(req);
  localStorage.setItem(SK_REQUESTS_KEY, JSON.stringify(all));
}
export function saveSKMessage(msg: SKMessage) {
  const all = getSKMessages(); all.push(msg);
  localStorage.setItem(SK_MESSAGES_KEY, JSON.stringify(all));
}

const REQUEST_TYPES: { value: RequestType; label: string; icon: string; desc: string }[] = [
  { value: 'new_shop', label: 'New Shop Listing', icon: '🏪', desc: 'Register a brand new shop on the platform' },
  { value: 'add_another_shop', label: 'Add Another Shop', icon: '➕', desc: 'Already have a shop? Add another to manage here' },
  { value: 'update_info', label: 'Update Shop Info', icon: '✏️', desc: 'Update details of your existing shop listing' },
  { value: 'suggest_feature', label: 'Suggest a Feature', icon: '💡', desc: 'Suggest an improvement or new feature' },
  { value: 'report_issue', label: 'Report an Issue', icon: '🐞', desc: 'Report a bug or problem with your listing' },
  { value: 'other', label: 'Other / General', icon: '💬', desc: 'Any other message to the admin' },
];

function generateOTP(): string { return Math.floor(100000 + Math.random() * 900000).toString(); }

// ImageCropModal - kept from original
const ImageCropModal: React.FC<{ src: string; shape: 'circle' | 'rect'; onSave: (b: string) => void; onCancel: () => void }> = ({ src, shape, onSave, onCancel }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ x: 40, y: 40, w: 200, h: 200 });
  const [dragging, setDragging] = useState<null | 'move' | 'tl' | 'tr' | 'bl' | 'br'>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0, bw: 0, bh: 0 });
  const CW = 480; const CH = 320; const MIN = 40;
  const norm = (b: typeof box) => shape === 'circle' ? { ...b, w: Math.min(b.w, b.h), h: Math.min(b.w, b.h) } : b;
  const clamp = (b: typeof box) => ({ x: Math.max(0, Math.min(b.x, CW - b.w)), y: Math.max(0, Math.min(b.y, CH - b.h)), w: Math.max(MIN, Math.min(b.w, CW - b.x)), h: Math.max(MIN, Math.min(b.h, CH - b.y)) });
  const onMD = (e: React.MouseEvent, h: typeof dragging) => { e.preventDefault(); e.stopPropagation(); setDragging(h); dragStart.current = { mx: e.clientX, my: e.clientY, bx: box.x, by: box.y, bw: box.w, bh: box.h }; };
  useEffect(() => {
    const mv = (e: MouseEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.mx; const dy = e.clientY - dragStart.current.my;
      const { bx, by, bw, bh } = dragStart.current; let nb = { ...box };
      if (dragging === 'move') nb = { x: bx + dx, y: by + dy, w: bw, h: bh };
      else if (dragging === 'br') { nb = { x: bx, y: by, w: bw + dx, h: bh + dy }; if (shape === 'circle') { const s = Math.max(MIN, Math.min(bw + dx, bh + dy)); nb = { x: bx, y: by, w: s, h: s }; } }
      else if (dragging === 'bl') { nb = { x: bx + dx, y: by, w: bw - dx, h: bh + dy }; if (shape === 'circle') { const s = Math.max(MIN, Math.min(bw - dx, bh + dy)); nb = { x: bx + bw - s, y: by, w: s, h: s }; } }
      else if (dragging === 'tr') { nb = { x: bx, y: by + dy, w: bw + dx, h: bh - dy }; if (shape === 'circle') { const s = Math.max(MIN, Math.min(bw + dx, bh - dy)); nb = { x: bx, y: by + bh - s, w: s, h: s }; } }
      else if (dragging === 'tl') { nb = { x: bx + dx, y: by + dy, w: bw - dx, h: bh - dy }; if (shape === 'circle') { const s = Math.max(MIN, Math.min(bw - dx, bh - dy)); nb = { x: bx + bw - s, y: by + bh - s, w: s, h: s }; } }
      setBox(clamp(norm(nb)));
    };
    const up = () => setDragging(null);
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); };
  }, [dragging, box]);
  const HS = (cursor: string): React.CSSProperties => ({ position: 'absolute', width: 10, height: 10, background: '#D4880A', borderRadius: 2, cursor, zIndex: 10 });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', borderRadius: 16, padding: '1.5rem', width: 560, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: "Syne,sans-serif", color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{shape === 'circle' ? 'Crop Logo' : 'Crop Photo'}</h3>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#888', fontSize: '1.2rem', cursor: 'pointer' }}>x</button>
        </div>
        <div ref={containerRef} style={{ position: 'relative', width: CW, height: CH, overflow: 'hidden', borderRadius: 8, background: '#000', margin: '0 auto', userSelect: 'none', maxWidth: '100%' }}>
          <img ref={imgRef} src={src} alt="" onLoad={() => setImgLoaded(true)} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />
          {imgLoaded && (<>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs><mask id="cm"><rect width="100%" height="100%" fill="white" />{shape === 'circle' ? <ellipse cx={box.x + box.w / 2} cy={box.y + box.h / 2} rx={box.w / 2} ry={box.h / 2} fill="black" /> : <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="black" />}</mask></defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,.55)" mask="url(#cm)" />
            </svg>
            <div onMouseDown={e => onMD(e, 'move')} style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, border: '2px solid #D4880A', borderRadius: shape === 'circle' ? '50%' : 4, cursor: 'move' }}>
              {shape === 'rect' && (<><div onMouseDown={e => onMD(e, 'tl')} style={{ ...HS('nw-resize'), top: -5, left: -5 }} /><div onMouseDown={e => onMD(e, 'tr')} style={{ ...HS('ne-resize'), top: -5, right: -5 }} /><div onMouseDown={e => onMD(e, 'bl')} style={{ ...HS('sw-resize'), bottom: -5, left: -5 }} /><div onMouseDown={e => onMD(e, 'br')} style={{ ...HS('se-resize'), bottom: -5, right: -5 }} /></>)}
              {shape === 'circle' && <div onMouseDown={e => onMD(e, 'br')} style={{ ...HS('se-resize'), bottom: -5, right: -5 }} />}
            </div>
          </>)}
        </div>
        <div style={{ display: 'flex', gap: '.7rem', marginTop: '1.2rem' }}>
          <button onClick={onCancel} style={{ padding: '10px 20px', borderRadius: 7, border: '1px solid #333', background: 'transparent', color: '#888', cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { const img = imgRef.current; if (!img) return; const sx = img.naturalWidth / CW; const sy = img.naturalHeight / CH; const canvas = document.createElement('canvas'); canvas.width = shape === 'circle' ? Math.min(box.w, box.h) : box.w * sx; canvas.height = shape === 'circle' ? Math.min(box.w, box.h) : box.h * sy; const ctx = canvas.getContext('2d')!; if (shape === 'circle') { const s = Math.min(box.w, box.h); ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); ctx.clip(); } ctx.drawImage(img, box.x * sx, box.y * sy, box.w * sx, box.h * sy, 0, 0, canvas.width, canvas.height); onSave(canvas.toDataURL('image/jpeg', 0.9)); }}
            style={{ flex: 1, padding: '10px', borderRadius: 7, border: 'none', background: '#D4880A', color: '#fff', cursor: 'pointer' }}>Save Crop</button>
        </div>
      </div>
    </div>
  );
};

const UploadZone: React.FC<{ label: string; hint: string; icon: string; preview: string | null; shape: 'circle' | 'rect'; onFile: (f: File) => void; onClear: () => void }> = ({ label, hint, icon, preview, shape, onFile, onClear }) => {
  const [drag, setDrag] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);
  const readFile = (file: File) => {
    const result = validateImageFile(file);
    if (!result.valid) { alert(result.message); return; }
    const r = new FileReader(); r.onload = () => setCropSrc(r.result as string); r.readAsDataURL(file);
  };
  const handleCropSave = (b64: string) => { setCropSrc(null); fetch(b64).then(r => r.blob()).then(blob => onFile(new File([blob], 'cropped.jpg', { type: 'image/jpeg' }))); };
  return (<>
    {cropSrc && <ImageCropModal src={cropSrc} shape={shape} onSave={handleCropSave} onCancel={() => { setCropSrc(null); if (ref.current) ref.current.value = ''; }} />}
    <div style={{ flex: 1 }}>
      {label && <div style={{ fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#7A7468', marginBottom: '.4rem', fontWeight: 600 }}>{label}</div>}
      <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) readFile(f); }} onClick={() => ref.current?.click()} style={{ border: `2px dashed ${drag ? '#D4880A' : '#DEDAD2'}`, borderRadius: 12, minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#F7F4EF', padding: '1rem', position: 'relative' }}>
        {preview ? (<><img src={preview} alt="" style={{ width: shape === 'circle' ? 80 : '100%', height: shape === 'circle' ? 80 : 100, objectFit: 'cover', borderRadius: shape === 'circle' ? '50%' : 8, marginBottom: '.5rem' }} /><p style={{ fontSize: '.7rem', color: '#D4880A' }}>Click to change</p><button onClick={e => { e.stopPropagation(); onClear(); }} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'rgba(217,48,37,.85)', border: 'none', color: '#fff', fontSize: '.7rem', cursor: 'pointer' }}>x</button></>) : (<><div style={{ fontSize: '2rem', marginBottom: '.4rem' }}>{icon}</div><p style={{ fontWeight: 700, color: '#111108', fontSize: '.82rem' }}>{hint}</p><p style={{ fontSize: '.7rem', color: '#7A7468' }}>Drag and drop or click</p></>)}
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f); e.target.value = ''; }} />
      </div>
    </div>
  </>);
};

const OTPModal: React.FC<{ phone: string; otp: string; onVerify: () => void; onCancel: () => void }> = ({ phone, otp, onVerify, onCancel }) => {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const digits = entered.split(''); digits[idx] = val;
    const next = digits.join('').slice(0, 6); setEntered(next); setError('');
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };
  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => { if (e.key === 'Backspace' && !entered[idx] && idx > 0) inputs.current[idx - 1]?.focus(); };
  const handleVerify = () => { if (entered === otp) { onVerify(); } else { setError('Incorrect OTP. Try again.'); setEntered(''); inputs.current[0]?.focus(); } };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', width: 380, maxWidth: '95vw', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,.15)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
        <h2 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#111108', marginBottom: '.4rem' }}>Verify Your Phone</h2>
        <p style={{ color: '#7A7468', fontSize: '.85rem', marginBottom: '.4rem' }}>A 6-digit OTP was sent to</p>
        <p style={{ color: '#D4880A', fontWeight: 700, fontSize: '.95rem', marginBottom: '1.4rem' }}>{phone}</p>
        <div style={{ background: 'rgba(26,158,92,.08)', border: '1px solid rgba(26,158,92,.2)', borderRadius: 8, padding: '.7rem', marginBottom: '1.4rem', fontSize: '.75rem', color: '#1A9E5C' }}>
          Demo OTP (shown for testing): <strong style={{ letterSpacing: '.2em' }}>{otp}</strong>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <input key={i} ref={el => { inputs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1} value={entered[i] || ''}
              onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
              style={{ width: 44, height: 52, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700, border: `2px solid ${entered[i] ? '#D4880A' : '#DEDAD2'}`, borderRadius: 8, outline: 'none', color: '#111108', background: '#F7F4EF' }}
            />
          ))}
        </div>
        {error && <p style={{ color: '#D93025', fontSize: '.78rem', marginBottom: '.8rem' }}>{error}</p>}
        <button onClick={handleVerify} disabled={entered.length !== 6}
          style={{ width: '100%', padding: '12px', background: entered.length === 6 ? '#D4880A' : '#e5d5bb', color: entered.length === 6 ? '#fff' : '#999', border: 'none', borderRadius: 8, fontWeight: 700, cursor: entered.length === 6 ? 'pointer' : 'default', marginBottom: '.8rem' }}>
          Verify and Continue
        </button>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#7A7468', fontSize: '.82rem', cursor: 'pointer', textDecoration: 'underline' }}>Cancel</button>
      </div>
    </div>
  );
};

const MessagingPanel: React.FC<{ request: SKRequest; username: string; onBack: () => void }> = ({ request, username, onBack }) => {
  const [messages, setMessages] = useState<SKMessage[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const all = getSKMessages().filter(m => m.requestId === request.id);
    setMessages(all);
    const updated = getSKMessages().map(m => m.requestId === request.id && m.fromAdmin ? { ...m, read: true } : m);
    localStorage.setItem(SK_MESSAGES_KEY, JSON.stringify(updated));
  }, [request.id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const send = () => {
    if (!text.trim()) return;
    const msg: SKMessage = { id: `msg_${Date.now()}`, requestId: request.id, fromAdmin: false, sender: username, text: text.trim(), sentAt: new Date().toISOString(), read: false };
    saveSKMessage(msg); setMessages(prev => [...prev, msg]); setText('');
  };
  return (
    <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', height: 520 }}>
      <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #DEDAD2', display: 'flex', alignItems: 'center', gap: '.8rem' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#7A7468', fontSize: '1.2rem', cursor: 'pointer' }}>&larr;</button>
        <div>
          <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: '.95rem', color: '#111108' }}>Chat - {request.shopName}</div>
          <div style={{ fontSize: '.7rem', color: '#1A9E5C', fontWeight: 600 }}>Approved - You can message the admin</div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {messages.length === 0 && (<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}><div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>💬</div><p style={{ fontSize: '.85rem' }}>Start a conversation with the admin</p></div>)}
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.fromAdmin ? 'flex-start' : 'flex-end' }}>
            <div style={{ maxWidth: '75%', padding: '.7rem 1rem', borderRadius: msg.fromAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: msg.fromAdmin ? '#F7F4EF' : '#D4880A', color: msg.fromAdmin ? '#111108' : '#fff', fontSize: '.85rem', lineHeight: 1.5 }}>
              {msg.fromAdmin && <div style={{ fontSize: '.62rem', fontWeight: 700, color: '#D4880A', marginBottom: '.2rem' }}>Admin</div>}
              <div>{msg.text}</div>
              <div style={{ fontSize: '.62rem', opacity: 0.6, marginTop: '.3rem', textAlign: 'right' }}>{new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '.8rem 1rem', borderTop: '1px solid #DEDAD2', display: 'flex', gap: '.6rem' }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Message admin..." onKeyDown={e => e.key === 'Enter' && send()}
          style={{ flex: 1, padding: '10px 14px', border: '2px solid #DEDAD2', borderRadius: 8, fontSize: '.85rem', color: '#111108', background: '#F7F4EF', outline: 'none' }}
          onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = '#DEDAD2'; }} />
        <button onClick={send} disabled={!text.trim()} style={{ padding: '10px 18px', background: text.trim() ? '#D4880A' : '#e5d5bb', color: text.trim() ? '#fff' : '#999', border: 'none', borderRadius: 8, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default' }}>Send</button>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { login, signup } = useShopkeeperStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpData, setOtpData] = useState<{ otp: string; user: { username: string; phone: string; password: string } } | null>(null);

  const handleSignup = async () => {
    if (!username.trim() || !password || !phone.trim()) { setError('All fields are required.'); return; }
    if (phone.replace(/\D/g, '').length < 10) { setError('Enter a valid 10-digit phone number.'); return; }
    setLoading(true); setError('');
    await new Promise(r => setTimeout(r, 400));
    setOtpData({ otp: generateOTP(), user: { username: username.trim(), phone: phone.trim(), password } });
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password) { setError('All fields are required.'); return; }
    setLoading(true); setError('');
    try { await login(username.trim(), password); }
    catch (e: unknown) { setError((e as Error).message); }
    finally { setLoading(false); }
  };

  const handleOTPVerified = async () => {
    if (!otpData) return;
    setLoading(true);
    try { await signup(otpData.user.username, otpData.user.password, otpData.user.phone); setOtpData(null); }
    catch (e: unknown) { setError((e as Error).message); setOtpData(null); }
    finally { setLoading(false); }
  };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#F7F4EF', border: '2px solid #DEDAD2', borderRadius: 8, color: '#111108', fontFamily: "DM Sans,sans-serif", fontSize: '.9rem', outline: 'none', boxSizing: 'border-box', marginBottom: '.9rem', display: 'block' };
  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF', display: 'flex', flexDirection: 'column' }}>
      {otpData && <OTPModal phone={otpData.user.phone} otp={otpData.otp} onVerify={handleOTPVerified} onCancel={() => setOtpData(null)} />}
      <header style={{ background: '#111108', borderBottom: '2.5px solid #D4880A', padding: '0 2.5rem', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: "Syne,sans-serif", fontSize: '1.9rem', fontWeight: 800, color: '#fff' }}>Mark<span style={{ color: '#D4880A' }}>o</span>pen</div>
        <button onClick={onBack} style={{ padding: '7px 16px', border: '1.5px solid #2e2e2e', borderRadius: 6, background: 'transparent', color: '#aaa', fontSize: '.78rem', cursor: 'pointer' }}>Back</button>
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '2.8rem', width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,.08)' }}>
          <p style={{ fontFamily: "Syne,sans-serif", fontSize: '.62rem', letterSpacing: '.22em', textTransform: 'uppercase', color: '#D4880A', marginBottom: '.4rem' }}>Shopkeeper Portal</p>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#111108', marginBottom: '1.8rem' }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={inp}
            onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = '#DEDAD2'; }}
            onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()} />
          {mode === 'signup' && (
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number (for OTP verification)" type="tel" style={inp}
              onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = '#DEDAD2'; }} />
          )}
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={inp}
            onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = '#DEDAD2'; }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())} />
          {error && <p style={{ color: '#D93025', fontSize: '.78rem', marginBottom: '.8rem' }}>{error}</p>}
          <button onClick={mode === 'login' ? handleLogin : handleSignup} disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#bbb' : '#D4880A', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: '.9rem', cursor: loading ? 'wait' : 'pointer', marginBottom: '1.2rem' }}>
            {loading ? '...' : mode === 'login' ? 'Sign In' : 'Send OTP and Verify'}
          </button>
          {mode === 'signup' && (
            <div style={{ background: 'rgba(212,136,10,.06)', border: '1px solid rgba(212,136,10,.2)', borderRadius: 8, padding: '.7rem .9rem', marginBottom: '1rem', fontSize: '.75rem', color: '#7A5C0A' }}>
              An OTP will be sent to your phone number to verify your identity before creating your account.
            </div>
          )}
          <p style={{ textAlign: 'center', fontSize: '.82rem', color: '#7A7468' }}>
            {mode === 'login' ? "Don\'t have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setPhone(''); }}
              style={{ background: 'none', border: 'none', color: '#D4880A', fontWeight: 700, cursor: 'pointer', fontSize: '.82rem' }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { username, phone, logout } = useShopkeeperStore();
  const [myReqs, setMyReqs] = useState<SKRequest[]>([]);
  const existingReqs = getSKRequests().filter(r => r.submittedBy === username);
  const [view, setView] = useState<'list' | 'form' | 'chat'>(existingReqs.length > 0 ? 'list' : 'form');
  const [chatReq, setChatReq] = useState<SKRequest | null>(null);
  const [requestType, setRequestType] = useState<RequestType>('new_shop');
  const [shopName, setShopName] = useState('');
  const [skName, setSkName] = useState('');
  const [phoneField, setPhoneField] = useState(phone || '');
  const [mapLink, setMapLink] = useState('');
  const [description, setDescription] = useState('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(true);
  const [showPhone, setShowPhone] = useState(false);

  useEffect(() => { setMyReqs(getSKRequests().filter(r => r.submittedBy === username)); }, [username, view]);

  const readImage = (file: File, setter: (s: string) => void) => { const r = new FileReader(); r.onload = () => setter(r.result as string); r.readAsDataURL(file); };
  const resetForm = () => { setShopName(''); setSkName(''); setPhoneField(phone || ''); setMapLink(''); setDescription(''); setLogoPreview(null); setPhotoPreview(null); setErrors({}); setShowTypeSelect(true); setRequestType('new_shop'); setSubmitted(false); setSubmitting(false); setShowPhone(false); };
  const needsShopDetails = requestType === 'new_shop' || requestType === 'add_another_shop' || requestType === 'update_info';
  const validate = () => {
    const errs: Record<string, string> = {};
    if (needsShopDetails) {
      const nameResult = validateShopName(shopName);
      if (!nameResult.valid) errs.shopName = nameResult.message;

      const nameCheck = skName.trim();
      if (!nameCheck) errs.skName = 'Your name is required.';
      else if (nameCheck.length < 2) errs.skName = 'Name must be at least 2 characters.';

      const phoneResult = validatePhone(phoneField);
      if (!phoneResult.valid) errs.phone = phoneResult.message;

      if (description.trim()) {
        const descResult = validateDescription(description);
        if (!descResult.valid) errs.description = descResult.message;
      }
    } else {
      if (!description.trim()) {
        errs.description = 'Please describe your request.';
      } else {
        const descResult = validateDescription(description);
        if (!descResult.valid) errs.description = descResult.message;
      }
    }

    setErrors(errs); return Object.keys(errs).length === 0;
  };
  const handleSubmit = async () => {
    if (submitting || submitted) return;
    if (!validate()) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 700));
    const rtMeta = REQUEST_TYPES.find(t => t.value === requestType);
    const req: SKRequest = { id: `sk_${Date.now()}`, submittedBy: username!, shopId: null, shopName: shopName.trim(), shopkeeperName: skName.trim(), phone: phoneField.trim(), logoBase64: logoPreview, shopPhotoBase64: photoPreview, mapLink: mapLink.trim(), status: 'pending', submittedAt: new Date().toISOString(), requestType, description: description.trim(), showPhone };
    saveSKRequest(req); setMyReqs(getSKRequests().filter(r => r.submittedBy === username));
    setSubmitting(false); setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setView('list'); }, 1800);
  };

  const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#F7F4EF', border: '2px solid #DEDAD2', borderRadius: 8, color: '#111108', fontFamily: "DM Sans,sans-serif", fontSize: '.9rem', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '.6rem', letterSpacing: '.14em', textTransform: 'uppercase', color: '#7A7468', marginBottom: '.4rem', fontWeight: 600 };
  const statusMap = { pending: { bg: 'rgba(240,165,0,.1)', color: '#D4880A', label: 'Pending' }, approved: { bg: 'rgba(26,158,92,.1)', color: '#1A9E5C', label: 'Approved' }, rejected: { bg: 'rgba(217,48,37,.1)', color: '#D93025', label: 'Rejected' } };
  const getUnread = (reqId: string) => getSKMessages().filter(m => m.requestId === reqId && m.fromAdmin && !m.read).length;
  const totalUnread = myReqs.reduce((acc, r) => acc + getUnread(r.id), 0);

  if (view === 'chat' && chatReq) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F4EF' }}>
        <header style={{ background: '#111108', borderBottom: '2.5px solid #D4880A', padding: '0 2rem', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Mark<span style={{ color: '#D4880A' }}>o</span>pen</div>
          <button onClick={() => setView('list')} style={{ padding: '7px 14px', border: '1.5px solid #2e2e2e', borderRadius: 6, background: 'transparent', color: '#aaa', fontSize: '.75rem', cursor: 'pointer' }}>Back to Requests</button>
        </header>
        <div style={{ maxWidth: 680, margin: '2rem auto', padding: '0 2rem' }}>
          <MessagingPanel request={chatReq} username={username!} onBack={() => setView('list')} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4EF' }}>
      <header style={{ background: '#111108', borderBottom: '2.5px solid #D4880A', padding: '0 2rem', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontFamily: "Syne,sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>Mark<span style={{ color: '#D4880A' }}>o</span>pen</div>
          <span style={{ background: '#D4880A', color: '#fff', fontSize: '.58rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4 }}>Shopkeeper</span>
          <span style={{ fontSize: '.75rem', color: '#888' }}>👤 {username}</span>
          {phone && <span style={{ fontSize: '.7rem', color: '#666' }}>📱 {phone}</span>}
        </div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button onClick={onBack} style={{ padding: '7px 14px', border: '1.5px solid #2e2e2e', borderRadius: 6, background: 'transparent', color: '#aaa', fontSize: '.75rem', cursor: 'pointer' }} onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; }}>Public Site</button>
          <button onClick={logout} style={{ padding: '7px 14px', border: '1.5px solid rgba(217,48,37,.3)', borderRadius: 6, background: 'rgba(217,48,37,.08)', color: '#f87171', fontSize: '.75rem', cursor: 'pointer' }}>Sign Out</button>
        </div>
      </header>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 2rem' }}>
        {myReqs.length > 0 && (
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '2rem' }}>
            <button
              onClick={() => { resetForm(); setView('form'); }}
              style={{ padding: '9px 20px', borderRadius: 8, border: view === 'form' ? 'none' : '1.5px solid #DEDAD2', background: view === 'form' ? '#D4880A' : '#fff', color: view === 'form' ? '#fff' : '#7A7468', fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}
            >
              + New Request
            </button>
          </div>
        )}

        {view === 'form' && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,.06)' }}>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#111108', marginBottom: '.3rem' }}>Register Your Shop</h2>
            <p style={{ color: '#7A7468', fontSize: '.85rem', marginBottom: '1.8rem' }}>Fill in your shop details and submit for admin review.</p>
            <div style={{ fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#D4880A', fontWeight: 700, borderBottom: '1px solid #DEDAD2', paddingBottom: '.5rem', marginBottom: '1rem' }}>Shop Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={lbl}>Shop Name *</label>
                  <span style={{ fontSize: '.58rem', fontWeight: 600, color: shopName.trim().length > 100 ? '#D93025' : '#aaa', marginBottom: '.4rem' }}>{shopName.trim().length}/100</span>
                </div>
                <input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. Sumit General Store" style={{ ...inp, ...(errors.shopName ? { borderColor: '#D93025' } : {}) }} onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = errors.shopName ? '#D93025' : '#DEDAD2'; }} />
                {errors.shopName && <p style={{ color: '#D93025', fontSize: '.7rem', marginTop: '.2rem' }}>{errors.shopName}</p>}
              </div>
              <div>
                <label style={lbl}>Your Name *</label>
                <input value={skName} onChange={e => setSkName(e.target.value)} placeholder="Full name" style={{ ...inp, ...(errors.skName ? { borderColor: '#D93025' } : {}) }} onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = errors.skName ? '#D93025' : '#DEDAD2'; }} />
                {errors.skName && <p style={{ color: '#D93025', fontSize: '.7rem', marginTop: '.2rem' }}>{errors.skName}</p>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={lbl}>Phone * <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#aaa' }}>(10 digits)</span></label>
                <input value={phoneField} onChange={e => setPhoneField(e.target.value)} placeholder="e.g. 9876543210" type="tel" style={{ ...inp, ...(errors.phone ? { borderColor: '#D93025' } : {}) }} onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = errors.phone ? '#D93025' : '#DEDAD2'; }} />
                {errors.phone && <p style={{ color: '#D93025', fontSize: '.7rem', marginTop: '.2rem' }}>{errors.phone}</p>}
                <div
                  onClick={() => setShowPhone(v => !v)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', marginTop: '.6rem' }}
                >
                  <div style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', transition: 'background .2s', background: showPhone ? '#D4880A' : '#DEDAD2', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 2, left: showPhone ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </div>
                  <span style={{ fontSize: '.72rem', color: showPhone ? '#D4880A' : '#7A7468', fontWeight: 600 }}>
                    {showPhone ? 'Phone visible to public' : 'Phone hidden from public'}
                  </span>
                </div>
              </div>
              <div>
                <label style={lbl}>Google Maps Link <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                <input value={mapLink} onChange={e => setMapLink(e.target.value)} placeholder="https://maps.google.com/..." style={inp} onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = '#DEDAD2'; }} />
              </div>
            </div>
            <div style={{ marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={lbl}>Description <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#aaa' }}>(optional)</span></label>
                <span style={{ fontSize: '.58rem', fontWeight: 600, color: charCount(description, 500).over ? '#D93025' : '#aaa' }}>{charCount(description, 500).remaining}/500</span>
              </div>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Tell customers about your shop..." style={{ ...inp, resize: 'vertical', borderColor: errors.description ? '#D93025' : undefined }} onFocus={e => { e.target.style.borderColor = '#D4880A'; }} onBlur={e => { e.target.style.borderColor = errors.description ? '#D93025' : '#DEDAD2'; }} />
              {errors.description && <p style={{ color: '#D93025', fontSize: '.7rem', marginTop: '.2rem' }}>{errors.description}</p>}
            </div>
            <div style={{ marginBottom: '1.6rem' }}>
              <div style={{ fontSize: '.62rem', letterSpacing: '.15em', textTransform: 'uppercase', color: '#D4880A', fontWeight: 700, borderBottom: '1px solid #DEDAD2', paddingBottom: '.5rem', marginBottom: '1rem' }}>Images <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: '#aaa' }}>(optional)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

                {/* Banner */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>🖼️</span>
                    <div>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#111108', letterSpacing: '.04em' }}>Shop Banner</div>
                      <div style={{ fontSize: '.65rem', color: '#7A7468' }}>Wide image shown at the top of your shop page · recommended 1200×400px</div>
                    </div>
                  </div>
                  <UploadZone label="" hint="Upload a wide banner photo" icon="🖼️" preview={photoPreview} shape="rect" onFile={f => readImage(f, setPhotoPreview)} onClear={() => setPhotoPreview(null)} />
                </div>

                {/* Logo */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.5rem' }}>
                    <span style={{ fontSize: '1rem' }}>🏷️</span>
                    <div>
                      <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#111108', letterSpacing: '.04em' }}>Shop Logo</div>
                      <div style={{ fontSize: '.65rem', color: '#7A7468' }}>Round icon shown on the shop card and inside your shop page · recommended 400×400px</div>
                    </div>
                  </div>
                  <UploadZone label="" hint="Upload a square logo" icon="🏷️" preview={logoPreview} shape="circle" onFile={f => readImage(f, setLogoPreview)} onClear={() => setLogoPreview(null)} />
                </div>

              </div>
            </div>
            {submitted && <div style={{ background: 'rgba(26,158,92,.1)', border: '1px solid rgba(26,158,92,.3)', borderRadius: 8, padding: '.9rem', textAlign: 'center', marginBottom: '1rem', color: '#1A9E5C', fontWeight: 700 }}>✅ Submitted! Admin will review your shop shortly.</div>}
            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '13px', background: submitting ? '#bbb' : '#D4880A', color: '#fff', border: 'none', borderRadius: 8, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: '.95rem', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Submitting...' : 'Submit Shop for Review'}
            </button>
          </div>
        )}

        {view === 'list' && (myReqs.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '4rem', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, color: '#111108', marginBottom: '.5rem' }}>No requests yet</h3>
            <p style={{ color: '#7A7468', fontSize: '.9rem', marginBottom: '1.5rem' }}>Your submitted requests will appear here once the admin adds them.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myReqs.map(req => {
              const st = statusMap[req.status]; const rtMeta = REQUEST_TYPES.find(t => t.value === req.requestType); const unread = getUnread(req.id);
              return (
                <div key={req.id} style={{ background: '#fff', borderRadius: 14, padding: '1.4rem', boxShadow: '0 2px 12px rgba(0,0,0,.05)', display: 'flex', gap: '1rem', alignItems: 'flex-start', borderLeft: `4px solid ${req.status === 'approved' ? '#1A9E5C' : req.status === 'rejected' ? '#D93025' : '#D4880A'}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 10, background: '#F7F4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{rtMeta?.icon || '📋'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '.3rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: '1rem', color: '#111108' }}>{req.shopName}</span>
                      <span style={{ fontSize: '.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(212,136,10,.1)', color: '#D4880A' }}>{rtMeta?.label}</span>
                      <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: st.bg, color: st.color }}>{req.status === 'approved' ? '✅' : req.status === 'rejected' ? '❌' : '⏳'} {st.label}</span>
                    </div>
                    <div style={{ fontSize: '.8rem', color: '#7A7468', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                      <span>👤 {req.shopkeeperName}</span><span>📞 {req.phone}</span>{req.mapLink && <span>📍 Map</span>}
                    </div>
                    {req.description && <div style={{ fontSize: '.78rem', color: '#555', background: '#F7F4EF', borderRadius: 6, padding: '.4rem .7rem', marginBottom: '.4rem' }}>{req.description}</div>}
                    {req.adminNote && <div style={{ fontSize: '.78rem', color: '#D93025', background: 'rgba(217,48,37,.06)', borderRadius: 6, padding: '.5rem .75rem', marginBottom: '.4rem' }}>Admin: {req.adminNote}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
                      <span style={{ fontSize: '.68rem', color: '#aaa' }}>{new Date(req.submittedAt).toLocaleString()}</span>
                      {req.status === 'approved' && (
                        <button onClick={() => { setChatReq(req); setView('chat'); }}
                          style={{ position: 'relative', padding: '6px 14px', background: '#111108', color: '#fff', border: 'none', borderRadius: 7, fontFamily: "Syne,sans-serif", fontWeight: 700, fontSize: '.75rem', cursor: 'pointer' }}>
                          💬 Message Admin
                          {unread > 0 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#D93025', color: '#fff', fontSize: '.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: 10 }}>{unread}</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}


      </div>
    </div>
  );
};

const ShopkeeperPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { isLoggedIn } = useShopkeeperStore();
  if (!isLoggedIn) return <AuthScreen onBack={onBack} />;
  return <Dashboard onBack={onBack} />;
};

export default ShopkeeperPage;