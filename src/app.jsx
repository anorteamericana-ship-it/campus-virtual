// F95.1_20260621_EXAMENES_MATCHING_PUBLICO_SEGURO
// F92.7_20260620_EXAMENES_UNIFICADOS_Y_CIERRE_SEGURO
// F92.5_20260620_CAMPUS_ESTABLE_CARGA_SEGURA
// F89_20260620_AVISO_CIERRE_NO_INTRUSIVO_EXPEDIENTE_ESTUDIANTIL
/* global React, ReactDOM, Toast, Sidebar, getSesion, setSesion,
   StudentDashboard, StudentPortalView, NotasView, TareasView, MaterialesView, InfoProgramaView, ICANView, ICANViewNew,
   MensajesView, PagosView, CertificadosView, PerfilView,
   ExamenOralView, GruposView, AsistenciaView, CronogramaDocenteSeguroF82,
   AdminDashboard, AdminGruposView, WelcomeBanner, MatriculasView, AdminEstudiantesView,
   CronogramaModulo, CronogramaGrupo, BuscadorEstudiantes, ImportadorBancario, AplicarPago,
   VistaDocente, PanelAdminSupervision, PanelSuspensiones, SolicitudesPagoView,
   AuditoriaAcademicaView, DiagnosticoInternoView, DocenteOperativoView, ConapeCobranzaView, ReportesAdminView,
   SolicitudesUnificadasView, SolicitudesEstudianteView, LazyModuleView */

// ── Placeholder para ítems del menú admin marcados "Próximamente" ──────
// (Bloque 2: docentes / horas / ican / finanzas / reportes / config no
// están conectados. En el sidebar se ven atenuados y no navegan; este
// componente es una red de seguridad por si alguien llega vía URL/state
// antiguo. NO renderiza datos demo.)
function ProximamenteView({ title }) {
  return (
    <div data-screen-label={'Admin · ' + title + ' (próximamente)'} style={{
      maxWidth: 640, margin: '64px auto', padding: '28px 30px',
      background: 'var(--surface-2)',
      border: '1px dashed var(--line-2)',
      borderRadius: 'var(--r-md)',
      fontFamily: 'var(--f-sans)',
      textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 10px', borderRadius: 999,
        background: 'color-mix(in srgb, var(--ink-3) 18%, transparent)',
        color: 'var(--ink-2)', fontSize: 10.5, fontWeight: 800,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 14,
      }}>Próximamente</div>
      <div style={{ fontFamily: 'var(--f-serif)', fontSize: 26, fontWeight: 500,
                    color: 'var(--an-navy-ink)', letterSpacing: '-0.02em', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
        Este módulo aún no está conectado. Lo habilitamos en una próxima
        iteración, con datos reales.
      </div>
    </div>
  );
}


// F96.5-UX-G · rutas diferidas por pantalla + validación estática de dependencias.
function LazyRoute({ title, component, files, ...props }) {
  if (typeof LazyModuleView !== 'function') return <ModuloNoDisponibleView titulo={title || component} />;
  return <LazyModuleView title={title || component} component={component} files={files || []} props={props} />;
}
const F96_LAZY = {
  student_dashboard: ['src/student_dashboard.jsx?v=F96.5G'],
  student_modules: ['src/panel_suspensiones.jsx?v=F96.5G','src/solicitudes_pago.jsx?v=F96.5G','src/solicitudes_unificadas.jsx?v=F96.5G','src/student_modules.jsx?v=F96.5G'],
  syllabus_views: ['src/syllabus_views.jsx?v=F96.5G'],
  teacher_views: ['src/vista_docente.jsx?v=F96.5G','src/teacher_views.jsx?v=F96.5G'],
  vista_docente: ['src/vista_docente.jsx?v=F96.5G'],
  admin_views: ['src/becas_admin.jsx?v=F96.5G','src/admin_views.jsx?v=F96.5G'],
  admin_students: ['src/admin_students.jsx?v=F96.5G'],
  matriculas: ['src/matriculas_admin.jsx?v=F96.5G','src/matriculas_calendario.jsx?v=F96.5G','src/matriculas.jsx?v=F96.5G'],
  cronograma: ['src/cronograma.jsx?v=F96.5G'],
  cronograma_todos: ['src/cronograma_todos.jsx?v=F96.5G'],
  cronograma_grupo: ['src/vista_docente.jsx?v=F96.5G','src/cronograma_todos.jsx?v=F96.5G','src/cronograma_grupo.jsx?v=F96.5G'],
  calendario_grupo: ['src/vista_docente.jsx?v=F96.5G','src/cronograma_todos.jsx?v=F96.5G','src/cronograma_grupo.jsx?v=F96.5G','src/admin_students.jsx?v=F96.5G','src/calendario_grupo.jsx?v=F96.5G'],
  docente_operativo: ['src/vista_docente.jsx?v=F96.5G','src/teacher_views.jsx?v=F96.5G','src/docente_operativo.jsx?v=F96.5G'],
  buscador: ['src/buscador.jsx?v=F96.5G'],
  banco: ['src/importador_banco.jsx?v=F96.5G'],
  aplicar_pago: ['src/aplicar_pago.jsx?v=F96.5G'],
  conape: ['src/conape_cobranza.jsx?v=F96.5G'],
  supervision: ['src/vista_docente.jsx?v=F96.5G','src/panel_admin_supervision.jsx?v=F96.5G'],
  auditoria: ['src/auditoria_academica.jsx?v=F96.5G'],
  diagnostico: ['src/diagnostico_interno.jsx?v=F96.5G'],
  permisos: ['src/permisos_roles.jsx?v=F96.5G'],
  reportes: ['src/reportes_admin.jsx?v=F96.5G'],
  inscripcion_admin: ['src/inscripcion_admin.jsx?v=F96.5G'],
  solicitudes: ['src/panel_suspensiones.jsx?v=F96.5G','src/solicitudes_pago.jsx?v=F96.5G','src/solicitudes_unificadas.jsx?v=F96.5G'],
};
// F96.2-LAZY-E · expone el mapa para prueba controlada en navegador.
// No cambia navegación: permite ejecutar window.anLazyCampus.validateMap(window.F96_LAZY_MAP)
// durante QA para detectar rutas o archivos diferidos antes de abrir grupos.
try { window.F96_LAZY_MAP = F96_LAZY; } catch(_) {}


// F92.5: envoltorios seguros para módulos externos. Si un archivo opcional
// no cargó, el Campus sigue funcionando y muestra un aviso en lugar de una
// pantalla completamente en blanco.
function ModuloNoDisponibleView({ titulo = 'Módulo temporalmente no disponible' }) {
  return (
    <div data-screen-label={'Campus · ' + titulo} style={{
      maxWidth: 720, margin: '56px auto', padding: '28px 30px',
      background: 'var(--surface, #fff)', border: '1px solid var(--line, #e5e0d8)',
      borderRadius: 18, boxShadow: 'var(--sh-1, 0 8px 30px rgba(0,0,0,.08))',
      fontFamily: 'var(--f-sans, system-ui)', textAlign: 'center'
    }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--an-granate, #7A1E2C)' }}>Campus Virtual</div>
      <div style={{ fontFamily: 'var(--f-serif, Georgia, serif)', fontSize: 28, color: 'var(--an-navy-ink, #001E47)', marginTop: 8 }}>{titulo}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3, #6B7280)', lineHeight: 1.6, marginTop: 10 }}>
        Recargá la página. Si el problema continúa, el archivo del módulo no terminó de publicarse en GitHub.
      </div>
      <button type="button" className="btn btn-primary" onClick={() => window.location.reload()} style={{ marginTop: 18 }}>Recargar</button>
    </div>
  );
}

function SolicitudesEstudianteSafe(props) {
  return typeof SolicitudesEstudianteView === 'function'
    ? <SolicitudesEstudianteView {...props} />
    : <ModuloNoDisponibleView titulo="Solicitudes del estudiante" />;
}

function SolicitudesUnificadasSafe(props) {
  return typeof SolicitudesUnificadasView === 'function'
    ? <SolicitudesUnificadasView {...props} />
    : <ModuloNoDisponibleView titulo="Solicitudes administrativas" />;
}


async function postAppF87(fn, payload = {}, timeoutMs = 30000) {
  const url = window.APPS_SCRIPT_URL;
  if (!url) return { ok:false, error:'Backend no configurado.' };
  const token = typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${url}?fn=${encodeURIComponent(fn)}`, {
      method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({fn, token, ...payload}), signal:controller?.signal,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    return data || {ok:false,error:'Respuesta vacía.'};
  } catch (e) {
    return {ok:false,error:e?.name==='AbortError'?'El backend tardó demasiado.':(e?.message||String(e))};
  } finally { if (timer) clearTimeout(timer); }
}

function appTeacherGroupLabelF88(code) {
  const raw=String(code||'').trim().toUpperCase();
  const cycle=(raw.split('-').filter(Boolean).pop()||'').trim();
  const m=raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})-/) || raw.match(/-(LM|KJ|LJ|L4|SA|SAB|L|K|M|J|V|D)(\d{2})/);
  const day=({LM:'Lunes y miércoles',KJ:'Martes y jueves',LJ:'Lunes y jueves',L4:'Lunes a jueves',SA:'Sábados',SAB:'Sábados',L:'Lunes',K:'Martes',M:'Miércoles',J:'Jueves',V:'Viernes',D:'Domingos'})[m?.[1]] || 'Grupo';
  const hours=({'69':'6pm a 9pm','94':'9am a 4pm','96':'9am a 12pm'})[m?.[2]] || '';
  return `${day}${hours?' de '+hours:''}${cycle?' - '+cycle:''}`;
}
function appTimeMinutesF88(v) {
  const m=String(v||'').trim().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if(!m)return null; let h=Number(m[1]), ap=(m[3]||'').toLowerCase();
  if(ap==='pm'&&h<12)h+=12; if(ap==='am'&&h===12)h=0;
  return h*60+Number(m[2]||0);
}
function appSessionReminderF89(s,l,nowMs) {
  const now=new Date(nowMs||Date.now());
  const end=appTimeMinutesF88(s?.HORA_PROGRAMADA_FIN||s?.HORA_FIN||s?.hora_fin||l?.hora_fin||'');
  const date=String(l?.fecha||s?.FECHA||s?.fecha||'').slice(0,10);
  const localIso=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if(date&&date>localIso)return null;
  if(date&&date<localIso)return {bg:'#C62828',shadow:'rgba(198,40,40,.28)',ink:'#9B1C1C',label:'● SESIÓN ACTIVA · PENDIENTE DE CIERRE'};
  if(end==null)return null;
  const remaining=end-(now.getHours()*60+now.getMinutes());
  if(remaining>10)return null;
  if(remaining<=0)return {bg:'#C62828',shadow:'rgba(198,40,40,.28)',ink:'#9B1C1C',label:'● SESIÓN ACTIVA · PENDIENTE DE CIERRE'};
  return {bg:'#B77900',shadow:'rgba(183,121,0,.25)',ink:'#805500',label:'● SESIÓN ACTIVA · PENDIENTE DE CIERRE'};
}
function TeacherActiveSessionBanner({ state, viewKey }) {
  const s=state?.sesion, l=state?.leccion;
  const [clock,setClock]=React.useState(Date.now());
  const [hidden,setHidden]=React.useState(false);
  React.useEffect(()=>{const id=setInterval(()=>setClock(Date.now()),30000);return()=>clearInterval(id);},[]);
  React.useEffect(()=>setHidden(false),[viewKey,s?.SESION_ID,s?.sesion_id]);
  if (!s || String(s.ESTADO||s.estado||'').toUpperCase()!=='ABIERTA') return null;
  const tone=appSessionReminderF89(s,l,clock);
  if(!tone||hidden)return null;
  const lec=Number(s.LECCION||s.leccion||0), grupo=s.COD_GRUPO||s.cod_grupo||'';
  const oralLabel=({9:'1.er examen oral',17:'2.º examen oral',25:'3.er examen oral',31:'4.º examen oral'})[lec];
  return <div role="status" style={{position:'sticky',top:0,zIndex:110,margin:'0 18px 14px',padding:'11px 14px',borderRadius:'0 0 12px 12px',background:tone.bg,color:'#FFF',boxShadow:`0 8px 24px ${tone.shadow}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap'}}>
    <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em'}}>{tone.label}</div><div style={{fontSize:13,fontWeight:800,marginTop:2}}>{appTeacherGroupLabelF88(grupo)} · Lección {String(lec).padStart(2,'0')}{oralLabel?` · ${oralLabel}`:''}</div><div style={{fontSize:10.5,opacity:.9,marginTop:2}}>La sesión seguirá activa hasta guardar asistencia y cerrar la clase.</div></div>
    <button type="button" onClick={()=>setHidden(true)} style={{border:'1px solid rgba(255,255,255,.55)',background:'#FFF',color:tone.ink,borderRadius:9,padding:'8px 12px',fontWeight:900,cursor:'pointer'}}>OCULTAR</button>
  </div>;
}

// ── Exámenes escritos — iframe aislado con backend oficial ───────────────
// El módulo monta su propio React sobre modulos/examenes.html y consulta Apps
// Script con el token del Campus. El aislamiento evita colisiones de scripts.
function ExamenesIframePanel({ view, screenLabel, eyebrow, description, badge, iframeTitle, topContent, hideHeader = false }) {
  const src = `modulos/examenes.html?view=${view}&v=F95.1`;
  return (
    <section data-screen-label={screenLabel} style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      minHeight: 'calc(100vh - 28px)', padding: 18,
    }}>
      {!hideHeader && <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        padding: '14px 16px', background: 'var(--surface, #fff)',
        border: '1px solid var(--line, #e5e0d8)', borderRadius: 'var(--r-lg, 14px)',
        boxShadow: 'var(--sh-1, 0 8px 30px rgba(0,0,0,0.08))',
      }}>
        <div>
          <div style={{fontSize:10.5,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--an-granate, #7A1E2C)',marginBottom:4}}>{eyebrow}</div>
          <div style={{fontFamily:'var(--f-serif, Georgia, serif)',fontSize:25,fontWeight:500,color:'var(--an-navy-ink, #001E47)',letterSpacing:'-0.02em'}}>Exámenes escritos</div>
          <div style={{fontSize:12.5,color:'var(--ink-3, #6B7280)',marginTop:3}}>{description}</div>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'7px 11px',borderRadius:999,background:'color-mix(in srgb, var(--an-gold, #D6A94A) 16%, transparent)',color:'var(--ink-2, #4A413A)',fontSize:11.5,fontWeight:800,whiteSpace:'nowrap'}}>{badge}</div>
      </div>}

      {topContent || null}

      <div style={{
        flex: 1, minHeight: 640,
        background: 'var(--surface, #fff)',
        border: '1px solid var(--line, #e5e0d8)',
        borderRadius: 'var(--r-lg, 14px)', overflow: 'hidden',
        boxShadow: 'var(--sh-1, 0 8px 30px rgba(0,0,0,0.08))',
      }}>
        <iframe
          key={`${view}-F95.1`}
          title={iframeTitle}
          src={src}
          style={{ width: '100%', height: 'calc(100vh - 184px)', minHeight: 640, border: 0, display: 'block' }}
          loading="eager"
          onLoad={(e) => { try { e.currentTarget.contentWindow.scrollTo(0, 0); } catch (_) {} }}
          referrerPolicy="same-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
    </section>
  );
}


