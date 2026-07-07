/* global React, PageHeader, Icon */
// F98.4-Z6-CS5 · Puente comercial de prematrícula.
// Usuario gratis: crea/consulta solicitudes existentes, no genera matrícula/código y no escribe en DATOS/ESTATUS.

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
function freeStudentDateMs(v){
  if(!v)return 0;
  const raw=String(v||'');
  const d=v instanceof Date?v:new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?0:d.getTime();
}
function freeStudentFirstName(nombre){
  const s=String(nombre||'').trim();
  return (s.split(/\s+/)[0]||'estudiante').toUpperCase();
}
function freeStudentClean(v, fallback='—'){
  const s=String(v||'').trim();
  return s || fallback;
}
function freeStudentSolicitudTipoLabel(tipo){
  const meta=FREE_REQUEST_TYPES.find(t=>t.id===String(tipo||'').toUpperCase());
  return meta?meta.title:(tipo||'Solicitud');
}
function freeStudentNormalizeRequests(list){
  return (Array.isArray(list)?list:[]).slice().sort((a,b)=>freeStudentDateMs(b.FECHA_ISO||b.FECHA)-freeStudentDateMs(a.FECHA_ISO||a.FECHA));
}

const FREE_REQUEST_TYPES=[
  {
    id:'QUIERO_MATRICULARME',
    title:'Matricularme',
    desc:'activar proceso',
    channel:'Admisiones',
    priority:'Alta',
    promise:'Grupo, inicio, modalidad y pasos de activación.',
    needs:'Confirmar nombre, teléfono, correo y horario de preferencia.',
    template:'Hola, quiero confirmar mi matrícula. Por favor indíquenme el grupo disponible, fecha de inicio, horario, modalidad, precio y próximos pasos para activar mi cuenta de estudiante.',
  },
  {
    id:'CONSULTAR_HORARIO',
    title:'Horarios',
    desc:'ver opciones',
    channel:'Admisiones',
    priority:'Media',
    promise:'Opciones disponibles antes de matricular.',
    needs:'Indicar si prefiere noche, mañana, sábado o intensivo.',
    template:'Hola, quiero consultar qué horarios tienen disponibles antes de activar mi matrícula. Me interesa saber días, hora, fecha de inicio y cupos.',
  },
  {
    id:'FINANCIAMIENTO',
    title:'Pagos / CONAPE',
    desc:'orientación',
    channel:'Financiamiento',
    priority:'Media',
    promise:'Opciones de pago, financiamiento o CONAPE.',
    needs:'Indicar si desea pago directo, arreglo, beca o CONAPE.',
    template:'Hola, quiero que me orienten con opciones de pago, financiamiento o CONAPE antes de matricular. Necesito saber requisitos, montos y próximos pasos.',
  },
  {
    id:'CORREGIR_DATOS',
    title:'Mis datos',
    desc:'corregir perfil',
    channel:'Registro',
    priority:'Baja',
    promise:'Corrección de correo, teléfono o datos básicos de contacto.',
    needs:'Escribir claramente el dato actual y el dato correcto.',
    template:'Hola, quiero corregir o confirmar mis datos personales antes de activar mi matrícula. El dato que deseo revisar es:',
  },
  {
    id:'HABLAR_ASESOR',
    title:'Hablar con asesor',
    desc:'duda general',
    channel:'Servicio',
    priority:'Media',
    promise:'Aclaración general antes de matricular.',
    needs:'Explicar la duda concreta para evitar ida y vuelta.',
    template:'Hola, necesito hablar con un asesor porque tengo una duda antes de matricular. Mi consulta es:',
  },
];

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
function PrematQuickAction({active,title,desc,onClick,priority}){
  return <button type="button" className={`premat-quick-action ${active?'active':''}`} onClick={onClick}>
    <strong>{title}</strong>
    <small>{desc}</small>
    {priority&&<em>{priority}</em>}
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
function PrematGuidanceCard({label,value,desc,tone='neutral'}){
  return <div className={`premat-guidance-card ${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{desc}</small>
  </div>;
}
function PrematChecklistItem({ok,text}){
  return <li className={ok?'ok':''}><span>{ok?'✓':'•'}</span>{text}</li>;
}
function PrematRequestRow({solicitud,compact}){
  const estado=String(solicitud?.ESTADO||'PENDIENTE').toUpperCase();
  return <div className={`premat-request-row ${compact?'compact':''}`}>
    <div>
      <strong>{freeStudentSolicitudTipoLabel(solicitud?.TIPO)}</strong>
      <small>{freeStudentFmtDate(solicitud?.FECHA_ISO||solicitud?.FECHA)} · {solicitud?.MENSAJE||''}</small>
      {solicitud?.RESPUESTA&&<em>Respuesta: {solicitud.RESPUESTA}</em>}
    </div>
    <FreeStatusPill estado={estado}/>
  </div>;
}

function freeStudentBuildAdvisorPack({p,usuario,programa,grupoTentativo,requestMeta,mensaje,solicitudes}){
  const nombre=freeStudentClean(p.nombre||usuario?.nombre,'Sin nombre');
  const cedula=freeStudentClean(p.cedula||usuario?.cedula,'Sin cédula');
  const correo=freeStudentClean(p.correo||usuario?.correo,'Sin correo');
  const telefono=freeStudentClean(p.telefono||usuario?.telefono,'Sin teléfono');
  const etapa=freeStudentClean(p.etapa||usuario?.etapa,'Prematrícula');
  const ultima=solicitudes?.[0];
  const ultimaTxt=ultima?`${freeStudentSolicitudTipoLabel(ultima.TIPO)} · ${freeStudentFmtDate(ultima.FECHA_ISO||ultima.FECHA)} · ${String(ultima.ESTADO||'PENDIENTE').toUpperCase()}`:'Sin solicitudes previas';
  return [
    'FICHA PREMATRÍCULA · ACADEMIA NORTEAMERICANA',
    `Nombre: ${nombre}`,
    `Cédula: ${cedula}`,
    `Teléfono: ${telefono}`,
    `Correo: ${correo}`,
    `Programa de interés: ${freeStudentClean(programa,'Inglés Conversacional')}`,
    `Grupo tentativo: ${grupoTentativo||'Por asignar'}`,
    `Estado comercial: ${etapa}`,
    `Canal sugerido: ${requestMeta.channel}`,
    `Motivo actual: ${requestMeta.title}`,
    `Prioridad: ${requestMeta.priority}`,
    `Última gestión: ${ultimaTxt}`,
    '',
    'Mensaje del estudiante:',
    String(mensaje||'').trim()||'Sin mensaje escrito.',
    '',
    'Regla operativa: esta ficha NO activa matrícula, NO crea código académico y NO modifica DATOS/ESTATUS. La conversión debe hacerla admisiones de forma manual.'
  ].join('\n');
}
function PrematPipelineNode({title,desc,tone='neutral',done,current}){
  return <div className={`premat-pipeline-node ${tone} ${done?'done':''} ${current?'current':''}`}>
    <span>{done?'✓':current?'→':'•'}</span>
    <div><strong>{title}</strong><small>{desc}</small></div>
  </div>;
}
function PrematHandoffField({label,value,tone='neutral'}){
  return <div className={`premat-handoff-field ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

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
  const [fichaCopied,setFichaCopied]=React.useState(false);
  const load=React.useCallback(()=>{
    setLoading(true);setError('');
    freeStudentPost('freeUserMiPerfil')
      .then(r=>{setPerfil(r.perfil||{});setSolicitudes(freeStudentNormalizeRequests(r.solicitudes));})
      .catch(e=>{
        setError(e.message);
        setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||'Lead',programa:usuario?.programa});
        setSolicitudes([]);
      })
      .finally(()=>setLoading(false));
  },[usuario]);
  React.useEffect(()=>{load();},[load]);

  const requestMeta=FREE_REQUEST_TYPES.find(t=>t.id===contactoTipo)||FREE_REQUEST_TYPES[0];
  const elegirTipo=(tipo)=>{
    const meta=FREE_REQUEST_TYPES.find(t=>t.id===tipo)||FREE_REQUEST_TYPES[0];
    setContactoTipo(meta.id);setMensaje(meta.template);setCopied(false);setFichaCopied(false);
  };
  const copiarMensaje=async()=>{
    setCopied(false);setLastAction('Copiando mensaje…');
    try{
      if(navigator?.clipboard?.writeText){await navigator.clipboard.writeText(mensaje);setCopied(true);setLastAction('Mensaje copiado.');}
      else {setLastAction('Copiado no disponible en este navegador.');}
    }catch(_){setLastAction('No se pudo copiar el mensaje.');}
  };
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
  const pendienteMismoTipo=pendientes.find(s=>String(s.TIPO||'').toUpperCase()===contactoTipo);
  const haySolicitudPendiente=pendientes.length>0;
  const respondidas=solicitudes.filter(s=>String(s.ESTADO||'').toUpperCase()==='RESPONDIDA');
  const ultimaFecha=ultimaSolicitud?freeStudentFmtDate(ultimaSolicitud.FECHA_ISO||ultimaSolicitud.FECHA):'Sin solicitudes';
  const nombreOk=!!(p.nombre||usuario?.nombre);
  const correoOk=!!(p.correo||usuario?.correo);
  const telefonoOk=!!(p.telefono||usuario?.telefono);
  const readiness=Math.round(([nombreOk,correoOk,telefonoOk,!!programa].filter(Boolean).length/4)*100);
  const seguimientoEstado=haySolicitudPendiente?'En cola manual':respondidas.length?'Con respuesta':'Sin solicitud activa';
  const asesorPack=freeStudentBuildAdvisorPack({p,usuario,programa,grupoTentativo,requestMeta,mensaje,solicitudes});
  const copiarFicha=async()=>{
    setFichaCopied(false);setLastAction('Copiando ficha comercial…');
    try{
      if(navigator?.clipboard?.writeText){await navigator.clipboard.writeText(asesorPack);setFichaCopied(true);setLastAction('Ficha comercial copiada.');}
      else {setLastAction('Copiado no disponible en este navegador.');}
    }catch(_){setLastAction('No se pudo copiar la ficha comercial.');}
  };
  const prepararSolicitud=()=>{
    elegirTipo('QUIERO_MATRICULARME');
    setTimeout(()=>document.getElementById('premat-solicitud')?.scrollIntoView({behavior:'smooth',block:'center'}),50);
  };
  const go=(id)=>{ if(onNavigate) onNavigate(id); };
  return <div className="student-page premat-page" data-screen-label="Estudiante · Prematrícula unificada CS5">
    {typeof PageHeader==='function'?<PageHeader
      kicker="Mi Campus · Prematrícula"
      title={<>Bienvenida, <em>{freeStudentFirstName(nombre)}</em></>}
      sub="Este es el mismo portal estudiante, en modo prematrícula. Todavía no hay matrícula oficial, grupo activo, notas ni certificados. Sí podés solicitar contacto, copiar una ficha para asesoría y practicar gratis."
      right={<button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>Actualizar</button>}
    />:<div className="premat-fallback-title"><h1>Bienvenida, {freeStudentFirstName(nombre)}</h1></div>}

    <div aria-live="polite" className="sr-only">{lastAction}</div>
    {error&&<div className="premat-alert error">{error}</div>}
    {ok&&<div className="premat-alert ok">{ok}</div>}

    <section className="premat-hero">
      <div className="premat-hero-main">
        <span className="premat-kicker">Usuario gratis · post-formulario</span>
        <h2>Tu Campus ya existe, tu matrícula todavía no</h2>
        <p>Esta vista evita una confusión peligrosa: ver el portal no significa estar matriculado. CS5 ordena el seguimiento comercial, pero la conversión sigue siendo manual por admisiones.</p>
        <div className="premat-hero-facts">
          <span><b>Programa de interés</b>{freeStudentClean(programa)}</span>
          <span><b>Grupo</b>{grupoTentativo||'Por asignar'}</span>
          <span><b>Última gestión</b>{ultimaFecha}</span><span><b>Seguimiento</b>{seguimientoEstado}</span>
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
      <PrematMetric icon="play" label="Academia Play" value="Gratis" sub="5 juegos abiertos" tone="info" />
    </section>

    <section className="premat-gestiones-overview" aria-label="Resumen del Centro de gestiones">
      <PrematGuidanceCard tone="info" label="Bandeja" value={`${solicitudes.length} gestión${solicitudes.length===1?'':'es'}`} desc="Solicitudes creadas desde prematrícula." />
      <PrematGuidanceCard tone={pendientes.length?'warn':'ok'} label="Pendientes" value={String(pendientes.length)} desc={pendientes.length?'Hay solicitudes sin respuesta. Evitá duplicar si es el mismo tema.':'No hay gestiones pendientes.'} />
      <PrematGuidanceCard tone="ok" label="Respondidas" value={String(respondidas.length)} desc="Respuestas recibidas desde admisiones o gestión." />
      <PrematGuidanceCard tone="neutral" label="Canal sugerido" value={requestMeta.channel} desc={requestMeta.promise} />
      <PrematGuidanceCard tone={readiness>=75?'ok':'warn'} label="Ficha comercial" value={`${readiness}%`} desc="Datos mínimos listos para que admisiones contacte sin adivinar." />
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

        <PrematPanel kicker="Seguimiento comercial" title="Flujo recomendado antes de convertir">
          <div className="premat-pipeline">
            <PrematPipelineNode done title="Lead recibido" desc="El usuario ya puede entrar como prematrícula." tone="ok" />
            <PrematPipelineNode done={solicitudes.length>0} current={!solicitudes.length} title="Solicitud clasificada" desc="Debe elegir matrícula, horarios, pagos/CONAPE, datos o asesor." tone={solicitudes.length>0?'ok':'warn'} />
            <PrematPipelineNode done={respondidas.length>0} current={haySolicitudPendiente} title="Asesor contacta" desc="La atención sigue siendo manual; CS5 solo ordena la ficha." tone={respondidas.length>0?'ok':haySolicitudPendiente?'info':'neutral'} />
            <PrematPipelineNode done={estadoSolicitud==='CONVERTIDA'} title="Conversión real" desc="Solo admisiones puede activar matrícula, código, grupo y portal completo." tone={estadoSolicitud==='CONVERTIDA'?'ok':'neutral'} />
          </div>
          <div className="premat-note subtle">No conecté esto a ventas automáticamente porque sería una mala práctica sin definir bandeja, responsables, SLA y cierre de solicitudes.</div>
        </PrematPanel>

        <PrematPanel kicker="Academia Play gratis" title="Practicá mientras esperás" action={<button type="button" className="btn btn-primary" onClick={()=>go('academia_play')}>Abrir juegos</button>}>
          <div className="premat-games">
            <PrematGameCard title="Vocabulary Sprint" tag="Gratis" desc="Vocabulario básico en rondas cortas." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Word Match" tag="Gratis" desc="Uní palabras con su significado." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Daily Challenge" tag="Gratis" desc="Reto rápido de práctica diaria." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Phrase Builder" tag="Gratis" desc="Ordená frases útiles de clase." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Survival English" tag="Gratis" desc="Situaciones reales para empezar." onClick={()=>go('academia_play')} />
            <PrematGameCard title="Live Trivia" tag="Matrícula" desc="Juego en vivo activado por docente." locked />
          </div>
          <p className="premat-disclaimer">Academia Play en CS5 sigue siendo demo/frontend: no guarda intentos, no genera notas y no sustituye clases ni certificaciones.</p>
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
        <PrematPanel kicker="Ventas / admisiones" title="Ficha para seguimiento manual">
          <div className="premat-handoff-grid">
            <PrematHandoffField label="Canal" value={requestMeta.channel} tone="info" />
            <PrematHandoffField label="Prioridad" value={requestMeta.priority} tone={requestMeta.priority==='Alta'?'warn':'neutral'} />
            <PrematHandoffField label="Datos" value={`${readiness}%`} tone={readiness>=75?'ok':'warn'} />
            <PrematHandoffField label="Estado" value={seguimientoEstado} tone={haySolicitudPendiente?'warn':'neutral'} />
          </div>
          <div className="premat-handoff-preview" aria-label="Ficha comercial para copiar"><pre>{asesorPack}</pre></div>
          <div className="premat-request-actions">
            <button type="button" className="btn btn-ghost" onClick={copiarFicha}>{fichaCopied?'Ficha copiada':'Copiar ficha'}</button>
            <button type="button" className="btn btn-primary" onClick={prepararSolicitud}>Preparar matrícula</button>
          </div>
          <div className="premat-note subtle">Esta ficha es puente operativo. No envía WhatsApp, no crea tarea en ventas y no convierte al estudiante.</div>
        </PrematPanel>

        <PrematPanel kicker="Centro de gestiones" title="Solicitud inteligente">
          <div id="premat-solicitud" className="premat-request-box">
            <p>Elegí el motivo correcto. Esto evita ruido operativo: una solicitud mal clasificada hace que admisiones pierda tiempo y que el estudiante espere más.</p>
            <div className="premat-quick-actions" role="group" aria-label="Tipo de solicitud">
              {FREE_REQUEST_TYPES.map(t=><PrematQuickAction key={t.id} active={contactoTipo===t.id} title={t.title} desc={t.desc} priority={t.priority} onClick={()=>elegirTipo(t.id)} />)}
            </div>
            <div className="premat-selected-request">
              <span>Canal: <b>{requestMeta.channel}</b></span>
              <span>Necesita: {requestMeta.needs}</span>
            </div>
            {pendienteMismoTipo&&<div className="premat-duplicate-warning"><strong>Ya existe una solicitud pendiente de este tipo.</strong><small>Podés enviar otra, pero no conviene duplicar si no agrega información nueva.</small></div>}
            <textarea value={mensaje} onChange={e=>{setMensaje(e.target.value);setCopied(false);setFichaCopied(false);}} rows="6" maxLength="700" aria-label="Mensaje para admisiones" />
            <div className="premat-request-actions">
              <button type="button" className="btn btn-ghost" disabled={!mensaje.trim()} onClick={copiarMensaje}>{copied?'Copiado':'Copiar mensaje'}</button>
              <button type="button" className="btn btn-primary" disabled={busy||!mensaje.trim()} onClick={()=>enviar()}>{busy?'Enviando…':pendienteMismoTipo?'Enviar de todas formas':'Enviar solicitud'}</button>
            </div>
            {haySolicitudPendiente&&<div className="premat-pending"><span />Tenés {pendientes.length} solicitud{pendientes.length===1?'':'es'} pendiente{pendientes.length===1?'':'s'}.</div>}
          </div>
        </PrematPanel>

        <PrematPanel kicker="Checklist" title="Antes de activar matrícula">
          <ul className="premat-checklist">
            <PrematChecklistItem ok={nombreOk} text="Nombre identificado en prematrícula." />
            <PrematChecklistItem ok={correoOk} text="Correo disponible para notificaciones." />
            <PrematChecklistItem ok={telefonoOk} text="Teléfono disponible para contacto." />
            <PrematChecklistItem ok={!!grupoTentativo} text="Grupo tentativo definido." />
            <PrematChecklistItem ok={estadoSolicitud==='CONVERTIDA'} text="Matrícula convertida por admisiones." />
          </ul>
          <div className="premat-note subtle">Este checklist no activa nada por sí solo; solo orienta al usuario gratis.</div>
        </PrematPanel>

        <PrematPanel kicker="Últimas gestiones" title="Bandeja reciente">
          {!solicitudes.length?<div className="premat-empty">Todavía no hay gestiones registradas.</div>:<div className="premat-requests mini">
            {solicitudes.slice(0,3).map((s,i)=><PrematRequestRow solicitud={s} compact key={s.ID||i}/>) }
          </div>}
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
        {solicitudes.map((s,i)=><PrematRequestRow solicitud={s} key={s.ID||i}/>) }
      </div>}
    </PrematPanel>
  </div>;
}
window.FreeProspectPortal=FreeProspectPortal;
