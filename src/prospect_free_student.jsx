/* global React, PageHeader, Icon */
// F98.4-Z6-CS2 · Prematrícula visual pulida dentro del portal estudiante real.
// Usuario gratis: no crea matrícula, no genera código y no escribe en DATOS/ESTATUS.

function freeStudentToken(){
  try{return (window.getSesion&&window.getSesion()||{}).token||'';}catch(_){return'';}
}
function freeStudentUrl(){
  const u=window.APPS_SCRIPT_URL||'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  if(!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL=u;
  return u;
}
async function freeStudentPost(fn,payload={}){
  const token=freeStudentToken();
  const res=await fetch(freeStudentUrl(),{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token,...payload}),
  });
  const text=await res.text();
  let json=null;
  try{json=JSON.parse(text);}catch(_){throw new Error(text&&text.trim().startsWith('<')?'El backend devolvió HTML. Revisá la URL publicada de Apps Script.':'Respuesta inválida del servidor.');}
  if(!json?.ok) throw new Error(json?.mensaje||json?.error||'No se pudo completar la solicitud.');
  return json;
}
function freeStudentFmtDate(v){
  if(!v)return '—';
  const raw=String(v||'');
  const d=v instanceof Date?v:new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?raw:d.toLocaleDateString('es-CR',{day:'2-digit',month:'long',year:'numeric'});
}
function freeStudentFirstName(nombre){
  const s=String(nombre||'').trim();
  return (s.split(/\s+/)[0]||'estudiante').toUpperCase();
}
function freeStudentClean(v, fallback='—'){
  const s=String(v||'').trim();
  return s || fallback;
}
function FreeStatusPill({estado}){
  const k=String(estado||'PENDIENTE').toUpperCase();
  const map={
    PENDIENTE:['Pendiente','warn'],EN_GESTION:['En gestión','info'],RESPONDIDA:['Respondida','ok'],CONVERTIDA:['Convertida','ok'],CERRADA:['Cerrada','muted'],DESCARTADA:['Descartada','muted']
  };
  const [label,tone]=map[k]||[k,'muted'];
  return <span className={`premat-pill ${tone}`}>{label}</span>;
}
function PrematMetric({label,value,sub,tone='neutral',icon='profile'}){
  return <article className={`premat-metric ${tone}`}>
    <div className="premat-metric-icon">{typeof Icon==='function'?<Icon name={icon} size={18}/>:null}</div>
    <div><span>{label}</span><strong>{value}</strong>{sub&&<small>{sub}</small>}</div>
  </article>;
}
function PrematPanel({kicker,title,children,action,compact}){
  return <section className={`premat-panel ${compact?'compact':''}`}>
    <div className="premat-panel-head"><div><span>{kicker}</span><h2>{title}</h2></div>{action}</div>
    {children}
  </section>;
}
function PrematLockedCard({icon,title,desc,phase='Después de matrícula'}){
  return <div className="premat-locked-card" aria-disabled="true">
    <div className="premat-lock-icon">{typeof Icon==='function'?<Icon name={icon} size={18}/>:null}</div>
    <div><strong>{title}</strong><small>{desc}</small></div>
    <span>{phase}</span>
  </div>;
}
function PrematStep({n,title,desc,done,current}){
  return <div className={`premat-step ${done?'done':''} ${current?'current':''}`}>
    <span>{done?'✓':n}</span>
    <div><strong>{title}</strong><small>{desc}</small></div>
  </div>;
}
function PrematGameCard({title,desc,tag,onClick,locked}){
  return <button type="button" className={`premat-game-card ${locked?'locked':''}`} onClick={locked?undefined:onClick} disabled={locked}>
    <span className="premat-game-tag">{tag}</span>
    <strong>{title}</strong>
    <small>{desc}</small>
    <em>{locked?'Se desbloquea con matrícula':'Abrir práctica'}</em>
  </button>;
}
function PrematTimeline({estado}){
  const st=String(estado||'').toUpperCase();
  const step2=st==='EN_GESTION'||st==='RESPONDIDA'||st==='CONVERTIDA';
  const step3=st==='RESPONDIDA'||st==='CONVERTIDA';
  const step4=st==='CONVERTIDA';
  const pct=step4?100:step3?75:step2?50:25;
  return <div className="premat-timeline">
    <div className="premat-timeline-top"><strong>Camino a tu matrícula</strong><span>{step4?'4/4':step3?'3/4':step2?'2/4':'1/4'}</span></div>
    <div className="premat-timeline-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct} aria-label="Avance de prematrícula"><i style={{width:pct+'%'}} /></div>
  </div>;
}
function PrematQuickAction({active,title,desc,onClick}){
  return <button type="button" className={`premat-quick-action ${active?'active':''}`} onClick={onClick}>
    <strong>{title}</strong>
    <small>{desc}</small>
  </button>;
}
function PrematRuleCard({tone='neutral',title,desc}){
  return <div className={`premat-rule-card ${tone}`}>
    <strong>{title}</strong>
    <small>{desc}</small>
  </div>;
}
function PrematMiniStatus({label,value,tone='neutral'}){
  return <div className={`premat-mini-status ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function FreeProspectPortal({ usuario, onNavigate }){
  const [perfil,setPerfil]=React.useState(null);
  const [solicitudes,setSolicitudes]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
  const [contactoTipo,setContactoTipo]=React.useState('QUIERO_MATRICULARME');
  const [mensaje,setMensaje]=React.useState('Hola, quiero confirmar mi matrícula y que me contacten para conocer mi grupo, horario y próximos pasos.');
  const [busy,setBusy]=React.useState(false);
  const [lastAction,setLastAction]=React.useState('');
  const load=React.useCallback(()=>{
    setLoading(true);setError('');
    freeStudentPost('freeUserMiPerfil')
      .then(r=>{setPerfil(r.perfil||{});setSolicitudes(Array.isArray(r.solicitudes)?r.solicitudes:[]);})
      .catch(e=>{
        setError(e.message);
        setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||'Lead',programa:usuario?.programa});
      })
      .finally(()=>setLoading(false));
  },[usuario]);
  React.useEffect(()=>{load();},[load]);

  const templates={
    QUIERO_MATRICULARME:'Hola, quiero confirmar mi matrícula y que me contacten para conocer mi grupo, horario y próximos pasos.',
    CONSULTAR_HORARIO:'Hola, quiero consultar qué horarios tienen disponibles antes de activar mi matrícula.',
    FINANCIAMIENTO:'Hola, quiero que me orienten con opciones de pago, financiamiento o CONAPE antes de matricular.',
    CORREGIR_DATOS:'Hola, quiero corregir o confirmar mis datos personales antes de activar mi matrícula.',
  };
  const elegirTipo=(tipo)=>{setContactoTipo(tipo);setMensaje(templates[tipo]||templates.QUIERO_MATRICULARME);};
  const enviar=async(tipo=contactoTipo,texto=mensaje)=>{
    setBusy(true);setError('');setOk('');setLastAction('Enviando solicitud…');
    try{
      const r=await freeStudentPost('freeUserCrearSolicitud',{tipo,mensaje:texto});
      setOk(r.mensaje||'Solicitud enviada.');
      setLastAction('Solicitud enviada al Centro de gestiones.');
      await load();
      try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }
    }catch(e){setError(e.message);setLastAction('No se pudo enviar la solicitud.');}finally{setBusy(false);}
  };

  const p=perfil||{};
  const nombre=p.nombre||usuario?.nombre||'Estudiante';
  const etapa=p.etapa||usuario?.etapa||'Prematrícula';
  const programa=p.programa||usuario?.programa||usuario?.programa_interes||'Inglés Conversacional';
  const grupoTentativo=p.grupo_tentativo||p.grupoTentativo||usuario?.grupo_tentativo||'';
  const ultimaSolicitud=solicitudes[0]||null;
  const estadoSolicitud=String(ultimaSolicitud?.ESTADO||'PENDIENTE').toUpperCase();
  const pendientes=solicitudes.filter(s=>String(s.ESTADO||'').toUpperCase()==='PENDIENTE');
  const haySolicitudPendiente=pendientes.length>0;
  const ultimaFecha=ultimaSolicitud?freeStudentFmtDate(ultimaSolicitud.FECHA_ISO||ultimaSolicitud.FECHA):'Sin solicitudes';
  const go=(id)=>{ if(onNavigate) onNavigate(id); };
  return <div className="student-page premat-page" data-screen-label="Estudiante · Prematrícula unificada CS2">
    {typeof PageHeader==='function'?<PageHeader
      kicker="Mi Campus · Prematrícula"
      title={<>Bienvenida, <em>{freeStudentFirstName(nombre)}</em></>}
      sub="Este es el mismo portal estudiante, en modo prematrícula. Todavía no hay matrícula oficial, grupo activo, notas ni certificados. Sí podés solicitar contacto y practicar gratis."
      right={<button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>Actualizar</button>}
    />:<div className="premat-fallback-title"><h1>Bienvenida, {freeStudentFirstName(nombre)}</h1></div>}

    <div aria-live="polite" className="sr-only">{lastAction}</div>
    {error&&<div className="premat-alert error">{error}</div>}
    {ok&&<div className="premat-alert ok">{ok}</div>}

    <section className="premat-hero">
      <div className="premat-hero-main">
        <span className="premat-kicker">Usuario gratis · post-formulario</span>
        <h2>Tu Campus ya existe, tu matrícula todavía no</h2>
        <p>Esta vista evita una confusión peligrosa: ver el portal no significa estar matriculado. Los módulos oficiales se desbloquean únicamente cuando admisiones active la matrícula real.</p>
        <div className="premat-hero-facts">
          <span><b>Programa de interés</b>{freeStudentClean(programa)}</span>
          <span><b>Grupo</b>{grupoTentativo||'Por asignar'}</span>
          <span><b>Última gestión</b>{ultimaFecha}</span>
        </div>
        <div className="premat-hero-actions">
          <button type="button" className="btn btn-primary" onClick={()=>document.getElementById('premat-solicitud')?.scrollIntoView({behavior:'smooth',block:'center'})}>Solicitar contacto</button>
          <button type="button" className="btn btn-ghost" onClick={()=>go('academia_play')}>Practicar gratis</button>
        </div>
      </div>
      <aside className="premat-status-card">
        <span>Estado actual</span>
        <strong>Prematrícula</strong>
        <small>{freeStudentClean(etapa,'Lead')} · sin código académico ni grupo oficial activo.</small>
        <PrematTimeline estado={estadoSolicitud}/>
      </aside>
    </section>

    <section className="premat-command-strip" aria-label="Estado del acceso">
      <PrematMiniStatus tone="ok" label="Acceso" value="Cuenta creada" />
      <PrematMiniStatus tone="warn" label="Matrícula" value="Pendiente" />
      <PrematMiniStatus tone="neutral" label="Grupo oficial" value="No asignado" />
      <PrematMiniStatus tone="info" label="Academia Play" value="Gratis visual" />
    </section>

    <section className="premat-metrics">
      <PrematMetric icon="profile" label="Perfil" value="Activo" sub="acceso con contraseña" tone="ok" />
      <PrematMetric icon="graduation" label="Matrícula" value="Pendiente" sub="admisiones debe activar" tone="warn" />
      <PrematMetric icon="calendar" label="Grupo" value={grupoTentativo?'Tentativo':'Por asignar'} sub="no oficial todavía" tone="neutral" />
      <PrematMetric icon="play" label="Academia Play" value="Gratis" sub="3 juegos abiertos" tone="info" />
    </section>

    <div className="premat-layout">
      <div className="premat-main-col">
        <PrematPanel kicker="Mi perfil" title="Datos recibidos del formulario">
          {loading?<div className="premat-skeleton">Consultando datos…</div>:<div className="premat-data-grid">
            <div><span>Nombre</span><strong>{freeStudentClean(p.nombre||usuario?.nombre)}</strong></div>
            <div><span>Cédula</span><strong>{freeStudentClean(p.cedula||usuario?.cedula)}</strong></div>
            <div><span>Correo</span><strong>{freeStudentClean(p.correo||usuario?.correo)}</strong></div>
            <div><span>Teléfono</span><strong>{freeStudentClean(p.telefono||usuario?.telefono)}</strong></div>
            <div><span>Programa de interés</span><strong>{freeStudentClean(programa)}</strong></div>
            <div><span>Estado comercial</span><strong>{freeStudentClean(etapa,'Prematrícula')}</strong></div>
          </div>}
          <div className="premat-note">Este bloque solo muestra información de prematrícula. No modifica DATOS, ESTATUS, notas, pagos ni certificados.</div>
        </PrematPanel>

        <PrematPanel kicker="Ruta de activación" title="Próximos pasos reales">
          <div className="premat-steps">
            <PrematStep n="1" done title="Formulario recibido" desc="Tu cuenta gratis ya puede entrar al Campus." />
            <PrematStep n="2" current={!haySolicitudPendiente} done={estadoSolicitud==='EN_GESTION'||estadoSolicitud==='RESPONDIDA'||estadoSolicitud==='CONVERTIDA'} title="Contacto con admisiones" desc="Pedí horario, plan de pago o confirmación de matrícula." />
            <PrematStep n="3" done={estadoSolicitud==='RESPONDIDA'||estadoSolicitud==='CONVERTIDA'} title="Confirmar condiciones" desc="Se define grupo, fecha de inicio, modalidad y pago." />
            <PrematStep n="4" done={estadoSolicitud==='CONVERTIDA'} title="Desbloquear portal" desc="Aparecen curso, cronograma, pagos, evaluaciones y certificados." />
          </div>
        </PrematPanel>

        <PrematPanel kicker="Academia Play gratis" title="Practicá mientras esperás" action={<button type="button" className="btn btn-primary" onClick={()=>go('academia_play')}>Abrir juegos</button>}>
          <div className="premat-games">
            <PrematGameCard title="Vocabulary Sprint" tag="Gratis" desc="Vocabulario básico en rondas cortas." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Word Match" tag="Gratis" desc="Uní palabras con su significado." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Daily Challenge" tag="Gratis" desc="Reto rápido de práctica diaria." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Live Trivia" tag="Matrícula" desc="Juego en vivo activado por docente." locked />
          </div>
          <p className="premat-disclaimer">Academia Play en CS2 sigue siendo demo/frontend: no guarda intentos, no genera notas y no sustituye clases ni certificaciones.</p>
        </PrematPanel>

        <PrematPanel kicker="Límites claros" title="Qué puede ver Camila antes de matricular">
          <div className="premat-rule-grid">
            <PrematRuleCard tone="ok" title="Sí puede" desc="Entrar al portal, revisar datos, pedir contacto y practicar juegos gratis." />
            <PrematRuleCard tone="warn" title="No puede" desc="Ver notas, pagos, certificados, cronograma oficial ni historial académico." />
            <PrematRuleCard tone="neutral" title="No se debe inventar" desc="Código, matrícula, grupo oficial, progreso académico, rachas o premios reales." />
          </div>
        </PrematPanel>
      </div>

      <aside className="premat-side-col">
        <PrematPanel kicker="Centro de gestiones" title="Solicitar contacto">
          <div id="premat-solicitud" className="premat-request-box">
            <p>Elegí el motivo y enviá una solicitud. Si ya hay una pendiente, no conviene duplicarla: usá el mensaje como seguimiento concreto.</p>
            <div className="premat-quick-actions" role="group" aria-label="Tipo de solicitud">
              <PrematQuickAction active={contactoTipo==='QUIERO_MATRICULARME'} title="Matricularme" desc="activar proceso" onClick={()=>elegirTipo('QUIERO_MATRICULARME')} />
              <PrematQuickAction active={contactoTipo==='CONSULTAR_HORARIO'} title="Horarios" desc="ver opciones" onClick={()=>elegirTipo('CONSULTAR_HORARIO')} />
              <PrematQuickAction active={contactoTipo==='FINANCIAMIENTO'} title="Pagos / CONAPE" desc="orientación" onClick={()=>elegirTipo('FINANCIAMIENTO')} />
              <PrematQuickAction active={contactoTipo==='CORREGIR_DATOS'} title="Mis datos" desc="corregir perfil" onClick={()=>elegirTipo('CORREGIR_DATOS')} />
            </div>
            <textarea value={mensaje} onChange={e=>setMensaje(e.target.value)} rows="5" maxLength="700" aria-label="Mensaje para admisiones" />
            <button type="button" className="btn btn-primary" disabled={busy||!mensaje.trim()} onClick={()=>enviar()}>{busy?'Enviando…':haySolicitudPendiente?'Enviar seguimiento':'Enviar solicitud'}</button>
            {haySolicitudPendiente&&<div className="premat-pending"><span />Tenés {pendientes.length} solicitud{pendientes.length===1?'':'es'} pendiente{pendientes.length===1?'':'s'}.</div>}
          </div>
        </PrematPanel>

        <PrematPanel kicker="Módulos oficiales" title="Bloqueados hasta matrícula">
          <div className="premat-locked-list">
            <PrematLockedCard icon="book" title="Mi curso" desc="Material y avance del grupo." />
            <PrematLockedCard icon="calendar" title="Cronograma" desc="Lecciones y horarios oficiales." />
            <PrematLockedCard icon="grades" title="Evaluaciones" desc="Exámenes y notas oficiales." />
            <PrematLockedCard icon="certificates" title="Certificados" desc="Títulos y documentos emitidos." />
            <PrematLockedCard icon="payments" title="Pagos" desc="Estado de cuenta y comprobantes." />
          </div>
        </PrematPanel>
      </aside>
    </div>

    <PrematPanel kicker="Historial" title="Solicitudes enviadas">
      {!solicitudes.length?<div className="premat-empty">Todavía no has enviado solicitudes.</div>:<div className="premat-requests">
        {solicitudes.map((s,i)=><div className="premat-request-row" key={s.ID||i}>
          <div><strong>{s.TIPO||'Solicitud'}</strong><small>{freeStudentFmtDate(s.FECHA_ISO||s.FECHA)} · {s.MENSAJE||''}</small>{s.RESPUESTA&&<em>Respuesta: {s.RESPUESTA}</em>}</div>
          <FreeStatusPill estado={s.ESTADO}/>
        </div>)}
      </div>}
    </PrematPanel>
  </div>;
}
window.FreeProspectPortal=FreeProspectPortal;
