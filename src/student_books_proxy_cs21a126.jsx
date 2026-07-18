// F98.4-Z6-CS21A127 · Reutiliza el visor visual del docente para estudiantes.
/* global React */
(function(){
  'use strict';
  const VERSION='F98.4-Z6-CS21A127';
  const FILES={
    B1:{SB:'1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF',WB:'1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d'},
    B2:{SB:'1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2',WB:'1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp'},
    I1:{SB:'14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch',WB:'18griDamY2oTzNFwmxhP10Ie4BfKJTiIY'},
    I2:{SB:'1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB',WB:'1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE'}
  };
  const NAMES={B1:'Básico I',B2:'Básico II',I1:'Intermedio I',I2:'Intermedio II'};
  function view(id){return `https://drive.google.com/file/d/${id}/view`;}
  function download(id){return `https://drive.google.com/uc?export=download&id=${id}`;}

  function VisualProxy({level}){
    const Component=window.__AN_BOOK_RESOURCES_COMPONENT__;
    if(typeof Component!=='function')return <div className="ca125-state error"><strong>El visor visual del libro no está disponible.</strong></div>;
    const original=sessionStorage.getItem('an_usuario');
    let parsed={};
    try{parsed=JSON.parse(original||'null')||{};}catch(_){parsed={};}
    try{
      sessionStorage.setItem('an_usuario',JSON.stringify({...parsed,nivel_activo:level,NIVEL_ACTIVO:level}));
      return Component({studentMode:true,initialType:'SB'});
    }finally{
      if(original==null)sessionStorage.removeItem('an_usuario');
      else sessionStorage.setItem('an_usuario',original);
    }
  }

  function BookAction({type,label,id}){
    return <article data-book-type={type}>
      <b>{type}</b><span>{label}</span>
      <a className="btn" href={view(id)} target="_blank" rel="noopener noreferrer" aria-label={`Abrir PDF ${label}`}>Abrir PDF</a>
      <a className="btn btn-primary" href={download(id)} target="_blank" rel="noopener noreferrer" aria-label={`Descargar PDF ${label}`}>Descargar PDF</a>
    </article>;
  }

  function StudentBooksProxyCS21A126({level}){
    const safe=FILES[level]?level:'B1';
    const files=FILES[safe];
    return <div className="sb126-wrap" data-student-book-types="SB,WB">
      <div className="sb126-downloads">
        <div><strong>{safe} · {NAMES[safe]}</strong><span>Los libros se muestran como páginas e imágenes, igual que en la vista docente.</span></div>
        <div className="sb126-download-grid">
          <BookAction type="SB" label="Student Book" id={files.SB}/>
          <BookAction type="WB" label="Workbook" id={files.WB}/>
        </div>
      </div>
      <div className="sb126-visual"><VisualProxy key={safe} level={safe}/></div>
    </div>;
  }

  if(!document.getElementById('an-student-books-proxy-cs21a126-css')){
    const style=document.createElement('style');
    style.id='an-student-books-proxy-cs21a126-css';
    style.textContent='.sb126-wrap{display:grid;gap:12px}.sb126-downloads{padding:15px;border:1px solid var(--line,#e5e0d8);border-radius:16px;background:#fff}.sb126-downloads>div:first-child strong,.sb126-downloads>div:first-child span{display:block}.sb126-downloads>div:first-child strong{color:#001e47;font-size:16px}.sb126-downloads>div:first-child span{margin-top:3px;color:#6f6a63;font-size:11px}.sb126-download-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.sb126-download-grid article{padding:10px;display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;align-items:center;border:1px solid #e5e0d8;border-radius:11px}.sb126-download-grid b{color:#002f6c}.sb126-download-grid span{font-size:11px;font-weight:800}.sb126-download-grid a{text-decoration:none;text-align:center}@media(max-width:680px){.sb126-download-grid{grid-template-columns:1fr}.sb126-download-grid article{grid-template-columns:auto 1fr}.sb126-download-grid a{width:100%}}';
    document.head.appendChild(style);
  }
  window.StudentBooksProxyCS21A126=StudentBooksProxyCS21A126;
  window.__AN_STUDENT_BOOKS_PROXY_VERSION__=VERSION;
})();
