/* global React, PageHeader, Icon */
// F98.4-Z6-CS21A71 · Prematrícula activa sincronizada con English LAB.
// Cliente: solo solicitar entrada, entrar a English LAB y contactar asesor.

function freeStudentToken(){
  try{return (window.getSesion&&window.getSesion()||{}).token||'';}catch(_){return'';}
}
function freeStudentUrl(){
  const u=window.APPS_SCRIPT_URL||'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  if(!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL=u;
  return u;
}
function freeStudentSafeError(raw,fallback='No pudimos completar la solicitud. Intentá nuevamente o contactá a tu asesor.'){
  const msg=String(raw==null?'':raw).trim();
  if(!msg)return fallback;
  const tecnico=/apps?\s*script|backend|endpoint|stack|exception|trace|html|json|token|sesion_requerida|unauthorized|forbidden|internal server|status\s*\d{3}/i;
  return tecnico.test(msg)?fallback:msg;
}
async function freeStudentPost(fn,payload={}){
  const token=freeStudentToken();
  const res=await fetch(freeStudentUrl(),{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token,...payload}),
  });
  const text=await res.text();
  let json=null;
  try{json=JSON.parse(text);}catch(err){
    console.error('[Prematricula] Respuesta no JSON',{fn,status:res.status,error:err});
    throw new Error('No pudimos cargar tu información. Intentá nuevamente o contactá a tu asesor.');
  }
  if(!json?.ok){
    const raw=json?.mensaje||json?.error||'';
    console.warn('[Prematricula] Solicitud rechazada',{fn,status:res.status,error:raw});
    throw new Error(freeStudentSafeError(raw));
  }
  return json;
}
function freeStudentClean(v,fallback='—'){
  const s=String(v==null?'':v).trim();
  return s||fallback;
}
function freeStudentBool(v){return v===true||/^(TRUE|SI|SÍ|1|YES)$/i.test(String(v==null?'':v).trim());}
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
  {id:'QUIERO_MATRICULARME',title:'Activar prematrícula',desc:'confirmar acceso',template:'Hola, quiero solicitar mi entrada a prematrícula.'},
  {id:'FINANCIAMIENTO',title:'Coordinar pago',desc:'pago o CONAPE',template:'Hola, quiero coordinar el pago o financiamiento de mi matrícula. Por favor indíquenme el paso que corresponde para completar la activación.'},
  {id:'HABLAR_ASESOR',title:'Mi asesor',desc:'consulta directa',template:'Hola, necesito contactar a mi asesor por WhatsApp.'},
  {id:'CORREGIR_DATOS',title:'Actualizar datos',desc:'correo/teléfono',template:'Hola, quiero corregir o confirmar mis datos antes de activar la matrícula. El dato correcto es:'},
];

function freeStudentPhoneDigits(v){
  const d=String(v==null?'':v).replace(/\D/g,'');
  if(!d)return '';
  if(d.length===8)return '506'+d;
  return d;
}
function freeStudentWhatsAppLink(perfil,usuario){
  const raw=freeStudentValue(perfil||{},[
    'asesor_whatsapp','ASESOR_WHATSAPP','asesorWhatsapp','wa_asesor','WA_ASESOR',
    'telefono_asesor','TELEFONO_ASESOR','asesor_tel','ASESOR_TEL',
    'whatsapp_asesor','WHATSAPP_ASESOR','telefonoAsesor'
  ],freeStudentValue(usuario||{},[
    'asesor_whatsapp','asesorWhatsapp','telefono_asesor','asesor_tel','whatsapp_asesor','telefonoAsesor'
  ],''));
  const phone=freeStudentPhoneDigits(raw);
  const msg=encodeURIComponent('Hola, ya envié mi solicitud de entrada a English LAB desde el Campus Virtual y deseo matricularme. Quedo atento(a) a la guía del asesor.');
  return phone?`https://wa.me/${phone}?text=${msg}`:'';
}

