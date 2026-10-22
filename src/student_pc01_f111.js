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
function attach(){
 const screen=document.querySelector('section[data-screen-label="Estudiante · Evaluaciones"]');
 if(!screen||seen.has(screen))return;
 seen.add(screen);
 const box=e('section','f111-pc01-student');box.hidden=true;box.dataset.f111StudentPc01='true';
 box.append(e('strong','','Progress Check 01 · Básico I'));
 box.append(e('p','','Lección 4 · Unidades 1–2 · 25 preguntas · Listening integrado'));
 const btn=e('button','','Abrir Quiz 1');
 btn.type='button';btn.addEventListener('click',openQuiz);box.append(btn);
 const slot=screen.querySelector('[role="tabpanel"]');
 if(slot)screen.insertBefore(box,slot);else screen.append(box);
 api('qzProgressStudentActive',{}).then(r=>{
  if(r.disponible===true&&r.grupo===TARGET&&r.nivel==='B1'&&r.leccion===4&&r.peso_oficial===0)box.hidden=false;
 }).catch(()=>{box.hidden=true});
}
function style(){
 if(document.getElementById('f111-pc01-student-style'))return;
 const s=e('style');s.id='f111-pc01-student-style';
 s.textContent=[
 '.f111-pc01-student{padding:17px 20px;margin:12px 0;background:#fff9e5;border:1px solid #e6cc73;border-radius:13px}',
 '.f111-pc01-student[hidden]{display:none!important}',
 '.f111-pc01-student strong{display:block;color:#143b61;font-size:17px}',
 '.f111-pc01-student p{margin:6px 0 12px;color:#607590;font-size:12px}',
 '.f111-pc01-student button{background:#eac040;color:#183b61;border:1px solid #d2a930;border-radius:8px;padding:10px 16px;font-weight:850;cursor:pointer}',
 '.f111-pc01-modal{position:fixed;inset:0;z-index:49999;background:rgba(7,25,48,.75);display:flex;justify-content:center;align-items:center;padding:12px}',
 '.f111-pc01-modal-inner{display:flex;flex-direction:column;background:#f7f9fd;max-width:1150px;width:100%;height:96vh;border-radius:12px;overflow:hidden}',
 '.f111-pc01-modal-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 15px;color:#163a63;background:#fff}',
 '.f111-pc01-modal-bar button{border:1px solid #c8d4e2;background:white;border-radius:7px;padding:8px 14px;font-weight:700;cursor:pointer}',
 '.f111-pc01-modal iframe{border:0;width:100%;flex:1}'
 ].join('\n');document.head.append(s);
}
function install(){
 const root=document.getElementById('root');if(!root)return;
 style();attach();
 let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;attach()})}).observe(root,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();