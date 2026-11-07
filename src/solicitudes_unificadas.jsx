/* global React, SolicitudesPagoView, PanelSuspensiones, getSesion */

function f92Token(){ try{return (window.getSesion&&window.getSesion()||{}).token||'';}catch(_){return'';} }
async function f92Post(fn,payload={}){
  const r=await fetch(window.APPS_SCRIPT_URL,{
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

function f92SafeUserError(raw,fallback,context=''){
  const detail=raw&&typeof raw==='object'?(raw.mensaje||raw.error||raw.message||raw):raw;
  if(detail) console.error('[Solicitudes]',context||'operación',detail);
  return fallback;
}


// F111 R57 B5 — superficies nuevas, separadas de solicitudes históricas F92.
// Estos componentes no verifican dinero, no abren exámenes y nunca inventan
// disponibilidad: todas las opciones provienen de respuestas autenticadas.
function r57UserSafeError(_raw,fallback,_context){return fallback;}
function r57StatusUi(estado){
  return ({
    SIN_SOLICITUD:['Pendiente de solicitar','#991B1B','#FDECEA'],
    INVITADA:['Invitación del docente','#8A5A00','#FFF4D6'],
    SOLICITADA:['En revisión por la Academia','#0C4F86','#E7F1FA'],
    AUTORIZADA_48H:['Autorizada · 48 horas','#166534','#EAF8EF'],
    VENCIDA_SIN_PRESENTACION:['Ventana vencida','#991B1B','#FDECEA'],
    RECHAZADA:['No autorizada','#6B7280','#F3F4F6'],
    APLICADA:['Examen aplicado','#166534','#EAF8EF']
  })[String(estado||'').toUpperCase()]||[estado||'Pendiente','#40516A','#EEF2F7'];
}
function r57DateTime(raw){
  if(!raw)return '—';
  const d=new Date(String(raw));
  return Number.isNaN(d.getTime())?'—':d.toLocaleString('es-CR',{
    timeZone:'America/Costa_Rica',day:'2-digit',month:'short',year:'numeric',
    hour:'2-digit',minute:'2-digit',hour12:true
  });
}
function r57Key(row){return [row.COD_GRUPO,row.NIVEL,row.LECCION,row.COD_ESTUDIANTE].join('|');}
function ReposicionesR57Estudiante(){
  const [options,setOptions]=React.useState([]),[cycles,setCycles]=React.useState([]),
    [enabled,setEnabled]=React.useState(false),[loading,setLoading]=React.useState(true),
    [selected,setSelected]=React.useState(''),[motivo,setMotivo]=React.useState(''),
    [busy,setBusy]=React.useState(false),[message,setMessage]=React.useState(''),[error,setError]=React.useState('');
  const load=React.useCallback(async()=>{
    setLoading(true);
    try{
      const [o,c]=await Promise.all([f92Post('reposListarOpcionesR57'),f92Post('reposListarCiclosR57')]);
      setEnabled(true);setOptions(o.rows||[]);setCycles(c.rows||[]);
    }catch(e){
      // Función B5 no publicada o bandera institucional aún apagada:
      // mantener intacta la experiencia histórica F92.
      console.warn('[F111 R57] Ciclos de reposición no disponibles.',e);
      setEnabled(false);
    }finally{setLoading(false);}
  },[]);
  React.useEffect(()=>{load();},[load]);
  const send=async(row)=>{
    if(busy||motivo.trim().length<5)return;
    setBusy(true);setError('');setMessage('');
    try{
      const r=await f92Post('reposCrearSolicitudR57',{
        cod_grupo:row.COD_GRUPO,nivel:row.NIVEL,leccion:Number(row.LECCION),motivo:motivo.trim()
      });
      setMessage(r.mensaje||'Solicitud enviada a la Academia.');setSelected('');setMotivo('');
      await load();
    }catch(e){setError(r57UserSafeError(e,'No se pudo presentar la solicitud. Intentá nuevamente.','R57:student'));}
    finally{setBusy(false);}
  };
  if(loading||!enabled)return null;
  return <section className="card" data-r57-student-requests="true" style={{padding:18,marginBottom:15,border:'1px solid #D2DCE8'}}>
    <div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',color:'#7A1E2C'}}>REPOSICIONES · NUEVA MODALIDAD</div>
    <h3 style={{fontSize:20,margin:'5px 0 4px'}}>Solicitudes individuales de examen</h3>
    <p style={{color:'var(--ink-3)',fontSize:12.5,margin:'0 0 12px'}}>
      Si transcurrieron 48 horas desde la apertura original sin examen realizado, podés solicitar autorización a la Academia. Cada autorización aprobada tiene su propio plazo de 48 horas. Los pagos se gestionan fuera del Campus.
    </p>
    {message&&<div role="status" style={{padding:10,background:'#EAF8EF',color:'#166534',borderRadius:8,marginBottom:9,fontSize:12}}>{message}</div>}
    {error&&<div role="alert" style={{padding:10,background:'#FDECEA',color:'#991B1B',borderRadius:8,marginBottom:9,fontSize:12}}>{error}</div>}
    {!options.length&&!cycles.length&&<div style={{fontSize:12,color:'var(--ink-3)'}}>No hay solicitudes o exámenes elegibles para reposición.</div>}
    <div style={{display:'flex',flexDirection:'column',gap:9}}>{options.map(row=>{
      const [label,ink,bg]=r57StatusUi(row.ESTADO),key=r57Key(row);
      return <div key={key} style={{border:'1px solid var(--line)',borderRadius:10,padding:12}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
          <b style={{fontSize:12.5}}>{row.TIPO_EXAMEN==='ORAL'?'Oral':'Escrito'} · Lección {String(row.LECCION).padStart(2,'0')} · {row.NIVEL} · {row.COD_GRUPO}</b>
          <span style={{fontSize:11,fontWeight:800,color:ink,background:bg,padding:'4px 8px',borderRadius:12}}>{label}</span>
        </div>
        {row.FECHA_LIMITE&&<div style={{fontSize:11,color:'var(--ink-3)',marginTop:5}}>Ventana autorizada hasta: {r57DateTime(row.FECHA_LIMITE)}</div>}
        {row.PUEDE_SOLICITAR&&!selected.startsWith(key+'::')&&<button type="button" className="btn btn-primary"
          style={{marginTop:10}} onClick={()=>{setSelected(key+'::open');setMotivo('');}}>
          {['RECHAZADA','VENCIDA_SIN_PRESENTACION'].includes(row.ESTADO)?'SOLICITAR NUEVA REPOSICIÓN':'SOLICITAR REPOSICIÓN'}
        </button>}
        {selected===key+'::open'&&<div style={{marginTop:9}}>
          <label style={{display:'block',fontWeight:800,fontSize:12}}>Motivo de la solicitud
            <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows={3} maxLength={1000}
              style={{display:'block',width:'100%',padding:9,marginTop:5,border:'1px solid var(--line)',borderRadius:8}}/>
          </label>
          <div style={{display:'flex',gap:7,justifyContent:'flex-end',marginTop:8}}>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={()=>setSelected('')}>Cancelar</button>
            <button type="button" className="btn btn-primary" disabled={busy||motivo.trim().length<5} onClick={()=>send(row)}>
              {busy?'ENVIANDO…':'ENVIAR A LA ACADEMIA'}
            </button>
          </div>
        </div>}
      </div>;
    })}</div>
    {cycles.length>0&&<details style={{marginTop:12}}>
      <summary style={{fontSize:12,fontWeight:800,cursor:'pointer'}}>Ver historial de solicitudes ({cycles.length})</summary>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
        {cycles.map(c=>{const [label,ink,bg]=r57StatusUi(c.ESTADO);return <div key={c.REPOSICION_ID} style={{padding:9,borderRadius:8,border:'1px solid var(--line)',fontSize:11.5}}>
          {c.NIVEL} · Lección {c.LECCION} · <b style={{color:ink}}>{label}</b>
          {c.FECHA_LIMITE&&<span style={{marginLeft:8}}>Hasta {r57DateTime(c.FECHA_LIMITE)}</span>}
          {c.MENSAJE_ESTUDIANTE&&<p style={{margin:'6px 0 0',color:'#8A5A00'}}>{c.MENSAJE_ESTUDIANTE}</p>}
          {c.ADMIN_NOTA&&<p style={{margin:'6px 0 0'}}>Observación de la Academia: {c.ADMIN_NOTA}</p>}
        </div>})}
      </div>
    </details>}
  </section>;
}
function ReposicionesR57Admin(){
  const ses=typeof getSesion==='function'?getSesion():null;
  const isSuper=String(ses?.rol||'').toLowerCase()==='superadmin';
  const [rows,setRows]=React.useState([]),[enabled,setEnabled]=React.useState(false),
    [error,setError]=React.useState(''),[busy,setBusy]=React.useState('');
  const load=React.useCallback(async()=>{
    try{const r=await f92Post('reposListarCiclosR57');setRows(r.rows||[]);setEnabled(true);}
    catch(e){console.warn('[F111 R57] Listado admin aún no disponible.',e);setEnabled(false);}
  },[]);
  React.useEffect(()=>{load();},[load]);
  const act=async(row,decision)=>{
    const comment=window.prompt(decision==='SI'?'Comentario de autorización:':'Comentario de rechazo:',row.ADMIN_NOTA||'');
    if(comment===null)return;
    if(!comment.trim()||comment.trim().length>1000){setError('Escribí una observación válida de hasta 1000 caracteres.');return;}
    setError('');setBusy(row.REPOSICION_ID);
    try{await f92Post('reposResolverSolicitudR57',{reposicion_id:row.REPOSICION_ID,decision,admin_nota:comment.trim()});await load();}
    catch(e){setError(r57UserSafeError(e,'No se pudo resolver esta solicitud.','R57:admin'));}
    finally{setBusy('');}
  };
  if(!enabled)return null;
  const pending=rows.filter(x=>String(x.ESTADO).toUpperCase()==='SOLICITADA');
  return <section className="card" data-r57-admin-requests="true" style={{padding:16,marginBottom:15}}>
    <div style={{fontSize:10,fontWeight:900,letterSpacing:'.12em',color:'#7A1E2C'}}>SOLICITUDES DE REPOSICIÓN · 48 HORAS</div>
    <h3 style={{fontSize:19,margin:'5px 0 7px'}}>Decisiones pendientes ({pending.length})</h3>
    <p style={{fontSize:12,color:'var(--ink-3)',margin:'0 0 12px'}}>La decisión del superadmin es Sí o No, sin comprobación de pago en el Campus.</p>
    {error&&<div role="alert" style={{color:'#991B1B',padding:8,background:'#FDECEA',borderRadius:8,marginBottom:7}}>{error}</div>}
    {!pending.length&&<div style={{fontSize:12,color:'var(--ink-3)'}}>No hay solicitudes nuevas pendientes.</div>}
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {pending.map(r=><div key={r.REPOSICION_ID} style={{padding:11,border:'1px solid var(--line)',borderRadius:10}}>
        <div style={{fontWeight:850,fontSize:12.5}}>{r.NOMBRE||r.COD_ESTUDIANTE} · {r.COD_ESTUDIANTE}</div>
        <div style={{fontSize:11,color:'var(--ink-3)',marginTop:3}}>{r.COD_GRUPO} · {r.NIVEL} · Lección {r.LECCION} · {r.TIPO_EXAMEN}</div>
        <p style={{fontSize:12,margin:'7px 0'}}>{r.SOLICITUD_MOTIVO||'Sin explicación registrada'}</p>
        {isSuper?<div style={{display:'flex',justifyContent:'flex-end',gap:7}}>
          <button className="btn btn-ghost" disabled={!!busy} onClick={()=>act(r,'NO')}>NO AUTORIZAR</button>
          <button className="btn btn-primary" disabled={!!busy} onClick={()=>act(r,'SI')}>SÍ · AUTORIZAR 48 HORAS</button>
        </div>:<div style={{fontSize:11,color:'var(--ink-3)'}}>Solo superadmin puede resolver solicitudes.</div>}
      </div>)}
    </div>
    {rows.length>0&&<details style={{marginTop:12}}>
      <summary style={{cursor:'pointer',fontSize:12,fontWeight:800}}>Historial completo de ciclos ({rows.length})</summary>
      <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
        {rows.map(r=>{const [label,ink]=r57StatusUi(r.ESTADO);return <div key={r.REPOSICION_ID}
          style={{border:'1px solid var(--line)',borderRadius:8,padding:9,fontSize:11.5}}>
          <b>{r.NOMBRE||r.COD_ESTUDIANTE}</b> · #{r.COD_ESTUDIANTE} · {r.NIVEL} · Lección {r.LECCION}
          <span style={{marginLeft:8,color:ink,fontWeight:850}}>{label}</span>
          {r.FECHA_LIMITE&&<span style={{marginLeft:8}}>Hasta {r57DateTime(r.FECHA_LIMITE)}</span>}
          {r.SOLICITUD_MOTIVO&&<div style={{marginTop:4}}>Motivo: {r.SOLICITUD_MOTIVO}</div>}
          {r.ADMIN_NOTA&&<div style={{marginTop:4}}>Decisión: {r.ADMIN_NOTA}</div>}
        </div>})}
      </div>
    </details>}
  </section>;
}
function ReposicionesR57Docente(){
  const [groups,setGroups]=React.useState([]),[group,setGroup]=React.useState(''),[level,setLevel]=React.useState('B1'),
    [rows,setRows]=React.useState([]),[enabled,setEnabled]=React.useState(false),
    [loading,setLoading]=React.useState(false),[busy,setBusy]=React.useState(''),[error,setError]=React.useState('');
  React.useEffect(()=>{
    let mounted=true;
    f92Post('getDocenteGruposActuales').then(data=>{
      if(!mounted)return;
      const raw=Array.isArray(data.todos)?data.todos:Array.isArray(data.grupos)?data.grupos:[];
      const valid=[...new Set(raw.filter(x=>x&&x.puede_curso!==false&&x.permisos_riel?.curso!==false)
        .map(x=>String(typeof x==='string'?x:x.code||x.cod_grupo||x.codigo_grupo||x.grupo||'').trim()).filter(Boolean))];
      setGroups(valid);setGroup(valid[0]||'');
    }).catch(e=>console.warn('[F111 R57] No hay grupos docentes verificados.',e));
    return()=>{mounted=false;};
  },[]);
  const load=React.useCallback(async()=>{
    if(!group||!level)return;
    setLoading(true);setError('');
    try{const r=await f92Post('reposListarOpcionesR57',{cod_grupo:group,nivel:level});
      setRows(r.rows||[]);setEnabled(true);}
    catch(e){setEnabled(false);setRows([]);console.warn('[F111 R57] Opciones docentes no disponibles.',e);}
    finally{setLoading(false);}
  },[group,level]);
  React.useEffect(()=>{load();},[load]);
  const invite=async r=>{
    setBusy(r.COD_ESTUDIANTE+'|'+r.LECCION);setError('');
    try{
      await f92Post('reposInvitarSolicitudR57',{cod_grupo:r.COD_GRUPO,nivel:r.NIVEL,
        leccion:Number(r.LECCION),cod_estudiante:r.COD_ESTUDIANTE});
      await load();
    }catch(e){setError(r57UserSafeError(e,'No se pudo enviar la invitación.','R57:teacher'));}
    finally{setBusy('');}
  };
  if(!groups.length)return null;
  return <section className="card" data-r57-teacher-invitations="true" style={{padding:16}}>
    <div style={{fontSize:10,fontWeight:900,color:'#7A1E2C',letterSpacing:'.12em'}}>REPOSICIONES · ESTUDIANTES SIN EVALUACIÓN</div>
    <h3 style={{fontSize:19,margin:'5px 0 6px'}}>Invitar a solicitar reposición</h3>
    <p style={{fontSize:12,color:'var(--ink-3)',margin:'0 0 11px'}}>La invitación aparecerá en el Campus del estudiante; únicamente el superadmin puede autorizar su examen.</p>
    <div style={{display:'flex',gap:9,flexWrap:'wrap',marginBottom:12}}>
      <label style={{fontSize:12,fontWeight:800}}>Grupo
        <select value={group} onChange={e=>setGroup(e.target.value)} style={{display:'block',minWidth:170,marginTop:4,padding:7}}>
          {groups.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </label>
      <label style={{fontSize:12,fontWeight:800}}>Nivel
        <select value={level} onChange={e=>setLevel(e.target.value)} style={{display:'block',marginTop:4,padding:7}}>
          {['B1','B2','I1','I2'].map(n=><option key={n}>{n}</option>)}
        </select>
      </label>
      <button type="button" className="btn btn-ghost" onClick={load} disabled={loading} style={{alignSelf:'end'}}>Actualizar lista</button>
    </div>
    {error&&<div role="alert" style={{color:'#991B1B',fontSize:12,marginBottom:8}}>{error}</div>}
    {loading?<div style={{fontSize:12}}>Verificando expedientes…</div>
      :enabled&&(!rows.length?<div style={{fontSize:12,color:'var(--ink-3)'}}>No hay estudiantes elegibles para reposición en este nivel.</div>
      :<div style={{display:'flex',flexDirection:'column',gap:7}}>{rows.map(r=>{
        const [label,ink,bg]=r57StatusUi(r.ESTADO);
        return <div key={r57Key(r)} style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:9,alignItems:'center',padding:10,border:'1px solid var(--line)',borderRadius:9}}>
          <div><b style={{fontSize:12.5}}>{r.NOMBRE||r.COD_ESTUDIANTE}</b>
            <div style={{fontSize:11,color:'var(--ink-3)'}}>#{r.COD_ESTUDIANTE} · {r.TIPO_EXAMEN} · Lección {r.LECCION}</div>
            <span style={{fontSize:10.5,color:ink,background:bg,borderRadius:8,padding:'2px 6px'}}>{label}</span>
          </div>
          {r.PUEDE_INVITAR&&<button type="button" className="btn btn-primary" disabled={!!busy}
            onClick={()=>invite(r)}>{busy?'PROCESANDO…':r.INVITADA?'INVITACIÓN ENVIADA':'INVITAR A SOLICITAR'}</button>}
        </div>;
      })}</div>)}
  </section>;
}

function ReposicionStudentCardF92({ onNavigate, compact=false }){
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('reposMiEstadoF92').then(r=>setRows(r.rows||[])).catch(e=>setError(f92SafeUserError(e,'Intentá nuevamente en unos segundos.','reposMiEstadoF92:card'))).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const pending=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5'&&!['APLICADA','VENCIDA_0','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));
  if(loading)return compact?null:<div className="card" style={{padding:16}}>{studentRequestsT('Consultando evaluaciones pendientes…')}</div>;
  if(error)return compact?null:<div className="card" style={{padding:16,color:'#8B1F1F'}}>{studentRequestsT('No se pudo consultar reposiciones:')} {studentRequestsT(error)}</div>;
  if(!pending.length)return null;
  return <div className="card" style={{border:'2px solid #E2A52A',background:'#FFFDF6'}}>
    <div className="card-h" style={{alignItems:'flex-start'}}>
      <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.13em',color:'#8A5A00'}}>{studentRequestsT('EVALUACIÓN PENDIENTE')}</div><div className="card-title" style={{marginTop:3}}>{studentRequestsT('Solicitud de reposición')}</div></div>
      <span style={{padding:'4px 9px',borderRadius:999,background:'#FFF4D6',color:'#8A5A00',fontSize:10,fontWeight:900}}>{pending.length} {studentRequestsT(pending.length===1?'pendiente':'pendientes')}</span>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:9}}>{pending.map(r=>{const [label,fg,bg]=f92RepoStatus(r.ESTADO);return <div key={r.REPOSICION_ID} style={{border:'1px solid #E8D5A4',borderRadius:12,padding:'12px 13px',background:'#fff'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
        <div><div style={{fontSize:14,fontWeight:850}}>{studentRequestsT(r.TIPO_EXAMEN==='ORAL'?'Examen oral':'Examen escrito')} · {studentRequestsT('Lección')} {String(r.LECCION).padStart(2,'0')}</div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:3}}>{studentRequestsT('Fecha original:')} {studentRequestsDate(r.FECHA_ORIGINAL)} · {studentRequestsT('Solicitud hasta:')} {studentRequestsDate(r.SOLICITUD_LIMITE)} · {studentRequestsT('Aplicación máxima:')} {studentRequestsDate(r.FECHA_LIMITE)}</div></div>
        <span style={{padding:'4px 8px',borderRadius:999,background:bg,color:fg,fontSize:9.5,fontWeight:900}}>{studentRequestsT(label)}</span>
      </div>
      <div style={{fontSize:12,color:'var(--ink-2)',lineHeight:1.5,marginTop:9}}>{studentRequestsT(String(r.ESTADO).toUpperCase()==='PENDIENTE_JUSTIFICACION'?'Enviá la solicitud dentro de las primeras 24 horas y adjuntá el respaldo. Administración determinará si procede sin costo o requiere ₡10.000.':String(r.ESTADO).toUpperCase()==='PENDIENTE_PAGO'?'Administración indicó que la reposición requiere ₡10.000. Adjuntá el comprobante de pago para autorizarla.':'La reposición ya fue autorizada. El docente coordinará una fecha tentativa y aplicará la prueba.')}</div>
      {String(r.SOLICITUD_ESTADO||'').toUpperCase()==='ENVIADA'?<div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:10,padding:'9px 12px',borderRadius:10,background:'#EAF8EF',color:'#166534',fontSize:12,fontWeight:850}}><span style={{width:8,height:8,borderRadius:'50%',background:'#2E7D32'}} />{studentRequestsT('SOLICITUD EN PROCESO')}</div>:String(r.SOLICITUD_ESTADO||'').toUpperCase()==='PAGO_REPORTADO'?<div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:10,padding:'9px 12px',borderRadius:10,background:'#EAF8EF',color:'#166534',fontSize:12,fontWeight:850}}><span style={{width:8,height:8,borderRadius:'50%',background:'#2E7D32'}} />{studentRequestsT('COMPROBANTE EN VALIDACIÓN')}</div>:['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','PROGRAMADA'].includes(String(r.ESTADO||'').toUpperCase())?<div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:10,padding:'9px 12px',borderRadius:10,background:'#E7F1FA',color:'#0C4F86',fontSize:12,fontWeight:850}}><span style={{width:8,height:8,borderRadius:'50%',background:'#0C4F86'}} />{studentRequestsT('REPOSICIÓN AUTORIZADA')}</div>:<button type="button" className="btn btn-primary" style={{marginTop:10}} onClick={()=>onNavigate&&onNavigate('evaluaciones',{tab:'reposiciones'})}>{studentRequestsT('IR A REPOSICIONES')}</button>}
    </div>})}</div>
  </div>;
}

