/* global React, Icon, PageHeader, EmptyState, ErrorState,
   fetchCalendarioDocente, fetchTareasPendientesDocente */

// ─────────────────────────────────────────────────────────────────────────
// VISTA DOCENTE — Fase 2
//   A1 ✅ esqueleto + integración (auth, fetch, tabs, contadores)
//   A2 ✅ listas reales de lecciones (este prompt)
//   A3 ⏳ modal de cierre de lección
//   A4 ⏳ banner de pendientes funcional
//
// Hereda el lenguaje visual de `cronograma_grupo.jsx`:
//   • paleta por nivel (dark / mid / light / lighter)
//   • chips tipo pill para estado
//   • mono para códigos, serif para fechas/títulos
//   • accent stripe vertical sobre cada lección
// ─────────────────────────────────────────────────────────────────────────

// TODO: reemplazar por endpoint listDocentes() cuando exista
const DOCENTES_TESTING = [
  'ANA BELEN SALAZAR FUENTES',
  'EMILY LUCIA VEGA SALAS',
  'JOHN ALVAREZ GONZALEZ',
  'JOSELYN RODRÍGUEZ UGALDE',
  'KEYLOR LEIVA MIRANDA',
  'RACHELLE MICHELLE CRUZ PEREZ',
  'SULIVANY MEDINA FONSECA',
  'YENDRY VANESSA AGUILAR ROJAS',
];

// ── Paleta por nivel (idéntica al módulo Calendario) ────────────────────
const VD_NIVEL_BASE = {
  B1: { dark:'#9A6A00', mid:'#E5A823', light:'#FFF8DC', lighter:'#FFFDF0' },
  B2: { dark:'#8B1A10', mid:'#E8372A', light:'#FDECEA', lighter:'#FFF5F4' },
  I1: { dark:'#0D47A1', mid:'#2B7FC1', light:'#E8F1FD', lighter:'#F0F7FF' },
  I2: { dark:'#1B5E20', mid:'#4CAF50', light:'#EBF5EB', lighter:'#F5FBF5' },
};
const VD_NIVEL_LABEL = {
  B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II',
};
const nivelPal = (n) => VD_NIVEL_BASE[n] || VD_NIVEL_BASE.B1;

const MES_CORTO  = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const DOW_CORTO  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// ── Helpers de fechas (zona horaria Costa Rica = local del navegador) ───
// El backend devuelve fechas en formato ISO "YYYY-MM-DD".  Las parseamos
// como medianoche LOCAL para que la comparación con "hoy" sea consistente
// sin importar el huso del visitante. Costa Rica está fijo en UTC-6 sin
// DST, así que mientras el dispositivo del docente esté en CR (lo normal),
// "hoy" es el día correcto.
function vdParseISO(iso) {
  if (!iso) return null;
  return new Date(iso + 'T00:00:00');
}
function vdHoy() {
  const h = new Date();
  h.setHours(0,0,0,0);
  return h;
}
function vdDiasHasta(iso) {
  const d = vdParseISO(iso);
  if (!d) return null;
  return Math.round((d - vdHoy()) / 86400000);
}
function vdFmtCorto(iso) {
  const d = vdParseISO(iso);
  if (!d) return '—';
  return `${String(d.getDate()).padStart(2,'0')}/${MES_CORTO[d.getMonth()]}`;
}
function vdFmtLargo(iso) {
  const d = vdParseISO(iso);
  if (!d) return '—';
  return `${DOW_CORTO[d.getDay()]} ${String(d.getDate()).padStart(2,'0')} ${MES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Estilos compartidos (igual que cronograma_grupo) ────────────────────
const vdLabelStyle = {
  fontSize:10, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase',
  color:'var(--ink-3)',
};

// ─────────────────────────────────────────────────────────────────────────
// Auth + sesión
// ─────────────────────────────────────────────────────────────────────────
function leerSesionDocente() {
  const cedula = sessionStorage.getItem('cedula') || '';
  const nombre = sessionStorage.getItem('nombre') || '';
  const rol    = sessionStorage.getItem('rol')    || '';
  if (nombre || cedula) return { cedula, nombre, rol };
  try {
    const u = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
    if (u) return { cedula: u.cedula || '', nombre: u.nombre || '', rol: u.rol || '' };
  } catch (_) {}
  return { cedula: '', nombre: '', rol: '' };
}

function TestingSelector({ value, onChange }) {
  return (
    <div style={{
      maxWidth: 520, margin: '64px auto', padding: 24,
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{ ...vdLabelStyle, marginBottom: 8 }}>Modo testing</div>
      <div style={{ fontSize: 15, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
        No hay docente logueado. Simulá la vista escogiendo un nombre:
      </div>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px',
          border: '1.5px solid var(--line)', borderRadius: 'var(--r-sm)',
          background: 'var(--surface)', fontFamily: 'var(--f-mono)',
          fontSize: 13, color: 'var(--ink)', cursor: 'pointer', outline: 'none',
        }}>
        <option value="">— elegir docente —</option>
        {DOCENTES_TESTING.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );
}

function VDSpinner({ label = 'Cargando panel del docente…' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 12, padding: '80px 24px', color: 'var(--ink-3)',
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '3px solid var(--line)', borderTopColor: 'var(--an-granate)',
        animation: 'vd-spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 13 }}>{label}</div>
      <style>{`@keyframes vd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PendientesBanner({ total }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 16px',
      background: 'var(--surface-2)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)',
      marginBottom: 20,
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: total > 0 ? 'var(--an-red)' : 'var(--bg-deep)',
        color: total > 0 ? 'white' : 'var(--ink-3)',
        display: 'grid', placeItems: 'center',
        fontWeight: 700, fontSize: 14, flexShrink: 0,
      }}>{total}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {total === 0
            ? 'No tenés pendientes administrativos.'
            : `Tenés ${total} ${total === 1 ? 'pendiente' : 'pendientes'} por resolver.`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
          Acciones rápidas — disponibles en próxima fase (A4)
        </div>
      </div>
    </div>
  );
}

