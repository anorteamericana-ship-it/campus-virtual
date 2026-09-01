/* global React, window */
/* ============================================================================
   VENTAS — Mi calendario semanal de matrículas (Fase 3.7)
   Tira compacta con las matrículas del vendedor por día de la semana actual.
   El vendedor ve SOLO su fila — sin ranking, sin tendencia, sin navegación.
   El día cuenta cuando el pago B1 está aplicado (métrica de comisión real).
   ============================================================================ */
const { useState: cvUseState, useEffect: cvUseEffect } = React;

function ventasCalendarioSafeUserError(raw, fallback, context = '') {
  const msg = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (msg) console.warn('[VentasCalendario] Detalle técnico oculto al usuario.', { context, error: msg });
  return fallback;
}

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
      .catch(e => {
        if (cancel) return;
        setErr(ventasCalendarioSafeUserError(e && e.message, 'No pudimos cargar tu calendario. Intentá nuevamente.', 'calendario_semanal'));
      });
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

/* ============================================================================
   VENTAS-DASHBOARD-002 · "Mis matrículas" — vista MENSUAL por semanas
   Reemplaza la tira semanal. Muestra el MES actual completo, agrupado por
   semanas (Semana 1–5) con columnas Lun–Dom + Total. Se recalcula solo según
   el mes real de hoy. Consume getCalendarioMatriculas y agrupa en el frontend:
   tolera respuesta por fecha (por_fecha / matriculas[] / semanas[]) o, si el
   backend solo da una semana, ubica esa semana en su fila y avisa que el total
   mensual completo requiere ampliar el backend (ver "Requerimientos backend").
   ============================================================================ */
const MM_MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MM_COLS = [['L','Lun'],['M','Mar'],['X','Mié'],['J','Jue'],['V','Vie'],['S','Sáb'],['D','Dom']];
const mmISO = dt => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
const mmColIdx = dt => (dt.getDay() + 6) % 7;  // 0=Lun … 6=Dom

// Construye las semanas (filas) del mes: cada fila = 7 celdas Lun–Dom.
function mmConstruirSemanas(year, month0) {
  const last = new Date(year, month0 + 1, 0).getDate();
  const first = new Date(year, month0, 1);
  const start = new Date(year, month0, 1 - mmColIdx(first)); // lunes en/antes del día 1
  const semanas = [];
  let cur = new Date(start);
  let guard = 0;
  while (guard++ < 7) {
    const celdas = [];
    for (let i = 0; i < 7; i++) {
      const inMonth = cur.getMonth() === month0;
      celdas.push({ iso: mmISO(cur), dia: cur.getDate(), inMonth });
      cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
    }
    semanas.push(celdas);
    // Parar cuando ya cubrimos el último día del mes.
    const ultimoCubierto = celdas[6];
    const [, mm, dd] = ultimoCubierto.iso.split('-').map(Number);
    if (mm > month0 + 1 || (mm === month0 + 1 && dd >= last)) break;
    if (mm > month0 + 1) break;
  }
  return semanas;
}

// Normaliza CUALQUIER shape de respuesta a un mapa { 'YYYY-MM-DD': count }.
// Devuelve { porFecha, soloUnaSemana } — soloUnaSemana=true cuando el backend
// solo entregó la semana actual (no el mes completo).
function mmExtraerPorFecha(r) {
  const porFecha = {};
  if (!r || typeof r !== 'object') return { porFecha, soloUnaSemana: false };

  // a) Mapa directo fecha → count.
  if (r.por_fecha && typeof r.por_fecha === 'object') {
    for (const k in r.por_fecha) porFecha[k] = Number(r.por_fecha[k]) || 0;
    return { porFecha, soloUnaSemana: false };
  }
  // b) Lista de matrículas con fecha.
  if (Array.isArray(r.matriculas)) {
    r.matriculas.forEach(m => {
      const f = String(m.fecha || m.f || '').slice(0, 10);
      if (f) porFecha[f] = (porFecha[f] || 0) + (Number(m.count != null ? m.count : 1) || 0);
    });
    return { porFecha, soloUnaSemana: false };
  }
  // c) Lista de semanas con por_dia.
  if (Array.isArray(r.semanas)) {
    r.semanas.forEach(s => mmVolcarSemana(porFecha, s.semana_inicio || s.inicio, s.por_dia, r.dias_orden));
    return { porFecha, soloUnaSemana: false };
  }
  // d) Una sola semana (shape actual): datos_por_asesor[0].por_dia + semana_inicio.
  const fila = r.datos_por_asesor && r.datos_por_asesor[0];
  if (fila && fila.por_dia && r.semana_inicio) {
    mmVolcarSemana(porFecha, r.semana_inicio, fila.por_dia, r.dias_orden);
    return { porFecha, soloUnaSemana: true };
  }
  return { porFecha, soloUnaSemana: false };
}
// Vuelca un por_dia ({L,M,X,J,V,S,D}) a fechas, contando desde semana_inicio.
function mmVolcarSemana(porFecha, semanaInicio, porDia, diasOrden) {
  if (!semanaInicio || !porDia) return;
  const [y, m, d] = String(semanaInicio).split(/[-T]/).map(Number);
  if (!y || !m || !d) return;
  const orden = (diasOrden && diasOrden.length === 7) ? diasOrden : ['L','M','X','J','V','S','D'];
  orden.forEach((k, i) => {
    const dt = new Date(y, m - 1, d + i);
    porFecha[mmISO(dt)] = (porFecha[mmISO(dt)] || 0) + (Number(porDia[k]) || 0);
  });
}

