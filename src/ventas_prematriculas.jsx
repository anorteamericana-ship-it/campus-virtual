/* global React, ReactDOM */
// F98.4-Z6-CS7 · Puente ventas/admisiones para prematrículas.
// Monta un widget independiente en ventas.html. Usa POST text/plain contra endpoints existentes.
// No crea matrícula, código, grupo, pagos, notas oficiales ni certificados.
(function(){
  const {useEffect,useMemo,useState,useCallback}=React;
  const ESTADOS=['TODOS','PENDIENTE','EN_GESTION','RESPONDIDA','CONVERTIDA','CERRADA','DESCARTADA'];
  const ACCIONES=[
    ['EN_GESTION','Tomar gestión'],
    ['RESPONDIDA','Respondida'],
    ['CONVERTIDA','Convertida manual'],
    ['CERRADA','Cerrar'],
    ['DESCARTADA','Descartar'],
  ];
  const ASESORES=['','Fiorella Salazar','Roger Cruz','Leonardo Salazar','Admisiones','Administración'];
  function token(){try{return (window.getSessionToken&&window.getSessionToken())||((window.getSesion&&window.getSesion()||{}).token)||'';}catch(_){return'';}}
  function sesion(){try{return (window.getSesion&&window.getSesion())||{};}catch(_){return{};}}
  function apiUrl(){const u=window.APPS_SCRIPT_URL||'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec'; if(!window.APPS_SCRIPT_URL)window.APPS_SCRIPT_URL=u; return u;}
  async function post(fn,payload={}){
    const res=await fetch(apiUrl(),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,token:token(),...payload})});
    const text=await res.text();
    let json=null;
    try{json=JSON.parse(text);}catch(_){throw new Error(text&&text.trim().startsWith('<')?'El backend devolvió HTML. Revisá la URL publicada.':'Respuesta inválida del servidor.');}
    if(!json || !json.ok)throw new Error((json&&json.mensaje)||(json&&json.error)||'No se pudo completar.');
    return json;
  }
  function clean(v,f='—'){const s=String(v==null?'':v).trim();return s||f;}
  function upper(v){return String(v||'').trim().toUpperCase();}
  function tipoLabel(v){return ({QUIERO_MATRICULARME:'Matricularme',CONSULTAR_HORARIO:'Horarios',FINANCIAMIENTO:'Pagos / CONAPE',CORREGIR_DATOS:'Mis datos',HABLAR_ASESOR:'Asesor'})[upper(v)]||clean(v,'Solicitud');}
  function estadoMeta(v){const k=upper(v||'PENDIENTE');return ({PENDIENTE:['Pendiente','warn'],EN_GESTION:['En gestión','info'],RESPONDIDA:['Respondida','ok'],CONVERTIDA:['Convertida manual','ok'],CERRADA:['Cerrada','muted'],DESCARTADA:['Descartada','muted']})[k]||[k,'muted'];}
  function dateMs(v){if(!v)return 0;const raw=String(v);const d=new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?0:d.getTime();}
  function fmtDate(v){if(!v)return '—';const raw=String(v);const d=new Date(raw.includes('T')?raw:raw.slice(0,10)+'T12:00:00');return Number.isNaN(d.getTime())?raw:d.toLocaleString('es-CR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});}
  function priority(s){const estado=upper(s.ESTADO||'PENDIENTE'); if(['CERRADA','DESCARTADA','CONVERTIDA'].includes(estado))return ['Cerrada','muted']; const ms=dateMs(s.ULTIMA_ACCION_AT||s.FECHA_ISO||s.FECHA); const h=ms?Math.floor((Date.now()-ms)/36e5):999; if(h>=48)return ['Alta','high']; if(h>=24)return ['Media','medium']; return ['Normal','low'];}
  function nextStep(s){const e=upper(s.ESTADO||'PENDIENTE'),t=upper(s.TIPO); if(e==='PENDIENTE')return 'Tomar gestión y contactar.'; if(e==='EN_GESTION'&&t==='FINANCIAMIENTO')return 'Revisar CONAPE/pago.'; if(e==='EN_GESTION'&&t==='CONSULTAR_HORARIO')return 'Ofrecer horarios.'; if(e==='RESPONDIDA')return 'Dar seguimiento.'; if(e==='CONVERTIDA')return 'Crear matrícula oficial fuera de aquí.'; return 'Sin acción.';}
  function ficha(s){return [
    'FICHA PREMATRÍCULA · VENTAS/ADMISIONES',
    `ID: ${clean(s.ID,'Sin ID')}`,
    `Estado: ${upper(s.ESTADO||'PENDIENTE')}`,
    `Tipo: ${tipoLabel(s.TIPO)}`,
    `Nombre: ${clean(s.NOMBRE,'Sin nombre')}`,
    `Cédula: ${clean(s.CEDULA,'Sin cédula')}`,
    `Teléfono: ${clean(s.TELEFONO,'Sin teléfono')}`,
    `Correo: ${clean(s.CORREO,'Sin correo')}`,
    `Programa: ${clean(s.PROGRAMA,'Inglés Conversacional')}`,
    `Grupo tentativo: ${clean(s.GRUPO_TENTATIVO,'Por asignar')}`,
    `Responsable: ${clean(s.RESPONSABLE||s.ATENDIDO_POR,'Sin asignar')}`,
    '', 'Mensaje:', clean(s.MENSAJE,'Sin mensaje'), '',
    'Nota:', clean(s.ULTIMA_NOTA||s.RESPUESTA,'Sin nota'), '',
    'Regla: Convertida manual NO crea matrícula. La matrícula oficial se hace en el flujo normal.'
  ].join('\n');}
  function Badge({estado}){const [l,t]=estadoMeta(estado);return <span className={`vp-badge ${t}`}>{l}</span>;}
  function Metric({label,value}){return <div className="vp-metric"><span>{label}</span><strong>{value}</strong></div>;}
  function PrematriculasVentasWidget(){
    const [open,setOpen]=useState(false);
    const [items,setItems]=useState([]);
    const [counts,setCounts]=useState({});
    const [estado,setEstado]=useState('PENDIENTE');
    const [q,setQ]=useState('');
    const [selected,setSelected]=useState(null);
    const [nota,setNota]=useState('');
    const [accion,setAccion]=useState('EN_GESTION');
    const [responsable,setResponsable]=useState('');
    const [loading,setLoading]=useState(false);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const [ok,setOk]=useState('');
    const currentUser=clean(sesion().nombre||sesion().usuario,'Ventas');
    const load=useCallback(async()=>{
      setLoading(true);setError('');
      try{
        const payload={limit:200}; if(estado&&estado!=='TODOS')payload.estado=estado;
        const r=await post('freeUserListarSolicitudes',payload);
        const list=(Array.isArray(r.items)?r.items:[]).slice().sort((a,b)=>dateMs(b.ULTIMA_ACCION_AT||b.FECHA_ISO||b.FECHA)-dateMs(a.ULTIMA_ACCION_AT||a.FECHA_ISO||a.FECHA));
        setItems(list);setCounts(r.counts||{});
        setSelected(prev=>prev?list.find(x=>String(x.ID||'')===String(prev.ID||''))||prev:null);
      }catch(e){setError(e.message);}finally{setLoading(false);}
    },[estado]);
    useEffect(()=>{load();},[load]);
    useEffect(()=>{const id=setInterval(()=>{post('freeUserListarSolicitudes',{estado:'PENDIENTE',limit:1}).then(r=>setCounts(c=>({...c,...(r.counts||{}),PENDIENTE:(r.pendientes != null ? r.pendientes : c.PENDIENTE)}))).catch(()=>{});},90000);return()=>clearInterval(id);},[]);
    const filtered=useMemo(()=>{const t=String(q||'').trim().toLowerCase(); if(!t)return items; return items.filter(s=>[s.NOMBRE,s.CEDULA,s.TELEFONO,s.CORREO,s.TIPO,s.ESTADO,s.MENSAJE,s.RESPONSABLE,s.ATENDIDO_POR].some(v=>String(v||'').toLowerCase().includes(t)));},[items,q]);
    const abiertas=Number(counts.PENDIENTE||0)+Number(counts.EN_GESTION||0);
    const apply=async(next=accion)=>{
      if(!selected || !selected.ID)return;
      setBusy(true);setError('');setOk('');
      try{
        const resp=responsable||selected.RESPONSABLE||selected.ATENDIDO_POR||currentUser;
        const r=await post('freeUserResolverSolicitud',{id:selected.ID,estado:next,respuesta:nota||'',nota:nota||'',responsable:resp});
        setOk(r.mensaje||'Actualizado.'); setNota(''); setResponsable(''); await load();
        try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }
      }catch(e){setError(e.message);}finally{setBusy(false);}
    };
    const copy=async(s)=>{try{await navigator.clipboard.writeText(ficha(s));setOk('Ficha copiada.');}catch(_){setError('No se pudo copiar.');}};
    const wa=(s)=>{const tel=String(s.TELEFONO||'').replace(/\D/g,'');const cr=tel.length===8?'506'+tel:tel;if(!cr){setError('Sin teléfono utilizable.');return;}const msg=encodeURIComponent(`Hola ${clean(s.NOMBRE,'')}, le escribe Academia Norteamericana sobre su solicitud de prematrícula: ${tipoLabel(s.TIPO)}.`);window.open(`https://wa.me/${cr}?text=${msg}`,'_blank','noopener,noreferrer');};
    return <div className={`ventas-premat ${open?'open':''}`}>
      <button className="vp-launch" type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open}>
        <span>Prematrículas</span><strong>{abiertas||0}</strong>
      </button>
      {open&&<section className="vp-panel" aria-label="Prematrículas ventas">
        <header><div><span>Ventas / admisiones</span><h2>Prematrículas</h2><p>Solicitudes de usuarios gratis. No crea matrícula.</p></div><button type="button" onClick={()=>setOpen(false)}>×</button></header>
        {error&&<div className="vp-alert error">{error}</div>}{ok&&<div className="vp-alert ok">{ok}</div>}
        <div className="vp-metrics"><Metric label="Abiertas" value={abiertas||0}/><Metric label="Pendientes" value={counts.PENDIENTE||0}/><Metric label="Gestión" value={counts.EN_GESTION||0}/></div>
        <div className="vp-toolbar"><select value={estado} onChange={e=>{setEstado(e.target.value);setSelected(null);}}>{ESTADOS.map(e=><option key={e} value={e}>{e==='TODOS'?'Todos':estadoMeta(e)[0]}</option>)}</select><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar lead…"/><button type="button" disabled={loading} onClick={load}>{loading?'…':'Actualizar'}</button></div>
        <div className="vp-body">
          <div className="vp-list">
            {!filtered.length?<div className="vp-empty">Sin solicitudes en esta vista.</div>:filtered.map(s=><button key={s.ID||s.CEDULA} type="button" className={(selected&&selected.ID)===s.ID?'sel':''} onClick={()=>{setSelected(s);setAccion(upper(s.ESTADO)==='PENDIENTE'?'EN_GESTION':'RESPONDIDA');setResponsable(s.RESPONSABLE||s.ATENDIDO_POR||'');setNota('');}}>
              <div><strong>{clean(s.NOMBRE,'Sin nombre')}</strong><Badge estado={s.ESTADO}/></div><small>{clean(s.CEDULA,'Sin cédula')} · {tipoLabel(s.TIPO)} · {fmtDate(s.ULTIMA_ACCION_AT||s.FECHA_ISO||s.FECHA)}</small><p>{clean(s.MENSAJE,'Sin mensaje')}</p><footer><span className={`vp-priority ${priority(s)[1]}`}>{priority(s)[0]}</span><span>{nextStep(s)}</span></footer>
            </button>)}
          </div>
          <aside className="vp-detail">
            {!selected?<div className="vp-empty">Seleccioná una solicitud.</div>:<>
              <div className="vp-detail-head"><div><span>{tipoLabel(selected.TIPO)}</span><h3>{clean(selected.NOMBRE,'Sin nombre')}</h3><small>{clean(selected.TELEFONO,'Sin teléfono')} · {clean(selected.CORREO,'Sin correo')}</small></div><Badge estado={selected.ESTADO}/></div>
              <div className="vp-card"><span>Próximo paso</span><p>{nextStep(selected)}</p></div>
              <div className="vp-card"><span>Mensaje</span><p>{clean(selected.MENSAJE,'Sin mensaje')}</p></div>
              <label>Responsable<select value={responsable} onChange={e=>setResponsable(e.target.value)}><option value="">Usar mi usuario</option>{ASESORES.filter(Boolean).map(a=><option key={a} value={a}>{a}</option>)}</select></label>
              <label>Acción<select value={accion} onChange={e=>setAccion(e.target.value)}>{ACCIONES.map(a=><option key={a[0]} value={a[0]}>{a[1]}</option>)}</select></label>
              <label>Nota<textarea value={nota} onChange={e=>setNota(e.target.value)} rows="4" placeholder="Se contactó por WhatsApp…"/></label>
              {accion==='CONVERTIDA'&&<div className="vp-warning">Convertida manual no crea matrícula ni toca DATOS/ESTATUS.</div>}
              <div className="vp-actions"><button type="button" onClick={()=>copy(selected)}>Copiar ficha</button><button type="button" onClick={()=>wa(selected)}>WhatsApp</button><button type="button" disabled={busy} onClick={()=>apply()}>{busy?'Guardando…':'Guardar'}</button></div>
            </>}
          </aside>
        </div>
      </section>}
    </div>;
  }
  function injectStyle(){
    if(document.getElementById('ventas-premat-css'))return;
    const css=`.ventas-premat{position:fixed;right:18px;bottom:18px;z-index:9998;font-family:Poppins,system-ui,sans-serif}.vp-launch{border:0;border-radius:999px;background:#001e47;color:#fff;box-shadow:0 16px 42px rgba(0,30,71,.25);padding:12px 14px;display:flex;gap:10px;align-items:center;font-weight:800;cursor:pointer}.vp-launch strong{min-width:24px;height:24px;border-radius:999px;background:#c89b3c;color:#001e47;display:grid;place-items:center}.vp-panel{position:absolute;right:0;bottom:56px;width:min(1040px,calc(100vw - 28px));max-height:min(760px,calc(100vh - 96px));overflow:hidden;border:1px solid #ded8ce;border-radius:22px;background:#fbfaf7;box-shadow:0 28px 80px rgba(0,30,71,.24);display:flex;flex-direction:column}.vp-panel header{display:flex;justify-content:space-between;gap:12px;padding:16px 18px;border-bottom:1px solid #e5dfd4;background:#fff}.vp-panel header span,.vp-card span{display:block;font-size:10px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#7a1e2c}.vp-panel h2{margin:2px 0;font-size:24px;color:#001e47}.vp-panel p{margin:0;color:#667085;font-size:12.5px;line-height:1.45}.vp-panel header button{border:1px solid #ded8ce;border-radius:12px;background:#fff;width:34px;height:34px;font-size:22px;cursor:pointer}.vp-alert{margin:10px 12px 0;padding:10px 12px;border-radius:13px;font-size:12px;font-weight:700}.vp-alert.error{background:#fff1ef;color:#8a1f11;border:1px solid #f2c7c1}.vp-alert.ok{background:#f0f8f1;color:#166534;border:1px solid #bfe4c6}.vp-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px 12px 0}.vp-metric{background:#fff;border:1px solid #e5dfd4;border-radius:15px;padding:10px}.vp-metric span{display:block;font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#667085}.vp-metric strong{font-size:22px;color:#001e47}.vp-toolbar{display:grid;grid-template-columns:165px 1fr 100px;gap:8px;padding:10px 12px}.vp-toolbar input,.vp-toolbar select,.vp-toolbar button,.vp-detail select,.vp-detail textarea{border:1px solid #ded8ce;background:#fff;border-radius:12px;padding:9px 10px;font:600 12px/1.35 Poppins,system-ui;color:#1f2937}.vp-toolbar button,.vp-actions button{cursor:pointer;font-weight:800}.vp-body{display:grid;grid-template-columns:minmax(320px,1fr) minmax(340px,.9fr);gap:10px;padding:0 12px 12px;min-height:0;overflow:hidden}.vp-list{display:flex;flex-direction:column;gap:8px;overflow:auto;max-height:520px;padding-right:3px}.vp-list button{text-align:left;border:1px solid #e5dfd4;background:#fff;border-radius:15px;padding:10px;cursor:pointer}.vp-list button.sel{border-color:#c89b3c;background:#fff8e8}.vp-list button>div,.vp-detail-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.vp-list strong{color:#001e47;font-size:13px}.vp-list small{display:block;color:#667085;font-size:10.5px;margin-top:3px}.vp-list p{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:7px 0}.vp-list footer{display:flex;gap:6px;flex-wrap:wrap;font-size:10.5px;color:#667085}.vp-badge,.vp-priority{border-radius:999px;padding:4px 7px;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border:1px solid #e5dfd4;white-space:nowrap}.vp-badge.warn{background:#fff6e6;color:#9a5a00;border-color:#edc77c}.vp-badge.info{background:#edf5ff;color:#0a4f9a;border-color:#b9d7f3}.vp-badge.ok{background:#edf9ef;color:#166534;border-color:#bfe4c6}.vp-badge.muted{background:#f4f4f5;color:#667085}.vp-priority.high{background:#fff1ef;color:#8a1f11}.vp-priority.medium{background:#fff6e6;color:#9a5a00}.vp-priority.low{background:#edf9ef;color:#166534}.vp-detail{background:#fff;border:1px solid #e5dfd4;border-radius:17px;padding:12px;overflow:auto;max-height:520px;display:flex;flex-direction:column;gap:9px}.vp-detail h3{margin:2px 0;font-size:20px;color:#001e47}.vp-card{border:1px solid #e5dfd4;background:#fafafa;border-radius:13px;padding:10px}.vp-detail label{display:flex;flex-direction:column;gap:5px;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#667085}.vp-warning{border:1px solid #f2c7c1;background:#fff1ef;color:#8a1f11;border-radius:12px;padding:9px;font-size:12px}.vp-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}.vp-actions button{border:1px solid #ded8ce;background:#fff;border-radius:11px;padding:9px 10px}.vp-actions button:last-child{background:#001e47;color:#fff;border-color:#001e47}.vp-empty{border:1px dashed #ded8ce;background:#fff;border-radius:14px;padding:18px;text-align:center;color:#667085;font-size:12px}@media(max-width:820px){.ventas-premat{right:10px;bottom:10px}.vp-panel{right:-2px;width:calc(100vw - 16px)}.vp-body{grid-template-columns:1fr}.vp-detail,.vp-list{max-height:none}.vp-toolbar{grid-template-columns:1fr}.vp-metrics{grid-template-columns:1fr}}`;
    const style=document.createElement('style');style.id='ventas-premat-css';style.textContent=css;document.head.appendChild(style);
  }
  function mount(){
    const s=sesion();
    if(!s||!['ventas','admin','superadmin'].includes(String(s.rol||'').toLowerCase()))return;
    injectStyle();
    let root=document.getElementById('ventas-premat-root');
    if(!root){root=document.createElement('div');root.id='ventas-premat-root';document.body.appendChild(root);}
    if(ReactDOM.createRoot)ReactDOM.createRoot(root).render(<PrematriculasVentasWidget/>);
    else ReactDOM.render(<PrematriculasVentasWidget/>,root);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else setTimeout(mount,0);
})();
