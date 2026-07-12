// F98.4-Z6-CS21A60 · Recursos Didácticos visibles para superadmin
/* global React, ReactDOM, Sidebar */
(function(){
  const R='recursos_didacticos', T='an_admin_resources_tab', O='an_admin_resources_open', M='an_teacher_materiales_tab', E='an:admin-resource-tab';
  const tab=()=>sessionStorage.getItem(T)==='audios'?'audios':'libros';
  function open(kind,setActive){
    sessionStorage.setItem(O,'1'); sessionStorage.setItem(T,kind); sessionStorage.setItem(M,kind);
    window.dispatchEvent(new CustomEvent(E,{detail:{tab:kind}}));
    if(typeof setActive==='function') setActive(R);
  }
  function Portal({active,setActive}){
    const [host,setHost]=React.useState(null), [selected,setSelected]=React.useState(tab);
    React.useEffect(()=>{
      let node=document.getElementById('an-superadmin-resources-cs21a60');
      const aside=document.querySelector('aside.admin-sb');
      if(!aside) return;
      if(!node){ node=document.createElement('div'); node.id='an-superadmin-resources-cs21a60'; const user=aside.querySelector('.sb-user'); user?aside.insertBefore(node,user):aside.appendChild(node); }
      setHost(node); return()=>{ if(node?.parentNode) node.parentNode.removeChild(node); };
    },[]);
    React.useEffect(()=>{ const sync=e=>setSelected(e?.detail?.tab==='audios'?'audios':tab()); window.addEventListener(E,sync); return()=>window.removeEventListener(E,sync); },[]);
    if(!host) return null;
    const on=active===R&&sessionStorage.getItem(O)==='1';
    const button=(kind,label,icon)=><button type="button" className={`sb-item admin-sb-item ${on&&selected===kind?'active':''}`} onClick={()=>{setSelected(kind);open(kind,setActive);}}><span aria-hidden="true" style={{width:18,textAlign:'center',fontWeight:950}}>{icon}</span><span className="sb-label">{label}</span></button>;
    return ReactDOM.createPortal(<><div className="sb-section admin-sb-section">Recursos Didácticos</div>{button('libros','Libros de texto','▣')}{button('audios','Audios','♪')}</>,host);
  }
  function install(){
    const Base=window.Sidebar||(typeof Sidebar==='function'?Sidebar:null); if(!Base||Base.__cs21a60SuperResources) return false;
    const Wrapped=props=><><Base {...props}/>{String(props?.role||'').toLowerCase()==='superadmin'&&<Portal active={props.active} setActive={props.setActive}/>}</>;
    Wrapped.__cs21a60SuperResources=true; Wrapped.__base=Base; window.Sidebar=Wrapped; try{Sidebar=Wrapped;}catch(_){} return true;
  }
  install(); window.addEventListener('an:lazy-module-loaded',()=>setTimeout(install,20));
  const probe=setInterval(()=>{if(install())clearInterval(probe);},250); setTimeout(()=>clearInterval(probe),20000);
})();
