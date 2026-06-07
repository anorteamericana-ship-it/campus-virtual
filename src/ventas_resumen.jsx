/* global React, window */
/* ============================================================================
   VENTAS — Rediseño del encabezado del panel (Fase 3)
   Tres bloques que reemplazan las 5 KPI cards + el embudo viejo:
     · MiSemana  — un solo número grande con barra vs. promedio personal
     · MiEmbudo  — 7 etapas clickeables que filtran la tabla
     · MisGrupos — grupos con cupo abierto (sin datos de otros vendedores)
   + FiltroChip (chip "Mostrando: …" arriba de la tabla) y skeletons.
   Se dirige al vendedor en 2da persona. Cero comparativas con otros.
   ============================================================================ */

// ── SECCIÓN 1 · MI SEMANA ──────────────────────────────────────────────────
function MiSemana({ semana }) {
  const m = Number((semana && semana.matriculas) || 0);
  const prom = Number((semana && semana.promedio_4s) || 0);
  const cero = m === 0 && prom === 0;

  // Tono del borde según desempeño contra el promedio personal.
  let tono = 'flat';
  if (m === 0 && prom > 0)      tono = 'rojo';
  else if (m > prom)            tono = 'verde';
  else if (m < prom && m > 0)   tono = 'ambar';

  // Barra: el 100% equivale al doble del promedio (target implícito).
  const full = Math.max(m, prom * 2, 1);
  const pct = cero ? 0 : Math.min(100, Math.round((m / full) * 100));
  const promTxt = (prom % 1 === 0 ? prom : prom.toFixed(1)) + '/sem';

  const hint = {
    verde: 'Vas por encima de tu promedio. Seguí así.',
    ambar: 'Vas un poco por debajo de tu promedio esta semana.',
    rojo:  'Sin matrículas esta semana — todavía estás a tiempo.',
    flat:  '',
  }[tono];

  return (
    <div className={`vx-week vx-week-${tono}`}>
      <div className="vx-week-label">Matrículas de la semana</div>
      <div className="vx-week-num">{m}</div>
      {cero ? (
        <div className="vx-week-empty">Empezá tu semana, estás en cero.</div>
      ) : (
        <React.Fragment>
          <div className="vx-week-sub">Tu promedio últimas 4 semanas: <b>{promTxt}</b></div>
          <div className="vx-week-track"><div className="vx-week-bar" style={{ width: pct + '%' }} /></div>
          {hint ? <div className="vx-week-hint">{hint}</div> : null}
        </React.Fragment>
      )}
    </div>
  );
}

// ── SECCIÓN 2 · MI EMBUDO (etapas clickeables) ─────────────────────────────
function MiEmbudo({ embudo, etapaActiva, onPick }) {
  const map = {};
  (embudo || []).forEach(e => { map[e.etapa] = e.count; });
  const filas = window.EMBUDO_ETAPAS.map(e => ({ ...e, count: map[e.key] || 0 }));
  const max = Math.max(1, ...filas.filter(e => !e.placeholder).map(e => e.count));

  return (
    <div className="vx-emb">
      {filas.map(e => {
        const activa = etapaActiva === e.key;
        const w = e.count ? Math.max(8, Math.round((e.count / max) * 100)) : 0;
        const clickable = !e.placeholder;
        return (
          <button
            key={e.key}
            type="button"
            className={`vx-emb-row${activa ? ' active' : ''}${e.placeholder ? ' ph' : ''}`}
            disabled={!clickable}
            aria-pressed={activa}
            onClick={() => clickable && onPick(e.key)}
          >
            <span
              className={`vx-emb-bullet${e.placeholder ? ' hollow' : ''}`}
              style={{ background: e.placeholder ? 'transparent' : e.color, borderColor: e.color }}
            />
            <span className="vx-emb-name">
              <span className="vx-emb-label">{e.label}</span>
              {e.placeholder ? <span className="vx-emb-tag">próximamente — CONAPE pendiente</span> : null}
              {e.decay ? <span className="vx-emb-tag decay">decae cada lunes</span> : null}
            </span>
            <span className="vx-emb-track">
              <span className="vx-emb-bar" style={{ width: w + '%', background: e.color }} />
            </span>
            <span className="vx-emb-count">{e.count}</span>
            <span className="vx-emb-chev" aria-hidden="true">
              {e.placeholder ? '🚧' : (activa ? '×' : '›')}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── SECCIÓN 3 · MIS GRUPOS DISPONIBLES ─────────────────────────────────────
// Solo código, fecha y modalidad. NUNCA matriculados/cupo de otros vendedores.
function MisGrupos({ grupos }) {
  if (!grupos || !grupos.length) {
    return <div className="vx-grp-empty">No tenés grupos con cupo abierto por ahora.</div>;
  }
  const modTxt = m => String(m || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  return (
    <div className="vx-grp">
      {grupos.map((g, i) => (
        <div key={g.codigo || i} className="vx-grp-row">
          <span className="vx-grp-code">{g.codigo}</span>
          <span className="vx-grp-sep">·</span>
          <span className="vx-grp-date">Inicia {window.fmtFechaDDMon(g.fecha_inicio)}</span>
          <span className="vx-grp-sep">·</span>
          <span className="vx-grp-mod">{modTxt(g.modalidad)}</span>
        </div>
      ))}
    </div>
  );
}

// ── CHIP DE FILTRO ACTIVO (arriba de la tabla) ─────────────────────────────
function FiltroChip({ etapa, onClear }) {
  if (!etapa) return null;
  const e = window.ETAPA_MAP[etapa] || { label: etapa };
  return (
    <div className="vx-chip-row">
      <span className="vx-chip">
        <span className="vx-chip-dot" style={{ background: e.color || 'var(--v-navy)' }} />
        Mostrando: <b>{e.label}</b>
        <button className="vx-chip-x" onClick={onClear} aria-label="Quitar filtro" title="Quitar filtro">×</button>
      </span>
    </div>
  );
}

// ── SKELETONS del encabezado ───────────────────────────────────────────────
function ResumenSkeleton() {
  return (
    <React.Fragment>
      <div className="vx-sec"><div className="vx-sk" style={{ height: 168, borderRadius: 16 }} /></div>
      <div className="vx-sec">
        <div className="vx-sec-h">Mi embudo</div>
        <div className="vx-sk" style={{ height: 360, borderRadius: 16 }} />
      </div>
      <div className="vx-sec">
        <div className="vx-sec-h">Mis grupos disponibles</div>
        <div className="vx-sk" style={{ height: 120, borderRadius: 16 }} />
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { MiSemana, MiEmbudo, MisGrupos, FiltroChip, ResumenSkeleton });