const studentRequestsT = label => window.AN_I18N?.t(label) || label;
const studentRequestsDate = value => {
  if(window.AN_I18N?.getLang?.() !== 'en')return f92FmtDate(value);
  const iso=String(value||'').slice(0,10);if(!iso)return '—';
  const d=new Date(iso+'T12:00:00');
  return Number.isNaN(d.getTime())?iso:d.toLocaleDateString('en-US',{day:'2-digit',month:'long',year:'numeric'});
};
function SolicitudesEstudianteView({ onNavigate, embedded=false }){
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[selected,setSelected]=React.useState(null),[motivo,setMotivo]=React.useState(''),[ref,setRef]=React.useState(''),[file,setFile]=React.useState(null),[busy,setBusy]=React.useState(false),[ok,setOk]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('reposMiEstadoF92').then(r=>setRows(r.rows||[])).catch(e=>setError(f92SafeUserError(e,'No se pudieron cargar las reposiciones.','reposMiEstadoF92:view'))).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const legacyRows=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5');
  const send=async()=>{if(!selected||!file)return;setBusy(true);setError('');setOk('');try{const b64=await f92FileToBase64(file);const pago=String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO';const r=await f92Post('reposEnviarSolicitudF92',{reposicion_id:selected.REPOSICION_ID,tipo_solicitud:pago?'PAGO':'JUSTIFICACION',motivo,referencia_pago:ref,archivo_base64:b64,archivo_mime:file.type,archivo_nombre:file.name});setOk(r.mensaje||'Solicitud enviada.');setSelected(null);setMotivo('');setRef('');setFile(null);await load();}catch(e){setError(f92SafeUserError(e,'No se pudo enviar la solicitud. Intentá nuevamente.','reposEnviarSolicitudF92'));}finally{setBusy(false);}};
  return <div data-screen-label="Estudiante · Reposiciones" style={{maxWidth:1060,margin:'0 auto',padding:embedded?'0':'28px 30px 60px'}}>
    {!embedded && <div style={{marginBottom:20}}><div style={{fontSize:10,fontWeight:900,letterSpacing:'.15em',color:'var(--an-granate)'}}>{studentRequestsT('EVALUACIONES')}</div><h1 style={{fontFamily:'var(--f-serif)',fontSize:34,margin:'4px 0 5px'}}>{studentRequestsT('Reposiciones de examen')}</h1><p style={{margin:0,color:'var(--ink-3)',fontSize:13}}>{studentRequestsT('Consultá requisitos, plazos, evidencia enviada y resolución de cada reposición.')}</p></div>}
    <ReposicionesR57Estudiante />
    <div className="card" style={{padding:'13px 16px',marginBottom:16,fontSize:12.5,color:'var(--ink-2)',lineHeight:1.55}}>
      {studentRequestsT('Las reposiciones se habilitan únicamente cuando existe una ausencia o evaluación pendiente registrada por el sistema. Según la resolución administrativa, pueden requerir justificación o comprobante de pago. Los estados mostrados provienen del backend; no hay solicitudes generales de matrícula o cuotas en esta pantalla.')}
    </div>
    {ok&&<div style={{padding:12,borderRadius:10,background:'#EAF8EF',color:'#166534',marginBottom:12}}>{ok}</div>}
    {error&&<div style={{padding:12,borderRadius:10,background:'#FDECEA',color:'#991B1B',marginBottom:12}}>{studentRequestsT(error)}</div>}
    {loading?<div className="card">{studentRequestsT('Cargando solicitudes…')}</div>:!legacyRows.length?<div className="card" style={{textAlign:'center',padding:34}}>{studentRequestsT('No tenés reposiciones registradas.')}</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{legacyRows.map(r=>{const [label,fg,bg]=f92RepoStatus(r.ESTADO),state=String(r.ESTADO||'').toUpperCase(),sent=String(r.SOLICITUD_ESTADO||'').toUpperCase(),canJust=state==='PENDIENTE_JUSTIFICACION'&&sent!=='ENVIADA',canPay=state==='PENDIENTE_PAGO'&&sent!=='PAGO_REPORTADO',inProcess=(state==='PENDIENTE_JUSTIFICACION'&&sent==='ENVIADA')||(state==='PENDIENTE_PAGO'&&sent==='PAGO_REPORTADO');return <div className="card" key={r.REPOSICION_ID} style={{padding:16}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><b>{studentRequestsT(r.TIPO_EXAMEN==='ORAL'?'Examen oral':'Examen escrito')} · {studentRequestsT('Lección')} {String(r.LECCION).padStart(2,'0')}</b><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:4}}>{studentRequestsT('Solicitud:')} {studentRequestsDate(r.SOLICITUD_LIMITE)} · {studentRequestsT('Reposición:')} {studentRequestsDate(r.FECHA_LIMITE)}</div></div><span style={{padding:'4px 9px',borderRadius:999,background:bg,color:fg,fontSize:10,fontWeight:900}}>{studentRequestsT(label)}</span></div>
      {inProcess&&<div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:10,padding:'9px 12px',borderRadius:10,background:'#EAF8EF',color:'#166534',fontSize:12,fontWeight:850}}><span style={{width:8,height:8,borderRadius:'50%',background:'#2E7D32'}} />{state==='PENDIENTE_PAGO'?studentRequestsT('Comprobante en validación'):studentRequestsT('Solicitud en proceso')}</div>}
      {canJust&&<button className="btn btn-primary" style={{marginTop:10}} onClick={()=>{setSelected(r);setMotivo(r.SOLICITUD_MOTIVO||'');setRef('');setFile(null);}}>{studentRequestsT('ENVIAR SOLICITUD')}</button>}
      {canPay&&<button className="btn btn-primary" style={{marginTop:10}} onClick={()=>{setSelected(r);setMotivo('');setRef(r.PAGO_REFERENCIA||'');setFile(null);}}>{studentRequestsT('ADJUNTAR COMPROBANTE DE PAGO')}</button>}
      {['JUSTIFICADA_GRATUITA','PAGADA_AUTORIZADA','PROGRAMADA'].includes(state)&&<div style={{display:'inline-flex',alignItems:'center',gap:8,marginTop:10,padding:'9px 12px',borderRadius:10,background:'#E7F1FA',color:'#0C4F86',fontSize:12,fontWeight:850}}><span style={{width:8,height:8,borderRadius:'50%',background:'#0C4F86'}} />{studentRequestsT('Reposición autorizada · pendiente de coordinación')}</div>}
    </div>})}</div>}
    {selected&&<div style={{position:'fixed',inset:0,zIndex:1500,background:'rgba(8,20,42,.62)',display:'flex',alignItems:'center',justifyContent:'center',padding:20}}><div style={{width:'min(620px,96vw)',background:'#fff',borderRadius:16,padding:22,boxShadow:'0 24px 70px rgba(0,0,0,.3)'}}>
      <div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',color:'var(--an-granate)'}}>{studentRequestsT('SOLICITUD DE EXAMEN')}</div><h2 style={{margin:'5px 0 4px',fontFamily:'var(--f-serif)'}}>{String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO'?studentRequestsT('Reportar pago de ₡10.000'):studentRequestsT('Solicitar reposición')}</h2><p style={{fontSize:12,color:'var(--ink-3)',marginTop:0}}>{studentRequestsT('Adjuntá una imagen o PDF legible. Máximo 8 MB.')}</p>
      {String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO'?<label style={{display:'block',fontSize:12,fontWeight:800}}>{studentRequestsT('Número de comprobante')}<input value={ref} onChange={e=>setRef(e.target.value)} style={{width:'100%',marginTop:5,padding:10,border:'1px solid var(--line)',borderRadius:9}} /></label>:<label style={{display:'block',fontSize:12,fontWeight:800}}>{studentRequestsT('Explicación')}<textarea value={motivo} onChange={e=>setMotivo(e.target.value)} rows="4" style={{width:'100%',marginTop:5,padding:10,border:'1px solid var(--line)',borderRadius:9,resize:'vertical'}} /></label>}
      <label style={{display:'block',fontSize:12,fontWeight:800,marginTop:12}}>{studentRequestsT('Comprobante o respaldo')}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)} style={{display:'block',marginTop:7}} /></label>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18}}><button className="btn btn-ghost" disabled={busy} onClick={()=>setSelected(null)}>{studentRequestsT('Cancelar')}</button><button className="btn btn-primary" disabled={busy||!file||(!motivo&&String(selected.ESTADO).toUpperCase()!=='PENDIENTE_PAGO')||(!ref&&String(selected.ESTADO).toUpperCase()==='PENDIENTE_PAGO')} onClick={send}>{studentRequestsT(busy?'ENVIANDO…':'ENVIAR SOLICITUD')}</button></div>
    </div></div>}
  </div>;
}