async function appPostF91(fn, payload = {}, timeoutMs = 45000) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
      method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({ fn, token, ...payload }), signal:ctrl.signal,
    });
    const data = await res.json();
    if (!data?.ok) throw new Error(data?.mensaje || data?.error || 'No se pudo completar la operación.');
    return data;
  } catch (e) {
    if (e?.name === 'AbortError') throw new Error('La consulta tardó demasiado. Presioná Recargar para intentarlo de nuevo.');
    throw e;
  } finally { clearTimeout(timer); }
}
function reposEstadoF91(estado) {
  const e=String(estado||'').toUpperCase();
  const map={PENDIENTE_JUSTIFICACION:['Pendiente de justificación','#8B5A00','#FFF4D6'],JUSTIFICADA_GRATUITA:['Autorizada sin costo','#146C2E','#EAF8EF'],PENDIENTE_PAGO:['Pendiente de pago','#991B1B','#FDECEA'],PAGADA_AUTORIZADA:['Pago confirmado','#146C2E','#EAF8EF'],PROGRAMADA:['Programada','#0C4F86','#E7F1FA'],ENTREGADA_POR_REVISAR:['Entregada · por revisar','#805500','#FFF4D6'],APLICADA:['Aplicada','#40516A','#EEF2F7'],VENCIDA_0:['Vencida · nota 0','#991B1B','#FDECEA'],CANCELADA:['Cancelada','#5F6875','#EEF2F7']};
  return map[e]||[e||'Pendiente','#5F6875','#EEF2F7'];
}
function fechaF91(v){const s=String(v||'').slice(0,10);if(!s)return'—';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?s:d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'});}
function ReposicionesPanelF91({ role='teacher', onNavigate }) {
  const sessionRole=String((window.getSesion&&window.getSesion()||{}).rol||'').toLowerCase();
  const canResolve=role==='admin'&&sessionRole==='superadmin';
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[busy,setBusy]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');appPostF91('reposListarExamenes').then(r=>setRows(r.rows||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const act=async(row,accion)=>{let payload={reposicion_id:row.REPOSICION_ID,accion};let endpoint='reposResolverExamen';if(accion==='APROBAR_JUSTIFICACION'||accion==='RECHAZAR_JUSTIFICACION'){endpoint='reposResolverSolicitudF92';const nota=window.prompt(accion==='APROBAR_JUSTIFICACION'?'Justificación aprobada. Agregá una observación breve:':'Indicá por qué la justificación no fue aceptada:','');if(nota===null)return;payload.justificacion=nota;payload.admin_nota=nota;}if(accion==='CONFIRMAR_PAGO'){endpoint='reposResolverSolicitudF92';const ref=window.prompt('Referencia o número del pago de ₡10.000:','');if(ref===null)return;payload.pago_referencia=ref;payload.admin_nota=ref;}if(accion==='PROGRAMAR_ESCRITO'){const fecha=window.prompt('Fecha de aplicación (AAAA-MM-DD):',row.FECHA_LIMITE||'');if(fecha===null)return;const hi=window.prompt('Hora de inicio (HH:MM):','18:00');if(hi===null)return;const hf=window.prompt('Hora de cierre (HH:MM):','19:00');if(hf===null)return;payload={reposicion_id:row.REPOSICION_ID,fecha_programada:fecha,hora_inicio:hi,hora_fin:hf};endpoint='reposProgramarEscrito';}if(accion==='COORDINAR_ORAL'){const fecha=window.prompt('Fecha tentativa de reposición (AAAA-MM-DD). Podés iniciar la prueba antes si ambos están disponibles:',row.FECHA_PROGRAMADA||row.FECHA_LIMITE||'');if(fecha===null)return;payload={reposicion_id:row.REPOSICION_ID,fecha_tentativa:fecha};endpoint='reposCoordinarOralF926';}setBusy(row.REPOSICION_ID+accion);try{await appPostF91(endpoint,payload);await load();}catch(e){setError(e.message);}finally{setBusy('');}};
  const visible=rows.filter(r=>role==='admin'||!['APLICADA','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));
  const sectionTitle=role==='teacher'?'Reposiciones orales':'Reposiciones de examen';
  const sectionKicker=role==='teacher'?'ORAL · AUTORIZACIONES':'CONTROL ADMINISTRATIVO';
  if(loading)return <div style={{border:'1px solid var(--line)',borderRadius:14,background:'#fff',overflow:'hidden'}}><div style={{padding:'13px 15px',borderBottom:'1px solid var(--line)',background:'#F8FAFE'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>{sectionKicker}</div><div style={{fontSize:18,fontWeight:900,marginTop:3}}>{sectionTitle}</div></div><div style={{padding:18,color:'var(--ink-3)',fontSize:13}}>Consultando reposiciones autorizadas…</div></div>;
  if(error)return <div style={{border:'1px solid #F0B9B9',borderRadius:14,background:'#fff',overflow:'hidden'}}><div style={{padding:'13px 15px',borderBottom:'1px solid #F0B9B9',background:'#FDECEA'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#8B1F1F'}}>{sectionKicker}</div><div style={{fontSize:18,fontWeight:900,marginTop:3,color:'#6B1717'}}>{sectionTitle}</div></div><div style={{padding:16,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><span style={{fontSize:12,color:'#8B1F1F'}}>{error}</span><button className="btn btn-ghost" onClick={load}>Recargar</button></div></div>;
  if(!visible.length)return <div style={{border:'1px solid var(--line)',borderRadius:14,background:'#fff',overflow:'hidden'}}><div style={{padding:'13px 15px',borderBottom:'1px solid var(--line)',background:'#F8FAFE'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>{sectionKicker}</div><div style={{fontSize:18,fontWeight:900,marginTop:3}}>{sectionTitle}</div></div><div style={{padding:18,color:'var(--ink-3)',fontSize:13}}>No hay reposiciones orales autorizadas pendientes.</div></div>;
  return <div style={{border:'1px solid var(--line)',borderRadius:14,background:'#fff',overflow:'hidden'}}>
    <div style={{padding:'13px 15px',borderBottom:'1px solid var(--line)',background:'#F8FAFE'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>{sectionKicker}</div><div style={{fontSize:18,fontWeight:900,marginTop:3}}>{sectionTitle}</div><div style={{fontSize:12.5,color:'var(--ink-2)',marginTop:3}}>{role==='teacher'?'Coordiná una fecha tentativa o iniciá la prueba cuando el estudiante esté disponible.':'Cada reposición es individual y conserva su fecha límite.'}</div></div>
    <div style={{display:'flex',flexDirection:'column',gap:9,padding:10}}>{visible.map(row=>{const teacherAuthorized=role==='teacher'&&String(row.TIPO_EXAMEN||'').toUpperCase()==='ORAL';const [label0,ink0,bg0]=reposEstadoF91(row.ESTADO);const label=teacherAuthorized?(row.FECHA_PROGRAMADA?'FECHA TENTATIVA REGISTRADA':'PENDIENTE DE COORDINAR FECHA DE REPOSICIÓN'):label0;const ink=teacherAuthorized?'#0C4F86':ink0;const bg=teacherAuthorized?'#E7F1FA':bg0;const authorized=teacherAuthorized||['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','PROGRAMADA'].includes(String(row.ESTADO||'').toUpperCase());return <div key={row.REPOSICION_ID} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'center',padding:'13px 14px',border:'1px solid var(--line)',borderRadius:12,background:teacherAuthorized?'linear-gradient(135deg,#fff 0%,#F7FBFF 100%)':'#fff'}}>
      <div><div style={{fontSize:13,fontWeight:850}}>{row.NOMBRE} <span style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)'}}>#{row.COD_ESTUDIANTE}</span></div><div style={{fontSize:11,color:'var(--ink-3)',marginTop:3}}>{appTeacherGroupLabelF88(row.COD_GRUPO)} · Lección {String(row.LECCION).padStart(2,'0')} · {row.TIPO_EXAMEN} · límite {fechaF91(row.FECHA_LIMITE)}</div>{teacherAuthorized&&<div style={{fontSize:11.5,color:'#0C4F86',marginTop:5,fontWeight:750}}>Fecha tentativa: {row.FECHA_PROGRAMADA?fechaF91(row.FECHA_PROGRAMADA):'sin coordinar'} · La prueba puede iniciarse antes de esa fecha.</div>}<span style={{display:'inline-flex',marginTop:7,padding:'4px 8px',borderRadius:999,background:bg,color:ink,fontSize:9.5,fontWeight:900}}>{label}</span></div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap',justifyContent:'flex-end'}}>{canResolve&&String(row.ESTADO).toUpperCase()==='PENDIENTE_JUSTIFICACION'&&<><button className="btn btn-ghost" disabled={!!busy} onClick={()=>act(row,'RECHAZAR_JUSTIFICACION')}>Requiere ₡10.000</button><button className="btn btn-primary" disabled={!!busy} onClick={()=>act(row,'APROBAR_JUSTIFICACION')}>Aprobar sin costo</button></>}{canResolve&&String(row.ESTADO).toUpperCase()==='PENDIENTE_PAGO'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>act(row,'CONFIRMAR_PAGO')}>Confirmar pago</button>}{role==='admin'&&authorized&&String(row.TIPO_EXAMEN).toUpperCase()==='ESCRITO'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>act(row,'PROGRAMAR_ESCRITO')}>Programar escrito</button>}{role==='teacher'&&teacherAuthorized&&<><button className="btn btn-ghost" disabled={!!busy} onClick={()=>act(row,'COORDINAR_ORAL')}>{row.FECHA_PROGRAMADA?'CAMBIAR FECHA TENTATIVA':'COORDINAR FECHA TENTATIVA'}</button><button className="btn btn-primary" disabled={!!busy} onClick={()=>onNavigate&&onNavigate('examen_oral',{oral:{grupo:row.COD_GRUPO,nivel:row.NIVEL,leccion:Number(row.LECCION),fecha:row.FECHA_ORIGINAL,reposicion_id:row.REPOSICION_ID}})}>APLICAR REPOSICIÓN ORAL</button></>}</div>
    </div>})}</div>
  </div>;
}

function ExamenesAdminPanel() {
  const [tab,setTab]=React.useState('oral');
  const [nivel,setNivel]=React.useState('B1');
  const [leccion,setLeccion]=React.useState(9);
  const ses=typeof getSesion==='function'?getSesion():{};
  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';
  const oralSrc=`modulos/examen_oral.html?preview=1&nivel=${encodeURIComponent(nivel)}&leccion=${leccion}&v=F92.6`;
  return <section data-screen-label="Admin · Exámenes" style={{display:'flex',flexDirection:'column',gap:14}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',padding:'14px 16px',background:'#fff',border:'1px solid var(--line)',borderRadius:14}}>
      <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>EXÁMENES INSTITUCIONALES</div><div style={{fontSize:20,fontWeight:900,marginTop:2}}>Vista previa y administración</div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:3}}>{superadmin?'Superadmin puede administrar los escritos; el oral se muestra como vista previa segura.':'Vista previa segura sin modificación de notas ni contenido.'}</div></div>
      <div style={{display:'flex',gap:6,padding:4,border:'1px solid var(--line)',borderRadius:10,background:'#F8FAFE'}}><button className={tab==='oral'?'btn btn-primary':'btn btn-ghost'} onClick={()=>setTab('oral')}>Examen oral</button><button className={tab==='written'?'btn btn-primary':'btn btn-ghost'} onClick={()=>setTab('written')}>Exámenes escritos</button></div>
    </div>
    <ReposicionesPanelF91 role="admin" />
    {tab==='oral'?<>
      <div style={{display:'flex',gap:9,alignItems:'end',flexWrap:'wrap',padding:'11px 13px',background:'#fff',border:'1px solid var(--line)',borderRadius:12}}><label style={{fontSize:10,fontWeight:900,color:'var(--ink-3)'}}>NIVEL<select value={nivel} onChange={e=>setNivel(e.target.value)} style={{display:'block',marginTop:4,padding:'8px 10px',border:'1px solid var(--line)',borderRadius:8}}>{['B1','B2','I1','I2'].map(n=><option key={n}>{n}</option>)}</select></label><label style={{fontSize:10,fontWeight:900,color:'var(--ink-3)'}}>EXAMEN<select value={leccion} onChange={e=>setLeccion(Number(e.target.value))} style={{display:'block',marginTop:4,padding:'8px 10px',border:'1px solid var(--line)',borderRadius:8}}>{[[9,'1.er oral · Units 1–4'],[17,'2.º oral · Units 5–8'],[25,'3.er oral · Units 9–12'],[31,'4.º oral · Units 13–16']].map(([n,t])=><option key={n} value={n}>{t}</option>)}</select></label></div>
      <div style={{background:'#fff',border:'1px solid var(--line)',borderRadius:14,overflow:'hidden'}}><iframe key={oralSrc} src={oralSrc} title="Vista previa institucional del examen oral" style={{display:'block',width:'100%',height:'1900px',border:0}} /></div>
    </>:<ExamenesIframePanel view={superadmin?'admin':'preview'} screenLabel={superadmin?'Superadmin · Exámenes escritos':'Admin · Vista previa escrita'} eyebrow="Exámenes escritos institucionales" description={superadmin?'Catálogo maestro y herramientas administrativas de exámenes escritos.':'Vista previa institucional sin operaciones administrativas.'} badge={superadmin?'Administración':'Solo lectura'} iframeTitle="Panel de exámenes escritos" />}
  </section>;
}

const APP_ORAL_DEFS_F927 = [
  {key:'ORAL_1',leccion:9,titulo:'1.er Examen Oral'},
  {key:'ORAL_2',leccion:17,titulo:'2.º Examen Oral'},
  {key:'ORAL_3',leccion:25,titulo:'3.er Examen Oral'},
  {key:'ORAL_4',leccion:31,titulo:'4.º Examen Oral'},
];
function appOralTypeF927(e){
  const direct=String(e?.tipo_oficial||e?.tipo||'').toUpperCase();
  if(APP_ORAL_DEFS_F927.some(d=>d.key===direct))return direct;
  const t=String(e?.titulo||'').toLowerCase();
  return t.includes('1.er examen oral')?'ORAL_1':t.includes('2.º examen oral')?'ORAL_2':t.includes('3.er examen oral')?'ORAL_3':t.includes('4.º examen oral')?'ORAL_4':'';
}
function appLevelOrderF927(n){return({B1:1,B2:2,I1:3,I2:4})[String(n||'').toUpperCase()]||0;}
function StudentOralOverviewF927(){
  const ses=typeof getSesion==='function'?getSesion():{};
  const codigo=ses?.codigo||ses?.cedula||'';
  const [state,setState]=React.useState({loading:true,error:'',evals:[],repos:[],nivelActivo:''});
  const load=React.useCallback(()=>{
    if(!codigo){setState({loading:false,error:'Sin código de estudiante.',evals:[],repos:[],nivelActivo:''});return;}
    setState(s=>({...s,loading:true,error:''}));
    appPostF91('getMisNotasF921',{codigo},60000)
      .then(n=>{
        const evals=n.evaluaciones||[];
        const repos=evals.filter(e=>e.reposicion_id).map(e=>({
          REPOSICION_ID:e.reposicion_id,
          NIVEL:e.nivel,
          LECCION:e.leccion,
          ESTADO:e.estado,
          SOLICITUD_ESTADO:e.solicitud_estado||'',
          FECHA_PROGRAMADA:e.fecha_programada||'',
          FECHA_ORIGINAL:e.fecha_original||'',
          FECHA_LIMITE:e.fecha_limite||''
        }));
        setState({loading:false,error:'',evals,repos,nivelActivo:n.nivel_activo||''});
      })
      .catch(e=>setState({loading:false,error:e.message||String(e),evals:[],repos:[],nivelActivo:''}));
  },[codigo]);
  React.useEffect(()=>{load();},[load]);
  const activeRepos=state.repos.filter(r=>!['APLICADA','VENCIDA_0','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));
  const levels=[...new Set(state.evals.map(e=>String(e.nivel||'').toUpperCase()).filter(Boolean))].sort((a,b)=>appLevelOrderF927(a)-appLevelOrderF927(b));
  const level=String(state.nivelActivo||activeRepos[0]?.NIVEL||ses?.nivel_activo||ses?.nivel||levels[levels.length-1]||'').toUpperCase();
  const oralRows=APP_ORAL_DEFS_F927.map(def=>{
    const ev=state.evals.find(e=>String(e.nivel||'').toUpperCase()===level&&appOralTypeF927(e)===def.key)||{};
    const rep=activeRepos.find(r=>String(r.NIVEL||'').toUpperCase()===level&&Number(r.LECCION||0)===def.leccion)||null;
    const registered=ev.registrada===true||String(ev.estado||'').toUpperCase()==='REGISTRADA';
    let label='Sin nota registrada',tone='#991B1B',bg='#FDECEA';
    if(registered){label=`Nota ${Number(ev.nota||0)}/${Number(ev.max||15)}`;tone='#176B36';bg='#E7F4EA';}
    else if(rep){
      const st=String(rep.ESTADO||'').toUpperCase(),sol=String(rep.SOLICITUD_ESTADO||'').toUpperCase();
      if(['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','AUTORIZADA','PROGRAMADA'].includes(st)){label=rep.FECHA_PROGRAMADA?`Fecha tentativa: ${fechaF91(rep.FECHA_PROGRAMADA)}`:'Autorizada · pendiente de coordinar';tone='#0C4F86';bg='#E7F1FA';}
      else if(sol==='ENVIADA'||sol==='PAGO_REPORTADO'){label='Solicitud en proceso';tone='#805500';bg='#FFF4D6';}
      else {label='Reposición pendiente';tone='#805500';bg='#FFF4D6';}
    } else if(ev.fecha){label=`Programado: ${fechaF91(ev.fecha)}`;tone='#40516A';bg='#EEF2F7';}
    return {...def,ev,rep,label,tone,bg};
  });
  return <div style={{border:'1px solid var(--line)',borderRadius:14,background:'#fff',overflow:'hidden'}}>
    <div style={{padding:'13px 15px',borderBottom:'1px solid var(--line)',background:'#F8FAFE',display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>EVALUACIONES ORALES</div><div style={{fontSize:18,fontWeight:900,marginTop:3}}>Exámenes orales · {level||'nivel actual'}</div></div>{state.error&&<button className="btn btn-ghost" onClick={load}>Recargar</button>}</div>
    {state.loading?<div style={{padding:18,color:'var(--ink-3)'}}>Consultando evaluaciones orales…</div>:state.error?<div style={{padding:18,color:'#991B1B'}}>{state.error}</div>:<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:10,padding:12}}>{oralRows.map(r=><div key={r.key} style={{border:'1px solid var(--line)',borderRadius:12,padding:13}}><div style={{fontSize:12.5,fontWeight:850}}>{r.titulo}</div><div style={{fontSize:10.5,color:'var(--ink-3)',marginTop:3}}>Lección {String(r.leccion).padStart(2,'0')}</div><span style={{display:'inline-flex',marginTop:9,padding:'5px 8px',borderRadius:999,background:r.bg,color:r.tone,fontSize:10,fontWeight:900}}>{r.label}</span></div>)}</div>}
  </div>;
}

function TeacherWrittenPreviewModalF950({ activation, group, leccion, onClose }) {
  if (!activation) return null;
  const nivel=activation.NIVEL||activation.nivel||'';
  const test=activation.TEST_CODE||activation.test_code||(Number(leccion)===32?'TEST2':'TEST1');
  const opcion=activation.OPCION||activation.opcion||'A';
  const plan=String(activation.PLAN||activation.plan||'CON_INA').toLowerCase();
  const src=`modulos/examenes.html?view=teacher_preview&nivel=${encodeURIComponent(nivel)}&test=${encodeURIComponent(test)}&opcion=${encodeURIComponent(opcion)}&plan=${encodeURIComponent(plan)}&grupo=${encodeURIComponent(group||'')}&v=F95.1`;
  return <div role="dialog" aria-modal="true" aria-label="Modelo del examen escrito" style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,20,48,.72)',padding:18,display:'flex',alignItems:'stretch',justifyContent:'center'}} onClick={onClose}>
    <div style={{width:'min(1500px,100%)',height:'calc(100vh - 36px)',background:'#F7F3EC',borderRadius:18,overflow:'hidden',boxShadow:'0 26px 80px rgba(0,0,0,.35)',display:'flex',flexDirection:'column'}} onClick={e=>e.stopPropagation()}>
      <div style={{padding:'11px 14px',background:'#fff',borderBottom:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
        <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>MODELO DEL EXAMEN · SOLO DOCENTE</div><div style={{fontSize:15,fontWeight:900,marginTop:2}}>{appTeacherGroupLabelF88(group)} · {nivel} · {test==='TEST2'?'2.º escrito':'1.er escrito'} · Opción {opcion}</div></div>
        <button className="btn btn-ghost" type="button" onClick={onClose}>CERRAR MODELO</button>
      </div>
      <iframe key={src} title="Modelo del examen para el docente" src={src} style={{width:'100%',flex:1,border:0,display:'block'}} loading="eager" referrerPolicy="same-origin" sandbox="allow-scripts allow-same-origin allow-presentation" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" />
    </div>
  </div>;
}

function WrittenSessionCardF929({ session }) {
  const lec=Number(session?.LECCION||session?.leccion||0);
  const group=session?.COD_GRUPO||session?.cod_grupo||'';
  const level=session?.NIVEL||session?.nivel||'';
  const [state,setState]=React.useState({loading:true,error:'',assigned:false,data:null});
  const [previewOpen,setPreviewOpen]=React.useState(false);
  const load=React.useCallback(()=>{
    if(!group||!level||![18,32].includes(lec)){setState({loading:false,error:'',assigned:false,data:null});return;}
    setState({loading:true,error:'',assigned:false,data:null});
    appPostF91('examGetCronogramaExamAvailability',{cod_grupo:group,nivel:level,tipo:'ORDINARIO'},60000)
      .then(r=>setState({loading:false,error:'',assigned:r.assigned===true,data:r}))
      .catch(e=>setState({loading:false,error:e.message||String(e),assigned:false,data:null}));
  },[group,level,lec]);
  React.useEffect(()=>{load();},[load]);
  const title=lec===18?'1.er Examen Escrito':'2.º Examen Escrito';
  const activation=state.data?.activation||null;
  return <>
    <div style={{padding:'15px 17px',border:`2px solid ${state.assigned?'#2B8A57':state.error?'#C43C3C':'#0C4F86'}`,borderRadius:14,background:state.assigned?'#EAF8EF':state.error?'#FDECEA':'#E7F1FA',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
      <div>
        <div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:state.assigned?'#197044':state.error?'#8B1F1F':'#0C4F86'}}>ESCRITO · HABILITADO AUTOMÁTICAMENTE</div>
        <div style={{fontSize:19,fontWeight:900,color:state.assigned?'#145C38':state.error?'#6B1717':'#083B66',marginTop:3}}>{title}</div>
        <div style={{fontSize:12,color:'var(--ink-2)',marginTop:3}}>{appTeacherGroupLabelF88(group)} · Lección {String(lec).padStart(2,'0')}</div>
        <div style={{fontSize:12.5,color:'var(--ink-2)',marginTop:5}}>{state.loading?'Habilitando el examen para los estudiantes…':state.assigned?'El examen está abierto para el grupo. Usá el modelo para revisar preguntas, reproducir audio o mostrar solo lo que necesités en pantalla.':state.error||state.data?.mensaje||'No se pudo habilitar el examen escrito.'}</div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:9,flexWrap:'wrap'}}>
        {state.assigned&&<button className="btn btn-primary" type="button" style={{background:'#16834A',borderColor:'#16834A'}} onClick={()=>setPreviewOpen(true)}>VER MODELO DEL EXAMEN</button>}
        {!state.loading&&!state.assigned&&<button className="btn btn-ghost" type="button" onClick={load}>REINTENTAR</button>}
      </div>
    </div>
    {previewOpen&&<TeacherWrittenPreviewModalF950 activation={activation} group={group} leccion={lec} onClose={()=>setPreviewOpen(false)} />}
  </>;
}

function ExamenesTeacherPanel({ activeState, pendingOral, onNavigate }) {
  const s=activeState?.sesion, l=activeState?.leccion, oral=activeState?.oral;
  const pending=pendingOral&&typeof pendingOral==='object'?pendingOral:null;
  const lec=Number(s?.LECCION||s?.leccion||pending?.leccion||0), open=String(s?.ESTADO||s?.estado||'').toUpperCase()==='ABIERTA';
  const esOral=open&&(String(l?.tipo||'').toUpperCase()==='EVAL_ORAL'||[9,17,25,31].includes(lec));
  const esEscrito=open&&[18,32].includes(lec);
  const label=({9:'1.er Examen Oral',17:'2.º Examen Oral',25:'3.er Examen Oral',31:'4.º Examen Oral'})[lec]||'Examen Oral';
  const ctx={grupo:s?.COD_GRUPO||s?.cod_grupo||pending?.grupo||'',nivel:s?.NIVEL||s?.nivel||pending?.nivel||'',leccion:lec,fecha:String(l?.fecha||s?.FECHA||pending?.fecha||'').slice(0,10)};
  const activeExamCard=esOral?<div style={{padding:'15px 17px',border:'2px solid #2B8A57',borderRadius:14,background:'#EAF8EF',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}><div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#197044'}}>ORAL · SESIÓN ACTIVA</div><div style={{fontSize:19,fontWeight:900,color:'#145C38',marginTop:3}}>{label}</div><div style={{fontSize:12,color:'#2A5B45',marginTop:3}}>{appTeacherGroupLabelF88(ctx.grupo)} · Lección {String(lec).padStart(2,'0')} · {oral?.cerradas||0}/{oral?.total??'—'} evaluaciones cerradas</div></div><button className="btn btn-primary" type="button" style={{background:'#16834A',borderColor:'#16834A'}} onClick={()=>onNavigate&&onNavigate('examen_oral',{oral:ctx})}>ABRIR {label.toUpperCase()}</button></div>
  :esEscrito?<WrittenSessionCardF929 session={s}/>
  :<div style={{padding:'15px 17px',border:'1px solid var(--line)',borderRadius:14,background:'#fff'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>SESIÓN ACTIVA</div><div style={{fontSize:18,fontWeight:900,marginTop:3}}>Exámenes de la clase</div><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:4}}>No hay un examen oral o escrito activo en este momento.</div></div>;
  const top=<><div style={{padding:'14px 16px',background:'#fff',border:'1px solid var(--line)',borderRadius:14}}><div style={{fontSize:10.5,fontWeight:900,letterSpacing:'.15em',color:'#7A1E2C'}}>EXÁMENES DEL DOCENTE</div><div style={{fontFamily:'var(--f-serif)',fontSize:28,fontWeight:600,color:'var(--an-navy)',marginTop:3}}>Orales, reposiciones y escritos</div><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:4}}>La sesión activa habilita automáticamente el examen que corresponde a la lección.</div></div>{activeExamCard}<ReposicionesPanelF91 role="teacher" onNavigate={onNavigate}/></>;
  return <ExamenesIframePanel hideHeader view="teacher" screenLabel="Docente · Exámenes" iframeTitle="Exámenes del docente" topContent={top}/>;
}

function ExamenesStudentPanel() {
  const top=<><div style={{padding:'14px 16px',background:'#fff',border:'1px solid var(--line)',borderRadius:14}}><div style={{fontSize:10.5,fontWeight:900,letterSpacing:'.15em',color:'#7A1E2C'}}>EXÁMENES OFICIALES</div><div style={{fontFamily:'var(--f-serif)',fontSize:28,fontWeight:600,color:'var(--an-navy)',marginTop:3}}>Evaluaciones del nivel</div><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:4}}>Consultá el estado de tus exámenes orales y los escritos habilitados por la clase activa.</div></div><StudentOralOverviewF927/><div style={{padding:'13px 15px',border:'1px solid var(--line)',borderRadius:14,background:'#fff'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>APLICACIÓN EN LÍNEA</div><div style={{fontSize:18,fontWeight:900,marginTop:3}}>Exámenes escritos</div><div style={{fontSize:12.5,color:'var(--ink-3)',marginTop:3}}>Se habilitan automáticamente mientras esté abierta la sesión de la lección 18 o 32.</div></div></>;
  return <ExamenesIframePanel hideHeader view="student" screenLabel="Estudiante · Exámenes" iframeTitle="Panel estudiante de exámenes" topContent={top}/>;
}

const { useState, useEffect } = React;

// ── Límite de error por vista ───────────────────────────────────────
// Antes, si UNA vista lanzaba (p. ej. el cronograma "Todos los grupos" con un
// dato inesperado), React desmontaba TODO el árbol → campus en BLANCO, sin
// sidebar ni forma de salir. Este boundary aísla el fallo a la zona de
// contenido: el menü sigue vivo y el usuario puede navegar a otra sección.
// NO cambia datos, permisos ni la lógica de ninguna vista; solo evita que un
// error puntual tumbe el campus entero. (React recomienda explícitamente un
// error boundary en estos casos.)
class VistaErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch() { /* sin log de datos sensibles */ }
  render() {
    if (this.state.error) {
      return (
        <div data-screen-label="Campus · Sección con error" style={{
          maxWidth: 560, margin: '72px auto', padding: '32px 30px',
          background: 'var(--surface, #fff)',
          border: '1px solid var(--line, #e5e0d8)',
          borderRadius: 'var(--r-lg, 14px)',
          fontFamily: 'var(--f-sans, system-ui)', textAlign: 'center',
          boxShadow: 'var(--sh-2, 0 8px 30px rgba(0,0,0,0.08))',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '3px 11px', borderRadius: 999,
            background: 'color-mix(in srgb, var(--warn, #C67100) 14%, transparent)',
            color: 'var(--warn, #C67100)', fontSize: 10.5, fontWeight: 800,
            letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16,
          }}>Sección no disponible</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--an-navy-ink, #001E47)', marginBottom: 10 }}>
            No pudimos mostrar esta sección
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-3, #6B7280)', lineHeight: 1.55, marginBottom: 22 }}>
            Ocurrió un problema al cargar esta vista. La sección actual se mantiene;
            podés reintentar sin ser enviado automáticamente a Mi Panel.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ padding: '9px 18px', fontSize: 13 }}>
              Reintentar esta sección
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


// SEC-006-B: roles autorizados para el campus general (campus.html). El
// panel de ventas vive en ventas.html con su propio guard; aqui 'ventas'
// NO entra (se redirige). El guard real es <CampusGate/> al final del
// archivo: valida sesion + token, valida contra el servidor y aplica esta
// allowlist ANTES de montar <App/>. No hay fallback a admin.
const CAMPUS_ROLES_PERMITIDOS = ['superadmin', 'admin', 'teacher', 'student'];

// Redirecciones duras. No crean ni tocan ninguna sesion.
function campusIrALogin() {
  try { window.location.replace('login.html'); }
  catch (_) { window.location.href = 'login.html'; }
}
function campusIrAVentas() {
  try { window.location.replace('ventas.html'); }
  catch (_) { window.location.href = 'ventas.html'; }
}

// ── Lee el flag de modo prueba (superadmin viendo como otro) ─────────────
function getModoPrueba() {
  try {
    const raw = sessionStorage.getItem('an_modo_prueba');
    if (!raw) return null;
    const m = JSON.parse(raw);
    if (!m || !m.original) return null;
    return m; // { original: <an_usuario_obj_del_superadmin> }
  } catch (_) {
    return null;
  }
}

// ── Cinta superior: solo visible en modo prueba ──────────────────────────
function ModoPruebaRibbon({ usuario, onVolver }) {
  const rolLabel =
    usuario.rol === 'student' ? 'estudiante'
    : usuario.rol === 'teacher' ? 'docente'
    : usuario.rol === 'admin'   ? 'administrador'
    : usuario.rol;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 18px',
        background: 'repeating-linear-gradient(135deg, #001E47 0 14px, #002F6C 14px 28px)',
        color: 'white',
        fontFamily: 'var(--f-sans, system-ui)',
        fontSize: 12.5,
        letterSpacing: '0.01em',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 9px', borderRadius: 999,
        background: 'rgba(255,255,255,0.14)',
        fontWeight: 800, letterSpacing: '0.14em', fontSize: 10.5, textTransform: 'uppercase',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: '#DA291C', boxShadow: '0 0 0 3px rgba(218,41,28,0.30)',
        }} />
        Modo prueba
      </span>
      <span style={{ opacity: 0.92 }}>
        Viendo el campus como <strong>{usuario.nombre || '—'}</strong>{' '}
        (<em>{rolLabel}</em>
        {usuario.grupo ? <> · grupo <strong>{usuario.grupo}</strong></> : null}
        {usuario.codigo ? <> · código <strong>{usuario.codigo}</strong></> : null}
        )
      </span>
      <span style={{ flex: 1 }} />
      <button
        type="button"
        onClick={onVolver}
        style={{
          padding: '6px 12px',
          background: 'white',
          color: '#002F6C',
          border: 'none',
          borderRadius: 6,
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        ← Volver a superadmin
      </button>
    </div>
  );
}

// ── Banner de MODO DEMO (preview) ────────────────────────────────────────
function DemoBanner() {
  return (
    <div role="status" style={{
      position: 'sticky', top: 0, zIndex: 95,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '7px 16px',
      background: 'repeating-linear-gradient(135deg, #8A5A00 0 16px, #A06A00 16px 32px)',
      color: '#fff', fontFamily: 'var(--f-sans, system-ui)', fontSize: 12.5, fontWeight: 600,
      letterSpacing: '0.01em', borderBottom: '1px solid rgba(0,0,0,0.15)',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 9px',
        borderRadius: 999, background: 'rgba(255,255,255,0.18)',
        fontWeight: 800, letterSpacing: '0.14em', fontSize: 10, textTransform: 'uppercase',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFE08A' }} />
        Modo demo
      </span>
      Datos de ejemplo — los cambios <b style={{ margin: '0 4px' }}>no se guardan</b> en la hoja real.
    </div>
  );
}

function App() {
  // Sesión obligatoria. El guard <CampusGate/> ya validó sesión + token +
  // rol antes de montar este árbol; aquí solo leemos la identidad.
  const sesionInicial = React.useMemo(() => getSesion(), []);
  const [usuario, setUsuario] = useState(sesionInicial);

  // Rol REAL — viene tal cual del backend (incluye 'superadmin').
  const rolReal = usuario?.rol || 'student';

  // SEC-006-B: mapeo EXPLÍCITO de rol → vista, sin fallback a admin. Para
  // navegación, superadmin y admin usan las vistas de admin; el rol real se
  // conserva en `usuario.rol` para permisos especiales (p. ej. edición
  // superadmin). Un rol fuera de la allowlist deja `role = null` y el router
  // muestra "No autorizado" (no carga datos). 'ventas' nunca llega aquí: el
  // guard lo redirige a ventas.html antes de montar <App/>.
  const role =
    rolReal === 'superadmin' ? 'admin'
    : rolReal === 'admin'     ? 'admin'
    : rolReal === 'teacher'   ? 'teacher'
    : rolReal === 'student'   ? 'student'
    : null;

  const [active, setActive] = useState(() => {
    // F96.5 UX: el estudiante SIEMPRE inicia en Mi Campus.
    // No se hereda la última pantalla porque mañana entran usuarios nuevos y
    // la primera impresión debe ser clara, estable y orientada al cumplimiento INA.
    if (role === 'student') return 'dashboard';

    // Admin/docente sí conservan su última pantalla porque trabajan operación diaria.
    const roleKey = 'an_active_' + (role || 'unknown');
    const saved = localStorage.getItem(roleKey) || localStorage.getItem('an_active') || 'dashboard';
    return saved === 'portal_estudiante' ? 'dashboard' : saved;
  });
  const [toastMsg, setToastMsg] = useState('');
  const [pendingLesson, setPendingLesson] = useState(null);
  // pendingGrupo: el grupo con el que arranca filtrada la vista Estudiantes
  // cuando se navega desde el detalle de una lección en el Cronograma.
  const [pendingGrupo, setPendingGrupo] = useState(null);
  const [pendingOral, setPendingOral] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('an_oral_context') || 'null'); }
    catch (_) { return null; }
  });
  const [modoPrueba, setModoPrueba] = useState(() => getModoPrueba());
  const [activeTeacherState, setActiveTeacherState] = useState(null);
  const [activeTeacherCheck, setActiveTeacherCheck] = useState(() => ({ ready: rolReal !== 'teacher', error:false }));
  const activeTeacherSession = activeTeacherState?.sesion || null;

  const scrollCampusTopF91 = () => {
    const run = () => {
      try { window.scrollTo({ top:0, left:0, behavior:'auto' }); } catch (_) { window.scrollTo(0,0); }
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      try {
        const main = document.querySelector('main.main');
        if (main) main.scrollTop = 0;
      } catch (_) {}
    };
    run();
    requestAnimationFrame(run);
    setTimeout(run, 80);
  };

  const navigateTo = (target, opts = {}) => {
    if (opts.lesson) setPendingLesson(opts.lesson);
    else setPendingLesson(null);
    if (opts.grupo) setPendingGrupo(opts.grupo);
    else setPendingGrupo(null);
    if (opts.oral) {
      setPendingOral(opts.oral);
      try { sessionStorage.setItem('an_oral_context', JSON.stringify(opts.oral)); } catch (_) {}
    } else if (target !== 'examen_oral') {
      setPendingOral(null);
      try { sessionStorage.removeItem('an_oral_context'); } catch (_) {}
    }
    setActive(target);
    scrollCampusTopF91();
  };

  // Welcome banner: shown once for student after login (unless dismissed)
  const [showWelcome, setShowWelcome] = useState(() => {
    const hasLoginFlag = sessionStorage.getItem('an_just_logged_in') === '1';
    const dismissed = localStorage.getItem('an_welcome_dismissed') === '1';
    return hasLoginFlag && !dismissed;
  });
  const closeWelcome = () => {
    setShowWelcome(false);
    sessionStorage.removeItem('an_just_logged_in');
    localStorage.setItem('an_welcome_dismissed', '1');
  };

  useEffect(() => {
    try {
      localStorage.setItem('an_active', active);
      localStorage.setItem('an_active_' + (role || 'unknown'), active);
    } catch (_) {}
  }, [active, role]);
  useEffect(() => {
    scrollCampusTopF91();
  }, [active]);

  useEffect(() => {
    if (rolReal !== 'teacher') { setActiveTeacherState(null); setActiveTeacherCheck({ready:true,error:false}); return undefined; }
    let live=true, first=true;
    setActiveTeacherCheck({ready:false,error:false});
    const refresh=async()=>{
      const r=await postAppF87('getDocenteSesionActivaF87',{},30000);
      if(!live)return;
      if(r?.ok){
        setActiveTeacherState(r.sesion?r:null);
        setActiveTeacherCheck({ready:true,error:false});
      }else{
        setActiveTeacherCheck({ready:true,error:true});
      }
      first=false;
    };
    refresh();
    const timer=setInterval(refresh,30000);
    window.addEventListener('an:teacher-session-changed',refresh);
    window.addEventListener('an:oral-updated',refresh);
    return()=>{live=false;clearInterval(timer);window.removeEventListener('an:teacher-session-changed',refresh);window.removeEventListener('an:oral-updated',refresh);};
  },[rolReal]);

  // Si otro componente reescribe `an_usuario` (típicamente el Modo prueba
  // del superadmin), refrescamos el estado de App para que el router
  // recalcule el rol efectivo. Escuchamos también nuestro evento custom.
  useEffect(() => {
    const handler = () => {
      const u = getSesion();
      if (!u) { window.location.replace('login.html'); return; }
      setUsuario(u);
      setModoPrueba(getModoPrueba());
      // F81: cambiar grupo o refrescar datos de sesión no debe sacar al docente
      // de la vista actual ni enviarlo automáticamente a Mi Panel.
      // El menú conserva la sección activa y solo actualiza la identidad/sesión.

    };
    window.addEventListener('an:session-changed', handler);
    return () => window.removeEventListener('an:session-changed', handler);
  }, []);

  const volverASuperadmin = () => {
    if (!modoPrueba?.original) return;
    setSesion(modoPrueba.original);
    sessionStorage.removeItem('an_modo_prueba');
    window.dispatchEvent(new Event('an:session-changed'));
  };

  const toast = (m) => setToastMsg(m);

  // Modo demo (preview): banner visible para que sea evidente que NO se escribe
  // en la hoja real. Se activa con ?demo=… o ?preview=… en la URL.
  const esDemo = React.useMemo(() => {
    try { const q = new URLSearchParams(window.location.search); return !!(q.get('demo') || q.get('preview')); }
    catch (_) { return false; }
  }, []);

  // Sin sesión válida tras el primer render → no montar nada.
  if (!usuario) return null;

  // Route
  let content = null;
  if (role === 'student') {
    const map = {
      cronograma_grupo: <LazyRoute title="Cronograma académico" component="CronogramaGrupo" files={F96_LAZY.cronograma_grupo} rol="student" onNavigate={navigateTo} />,
      // F95.0: alias de compatibilidad; ambos nombres abren el nuevo Mi Campus.
      portal_estudiante: <LazyRoute title="Mi Campus" component="StudentDashboard" files={F96_LAZY.student_dashboard} toast={toast} onNavigate={navigateTo} />,
      dashboard:    <LazyRoute title="Mi Campus" component="StudentDashboard" files={F96_LAZY.student_dashboard} toast={toast} onNavigate={navigateTo} />,
      notas:        <LazyRoute title="Mis Notas" component="NotasView" files={F96_LAZY.student_modules} toast={toast} onNavigate={navigateTo} />,
      tareas:       <LazyRoute title="Tareas" component="TareasView" files={F96_LAZY.student_modules} toast={toast} />,
      materiales:   <LazyRoute title="Biblioteca del curso" component="MaterialesView" files={F96_LAZY.syllabus_views} initialLesson={pendingLesson} onNavigate={navigateTo} />,
      info_programa: <LazyRoute title="Material obligatorio INA" component="InfoProgramaView" files={F96_LAZY.syllabus_views} />,
      ican:         <LazyRoute title="Club I CAN" component="ICANViewNew" files={F96_LAZY.syllabus_views} toast={toast} role="student" />,
      examenes:     <ExamenesStudentPanel />,
      mensajes:     <LazyRoute title="Mensajes" component="MensajesView" files={F96_LAZY.student_modules} />,
      pagos:        <LazyRoute title="Estado de cuenta" component="PagosView" files={F96_LAZY.student_modules} />,
      certificados: <LazyRoute title="Certificaciones" component="CertificadosView" files={F96_LAZY.student_modules} />,
      solicitudes_estudiante: <LazyRoute title="Solicitudes del estudiante" component="SolicitudesEstudianteView" files={F96_LAZY.solicitudes} onNavigate={navigateTo} />,
      perfil:       <LazyRoute title="Perfil" component="PerfilView" files={F96_LAZY.student_modules} onNavigate={navigateTo} />,
    };
    content = map[active] || map.dashboard;
  } else if (role === 'teacher') {
    // VistaDocente es la pantalla principal del docente. El antiguo
    // TeacherDashboard se eliminó (bloque 2). 'dashboard' queda como
    // alias por compatibilidad con an_active viejo en localStorage.
    const map = {
      dashboard:        <LazyRoute title="Mi Panel Docente" component="VistaDocente" files={F96_LAZY.vista_docente} />,
      mi_panel_docente: <LazyRoute title="Mi Panel Docente" component="VistaDocente" files={F96_LAZY.vista_docente} />,
      // CALGRUPO_F35_20260617_DOCENTE_OPERATIVO_ROUTER
      docente_operativo: <LazyRoute title="Mis Grupos" component="GruposView" files={F96_LAZY.teacher_views} onNavigate={navigateTo} activeSession={activeTeacherSession} activeSessionReady={activeTeacherCheck.ready} activeSessionError={activeTeacherCheck.error} />,
      grupos:      <LazyRoute title="Mis Grupos" component="GruposView" files={F96_LAZY.teacher_views} onNavigate={navigateTo} activeSession={activeTeacherSession} activeSessionReady={activeTeacherCheck.ready} activeSessionError={activeTeacherCheck.error} />,
      // CALGRUPO_F66_20260618_ASISTENCIA_UNICA_DESDE_CRONOGRAMA
      asistencia:  <LazyRoute title="Asistencia" component="CronogramaGrupo" files={F96_LAZY.cronograma_grupo} rol="teacher" onNavigate={navigateTo} />,
      cronograma_grupo: <LazyRoute title="Cronograma docente" component="CronogramaDocenteSeguroF82" files={F96_LAZY.teacher_views} onNavigate={navigateTo} activeSession={activeTeacherSession} activeSessionReady={activeTeacherCheck.ready} activeSessionError={activeTeacherCheck.error} />,
      examenes:    <ExamenesTeacherPanel activeState={activeTeacherState} pendingOral={pendingOral} onNavigate={navigateTo} />,
      examen_oral: <LazyRoute title="Examen oral" component="ExamenOralView" files={F96_LAZY.student_modules} context={pendingOral} onNavigate={navigateTo} />,
      materiales:  <LazyRoute title="Biblioteca del curso" component="MaterialesView" files={F96_LAZY.syllabus_views} onNavigate={navigateTo} />,
      ican:        <ProximamenteView title="Club I CAN" />,
      mensajes:    <LazyRoute title="Mensajes" component="MensajesView" files={F96_LAZY.student_modules} />,
      perfil:      <LazyRoute title="Perfil" component="PerfilView" files={F96_LAZY.student_modules} />,
    };
    content = map[active] || map.mi_panel_docente;
  } else if (role === 'admin') {
    // Admin / superadmin. Los 6 ítems "Próximamente" (docentes, horas,
    // ican, finanzas, reportes, config) van a ProximamenteView — no
    // hay datos demo en producción. El sidebar además los presenta
    // como no-clickeables; esto es la red de seguridad por si el id
    // llega vía state antiguo.
    const map = {
      matriculas:    <LazyRoute title="Matrículas" component="MatriculasView" files={F96_LAZY.matriculas} onNavigate={navigateTo} />,
      dashboard:    <LazyRoute title="Dashboard" component="AdminDashboard" files={F96_LAZY.admin_views} setActive={setActive} />,
      supervision:  <LazyRoute title="Supervisión" component="PanelAdminSupervision" files={F96_LAZY.supervision} />,
      calendario_grupo: <LazyRoute title="Calendario de Grupo" component="CalendarioGrupoOperativo" files={F96_LAZY.calendario_grupo} rol={rolReal} onNavigate={navigateTo} />,
      auditoria_academica: <LazyRoute title="Auditoría Académica" component="AuditoriaAcademicaView" files={F96_LAZY.auditoria} />,
      // CALGRUPO_F33_20260617_DIAGNOSTICO_INTERNO_ROUTER
      diagnostico_interno: <LazyRoute title="Diagnóstico interno" component="DiagnosticoInternoView" files={F96_LAZY.diagnostico} />,
      // CALGRUPO_F42_20260617_AUDITORIA_ROLES_PERMISOS_ROUTER
      permisos_roles: <LazyRoute title="Permisos y roles" component="PermisosRolesView" files={F96_LAZY.permisos} />,
      // CALGRUPO_F36_20260617_CONAPE_COBRANZA_ROUTER
      conape_cobranza: <LazyRoute title="CONAPE y Cobranza" component="ConapeCobranzaView" files={F96_LAZY.conape} onNavigate={navigateTo} />,
      // CALGRUPO_F38_20260617_REPORTES_ADMINISTRATIVOS_ROUTER
      reportes: <LazyRoute title="Reportes" component="ReportesAdminView" files={F96_LAZY.reportes} onNavigate={navigateTo} />,
      // CALGRUPO_F55_20260618_SUPERADMIN_EDITOR_INSCRIPCION_PUBLICA_ROUTER
      inscripcion_admin: rolReal === 'superadmin'
        ? <LazyRoute title="Inscripción pública" component="InscripcionAdminView" files={F96_LAZY.inscripcion_admin} toast={toast} />
        : <NoAutorizadoCampus rol={rolReal} />,
      examenes:    <ExamenesAdminPanel />,
      examen_oral: <LazyRoute title="Examen oral" component="ExamenOralView" files={F96_LAZY.student_modules} context={pendingOral} onNavigate={navigateTo} />,
      suspensiones: <LazyRoute title="Solicitudes administrativas" component="SolicitudesUnificadasView" files={F96_LAZY.solicitudes} onNavigate={navigateTo} />,
      solicitudes:  <LazyRoute title="Solicitudes administrativas" component="SolicitudesUnificadasView" files={F96_LAZY.solicitudes} onNavigate={navigateTo} />,
      grupos:       <LazyRoute title="Grupos" component="AdminGruposView" files={F96_LAZY.admin_views} />,
      estudiantes:  <LazyRoute title="Estudiantes" component="AdminEstudiantesView" files={F96_LAZY.admin_students} onNavigate={navigateTo} grupoInicial={pendingGrupo} />,
      cronograma_grupo: <LazyRoute title="Cronograma académico" component="CronogramaGrupo" files={F96_LAZY.cronograma_grupo} rol={rolReal} onNavigate={navigateTo} />,
      buscador:     <LazyRoute title="Buscador" component="BuscadorEstudiantes" files={F96_LAZY.buscador} />,
      banco:        <LazyRoute title="Importar Banco" component="ImportadorBancario" files={F96_LAZY.banco} />,
      aplicar_pago: <LazyRoute title="Aplicar Pago" component="AplicarPago" files={F96_LAZY.aplicar_pago} />,
      // — Próximamente (sin datos demo) ——————————————————————
      docentes:  <ProximamenteView title="Docentes" />,
      horas:     <ProximamenteView title="Horas docentes" />,
      ican:      <ProximamenteView title="Club I CAN" />,
      finanzas:  <ProximamenteView title="Finanzas" />,
      config:    <ProximamenteView title="Configuración" />,
    };
    content = map[active] || map.dashboard;
  } else {
    // SEC-006-B: sin fallback a admin. Un rol fuera de la allowlist no
    // renderiza panel ni carga datos. (El guard ya filtra antes de montar;
    // esto es la red de seguridad si algo cambia la sesión en caliente.)
    content = <NoAutorizadoCampus rol={rolReal} />;
  }

  // setRole es no-op para la UI: el rol viene de an_usuario. Lo dejamos
  // disponible para componentes legacy hasta que migren.
  const setRoleNoop = () => {};

  return (
    <div className="app">
      <Sidebar
        role={role}
        rolReal={rolReal}
        usuario={usuario}
        setRole={setRoleNoop}
        active={active}
        setActive={(target) => navigateTo(target)}
      />
      <main className="main">
        {esDemo && <DemoBanner />}
        {modoPrueba && (
          <ModoPruebaRibbon usuario={usuario} onVolver={volverASuperadmin} />
        )}
        {role === 'teacher' && <TeacherActiveSessionBanner state={activeTeacherState} viewKey={active} />}
        <VistaErrorBoundary key={active}>
          {content}
        </VistaErrorBoundary>
      </main>
      <Toast msg={toastMsg} onClose={() => setToastMsg('')} />
      {showWelcome && role === 'student' && <LazyRoute title="Bienvenida" component="WelcomeBanner" files={F96_LAZY.syllabus_views} onClose={closeWelcome} />}
    </div>
  );
}

// ── Pantalla "No autorizado" (rol fuera de la allowlist del campus) ────────
function NoAutorizadoCampus({ rol }) {
  return (
    <div data-screen-label="Campus · No autorizado" style={{
      maxWidth: 520, margin: '96px auto', padding: '34px 32px',
      background: 'var(--surface, #fff)',
      border: '1px solid var(--line, #e5e0d8)',
      borderRadius: 'var(--r-lg, 14px)',
      fontFamily: 'var(--f-sans, system-ui)',
      textAlign: 'center',
      boxShadow: 'var(--sh-1, 0 8px 30px rgba(0,0,0,0.08))',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '3px 11px', borderRadius: 999,
        background: 'color-mix(in srgb, var(--danger, #C0392B) 12%, transparent)',
        color: 'var(--danger, #C0392B)', fontSize: 10.5, fontWeight: 800,
        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 16,
      }}>Acceso restringido</div>
      <div style={{
        fontFamily: 'var(--f-serif, Georgia, serif)', fontSize: 26, fontWeight: 500,
        color: 'var(--an-navy-ink, #1a2b4a)', letterSpacing: '-0.02em', marginBottom: 10,
      }}>No autorizado</div>
      <div style={{ fontSize: 14, color: 'var(--ink-3, #6b6258)', lineHeight: 1.55, marginBottom: 22 }}>
        Tu cuenta{rol ? <> (rol <strong>{rol}</strong>)</> : null} no tiene acceso al
        Campus Virtual. Si crees que es un error, contactá a la academia.
      </div>
      <button
        type="button"
        onClick={campusIrALogin}
        className="btn btn-primary"
        style={{ padding: '10px 20px', fontSize: 14 }}
      >
        Volver al inicio de sesión
      </button>
    </div>
  );
}

// ── Pantalla de validación de sesión (UX) ─────────────────────────────────
// Antes, mientras CampusGate esperaba la respuesta del backend, se renderizaba
// `null` → pantalla en BLANCO sin feedback. Si el Apps Script tarda (cold start
// ~4 s o más) el usuario se queda mirando crema vacía. Esto es SOLO UX: no
// cambia la decisión de seguridad (sin sesión/validación válida no se monta el
// campus). `lento` aparece si la validación tarda demasiado, con reintento
// (recarga = vuelve a validar; fail-closed, no hay bypass).
function CampusValidando({ lento }) {
  return (
    <div data-screen-label="Campus · Validando sesión" style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 18,
      background: 'var(--bg, #F3EEE6)', fontFamily: 'var(--f-sans, system-ui)',
      padding: '24px', textAlign: 'center',
    }}>
      <style>{`@keyframes an-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        border: '3px solid color-mix(in srgb, var(--an-navy, #002F6C) 18%, transparent)',
        borderTopColor: 'var(--an-navy, #002F6C)',
        animation: 'an-spin 0.8s linear infinite',
      }} />
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--an-navy-ink, #001E47)', letterSpacing: '0.01em' }}>
        Validando tu sesión…
      </div>
      {lento && (
        <div style={{ maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3, #6B7280)', lineHeight: 1.5 }}>
            Está tardando más de lo normal. Puede ser la conexión con el servidor.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" className="btn btn-primary"
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', fontSize: 13 }}>
              Reintentar
            </button>
            <button type="button" className="btn"
              onClick={campusIrALogin}
              style={{ padding: '8px 16px', fontSize: 13, background: 'transparent', border: '1px solid var(--line-2, #D4C9B6)', color: 'var(--ink-2, #4A413A)', borderRadius: 8, cursor: 'pointer' }}>
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


class CampusRootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    try { console.error('CampusRootErrorBoundary', error, info); } catch (_) {}
  }
  render() {
    if (!this.state.error) return this.props.children;
    const mensaje = String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error || 'Error inesperado');
    return (
      <div data-screen-label="Campus · Error de carga" style={{
        minHeight:'100vh', display:'grid', placeItems:'center', padding:24,
        background:'var(--bg, #F3EEE6)', fontFamily:'var(--f-sans, system-ui)'
      }}>
        <div style={{ maxWidth:720, width:'100%', background:'#fff', border:'1px solid var(--line, #e5e0d8)', borderRadius:20, padding:'28px 30px', boxShadow:'0 20px 60px rgba(0,0,0,.12)' }}>
          <div style={{ fontSize:11, fontWeight:900, letterSpacing:'.15em', textTransform:'uppercase', color:'var(--an-granate, #7A1E2C)' }}>Campus Virtual</div>
          <h1 style={{ fontFamily:'var(--f-serif, Georgia, serif)', fontSize:30, color:'var(--an-navy-ink, #001E47)', margin:'8px 0 10px' }}>No se pudo completar la carga</h1>
          <p style={{ fontSize:13, color:'var(--ink-2, #4A413A)', lineHeight:1.6, margin:0 }}>La sesión permanece guardada. Recargá la página después de que GitHub termine de publicar todos los archivos.</p>
          <div style={{ marginTop:14, padding:'10px 12px', borderRadius:10, background:'#F8F4EE', color:'#6B6258', fontFamily:'monospace', fontSize:11, overflowWrap:'anywhere' }}>{mensaje}</div>
          <div style={{ display:'flex', gap:10, marginTop:18, flexWrap:'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Recargar Campus</button>
            <button type="button" className="btn" onClick={campusIrALogin}>Volver al inicio de sesión</button>
          </div>
        </div>
      </div>
    );
  }
}

// ── Guard de sesión del campus (SEC-006-B) ────────────────────────────────
// Equivalente a <VentasGate/> de ventas.html. Resuelve la identidad ANTES de
// montar <App/> y NO fabrica sesiones:
//   1) getSesion() + getSessionToken(); si falta cualquiera → login.html.
//   2) validarSesionServidor() (si existe); si !ok → cerrarSesionServidor()
//      (si existe) y → login.html.
//   3) rol === 'ventas' → ventas.html (su panel propio).
//   4) rol ∈ {superadmin, admin, teacher, student} → monta <App/>.
//      Cualquier otro rol → "No autorizado" (no monta App, no carga datos).
// Sin localStorage para permisos. Sin fallback a admin. No imprime el token.
function CampusGate() {
  const [estado, setEstado] = useState('check');   // 'check' | 'ok' | 'denegado'
  const [sesion, setSesionState] = useState(null);
  const [lento, setLento] = useState(false);       // UX: validación lenta

  useEffect(() => {
    let cancel = false;
    // Solo UX: si la validación tarda demasiado, mostramos aviso + reintento.
    const slowTimer = setTimeout(() => { if (!cancel) setLento(true); }, 9000);
    (async () => {
      const ses = (typeof window.getSesion === 'function') ? window.getSesion() : null;
      const token = (typeof window.getSessionToken === 'function')
        ? window.getSessionToken()
        : (ses && ses.token) || '';

      // 1) Sin sesión o sin token → al login. No se crea ninguna sesión.
      if (!ses || !token) { campusIrALogin(); return; }

      // 2) Validación contra el servidor. Una respuesta explícita de sesión
      // inválida cierra el acceso; una falla temporal de red NO debe dejar el
      // Campus en blanco. Los endpoints siguen validando el token en backend.
      if (typeof window.validarSesionServidor === 'function') {
        let r = null;
        try {
          r = await Promise.race([
            window.validarSesionServidor(),
            new Promise(resolve => setTimeout(() => resolve({ ok:false, network_error:true, error:'timeout_gate' }), 14000)),
          ]);
        } catch (_) {
          r = { ok:false, network_error:true, error:'validacion_no_disponible' };
        }
        if (cancel) return;

        const esFallaTemporal = !!(r && r.network_error);
        if (!r || (!r.ok && !esFallaTemporal)) {
          try {
            if (typeof window.cerrarSesionServidor === 'function') {
              await window.cerrarSesionServidor();
            }
          } catch (_) {}
          if (!cancel) campusIrALogin();
          return;
        }
        if (esFallaTemporal) {
          try { sessionStorage.setItem('an_validacion_diferida', String(Date.now())); } catch (_) {}
        } else {
          try { sessionStorage.removeItem('an_validacion_diferida'); } catch (_) {}
        }
      }

      if (cancel) return;

      // 3) Ventas tiene su propio panel: redirigir, no montar el campus.
      if (ses.rol === 'ventas') { campusIrAVentas(); return; }

      // 4) Allowlist del campus. Rol desconocido → "No autorizado".
      if (!CAMPUS_ROLES_PERMITIDOS.includes(ses.rol)) {
        setSesionState(ses);
        setEstado('denegado');
        return;
      }

      setSesionState(ses);
      setEstado('ok');
    })();
    return () => { cancel = true; clearTimeout(slowTimer); };
  }, []);

  if (estado === 'check') return <CampusValidando lento={lento} />;
  if (estado === 'denegado') return <NoAutorizadoCampus rol={sesion ? sesion.rol : ''} />;
  return <CampusRootErrorBoundary><App /></CampusRootErrorBoundary>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<CampusGate />);
