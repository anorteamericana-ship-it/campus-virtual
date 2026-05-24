/* global React, Icon, PageHeader, EmptyState, ErrorState,
   fetchCalendarioDocente, fetchTareasPendientesDocente,
   fetchEstudiantesParaCierre, postCerrarLeccionCompleta */

// ─────────────────────────────────────────────────────────────────────────
// VISTA DOCENTE — Fase 2
//   A1 ✅ esqueleto + integración (auth, fetch, tabs, contadores)
//   A2 ✅ listas reales de lecciones
//   A3 ✅ modal de cierre de lección (este prompt)
//   A4 ⏳ banner de pendientes funcional
//
// Hereda el lenguaje visual de `cronograma_grupo.jsx`:
//   • paleta por nivel (dark / mid / light / lighter)
//   • chips tipo pill para estado
//   • mono para códigos, serif para fechas/títulos
//   • accent stripe vertical sobre cada lección
// ─────────────────────────────────────────────────────────────────────────

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
// Lee la sesión activa (única fuente: sessionStorage.an_usuario, vía
// getSesion()). No tocamos claves sueltas: la coexistencia de
// `sessionStorage.nombre` / `.cedula` / `.rol` fue un bug histórico.
function leerSesionDocente() {
  const u = (typeof window.getSesion === 'function') ? window.getSesion() : null;
  if (!u) return { cedula: '', nombre: '', rol: '', grupo: '', grupos: [] };
  return {
    cedula: u.cedula || '',
    nombre: u.nombre || '',
    rol:    u.rol    || '',
    grupo:  u.grupo  || '',
    grupos: u.grupos || (u.grupo ? [u.grupo] : []),
  };
}

// (VDSpinner eliminado — usa <LoadingState variant="small"/> de primitives.jsx.)

