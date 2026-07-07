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

// ── Stat — primitiva única para tarjetas de número/estadística ─────────
// Usada en TODOS los dashboards (estudiante, docente, admin, suspensiones).
// Antes existían StatCard y QuickStat; ambas fueron absorbidas aquí.
//
// props:
//   label   — texto chico arriba (uppercase, gris)
//   num     — número grande (navy bold Poppins por defecto)
//   suffix  — sufijo chico al lado del número (ej. "%", "M")
//   sub     — texto auxiliar abajo
//   subTone — 'ok' | 'warn' | 'bad' | 'muted'  → color del sub
//   pct     — 0–100, dibuja barra animada bajo el número
//   color   — color de la barra (no afecta al número)
//   tone    — 'alert' pinta el número en rojo de marca (#DA291C).
//             Usar SOLO cuando el stat indique atención
//             (ej. contador de pendientes/alertas).
function Stat({ label, num, suffix, sub, subTone, pct, color, tone }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={`stat-num${tone ? ` tone-${tone}` : ''}`}>
        {num}{suffix && <em>{suffix}</em>}
      </div>
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

// ── useUsuario() ──────────────────────────────────────────────────────────
// Lee la sesión activa de sessionStorage.an_usuario.
// Retorna el objeto usuario o null si no hay sesión.
function useUsuario() {
  return React.useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    } catch { return null; }
  }, []);
}

