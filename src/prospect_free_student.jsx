/* global React */
// F98.4-Z6-PLAY1 · Portal de espera para usuario gratis sin matrícula.
// No muestra grupo ni nivel oficial; permite solicitar contacto y entrar a Academia Play demo.

function freeStudentToken(){ try{return (window.getSesion&&window.getSesion()||{}).token||'';}catch(_){return'';} }
async function freeStudentPost(fn,payload={}){
  const token=freeStudentToken();
  const res=await fetch(window.APPS_SCRIPT_URL,{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({fn,token,...payload}),
  });
  const json=await res.json();
  if(!json?.ok) throw new Error(json?.mensaje||json?.error||'No se pudo completar la solicitud.');
  return json;
}
function freeStudentFmtDate(v){
  if(!v)return '—';
  const d=v instanceof Date?v:new Date(String(v).slice(0,10)+'T12:00:00');
  return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString('es-CR',{day:'2-digit',month:'long',year:'numeric'});
}
function FreeStatusPill({estado}){
  const k=String(estado||'PENDIENTE').toUpperCase();
  const map={PENDIENTE:['Pendiente','#991B1B','#FDECEA'],RESPONDIDA:['Respondida','#166534','#EAF8EF'],CERRADA:['Cerrada','#40516A','#EEF2F7'],DESCARTADA:['Descartada','#5F6875','#EEF2F7']};
  const [label,fg,bg]=map[k]||[k,'#40516A','#EEF2F7'];
  return <span className="free-status" style={{background:bg,color:fg}}>{label}</span>;
}
function FreeProspectPortal({ usuario, onNavigate }){
  const [perfil,setPerfil]=React.useState(null);
  const [solicitudes,setSolicitudes]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const [ok,setOk]=React.useState('');
  const [mensaje,setMensaje]=React.useState('Quiero que me contacten para continuar mi matrícula y activar mi programa.');
  const [busy,setBusy]=React.useState(false);
  const load=React.useCallback(()=>{
    setLoading(true);setError('');
    freeStudentPost('freeUserMiPerfil')
      .then(r=>{setPerfil(r.perfil||{});setSolicitudes(r.solicitudes||[]);})
      .catch(e=>{setError(e.message);setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||'Lead'});})
      .finally(()=>setLoading(false));
  },[usuario]);
  React.useEffect(()=>{load();},[load]);
  const enviar=async()=>{
    setBusy(true);setError('');setOk('');
    try{
      const r=await freeStudentPost('freeUserCrearSolicitud',{tipo:'QUIERO_MATRICULARME',mensaje});
      setOk(r.mensaje||'Solicitud enviada.');
      await load();
      try{window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'));}catch(_){ }
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const p=perfil||{};
  const pendientes=solicitudes.filter(s=>String(s.ESTADO||'').toUpperCase()==='PENDIENTE');
  return <div className="free-campus" data-screen-label="Usuario gratis · Perfil de espera">
    <section className="free-hero">
      <div>
        <span className="free-kicker">ACCESO GRATIS · PREMATRÍCULA</span>
        <h1>Hola, {(p.nombre||usuario?.nombre||'estudiante').split(' ')[0]}</h1>
        <p>Ya podés entrar al Campus con la contraseña que escogiste en el formulario. Este perfil todavía no tiene grupo, nivel ni matrícula activa.</p>
        <div className="free-actions">
          <button type="button" className="btn btn-primary" onClick={()=>onNavigate&&onNavigate('academia_play')}>Entrar a Academia Play</button>
          <button type="button" className="btn btn-ghost" onClick={()=>document.getElementById('free-request-box')?.scrollIntoView({behavior:'smooth',block:'center'})}>Solicitar contacto</button>
        </div>
      </div>
      <div className="free-hero-card">
        <span>Estado actual</span>
        <strong>{p.etapa||usuario?.etapa||'Lead'}</strong>
        <small>Sin matrícula activa · sin datos de grupo</small>
      </div>
    </section>

    {error&&<div className="free-alert error">{error}</div>}
    {ok&&<div className="free-alert ok">{ok}</div>}

    <section className="free-grid">
      <article className="free-card">
        <div className="free-card-head"><span>Perfil</span><b>Datos del formulario</b></div>
        {loading?<p>Consultando perfil…</p>:<div className="free-data-list">
          <div><span>Nombre</span><strong>{p.nombre||usuario?.nombre||'—'}</strong></div>
          <div><span>Cédula</span><strong>{p.cedula||usuario?.cedula||'—'}</strong></div>
          <div><span>Correo</span><strong>{p.correo||usuario?.correo||'—'}</strong></div>
          <div><span>Teléfono</span><strong>{p.telefono||usuario?.telefono||'—'}</strong></div>
          <div><span>Programa de interés</span><strong>{p.programa||usuario?.programa||'Pendiente'}</strong></div>
        </div>}
        <p className="free-note">Los datos académicos oficiales aparecerán cuando admisiones complete la matrícula y se genere el código de estudiante.</p>
      </article>

      <article className="free-card" id="free-request-box">
        <div className="free-card-head"><span>Centro de gestiones</span><b>Enviar solicitud</b></div>
        <p className="free-copy">Usá este botón para avisar a ventas/admisiones que querés continuar. La solicitud aparece en el Centro de gestiones con contador rojo.</p>
        <textarea value={mensaje} onChange={e=>setMensaje(e.target.value)} rows="5" maxLength="700" aria-label="Mensaje para admisiones" />
        <button type="button" className="btn btn-primary" disabled={busy||!mensaje.trim()} onClick={enviar}>{busy?'Enviando…':'Enviar solicitud'}</button>
        {pendientes.length>0&&<div className="free-pending"><span />Ya tenés {pendientes.length} solicitud{pendientes.length===1?'':'es'} pendiente{pendientes.length===1?'':'s'}.</div>}
      </article>
    </section>

    <section className="free-card free-wide">
      <div className="free-card-head"><span>Historial</span><b>Solicitudes enviadas</b></div>
      {!solicitudes.length?<div className="free-empty">Todavía no has enviado solicitudes.</div>:<div className="free-requests">
        {solicitudes.map(s=><div className="free-request-row" key={s.ID}>
          <div><strong>{s.TIPO||'Solicitud'}</strong><small>{freeStudentFmtDate(s.FECHA_ISO||s.FECHA)} · {s.MENSAJE||''}</small>{s.RESPUESTA&&<em>Respuesta: {s.RESPUESTA}</em>}</div>
          <FreeStatusPill estado={s.ESTADO}/>
        </div>)}
      </div>}
    </section>

    <section className="free-play-callout">
      <div><span>ACADEMIA PLAY</span><h2>Practicá vocabulario mientras esperás</h2><p>Acceso demo a las primeras prácticas. No afecta notas oficiales y no requiere grupo asignado.</p></div>
      <button type="button" className="btn btn-primary" onClick={()=>onNavigate&&onNavigate('academia_play')}>Abrir juegos</button>
    </section>
  </div>;
}
window.FreeProspectPortal=FreeProspectPortal;