function PendientesBanner({
  totales, sinCerrar, sinRetro, sinPC,
  abierto, onToggle,
  catAbierta, onToggleCat,
  onClickSinCerrar, onClickSinRetro, onClickSinPC,
}) {
  const total = totales?.total_pendientes || 0;

  // ── Total 0: banner verde efímero (auto-fade en 4 s) ──
  const [fadeOut, setFadeOut] = React.useState(false);
  const [hidden, setHidden]   = React.useState(false);
  React.useEffect(() => {
    if (total !== 0) { setFadeOut(false); setHidden(false); return; }
    setFadeOut(false); setHidden(false);
    const t1 = setTimeout(() => setFadeOut(true), 4000);
    const t2 = setTimeout(() => setHidden(true), 4600); // 600 ms de transición
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [total]);

  if (total === 0) {
    if (hidden) {
      // Indicador mínimo discreto, ya sin caja
      return (
        <div style={{
          fontFamily: 'var(--f-sans)',
          fontSize: 11, color: 'var(--ink-3)',
          margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: '#4CAF50',
          }} />
          Sin pendientes administrativos.
        </div>
      );
    }
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', marginBottom: 20,
        background: 'color-mix(in srgb, #4CAF50 8%, white)',
        border: '1px solid color-mix(in srgb, #4CAF50 32%, white)',
        borderRadius: 'var(--r-md)',
        fontFamily: 'var(--f-sans)',
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: '#4CAF50', color: 'white',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B5E20', letterSpacing: '-0.005em' }}>
            ¡Estás al día! ✓
          </div>
          <div style={{ fontSize: 12, color: '#2E7D32', marginTop: 2 }}>
            No hay lecciones sin cerrar, retros pendientes ni Progress Checks por escribir.
          </div>
        </div>
      </div>
    );
  }

  // ── Banner ROJO (con pendientes) ──
  const sc = totales?.sin_cerrar || 0;
  const sr = totales?.sin_retro  || 0;
  const sp = totales?.sin_pc     || 0;

  const cats = [];
  if (sc > 0) cats.push({
    id: 'sin_cerrar', label: 'Lecciones sin cerrar', count: sc,
    color: '#B3261E', accion: 'Cerrar lección', list: sinCerrar || [],
    onClickItem: onClickSinCerrar,
    accionable: true,
  });
  if (sr > 0) cats.push({
    id: 'sin_retro', label: 'Lecciones sin retroalimentación', count: sr,
    color: '#C67100', accion: 'Ver en histórico', list: sinRetro || [],
    onClickItem: onClickSinRetro,
    accionable: false,
  });
  if (sp > 0) cats.push({
    id: 'sin_pc', label: 'Lecciones sin Progress Check', count: sp,
    color: '#7B1FA2', accion: 'Ver en histórico', list: sinPC || [],
    onClickItem: onClickSinPC,
    accionable: false,
  });

  return (
    <div style={{
      marginBottom: 20,
      background: 'color-mix(in srgb, #E8372A 5%, white)',
      border: '1px solid color-mix(in srgb, #E8372A 28%, white)',
      borderRadius: 'var(--r-md)',
      overflow: 'hidden',
      fontFamily: 'var(--f-sans)',
    }}>
      {/* Cabecera click-able */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        style={{
          all: 'unset', boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', width: '100%', cursor: 'pointer',
          minHeight: 44,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--an-red)', color: 'white',
          display: 'grid', placeItems: 'center',
          fontWeight: 700, fontSize: 14, flexShrink: 0,
          fontFamily: 'var(--f-mono)',
        }}>{total}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            Tenés {total} {total === 1 ? 'pendiente' : 'pendientes'} por resolver
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>
            {[
              sc > 0 && `${sc} sin cerrar`,
              sr > 0 && `${sr} sin retro`,
              sp > 0 && `${sp} sin PC`,
            ].filter(Boolean).join(' · ')}
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
             style={{
               color: 'var(--ink-3)', flexShrink: 0,
               transform: abierto ? 'rotate(180deg)' : 'rotate(0)',
               transition: 'transform 0.2s',
             }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Desglose */}
      {abierto && (
        <div style={{
          borderTop: '1px solid color-mix(in srgb, #E8372A 22%, white)',
          padding: '4px 6px 6px',
          background: 'color-mix(in srgb, #E8372A 3%, white)',
        }}>
          {cats.map(c => (
            <CategoriaPendiente
              key={c.id}
              cat={c}
              abierta={catAbierta === c.id}
              onToggle={() => onToggleCat(catAbierta === c.id ? null : c.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub: categoría dentro del banner ─────────────────────────────────────
function CategoriaPendiente({ cat, abierta, onToggle }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${cat.color}26`,
      borderLeft: `4px solid ${cat.color}`,
      borderRadius: 'var(--r-sm)',
      margin: 4, overflow: 'hidden',
    }}>
      <button
        type="button" onClick={onToggle} aria-expanded={abierta}
        style={{
          all: 'unset', boxSizing: 'border-box',
          width: '100%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', minHeight: 44,
        }}>
        <span style={{
          width: 26, height: 26, borderRadius: 'var(--r-sm)',
          background: `${cat.color}1A`, color: cat.color,
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700,
          flexShrink: 0,
        }}>{cat.count}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
            {cat.label}
          </div>
          {!cat.accionable && (
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
              La edición de lecciones cerradas estará disponible próximamente.
            </div>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
             style={{
               color: 'var(--ink-3)', flexShrink: 0,
               transform: abierta ? 'rotate(180deg)' : 'rotate(0)',
               transition: 'transform 0.2s',
             }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {abierta && (
        <div style={{
          borderTop: `1px solid ${cat.color}1F`,
          padding: 6, display: 'flex', flexDirection: 'column', gap: 4,
          background: 'var(--surface-2)',
        }}>
          {cat.list.map((p, i) => (
            <PendienteItem
              key={`${p.cod_grupo}|${p.nivel}|${p.leccion}|${p.riel || 'curso'}|${i}`}
              pendiente={p}
              accion={cat.accion}
              accionable={cat.accionable}
              onClick={() => cat.onClickItem(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sub: item de pendiente (fila compacta) ───────────────────────────────
function PendienteItem({ pendiente, accion, accionable, onClick }) {
  const pal = nivelPal(pendiente.nivel);
  return (
    <button
      type="button" onClick={onClick}
      style={{
        all: 'unset', boxSizing: 'border-box', display: 'flex',
        alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '8px 10px', minHeight: 44, cursor: 'pointer',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderLeft: `3px solid ${pal.mid}`,
        borderRadius: 'var(--r-sm)',
        transition: 'background .12s',
        width: '100%',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-deep)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 6px', background: pal.light, color: pal.dark,
        borderRadius: 4, fontSize: 10, fontWeight: 700,
        fontFamily: 'var(--f-mono)', letterSpacing: '0.04em', flexShrink: 0,
      }}>{pendiente.nivel}</span>
      <span style={{
        fontFamily: 'var(--f-mono)', fontSize: 12, fontWeight: 700,
        color: 'var(--ink)', flexShrink: 0,
      }}>Lec {String(pendiente.leccion).padStart(2, '0')}</span>
      <span style={{
        fontSize: 11, color: 'var(--ink-3)',
        fontFamily: 'var(--f-mono)', flex: '1 1 auto', minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{pendiente.cod_grupo}</span>
      <span style={{
        fontSize: 11, color: 'var(--ink-2)', flexShrink: 0,
      }}>{vdFmtCorto(pendiente.fecha)}</span>
      {pendiente.dias_atraso > 0 && (
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
          padding: '2px 7px', borderRadius: 'var(--r-pill)',
          background: '#E8372A', color: 'white', textTransform: 'uppercase',
          flexShrink: 0,
        }}>{pendiente.dias_atraso}d</span>
      )}
      <span style={{
        fontSize: 11, fontWeight: 700,
        color: accionable ? 'var(--an-granate)' : 'var(--ink-3)',
        display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
      }}>
        {accion}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </span>
    </button>
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
// MODAL CIERRE DE LECCIÓN — A3
// ─────────────────────────────────────────────────────────────────────────
// Una sola pantalla scrolleable.  Una tarjeta por estudiante.
//   • Asistencia Presente/Ausente (default presente)
//   • Retroalimentación (obligatoria u opcional según programa/asistencia)
//   • Progress Check (sólo lecciones {4,8,13,16,21,24,28,30} + INA + riel curso)
//   • Nota general opcional del docente al final
// Validación cliente espejo del backend; resaltado por estudiante.
// ─────────────────────────────────────────────────────────────────────────

const PC_LECCIONES = new Set([4, 8, 13, 16, 21, 24, 28, 30]);
const PC_UNIDADES_MAP = {
  4:'U1-U2', 8:'U3-U4', 13:'U5-U6', 16:'U7-U8',
  21:'U9-U10', 24:'U11-U12', 28:'U13-U14', 30:'U15-U16',
};

function ModalCierreLeccion({ lec, docenteNombre, registradoPor, onClose, onSuccess, onSolicitudEnviada }) {
  // ── B1: el panel admin reusa este modal para cerrar lecciones de otro
  // docente.  docente_real = dueño de la lección; registrado_por = admin
  // logueado.  Si no se pasa registradoPor, asumimos que el dueño se
  // está cerrando su propia lección (flujo Fase 2 / docente).
  const pal = nivelPal(lec.nivel);
  const riel = lec.riel || 'curso';
  const leccionNum = Number(lec.leccion);
  const esPCLec = PC_LECCIONES.has(leccionNum);

  // --- Carga de estudiantes ---
  const [students, setStudents]   = React.useState(null);
  const [programa, setPrograma]   = React.useState('');
  const [loading, setLoading]     = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  // --- Form state ---
  // { [code]: { presente: bool, retro: string, pc: string } }
  const [formData, setFormData]   = React.useState({});
  const [notaDocente, setNotaDocente] = React.useState('');
  const [errors, setErrors]       = React.useState({});
  const [submitErr, setSubmitErr] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [suspOpen, setSuspOpen]   = React.useState(false);

  const cardRefs = React.useRef({});
  const bodyRef  = React.useRef(null);

  // --- Initial fetch ---
  React.useEffect(() => {
    let cancel = false;
    setLoading(true); setLoadError('');
    fetchEstudiantesParaCierre(lec.cod_grupo, lec.nivel).then(r => {
      if (cancel) return;
      if (!r?.ok) {
        setLoadError(r?.error || 'No se pudo cargar la lista de estudiantes.');
        setLoading(false);
        return;
      }
      const list = r.estudiantes || [];
      setStudents(list);
      setPrograma(r.programa || 'SIN_INA');
      const initial = {};
      list.forEach(e => { initial[e.code] = { presente: true, retro: '', pc: '' }; });
      setFormData(initial);
      setLoading(false);
    });
    return () => { cancel = true; };
  }, [lec.cod_grupo, lec.nivel]);

  const esINA      = programa === 'INA' || programa === 'CON_INA';
  const includesPC = esPCLec && esINA && riel === 'curso';

  // ¿Hay cambios? — para confirmar al cancelar
  const dirty = React.useMemo(() => {
    if (notaDocente.trim()) return true;
    return Object.values(formData).some(s =>
      (s.retro && s.retro.trim()) ||
      (s.pc && s.pc.trim()) ||
      s.presente === false
    );
  }, [formData, notaDocente]);

  const updateStudent = (code, field, value) => {
    setFormData(prev => ({ ...prev, [code]: { ...prev[code], [field]: value } }));
    if (errors[code]) {
      setErrors(prev => { const next = { ...prev }; delete next[code]; return next; });
    }
  };

  const validate = () => {
    const errs = {};
    for (const s of (students || [])) {
      const f = formData[s.code];
      if (!f) continue;
      if (!f.presente && !f.retro.trim()) {
        errs[s.code] = `Falta el mensaje para ${s.name} (ausente).`;
        continue;
      }
      if (f.presente && esINA && !f.retro.trim()) {
        errs[s.code] = `Falta retroalimentación para ${s.name}.`;
        continue;
      }
      if (f.presente && includesPC && !f.pc.trim()) {
        errs[s.code] = `Falta Progress Check para ${s.name}.`;
        continue;
      }
    }
    return errs;
  };

  const scrollToCard = (code) => {
    const el  = cardRefs.current[code];
    const box = bodyRef.current;
    if (el && box) box.scrollTop = el.offsetTop - 12;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitErr('');
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      const n = Object.keys(errs).length;
      setSubmitErr(`Hay ${n} ${n === 1 ? 'campo' : 'campos'} por completar.`);
      scrollToCard(Object.keys(errs)[0]);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const asistencias = {};
    const retroalimentacion = {};
    const progress_check = {};
    for (const s of students) {
      const f = formData[s.code];
      if (!f) continue;
      asistencias[s.code] = !!f.presente;
      if (f.retro.trim()) retroalimentacion[s.code] = f.retro.trim();
      if (includesPC && f.presente && f.pc.trim()) progress_check[s.code] = f.pc.trim();
    }

    const body = {
      cod_grupo: lec.cod_grupo,
      nivel: lec.nivel,
      leccion: leccionNum,
      riel,
      docente_real: docenteNombre,
      registrado_por: registradoPor || docenteNombre,
      asistencias,
      retroalimentacion,
      progress_check,
      ...(notaDocente.trim() ? { nota_docente: notaDocente.trim() } : {}),
    };

    const res = await postCerrarLeccionCompleta(body);
    setSubmitting(false);

    if (!res?.ok) {
      setSubmitErr(res?.error || 'No se pudo cerrar la lección.');
      if (Array.isArray(res?.estudiantes_faltantes) && res.estudiantes_faltantes.length) {
        const errs2 = {};
        res.estudiantes_faltantes.forEach(code => {
          errs2[code] = res.error || 'Pendiente';
        });
        setErrors(errs2);
        scrollToCard(res.estudiantes_faltantes[0]);
      }
      return;
    }
    onSuccess && onSuccess(res);
  };

  const handleCancel = () => {
    if (submitting) return;
    if (dirty && !window.confirm('¿Descartar lo que escribiste?')) return;
    onClose();
  };

  // Bloquear scroll del body + ESC para cerrar
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') handleCancel(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, dirty]);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) handleCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26, 22, 19, 0.55)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--f-sans)',
      }}
    >
      <div
        role="dialog" aria-modal="true"
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--r-lg)',
          boxShadow: 'var(--sh-3)',
          width: '100%', maxWidth: 760,
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <ModalCierreHeader
          lec={lec} pal={pal} programa={programa} includesPC={includesPC}
          onClose={handleCancel}
          onSolicitarSuspension={
            (lec.estado === 'PROGRAMADA' || !lec.estado) && !submitting
              ? () => setSuspOpen(true)
              : null
          }
        />

        <div
          ref={bodyRef}
          id="vd-modal-body"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '16px 22px 8px',
            background: 'var(--bg)',
          }}
        >
          {loading ? (
            <LoadingState variant="small" title="Cargando estudiantes…" />
          ) : loadError ? (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              background: 'color-mix(in srgb, var(--danger) 6%, white)',
              border: '1px solid color-mix(in srgb, var(--danger) 25%, white)',
              borderRadius: 'var(--r-md)', color: 'var(--danger)',
              fontSize: 13, lineHeight: 1.5,
            }}>{loadError}</div>
          ) : (students?.length || 0) === 0 ? (
            <SinEstudiantesCA onClose={handleCancel} />
          ) : (
            <>
              {students.map((s, idx) => (
                <EstudianteCard
                  key={s.code}
                  ref={el => { cardRefs.current[s.code] = el; }}
                  estudiante={s}
                  index={idx + 1}
                  data={formData[s.code] || { presente: true, retro: '', pc: '' }}
                  programa={programa}
                  esINA={esINA}
                  includesPC={includesPC}
                  pcUnidades={includesPC ? PC_UNIDADES_MAP[leccionNum] : null}
                  error={errors[s.code]}
                  onChange={updateStudent}
                />
              ))}

              {/* Nota general del docente */}
              <NotaDocenteField value={notaDocente} onChange={setNotaDocente} />
            </>
          )}
        </div>

        <ModalCierreFooter
          submitting={submitting}
          submitErr={submitErr}
          disabled={loading || loadError || !students?.length}
          onCancel={handleCancel}
          onSubmit={handleSubmit}
          totalEstudiantes={students?.length || 0}
          totalPresentes={students ? Object.values(formData).filter(f => f.presente).length : 0}
        />
      </div>

      {suspOpen && (
        <ModalSolicitarSuspension
          lec={lec}
          solicitante={docenteNombre}
          onCerrar={() => setSuspOpen(false)}
          onEnviada={(mensaje) => {
            setSuspOpen(false);
            if (onSolicitudEnviada) onSolicitudEnviada(mensaje);
            onClose();
          }}
        />
      )}
    </div>
  );
}

// ── Header del modal ────────────────────────────────────────────────────
function ModalCierreHeader({ lec, pal, programa, includesPC, onClose, onSolicitarSuspension }) {
  const programaLabel = programa === 'INA' || programa === 'CON_INA' ? 'INA' : 'SIN INA';
  return (
    <div style={{
      padding: '16px 22px 14px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--line)',
      borderTop: `4px solid ${pal.mid}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...vdLabelStyle, marginBottom: 6 }}>Cerrar lección</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h2 style={{
              margin: 0, fontFamily: 'var(--f-serif)', fontWeight: 500,
              fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)',
            }}>
              Lección {String(lec.leccion).padStart(2, '0')}
              {lec.tipo && lec.tipo !== 'TEORICA' && lec.tipo !== 'CLASE' && (
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: pal.mid, color: 'white',
                  padding: '3px 8px', borderRadius: 4,
                  marginLeft: 8, verticalAlign: 'middle',
                  fontFamily: 'var(--f-sans)',
                }}>{lec.tipo}</span>
              )}
            </h2>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', background: pal.light, color: pal.dark,
              borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--f-mono)', letterSpacing: '0.04em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 2, background: pal.mid }} />
              {lec.nivel}
            </span>
          </div>
          <div style={{
            fontSize: 12, color: 'var(--ink-3)',
            marginTop: 6, fontFamily: 'var(--f-mono)',
          }}>
            {lec.cod_grupo}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
            {vdFmtLargo(lec.fecha)}
            {lec.turno && <> · <span style={{ fontFamily: 'var(--f-mono)' }}>{lec.turno}</span></>}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              padding: '3px 8px', borderRadius: 'var(--r-pill)',
              background: programa === 'INA' || programa === 'CON_INA'
                ? 'color-mix(in srgb, var(--an-navy) 12%, white)'
                : 'var(--bg-deep)',
              color: programa === 'INA' || programa === 'CON_INA'
                ? 'var(--an-navy-ink)' : 'var(--ink-2)',
              textTransform: 'uppercase',
            }}>
              {programa ? programaLabel : '— programa —'}
            </span>
            {includesPC && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                padding: '3px 8px', borderRadius: 'var(--r-pill)',
                background: 'color-mix(in srgb, #4CAF50 14%, white)',
                color: '#1B5E20', textTransform: 'uppercase',
              }}>
                Incluye Progress Check
              </span>
            )}
            {lec.riel === 'ican' && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                padding: '3px 8px', borderRadius: 'var(--r-pill)',
                background: '#4CAF50', color: 'white', textTransform: 'uppercase',
              }}>I CAN</span>
            )}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
          <button
            type="button" onClick={onClose} aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, color: 'var(--ink-3)', lineHeight: 0,
              borderRadius: 'var(--r-sm)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-deep)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {onSolicitarSuspension && (
            <button
              type="button"
              onClick={onSolicitarSuspension}
              style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'6px 10px',
                background:'var(--surface)',
                border:'1.5px dashed #B7791F',
                color:'#7A4F00',
                fontSize:11, fontWeight:700,
                borderRadius:'var(--r-pill)',
                cursor:'pointer',
                letterSpacing:'0.04em', textTransform:'uppercase',
                fontFamily:'inherit',
                whiteSpace:'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FFF8E1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; }}
              title="Solicitar al admin que suspenda esta lección.">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Solicitar suspensión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Footer del modal ────────────────────────────────────────────────────
