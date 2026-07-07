/* global React, PageHeader */
// F98.4-Z6-CS7A · Bandeja interna simplificada de prematrículas.
// Usa endpoints existentes. No crea matrícula/código/grupo ni toca DATOS/ESTATUS.

function freeAdminToken(){try{return (window.getSessionToken&&window.getSessionToken())||((window.getSesion&&window.getSesion()||{}).token)||'';}catch(_){return'';}}
function freeAdminUrl(){const u=window.APPS_SCRIPT_URL||'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';if(!window.APPS_SCRIPT_URL)window.APPS_SCRIPT_URL=u;return u;}
async function freeAdminPost(fn,payload={}){
  const res=await fetch(freeAdminUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:freeAdminToken(),...payload})});
  const text=await res.text();let json=null;
  try{json=JSON.parse(text);}catch(_){throw new Error(text&&text.trim().startsWith('<')?'El backend devolvió HTML. Revisá la URL publicada de Apps Script.':'Respuesta inválida del servidor.');}
  if(!json?.ok)throw new Error(json?.mensaje||json?.error||'No se pudo completar la solicitud.');
  return json;
}
function freeAdminClean(v,fallback='—'){const s=String(v==null?'':v).trim();return s||fallback;}
function freeAdminUpper(v){return String(v||'').trim().toUpperCase();}
function freeAdminDateMs(v){if(!v)return 0;const raw=String(v||'');const d=new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?0:d.getTime();}
function freeAdminFmtDate(v){if(!v)return '—';const raw=String(v||'');const d=new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?raw:d.toLocaleString('es-CR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function freeAdminTipoLabel(tipo){const k=freeAdminUpper(tipo);return ({QUIERO_MATRICULARME:'Prematrícula',FINANCIAMIENTO:'Pago / CONAPE',HABLAR_ASESOR:'Asesor',CORREGIR_DATOS:'Datos',CONSULTAR_HORARIO:'Horario'})[k]||freeAdminClean(tipo,'Solicitud');}
function freeAdminEstadoMeta(estado){const k=freeAdminUpper(estado||'PENDIENTE');return ({PENDIENTE:['Pendiente','warn'],EN_GESTION:['En contacto','info'],RESPONDIDA:['Contactado','ok'],CONVERTIDA:['Prematrícula activa','ok'],CERRADA:['Cerrada','muted'],DESCARTADA:['Descartada','muted']})[k]||[k,'muted'];}
function FreeAdminBadge({estado}){const [label,tone]=freeAdminEstadoMeta(estado);return <span className={`free-admin-badge ${tone}`}>{label}</span>;}
function FreeAdminMetric({label,value,desc,tone='neutral'}){return <article className={`free-admin-metric ${tone}`}><span>{label}</span><strong>{value}</strong>{desc&&<small>{desc}</small>}</article>;}
function FreeAdminEmpty({title,desc}){return <div className="free-admin-empty"><strong>{title}</strong><small>{desc}</small></div>;}
function freeAdminNormalizeItems(items){return (Array.isArray(items)?items:[]).slice().sort((a,b)=>freeAdminDateMs(b.ULTIMA_ACCION_AT||b.FECHA_ISO||b.FECHA)-freeAdminDateMs(a.ULTIMA_ACCION_AT||a.FECHA_ISO||a.FECHA));}
function freeAdminAdvisor(s){return freeAdminClean(s.ASESOR||s.ASESOR_ASIGNADO||s.VENDEDOR||s.RESPONSABLE||s.ATENDIDO_POR,'Asesor asignado');}
function freeAdminNextStep(s){
  const estado=freeAdminUpper(s.ESTADO||'PENDIENTE');
  const tipo=freeAdminUpper(s.TIPO);
  if(estado==='PENDIENTE')return tipo==='FINANCIAMIENTO'?'Coordinar pago o CONAPE con su asesor.':'Contactar por WhatsApp.';
  if(estado==='EN_GESTION')return 'Registrar respuesta corta o marcar como contactado.';
  if(estado==='RESPONDIDA')return 'Esperar pago/confirmación o marcar prematrícula activa.';
  if(estado==='CONVERTIDA')return 'Acceso anticipado activo; matrícula oficial va por el flujo normal.';
  return 'Sin pendiente operativo.';
}
function freeAdminBuildFicha(s){return [
  'PREMATRÍCULA · SEGUIMIENTO',
  `Estado: ${freeAdminEstadoMeta(s.ESTADO)[0]}`,
  `Nombre: ${freeAdminClean(s.NOMBRE,'Sin nombre')}`,
  `Cédula: ${freeAdminClean(s.CEDULA,'Sin cédula')}`,
  `Teléfono: ${freeAdminClean(s.TELEFONO,'Sin teléfono')}`,
  `Correo: ${freeAdminClean(s.CORREO,'Sin correo')}`,
  `Curso: ${freeAdminClean(s.PROGRAMA||s.CURSO,'Inglés Conversacional')}`,
  `Grupo: ${freeAdminClean(s.GRUPO_TENTATIVO||s.GRUPO,'Por confirmar')}`,
  `Inicio: ${freeAdminClean(s.FECHA_INICIO||s.INICIO,'Por confirmar')}`,
  `Asesor: ${freeAdminAdvisor(s)}`,
  '',
  `Mensaje: ${freeAdminClean(s.MENSAJE,'Sin mensaje')}`,
  `Nota: ${freeAdminClean(s.ULTIMA_NOTA||s.RESPUESTA,'Sin nota')}`,
  '',
  'Nota operativa: marcar Prematrícula activa no crea matrícula oficial ni escribe DATOS/ESTATUS.'
].join('\n');}

const FREE_ADMIN_ESTADOS=['TODOS','PENDIENTE','EN_GESTION','RESPONDIDA','CONVERTIDA','CERRADA','DESCARTADA'];
const FREE_ADMIN_FAST_STATES=[
  {estado:'EN_GESTION',label:'Contactando'},
  {estado:'RESPONDIDA',label:'Contactado'},
  {estado:'CONVERTIDA',label:'Prematrícula activa'},
  {estado:'CERRADA',label:'Cerrar'},
];

function FreeUserRequestsAdminView({toast}){
  const [items,setItems]=React.useState([]);
  const [counts,setCounts]=React.useState({});
  const [estado,setEstado]=React.useState('PENDIENTE');
  const [q,setQ]=React.useState('');
  const [loading,setLoading]=React.useState(true);
  const [busy,setBusy]=React.useState('');
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
  const [selected,setSelected]=React.useState(null);
  const [nota,setNota]=React.useState('');
  const [copied,setCopied]=React.useState('');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');setOk('');
    try{
      const payload={limit:250};if(estado&&estado!=='TODOS')payload.estado=estado;
      const r=await freeAdminPost('freeUserListarSolicitudes',payload);
      const list=freeAdminNormalizeItems(r.items||[]);
      setItems(list);setCounts(r.counts||{});
      setSelected(prev=>prev?list.find(x=>String(x.ID||'')===String(prev.ID||''))||prev:null);
    }catch(e){setError(e.message);}finally{setLoading(false);}
  },[estado]);
  React.useEffect(()=>{load();},[load]);
  React.useEffect(()=>{const onChange=()=>load();window.addEventListener('an:free-user-solicitudes-changed',onChange);return()=>window.removeEventListener('an:free-user-solicitudes-changed',onChange);},[load]);

  const filtered=React.useMemo(()=>{
    const term=String(q||'').trim().toLowerCase();if(!term)return items;
    return items.filter(s=>[s.ID,s.NOMBRE,s.CEDULA,s.CORREO,s.TELEFONO,s.TIPO,s.ESTADO,s.MENSAJE,s.RESPUESTA,s.ULTIMA_NOTA,s.ASESOR,s.ASESOR_ASIGNADO,s.VENDEDOR,s.RESPONSABLE,s.PROGRAMA,s.GRUPO_TENTATIVO].some(v=>String(v||'').toLowerCase().includes(term)));
  },[items,q]);

  const aplicar=async(nextEstado)=>{
    if(!selected?.ID)return;
    setBusy(nextEstado);setError('');setOk('');
    try{
      const r=await freeAdminPost('freeUserResolverSolicitud',{id:selected.ID,estado:nextEstado,respuesta:nota||'',nota:nota||'',responsable:freeAdminAdvisor(selected)});
      setOk(r.mensaje||'Solicitud actualizada.');if(typeof toast==='function')toast('Prematrícula actualizada');
      setNota('');setCopied('');try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }
      await load();
    }catch(e){setError(e.message);}finally{setBusy('');}
  };
  const copiarFicha=async(s)=>{try{await navigator.clipboard.writeText(freeAdminBuildFicha(s));setCopied(String(s.ID||''));}catch(_){setError('No se pudo copiar la ficha.');}};
  const abrirWhatsApp=(s)=>{
    const tel=String(s.TELEFONO||'').replace(/\D/g,'');const cr=tel.length===8?'506'+tel:tel;
    if(!cr){setError('No hay teléfono utilizable.');return;}
    const msg=encodeURIComponent(`Hola ${freeAdminClean(s.NOMBRE,'')}, le escribe Academia Norteamericana sobre su prematrícula. Soy ${freeAdminAdvisor(s)}.`);
    window.open(`https://wa.me/${cr}?text=${msg}`,'_blank','noopener,noreferrer');
  };
  const abiertas=Number(counts.PENDIENTE||0)+Number(counts.EN_GESTION||0);

  return <div className="free-admin-page">
    {typeof PageHeader==='function'?<PageHeader kicker="Operación administrativa" title="Prematrículas" sub="Vista simple para ventas/admisiones. El asesor se toma del lead; no se reasigna manualmente." right={<button className="btn btn-ghost" type="button" onClick={load} disabled={loading}>Actualizar</button>} />:<h1>Prematrículas</h1>}

    <div className="free-admin-note"><strong>Nota:</strong> esta bandeja solo ordena el seguimiento. Prematrícula activa no crea matrícula, código, grupo oficial, pago, nota ni certificado.</div>
    {error&&<div className="premat-alert error">{error}</div>}{ok&&<div className="premat-alert ok">{ok}</div>}

    <section className="free-admin-metrics">
      <FreeAdminMetric label="Abiertas" value={abiertas||0} desc="Pendiente + en contacto" tone="info" />
      <FreeAdminMetric label="Pendientes" value={counts.PENDIENTE||0} desc="Sin contacto registrado" tone="warn" />
      <FreeAdminMetric label="Activas" value={counts.CONVERTIDA||0} desc="Acceso anticipado marcado" tone="ok" />
    </section>

    <section className="free-admin-toolbar">
      <div className="free-admin-filters">{FREE_ADMIN_ESTADOS.map(e=><button type="button" key={e} className={estado===e?'active':''} onClick={()=>{setEstado(e);setSelected(null);}}>{e==='TODOS'?'Todas':freeAdminEstadoMeta(e)[0]}</button>)}</div>
      <label className="free-admin-search"><span>Buscar</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre, cédula, teléfono, asesor…" /></label>
    </section>

    <section className="free-admin-layout">
      <div className="free-admin-list">
        {loading?<FreeAdminEmpty title="Cargando prematrículas…" desc=""/>:!filtered.length?<FreeAdminEmpty title="Sin solicitudes" desc="No hay registros para esta vista."/>:filtered.map(s=><button key={s.ID||s.CEDULA} type="button" className={`free-admin-row ${selected?.ID===s.ID?'active':''}`} onClick={()=>{setSelected(s);setNota('');setCopied('');}}>
          <div className="free-admin-row-main"><div><strong>{freeAdminClean(s.NOMBRE,'Sin nombre')}</strong><small>{freeAdminClean(s.CEDULA,'Sin cédula')} · {freeAdminTipoLabel(s.TIPO)} · {freeAdminFmtDate(s.ULTIMA_ACCION_AT||s.FECHA_ISO||s.FECHA)}</small></div><FreeAdminBadge estado={s.ESTADO}/></div>
          <p>{freeAdminClean(s.MENSAJE,'Sin mensaje')}</p>
          <footer><span>Asesor: {freeAdminAdvisor(s)}</span><span>{freeAdminNextStep(s)}</span></footer>
        </button>)}
      </div>

      <aside className="free-admin-detail">
        {!selected?<FreeAdminEmpty title="Seleccioná una prematrícula" desc="Aquí aparece la ficha limpia para ventas/admisiones."/>:<>
          <div className="free-admin-detail-head"><div><span>{freeAdminTipoLabel(selected.TIPO)}</span><h2>{freeAdminClean(selected.NOMBRE,'Sin nombre')}</h2><small>{freeAdminClean(selected.TELEFONO,'Sin teléfono')} · {freeAdminClean(selected.CORREO,'Sin correo')}</small></div><FreeAdminBadge estado={selected.ESTADO}/></div>
          <div className="free-admin-data-grid">
            <div><span>Curso</span><strong>{freeAdminClean(selected.PROGRAMA||selected.CURSO,'Inglés Conversacional')}</strong></div>
            <div><span>Grupo</span><strong>{freeAdminClean(selected.GRUPO_TENTATIVO||selected.GRUPO,'Por confirmar')}</strong></div>
            <div><span>Inicio</span><strong>{freeAdminClean(selected.FECHA_INICIO||selected.INICIO,'Por confirmar')}</strong></div>
            <div><span>Asesor</span><strong>{freeAdminAdvisor(selected)}</strong></div>
          </div>
          <div className="free-admin-message"><span>Mensaje</span><p>{freeAdminClean(selected.MENSAJE,'Sin mensaje')}</p></div>
          <div className="free-admin-message"><span>Próximo paso</span><p>{freeAdminNextStep(selected)}</p></div>
          <label className="free-admin-note-field"><span>Nota interna</span><textarea value={nota} onChange={e=>setNota(e.target.value)} rows="4" placeholder="Ej: contactado por WhatsApp, pago coordinado…" /></label>
          <div className="free-admin-state-buttons">{FREE_ADMIN_FAST_STATES.map(a=><button type="button" key={a.estado} disabled={!!busy} onClick={()=>aplicar(a.estado)}>{busy===a.estado?'Guardando…':a.label}</button>)}</div>
          <div className="free-admin-action-row"><button type="button" className="btn btn-ghost" onClick={()=>copiarFicha(selected)}>{copied===String(selected.ID||'')?'Ficha copiada':'Copiar ficha'}</button><button type="button" className="btn btn-primary" onClick={()=>abrirWhatsApp(selected)}>WhatsApp</button></div>
        </>}
      </aside>
    </section>
  </div>;
}
window.FreeUserRequestsAdminView=FreeUserRequestsAdminView;
