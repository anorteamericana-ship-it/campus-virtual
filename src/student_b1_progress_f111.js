// F111 R10 · B1 Progress Check PC02–PC08 discovery. PC01 remains independent.
// No Cambridge keys or files. Session + enrollment + teacher opening resolved by Quiz API.
(function(){
'use strict';
const LESSONS={8:['02','3–4'],13:['03','5–6'],16:['04','7–8'],21:['05','9–10'],24:['06','11–12'],28:['07','13–14'],30:['08','15–16']};
const INTERVAL=90000;
let current=[],inFlight=false,lastToken='',lastAt=0,signature='',modal=null;
function el(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className;return e;}
function make(tag,text,className){const x=document.createElement(tag);if(text!==undefined)x.textContent=text;if(className)x.className=className;return x;}
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
  section.setAttribute('aria-label','Progress Checks de Básico I habilitados por tu docente');
  const target=screen.querySelector('[role="tablist"],[role="tabpanel"]');
  if(target)screen.insertBefore(section,target);else screen.append(section);
 }
 return section;
}
function openQuiz(item){
 if(modal||!token()||!current.some(x=>x.quiz_id===item.quiz_id&&x.grupo===item.grupo&&x.state==='SIN_INICIAR'||x.quiz_id===item.quiz_id&&x.grupo===item.grupo&&x.state==='BORRADOR'))return;
 modal=make('div',undefined,'f111-b1-extra-modal');
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 modal.setAttribute('aria-label','Quiz de Progress Check Básico I');
 const pane=make('div',undefined,'f111-b1-extra-inner');
 const bar=make('div',undefined,'f111-b1-extra-bar');
 bar.append(make('strong','Quiz '+Number(item.quiz_id.slice(-2))+' · Básico I · Lección '+item.leccion));
 const close=make('button','Cerrar');close.type='button';
 const dismiss=()=>{modal?.remove();modal=null;document.removeEventListener('keydown',onKey);void check(true)};
 function onKey(ev){if(ev.key==='Escape'){ev.preventDefault();dismiss()}}
 close.onclick=dismiss;
 document.addEventListener('keydown',onKey);
 bar.append(close);pane.append(bar);
 const frame=make('iframe');frame.title='Progress Check B1: respuestas y entrega';
 const url=new URL('modulos/quiz_progress.html',new URL('./',location.href));
 url.searchParams.set('grupo',item.grupo);url.searchParams.set('nivel','B1');
 url.searchParams.set('leccion',String(item.leccion));
 frame.src=url.href;frame.setAttribute('referrerpolicy','same-origin');
 pane.append(frame);modal.append(pane);document.body.append(modal);
 close.focus();
}
function render(){
 const section=host();if(!section)return;
 section.hidden=current.length===0;
 const next=JSON.stringify(current);
 if(signature===next&&section.querySelector('.f111-b1-extra-list'))return;
 signature=next;section.replaceChildren();
 if(!current.length)return;
 section.append(make('small','EVALUACIONES · PROGRESS CHECK BÁSICO I'));
 section.append(make('h3','Quizzes habilitados por tu profesor'));
 const list=make('div',undefined,'f111-b1-extra-list');
 for(const item of current){
  const card=make('div',undefined,'f111-b1-extra-card');
  card.append(make('strong','Quiz '+Number(item.quiz_id.slice(-2))+' · Lección '+item.leccion));
  card.append(make('p','Unidades '+LESSONS[item.leccion][1]+' · Evaluación formativa, 0% de nota oficial'));
  const label=item.state==='BORRADOR'?'CONTINUAR QUIZ':item.state==='SIN_INICIAR'?'INICIAR QUIZ':null;
  if(label){const b=make('button',label);b.type='button';b.addEventListener('click',()=>openQuiz(item));card.append(b)}
  else card.append(make('small',item.state==='ENTREGADO'?'Prueba entregada · pendiente de revisión':item.state==='REVISADO'?'Prueba revisada':'Verificando disponibilidad…'));
  list.append(card);
 }
 section.append(list);
}
async function check(force){
 const t=token();
 if(!t){current=[];lastToken='';lastAt=0;signature='';render();return;}
 if(inFlight)return;
 if(!force&&t===lastToken&&Date.now()-lastAt<INTERVAL){render();return;}
 inFlight=true;lastToken=t;lastAt=Date.now();
 try{
  const list=await api('qzProgressStudentB1Active',{});
  if(t!==token())return;
  const dedup=new Map();
  for(const x of (Array.isArray(list.quizzes)?list.quizzes:[])){
   if(!valid(x))continue;
   const key=x.grupo+'|'+x.quiz_id;
   if(!dedup.has(key)&&dedup.size<14)dedup.set(key,{...x,state:'DESCONOCIDO'});
  }
  const items=Array.from(dedup.values());
  await Promise.all(items.map(async x=>{
   try{const r=await api('qzProgressMyAttempt',{cod_grupo:x.grupo,nivel:'B1',leccion:x.leccion});
    if(r.quiz_id===x.quiz_id&&['SIN_INICIAR','BORRADOR','ENTREGADO','REVISADO'].includes(r.estado))x.state=r.estado;
   }catch(_){x.state='DESCONOCIDO'}
  }));
  if(t!==token())return;
  current=items;signature='';render();
 }catch(_){if(t===token()){current=[];signature='';render()}}
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
   '.f111-b1-extra-card button{padding:9px;background:#eac040;border:1px solid #d3ac34;border-radius:7px;font-weight:900;color:#163958;cursor:pointer}',
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
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
