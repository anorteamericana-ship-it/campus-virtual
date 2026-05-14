/* global React */
// ── Primitives: icons, helpers, small components ──────────────────────────

const { useState, useEffect, useRef } = React;

// Minimal line icons — 24x24 viewBox, stroke-based
const ICONS = {
  home: 'M3 12L12 3l9 9M5 10v10h14V10',
  calendar: 'M3 9h18M7 3v4M17 3v4M5 6h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  grades: 'M4 4h12l4 4v12H4zM16 4v4h4M8 13h8M8 17h6',
  ican: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zM3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18',
  materials: 'M4 4h10l6 6v10H4zM14 4v6h6M8 13h8M8 17h8M8 9h4',
  homework: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9',
  messages: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-6 4z',
  payments: 'M3 8h18M3 8v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8M3 8V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1M7 14h4',
  certificates: 'M12 2l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6L3 9l6-1zM6 14v8l6-3 6 3v-8',
  profile: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  roster: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  chart: 'M3 3v18h18M7 14l4-4 4 4 5-5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  arrow: 'M5 12h14M13 5l7 7-7 7',
  check: 'M4 12l5 5L20 6',
  clock: 'M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z',
  play: 'M8 5v14l11-7z',
  download: 'M12 3v12m0 0l-4-4m4 4l4-4M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14zM4 19.5A2.5 2.5 0 0 0 6.5 22H20',
  book2: 'M12 7l4 2v8l-4-2v-8zM12 7L8 9v8l4-2v-8z',
  video: 'M23 7l-7 5 7 5V7zM14 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z',
  audio: 'M3 12h3l4-4v8l-4-4M15 9a3 3 0 0 1 0 6M18 6a7 7 0 0 1 0 12',
  doc: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M9 13h6M9 17h4',
  plus: 'M12 5v14M5 12h14',
  sparkle: 'M12 3v4M12 17v4M4 12H0M24 12h-4M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8M18.4 18.4l-2.8-2.8M8.4 8.4L5.6 5.6',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  graduation: 'M2 9l10-5 10 5-10 5-10-5zM6 11v5a4 4 0 0 0 8 0v-5',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  flame: 'M8.5 14.5A3.5 3.5 0 0 0 5 18c0 2 1 3 4 4s4-1 4-3a3.5 3.5 0 0 0-3-3c-.5 0-1-.5-1-1s.5-1 1-1c4 0 6-3 6-6 0-2-1-4-3-5 1 2-1 4-3 4s-5 2-5 6c0 2 1 3 3.5 2.5z',
  card: 'M3 10h18M5 6h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
};

function Icon({ name, size = 20, stroke = 2, className = 'sb-icon' }) {
  const d = ICONS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  );
}

// Ring progress (SVG)
function Ring({ pct = 0, size = 220, stroke = 14, label = 'Progreso', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct / 100);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size/2} cy={size/2} r={r} />
        <circle className="ring-prog"  cx={size/2} cy={size/2} r={r}
          strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="ring-center">
        {children || <>
          <div className="ring-pct">{pct}<sup>%</sup></div>
          <div className="ring-label">{label}</div>
        </>}
      </div>
    </div>
  );
}

function Toast({ msg, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 2800);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  return <div className={`toast ${msg ? 'show' : ''}`}>{msg}</div>;
}

function AnimatedBar({ pct, color = 'var(--an-granate)' }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="stat-bar">
      <div style={{ width: `${w}%`, background: color }} />
    </div>
  );
}

function Stat({ label, num, suffix, sub, subTone, pct, color }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-num">{num}{suffix && <em>{suffix}</em>}</div>
      {sub && <div className={`stat-sub ${subTone || ''}`}>{sub}</div>}
      {pct != null && <AnimatedBar pct={pct} color={color} />}
    </div>
  );
}

function Chip({ tone = 'granate', children, dot }) {
  return <span className={`chip chip-${tone}`}>
    {dot && <i style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />}
    {children}
  </span>;
}

Object.assign(window, { Icon, Ring, Toast, AnimatedBar, Stat, Chip, useState, useEffect, useRef });
