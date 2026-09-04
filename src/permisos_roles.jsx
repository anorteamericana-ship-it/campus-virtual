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

function prSafeUserError(raw, fallback, context = '') {
  const msg=String(raw==null?'':raw).trim();
  if(!msg)return fallback;
  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText=/apps?\s*script|script\.google|backend|endpoint|router|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|aborterror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|request[_ -]?id|file_id|base64|sha-?256|\bmime\b|driveapp|spreadsheet|\bsheet\b|\btabla\b|\bhoja\b|auditoriaRolesPermisos/i.test(msg);
  if(technicalCode||technicalText){console.warn('[PermisosRoles] Detalle técnico oculto al operador.',{context,error:msg});return fallback;}
  return msg;
}
function prRoleLabel(v) {
  const raw=String(v==null?'':v).trim();
  const key=raw.toLowerCase();
  const labels={superadmin:'Superadministración',admin:'Administración',teacher:'Docencia',docente:'Docencia',student:'Estudiante',estudiante:'Estudiante',ventas:'Ventas',sales:'Ventas',free:'Demostración',demo:'Demostración'};
  return labels[key] || (raw ? raw.replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase()) : '—');
}
function prActionLabel(v) {
  const raw=String(v==null?'':v).trim();
  if(!raw)return '—';
  const known={auditoriaRolesPermisos:'Consultar auditoría de permisos',getVentasDashboard:'Consultar panel de ventas',getProspectos:'Consultar prospectos',generarProforma:'Generar proforma',inscribirEstudiante:'Inscribir estudiante',crearUsuario:'Crear usuario',guardarMatricula:'Guardar matrícula',aplicarPago:'Aplicar pago',actualizarSaldoCuenta:'Actualizar saldo de cuenta',suspenderEstudiante:'Suspender estudiante',reactivarEstudiante:'Reactivar estudiante',getAuditoriaAcademica:'Consultar auditoría académica',getAdminSecurityAudit:'Consultar auditoría de permisos'};
  if(known[raw])return known[raw];
  if(/[^A-Za-z0-9]/.test(raw))return 'Acción protegida';
  const verbs=[['get','Consultar'],['listar','Consultar'],['buscar','Consultar'],['guardar','Guardar'],['crear','Crear'],['actualizar','Actualizar'],['editar','Editar'],['eliminar','Eliminar'],['cancelar','Cancelar'],['suspender','Suspender'],['reactivar','Reactivar'],['generar','Generar'],['aplicar','Aplicar'],['registrar','Registrar'],['aprobar','Aprobar'],['rechazar','Rechazar']];
  const found=verbs.find(([p])=>raw.toLowerCase().startsWith(p.toLowerCase()) && raw.length>p.length);
  if(!found)return 'Acción protegida';
  const body=raw.slice(found[0].length).replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/([A-Z])([A-Z][a-z])/g,'$1 $2').trim().toLowerCase();
  return body ? found[1]+' '+body : found[1];
}
function prFriendlyLabel(v, fallback = '—') {
  const raw=String(v==null?'':v).trim();
  if(!raw)return fallback;
  return raw.replace(/[_-]+/g,' ').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/\s+/g,' ').trim().replace(/^./,m=>m.toUpperCase());
}
function prModuleLabel(v) {
  const key=String(v||'').toLowerCase();
  const labels={todos:'Todos',alertas:'Alertas',estudiante:'Estudiante',docente:'Docencia',admin:'Administración',certificados:'Certificados',examenes:'Exámenes',notas:'Notas',conape:'CONAPE',reportes:'Reportes'};
  return labels[key] || prFriendlyLabel(v);
}
function prOperatorText(v, fallback = '—') {
  let s=String(v==null?'':v).trim();
  if(!s)return fallback;
  s=s.replace(/\bApps? Script\b/gi,'sistema').replace(/\bbackend\b/gi,'sistema').replace(/\bendpoints?\b/gi,'acciones protegidas').replace(/\brouter\b/gi,'control de acceso').replace(/\bfn\s*[→-]\s*roles\b/gi,'acciones y roles');
  s=s.replace(/\b[a-z]+(?:[A-Z][A-Za-z0-9]*){1,}\b/g,m=>prActionLabel(m));
  s=s.replace(/\b[A-Z0-9]+(?:_[A-Z0-9]+)+\b/g,'regla interna');
  s=s.replace(/\bF\d+(?:\.\d+)?\b/g,'revisión de acceso');
  return s;
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
function prRoles(v) { const list=Array.isArray(v)?v:[v]; return list.filter(x=>String(x??'').trim()).map(prRoleLabel).join(', ') || '—'; }

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
      setErr(prSafeUserError(e?.message || String(e), 'No se pudo cargar la revisión de permisos. Intentá de nuevo.', 'cargar_permisos'));
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
      `Acciones protegidas revisadas: ${prNum(k.endpoints_revisados)}`,
      `Sin regla definida: ${prNum(k.endpoints_sin_mapa)}`,
      `Con diferencia: ${prNum(k.endpoints_con_diferencia)}`,
      `Vistas revisadas: ${prNum(k.vistas_revisadas)}`,
      '',
      'Riesgos:',
      ...(riesgos.length ? riesgos.map(r => `- [${r.status || 'info'}] ${prOperatorText(r.titulo, 'Revisión')}: ${prOperatorText(r.texto, 'Revisar configuración de acceso.')}`) : ['- Sin riesgos críticos visibles.']),
    ].join('\n');
    try { await navigator.clipboard.writeText(txt); alert('Resumen copiado.'); } catch (_) { alert(txt); }
  };

  const exportCsv = () => {
    const rows = [['Módulo','Acción','Roles esperados','Roles del sistema','Estado','Nota'], ...endpointsFiltrados.map(e => [prModuleLabel(e.modulo), prActionLabel(e.fn), prRoles(e.roles_esperados), prRoles(e.roles_backend), e.status, prOperatorText(e.nota, '')])];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `auditoria_permisos_roles_${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(a); a.click(); a.remove();
  };

  return <section data-screen-label="Admin · Permisos y roles" style={{ padding:22, display:'flex', flexDirection:'column', gap:16 }}>
    <PageHeader kicker="Seguridad" title={<>Permisos <em>y roles</em></>} sub="Auditoría de menú, acciones protegidas y reglas de acceso. Solo lectura: no modifica datos ni sesiones." />

    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <PermisosButton active={tab==='resumen'} onClick={() => setTab('resumen')}>Resumen</PermisosButton>
        <PermisosButton active={tab==='vistas'} onClick={() => setTab('vistas')}>Vistas por rol</PermisosButton>
        <PermisosButton active={tab==='endpoints'} onClick={() => setTab('endpoints')}>Acciones protegidas</PermisosButton>
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
    {loading && !data && <div style={{ padding:18, borderRadius:16, border:'1px solid var(--line)', background:'#fff', color:'var(--ink-3)' }}>Revisando permisos del sistema…</div>}

    {data && <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12 }}>
        <PermisosCard title="Estado general" value={prOperatorText(k.estado_general)} status={k.estado_status || 'info'} sub="Lectura de acceso" />
        <PermisosCard title="Acciones protegidas" value={prNum(k.endpoints_revisados)} status={prNum(k.endpoints_sin_mapa) ? 'bad' : prNum(k.endpoints_con_diferencia) ? 'warn' : 'ok'} sub={`${prNum(k.endpoints_sin_mapa)} sin regla · ${prNum(k.endpoints_con_diferencia)} diferencias`} onClick={() => setTab('endpoints')} />
        <PermisosCard title="Vistas" value={prNum(k.vistas_revisadas)} status="ok" sub="Menú esperado por rol" onClick={() => setTab('vistas')} />
        <PermisosCard title="Reglas de acceso" value={prNum(k.reglas_propiedad)} status="ok" sub="Estudiante/docente protegidos" onClick={() => setTab('propiedad')} />
      </div>

      {tab === 'resumen' && <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1.2fr) minmax(280px, .8fr)', gap:14 }}>
        <PermisosPanel title="Riesgos principales" sub="Lo que debe revisarse antes de producción abierta.">
          <div style={{ display:'grid', gap:10 }}>
            {(riesgos.length ? riesgos : [{ status:'ok', titulo:'Sin riesgos críticos', texto:'El mapa principal no reporta alertas críticas.' }]).map((r, i) => <div key={i} style={{ border:'1px solid var(--line)', borderRadius:14, background:'#fff', padding:13 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}><PermisosBadge status={r.status === 'error' ? 'bad' : r.status || 'info'} /><strong style={{ color:'var(--an-navy-ink)' }}>{prOperatorText(r.titulo, `Riesgo ${i+1}`)}</strong></div>
              <div style={{ color:'var(--ink-3)', fontSize:13, lineHeight:1.45 }}>{prOperatorText(r.texto, 'Revisar configuración de acceso.')}</div>
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

      {tab === 'vistas' && <PermisosPanel title="Vistas visibles por rol" sub="Matriz esperada del menú. Sirve para detectar opciones mal expuestas.">
        <PermisosTable rows={vistas} columns={[["rol","Rol"],["vista","Vista"],["label","Etiqueta"],["status","Estado"],["nota","Nota"]]} />
      </PermisosPanel>}

      {tab === 'endpoints' && <PermisosPanel title="Acciones protegidas por módulo" sub="Comparación entre roles esperados y roles definidos por el sistema.">
        <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:12 }}>
          {['todos','alertas','estudiante','docente','admin','certificados','examenes','notas','conape','reportes'].map(x => <PermisosButton key={x} active={filtro===x} danger={x==='alertas'} onClick={() => setFiltro(x)}>{prModuleLabel(x)}</PermisosButton>)}
        </div>
        <PermisosTable rows={endpointsFiltrados} columns={[["modulo","Módulo"],["fn","Acción"],["roles_esperados","Roles esperados"],["roles_backend","Roles del sistema"],["status","Estado"],["nota","Nota"]]} />
      </PermisosPanel>}

      {tab === 'propiedad' && <PermisosPanel title="Reglas de propiedad" sub="Reglas que evitan que un usuario vea expedientes ajenos.">
        <PermisosTable rows={propiedad} columns={[["rol","Rol"],["regla","Regla"],["endpoints","Acciones"],["status","Estado"],["nota","Nota"]]} />
      </PermisosPanel>}

      {tab === 'recomendaciones' && <PermisosPanel title="Recomendaciones" sub="Acciones sugeridas para cerrar seguridad antes de producción abierta.">
        <div style={{ display:'grid', gap:10 }}>
          {(recomendaciones.length ? recomendaciones : [{ status:'ok', titulo:'Sin recomendaciones pendientes', texto:'No se detectaron recomendaciones críticas.' }]).map((r,i) => <div key={i} style={{ border:'1px solid var(--line)', borderRadius:14, background:'#fff', padding:13 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:5 }}><PermisosBadge status={r.status === 'error' ? 'bad' : r.status || 'info'} /><strong style={{ color:'var(--an-navy-ink)' }}>{prOperatorText(r.titulo, `Recomendación ${i+1}`)}</strong></div>
            <div style={{ color:'var(--ink-3)', fontSize:13, lineHeight:1.45 }}>{prOperatorText(r.texto, 'Revisar configuración de acceso.')}</div>
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
  if (k === 'status') return <PermisosBadge status={v === 'ok' ? 'ok' : v === 'warn' ? 'warn' : v === 'error' || v === 'bad' ? 'bad' : 'info'}>{v === 'ok' ? 'OK' : v === 'warn' ? 'Revisar' : v === 'error' || v === 'bad' ? 'Crítico' : 'Info'}</PermisosBadge>;
  if (k === 'fn' || k === 'endpoint') return prActionLabel(v);
  if (k === 'roles_esperados' || k === 'roles_backend' || k === 'rol') return prRoles(v);
  if (k === 'endpoints') { const list=Array.isArray(v)?v:[v]; return list.filter(Boolean).map(prActionLabel).join(', ') || '—'; }
  if (k === 'modulo' || k === 'vista' || k === 'regla') return prFriendlyLabel(v);
  if (k === 'nota' || k === 'label') return prOperatorText(v);
  if (Array.isArray(v)) return v.map(x=>prFriendlyLabel(x)).join(', ');
  return prOperatorText(v);
}
const thPR = { textAlign:'left', padding:'10px 11px', fontSize:11, fontWeight:900, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--ink-2)', whiteSpace:'nowrap' };
const tdPR = { padding:'10px 11px', borderTop:'1px solid var(--line)', fontSize:12.5, color:'var(--ink-2)', verticalAlign:'top' };

window.PermisosRolesView = PermisosRolesView;
