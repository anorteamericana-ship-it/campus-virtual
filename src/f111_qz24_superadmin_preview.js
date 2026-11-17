// F111 QZ24 · Preview digital superadmin, sin grupo, calendario ni PDF paralelo.
// Contenido únicamente desde endpoint privado autenticado; cero escrituras.
(function(){
 'use strict';
 const PREVIEW_API='https://script.google.com/macros/s/AKfycbx8S98VaY9QwC5qHMAtpVvzrijYsnINHQMCshA-l9SI47V7QLfLdcJ32L_UMV6Wd23xJg/exec';
 const LESSONS=[4,8,13,16,21,24,28,30],root=document.getElementById('root');
 if(!root)return;
 let scheduling=false;
 function superadmin(){
  try{
   const p=window.parent;if(!p||p===window||typeof p.getSesion!=='function')return null;
   return String((p.getSesion()||{}).rol||'').toLowerCase()==='superadmin'?p:null;
  }catch(_){return null}
 }
 function selected(){
  const label=root.querySelector('.d1-master .d1-pc-selected b');
  const match=String(label&&label.textContent||'').match(/\b(B1|B2|I1|I2)\s*[·-]\s*Progress Check\s*0?([1-8])\b/i);
  if(!match)return null;const n=Number(match[2]);
  return {nivel:match[1].toUpperCase(),numero:n,leccion:LESSONS[n-1]};
 }
 function element(doc,tag,text){
  const e=doc.createElement(tag);
  if(text!==undefined&&text!==null)e.textContent=String(text);
  return e;
 }
 function openDigital(p,selection){
  const doc=p.document;
  if(doc.querySelector('[data-f111-qz24-superadmin-modal]'))return;
  const overlay=element(doc,'div');
  overlay.dataset.f111Qz24SuperadminModal='true';overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Progress Check digital');
  overlay.style.cssText='position:fixed;inset:0;z-index:65000;background:rgba(3,21,44,.76);display:flex;align-items:center;justify-content:center;padding:14px';
  const box=element(doc,'section');
  box.style.cssText='width:min(1200px,100%);height:min(94vh,950px);background:white;border-radius:14px;overflow:hidden;display:flex;flex-direction:column';
  const head=element(doc,'header');
  head.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#073b7a;color:white;font:700 14px Arial,sans-serif';
  const name=element(doc,'span','Vista previa digital · '+selection.nivel+' · PC'+String(selection.numero).padStart(2,'0'));
  const close=element(doc,'button','Cerrar');
  close.type='button';close.style.cssText='border:0;border-radius:8px;padding:10px 14px;background:#fff;color:#073b7a;font:700 12px Arial,sans-serif';
  head.append(name,close);box.append(head);
  const frame=element(doc,'iframe');
  frame.title='Progress Check interactivo · sin grupo';
  frame.style.cssText='width:100%;flex:1;min-height:0;border:0';
  const url=new URL('qz24_preview_digital.html',location.href);
  url.searchParams.set('nivel',selection.nivel);url.searchParams.set('pc',String(selection.numero));
  url.searchParams.set('staff_preview','1');
  frame.src=url.href;box.append(frame);overlay.append(box);
  function dismiss(){doc.removeEventListener('keydown',escape);overlay.remove()}
  function escape(e){if(e.key==='Escape')dismiss()}
  close.addEventListener('click',dismiss);
  overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss()});
  doc.addEventListener('keydown',escape);doc.body.append(overlay);close.focus();
 }
 function mount(){
  const p=superadmin();if(!p)return;
  const host=root.querySelector('.d1-master .d1-pc');
  if(!host||host.querySelector('[data-f111-qz24-superadmin-preview]'))return;
  const card=element(document,'section');card.dataset.f111Qz24SuperadminPreview='true';
  card.style.cssText='margin-top:16px;padding:18px;border:1px solid #c8d8ec;border-radius:12px;background:#f5f9ff;color:#173c62;font:13px Arial,sans-serif';
  const title=element(document,'h3','Progress Check · Vista previa digital');
  title.style.cssText='margin:0 0 7px;font-size:17px;color:#073b7a';
  const intro=element(document,'p','Seleccioná un nivel B2, I1 o I2 y PC01–PC08 en la tabla superior. Se abrirá el quiz completo de forma privada, sin ingresar grupo, sin PDF paralelo y sin guardar respuestas.');
  intro.style.cssText='line-height:1.55;margin:8px 0 12px';
  const button=element(document,'button','Ver Progress Check');
  button.type='button';button.style.cssText='padding:11px 16px;background:#073b7a;color:#fff;border:0;border-radius:9px;font-weight:800;cursor:pointer';
  const status=element(document,'p','Seleccioná un Progress Check para ver las preguntas originales.');
  status.style.cssText='font-size:12px;margin-top:10px;color:#51677d';
  status.setAttribute('role','status');
  card.append(title,intro,button,status);
  button.addEventListener('click',async()=>{
   const owner=superadmin(),quiz=selected();
   if(!owner){status.textContent='Iniciá sesión como superadministrador.';return;}
   if(!quiz){status.textContent='Primero seleccioná el Progress Check en la tabla.';return;}
   if(quiz.nivel==='B1'){status.textContent='Para Básico I se conserva su vista digital histórica.';return;}
   const token=typeof owner.getSessionToken==='function'?String(owner.getSessionToken()||''):'';
   if(!token){status.textContent='Sesión vencida; ingresá de nuevo.';return;}
   button.disabled=true;status.textContent='Validando banco digital privado…';
   try{
    const response=await fetch(PREVIEW_API+'?fn=qzProgressGet',{method:'POST',
     headers:{'Content-Type':'text/plain;charset=utf-8'},
     body:JSON.stringify({fn:'qzProgressGet',token,solo_preview_sin_grupo:true,
       nivel:quiz.nivel,pc:quiz.numero})});
    const data=await response.json();
    if(!response.ok||!data||data.ok!==true)throw Error(data&&data.error||'sin_respuesta');
    if(data.quiz_id!=='IC5_'+quiz.nivel+'_WQ'+String(quiz.numero).padStart(2,'0')||
       data.nivel!==quiz.nivel||Number(data.leccion)!==quiz.leccion||
       data.vista_previa!==true||data.requiere_grupo!==false||
       data.admite_envio!==false||data.peso_oficial!==0||
       !Array.isArray(data.secciones)||!data.secciones.length)
      throw Error('El servidor no confirmó el banco digital de este quiz.');
    status.textContent='Banco autorizado · Se abrirá sin grupo ni datos estudiantiles.';
    openDigital(owner,quiz);
   }catch(e){status.textContent='No disponible: '+String(e&&e.message||e).slice(0,130);}
   finally{button.disabled=false;}
  });
  host.append(card);
 }
 const observer=new MutationObserver(()=>{
  if(scheduling)return;
  scheduling=true;queueMicrotask(()=>{scheduling=false;mount()});
 });
 observer.observe(root,{childList:true,subtree:true});mount();
})();
