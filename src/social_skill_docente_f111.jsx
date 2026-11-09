// F111 N6 — Social Skill docente /10. Solo usa el flujo oficial existente N2.
// No inventa calificaciones, ni modifica asistencia, N CONAPE u orales históricos.
async function socialSkillPostF111(fn, data) {
  const token = typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  if (!token) return { ok:false, error:'sesion_invalida' };
  const base = window.APPS_SCRIPT_URL;
  if (!base) return { ok:false, error:'backend_no_disponible' };
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), 35000) : null;
  try {
    const response = await fetch(`${base}?fn=${encodeURIComponent(fn)}`, {
      method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({fn, token, ...data}), signal:controller?.signal
    });
    const raw = await response.text();
    let body;
    try { body = JSON.parse(raw); } catch(_) { return {ok:false,error:'respuesta_invalida'}; }
    return response.ok && body && typeof body === 'object'
      ? body : {ok:false,error:'servicio_no_disponible'};
  } catch (_) { return {ok:false,error:'red_o_tiempo_agotado'}; }
  finally { if(timeout) clearTimeout(timeout); }
}
function socialSkillSafeUserErrorF111(code) {
  const map = {
    social_esquema_no_preparado:'Administración debe habilitar primero el registro Social Skill.',
    nota_social_ya_oficial:'La calificación oficial ya existe. No se puede reemplazar desde este formulario.',
    social_ya_cerrada_o_pendiente:'Hay una publicación o conciliación pendiente. Consultá a Administración.',
    conciliacion_superadmin_requerida:'Registro pendiente de conciliación por superadmin. No reenviés la nota.',
    publicacion_pendiente_conciliacion:'Guardado incierto. Administración debe conciliar antes de continuar.',
    readback_inconsistente_conciliar:'La comprobación oficial no coincidió. Requiere conciliación.',
    borrador_modificado_recargar:'El borrador cambió. Volvé a consultar el estudiante antes de publicar.',
    sesion_invalida:'Tu sesión expiró. Ingresá nuevamente.',
    docente_sin_permiso_grupo:'No tenés permiso para calificar este grupo.',
    estatus_no_evaluable:'Esta matrícula no permite evaluación (solo CA/APR).',
    nota_social_ya_oficial:'Ya hay una nota oficial. No se permite duplicarla.',
  };
  return map[code] || 'No se pudo completar la operación. Revisá el estado antes de reintentar.';
}
function socialSkillPuntosValidosF111(value) {
  const raw=String(value??'').trim();
  return /^(?:\d{1,2}(?:\.\d{1,2})?|\.\d{1,2})$/.test(raw)
    && Number(raw)>=0 && Number(raw)<=10;
}
function SocialSkillDocenteF111({calendario,pendientes}) {
  const [abierto,setAbierto] = React.useState(false);
  const grupos = React.useMemo(() => {
    const map=new Map();
    const listas=[calendario?.programadas,calendario?.cerradas,calendario?.historico,pendientes?.sin_cerrar];
    listas.forEach(list => (list||[]).forEach(l => {
      const grupo=String(l.cod_grupo||l.grupo||'').trim();
      const nivel=String(l.nivel||'').trim().toUpperCase();
      if(grupo && ['B1','B2','I1','I2'].includes(nivel))
        map.set(grupo+'|'+nivel,{grupo,nivel});
    }));
    return [...map.values()].sort((a,b)=>(a.grupo+a.nivel).localeCompare(b.grupo+b.nivel));
  },[calendario,pendientes]);
  const [grupoKey,setGrupoKey]=React.useState('');
  const [roster,setRoster]=React.useState(null);
  const [codigo,setCodigo]=React.useState('');
  const [registro,setRegistro]=React.useState(null);
  const [puntos,setPuntos]=React.useState('');
  const [comentario,setComentario]=React.useState('');
  const [dirty,setDirty]=React.useState(false);
  const [busy,setBusy]=React.useState(false);
  const [mensaje,setMensaje]=React.useState('');
  const requestRef=React.useRef('');
  const selected=grupos.find(g=>g.grupo+'|'+g.nivel===grupoKey);
  const alumno=(roster||[]).find(e=>String(e.code||e.codigo)===codigo);
  const readonly = registro?.estado==='CONFIRMADA' || registro?.estado==='PREPARADA';
  const saved = registro?.estado==='BORRADOR' && Boolean(registro?.borrador?.event_id);
  const official = registro?.nota_oficial!==null && registro?.nota_oficial!==undefined;

  const loadRoster=async() => {
    if(!selected || busy)return;
    setBusy(true);setMensaje('');setRegistro(null);setCodigo('');setRoster(null);requestRef.current='';
    try {
      const data=await fetchEstudiantesParaCierre(selected.grupo,selected.nivel);
      if(!data?.ok)throw Error('roster_no_disponible');
      const allowed=(data.estudiantes||[]).filter(e=>['CA','APR'].includes(String(e.estatus||'').toUpperCase()));
      setRoster(allowed);
      if(!allowed.length)setMensaje('Este grupo no tiene matrículas CA/APR elegibles.');
    }catch(_){setMensaje('No se pudo cargar el padrón del grupo.');}
    finally{setBusy(false);}
  };
  const selectStudent=async(nextCode) => {
    if(busy)return;
    if(dirty && !window.confirm('Tenés cambios sin guardar. ¿Descartarlos?'))return;
    setCodigo(nextCode);setRegistro(null);setPuntos('');setComentario('');setDirty(false);
    setMensaje('');requestRef.current='';
    if(!selected||!nextCode)return;
    setBusy(true);
    const r=await socialSkillPostF111('socialSkillConsultarF111',{
      cod_grupo:selected.grupo,nivel:selected.nivel,cod_estudiante:nextCode
    });
    if(r.ok){
      setRegistro(r);
      if(r.borrador){setPuntos(String(r.borrador.puntos));setComentario(r.borrador.comentario||'');}
      else if(r.nota_oficial!==null && r.nota_oficial!==undefined)setPuntos(String(r.nota_oficial));
      if(!r.esquema_preparado && r.estado!=='CONFIRMADA')
        setMensaje('El registro Social Skill todavía no fue habilitado por superadmin.');
    }else setMensaje(socialSkillSafeUserErrorF111(r.error));
    setBusy(false);
  };
  const saveDraft=async() => {
    if(busy || !selected || !codigo || readonly)return;
    if(!socialSkillPuntosValidosF111(puntos)){setMensaje('Ingresá un puntaje entre 0 y 10, con máximo dos decimales.');return;}
    setBusy(true);setMensaje('');
    const r=await socialSkillPostF111('socialSkillGuardarBorradorF111',{
      cod_grupo:selected.grupo,nivel:selected.nivel,cod_estudiante:codigo,
      puntos:Number(puntos),comentario:comentario.trim()
    });
    if(r.ok && r.event_id){
      setRegistro(prev=>({...prev,estado:'BORRADOR',borrador:{event_id:r.event_id,puntos:Number(puntos),comentario:comentario.trim()}}));
      setDirty(false);requestRef.current='';
      setMensaje('Borrador guardado y confirmado por el servidor. Todavía no es nota oficial.');
    }else setMensaje(socialSkillSafeUserErrorF111(r.error));
    setBusy(false);
  };
  const publish=async() => {
    if(busy||!selected||!codigo||readonly||!saved||dirty)return;
    if(!window.confirm('¿Confirmar la nota Social Skill como OFICIAL? Esta operación no se puede deshacer desde el docente.'))return;
    if(!requestRef.current)requestRef.current='SOCIAL-'+(window.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    setBusy(true);setMensaje('');
    const r=await socialSkillPostF111('socialSkillPublicarF111',{
      cod_grupo:selected.grupo,nivel:selected.nivel,cod_estudiante:codigo,
      borrador_event_id:registro.borrador.event_id,
      confirmar:true,request_id:requestRef.current
    });
    if(r.ok && r.estado==='CONFIRMADA'){
      setRegistro(prev=>({...prev,estado:'CONFIRMADA',nota_oficial:r.puntos,borrador:null}));
      setMensaje('Nota Social Skill confirmada oficialmente. Se preservó la nota CONAPE.');
      setDirty(false);requestRef.current='';
    }else{
      setMensaje(socialSkillSafeUserErrorF111(r.error));
      // Después de un timeout o estado parcial, NO disparar segunda escritura a ciegas.
      if(['red_o_tiempo_agotado','publicacion_pendiente_conciliacion','conciliacion_superadmin_requerida'].includes(r.error))
        setRegistro(prev=>({...prev,estado:'PREPARADA'}));
    }
    setBusy(false);
  };
  const card={border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:16,background:'var(--surface)',marginBottom:16};
  const control={padding:'9px 10px',border:'1px solid var(--line-2)',borderRadius:8,width:'100%',background:'var(--surface)',font:'inherit',boxSizing:'border-box'};
  return <section style={card} aria-label="Evaluación Social Skill">
    <button type="button" onClick={()=>setAbierto(v=>!v)} style={{width:'100%',border:0,background:'transparent',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left',color:'var(--ink)',font:'inherit'}}>
      <span><strong>Social Skill · 10 puntos</strong><span style={{display:'block',fontSize:12,color:'var(--ink-3)',marginTop:3}}>Borrador y nota oficial por estudiante · INA y SIN INA</span></span>
      <span aria-hidden="true">{abierto?'−':'+'}</span>
    </button>
    {abierto && <div style={{marginTop:14,borderTop:'1px solid var(--line)',paddingTop:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:10}}>
        <label style={{fontSize:12,fontWeight:600}}>Grupo y nivel
          <select style={{...control,marginTop:5}} value={grupoKey} disabled={busy}
            onChange={e=>{setGrupoKey(e.target.value);setRoster(null);setCodigo('');setRegistro(null);setMensaje('');setDirty(false);requestRef.current='';}}>
            <option value="">Seleccioná grupo / nivel</option>
            {grupos.map(g=><option key={g.grupo+'|'+g.nivel} value={g.grupo+'|'+g.nivel}>{g.grupo} · {g.nivel}</option>)}
          </select>
        </label>
        <div style={{display:'flex',alignItems:'end'}}><button type="button" className="btn btn-ghost" disabled={!selected||busy} onClick={loadRoster}>Cargar estudiantes</button></div>
      </div>
      {!grupos.length && <p style={{fontSize:12,color:'var(--ink-3)'}}>No hay grupos asignados con nivel confirmado en el calendario docente.</p>}
      {roster && <label style={{display:'block',fontSize:12,fontWeight:600,marginTop:12}}>Estudiante CA/APR
        <select style={{...control,marginTop:5}} value={codigo} disabled={busy} onChange={e=>selectStudent(e.target.value)}>
          <option value="">Seleccioná estudiante</option>
          {roster.map(e=><option key={e.code||e.codigo} value={e.code||e.codigo}>{e.name||e.nombre||e.code} · {e.estatus}</option>)}
        </select>
      </label>}
      {registro && alumno && <div style={{marginTop:14,display:'grid',gap:10}}>
        <div style={{fontSize:12}}>Estado servidor: <strong>{registro.estado}</strong>
          {official && <span style={{marginLeft:9}}>Nota oficial: <strong>{registro.nota_oficial}/10</strong></span>}
          {!registro.esquema_preparado && <span style={{display:'block',color:'#A25A00'}}>Pendiente preparación del registro por superadmin.</span>}
        </div>
        <label style={{fontSize:12,fontWeight:600}}>Puntaje /10
          <input style={{...control,marginTop:5,maxWidth:160}} inputMode="decimal" value={puntos} disabled={busy||readonly||!registro.esquema_preparado} onChange={e=>{setPuntos(e.target.value);setDirty(true);}} placeholder="0 a 10"/>
        </label>
        <label style={{fontSize:12,fontWeight:600}}>Comentario docente
          <textarea style={{...control,marginTop:5}} rows={3} maxLength={1000} value={comentario} disabled={busy||readonly||!registro.esquema_preparado} onChange={e=>{setComentario(e.target.value);setDirty(true);}} placeholder="Observación individual (opcional)"/>
        </label>
        <div style={{display:'flex',gap:9,flexWrap:'wrap'}}>
          <button type="button" className="btn btn-ghost" disabled={busy||readonly||!registro.esquema_preparado} onClick={saveDraft}>Guardar borrador</button>
          <button type="button" className="btn btn-primary" disabled={busy||readonly||!saved||dirty||!registro.esquema_preparado} onClick={publish}>Confirmar nota oficial</button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={()=>selectStudent(codigo)}>Consultar estado</button>
        </div>
        {dirty && <span style={{fontSize:12,color:'#A25A00'}}>Cambios sin guardar: primero guardá el borrador.</span>}
      </div>}
      {mensaje && <p role="status" aria-live="polite" style={{fontSize:12,marginTop:12,color:'var(--ink-2)'}}>{mensaje}</p>}
      {busy && <p aria-live="polite" style={{fontSize:12,color:'var(--ink-3)'}}>Consultando servidor…</p>}
    </div>}
  </section>;
}
window.SocialSkillDocenteF111=SocialSkillDocenteF111;
