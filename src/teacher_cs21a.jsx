// F98.4-Z6-CS21A4 · Orden exacto menú docente + títulos institucionales
// Frontend-only: no toca Apps Script, notas oficiales, pagos, certificados ni CONAPE.
/* global React, Sidebar, Icon, getSesion */
(function(){
  const VERSION = 'F98.4-Z6-CS21A4';
  const SCRIPT_URL = window.APPS_SCRIPT_URL;
  const BLUE = 'var(--an-navy-ink, #001E47)';

  async function postCS21A(fn, payload = {}, timeoutMs = 35000) {
    const token = window.getSessionToken ? window.getSessionToken() : '';
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    try {
      const res = await fetch(`${SCRIPT_URL}?fn=${encodeURIComponent(fn)}`, {
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({ fn, token, ...payload }),
        signal:ctrl ? ctrl.signal : undefined,
      });
      const txt = await res.text();
      let data = null;
      try { data = txt ? JSON.parse(txt) : null; }
      catch(_) { throw new Error('Respuesta inválida del servidor en ' + fn); }
      if (!res.ok) throw new Error((data && (data.error || data.mensaje)) || `HTTP ${res.status}`);
      return data || {};
    } catch(e) {
      if (e && e.name === 'AbortError') throw new Error('El servidor tardó demasiado en responder.');
      throw e;
    } finally { if (timer) clearTimeout(timer); }
  }

  const LEVELS = {
    b1: { id:'b1', code:'B1', name:'Básico I', color:'#F2C94C', book:'Interchange Intro', plan:'https://drive.google.com/drive/folders/1M9kPbIs343u9FuxigULk_RdU7eg1KJkV', planning:'https://drive.google.com/drive/folders/1lRjdA6aKCt1aKDIXNJBFwZHJh9vAOINS', materials:'https://drive.google.com/drive/folders/1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH' },
    b2: { id:'b2', code:'B2', name:'Básico II', color:'#DA291C', book:'Interchange 1', plan:'https://drive.google.com/drive/folders/1Pjrlv6LxNmcGwZ2Bf9DgbuVRyO-dM2w3', planning:'https://drive.google.com/drive/folders/1FgVJt_o8cZplxNvz_m27ixFTbk5hry_n', materials:'https://drive.google.com/drive/folders/1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ' },
    i1: { id:'i1', code:'I1', name:'Intermedio I', color:'#2F6BE0', book:'Interchange 2', plan:'https://drive.google.com/drive/folders/1s0eHZy5M-eqUwDarw8RbrT69v0GwMhYp', planning:'https://drive.google.com/drive/folders/14QWMznM1WlGVq9pc0BvzMHHnT9ZGA3Wk', materials:'https://drive.google.com/drive/folders/1h3MWODA07lGzUDepOtJV8JvxzqvLncAX' },
    i2: { id:'i2', code:'I2', name:'Intermedio II', color:'#2E7D32', book:'Interchange 3', plan:'https://drive.google.com/drive/folders/1xbfiMKeN0EEHIW5xCiroI3RqXM6rm05_', planning:'https://drive.google.com/drive/folders/14QhjjvU0l-uo6bAb_STbMJYDGMsbcA3V', materials:'https://drive.google.com/drive/folders/1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP' },
  };

  const INFO_ITEMS = [
    { code:'1.1', title:'Reglamento estudiantil', desc:'Derechos, deberes y conducta académica.', url:'https://drive.google.com/file/d/1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei/view', download:'https://drive.google.com/uc?export=download&id=1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei' },
    { code:'1.2', title:'Reglamento de netiqueta', desc:'Normas de comportamiento en sesiones virtuales (Zoom).', url:'https://drive.google.com/file/d/1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll/view', download:'https://drive.google.com/uc?export=download&id=1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll' },
    { code:'1.3', title:'Video de bienvenida al Programa', desc:'Introducción al Campus Virtual y al programa.', url:'https://drive.google.com/drive/folders/1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8', download:'https://drive.google.com/drive/folders/1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8' },
    { code:'1.4', title:'Guía — Uso de Zoom y Google Meet', desc:'Herramienta principal y contingencia.', url:'https://drive.google.com/file/d/1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed/view', download:'https://drive.google.com/uc?export=download&id=1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed' },
    { code:'1.5', title:'Guía — Contingencias', desc:'Qué hacer ante fallas de audio, video, internet o plataforma.', url:'https://drive.google.com/drive/folders/1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb', download:'https://drive.google.com/drive/folders/1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb' },
  ];

  function session(){
    try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; }
    catch(_) { return {}; }
  }
  function groupCode(g){
    if(!g) return '';
    if(typeof g === 'string') return g.trim();
    return String(g.code || g.cod_grupo || g.codigo_grupo || g.grupo || g.codigo || g.id || '').trim();
  }
  function levelIdFromCode(code){
    const s=String(code||'').toUpperCase();
    if(s.includes('B2')) return 'b2';
    if(s.includes('I1')) return 'i1';
    if(s.includes('I2')) return 'i2';
    return 'b1';
  }
  function levelsForUser(){
    const u=session();
    const arr=[u.grupoActivo,u.grupo,...(Array.isArray(u.grupos)?u.grupos:[])].filter(Boolean);
    const ids=[...new Set(arr.map(levelIdFromCode))];
    return ids.length ? ids : ['b1'];
  }
  function fmt(v,fallback='—'){ return v === null || v === undefined || v === '' ? fallback : String(v); }
  function pct(v){ const n=Number(v); return Number.isFinite(n) ? Math.round(n) + '%' : '—'; }
  function openUrl(url){ if(url) window.open(url, '_blank', 'noopener,noreferrer'); }
  function iconNode(name){ try { return typeof Icon === 'function' ? <Icon name={name} size={18}/> : <span/>; } catch(_) { return <span/>; } }

  const titleStyle = {
    fontFamily:'var(--f-serif, Georgia, serif)',
    fontSize:32,
    lineHeight:1.05,
    color:BLUE,
    fontWeight:900,
    letterSpacing:'-0.02em',
    marginTop:4,
  };
  const subTitleStyle = { fontSize:18, fontWeight:950, color:BLUE, lineHeight:1.2 };
  const sectionStyle = {
    padding:'14px 14px 7px',
    color:BLUE,
    fontSize:14,
    fontWeight:950,
    letterSpacing:'.04em',
    textTransform:'none',
  };

  function Header({ eyebrow, title, desc }){
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line)', borderRadius:18, padding:'20px 22px', boxShadow:'var(--sh-1)', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate)' }}>{eyebrow}</div>
      <div style={titleStyle}>{title}</div>
      {desc && <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:8, maxWidth:820, lineHeight:1.5 }}>{desc}</div>}
    </div>;
  }

  function CS21Card({ item }){
    return <div style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:16, padding:16, boxShadow:'0 6px 20px rgba(0,0,0,.04)' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
        <div style={{ fontFamily:'var(--f-mono)', fontSize:13, fontWeight:950, color:'var(--an-granate)', minWidth:34 }}>{item.code}</div>
        <div style={{ flex:1 }}>
          <div style={subTitleStyle}>{item.title}</div>
          {item.desc && <div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.45, marginTop:6 }}>{item.desc}</div>}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:14 }}>
        <button type="button" className="btn btn-primary" onClick={()=>openUrl(item.url)} style={{ fontSize:12 }}>Abrir</button>
        <button type="button" className="btn" onClick={()=>openUrl(item.download || item.url)} style={{ fontSize:12 }}>Descargar</button>
      </div>
    </div>;
  }

  function useAsistenciaResumen(){
    const u = session();
    const nombre = u.nombre || u.nombre_completo || u.usuario || '';
    const [state,setState] = React.useState({ loading:true, error:'', groups:[], selected:'', panel:null });
    const load = React.useCallback(async(selectedCode) => {
      setState(s=>({ ...s, loading:true, error:'' }));
      try {
        const g = await postCS21A('getDocenteGruposActuales', { docente:nombre }, 30000);
        if(!g?.ok) throw new Error(g?.error || g?.mensaje || 'No se pudieron cargar los grupos del docente.');
        const groups = (Array.isArray(g.grupos) ? g.grupos : []).filter(x=>groupCode(x));
        const selected = selectedCode || (typeof window.getGrupoActivoDocente === 'function' ? window.getGrupoActivoDocente() : '') || groupCode(groups[0]) || '';
        const chosen = groups.some(x=>groupCode(x)===selected) ? selected : groupCode(groups[0]);
        let panel = null;
        if(chosen) {
          const nivel = (groupCode(chosen).split('-')[0] || 'B1').toUpperCase();
          try {
            const r = await postCS21A('getDocenteGrupoPanelF80', { cod_grupo:chosen, nivel }, 45000);
            if(r?.ok) panel = r;
          } catch(_) {}
          if(!panel) {
            const calls = await Promise.allSettled([
              postCS21A('getEstudiantesParaCierre', { cod_grupo:chosen, nivel }, 30000),
              postCS21A('getAsistenciaGrupoCompleta', { cod_grupo:chosen, nivel }, 30000),
              postCS21A('getFechasGrupo', { cod_grupo:chosen, nivel, riel:'curso' }, 30000),
              postCS21A('getAsistenciaDetalleGrupoF77', { cod_grupo:chosen, nivel }, 30000),
            ]);
            const val=i=>calls[i].status==='fulfilled'?calls[i].value:null;
            const est=val(0), asi=val(1), fec=val(2), det=val(3);
            panel = { ok:true, estudiantes:est?.estudiantes||[], asistencia:asi?.asistencia||{}, lecciones:fec?.lecciones||[], asistencia_detalle:det?.detalle||{}, comentarios:det?.comentarios||{}, notas:{}, cerradas:(fec?.lecciones||[]).filter(l=>String(l.estado||'').toUpperCase()==='CERRADA').length };
          }
        }
        setState({ loading:false, error:'', groups, selected:chosen, panel });
      } catch(e) { setState(s=>({ ...s, loading:false, error:e?.message || String(e) })); }
    }, [nombre]);
    React.useEffect(()=>{ load(); }, [load]);
    const select = code => { const c=groupCode(code); if(typeof window.setGrupoActivoDocente==='function') window.setGrupoActivoDocente(c); load(c); };
    return { ...state, reload:()=>load(state.selected), select };
  }

  function AsistenciaResumenCS21A({ onNavigate }){
    const r = useAsistenciaResumen();
    const groups = r.groups || [];
    const panel = r.panel || {};
    const estudiantes = panel.estudiantes || [];
    const asistencia = panel.asistencia || {};
    const notas = panel.notas || {};
    const comentarios = panel.comentarios || {};
    const lecciones = panel.lecciones || [];
    const cerradas = panel.cerradas ?? lecciones.filter(l=>String(l.estado||'').toUpperCase()==='CERRADA').length;
    const vals = Object.values(asistencia).map(v=>Number(v && v.pct)).filter(Number.isFinite);
    const prom = panel.promedio_asistencia ?? (vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : null);
    return <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        {groups.map(g=>{ const code=groupCode(g); const lvl=LEVELS[levelIdFromCode(code)] || LEVELS.b1; return <button key={code} type="button" onClick={()=>r.select(code)} className={r.selected===code?'btn btn-primary':'btn'} style={{ fontSize:12 }}><span style={{ display:'inline-block', width:9, height:9, borderRadius:99, background:lvl.color, marginRight:6 }}></span>{code}</button>; })}
        <button type="button" className="btn" onClick={r.reload} style={{ fontSize:12 }}>Recargar</button>
      </div>
      {r.loading && <div style={{ padding:18, border:'1px solid var(--line)', borderRadius:14, background:'#fff' }}>Cargando resumen real de asistencia…</div>}
      {r.error && <div style={{ padding:18, border:'1px solid #F0B9B9', borderRadius:14, background:'#FDECEA', color:'#8B1F1F' }}>{r.error}</div>}
      {!r.loading && !r.error && <>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10, marginBottom:12 }}>
          {[['Grupo activo', r.selected], ['Estudiantes', estudiantes.length], ['Asistencia promedio', pct(prom)], ['Lecciones cerradas', `${cerradas}/32`]].map(([a,b])=><div key={a} style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:14, padding:13 }}><div style={{ fontSize:11, fontWeight:950, color:BLUE, letterSpacing:'.06em' }}>{a}</div><div style={{ fontSize:24, fontWeight:950, color:BLUE, marginTop:4 }}>{b}</div></div>)}
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line)', display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            <div><div style={subTitleStyle}>Estudiantes · asistencia y notas</div><div style={{ fontSize:12, color:'var(--ink-3)', marginTop:4 }}>Resumen de lectura. La edición sigue desde Mis grupos al cerrar cada lección.</div></div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}><button className="btn btn-primary" onClick={()=>onNavigate&&onNavigate('grupos')}>Editar en Mis grupos</button><button className="btn" onClick={()=>onNavigate&&onNavigate('cronograma_grupo')}>Ver calendario</button></div>
          </div>
          <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}><thead><tr style={{ background:'#F8F4EE' }}><th style={th}>Estudiante</th><th style={th}>Código</th><th style={th}>Asistencia</th><th style={th}>Nota</th><th style={th}>Comentario</th></tr></thead><tbody>{estudiantes.map(e=>{ const code=String(e.code||e.codigo||e.CODIGO||'').trim(); const a=asistencia[code]||{}; const n=notas[code]||{}; const c=comentarios[code]||{}; return <tr key={code||e.nombre} style={{ borderTop:'1px solid var(--line)' }}><td style={td}>{fmt(e.name||e.nombre||e.NOMBRE)}</td><td style={tdMono}>{fmt(code)}</td><td style={td}>{pct(a.pct)}</td><td style={td}>{n.tiene_notas ? fmt(n.nota_total) : '—'}</td><td style={td}>{fmt(c.ultimo || c.comentario || c.texto || '')}</td></tr>; })}{!estudiantes.length&&<tr><td colSpan="5" style={{...td, textAlign:'center', color:'var(--ink-3)', padding:18}}>No hay estudiantes cargados para este grupo.</td></tr>}</tbody></table></div>
        </div>
      </>}
    </div>;
  }
  const th={ textAlign:'left', padding:'10px 12px', fontSize:11, fontWeight:950, color:BLUE, letterSpacing:'.06em' };
  const td={ padding:'10px 12px', verticalAlign:'top', color:'var(--ink-2)' };
  const tdMono={ ...td, fontFamily:'var(--f-mono)' };

  function LevelCards({ type, onNavigate }){
    const levels = levelsForUser();
    const config = {
      syllabus: { title:'Syllabus', desc:'Plan de estudio del nivel del docente.', button:'Abrir syllabus', url:l=>l.plan },
      planeamiento: { title:'Planeamiento didáctico', desc:'Planeamiento por lección correspondiente al nivel.', button:'Abrir planeamiento', url:l=>l.planning },
      cronograma_modulo: { title:'Cronograma del módulo', desc:'Cronograma institucional del módulo INA.', button:'Abrir cronograma del módulo', url:l=>l.plan },
      cronograma_general: { title:'Cronograma general', desc:'Vista general/calendario del grupo activo.', button:'Ver cronograma general', nav:'cronograma_grupo' },
      biblioteca: { title:'Biblioteca digital', desc:'Teacher Book del nivel correspondiente.', button:'Abrir biblioteca digital', url:l=>l.materials },
      libros: { title:'Libros de texto', desc:'Student Book + Workbook del nivel correspondiente.', button:'Abrir libros de texto', url:l=>l.materials },
      audios: { title:'Audios', desc:'Audios por unidad del nivel correspondiente.', button:'Abrir audios', url:l=>l.materials },
    }[type] || {};
    return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12 }}>
      {levels.map(id=>{ const l=LEVELS[id] || LEVELS.b1; return <div key={id} style={{ border:'1px solid var(--line)', borderRadius:16, background:'#fff', overflow:'hidden' }}>
        <div style={{ padding:'15px 16px', borderBottom:'1px solid var(--line)', display:'flex', gap:10, alignItems:'center' }}><span style={{ width:12, height:12, borderRadius:99, background:l.color }}></span><div><div style={subTitleStyle}>{l.name}</div><div style={{ fontSize:12, color:'var(--ink-3)', marginTop:3 }}>{l.book}</div></div></div>
        <div style={{ padding:14 }}><div style={{ fontSize:13, color:'var(--ink-3)', lineHeight:1.45, marginBottom:12 }}>{config.desc}</div><button className="btn btn-primary" onClick={()=>config.nav ? onNavigate&&onNavigate(config.nav) : openUrl(config.url(l))}>{config.button}</button></div>
      </div>;})}
    </div>;
  }

  function TeacherHubCS21A(props){
    const [screen, setScreenState] = React.useState(()=>sessionStorage.getItem('an_teacher_materiales_tab') || 'info');
    React.useEffect(()=>{ const h=e=>{ if(e?.detail?.tab) setScreenState(e.detail.tab); }; window.addEventListener('an:teacher-material-tab', h); return()=>window.removeEventListener('an:teacher-material-tab', h); }, []);
    const titles = {
      info:['Principal','Información General del Programa','Documentos institucionales del programa. Únicamente se muestran los recursos indicados.'],
      asistencia:['Gestión Académica','Asistencia','Resumen general de asistencia, notas y comentarios por grupo.'],
      syllabus:['Planificación Académica','Syllabus','Acceso al syllabus del nivel correspondiente.'],
      planeamiento:['Planificación Académica','Planeamiento didáctico','Acceso al planeamiento didáctico del nivel correspondiente.'],
      cronograma_modulo:['Planificación Académica','Cronograma del módulo','Acceso al cronograma institucional del módulo.'],
      cronograma_general:['Planificación Académica','Cronograma general','Acceso al cronograma general del grupo activo.'],
      libros:['Recursos Didácticos','Libros y Audios','Acceso a Student Book, Teacher Book, Workbook y audios por unidad del nivel correspondiente.'],
    };
    const t = titles[screen] || titles.info;
    return <section data-screen-label={'Docente · CS21A4 · ' + screen} style={{ padding:18 }}>
      <Header eyebrow={t[0]} title={t[1]} desc={t[2]} />
      {screen === 'info' && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12 }}>{INFO_ITEMS.map(x=><CS21Card key={x.code} item={x}/>)}</div>}
      {screen === 'asistencia' && <AsistenciaResumenCS21A onNavigate={props.onNavigate}/>} 
      {['syllabus','planeamiento','cronograma_modulo','cronograma_general','libros'].includes(screen) && <LevelCards type={screen} onNavigate={props.onNavigate}/>} 
    </section>;
  }

  function installPatches(){
    if (window.MaterialesView && !window.MaterialesView.__cs21a4) {
      const Base = window.MaterialesView;
      const Wrapped = function MaterialesViewCS21A(props){ const u=session(); if(!u || u.rol !== 'teacher') return <Base {...props}/>; return <TeacherHubCS21A {...props}/>; };
      Wrapped.__cs21a4 = true; Wrapped.__base = Base; window.MaterialesView = Wrapped; try { MaterialesView = Wrapped; } catch(_) {}
    }
  }

  const OldSidebar = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
  function setHubScreen(tab){ sessionStorage.setItem('an_teacher_materiales_tab', tab); try { window.dispatchEvent(new CustomEvent('an:teacher-material-tab', { detail:{ tab } })); } catch(_) {} }
  function TeacherSidebarCS21A({ active, setActive, usuario, onLogout }){
    const usr = usuario || session() || {}; const name = usr.nombre || '—'; const init = name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'AN'; const intent = sessionStorage.getItem('an_teacher_materiales_tab') || 'info';
    const nav = [
      { section:'Principal', items:[
        { id:'perfil', label:'Mi Perfil', icon:'profile' },
        { id:'info_programa_docente', target:'materiales', intent:'info', label:'Información General del Programa', icon:'doc' },
      ]},
      { section:'Gestión Académica', items:[
        { id:'grupos', label:'Mis grupos', icon:'roster' },
        { id:'asistencia_docente', target:'materiales', intent:'asistencia', label:'Asistencia', icon:'check' },
        { id:'cronograma_grupo', label:'Calendario académico', icon:'calendar' },
      ]},
      { section:'Planificación Académica', items:[
        { id:'syllabus_docente', target:'materiales', intent:'syllabus', label:'Syllabus', icon:'materials' },
        { id:'planeamiento_docente', target:'materiales', intent:'planeamiento', label:'Planeamiento didáctico', icon:'materials' },
        { id:'cronograma_modulo_docente', target:'materiales', intent:'cronograma_modulo', label:'Cronograma del módulo', icon:'calendar' },
        { id:'cronograma_general_docente', target:'materiales', intent:'cronograma_general', label:'Cronograma general', icon:'calendar' },
      ]},
      { section:'Recursos Didácticos', items:[
        { id:'libros_docente', target:'materiales', intent:'libros', label:'Libros y Audios', icon:'materials' },
      ]},
      { section:'', items:[
        { id:'ican', label:'I CAN Conversation Club', icon:'ican' },
        { id:'english_lab_live', label:'English LAB', icon:'english_lab', badge:'Live' },
      ]},
      { section:'Evaluación y comunicación', items:[
        { id:'examenes', label:'Exámenes', icon:'check' },
        { id:'mensajes', label:'Comunicados', icon:'messages' },
        { id:'mi_panel_docente', label:'Mis pendientes', icon:'home' },
      ]},
    ];
    const isActive = item => item.target === 'materiales' ? (active === 'materiales' && intent === item.intent) : active === item.id;
    const go = item => { if(item.intent) setHubScreen(item.intent); if(setActive) setActive(item.target || item.id); };
    return <aside className="sb teacher-sb" data-role="teacher" data-version={VERSION}>
      <div className="sb-brand"><div className="sb-logo"/><div className="sb-brand-text"><div className="sb-brand-t1">Norteamericana</div><div className="sb-brand-t2">Campus Virtual</div></div></div>
      {nav.map(group=><React.Fragment key={group.section || 'main-actions'}>{group.section && <div className="sb-section teacher-sb-section" style={sectionStyle}>{group.section}</div>}{group.items.map(item=><button key={item.id} data-nav-id={item.id} aria-current={isActive(item) ? 'page' : undefined} className={'sb-item teacher-sb-item ' + (isActive(item) ? 'active' : '')} onClick={()=>go(item)}>{iconNode(item.icon)}<span className="sb-label" style={{ fontSize:13, fontWeight:850 }}>{item.label}</span>{item.badge && <span className="sb-badge">{item.badge}</span>}</button>)}</React.Fragment>)}
      <div className="sb-user"><div className="sb-avatar">{init}</div><div style={{ flex:1, minWidth:0 }}><div className="sb-user-t1">{name}</div><div className="sb-user-t2">Docente · CS21A4</div></div><button title="Cerrar sesión" onClick={async()=>{ try { if(typeof window.cerrarSesionServidor==='function') await window.cerrarSesionServidor(); else sessionStorage.removeItem('an_usuario'); } catch(_){} if(onLogout) onLogout(); else window.location.href='login.html'; }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-3)', padding:4 }}>⎋</button></div>
    </aside>;
  }
  function SidebarCS21A(props){ if(props && props.role === 'teacher') return <TeacherSidebarCS21A {...props}/>; return OldSidebar ? <OldSidebar {...props}/> : null; }
  try { window.SidebarCS20H = OldSidebar; window.Sidebar = SidebarCS21A; Sidebar = SidebarCS21A; } catch(_) { window.Sidebar = SidebarCS21A; }
  window.addEventListener('an:lazy-module-loaded', installPatches);
  setTimeout(installPatches, 0);
})();