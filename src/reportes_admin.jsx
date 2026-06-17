/* global React, PageHeader */
// CALGRUPO_F38_20260617_REPORTES_ADMINISTRATIVOS_FRONTEND

const SCRIPT_URL_REP = window.APPS_SCRIPT_URL;

async function postReportesAdmin(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_REP}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

function repText(v, fallback = '—') {
  const s = String(v ?? '').trim();
  return s || fallback;
}
function repNum(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function repUpper(v) { return String(v || '').trim().toUpperCase(); }
function repPct(v) { const n = Math.max(0, Math.min(100, Number(v || 0))); return `${Math.round(n)}%`; }

function repRiskMeta(r) {
  const s = repUpper(r);
  if (['CRITICO','CRÍTICO','ALTA','ALTO','ROJO'].includes(s)) return { bg:'rgba(185,28,28,.10)', fg:'#991B1B', bd:'rgba(185,28,28,.24)', label:r || 'Crítico' };
  if (['MEDIO','MEDIA','REVISION','REVISIÓN','AMARILLO'].includes(s)) return { bg:'rgba(202,138,4,.13)', fg:'#854D0E', bd:'rgba(202,138,4,.27)', label:r || 'Revisión' };
  if (['OK','ESTABLE','BAJO','BAJA','VERDE'].includes(s)) return { bg:'rgba(22,163,74,.10)', fg:'#166534', bd:'rgba(22,163,74,.24)', label:r || 'Estable' };
  return { bg:'rgba(30,64,175,.09)', fg:'#1E3A8A', bd:'rgba(30,64,175,.20)', label:r || 'Info' };
}
function RepBadge({ status, children }) {
  const m = repRiskMeta(status);
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 9px', borderRadius:999, background:m.bg, color:m.fg, border:`1px solid ${m.bd}`, fontSize:11, fontWeight:900, whiteSpace:'nowrap' }}>{children || m.label}</span>;
}
function RepCard({ title, value, sub, status = 'info', onClick }) {
  const m = repRiskMeta(status);
  return (
    <button type="button" onClick={onClick} style={{
      textAlign:'left', padding:16, borderRadius:18, border:`1px solid ${m.bd}`,
      background:`linear-gradient(135deg, ${m.bg}, rgba(255,255,255,.94))`,
      boxShadow:'0 12px 30px rgba(15,23,42,.055)', fontFamily:'inherit',
      cursor:onClick ? 'pointer' : 'default', minHeight:112,
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginBottom:10 }}>
        <div style={{ fontSize:11, color:'var(--ink-3)', fontWeight:900, letterSpacing:'.13em', textTransform:'uppercase' }}>{title}</div>
        <RepBadge status={status} />
      </div>
      <div style={{ fontSize:30, fontWeight:900, color:'var(--an-navy-ink)', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ marginTop:7, fontSize:12.5, lineHeight:1.4, color:'var(--ink-3)' }}>{sub}</div>}
    </button>
  );
}
function RepButton({ children, onClick, primary, disabled }) {
  return <button type="button" onClick={onClick} disabled={disabled} style={{
    border:'1px solid ' + (primary ? 'rgba(122,30,44,.35)' : 'var(--line, #E5E0D8)'),
    background: primary ? 'var(--an-granate, #7A1E2C)' : 'white',
    color: primary ? 'white' : 'var(--ink-2)',
    padding:'8px 12px', borderRadius:11, fontSize:12.5, fontWeight:850,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .55 : 1, fontFamily:'inherit',
  }}>{children}</button>;
}
function repCopy(text, setMsg) {
  const done = () => setMsg && setMsg('Copiado al portapapeles.');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => {});
  else { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
}
function repCsv(filename, rows) {
  const csv = rows.map(row => row.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 600);
}

