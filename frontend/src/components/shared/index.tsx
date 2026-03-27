// src/components/shared/index.tsx
import React, { useEffect, useRef } from 'react';
import type { Category } from '../../types';
import { CAT_META, TOAST_DURATION_MS } from '../../lib/constants';

// ─── CAT TAG ─────────────────────────────────────────────────────────────────
interface CatTagProps { cat: Category; subcat?: string; size?: 'sm' | 'md'; }

export const CatTag: React.FC<CatTagProps> = ({ cat, subcat, size = 'sm' }) => {
  const m = CAT_META[cat];
  return (
    <span style={{
      display: 'inline-block',
      fontSize: size === 'sm' ? '.62rem' : '.7rem',
      fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
      padding: size === 'sm' ? '3px 8px' : '4px 11px', borderRadius: 4,
      background: m.bg, color: m.color,
    }}>
      {m.icon} {cat}{subcat ? ` · ${subcat}` : ''}
    </span>
  );
};

// ─── STATUS BADGE ────────────────────────────────────────────────────────────
interface StatusBadgeProps { open: boolean; size?: 'sm' | 'md'; }

export const StatusBadge: React.FC<StatusBadgeProps> = ({ open, size = 'sm' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: size === 'sm' ? '5px 12px' : '7px 16px',
    borderRadius: 20, fontSize: size === 'sm' ? '.66rem' : '.75rem',
    fontWeight: 700, fontFamily: "'Syne', sans-serif",
    letterSpacing: '.06em', textTransform: 'uppercase', flexShrink: 0,
    background: open ? '#EDFAF3' : '#FEF0EF',
    color: open ? 'var(--green)' : 'var(--red)',
    border: `1px solid ${open ? 'rgba(26,158,92,.18)' : 'rgba(217,48,37,.18)'}`,
  }}>
    <span style={{
      width: size === 'sm' ? 7 : 9, height: size === 'sm' ? 7 : 9,
      borderRadius: '50%', flexShrink: 0, display: 'inline-block',
      background: open ? 'var(--glow)' : 'var(--red)',
      animation: open ? 'glowPulse 1.4s ease-in-out infinite' : 'none',
    }} />
    {open ? 'Open' : 'Closed'}
  </span>
);

// ─── SPINNER ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; color?: string }> = ({
  size = 32, color = 'var(--amber)',
}) => (
  <div style={{
    width: size, height: size, borderRadius: '50%',
    border: `3px solid ${color}22`,
    borderTop: `3px solid ${color}`,
    animation: 'spin .8s linear infinite',
    display: 'inline-block',
    flexShrink: 0,
  }} />
);

// ─── SKELETON CARD ────────────────────────────────────────────────────────────
export const SkeletonCard: React.FC = () => (
  <div style={{
    background: 'var(--card)',
    border: '1.5px solid var(--border)',
    borderRadius: 14,
    overflow: 'hidden',
    padding: '1.2rem',
  }}>
    <div style={{ display: 'flex', gap: 11, marginBottom: '1rem' }}>
      <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 18, width: '70%' }} />
      </div>
    </div>
    <div style={{ borderTop: '1px solid var(--border)', marginBottom: '.8rem' }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <div className="skeleton" style={{ height: 13, width: '55%' }} />
      <div className="skeleton" style={{ height: 22, width: '22%', borderRadius: 5 }} />
    </div>
  </div>
);

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
interface EmptyStateProps { icon?: string; title: string; subtitle?: string; }

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '🔍', title, subtitle }) => (
  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem 2rem', color: 'var(--muted)' }}>
    <div style={{ fontSize: '3rem', marginBottom: '.75rem' }}>{icon}</div>
    <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', color: 'var(--dark)', marginBottom: '.4rem' }}>{title}</h3>
    {subtitle && <p style={{ fontSize: '.9rem' }}>{subtitle}</p>}
  </div>
);

// ─── TOAST ───────────────────────────────────────────────────────────────────
interface ToastProps { msg: string; type?: 'success' | 'error'; onDone: () => void; }

