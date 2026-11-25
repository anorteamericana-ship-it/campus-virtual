// Aviso del escrito ordinario abierto para la sesión del alumno.
// La consulta es de solo lectura; el tiempo comienza dentro del formulario.
(function(){
'use strict';
const INTERVAL=30000;
let inFlight=false,lastToken='',notified='',active=null,modal=null;
const make=(tag,text,className)=>{
 const el=document.createElement(tag);
 if(text!==undefined)el.textContent=text;
 if(className)el.className=className;
 return el;
};
const session=()=>typeof window.getSesion==='function'?window.getSesion():null;
const token=()=>typeof window.getSessionToken==='function'?String(window.getSessionToken()||''):'';
function valid(item){
 return item&&item.ok===true&&item.active===true&&item.opcion==='A'&&
  ['B1','B2','I1','I2'].includes(item.nivel)&&[18,32].includes(Number(item.leccion))&&
  typeof item.activation_id==='string'&&item.activation_id.length>3&&item.activation_id.length<120&&
  typeof item.grupo==='string'&&item.grupo.length>2;
}
function badge(){
 const nav=document.querySelector('aside[data-role="student"] button[data-nav-id="evaluaciones"]')||
  document.querySelector('button.student-sb-item[data-nav-id="evaluaciones"]');
 if(!nav)return;
 let el=nav.querySelector('[data-f111-written-badge]');
 if(!active){el?.remove();return;}
 if(!el){el=make('span',undefined,'f111-written-badge');el.dataset.f111WrittenBadge='true';nav.append(el);}
 if(el.textContent!=='Escrito activo')el.textContent='Escrito activo';
}
function dismiss(){
 modal?.remove();modal=null;
 document.removeEventListener('keydown',onKey);
}
function onKey(e){if(e.key==='Escape'){e.preventDefault();dismiss();}}
function goToExam(){
 dismiss();
 const nav=document.querySelector('aside[data-role="student"] button[data-nav-id="evaluaciones"]')||
  document.querySelector('button.student-sb-item[data-nav-id="evaluaciones"]');
 nav?.click();
 let tabChosen=false;
 const until=Date.now()+10000;
 const timer=setInterval(()=>{
  const screen=document.querySelector('[data-screen-label="Estudiante · Evaluaciones"]');
  if(screen&&!tabChosen){screen.querySelector('[role="tablist"] button')?.click();tabChosen=true;}
  const exam=screen?.querySelector('[data-screen-label="Estudiante · Exámenes"]');
  if(exam){exam.scrollIntoView({behavior:'smooth',block:'start'});clearInterval(timer);}
  else if(Date.now()>until)clearInterval(timer);
 },150);
}
function show(item){
 if(modal)return;
 modal=make('div',undefined,'f111-written-invite');
 modal.setAttribute('role','alertdialog');modal.setAttribute('aria-modal','true');
 modal.setAttribute('aria-label','Examen escrito habilitado');
 const pane=make('section',undefined,'f111-written-invite-pane');
 const number=Number(item.leccion)===18?1:2;
 const level={B1:'Básico 1',B2:'Básico 2',I1:'Intermedio 1',I2:'Intermedio 2'}[item.nivel];
 const minutes=Number(item.time_limit_min)||90;
 pane.append(make('small','ACADEMIA NORTEAMERICANA · EXAMEN HABILITADO'),
  make('h2',item.started?'Tu examen escrito sigue activo':'Tu profesor habilitó el Examen Escrito '+number),
  make('p',level+' · Modelo A · '+minutes+' minutos. '+(item.started
   ?'Tu tiempo comenzó al iniciar el intento. Abrí el formulario para revisar el tiempo restante.'
   :'El tiempo comienza cuando presionés «Iniciar examen» dentro del formulario.')));
 const actions=make('div',undefined,'f111-written-invite-actions');
 const later=make('button','VER MÁS TARDE');later.type='button';later.onclick=dismiss;
 const go=make('button',item.started?'CONTINUAR EXAMEN':'IR AL EXAMEN');go.type='button';go.onclick=goToExam;
 actions.append(later,go);pane.append(actions);modal.append(pane);
 modal.onclick=e=>{if(e.target===modal)dismiss();};
 document.addEventListener('keydown',onKey);
 document.body.append(modal);go.focus();
}
async function check(){
 const s=session(),t=token();
 if(!t||String(s?.rol||'').toLowerCase()!=='student'){
  lastToken='';notified='';active=null;dismiss();badge();return;
 }
 if(t!==lastToken){lastToken=t;notified='';active=null;dismiss();}
 if(inFlight)return;
 inFlight=true;
 try{
  const url=String(window.APPS_SCRIPT_URL||'');
  if(!url)return;
  const response=await fetch(url+'?fn=examGetStudentWrittenInviteF111',{
   method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
   body:JSON.stringify({fn:'examGetStudentWrittenInviteF111',token:t})
  });
  const item=await response.json();
  if(t!==token())return;
  active=response.ok&&valid(item)?item:null;
  badge();
  if(!active){dismiss();return;}
  const key=t+'|'+active.activation_id;
  if(notified!==key){notified=key;show(active);}
 }catch(_){/* El menú de Evaluaciones conserva su propio botón de actualización. */}
 finally{inFlight=false;if(t!==token())queueMicrotask(()=>void check());}
}
function install(){
 if(!document.getElementById('f111-written-invite-style')){
  const style=make('style');style.id='f111-written-invite-style';
  style.textContent=[
   '.f111-written-invite{position:fixed;inset:0;z-index:50002;display:grid;place-items:center;background:rgba(6,24,52,.74);padding:16px}',
   '.f111-written-invite-pane{width:min(530px,100%);background:#fff;border-radius:17px;padding:22px;box-shadow:0 18px 55px #001d3d44;font-family:Poppins,system-ui,sans-serif}',
   '.f111-written-invite-pane small{font-size:10px;letter-spacing:.08em;font-weight:900;color:#835a16}',
   '.f111-written-invite-pane h2{color:#073B7A;font-size:21px;margin:12px 0}',
   '.f111-written-invite-pane p{font-size:13px;line-height:1.6;color:#40516A}',
   '.f111-written-invite-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}',
   '.f111-written-invite-actions button{border:1px solid #c7d4e5;background:#f3f7fc;color:#173d67;padding:9px 12px;border-radius:8px;font-weight:800;cursor:pointer}',
   '.f111-written-invite-actions button:last-child{background:#efc539;border-color:#e4b62c}',
   '.f111-written-badge{display:inline-flex;margin-left:auto;padding:2px 6px;border-radius:999px;background:#f8d75c;color:#123d6d;font-size:9px;font-weight:900;white-space:nowrap}'
  ].join('\n');document.head.append(style);
 }
 void check();
 const root=document.getElementById('root');
 if(root){let queued=false;new MutationObserver(()=>{
  if(queued)return;queued=true;queueMicrotask(()=>{queued=false;badge();});
 }).observe(root,{childList:true,subtree:true});}
 window.addEventListener('an:session-changed',()=>void check());
 window.addEventListener('focus',()=>void check());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check();});
 setInterval(()=>{if(!document.hidden&&token())void check();},INTERVAL);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
