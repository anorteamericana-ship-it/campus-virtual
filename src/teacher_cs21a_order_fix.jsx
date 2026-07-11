// F98.4-Z6-CS21A53 · Libros docentes consolidados + visor doble PDF.js
/* global React, getSesion, MaterialesView */
(function(){
  const VERSION='F98.4-Z6-CS21A53';
  const BLUE='var(--an-navy-ink,#001E47)';
  const CACHE=new Map();
  const UNIT=[2,8,16,22,30,36,44,50,58,64,72,78,86,92,100,106].map((sb,i)=>({unit:i+1,sb,pdf:sb+6}));
  const TONES={SB:{a:'#0B4A8B',b:'#E8F2FC',c:'#2872B6'},TB:{a:'#7A1E2C',b:'#F9EDEF',c:'#A94A59'},WB:{a:'#237A3B',b:'#EAF6ED',c:'#4D9B62'}};
  const LEVELS=[
    {code:'B1',name:'Básico I',color:'#F2C94C',folder:'1GR4mLaR5wVpoFJ78P8j5KS--DCXwWyHH',SB:{id:'1pnR7RoJGkZnx08TlfrEgxEqVRnlrCwea',title:'Interchange 5th intro-SB.pdf',pages:157},TB:{id:'14NQtUMU6LDt8cVaew4uTTdiqOQbX0EHa',title:'Interchange 5th intro-TB.pdf'},WB:{id:'1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d',title:'Interchange 5th intro-WB.pdf'}},
    {code:'B2',name:'Básico II',color:'#DA291C',folder:'1BpIzdHI1hd5ucmzOfYo9WnIc4yAtE2SJ',SB:{id:'1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2',title:'Interchange 5th 1-SB.pdf',pages:188},TB:{id:'1_hdqwozKTkR2gWT3fVwmyU_avLXopqt8',title:'Interchange 5th 1-TB.pdf'},WB:{id:'1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp',title:'Interchange 5th 1-WB.pdf'}},
    {code:'I1',name:'Intermedio I',color:'#2F6BE0',folder:'1h3MWODA07lGzUDepOtJV8JvxzqvLncAX',SB:{id:'14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch',title:'Interchange 5th 2-SB.pdf',pages:158},TB:{id:'1POcwOVbXJvEtnivu7x3iDtq6T_6-_1do',title:'Interchange 5th 2-TB.pdf'},WB:{id:'18griDamY2oTzNFwmxhP10Ie4BfKJTiIY',title:'Interchange 5th 2-WB.pdf'}},
    {code:'I2',name:'Intermedio II',color:'#2E7D32',folder:'1Nco9Iwcz3P9ARMLP39HKo2AXTZJ4H3FP',SB:{id:'1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB',title:'Interchange 5th 3-SB.pdf',pages:161},TB:{id:'1FP9I35vPlCqNNqtLScVCTTqhREGwE1go',title:'Interchange 5th 3-TB.pdf'},WB:{id:'1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE',title:'Interchange 5th 3-WB.pdf'}}
  ];

  function ses(){try{return(typeof getSesion==='function'?getSesion():JSON.parse(sessionStorage.getItem('an_usuario')||'null'))||{};}catch(_){return{};}}
  function preview(id){return'https://drive.google.com/file/d/'+id+'/preview';}
  function view(id){return'https://drive.google.com/file/d/'+id+'/view';}
  function download(id){return'https://drive.google.com/uc?export=download&id='+id;}
  function folder(id){return'https://drive.google.com/drive/folders/'+id;}
  function fetchUrls(id){return[
    'https://drive.usercontent.google.com/download?id='+encodeURIComponent(id)+'&export=download&authuser=0&confirm=t',
    'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id)
  ];}
  function screen(){return sessionStorage.getItem('an_teacher_materiales_tab')||'info';}

  async function loadPdf(id){
    if(!window.pdfjsLib)throw new Error('PDF.js no está disponible');
    if(CACHE.has(id))return CACHE.get(id);
    const p=(async()=>{let last;for(const url of fetchUrls(id)){try{return await window.pdfjsLib.getDocument({url,withCredentials:false}).promise;}catch(e){last=e;}}throw last||new Error('Drive no entregó el PDF');})();
    CACHE.set(id,p);
    try{return await p;}catch(e){CACHE.delete(id);throw e;}
  }

  function Page({pdf,n}){
    const ref=React.useRef(null);const[st,setSt]=React.useState('load');
    React.useEffect(()=>{let dead=false,task=null;setSt('load');if(!pdf||!n||n>pdf.numPages){setSt('empty');return()=>{dead=true;};}
      pdf.getPage(n).then(pg=>{if(dead||!ref.current)return;const vp=pg.getViewport({scale:1.45});const c=ref.current;c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);task=pg.render({canvasContext:c.getContext('2d',{alpha:false}),viewport:vp});return task.promise;}).then(()=>{if(!dead)setSt('ok');}).catch(e=>{if(!dead&&String(e?.name||'')!=='RenderingCancelledException')setSt('error');});
      return()=>{dead=true;try{task&&task.cancel();}catch(_){}};
    },[pdf,n]);
    return <div style={{position:'relative',flex:'1 1 0',minWidth:0,background:'#fff',borderRadius:4,overflow:'hidden',boxShadow:'0 8px 26px rgba(0,0,0,.23)',aspectRatio:'.768/1'}}>
      {st==='load'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:12,color:'#6f6a63',background:'#F7F4EF'}}>Cargando página {n}…</div>}
      {st==='empty'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:12,color:'#8A8177'}}>Fin del libro</div>}
      {st==='error'&&<div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',fontSize:12,color:'#9B2C2C'}}>No se pudo renderizar.</div>}
      <canvas ref={ref} style={{width:'100%',height:'100%',objectFit:'contain',display:st==='ok'?'block':'none'}}/>
      {st==='ok'&&<span style={{position:'absolute',bottom:7,left:'50%',transform:'translateX(-50%)',padding:'3px 9px',borderRadius:999,background:'rgba(0,30,71,.78)',color:'#fff',fontSize:10,fontWeight:800}}>{n}</span>}
    </div>;
  }

  function Spread({doc,target}){
    const[pdf,setPdf]=React.useState(null),[status,setStatus]=React.useState('load'),[err,setErr]=React.useState(''),[page,setPage]=React.useState(target||1),[zoom,setZoom]=React.useState(1);
    React.useEffect(()=>{let alive=true;setStatus('load');setPdf(null);setErr('');loadPdf(doc.id).then(x=>{if(alive){setPdf(x);setStatus('ok');}}).catch(e=>{if(alive){setErr(String(e?.message||e||''));setStatus('fallback');}});return()=>{alive=false;};},[doc.id]);
    React.useEffect(()=>setPage(Math.max(1,Number(target)||1)),[target,doc.id]);
    if(status==='fallback')return <div><div style={{padding:'10px 14px',background:'#FFF4D8',borderBottom:'1px solid #E4C36B',fontSize:11.5,color:'#6B4D00'}}>El navegador bloqueó la lectura directa para el modo de dos páginas. Se mantiene el visor de Drive para no dejar el libro vacío.{err?' '+err:''}</div><iframe title={doc.title} src={doc.preview} style={{width:'100%',height:'72vh',minHeight:540,border:0,display:'block'}} allow="autoplay"/></div>;
    const total=pdf?.numPages||doc.pages||0;const left=page<=1?1:(page%2===0?page:page-1);const right=left+1;
    return <div style={{background:'radial-gradient(circle at 50% 18%,#7A6A58 0%,#40382F 58%,#29251F 100%)',minHeight:570}}>
      <div style={{padding:'10px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',background:'rgba(16,22,31,.92)',color:'#fff'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}><button className="btn" type="button" disabled={left<=1||status!=='ok'} onClick={()=>setPage(Math.max(1,left-2))}>←</button><strong style={{fontSize:12.5}}>Páginas {left}{right<=total?'–'+right:''}{total?' / '+total:''}</strong><button className="btn" type="button" disabled={(total&&right>=total)||status!=='ok'} onClick={()=>setPage(total?Math.min(total,left+2):left+2)}>→</button></div>
        <div style={{display:'flex',alignItems:'center',gap:7}}><button className="btn" type="button" onClick={()=>setZoom(z=>Math.max(.72,+(z-.1).toFixed(2)))}>−</button><span style={{minWidth:48,textAlign:'center',fontSize:11,fontWeight:800}}>{Math.round(zoom*100)}%</span><button className="btn" type="button" onClick={()=>setZoom(z=>Math.min(1.55,+(z+.1).toFixed(2)))}>+</button></div>
      </div>
      {status==='load'?<div style={{minHeight:540,display:'grid',placeItems:'center',color:'#fff',fontWeight:800}}>Cargando el libro desde Drive…</div>:<div style={{overflow:'auto',padding:'24px 20px 32px'}}><div style={{width:(zoom*100)+'%',minWidth:760,maxWidth:1500,margin:'0 auto',display:'flex',gap:4,alignItems:'stretch'}}><Page pdf={pdf} n={left}/><div aria-hidden="true" style={{width:16,margin:'0 -10px',zIndex:3,background:'linear-gradient(90deg,rgba(0,0,0,.28),rgba(255,255,255,.25),rgba(0,0,0,.28))',boxShadow:'0 0 18px rgba(0,0,0,.35)'}}/><Page pdf={pdf} n={right<=total?right:0}/></div></div>}
    </div>;
  }

  function TypeButtons({type,setType}){return <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{['SB','TB','WB'].map(t=>{const q=TONES[t],on=type===t;return <button key={t} type="button" className="btn" onClick={()=>setType(t)} aria-pressed={on} style={{minWidth:72,height:48,border:'2px solid '+q.c,borderRadius:11,background:on?q.a:q.b,color:on?'#fff':q.a,fontWeight:950,fontSize:15,boxShadow:on?'0 5px 14px rgba(0,30,71,.22)':'none'}}>{t}</button>;})}</div>;
  function Units({unit,onPick}){const cur=UNIT[unit-1]||UNIT[0];return <div style={{padding:'11px 14px 12px',borderBottom:'1px solid var(--line,#e5e0d8)',background:'linear-gradient(180deg,#FFFDF7,#FFF8E4)'}}><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:9}}><strong style={{fontSize:12.5,color:BLUE}}>Ir al inicio de la unidad</strong><span style={{fontSize:10.5,fontWeight:850,color:'#6B5A35'}}>U{String(cur.unit).padStart(2,'0')} · SB {cur.sb} · PDF {cur.pdf}</span></div><div style={{display:'grid',gridTemplateColumns:'repeat(8,minmax(46px,1fr))',gap:6}}>{UNIT.map(x=>{const on=x.unit===unit;return <button key={x.unit} type="button" onClick={()=>onPick(x)} style={{minHeight:36,border:on?'2px solid #F2C94C':'1px solid #D7B34A',borderRadius:9,background:on?'#0B4A8B':'#FFF7D6',color:on?'#fff':'#674D00',fontWeight:950,fontSize:11,cursor:'pointer'}}>U{String(x.unit).padStart(2,'0')}</button>;})}</div></div>;}

  function Books({mode}){
    const library=mode==='biblioteca';const[level,setLevel]=React.useState('B1'),[type,setType]=React.useState(library?'TB':'SB'),[unit,setUnit]=React.useState(1),[target,setTarget]=React.useState(library?1:UNIT[0].pdf);
    const lvl=LEVELS.find(x=>x.code===level)||LEVELS[0],real=library?'TB':type,entry=lvl[real],doc={...entry,label:real,level:lvl.name,folder:lvl.folder,preview:preview(entry.id)};
    React.useEffect(()=>{setUnit(1);setTarget(real==='SB'?UNIT[0].pdf:1);},[level,real]);
    const pick=x=>{setUnit(x.unit);setTarget(x.pdf);};
    return <section data-screen-label={'Docente · CS21A53 · '+mode} style={{padding:18}}>
      <div style={{background:'linear-gradient(135deg,#fff,#F8F4EE)',border:'1px solid var(--line,#e5e0d8)',borderRadius:18,padding:'18px 20px',marginBottom:14}}><div style={{fontSize:11,fontWeight:950,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--an-granate,#7A1E2C)'}}>Recursos Didácticos</div><div style={{fontSize:31,fontWeight:950,color:BLUE,marginTop:4}}>{library?'Biblioteca digital':'Libros de texto'}</div><div style={{fontSize:13,color:'var(--ink-3,#6f6a63)',marginTop:7}}>{library?'Teacher Book en formato de libro abierto.':'SB, TB y WB en formato de libro abierto; U01–U16 navega el Student Book.'}</div></div>
      <div style={{display:'grid',gridTemplateColumns:'minmax(250px,330px) minmax(0,1fr)',gap:14,alignItems:'start'}}>
        <aside style={{background:'#fff',border:'1px solid var(--line,#e5e0d8)',borderRadius:16,padding:12,display:'grid',gap:8,position:'sticky',top:12}}>{LEVELS.map(x=>{const on=x.code===level;return <button key={x.code} type="button" className={on?'btn btn-primary':'btn'} onClick={()=>setLevel(x.code)} style={{textAlign:'left',justifyContent:'flex-start',padding:12,height:'auto'}}><span style={{display:'inline-flex',width:34,height:34,borderRadius:12,alignItems:'center',justifyContent:'center',marginRight:10,fontWeight:950,background:on?'rgba(255,255,255,.2)':x.color,color:on?'#fff':'#001E47'}}>{x.code}</span><span><strong style={{display:'block'}}>{library?'Biblioteca digital':'Libros de texto'} · {x.name}</strong><small>{library?x.TB.title:'SB · TB · WB'}</small></span></button>;})}</aside>
        <div style={{background:'#fff',border:'1px solid var(--line,#e5e0d8)',borderRadius:16,overflow:'hidden',minHeight:590}}>
          <div style={{padding:'14px 16px',borderBottom:'1px solid var(--line,#e5e0d8)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><div><div style={{fontSize:22,fontWeight:950,color:BLUE}}>{library?'Biblioteca digital':'Libros de texto'} · {lvl.name}</div><div style={{fontSize:12,color:'var(--ink-3,#6f6a63)',marginTop:4}}>{entry.title}{real==='SB'?' · U'+String(unit).padStart(2,'0')+' · SB '+UNIT[unit-1].sb+' / PDF '+UNIT[unit-1].pdf:''}</div><a href={folder(lvl.folder)} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',marginTop:5,color:'#0B4A8B',fontSize:10.5,fontWeight:800,textDecoration:'none'}}>Fuente: carpeta oficial de Drive ↗</a></div><div style={{display:'flex',gap:9,flexWrap:'wrap',alignItems:'center'}}>{!library&&<TypeButtons type={type} setType={setType}/>}<button className="btn" type="button" onClick={()=>window.open(view(entry.id),'_blank','noopener,noreferrer')} style={{minHeight:48,fontWeight:900}}>Abrir en Drive</button><button className="btn btn-primary" type="button" onClick={()=>window.open(download(entry.id),'_blank','noopener,noreferrer')} style={{minHeight:48,fontWeight:900}}>Descargar PDF</button></div></div>
          {!library&&real==='SB'&&<Units unit={unit} onPick={pick}/>}<Spread key={entry.id} doc={doc} target={target}/>
        </div>
      </div>
    </section>;
  }

  function install(){if(!window.MaterialesView||window.MaterialesView.__cs21a53books)return;const Base=window.MaterialesView;const Wrapped=function(props){const u=ses();if(!u||u.rol!=='teacher')return <Base {...props}/>;const s=screen();if(s==='libros')return <Books mode="libros" {...props}/>;if(s==='biblioteca')return <Books mode="biblioteca" {...props}/>;return <Base {...props}/>;};Wrapped.__cs21a53books=true;Wrapped.__base=Base;window.MaterialesView=Wrapped;try{MaterialesView=Wrapped;}catch(_){}}
  if(window.pdfjsLib?.GlobalWorkerOptions)window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const run=()=>{try{install();}catch(_){}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  window.addEventListener('an:lazy-module-loaded',()=>setTimeout(run,30));
  window.addEventListener('an:teacher-material-tab',()=>setTimeout(run,30));
  window.__AN_TEACHER_ORDER_FIX_VERSION__=VERSION;window.__AN_TEACHER_BOOK_VIEWS_VERSION__=VERSION;
})();