function ModalCierreFooter({ submitting, submitErr, disabled, onCancel, onSubmit, totalEstudiantes, totalPresentes }) {
  return (
    <div style={{
      borderTop: '1px solid var(--line)',
      padding: '12px 22px',
      background: 'var(--surface)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {submitErr && (
        <div style={{
          padding: '8px 12px', borderRadius: 'var(--r-sm)',
          background: 'color-mix(in srgb, var(--danger) 8%, white)',
          border: '1px solid color-mix(in srgb, var(--danger) 28%, white)',
          color: 'var(--danger)', fontSize: 12, fontWeight: 600, lineHeight: 1.4,
        }}>⚠ {submitErr}</div>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap', justifyContent: 'flex-end',
      }}>
        {totalEstudiantes > 0 && (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginRight: 'auto', fontFamily: 'var(--f-mono)' }}>
            {totalPresentes}/{totalEstudiantes} presentes · {totalEstudiantes - totalPresentes} ausentes
          </div>
        )}
        <button
          type="button" onClick={onCancel} disabled={submitting}
          style={{
            padding: '11px 18px', minHeight: 44,
            border: '1.5px solid var(--line)',
            borderRadius: 'var(--r-md)',
            background: 'var(--surface)', color: 'var(--ink-2)',
            fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.5 : 1,
          }}>
          Cancelar
        </button>
        <button
          type="button" onClick={onSubmit}
          disabled={submitting || disabled}
          style={{
            padding: '11px 20px', minHeight: 44,
            border: 'none', borderRadius: 'var(--r-md)',
            background: 'var(--an-granate)', color: 'white',
            fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 700,
            cursor: (submitting || disabled) ? 'not-allowed' : 'pointer',
            opacity: (submitting || disabled) ? 0.6 : 1,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
          {submitting && (
            <span style={{
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.4)',
              borderTopColor: 'white',
              animation: 'vd-spin 0.7s linear infinite',
              display: 'inline-block',
            }} />
          )}
          {submitting ? 'Cerrando…' : 'Cerrar lección'}
        </button>
      </div>
    </div>
  );
}