function ReportesAdminView({ onNavigate }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [msg, setMsg] = React.useState('');
  const [tab, setTab] = React.useState('ejecutivo');
  const [q, setQ] = React.useState('');

  const cargar = React.useCallback(() => {
    setLoading(true); setError(''); setMsg('');
    postReportesAdmin('getReportesAdministrativos', { detalle: true })
      .then(r => {
        if (!r || r.ok === false) throw new Error(r?.error || 'No se pudo cargar reportes administrativos.');
        setData(r);
      })
      .catch(e => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, []);
  React.useEffect(() => { cargar(); }, [cargar]);

  const k = data?.kpis || {};
  const grupos = data?.reportes?.grupos || [];
  const docentes = data?.reportes?.docentes || [];
  const certificados = data?.reportes?.certificados?.grupos || [];
  const financiero = data?.reportes?.financiero?.grupos_mora || [];
  const examenes = data?.reportes?.academico?.examenes_cercanos || [];
  const cierres = data?.reportes?.academico?.cierres_recientes || [];
  const notas = data?.reportes?.academico?.notas_resumen || [];
  const busq = repUpper(q);
  const gruposFiltrados = grupos.filter(g => !busq || [g.grupo, g.docente, g.horario, g.programa, g.riesgo].map(repUpper).join(' | ').includes(busq));

  const copiarResumen = () => {
    const lineas = [
      'REPORTE EJECUTIVO · ACADEMIA NORTEAMERICANA',
      'Generado: ' + repText(data?.generado_en),
      '',
      'Estudiantes activos visibles: ' + repNum(k.estudiantes_activos),
      'Grupos activos visibles: ' + repNum(k.grupos_activos),
      'Grupos en riesgo: ' + repNum(k.grupos_riesgo),
      'Morosos detectados: ' + repNum(k.morosos),
      'Certificados pendientes: ' + repNum(k.certificados_pendientes),
      'Certificados registrados: ' + repNum(k.certificados_registrados),
      'Notas faltantes: ' + repNum(k.notas_faltantes),
      'Exámenes cercanos: ' + repNum(k.examenes_cercanos),
      '',
      'PRIORIDADES:',
      ...(data?.prioridades || []).map((p, i) => `${i+1}. ${p.titulo}: ${p.texto}`),
    ];
    repCopy(lineas.join('\n'), setMsg);
  };
  const exportarGrupos = () => {
    const rows = [['Grupo','Docente','Horario','Programa','Estudiantes','CA','APR/CNV','REP','Morosos','Cert. pendientes','Cert. registrados','Notas faltantes','Riesgo']];
    gruposFiltrados.forEach(g => rows.push([g.grupo, g.docente, g.horario, g.programa, g.estudiantes, g.ca, g.apr_cnv, g.rep, g.morosos, g.certificados_pendientes, g.certificados_registrados, g.notas_faltantes, g.riesgo]));
    repCsv('reporte_grupos_academia_norteamericana.csv', rows);
  };
  const imprimir = () => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Reporte administrativo</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#172033}h1{margin:0 0 4px}small{color:#666}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.card{border:1px solid #ddd;border-radius:12px;padding:12px}.v{font-size:24px;font-weight:800}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border-bottom:1px solid #ddd;text-align:left;padding:8px}th{background:#f5f5f5}@media print{button{display:none}}</style></head><body><h1>Reporte administrativo</h1><small>Academia Norteamericana · ${repText(data?.generado_en)}</small><div class="grid"><div class="card"><b>Estudiantes activos</b><div class="v">${repNum(k.estudiantes_activos)}</div></div><div class="card"><b>Grupos activos</b><div class="v">${repNum(k.grupos_activos)}</div></div><div class="card"><b>Morosos</b><div class="v">${repNum(k.morosos)}</div></div><div class="card"><b>Cert. pendientes</b><div class="v">${repNum(k.certificados_pendientes)}</div></div></div><h2>Prioridades</h2><ul>${(data?.prioridades||[]).map(p=>`<li><b>${repText(p.titulo)}</b>: ${repText(p.texto)}</li>`).join('')}</ul><h2>Grupos</h2><table><thead><tr><th>Grupo</th><th>Docente</th><th>Est.</th><th>Morosos</th><th>Cert. pendientes</th><th>Notas faltantes</th><th>Riesgo</th></tr></thead><tbody>${gruposFiltrados.map(g=>`<tr><td>${repText(g.grupo)}</td><td>${repText(g.docente)}</td><td>${repNum(g.estudiantes)}</td><td>${repNum(g.morosos)}</td><td>${repNum(g.certificados_pendientes)}</td><td>${repNum(g.notas_faltantes)}</td><td>${repText(g.riesgo)}</td></tr>`).join('')}</tbody></table><script>window.print()</script></body></html>`;
    const w = window.open('', '_blank', 'width=1100,height=800');
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div data-screen-label="Admin · Reportes administrativos" style={{ padding: 22, display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:900, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate)' }}>F38 · Dirección</div>
          <h1 style={{ margin:'4px 0 4px', fontFamily:'var(--f-serif)', fontSize:34, color:'var(--an-navy-ink)', fontWeight:500 }}>Reportes administrativos</h1>
          <div style={{ fontSize:13, color:'var(--ink-3)' }}>Lectura ejecutiva de grupos, mora, certificados, notas, exámenes, docentes y cierres.</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <RepButton onClick={cargar} disabled={loading}>Actualizar</RepButton>
          <RepButton onClick={copiarResumen}>Copiar resumen</RepButton>
          <RepButton onClick={exportarGrupos}>Exportar grupos CSV</RepButton>
          <RepButton onClick={imprimir} primary>Reporte / imprimir</RepButton>
        </div>
      </div>

      {msg && <div style={{ padding:'10px 12px', borderRadius:12, background:'rgba(22,163,74,.10)', color:'#166534', fontSize:13, fontWeight:800 }}>{msg}</div>}
      {error && <div style={{ padding:'12px 14px', borderRadius:14, background:'rgba(185,28,28,.10)', color:'#991B1B', fontSize:13, fontWeight:800 }}>{error}</div>}
      {loading && <div style={{ padding:18, border:'1px dashed var(--line)', borderRadius:16, color:'var(--ink-3)' }}>Cargando reportes administrativos…</div>}

      {!loading && data && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12 }}>
            <RepCard title="Salud operativa" value={repPct(k.salud_operativa)} sub="Lectura global visual" status={k.salud_estado || 'info'} />
            <RepCard title="Grupos activos" value={repNum(k.grupos_activos)} sub={`${repNum(k.grupos_riesgo)} con prioridad`} status={repNum(k.grupos_riesgo) ? 'media' : 'ok'} onClick={() => setTab('grupos')} />
            <RepCard title="Estudiantes activos" value={repNum(k.estudiantes_activos)} sub={`${repNum(k.morosos)} con mora`} status={repNum(k.morosos) ? 'media' : 'ok'} onClick={() => setTab('financiero')} />
            <RepCard title="Cert. pendientes" value={repNum(k.certificados_pendientes)} sub={`${repNum(k.certificados_registrados)} registrados`} status={repNum(k.certificados_pendientes) ? 'media' : 'ok'} onClick={() => setTab('certificados')} />
            <RepCard title="Notas faltantes" value={repNum(k.notas_faltantes)} sub="Antes de cierre académico" status={repNum(k.notas_faltantes) ? 'alta' : 'ok'} onClick={() => setTab('academico')} />
            <RepCard title="Exámenes cercanos" value={repNum(k.examenes_cercanos)} sub="Lecciones 18 / 32 próximas" status={repNum(k.examenes_cercanos) ? 'media' : 'ok'} onClick={() => setTab('examenes')} />
          </div>

          <section style={{ background:'var(--surface)', border:'1px solid var(--line)', borderRadius:18, padding:16 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:12 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[
                  ['ejecutivo','Ejecutivo'], ['grupos','Grupos'], ['academico','Académico'], ['financiero','Mora/CONAPE'], ['certificados','Certificados'], ['docentes','Docentes'], ['examenes','Exámenes'], ['cierre','Cierre']
                ].map(([id,label]) => <button key={id} onClick={() => setTab(id)} style={{ padding:'8px 11px', borderRadius:999, border:'1px solid ' + (tab===id ? 'rgba(122,30,44,.35)' : 'var(--line)'), background: tab===id ? 'var(--an-granate)' : 'white', color: tab===id ? 'white' : 'var(--ink-2)', fontWeight:850, fontSize:12, cursor:'pointer' }}>{label}</button>)}
              </div>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar grupo, docente, programa…" style={{ minWidth:260, padding:'9px 12px', border:'1px solid var(--line)', borderRadius:12, fontSize:13 }} />
            </div>

            {tab === 'ejecutivo' && <div style={{ display:'grid', gridTemplateColumns:'1.1fr .9fr', gap:14 }}>
              <div style={panelBox}>
                <h3 style={h3}>Prioridades para dirección</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {(data.prioridades || []).map((p, i) => <div key={i} style={{ padding:12, border:'1px solid var(--line)', borderRadius:14, display:'flex', justifyContent:'space-between', gap:12 }}>
                    <div><b>{repText(p.titulo)}</b><div style={{ fontSize:12.5, color:'var(--ink-3)', marginTop:3 }}>{repText(p.texto)}</div></div><RepBadge status={p.status}>{p.status_label}</RepBadge>
                  </div>)}
                </div>
              </div>
              <div style={panelBox}>
                <h3 style={h3}>Lectura rápida</h3>
                {(data.resumen_ejecutivo || []).map((x, i) => <div key={i} style={{ padding:'9px 0', borderBottom:'1px solid var(--line)' }}><b>{repText(x.titulo)}</b><div style={{ fontSize:12.5, color:'var(--ink-3)' }}>{repText(x.texto)}</div></div>)}
              </div>
            </div>}

            {tab === 'grupos' && <RepTable rows={gruposFiltrados} columns={[
              ['grupo','Grupo'], ['docente','Docente'], ['horario','Horario'], ['programa','Programa'], ['estudiantes','Est.'], ['ca','CA'], ['apr_cnv','APR/CNV'], ['morosos','Mora'], ['certificados_pendientes','Cert. pend.'], ['notas_faltantes','Notas falt.'], ['riesgo','Riesgo']
            ]} rowAction={(r) => r.grupo && <RepButton onClick={() => onNavigate && onNavigate('calendario_grupo', { grupo:r.grupo })}>Abrir</RepButton>} />}

            {tab === 'academico' && <RepTable rows={notas} columns={[
              ['grupo','Grupo'], ['nivel','Nivel'], ['estudiantes','Est.'], ['notas_faltantes','Notas faltantes'], ['promedio','Promedio'], ['estado','Estado']
            ]} />}

            {tab === 'financiero' && <RepTable rows={financiero} columns={[
              ['grupo','Grupo'], ['estudiantes','Est.'], ['morosos','Morosos'], ['monto_estimado','Monto ref.'], ['riesgo','Riesgo']
            ]} rowAction={(r) => r.grupo && <RepButton onClick={() => onNavigate && onNavigate('calendario_grupo', { grupo:r.grupo })}>Abrir</RepButton>} />}

            {tab === 'certificados' && <RepTable rows={certificados} columns={[
              ['grupo','Grupo'], ['nivel','Nivel'], ['pendientes','Pendientes'], ['registrados','Registrados'], ['sin_pdf','Sin PDF'], ['estado','Estado']
            ]} />}

            {tab === 'docentes' && <RepTable rows={docentes} columns={[
              ['docente','Docente'], ['grupos','Grupos'], ['estudiantes','Estudiantes'], ['clases_hoy','Clases hoy'], ['lecciones_pendientes','Pendientes'], ['riesgo','Riesgo']
            ]} />}

            {tab === 'examenes' && <RepTable rows={examenes} columns={[
              ['fecha','Fecha'], ['grupo','Grupo'], ['nivel','Nivel'], ['leccion','Lección'], ['tipo','Tipo'], ['estado','Estado']
            ]} rowAction={(r) => r.grupo && <RepButton onClick={() => onNavigate && onNavigate('calendario_grupo', { grupo:r.grupo })}>Abrir</RepButton>} />}

            {tab === 'cierre' && <RepTable rows={cierres} columns={[
              ['fecha','Fecha'], ['grupo','Grupo'], ['nivel','Nivel'], ['listos_apr','APR'], ['listos_rep','REP'], ['incompletos','Incompletos'], ['estado','Estado']
            ]} />}
          </section>
        </>
      )}
    </div>
  );
}