function ReposicionesAdminSolicitudesF92(){
  const sesion=typeof getSesion==='function'?getSesion():null;
  const esSuperadmin=String(sesion?.rol||'').toLowerCase()==='superadmin';
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[busy,setBusy]=React.useState('');
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('reposListarSolicitudesF92').then(r=>setRows(r.rows||[])).catch(e=>setError(f92SafeUserError(e,'No se pudieron cargar las solicitudes de reposición.','reposListarSolicitudesF92'))).finally(()=>setLoading(false));},[]);
  React.useEffect(()=>{load();},[load]);
  const legacyRows=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5');
  const act=async(r,accion)=>{let note=window.prompt(accion==='APROBAR_JUSTIFICACION'?'Observación de aprobación:':accion==='RECHAZAR_JUSTIFICACION'?'Motivo por el que requiere ₡10.000:':'Referencia validada del pago:',r.ADMIN_NOTA||r.PAGO_REFERENCIA||'');if(note===null)return;setBusy(r.REPOSICION_ID+accion);try{await f92Post('reposResolverSolicitudF92',{reposicion_id:r.REPOSICION_ID,accion,admin_nota:note,pago_referencia:note});await load();}catch(e){setError(f92SafeUserError(e,'No se pudo actualizar la solicitud de reposición.','reposResolverSolicitudF92'));}finally{setBusy('');}};
  if(loading)return <div className="card">Cargando solicitudes de examen…</div>;
  return <div><ReposicionesR57Admin />{error&&<div style={{padding:12,background:'#FDECEA',color:'#991B1B',borderRadius:10,marginBottom:10}}>{error}</div>}{!legacyRows.length?<div className="card" style={{textAlign:'center',padding:30}}>No hay reposiciones registradas.</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{legacyRows.map(r=>{const [label,fg,bg]=f92RepoStatus(r.ESTADO),st=String(r.ESTADO||'').toUpperCase(),sent=String(r.SOLICITUD_ESTADO||'').toUpperCase();return <div className="card" key={r.REPOSICION_ID} style={{padding:15}}>
    <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'start'}}><div><div style={{fontSize:14,fontWeight:850}}>{r.NOMBRE} <span style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)'}}>#{r.COD_ESTUDIANTE}</span></div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:3}}>{r.TIPO_EXAMEN} · Lección {String(r.LECCION).padStart(2,'0')} · {window.appTeacherGroupLabelF88?window.appTeacherGroupLabelF88(r.COD_GRUPO):r.COD_GRUPO} · vence {f92FmtDate(r.FECHA_LIMITE)}</div></div><span style={{padding:'4px 9px',borderRadius:999,background:bg,color:fg,fontSize:10,fontWeight:900}}>{label}</span></div>
    <div style={{marginTop:10,padding:10,borderRadius:10,background:'#F8FAFE',fontSize:12}}><b>Solicitud:</b> {sent||'NO ENVIADA'}{r.SOLICITUD_MOTIVO&&<div style={{marginTop:4}}>{r.SOLICITUD_MOTIVO}</div>}<div style={{display:'flex',gap:8,marginTop:7,flexWrap:'wrap'}}>{r.SOLICITUD_ARCHIVO_URL&&<a className="btn btn-ghost" href={r.SOLICITUD_ARCHIVO_URL} target="_blank" rel="noreferrer">Ver respaldo</a>}{r.PAGO_ARCHIVO_URL&&<a className="btn btn-ghost" href={r.PAGO_ARCHIVO_URL} target="_blank" rel="noreferrer">Ver comprobante</a>}</div></div>
    <div style={{display:'flex',gap:7,justifyContent:'flex-end',marginTop:10,flexWrap:'wrap'}}>{esSuperadmin&&st==='PENDIENTE_JUSTIFICACION'&&sent==='ENVIADA'&&<><button className="btn btn-ghost" disabled={!!busy} onClick={()=>act(r,'RECHAZAR_JUSTIFICACION')}>REQUIERE ₡10.000</button><button className="btn btn-primary" disabled={!!busy} onClick={()=>act(r,'APROBAR_JUSTIFICACION')}>APROBAR SIN COSTO</button></>}{st==='PENDIENTE_JUSTIFICACION'&&sent!=='ENVIADA'&&<span style={{fontSize:11,color:'#8A5A00'}}>Esperando solicitud del estudiante dentro de 24 horas.</span>}{esSuperadmin&&st==='PENDIENTE_PAGO'&&sent==='PAGO_REPORTADO'&&<button className="btn btn-primary" disabled={!!busy} onClick={()=>act(r,'CONFIRMAR_PAGO')}>CONFIRMAR PAGO</button>}{!esSuperadmin&&((st==='PENDIENTE_JUSTIFICACION'&&sent==='ENVIADA')||(st==='PENDIENTE_PAGO'&&sent==='PAGO_REPORTADO'))&&<span style={{fontSize:11,color:'#40516A'}}>Pendiente de resolución por Superadmin.</span>}</div>
  </div>})}</div>}</div>;
}



