// F111 R10 · B1 Progress Check PC02–PC08 discovery. PC01 remains independent.
// No Cambridge keys or files. Session + enrollment + teacher opening resolved by Quiz API.
(function(){
'use strict';
const LESSONS={8:['02','3–4'],13:['03','5–6'],16:['04','7–8'],21:['05','9–10'],24:['06','11–12'],28:['07','13–14'],30:['08','15–16']};
const INTERVAL=30000;
const en=()=>window.AN_I18N?.getLang()==='en';
const copy=(es,english)=>en()?english:es;
const labels=Object.freeze({
 'Cerrar':'Close','VER MÁS TARDE':'LATER','IR A EVALUACIONES':'GO TO ASSESSMENTS',
 'CONTINUAR QUIZ':'CONTINUE QUIZ','ABRIR QUIZ':'OPEN QUIZ','INICIAR QUIZ':'START QUIZ',
 'ACTUALIZAR INVITACIONES':'REFRESH INVITATIONS','En cola':'Queued',
 'EVALUACIONES · PROGRESS CHECK BÁSICO I':'ASSESSMENTS · BASIC I PROGRESS CHECK',
 'Quizzes e invitaciones de tu profesor':'Quizzes and teacher invitations',
 'ACADEMIA NORTEAMERICANA · EVALUACIÓN HABILITADA':'ACADEMIA NORTEAMERICANA · ASSESSMENT AVAILABLE',
 'Prueba entregada · pendiente de revisión':'Submitted · awaiting review',
 'Prueba revisada':'Reviewed','Verificando disponibilidad…':'Checking availability…'
});
const tr=x=>en()?(labels[x]||x):x;

let current=[],inFlight=false,lastToken='',lastAt=0,signature='',modal=null,studentCode='';
const notifiedInPage=Object.create(null);
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className;return e;}
function make(tag,text,className){const x=document.createElement(tag);if(text!==undefined)x.textContent=tr(text);if(className)x.className=className;return x;}
const token=()=>window.getSessionToken?String(window.getSessionToken()||''):'';
async function api(fn,body){
 const t=token(),url=String(window.F111_QZ_API_URL||'');
 if(!t||!url)throw Error('Sin sesión de Campus o Quiz');
 const res=await fetch(url+'?fn='+encodeURIComponent(fn),{
  method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({fn,token:t,...(body||{})})
 });
 let j;try{j=await res.json()}catch(_){throw Error('Respuesta de Quiz no válida')}
 if(!res.ok||!j||j.ok!==true)throw Error(String(j?.error||'Quiz no disponible'));
 return j;
}
function valid(item){
 const data=LESSONS[Number(item?.leccion)];
 return data&&item?.quiz_id==='IC5_B1_WQ'+data[0]&&item?.nivel==='B1'&&
  Number(item?.peso_oficial)===0&&/^[A-Z0-9-]{4,75}$/.test(String(item.grupo||''));
}
function host(){
 const screen=document.querySelector('[data-screen-label="Estudiante · Evaluaciones"]');
 if(!screen)return null;
 let section=screen.querySelector('[data-f111-student-b1-pc-extra]');
 if(!section){
  section=make('section',undefined,'f111-b1-extra');section.dataset.f111StudentB1PcExtra='true';
  section.setAttribute('aria-label',copy('Progress Checks de Básico I habilitados por tu docente','Basic I Progress Checks enabled by your teacher'));
  const target=screen.querySelector('[role="tablist"],[role="tabpanel"]');
  if(target&&target.parentNode===screen)screen.insertBefore(section,target);else screen.append(section);
 }
 return section;
}
function openQuiz(item){
 if(modal||!token()||!current.some(x=>x.quiz_id===item.quiz_id&&x.grupo===item.grupo&&x.state==='SIN_INICIAR'||x.quiz_id===item.quiz_id&&x.grupo===item.grupo&&x.state==='BORRADOR'))return;
 modal=make('div',undefined,'f111-b1-extra-modal');
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.setAttribute('aria-label',copy('Quiz de Progress Check Básico I','Basic I Progress Check Quiz'));
 const pane=make('div',undefined,'f111-b1-extra-inner');
 const bar=make('div',undefined,'f111-b1-extra-bar');
 bar.append(make('strong','Quiz '+Number(item.quiz_id.slice(-2))+copy(' · Básico I · Lección ',' · Basic I · Lesson ')+item.leccion));
 const close=make('button','Cerrar');close.type='button';
 const dismiss=()=>{modal?.remove();modal=null;document.removeEventListener('keydown',onKey);void check(true)};
 function onKey(ev){if(ev.key==='Escape'){ev.preventDefault();dismiss()}}
 close.onclick=dismiss;
 document.addEventListener('keydown',onKey);
 bar.append(close);pane.append(bar);
 const frame=make('iframe');frame.title=copy('Progress Check B1: respuestas y entrega','Basic I Progress Check: answers and submission');
 const lesson=Number(item.leccion),earlyDigital=lesson===8||lesson===13;
 const digital=earlyDigital||[16,21,24,28,30].includes(lesson);
 const url=new URL(earlyDigital?'modulos/qz_b1_pc02_pc03_digital.html':
   digital?'modulos/qz_b1_pc04_pc08_digital.html':'modulos/quiz_progress.html',
   new URL('./',location.href));
 url.searchParams.set('grupo',item.grupo);url.searchParams.set('nivel','B1');
 url.searchParams.set('leccion',String(item.leccion));
 if(digital){url.searchParams.set('live','1');url.searchParams.set('v','F111QUIZRETRY20261125');}
 frame.src=url.href;frame.setAttribute('referrerpolicy','same-origin');
 pane.append(frame);modal.append(pane);document.body.append(modal);
 close.focus();
}
function syncMenuBadge(){
 const button=document.querySelector('aside[data-role="student"] button[data-nav-id="evaluaciones"]')||
  document.querySelector('button.student-sb-item[data-nav-id="evaluaciones"]');
 if(!button)return;
 const pending=current.filter(x=>x.state==='SIN_INICIAR'||x.state==='BORRADOR').length;
 let badge=button.querySelector('[data-f111-quiz-menu-badge]');
 if(!pending){if(badge)badge.remove();return;}
 if(!badge){badge=make('span',undefined,'f111-quiz-menu-badge');badge.dataset.f111QuizMenuBadge='true';button.append(badge);}
 const label=en()?pending+' pending quiz'+(pending!==1?'zes':''):pending+' quiz'+(pending!==1?'zes':'')+' pendiente'+(pending!==1?'s':'');
 if(badge.textContent!==label)badge.textContent=label;
 if(badge.getAttribute('role')!=='status')badge.setAttribute('role','status');
}
function maybeInvite(){
 if(modal||!token()||!studentCode||document.querySelector('.f111-b1-extra-invite'))return;
 const item=current.find(x=>(x.state==='SIN_INICIAR'||x.state==='BORRADOR')&&
   !notifiedInPage[[studentCode,x.grupo,x.quiz_id,x.invitacion_version||'abierto'].join('|')]&&
   !invitationWasSeen(x));
 if(!item)return;
 const key=[studentCode,item.grupo,item.quiz_id,item.invitacion_version||'abierto'].join('|');
 notifiedInPage[key]=true;
 try{sessionStorage.setItem('f111-invite-v2|'+key,'1')}catch(_){}
 const overlay=make('div',undefined,'f111-b1-extra-invite');
 overlay.setAttribute('role','alertdialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label',copy('Invitación al Quiz del profesor','Teacher quiz invitation'));
 const pane=make('section',undefined,'f111-b1-extra-invite-pane');
 pane.append(make('small','ACADEMIA NORTEAMERICANA · EVALUACIÓN HABILITADA'),
   make('h2',(en()?('Your teacher '+(item.state==='BORRADOR'?'invites you to continue':'enabled')+' Quiz '):('Tu profesor '+(item.state==='BORRADOR'?'te invita a continuar':'habilitó')+' el Quiz '))+Number(item.quiz_id.slice(-2))),
   make('p',copy('Básico I · Lección ','Basic I · Lesson ')+item.leccion+copy(' · Unidades ',' · Units ')+LESSONS[item.leccion][1]+
     '.'));
 const actions=make('div',undefined,'f111-b1-extra-invite-actions');
 const later=make('button','VER MÁS TARDE');
 const go=make('button','IR A EVALUACIONES');
 const begin=make('button',item.state==='BORRADOR'?'CONTINUAR QUIZ':'ABRIR QUIZ');
 for(const b of [later,go,begin])b.type='button';
 const close=()=>overlay.remove();
 later.onclick=close;
 go.onclick=()=>{
   close();const nav=document.querySelector('aside[data-role="student"] button[data-nav-id="evaluaciones"]')||
     document.querySelector('button.student-sb-item[data-nav-id="evaluaciones"]');
   if(nav){nav.click();setTimeout(()=>document.querySelector('[data-f111-student-b1-pc-extra]')?.scrollIntoView({behavior:'smooth',block:'start'}),150);}
 };
 begin.onclick=()=>{close();openQuiz(item)};
 actions.append(later,go,begin);pane.append(actions);overlay.append(pane);
 overlay.onclick=e=>{if(e.target===overlay)close()};
 document.body.append(overlay);go.focus();
}
function invitationWasSeen(x){
 const key=[studentCode,x.grupo,x.quiz_id,x.invitacion_version||'abierto'].join('|');
 try{return sessionStorage.getItem('f111-invite-v2|'+key)==='1'}catch(_){return !!notifiedInPage[key]}
}
function render(){
 syncMenuBadge();
 const section=host();if(!section)return;
 const empty=current.length===0;
 if(section.hidden!==empty)section.hidden=empty;
 const next=JSON.stringify([en(),current]);
 if(signature===next&&(empty?!section.hasChildNodes():!!section.querySelector('.f111-b1-extra-list')))return;
 signature=next;
 if(section.hasChildNodes())section.replaceChildren();
 if(!current.length)return;
 section.append(make('small','EVALUACIONES · PROGRESS CHECK BÁSICO I'));
 section.append(make('h3','Quizzes e invitaciones de tu profesor'));

 const reload=make('button','ACTUALIZAR INVITACIONES');
 reload.type='button';reload.className='f111-b1-extra-refresh';
 reload.onclick=()=>void check(true);
 section.append(reload);
 const list=make('div',undefined,'f111-b1-extra-list');
 const firstPending=current.find(x=>['SIN_INICIAR','BORRADOR'].includes(x.state));
 for(const item of current){
  const card=make('div',undefined,'f111-b1-extra-card');
  card.append(make('strong','Quiz '+Number(item.quiz_id.slice(-2))+copy(' · Lección ',' · Lesson ')+item.leccion));
  card.append(make('p',copy('Unidades ','Units ')+LESSONS[item.leccion][1]));
  const label=item.state==='BORRADOR'?'CONTINUAR QUIZ':item.state==='SIN_INICIAR'?'INICIAR QUIZ':null;
  if(label){if(firstPending&&item!==firstPending)card.append(make('small','En cola'));const b=make('button',label);b.type='button';b.addEventListener('click',()=>openQuiz(item));card.append(b)}
  else card.append(make('small',item.state==='ENTREGADO'?'Prueba entregada · pendiente de revisión':item.state==='REVISADO'?'Prueba revisada':'Verificando disponibilidad…'));
  list.append(card);
 }
 section.append(list);
}
async function check(force){
 const t=token();
 if(!t){current=[];studentCode='';lastToken='';lastAt=0;signature='';render();return;}
 if(inFlight)return;
 if(!force&&t===lastToken&&Date.now()-lastAt<INTERVAL){render();return;}
 if(lastToken&&lastToken!==t){current=[];studentCode='';signature='';}inFlight=true;lastToken=t;lastAt=Date.now();
 try{
  const list=await api('qzProgressStudentB1Active',{});
  if(t!==token())return;
  studentCode=/^[A-Za-z0-9-]{1,45}$/.test(String(list.codigo_estudiante||''))?
    String(list.codigo_estudiante):'';
  const dedup=new Map();
  for(const x of (Array.isArray(list.quizzes)?list.quizzes:[])){
   if(!valid(x))continue;
   const key=x.grupo+'|'+x.quiz_id;
   if(!dedup.has(key)&&dedup.size<14)dedup.set(key,{...x,state:'DESCONOCIDO'});
  }
  const items=Array.from(dedup.values()).sort((a,b)=>a.grupo.localeCompare(b.grupo)||a.leccion-b.leccion);
  await Promise.all(items.map(async x=>{
   if(['SIN_INICIAR','BORRADOR','ENTREGADO','REVISADO'].includes(x.estado_intento)){x.state=x.estado_intento;return;}
   try{const r=await api('qzProgressMyAttempt',{cod_grupo:x.grupo,nivel:'B1',leccion:x.leccion});
    if(r.quiz_id===x.quiz_id&&['SIN_INICIAR','BORRADOR','ENTREGADO','REVISADO'].includes(r.estado))x.state=r.estado;
   }catch(_){const old=current.find(y=>y.quiz_id===x.quiz_id&&y.grupo===x.grupo);x.state=old?.state||'DESCONOCIDO'}
  }));
  if(t!==token())return;
  current=items;render();maybeInvite();
 }catch(_){if(t===token()){render()}}
 finally{inFlight=false}
}
function install(){
 if(!document.getElementById('f111-b1-extra-style')){
  const style=make('style');style.id='f111-b1-extra-style';
  style.textContent=[
   '.f111-b1-extra{margin:14px 0;padding:16px;border:1px solid #dfcc7e;border-radius:13px;background:#fff9e9}',
   '.f111-b1-extra[hidden]{display:none!important}',
   '.f111-b1-extra>small{color:#8a6211;font-size:10px;font-weight:900;letter-spacing:.07em}',
   '.f111-b1-extra h3{color:#183d63;font-size:17px;margin:5px 0 12px}',
   '.f111-b1-extra-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}',
   '.f111-b1-extra-card{background:#fff;border:1px solid #e4dcbf;border-radius:9px;padding:12px;display:flex;flex-direction:column;gap:5px}',
   '.f111-b1-extra-card strong{color:#183d63;font-size:13px}',
   '.f111-b1-extra-card p,.f111-b1-extra-card small{color:#61758a;font-size:11px;line-height:1.45}',
   '.f111-b1-extra-card button,.f111-b1-extra-refresh{padding:9px;background:#eac040;border:1px solid #d3ac34;border-radius:7px;font-weight:900;color:#163958;cursor:pointer}',
   '.f111-b1-extra-refresh{margin:4px 0 12px;border-radius:7px}',
   '.f111-quiz-menu-badge{display:inline-flex;margin-left:auto;padding:2px 6px;border-radius:999px;background:#f8d75c;color:#123d6d;font-size:9px;font-weight:900;white-space:nowrap}',
   '.f111-b1-extra-invite{position:fixed;inset:0;z-index:50001;display:grid;place-items:center;background:rgba(6,24,52,.7);padding:16px}',
   '.f111-b1-extra-invite-pane{width:min(530px,100%);background:#fff;border-radius:17px;padding:22px;box-shadow:0 18px 55px #001d3d44}',
   '.f111-b1-extra-invite-pane small{font-size:10px;letter-spacing:.08em;font-weight:900;color:#835a16}',
   '.f111-b1-extra-invite-pane h2{color:#073B7A;font-size:21px;margin:12px 0}',
   '.f111-b1-extra-invite-pane p{font-size:13px;line-height:1.6;color:#40516A}',
   '.f111-b1-extra-invite-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}',
   '.f111-b1-extra-invite-actions button{border:1px solid #c7d4e5;background:#f3f7fc;color:#173d67;padding:9px 12px;border-radius:8px;font-weight:800;cursor:pointer}',
   '.f111-b1-extra-invite-actions button:last-child{background:#efc539;border-color:#e4b62c}',
   '.f111-b1-extra-modal{position:fixed;inset:0;z-index:49999;background:rgba(7,25,48,.75);display:grid;place-items:center;padding:12px}',
   '.f111-b1-extra-inner{display:flex;flex-direction:column;background:#f7f9fd;width:min(1150px,100%);height:96vh;border-radius:12px;overflow:hidden}',
   '.f111-b1-extra-bar{background:#fff;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 15px}',
   '.f111-b1-extra-bar button{border:1px solid #c8d4e2;background:#fff;border-radius:7px;padding:8px 14px;cursor:pointer}',
   '.f111-b1-extra-inner iframe{border:0;width:100%;flex:1;min-height:0}'
  ].join('\n');document.head.append(style);
 }
 render();void check(true);
 const root=document.getElementById('root');
 if(root){let pending=false;new MutationObserver(()=>{
  if(pending)return;pending=true;queueMicrotask(()=>{pending=false;render()});
 }).observe(root,{childList:true,subtree:true})}
 window.addEventListener('an:session-changed',()=>void check(true));
 window.addEventListener('focus',()=>void check(false));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check(false)});
 // Avisos nuevos mientras el alumno mantiene abierto el Campus.
 setInterval(()=>{if(!document.hidden&&token())void check(false)},30000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
