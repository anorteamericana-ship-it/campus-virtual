// F98.4-Z6-CS21A54 · Visor docente extendido a pantalla completa
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION='F98.4-Z6-CS21A54';
  const BLUE='var(--an-navy-ink,#001E47)';
  const CACHE=new Map();
  const UNIT=[2,8,16,22,30,36,44,50,58,64,72,78,86,92,100,106]
    .map((sb,i)=>({unit:i+1,sb,pdf:sb+6}));
  const TONES={
    SB:{solid:'#0B4A8B',soft:'#E8F2FC',border:'#2872B6'},
    TB:{solid:'#7A1E2C',soft:'#F9EDEF',border:'#A94A59'},
    WB:{solid:'#237A3B',soft:'#EAF6ED',border:'#4D9B62'},
  };
  const LEVELS=[
    {code:'B1',name:'Básico I',color:'#F2C94C',folder:'1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH',
      SB:{id:'1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea',title:'Interchange 5th intro-SB.pdf',pages:157},
      TB:{id:'14NQtUMU6LDt8cVaew4uTTdiqOQbX0EHa',title:'Interchange 5th intro-TB.pdf'},
      WB:{id:'1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d',title:'Interchange 5th intro-WB.pdf'}},
    {code:'B2',name:'Básico II',color:'#DA291C',folder:'1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ',
      SB:{id:'1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2',title:'Interchange 5th 1-SB.pdf',pages:188},
      TB:{id:'1_hdqwozKTkR2gWT3fVwmyU_avLXopqt8',title:'Interchange 5th 1-TB.pdf'},
      WB:{id:'1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp',title:'Interchange 5th 1-WB.pdf'}},
    {code:'I1',name:'Intermedio I',color:'#2F6BE0',folder:'1h3MWODA07lGzUDepOtJV8JvxzqvLncAX',
      SB:{id:'14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch',title:'Interchange 5th 2-SB.pdf',pages:158},
      TB:{id:'1POcwOVbXJvEtnivu7x3iDtq6T_6-_1do',title:'Interchange 5th 2-TB.pdf'},
      WB:{id:'18griDamY2oTzNFwmxhP10Ie4BfKJTiIY',title:'Interchange 5th 2-WB.pdf'}},
    {code:'I2',name:'Intermedio II',color:'#2E7D32',folder:'1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP',
      SB:{id:'1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB',title:'Interchange 5th 3-SB.pdf',pages:161},
      TB:{id:'1FP9I35vPlCqNNqtLScVCTTqhREGwE1go',title:'Interchange 5th 3-TB.pdf'},
      WB:{id:'1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE',title:'Interchange 5th 3-WB.pdf'}},
  ];

  function ses(){
    try{
      return (typeof getSesion==='function'
        ? getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario')||'null'))||{};
    }catch(_){return{};}
  }
  function view(id){return'https://drive.google.com/file/d/'+id+'/view';}
  function download(id){return'https://drive.google.com/uc?export=download&id='+id;}
  function folder(id){return'https://drive.google.com/drive/folders/'+id;}
  function screen(){return sessionStorage.getItem('an_teacher_materiales_tab')||'info';}
  function fetchUrls(id){
    return[
      'https://drive.usercontent.google.com/download?id='+encodeURIComponent(id)+'&export=download&authuser=0&confirm=t',
      'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id),
    ];
  }

  async function loadPdf(id){
    if(!window.pdfjsLib)throw new Error('PDF.js no está disponible');
    if(CACHE.has(id))return CACHE.get(id);
    const pending=(async()=>{
      let lastError=null;
      for(const url of fetchUrls(id)){
        try{
          return await window.pdfjsLib.getDocument({url,withCredentials:false}).promise;
        }catch(error){
          lastError=error;
        }
      }
      throw lastError||new Error('Drive no entregó el PDF');
    })();
    CACHE.set(id,pending);
    try{
      return await pending;
    }catch(error){
      CACHE.delete(id);
      throw error;
    }
  }

  function PdfPage({pdf,pageNumber}){
    const canvasRef=React.useRef(null);
    const[status,setStatus]=React.useState('loading');

    React.useEffect(()=>{
      let cancelled=false;
      let renderTask=null;
      setStatus('loading');

      if(!pdf||!pageNumber||pageNumber>pdf.numPages){
        setStatus('empty');
        return()=>{cancelled=true;};
      }

      pdf.getPage(pageNumber)
        .then(page=>{
          if(cancelled||!canvasRef.current)return null;
          const pixelRatio=Math.min(window.devicePixelRatio||1,1.75);
          const viewport=page.getViewport({scale:1.55*pixelRatio});
          const canvas=canvasRef.current;
          canvas.width=Math.ceil(viewport.width);
          canvas.height=Math.ceil(viewport.height);
          renderTask=page.render({
            canvasContext:canvas.getContext('2d',{alpha:false}),
            viewport,
          });
          return renderTask.promise;
        })
        .then(()=>{if(!cancelled)setStatus('ready');})
        .catch(error=>{
          if(!cancelled&&String(error?.name||'')!=='RenderingCancelledException'){
            setStatus('error');
          }
        });

      return()=>{
        cancelled=true;
        try{if(renderTask)renderTask.cancel();}catch(_){}
      };
    },[pdf,pageNumber]);

    return <div style={{
      position:'relative',
      flex:'1 1 0',
      minWidth:0,
      background:'#fff',
      overflow:'hidden',
      boxShadow:'0 10px 34px rgba(0,0,0,.32)',
      aspectRatio:'.768/1',
    }}>
      {status==='loading'&&<div style={{
        position:'absolute',inset:0,display:'grid',placeItems:'center',
        fontSize:12,color:'#6f6a63',background:'#F7F4EF',
      }}>Cargando página {pageNumber}…</div>}
      {status==='empty'&&<div style={{
        position:'absolute',inset:0,display:'grid',placeItems:'center',
        fontSize:12,color:'#8A8177',background:'#fff',
      }}>Fin del libro</div>}
      {status==='error'&&<div style={{
        position:'absolute',inset:0,display:'grid',placeItems:'center',
        fontSize:12,color:'#9B2C2C',background:'#fff',
      }}>No se pudo renderizar la página.</div>}
      <canvas ref={canvasRef} style={{
        width:'100%',height:'100%',objectFit:'contain',
        display:status==='ready'?'block':'none',
      }}/>
      {status==='ready'&&<span style={{
        position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',
        padding:'3px 10px',borderRadius:999,background:'rgba(0,30,71,.82)',
        color:'#fff',fontSize:10,fontWeight:900,
      }}>{pageNumber}</span>}
    </div>;
  }

  function ExtendedSpread({doc,target}){
    const hostRef=React.useRef(null);
    const[pdf,setPdf]=React.useState(null);
    const[status,setStatus]=React.useState('loading');
    const[error,setError]=React.useState('');
    const[page,setPage]=React.useState(Math.max(1,Number(target)||1));
    const[zoom,setZoom]=React.useState(1);

    React.useEffect(()=>{
      let active=true;
      setStatus('loading');
      setPdf(null);
      setError('');
      loadPdf(doc.id)
        .then(value=>{
          if(active){
            setPdf(value);
            setStatus('ready');
          }
        })
        .catch(reason=>{
          if(active){
            setError(String(reason?.message||reason||''));
            setStatus('error');
          }
        });
      return()=>{active=false;};
    },[doc.id]);

    React.useEffect(()=>{
      setPage(Math.max(1,Number(target)||1));
    },[target,doc.id]);

    const total=pdf?.numPages||doc.pages||0;
    const left=page<=1?1:(page%2===0?page:page-1);
    const right=left+1;
    const canPrevious=left>1&&status==='ready';
    const canNext=status==='ready'&&(!total||right<total);

    const toggleFullscreen=()=>{
      const el=hostRef.current;
      if(!el)return;
      try{
        if(document.fullscreenElement){
          document.exitFullscreen();
        }else if(el.requestFullscreen){
          el.requestFullscreen();
        }
      }catch(_){}
    };

    return <div ref={hostRef} style={{
      width:'100%',
      minHeight:'calc(100vh - 250px)',
      background:'radial-gradient(circle at 50% 12%,#887664 0%,#4B4137 53%,#27231E 100%)',
      display:'flex',
      flexDirection:'column',
    }}>
      <div style={{
        padding:'10px 14px',
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        gap:10,
        flexWrap:'wrap',
        background:'rgba(12,18,27,.96)',
        color:'#fff',
        position:'sticky',
        top:0,
        zIndex:8,
      }}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <button className="btn" type="button" disabled={!canPrevious}
            onClick={()=>setPage(Math.max(1,left-2))}>←</button>
          <strong style={{fontSize:12.5}}>
            {status==='ready'
              ? `Páginas ${left}${right<=total?'–'+right:''}${total?' / '+total:''}`
              : 'Preparando libro…'}
          </strong>
          <button className="btn" type="button" disabled={!canNext}
            onClick={()=>setPage(total?Math.min(total,left+2):left+2)}>→</button>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}>
          <button className="btn" type="button"
            onClick={()=>setZoom(value=>Math.max(.72,+(value-.1).toFixed(2)))}>−</button>
          <span style={{minWidth:48,textAlign:'center',fontSize:11,fontWeight:900}}>
            {Math.round(zoom*100)}%
          </span>
          <button className="btn" type="button"
            onClick={()=>setZoom(value=>Math.min(1.55,+(value+.1).toFixed(2)))}>+</button>
          <button className="btn" type="button" onClick={toggleFullscreen}>Pantalla completa</button>
        </div>
      </div>

      {status==='loading'&&<div style={{
        flex:1,minHeight:620,display:'grid',placeItems:'center',
        color:'#fff',fontWeight:900,
      }}>Cargando el PDF extendido desde Drive…</div>}

      {status==='error'&&<div style={{
        flex:1,minHeight:620,display:'grid',placeItems:'center',padding:24,
      }}>
        <div style={{
          maxWidth:620,padding:'24px 26px',borderRadius:16,
          background:'#fff',border:'1px solid #E6C66A',textAlign:'center',
          boxShadow:'0 18px 50px rgba(0,0,0,.24)',
        }}>
          <div style={{fontSize:21,fontWeight:950,color:BLUE}}>
            No se pudo abrir el visor extendido
          </div>
          <div style={{marginTop:8,fontSize:13,lineHeight:1.55,color:'#6f6a63'}}>
            Google Drive bloqueó la lectura directa del archivo. No se restauró la vista anterior.
          </div>
          {error&&<div style={{marginTop:8,fontSize:10,color:'#8A8177'}}>{error}</div>}
          <div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap',marginTop:16}}>
            <button className="btn" type="button"
              onClick={()=>window.open(view(doc.id),'_blank','noopener,noreferrer')}>Abrir en Drive</button>
            <button className="btn btn-primary" type="button"
              onClick={()=>window.open(download(doc.id),'_blank','noopener,noreferrer')}>Descargar PDF</button>
          </div>
        </div>
      </div>}

      {status==='ready'&&<div style={{
        flex:1,
        overflow:'auto',
        padding:'22px 18px 34px',
      }}>
        <div style={{
          width:(zoom*100)+'%',
          minWidth:820,
          maxWidth:1900,
          margin:'0 auto',
          display:'flex',
          gap:0,
          alignItems:'stretch',
        }}>
          <PdfPage pdf={pdf} pageNumber={left}/>
          <div aria-hidden="true" style={{
            width:20,
            margin:'0 -10px',
            zIndex:3,
            background:'linear-gradient(90deg,rgba(0,0,0,.42),rgba(255,255,255,.18),rgba(0,0,0,.42))',
            boxShadow:'0 0 22px rgba(0,0,0,.46)',
          }}/>
          <PdfPage pdf={pdf} pageNumber={right<=total?right:0}/>
        </div>
      </div>}
    </div>;
  }

  function LevelButtons({level,setLevel}){
    return <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
      {LEVELS.map(item=>{
        const active=item.code===level;
        return <button key={item.code} type="button" className={active?'btn btn-primary':'btn'}
          onClick={()=>setLevel(item.code)}
          style={{
            minHeight:42,padding:'0 13px',fontWeight:900,
            border:active?'1px solid transparent':'1px solid var(--line,#ddd)',
          }}>
          <span style={{
            display:'inline-block',width:10,height:10,borderRadius:99,
            background:item.color,marginRight:7,
          }}/>
          {item.code} · {item.name}
        </button>;
      })}
    </div>;
  }

  function TypeButtons({type,setType}){
    return <div style={{display:'flex',gap:7,flexWrap:'wrap',alignItems:'center'}}>
      {['SB','TB','WB'].map(key=>{
        const tone=TONES[key];
        const active=type===key;
        return <button key={key} type="button" className="btn"
          onClick={()=>setType(key)} aria-pressed={active}
          style={{
            minWidth:66,height:42,padding:'0 13px',
            border:'2px solid '+tone.border,borderRadius:10,
            background:active?tone.solid:tone.soft,
            color:active?'#fff':tone.solid,
            fontWeight:950,fontSize:14,
            boxShadow:active?'0 4px 12px rgba(0,30,71,.2)':'none',
          }}>{key}</button>;
      })}
    </div>;
  }

  function UnitButtons({unit,onPick}){
    const current=UNIT[unit-1]||UNIT[0];
    return <div style={{
      padding:'10px 14px 12px',
      borderTop:'1px solid var(--line,#e5e0d8)',
      background:'linear-gradient(180deg,#FFFDF7,#FFF8E4)',
    }}>
      <div style={{
        display:'flex',justifyContent:'space-between',gap:10,
        flexWrap:'wrap',marginBottom:8,
      }}>
        <strong style={{fontSize:12.5,color:BLUE}}>Ir al inicio de la unidad</strong>
        <span style={{fontSize:10.5,fontWeight:850,color:'#6B5A35'}}>
          U{String(current.unit).padStart(2,'0')} · SB {current.sb} · PDF {current.pdf}
        </span>
      </div>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(16,minmax(42px,1fr))',
        gap:5,
        overflowX:'auto',
      }}>
        {UNIT.map(item=>{
          const active=item.unit===unit;
          return <button key={item.unit} type="button" onClick={()=>onPick(item)}
            title={`U${String(item.unit).padStart(2,'0')} · SB ${item.sb} · PDF ${item.pdf}`}
            style={{
              minHeight:34,padding:'4px 3px',
              border:active?'2px solid #F2C94C':'1px solid #D7B34A',
              borderRadius:8,
              background:active?'#0B4A8B':'#FFF7D6',
              color:active?'#fff':'#674D00',
              fontWeight:950,fontSize:10.5,cursor:'pointer',
            }}>U{String(item.unit).padStart(2,'0')}</button>;
        })}
      </div>
    </div>;
  }

  function Books({mode}){
    const library=mode==='biblioteca';
    const[level,setLevel]=React.useState('B1');
    const[type,setType]=React.useState(library?'TB':'SB');
    const[unit,setUnit]=React.useState(1);
    const[target,setTarget]=React.useState(library?1:UNIT[0].pdf);

    const selectedLevel=LEVELS.find(item=>item.code===level)||LEVELS[0];
    const realType=library?'TB':type;
    const entry=selectedLevel[realType];
    const doc={...entry,label:realType,level:selectedLevel.name};

    React.useEffect(()=>{
      setUnit(1);
      setTarget(realType==='SB'?UNIT[0].pdf:1);
    },[level,realType]);

    const pickUnit=item=>{
      setUnit(item.unit);
      setTarget(item.pdf);
    };

    return <section data-screen-label={'Docente · CS21A54 · '+mode}
      style={{padding:'10px 12px 18px',width:'100%',boxSizing:'border-box'}}>
      <div style={{
        width:'100%',
        background:'#fff',
        border:'1px solid var(--line,#e5e0d8)',
        borderRadius:16,
        overflow:'hidden',
        boxShadow:'0 8px 28px rgba(0,0,0,.06)',
      }}>
        <div style={{
          padding:'12px 14px',
          display:'flex',
          justifyContent:'space-between',
          alignItems:'center',
          gap:12,
          flexWrap:'wrap',
          borderBottom:'1px solid var(--line,#e5e0d8)',
        }}>
          <div style={{minWidth:220,flex:'1 1 260px'}}>
            <div style={{
              fontSize:10,fontWeight:950,letterSpacing:'.14em',
              textTransform:'uppercase',color:'var(--an-granate,#7A1E2C)',
            }}>Recursos Didácticos</div>
            <div style={{fontSize:24,fontWeight:950,color:BLUE,lineHeight:1.12,marginTop:2}}>
              {library?'Biblioteca digital':'Libros de texto'} · {selectedLevel.name}
            </div>
            <div style={{fontSize:11.5,color:'var(--ink-3,#6f6a63)',marginTop:4}}>
              {entry.title}
              {realType==='SB'
                ? ` · U${String(unit).padStart(2,'0')} · SB ${UNIT[unit-1].sb} / PDF ${UNIT[unit-1].pdf}`
                : ''}
            </div>
          </div>

          <div style={{
            display:'flex',gap:8,alignItems:'center',
            justifyContent:'flex-end',flexWrap:'wrap',
          }}>
            {!library&&<TypeButtons type={type} setType={setType}/>}
            <button className="btn" type="button"
              onClick={()=>window.open(folder(selectedLevel.folder),'_blank','noopener,noreferrer')}>
              Carpeta Drive
            </button>
            <button className="btn" type="button"
              onClick={()=>window.open(view(entry.id),'_blank','noopener,noreferrer')}>
              Abrir archivo
            </button>
            <button className="btn btn-primary" type="button"
              onClick={()=>window.open(download(entry.id),'_blank','noopener,noreferrer')}>
              Descargar PDF
            </button>
          </div>
        </div>

        <div style={{
          padding:'9px 14px',
          borderBottom:'1px solid var(--line,#e5e0d8)',
          background:'var(--surface-2,#F7F4EF)',
        }}>
          <LevelButtons level={level} setLevel={setLevel}/>
        </div>

        {!library&&realType==='SB'&&<UnitButtons unit={unit} onPick={pickUnit}/>}
        <ExtendedSpread key={entry.id} doc={doc} target={target}/>
      </div>
    </section>;
  }

  function install(){
    if(!window.MaterialesView||window.MaterialesView.__cs21a54books)return;
    const Base=window.MaterialesView;
    const Wrapped=function(props){
      const user=ses();
      if(!user||user.rol!=='teacher')return <Base {...props}/>;
      const activeScreen=screen();
      if(activeScreen==='libros')return <Books mode="libros" {...props}/>;
      if(activeScreen==='biblioteca')return <Books mode="biblioteca" {...props}/>;
      return <Base {...props}/>;
    };
    Wrapped.__cs21a54books=true;
    Wrapped.__base=Base;
    window.MaterialesView=Wrapped;
    try{MaterialesView=Wrapped;}catch(_){}
  }

  if(window.pdfjsLib?.GlobalWorkerOptions){
    window.pdfjsLib.GlobalWorkerOptions.workerSrc=
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  const run=()=>{try{install();}catch(_){}};
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',run,{once:true});
  }else{
    run();
  }
  window.addEventListener('an:lazy-module-loaded',()=>setTimeout(run,30));
  window.addEventListener('an:teacher-material-tab',()=>setTimeout(run,30));
  window.__AN_TEACHER_ORDER_FIX_VERSION__=VERSION;
  window.__AN_TEACHER_BOOK_VIEWS_VERSION__=VERSION;
})();