// ── Tarjeta por estudiante ──────────────────────────────────────────────
const EstudianteCard = React.forwardRef(function EstudianteCard(
  { estudiante, index, data, programa, esINA, includesPC, pcUnidades, error, onChange },
  ref
) {
  const presente = data.presente;
  // Reglas de retro
  const retroObligatoria = !presente || (presente && esINA);
  const retroPlaceholder = !presente
    ? 'Avisá al estudiante qué se vio, tareas, páginas, lo que debe ponerse al día (obligatorio).'
    : esINA
      ? 'Retroalimentación de la clase (obligatorio).'
      : 'Nota opcional para el estudiante.';

  const hasError = !!error;

  return (
    <div
      ref={ref}
      style={{
        background: 'var(--surface)',
        border: hasError
          ? '1.5px solid #E8372A'
          : '1px solid var(--line)',
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        marginBottom: 12,
        boxShadow: hasError ? '0 0 0 3px rgba(232,55,42,0.08)' : 'none',
        transition: 'border-color .15s, box-shadow .15s',
      }}>
      {/* Cabecera */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        marginBottom: 10, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'var(--bg-deep)', color: 'var(--ink-2)',
          display: 'grid', placeItems: 'center',
          fontSize: 12, fontWeight: 700, fontFamily: 'var(--f-mono)',
          flexShrink: 0,
        }}>{index}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15, fontWeight: 600, color: 'var(--ink)',
            lineHeight: 1.3, letterSpacing: '-0.005em',
          }}>{estudiante.name}</div>
          <div style={{
            fontSize: 11, color: 'var(--ink-3)',
            fontFamily: 'var(--f-mono)', marginTop: 2,
            display: 'flex', gap: 8, flexWrap: 'wrap',
          }}>
            <span>{estudiante.code}</span>
            {estudiante.convenio && estudiante.convenio !== '—' && (
              <span style={{
                padding: '0 6px', background: 'var(--bg-deep)',
                borderRadius: 4, color: 'var(--ink-2)', fontWeight: 600,
                fontSize: 10,
              }}>{estudiante.convenio}</span>
            )}
          </div>
        </div>

        {/* Toggle Presente / Ausente */}
        <div style={{
          display: 'flex', gap: 0, flexShrink: 0,
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-md)',
          overflow: 'hidden', background: 'var(--bg-deep)',
        }}>
          <button
            type="button"
            onClick={() => onChange(estudiante.code, 'presente', true)}
            style={{
              padding: '10px 14px', minHeight: 44,
              border: 'none', cursor: 'pointer',
              background: presente ? '#2E7D32' : 'transparent',
              color: presente ? 'white' : 'var(--ink-2)',
              fontFamily: 'var(--f-sans)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
              transition: 'background .12s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {presente && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            Presente
          </button>
          <button
            type="button"
            onClick={() => onChange(estudiante.code, 'presente', false)}
            style={{
              padding: '10px 14px', minHeight: 44,
              border: 'none', borderLeft: '1px solid var(--line)',
              cursor: 'pointer',
              background: !presente ? '#B3261E' : 'transparent',
              color: !presente ? 'white' : 'var(--ink-2)',
              fontFamily: 'var(--f-sans)',
              fontSize: 12, fontWeight: 700, letterSpacing: '0.02em',
              transition: 'background .12s',
            }}>
            Ausente
          </button>
        </div>
      </div>

      {/* Retro */}
      <div style={{ marginBottom: includesPC && presente ? 10 : 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 4,
        }}>
          <label style={vdLabelStyle}>
            {!presente ? 'Mensaje para el ausente' : 'Retroalimentación'}
          </label>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: retroObligatoria ? '#B3261E' : 'var(--ink-3)',
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {retroObligatoria ? '· obligatorio' : '· opcional'}
          </span>
        </div>
        <textarea
          value={data.retro}
          onChange={e => onChange(estudiante.code, 'retro', e.target.value)}
          placeholder={retroPlaceholder}
          rows={3}
          style={textareaStyle(hasError)}
        />
      </div>

      {/* Progress Check */}
      {includesPC && presente && (
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 4,
          }}>
            <label style={vdLabelStyle}>
              Progress Check ({pcUnidades})
            </label>
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#B3261E',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>· obligatorio</span>
          </div>
          <textarea
            value={data.pc}
            onChange={e => onChange(estudiante.code, 'pc', e.target.value)}
            placeholder={`Observación de Progress Check para las unidades ${pcUnidades}.`}
            rows={2}
            style={textareaStyle(hasError)}
          />
        </div>
      )}

      {/* Error inline */}
      {hasError && (
        <div style={{
          marginTop: 8, padding: '6px 10px',
          background: 'color-mix(in srgb, var(--danger) 8%, white)',
          border: '1px solid color-mix(in srgb, var(--danger) 26%, white)',
          borderRadius: 'var(--r-sm)',
          fontSize: 11, fontWeight: 600, color: 'var(--danger)',
          lineHeight: 1.4,
        }}>⚠ {error}</div>
      )}
    </div>
  );
});

