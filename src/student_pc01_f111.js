// F111 B1 PC01 · Mi Campus: acceso solo si la API autenticada confirma apertura.
(function(){
'use strict';
const TARGET='B1-KJ18-C3-0826';
const GROUP={cod_grupo:TARGET,nivel:'B1',leccion:4};
const seen=new WeakSet();
function e(tag,cl,txt){const x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=txt;return x}
async function api(fn,body){
 const token=window.getSessionToken?window.getSessionToken():'';
 const url=String(window.APPS_SCRIPT_URL||'');
 if(!token||!url)throw Error('Sin sesión');
 const res=await fetch(url+'?fn='+encodeURIComponent(fn),{
  method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify(Object.assign({fn,token},body||{}))
 });
 const result=await res.json();
 if(!res.ok||!result||result.ok!==true)throw Error('Sin autorización');
 return result;
}
function openQuiz(){
 if(!active)return;
 document.querySelectorAll('.f111-pc01-invite').forEach(x=>x.remove());
 const modal=e('div','f111-pc01-modal');modal.setAttribute('role','dialog');
 modal.setAttribute('aria-modal','true');modal.setAttribute('aria-label','Quiz 1 Básico I');
 const shell=e('div','f111-pc01-modal-inner');
 const bar=e('div','f111-pc01-modal-bar');
 bar.append(e('strong','','Quiz 1 · Básico I · Lección 4'));
 const close=e('button','','Cerrar');close.type='button';close.onclick=()=>modal.remove();
 bar.append(close);shell.append(bar);
 const url=new URL('modulos/qz_b1_pc01_digital.html',new URL('./',location.href));
 url.searchParams.set('live','1');
 url.searchParams.set('grupo',TARGET);
 const frame=e('iframe');frame.src=url.href;frame.title='Progress Check 01: respuesta y entrega';
 frame.setAttribute('referrerpolicy','same-origin');
 shell.append(frame);modal.append(shell);document.body.append(modal);
}
// El backend decide quién está matriculado y si Diego abrió el quiz.
// Una notificación nunca se fabrica desde el grupo visible ni desde la URL.
let active=false, lastToken='', notifiedToken='', lastChecked=0, inFlight=false;
const CHECK_INTERVAL=15000;
function currentToken(){return window.getSessionToken?String(window.getSessionToken()||''):''}
function isAvailable(r){
 return r&&r.ok===true&&r.disponible===true&&
 r.grupo===TARGET&&r.nivel==='B1'&&Number(r.leccion)===4&&Number(r.peso_oficial)===0;
}
function attach(){
 const screen=document.querySelector('section[data-screen-label="Estudiante · Evaluaciones"]');
 if(!screen||seen.has(screen))return;
 seen.add(screen);
 const box=e('section','f111-pc01-student');
 box.hidden=!active;
 box.dataset.f111StudentPc01='true';
 box.setAttribute('aria-label','Quizzes y Progress Check disponibles');
 box.append(e('small','','EVALUACIONES · PROGRESS CHECK'));
 box.append(e('strong','','Quiz 1 · Básico I'));
 box.append(e('p','','Lección 4 · Unidades 1–2 · 25 preguntas · Listening integrado'));
 const btn=e('button','','INICIAR QUIZ 1');
 btn.type='button';btn.addEventListener('click',openQuiz);box.append(btn);
 const slot=screen.querySelector('[role="tablist"],[role="tabpanel"]');
 if(slot)screen.insertBefore(box,slot);else screen.append(box);
}
function syncCard(){
 attach();
 document.querySelectorAll('[data-f111-student-pc01]').forEach(box=>{box.hidden=!active});
}
function showInvite(token){
 if(!active||!token||notifiedToken===token||document.querySelector('.f111-pc01-invite'))return;
 // Una sola invitación en este ingreso. Cerrar el anuncio NO cierra el quiz.
 notifiedToken=token;
 const overlay=e('div','f111-pc01-invite');
 overlay.setAttribute('role','alertdialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-labelledby','f111-pc01-invite-title');
 const content=e('div','f111-pc01-invite-inner');
 content.append(e('small','','ACADEMIA NORTEAMERICANA · NUEVA EVALUACIÓN'));
 const heading=e('h2','','¡Tu profesor habilitó el Quiz 1!');
 heading.id='f111-pc01-invite-title';content.append(heading);
 content.append(e('p','','Progress Check · Básico I · Lección 4 · Unidades 1–2.'));
 content.append(e('p','','Podés iniciarlo ahora o encontrarlo después en Evaluaciones, junto con las evaluaciones orales y escritas, mientras siga disponible.'));
 const actions=e('div','f111-pc01-invite-actions');
 const later=e('button','','VER MÁS TARDE');later.type='button';later.className='f111-pc01-later';
 later.onclick=()=>overlay.remove();
 const start=e('button','','INICIAR QUIZ 1');start.type='button';start.className='f111-pc01-start';
 start.onclick=()=>{overlay.remove();openQuiz()};
 actions.append(later,start);content.append(actions);overlay.append(content);
 overlay.addEventListener('click',event=>{if(event.target===overlay)overlay.remove()});
 document.body.append(overlay);start.focus();
}
async function checkActive(force){
 const token=currentToken();
 if(!token){active=false;lastToken='';lastChecked=0;syncCard();return;}
 if(inFlight)return;
 const now=Date.now();
 if(!force&&token===lastToken&&now-lastChecked<CHECK_INTERVAL){syncCard();return;}
 inFlight=true;lastToken=token;lastChecked=now;
 try{
  const r=await api('qzProgressStudentActive',{});
  if(token!==currentToken())return;
  active=isAvailable(r);syncCard();
  if(active)showInvite(token);
 }catch(_){
  if(token!==currentToken())return;
  // Ante falta de autenticación o backend, no anunciar una evaluación inexistente.
  active=false;syncCard();
 }finally{inFlight=false}
}
function style(){
 if(document.getElementById('f111-pc01-student-style'))return;
 const s=e('style');s.id='f111-pc01-student-style';
 s.textContent=[
 '.f111-pc01-student{padding:17px 20px;margin:12px 0;background:#fff9e5;border:1px solid #e6cc73;border-radius:13px;display:flex;flex-direction:column;align-items:flex-start;gap:5px}',
 '.f111-pc01-student[hidden]{display:none!important}',
 '.f111-pc01-student small{font-size:10px;color:#8a6211;font-weight:900;letter-spacing:.08em}',
 '.f111-pc01-student strong{display:block;color:#143b61;font-size:17px}',
 '.f111-pc01-student p{margin:6px 0 12px;color:#607590;font-size:12px}',
 '.f111-pc01-student button,.f111-pc01-start{background:#eac040;color:#183b61;border:1px solid #d2a930;border-radius:8px;padding:10px 16px;font-weight:850;cursor:pointer}',
 '.f111-pc01-modal{position:fixed;inset:0;z-index:49999;background:rgba(7,25,48,.75);display:flex;justify-content:center;align-items:center;padding:12px}',
 '.f111-pc01-modal-inner{display:flex;flex-direction:column;background:#f7f9fd;max-width:1150px;width:100%;height:96vh;border-radius:12px;overflow:hidden}',
 '.f111-pc01-modal-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 15px;color:#163a63;background:#fff}',
 '.f111-pc01-modal-bar button{border:1px solid #c8d4e2;background:white;border-radius:7px;padding:8px 14px;font-weight:700;cursor:pointer}',
 '.f111-pc01-modal iframe{border:0;width:100%;flex:1}',
 '.f111-pc01-invite{position:fixed;inset:0;z-index:49998;background:rgba(7,25,48,.64);display:flex;align-items:center;justify-content:center;padding:20px}',
 '.f111-pc01-invite-inner{width:min(460px,100%);padding:27px;background:#fff;border-radius:18px;box-shadow:0 18px 70px #001d3d44;color:#1e3f5e}',
 '.f111-pc01-invite-inner small{color:#9a751c;font-weight:900;font-size:10px;letter-spacing:.08em}',
 '.f111-pc01-invite-inner h2{font-size:23px;color:#153f67;margin:12px 0}',
 '.f111-pc01-invite-inner p{font-size:13px;line-height:1.6;color:#546e83}',
 '.f111-pc01-invite-actions{display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;margin-top:20px}',
 '.f111-pc01-later{background:#f3f6fb;color:#234b72;border:1px solid #d6e2ee;border-radius:8px;padding:10px 16px;font-weight:750;cursor:pointer}'
 ].join('\n');document.head.append(s);
}
function install(){
 const root=document.getElementById('root');if(!root)return;
 style();attach();void checkActive(true);
 let queued=false;
 new MutationObserver(()=>{
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;attach();void checkActive(false)});
 }).observe(root,{childList:true,subtree:true});
 window.addEventListener('an:session-changed',()=>{void checkActive(true)});
 window.addEventListener('focus',()=>{void checkActive(false)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void checkActive(false)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();