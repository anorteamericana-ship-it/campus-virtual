/* global React, PageHeader, EmptyState, ErrorState, ModalCierreLeccion,
   fetchDocentesAtrasados */

// ─────────────────────────────────────────────────────────────────────────
// PANEL ADMIN — B1 · Supervisión de docentes atrasados
// ─────────────────────────────────────────────────────────────────────────
// Vista de supervisión (solo lectura + cerrar lección) sobre los docentes
// con lecciones sin cerrar.  Reusa el modal de cierre del A3 (vista
// docente) en modo "admin cierra por el docente":
//   • docente_real      = nombre del docente DUEÑO de la lección
//   • registrado_por    = nombre del admin logueado
//
// Endpoint pesado (≈ 11 s).  Spinner claro + botón "Actualizar"
// manual (no auto-refresh).  Tras un cierre exitoso restamos 1 a esa
// tarjeta localmente para no re-esperar; el botón "Actualizar"
// re-sincroniza desde el servidor.
// ─────────────────────────────────────────────────────────────────────────

// Paleta por nivel — idéntica a vista_docente / cronograma_grupo
const PAS_NIVEL = {
  B1: { dark:'#9A6A00', mid:'#E5A823', light:'#FFF8DC' },
  B2: { dark:'#8B1A10', mid:'#E8372A', light:'#FDECEA' },
  I1: { dark:'#0D47A1', mid:'#2B7FC1', light:'#E8F1FD' },
  I2: { dark:'#1B5E20', mid:'#4CAF50', light:'#EBF5EB' },
};
const pasNivel = (n) => PAS_NIVEL[n] || PAS_NIVEL.B1;

const MES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function pasFmtFechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${MES_CORTO[d.getMonth()]}`;
}
function pasFmtFechaLarga(iso) {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${MES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Gravedad → color de acento ─────────────────────────────────────────
function gravedad(maxDiasAtraso, totalPendientes) {
  if (!totalPendientes || totalPendientes === 0) {
    return { tono: 'ok', accent: '#4CAF50', accentInk: '#1B5E20',
             bg: 'color-mix(in srgb, #4CAF50 6%, white)', label: 'Al día' };
  }
  if (maxDiasAtraso >= 4) {
    return { tono: 'urgente', accent: '#B3261E', accentInk: '#5C0F09',
             bg: 'color-mix(in srgb, #B3261E 5%, white)', label: 'Urgente' };
  }
  if (maxDiasAtraso >= 2) {
    return { tono: 'alto',   accent: '#C67100', accentInk: '#7A4500',
             bg: 'color-mix(in srgb, #C67100 5%, white)', label: 'Atrasado' };
  }
  if (maxDiasAtraso >= 1) {
    return { tono: 'medio',  accent: '#E5A823', accentInk: '#9A6A00',
             bg: 'color-mix(in srgb, #E5A823 6%, white)', label: 'Reciente' };
  }
  // total > 0 pero 0 días de atraso (raro): sin retro/PC sin atraso
  return { tono: 'medio',  accent: '#8B8178', accentInk: '#4A413A',
             bg: 'var(--surface-2)', label: 'Pendiente' };
}

const pasLabelStyle = {
  fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: 'var(--ink-3)',
};

// ─────────────────────────────────────────────────────────────────────────
// Sub: Spinner grande (la espera es larga, hay que tranquilizar al admin)
// ─────────────────────────────────────────────────────────────────────────
function PASSpinner({ etapa }) {
  // Etapas visuales para que el admin sepa que no está colgado.
  const etapas = [
    { t: 0,    label: 'Conectando con el servidor…' },
    { t: 1500, label: 'Recolectando lecciones programadas…' },
    { t: 4000, label: 'Calculando atrasos de todos los docentes…' },
    { t: 8000, label: 'Casi listo, ordenando por gravedad…' },
  ];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const timers = etapas.map((e, i) =>
      e.t > 0 ? setTimeout(() => setIdx(i), e.t) : null
    );
    return () => timers.forEach(t => t && clearTimeout(t));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      padding: '64px 24px 80px', textAlign: 'center',
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
    }}>
      <div style={{
        width: 44, height: 44, margin: '0 auto 18px',
        borderRadius: '50%',
        border: '3px solid var(--line)', borderTopColor: 'var(--an-granate)',
        animation: 'pas-spin 0.9s linear infinite',
      }} />
      <div style={{
        fontFamily: 'var(--f-serif)', fontSize: 19, fontWeight: 500,
        color: 'var(--ink)', letterSpacing: '-0.015em', marginBottom: 8,
      }}>
        Calculando atrasos de todos los docentes
      </div>
      <div style={{
        fontSize: 13, color: 'var(--ink-2)', minHeight: 20,
        transition: 'opacity .25s',
      }}>{etapas[idx].label}</div>
      <div style={{
        fontSize: 11, color: 'var(--ink-3)', marginTop: 16,
        fontFamily: 'var(--f-mono)',
      }}>
        Esto toma ~11 segundos · no recargues la página
      </div>
      <style>{`@keyframes pas-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub: Resumen superior (X de Y con atrasos, fecha, botón Actualizar)
