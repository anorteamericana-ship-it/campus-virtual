// F89_20260620_AVISO_CIERRE_NO_INTRUSIVO_EXPEDIENTE_ESTUDIANTIL
/* global React, ReactDOM, Toast, Sidebar, getSesion, setSesion,
   StudentDashboard, StudentPortalView, NotasView, TareasView, MaterialesView, InfoProgramaView, ICANView, ICANViewNew,
   MensajesView, PagosView, CertificadosView, PerfilView,
   ExamenOralView, GruposView, CalificarView, AsistenciaView, CronogramaDocenteSeguroF82,
   AdminDashboard, AdminGruposView, WelcomeBanner, MatriculasView, AdminEstudiantesView,
   CronogramaModulo, CronogramaGrupo, BuscadorEstudiantes, ImportadorBancario, AplicarPago,
   VistaDocente, PanelAdminSupervision, PanelSuspensiones, SolicitudesPagoView,
   AuditoriaAcademicaView, DiagnosticoInternoView, DocenteOperativoView, ConapeCobranzaView, ReportesAdminView,
   SolicitudesUnificadasView, SolicitudesEstudianteView */

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

// ── Exámenes escritos — integración por iframe interno sin backend ───────
// El módulo ya existe y monta su propio React sobre modulos/examenes.html.
// Por eso se integra como iframe interno: no duplica EXAMS, no mezcla scripts
// del campus principal y no toca Apps Script ni endpoints.
function ExamenesIframePanel({ view, screenLabel, eyebrow, description, badge, iframeTitle, topContent, hideHeader = false }) {
  const src = `modulos/examenes.html?view=${view}&v=F91`;
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


async function appPostF91(fn, payload = {}) {
  const token = window.getSessionToken ? window.getSessionToken() : '';
  const res = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
    method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({ fn, token, ...payload }),
  });
  const data = await res.json();
  if (!data?.ok) throw new Error(data?.mensaje || data?.error || 'No se pudo completar la operación.');
  return data;
}
function reposEstadoF91(estado) {
  const e=String(estado||'').toUpperCase();
  const map={PENDIENTE_JUSTIFICACION:['Pendiente de justificación','#8B5A00','#FFF4D6'],JUSTIFICADA_GRATUITA:['Autorizada sin costo','#146C2E','#EAF8EF'],PENDIENTE_PAGO:['Pendiente de pago','#991B1B','#FDECEA'],PAGADA_AUTORIZADA:['Pago confirmado','#146C2E','#EAF8EF'],PROGRAMADA:['Programada','#0C4F86','#E7F1FA'],ENTREGADA_POR_REVISAR:['Entregada · por revisar','#805500','#FFF4D6'],APLICADA:['Aplicada','#40516A','#EEF2F7'],VENCIDA_0:['Vencida · nota 0','#991B1B','#FDECEA'],CANCELADA:['Cancelada','#5F6875','#EEF2F7']};
  return map[e]||[e||'Pendiente','#5F6875','#EEF2F7'];
}
function fechaF91(v){const s=String(v||'').slice(0,10);if(!s)return'—';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?s:d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'});}
function ReposicionesPanelF91({ role='teacher', onNavigate }) {
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[busy,setBusy]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');appPostF91('reposListarExamenes').then(r=>setRows(r.rows||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const act=async(row,accion)=>{let payload={reposicion_id:row.REPOSICION_ID,accion};if(accion==='APROBAR_JUSTIFICACION'||accion==='RECHAZAR_JUSTIFICACION'){const nota=window.prompt(accion==='APROBAR_JUSTIFICACION'?'Justificación aprobada. Agregá una observación breve:':'Indicá por qué la justificación no fue aceptada:','');if(nota===null)return;payload.justificacion=nota;}if(accion==='CONFIRMAR_PAGO'){const ref=window.prompt('Referencia o número del pago de ₡10.000:','');if(ref===null)return;payload.pago_referencia=ref;}if(accion==='PROGRAMAR_ESCRITO'){const fecha=window.prompt('Fecha de aplicación (AAAA-MM-DD):',row.FECHA_LIMITE||'');if(fecha===null)return;const hi=window.prompt('Hora de inicio (HH:MM):','18:00');if(hi===null)return;const hf=window.prompt('Hora de cierre (HH:MM):','19:00');if(hf===null)return;payload={reposicion_id:row.REPOSICION_ID,fecha_programada:fecha,hora_inicio:hi,hora_fin:hf};}setBusy(row.REPOSICION_ID+accion);try{await appPostF91(accion==='PROGRAMAR_ESCRITO'?'reposProgramarEscrito':'reposResolverExamen',payload);await load();}catch(e){setError(e.message);}finally{setBusy('');}};
  const visible=rows.filter(r=>role==='admin'||!['APLICADA','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));
  if(loading)return <div style={{padding:14,border:'1px solid var(--line)',borderRadius:14,background:'#fff'}}>Cargando reposiciones…</div>;
  if(error)return <div style={{padding:14,border:'1px solid #F0B9B9',borderRadius:14,background:'#FDECEA',color:'#8B1F1F'}}>{error}</div>;
  if(!visible.length)return null;
  return <div style={{border:'1px solid var(--line)',borderRadius:14,background:'#fff',overflow:'hidden'}}>
    <div style={{padding:'12px 15px',borderBottom:'1px solid var(--line)',background:'#F8FAFE'}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#7A1E2C'}}>REPOSICIONES DE EXAMEN</div><div style={{fontSize:13,color:'var(--ink-2)',marginTop:3}}>Cada reposición es individual y conserva su fecha límite.</div></div>
    <div style={{display:'flex',flexDirection:'column',gap:9,padding:10}}>{visible.map(row=>{const [label,ink,bg]=reposEstadoF91(row.ESTADO);const authorized=['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','PROGRAMADA'].includes(String(row.ESTADO||'').toUpperCase());return <div key={row.REPOSICION_ID} style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'center',padding:'11px 12px',border:'1px solid var(--line)',borderRadius:11}}>
      <div><div style={{fontSize:13,fontWeight:850}}>{row.NOMBRE} <span style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)'}}>#{row.COD_ESTUDIANTE}</span></div><div style={{fontSize:11,color:'var(--ink-3)',marginTop:3}}>{appTeacherGroupLabelF88(row.COD_GRUPO)} · Lección {String(row.LECCION).padStart(2,'0')} · {row.TIPO_EXAMEN} · vence {fechaF91(row.FECHA_LIMITE)}</div><span style={{display:'inline-flex',marginTop:6,padding:'3px 8px',borderRadius:999,background:bg,color:ink,fontSize:9.5,fontWeight:900}}>{label}</span></div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}}>{role==='admin'&&String(row.ESTADO).toUpperCase()==='PENDIENTE_JUSTIFICACION'&&<><button className="btn btn-ghost" disabled={!!busy} onClick={()=>act(row,'RECHAZAR_JUSTIFICACION')}>Requiere ₡10.000</button><button className="btn btn-primary" disabled={!!busy} onClick={()=>act(row,'APROBAR_JUSTIFICACION')}>Aprobar sin costo</button></>}{role==='admin'&&String(row.ESTADO).toUpperCase()==='PENDIENTE_PAGO'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>act(row,'CONFIRMAR_PAGO')}>Confirmar pago</button>}{role==='admin'&&authorized&&String(row.TIPO_EXAMEN).toUpperCase()==='ESCRITO'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>act(row,'PROGRAMAR_ESCRITO')}>Programar escrito</button>}{role==='teacher'&&authorized&&String(row.TIPO_EXAMEN).toUpperCase()==='ORAL'&&<button className="btn btn-primary" onClick={()=>onNavigate&&onNavigate('examen_oral',{oral:{grupo:row.COD_GRUPO,nivel:row.NIVEL,leccion:Number(row.LECCION),fecha:row.FECHA_ORIGINAL,reposicion_id:row.REPOSICION_ID}})}>APLICAR REPOSICIÓN ORAL</button>}</div>
    </div>})}</div>
  </div>;
}

function ExamenesAdminPanel() {
  const [tab,setTab]=React.useState('oral');
  const [nivel,setNivel]=React.useState('B1');
  const [leccion,setLeccion]=React.useState(9);
  const ses=typeof getSesion==='function'?getSesion():{};
  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';
  const oralSrc=`modulos/examen_oral.html?preview=1&nivel=${encodeURIComponent(nivel)}&leccion=${leccion}&v=F92`;
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

function ExamenesTeacherPanel({ activeState, pendingOral, onNavigate }) {
  const s=activeState?.sesion, l=activeState?.leccion, oral=activeState?.oral;
  const pending=pendingOral&&typeof pendingOral==='object'?pendingOral:null;
  const lec=Number(s?.LECCION||s?.leccion||pending?.leccion||0), open=String(s?.ESTADO||s?.estado||'').toUpperCase()==='ABIERTA';
  const esOral=open&&(String(l?.tipo||'').toUpperCase()==='EVAL_ORAL'||[9,17,25,31].includes(lec));
  const label=({9:'1.er Examen Oral',17:'2.º Examen Oral',25:'3.er Examen Oral',31:'4.º Examen Oral'})[lec]||'Examen Oral';
  const ctx={grupo:s?.COD_GRUPO||s?.cod_grupo||pending?.grupo||'',nivel:s?.NIVEL||s?.nivel||pending?.nivel||'',leccion:lec,fecha:String(l?.fecha||s?.FECHA||pending?.fecha||'').slice(0,10)};
  const card=esOral?<div style={{padding:'15px 17px',border:'2px solid #2B8A57',borderRadius:14,background:'#EAF8EF',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
    <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#197044'}}>EXAMEN DE LA SESIÓN ACTIVA</div><div style={{fontSize:19,fontWeight:900,color:'#145C38',marginTop:3}}>{label}</div><div style={{fontSize:12,color:'#2A5B45',marginTop:3}}>{appTeacherGroupLabelF88(ctx.grupo)} · Lección {String(lec).padStart(2,'0')} · {oral?.cerradas||0}/{oral?.total??'—'} evaluaciones cerradas</div></div>
    <button className="btn btn-primary" type="button" style={{background:'#16834A',borderColor:'#16834A'}} onClick={()=>onNavigate&&onNavigate('examen_oral',{oral:ctx})}>ABRIR {label.toUpperCase()}</button>
  </div>:null;
  return <ExamenesIframePanel hideHeader view="teacher" screenLabel="Docente · Exámenes" iframeTitle="Exámenes del docente" topContent={<>{card}<ReposicionesPanelF91 role="teacher" onNavigate={onNavigate} /></>}/>;
}

// CALGRUPO_F37_20260617_EXAMENES_ESTUDIANTE_ROUTER
function ExamenesStudentPanel() {
  return (
    <ExamenesIframePanel
      view="student"
      screenLabel="Estudiante · Exámenes"
      eyebrow="Exámenes oficiales"
      description="El sistema muestra únicamente el examen disponible según tu grupo, cronograma y activación oficial."
      badge="Lección 18 / 32 · en vivo"
      iframeTitle="Panel estudiante de exámenes"
    />
  );
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

  const [active, setActive] = useState(() => localStorage.getItem('an_active') || 'dashboard');
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

  useEffect(() => { localStorage.setItem('an_active', active); }, [active]);
  useEffect(() => {
    scrollCampusTopF91();
  }, [active]);

  useEffect(() => {
    if (rolReal !== 'teacher') { setActiveTeacherState(null); return undefined; }
    let live=true;
    const refresh=async()=>{
      const r=await postAppF87('getDocenteSesionActivaF87',{},30000);
      if(live&&r?.ok){
        setActiveTeacherState(r.sesion?r:null);
      }
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
      cronograma_grupo: <CronogramaGrupo rol="student" onNavigate={navigateTo} />,
      // CALGRUPO_F37_20260617_PORTAL_ESTUDIANTE_ROUTER
      portal_estudiante: <StudentPortalView toast={toast} onNavigate={navigateTo} />,
      dashboard:    <StudentDashboard toast={toast} onNavigate={navigateTo} />,
      notas:        <NotasView toast={toast} onNavigate={navigateTo} />,
      tareas:       <TareasView toast={toast} />,
      materiales:   <MaterialesView initialLesson={pendingLesson} onNavigate={navigateTo} />,
      info_programa: <InfoProgramaView />,
      ican:         <ICANViewNew toast={toast} role="student" />,
      examenes:     <ExamenesStudentPanel />,
      mensajes:     <MensajesView />,
      pagos:        <PagosView />,
      certificados: <CertificadosView />,
      solicitudes_estudiante: <SolicitudesEstudianteView onNavigate={navigateTo} />,
      perfil:       <PerfilView onNavigate={navigateTo} />,
    };
    content = map[active] || map.dashboard;
  } else if (role === 'teacher') {
    // VistaDocente es la pantalla principal del docente. El antiguo
    // TeacherDashboard se eliminó (bloque 2). 'dashboard' queda como
    // alias por compatibilidad con an_active viejo en localStorage.
    const map = {
      dashboard:        <VistaDocente />,
      mi_panel_docente: <VistaDocente />,
      // CALGRUPO_F35_20260617_DOCENTE_OPERATIVO_ROUTER
      docente_operativo: <GruposView onNavigate={navigateTo} activeSession={activeTeacherSession} />,
      grupos:      <GruposView onNavigate={navigateTo} activeSession={activeTeacherSession} />,
      calificar:   <CalificarView toast={toast} />,
      // CALGRUPO_F66_20260618_ASISTENCIA_UNICA_DESDE_CRONOGRAMA
      asistencia:  <CronogramaGrupo rol="teacher" onNavigate={navigateTo} />,
      cronograma_grupo: <CronogramaDocenteSeguroF82 onNavigate={navigateTo} />,
      examenes:    <ExamenesTeacherPanel activeState={activeTeacherState} pendingOral={pendingOral} onNavigate={navigateTo} />,
      examen_oral: <ExamenOralView context={pendingOral} onNavigate={navigateTo} />,
      materiales:  <MaterialesView onNavigate={navigateTo} />,
      ican:        <ProximamenteView title="Club I CAN" />,
      mensajes:    <MensajesView />,
      perfil:      <PerfilView />,
    };
    content = map[active] || map.mi_panel_docente;
  } else if (role === 'admin') {
    // Admin / superadmin. Los 6 ítems "Próximamente" (docentes, horas,
    // ican, finanzas, reportes, config) van a ProximamenteView — no
    // hay datos demo en producción. El sidebar además los presenta
    // como no-clickeables; esto es la red de seguridad por si el id
    // llega vía state antiguo.
    const map = {
      matriculas:    <MatriculasView onNavigate={navigateTo} />,
      dashboard:    <AdminDashboard setActive={setActive} />,
      supervision:  <PanelAdminSupervision />,
      calendario_grupo: <CalendarioGrupoOperativo rol={rolReal} onNavigate={navigateTo} />,
      auditoria_academica: <AuditoriaAcademicaView />,
      // CALGRUPO_F33_20260617_DIAGNOSTICO_INTERNO_ROUTER
      diagnostico_interno: <DiagnosticoInternoView />,
      // CALGRUPO_F42_20260617_AUDITORIA_ROLES_PERMISOS_ROUTER
      permisos_roles: <PermisosRolesView />,
      // CALGRUPO_F36_20260617_CONAPE_COBRANZA_ROUTER
      conape_cobranza: <ConapeCobranzaView onNavigate={navigateTo} />,
      // CALGRUPO_F38_20260617_REPORTES_ADMINISTRATIVOS_ROUTER
      reportes: <ReportesAdminView onNavigate={navigateTo} />,
      // CALGRUPO_F55_20260618_SUPERADMIN_EDITOR_INSCRIPCION_PUBLICA_ROUTER
      inscripcion_admin: rolReal === 'superadmin'
        ? <InscripcionAdminView toast={toast} />
        : <NoAutorizadoCampus rol={rolReal} />,
      examenes:    <ExamenesAdminPanel />,
      examen_oral: <ExamenOralView context={pendingOral} onNavigate={navigateTo} />,
      suspensiones: <SolicitudesUnificadasView onNavigate={navigateTo} />,
      solicitudes:  <SolicitudesUnificadasView onNavigate={navigateTo} />,
      grupos:       <AdminGruposView />,
      estudiantes:  <AdminEstudiantesView onNavigate={navigateTo} grupoInicial={pendingGrupo} />,
      cronograma_grupo: <CronogramaGrupo rol={rolReal} onNavigate={navigateTo} />,
      buscador:     <BuscadorEstudiantes />,
      banco:        <ImportadorBancario />,
      aplicar_pago: <AplicarPago />,
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
      {showWelcome && role === 'student' && <WelcomeBanner onClose={closeWelcome} />}
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

      // 2) Validación contra el servidor (si la función está disponible).
      if (typeof window.validarSesionServidor === 'function') {
        let r = null;
        try { r = await window.validarSesionServidor(); } catch (_) { r = null; }
        if (cancel) return;
        if (!r || !r.ok) {
          // Sesión inválida/expirada o sin conexión: limpiamos y al login.
          try {
            if (typeof window.cerrarSesionServidor === 'function') {
              await window.cerrarSesionServidor();
            }
          } catch (_) {}
          if (!cancel) campusIrALogin();
          return;
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
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<CampusGate />);
