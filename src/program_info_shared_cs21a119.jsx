// F98.4-Z6-CS21A119 · Información General del Programa compartida por docentes y estudiantes.
/* global React */
(function(){
  'use strict';

  const BLUE = 'var(--an-navy-ink,#001E47)';

  function filePreview(id){ return 'https://drive.google.com/file/d/' + id + '/preview'; }
  function fileDownload(id){ return 'https://drive.google.com/uc?export=download&id=' + id; }
  function folderPreview(id){ return 'https://drive.google.com/embeddedfolderview?id=' + id + '#list'; }
  function folderOpen(id){ return 'https://drive.google.com/drive/folders/' + id; }
  function openDownload(doc){ window.open(doc.download || doc.url || doc.preview, '_blank', 'noopener,noreferrer'); }

  function fileDoc(code, title, desc, id){
    return { code, title, desc, kind:'file', preview:filePreview(id), download:fileDownload(id), url:filePreview(id) };
  }
  function folderDoc(code, title, desc, id){
    return { code, title, desc, kind:'folder', preview:folderPreview(id), download:folderOpen(id), url:folderOpen(id) };
  }

  const INFO_DOCS_CS21A119 = [
    fileDoc('1.1', 'Reglamento estudiantil', 'Derechos, deberes y conducta académica.', '1K_yZjUpiPF6MtXgapeFq7J314qqPQ-Ei'),
    fileDoc('1.2', 'Reglamento de netiqueta', 'Normas de comportamiento en sesiones virtuales (Zoom).', '1X4NP2QJ-xMGBxLukRo-nSuKXf9zCcBll'),
    folderDoc('1.3', 'Video de bienvenida al Programa', 'Video institucional de bienvenida al programa.', '1UdRasbHeqzos7dzt-5VxjIE-Z6gjsrp8'),
    fileDoc('1.4', 'Guía — Uso de Zoom y Google Meet', 'Herramienta principal y contingencia.', '1zMbXdVpyBhci3skWFUthwmOfjdrv8Fed'),
    folderDoc('1.5', 'Guía — Contingencias', 'Qué hacer ante fallas de audio, video, internet o plataforma.', '1QK3-mstC3ITvstKOCA1ccHzsR-CdKaZb'),
  ];

  function ProgramInfoHeaderCS21A119(){
    return <div className="pi119-header" style={{ background:'linear-gradient(135deg,#fff 0%,#F8F4EE 100%)', border:'1px solid var(--line,#e5e0d8)', borderRadius:18, padding:'18px 20px', boxShadow:'var(--sh-1,0 6px 22px rgba(0,0,0,.06))', marginBottom:14 }}>
      <div style={{ fontSize:11, fontWeight:950, letterSpacing:'.16em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>Principal</div>
      <div style={{ fontSize:31, fontWeight:950, lineHeight:1.08, color:BLUE, marginTop:4 }}>Información General del Programa</div>
      <div style={{ fontSize:13, color:'var(--ink-3,#6f6a63)', marginTop:7, maxWidth:860, lineHeight:1.5 }}>Seleccioná un recurso para verlo dentro del Campus y descargarlo desde esta misma pantalla.</div>
    </div>;
  }

  function ProgramInfoDocButtonCS21A119({ doc, selected, onClick }){
    return <button type="button" onClick={onClick} className={selected ? 'btn btn-primary' : 'btn'} style={{ textAlign:'left', justifyContent:'flex-start', padding:'10px 11px', height:'auto', whiteSpace:'normal' }}>
      <span style={{ fontFamily:'var(--f-mono,monospace)', fontSize:10, fontWeight:950, marginRight:8 }}>{doc.code}</span>
      <span style={{ fontWeight:900 }}>{doc.title}</span>
    </button>;
  }

  function ProgramInfoViewerCS21A119({ docs }){
    const [selected, setSelected] = React.useState(0);
    React.useEffect(()=>setSelected(0), [JSON.stringify((docs||[]).map(d=>d.title))]);
    const list = docs || [];
    const doc = list[selected] || list[0];
    if (!doc) return <div style={{ padding:18, background:'#fff', border:'1px solid var(--line)', borderRadius:16 }}>No hay documento configurado para esta sección.</div>;

    return <div className="pi119-viewer" style={{ display:'grid', gridTemplateColumns:'minmax(250px,340px) 1fr', gap:14, alignItems:'start' }}>
      <div className="pi119-list" style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, padding:12, display:'grid', gap:8, maxHeight:'78vh', overflowY:'auto' }}>
        {list.map((d,i)=><ProgramInfoDocButtonCS21A119 key={d.code + d.title} doc={d} selected={i===selected} onClick={()=>setSelected(i)} />)}
      </div>
      <div className="pi119-preview" style={{ background:'#fff', border:'1px solid var(--line,#e5e0d8)', borderRadius:16, overflow:'hidden', minHeight:590 }}>
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

  function ProgramInfoSharedCS21A119(){
    return <section className="pi119-page" data-screen-label="Información General del Programa · CS21A119" style={{ padding:18 }}>
      <ProgramInfoHeaderCS21A119 />
      <ProgramInfoViewerCS21A119 docs={INFO_DOCS_CS21A119} />
    </section>;
  }

  window.ProgramInfoSharedCS21A119 = ProgramInfoSharedCS21A119;
  window.INFO_DOCS_CS21A119 = INFO_DOCS_CS21A119;
  window.CS21A119_PROGRAM_INFO_SHARED = 'F98.4-Z6-CS21A119';
})();
