// F98.4-Z6-CS21A50 · Orden visual + visor de libros con navegación por unidades
// Frontend-only: mantiene Biblioteca/Libros por nivel, refuerza SB/TB/WB y agrega U01-U16 para saltar a la primera página de cada unidad del Student Book.
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION = 'F98.4-Z6-CS21A50';
  const BLUE = 'var(--an-navy-ink,#001E47)';

  function norm(s){
    return String(s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function labelOf(btn){
    const lbl = btn && btn.querySelector ? btn.querySelector('.sb-label') : null;
    return norm(lbl ? lbl.textContent : (btn ? btn.textContent : ''));
  }

  function rank(btn){
    const t = labelOf(btn);
    if (t.includes('syllabus')) return 1;
    if (t.includes('plan de estudio') || t.includes('cronograma del modulo')) return 2;
    if (t.includes('planeamiento por leccion') || t.includes('planeamiento didactico')) return 3;
    if (t.includes('cronograma general')) return 4;
    return 99;
  }

  function fixPlanningOrder(){
    const sections = Array.from(document.querySelectorAll('.teacher-sb-section, .sb-section'));
    const section = sections.find(el => norm(el.textContent).includes('planificacion academica'));
    if (!section || !section.parentNode) return;

    const parent = section.parentNode;
    const items = [];
    let node = section.nextElementSibling;
    while (node && !(node.classList && node.classList.contains('sb-section')) && !(node.classList && node.classList.contains('teacher-sb-section'))) {
      if (node.classList && node.classList.contains('sb-item')) items.push(node);
      node = node.nextElementSibling;
    }
    if (items.length < 3) return;

    const sorted = items.slice().sort((a,b)=>rank(a)-rank(b));
    const changed = sorted.some((el,i)=>el !== items[i]);
    if (!changed) return;

    sorted.forEach(el => parent.insertBefore(el, node || null));
  }

  function session(){
    try { return (typeof getSesion === 'function' ? getSesion() : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {}; }
    catch(_) { return {}; }
  }
  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function filePreviewAtPage(id, page){ return filePreview(id) + (page ? '#page=' + page : ''); }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function openDownload(doc){ window.open(doc.download || doc.preview, '_blank', 'noopener,noreferrer'); }

  const BOOK_LEVELS = [
    {
      code:'B1', name:'Básico I', color:'#F2C94C', interchange:'Interchange Intro',
      SB:{ label:'SB', name:'Student Book', title:'Interchange Intro · Student Book', id:'13rMmy1ZLpto6SgjSyVyBd3MtivuU19j3' },
      TB:{ label:'TB', name:'Teacher Book', title:'Interchange Intro · Teacher Book', id:'14NQtUMU6LDt8cVaew4uTTdiqOQbX0EHa' },
      WB:{ label:'WB', name:'Workbook', title:'Interchange Intro · Workbook', id:'1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d' },
    },
    {
      code:'B2', name:'Básico II', color:'#DA291C', interchange:'Interchange 1',
      SB:{ label:'SB', name:'Student Book', title:'Interchange 1 · Student Book', id:'1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2' },
      TB:{ label:'TB', name:'Teacher Book', title:'Interchange 1 · Teacher Book', id:'1_hdqwozKTkR2gWT3fVwmyU_avLXopqt8' },
      WB:{ label:'WB', name:'Workbook', title:'Interchange 1 · Workbook', id:'1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp' },
    },
    {
      code:'I1', name:'Intermedio I', color:'#2F6BE0', interchange:'Interchange 2',
      SB:{ label:'SB', name:'Student Book', title:'Interchange 2 · Student Book', id:'14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch' },
      TB:{ label:'TB', name:'Teacher Book', title:'Interchange 2 · Teacher Book', id:'1POcwOVbXJvEtnivu7x3iDtq6T_6-_1do' },
      WB:{ label:'WB', name:'Workbook', title:'Interchange 2 · Workbook', id:'18griDamY2oTzNFwmxhP10Ie4BfKJTiIY' },
    },
    {
      code:'I2', name:'Intermedio II', color:'#2E7D32', interchange:'Interchange 3',
      SB:{ label:'SB', name:'Student Book', title:'Interchange 3 · Student Book', id:'1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB' },
      TB:{ label:'TB', name:'Teacher Book', title:'Interchange 3 · Teacher Book', id:'1FP9I35vPlCqNNqtLScVCTTqhREGwE1go' },
      WB:{ label:'WB', name:'Workbook', title:'Interchange 3 · Workbook', id:'1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE' },
    },
  ];

  const BOOK_TYPES = ['SB','TB','WB'];
  const BOOK_TYPE_TONES = {
    SB:{ solid:'#0B4A8B', soft:'#E8F2FC', border:'#2872B6', label:'Student Book' },
    TB:{ solid:'#7A1E2C', soft:'#F9EDEF', border:'#A94A59', label:'Teacher Book' },
    WB:{ solid:'#237A3B', soft:'#EAF6ED', border:'#4D9B62', label:'Workbook' },
  };

  // Fuente: APOLLO G3 · DETALLE DEL PROGRAMA · columna K “Páginas SB”.
  // Solo se usa la primera página real de cada unidad y se suman 6 páginas por la portada/plan inicial del PDF.
  const SB_UNIT_PAGES = [2,8,16,22,30,36,44,50,58,64,72,78,86,92,100,106].map((sbPage,index)=>({
    unit:index + 1,
    sbPage,
    pdfPage:sbPage + 6,
  }));

  function makeDoc(level, type){
    const entry = level[type] || level.SB;
    return {
      code: level.code + ' · ' + entry.label,
      title: (type === 'TB' && currentScreen() === 'biblioteca' ? 'Biblioteca digital' : 'Libros de texto') + ' · ' + level.name,
      desc: entry.title + ' disponible en visor interno del Campus.',
      id: entry.id,
      preview: filePreview(entry.id),
      download: fileDownload(entry.id),
      bookTitle: entry.title,
      type: entry.label,
      typeName: entry.name,
      color: level.color,
    };
  }

  function HeaderBooks({ mode }){
    const isLibrary = mode === 'biblioteca';
    return <div style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>Recursos Didácticos</div>
      <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>{isLibrary ? 'Biblioteca digital' : 'Libros de texto'}</div>
      <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:900, lineHeight:1.5 }}>
        {isLibrary
          ? 'Seleccioná el nivel para abrir el Teacher Book dentro del Campus. Cada libro mantiene visor interno y botón de descarga.'
          : 'Seleccioná el nivel, elegí SB, TB o WB y usá U01–U16 para ir directamente al inicio de cada unidad del Student Book.'}
      </div>
    </div>;
  }

  function LevelButton({ level, selected, onClick, mode }){
    const isLibrary = mode === 'biblioteca';
    return <button type="button" onClick={onClick} className={selected ? 'btn btn-primary' : 'btn'} style={{ textAlign:'left', justifyContent:'flex-start', padding:'12px', height:'auto', whiteSpace:'normal' }}>
      <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:12, marginRight:10, fontWeight:950, background: selected ? 'rgba(255,255,255,.2)' : level.color, color: selected ? '#fff' : '#001E47' }}>{level.code}</span>
      <span style={{ display:'grid', gap:2 }}>
        <span style={{ fontWeight:950 }}>{isLibrary ? 'Biblioteca digital' : 'Libros de texto'} · {level.name}</span>
        <span style={{ fontSize:11, opacity:.82 }}>{isLibrary ? level.TB.title : 'SB · TB · WB'}</span>
      </span>
    </button>;
  }

  function BookTypeButtons({ type, setType }){
    return <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
      {BOOK_TYPES.map(t => {
        const tone = BOOK_TYPE_TONES[t];
        const active = type === t;
        return <button
          key={t}
          type="button"
          className="btn"
          aria-pressed={active}
          title={tone.label}
          onClick={()=>setType(t)}
          style={{
            minWidth:72,
            height:48,
            padding:'0 14px',
            border:'2px solid ' + tone.border,
            borderRadius:11,
            background:active ? tone.solid : tone.soft,
            color:active ? '#fff' : tone.solid,
            boxShadow:active ? '0 5px 14px rgba(0,30,71,.22)' : '0 2px 6px rgba(0,0,0,.05)',
            fontSize:15,
            fontWeight:950,
            letterSpacing:'.04em',
            transform:active ? 'translateY(-1px)' : 'none',
          }}
        >{t}</button>;
      })}
    </div>;
  }

  function UnitButtons({ unit, setUnit }){
    const current = SB_UNIT_PAGES[unit - 1] || SB_UNIT_PAGES[0];
    return <div style={{ padding:'11px 14px 12px', borderBottom:'1px solid var(--line,#e5e0d8)', background:'linear-gradient(180deg,#FFFDF7 0%,#FFF8E4 100%)' }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:9 }}>
        <strong style={{ color:BLUE, fontSize:12.5, fontWeight:950 }}>Ir al inicio de la unidad</strong>
        <span style={{ color:'#6B5A35', fontSize:10.5, fontWeight:850 }}>U{String(current.unit).padStart(2,'0')} · página SB {current.sbPage} · página PDF {current.pdfPage}</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(8,minmax(46px,1fr))', gap:6 }}>
        {SB_UNIT_PAGES.map(item => {
          const active = item.unit === unit;
          const label = 'U' + String(item.unit).padStart(2,'0');
          return <button
            key={item.unit}
            type="button"
            aria-pressed={active}
            title={label + ' · página SB ' + item.sbPage + ' · página PDF ' + item.pdfPage}
            onClick={()=>setUnit(item.unit)}
            style={{
              minHeight:36,
              padding:'5px 4px',
              border:active ? '2px solid #F2C94C' : '1px solid #D7B34A',
              borderRadius:9,
              background:active ? '#0B4A8B' : '#FFF7D6',
              color:active ? '#fff' : '#674D00',
              boxShadow:active ? '0 4px 10px rgba(11,74,139,.23)' : 'none',
              fontFamily:'var(--f-mono,monospace)',
              fontSize:11,
              fontWeight:950,
              cursor:'pointer',
            }}
          >{label}</button>;
        })}
      </div>
    </div>;
  }

  function BooksPDFView({ mode }){
    const isLibrary = mode === 'biblioteca';
    const [levelCode,setLevelCode] = React.useState('B1');
    const [type,setType] = React.useState(isLibrary ? 'TB' : 'SB');
    const [unit,setUnit] = React.useState(1);
    const selectedLevel = BOOK_LEVELS.find(x=>x.code===levelCode) || BOOK_LEVELS[0];
    const realType = isLibrary ? 'TB' : type;
    const doc = makeDoc(selectedLevel, realType);
    const unitPage = SB_UNIT_PAGES[unit - 1] || SB_UNIT_PAGES[0];
    const preview = realType === 'SB' ? filePreviewAtPage(doc.id, unitPage.pdfPage) : doc.preview;
    const viewerKey = [levelCode,realType,realType === 'SB' ? unit : 'book'].join('-');
    return <section data-screen-label={'Docente · CS21A50 · ' + mode + '-pdf'} style={{ padding:18 }}>
      <HeaderBooks mode={mode} />
      <div style={{ display:'grid', gridTemplateColumns:'minmax(250px,330px) 1fr', gap:14, alignItems:'start' }}>
        <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, padding:12, display:'grid', gap:8 }}>
          {BOOK_LEVELS.map(level=><LevelButton key={level.code} level={level} selected={level.code===levelCode} mode={mode} onClick={()=>setLevelCode(level.code)} />)}
        </div>
        <div style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden', minHeight:590 }}>
          <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--line,#e5e0d8)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:22, fontWeight:950, color:BLUE, lineHeight:1.15 }}>{doc.title}</div>
              <div style={{ fontSize:12, color:'var(--ink-3,#6f6a63)', marginTop:4 }}>
                {doc.bookTitle}{realType === 'SB' ? ' · U' + String(unit).padStart(2,'0') + ' · SB ' + unitPage.sbPage + ' / PDF ' + unitPage.pdfPage : ''}
              </div>
            </div>
            <div style={{ display:'flex', gap:9, flexWrap:'wrap', alignItems:'center' }}>
              {!isLibrary && <BookTypeButtons type={type} setType={setType} />}
              <button type="button" className="btn btn-primary" onClick={()=>openDownload(doc)} style={{ fontWeight:900, minHeight:48, padding:'0 18px' }}>Descargar PDF</button>
            </div>
          </div>
          {!isLibrary && realType === 'SB' && <UnitButtons unit={unit} setUnit={setUnit} />}
          <iframe key={viewerKey} title={doc.title + ' · ' + doc.bookTitle} src={preview} style={{ width:'100%', height:'72vh', minHeight:520, border:0, display:'block', background:'#f7f4ef' }} allow="autoplay"></iframe>
        </div>
      </div>
    </section>;
  }

  function currentScreen(){ return sessionStorage.getItem('an_teacher_materiales_tab') || 'info'; }

  function installBookViews(){
    if (!window.MaterialesView || window.MaterialesView.__cs21a11books) return;
    const Base = window.MaterialesView;
    const Wrapped = function MaterialesViewCS21A50Books(props){
      const u = session();
      if (!u || u.rol !== 'teacher') return <Base {...props}/>;
      const screen = currentScreen();
      if (screen === 'biblioteca') return <BooksPDFView mode="biblioteca" {...props}/>;
      if (screen === 'libros') return <BooksPDFView mode="libros" {...props}/>;
      return <Base {...props}/>;
    };
    Wrapped.__cs21a11books = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    try { MaterialesView = Wrapped; } catch(_) {}
  }

  function run(){
    try { fixPlanningOrder(); } catch(_) {}
    try { installBookViews(); } catch(_) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();

  window.addEventListener('an:lazy-module-loaded', () => setTimeout(run, 30));
  window.addEventListener('an:teacher-material-tab', () => setTimeout(run, 30));
  window.addEventListener('resize', () => setTimeout(run, 30));

  try {
    const obs = new MutationObserver(() => run());
    obs.observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  } catch(_) {}

  window.__AN_TEACHER_ORDER_FIX_VERSION__ = VERSION;
  window.__AN_TEACHER_BOOK_VIEWS_VERSION__ = VERSION;
})();