export const Toast: React.FC<ToastProps> = ({ msg, type = 'success', onDone }) => {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    timer.current = setTimeout(onDone, type === 'error' ? 8000 : TOAST_DURATION_MS);
    return () => clearTimeout(timer.current);
  }, [onDone]);

  const accent = type === 'error' ? 'var(--adm-red)' : 'var(--adm-green)';
  return (
    <div style={{
      position: 'fixed', bottom: '1.8rem', right: '1.8rem',
      background: 'var(--adm-surf)', border: '1px solid var(--adm-border)',
      borderLeft: `4px solid ${accent}`,
      padding: '.9rem 1.4rem', borderRadius: 8, fontSize: '.85rem',
      boxShadow: '0 8px 30px rgba(0,0,0,.4)', zIndex: 999,
      color: 'var(--adm-text)', animation: 'slideIn .28s ease',
      display: 'flex', alignItems: 'flex-start', gap: '.65rem', maxWidth: 440, wordBreak: 'break-word',
    }}>
      <span style={{ color: accent, flexShrink: 0 }}>{type === 'error' ? '✕' : '✓'}</span>
      {msg}
    </div>
  );
};

// ─── ADMIN INPUT ─────────────────────────────────────────────────────────────
interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const AdminInput: React.FC<AdminInputProps> = ({ label, style, onFocus, onBlur, ...props }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    {label && (
      <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.45rem' }}>
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        width: '100%', padding: '10px 13px',
        background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)',
        borderRadius: 7, color: 'var(--adm-text)', fontSize: '.88rem', outline: 'none',
        transition: 'border-color .2s',
        ...style,
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--adm-amber)'; onFocus?.(e); }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--adm-border)'; onBlur?.(e); }}
    />
  </div>
);

// ─── ADMIN SELECT ────────────────────────────────────────────────────────────
interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const AdminSelect: React.FC<AdminSelectProps> = ({ label, children, onFocus, onBlur, ...props }) => (
  <div style={{ marginBottom: '1.1rem' }}>
    {label && (
      <label style={{ display: 'block', fontSize: '.62rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--adm-muted)', marginBottom: '.45rem' }}>
        {label}
      </label>
    )}
    <select
      {...props}
      style={{
        width: '100%', padding: '10px 13px',
        background: 'var(--adm-surf2)', border: '1.5px solid var(--adm-border)',
        borderRadius: 7, color: 'var(--adm-text)', fontSize: '.88rem',
        outline: 'none', appearance: 'none', cursor: 'pointer',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235E5E72' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 13px center',
        paddingRight: '2.2rem',
      }}
      onFocus={(e) => { e.target.style.borderColor = 'var(--adm-amber)'; onFocus?.(e); }}
      onBlur={(e) => { e.target.style.borderColor = 'var(--adm-border)'; onBlur?.(e); }}
    >
      {children}
    </select>
  </div>
);

// ─────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────

export const StarRating: React.FC<{
  value: number;
  onChange: (rating: number) => void;
}> = ({ value, onChange }) => {
  return (
    <div style={{ display: "flex", gap: 6, fontSize: "1.4rem" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onChange(n)}
          style={{
            cursor: "pointer",
            color: n <= value ? "#f5b301" : "#ccc",
            transition: "color .2s"
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};


// ─────────────────────────────────────────
// FEEDBACK TYPE TAG
// ─────────────────────────────────────────

interface FeedbackTypeTagProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

export const FeedbackTypeTag: React.FC<FeedbackTypeTagProps> = ({
  label,
  icon,
  active,
  onClick
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: "6px 12px",
      borderRadius: 20,
      border: active
        ? "2px solid var(--amber)"
        : "1px solid var(--border)",
      background: active ? "var(--amber)" : "transparent",
      color: active ? "#fff" : "var(--dark)",
      cursor: "pointer",
      fontSize: ".75rem",
      display: "flex",
      alignItems: "center",
      gap: 4,
      transition: "all .2s"
    }}
  >
    <span>{icon}</span>
    {label}
  </button>
);


// ─────────────────────────────────────────
// FORM TEXTAREA
// ─────────────────────────────────────────

interface FormTextareaProps {
  label?: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  value,
  placeholder,
  required,
  disabled,
  onChange
}) => (
  <div style={{ marginTop: 10 }}>
    {label && (
      <label
        style={{
          display: "block",
          fontSize: ".75rem",
          marginBottom: 4
        }}
      >
        {label}
      </label>
    )}

    <textarea
      value={value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      onChange={onChange}
      rows={4}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        fontFamily: "inherit",
        resize: "vertical"
      }}
    />
  </div>
);