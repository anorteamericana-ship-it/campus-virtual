// F98.4-Z6-CS21A10 · Biblioteca digital con visor PDF interno
// Frontend-only: Biblioteca digital deja de abrir carpeta y muestra el libro PDF por nivel dentro del Campus.
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION = 'F98.4-Z6-CS21A10';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  function session(){
    try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; }
    catch(_) { return {}; }
  }
  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function openDownload(doc){ window.open(doc.download || doc.preview, '_blank', 'noopener,noreferrer'); }

  const BOOKS = [
    { code:'B1', name:'Básico I', book:'Interchange Intro · Teacher Book', id:'14NQtUMU6LDt8cVaew4uTTdiqOQbX0EHa', color:'#F2C94C' },
    { code:'B2', name:'Básico II', book:'Interchange 1 · Teacher Book', id:'1_hdqwozKTkR2gWT3fVwmyU_avLXopqt8', color:'#DA291C' },
    { code:'I1', name:'Intermedio I', book:'Interchange 2 · Teacher Book', id:'1POcwOVbXJvEtnivu7x3iDtq6T_6-_1do', color:'#2F6BE0' },
    { code:'I2', name:'Intermedio II', book:'Interchange 3 · Teacher Book', id:'1FP9I35vPlCqNNqtLScVCTTqhREGwE1go', color:'#2E7D32' },
  ];

  function makeDoc(level){
    return {
      code: level.code,
      title: 'Biblioteca digital · ' + level.name,
      desc: level.book + ' disponible en visor interno del Campus.',
      preview: filePreview(level.id),
      download: fileDownload(level.id),
      color: level.color,
    };
  }

  function Header(){
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>Recursos Didácticos</div>
      <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>Biblioteca digital</div>
      <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:900, lineHeight:1.5 }}>Seleccioná el nivel para abrir el libro dentro del Campus. Cada libro mantiene visor interno y botón de descarga.</div>
    </div>;
  }

  function LevelButton({ level, selected, onClick }){
    return <button type="button" onClick={onClick} className={selected ? 'btn btn-primary' : 'btn'} style={{ textAlign:'left', justifyContent:'flex-start', padding:'12px', height:'auto', whiteSpace:'normal' }}>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:12, marginRight:10, fontWeight:950, background: selected ? 'rgba(255,255,255,.2)' : level.color, color: selected ? '#fff' : '#001E47' }}>{level.code}</span>
      <span style={{ display:'grid', gap:2 }}>
        <span style={{ fontWeight:950 }}>Biblioteca digital · {level.name}</span>
        <span style={{ fontSize:11, opacity:.82 }}>{level.book}</span>
      </span>
    </button>;
  }

  function BibliotecaDigitalPDF(){
    const [levelCode,setLevelCode] = React.useState('B1');
    const selectedLevel = BOOKS.find(x=>x.code===levelCode) || BOOKS[0];
    const doc = makeDoc(selectedLevel);
    return <section data-screen-label="Docente · CS21A10 · biblioteca-pdf" style={{ padding:18 }}>
      <Header />
      <div style={{ display:'grid', gridTemplateColumns:'minmax(250px,330px) 1fr', gap:14, alignItems:'start' }}>
        <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, padding:12, display:'grid', gap:8 }}>
          {BOOKS.map(level=><LevelButton key={level.code} level={level} selected={level.code===levelCode} onClick={()=>setLevelCode(level.code)} />)}
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden', minHeight:590 }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:22, fontWeight:950, color:BLUE, lineHeight:1.15 }}>{doc.title}</div>
              <div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>{doc.desc}</div>
            </div>
            <button type="button" className="btn btn-primary" onClick={()=>openDownload(doc)} style={{ fontWeight:900 }}>Descargar PDF</button>
          </div>
          <iframe title={doc.title} src={doc.preview} style={{ width:'100%', height:'72vh', minHeight:520, border:0, display:'block', background:'#f7f4ef' }} allow="autoplay"></iframe>
        </div>
      </div>
    </section>;
  }

  function currentScreen(){ return sessionStorage.getItem('an_teacher_materiales_tab') || 'info'; }

  function install(){
    if (!window.MaterialesView || window.MaterialesView.__cs21a10) return;
    const Base = window.MaterialesView;
    const Wrapped = function MaterialesViewCS21A10(props){
      const u = session();
      if (!u || u.rol !== 'teacher') return <Base {...props}/>;
      if (currentScreen() === 'biblioteca') return <BibliotecaDigitalPDF {...props}/>;
      return <Base {...props}/>;
    };
    Wrapped.__cs21a10 = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch(_) {}
  }

  window.addEventListener('an:lazy-module-loaded', install);
  setTimeout(install, 0);
  window.__AN_TEACHER_BIBLIOTECA_PDF_VERSION__ = VERSION;
})();
