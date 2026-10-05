/* global window, document */
(function conapeSessionUiC373(){
  'use strict';

  const ID='an-conape-session-c37';
  let last={status:'DISCONNECTED',connected:false};

  function api(){ return window.CONAPE_PORTAL_BRIDGE_C37||null; }
  function token(){ try{return window.getSessionToken?window.getSessionToken():'';}catch{return '';} }
  function role(){ try{const s=window.getSesion?window.getSesion():null;return String(s?.rol||s?.role||'').toLowerCase();}catch{return '';} }
  function allowed(){ const r=role();return !r||['ventas','asesor','asesora','admin','administrador','superadmin','super admin'].includes(r); }

  function ensureStyles(){
    if(document.getElementById(ID+'-style')) return;
    const s=document.createElement('style');
    s.id=ID+'-style';
    s.textContent=`
      #${ID}-bar{position:fixed;top:78px;right:18px;z-index:99980;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d9e2ef;border-radius:12px;padding:8px 10px;box-shadow:0 8px 24px rgba(16,42,67,.16);font:600 12px Poppins,Arial,sans-serif;color:#173b67}
      #${ID}-dot{width:9px;height:9px;border-radius:50%;background:#98a2b3;box-shadow:0 0 0 3px rgba(152,162,179,.14)}
      #${ID}-bar[data-state="CONNECTED"] #${ID}-dot{background:#12a150;box-shadow:0 0 0 3px rgba(18,161,80,.14)}
      #${ID}-bar[data-state="CONNECTING"] #${ID}-dot{background:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.14)}
      #${ID}-bar[data-state="ERROR"] #${ID}-dot{background:#d92d20;box-shadow:0 0 0 3px rgba(217,45,32,.14)}
      @media(max-width:720px){#${ID}-bar{top:70px;right:8px}}
    `;
    document.head.appendChild(s);
  }

  function labelFor(state){
    if(state==='CONNECTED') return 'Sesión CONAPE activa';
    if(state==='CONNECTING') return 'Sesión CONAPE iniciando';
    return 'Sesión CONAPE inactiva';
  }

  function renderBar(){
    ensureStyles();
    let bar=document.getElementById(ID+'-bar');
    if(!bar){
      bar=document.createElement('div');
      bar.id=ID+'-bar';
      bar.setAttribute('role','status');
      bar.setAttribute('aria-live','polite');
      bar.title='Indicador de sesión. Para actualizar datos use Actualizar CONAPE.';
      bar.innerHTML=`<span id="${ID}-dot"></span><span id="${ID}-label"></span>`;
      document.body.appendChild(bar);
    }
    bar.dataset.state=last.status||'DISCONNECTED';
    document.getElementById(ID+'-label').textContent=labelFor(last.status);
  }

  async function refreshStatus(){
    const bridge=api();
    if(!bridge||!token()) return;
    try{
      const result=await bridge.status();
      if(result?.ok){
        last=result;
      }else{
        last={status:'ERROR',connected:false};
      }
    }catch{
      last={status:'ERROR',connected:false};
    }
    renderBar();
  }

  async function boot(){
    if(!allowed()) return;
    let tries=0;
    while((!api()||!token())&&tries<80){
      await new Promise(resolve=>setTimeout(resolve,250));
      tries+=1;
    }
    if(!api()||!token()) return;
    renderBar();
    await refreshStatus();
    window.addEventListener('an:conape-refresh-complete',refreshStatus);
    setInterval(refreshStatus,300000);
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500),{once:true});
  }else{
    setTimeout(boot,500);
  }
})();