function VDTabs({ value, onChange, counts }) {
  const tabs = [
    { id: 'proximas',  label: 'Próximas',    count: counts.proximas },
    { id: 'historico', label: 'Histórico',   count: counts.historico },
    { id: 'pre',       label: 'PRE-Campus',  count: counts.pre },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4, overflowX: 'auto',
      borderBottom: '1px solid var(--line)',
      marginBottom: 20,
      fontFamily: 'var(--f-sans)',
    }}>
      {tabs.map(t => {
        const active = t.id === value;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 16px', marginBottom: -1, flexShrink: 0,
            fontSize: 14, fontWeight: active ? 700 : 500,
            color: active ? 'var(--an-granate)' : 'var(--ink-2)',
            borderBottom: active ? '2px solid var(--an-granate)' : '2px solid transparent',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 'var(--r-pill)',
              background: active ? 'var(--an-granate)' : 'var(--bg-deep)',
              color: active ? 'white' : 'var(--ink-2)',
              fontFamily: 'var(--f-mono)', minWidth: 24, textAlign: 'center',
            }}>{t.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// LeccionRow — fila / tarjeta de una lección
// ─────────────────────────────────────────────────────────────────────────
// Variantes:
//   variant = 'active'  → click-able, full opacity, badge de tipo en color
//   variant = 'readonly' → grayscale, click muestra placeholder de detalle
//   variant = 'historico' → mismo que readonly pero aún más tenue
// Props extra:
//   diasAtraso → si > 0, badge rojo "Atrasada X días"
//   highlight → 'atrasada' | 'hoy' | null  (afecta el borde)
// ─────────────────────────────────────────────────────────────────────────
function LeccionRow({ lec, variant = 'active', diasAtraso = null, highlight = null, onClick }) {
  const pal = nivelPal(lec.nivel);

  const readonly = variant !== 'active';
  const pre      = variant === 'historico';
  const esICAN   = lec.riel === 'ican' || lec.tipo === 'ICAN';

  // Borde / fondo según highlight
  let borderColor = 'var(--line)';
  let bg = 'var(--surface)';
  let leftStripe = pal.mid;
  if (highlight === 'atrasada') {
    borderColor = '#E8372A55';
    bg = '#FFF5F4';
    leftStripe = '#E8372A';
  } else if (highlight === 'hoy') {
    borderColor = '#F57F1755';
    bg = '#FFFDE7';
    leftStripe = '#F57F17';
  }
  if (pre) {
    bg = 'var(--surface-2)';
    leftStripe = pal.mid + '99';
  }

  // Estado chip
  const estadoChip = (() => {
    if (lec.estado === 'CERRADA' || lec.estado === 'CALCULADA') {
      return { label: '✓ Cerrada', bg: pal.light, fg: pal.dark };
    }
    if (lec.estado === 'PRE_CAMPUS') {
      return { label: 'Pre-campus', bg: 'var(--bg-deep)', fg: 'var(--ink-3)' };
    }
    if (highlight === 'hoy') {
      return { label: '● Hoy', bg: '#FFFDE7', fg: '#9B6A00' };
    }
    if (highlight === 'atrasada') {
      return { label: '⚠ Atrasada', bg: '#FDECEA', fg: '#8B1A10' };
    }
    return { label: '○ Programada', bg: pal.lighter, fg: pal.dark };
  })();

  // Tipo chip
  const tipoChip = (() => {
    if (esICAN) return { label: 'I CAN', bg: '#4CAF50', fg: 'white' };
    if (lec.tipo === 'TEORICA')  return { label: 'Teórica',  bg: pal.mid, fg: 'white' };
    if (lec.tipo === 'PRACTICA') return { label: 'Práctica', bg: pal.dark, fg: 'white' };
    if (lec.tipo === 'PROGRESS_CHECK') return { label: 'Progress', bg: 'var(--an-navy)', fg: 'white' };
    if (lec.tipo === 'EVAL_ORAL')    return { label: 'Oral',    bg: '#F57F17', fg: 'white' };
    if (lec.tipo === 'EVAL_ESCRITO') return { label: 'Escrito', bg: '#E65100', fg: 'white' };
    return null;
  })();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        all: 'unset', boxSizing: 'border-box', display: 'block',
        width: '100%', cursor: 'pointer',
        marginBottom: 8,
        background: bg, color: 'var(--ink)',
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${leftStripe}`,
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        opacity: pre ? 0.78 : 1,
        filter: readonly && !pre ? 'saturate(0.85)' : 'none',
        transition: 'background .12s, box-shadow .12s, transform .12s',
        minHeight: 64,
        fontFamily: 'var(--f-sans)',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-1)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Bloque izquierdo: nivel + lección + grupo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: '1 1 320px' }}>
          {/* Tag de nivel */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', background: pal.light, color: pal.dark,
            borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 700,
            fontFamily: 'var(--f-mono)', letterSpacing: '0.04em', flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: pal.mid }} />
            {lec.nivel}
          </div>
          {/* Nº lección + tipo */}
          <div style={{ minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
            }}>
              <span style={{
                fontFamily: 'var(--f-mono)', fontSize: 14, fontWeight: 700,
                color: 'var(--ink)',
              }}>
                Lec {String(lec.leccion).padStart(2, '0')}
              </span>
              {tipoChip && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                  padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
                  background: tipoChip.bg, color: tipoChip.fg,
                  lineHeight: 1.3, flexShrink: 0,
                }}>{tipoChip.label}</span>
              )}
            </div>
            <div style={{
              fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--f-mono)',
              marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {lec.cod_grupo}
            </div>
          </div>
        </div>

        {/* Bloque medio: fecha */}
        <div style={{ flex: '0 1 auto', minWidth: 130 }}>
          <div style={{
            fontFamily: 'var(--f-serif)', fontSize: 15, fontWeight: 500,
            color: 'var(--ink)', letterSpacing: '-0.01em',
          }}>
            {vdFmtCorto(lec.fecha)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
            {(lec.dia || DOW_CORTO[(vdParseISO(lec.fecha) || new Date()).getDay()]).toLowerCase()}
            {lec.turno && <> · {lec.turno}</>}
          </div>
        </div>

        {/* Bloque derecho: estado + atraso */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 'auto' }}>
          {diasAtraso > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
              background: '#E8372A', color: 'white', textTransform: 'uppercase',
            }}>
              {diasAtraso}d atraso
            </span>
          )}
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            padding: '4px 10px', borderRadius: 'var(--r-pill)',
            background: estadoChip.bg, color: estadoChip.fg,
            textTransform: 'uppercase',
          }}>
            {estadoChip.label}
          </span>
          {/* Chevron sutil → afordancia de "abre detalle" */}
          {!pre && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                 style={{ color: 'var(--ink-3)', flexShrink: 0 }}>
              <polyline points="9 6 15 12 9 18" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Encabezado de sección (Atrasadas / Hoy / Esta semana / etc.) ────────
function SeccionHeader({ icon, title, count, tone = 'default' }) {
  const toneColors = {
    default:  { dot: 'var(--ink-3)',   fg: 'var(--ink)'         },
    danger:   { dot: '#E8372A',        fg: 'var(--ink)'         },
    today:    { dot: '#F57F17',        fg: 'var(--ink)'         },
    info:     { dot: 'var(--an-navy)', fg: 'var(--ink)'         },
  };
  const c = toneColors[tone] || toneColors.default;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      marginTop: 20, marginBottom: 10,
      fontFamily: 'var(--f-sans)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: c.dot, flexShrink: 0,
      }} />
      <h3 style={{
        margin: 0, fontFamily: 'var(--f-serif)', fontWeight: 500,
        fontSize: 18, color: c.fg, letterSpacing: '-0.015em',
      }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {title}
      </h3>
      <span style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        padding: '2px 8px', borderRadius: 'var(--r-pill)',
        background: 'var(--bg-deep)', color: 'var(--ink-2)',
        fontFamily: 'var(--f-mono)',
      }}>{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TAB 1 — PRÓXIMAS
// ─────────────────────────────────────────────────────────────────────────
// Agrupación:
//   • atrasadas: programadas con fecha < hoy (todas son ipso facto pendientes)
//   • hoy: fecha == hoy
//   • esta_semana: hoy+1 .. hoy+7
//   • mas_adelante: hoy+8 en adelante  (colapsado por defecto)
// "Esta semana" cubre los 7 días siguientes a hoy (exclusivo de hoy).
// Si una sección está vacía no se renderiza.
// ─────────────────────────────────────────────────────────────────────────
function VDTabProximas({ programadas, sinCerrar, onAbrirCierre }) {
  // Mapa para enriquecer con dias_atraso desde sin_cerrar
  const mapaAtraso = React.useMemo(() => {
    const m = new Map();
    (sinCerrar || []).forEach(s => {
      const k = `${s.cod_grupo}|${s.nivel}|${s.leccion}|${s.riel || 'curso'}`;
      m.set(k, s.dias_atraso || 1);
    });
    return m;
  }, [sinCerrar]);

  const grupos = React.useMemo(() => {
    const hoy = vdHoy();
    const semanaFin = new Date(hoy); semanaFin.setDate(semanaFin.getDate() + 7);
    const out = { atrasadas: [], hoy: [], esta_semana: [], mas_adelante: [] };
    const lista = (programadas || []).slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
    for (const lec of lista) {
      const d = vdParseISO(lec.fecha);
      if (!d) { out.mas_adelante.push(lec); continue; }
      const diff = (d - hoy) / 86400000;
      if (diff < 0) out.atrasadas.push(lec);
      else if (diff === 0) out.hoy.push(lec);
      else if (d < semanaFin) out.esta_semana.push(lec);
      else out.mas_adelante.push(lec);
    }
    return out;
  }, [programadas]);

  const [mostrarMas, setMostrarMas] = React.useState(false);

  const totalProx = (programadas || []).length;

  if (!totalProx) {
    return (
      <div style={{
        padding: '60px 24px', textAlign: 'center',
        background: 'var(--surface-2)',
        border: '1px dashed var(--line-2)',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--f-sans)',
      }}>
        <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.4 }}>📅</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          No tenés lecciones próximas programadas.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          Cuando se programen nuevas lecciones aparecerán aquí.
        </div>
      </div>
    );
  }

  const handleClick = (lec, ctx) => {
    console.log('Abrir modal cierre', { ...lec, contexto: ctx });
    onAbrirCierre && onAbrirCierre(lec, ctx);
  };

  return (
    <div>
      {/* Atrasadas */}
      {grupos.atrasadas.length > 0 && (
        <>
          <SeccionHeader icon="⚠️" title="Atrasadas" count={grupos.atrasadas.length} tone="danger" />
          <div style={{
            padding: 12,
            background: 'color-mix(in srgb, #E8372A 5%, white)',
            border: '1px solid color-mix(in srgb, #E8372A 18%, white)',
            borderRadius: 'var(--r-md)',
            marginBottom: 8,
          }}>
            <div style={{
              fontSize: 12, color: '#8B1A10', marginBottom: 8, fontWeight: 600,
              fontFamily: 'var(--f-sans)',
            }}>
              Estas lecciones siguen abiertas. Cerralas para liberar tus pendientes.
            </div>
            {grupos.atrasadas.map(lec => {
              const k = `${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.riel || 'curso'}`;
              const dias = mapaAtraso.get(k) || Math.max(1, -vdDiasHasta(lec.fecha));
              return (
                <LeccionRow key={k}
                  lec={lec}
                  variant="active"
                  highlight="atrasada"
                  diasAtraso={dias}
                  onClick={() => handleClick(lec, 'atrasada')}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Hoy */}
      {grupos.hoy.length > 0 && (
        <>
          <SeccionHeader title="Hoy" count={grupos.hoy.length} tone="today" />
          {grupos.hoy.map(lec => (
            <LeccionRow key={`${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.riel || 'curso'}`}
              lec={lec} variant="active" highlight="hoy"
              onClick={() => handleClick(lec, 'hoy')}
            />
          ))}
        </>
      )}

      {/* Esta semana */}
      {grupos.esta_semana.length > 0 && (
        <>
          <SeccionHeader title="Esta semana" count={grupos.esta_semana.length} tone="info" />
          {grupos.esta_semana.map(lec => (
            <LeccionRow key={`${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.riel || 'curso'}`}
              lec={lec} variant="active"
              onClick={() => handleClick(lec, 'esta_semana')}
            />
          ))}
        </>
      )}

      {/* Más adelante — colapsado */}
      {grupos.mas_adelante.length > 0 && (
        <>
          <SeccionHeader title="Más adelante" count={grupos.mas_adelante.length} />
          {!mostrarMas ? (
            <button
              type="button"
              onClick={() => setMostrarMas(true)}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'var(--surface-2)',
                border: '1px dashed var(--line-2)',
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                fontFamily: 'var(--f-sans)',
                fontSize: 13, fontWeight: 600, color: 'var(--ink-2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Ver todas las próximas ({grupos.mas_adelante.length})
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>
                · oculto por rendimiento
              </span>
            </button>
          ) : (
            <>
              {grupos.mas_adelante.map(lec => (
                <LeccionRow key={`${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.riel || 'curso'}`}
                  lec={lec} variant="active"
                  onClick={() => handleClick(lec, 'mas_adelante')}
                />
              ))}
              <button
                type="button"
                onClick={() => setMostrarMas(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, color: 'var(--ink-3)', fontWeight: 600,
                  fontFamily: 'var(--f-sans)', padding: '8px 0', marginTop: 4,
                }}>
                ← Colapsar
              </button>
            </>
          )}
        </>
      )}

      {/* Nota A3 sutil al pie */}
      <div style={{
        marginTop: 24, padding: '10px 14px',
        background: 'var(--surface-2)',
        border: '1px dashed var(--line-2)',
        borderRadius: 'var(--r-sm)',
        fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.5,
        fontFamily: 'var(--f-sans)',
      }}>
        <strong style={{ color: 'var(--ink-2)' }}>Nota:</strong>{' '}
        El modal de cierre se habilita en <span style={{ fontFamily: 'var(--f-mono)' }}>A3</span>.
        Por ahora, hacer click sobre una lección la registra en consola.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TAB 2 — HISTÓRICO
// ─────────────────────────────────────────────────────────────────────────
function VDTabHistorico({ cerradas }) {
  const lista = React.useMemo(() => {
    return (cerradas || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [cerradas]);

  if (!lista.length) {
    return (
      <div style={{
        padding: '60px 24px', textAlign: 'center',
        background: 'var(--surface-2)',
        border: '1px dashed var(--line-2)',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--f-sans)',
      }}>
        <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.4 }}>📒</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          Todavía no has cerrado lecciones en el campus.
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          Cuando cierres una lección desde "Próximas" aparecerá acá.
        </div>
      </div>
    );
  }

  const handleClick = (lec) => {
    console.log('Detalle solo lectura (A3 implementará el modal)', lec);
  };

  return (
    <div>
      {lista.map(lec => (
        <LeccionRow key={`${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.fecha}`}
          lec={lec} variant="readonly"
          onClick={() => handleClick(lec)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TAB 3 — PRE-CAMPUS
// ─────────────────────────────────────────────────────────────────────────
function VDTabPre({ historico }) {
  const lista = React.useMemo(() => {
    return (historico || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [historico]);

  if (!lista.length) {
    return (
      <div style={{
        padding: '60px 24px', textAlign: 'center',
        background: 'var(--surface-2)',
        border: '1px dashed var(--line-2)',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--f-sans)',
      }}>
        <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.4 }}>🗂️</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
          Sin lecciones pre-campus.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        padding: '10px 14px', marginBottom: 14,
        background: 'color-mix(in srgb, var(--an-navy) 5%, white)',
        border: '1px solid color-mix(in srgb, var(--an-navy) 18%, white)',
        borderRadius: 'var(--r-md)',
        fontSize: 12, color: 'var(--an-navy-ink)', lineHeight: 1.5,
        fontFamily: 'var(--f-sans)',
      }}>
        Estas son lecciones impartidas antes de la activación del campus
        (<span style={{ fontFamily: 'var(--f-mono)', fontWeight: 700 }}>18 may 2026</span>).
        Son solo de referencia, no editables.
      </div>
      {lista.map(lec => (
        <LeccionRow key={`${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.fecha}`}
          lec={lec} variant="historico"
          onClick={() => {
            console.log('PRE_CAMPUS — registro histórico (no editable)', lec);
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Componente raíz
// ─────────────────────────────────────────────────────────────────────────
function VistaDocente({ cedulaOverride, nombreOverride } = {}) {
  const sesion = React.useMemo(() => leerSesionDocente(), []);
  const [testingNombre, setTestingNombre] = React.useState('');

  const nombre = nombreOverride || sesion.nombre || testingNombre || '';
  const cedula = cedulaOverride || sesion.cedula || '';
  const idDocente = nombre || cedula;

  const [calendario, setCalendario] = React.useState(null);
  const [pendientes, setPendientes] = React.useState(null);
  const [loading, setLoading]       = React.useState(false);
  const [error, setError]           = React.useState('');
  const [tab, setTab]               = React.useState('proximas');

  const refetch = React.useCallback(() => {
    if (!idDocente) return;
    setLoading(true);
    setError('');
    return Promise.all([
      fetchCalendarioDocente(idDocente),
      fetchTareasPendientesDocente(idDocente),
    ])
      .then(([cal, pend]) => {
        if (!cal?.ok) throw new Error(cal?.error || 'No se pudo cargar el calendario.');
        if (!pend?.ok) throw new Error(pend?.error || 'No se pudieron cargar los pendientes.');
        setCalendario(cal);
        setPendientes(pend);
      })
      .catch(e => setError(e.message || 'Error de conexión.'))
      .finally(() => setLoading(false));
  }, [idDocente]);

  React.useEffect(() => {
    if (!idDocente) return;
    let cancel = false;
    setLoading(true); setError('');
    Promise.all([
      fetchCalendarioDocente(idDocente),
      fetchTareasPendientesDocente(idDocente),
    ])
      .then(([cal, pend]) => {
        if (cancel) return;
        if (!cal?.ok) throw new Error(cal?.error || 'No se pudo cargar el calendario.');
        if (!pend?.ok) throw new Error(pend?.error || 'No se pudieron cargar los pendientes.');
        setCalendario(cal); setPendientes(pend);
      })
      .catch(e => { if (!cancel) setError(e.message || 'Error de conexión.'); })
      .finally(() => { if (!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [idDocente]);

  // Sin sesión → selector testing
  if (!idDocente) {
    return (
      <div data-screen-label="Vista docente · sin sesión">
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub="Sin sesión activa — escogé un docente para previsualizar la vista."
        />
        <TestingSelector value={testingNombre} onChange={setTestingNombre} />
      </div>
    );
  }

  if (loading && !calendario) {
    return (
      <div data-screen-label="Vista docente · cargando">
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub={nombre || cedula}
        />
        <VDSpinner />
      </div>
    );
  }

  if (error && !calendario) {
    return (
      <div data-screen-label="Vista docente · error">
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub={nombre || cedula}
        />
        <ErrorState message={error} onRetry={refetch} />
      </div>
    );
  }

  const counts = {
    proximas:  calendario?.total_programadas ?? (calendario?.programadas?.length || 0),
    historico: calendario?.total_cerradas    ?? (calendario?.cerradas?.length || 0),
    pre:       calendario?.total_historico   ?? (calendario?.historico?.length || 0),
  };
  const totalPendientes = pendientes?.totales?.total_pendientes ?? 0;

  return (
    <div data-screen-label="Vista docente">
      <PageHeader
        kicker="Panel del docente"
        title={<>Mi <em>Panel</em></>}
        sub={nombre || cedula}
      />

      <PendientesBanner total={totalPendientes} />

      <VDTabs value={tab} onChange={setTab} counts={counts} />

      {tab === 'proximas' && (
        <VDTabProximas
          programadas={calendario?.programadas || []}
          sinCerrar={pendientes?.sin_cerrar || []}
        />
      )}
      {tab === 'historico' && (
        <VDTabHistorico cerradas={calendario?.cerradas || []} />
      )}
      {tab === 'pre' && (
        <VDTabPre historico={calendario?.historico || []} />
      )}
    </div>
  );
}

Object.assign(window, { VistaDocente });
