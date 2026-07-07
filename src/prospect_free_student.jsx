/* global React, PageHeader, Icon */
// F98.4-Z6-CS1 · Prematrícula visual unificada con portal estudiante real.
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
function PrematLockedCard({icon,title,desc}){
  return <div className="premat-locked-card" aria-disabled="true">
    <div className="premat-lock-icon">{typeof Icon==='function'?<Icon name={icon} size={18}/>:null}</div>
    <div><strong>{title}</strong><small>{desc}</small></div>
    <span>Bloqueado</span>
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
    <em>{locked?'Disponible al activar matrícula':'Abrir práctica'}</em>
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
function FreeProspectPortal({ usuario, onNavigate }){
  const [perfil,setPerfil]=React.useState(null);
  const [solicitudes,setSolicitudes]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
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
  const enviar=async(tipo='QUIERO_MATRICULARME',texto=mensaje)=>{
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
  const go=(id)=>{ if(onNavigate) onNavigate(id); };
  return <div className="student-page premat-page" data-screen-label="Estudiante · Prematrícula unificada">
    {typeof PageHeader==='function'?<PageHeader
      kicker="Mi Campus · Inglés Conversacional"
      title={<>Bienvenida, <em>{freeStudentFirstName(nombre)}</em></>}
      sub="Tu cuenta ya está creada. Mientras admisiones activa tu matrícula, podés practicar gratis en Academia Play y solicitar contacto desde este mismo portal."
      right={<button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>Actualizar</button>}
    />:<div className="premat-fallback-title"><h1>Bienvenida, {freeStudentFirstName(nombre)}</h1></div>}

    <div aria-live="polite" className="sr-only">{lastAction}</div>
    {error&&<div className="premat-alert error">{error}</div>}
    {ok&&<div className="premat-alert ok">{ok}</div>}

    <section className="premat-hero">
      <div className="premat-hero-main">
        <span className="premat-kicker">Prematrícula · usuario gratis post-formulario</span>
        <h2>Tu matrícula está en proceso</h2>
        <p>Este acceso es el mismo portal estudiante, pero en estado prematrícula: sin matrícula activa, sin grupo oficial y sin datos académicos desbloqueados todavía.</p>
        <div className="premat-hero-facts">
          <span><b>Programa de interés</b>{programa}</span>
          <span><b>Grupo</b>{grupoTentativo||'Por asignar'}</span>
          <span><b>Solicitud</b><FreeStatusPill estado={estadoSolicitud}/></span>
        </div>
        <div className="premat-hero-actions">
          <button type="button" className="btn btn-primary" onClick={()=>document.getElementById('premat-solicitud')?.scrollIntoView({behavior:'smooth',block:'center'})}>Solicitar contacto</button>
          <button type="button" className="btn btn-ghost" onClick={()=>go('academia_play')}>Practicar gratis en Academia Play</button>
        </div>
      </div>
      <aside className="premat-status-card">
        <span>Estado actual</span>
        <strong>Prematrícula</strong>
        <small>{etapa} · sin matrícula activa y sin código académico.</small>
        <PrematTimeline estado={estadoSolicitud}/>
      </aside>
    </section>

    <section className="premat-metrics">
      <PrematMetric icon="profile" label="Perfil" value="Activo" sub="acceso con tu contraseña" tone="ok" />
      <PrematMetric icon="graduation" label="Matrícula" value="Pendiente" sub="admisiones debe activar" tone="warn" />
      <PrematMetric icon="calendar" label="Grupo" value={grupoTentativo?'Tentativo':'Por asignar'} sub="no oficial todavía" tone="neutral" />
      <PrematMetric icon="play" label="Academia Play" value="Gratis" sub="3 juegos abiertos" tone="info" />
    </section>

    <div className="premat-layout">
      <div className="premat-main-col">
        <PrematPanel kicker="Mi perfil" title="Datos del formulario">
          {loading?<div className="premat-skeleton">Consultando datos…</div>:<div className="premat-data-grid">
            <div><span>Nombre</span><strong>{p.nombre||usuario?.nombre||'—'}</strong></div>
            <div><span>Cédula</span><strong>{p.cedula||usuario?.cedula||'—'}</strong></div>
            <div><span>Correo</span><strong>{p.correo||usuario?.correo||'—'}</strong></div>
            <div><span>Teléfono</span><strong>{p.telefono||usuario?.telefono||'—'}</strong></div>
            <div><span>Programa de interés</span><strong>{programa}</strong></div>
            <div><span>Estado comercial</span><strong>{etapa}</strong></div>
          </div>}
          <div className="premat-note">Cuando admisiones genere la matrícula, este mismo Campus mostrará curso, cronograma, pagos, evaluaciones y certificados. Este módulo no toca DATOS ni ESTATUS.</div>
        </PrematPanel>

        <PrematPanel kicker="Onboarding" title="Próximos pasos">
          <div className="premat-steps">
            <PrematStep n="1" done title="Formulario recibido" desc="Tu perfil gratis ya puede entrar al Campus." />
            <PrematStep n="2" current={!haySolicitudPendiente} done={estadoSolicitud==='EN_GESTION'||estadoSolicitud==='RESPONDIDA'||estadoSolicitud==='CONVERTIDA'} title="Contacto con admisiones" desc="Enviá una solicitud o respondé al asesor asignado." />
            <PrematStep n="3" done={estadoSolicitud==='RESPONDIDA'||estadoSolicitud==='CONVERTIDA'} title="Confirmar matrícula" desc="Se define horario, plan y fecha de inicio." />
            <PrematStep n="4" done={estadoSolicitud==='CONVERTIDA'} title="Desbloquear curso" desc="Aparecen cronograma, pagos, evaluaciones y certificados." />
          </div>
        </PrematPanel>

        <PrematPanel kicker="Academia Play gratis" title="Practicá mientras esperás" action={<button type="button" className="btn btn-primary" onClick={()=>go('academia_play')}>Abrir juegos</button>}>
          <div className="premat-games">
            <PrematGameCard title="Vocabulary Sprint" tag="Gratis" desc="Vocabulario básico en rondas cortas." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Word Match" tag="Gratis" desc="Uní palabras con su significado." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Daily Challenge" tag="Gratis" desc="Reto rápido de práctica diaria." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Live Trivia" tag="Matrícula" desc="Juego en vivo activado por docente." locked />
          </div>
          <p className="premat-disclaimer">Academia Play en CS1 es demo/frontend: no guarda intentos, no genera notas y no sustituye clases ni certificaciones.</p>
        </PrematPanel>
      </div>

      <aside className="premat-side-col">
        <PrematPanel kicker="Centro de gestiones" title="Solicitar contacto">
          <div id="premat-solicitud" className="premat-request-box">
            <p>La solicitud entra al Centro de gestiones para que ventas/admisiones la revise. Evitá mandar varias iguales: eso mete ruido operativo.</p>
            <textarea value={mensaje} onChange={e=>setMensaje(e.target.value)} rows="5" maxLength="700" aria-label="Mensaje para admisiones" />
            <button type="button" className="btn btn-primary" disabled={busy||!mensaje.trim()} onClick={()=>enviar()}>{busy?'Enviando…':haySolicitudPendiente?'Enviar seguimiento':'Enviar solicitud'}</button>
            <button type="button" className="btn btn-ghost premat-secondary-action" disabled={busy} onClick={()=>enviar('CORREGIR_DATOS','Quiero corregir o confirmar mis datos personales antes de activar mi matrícula.')}>Corregir mis datos</button>
            {haySolicitudPendiente&&<div className="premat-pending"><span />Tenés {pendientes.length} solicitud{pendientes.length===1?'':'es'} pendiente{pendientes.length===1?'':'s'}.</div>}
          </div>
        </PrematPanel>

        <PrematPanel kicker="Módulos oficiales" title="Se desbloquean al matricular">
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
