// src/components/public/UserAuthModal.tsx
import React, { useState, useEffect } from 'react';
import { useUserAuthStore } from '../hooks/useUserAuthStore';

interface Props {
  onClose: () => void;
}

type Mode = 'login' | 'signup';

const UserAuthModal: React.FC<Props> = ({ onClose }) => {
  const { login, signup } = useUserAuthStore();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!username.trim() || !password) { setError('All fields are required.'); return; }
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: '#F7F6F3', border: '1.5px solid #E2DDD6',
    borderRadius: 8, color: '#1A1A14',
    fontFamily: "'Syne', sans-serif", fontSize: '.9rem',
    outline: 'none', marginBottom: '.85rem', display: 'block',
    boxSizing: 'border-box', transition: 'border-color .2s',
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,10,8,.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 600, backdropFilter: 'blur(8px)',
        padding: '1rem', animation: 'fadeIn .2s ease',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 400,
        boxShadow: '0 24px 64px rgba(0,0,0,.18)', animation: 'slideIn .25s ease',
        overflow: 'hidden',
      }}>
        {/* Top accent bar */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, var(--amber), #F5A623)' }} />

        <div style={{ padding: '2.2rem 2.2rem 2rem' }}>
          {/* Branding */}
          <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontSize: '1.7rem',
              fontWeight: 800, color: '#1A1A14', letterSpacing: -0.5,
            }}>
              Sh<span style={{ color: 'var(--amber)' }}>o</span>pen
            </div>
            <div style={{
              fontSize: '.72rem', letterSpacing: '.16em',
              textTransform: 'uppercase', color: '#999', marginTop: 4,
            }}>
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: '#F7F6F3',
            borderRadius: 10, padding: 4, marginBottom: '1.6rem',
          }}>
            {(['login', 'signup'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                  fontFamily: "'Syne', sans-serif", fontSize: '.82rem', fontWeight: 700,
                  cursor: 'pointer', transition: 'all .2s',
                  background: mode === m ? '#fff' : 'transparent',
                  color: mode === m ? '#1A1A14' : '#999',
                  boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,.1)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <input
            placeholder="Username"
            value={username}
            autoComplete="username"
            onChange={e => setUsername(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--amber)'}
            onBlur={e => e.target.style.borderColor = '#E2DDD6'}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('user-pw')?.focus()}
          />
          <input
            id="user-pw"
            placeholder="Password"
            type="password"
            value={password}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            onChange={e => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 0 }}
            onFocus={e => e.target.style.borderColor = 'var(--amber)'}
            onBlur={e => e.target.style.borderColor = '#E2DDD6'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          {mode === 'signup' && (
            <div style={{ fontSize: '.68rem', color: '#aaa', marginTop: '.5rem' }}>
              Min. 3 chars for username, 6 for password.
            </div>
          )}

          {error && (
            <div style={{
              color: 'var(--red)', fontSize: '.78rem',
              marginTop: '.8rem', padding: '8px 12px',
              background: 'rgba(217,48,37,.06)', borderRadius: 6,
              border: '1px solid rgba(217,48,37,.15)',
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: '1.3rem', padding: '12px',
              background: loading ? '#bbb' : 'var(--amber)',
              color: '#1A1208', border: 'none', borderRadius: 9,
              fontFamily: "'Syne', sans-serif", fontSize: '.9rem', fontWeight: 800,
              cursor: loading ? 'wait' : 'pointer',
              transition: 'opacity .2s, background .2s',
              letterSpacing: '.02em',
            }}
          >
            {loading ? '…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%', marginTop: '.65rem', padding: '10px',
              background: 'transparent', border: 'none',
              color: '#aaa', fontSize: '.78rem', cursor: 'pointer',
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuthModal;
