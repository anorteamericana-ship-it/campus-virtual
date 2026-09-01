/* global React, window */
/* ============================================================================
   ADMIN — Calendario de matrículas (Fase 3.7 · Cambio 2)
   Sección colapsable (default expandida) arriba del listado de Matrículas.
   - Tabla semanal: una fila por asesor (L M X J V S D + Total) con heatmap.
   - Navegación de semanas (← / Volver a semana actual / →).
   - Indicador ▲▼ del total semanal vs. promedio de las 7 semanas previas.
   - Tendencia 8 semanas con barritas verticales por asesor.
   El día cuenta cuando el pago B1 está aplicado (métrica de comisión real).
   Solo visualización — nada editable. NUNCA toca el backend en modo demo.
   ============================================================================ */
const { useState: caUseState, useEffect: caUseEffect, useRef: caUseRef } = React;

const CA_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const CA_MES_AB = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const CA_DIA_LABEL = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };

// "YYYY-MM-DD" → "1 al 7 de junio 2026" (mismo mes) o con dos meses.
function caRango(ini, fin) {
  const [y1, m1, d1] = String(ini).split('-').map(Number);
  const [, m2, d2] = String(fin).split('-').map(Number);
  if (m1 === m2) return `${d1} al ${d2} de ${CA_MESES[m1 - 1]} ${y1}`;
  return `${d1} de ${CA_MESES[m1 - 1]} al ${d2} de ${CA_MESES[m2 - 1]} ${y1}`;
}
function caAddDays(iso, n) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  const p = x => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
function caShortLabel(iso) {
  const [, m, d] = String(iso).split('-').map(Number);
  return `${d} ${CA_MES_AB[m - 1]}`;
}
// Nombre amable: "ASESORA DEMO 1" → "Asesora Demo 1"
function caNombre(s) {
  return String(s || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}
// Heatmap navy sutil según volumen relativo de la celda.
function caCelda(count, max) {
  if (!count) return { bg: 'var(--surface-2)', fg: 'var(--ink-3)', weight: 600 };
  const t = 0.12 + 0.62 * (count / Math.max(1, max));
  return { bg: `rgba(16, 33, 64, ${t.toFixed(3)})`, fg: t > 0.42 ? '#fff' : 'var(--an-navy-ink, #14233F)', weight: 800 };
}

const CA_DIAS_FALLBACK = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function CalendarioMatriculasAdmin() {
  const [semanaInicio, setSemanaInicio] = caUseState(null); // null = semana actual (sin pasar param)
  const [data, setData] = caUseState(null);
  const [err, setErr] = caUseState('');
  const [tick, setTick] = caUseState(0);
  const [abierto, setAbierto] = caUseState(true);

  caUseEffect(() => {
    let cancel = false;
    setData(null); setErr('');
    const body = { con_tendencia: true };
    if (semanaInicio) body.semana_inicio = semanaInicio;
    window.getCalendarioMatriculas(body)
      .then(r => { if (cancel) return; if (!r || !r.ok) throw new Error((r && r.error) || 'Respuesta inválida.'); setData(r); })
      .catch(e => {
        if (cancel) return;
        if (e?.message) console.warn('[MatriculasCalendario] Detalle técnico oculto al operador.', { context:'get_calendario_matriculas', error:String(e.message) });
        setErr('No pudimos cargar el calendario de matrículas. Intentá nuevamente.');
      });
    return () => { cancel = true; };
  }, [semanaInicio, tick]);

  const dias = (data && data.dias_orden) || CA_DIAS_FALLBACK;
  const filas = (data && data.datos_por_asesor) || [];
  const totalDia = (data && data.total_dia) || {};
  const maxCelda = Math.max(1, ...filas.flatMap(f => dias.map(d => (f.por_dia || {})[d] || 0)));
  const esActual = data ? data.es_semana_actual : true;

  // Promedio de las 7 semanas previas (de tendencia, excluyendo la actual) para ▲▼.
  const tend = (data && data.tendencia_8s) || [];
  const promPrevias = tend.length >= 2
    ? tend.slice(0, -1).reduce((s, w) => s + (w.total_semana || 0), 0) / (tend.length - 1)
    : null;
  const totalSemana = data ? (data.total_semana || 0) : 0;
  const delta = (esActual && promPrevias != null) ? totalSemana - promPrevias : null;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
      {/* Header colapsable */}
      <button type="button" onClick={() => setAbierto(a => !a)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'none', border: 'none', borderBottom: abierto ? '1px solid var(--line)' : 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
        <span style={{ display: 'inline-flex', transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform .16s', color: 'var(--ink-3)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </span>
        <div className="card-title" style={{ margin: 0 }}>Calendario de matrículas</div>
        {data && (
          <span style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500 }}>
            {esActual ? 'Semana actual · ' : ''}{caRango(data.semana_inicio, data.semana_fin)}
          </span>
        )}
        <span style={{ flex: 1 }} />
        {data && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)' }}>
            <b style={{ fontSize: 15, color: 'var(--an-navy-ink, #14233F)', fontFamily: 'var(--f-mono)' }}>{totalSemana}</b> esta semana
          </span>
        )}
      </button>

      {abierto && (
        <div style={{ padding: '16px 20px 20px' }}>
          {/* Navegación de semanas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <button type="button" className="btn btn-ghost" style={caNavBtn}
              disabled={!data}
              onClick={() => data && setSemanaInicio(caAddDays(data.semana_inicio, -7))}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              Semana anterior
            </button>
            <button type="button"
              style={{ ...caNavBtn, ...(esActual ? caNavBtnActual : caNavBtnVolver) }}
              onClick={() => { if (esActual) setTick(t => t + 1); else setSemanaInicio(null); }}>
              {esActual ? 'Semana actual' : '↺ Volver a semana actual'}
            </button>
            <button type="button" className="btn btn-ghost" style={caNavBtn}
              disabled={!data || esActual}
              title={esActual ? 'Ya estás en la semana actual' : ''}
              onClick={() => data && setSemanaInicio(caAddDays(data.semana_inicio, 7))}>
              Siguiente
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            {delta != null && (
              <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                color: delta >= 0 ? '#1E4D2B' : '#8B1A10' }}>
                {delta >= 0 ? '▲' : '▼'} {delta >= 0 ? 'Sobre' : 'Bajo'} el promedio de 7 semanas
                <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>({promPrevias.toFixed(1)})</span>
              </span>
            )}
          </div>

          {err ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: '#FBE4E1', border: '1px solid #F0BDB6', borderRadius: 'var(--r-md)' }}>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#8B1A10' }}>⚠ {err}</span>
              <button type="button" className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => setTick(t => t + 1)}>Reintentar</button>
            </div>
          ) : !data ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Cargando calendario…</div>
          ) : (
            <>
              {/* Tabla semanal con heatmap */}
              <div style={{ overflowX: 'auto' }}>
                <table className="ca-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th style={{ ...caTh, textAlign: 'left', minWidth: 150 }}>Vendedor</th>
                      {dias.map(d => <th key={d} style={caTh}>{CA_DIA_LABEL[d] || d}</th>)}
                      <th style={{ ...caTh, color: 'var(--an-navy-ink, #14233F)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.length === 0 && (
                      <tr><td colSpan={dias.length + 2} style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin asesores con actividad esta semana.</td></tr>
                    )}
                    {filas.map(f => (
                      <tr key={f.asesor}>
                        <td style={caTdName}>{caNombre(f.asesor)}</td>
                        {dias.map(d => {
                          const c = (f.por_dia || {})[d] || 0;
                          const st = caCelda(c, maxCelda);
                          return (
                            <td key={d} style={caTdCell}>
                              <div style={{ margin: '0 auto', width: 38, height: 34, borderRadius: 8, background: st.bg, color: st.fg, fontWeight: st.weight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: 'var(--f-mono)' }}>{c}</div>
                            </td>
                          );
                        })}
                        <td style={caTdCell}>
                          <div style={{ margin: '0 auto', width: 40, height: 34, borderRadius: 8, background: 'var(--an-navy, #14233F)', color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontFamily: 'var(--f-mono)' }}>{f.total}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {filas.length > 0 && (
                    <tfoot>
                      <tr>
                        <td style={{ ...caTdName, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--ink-2)', borderTop: '2px solid var(--line)' }}>TOTAL DÍA</td>
                        {dias.map(d => (
                          <td key={d} style={{ ...caTdCell, borderTop: '2px solid var(--line)', fontFamily: 'var(--f-mono)', fontWeight: 700, color: (totalDia[d] || 0) ? 'var(--ink)' : 'var(--ink-3)' }}>{totalDia[d] || 0}</td>
                        ))}
                        <td style={{ ...caTdCell, borderTop: '2px solid var(--line)', fontFamily: 'var(--f-mono)', fontWeight: 800, color: 'var(--an-navy-ink, #14233F)' }}>{totalSemana}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Tendencia 8 semanas */}
              {tend.length > 0 && <CalendarioTendencia tend={tend} />}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tendencia: tabla compacta + barritas verticales por asesor ─────────────
function CalendarioTendencia({ tend }) {
  // Asesores presentes en cualquier semana de la tendencia.
  const asesores = [...new Set(tend.flatMap(w => Object.keys(w.total_por_asesor || {})))].sort();
  const maxVal = Math.max(1, ...tend.flatMap(w => asesores.map(a => (w.total_por_asesor || {})[a] || 0)));
  const cols = tend.map((w, i) => (i === tend.length - 1 ? 'Actual' : `W-${tend.length - 1 - i}`));

  return (
    <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px dashed var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="card-title" style={{ fontSize: 14, margin: 0 }}>Tendencia · últimas 8 semanas</div>
        <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>W-7 es la más antigua · matrículas con pago aplicado</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: 680 }}>
          <thead>
            <tr>
              <th style={{ ...caTh, textAlign: 'left', minWidth: 150 }}>Vendedor</th>
              {cols.map((c, i) => (
                <th key={i} style={{ ...caTh, color: c === 'Actual' ? 'var(--an-navy-ink, #14233F)' : 'var(--ink-3)' }}>
                  {c}
                  <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--ink-3)', marginTop: 2 }}>{caShortLabel(tend[i].semana_inicio)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {asesores.map(a => (
              <tr key={a}>
                <td style={caTdName}>
                  {caNombre(a)}
                  {/* Barritas verticales (sparkline simple) */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 26, marginTop: 6 }}>
                    {tend.map((w, i) => {
                      const v = (w.total_por_asesor || {})[a] || 0;
                      const h = Math.max(2, Math.round((v / maxVal) * 26));
                      const actual = i === tend.length - 1;
                      return <div key={i} title={`${cols[i]}: ${v}`} style={{ width: 7, height: h, borderRadius: 2, background: actual ? 'var(--an-granate, #8B1A10)' : 'rgba(16,33,64,0.42)' }} />;
                    })}
                  </div>
                </td>
                {tend.map((w, i) => {
                  const v = (w.total_por_asesor || {})[a] || 0;
                  const actual = i === tend.length - 1;
                  return (
                    <td key={i} style={{ ...caTdCell, fontFamily: 'var(--f-mono)', fontWeight: actual ? 800 : 600, color: actual ? 'var(--an-navy-ink, #14233F)' : (v ? 'var(--ink-2)' : 'var(--ink-3)'), background: actual ? 'var(--surface-2)' : 'transparent' }}>{v}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const caNavBtn = { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, padding: '8px 13px', fontFamily: 'inherit', borderRadius: 'var(--r-md)' };
const caNavBtnActual = { background: 'var(--surface-2)', border: '1.5px solid var(--line)', color: 'var(--ink-3)', cursor: 'default' };
const caNavBtnVolver = { background: 'var(--an-navy, #14233F)', border: '1.5px solid var(--an-navy, #14233F)', color: '#fff', cursor: 'pointer' };
const caTh = { padding: '6px 8px', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', textAlign: 'center', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' };
const caTdName = { padding: '10px 8px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', verticalAlign: 'top', whiteSpace: 'nowrap' };
const caTdCell = { padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle' };

Object.assign(window, { CalendarioMatriculasAdmin });