function freeUserEstadoMetaF984(estado){
  const k=String(estado||'PENDIENTE').toUpperCase();
  return ({
    PENDIENTE:['Pendiente','#991B1B','#FDECEA','Sin contestar'],
    EN_GESTION:['En gestión','#8A5A00','#FFF4D6','Tomada por asesor'],
    RESPONDIDA:['Respondida','#166534','#EAF8EF','Respuesta enviada'],
    CONVERTIDA:['Convertida','#0C4F86','#E7F1FA','Pasó a matrícula'],
    CERRADA:['Cerrada','#40516A','#EEF2F7','Gestión cerrada'],
    DESCARTADA:['Descartada','#5F6875','#EEF2F7','Sin seguimiento']
  })[k]||[k,'#40516A','#EEF2F7',''];
}
function FreeUserEstadoPillF984({estado}){
  const [label,fg,bg]=freeUserEstadoMetaF984(estado);
  return <span style={{padding:'4px 9px',borderRadius:999,background:bg,color:fg,fontSize:10,fontWeight:900,whiteSpace:'nowrap'}}>{label}</span>;
}
function FreeUserActionNoteF984({open,onClose,onSubmit,estado,nombre,busy}){
  const [nota,setNota]=React.useState('');
  React.useEffect(()=>{ if(open){ setNota(''); setTimeout(()=>document.getElementById('free-user-note-v2')?.focus(),40); } },[open]);
  if(!open)return null;
  const [label]=freeUserEstadoMetaF984(estado);
  return <div role="dialog" aria-modal="true" aria-labelledby="free-user-note-title" style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(8,28,56,.42)',display:'grid',placeItems:'center',padding:18}}>
    <div className="card" style={{width:'min(560px,100%)',padding:20,boxShadow:'0 24px 70px rgba(0,0,0,.28)'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}}><div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',color:'var(--an-granate)'}}>CENTRO DE GESTIONES</div><h3 id="free-user-note-title" style={{margin:'4px 0 3px',fontFamily:'var(--f-serif)',fontSize:25}}>Marcar como {label}</h3><p style={{margin:0,fontSize:12.5,color:'var(--ink-3)'}}>Prospecto: {nombre||'Usuario gratis'}</p></div><button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cerrar</button></div>
      <label style={{display:'block',marginTop:14,fontSize:11,fontWeight:850,color:'var(--ink-2)'}}>Nota interna / respuesta</label>
      <textarea id="free-user-note-v2" rows="5" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Ej.: Se llamó por WhatsApp, interesado en continuar matrícula. Pendiente validar horario." style={{width:'100%',marginTop:6,border:'1px solid var(--line)',borderRadius:12,padding:12,fontFamily:'inherit',resize:'vertical'}} />
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14,flexWrap:'wrap'}}><button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button><button type="button" className="btn btn-primary" onClick={()=>onSubmit(nota)} disabled={busy}>{busy?'Guardando…':'Guardar gestión'}</button></div>
    </div>
  </div>;
}

