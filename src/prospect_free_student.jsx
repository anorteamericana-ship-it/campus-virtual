/* global React, PageHeader, Icon */
// F98.4-Z6-CS7C · Prematrícula simplificada limpia.
// Portal de seguimiento inicial para solicitudes de ingreso.

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
  try{json=JSON.parse(text);}catch(_){throw new Error(text&&text.trim().startsWith('<')?'El servicio no está disponible en este momento. Intentá de nuevo más tarde.':'Respuesta inválida del servidor.');}
  if(!json?.ok) throw new Error(json?.mensaje||json?.error||'No se pudo completar la solicitud.');
  return json;
}
function freeStudentClean(v,fallback='—'){
  const s=String(v==null?'':v).trim();
  return s||fallback;
}
function freeStudentFirstName(nombre){
  const s=String(nombre||'').trim();
  return (s.split(/\s+/)[0]||'estudiante').toUpperCase();
}
function freeStudentDateMs(v){
  if(!v)return 0;
  const raw=String(v||'');
  const d=v instanceof Date?v:new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?0:d.getTime();
}
function freeStudentFmtDate(v){
  if(!v)return '—';
  const raw=String(v||'');
  const d=v instanceof Date?v:new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?raw:d.toLocaleDateString('es-CR',{day:'2-digit',month:'short',year:'numeric'});
}
function freeStudentNormalizeRequests(list){
  return (Array.isArray(list)?list:[]).slice().sort((a,b)=>freeStudentDateMs(b.ULTIMA_ACCION_AT||b.FECHA_ISO||b.FECHA)-freeStudentDateMs(a.ULTIMA_ACCION_AT||a.FECHA_ISO||a.FECHA));
}
function freeStudentValue(obj,keys,fallback=''){
  for(const k of keys){
    const v=obj&&obj[k];
    if(String(v==null?'':v).trim())return v;
  }
  return fallback;
}
function freeStudentSolicitudTipoLabel(tipo){
  const k=String(tipo||'').toUpperCase();
  const map={QUIERO_MATRICULARME:'Prematrícula',FINANCIAMIENTO:'Pago / CONAPE',HABLAR_ASESOR:'Asesor',CORREGIR_DATOS:'Datos'};
  return map[k]||freeStudentClean(tipo,'Solicitud');
}
function freeStudentEstadoLabel(estado){
  const k=String(estado||'PENDIENTE').toUpperCase();
  const map={PENDIENTE:['Pendiente','warn'],EN_GESTION:['En contacto','info'],RESPONDIDA:['Contactado','ok'],CONVERTIDA:['Prematrícula activa','ok'],CERRADA:['Cerrada','muted'],DESCARTADA:['Descartada','muted']};
  return map[k]||[k,'muted'];
}
function FreeStatusPill({estado}){
  const [label,tone]=freeStudentEstadoLabel(estado);
  return <span className={`premat-pill ${tone}`}>{label}</span>;
}
function PrematPanel({kicker,title,children,action,compact}){
  return <section className={`premat-panel ${compact?'compact':''}`}>
    <div className="premat-panel-head"><div><span>{kicker}</span><h2>{title}</h2></div>{action}</div>
    {children}
  </section>;
}
function PrematAccessCard({label,value,tone='neutral',icon='profile'}){
  return <article className={`premat-access-card ${tone}`}>
    <div className="premat-access-icon">{typeof Icon==='function'?<Icon name={icon} size={18}/>:null}</div>
    <div><span>{label}</span><strong>{value}</strong></div>
  </article>;
}
function PrematGameCard({title,desc,tag,onClick,locked}){
  return <button type="button" className={`premat-game-card ${locked?'locked':''}`} onClick={locked?undefined:onClick} disabled={locked}>
    <span className="premat-game-tag">{tag}</span>
    <strong>{title}</strong>
    <small>{desc}</small>
    <em>{locked?'Después de matrícula':'Abrir juego'}</em>
  </button>;
}
function PrematRequestRow({solicitud,compact}){
  const estado=String(solicitud?.ESTADO||'PENDIENTE').toUpperCase();
  return <div className={`premat-request-row ${compact?'compact':''}`}>
    <div>
      <strong>{freeStudentSolicitudTipoLabel(solicitud?.TIPO)}</strong>
      <small>{freeStudentFmtDate(solicitud?.FECHA_ISO||solicitud?.FECHA)} · {solicitud?.MENSAJE||''}</small>
      {(solicitud?.RESPUESTA||solicitud?.ULTIMA_NOTA)&&<em>Nota: {solicitud.RESPUESTA||solicitud.ULTIMA_NOTA}</em>}
    </div>
    <FreeStatusPill estado={estado}/>
  </div>;
}

