/* global React, PageHeader, Icon */
// F98.4-Z6-CS7 · Bandeja interna conectada con ventas/admisiones.
// Usa SOLICITUDES_USUARIO_GRATIS vía endpoints existentes. No crea matrícula, código ni grupo oficial.

function freeAdminToken(){
  try{return (window.getSessionToken&&window.getSessionToken())||((window.getSesion&&window.getSesion()||{}).token)||'';}catch(_){return'';}
}
function freeAdminUrl(){
  const u=window.APPS_SCRIPT_URL||'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
  if(!window.APPS_SCRIPT_URL) window.APPS_SCRIPT_URL=u;
  return u;
}
async function freeAdminPost(fn,payload={}){
  const token=freeAdminToken();
  const res=await fetch(freeAdminUrl(),{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token,...payload}),
  });
  const text=await res.text();
  let json=null;
  try{json=JSON.parse(text);}catch(_){throw new Error(text&&text.trim().startsWith('<')?'El backend devolvió HTML. Revisá la URL publicada de Apps Script.':'Respuesta inválida del servidor.');}
  if(!json?.ok) throw new Error(json?.mensaje||json?.error||'No se pudo completar la solicitud.');
  return json;
}
function freeAdminClean(v,fallback='—'){
  const s=String(v==null?'':v).trim();
  return s||fallback;
}
function freeAdminUpper(v){return String(v||'').trim().toUpperCase();}
function freeAdminDateMs(v){
  if(!v)return 0;
  const raw=String(v||'');
  const d=v instanceof Date?v:new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?0:d.getTime();
}
function freeAdminFmtDate(v){
  if(!v)return '—';
  const raw=String(v||'');
  const d=v instanceof Date?v:new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');
  if(Number.isNaN(d.getTime()))return raw;
  return d.toLocaleString('es-CR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function freeAdminTipoLabel(tipo){
  const k=freeAdminUpper(tipo);
  const map={
    QUIERO_MATRICULARME:'Matricularme',
    CONSULTAR_HORARIO:'Horarios',
    FINANCIAMIENTO:'Pagos / CONAPE',
    CORREGIR_DATOS:'Mis datos',
    HABLAR_ASESOR:'Hablar con asesor',
  };
  return map[k]||freeAdminClean(tipo,'Solicitud');
}
function freeAdminEstadoMeta(estado){
  const k=freeAdminUpper(estado||'PENDIENTE');
  const map={
    PENDIENTE:['Pendiente','warn'],
    EN_GESTION:['En gestión','info'],
    RESPONDIDA:['Respondida','ok'],
    CONVERTIDA:['Convertida manual','ok'],
    CERRADA:['Cerrada','muted'],
    DESCARTADA:['Descartada','muted'],
  };
  return map[k]||[k,'muted'];
}
function FreeAdminBadge({estado}){
  const [label,tone]=freeAdminEstadoMeta(estado);
  return <span className={`free-admin-badge ${tone}`}>{label}</span>;
}
function FreeAdminMetric({label,value,desc,tone='neutral'}){
  return <article className={`free-admin-metric ${tone}`}><span>{label}</span><strong>{value}</strong>{desc&&<small>{desc}</small>}</article>;
}
function FreeAdminEmpty({title,desc}){
  return <div className="free-admin-empty"><strong>{title}</strong><small>{desc}</small></div>;
}
function freeAdminNormalizeItems(items){
  return (Array.isArray(items)?items:[]).slice().sort((a,b)=>freeAdminDateMs(b.ULTIMA_ACCION_AT||b.FECHA_ISO||b.FECHA)-freeAdminDateMs(a.ULTIMA_ACCION_AT||a.FECHA_ISO||a.FECHA));
}
function freeAdminPriority(s){
  const estado=freeAdminUpper(s.ESTADO||'PENDIENTE');
  if(['CERRADA','DESCARTADA','CONVERTIDA'].includes(estado))return ['Cerrada','muted'];
  const ms=freeAdminDateMs(s.ULTIMA_ACCION_AT||s.FECHA_ISO||s.FECHA);
  const hours=ms?Math.floor((Date.now()-ms)/36e5):999;
  if(hours>=48)return ['Alta +48h','high'];
  if(hours>=24)return ['Media +24h','medium'];
  return ['Normal','low'];
}
function freeAdminNextStep(s){
  const estado=freeAdminUpper(s.ESTADO||'PENDIENTE');
  const tipo=freeAdminUpper(s.TIPO);
  if(estado==='PENDIENTE')return 'Tomar gestión y contactar por WhatsApp.';
  if(estado==='EN_GESTION'&&tipo==='FINANCIAMIENTO')return 'Confirmar si aplica CONAPE, monto y documentos.';
  if(estado==='EN_GESTION'&&tipo==='CONSULTAR_HORARIO')return 'Ofrecer 2 horarios concretos y confirmar disponibilidad.';
  if(estado==='EN_GESTION')return 'Registrar respuesta y siguiente paso comercial.';
  if(estado==='RESPONDIDA')return 'Dar seguimiento o marcar convertida manual/cerrada.';
  if(estado==='CONVERTIDA')return 'Crear matrícula oficial fuera de esta bandeja.';
  return 'Sin acción pendiente.';
}
function freeAdminCurrentUserName(){
  try{const s=(window.getSesion&&window.getSesion())||{};return String(s.nombre||s.usuario||'').trim();}catch(_){return '';}
}
function freeAdminBuildFicha(s){
  return [
    'FICHA DE PREMATRÍCULA · SEGUIMIENTO INTERNO',
    `ID: ${freeAdminClean(s.ID,'Sin ID')}`,
    `Estado: ${freeAdminUpper(s.ESTADO||'PENDIENTE')}`,
    `Tipo: ${freeAdminTipoLabel(s.TIPO)}`,
    `Nombre: ${freeAdminClean(s.NOMBRE,'Sin nombre')}`,
    `Cédula: ${freeAdminClean(s.CEDULA,'Sin cédula')}`,
    `Correo: ${freeAdminClean(s.CORREO,'Sin correo')}`,
    `Teléfono: ${freeAdminClean(s.TELEFONO,'Sin teléfono')}`,
    `Programa: ${freeAdminClean(s.PROGRAMA,'Inglés Conversacional')}`,
    `Grupo tentativo: ${freeAdminClean(s.GRUPO_TENTATIVO,'Por asignar')}`,
    `Responsable: ${freeAdminClean(s.RESPONSABLE||s.ATENDIDO_POR,'Sin asignar')}`,
    '',
    'Mensaje:',
    freeAdminClean(s.MENSAJE,'Sin mensaje'),
    '',
    'Última nota:',
    freeAdminClean(s.ULTIMA_NOTA||s.RESPUESTA,'Sin nota'),
    '',
    'Regla: marcar CONVERTIDA aquí no crea matrícula, código, grupo, pago ni registro académico. La activación oficial sigue en Matrículas/Admisiones.'
  ].join('\n');
}

const FREE_ADMIN_ESTADOS=['TODOS','PENDIENTE','EN_GESTION','RESPONDIDA','CONVERTIDA','CERRADA','DESCARTADA'];
const FREE_ADMIN_SCOPE_OPTIONS=[
  {id:'TODAS',label:'Todas'},
  {id:'MIAS',label:'Mías'},
  {id:'SIN_ASIGNAR',label:'Sin asignar'},
];
const FREE_ADMIN_ASESORES=['','Fiorella Salazar','Roger Cruz','Leonardo Salazar','Admisiones','Administración'];
const FREE_ADMIN_ACCIONES=[
  {estado:'EN_GESTION',label:'Tomar gestión',hint:'La solicitud queda en atención manual.'},
  {estado:'RESPONDIDA',label:'Marcar respondida',hint:'Usalo cuando ya se contactó al estudiante.'},
  {estado:'CONVERTIDA',label:'Convertida manual',hint:'Solo marca seguimiento; no crea matrícula.'},
  {estado:'CERRADA',label:'Cerrar',hint:'Cierre administrativo sin conversión.'},
  {estado:'DESCARTADA',label:'Descartar',hint:'Lead no viable o duplicado sin valor.'},
];

function FreeUserRequestsAdminView({toast}){
  const [items,setItems]=React.useState([]);
  const [counts,setCounts]=React.useState({});
  const [estado,setEstado]=React.useState('PENDIENTE');
  const [q,setQ]=React.useState('');
  const [scope,setScope]=React.useState('TODAS');
  const [asesorDestino,setAsesorDestino]=React.useState('');
  const [loading,setLoading]=React.useState(true);
  const [busy,setBusy]=React.useState('');
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
  const [selected,setSelected]=React.useState(null);
  const [nota,setNota]=React.useState('');
  const [accion,setAccion]=React.useState('EN_GESTION');
  const [copied,setCopied]=React.useState('');

  const load=React.useCallback(async()=>{
    setLoading(true);setError('');setOk('');
    try{
      const payload={limit:250};
      if(estado&&estado!=='TODOS')payload.estado=estado;
      const r=await freeAdminPost('freeUserListarSolicitudes',payload);
      const list=freeAdminNormalizeItems(r.items||[]);
      setItems(list);setCounts(r.counts||{});
      if(selected){
        const again=list.find(x=>String(x.ID||'')===String(selected.ID||''));
        if(again)setSelected(again);
      }
    }catch(e){setError(e.message);}finally{setLoading(false);}
  },[estado,selected&&selected.ID]);

  React.useEffect(()=>{load();},[estado]);
  React.useEffect(()=>{
    const onChange=()=>load();
    window.addEventListener('an:free-user-solicitudes-changed',onChange);
    return()=>window.removeEventListener('an:free-user-solicitudes-changed',onChange);
  },[load]);

  const filtered=React.useMemo(()=>{
    const term=String(q||'').trim().toLowerCase();
    let base=items;
    const me=freeAdminCurrentUserName().toLowerCase();
    if(scope==='MIAS'&&me)base=base.filter(s=>String(s.RESPONSABLE||s.ATENDIDO_POR||'').toLowerCase().includes(me));
    if(scope==='SIN_ASIGNAR')base=base.filter(s=>!String(s.RESPONSABLE||s.ATENDIDO_POR||'').trim());
    if(!term)return base;
    return base.filter(s=>[
      s.ID,s.NOMBRE,s.CEDULA,s.CORREO,s.TELEFONO,s.TIPO,s.ESTADO,s.MENSAJE,s.RESPUESTA,s.ULTIMA_NOTA,s.RESPONSABLE,s.PROGRAMA,s.GRUPO_TENTATIVO
    ].some(v=>String(v||'').toLowerCase().includes(term)));
  },[items,q,scope]);

  const selectedId=selected?.ID;
  const aplicar=async(nextEstado=accion,notaManual=nota)=>{
    if(!selectedId)return;
    setBusy(nextEstado);setError('');setOk('');
    try{
      const responsableFinal=asesorDestino||selected?.RESPONSABLE||selected?.ATENDIDO_POR||freeAdminCurrentUserName();
      const r=await freeAdminPost('freeUserResolverSolicitud',{id:selectedId,estado:nextEstado,respuesta:notaManual||'',nota:notaManual||'',responsable:responsableFinal});
      setOk(r.mensaje||'Solicitud actualizada.');
      if(typeof toast==='function')toast('Solicitud actualizada');
      setNota('');setCopied('');setAsesorDestino('');
      try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }
      await load();
    }catch(e){setError(e.message);}finally{setBusy('');}
  };
  const copiarFicha=async(s)=>{
    try{
      const txt=freeAdminBuildFicha(s);
      if(navigator?.clipboard?.writeText){await navigator.clipboard.writeText(txt);setCopied(String(s.ID||''));}
      else setError('Copiado no disponible en este navegador.');
    }catch(_){setError('No se pudo copiar la ficha.');}
  };
  const abrirWhatsApp=(s)=>{
    const tel=String(s.TELEFONO||'').replace(/\D/g,'');
    const cr=tel.length===8?'506'+tel:tel;
    const msg=encodeURIComponent(`Hola ${freeAdminClean(s.NOMBRE,'')}, le escribe Academia Norteamericana sobre su solicitud de prematrícula: ${freeAdminTipoLabel(s.TIPO)}.`);
    if(!cr){setError('Esta solicitud no tiene teléfono utilizable.');return;}
    window.open(`https://wa.me/${cr}?text=${msg}`,'_blank','noopener,noreferrer');
  };

  const abiertas=(Number(counts.PENDIENTE||0)+Number(counts.EN_GESTION||0))||0;
  const currentCount=estado==='TODOS'?items.length:Number(counts[estado]||items.length||0);

  return <div className="free-admin-page" data-screen-label="Admin · Prematrículas CS7">
    {typeof PageHeader==='function'?<PageHeader
      kicker="Operación administrativa"
      title="Prematrículas"
      sub="Bandeja interna para atender usuarios gratis sin mezclar leads con matrícula oficial. Esta vista no crea código, grupo, pago, nota ni certificado."
      right={<button type="button" className="btn btn-ghost" disabled={loading} onClick={load}>Actualizar</button>}
    />:<div className="free-admin-title"><h1>Prematrículas</h1></div>}

    {error&&<div className="free-admin-alert error">{error}</div>}
    {ok&&<div className="free-admin-alert ok">{ok}</div>}

    <section className="free-admin-metrics">
      <FreeAdminMetric tone={abiertas?'warn':'ok'} label="Abiertas" value={String(abiertas)} desc="Pendientes + en gestión" />
      <FreeAdminMetric tone="warn" label="Pendientes" value={String(counts.PENDIENTE||0)} desc="Aún no atendidas" />
      <FreeAdminMetric tone="info" label="En gestión" value={String(counts.EN_GESTION||0)} desc="Tomadas por admisiones" />
      <FreeAdminMetric tone="ok" label="Respondidas" value={String(counts.RESPONDIDA||0)} desc="Contacto registrado" />
      <FreeAdminMetric tone="neutral" label="Vista actual" value={String(currentCount)} desc={estado==='TODOS'?'Todos los estados':estado} />
      <FreeAdminMetric tone="info" label="Canal ventas" value="Activo" desc="También visible en ventas.html" />
    </section>

    <section className="free-admin-toolbar">
      <div className="free-admin-filters" role="group" aria-label="Filtrar por estado">
        {FREE_ADMIN_ESTADOS.map(e=><button key={e} type="button" className={estado===e?'active':''} onClick={()=>{setEstado(e);setSelected(null);}}>{e==='TODOS'?'Todos':freeAdminEstadoMeta(e)[0]}</button>)}
      </div>
      <div className="free-admin-filters compact" role="group" aria-label="Alcance de responsable">
        {FREE_ADMIN_SCOPE_OPTIONS.map(o=><button key={o.id} type="button" className={scope===o.id?'active':''} onClick={()=>setScope(o.id)}>{o.label}</button>)}
      </div>
      <label className="free-admin-search"><span>Buscar</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nombre, cédula, teléfono, mensaje…" /></label>
    </section>

    <div className="free-admin-layout">
      <section className="free-admin-list" aria-label="Lista de solicitudes de prematrícula">
        {loading?<FreeAdminEmpty title="Cargando solicitudes…" desc="Leyendo SOLICITUDES_USUARIO_GRATIS." />:!filtered.length?<FreeAdminEmpty title="Sin solicitudes en esta vista" desc="Cambiá el filtro o revisá si el usuario gratis ya envió una gestión." />:filtered.map(s=>{
          const isSel=String(s.ID||'')===String(selectedId||'');
          return <button type="button" key={s.ID||`${s.CEDULA}-${s.FECHA_ISO}`} className={`free-admin-row ${isSel?'selected':''}`} onClick={()=>{setSelected(s);setAccion(freeAdminUpper(s.ESTADO)==='PENDIENTE'?'EN_GESTION':'RESPONDIDA');setNota('');setCopied('');setAsesorDestino(s.RESPONSABLE||s.ATENDIDO_POR||'');}}>
            <div className="free-admin-row-main">
              <div><strong>{freeAdminClean(s.NOMBRE,'Sin nombre')}</strong><small>{freeAdminClean(s.CEDULA,'Sin cédula')} · {freeAdminTipoLabel(s.TIPO)}</small></div>
              <FreeAdminBadge estado={s.ESTADO}/>
            </div>
            <p>{freeAdminClean(s.MENSAJE,'Sin mensaje')}</p>
            <div className="free-admin-row-tags"><span className={`free-admin-priority ${freeAdminPriority(s)[1]}`}>{freeAdminPriority(s)[0]}</span><span>{freeAdminNextStep(s)}</span></div>
            <footer><span>{freeAdminFmtDate(s.ULTIMA_ACCION_AT||s.FECHA_ISO||s.FECHA)}</span><span>{freeAdminClean(s.RESPONSABLE||s.ATENDIDO_POR,'Sin responsable')}</span></footer>
          </button>;
        })}
      </section>

      <aside className="free-admin-detail" aria-label="Detalle de solicitud">
        {!selected?<FreeAdminEmpty title="Seleccioná una solicitud" desc="Aquí vas a ver la ficha completa, acciones y notas de seguimiento." />:<>
          <div className="free-admin-detail-head">
            <div><span>{freeAdminTipoLabel(selected.TIPO)}</span><h2>{freeAdminClean(selected.NOMBRE,'Sin nombre')}</h2><small>{freeAdminClean(selected.CEDULA,'Sin cédula')} · {freeAdminFmtDate(selected.FECHA_ISO||selected.FECHA)}</small></div>
            <FreeAdminBadge estado={selected.ESTADO}/>
          </div>

          <div className="free-admin-data-grid">
            <div><span>Teléfono</span><strong>{freeAdminClean(selected.TELEFONO,'—')}</strong></div>
            <div><span>Correo</span><strong>{freeAdminClean(selected.CORREO,'—')}</strong></div>
            <div><span>Programa</span><strong>{freeAdminClean(selected.PROGRAMA,'Inglés Conversacional')}</strong></div>
            <div><span>Grupo tentativo</span><strong>{freeAdminClean(selected.GRUPO_TENTATIVO,'Por asignar')}</strong></div>
            <div><span>Responsable</span><strong>{freeAdminClean(selected.RESPONSABLE||selected.ATENDIDO_POR,'Sin asignar')}</strong></div>
            <div><span>Prioridad</span><strong>{freeAdminPriority(selected)[0]}</strong></div>
            <div><span>Última acción</span><strong>{freeAdminFmtDate(selected.ULTIMA_ACCION_AT||selected.ATENDIDO_AT)}</strong></div>
          </div>

          <div className="free-admin-message"><span>Próximo paso sugerido</span><p>{freeAdminNextStep(selected)}</p></div>
          <div className="free-admin-message"><span>Mensaje del estudiante</span><p>{freeAdminClean(selected.MENSAJE,'Sin mensaje')}</p></div>
          {(selected.RESPUESTA||selected.ULTIMA_NOTA)&&<div className="free-admin-message note"><span>Última respuesta / nota</span><p>{freeAdminClean(selected.ULTIMA_NOTA||selected.RESPUESTA)}</p></div>}

          <div className="free-admin-actions">
            <label><span>Asignar / responsable</span><select value={asesorDestino} onChange={e=>setAsesorDestino(e.target.value)}><option value="">Usar mi usuario</option>{FREE_ADMIN_ASESORES.filter(Boolean).map(a=><option value={a} key={a}>{a}</option>)}</select></label>
            <label><span>Acción</span><select value={accion} onChange={e=>setAccion(e.target.value)}>{FREE_ADMIN_ACCIONES.map(a=><option value={a.estado} key={a.estado}>{a.label}</option>)}</select></label>
            <label><span>Nota para historial / respuesta</span><textarea value={nota} onChange={e=>setNota(e.target.value)} rows="5" maxLength="1000" placeholder="Ej: Se contactó por WhatsApp. Interesa KJ 6pm. Pendiente confirmar método de pago." /></label>
            <div className="free-admin-hint">{(FREE_ADMIN_ACCIONES.find(a=>a.estado===accion)||FREE_ADMIN_ACCIONES[0]).hint}</div>
            {accion==='CONVERTIDA'&&<div className="free-admin-warning"><strong>Ojo:</strong> esto solo marca seguimiento comercial. No activa matrícula ni modifica DATOS/ESTATUS.</div>}
            <div className="free-admin-action-row">
              <button type="button" className="btn btn-ghost" onClick={()=>copiarFicha(selected)}>{copied===String(selected.ID||'')?'Ficha copiada':'Copiar ficha'}</button>
              <button type="button" className="btn btn-ghost" onClick={()=>abrirWhatsApp(selected)}>WhatsApp</button>
              <button type="button" className="btn btn-primary" disabled={!!busy} onClick={()=>aplicar()}>{busy?'Guardando…':'Guardar seguimiento'}</button>
            </div>
          </div>

          {selected.HISTORIAL&&<details className="free-admin-history"><summary>Ver historial técnico</summary><pre>{selected.HISTORIAL}</pre></details>}
        </>}
      </aside>
    </div>
  </div>;
}
window.FreeUserRequestsAdminView=FreeUserRequestsAdminView;
