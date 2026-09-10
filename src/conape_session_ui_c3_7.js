/* global window, document, sessionStorage */
(function conapeSessionUiC371(){
  'use strict';
  const PROMPT_KEY='an_conape_prompted_c37';
  const ID='an-conape-session-c37';
  let busy=false;
  let last={status:'DISCONNECTED',connected:false};
  let progressTimer=null;
  let progressValue=0;

  function api(){ return window.CONAPE_PORTAL_BRIDGE_C37||null; }
  function token(){ try{return window.getSessionToken?window.getSessionToken():'';}catch{return '';} }
  function role(){ try{const s=window.getSesion?window.getSesion():null;return String(s?.rol||s?.role||'').toLowerCase();}catch{return '';} }
  function allowed(){ const r=role();return !r||['ventas','asesor','asesora','admin','administrador','superadmin','super admin'].includes(r); }

  function ensureStyles(){
    if(document.getElementById(ID+'-style')) return;
    const s=document.createElement('style'); s.id=ID+'-style';
    s.textContent=`
      #${ID}-bar{position:fixed;top:78px;right:18px;z-index:99980;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #d9e2ef;border-radius:12px;padding:8px 10px;box-shadow:0 8px 24px rgba(16,42,67,.16);font:600 12px Poppins,Arial,sans-serif;color:#173b67}
      #${ID}-dot{width:9px;height:9px;border-radius:50%;background:#98a2b3;box-shadow:0 0 0 3px rgba(152,162,179,.14)}
      #${ID}-bar[data-state="CONNECTED"] #${ID}-dot{background:#12a150;box-shadow:0 0 0 3px rgba(18,161,80,.14)}
      #${ID}-bar[data-state="CONNECTING"] #${ID}-dot{background:#f59e0b;animation:anConapePulse 1s infinite}
      #${ID}-bar[data-state="ERROR"] #${ID}-dot{background:#d92d20}
      #${ID}-bar button{border:0;border-radius:8px;padding:6px 9px;background:#0b66c3;color:#fff;font:600 11px Poppins,Arial,sans-serif;cursor:pointer}
      #${ID}-bar button:disabled{opacity:.55;cursor:wait}
      #${ID}-overlay{position:fixed;inset:0;z-index:99990;background:rgba(4,24,48,.48);display:flex;align-items:center;justify-content:center;padding:20px}
      #${ID}-modal{width:min(460px,92vw);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);padding:24px;font-family:Poppins,Arial,sans-serif;color:#12355d}
      #${ID}-modal h3{margin:0 0 18px;font-size:19px}
      #${ID}-actions{display:flex;justify-content:flex-end;gap:10px}
      #${ID}-actions button{border:0;border-radius:10px;padding:10px 14px;font:600 12px Poppins,Arial,sans-serif;cursor:pointer}
      #${ID}-later{background:#eef3f8;color:#27496e} #${ID}-connect{background:#0b66c3;color:#fff}
      #${ID}-error{margin:12px 0 0;padding:10px 12px;border-radius:9px;background:#fff1f0;color:#b42318;font-size:12px;display:none}
      #${ID}-progress-wrap{display:none}
      #${ID}-progress-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;font:700 13px Poppins,Arial,sans-serif;color:#173b67}
      #${ID}-progress-track{height:9px;border-radius:999px;background:#e7edf5;overflow:hidden}
      #${ID}-progress-fill{height:100%;width:0%;border-radius:inherit;background:#0b66c3;transition:width .28s ease}
      @keyframes anConapePulse{50%{opacity:.35}}
      @media(max-width:720px){#${ID}-bar{top:70px;right:8px}}
    `;
    document.head.appendChild(s);
  }

  function labelFor(state){
    if(state==='CONNECTED') return 'CONAPE conectado';
    if(state==='CONNECTING') return 'Conectando..';
    if(state==='ERROR') return 'CONAPE desconectado';
    return 'CONAPE sin conectar';
  }

  function renderBar(){
    ensureStyles();
    let bar=document.getElementById(ID+'-bar');
    if(!bar){
      bar=document.createElement('div'); bar.id=ID+'-bar';
      bar.innerHTML=`<span id="${ID}-dot"></span><span id="${ID}-label"></span><button id="${ID}-barbtn" type="button">Conectar</button>`;
      document.body.appendChild(bar);
      document.getElementById(ID+'-barbtn').addEventListener('click',()=>connectNow(true));
    }
    bar.dataset.state=last.status||'DISCONNECTED';
    document.getElementById(ID+'-label').textContent=labelFor(last.status);
    const btn=document.getElementById(ID+'-barbtn');
    btn.style.display=last.connected?'none':'';
    btn.disabled=busy;
  }

  function closePrompt(){
    if(progressTimer){clearInterval(progressTimer);progressTimer=null;}
    document.getElementById(ID+'-overlay')?.remove();
  }

  function showPrompt(){
    if(document.getElementById(ID+'-overlay')) return;
    ensureStyles();
    const o=document.createElement('div'); o.id=ID+'-overlay';
    o.innerHTML=`<div id="${ID}-modal" role="dialog" aria-modal="true" aria-labelledby="${ID}-title">
      <div id="${ID}-prompt-wrap">
        <h3 id="${ID}-title">¿Conectar CONAPE en línea?</h3>
        <div id="${ID}-actions"><button id="${ID}-later" type="button">Ahora no</button><button id="${ID}-connect" type="button">Conectar CONAPE</button></div>
      </div>
      <div id="${ID}-progress-wrap">
        <div id="${ID}-progress-head"><span>Conectando..</span><span id="${ID}-progress-pct">0%</span></div>
        <div id="${ID}-progress-track"><div id="${ID}-progress-fill"></div></div>
      </div>
      <div id="${ID}-error"></div>
    </div>`;
    document.body.appendChild(o);
    document.getElementById(ID+'-later').addEventListener('click',()=>{try{sessionStorage.setItem(PROMPT_KEY,'1');}catch{} closePrompt();});
    document.getElementById(ID+'-connect').addEventListener('click',()=>connectNow(false));
  }

  function startProgress(){
    progressValue=0;
    const prompt=document.getElementById(ID+'-prompt-wrap');
    const wrap=document.getElementById(ID+'-progress-wrap');
    const fill=document.getElementById(ID+'-progress-fill');
    const pct=document.getElementById(ID+'-progress-pct');
    const err=document.getElementById(ID+'-error');
    if(prompt) prompt.style.display='none';
    if(wrap) wrap.style.display='block';
    if(err){err.style.display='none';err.textContent='';}
    const paint=()=>{if(fill) fill.style.width=`${progressValue}%`;if(pct)pct.textContent=`${progressValue}%`;};
    paint();
    if(progressTimer) clearInterval(progressTimer);
    progressTimer=setInterval(()=>{
      const remaining=92-progressValue;
      if(remaining<=0) return;
      progressValue+=Math.max(1,Math.ceil(remaining/8));
      if(progressValue>92) progressValue=92;
      paint();
    },380);
  }

  function finishProgress(){
    if(progressTimer){clearInterval(progressTimer);progressTimer=null;}
    progressValue=100;
    const fill=document.getElementById(ID+'-progress-fill');
    const pct=document.getElementById(ID+'-progress-pct');
    if(fill) fill.style.width='100%';
    if(pct) pct.textContent='100%';
  }

  function resetPromptAfterError(message){
    if(progressTimer){clearInterval(progressTimer);progressTimer=null;}
    const prompt=document.getElementById(ID+'-prompt-wrap');
    const wrap=document.getElementById(ID+'-progress-wrap');
    const err=document.getElementById(ID+'-error');
    const btn=document.getElementById(ID+'-connect');
    if(prompt) prompt.style.display='block';
    if(wrap) wrap.style.display='none';
    if(err){err.textContent=message;err.style.display='block';}
    if(btn){btn.disabled=false;btn.textContent='Reintentar';}
  }

  function humanError(data){
    const code=String(data?.error||'');
    if(code==='CAMPUS_BACKEND_UNAVAILABLE') return 'El Campus tardó demasiado. Reintentá en unos segundos.';
    if(code==='CONAPE_LOGIN_FAILED') return 'CONAPE no terminó de confirmar la conexión.';
    if(code==='CONAPE_PROSPECTO_NOT_READY') return 'CONAPE conectó, pero no pudo preparar Prospectos.';
    if(code==='conape_bridge_unavailable') return 'No se pudo contactar CONAPE.';
    return data?.message||code||'No se pudo conectar CONAPE.';
  }

  async function connectNow(fromBar){
    const bridge=api(); if(!bridge||busy) return;
    busy=true; last={...last,status:'CONNECTING',connected:false}; renderBar();
    if(!document.getElementById(ID+'-overlay')) showPrompt();
    startProgress();
    const result=await bridge.connect();
    busy=false;
    if(result?.ok&&result?.connected){
      last=result; finishProgress(); renderBar();
      try{sessionStorage.setItem(PROMPT_KEY,'1');}catch{}
      window.dispatchEvent(new CustomEvent('an:conape-connected',{detail:result}));
      setTimeout(closePrompt,350);
      return;
    }
    last={...(result?.session||result||{}),status:'ERROR',connected:false}; renderBar();
    resetPromptAfterError(humanError(result));
  }

  async function refreshStatus(){
    const bridge=api(); if(!bridge||!token()||busy) return;
    const result=await bridge.status();
    if(result?.ok){last=result;renderBar();}
  }

  async function boot(){
    if(!allowed()) return;
    let tries=0;
    while((!api()||!token())&&tries<80){await new Promise(r=>setTimeout(r,250));tries+=1;}
    if(!api()||!token()) return;
    renderBar();
    await refreshStatus();
    if(!last.connected){let prompted=false;try{prompted=sessionStorage.getItem(PROMPT_KEY)==='1';}catch{}if(!prompted)showPrompt();}
    setInterval(refreshStatus,60000);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500),{once:true}); else setTimeout(boot,500);
})();
