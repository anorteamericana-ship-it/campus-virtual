/* global React, window, ETAPA_MAP, FIN_MAP, PROG_MAP, fmtTelV, waLink, diasDesde */
/* ============================================================================
   VENTAS — Componentes presentacionales
   KPIs, embudo, filtros, tabla/tarjetas, badges, skeletons, toast, lightbox,
   y bloques reutilizables del drawer (docs, timeline). Sin lógica de red.
   ============================================================================ */

// ── ICONOS ─────────────────────────────────────────────────────────────────
const VI = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  wa: 'M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.48 1.7.62.7.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
  close: 'M18 6L6 18M6 6l12 12',
  copy: 'M9 9h10v10H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 9v4M12 17h.01M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  dots: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  upload: 'M12 16V4M7 9l5-5 5 5M5 20h14',
  mail: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM3 6l9 7 9-7',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  doc: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6',
  arrow: 'M5 12h14M13 5l7 7-7 7',
  pin: 'M12 22s7-7.16 7-12a7 7 0 1 0-14 0c0 4.84 7 12 7 12zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
};
function Vico({ d, size = 16, sw = 2, fill = 'none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={fill === 'none' ? 'currentColor' : 'none'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {String(d).split('|').map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
const hexA = (hex, a) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
};

// ── BADGES ───────────────────────────────────────────────────────────────
function EtapaBadge({ etapa }) {
  const e = ETAPA_MAP[etapa] || { label: etapa, color: '#94a3b8' };
  return (
    <span className="vx-badge" style={{ background: hexA(e.color, 0.15), color: e.color }}>
      <span className="vx-bdot" /> {e.label}
    </span>
  );
}
function FinBadge({ financiamiento }) {
  const f = FIN_MAP[financiamiento] || { label: financiamiento, tone: 'amber' };
  return <span className={`vx-fin ${f.tone}`}>{f.label}</span>;
}
const progLabel = p => (PROG_MAP[p] || { label: p }).label;

// ── KPI CARDS ──────────────────────────────────────────────────────────────
function KPIRow({ resumen }) {
  const cards = [
    { label: 'Total prospectos',        num: resumen.total,                key: 'total' },
    { label: 'Activados este mes',      num: resumen.activados_mes,        key: 'act' },
    { label: 'Esperando CONAPE',        num: resumen.esperando_conape,     key: 'cnp' },
    { label: 'Pago propio pendiente',   num: resumen.pago_propio_pendiente, key: 'pp', attn: resumen.pago_propio_pendiente > 0 },
    { label: 'Comisiones pendientes',   num: resumen.comisiones_pendientes, key: 'com', attn: resumen.comisiones_pendientes > 0 },
  ];
  return (
    <div className="vx-kpis">
      {cards.map(c => (
        <div key={c.key} className={`vx-kpi${c.attn ? ' attn' : ''}`}>
          <div className="vx-kpi-label">{c.label}</div>
          <div className="vx-kpi-num">{c.num ?? 0}</div>
        </div>
      ))}
    </div>
  );
}
function KPISkeleton() {
  return <div className="vx-kpis">{[0,1,2,3,4].map(i => <div key={i} className="vx-sk vx-sk-kpi" />)}</div>;
}

// ── EMBUDO ──────────────────────────────────────────────────────────────────
function Funnel({ counts, total }) {
  // counts: { etapaKey: n }; total = total de prospectos (denominador del %)
  const max = Math.max(1, ...Object.values(counts));
  const base = total || 1;
  return (
    <div className="vx-funnel">
      {window.ETAPAS.map(e => {
        const n = counts[e.key] || 0;
        const pct = Math.round((n / base) * 100);
        const w = Math.round((n / max) * 100);
        return (
          <div key={e.key} className="vx-funnel-row">
            <div className="vx-funnel-lbl"><span className="vx-funnel-dot" style={{ background: e.color }} /> {e.label}</div>
            <div className="vx-funnel-track">
              <div className="vx-funnel-bar" style={{ width: `${Math.max(w, n ? 6 : 0)}%`, background: e.color }}>
                {n > 0 && w > 14 ? n : ''}
              </div>
            </div>
            <div className="vx-funnel-meta"><b>{n}</b> · {pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── FILTROS ──────────────────────────────────────────────────────────────
function FilterBar({ filtro, setFiltro, resultCount }) {
  const upd = (k, v) => setFiltro(f => ({ ...f, [k]: v }));
  const limpiar = () => setFiltro({ etapa: '', fin: '', q: '' });
  const activos = filtro.etapa || filtro.fin || filtro.q;
  return (
    <div className="vx-filters">
      <div className="vx-field">
        <span className="vx-field-lbl">Etapa</span>
        <select className="vx-select" value={filtro.etapa} onChange={e => upd('etapa', e.target.value)}>
          <option value="">Todas</option>
          {window.ETAPAS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
        </select>
      </div>
      <div className="vx-field">
        <span className="vx-field-lbl">Financiamiento</span>
        <select className="vx-select" value={filtro.fin} onChange={e => upd('fin', e.target.value)}>
          <option value="">Todos</option>
          <option value="CONAPE">CONAPE</option>
          <option value="BECA">Beca 25%</option>
          <option value="PROPIO">Pago propio</option>
        </select>
      </div>
      <div className="vx-field vx-search">
        <span className="vx-field-lbl">Buscar</span>
        <div className="vx-search-box">
          <Vico d={VI.search} size={15} />
          <input type="text" placeholder="Nombre o cédula…" value={filtro.q} onChange={e => upd('q', e.target.value)} />
        </div>
      </div>
      {activos ? <button className="vx-clear" onClick={limpiar}>Limpiar filtros</button> : null}
      <div className="vx-result-count">{resultCount} prospecto{resultCount === 1 ? '' : 's'}</div>
    </div>
  );
}

// ── FILA DE WHATSAPP ────────────────────────────────────────────────────────
function WaLink({ tel, children, className }) {
  const stop = e => e.stopPropagation();
  return (
    <a className={className} href={waLink(tel, 'Hola, le escribo de Academia Norteamericana.')}
       target="_blank" rel="noopener" onClick={stop} title="Abrir WhatsApp">
      {children}
    </a>
  );
}

// ── TABLA (desktop) ─────────────────────────────────────────────────────────
function ProspectoTable({ lista, onOpen }) {
  return (
    <div className="vx-tablecard">
      <div className="vx-table-scroll">
      <table className="vx-table">
        <thead>
          <tr>
            <th>Cédula</th><th>Nombre</th><th>Teléfono</th><th>Programa</th>
            <th>Financiam.</th><th>Etapa</th><th>Grupo</th><th>Días</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(p => {
            const dias = diasDesde(p.fecha_registro);
            return (
              <tr key={p.cedula} onClick={() => onOpen(p)}>
                <td className="vx-td-ced">{p.cedula}</td>
                <td className="vx-td-name">{p.nombre}</td>
                <td>
                  <span className="vx-tel">
                    <WaLink tel={p.whatsapp || p.telefono} className="vx-wa-mini"><Vico d={VI.wa} size={15} fill="currentColor" /></WaLink>
                    {fmtTelV(p.telefono)}
                  </span>
                </td>
                <td className="vx-td-prog">{progLabel(p.programa)}</td>
                <td><FinBadge financiamiento={p.financiamiento} /></td>
                <td><EtapaBadge etapa={p.etapa} /></td>
                <td className="vx-td-grupo">{p.grupo_tentativo || '—'}</td>
                <td className="vx-td-dias">{dias != null ? <><b>{dias}</b> d</> : '—'}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="vx-rowacts">
                    <button className="vx-iconbtn ver" onClick={() => onOpen(p)}><Vico d={VI.eye} size={13} /> Ver</button>
                    <WaLink tel={p.whatsapp || p.telefono} className="vx-iconbtn"><Vico d={VI.wa} size={14} fill="currentColor" /></WaLink>
                    <button className="vx-iconbtn" onClick={() => onOpen(p)} title="Más"><Vico d={VI.dots} size={15} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// ── TARJETAS (mobile) ───────────────────────────────────────────────────────
function ProspectoCards({ lista, onOpen }) {
  return (
    <div className="vx-cards">
      {lista.map(p => {
        const dias = diasDesde(p.fecha_registro);
        const color = (ETAPA_MAP[p.etapa] || {}).color || '#002F6C';
        return (
          <div key={p.cedula} className="vx-card" style={{ borderLeftColor: color }} onClick={() => onOpen(p)}>
            <div className="vx-card-top">
              <div>
                <div className="vx-card-name">{p.nombre}</div>
                <div className="vx-card-ced">{p.cedula}</div>
              </div>
              <EtapaBadge etapa={p.etapa} />
            </div>
            <div className="vx-card-meta">
              <FinBadge financiamiento={p.financiamiento} />
              <span className="vx-td-prog">{progLabel(p.programa)}</span>
              {p.grupo_tentativo ? <span className="vx-td-grupo">{p.grupo_tentativo}</span> : null}
            </div>
            <div className="vx-card-foot">
              <span className="vx-td-dias">{dias != null ? <><b>{dias}</b> días</> : '—'}</span>
              <WaLink tel={p.whatsapp || p.telefono} className="vx-wa-mini"><Vico d={VI.wa} size={16} fill="currentColor" /></WaLink>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TableSkeleton() {
  return <div className="vx-tablecard" style={{ padding: 14 }}>{[0,1,2,3,4,5].map(i => <div key={i} className="vx-sk vx-sk-row" />)}</div>;
}

// ── TOAST ────────────────────────────────────────────────────────────────
function VToast({ toast }) {
  if (!toast) return null;
  return ReactDOM.createPortal((
    <div className={`vx-toast ${toast.tipo}`}>
      <Vico d={toast.tipo === 'ok' ? VI.check : VI.alert} size={16} />
      <span>{toast.msg}</span>
    </div>
  ), document.body);
}

// ── LIGHTBOX ───────────────────────────────────────────────────────────────
function Lightbox({ src, caption, onClose }) {
  if (!src) return null;
  return ReactDOM.createPortal((
    <div className="vx-lightbox" onClick={onClose}>
      <button className="vx-lightbox-x" onClick={onClose}>×</button>
      <img src={src} alt={caption || ''} onClick={e => e.stopPropagation()} />
      {caption ? <div className="vx-lightbox-cap">{caption}</div> : null}
    </div>
  ), document.body);
}

// ── BLOQUE DE DOCUMENTOS (3 fotos) ──────────────────────────────────────────
function DocsBlock({ detalle, onView, onSubirManual }) {
  const docs = [
    ['foto_ced_frente', 'Cédula · frente'],
    ['foto_ced_dorso',  'Cédula · dorso'],
    ['foto_titulo',     'Título'],
  ];
  return (
    <div className="vx-docs">
      {docs.map(([key, cap]) => {
        const src = detalle[key];
        if (src) {
          return (
            <div key={key} className="vx-doc" onClick={() => onView(src, cap)}>
              <img src={src} alt={cap} />
              <div className="vx-doc-cap">{cap}</div>
            </div>
          );
        }
        return (
          <div key={key} className="vx-doc-empty">
            <div className="vx-doc-ph">Sin archivo</div>
            <div className="vx-doc-cap" style={{ marginBottom: 6 }}>{cap}</div>
            <button className="vx-mini-btn" onClick={() => onSubirManual(key, cap)}>Subir manualmente</button>
          </div>
        );
      })}
    </div>
  );
}

// ── TIMELINE CONAPE ──────────────────────────────────────────────────────────
function ConapeTimeline({ eventos }) {
  if (!eventos || !eventos.length) {
    return <div style={{ fontSize: 12.5, color: 'var(--v-ink-3)', fontStyle: 'italic' }}>Sin eventos de CONAPE registrados todavía.</div>;
  }
  return (
    <div className="vx-tl">
      {eventos.map((ev, i) => (
        <div key={i} className="vx-tl-item">
          <div className="vx-tl-date">{window.fmtFechaCorta(ev.fecha)}</div>
          <div className="vx-tl-title">{ev.titulo}</div>
          {ev.detalle ? <div className="vx-tl-detail">{ev.detalle}</div> : null}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  VI, Vico, hexA,
  EtapaBadge, FinBadge, progLabel,
  KPIRow, KPISkeleton, Funnel, FilterBar,
  WaLink, ProspectoTable, ProspectoCards, TableSkeleton,
  VToast, Lightbox, DocsBlock, ConapeTimeline,
});