function MiMatriculasMes({ asesor }) {
  const [data, setData] = cvUseState(null);
  const [err, setErr] = cvUseState('');
  const [tick, setTick] = cvUseState(0);

  const hoy = new Date();
  const year = hoy.getFullYear();
  const month0 = hoy.getMonth();
  const mesISO = `${year}-${String(month0 + 1).padStart(2, '0')}`;

  cvUseEffect(() => {
    let cancel = false;
    setData(null); setErr('');
    // Pasamos `mes` por si el backend ya soporta el mes completo; si lo ignora,
    // devolverá la semana actual y caemos al modo "una semana".
    window.getCalendarioMatriculas({ asesor_filtro: asesor, mes: mesISO, con_tendencia: false })
      .then(r => { if (cancel) return; if (!r || !r.ok) throw new Error((r && r.error) || 'No se pudo cargar.'); setData(r); })
      .catch(e => {
        if (cancel) return;
        setErr(ventasCalendarioSafeUserError(e && e.message, 'No pudimos cargar tus matrículas. Intentá nuevamente.', 'matriculas_mes'));
      });
    return () => { cancel = true; };
  }, [asesor, mesISO, tick]);

  const semanas = mmConstruirSemanas(year, month0);
  const { porFecha, soloUnaSemana } = data ? mmExtraerPorFecha(data) : { porFecha: {}, soloUnaSemana: false };
  const totalMes = Object.keys(porFecha).reduce((s, k) => k.slice(0, 7) === mesISO ? s + porFecha[k] : s, 0);

  const card = (children) => (
    <div style={{ background: '#fff', border: '1px solid var(--v-line, #E4E8EF)', borderRadius: 'var(--v-r-lg, 14px)', padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--v-ink-3, #95A0B3)' }}>
          Mis matrículas
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--v-ink-2, #5A6B82)' }}>
          <b style={{ color: 'var(--v-ink, #1B2638)' }}>{MM_MESES[month0]} {year}</b>
          {data ? <> · {totalMes} matrícula{totalMes === 1 ? '' : 's'}</> : null}
        </div>
      </div>
      {children}
    </div>
  );

  if (err) {
    return card(
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#FCEDEB', border: '1px solid #F0C8C4', borderRadius: 'var(--v-r-md, 10px)' }}>
        <span style={{ fontSize: 13, color: 'var(--v-red, #C0392B)', fontWeight: 600, flex: 1 }}>⚠ {err}</span>
        <button className="vx-btn vx-btn-navy" style={{ padding: '7px 14px' }} onClick={() => setTick(t => t + 1)}>Reintentar</button>
      </div>
    );
  }
  if (!data) return card(<div className="vx-sk" style={{ height: 180, borderRadius: 10 }} />);

  return card(
    <React.Fragment>
      <div className="vx-mm-grid">
        <div className="vx-mm-row vx-mm-head">
          <div className="vx-mm-wk" />
          {MM_COLS.map(([k, lbl]) => <div key={k} className="vx-mm-cell vx-mm-colh">{lbl}</div>)}
          <div className="vx-mm-cell vx-mm-colh vx-mm-tot">Total</div>
        </div>
        {semanas.map((celdas, wi) => {
          const tot = celdas.reduce((s, c) => c.inMonth ? s + (porFecha[c.iso] || 0) : s, 0);
          return (
            <div key={wi} className="vx-mm-row">
              <div className="vx-mm-wk">Semana {wi + 1}</div>
              {celdas.map((c) => {
                const n = c.inMonth ? (porFecha[c.iso] || 0) : null;
                return (
                  <div key={c.iso} className={`vx-mm-cell${c.inMonth ? '' : ' vx-mm-out'}${n ? ' vx-mm-has' : ''}`} title={c.inMonth ? `${c.dia}/${month0 + 1}` : ''}>
                    {c.inMonth ? <><span className="vx-mm-dnum">{c.dia}</span>{n ? <span className="vx-mm-cnt">{n}</span> : null}</> : ''}
                  </div>
                );
              })}
              <div className={`vx-mm-cell vx-mm-tot${tot ? ' vx-mm-tot-has' : ''}`}>{tot || ''}</div>
            </div>
          );
        })}
      </div>
      {soloUnaSemana ? (
        <div className="vx-mm-note">
          Mostrando solo la <b>semana actual</b>. La vista mensual completa todavía no está disponible.
        </div>
      ) : null}
    </React.Fragment>
  );
}

Object.assign(window, { MiMatriculasMes });
