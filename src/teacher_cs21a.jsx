// F98.4-Z6-CS21A · Reestructura visual docente base
// Frontend-only: no toca Apps Script, notas oficiales, pagos, certificados ni CONAPE.
/* global React, Sidebar, SidebarMenuIcon, Icon, getSesion */
(function(){
  const VERSION = 'F98.4-Z6-CS21A';

  const LEVELS = {
    b1: { id:'b1', code:'B1', name:'Básico I', color:'#F2C94C', book:'Interchange Intro', plan:'https://drive.google.com/drive/folders/1M9kPbIs343u9FuxigULk_RdU7eg1KJkV', planning:'https://drive.google.com/drive/folders/1lRjdA6aKCt1aKDIXNJBFwZHJh9vAOINS', materials:'https://drive.google.com/drive/folders/1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH' },
    b2: { id:'b2', code:'B2', name:'Básico II', color:'#DA291C', book:'Interchange 1', plan:'https://drive.google.com/drive/folders/1Pjrlv6LxNmcGwZ2Bf9DgbuVRyO-dM2w3', planning:'https://drive.google.com/drive/folders/1FgVJt_o8cZplxNvz_m27ixFTbk5hry_n', materials:'https://drive.google.com/drive/folders/1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ' },
    i1: { id:'i1', code:'I1', name:'Intermedio I', color:'#2F6BE0', book:'Interchange 2', plan:'https://drive.google.com/drive/folders/1s0eHZy5M-eqUwDarw8RbrT69v0GwMhYp', planning:'https://drive.google.com/drive/folders/14QWMznM1WlGVq9pc0BvzMHHnT9ZGA3Wk', materials:'https://drive.google.com/drive/folders/1h3MWODA07lGzUDepOtJV8JvxzqvLncAX' },
    i2: { id:'i2', code:'I2', name:'Intermedio II', color:'#2E7D32', book:'Interchange 3', plan:'https://drive.google.com/drive/folders/1xbfiMKeN0EEHIW5xCiroI3RqXM6rm05_', planning:'https://drive.google.com/drive/folders/14QhjjvU0l-uo6bAb_STbMJYDGMsbcA3V', materials:'https://drive.google.com/drive/folders/1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP' },
  };

  const INFO_ITEMS = [
    { code:'1.1', title:'Reglamento estudiantil', desc:'Derechos, deberes y conducta académica.', tag:'REQUERIDO · ~20 min', url:'https://drive.google.com/file/d/1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei/view', download:'https://drive.google.com/uc?export=download&id=1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei' },
    { code:'1.2', title:'Reglamento de netiqueta', desc:'Normas de comportamiento en sesiones virtuales (Zoom).', tag:'REQUERIDO · ~10 min', url:'https://drive.google.com/file/d/1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll/view', download:'https://drive.google.com/uc?export=download&id=1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll' },
    { code:'1.3', title:'Video de bienvenida al Programa', desc:'Introducción al Campus Virtual y al programa.', tag:'REQUERIDO · ~6 min', url:'https://drive.google.com/drive/folders/1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8' },
    { code:'1.4', title:'Guía — Uso de Zoom y Google Meet', desc:'Herramienta principal y contingencia.', tag:'RECOMENDADO · ~8 min', url:'https://drive.google.com/file/d/1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed/view', download:'https://drive.google.com/uc?export=download&id=1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed' },
    { code:'1.5', title:'Guía — Contingencias', desc:'Qué hacer ante fallas de audio, video, internet o plataforma.', tag:'RECOMENDADO', url:'https://drive.google.com/drive/folders/1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb' },
  ];

  const ICAN_AFTER = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,31];
  const ICAN = {
    b1: [
      ['Presentaciones y Rutinas Diarias','Presentarse y hablar sobre uno mismo','Hablar sobre las actividades diarias','Expresar gustos y preferencias'],
      ['Descripción de Personas y Lugares','Describir la apariencia de las personas','Hablar sobre la familia y amigos','Describir lugares cercanos'],
      ['Pedir y Dar Direcciones','Cómo pedir y dar indicaciones','Hablar sobre transporte público','Describir rutas comunes'],
      ['Tiempo y Clima','Hablar sobre el clima y las estaciones','Expresar planes para el fin de semana','Describir actividades según el clima'],
      ['Hacer Planes','Invitar a alguien a una actividad','Expresar acuerdos y desacuerdos sobre planes','Hablar sobre horarios y disponibilidad'],
      ['Descripción de Objetos','Describir objetos de uso cotidiano','Explicar cómo funcionan ciertos objetos','Comparar diferentes objetos'],
      ['Hablar sobre Eventos Pasados','Narrar un evento pasado','Expresar sentimientos sobre eventos pasados','Comparar experiencias pasadas'],
      ['Hablar sobre el Futuro','Expresar planes futuros','Hablar sobre expectativas y metas','Discutir cambios futuros en la vida personal'],
      ['Comparar Cosas y Personas','Comparar entre dos o más objetos','Hablar sobre diferencias entre personas','Expresar preferencias entre dos opciones'],
      ['Salud y Bienestar','Hablar sobre hábitos saludables','Expresar problemas de salud comunes','Pedir y dar consejos de salud'],
      ['Experiencias de Vida','Hablar sobre experiencias de vida importantes','Comparar experiencias con otros','Expresar emociones sobre eventos significativos'],
      ['Cultura y Tradiciones','Hablar sobre costumbres y tradiciones','Comparar celebraciones en diferentes culturas','Expresar opiniones sobre diversidad cultural'],
      ['Compras y Dinero','Hablar sobre hábitos de compra','Discutir presupuestos y gastos','Comparar precios y productos'],
      ['Comida y Bebida','Describir platos y comidas favoritas','Hablar sobre comidas típicas','Expresar preferencias sobre restaurantes'],
      ['Vida Diaria y Tecnología','Hablar sobre tecnología en la vida diaria','Comparar dispositivos tecnológicos','Opinar sobre avances tecnológicos'],
      ['Viajes y Transporte','Hablar sobre experiencias de viaje','Comparar medios de transporte','Dar consejos sobre viajes'],
    ],
    b2: [
      ['Presentaciones y Conversaciones Básicas','Presentarse y hablar sobre uno mismo','Describir amigos y familiares','Intercambiar información personal'],
      ['Rutinas Diarias y Actividades','Hablar sobre la rutina diaria','Describir actividades de tiempo libre','Comparar actividades semanales'],
      ['La Ciudad y el Transporte','Hablar sobre lugares en la ciudad','Describir medios de transporte','Comparar formas de transporte'],
      ['Descripción de Personas y Cosas','Describir apariencia y personalidad','Comparar personas y objetos','Describir ropa y accesorios'],
      ['Salud y Bienestar 2','Hablar sobre hábitos saludables','Expresar síntomas comunes','Pedir y dar consejos de salud'],
      ['Comidas y Restaurantes','Describir comidas favoritas','Pedir comida en restaurante','Comparar comidas típicas'],
      ['Planes y Tiempo Libre','Hablar sobre planes futuros','Expresar preferencias de ocio','Comparar planes de fin de semana'],
      ['Clima y Estaciones','Hablar sobre el clima','Describir actividades por clima','Comparar clima entre ciudades'],
      ['Compras y Dinero 2','Hablar sobre hábitos de compra','Comparar precios y productos','Discutir presupuestos personales'],
      ['Hogar y Vida Diaria','Describir casa o apartamento','Hablar sobre tareas del hogar','Comparar tipos de vivienda'],
      ['Estudios y Educación','Hablar sobre experiencias educativas','Comparar sistemas educativos','Discutir planes futuros de estudio'],
      ['Trabajos y Profesiones','Describir una profesión','Hablar sobre responsabilidades laborales','Comparar tipos de trabajo'],
      ['Viajes y Vacaciones','Hablar sobre destinos favoritos','Describir vacaciones pasadas','Comparar formas de viajar'],
      ['Cultura y Diversidad','Hablar sobre costumbres y tradiciones','Comparar celebraciones','Discutir diversidad cultural'],
      ['Tecnología y Comunicación','Hablar sobre dispositivos tecnológicos','Comparar formas de comunicación','Discutir beneficios y desventajas'],
      ['Sueños y Metas','Hablar sobre metas a largo plazo','Expresar sueños y aspiraciones','Comparar objetivos personales'],
    ],
    i1: [
      ['La Vida Diaria','Describir una rutina diaria en detalle','Comparar vida urbana y rural','Discutir la importancia de la rutina'],
      ['Viajes y Experiencias','Hablar sobre un viaje memorable','Comparar destinos turísticos','Discutir viajar para aprender culturas'],
      ['Relaciones y Comunicación','Describir cualidades de un buen amigo','Comparar relaciones familiares','Mejorar comunicación en trabajo/estudio'],
      ['Tecnología y su Impacto','Discutir pros y contras de tecnología','Comparar dispositivos','Hablar del impacto de redes sociales'],
      ['Salud y Bienestar 3','Describir rutina de ejercicio','Comparar dietas y hábitos','Hablar sobre salud mental'],
      ['Educación y Carreras','Diferencias entre educación pública y privada','Comparar sistemas educativos','Elegir una carrera profesional'],
      ['Medio Ambiente y Sostenibilidad','Discutir problemas ambientales','Hablar de hábitos ecológicos','Comparar iniciativas ambientales'],
      ['Cultura y Tradiciones 2','Comparar costumbres entre países','Cultura y comportamiento diario','Festivales y celebraciones'],
      ['Trabajo y Estilo de Vida','Describir un día típico','Comparar estilos de vida laboral','Equilibrio vida-trabajo'],
      ['Comunicación y Redes Sociales','Redes sociales y comunicación','Comparar plataformas','Privacidad en línea'],
      ['Noticias y Medios','Comparar acceso a noticias','Medios responsables','Identificar desinformación'],
      ['Problemas Globales','Cambio climático','Cooperación internacional','Comparar soluciones globales'],
      ['Innovación y Creatividad','Innovación y cambios globales','Comparar inventos históricos','Fomentar creatividad'],
      ['Habilidades para la Vida','Habilidades esenciales','Técnicas vs interpersonales','Adquirir nuevas habilidades'],
      ['Ciencia y Tecnología','Avances del siglo XXI','Beneficios y riesgos de IA','Tecnología en medicina'],
      ['Futuro y Metas','Planes personales y profesionales','Alcanzar metas a largo plazo','Futuro de tecnología y sociedad'],
    ],
    i2: [
      ['Argumentación y Debate','Argumentar sobre temas controversiales','Debatir derechos humanos y justicia','Opinar sobre políticas globales/locales'],
      ['Relaciones Internacionales','Efectos de la globalización','Comparar políticas económicas','Diplomacia internacional'],
      ['Innovación y Avances Tecnológicos','IA e impacto laboral','Avances científicos recientes','Tecnología en medicina'],
      ['Comunicación Intercultural','Comparar valores culturales','Comunicación intercultural en negocios','Adaptación a nuevas culturas'],
      ['Economía y Sustentabilidad','Desarrollo sostenible','Comparar políticas ambientales','Impacto económico del cambio climático'],
      ['Política y Gobernanza Global','Sistemas políticos','Organizaciones internacionales','Retos de gobernanza global'],
      ['Ética y Filosofía','Dilemas éticos en tecnología','Ética en liderazgo y negocios','Filosofías de vida'],
      ['Medio Ambiente y Sostenibilidad 2','Cambio climático','Medidas contra contaminación','Energías renovables'],
      ['Economía Global y Comercio','Economías emergentes/desarrolladas','Comercio internacional','Globalización y comercio local'],
      ['Innovación Social y Emprendimiento','Emprendedores exitosos','Innovación social','Emprendimiento digital'],
      ['Problemas Globales y Soluciones','Pobreza y desigualdad','Educación en países en desarrollo','Salud pública global'],
      ['Ciencia y Tecnología Siglo XXI','Avances revolucionarios','Ingeniería genética','Exploración espacial'],
      ['Medios de Comunicación y Sociedad','Medios y opinión pública','Responsabilidad periodística','Desinformación'],
      ['Desarrollo Personal y Profesional','Inteligencia emocional','Productividad personal','Desarrollo profesional continuo'],
      ['Derechos Humanos y Justicia','Protección de derechos humanos','Comparar sistemas de justicia','Garantizar igualdad de derechos'],
      ['El Futuro de la Humanidad','IA y robótica futuras','Cambios demográficos','Visiones del futuro humano'],
    ],
  };

  function session(){ try { return typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null'); } catch(_) { return null; } }
  function levelsForUser(){
    const u = session() || {};
    const values = [u.grupo, u.grupoActivo].concat(Array.isArray(u.grupos) ? u.grupos : []);
    const found = new Set();
    values.forEach(v => {
      const s = String(v || '').toUpperCase();
      if (s.includes('B1')) found.add('b1');
      if (s.includes('B2')) found.add('b2');
      if (s.includes('I1')) found.add('i1');
      if (s.includes('I2')) found.add('i2');
    });
    return found.size ? Array.from(found) : ['b1'];
  }
  function openUrl(url){ if (url) window.open(url, '_blank', 'noopener,noreferrer'); }
  function IconSafe({ name }){ return typeof SidebarMenuIcon === 'function' ? <SidebarMenuIcon name={name} size={18} /> : (typeof Icon === 'function' ? <Icon name={name} size={18}/> : <span/>); }

  function CS21Card({ item, children }){
    return <div style={{ background:'var(--surface,#fff)', border:'1px solid var(--line,#e5e0d8)', borderRadius:14, padding:14, boxShadow:'0 8px 24px rgba(0,0,0,.045)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:10, alignItems:'flex-start' }}>
        <div>
          {item.code && <div style={{ fontFamily:'var(--f-mono)', fontSize:10, color:'var(--ink-3)', fontWeight:800 }}>{item.code}</div>}
          <div style={{ fontSize:15, fontWeight:900, color:'var(--an-navy-ink,#001E47)' }}>{item.title}</div>
          <div style={{ fontSize:12, color:'var(--ink-3)', lineHeight:1.45, marginTop:4 }}>{item.desc}</div>
          {item.tag && <div style={{ fontSize:10, marginTop:8, fontWeight:900, letterSpacing:'.08em', color:'var(--an-granate,#7A1E2C)' }}>{item.tag}</div>}
        </div>
      </div>
      {children || <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
        <button type="button" className="btn btn-primary" onClick={()=>openUrl(item.url)} style={{ fontSize:12 }}>Abrir</button>
        {item.download && <button type="button" className="btn" onClick={()=>openUrl(item.download)} style={{ fontSize:12 }}>Descargar</button>}
      </div>}
    </div>;
  }

  function Header({ eyebrow, title, desc }){
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1)', marginBottom:14 }}>
      <div style={{ fontSize:10.5, fontWeight:900, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate)' }}>{eyebrow}</div>
      <div style={{ fontFamily:'var(--f-serif)', fontSize:28, lineHeight:1.1, color:'var(--an-navy-ink)', marginTop:4 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:6, maxWidth:760, lineHeight:1.5 }}>{desc}</div>
    </div>;
  }

  function TeacherMaterialesHubCS21A(props){
    const [tab, setTabState] = React.useState(()=>sessionStorage.getItem('an_teacher_materiales_tab') || 'info');
    React.useEffect(()=>{
      const h = e => { if (e?.detail?.tab) setTabState(e.detail.tab); };
      window.addEventListener('an:teacher-material-tab', h);
      return () => window.removeEventListener('an:teacher-material-tab', h);
    }, []);
    const levels = levelsForUser();
    const setTab = t => { sessionStorage.setItem('an_teacher_materiales_tab', t); setTabState(t); };
    const tabs = [{id:'info',label:'Información general'}, {id:'planificacion',label:'Planificación académica'}, {id:'recursos',label:'Recursos didácticos'}];
    return <section data-screen-label={'Docente · CS21A · ' + tab} style={{ padding:18 }}>
      <Header eyebrow="CS21A · DOCENTE" title={tab === 'info' ? 'Información General del Programa' : tab === 'planificacion' ? 'Planificación Académica' : 'Recursos Didácticos'} desc="Vista docente reorganizada. Solo se muestran accesos de consulta y materiales; no modifica notas, pagos, certificados ni backend." />
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>{tabs.map(t=><button key={t.id} type="button" className={tab===t.id?'btn btn-primary':'btn'} onClick={()=>setTab(t.id)} style={{ fontSize:12 }}>{t.label}</button>)}</div>
      {tab === 'info' && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>{INFO_ITEMS.map(x=><CS21Card key={x.code} item={x}/>)}</div>}
      {tab === 'planificacion' && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12 }}>{levels.map(id=>{ const l=LEVELS[id]; return <div key={id} style={{ border:'1px solid var(--line)', borderRadius:16, background:'#fff', overflow:'hidden' }}><div style={{ padding:'13px 15px', borderBottom:'1px solid var(--line)', display:'flex', gap:10, alignItems:'center' }}><span style={{ width:12, height:12, borderRadius:99, background:l.color }}></span><div><div style={{ fontWeight:950 }}>{l.name}</div><div style={{ fontSize:11, color:'var(--ink-3)' }}>{l.book}</div></div></div><div style={{ padding:12, display:'grid', gap:8 }}><button className="btn" onClick={()=>openUrl(l.plan)}>Syllabus</button><button className="btn" onClick={()=>openUrl(l.planning)}>Planeamiento por lección</button><button className="btn" onClick={()=>openUrl(l.plan)}>Cronograma del módulo INA</button><button className="btn" onClick={()=>props.onNavigate ? props.onNavigate('cronograma_grupo') : null}>Cronograma general del grupo</button></div></div>;})}</div>}
      {tab === 'recursos' && <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:12 }}>{levels.map(id=>{ const l=LEVELS[id]; return <div key={id} style={{ border:'1px solid var(--line)', borderRadius:16, background:'#fff', overflow:'hidden' }}><div style={{ padding:'13px 15px', borderBottom:'1px solid var(--line)', display:'flex', gap:10, alignItems:'center' }}><span style={{ width:12, height:12, borderRadius:99, background:l.color }}></span><div><div style={{ fontWeight:950 }}>{l.name}</div><div style={{ fontSize:11, color:'var(--ink-3)' }}>Material permitido para el nivel del docente</div></div></div><div style={{ padding:12, display:'grid', gap:8 }}><button className="btn" onClick={()=>openUrl(l.materials)}>Biblioteca digital · Teacher Book</button><button className="btn" onClick={()=>openUrl(l.materials)}>Libros de texto · SB/WB</button><button className="btn" onClick={()=>openUrl(l.materials)}>Audios por unidad</button></div></div>;})}</div>}
    </section>;
  }

  function ICANTemasCS21A({ base }){
    const [tab, setTab] = React.useState('temas');
    const levels = levelsForUser();
    return <section data-screen-label="Docente · I CAN CS21A" style={{ padding:18 }}>
      <Header eyebrow="PROGRAMA COMPLEMENTARIO" title="I CAN Conversation Club" desc="Temas por sesión tomados de APOLLO · DETALLE DEL ICAN. La vista operativa anterior se conserva en la pestaña Registro." />
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}><button className={tab==='temas'?'btn btn-primary':'btn'} onClick={()=>setTab('temas')}>Temas por sesión</button><button className={tab==='registro'?'btn btn-primary':'btn'} onClick={()=>setTab('registro')}>Registro / sesiones</button></div>
      {tab === 'registro' ? base : <div style={{ display:'grid', gap:14 }}>{levels.map(id=>{ const l=LEVELS[id]; const rows=ICAN[id] || []; return <div key={id} style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:16, overflow:'hidden' }}><div style={{ padding:'13px 15px', borderBottom:'1px solid var(--line)', display:'flex', gap:10, alignItems:'center' }}><span style={{ width:12, height:12, borderRadius:99, background:l.color }}></span><div><div style={{ fontWeight:950 }}>{l.name}</div><div style={{ fontSize:11, color:'var(--ink-3)' }}>16 sesiones · 32 horas conversacionales</div></div></div><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:10, padding:12 }}>{rows.map((r,i)=><div key={i} style={{ border:'1px solid var(--line)', borderRadius:12, padding:12, background:'#FBFAF7' }}><div style={{ fontSize:10, fontWeight:950, color:'var(--an-granate)', letterSpacing:'.08em' }}>I CAN {String(i+1).padStart(2,'0')} · relacionado con Lección {String(ICAN_AFTER[i]).padStart(2,'0')}</div><div style={{ fontWeight:900, marginTop:4 }}>{r[0]}</div><ul style={{ margin:'8px 0 0 18px', padding:0, fontSize:12, color:'var(--ink-2)', lineHeight:1.45 }}><li>{r[1]}</li><li>{r[2]}</li><li>{r[3]}</li></ul></div>)}</div></div>;})}</div>}
    </section>;
  }

  function installPatches(){
    if (window.MaterialesView && !window.MaterialesView.__cs21a) {
      const Base = window.MaterialesView;
      const Wrapped = function MaterialesViewCS21A(props){
        const u = session();
        if (!u || u.rol !== 'teacher') return <Base {...props}/>;
        return <TeacherMaterialesHubCS21A {...props}/>;
      };
      Wrapped.__cs21a = true; Wrapped.__base = Base; window.MaterialesView = Wrapped;
      try { MaterialesView = Wrapped; } catch(_) {}
    }
    if (window.ClubICANDocenteView && !window.ClubICANDocenteView.__cs21a) {
      const BaseI = window.ClubICANDocenteView;
      const WrappedI = function ClubICANDocenteViewCS21A(props){
        const u = session();
        const base = <BaseI {...props}/>;
        if (!u || u.rol !== 'teacher') return base;
        return <ICANTemasCS21A base={base}/>;
      };
      WrappedI.__cs21a = true; WrappedI.__base = BaseI; window.ClubICANDocenteView = WrappedI;
      try { ClubICANDocenteView = WrappedI; } catch(_) {}
    }
  }

  const OldSidebar = window.Sidebar || (typeof Sidebar === 'function' ? Sidebar : null);
  function setMaterialTab(tab){ sessionStorage.setItem('an_teacher_materiales_tab', tab); try { window.dispatchEvent(new CustomEvent('an:teacher-material-tab', { detail:{ tab } })); } catch(_) {} }
  function TeacherSidebarCS21A({ active, setActive, usuario, onLogout }){
    const usr = usuario || session() || {};
    const name = usr.nombre || '—';
    const init = name.split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase() || 'AN';
    const materialIntent = sessionStorage.getItem('an_teacher_materiales_tab') || 'info';
    const nav = [
      { section:'Principal', items:[{ id:'perfil', label:'Mi Perfil', icon:'profile' }, { id:'info_programa_docente', target:'materiales', intent:'info', label:'Información General del Programa', icon:'doc' }] },
      { section:'Gestión Académica', items:[{ id:'grupos', label:'Mis grupos', icon:'roster' }, { id:'asistencia', label:'Asistencia', icon:'check' }, { id:'cronograma_grupo', label:'Calendario académico', icon:'calendar' }] },
      { section:'Planificación Académica', items:[{ id:'planificacion_academica', target:'materiales', intent:'planificacion', label:'Planificación Académica', icon:'calendar' }] },
      { section:'Recursos Didácticos', items:[{ id:'recursos_didacticos', target:'materiales', intent:'recursos', label:'Recursos Didácticos', icon:'materials' }] },
      { section:'Herramientas', items:[{ id:'english_lab_live', label:'English LAB Live', icon:'english_lab', badge:'Live' }] },
      { section:'Programas Complementarios', items:[{ id:'ican', label:'I CAN Conversation Club', icon:'ican' }] },
      { section:'Evaluación y comunicación', items:[{ id:'examenes', label:'Exámenes', icon:'check' }, { id:'mensajes', label:'Comunicados', icon:'messages' }, { id:'mi_panel_docente', label:'Mis pendientes', icon:'home' }] },
    ];
    const isActive = item => item.target === 'materiales' ? (active === 'materiales' && materialIntent === item.intent) : active === item.id;
    const go = item => { if (item.intent) setMaterialTab(item.intent); if (setActive) setActive(item.target || item.id); };
    return <aside className="sb teacher-sb" data-role="teacher" data-version={VERSION}>
      <div className="sb-brand"><div className="sb-logo"/><div className="sb-brand-text"><div className="sb-brand-t1">Norteamericana</div><div className="sb-brand-t2">Campus Virtual</div></div></div>
      {nav.map(group=><React.Fragment key={group.section}><div className="sb-section teacher-sb-section">{group.section}</div>{group.items.map(item=><button key={item.id} className={'sb-item teacher-sb-item ' + (isActive(item) ? 'active' : '')} onClick={()=>go(item)}><IconSafe name={item.icon}/><span className="sb-label">{item.label}</span>{item.badge && <span className="sb-badge">{item.badge}</span>}</button>)}</React.Fragment>)}
      <div className="sb-user"><div className="sb-avatar">{init}</div><div style={{ flex:1, minWidth:0 }}><div className="sb-user-t1">{name}</div><div className="sb-user-t2">Docente · CS21A</div></div><button title="Cerrar sesión" onClick={async()=>{ try { if (typeof window.cerrarSesionServidor === 'function') await window.cerrarSesionServidor(); else sessionStorage.removeItem('an_usuario'); } catch(_){} if (onLogout) onLogout(); else window.location.href='login.html'; }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-3)', padding:4 }}>⎋</button></div>
    </aside>;
  }
  function SidebarCS21A(props){ if (props && props.role === 'teacher') return <TeacherSidebarCS21A {...props}/>; return OldSidebar ? <OldSidebar {...props}/> : null; }
  try { window.SidebarCS20H = OldSidebar; window.Sidebar = SidebarCS21A; Sidebar = SidebarCS21A; } catch(_) { window.Sidebar = SidebarCS21A; }

  window.addEventListener('an:lazy-module-loaded', installPatches);
  setTimeout(installPatches, 0);
})();