// ── useEstudiante(codigo) ─────────────────────────────────────────────────
// Llama getEstudiante desde el Apps Script.
// Retorna { data, loading, error, reload }.
// data: { estudiante, niveles, pagos, otrosPagos, grupo, pendientes }
// URL del Apps Script: fuente única en data.jsx → window.APPS_SCRIPT_URL
const __ESTUDIANTE_SCRIPT_URL = window.APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
if (!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL = __ESTUDIANTE_SCRIPT_URL;

// FIX-ADMIN-CORE-POST-001: lectura sensible vía POST text/plain (token en body).
async function postPrimitives(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${__ESTUDIANTE_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

// F98.4-Z6-CS-PERF1: cache corto por estudiante para evitar que Mi Campus
// quede en blanco/lento por cada recarga. El reload fuerza lectura fresca.
const STUDENT_PROFILE_CACHE_TTL_MS = 90 * 1000;
function studentProfileCacheKey(codigo) { return 'an_student_profile_v1_' + String(codigo || '').trim(); }
function studentProfileCacheGet(codigo) {
  try {
    const raw = sessionStorage.getItem(studentProfileCacheKey(codigo));
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.ts || (Date.now() - obj.ts) > STUDENT_PROFILE_CACHE_TTL_MS) return null;
    return obj.data || null;
  } catch (_) { return null; }
}
function studentProfileCachePut(codigo, data) {
  try { if (data && data.ok) sessionStorage.setItem(studentProfileCacheKey(codigo), JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
}
function useEstudiante(codigo) {
  const [data, setData]       = React.useState(() => codigo ? studentProfileCacheGet(codigo) : null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');
  const [tick, setTick]       = React.useState(0);

  React.useEffect(() => {
    if (!codigo) { setData(null); return; }
    let cancelled = false;
    const cached = tick === 0 ? studentProfileCacheGet(codigo) : null;
    if (cached) {
      setData(cached);
      setLoading(false);
      setError('');
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError('');
    postPrimitives('getEstudiante', { codigo })
      .then(d => {
        if (cancelled) return;
        if (!d || !d.ok) {
          setError((d && d.error) || 'No se pudo cargar la información del estudiante');
          setData(null);
          return;
        }
        studentProfileCachePut(codigo, d);
        setData(d);
      })
      .catch(() => { if (!cancelled) setError('Error de conexión'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [codigo, tick]);

  return { data, loading, error, reload: () => { try { sessionStorage.removeItem(studentProfileCacheKey(codigo)); } catch (_) {} setTick(t => t + 1); } };
}

// ── LoadingState — primitiva única para estados de carga ─────────────────
// Reemplaza TeacherLoadingState, AdminLoadingState, SyllabusLoadingState,
// PASSpinner, VDSpinner y ColaSkeleton. Spinner siempre navy (#002F6C).
//
// props:
//   variant   — 'spinner' (default) | 'small' | 'verbose' | 'skeleton'
//   title     — texto grande bajo el spinner (default según variant)
//   subtitle  — texto chico de hint
//   etapas    — solo en 'verbose': [{t: ms, label: '...'}]
//   hint      — solo en 'verbose': pista en mono debajo
//   skeletonRows — solo en 'skeleton': cuántas tarjetas dummy (default 3)
function LoadingState({
  variant = 'spinner',
  title,
  subtitle = 'Consultando Apps Script',
  etapas,
  hint,
  skeletonRows = 3,
}) {
  // ── skeleton ──────────────────────────────────────────────────────────
  if (variant === 'skeleton') {
    const bar = (w) => ({
      height:12, width:`${w}%`,
      background:'linear-gradient(90deg, var(--bg-deep) 0%, var(--surface-2) 50%, var(--bg-deep) 100%)',
      backgroundSize:'200% 100%',
      animation:'an-shimmer 1.4s linear infinite',
      borderRadius:4,
    });
    return (
      <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:14 }}>
        {Array.from({ length: skeletonRows }).map((_, i) => (
          <li key={i} style={{
            padding:18, background:'var(--surface)',
            border:'1px solid var(--line)', borderRadius:'var(--r-md)',
            display:'grid', gap:10,
          }}>
            <div style={bar(50)} />
            <div style={bar(80)} />
            <div style={bar(70)} />
          </li>
        ))}
      </ul>
    );
  }

  // ── verbose (con etapas cíclicas) ─────────────────────────────────────
  if (variant === 'verbose') {
    const stages = etapas || [{ t: 0, label: subtitle }];
    const [idx, setIdx] = React.useState(0);
    React.useEffect(() => {
      const timers = stages.map((e, i) =>
        e.t > 0 ? setTimeout(() => setIdx(i), e.t) : null
      );
      return () => timers.forEach(t => t && clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
      <div style={{
        padding:'64px 24px 80px', textAlign:'center',
        background:'var(--surface-2)',
        border:'1px dashed var(--line-2)',
        borderRadius:'var(--r-md)',
        fontFamily:'var(--f-sans)',
      }}>
        <div style={{
          width:44, height:44, margin:'0 auto 18px',
          borderRadius:'50%',
          border:'3px solid var(--line)', borderTopColor:'var(--an-navy)',
          animation:'an-spin 0.9s linear infinite',
        }} />
        <div style={{
          fontFamily:'var(--f-serif)', fontSize:19, fontWeight:600,
          color:'var(--an-navy-ink)', letterSpacing:'-0.015em', marginBottom:8,
        }}>{title || 'Cargando…'}</div>
        <div style={{
          fontSize:13, color:'var(--ink-2)', minHeight:20,
          transition:'opacity .25s',
        }}>{stages[idx]?.label || subtitle}</div>
        {hint && (
          <div style={{
            fontSize:11, color:'var(--ink-3)', marginTop:16,
            fontFamily:'var(--f-mono)',
          }}>{hint}</div>
        )}
      </div>
    );
  }

  // ── small (spinner compacto centrado) ─────────────────────────────────
  if (variant === 'small') {
    return (
      <div style={{
        display:'flex', flexDirection:'column', alignItems:'center',
        gap:12, padding:'80px 24px', color:'var(--ink-3)',
        fontFamily:'var(--f-sans)',
      }}>
        <div style={{
          width:28, height:28, borderRadius:'50%',
          border:'3px solid var(--line)', borderTopColor:'var(--an-navy)',
          animation:'an-spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize:13 }}>{title || 'Cargando…'}</div>
      </div>
    );
  }

  // ── spinner (default) ─────────────────────────────────────────────────
  return (
    <div style={{ padding:'80px 20px', textAlign:'center' }}>
      <div style={{
        width:36, height:36, margin:'0 auto 18px',
        borderRadius:'50%',
        border:'3px solid var(--line)', borderTopColor:'var(--an-navy)',
        animation:'an-spin 0.85s linear infinite',
      }} />
      <div style={{
        fontFamily:'var(--f-serif)', fontSize:22, fontWeight:600,
        color:'var(--an-navy-ink)', marginBottom:8, letterSpacing:'-0.015em',
      }}>{title || 'Cargando datos…'}</div>
      <div style={{ fontSize:13, color:'var(--ink-3)' }}>{subtitle}</div>
    </div>
  );
}

// Inyección única de los keyframes globales que usan LoadingState/skeletons.
// Idempotente — cronograma_grupo.jsx también inyecta los mismos; gana el
// primero que se monte, el id evita duplicados.
(function injectAnKeyframes() {
  if (typeof document === 'undefined' || document.getElementById('an-keyframes')) return;
  const s = document.createElement('style');
  s.id = 'an-keyframes';
  s.textContent = `
    @keyframes an-spin    { to { transform: rotate(360deg) } }
    @keyframes an-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    @keyframes an-fade-in { from { opacity: 0 } to { opacity: 1 } }
  `;
  document.head.appendChild(s);
})();

// ── EmptyState — usado por módulos sin datos reales ──────────────────────
function EmptyState({ icon = '—', title, subtitle, action }) {
  return (
    <div style={{
      padding:'48px 24px', textAlign:'center',
      background:'var(--surface)', border:'1px dashed var(--line-2)',
      borderRadius:'var(--r-md)', color:'var(--ink-3)',
    }}>
      <div style={{
        width:54, height:54, margin:'0 auto 12px',
        borderRadius:'50%', background:'var(--bg-deep)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, color:'var(--ink-3)',
      }}>{icon}</div>
      <div style={{
        fontFamily:'var(--f-serif)', fontSize:18, fontWeight:500,
        color:'var(--ink)', letterSpacing:'-0.015em', marginBottom:6,
      }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize:12, color:'var(--ink-2)', lineHeight:1.5, maxWidth:360, margin:'0 auto' }}>
          {subtitle}
        </div>
      )}
      {action && <div style={{ marginTop:14 }}>{action}</div>}
    </div>
  );
}



// F96.2-LAZY-C · Header compartido para rutas diferidas.
// Antes PageHeader vivía dentro de student_modules.jsx; varios módulos admin/docente
// lo usaban de forma implícita. Se declara en primitives para que esté disponible
// desde el núcleo inicial sin arrastrar módulos de estudiante.
function PageHeader({ kicker, title, sub, right }) {
  return (
    <div className="page-header" style={{ marginBottom:24, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
      <div className="page-header-copy">
        {kicker && <div className="hero-kicker page-header-kicker" style={{ marginBottom:8 }}>{kicker}</div>}
        <h1 className="page-header-title" style={{ fontFamily:'var(--f-serif)', fontSize:40, fontWeight:400, letterSpacing:'-0.035em', lineHeight:1.05, margin:0, color:'var(--an-navy-ink)' }}>
          {title}
        </h1>
        {sub && <div className="page-header-subtitle" style={{ fontSize:13, color:'var(--ink-2)', marginTop:6, maxWidth:640 }}>{sub}</div>}
      </div>
      {right && <div className="page-header-actions">{right}</div>}
    </div>
  );
}

// ── ErrorState — usado cuando un endpoint falla ──────────────────────────
// F96.5 UX-E: ningún estudiante/docente debe ver errores técnicos crudos
// como "Cannot read properties...". El detalle queda disponible solo si el
// usuario lo despliega para soporte.
function normalizarMensajeErrorCampus(message) {
  const raw = String(message || '').trim();
  if (!raw) return { titulo:'No se pudo cargar la información.', detalle:'' };
  const tecnico = /Cannot read|undefined|null|TypeError|ReferenceError|SyntaxError|stack|Exception|Failed to fetch|NetworkError|Unexpected token/i.test(raw);
  if (tecnico) {
    return {
      titulo:'No se pudo cargar este módulo.',
      detalle:raw,
    };
  }
  return { titulo:raw, detalle:'' };
}

function ErrorState({ message, onRetry }) {
  const err = normalizarMensajeErrorCampus(message);
  const [showDetail, setShowDetail] = React.useState(false);
  return (
    <div style={{
      padding:'24px', textAlign:'center',
      background:'color-mix(in srgb, var(--danger) 6%, white)',
      border:'1px solid color-mix(in srgb, var(--danger) 25%, white)',
      borderRadius:'var(--r-md)', color:'var(--danger)',
    }}>
      <div style={{ fontWeight:800, marginBottom:4 }}>⚠ {err.titulo}</div>
      <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:10, lineHeight:1.5 }}>
        Intentá de nuevo. Si continúa, enviá una captura indicando tu nombre, grupo y la pantalla donde ocurrió.
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
        {onRetry && (
          <button className="btn btn-ghost" onClick={onRetry}
                  style={{ fontSize:12, padding:'6px 14px' }}>Reintentar</button>
        )}
        {err.detalle && (
          <button className="btn btn-ghost" onClick={() => setShowDetail(!showDetail)}
                  style={{ fontSize:12, padding:'6px 14px' }}>
            {showDetail ? 'Ocultar detalle técnico' : 'Ver detalle para soporte'}
          </button>
        )}
      </div>
      {showDetail && err.detalle && (
        <pre style={{ margin:'12px auto 0', maxWidth:680, whiteSpace:'pre-wrap', textAlign:'left', fontSize:11, lineHeight:1.45, color:'var(--ink-2)', background:'#fff', border:'1px solid var(--line)', borderRadius:10, padding:12 }}>
          {err.detalle}
        </pre>
      )}
    </div>
  );
}

Object.assign(window, {
  Icon, Ring, Toast, AnimatedBar, Stat, Chip,
  useState, useEffect, useRef,
  useUsuario, useEstudiante,
  LoadingState, EmptyState, ErrorState, PageHeader,
});