function textareaStyle(hasError) {
  return {
    width: '100%', boxSizing: 'border-box',
    padding: '9px 12px',
    border: hasError ? '1.5px solid #E8372A' : '1.5px solid var(--line)',
    borderRadius: 'var(--r-sm)',
    background: 'var(--surface)',
    fontFamily: 'var(--f-sans)', fontSize: 13, lineHeight: 1.5,
    color: 'var(--ink)', outline: 'none', resize: 'vertical', minHeight: 60,
  };
}

// ── Nota general del docente ────────────────────────────────────────────
function NotaDocenteField({ value, onChange }) {
  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      padding: '14px 16px', marginBottom: 12,
    }}>
      <label style={{ ...vdLabelStyle, display: 'block', marginBottom: 4 }}>
        Nota general del docente · opcional
      </label>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 6 }}>
        Observación general de la clase, no visible al estudiante.
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Ej: hubo apagón los primeros 15 min, cubrimos hasta pág. 12…"
        rows={2}
        style={textareaStyle(false)}
      />
    </div>
  );
}

// ── Caso "sin estudiantes CA" — mensaje claro, no error ─────────────────
function SinEstudiantesCA({ onClose }) {
  return (
    <div style={{
      padding: '40px 16px', textAlign: 'center',
      background: 'var(--surface)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
    }}>
      <div style={{ fontSize: 38, marginBottom: 10, opacity: 0.4 }}>👥</div>
      <div style={{
        fontFamily: 'var(--f-serif)', fontSize: 18, fontWeight: 500,
        color: 'var(--ink)', letterSpacing: '-0.015em', marginBottom: 6,
      }}>
        Sin estudiantes matriculados aún
      </div>
      <div style={{
        fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55,
        maxWidth: 420, margin: '0 auto 16px',
      }}>
        No hay estudiantes con estatus <strong>CA</strong> en este nivel del grupo todavía.
        No se puede cerrar la lección hasta que haya matriculados.
      </div>
      <button
        type="button" onClick={onClose}
        style={{
          padding: '10px 16px', minHeight: 44,
          border: '1.5px solid var(--line)',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface)', color: 'var(--ink-2)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'var(--f-sans)',
        }}>
        Entendido
      </button>
    </div>
  );
}