// ─────────────────────────────────────────────────────────────────────────
function PASResumen({ data, loading, onRefresh }) {
  const conAtraso = data?.total_con_atraso ?? 0;
  const total     = data?.total_docentes ?? 0;
  const generado  = data?.generado || '';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      padding: '16px 18px', marginBottom: 18,
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
    }}>
      {/* Big stat */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--f-serif)', fontSize: 34, fontWeight: 600,
          letterSpacing: '-0.02em', color: conAtraso > 0 ? 'var(--an-granate)' : '#2E7D32',
          lineHeight: 1,
        }}>{conAtraso}</span>
        <span style={{
          fontFamily: 'var(--f-serif)', fontSize: 22, fontWeight: 400,
          color: 'var(--ink-2)', letterSpacing: '-0.01em',
        }}>de {total}</span>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>
          {conAtraso === 0
            ? 'Todos los docentes están al día.'
            : `${conAtraso === 1 ? 'docente tiene' : 'docentes tienen'} lecciones atrasadas`}
        </div>
        {generado && (
          <div style={{
            fontSize: 11, color: 'var(--ink-3)', marginTop: 3,
            fontFamily: 'var(--f-mono)',
          }}>
            Generado el {pasFmtFechaLarga(generado)}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        style={{
          padding: '10px 16px', minHeight: 44,
          background: 'var(--surface)', color: 'var(--an-granate)',
          border: '1.5px solid var(--an-granate)',
          borderRadius: 'var(--r-md)',
          fontFamily: 'var(--f-sans)', fontSize: 13, fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          letterSpacing: '0.005em',
          flexShrink: 0,
        }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
             style={{ animation: loading ? 'pas-spin 0.9s linear infinite' : 'none' }}>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
        </svg>
        {loading ? 'Actualizando…' : 'Actualizar'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub: chip de código de grupo (con su color de nivel)
// ─────────────────────────────────────────────────────────────────────────
function GrupoChip({ cod }) {
  // El nivel está al inicio del código: "B1-LJ69-…"
  const nivel = (cod || '').split('-')[0];
  const pal = pasNivel(nivel);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px',
      background: pal.light, color: pal.dark,
      border: `1px solid ${pal.mid}33`,
      borderRadius: 'var(--r-sm)',
      fontFamily: 'var(--f-mono)', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.01em',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: 2, background: pal.mid,
      }} />
      {cod}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub: tarjeta de docente AL DÍA (compacta, verde)
// ─────────────────────────────────────────────────────────────────────────
function DocenteAlDiaCard({ docente }) {
  const inactivo = docente.activo === false;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: inactivo ? 'var(--surface-2)' : 'color-mix(in srgb, #4CAF50 5%, white)',
      border: inactivo
        ? '1px solid var(--line)'
        : '1px solid color-mix(in srgb, #4CAF50 24%, white)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
      opacity: inactivo ? 0.7 : 1,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: inactivo ? 'var(--bg-deep)' : '#4CAF50', color: 'white',
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        {inactivo ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M9 12h6" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'var(--ink)',
          letterSpacing: '-0.005em', lineHeight: 1.3,
        }}>{docente.nombre}</div>
        <div style={{
          fontSize: 11, color: 'var(--ink-3)', marginTop: 2,
          fontFamily: 'var(--f-mono)',
        }}>
          {inactivo ? 'Sin grupos activos' : 'Sin lecciones pendientes'}
        </div>
      </div>
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        padding: '4px 10px', borderRadius: 'var(--r-pill)',
        background: inactivo ? 'var(--bg-deep)' : '#4CAF50',
        color: inactivo ? 'var(--ink-3)' : 'white',
        textTransform: 'uppercase', flexShrink: 0,
      }}>
        {inactivo ? 'Inactivo' : 'Al día ✓'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub: fila de lección dentro del detalle expandido
// ─────────────────────────────────────────────────────────────────────────
function LeccionAtrasadaRow({ lec, onCerrar }) {
  const pal = pasNivel(lec.nivel);
  const esICAN = lec.riel === 'ican';
  const dias = lec.dias_atraso || 0;

  // Color del badge de días según gravedad
  const diasColor =
    dias >= 4 ? '#B3261E' :
    dias >= 2 ? '#C67100' :
    dias >= 1 ? '#E5A823' : '#8B8178';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr auto auto',
      alignItems: 'center', gap: 12,
      padding: '10px 12px',
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderLeft: `4px solid ${pal.mid}`,
      borderRadius: 'var(--r-sm)',
      fontFamily: 'var(--f-sans)',
    }}>
      {/* Nivel + Lec N */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 7px', background: pal.light, color: pal.dark,
          borderRadius: 4, fontSize: 10, fontWeight: 700,
          fontFamily: 'var(--f-mono)', letterSpacing: '0.04em',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 2, background: pal.mid }} />
          {lec.nivel}
        </span>
        <span style={{
          fontFamily: 'var(--f-mono)', fontSize: 13, fontWeight: 700,
          color: 'var(--ink)',
        }}>
          Lec {String(lec.leccion).padStart(2, '0')}
        </span>
        {esICAN && (
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
            padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
            background: '#4CAF50', color: 'white',
          }}>I CAN</span>
        )}
      </div>

      {/* Código de grupo + fecha */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--ink-2)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{lec.cod_grupo}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
          {pasFmtFechaCorta(lec.fecha)}
        </div>
      </div>

      {/* Días de atraso */}
      <span style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
        padding: '4px 9px', borderRadius: 'var(--r-pill)',
        background: diasColor, color: 'white', textTransform: 'uppercase',
        fontFamily: 'var(--f-mono)',
        whiteSpace: 'nowrap',
      }}>{dias}d atraso</span>

      {/* Cerrar */}
      <button
        type="button"
        onClick={() => onCerrar(lec)}
        style={{
          padding: '8px 14px', minHeight: 36,
          border: 'none', borderRadius: 'var(--r-md)',
          background: 'var(--an-granate)', color: 'white',
          fontFamily: 'var(--f-sans)', fontSize: 12, fontWeight: 700,
          letterSpacing: '0.01em', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap',
        }}>
        Cerrar lección
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Sub: tarjeta de docente CON ATRASO
// ─────────────────────────────────────────────────────────────────────────
function DocenteAtrasadoCard({ docente, abierto, onToggle, onCerrarLeccion }) {
  const grav = gravedad(docente.max_dias_atraso, docente.total_pendientes);

  // Solo categorías > 0
  const desglose = [
    docente.sin_cerrar > 0 && { label: 'sin cerrar', n: docente.sin_cerrar, color: '#B3261E' },
    docente.sin_retro  > 0 && { label: 'sin retro',  n: docente.sin_retro,  color: '#C67100' },
    docente.sin_pc     > 0 && { label: 'sin PC',     n: docente.sin_pc,     color: '#7B1FA2' },
  ].filter(Boolean);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderLeft: `5px solid ${grav.accent}`,
      borderRadius: 'var(--r-md)',
      boxShadow: 'var(--sh-1)',
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
          display: 'block', width: '100%', cursor: 'pointer',
          padding: '16px 18px',
          background: grav.bg,
          transition: 'background .12s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `color-mix(in srgb, ${grav.accent} 10%, white)`; }}
        onMouseLeave={e => { e.currentTarget.style.background = grav.bg; }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          {/* Bloque izquierdo: nombre + grupos */}
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h3 style={{
                margin: 0, fontFamily: 'var(--f-serif)', fontWeight: 500,
                fontSize: 19, color: 'var(--ink)', letterSpacing: '-0.015em',
                lineHeight: 1.25,
              }}>
                {docente.nombre}
              </h3>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                padding: '3px 9px', borderRadius: 'var(--r-pill)',
                background: grav.accent, color: 'white',
                textTransform: 'uppercase',
              }}>
                {grav.label}
              </span>
            </div>
            {(docente.grupos_afectados || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {docente.grupos_afectados.map(g => <GrupoChip key={g} cod={g} />)}
              </div>
            )}
          </div>

          {/* Bloque derecho: número grande + máx atraso */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18,
            flexShrink: 0,
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--f-serif)', fontSize: 42, fontWeight: 600,
                lineHeight: 0.95, color: grav.accentInk, letterSpacing: '-0.02em',
              }}>{docente.total_pendientes}</div>
              <div style={{
                ...pasLabelStyle, marginTop: 4,
                color: grav.accentInk, opacity: 0.7,
              }}>pendientes</div>
            </div>
            <div style={{
              width: 1, height: 50, background: `${grav.accent}33`,
            }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--f-serif)', fontSize: 30, fontWeight: 600,
                lineHeight: 0.95, color: grav.accentInk, letterSpacing: '-0.02em',
              }}>
                {docente.max_dias_atraso}<span style={{
                  fontSize: 16, fontWeight: 500, opacity: 0.7, marginLeft: 2,
                }}>d</span>
              </div>
              <div style={{
                ...pasLabelStyle, marginTop: 4,
                color: grav.accentInk, opacity: 0.7,
              }}>máx atraso</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                 style={{
                   color: grav.accentInk, flexShrink: 0,
                   transform: abierto ? 'rotate(180deg)' : 'rotate(0)',
                   transition: 'transform 0.2s',
                 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Desglose línea inferior */}
        {desglose.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 14,
            marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${grav.accent}22`,
          }}>
            {desglose.map((d, i) => (
              <div key={i} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--ink-2)',
              }}>
                <span style={{
                  display: 'inline-grid', placeItems: 'center',
                  minWidth: 22, height: 22, padding: '0 6px',
                  background: `${d.color}1A`, color: d.color,
                  borderRadius: 6, fontFamily: 'var(--f-mono)',
                  fontSize: 11, fontWeight: 700,
                }}>{d.n}</span>
                <span style={{ fontWeight: 600 }}>{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </button>

      {/* Detalle expandible */}
      {abierto && (
        <div style={{
          padding: '14px 18px 18px',
          background: 'var(--bg)',
          borderTop: `1px solid ${grav.accent}22`,
        }}>
          {docente.sin_cerrar > 0 ? (
            <>
              <div style={{
                ...pasLabelStyle, marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: grav.accent,
                }} />
                Lecciones sin cerrar ({docente.sin_cerrar})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(docente.lecciones || []).map((lec, i) => (
                  <LeccionAtrasadaRow
                    key={`${lec.cod_grupo}|${lec.nivel}|${lec.leccion}|${lec.riel || 'curso'}|${i}`}
                    lec={lec}
                    onCerrar={() => onCerrarLeccion(docente, lec)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div style={{
              padding: '14px 16px', textAlign: 'center',
              background: 'var(--surface-2)',
              border: '1px dashed var(--line-2)',
              borderRadius: 'var(--r-sm)',
              fontSize: 13, color: 'var(--ink-2)',
            }}>
              No tiene lecciones sin cerrar.
              {(docente.sin_retro > 0 || docente.sin_pc > 0) && (
                <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
                  Las {docente.sin_retro > 0 ? 'retros' : ''}
                  {docente.sin_retro > 0 && docente.sin_pc > 0 ? ' y ' : ''}
                  {docente.sin_pc > 0 ? 'Progress Checks' : ''} pendientes se editan
                  desde el panel del docente (próximamente).
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Componente raíz
// ─────────────────────────────────────────────────────────────────────────
function PanelAdminSupervision() {
  // Admin logueado
  const adminNombre = React.useMemo(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('an_usuario') || 'null');
      return u?.nombre || 'ADMIN';
    } catch { return 'ADMIN'; }
  }, []);

  const [data, setData]         = React.useState(null);
  const [loading, setLoading]   = React.useState(true);
  const [error, setError]       = React.useState('');
  const [expandido, setExpandido] = React.useState({}); // { [nombre]: true }
  const [modalCtx, setModalCtx] = React.useState(null); // { lec, docenteReal }
  const [toast, setToast]       = React.useState('');

  const cargar = React.useCallback(() => {
    setLoading(true);
    setError('');
    return fetchDocentesAtrasados()
      .then(res => {
        if (!res?.ok) {
          setError(res?.error || 'No se pudo obtener la lista de docentes atrasados.');
          setData(null);
          return;
        }
        setData(res);
      })
      .catch(e => setError(e.message || 'Error de conexión.'))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { cargar(); }, [cargar]);

  // Toast auto-cierre
  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 3400);
    return () => clearTimeout(id);
  }, [toast]);

  const toggleExpandido = (nombre) => {
    setExpandido(prev => ({ ...prev, [nombre]: !prev[nombre] }));
  };

  // ── Click "Cerrar lección" → abrir modal de A3 ─────────────────────────
  // docente_real = dueño; registrado_por = admin logueado.
  const abrirCierre = (docente, lec) => {
    setModalCtx({
      lec: { ...lec, estado: 'PROGRAMADA' },
      docenteReal: docente.nombre,
    });
  };

  // ── Tras cierre exitoso ────────────────────────────────────────────────
  // Para no re-esperar 11 s, restamos 1 a esa tarjeta localmente.  Si
  // queda en 0 la marcamos como al día (la moveremos visualmente al
  // bloque verde en el próximo refetch — manualmente no la reordenamos
  // para no descolocar al usuario en mitad del flujo).
  const tras_cierre = (lecCerrada, docenteReal, res) => {
    const presentes = res?.asistencia?.presentes ?? 0;
    const ausentes  = res?.asistencia?.ausentes ?? 0;
    setToast(
      ausentes
        ? `Lección cerrada ✓ · ${presentes} presentes, ${ausentes} ausentes`
        : `Lección cerrada ✓ · ${presentes} presentes`
    );

    // Actualización local optimista
    setData(prev => {
      if (!prev) return prev;
      const docentes = (prev.docentes || []).map(d => {
        if (d.nombre !== docenteReal) return d;
        const k = `${lecCerrada.cod_grupo}|${lecCerrada.nivel}|${lecCerrada.leccion}|${lecCerrada.riel || 'curso'}`;
        const lecciones = (d.lecciones || []).filter(l =>
          `${l.cod_grupo}|${l.nivel}|${l.leccion}|${l.riel || 'curso'}` !== k
        );
        const sinCerrar = Math.max(0, (d.sin_cerrar || 0) - 1);
        const totalPend = Math.max(0, (d.total_pendientes || 0) - 1);
        const maxDias = lecciones.length
          ? Math.max(...lecciones.map(l => l.dias_atraso || 0))
          : 0;
        return {
          ...d,
          sin_cerrar: sinCerrar,
          total_pendientes: totalPend,
          max_dias_atraso: maxDias,
          lecciones,
        };
      });
      const totalConAtraso = docentes.filter(d => (d.total_pendientes || 0) > 0).length;
      return { ...prev, docentes, total_con_atraso: totalConAtraso };
    });

    setModalCtx(null);
  };

  // ── Render guards ──────────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div data-screen-label="Supervisión · cargando">
        <PageHeader
          kicker="Panel de administración"
          title={<>Supervisión de <em>Docentes</em></>}
          sub="Atrasos administrativos por docente."
        />
        <PASSpinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div data-screen-label="Supervisión · error">
        <PageHeader
          kicker="Panel de administración"
          title={<>Supervisión de <em>Docentes</em></>}
          sub="Atrasos administrativos por docente."
        />
        <ErrorState message={error} onRetry={cargar} />
      </div>
    );
  }

  // Particionar: con atraso vs al día (mantener orden del backend)
  const docentes = data?.docentes || [];
  const conAtraso = docentes.filter(d => (d.total_pendientes || 0) > 0);
  const alDia     = docentes.filter(d => (d.total_pendientes || 0) === 0);

  return (
    <div data-screen-label="Supervisión de docentes">
      <PageHeader
        kicker="Panel de administración"
        title={<>Supervisión de <em>Docentes</em></>}
        sub="Atrasos administrativos por docente. Cerrá lecciones en nombre del docente cuando sea necesario."
      />

      <PASResumen data={data} loading={loading} onRefresh={cargar} />

      {conAtraso.length === 0 ? (
        <div style={{
          padding: '48px 24px', textAlign: 'center',
          background: 'color-mix(in srgb, #4CAF50 6%, white)',
          border: '1px solid color-mix(in srgb, #4CAF50 22%, white)',
          borderRadius: 'var(--r-md)',
          fontFamily: 'var(--f-sans)',
          marginBottom: 24,
        }}>
          <div style={{
            width: 54, height: 54, margin: '0 auto 14px',
            borderRadius: '50%', background: '#4CAF50', color: 'white',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{
            fontFamily: 'var(--f-serif)', fontSize: 22, fontWeight: 500,
            color: '#1B5E20', letterSpacing: '-0.015em', marginBottom: 6,
          }}>
            Ningún docente con atrasos.
          </div>
          <div style={{ fontSize: 13, color: '#2E7D32', lineHeight: 1.5 }}>
            Todos los docentes activos han cerrado sus lecciones a tiempo.
          </div>
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 12, marginTop: 4,
            fontFamily: 'var(--f-sans)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#B3261E',
            }} />
            <h3 style={{
              margin: 0, fontFamily: 'var(--f-serif)', fontWeight: 500,
              fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.015em',
            }}>
              Con atrasos
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 'var(--r-pill)',
              background: 'var(--bg-deep)', color: 'var(--ink-2)',
              fontFamily: 'var(--f-mono)',
            }}>{conAtraso.length}</span>
            <span style={{
              fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto',
              fontFamily: 'var(--f-sans)',
            }}>
              Click en una tarjeta para ver el detalle
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {conAtraso.map(d => (
              <DocenteAtrasadoCard
                key={d.nombre}
                docente={d}
                abierto={!!expandido[d.nombre]}
                onToggle={() => toggleExpandido(d.nombre)}
                onCerrarLeccion={abrirCierre}
              />
            ))}
          </div>
        </>
      )}

      {alDia.length > 0 && (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            marginBottom: 12, marginTop: 8,
            fontFamily: 'var(--f-sans)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', background: '#4CAF50',
            }} />
            <h3 style={{
              margin: 0, fontFamily: 'var(--f-serif)', fontWeight: 500,
              fontSize: 18, color: 'var(--ink)', letterSpacing: '-0.015em',
            }}>
              Al día
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 'var(--r-pill)',
              background: 'var(--bg-deep)', color: 'var(--ink-2)',
              fontFamily: 'var(--f-mono)',
            }}>{alDia.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alDia.map(d => (
              <DocenteAlDiaCard key={d.nombre} docente={d} />
            ))}
          </div>
        </>
      )}

      {/* Modal de cierre (reusa A3) */}
      {modalCtx && (
        <ModalCierreLeccion
          lec={modalCtx.lec}
          docenteNombre={modalCtx.docenteReal}
          registradoPor={adminNombre}
          onClose={() => setModalCtx(null)}
          onSuccess={(res) => tras_cierre(modalCtx.lec, modalCtx.docenteReal, res)}
        />
      )}

      {/* Toast */}
      {toast && (
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
          {toast}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PanelAdminSupervision });
