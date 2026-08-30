// F98.4-Z6-CS21A120 · Menú estudiante con diseño docente y rutas académicas reales.
/* global React, ReactDOM, Sidebar, Icon */
(function(){
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A120';
  const CUSTOM_ROUTES = new Set([
    'perfil_estudiante',
    'info_programa',
    'resumen_academico',
    'syllabus_estudiante',
    'planeamiento_estudiante',
    'plan_estudio_estudiante',
    'cronograma_general_estudiante',
    'libros_audios_estudiante',
    'recursos_adicionales',
  ]);
  const LEVEL_NAMES = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
  const BOOK_NAMES = { B1:'Interchange Intro', B2:'Interchange 1', I1:'Interchange 2', I2:'Interchange 3' };
  const PLAN_DOCS = {
    B1:'1yTq26DzSwAwajHqH_I8RfN2Z-DHoM_Jl',
    B2:'1DbJ2-1SGEjxCMccQA2l8YuANehWm8qC9',
    I1:'1110cof4beNl_ME7HMOgDmHCx0N_Ux-kc',
    I2:'1CajioftRWZyrDXX5XmKOswIIYNB_A7ln',
  };
  const DOCS = {
    syllabus:{
      eyebrow:'Planificación Académica',
      title:'Syllabus',
      desc:'Syllabus oficial del Programa de Inglés Conversacional.',
      id:'1E_44EdPQOEL-DQpvzr59HLs1c8o4WR5F',
    },
    cronograma_general:{
      eyebrow:'Planificación Académica',
      title:'Cronograma general',
      desc:'Cronograma general oficial del programa.',
      id:'1cIx_oJCUN1uNE1xHij3dsm_1H49nMXZ9',
    },
  };

  let overlayRoot = null;
  let navigationApi = { setActive:null };

  function session(){
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) { return {}; }
  }

  function clean(value){ return String(value == null ? '' : value).replace(/\s+/g,' ').trim(); }
  function roleOf(user){ return clean(user?.rol || user?.role).toLowerCase(); }
  function currentGroup(user){ return clean(user?.grupoActivo || user?.grupo || user?.grupos?.[0]); }
  function currentLevel(user){
    const direct = clean(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL).toUpperCase();
    if (LEVEL_NAMES[direct]) return direct;
    const statuses = user?.niveles_estatus || user?.NIVELES_ESTATUS || {};
    const active = ['B1','B2','I1','I2'].find(code => clean(statuses?.[code]).toUpperCase() === 'CA');
    if (active) return active;
    const match = currentGroup(user).toUpperCase().match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  function isFreeStudent(user){
    const tipo = clean(user?.tipoUsuario || user?.tipo_usuario || user?.origen || user?.ORIGEN || user?.etapa || user?.ETAPA).toLowerCase();
    if (/gratis|free|prospect|prematric|lead|formulario/.test(tipo)) return true;
    const code = clean(user?.codigo || user?.CODIGO);
    const group = currentGroup(user);
    const level = clean(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.estatus_activo || user?.ESTATUS_ACTIVO);
    return !code && !group && !level;
  }

  function token(){ return typeof window.getSessionToken === 'function' ? window.getSessionToken() : ''; }
  async function post(fn, payload={}, timeout=90000){
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(()=>ctrl.abort(), timeout) : null;
    try {
      const response = await fetch(`${window.APPS_SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({ fn, token:token(), ...payload }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch (_) { throw new Error('El servidor devolvió una respuesta inválida.'); }
      if (!response.ok || !data?.ok) throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('La carga tardó demasiado.');
      throw error;
    } finally { if (timer) clearTimeout(timer); }
  }

  function studentAcademicSafeUserError(raw, fallback, context = '') {
    const msg = String(raw?.message ?? raw ?? '').trim();
    if (!msg) return fallback;
    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
    const technicalText = /apps?\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|respuesta inv[aá]lida|request_id|file_id|base64|sha-?256|mime|anlazycampus|mountstudentacademicsummary|getbibliotecanivelestudiante|getaudiopistaestudiante|cargador del campus|no se encontr[oó] el componente/i.test(msg);
    if (technicalCode || technicalText) {
      console.warn('[StudentAcademic] Detalle técnico oculto al estudiante.', { context, error: msg });
      return fallback;
    }
    return msg;
  }

  function ensureCss(){
    if (document.getElementById('an-student-menu-academic-cs21a120-css')) return;
    const link = document.createElement('link');
    link.id = 'an-student-menu-academic-cs21a120-css';
    link.rel = 'stylesheet';
    link.href = 'styles/student_menu_academic_cs21a120.css?v=F98.4Z6CS21A120';
    document.head.appendChild(link);
  }

  function routeFromHash(){
    const route = String(location.hash || '').replace(/^#/,'').split('/')[0];
    return CUSTOM_ROUTES.has(route) ? route : '';
  }

  function dispatchRoute(route){
    try { window.dispatchEvent(new CustomEvent('an:student-custom-route-cs21a120', { detail:{ route } })); } catch (_) {}
  }

  function overlayHost(){
    let host = document.getElementById('an-student-academic-host-cs21a120');
    if (host) return host;
    const app = document.querySelector('.app');
    if (!app) return null;
    host = document.createElement('main');
    host.id = 'an-student-academic-host-cs21a120';
    host.className = 'main an-student-academic-host-cs21a120';
    const current = app.querySelector(':scope > .main:not(.an-student-academic-host-cs21a120)');
    if (current) current.insertAdjacentElement('afterend', host);
    else app.appendChild(host);
    return host;
  }

  function closeOverlay(keepHistory=true){
    document.body.classList.remove('an-student-academic-route-open');
    if (overlayRoot) {
      try { overlayRoot.unmount(); } catch (_) {}
      overlayRoot = null;
    }
    document.getElementById('an-student-academic-host-cs21a120')?.remove();
    dispatchRoute('');
    if (!keepHistory && routeFromHash()) {
      try { history.replaceState({},'', '#dashboard'); } catch (_) {}
    }
  }

  function resolveStandardNavigation(target, opts={}){
    closeOverlay(true);
    let route = target;
    if (target === 'evaluaciones' && opts.tab === 'resultados') route = 'notas';
    if (target === 'mi_curso' && opts.tab === 'cronograma') route = 'cronograma_grupo';
    if (typeof navigationApi.setActive === 'function') navigationApi.setActive(route);
  }

  function openOverlay(route, push=true){
    if (!CUSTOM_ROUTES.has(route)) return;
    ensureCss();
    const host = overlayHost();
    if (!host) return;
    document.body.classList.add('an-student-academic-route-open');
    document.body.classList.remove('an-mobile-nav-open');
    if (!overlayRoot) overlayRoot = ReactDOM.createRoot(host);
    overlayRoot.render(<StudentCustomRouteCS21A120 route={route} onNavigate={resolveStandardNavigation}/>);
    dispatchRoute(route);
    if (push && routeFromHash() !== route) {
      try { history.pushState({ anStudentAcademic:true, route },'', '#'+route); } catch (_) { location.hash = route; }
    }
    try { window.scrollTo({top:0,left:0,behavior:'auto'}); } catch (_) { window.scrollTo(0,0); }
  }

  function ScreenHeader({ eyebrow, title, desc, right }){
    return <div className="sa120-header">
      <div>
        <div className="sa120-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {desc && <p>{desc}</p>}
      </div>
      {right || null}
    </div>;
  }

  function LoadingCard({ text='Preparando pantalla…' }){
    return <div className="sa120-state"><strong>{text}</strong></div>;
  }
  function ErrorCard({ text, onRetry }){
    return <div className="sa120-state sa120-error"><strong>No se pudo cargar la información</strong><span>{text}</span>{onRetry&&<button className="btn btn-primary" onClick={onRetry}>Reintentar</button>}</div>;
  }

  function AsyncComponentRoute({ files, component, props={} }){
    const [state,setState] = React.useState({ loading:true, error:'' });
    const load = React.useCallback(()=>{
      setState({loading:true,error:''});
      const loader = window.anLazyCampus;
      if (!loader?.loadMany) { setState({loading:false,error:'No pudimos preparar esta pantalla. Intentá de nuevo.'}); return; }
      loader.loadMany(files || []).then(()=>{
        if (typeof window[component] !== 'function') throw new Error('No se encontró el componente '+component+'.');
        setState({loading:false,error:''});
      }).catch(error=>setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos preparar esta pantalla. Intentá de nuevo.', 'cargar_pantalla')}));
    },[component,JSON.stringify(files||[])]);
    React.useEffect(load,[load]);
    if (state.loading) return <LoadingCard/>;
    if (state.error) return <ErrorCard text={state.error} onRetry={load}/>;
    const Component = window[component];
    return <Component {...props}/>;
  }

  function StudentProfileRouteCS21A120({ onNavigate }){
    return <section className="sa120-page"><AsyncComponentRoute files={['src/student_modules.jsx?v=F98.4Z6G']} component="PerfilView" props={{onNavigate}}/></section>;
  }

  function StudentSummaryRouteCS21A120({ onNavigate }){
    const ref = React.useRef(null);
    const [state,setState] = React.useState({loading:true,error:''});
    const load = React.useCallback(()=>{
      setState({loading:true,error:''});
      ensureCss();
      const cssId='an-student-academic-summary-cs21a113-css';
      if(!document.getElementById(cssId)){
        const l=document.createElement('link');l.id=cssId;l.rel='stylesheet';l.href='styles/student_academic_summary_cs21a113.css?v=F98.4Z6CS21A120';document.head.appendChild(l);
      }
      window.anLazyCampus.loadMany([
        'src/student_portal.jsx?v=F98.4Z6CS21A120',
        'src/student_academic_summary_core_cs21a113.js?v=F98.4Z6CS21A120',
        'src/student_academic_summary_dom_cs21a113.js?v=F98.4Z6CS21A120'
      ]).then(()=>{
        if(typeof window.mountStudentAcademicSummaryCS21A113!=='function') throw new Error('No se pudo preparar Resumen Académico.');
        setState({loading:false,error:''});
      }).catch(error=>setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos cargar tu resumen académico. Intentá de nuevo.', 'resumen_academico')}));
    },[]);
    React.useEffect(load,[load]);
    React.useEffect(()=>{
      if(state.loading||state.error||!ref.current)return undefined;
      return window.mountStudentAcademicSummaryCS21A113(ref.current,{onNavigate});
    },[state.loading,state.error,onNavigate]);
    if(state.loading)return <LoadingCard text="Cargando Resumen Académico…"/>;
    if(state.error)return <ErrorCard text={state.error} onRetry={load}/>;
    return <div ref={ref}/>;
  }

  function DocumentViewerRouteCS21A120({ type }){
    const user=session();
    const level=currentLevel(user);
    const meta = type === 'plan_estudio'
      ? { eyebrow:'Planificación Académica', title:'Plan de Estudio', desc:`Plan de estudio oficial de ${LEVEL_NAMES[level]}.`, id:PLAN_DOCS[level] }
      : DOCS[type];
    const preview = `https://drive.google.com/file/d/${meta.id}/preview`;
    const download = `https://drive.google.com/uc?export=download&id=${meta.id}`;
    return <section className="sa120-page">
      <ScreenHeader eyebrow={meta.eyebrow} title={meta.title} desc={meta.desc} right={type==='plan_estudio'?<span className="sa120-level-chip">{level} · {LEVEL_NAMES[level]}</span>:null}/>
      <div className="sa120-doc">
        <div className="sa120-doc-head"><div><strong>{meta.title}</strong><span>{type==='plan_estudio'?BOOK_NAMES[level]:'Documento institucional oficial'}</span></div><button className="btn btn-primary" onClick={()=>window.open(download,'_blank','noopener,noreferrer')}>Descargar</button></div>
        <iframe title={meta.title} src={preview} allow="autoplay"/>
      </div>
    </section>;
  }

  function useStudentCatalogCS21A120(){
    const user=React.useMemo(session,[]);
    const level=currentLevel(user);
    const group=currentGroup(user);
    const code=clean(user?.codigo||user?.CODIGO||user?.cedula||user?.CEDULA);
    const [state,setState]=React.useState({loading:true,error:'',catalog:null});
    const load=React.useCallback(()=>{
      setState({loading:true,error:'',catalog:null});
      post('getBibliotecaNivelEstudiante',{nivel:level,codigo:code,cod_grupo:group,vista:'estudiante'}).then(response=>{
        if(response?.acceso===false)throw new Error(response?.motivo||'La biblioteca no está habilitada para tu estado académico.');
        if(!response?.catalogo)throw new Error('No se encontró el catálogo del nivel.');
        setState({loading:false,error:'',catalog:response.catalogo});
      }).catch(error=>setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos cargar el contenido académico. Intentá de nuevo.', 'catalogo_estudiante'),catalog:null}));
    },[level,group,code]);
    React.useEffect(load,[load]);
    return{...state,load,level,group,code};
  }

  function FieldCS21A120({ label, value }){
    if(!clean(value))return null;
    return <div className="sa120-field"><span>{label}</span><p>{value}</p></div>;
  }

  function StudentPlaneamientoRouteCS21A120(){
    const data=useStudentCatalogCS21A120();
    const [unitKey,setUnitKey]=React.useState('');
    const [lessonOpen,setLessonOpen]=React.useState(null);
    React.useEffect(()=>{setUnitKey('');setLessonOpen(null);},[data.level]);
    if(data.loading)return <LoadingCard text="Cargando el planeamiento estudiantil…"/>;
    if(data.error)return <ErrorCard text={data.error} onRetry={data.load}/>;
    const units=data.catalog?.planeamiento_unidades||[];
    const unit=units.find(item=>String(item.key)===String(unitKey))||null;
    return <section className="sa120-page">
      <ScreenHeader eyebrow="Planificación Académica" title="Planeamiento por lección" desc="Versión estudiantil del planeamiento oficial de tu nivel." right={<span className="sa120-level-chip">{data.level} · {LEVEL_NAMES[data.level]}</span>}/>
      <div className="sa120-card">
        <label className="sa120-label" htmlFor="sa120-unit">Seleccionar unidad</label>
        <select id="sa120-unit" value={unitKey} onChange={event=>{setUnitKey(event.target.value);setLessonOpen(null);}}>
          <option value="">Elegí una unidad</option>
          {units.map(item=><option key={item.key} value={item.key}>{item.label}{item.titulo_unidad?` · ${item.titulo_unidad}`:''}</option>)}
        </select>
        {!units.length&&<div className="sa120-empty">No hay planeamientos publicados para este nivel.</div>}
      </div>
      {unit&&<div className="sa120-lessons">
        <div className="sa120-unit-head"><strong>{unit.label}</strong><span>{unit.titulo_unidad||''}</span></div>
        {(unit.lecciones||[]).map(lesson=>{
          const open=Number(lessonOpen)===Number(lesson.leccion);
          return <article key={lesson.leccion} className="sa120-lesson">
            <button type="button" className="sa120-lesson-head" onClick={()=>setLessonOpen(open?null:lesson.leccion)}>
              <span><small>{lesson.leccion_label||`LECCIÓN ${String(lesson.leccion).padStart(2,'0')}`}</small><strong>{lesson.titulo_unidad||unit.titulo_unidad||'Planeamiento'}</strong></span><b>{open?'−':'+'}</b>
            </button>
            {open&&<div className="sa120-lesson-body">
              <FieldCS21A120 label="Asignatura" value={lesson.asignatura}/>
              <FieldCS21A120 label="Tema / Objetivo general" value={lesson.tema_objetivo_general}/>
              <FieldCS21A120 label="Speaking" value={lesson.speaking}/>
              <FieldCS21A120 label="Grammar" value={lesson.grammar}/>
              <FieldCS21A120 label="Pronunciation / Listening" value={lesson.pronunciation_listening}/>
              <FieldCS21A120 label="Writing / Reading" value={lesson.writing_reading}/>
            </div>}
          </article>;
        })}
      </div>}
    </section>;
  }

  function AudioPlayerCS21A120({ track, level, code, group }){
    const [state,setState]=React.useState({loading:true,error:'',src:''});
    React.useEffect(()=>{
      let live=true,url='';
      setState({loading:true,error:'',src:''});
      post('getAudioPistaEstudiante',{nivel:level,codigo:code,cod_grupo:group,archivo_id:track.id}).then(response=>{
        if(!response?.audio?.base64)throw new Error(response?.mensaje||'No se pudo cargar la pista.');
        const binary=atob(response.audio.base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
        url=URL.createObjectURL(new Blob([bytes],{type:response.audio.mime||'audio/mpeg'}));
        if(live)setState({loading:false,error:'',src:url});
      }).catch(error=>live&&setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos cargar el audio. Intentá de nuevo.', 'audio_estudiante'),src:''}));
      return()=>{live=false;if(url)try{URL.revokeObjectURL(url);}catch(_){}};
    },[track.id,level,code,group]);
    if(state.loading)return <span className="sa120-audio-state">Cargando audio…</span>;
    if(state.error)return <span className="sa120-audio-state error">{state.error}</span>;
    return <audio controls preload="metadata" src={state.src}/>;
  }

  function StudentBooksAudiosRouteCS21A120(){
    const data=useStudentCatalogCS21A120();
    const [audioUnit,setAudioUnit]=React.useState('');
    const [track,setTrack]=React.useState(null);
    React.useEffect(()=>{setAudioUnit('');setTrack(null);},[data.level]);
    if(data.loading)return <LoadingCard text="Cargando libros y audios…"/>;
    if(data.error)return <ErrorCard text={data.error} onRetry={data.load}/>;
    const books=(data.catalog?.libros||[]).filter(item=>clean(item?.categoria).toLowerCase()!=='teacher_book');
    const units=data.catalog?.audios_unidades||[];
    const unit=units.find((item,index)=>String(item.key??item.label??index)===String(audioUnit))||null;
    return <section className="sa120-page">
      <ScreenHeader eyebrow="Recursos Didácticos" title="Libros y Audios" desc={`Material oficial de ${LEVEL_NAMES[data.level]}.`} right={<span className="sa120-level-chip">{data.level} · {BOOK_NAMES[data.level]}</span>}/>
      <div className="sa120-card">
        <h2>Libros del nivel</h2>
        <div className="sa120-books">{books.map(item=><a key={item.id||item.nombre} href={item.url} target="_blank" rel="noopener noreferrer"><span>📘</span><div><strong>{item.nombre}</strong><small>{item.categoria_label||'Abrir libro oficial'}</small></div></a>)}</div>
        {!books.length&&<div className="sa120-empty">No hay libros visibles publicados para este nivel.</div>}
      </div>
      <div className="sa120-card">
        <h2>Audios por unidad</h2>
        <label className="sa120-label" htmlFor="sa120-audio-unit">Seleccionar unidad</label>
        <select id="sa120-audio-unit" value={audioUnit} onChange={event=>{setAudioUnit(event.target.value);setTrack(null);}}>
          <option value="">Elegí una unidad</option>
          {units.map((item,index)=>{const key=String(item.key??item.label??index);return <option key={key} value={key}>{item.label||item.nombre||`Unidad ${index+1}`}</option>;})}
        </select>
        {unit&&<div className="sa120-tracks">{(unit.pistas||[]).map(item=><article key={item.id||item.nombre} className={track?.id===item.id?'active':''}><button onClick={()=>setTrack(item)}><span>▶</span><strong>{item.nombre}</strong></button>{track?.id===item.id&&<AudioPlayerCS21A120 track={item} level={data.level} code={data.code} group={data.group}/>}</article>)}</div>}
        {unit&&!(unit.pistas||[]).length&&<div className="sa120-empty">Esta unidad no tiene audios publicados.</div>}
      </div>
    </section>;
  }

  function StudentAdditionalResourcesRouteCS21A120(){
    const Component=window.AdditionalResourcesPanel;
    if(typeof Component!=='function')return <ErrorCard text="No pudimos preparar Recursos adicionales. Intentá de nuevo."/>;
    return <Component/>;
  }

  function StudentCustomRouteCS21A120({ route, onNavigate }){
    if(route==='perfil_estudiante')return <StudentProfileRouteCS21A120 onNavigate={onNavigate}/>;
    if(route==='info_programa'){
      const Component=window.ProgramInfoSharedCS21A119;
      return typeof Component==='function'?<Component/>:<ErrorCard text="No pudimos preparar Información General del Programa. Intentá de nuevo."/>;
    }
    if(route==='resumen_academico')return <StudentSummaryRouteCS21A120 onNavigate={onNavigate}/>;
    if(route==='syllabus_estudiante')return <DocumentViewerRouteCS21A120 type="syllabus"/>;
    if(route==='planeamiento_estudiante')return <StudentPlaneamientoRouteCS21A120/>;
    if(route==='plan_estudio_estudiante')return <DocumentViewerRouteCS21A120 type="plan_estudio"/>;
    if(route==='cronograma_general_estudiante')return <DocumentViewerRouteCS21A120 type="cronograma_general"/>;
    if(route==='libros_audios_estudiante')return <StudentBooksAudiosRouteCS21A120/>;
    if(route==='recursos_adicionales')return <StudentAdditionalResourcesRouteCS21A120/>;
    return <ErrorCard text="La ruta académica solicitada no existe."/>;
  }

  const PreviousSidebar = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
  const sectionStyle={padding:'14px 14px 7px',color:'var(--an-navy-ink,#001E47)',fontSize:14,fontWeight:950,letterSpacing:'.04em',textTransform:'none'};
  function iconNode(name){try{return typeof Icon==='function'?<Icon name={name} size={18}/>:<span/>;}catch(_){return <span/>;}}

  function StudentSidebarCS21A120(props){
    const user=props.usuario||session();
    const [customActive,setCustomActive]=React.useState(routeFromHash);
    navigationApi.setActive=props.setActive;
    React.useEffect(()=>{
      const handler=event=>setCustomActive(clean(event?.detail?.route));
      window.addEventListener('an:student-custom-route-cs21a120',handler);
      return()=>window.removeEventListener('an:student-custom-route-cs21a120',handler);
    },[]);
    React.useEffect(()=>{
      if(customActive&&location.hash==='#dashboard')closeOverlay(true);
    },[props.active]);

    const nav=[
      {section:'Principal',items:[
        {id:'perfil_estudiante',label:'Mi Perfil',icon:'profile',custom:true},
        {id:'info_programa',label:'Información General del Programa',icon:'doc',custom:true},
      ]},
      {section:'Gestión Académica',items:[
        {id:'resumen_academico',label:'Resumen Académico',icon:'chart',custom:true},
        {id:'calendario_academico',target:'cronograma_grupo',activeTarget:'mi_curso',label:'Calendario académico',icon:'calendar'},
        {id:'evaluaciones',label:'Evaluaciones',icon:'check'},
        {id:'ican',label:'Club I CAN',icon:'ican'},
        {id:'academia_play',label:'English LAB',icon:'english_lab'},
      ]},
      {section:'Planificación Académica',items:[
        {id:'syllabus_estudiante',label:'Syllabus',icon:'materials',custom:true},
        {id:'planeamiento_estudiante',label:'Planeamiento por lección',icon:'materials',custom:true},
        {id:'plan_estudio_estudiante',label:'Plan de Estudio',icon:'calendar',custom:true},
        {id:'cronograma_general_estudiante',label:'Cronograma general',icon:'calendar',custom:true},
      ]},
      {section:'Recursos Didácticos',items:[
        {id:'libros_audios_estudiante',label:'Libros y Audios',icon:'materials',custom:true,mode:'books'},
        {id:'recursos_adicionales',label:'Recursos adicionales',icon:'materials',custom:true,mode:'additional',domId:'an-additional-resources-nav-cs21a68-student'},
      ]},
      {section:'Gestión',items:[
        {id:'pagos',label:'Pagos y estado de cuenta',icon:'payments'},
        {id:'certificados',label:'Certificados',icon:'certificates'},
      ]},
    ];

    const name=clean(user?.nombre)||'—';
    const initials=name.split(' ').slice(0,2).map(word=>word[0]).join('').toUpperCase()||'AN';
    const code=clean(user?.codigo||user?.CODIGO);
    const isActive=item=>item.custom?customActive===item.id:(!customActive&&props.active===(item.activeTarget||item.id));
    const go=item=>{
      if(item.mode){try{sessionStorage.setItem('an_resources_panel_mode_cs21a68',item.mode);window.dispatchEvent(new CustomEvent('an:resources-panel-mode',{detail:{mode:item.mode}}));}catch(_){}}
      if(item.custom){openOverlay(item.id,true);return;}
      closeOverlay(true);
      setCustomActive('');
      if(typeof props.setActive==='function')props.setActive(item.target||item.id);
    };

    return <aside className="sb student-sb teacher-menu-layout" data-role="student" data-version={VERSION}>
      <div className="sb-brand"><div className="sb-logo"/><div className="sb-brand-text"><div className="sb-brand-t1">Norteamericana</div><div className="sb-brand-t2">Campus Virtual</div></div></div>
      {nav.map(group=><React.Fragment key={group.section}>{<div className="sb-section teacher-sb-section student-sb-section" style={sectionStyle}>{group.section}</div>}{group.items.map(item=><button id={item.domId||undefined} key={item.id} type="button" data-nav-id={item.id} className={'sb-item teacher-sb-item student-sb-item '+(isActive(item)?'active':'')} onClick={()=>go(item)}>{iconNode(item.icon)}<span className="sb-label" style={{fontSize:13,fontWeight:850}}>{item.label}</span></button>)}</React.Fragment>)}
      <div className="sb-user"><div className="sb-avatar">{initials}</div><div style={{flex:1,minWidth:0}}><div className="sb-user-t1">{name}</div><div className="sb-user-t2">Estudiante{code?' · '+code:''}</div></div><button title="Cerrar sesión" onClick={async()=>{try{if(typeof window.cerrarSesionServidor==='function')await window.cerrarSesionServidor();else sessionStorage.removeItem('an_usuario');}catch(_){}window.location.href='login.html';}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--ink-3)',padding:4}}>⎋</button></div>
    </aside>;
  }

  function SidebarCS21A120(props){
    const user=props?.usuario||session();
    const role=clean(user?.rol||props?.rolReal||props?.role).toLowerCase();
    if(role==='student'&&!isFreeStudent(user))return <StudentSidebarCS21A120 {...props}/>;
    return PreviousSidebar?<PreviousSidebar {...props}/>:null;
  }

  function install(){
    ensureCss();
    window.Sidebar=SidebarCS21A120;
    try{Sidebar=SidebarCS21A120;}catch(_){}
    window.CS21A120_STUDENT_MENU={version:VERSION,open:openOverlay,close:closeOverlay};
  }

  window.addEventListener('popstate',()=>{
    const route=routeFromHash();
    if(route)openOverlay(route,false);
    else if(document.body.classList.contains('an-student-academic-route-open'))closeOverlay(true);
  });
  window.addEventListener('an:session-changed',()=>closeOverlay(true));
  install();
})();