// ── Toast simple para "Lección cerrada ✓" ──────────────────────────────
function VDToast({ message, onDone }) {
  React.useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDone, 3200);
    return () => clearTimeout(id);
  }, [message, onDone]);
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--ink)', color: 'white',
      padding: '12px 20px', borderRadius: 'var(--r-pill)',
      fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 600,
      boxShadow: 'var(--sh-3)', zIndex: 1100,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Componente raíz
// ─────────────────────────────────────────────────────────────────────────
function VistaDocente({ cedulaOverride, nombreOverride } = {}) {
  const sesion = React.useMemo(() => leerSesionDocente(), []);

  const nombre = nombreOverride || sesion.nombre || '';
  const cedula = cedulaOverride || sesion.cedula || '';
  const idDocente = nombre || cedula;

  const [calendario, setCalendario] = React.useState(null);
  const [pendientes, setPendientes] = React.useState(null);
  const [loading, setLoading]       = React.useState(false);
  const [error, setError]           = React.useState('');
  const [tab, setTab]               = React.useState('proximas');
  const [modalLec, setModalLec]     = React.useState(null);   // lección en cierre
  const [toastMsg, setToastMsg]     = React.useState('');
  const [bannerAbierto, setBannerAbierto] = React.useState(false);
  const [catAbierta, setCatAbierta]       = React.useState(null);
  // Para que la inicialización del banner (abierto + categoría) sólo
  // suceda una vez después del primer fetch — no en cada refetch.
  const bannerInicializado = React.useRef(false);

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

  // Sin sesión → mensaje neutro. El selector de prueba ahora vive en el
  // sidebar (Modo prueba, exclusivo del superadmin); si llegaste acá sin
  // identidad es porque la sesión expiró: redirigir a login.
  if (!idDocente) {
    return (
      <div data-screen-label="Vista docente · sin sesión">
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub="No hay docente identificado en la sesión. Iniciá sesión nuevamente."
        />
        <div style={{
          maxWidth: 520, margin: '32px auto', padding: 24,
          background: 'var(--surface-2)',
          border: '1px dashed var(--line-2)',
          borderRadius: 'var(--r-md)',
          fontFamily: 'var(--f-sans)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 14, lineHeight: 1.5 }}>
            Tu sesión no incluye nombre ni cédula de docente. Esto suele
            pasar cuando la sesión se ensució con datos viejos. Salí y
            volvé a iniciar sesión desde <code>login.html</code>.
          </div>
          <button
            onClick={() => {
              try { sessionStorage.removeItem('an_usuario'); } catch(_) {}
              window.location.href = 'login.html';
            }}
            className="btn btn-primary"
            style={{ background:'var(--an-granate)', borderColor:'var(--an-granate)' }}>
            Ir a inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (loading && !calendario) {
    return (
      <div data-screen-label="Vista docente · cargando">
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub={nombreAmable(nombre) || cedula}
        />
        <LoadingState variant="small" title="Cargando panel del docente…" />
      </div>
    );
  }

  if (error && !calendario) {
    return (
      <div data-screen-label="Vista docente · error">
        <PageHeader
          kicker="Panel del docente"
          title={<>Mi <em>Panel</em></>}
          sub={nombreAmable(nombre) || cedula}
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

  // ── Arranque inteligente del banner ──────────────────────────────────
  // Si hay pendientes al PRIMER load, abrimos el banner y expandimos
  // automáticamente la primera categoría que tenga items.  Esto pasa una
  // sola vez por montaje; refetch() después de cerrar una lección NO
  // re-expande el banner si el docente ya lo había cerrado.
  if (pendientes && !bannerInicializado.current) {
    bannerInicializado.current = true;
    if (totalPendientes > 0) {
      setBannerAbierto(true);
      if      ((pendientes.totales?.sin_cerrar || 0) > 0) setCatAbierta('sin_cerrar');
      else if ((pendientes.totales?.sin_retro  || 0) > 0) setCatAbierta('sin_retro');
      else if ((pendientes.totales?.sin_pc     || 0) > 0) setCatAbierta('sin_pc');
    }
  }

  // ── Click en pendiente sin_cerrar → abrir modal de A3 ────────────────
  // El pendiente trae cod_grupo/nivel/leccion/riel/fecha/dias_atraso pero
  // el modal espera el objeto completo (con tipo/turno/dia).  Buscamos
  // la lección en programadas; si no aparece (raro) usamos el pendiente
  // directo — el cierre necesita sólo las 4 keys que sí trae.
  const abrirCierreDesdePendiente = (p) => {
    const match = (calendario?.programadas || []).find(l =>
      l.cod_grupo === p.cod_grupo &&
      l.nivel     === p.nivel     &&
      String(l.leccion) === String(p.leccion) &&
      (l.riel || 'curso') === (p.riel || 'curso')
    );
    setModalLec(match || { ...p, estado: 'PROGRAMADA' });
  };

  // ── Click en pendiente sin_retro / sin_pc → tab Histórico + aviso ────
  // La edición de retro/PC de lecciones ya cerradas es funcionalidad
  // futura.  Llevamos al docente al histórico para que vea el contexto.
  // TODO: editar retro de lección cerrada — fase futura
  // TODO: editar Progress Check de lección cerrada — fase futura
  const navegarAHistorico = (msgPrefix) => {
    setTab('historico');
    setToastMsg(`${msgPrefix}: la edición de lecciones cerradas estará disponible próximamente.`);
    // Subir el scroll para que el docente vea el histórico desde arriba.
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div data-screen-label="Vista docente">
      <PageHeader
        kicker="Panel del docente"
        title={<>Mi <em>Panel</em></>}
        sub={nombreAmable(nombre) || cedula}
      />

      <PendientesBanner
        totales={pendientes?.totales}
        sinCerrar={pendientes?.sin_cerrar}
        sinRetro={pendientes?.sin_retro}
        sinPC={pendientes?.sin_pc}
        abierto={bannerAbierto}
        onToggle={() => setBannerAbierto(v => !v)}
        catAbierta={catAbierta}
        onToggleCat={setCatAbierta}
        onClickSinCerrar={abrirCierreDesdePendiente}
        onClickSinRetro={() => navegarAHistorico('Sin retroalimentación')}
        onClickSinPC={() => navegarAHistorico('Sin Progress Check')}
      />

      <VDTabs value={tab} onChange={setTab} counts={counts} />

      {tab === 'proximas' && (
        <VDTabProximas
          programadas={calendario?.programadas || []}
          sinCerrar={pendientes?.sin_cerrar || []}
          onAbrirCierre={(lec) => setModalLec(lec)}
        />
      )}
      {tab === 'historico' && (
        <VDTabHistorico cerradas={calendario?.cerradas || []} />
      )}
      {tab === 'pre' && (
        <VDTabPre historico={calendario?.historico || []} />
      )}

      {modalLec && (
        <ModalCierreLeccion
          lec={modalLec}
          docenteNombre={nombre || cedula}
          onClose={() => setModalLec(null)}
          onSuccess={(res) => {
            setModalLec(null);
            const presentes = res?.asistencia?.presentes ?? 0;
            const ausentes  = res?.asistencia?.ausentes ?? 0;
            setToastMsg(
              ausentes
                ? `Lección cerrada ✓ · ${presentes} presentes, ${ausentes} ausentes`
                : `Lección cerrada ✓ · ${presentes} presentes`
            );
            refetch();
          }}
          onSolicitudEnviada={(mensaje) => {
            setToastMsg(mensaje || 'Solicitud enviada, pendiente de aprobación.');
            refetch();
          }}
        />
      )}

      <VDToast message={toastMsg} onDone={() => setToastMsg('')} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Modal — Solicitar suspensión (docente)
// El docente PIDE suspender una lección PROGRAMADA; el admin aprueba.
// Solo al aprobar se empuja el calendario.
// ─────────────────────────────────────────────────────────────────
function ModalSolicitarSuspension({ lec, solicitante, onCerrar, onEnviada }) {
  const [motivo, setMotivo]     = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [err, setErr]           = React.useState('');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !enviando) onCerrar(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enviando, onCerrar]);

  const handleEnviar = async () => {
    const m = motivo.trim();
    if (!m) { setErr('Indicá un motivo para la suspensión.'); return; }
    if (m.length < 8) { setErr('El motivo es muy corto. Describí qué pasó.'); return; }
    setEnviando(true); setErr('');

    const payload = {
      cod_grupo: lec.cod_grupo,
      nivel:     lec.nivel,
      leccion:   lec.leccion,
      riel:      lec.riel || 'curso',
      motivo:    m,
      solicitante: solicitante || '',
    };
    const res = await window.fetchSolicitarSuspension(payload);
    setEnviando(false);
    if (!res?.ok) {
      setErr(res?.error || 'No se pudo enviar la solicitud.');
      return;
    }
    onEnviada(`Solicitud enviada · pendiente de aprobación (${res.id || ''}).`);
  };

  const pal = VD_NIVEL_COLORES && VD_NIVEL_COLORES[lec.nivel];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget && !enviando) onCerrar(); }}
      style={{
        position:'fixed', inset:0, zIndex:1200,
        background:'rgba(20,16,12,0.55)',
        backdropFilter:'blur(3px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:18,
      }}>
      <div role="dialog" aria-modal="true"
        style={{
          width:'100%', maxWidth:480,
          background:'var(--surface)',
          borderRadius:'var(--r-lg, 12px)',
          boxShadow:'0 24px 64px rgba(0,0,0,0.36)',
          overflow:'hidden',
          display:'flex', flexDirection:'column',
          maxHeight:'calc(100vh - 36px)',
        }}>
        {/* Header ámbar — "acción excepcional" */}
        <div style={{
          padding:'16px 22px 12px',
          background:'#FFF8E1',
          borderBottom:'1px solid #F0E1A8',
          display:'flex', alignItems:'flex-start', gap:14,
        }}>
          <div style={{
            width:34, height:34, borderRadius:8,
            background:'#B7791F', color:'#FFF',
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <div style={{
              fontSize:10, fontWeight:800, letterSpacing:'0.16em',
              textTransform:'uppercase', color:'#7A4F00',
            }}>Solicitud de suspensión</div>
            <div style={{
              fontFamily:'var(--f-serif)', fontSize:19, fontWeight:600,
              color:'var(--ink)', letterSpacing:'-0.015em',
              marginTop:2, lineHeight:1.2,
            }}>
              ¿Por qué hay que suspender esta lección?
            </div>
          </div>
          <button type="button" onClick={() => !enviando && onCerrar()} aria-label="Cerrar"
            style={{
              background:'none', border:'none',
              cursor: enviando ? 'not-allowed' : 'pointer',
              padding:4, color:'#7A4F00', lineHeight:0,
              opacity: enviando ? 0.4 : 1,
            }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding:'16px 22px 4px', overflowY:'auto' }}>
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'10px 16px',
            padding:'12px 14px',
            background:'var(--surface-2)',
            border:'1px solid var(--line)',
            borderRadius:'var(--r-md)',
            marginBottom:16,
          }}>
            <SuspField label="Grupo" value={lec.cod_grupo} mono />
            <SuspField label="Nivel" value={lec.nivel} pal={pal} />
            <SuspField label="Lección" value={`#${String(lec.leccion).padStart(2,'0')}`} mono />
            <SuspField label="Fecha" value={vdFmtLargo(lec.fecha)} />
            <div style={{ gridColumn:'1 / -1' }}>
              <SuspField label="Riel"
                value={(lec.riel || 'curso') === 'ican' ? 'I CAN' : 'Curso (Teórica/Práctica)'} />
            </div>
          </div>

          <div style={{
            padding:'10px 12px',
            background:'#FFF3CD',
            border:'1px solid #FFE082',
            borderRadius:'var(--r-md)',
            fontSize:12, color:'#7A4F00', lineHeight:1.5,
            marginBottom:14,
          }}>
            <b>Importante:</b> suspender <u>no elimina</u> la lección.
            Al aprobar, el admin la corre a la siguiente fecha del patrón;
            todas las lecciones siguientes se desplazan un día hábil.
            Las 32 lecciones se dan siempre.
          </div>

          <label style={{ display:'block', marginBottom:14 }}>
            <div style={vdLabelStyle}>Motivo *</div>
            <textarea
              value={motivo}
              onChange={e => { setMotivo(e.target.value); setErr(''); }}
              disabled={enviando}
              rows={4}
              placeholder="Ej.: docente incapacitado, corte de luz en la sede, etc."
              style={{
                width:'100%', marginTop:6,
                padding:'10px 12px',
                border:'1.5px solid var(--line)',
                background:'var(--surface)',
                borderRadius:'var(--r-md)',
                fontSize:13, color:'var(--ink)',
                fontFamily:'inherit',
                outline:'none', resize:'vertical',
                boxSizing:'border-box', lineHeight:1.5,
              }}
            />
          </label>

          <div style={{
            fontSize:11, color:'var(--ink-3)', marginBottom:12,
          }}>
            Solicitante: <b style={{ color:'var(--ink-2)' }}>{solicitante || '—'}</b>
          </div>

          {err && (
            <div style={{
              padding:'10px 12px',
              background:'color-mix(in srgb, var(--danger, #B71C1C) 8%, white)',
              border:'1px solid color-mix(in srgb, var(--danger, #B71C1C) 28%, white)',
              borderRadius:'var(--r-sm)',
              fontSize:12, color:'var(--danger, #B71C1C)',
              marginBottom:12, fontWeight:600,
            }}>⚠ {err}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding:'14px 22px 18px',
          borderTop:'1px solid var(--line)',
          display:'flex', justifyContent:'flex-end', gap:10,
        }}>
          <button type="button"
            onClick={() => !enviando && onCerrar()}
            disabled={enviando}
            style={{
              padding:'10px 16px', background:'transparent',
              border:'1.5px solid var(--line-2, var(--line))',
              color:'var(--ink-2)',
              fontSize:13, fontWeight:600,
              borderRadius:'var(--r-md)',
              cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily:'inherit',
            }}>Cancelar</button>
          <button type="button"
            onClick={handleEnviar}
            disabled={enviando || !motivo.trim()}
            style={{
              padding:'10px 18px',
              background: (enviando || !motivo.trim()) ? '#C9BFB1' : '#B7791F',
              border:'none', color:'#FFF',
              fontSize:13, fontWeight:700,
              borderRadius:'var(--r-md)',
              cursor: (enviando || !motivo.trim()) ? 'not-allowed' : 'pointer',
              letterSpacing:'0.02em',
              fontFamily:'inherit',
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
            {enviando ? (
              <>
                <span style={{
                  width:11, height:11, borderRadius:'50%',
                  border:'2px solid rgba(255,255,255,0.4)',
                  borderTopColor:'#FFF',
                  animation:'an-spin .8s linear infinite',
                  display:'inline-block',
                }} />
                Enviando…
              </>
            ) : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </div>
  );
}

const VD_NIVEL_COLORES = { B1:'#E5A823', B2:'#E8372A', I1:'#2B7FC1', I2:'#4CAF50' };

function SuspField({ label, value, mono, pal }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{
        fontSize:9, fontWeight:700, letterSpacing:'0.12em',
        textTransform:'uppercase', color:'var(--ink-3)', marginBottom:2,
      }}>{label}</div>
      <div style={{
        fontSize:12, color: pal || 'var(--ink)', fontWeight:600,
        fontFamily: mono ? 'var(--f-mono)' : 'inherit',
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

Object.assign(window, { VistaDocente, ModalCierreLeccion });