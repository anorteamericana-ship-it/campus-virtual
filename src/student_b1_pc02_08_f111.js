// F111 R9 · PC02–PC08 de Básico I, sin duplicar ni alterar el flujo histórico PC01.
// El servidor decide matrícula CA, calendario y apertura docente; nada se infiere de URLs.
(function(){
'use strict';
const LESSONS={8:[2,'3–4'],13:[3,'5–6'],16:[4,'7–8'],21:[5,'9–10'],24:[6,'11–12'],28:[7,'13–14'],30:[8,'15–16']};
const TAG='data-f111-b1-followup';
const INTERVAL=30000;
let lastChecked=0,pending=false,lastToken='',entries=[],generation=0;
function elt(tag,cls,text){
 const e=document.createElement(tag);if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;return e;
}
function token(){return typeof window.getSessionToken==='function'?String(window.getSessionToken()||''):''}
async function api(fn,body){
 const auth=token(),url=String(window.F111_QZ_API_URL||'');
 if(!auth||!url)throw Error('sin_sesion');
 const r=await fetch(url+'?fn='+encodeURIComponent(fn),{
  method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify(Object.assign({fn,token:auth},body||{}))
 });
 const j=await r.json();
 if(!r.ok||!j||j.ok!==true)throw Error('acceso_no_autorizado');
 return j;
}
function getPanel(){
 const screen=document.querySelector('[data-screen-label="Estudiante · Evaluaciones"]');
 if(!screen)return null;
 let panel=screen.querySelector('['+TAG+']');
 if(panel)return panel;
 panel=elt('section','f111-b1-followup');panel.setAttribute(TAG,'true');
 panel.hidden=true;panel.setAttribute('aria-label','Progress Checks de Básico I habilitados');
 const title=elt('strong','','Progress Checks disponibles · Básico I');
 panel.append(elt('small','','EVALUACIONES · 0% DE NOTA OFICIAL'),title,elt('div','f111-b1-followup-list'));
 const after=screen.querySelector('[data-f111-student-pc01]');
 if(after)after.after(panel);
 else {const tab=screen.querySelector('[role="tablist"],[role="tabpanel"]');
 if(tab)screen.insertBefore(panel,tab);else screen.append(panel);}
 return panel;
}
function showQuiz(q){
 if(!entries.some(x=>x.quiz_id===q.quiz_id&&x.grupo===q.grupo&&x.leccion===q.leccion))return;
 const existing=document.querySelector('[data-f111-b1-followup-modal]');
 if(existing)return;
 const overlay=elt('div','f111-b1-followup-backdrop');overlay.dataset.f111B1FollowupModal='true';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 const frameBox=elt('section','f111-b1-followup-frame');
 const head=elt('header','f111-b1-followup-header');
 const n=LESSONS[q.leccion][0],label='Quiz '+n+' · Lección '+q.leccion+' · '+q.grupo;
 head.append(elt('strong','',label));
 const close=elt('button','','CERRAR');close.type='button';
 close.onclick=()=>{overlay.remove();void check(true);};head.append(close);
 const src=new URL('modulos/quiz_progress.html',new URL('./',location.href));
 src.searchParams.set('grupo',q.grupo);src.searchParams.set('nivel','B1');
 src.searchParams.set('leccion',String(q.leccion));
 const frame=elt('iframe');frame.title='Progress Check '+n+' de Básico I';
 frame.setAttribute('referrerpolicy','same-origin');frame.src=src.href;
 frameBox.append(head,frame);overlay.append(frameBox);document.body.append(overlay);
}
function draw(){
 const panel=getPanel();if(!panel)return;
 const box=panel.querySelector('.f111-b1-followup-list');
 if(!box)return;
 box.replaceChildren();
 panel.hidden=entries.length===0;
 for(const q of entries){
  const item=elt('article','f111-b1-followup-item'),
    n=LESSONS[q.leccion][0],state=String(q.estado||'DESCONOCIDO');
  item.append(elt('strong','','Quiz '+n+' · Lección '+q.leccion+' · Unidades '+LESSONS[q.leccion][1]),
    elt('small','','Grupo '+q.grupo+' · diagnóstico 0% de nota oficial'));
  const reviewed=state==='REVISADO',submitted=state==='ENTREGADO';
  if(reviewed||submitted){
   item.append(elt('p','',reviewed?'Prueba revisada. Consultá el resultado y comentario docente.':'Prueba entregada. Pendiente de revisión docente.'));
  }else if(['BORRADOR','SIN_INICIAR'].includes(state)){
   const go=elt('button','',state==='BORRADOR'?'CONTINUAR QUIZ':'INICIAR QUIZ');
   go.type='button';go.onclick=()=>showQuiz(q);item.append(go);
  }else item.append(elt('p','','Verificando el estado de tu entrega…'));
  box.append(item);
 }
}
async function check(force){
 const auth=token();const now=Date.now();
 if(!auth){lastToken='';lastChecked=0;entries=[];draw();return;}
 if(pending||(!force&&auth===lastToken&&now-lastChecked<INTERVAL))return;
 pending=true;lastToken=auth;lastChecked=now;const current=++generation;
 try{
  const r=await api('qzProgressStudentB1Active',{});
  if(token()!==auth||current!==generation)return;
  const valid=(Array.isArray(r.quizzes)?r.quizzes:[]).filter(q=>
   q.nivel==='B1'&&LESSONS[q.leccion]&&q.peso_oficial===0&&
   q.quiz_id==='IC5_B1_WQ'+String(LESSONS[q.leccion][0]).padStart(2,'0')&&
   /^[A-Z0-9-]{5,65}$/.test(q.grupo));
  const results=await Promise.all(valid.slice(0,16).map(async q=>{
   try{
    const attempt=await api('qzProgressMyAttempt',{cod_grupo:q.grupo,nivel:'B1',leccion:q.leccion});
    return {...q,estado:attempt.quiz_id===q.quiz_id?String(attempt.estado):'DESCONOCIDO'};
   }catch(_){return {...q,estado:'DESCONOCIDO'};}
  }));
  if(token()!==auth||current!==generation)return;
  entries=results;draw();
 }catch(_){if(token()===auth){entries=[];draw();}}
 finally{pending=false;}
}
function installStyles(){
 if(document.getElementById('f111-b1-followup-style'))return;
 const s=elt('style');s.id='f111-b1-followup-style';
 s.textContent=[
 '.f111-b1-followup{margin:13px 0;padding:16px;background:#eef6ff;border:1px solid #b8d2ec;border-radius:13px;color:#143c61}',
 '.f111-b1-followup[hidden]{display:none!important}',
 '.f111-b1-followup>small{font-size:10px;font-weight:900;color:#507aa0;letter-spacing:.08em}',
 '.f111-b1-followup>strong{display:block;margin:5px 0 11px;font-size:16px}',
 '.f111-b1-followup-list{display:grid;gap:9px}',
 '.f111-b1-followup-item{background:#fff;border:1px solid #d6e5f3;border-radius:10px;padding:13px;display:grid;gap:5px}',
 '.f111-b1-followup-item strong{font-size:14px}',
 '.f111-b1-followup-item small,.f111-b1-followup-item p{color:#657e95;font-size:11px;margin:3px 0}',
 '.f111-b1-followup-item button{justify-self:start;padding:9px 13px;font-weight:800;background:#f2ca42;border:1px solid #cba42c;border-radius:9px;cursor:pointer;color:#163b62}',
 '.f111-b1-followup-backdrop{position:fixed;inset:0;z-index:49999;background:#091f3cc9;display:grid;place-items:center;padding:10px}',
 '.f111-b1-followup-frame{background:white;border-radius:13px;width:min(1100px,100%);height:96vh;display:flex;flex-direction:column;overflow:hidden}',
 '.f111-b1-followup-header{display:flex;align-items:center;justify-content:space-between;padding:12px 15px;gap:12px;color:#143a61}',
 '.f111-b1-followup-header button{padding:8px 12px;border:1px solid #cfdeed;border-radius:7px;background:#f6f9fc;cursor:pointer}',
 '.f111-b1-followup-frame iframe{border:0;width:100%;min-height:0;flex:1}'
 ].join('\n');document.head.append(s);
}
function install(){
 const root=document.getElementById('root');if(!root)return;
 installStyles();getPanel();void check(true);
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;getPanel();draw();void check(false);});
 }).observe(root,{subtree:true,childList:true});
 window.addEventListener('an:session-changed',()=>{generation++;entries=[];lastChecked=0;draw();void check(true);});
 window.addEventListener('focus',()=>void check(false));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void check(false)});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();