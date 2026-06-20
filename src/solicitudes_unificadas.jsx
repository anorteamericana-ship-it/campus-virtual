/* global React, SolicitudesPagoView, PanelSuspensiones, getSesion */

function f92Token(){ try{return (window.getSesion&&window.getSesion()||{}).token||'';}catch(_){return'';} }
async function f92Post(fn,payload={}){
  const r=await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`,{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token:f92Token(),...payload}),
  });
  const j=await r.json();
  if(!j?.ok)throw new Error(j?.mensaje||j?.error||'No se pudo completar la operación.');
  return j;
}
function f92FmtDate(v){
  const s=String(v||'').slice(0,10); if(!s)return'—';
  const d=new Date(s+'T12:00:00');
  return Number.isNaN(d.getTime())?s:d.toLocaleDateString('es-CR',{day:'2-digit',month:'long',year:'numeric'});
}
function f92RepoStatus(e){
  const k=String(e||'').toUpperCase();
  return ({
    PENDIENTE_JUSTIFICACION:['Pendiente de solicitud','#8A5A00','#FFF4D6'],
    JUSTIFICADA_GRATUITA:['Autorizada sin costo','#166534','#EAF8EF'],
    PENDIENTE_PAGO:['Pendiente de pago','#991B1B','#FDECEA'],
    PAGADA_AUTORIZADA:['Pago confirmado','#166534','#EAF8EF'],
    PROGRAMADA:['Programada','#0C4F86','#E7F1FA'],
    ENTREGADA_POR_REVISAR:['Entregada · por revisar','#805500','#FFF4D6'],
    APLICADA:['Aplicada','#40516A','#EEF2F7'],
    VENCIDA_0:['Vencida · nota 0','#991B1B','#FDECEA'],
    CANCELADA:['Cancelada','#5F6875','#EEF2F7'],
  })[k]||[k||'Pendiente','#40516A','#EEF2F7'];
}
function f92FileToBase64(file){
  return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(String(rd.result||''));rd.onerror=()=>reject(new Error('No se pudo leer el archivo.'));rd.readAsDataURL(file);});
}

function ReposicionStudentCardF92({ onNavigate, compact=false }){
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('reposMiEstadoF92').then(r=>setRows(r.rows||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const pending=rows.filter(r=>!['APLICADA','VENCIDA_0','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));
  if(loading)return compact?null:<div className="card" style={{padding:16}}>Consultando evaluaciones pendientes…</div>;
  if(error)return compact?null:<div className="card" style={{padding:16,color:'#8B1F1F'}}>No se pudo consultar reposiciones: {error}</div>;
  if(!pending.length)return null;
  return <div className="card" style={{border:'2px solid #E2A52A',background:'#FFFDF6'}}>
    <div className="card-h" style={{alignItems:'flex-start'}}>
      <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#8A5A00'}}>EVALUACIÓN PENDIENTE</div><div className="card-title" style={{marginTop:3}}>Solicitud de reposición</div></div>
      <span style={{padding:'4px 9px',borderRadius:999,background:'#FFF4D6',color:'#8A5A00',fontSize:10,fontWeight:900}}>{pending.length} pendiente{pending.length===1?'':'s'}</span>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:9}}>{pending.map(r=>{const [label,fg,bg]=f92RepoStatus(r.ESTADO);return <div key={r.REPOSICION_ID} style={{border:'1px solid #E8D5A4',borderRadius:12,padding:'12px 13px',background:'#fff'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div><div style={{fontSize:14,fontWeight:850}}>{r.TIPO_EXAMEN==='ORAL'?'Examen oral':'Examen escrito'} · Lección {String(r.LECCION).padStart(2,'0')}</div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:3}}>Fecha original: {f92FmtDate(r.FECHA_ORIGINAL)} · Solicitud hasta: {f92FmtDate(r.SOLICITUD_LIMITE)} · Aplicación máxima: {f92FmtDate(r.FECHA_LIMITE)}</div></div>
        <span style={{padding:'4px 8px',borderRadius:999,background:bg,color:fg,fontSize:9.5,fontWeight:900}}>{label}</span>
      </div>
      <div style={{fontSize:12,color:'var(--ink-2)',lineHeight:1.5,marginTop:9}}>{String(r.ESTADO).toUpperCase()==='PENDIENTE_JUSTIFICACION'?'Enviá la solicitud dentro de las primeras 24 horas y adjuntá el respaldo. Administración determinará si procede sin costo o requiere ₡10.000.':String(r.ESTADO).toUpperCase()==='PENDIENTE_PAGO'?'Administración indicó que la reposición requiere ₡10.000. Adjuntá el comprobante de pago para autorizarla.':'La reposición ya fue autorizada. Cuando esté disponible aparecerá en Exámenes.'}</div>
      <button type="button" className="btn btn-primary" style={{marginTop:10}} onClick={()=>onNavigate&&onNavigate('solicitudes_estudiante')}>IR A SOLICITUDES</button>
    </div>})}</div>
  </div>;
}

function SolicitudesEstudianteView({ onNavigate }){
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[selected,setSelected]=React.useState(null),[motivo,setMotivo]=React.useState(''),[ref,setRef]=React.useState(''),[file,setFile]=React.useState(null),[busy,setBusy]=React.useState(false),[ok,setOk]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('reposMiEstadoF92').then(r=>setRows(r.rows||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const send=async()=>{if(!selected||!file)return;setBusy(true);setError('');setOk('');try{const b64=await f92FileToBase64(file);const pago=String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO';const r=await f92Post('reposEnviarSolicitudF92',{reposicion_id:selected.REPOSICION_ID,tipo_solicitud:pago?'PAGO':'JUSTIFICACION',motivo,referencia_pago:ref,archivo_base64:b64,archivo_mime:file.type,archivo_nombre:file.name});setOk(r.mensaje||'Solicitud enviada.');setSelected(null);setMotivo('');setRef('');setFile(null);await load();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div data-screen-label="Estudiante · Solicitudes" style={{maxWidth:1060,margin:'0 auto',padding:'28px 30px 60px'}}>
    <div style={{marginBottom:20}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.15em',color:'var(--an-granate)'}}>GESTIONES DEL ESTUDIANTE</div><h1 style={{fontFamily:'var(--f-serif)',fontSize:34,margin:'4px 0 5px'}}>Mis Solicitudes</h1><p style={{margin:0,color:'var(--ink-3)',fontSize:13}}>Matrícula, cuotas y reposiciones de examen se tramitan con evidencia adjunta.</p></div>
    <div style={{display:'flex',gap:7,marginBottom:16,flexWrap:'wrap'}}>{['Matrículas','Cuotas','Exámenes'].map((x,i)=><span key={x} style={{padding:'7px 12px',borderRadius:999,border:'1px solid var(--line)',background:i===2?'var(--an-granate)':'#fff',color:i===2?'#fff':'var(--ink-2)',fontSize:11,fontWeight:800}}>{x}</span>)}</div>
    {ok&&<div style={{padding:12,borderRadius:10,background:'#EAF8EF',color:'#166534',marginBottom:12}}>{ok}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#FDECEA',color:'#991B1B',marginBottom:12}}>{error}</div>}
    {loading?<div className="card">Cargando solicitudes…</div>:!rows.length?<div className="card" style={{textAlign:'center',padding:34}}>No tenés reposiciones registradas.</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{rows.map(r=>{const [label,fg,bg]=f92RepoStatus(r.ESTADO),state=String(r.ESTADO||'').toUpperCase(),can=state==='PENDIENTE_JUSTIFICACION'||state==='PENDIENTE_PAGO';return <div className="card" key={r.REPOSICION_ID} style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><b>{r.TIPO_EXAMEN==='ORAL'?'Examen oral':'Examen escrito'} · Lección {String(r.LECCION).padStart(2,'0')}</b><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:4}}>Solicitud: {f92FmtDate(r.SOLICITUD_LIMITE)} · Reposición: {f92FmtDate(r.FECHA_LIMITE)}</div></div><span style={{padding:'4px 9px',borderRadius:999,background:bg,color:fg,fontSize:10,fontWeight:900}}>{label}</span></div>
      {r.SOLICITUD_ESTADO&&<div style={{fontSize:11.5,marginTop:9,color:'#166534'}}>Solicitud recibida: {r.SOLICITUD_ESTADO}</div>}
      {can&&<button className="btn btn-primary" style={{marginTop:10}} onClick={()=>{setSelected(r);setMotivo(r.SOLICITUD_MOTIVO||'');setRef(r.PAGO_REFERENCIA||'');setFile(null);}}>{state==='PENDIENTE_PAGO'?'ADJUNTAR COMPROBANTE DE PAGO':'ENVIAR SOLICITUD'}</button>}
    </div>})}</div>}
    {selected&&<div style={{position:'fixed',inset:0,zIndex:1500,background:'rgba(8,20,42,.62)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{width:'min(620px,96vw)',background:'#fff',borderRadius:16,padding:22,boxShadow:'0 24px 70px rgba(0,0,0,.3)'}}>
      <div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',color:'var(--an-granate)'}}>SOLICITUD DE EXAMEN</div><h2 style={{margin:'5px 0 4px',fontFamily:'var(--f-serif)'}}>{String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO'?'Reportar pago de ₡10.000':'Solicitar reposición'}</h2><p style={{fontSize:12,color:'var(--ink-3)',marginTop:0}}>Adjuntá una imagen o PDF legible. Máximo 8 MB.</p>
      {String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO'?<label style={{display:'block',fontSize:12,fontWeight:800}}>Número de comprobante<input value={ref} onChange={e=>setRef(e.target.value)} style={{width:'100%',marginTop:5,padding:10,border:'1px solid var(--line)',borderRadius:9}} /></label>:<label style={{display:'block',fontSize:12,fontWeight:800}}>Explicación<textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows="4" style={{width:'100%',marginTop:5,padding:10,border:'1px solid var(--line)',borderRadius:9,resize:'vertical'}} /></label>}
      <label style={{display:'block',fontSize:12,fontWeight:800,marginTop:12}}>Comprobante o respaldo<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:'block',marginTop:7}} /></label>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}><button className="btn btn-ghost" disabled={busy} onClick={()=>setSelected(null)}>Cancelar</button><button className="btn btn-primary" disabled={busy||!file||(!motivo&&String(selected.ESTADO).toUpperCase()!=='PENDIENTE_PAGO')||(!ref&&String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO')} onClick={send}>{busy?'ENVIANDO…':'ENVIAR SOLICITUD'}</button></div>
    </div></div>}
  </div>;
}

function ReposicionesAdminSolicitudesF92(){
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[busy,setBusy]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('reposListarSolicitudesF92').then(r=>setRows(r.rows||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const act=async(r,accion)=>{let note=window.prompt(accion==='APROBAR_JUSTIFICACION'?'Observación de aprobación:':accion==='RECHAZAR_JUSTIFICACION'?'Motivo por el que requiere ₡10.000:':'Referencia validada del pago:',r.ADMIN_NOTA||r.PAGO_REFERENCIA||'');if(note===null)return;setBusy(r.REPOSICION_ID+accion);try{await f92Post('reposResolverSolicitudF92',{reposicion_id:r.REPOSICION_ID,accion,admin_nota:note,pago_referencia:note});await load();}catch(e){setError(e.message);}finally{setBusy('');}};
  if(loading)return <div className="card">Cargando solicitudes de examen…</div>;
  return <div>{error&&<div style={{padding:12,background:'#FDECEA',color:'#991B1B',borderRadius:10,marginBottom:10}}>{error}</div>}{!rows.length?<div className="card" style={{textAlign:'center',padding:30}}>No hay reposiciones registradas.</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{rows.map(r=>{const [label,fg,bg]=f92RepoStatus(r.ESTADO),st=String(r.ESTADO||'').toUpperCase(),sent=String(r.SOLICITUD_ESTADO||'').toUpperCase();return <div className="card" key={r.REPOSICION_ID} style={{padding:15}}>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'start'}}><div><div style={{fontSize:14,fontWeight:850}}>{r.NOMBRE} <span style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)'}}>#{r.COD_ESTUDIANTE}</span></div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:3}}>{r.TIPO_EXAMEN} · Lección {String(r.LECCION).padStart(2,'0')} · {window.appTeacherGroupLabelF88?window.appTeacherGroupLabelF88(r.COD_GRUPO):r.COD_GRUPO} · vence {f92FmtDate(r.FECHA_LIMITE)}</div></div><span style={{padding:'4px 9px',borderRadius:999,background:bg,color:fg,fontSize:10,fontWeight:900}}>{label}</span></div>
    <div style={{marginTop:10,padding:10,borderRadius:10,background:'#F8FAFE',fontSize:12}}><b>Solicitud:</b> {sent||'NO ENVIADA'}{r.SOLICITUD_MOTIVO&&<div style={{marginTop:4}}>{r.SOLICITUD_MOTIVO}</div>}<div style={{display:'flex',gap:8,marginTop:7,flexWrap:'wrap'}}>{r.SOLICITUD_ARCHIVO_URL&&<a className="btn btn-ghost" href={r.SOLICITUD_ARCHIVO_URL} target="_blank" rel="noreferrer">Ver respaldo</a>}{r.PAGO_ARCHIVO_URL&&<a className="btn btn-ghost" href={r.PAGO_ARCHIVO_URL} target="_blank" rel="noreferrer">Ver comprobante</a>}</div></div>
    <div style={{display:'flex',gap:7,justifyContent:'flex-end',marginTop:10,flexWrap:'wrap'}}>{st==='PENDIENTE_JUSTIFICACION'&&sent==='ENVIADA'&&<><button className="btn btn-ghost" disabled={!!busy} onClick={()=>act(r,'RECHAZAR_JUSTIFICACION')}>REQUIERE ₡10.000</button><button className="btn btn-primary" disabled={!!busy} onClick={()=>act(r,'APROBAR_JUSTIFICACION')}>APROBAR SIN COSTO</button></>}{st==='PENDIENTE_JUSTIFICACION'&&sent!=='ENVIADA'&&<span style={{fontSize:11,color:'#8A5A00'}}>Esperando solicitud del estudiante dentro de 24 horas.</span>}{st==='PENDIENTE_PAGO'&&sent==='PAGO_REPORTADO'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>act(r,'CONFIRMAR_PAGO')}>CONFIRMAR PAGO</button>}</div>
  </div>})}</div>}</div>;
}

function SolicitudesUnificadasView({ onNavigate }){
  const [tab,setTab]=React.useState('MATRICULAS');
  const tabs=[['MATRICULAS','Matrículas'],['CUOTAS','Cuotas'],['EXAMENES','Exámenes'],['CAMBIOS','Cambios de clase · Docente']];
  return <div data-screen-label="Admin · Solicitudes" style={{padding:'28px 32px 60px',maxWidth:1280,margin:'0 auto'}}>
    <div style={{fontSize:10,fontWeight:900,letterSpacing:'.15em',color:'var(--an-granate)'}}>CENTRO DE GESTIONES</div><h1 style={{fontFamily:'var(--f-serif)',fontSize:35,margin:'4px 0 5px'}}>Solicitudes</h1><p style={{margin:'0 0 18px',fontSize:13,color:'var(--ink-3)'}}>Una sola bandeja, separada por tipo y responsable.</p>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18,padding:4,border:'1px solid var(--line)',borderRadius:12,background:'#fff'}}>{tabs.map(([id,label])=><button key={id} className={tab===id?'btn btn-primary':'btn btn-ghost'} onClick={()=>setTab(id)}>{label}</button>)}</div>
    {tab==='MATRICULAS'&&<SolicitudesPagoView onNavigate={onNavigate} categoria="MATRICULA" embedded />}
    {tab==='CUOTAS'&&<SolicitudesPagoView onNavigate={onNavigate} categoria="CUOTAS" embedded />}
    {tab==='EXAMENES'&&<ReposicionesAdminSolicitudesF92 />}
    {tab==='CAMBIOS'&&<PanelSuspensiones embedded />}
  </div>;
}

Object.assign(window,{ReposicionStudentCardF92,SolicitudesEstudianteView,ReposicionesAdminSolicitudesF92,SolicitudesUnificadasView});
