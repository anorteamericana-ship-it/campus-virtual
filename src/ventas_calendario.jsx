/* global React, window */
/* ============================================================================
   VENTAS — Mi calendario semanal de matrículas (Fase 3.7)
   Tira compacta con las matrículas del vendedor por día de la semana actual.
   El vendedor ve SOLO su fila — sin ranking, sin tendencia, sin navegación.
   El día cuenta cuando el pago B1 está aplicado (métrica de comisión real).
   ============================================================================ */
const { useState: cvUseState, useEffect: cvUseEffect } = React;

const CV_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const CV_DIA_LABEL = { L: 'Lun', M: 'Mar', X: 'Mié', J: 'Jue', V: 'Vie', S: 'Sáb', D: 'Dom' };
function cvRango(ini, fin) {
  const [, m1, d1] = String(ini).split('-').map(Number);
  const [, m2, d2] = String(fin).split('-').map(Number);
  if (m1 === m2) return `${d1} al ${d2} de ${CV_MESES[m1 - 1]}`;
  return `${d1} de ${CV_MESES[m1 - 1]} al ${d2} de ${CV_MESES[m2 - 1]}`;
}
// Fondo heatmap navy según volumen (0 = gris muy suave).
function cvCelda(count, max) {
  if (!count) return { bg: 'var(--v-soft, #F4F6FA)', fg: 'var(--v-ink-3, #95A0B3)' };
  const t = 0.16 + 0.72 * (count / Math.max(1, max));
  return { bg: `rgba(16, 33, 64, ${t.toFixed(3)})`, fg: '#fff' };
}

function MiCalendarioSemanal({ asesor }) {
  const [data, setData] = cvUseState(null);
  const [err, setErr] = cvUseState('');
  const [tick, setTick] = cvUseState(0);

  cvUseEffect(() => {
    let cancel = false;
    setData(null); setErr('');
    window.getCalendarioMatriculas({ asesor_filtro: asesor, con_tendencia: false })
      .then(r => { if (cancel) return; if (!r || !r.ok) throw new Error((r && r.error) || 'No se pudo cargar.'); setData(r); })
      .catch(e => { if (!cancel) setErr(e.message || 'No se pudo cargar el calendario.'); });
    return () => { cancel = true; };
  }, [asesor, tick]);

  const dias = (data && data.dias_orden) || ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const fila = data && data.datos_por_asesor && data.datos_por_asesor[0];
  const porDia = (fila && fila.por_dia) || {};
  const total = fila ? fila.total : 0;
  const max = Math.max(1, ...dias.map(d => porDia[d] || 0));

  return (
    <div style={{ background: '#fff', border: '1px solid var(--v-line, #E4E8EF)', borderRadius: 'var(--v-r-lg, 14px)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--v-ink-3, #95A0B3)' }}>
          Mis matrículas por día
        </div>
        {data && (
          <div style={{ fontSize: 12.5, color: 'var(--v-ink-2, #5A6B82)' }}>
            Semana del <b style={{ color: 'var(--v-ink, #1B2638)' }}>{cvRango(data.semana_inicio, data.semana_fin)}</b>
          </div>
        )}
      </div>

      {err ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#FCEDEB', border: '1px solid #F0C8C4', borderRadius: 'var(--v-r-md, 10px)' }}>
          <span style={{ fontSize: 13, color: 'var(--v-red, #C0392B)', fontWeight: 600, flex: 1 }}>⚠ {err}</span>
          <button className="vx-btn vx-btn-navy" style={{ padding: '7px 14px' }} onClick={() => setTick(t => t + 1)}>Reintentar</button>
        </div>
      ) : !data ? (
        <div className="vx-sk" style={{ height: 78, borderRadius: 10 }} />
      ) : total === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 12px', color: 'var(--v-ink-2, #5A6B82)' }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Empezá la semana 💪</div>
          <div style={{ fontSize: 12.5, color: 'var(--v-ink-3, #95A0B3)', marginTop: 4 }}>Tus matrículas con pago aplicado van a aparecer acá, día por día.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(7, 1fr) 1.1fr`, gap: 8 }}>
          {dias.map(d => {
            const c = porDia[d] || 0;
            const st = cvCelda(c, max);
            return (
              <div key={d} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--v-ink-3, #95A0B3)', marginBottom: 5 }}>{CV_DIA_LABEL[d] || d}</div>
                <div style={{ height: 54, borderRadius: 10, background: st.bg, color: st.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: c ? 22 : 15, fontWeight: c ? 800 : 600 }}>
                  {c}
                </div>
              </div>
            );
          })}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--v-navy, #102140)', marginBottom: 5 }}>Total</div>
            <div style={{ height: 54, borderRadius: 10, background: 'var(--v-navy, #102140)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800 }}>
              {total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MiCalendarioSemanal });