function FreeProspectPortal({usuario,onNavigate}){
  const [perfil,setPerfil]=React.useState(null);
  const [solicitudes,setSolicitudes]=React.useState([]);
  const [labAccess,setLabAccess]=React.useState(null);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
  const [busy,setBusy]=React.useState(false);
  const [lastAction,setLastAction]=React.useState('');

  const load=React.useCallback(()=>{
    setLoading(true);setError('');
    freeStudentPost('freeUserMiPerfil')
      .then(r=>{
        setPerfil(r.perfil||{});
        setSolicitudes(freeStudentNormalizeRequests(r.solicitudes));
        const access=r.acceso_english_lab||r.perfil?.acceso_english_lab||null;
        setLabAccess(access);
        try{if(access&&window.anEnglishLabFreeAccess?.prime)window.anEnglishLabFreeAccess.prime(access);}catch(_){}
      })
      .catch(e=>{
        setError(e.message);
        setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||'Prematrícula'});
        setSolicitudes([]);
      })
      .finally(()=>setLoading(false));
  },[usuario]);
  React.useEffect(()=>{load();},[load]);

  React.useEffect(()=>{
    try{
      const snapshot=window.anEnglishLabFreeAccess?.get?.();
      if(snapshot?.checked)setLabAccess(snapshot);
    }catch(_){}
    const update=e=>setLabAccess(e?.detail||null);
    window.addEventListener('an:english-lab-free-access',update);
    return()=>window.removeEventListener('an:english-lab-free-access',update);
  },[]);

  const p=perfil||{};
  const prematRequest=solicitudes.find(s=>String(s.TIPO||'').toUpperCase()==='QUIERO_MATRICULARME'&&!['DESCARTADA','CERRADA'].includes(String(s.ESTADO||'').toUpperCase()));
  const prematEstado=String(prematRequest?.ESTADO||'').toUpperCase();
  const accessFromSession=freeStudentBool(usuario?.english_lab_gratis_autorizado||usuario?.inicio_gratuito_autorizado);
  const accessFromProfile=labAccess?.allowed===true||labAccess?.autorizado===true;
  const accesoPlay=accessFromSession||accessFromProfile;
  const prematPendiente=!!prematRequest&&!accesoPlay;
  const asesorWa=freeStudentWhatsAppLink(p,usuario);

  const enviarSolicitud=async()=>{
    setBusy(true);setError('');setOk('');setLastAction('Solicitando entrada…');
    try{
      const template=FREE_REQUEST_TYPES[0].template;
      const r=await freeStudentPost('freeUserCrearSolicitud',{tipo:'QUIERO_MATRICULARME',mensaje:template});
      setOk(r.mensaje||'Entrada solicitada.');
      setLastAction('Entrada solicitada.');
      await load();
      try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){}
    }catch(e){setError(e.message);setLastAction('No se pudo solicitar.');}
    finally{setBusy(false);}
  };

  const contactarAsesor=async()=>{
    if(asesorWa){window.open(asesorWa,'_blank','noopener,noreferrer');return;}
    setBusy(true);setError('');setOk('');setLastAction('Solicitando contacto…');
    try{
      const template=FREE_REQUEST_TYPES.find(t=>t.id==='HABLAR_ASESOR')?.template||'Hola, necesito que mi asesor me contacte para continuar con mi prematrícula.';
      const r=await freeStudentPost('freeUserCrearSolicitud',{tipo:'HABLAR_ASESOR',mensaje:template});
      setOk(r.mensaje||'Solicitud enviada al asesor.');
      setLastAction('Solicitud enviada.');
      await load();
      try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){}
    }catch(e){setError(e.message);setLastAction('No se pudo contactar.');}
    finally{setBusy(false);}
  };

  const goLab=()=>{if(onNavigate)onNavigate('academia_play');};

  return <div className="student-page premat-page premat-page-two-actions" data-screen-label="Mi Campus · Prematrícula limpia">
    <div aria-live="polite" className="sr-only">{lastAction}</div>
    {error&&<div className="premat-alert error">{error}</div>}
    {ok&&<div className="premat-alert ok">{ok}</div>}
    <section className="premat-two-actions-card">
      <div className="premat-two-actions-grid">
        {accesoPlay
          ?<button type="button" className="btn btn-primary premat-big-action" onClick={goLab}>Entrar a English LAB</button>
          :<button type="button" className="btn btn-primary premat-big-action" disabled={busy||loading||prematPendiente} onClick={enviarSolicitud}>{busy?'Solicitando…':prematPendiente?'Solicitud enviada · esperando aprobación':'Solicitar entrada English LAB'}</button>}
        <button type="button" className="btn btn-ghost premat-big-action" disabled={busy} onClick={contactarAsesor}>Contactar asesor por WhatsApp para matricular</button>
      </div>
    </section>
  </div>;
}
window.FreeProspectPortal=FreeProspectPortal;