const FREE_REQUEST_TYPES=[
  {id:'QUIERO_MATRICULARME',title:'Confirmar solicitud',desc:'siguiente paso',template:'Hola, quiero confirmar mi solicitud de ingreso y conocer el siguiente paso para completar la matrícula.'},
  {id:'FINANCIAMIENTO',title:'Coordinar pago',desc:'pago o CONAPE',template:'Hola, quiero coordinar el pago o financiamiento de mi matrícula. Por favor indíquenme el paso que corresponde para completar la activación.'},
  {id:'HABLAR_ASESOR',title:'Mi asesor',desc:'consulta directa',template:'Hola, necesito que mi asesor me contacte para terminar de coordinar mi prematrícula.'},
  {id:'CORREGIR_DATOS',title:'Actualizar datos',desc:'correo/teléfono',template:'Hola, quiero corregir o confirmar mis datos antes de activar la matrícula. El dato correcto es:'},
];

function FreeProspectPortal({ usuario, onNavigate }){
  const [perfil,setPerfil]=React.useState(null);
  const [solicitudes,setSolicitudes]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
  const [contactoTipo,setContactoTipo]=React.useState('QUIERO_MATRICULARME');
  const [mensaje,setMensaje]=React.useState(FREE_REQUEST_TYPES[0].template);
  const [busy,setBusy]=React.useState(false);
  const [lastAction,setLastAction]=React.useState('');
  const [copied,setCopied]=React.useState(false);

  const load=React.useCallback(()=>{
    setLoading(true);setError('');
    freeStudentPost('freeUserMiPerfil')
      .then(r=>{setPerfil(r.perfil||{});setSolicitudes(freeStudentNormalizeRequests(r.solicitudes));})
      .catch(e=>{
        setError(e.message);
        setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||'Prematrícula',programa:usuario?.programa});
        setSolicitudes([]);
      })
      .finally(()=>setLoading(false));
  },[usuario]);
  React.useEffect(()=>{load();},[load]);

  const p=perfil||{};
  const nombre=p.nombre||usuario?.nombre||'Estudiante';
  const programa=freeStudentValue(p,['programa','PROGRAMA','curso','CURSO'],freeStudentValue(usuario||{},['programa','programa_interes','curso'],'Inglés Conversacional'));
  const grupo=freeStudentValue(p,['grupo_tentativo','grupoTentativo','GRUPO_TENTATIVO','grupo','GRUPO'],freeStudentValue(usuario||{},['grupo_tentativo','grupoTentativo','grupo','GRUPO'],'Por confirmar'));
  const fechaInicio=freeStudentValue(p,['fecha_inicio','fechaInicio','FECHA_INICIO','inicio','INICIO'],freeStudentValue(usuario||{},['fecha_inicio','fechaInicio','inicio'],'Por confirmar'));
  const horario=freeStudentValue(p,['horario','HORARIO','hora','HORA'],freeStudentValue(usuario||{},['horario','hora'],'Por confirmar'));
  const asesor=freeStudentValue(p,['asesor','ASESOR','asesor_asignado','asesorAsignado','vendedor','VENDEDOR','responsable','RESPONSABLE'],freeStudentValue(usuario||{},['asesor','asesor_asignado','vendedor','responsable'],'Asesor asignado'));
  const activacion = solicitudes.find(s=>String(s.TIPO||'').toUpperCase()==='QUIERO_MATRICULARME' && !['DESCARTADA','CERRADA'].includes(String(s.ESTADO||'').toUpperCase()));
  const ultimaSolicitud=solicitudes[0]||null;
  const estadoActual=activacion?.ESTADO||ultimaSolicitud?.ESTADO||'SIN_CONFIRMAR';
  const pendientes=solicitudes.filter(s=>String(s.ESTADO||'').toUpperCase()==='PENDIENTE');
  const accesoPlay=!!activacion;
  const meta=FREE_REQUEST_TYPES.find(t=>t.id===contactoTipo)||FREE_REQUEST_TYPES[0];

  const elegirTipo=(tipo)=>{
    const m=FREE_REQUEST_TYPES.find(t=>t.id===tipo)||FREE_REQUEST_TYPES[0];
    setContactoTipo(m.id);setMensaje(m.template);setCopied(false);
  };
  const copiarMensaje=async()=>{
    setCopied(false);setLastAction('Copiando mensaje…');
    try{
      if(navigator?.clipboard?.writeText){await navigator.clipboard.writeText(mensaje);setCopied(true);setLastAction('Mensaje copiado.');}
      else setLastAction('Copiado no disponible.');
    }catch(_){setLastAction('No se pudo copiar.');}
  };
  const enviarSolicitud=async(tipo=contactoTipo,texto=mensaje)=>{
    setBusy(true);setError('');setOk('');setLastAction('Enviando solicitud…');
    try{
      const r=await freeStudentPost('freeUserCrearSolicitud',{tipo,mensaje:texto});
      setOk(r.mensaje||'Solicitud enviada.');setLastAction('Solicitud enviada.');
      await load();
      try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }
      return true;
    }catch(e){setError(e.message);setLastAction('No se pudo enviar.');return false;}finally{setBusy(false);}
  };
  const enviar=()=>enviarSolicitud(contactoTipo,mensaje);
  const activarAcceso=async()=>{
    const template=FREE_REQUEST_TYPES[0].template;
    setContactoTipo('QUIERO_MATRICULARME');setMensaje(template);setCopied(false);
    const okSend=await enviarSolicitud('QUIERO_MATRICULARME',template);
    if(okSend){setOk('Solicitud confirmada. Ya podés continuar desde tu portal de prematrícula.');}
  };
  const go=(id)=>{ if(onNavigate) onNavigate(id); };

  return <div className="student-page premat-page premat-page-lite premat-page-clean" data-screen-label="Estudiante · Prematrícula CS7B">
    {typeof PageHeader==='function'?<PageHeader
      kicker="Mi Campus · Prematrícula"
      title={<>Bienvenida, <em>{freeStudentFirstName(nombre)}</em></>}
      sub="Revisá tus datos y coordiná el siguiente paso con admisiones."
      right={<button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>Actualizar</button>}
    />:<div className="premat-fallback-title"><h1>Bienvenida, {freeStudentFirstName(nombre)}</h1></div>}

    <div aria-live="polite" className="sr-only">{lastAction}</div>
    {error&&<div className="premat-alert error">{error}</div>}
    {ok&&<div className="premat-alert ok">{ok}</div>}

    <section className="premat-hero premat-hero-lite premat-hero-clean">
      <div className="premat-hero-main">
        <span className="premat-kicker">Prematrícula</span>
        <h2>{accesoPlay?'Solicitud en seguimiento':'Confirmá tu solicitud'}</h2>
        <p>{accesoPlay?'Tu solicitud ya quedó en seguimiento. Admisiones te acompañará con el siguiente paso.':'Confirmá tu solicitud para que admisiones pueda continuar la gestión.'}</p>
        <div className="premat-hero-actions">
          {accesoPlay
            ? <button type="button" className="btn btn-primary" onClick={()=>go('academia_play')}>Abrir práctica inicial</button>
            : <button type="button" className="btn btn-primary" disabled={busy} onClick={activarAcceso}>{busy?'Confirmando…':'Confirmar solicitud'}</button>}
          <button type="button" className="btn btn-ghost" onClick={()=>document.getElementById('premat-solicitud')?.scrollIntoView({behavior:'smooth',block:'center'})}>Coordinar pago</button>
        </div>
      </div>
      <aside className="premat-status-card">
        <span>Estado</span>
        <strong>{accesoPlay?freeStudentEstadoLabel(estadoActual)[0]:'Por activar'}</strong>
        <small>{pendientes.length?`${pendientes.length} gestión pendiente`:'Sin pasos extra'}</small>
      </aside>
    </section>

    <div className="premat-access-grid premat-access-grid-clean">
      <PrematAccessCard label="Curso" value={freeStudentClean(programa)} icon="book" tone="info" />
      <PrematAccessCard label="Grupo" value={freeStudentClean(grupo)} icon="groups" tone="ok" />
      <PrematAccessCard label="Inicio" value={freeStudentClean(fechaInicio)} icon="calendar" tone="neutral" />
      <PrematAccessCard label="Horario" value={freeStudentClean(horario)} icon="clock" tone="neutral" />
      <PrematAccessCard label="Asesor" value={freeStudentClean(asesor)} icon="profile" tone="info" />
    </div>

    <div className="premat-note premat-note-master">
      <strong>Importante:</strong> este portal es para dar seguimiento a tu solicitud. La matrícula se confirma con admisiones.
    </div>

    <div className="premat-layout premat-layout-clean">
      <PrematPanel kicker="Admisiones" title="Coordinar el siguiente paso">
        <div id="premat-solicitud" className="premat-request-box premat-request-lite">
          <div className="premat-quick-actions" role="group" aria-label="Tipo de solicitud">
            {FREE_REQUEST_TYPES.map(t=><button type="button" key={t.id} className={`premat-quick-action ${contactoTipo===t.id?'active':''}`} onClick={()=>elegirTipo(t.id)}><strong>{t.title}</strong><small>{t.desc}</small></button>)}
          </div>
          <textarea value={mensaje} onChange={e=>{setMensaje(e.target.value);setCopied(false);}} rows="4" maxLength="700" aria-label="Mensaje para asesor" />
          <div className="premat-request-actions">
            <button type="button" className="btn btn-ghost" disabled={!mensaje.trim()} onClick={copiarMensaje}>{copied?'Copiado':'Copiar'}</button>
            <button type="button" className="btn btn-primary" disabled={busy||!mensaje.trim()} onClick={enviar}>{busy?'Enviando…':'Enviar a mi asesor'}</button>
          </div>
        </div>
      </PrematPanel>

      <PrematPanel kicker="Gestiones" title="Último movimiento" compact>
        {!solicitudes.length?<div className="premat-empty">Sin gestiones registradas.</div>:<div className="premat-requests mini">
          {solicitudes.slice(0,3).map((s,i)=><PrematRequestRow solicitud={s} compact key={s.ID||i}/>) }
        </div>}
      </PrematPanel>
    </div>
  </div>;
}
window.FreeProspectPortal=FreeProspectPortal;
