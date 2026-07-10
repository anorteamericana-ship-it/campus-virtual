// F98.4-Z6-CS21A5 · Visor interno y descarga de documentos docentes
// Frontend-only: abre documentos dentro del Campus y agrega descarga directa cuando existe archivo Drive.
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION = 'F98.4-Z6-CS21A5';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  function session(){ try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; } catch(_) { return {}; } }
  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function folderPreview(id){ return 'https://drive.google.com/embeddedfolderview?id=' + id + '#list'; }
  function folderOpen(id){ return 'https://drive.google.com/drive/folders/' + id; }
  function openDownload(doc){ window.open(doc.download || doc.url || doc.preview, '_blank', 'noopener,noreferrer'); }

  function fileDoc(code, title, desc, id){ return { code, title, desc, kind:'file', preview:filePreview(id), download:fileDownload(id), url:filePreview(id) }; }
  function folderDoc(code, title, desc, id){ return { code, title, desc, kind:'folder', preview:folderPreview(id), download:folderOpen(id), url:folderOpen(id) }; }

  const INFO_DOCS = [
    fileDoc('1.1', 'Reglamento estudiantil', 'Derechos, deberes y conducta académica.', '1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei'),
    fileDoc('1.2', 'Reglamento de netiqueta', 'Normas de comportamiento en sesiones virtuales (Zoom).', '1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll'),
    folderDoc('1.3', 'Video de bienvenida al Programa', 'Video institucional de bienvenida al programa.', '1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8'),
    fileDoc('1.4', 'Guía — Uso de Zoom y Google Meet', 'Herramienta principal y contingencia.', '1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed'),
    folderDoc('1.5', 'Guía — Contingencias', 'Qué hacer ante fallas de audio, video, internet o plataforma.', '1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb'),
  ];

  const PLAN_DOCS = {
    syllabus: [
      fileDoc('SYL', 'Syllabus · Programa Inglés Conversacional', 'Plan de estudio oficial del programa.', '1E_44EdPQOEL-DQpvzr59HLs1c8o4WR5F'),
    ],
    planeamiento: [
      fileDoc('B1', 'Planeamiento didáctico · Básico I', 'Planeamiento didáctico del nivel Básico I.', '1RENpSuIpuAR4QfA19kibTSsPOjhpEAR8'),
      fileDoc('B2', 'Planeamiento didáctico · Básico II', 'Planeamiento didáctico del nivel Básico II.', '1RvM31QOB9tWMozvCDxsv85UDxiSHNPzW'),
      fileDoc('I1', 'Planeamiento didáctico · Intermedio I', 'Planeamiento didáctico del nivel Intermedio I.', '1zp-EVT2OLJFT2KhyzRAEQ4RGUdVaWFyz'),
      fileDoc('I2', 'Planeamiento didáctico · Intermedio II', 'Planeamiento didáctico del nivel Intermedio II.', '14t18d8NGuPLcPBaVucshmnlZhSYFMs6O'),
    ],
    cronograma_modulo: [
      fileDoc('B1', 'Cronograma del módulo · Básico I', 'Datos y cronograma institucional del módulo Básico I.', '1yTq26DzSwAwajHqH_I8RfN2Z-DHoM_Jl'),
      fileDoc('B2', 'Cronograma del módulo · Básico II', 'Datos y cronograma institucional del módulo Básico II.', '1DbJ2-1SGEjxCMccQA2l8YuANehWm8qC9'),
      fileDoc('I1', 'Cronograma del módulo · Intermedio I', 'Datos y cronograma institucional del módulo Intermedio I.', '1110cof4beNl_ME7HMOgDmHCx0N_Ux-kc'),
      fileDoc('I2', 'Cronograma del módulo · Intermedio II', 'Datos y cronograma institucional del módulo Intermedio II.', '1CajioftRWZyrDXX5XmKOswIIYNB_A7ln'),
    ],
    cronograma_general: [
      fileDoc('GEN', 'Cronograma general del programa', 'Cronograma general descargable del programa.', '1eGe2_El7uYvllAVSIUzwuj-xawTc8kRl'),
    ],
    biblioteca: [folderDoc('TB', 'Biblioteca digital', 'Teacher Book del nivel correspondiente.', '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH')],
    libros: [folderDoc('SB/WB', 'Libros de texto', 'Student Book y Workbook.', '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH')],
    audios: [folderDoc('AUD', 'Audios', 'Audios por unidad.', '1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH')],
  };

  const TITLES = {
    info: ['Principal', 'Información General del Programa', 'Seleccioná un recurso para verlo dentro del Campus y descargarlo desde esta misma pantalla.'],
    syllabus: ['Planificación Académica', 'Syllabus', 'Syllabus oficial del programa con visor interno y descarga.'],
    planeamiento: ['Planificación Académica', 'Planeamiento didáctico', 'Planeamientos oficiales por nivel con visor interno y descarga.'],
    cronograma_modulo: ['Planificación Académica', 'Cronograma del módulo', 'Cronogramas institucionales por módulo con visor interno y descarga.'],
    cronograma_general: ['Planificación Académica', 'Cronograma general', 'Cronograma general del programa con botón de descarga.'],
    biblioteca: ['Recursos Didácticos', 'Biblioteca digital', 'Recursos del nivel correspondiente.'],
    libros: ['Recursos Didácticos', 'Libros de texto', 'Student Book y Workbook.'],
    audios: ['Recursos Didácticos', 'Audios', 'Audios por unidad.'],
  };

  const screenKeys = Object.keys(TITLES);

  function Header({ data }){
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>{data[0]}</div>
      <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>{data[1]}</div>
      <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:860, lineHeight:1.5 }}>{data[2]}</div>
    </div>;
  }

  function DocButton({ doc, selected, onClick }){
    return <button type="button" onClick={onClick} className={selected ? 'btn btn-primary' : 'btn'} style={{ textAlign:'left', justifyContent:'flex-start', padding:'11px 12px', height:'auto', whiteSpace:'normal' }}>
      <span style={{ fontFamily:'var(--f-mono,monospace)', fontSize:10, fontWeight:950, marginRight:8 }}>{doc.code}</span>
      <span style={{ fontWeight:900 }}>{doc.title}</span>
    </button>;
  }

  function DocumentViewer({ docs }){
    const [selected, setSelected] = React.useState(0);
    React.useEffect(()=>setSelected(0), [JSON.stringify((docs||[]).map(d=>d.title))]);
    const list = docs || [];
    const doc = list[selected] || list[0];
    if (!doc) return <div style={{ padding:18, background:'#fff', border:'1px solid var(--line)', borderRadius:16 }}>No hay documento configurado para esta sección.</div>;
    return <div style={{ display:'grid', gridTemplateColumns:'minmax(230px,310px) 1fr', gap:14, alignItems:'start' }}>
      <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, padding:12, display:'grid', gap:8 }}>
        {list.map((d,i)=><DocButton key={d.code + d.title} doc={d} selected={i===selected} onClick={()=>setSelected(i)} />)}
      </div>
      <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden', minHeight:590 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontSize:22, fontWeight:950, color:BLUE, lineHeight:1.15 }}>{doc.title}</div>
            <div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>{doc.desc}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={()=>openDownload(doc)} style={{ fontWeight:900 }}>Descargar</button>
        </div>
        <iframe title={doc.title} src={doc.preview} style={{ width:'100%', height:'72vh', minHeight:520, border:0, display:'block', background:'#f7f4ef' }} allow="autoplay"></iframe>
      </div>
    </div>;
  }

  function AsistenciaPassthrough({ props }){
    const Base = window.MaterialesView && window.MaterialesView.__cs21a4base ? window.MaterialesView.__cs21a4base : null;
    return <div style={{ padding:18, background:'#fff', border:'1px solid var(--line)', borderRadius:16 }}>
      <div style={{ fontSize:22, fontWeight:950, color:BLUE }}>Asistencia</div>
      <div style={{ fontSize:13, color:'var(--ink-3)', marginTop:6 }}>Esta sección se mantiene desde Gestión Académica. La edición sigue en Mis grupos.</div>
      <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={()=>props?.onNavigate && props.onNavigate('grupos')}>Ir a Mis grupos</button>
        <button className="btn" onClick={()=>props?.onNavigate && props.onNavigate('cronograma_grupo')}>Ver calendario académico</button>
      </div>
    </div>;
  }

  function TeacherDocsHubCS21A5(props){
    const [screen,setScreen] = React.useState(()=>sessionStorage.getItem('an_teacher_materiales_tab') || 'info');
    React.useEffect(()=>{ const h=e=>{ if(e?.detail?.tab) setScreen(e.detail.tab); }; window.addEventListener('an:teacher-material-tab', h); return()=>window.removeEventListener('an:teacher-material-tab', h); }, []);
    if (screen === 'asistencia') return <section style={{ padding:18 }}><Header data={['Gestión Académica','Asistencia','Resumen y accesos de asistencia.']} /><AsistenciaPassthrough props={props}/></section>;
    const title = TITLES[screen] || TITLES.info;
    const docs = screen === 'info' ? INFO_DOCS : (PLAN_DOCS[screen] || []);
    return <section data-screen-label={'Docente · CS21A5 · ' + screen} style={{ padding:18 }}>
      <Header data={title}/>
      <DocumentViewer docs={docs}/>
    </section>;
  }

  function install(){
    if (!window.MaterialesView || window.MaterialesView.__cs21a5) return;
    const Base = window.MaterialesView;
    const Wrapped = function MaterialesViewCS21A5(props){
      const u = session();
      if (!u || u.rol !== 'teacher') return <Base {...props}/>;
      return <TeacherDocsHubCS21A5 {...props}/>;
    };
    Wrapped.__cs21a5 = true;
    Wrapped.__base = Base;
    try { window.MaterialesView.__cs21a4base = Base.__base || Base; } catch(_) {}
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch(_) {}
  }

  window.addEventListener('an:lazy-module-loaded', install);
  setTimeout(install, 0);
})();