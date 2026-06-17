/* global React, PageHeader */
// CALGRUPO_F42_20260617_AUDITORIA_ROLES_PERMISOS_FRONTEND
// Auditoría de roles y permisos. Solo lectura. No modifica datos.

const SCRIPT_URL_PERMISOS = window.APPS_SCRIPT_URL;

async function postPermisosRoles(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${SCRIPT_URL_PERMISOS}?fn=${encodeURIComponent(fn)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ fn, token, ...payload }),
  });
  return await res.json();
}

const PR_TONES = {
  ok:   { bg:'rgba(22,163,74,.10)', fg:'#166534', border:'rgba(22,163,74,.25)', label:'OK' },
  warn: { bg:'rgba(202,138,4,.12)', fg:'#854D0E', border:'rgba(202,138,4,.25)', label:'Revisar' },
  bad:  { bg:'rgba(185,28,28,.10)', fg:'#991B1B', border:'rgba(185,28,28,.25)', label:'Crítico' },
  info: { bg:'rgba(30,64,175,.10)', fg:'#1E3A8A', border:'rgba(30,64,175,.22)', label:'Info' },
};
function prTone(status) { return PR_TONES[status] || PR_TONES.info; }
function prText(v, fallback = '—') { const s = String(v ?? '').trim(); return s || fallback; }
function prNum(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function prRoles(v) { return Array.isArray(v) ? v.join(', ') : prText(v); }

function PermisosBadge({ status, children }) {
  const m = prTone(status);
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 9px', borderRadius:999, background:m.bg, color:m.fg, border:`1px solid ${m.border}`, fontSize:11, fontWeight:850, whiteSpace:'nowrap' }}>{children || m.label}</span>;
}
function PermisosCard({ title, value, sub, status = 'info', onClick }) {
  const m = prTone(status);
  return <button type="button" onClick={onClick} style={{ textAlign:'left', border:`1px solid ${m.border}`, background:`linear-gradient(135deg, ${m.bg}, rgba(255,255,255,.92))`, borderRadius:18, padding:16, cursor:onClick?'pointer':'default', fontFamily:'inherit' }}>
    <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', marginBottom:8 }}>
      <div style={{ fontSize:11, fontWeight:900, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--ink-3)' }}>{title}</div>
      <PermisosBadge status={status} />
    </div>
    <div style={{ fontSize:27, lineHeight:1.05, fontWeight:900, color:'var(--an-navy-ink)' }}>{value}</div>
    {sub && <div style={{ marginTop:6, fontSize:12, color:'var(--ink-3)', lineHeight:1.45 }}>{sub}</div>}
  </button>;
}
function PermisosButton({ children, onClick, active, danger }) {
  return <button type="button" onClick={onClick} style={{ border:`1px solid ${active ? 'var(--an-granate)' : danger ? 'rgba(185,28,28,.25)' : 'var(--line)'}`, background: active ? 'var(--an-granate)' : danger ? 'rgba(185,28,28,.08)' : '#fff', color: active ? '#fff' : danger ? '#991B1B' : 'var(--ink-2)', borderRadius:999, padding:'8px 12px', fontSize:12, fontWeight:850, cursor:'pointer', fontFamily:'inherit' }}>{children}</button>;
}

function PermisosRolesView() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [tab, setTab] = React.useState('resumen');
  const [filtro, setFiltro] = React.useState('todos');

  const cargar = React.useCallback(async () => {
    setLoading(true); setErr('');
    try {
      const r = await postPermisosRoles('auditoriaRolesPermisos', {});
      if (!r || !r.ok) throw new Error(r?.error || 'No se pudo cargar auditoría de permisos.');
      setData(r);
    } catch (e) {
      setErr(e.message || String(e));
      setData(null);
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { cargar(); }, [cargar]);

  const k = data?.kpis || {};
  const endpoints = data?.endpoints || [];
  const vistas = data?.vistas_frontend || [];
  const propiedad = data?.propiedad || [];
  const recomendaciones = data?.recomendaciones || [];
  const riesgos = data?.riesgos || [];
  const endpointsFiltrados = endpoints.filter(e => filtro === 'todos' || (filtro === 'alertas' ? e.status !== 'ok' : String(e.modulo || '').toLowerCase() === filtro));

  const copiarResumen = async () => {
    const txt = [
      'AUDITORÍA DE ROLES Y PERMISOS',
      'Academia Norteamericana',
      `Estado: ${prText(k.estado_general)}`,
      `Endpoints revisados: ${prNum(k.endpoints_revisados)}`,
      `Sin mapa: ${prNum(k.endpoints_sin_mapa)}`,
      `Con diferencia: ${prNum(k.endpoints_con_diferencia)}`,
      `Vistas revisadas: ${prNum(k.vistas_revisadas)}`,
      '',
      'Riesgos:',
      ...(riesgos.length ? riesgos.map(r => `- [${r.status || 'info'}] ${r.titulo || ''}: ${r.texto || ''}`) : ['- Sin riesgos críticos visibles.']),
    ].join('\n');
    try { await navigator.clipboard.writeText(txt); alert('Resumen copiado.'); } catch (_) { alert(txt); }
  };

  const exportCsv = () => {
    const rows = [['modulo','endpoint','roles_esperados','roles_backend','estado','nota'], ...endpointsFiltrados.map(e => [e.modulo, e.fn, prRoles(e.roles_esperados), prRoles(e.roles_backend), e.status, e.nota])];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `auditoria_permisos_roles_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
  };

  return <section data-screen-label="Admin · Permisos y roles" style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
    <PageHeader kicker="Seguridad" title={<>Permisos <em>y roles</em></>} sub="Auditoría de menú, endpoints y reglas de propiedad. Solo lectura: no modifica datos ni sesiones." />

    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <PermisosButton active={tab==='resumen'} onClick={() => setTab('resumen')}>Resumen</PermisosButton>
        <PermisosButton active={tab==='vistas'} onClick={() => setTab('vistas')}>Vistas por rol</PermisosButton>
        <PermisosButton active={tab==='endpoints'} onClick={() => setTab('endpoints')}>Endpoints</PermisosButton>
        <PermisosButton active={tab==='propiedad'} onClick={() => setTab('propiedad')}>Propiedad</PermisosButton>
        <PermisosButton active={tab==='recomendaciones'} onClick={() => setTab('recomendaciones')}>Recomendaciones</PermisosButton>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <PermisosButton onClick={cargar}>{loading ? 'Revisando…' : 'Actualizar'}</PermisosButton>
        <PermisosButton onClick={copiarResumen}>Copiar resumen</PermisosButton>
        <PermisosButton onClick={exportCsv}>Exportar CSV</PermisosButton>
      </div>
    </div>

    {err && <div style={{ padding:14, borderRadius:14, border:'1px solid rgba(185,28,28,.22)', background:'rgba(185,28,28,.08)', color:'#991B1B', fontSize:13 }}>{err}</div>}
    {loading && !data && <div style={{ padding:18, borderRadius:16, border:'1px solid var(--line)', background:'#fff', color:'var(--ink-3)' }}>Leyendo mapa de permisos del backend…</div>}

    {data && <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12 }}>
        <PermisosCard title="Estado general" value={prText(k.estado_general)} status={k.estado_status || 'info'} sub={data.version || 'F42'} />
        <PermisosCard title="Endpoints" value={prNum(k.endpoints_revisados)} status={prNum(k.endpoints_sin_mapa) ? 'bad' : prNum(k.endpoints_con_diferencia) ? 'warn' : 'ok'} sub={`${prNum(k.endpoints_sin_mapa)} sin mapa · ${prNum(k.endpoints_con_diferencia)} diferencias`} onClick={() => setTab('endpoints')} />
        <PermisosCard title="Vistas" value={prNum(k.vistas_revisadas)} status="ok" sub="Menú esperado por rol" onClick={() => setTab('vistas')} />
        <PermisosCard title="Reglas propiedad" value={prNum(k.reglas_propiedad)} status="ok" sub="Student/docente protegidos" onClick={() => setTab('propiedad')} />
      </div>

      {tab === 'resumen' && <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.2fr) minmax(280px, .8fr)', gap:14 }}>
        <PermisosPanel title="Riesgos principales" sub="Lo que debe revisarse antes de producción abierta.">
          <div style={{ display:'grid', gap:10 }}>
            {(riesgos.length ? riesgos : [{ status:'ok', titulo:'Sin riesgos críticos', texto:'El mapa principal no reporta alertas críticas.' }]).map((r, i) => <div key={i} style={{ border:'1px solid var(--line)', borderRadius:14, background:'#fff', padding:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}><PermisosBadge status={r.status === 'error' ? 'bad' : r.status || 'info'} /><strong style={{ color:'var(--an-navy-ink)' }}>{r.titulo || `Riesgo ${i+1}`}</strong></div>
              <div style={{ color:'var(--ink-3)', fontSize:13, lineHeight:1.45 }}>{r.texto || '—'}</div>
            </div>)}
          </div>
        </PermisosPanel>
        <PermisosPanel title="Separación por rol" sub="Regla esperada del campus.">
          <RoleRule role="Estudiante" text="Solo su expediente, su grupo, sus notas, sus pagos, sus exámenes y su certificado." />
          <RoleRule role="Docente" text="Solo grupos/lecciones/estudiantes asignados y registros académicos autorizados." />
          <RoleRule role="Admin" text="Operación académica, financiera, CONAPE, certificados y reportes." />
          <RoleRule role="Superadmin" text="Admin completo más cancelaciones/desbloqueos delicados." />
        </PermisosPanel>
      </div>}

      {tab === 'vistas' && <PermisosPanel title="Vistas visibles por rol" sub="Matriz esperada del frontend. Sirve para detectar menús mal expuestos.">
        <PermisosTable rows={vistas} columns={[["rol","Rol"],["vista","Vista"],["label","Etiqueta"],["status","Estado"],["nota","Nota"]]} />
      </PermisosPanel>}

      {tab === 'endpoints' && <PermisosPanel title="Endpoints backend por módulo" sub="Comparación entre roles esperados y roles definidos en el router de seguridad.">
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:12 }}>
          {['todos','alertas','estudiante','docente','admin','certificados','examenes','notas','conape','reportes'].map(x => <PermisosButton key={x} active={filtro===x} danger={x==='alertas'} onClick={() => setFiltro(x)}>{x === 'todos' ? 'Todos' : x === 'alertas' ? 'Alertas' : x}</PermisosButton>)}
        </div>
        <PermisosTable rows={endpointsFiltrados} columns={[["modulo","Módulo"],["fn","Endpoint"],["roles_esperados","Roles esperados"],["roles_backend","Roles backend"],["status","Estado"],["nota","Nota"]]} />
      </PermisosPanel>}

      {tab === 'propiedad' && <PermisosPanel title="Reglas de propiedad" sub="Reglas que evitan que un usuario vea expedientes ajenos.">
        <PermisosTable rows={propiedad} columns={[["rol","Rol"],["regla","Regla"],["endpoints","Endpoints"],["status","Estado"],["nota","Nota"]]} />
      </PermisosPanel>}

      {tab === 'recomendaciones' && <PermisosPanel title="Recomendaciones" sub="Acciones sugeridas para cerrar seguridad antes de producción abierta.">
        <div style={{ display:'grid', gap:10 }}>
          {(recomendaciones.length ? recomendaciones : [{ status:'ok', titulo:'Sin recomendaciones pendientes', texto:'No se detectaron recomendaciones críticas.' }]).map((r,i) => <div key={i} style={{ border:'1px solid var(--line)', borderRadius:14, background:'#fff', padding:13 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}><PermisosBadge status={r.status === 'error' ? 'bad' : r.status || 'info'} /><strong style={{ color:'var(--an-navy-ink)' }}>{r.titulo || `Recomendación ${i+1}`}</strong></div>
            <div style={{ color:'var(--ink-3)', fontSize:13, lineHeight:1.45 }}>{r.texto || '—'}</div>
          </div>)}
        </div>
      </PermisosPanel>}
    </>}
  </section>;
}

function PermisosPanel({ title, sub, children }) {
  return <section style={{ border:'1px solid var(--line)', background:'white', borderRadius:18, padding:16, boxShadow:'0 8px 26px rgba(15,23,42,.04)' }}>
    <div style={{ marginBottom:12 }}><div style={{ fontSize:19, fontWeight:900, color:'var(--an-navy-ink)' }}>{title}</div>{sub && <div style={{ marginTop:3, fontSize:12.5, color:'var(--ink-3)' }}>{sub}</div>}</div>
    {children}
  </section>;
}
function RoleRule({ role, text }) { return <div style={{ padding:'10px 0', borderBottom:'1px solid var(--line)' }}><div style={{ fontWeight:900, color:'var(--an-navy-ink)' }}>{role}</div><div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.45 }}>{text}</div></div>; }
function PermisosTable({ rows = [], columns = [] }) {
  if (!rows.length) return <div style={{ padding:18, border:'1px dashed var(--line)', borderRadius:14, color:'var(--ink-3)' }}>Sin registros para mostrar.</div>;
  return <div style={{ overflowX:'auto', border:'1px solid var(--line)', borderRadius:14 }}><table style={{ width:'100%', borderCollapse:'collapse' }}>
    <thead><tr style={{ background:'color-mix(in srgb, var(--an-navy) 5%, white)' }}>{columns.map(([k,l]) => <th key={k} style={thPR}>{l}</th>)}</tr></thead>
    <tbody>{rows.map((r,i) => <tr key={i}>{columns.map(([k]) => <td key={k} style={tdPR}>{renderPRCell(k, r[k])}</td>)}</tr>)}</tbody>
  </table></div>;
}
function renderPRCell(k, v) {
  if (k === 'status') return <PermisosBadge status={v === 'ok' ? 'ok' : v === 'warn' ? 'warn' : v === 'error' || v === 'bad' ? 'bad' : 'info'}>{v === 'ok' ? 'OK' : v === 'warn' ? 'Revisar' : v === 'error' || v === 'bad' ? 'Crítico' : prText(v)}</PermisosBadge>;
  if (Array.isArray(v)) return <span style={{ fontFamily:'var(--f-mono)', fontSize:11.5 }}>{v.join(', ')}</span>;
  return prText(v);
}
const thPR = { textAlign:'left', padding:'10px 11px', fontSize:11, fontWeight:900, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-2)', whiteSpace:'nowrap' };
const tdPR = { padding:'10px 11px', borderTop:'1px solid var(--line)', fontSize:12.5, color:'var(--ink-2)', verticalAlign:'top' };

window.PermisosRolesView = PermisosRolesView;