const panelBox = { background:'white', border:'1px solid var(--line)', borderRadius:16, padding:15 };
const h3 = { margin:'0 0 12px', fontSize:18, color:'var(--an-navy-ink)' };
const thRep = { textAlign:'left', padding:'10px 11px', fontSize:11, fontWeight:900, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-2)', whiteSpace:'nowrap' };
const tdRep = { padding:'10px 11px', borderTop:'1px solid var(--line)', fontSize:12.5, color:'var(--ink-2)', verticalAlign:'middle' };
function RepTable({ rows = [], columns = [], rowAction }) {
  if (!rows.length) return <div style={{ padding:16, border:'1px dashed var(--line)', borderRadius:14, color:'var(--ink-3)' }}>Sin datos para esta vista.</div>;
  return <div style={{ overflowX:'auto', border:'1px solid var(--line)', borderRadius:14 }}><table style={{ width:'100%', borderCollapse:'collapse' }}><thead><tr style={{ background:'color-mix(in srgb, var(--an-navy) 5%, white)' }}>{columns.map(([k,l]) => <th key={k} style={thRep}>{l}</th>)}{rowAction && <th style={thRep}>Acción</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{columns.map(([k]) => <td key={k} style={tdRep}>{k === 'riesgo' || k === 'estado' ? <RepBadge status={r[k]}>{repText(r[k])}</RepBadge> : repText(r[k])}</td>)}{rowAction && <td style={tdRep}>{rowAction(r)}</td>}</tr>)}</tbody></table></div>;
}
