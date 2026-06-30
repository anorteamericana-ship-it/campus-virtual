/* global React, CronogramaGrupo, AdminEstudiantesView */
// F98.4-Z6-AN · Calendario académico limpio
// - La Consulta individual se trasladó al menú principal.
// - Esta pantalla carga únicamente el calendario de grupos.
// - La vista de estudiantes se abre bajo demanda para no bloquear la primera pintura.

function CalendarioGrupoOperativo({ rol = 'superadmin', onNavigate }) {
  const [grupoSeleccionado,setGrupoSeleccionado] = React.useState(null);
  const [mostrarEstudiantes,setMostrarEstudiantes] = React.useState(false);

  const irAuditoria = React.useCallback(() => {
    if (onNavigate) onNavigate('auditoria_academica');
  },[onNavigate]);

  const scrollGrupo = React.useCallback((behavior='smooth') => {
    const mover=()=>{
      const el=document.getElementById('calgrupo-estudiantes-panel');
      if(el?.scrollIntoView)el.scrollIntoView({behavior,block:'start'});
    };
    requestAnimationFrame(()=>requestAnimationFrame(mover));
    setTimeout(mover,180);
  },[]);

  React.useEffect(()=>{
    if(grupoSeleccionado&&mostrarEstudiantes)scrollGrupo('smooth');
  },[grupoSeleccionado,mostrarEstudiantes,scrollGrupo]);

  const handleNavigateFromCronograma = React.useCallback((target,opts={})=>{
    if(target==='estudiantes'&&opts?.grupo){
      setGrupoSeleccionado(opts.grupo);
      setMostrarEstudiantes(true);
      return;
    }
    if(onNavigate)onNavigate(target,opts);
  },[onNavigate]);

  return (
    <section data-screen-label="Calendario académico" style={{padding:24}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:18,marginBottom:18,flexWrap:'wrap'}}>
        <div style={{minWidth:260}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.22em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:6}}>
            Gestión académica
          </div>
          <h1 style={{fontFamily:'var(--f-serif)',fontWeight:500,letterSpacing:'-0.03em',fontSize:36,lineHeight:1.05,margin:'0 0 6px',color:'var(--ink)'}}>
            Calendario académico
          </h1>
          <div style={{fontSize:13.5,color:'var(--ink-2)',lineHeight:1.5,maxWidth:820}}>
            Consultá todos los grupos, lecciones, aperturas y fechas académicas. La consulta individual ahora está separada para que esta pantalla cargue más rápido.
          </div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          {grupoSeleccionado&&<div style={{padding:'8px 12px',borderRadius:'var(--r-pill)',background:'color-mix(in srgb, var(--an-navy) 9%, white)',border:'1px solid color-mix(in srgb, var(--an-navy) 18%, white)',color:'var(--an-navy-ink)',fontSize:12,fontWeight:800,fontFamily:'var(--f-mono)'}}>Grupo activo · {grupoSeleccionado}</div>}
          <button type="button" onClick={irAuditoria} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'9px 14px',borderRadius:'var(--r-md)',border:'1px solid var(--line)',background:'var(--surface)',color:'var(--ink-2)',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
            <IconMiniAudit /> Abrir Auditoría Académica
          </button>
        </div>
      </div>

      <div style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',boxShadow:'var(--sh-1)',overflow:'hidden',marginBottom:22}}>
        <div style={{padding:'12px 16px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',background:'linear-gradient(180deg,#fff,var(--surface-2))'}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--ink-3)'}}>Calendario de grupos</div>
            <div style={{fontSize:13,color:'var(--ink-2)',marginTop:2}}>Una sola carga inicial; las lecciones ya vienen integradas en la respuesta del calendario.</div>
          </div>
          <div style={{fontSize:11,color:'var(--ink-3)',fontWeight:700}}>Tocá una lección para revisar su detalle o abrir el grupo.</div>
        </div>
        <div style={{padding:14}}>
          <CronogramaGrupo rol={rol} onNavigate={handleNavigateFromCronograma} />
        </div>
      </div>

      <div id="calgrupo-estudiantes-panel" style={{background:'var(--surface)',border:'1px solid var(--line)',borderRadius:'var(--r-lg)',boxShadow:'var(--sh-1)',overflow:'visible'}}>
        <div style={{padding:'14px 18px',borderBottom:'1px solid var(--line)',background:grupoSeleccionado?'linear-gradient(135deg,var(--an-navy),#123A73)':'linear-gradient(180deg,#fff,var(--surface-2))',color:grupoSeleccionado?'white':'var(--ink)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:14,flexWrap:'wrap',borderRadius:'var(--r-lg) var(--r-lg) 0 0'}}>
          <div>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:'0.16em',textTransform:'uppercase',color:grupoSeleccionado?'rgba(255,255,255,.78)':'var(--ink-3)'}}>Estudiantes del grupo</div>
            <div style={{fontFamily:'var(--f-serif)',fontSize:22,fontWeight:500,letterSpacing:'-0.02em',marginTop:2}}>{grupoSeleccionado||'Seleccioná un grupo desde el calendario'}</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {grupoSeleccionado&&<button type="button" onClick={()=>setMostrarEstudiantes(v=>!v)} style={{padding:'8px 12px',borderRadius:'var(--r-md)',border:'1px solid rgba(255,255,255,.35)',background:'rgba(255,255,255,.10)',color:'white',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{mostrarEstudiantes?'Ocultar estudiantes':'Mostrar estudiantes'}</button>}
            <button type="button" onClick={irAuditoria} style={{padding:'8px 12px',borderRadius:'var(--r-md)',border:grupoSeleccionado?'1px solid rgba(255,255,255,.35)':'1px solid var(--line)',background:grupoSeleccionado?'rgba(255,255,255,.10)':'var(--surface)',color:grupoSeleccionado?'white':'var(--ink-2)',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>Auditoría</button>
          </div>
        </div>

        {!grupoSeleccionado?(
          <div style={{padding:'34px 24px',textAlign:'center',color:'var(--ink-3)'}}>
            <div style={{fontSize:30,marginBottom:8,opacity:.55}}>🗓️</div>
            <div style={{fontSize:16,fontWeight:700,color:'var(--ink)',marginBottom:4}}>Seleccioná un grupo</div>
            <div style={{fontSize:13,lineHeight:1.5}}>Abrí una clase y usá <strong>Ver estudiantes de este grupo</strong> para cargar la vista académica.</div>
          </div>
        ):mostrarEstudiantes?(
          <div style={{background:'var(--bg)',borderTop:'1px solid var(--line)'}}>
            <AdminEstudiantesView key={`calgrupo-${grupoSeleccionado}`} onNavigate={onNavigate} grupoInicial={grupoSeleccionado} modo="calgrupo" />
          </div>
        ):(
          <div style={{padding:'22px 24px',color:'var(--ink-2)',fontSize:13,lineHeight:1.55}}>Grupo listo. Usá <strong>Mostrar estudiantes</strong> para cargar la vista únicamente cuando la necesités.</div>
        )}
      </div>
    </section>
  );
}

function IconMiniAudit(){
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/><path d="M9 9h1"/></svg>;
}

Object.assign(window,{CalendarioGrupoOperativo});