function FreeUserSolicitudesAdminF984(){
  const [rows,setRows]=React.useState([]),[loading,setLoading]=React.useState(true),[error,setError]=React.useState(''),[busy,setBusy]=React.useState('');
  const [estado,setEstado]=React.useState('PENDIENTE');
  const [counts,setCounts]=React.useState({});
  const [modal,setModal]=React.useState(null);
  const estados=['PENDIENTE','EN_GESTION','RESPONDIDA','CONVERTIDA','CERRADA'];
  const load=React.useCallback(()=>{setLoading(true);setError('');f92Post('freeUserListarSolicitudes',{estado,limit:200}).then(r=>{setRows(r.items||[]);setCounts(r.counts||{});}).catch(e=>setError(f92SafeUserError(e,'No se pudieron cargar las solicitudes de contacto.','freeUserListarSolicitudes'))).finally(()=>setLoading(false));},[estado]);
  React.useEffect(()=>{load();},[load]);
  const resolver=async(r,estadoFinal,nota)=>{setBusy(r.ID||'busy');try{await f92Post('freeUserResolverSolicitud',{id:r.ID,estado:estadoFinal,respuesta:nota||'',responsable:''});try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }setModal(null);await load();}catch(e){setError(f92SafeUserError(e,'No se pudo actualizar la solicitud de contacto.','freeUserResolverSolicitud'));}finally{setBusy('');}};
  const quick=(r,estadoFinal)=>{const defaults={EN_GESTION:'Solicitud tomada en gestión. Pendiente contactar al prospecto.',RESPONDIDA:'Se contactó al prospecto y se brindó seguimiento.',CONVERTIDA:'Prospecto convertido a proceso de matrícula.',CERRADA:'Gestión cerrada.'};resolver(r,estadoFinal,defaults[estadoFinal]||'');};
  const openWa=(r)=>{const tel=String(r.TELEFONO||'').replace(/[^0-9]/g,''); if(!tel){alert('Este prospecto no tiene teléfono registrado.');return;} const phone=tel.length===8?'506'+tel:tel; const msg=`Hola ${String(r.NOMBRE||'').split(' ')[0]||''}, soy de Academia Norteamericana. Vimos tu solicitud desde el Campus y queremos ayudarte a continuar tu matrícula.`; window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,'_blank','noopener,noreferrer');};
  const mail=(r)=>{if(!r.CORREO){alert('Este prospecto no tiene correo registrado.');return;} const subject='Academia Norteamericana · Continuación de matrícula'; const body=`Hola ${r.NOMBRE||''},\n\nVimos tu solicitud desde el Campus. Queremos ayudarte a continuar con tu matrícula y activar tu acceso completo.\n\nSaludos,\nAcademia Norteamericana`; window.location.href=`mailto:${r.CORREO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;};
  const Stat=({id,label,color})=><button type="button" onClick={()=>setEstado(id)} style={{border:estado===id?'2px solid '+color:'1px solid var(--line)',background:'#fff',borderRadius:14,padding:'12px 14px',textAlign:'left',minWidth:138,boxShadow:estado===id?'0 14px 30px rgba(8,28,56,.10)':'none'}}><span style={{display:'block',fontSize:10,fontWeight:900,letterSpacing:'.12em',color:'var(--ink-3)'}}>{label}</span><strong style={{fontSize:25,color}}>{Number(counts?.[id]||0)}</strong></button>;
  return <div>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
      <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.14em',color:'var(--an-granate)'}}>USUARIO GRATIS SIN REGISTRO</div><h2 style={{margin:'4px 0',fontFamily:'var(--f-serif)'}}>Solicitudes de contacto</h2><p style={{margin:0,fontSize:12.5,color:'var(--ink-3)'}}>Bandeja comercial para prospectos que entraron al Campus sin matrícula activa.</p></div>
      <button type="button" className="btn btn-ghost" onClick={load} disabled={loading}>Actualizar</button>
    </div>
    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:14}}><Stat id="PENDIENTE" label="Sin contestar" color="#991B1B"/><Stat id="EN_GESTION" label="En gestión" color="#8A5A00"/><Stat id="RESPONDIDA" label="Respondidas" color="#166534"/><Stat id="CONVERTIDA" label="Convertidas" color="#0C4F86"/><Stat id="CERRADA" label="Cerradas" color="#40516A"/></div>
    {error&&<div style={{padding:12,background:'#FDECEA',color:'#991B1B',borderRadius:10,marginBottom:10}}>{error}</div>}
    {loading?<div className="card" style={{padding:20}}>Cargando usuarios gratis…</div>:!rows.length?<div className="card" style={{textAlign:'center',padding:34}}>No hay solicitudes en este estado.</div>:<div style={{display:'flex',flexDirection:'column',gap:10}}>{rows.map(r=>{const st=String(r.ESTADO||'PENDIENTE').toUpperCase();const [,fg,bg,desc]=freeUserEstadoMetaF984(st);return <div className="card" key={r.ID} style={{padding:16,border:st==='PENDIENTE'?'2px solid #DA291C':'1px solid var(--line)'}}>
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:12,alignItems:'start'}}>
        <div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><b style={{fontSize:15}}>{r.NOMBRE||'Prospecto'}</b><span style={{fontFamily:'var(--f-mono)',fontSize:10,color:'var(--ink-3)'}}>{r.CEDULA||'sin cédula'}</span>{st==='PENDIENTE'&&<span style={{padding:'3px 8px',borderRadius:999,background:'#FDECEA',color:'#991B1B',fontSize:10,fontWeight:900}}>SIN CONTESTAR</span>}</div><div style={{fontSize:11.5,color:'var(--ink-3)',marginTop:4}}>{r.CORREO||'sin correo'} · {r.TELEFONO||'sin teléfono'} · Etapa: {r.PROSPECTO_ETAPA||'Lead'} · Responsable: {r.RESPONSABLE||r.ATENDIDO_POR||'—'}</div></div>
        <FreeUserEstadoPillF984 estado={st}/>
      </div>
      <div style={{marginTop:10,padding:11,borderRadius:12,background:'#F8FAFE',fontSize:12.5,lineHeight:1.55}}><b>Mensaje:</b> {r.MENSAJE||'—'}<div style={{marginTop:6,display:'inline-flex',padding:'4px 8px',borderRadius:999,background:bg,color:fg,fontSize:10,fontWeight:900}}>{desc}</div>{(r.ULTIMA_NOTA||r.RESPUESTA)&&<div style={{marginTop:8,color:'#166534'}}><b>Última nota:</b> {r.ULTIMA_NOTA||r.RESPUESTA}</div>}{r.HISTORIAL&&<details style={{marginTop:8}}><summary style={{cursor:'pointer',fontWeight:850}}>Ver historial</summary><pre style={{whiteSpace:'pre-wrap',fontFamily:'var(--f-mono)',fontSize:11,background:'#fff',border:'1px solid var(--line)',borderRadius:10,padding:10,marginTop:7}}>{r.HISTORIAL}</pre></details>}</div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:7,marginTop:10,flexWrap:'wrap'}}><button type="button" className="btn btn-ghost" disabled={!!busy} onClick={()=>openWa(r)}>WhatsApp</button><button type="button" className="btn btn-ghost" disabled={!!busy} onClick={()=>mail(r)}>Correo</button>{st==='PENDIENTE'&&<button type="button" className="btn btn-primary" disabled={!!busy} onClick={()=>quick(r,'EN_GESTION')}>Tomar gestión</button>}{['PENDIENTE','EN_GESTION'].includes(st)&&<button type="button" className="btn btn-primary" disabled={!!busy} onClick={()=>setModal({row:r,estado:'RESPONDIDA'})}>Marcar respondida</button>}{['PENDIENTE','EN_GESTION','RESPONDIDA'].includes(st)&&<button type="button" className="btn btn-ghost" disabled={!!busy} onClick={()=>setModal({row:r,estado:'CONVERTIDA'})}>Convertida</button>}{st!=='CERRADA'&&<button type="button" className="btn btn-ghost" disabled={!!busy} onClick={()=>setModal({row:r,estado:'CERRADA'})}>Cerrar</button>}</div>
    </div>})}</div>}
    <FreeUserActionNoteF984 open={!!modal} estado={modal?.estado} nombre={modal?.row?.NOMBRE} busy={!!busy} onClose={()=>setModal(null)} onSubmit={(nota)=>resolver(modal.row,modal.estado,nota)} />
  </div>;
}

function SolicitudesUnificadasView({ onNavigate }){
  const [tab,setTab]=React.useState('MATRICULAS');
  const [freeCount,setFreeCount]=React.useState(0);
  React.useEffect(()=>{let cancel=false;f92Post('freeUserListarSolicitudes',{estado:'PENDIENTE',limit:1}).then(r=>{if(!cancel)setFreeCount(r.pendientes??r.counts?.PENDIENTE??r.total??0);}).catch(()=>{});return()=>{cancel=true};},[]);
  const tabs=[['GRATIS','Usuario gratis',freeCount],['MATRICULAS','Matrículas'],['CUOTAS','Cuotas'],['EXAMENES','Exámenes'],['CAMBIOS','Cambios de clase · Docente']];
  return <div data-screen-label="Admin · Solicitudes" style={{padding:'28px 32px 60px',maxWidth:1280,margin:'0 auto'}}>
    <div style={{fontSize:10,fontWeight:900,letterSpacing:'.15em',color:'var(--an-granate)'}}>CENTRO DE GESTIONES</div><h1 style={{fontFamily:'var(--f-serif)',fontSize:35,margin:'4px 0 5px'}}>Solicitudes</h1><p style={{margin:'0 0 18px',fontSize:13,color:'var(--ink-3)'}}>Una sola bandeja, separada por tipo y responsable.</p>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:18,padding:4,border:'1px solid var(--line)',borderRadius:12,background:'#fff'}}>{tabs.map(([id,label,badge])=><button key={id} type="button" className={tab===id?'btn btn-primary':'btn btn-ghost'} onClick={()=>setTab(id)}>{label}{badge? <span style={{marginLeft:7,padding:'2px 7px',borderRadius:999,background:'#DA291C',color:'#fff',fontSize:10,fontWeight:900}}>{badge}</span>:null}</button>)}</div>
    {tab==='GRATIS'&&<FreeUserSolicitudesAdminF984 />}
    {tab==='MATRICULAS'&&<SolicitudesPagoView onNavigate={onNavigate} categoria="MATRICULA" embedded />}
    {tab==='CUOTAS'&&<SolicitudesPagoView onNavigate={onNavigate} categoria="CUOTAS" embedded />}
    {tab==='EXAMENES'&&<ReposicionesAdminSolicitudesF92 />}
    {tab==='CAMBIOS'&&<PanelSuspensiones embedded />}
  </div>;
}

Object.assign(window,{ReposicionStudentCardF92,SolicitudesEstudianteView,ReposicionesAdminSolicitudesF92,FreeUserSolicitudesAdminF984,SolicitudesUnificadasView});
