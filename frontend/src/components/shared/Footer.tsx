// src/components/shared/Footer.tsx
import React, { useState, useEffect } from "react";
import { fetchShops } from "../../api/client";

const YEAR = new Date().getFullYear();

type NavLink = { label: string; href?: string; newTab?: boolean; action?: string; filter?: string };

const links: Record<string, NavLink[]> = {
  Explore: [
    { label: "All Shops", action: "explore", filter: "all" },
    { label: "Open Now", action: "explore", filter: "open" },
    { label: "🍽️ Food & Dining", action: "explore", filter: "Food" },
    { label: "💊 Medical & Pharmacy", action: "explore", filter: "Medical" },
    { label: "☕ Cafés", action: "explore", filter: "Café" },
  ],

  Company: [
    { label: "About Markopen", action: "about" },
    { label: "Privacy Policy", action: "privacy" },
    { label: "Terms of Use", action: "terms" },
    { label: "Contact Us", href: "#contact" },
    { label: "Sitemap", href: "/sitemap.xml" },
  ],
};

const socials = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/markopen_india/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  {
    label: "Twitter / X",
    href: "https://twitter.com",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];



interface FooterProps {
  onAbout?: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
  onExplore?: (filter: string) => void;
}

export default function Footer({ onAbout, onPrivacy, onTerms, onExplore }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'done'>('idle');
  const [totalShops, setTotalShops] = useState<number | null>(null);
  const [openShops, setOpenShops] = useState<number | null>(null);

  useEffect(() => {
    fetchShops().then(shops => {
      setTotalShops(shops.length);
      setOpenShops(shops.filter(s => s.is_open).length);
    }).catch(() => { });
  }, []);

  const stats = [
    { value: totalShops !== null ? `${totalShops}+` : '…', label: "Shops Listed" },
    { value: openShops !== null ? `${openShops}` : '…', label: "Open Right Now" },
    { value: "24/7", label: "Real-time Hours" },
    { value: "3", label: "Categories" },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubStatus('done');
    setEmail('');
    setTimeout(() => setSubStatus('idle'), 4000);
  };

  return (
    <footer style={{ background: '#111108', color: '#F7F4EF', borderTop: '2.5px solid #D4880A' }}>

      {/* ── Stats bar ── */}
      <div style={{ borderBottom: '1px solid #1e1e1e', background: 'rgba(212,136,10,.04)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#D4880A', letterSpacing: -.5 }}>{s.value}</div>
              <div style={{ fontSize: '.68rem', color: '#7A7468', textTransform: 'uppercase', letterSpacing: '.1em', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '52px 24px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2.5rem' }}>

        {/* Brand column */}
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: '1rem' }}>
            Mark<span style={{ color: '#F0A420' }}>o</span>pen
          </div>
          <p style={{ fontSize: '.84rem', color: '#7A7468', lineHeight: 1.8, marginBottom: '1.4rem' }}>
            Your real-time local shop directory. Find what's open near you — food, medicine, cafés and more — instantly. No calls, no guessing.
          </p>

          {/* Why Markopen pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.4rem' }}>
            {['✓ Always up-to-date', '✓ Free to browse', '✓ Local first'].map(t => (
              <span key={t} style={{ fontSize: '.68rem', background: 'rgba(212,136,10,.1)', border: '1px solid rgba(212,136,10,.2)', color: '#D4880A', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>{t}</span>
            ))}
          </div>

          {/* Socials */}
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            {socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label}
                style={{ width: 34, height: 34, borderRadius: 7, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#7A7468', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4880A'; e.currentTarget.style.color = '#D4880A'; e.currentTarget.style.background = 'rgba(212,136,10,.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#7A7468'; e.currentTarget.style.background = '#1a1a1a'; }}
              >{s.icon}</a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {Object.entries(links).map(([heading, items]) => (
          <div key={heading}>
            <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: '.68rem', fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: '#D4880A', marginBottom: '1.1rem' }}>
              {heading}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {items.map(item => (
                <li key={item.label}>
                  {item.action ? (
                    <button
                      onClick={() => {
                        if (item.action === 'about') onAbout?.();
                        if (item.action === 'privacy') onPrivacy?.();
                        if (item.action === 'terms') onTerms?.();
                        if (item.action === 'explore' && item.filter) onExplore?.(item.filter);
                      }}
                      style={{ fontSize: '.83rem', color: '#7A7468', textDecoration: 'none', transition: 'color .15s', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F7F4EF'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#7A7468'; }}
                    >{item.label}</button>
                  ) : (
                    <a href={item.href}
                      {...(item.newTab ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                      style={{ fontSize: '.83rem', color: '#7A7468', textDecoration: 'none', transition: 'color .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#F7F4EF'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#7A7468'; }}
                    >{item.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter + contact */}
        <div>
          <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: '.68rem', fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: '#D4880A', marginBottom: '1.1rem' }}>
            Stay Updated
          </h4>
          <p style={{ fontSize: '.8rem', color: '#7A7468', lineHeight: 1.65, marginBottom: '1rem' }}>
            Get notified when new shops join or hours change in your area.
          </p>

          {subStatus === 'done' ? (
            <div style={{ background: 'rgba(26,158,92,.1)', border: '1px solid rgba(26,158,92,.25)', borderRadius: 8, padding: '10px 14px', fontSize: '.82rem', color: '#34D399' }}>
              ✅ You're subscribed!
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ padding: '9px 12px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, color: '#F7F4EF', fontSize: '.84rem', outline: 'none', transition: 'border-color .15s' }}
                onFocus={e => { e.target.style.borderColor = '#D4880A'; }}
                onBlur={e => { e.target.style.borderColor = '#2a2a2a'; }}
              />
              <button type="submit"
                style={{ padding: '9px', background: '#D4880A', color: '#111108', border: 'none', borderRadius: 7, fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >Subscribe →</button>
            </form>
          )}

          {/* Contact */}
          <div style={{ marginTop: '1.4rem', display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
            <h4 style={{ fontFamily: "'Syne', sans-serif", fontSize: '.68rem', fontWeight: 800, letterSpacing: '.15em', textTransform: 'uppercase', color: '#D4880A', marginBottom: '.2rem' }}>Contact</h4>
            <a href="mailto:markopen2026@gmail.com"
              style={{ fontSize: '.8rem', color: '#7A7468', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem', transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F7F4EF'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7A7468'; }}
            >✉ markopen2026@gmail.com</a>
            <a href="https://wa.me/919124788164"
              style={{ fontSize: '.8rem', color: '#7A7468', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem', transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F7F4EF'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7A7468'; }}
            >💬 WhatsApp Support</a>
            <a href="tel:+919124788164"
              style={{ fontSize: '.8rem', color: '#7A7468', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.4rem', transition: 'color .15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#F7F4EF'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#7A7468'; }}
            >📞 +91 91247 88164</a>
            <span style={{ fontSize: '.78rem', color: '#555', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              📍 Sambalpur, Odisha, India
            </span>
          </div>
        </div>
      </div>


      {/* ── Bottom bar ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <p style={{ fontSize: '.75rem', color: '#444', margin: 0 }}>
          © {YEAR} Markopen — Real-time Shop Directory · Made with ♥ in Bhubaneswar, Odisha
        </p>
        <div style={{ display: 'flex', gap: '1.4rem' }}>
          <button onClick={() => onPrivacy?.()} style={{ fontSize: '.72rem', color: '#444', textDecoration: 'none', transition: 'color .15s', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }} onMouseEnter={e => { e.currentTarget.style.color = '#D4880A'; }} onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}>Privacy Policy</button>
          <button onClick={() => onTerms?.()} style={{ fontSize: '.72rem', color: '#444', textDecoration: 'none', transition: 'color .15s', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }} onMouseEnter={e => { e.currentTarget.style.color = '#D4880A'; }} onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}>Terms of Use</button>
          <a href="/sitemap.xml" style={{ fontSize: '.72rem', color: '#444', textDecoration: 'none', transition: 'color .15s' }} onMouseEnter={e => { e.currentTarget.style.color = '#D4880A'; }} onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}>Sitemap</a>
        </div>
      </div>

    </footer>
  );
}