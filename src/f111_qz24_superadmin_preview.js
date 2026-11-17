// F111 QZ24 · Una sola ruta de consulta: Nivel > Progress Check > Ver.
// Extensión no invasiva del Centro superadmin. Sin grupo, notas ni escrituras.
// React conserva el catálogo/ciclo histórico; aquí sólo simplificamos la interfaz.
(function(){
 'use strict';
 const PREVIEW_API='https://script.google.com/macros/s/AKfycbx8S98VaY9QwC5qHMAtpVvzrijYsnINHQMCshA-l9SI47V7QLfLdcJ32L_UMV6Wd23xJg/exec';
 const LESSONS=[4,8,13,16,21,24,28,30];
 const UNITS=['1–2','3–4','5–6','7–8','9–10','11–12','13–14','15–16'];
 const root=document.getElementById('root');
 if(!root)return;
 let scheduled=false,requestSeq=0,lastSelectionKey='';
 function superadmin(){
  try{
   const p=window.parent;
   if(!p||p===window||typeof p.getSesion!=='function')return null;
   return String((p.getSesion()||{}).rol||'').trim().toLowerCase()==='superadmin'?p:null;
  }catch(_){return null;}
 }
 function selectedCheck(){
  const title=root.querySelector('.d1-master .d1-pc-selected b');
  const match=String(title&&title.textContent||'').match(/\b(B1|B2|I1|I2)\s*[·-]\s*Progress Check\s*0?([1-8])\b/i);
  if(!match)return null;
  const number=Number(match[2]);
  return {nivel:match[1].toUpperCase(),numero:number,leccion:LESSONS[number-1]};
 }
 function element(doc,tag,text){
  const e=doc.createElement(tag);
  if(text!==undefined&&text!==null)e.textContent=String(text);
  return e;
 }
 function installStyle(){
  if(document.getElementById('f111-qz24-ux-style'))return;
  const style=element(document,'style');
  style.id='f111-qz24-ux-style';
  style.textContent=[
   '.d1-pc[data-f111-qz24-simple] .d1-pc-grid{display:none!important}',
   '.d1-pc[data-f111-qz24-simple] .d1-pc-pending{display:none!important}',
   '.f111-qz24-choice{display:flex;flex-wrap:wrap;align-items:end;gap:12px;margin:12px 0}',
   '.f111-qz24-choice label{display:grid;gap:6px;flex:1;min-width:210px;font:700 12px Arial,sans-serif;color:#173c62}',
   '.f111-qz24-choice select{width:100%;padding:12px 14px;border:1px solid #b9cfe2;border-radius:10px;background:white;font:600 14px Arial,sans-serif;color:#163d64}',
   '.f111-qz24-oneaction{border:0;border-radius:10px;padding:13px 18px;background:#073b7a;color:#fff;font:800 13px Arial,sans-serif;cursor:pointer}',
   '.f111-qz24-oneaction:disabled{opacity:.52;cursor:not-allowed}',
   '.f111-qz24-selected-description{font:600 12px Arial,sans-serif;color:#4c6882;margin:8px 0}',
   '.f111-qz24-selected-status{font:12px Arial,sans-serif;color:#53708b;line-height:1.5;margin:8px 0 0}',
   '.f111-qz24-selected-note{font:11px Arial,sans-serif;color:#6b7b8b;margin:7px 0 0}',
   '@media(max-width:520px){.f111-qz24-choice{display:grid}.f111-qz24-choice label{min-width:0}.f111-qz24-oneaction{width:100%}}'
  ].join('\n');
  document.head.append(style);
 }
 function openDigital(p,selection){
  const doc=p.document;
  if(doc.querySelector('[data-f111-qz24-superadmin-modal]'))return;
  const overlay=element(doc,'div');
  overlay.dataset.f111Qz24SuperadminModal='true';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','Progress Check digital');
  overlay.style.cssText='position:fixed;inset:0;z-index:65000;background:rgba(3,21,44,.76);display:flex;align-items:center;justify-content:center;padding:14px';
  const box=element(doc,'section');
  box.style.cssText='width:min(1200px,100%);height:min(94vh,950px);background:white;border-radius:14px;overflow:hidden;display:flex;flex-direction:column';
  const head=element(doc,'header');
  head.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#073b7a;color:white;font:700 14px Arial,sans-serif';
  const name=element(doc,'span','Vista previa digital · '+selection.nivel+' · PC'+String(selection.numero).padStart(2,'0'));
  const close=element(doc,'button','Cerrar');close.type='button';
  close.style.cssText='border:0;border-radius:8px;padding:10px 14px;background:#fff;color:#073b7a;font:700 12px Arial,sans-serif;cursor:pointer';
  head.append(name,close);box.append(head);
  const frame=element(doc,'iframe');frame.title='Progress Check interactivo · sin grupo';
  frame.style.cssText='width:100%;flex:1;min-height:0;border:0';
  const url=new URL('qz24_preview_digital.html',location.href);
  url.searchParams.set('nivel',selection.nivel);url.searchParams.set('pc',String(selection.numero));
  url.searchParams.set('staff_preview','1');frame.src=url.href;
  box.append(frame);overlay.append(box);
  const previous=doc.activeElement;
  function dismiss(){doc.removeEventListener('keydown',escape);overlay.remove();if(previous&&previous.isConnected)previous.focus();}
  function escape(e){if(e.key==='Escape')dismiss();}
  close.addEventListener('click',dismiss);
  overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
  doc.addEventListener('keydown',escape);doc.body.append(overlay);close.focus();
 }
 function mount(){
  const owner=superadmin();if(!owner)return;
  const host=root.querySelector('.d1-master .d1-pc');
  const selected=host&&host.querySelector('.d1-pc-selected');
  const legacyGrid=host&&host.querySelector('.d1-pc-grid');
  if(!selected||!legacyGrid)return;
  installStyle();
  host.dataset.f111Qz24Simple='true';
  let card=selected.querySelector('[data-f111-qz24-superadmin-preview]');
  if(!card){
   card=element(document,'section');
   card.dataset.f111Qz24SuperadminPreview='true';
   const heading=element(document,'h3','Abrir Progress Check');
   heading.style.cssText='font:800 17px Arial,sans-serif;color:#073b7a;margin:8px 0';
   const controls=element(document,'div');controls.className='f111-qz24-choice';
   const label=element(document,'label','Elegí el examen');
   const picker=element(document,'select');
   picker.dataset.f111Qz24PcPicker='true';
   picker.setAttribute('aria-label','Elegí el Progress Check');
   for(let n=1;n<=8;n++){
    const opt=element(document,'option','PC'+String(n).padStart(2,'0')+' · Lección '+LESSONS[n-1]+' · Unidades '+UNITS[n-1]);
    opt.value=String(n);picker.append(opt);
   }
   label.append(picker);
   const button=element(document,'button','Ver Progress Check');button.type='button';
   button.className='f111-qz24-oneaction';
   const description=element(document,'p');description.className='f111-qz24-selected-description';
   const status=element(document,'p');status.className='f111-qz24-selected-status';
   status.setAttribute('role','status');
   const note=element(document,'p','Vista previa privada · sin grupo · sin guardar · 0 % de nota oficial.');
   note.className='f111-qz24-selected-note';
   controls.append(label,button);card.append(heading,controls,description,status,note);
   selected.append(card);
   picker.addEventListener('change',()=>{
    const number=Number(picker.value);
    const target=legacyGrid.querySelectorAll('.d1-eval-card')[number-1];
    if(target){requestSeq++;target.click();}
   });
   button.addEventListener('click',async()=>{
    const selection=selectedCheck(),p=superadmin();
    if(!p||!selection){status.textContent='Iniciá sesión como superadministrador.';return;}
    if(selection.nivel==='B1'){
     // B1 PC01/PC02 conserve their original digital link; no second button.
     const b1=selected.querySelector('[data-f111-digital-oneclick]');
     if(b1&&selection.numero<=2){b1.click();return;}
     status.textContent='Esta vista B1 todavía no está disponible desde el Centro.';return;
    }
    const token=typeof p.getSessionToken==='function'?String(p.getSessionToken()||''):'';
    if(!token){status.textContent='La sesión venció. Ingresá nuevamente.';return;}
    const key=selection.nivel+'|'+selection.numero,req=++requestSeq;
    button.disabled=true;status.textContent='Verificando el examen privado…';
    try{
     const response=await fetch(PREVIEW_API+'?fn=qzProgressGet',{method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({fn:'qzProgressGet',token,solo_preview_sin_grupo:true,
       nivel:selection.nivel,pc:selection.numero})});
     const data=await response.json();
     if(!response.ok||!data||data.ok!==true)throw Error(data&&data.error||'sin_respuesta');
     if(data.quiz_id!=='IC5_'+selection.nivel+'_WQ'+String(selection.numero).padStart(2,'0')||
        data.nivel!==selection.nivel||Number(data.leccion)!==selection.leccion||
        data.vista_previa!==true||data.requiere_grupo!==false||
        data.admite_envio!==false||data.peso_oficial!==0||
        !Array.isArray(data.secciones)||!data.secciones.length)
      throw Error('El servidor no confirmó el banco digital.');
     const current=selectedCheck();
     if(req!==requestSeq||!current||current.nivel+'|'+current.numero!==key)return;
     status.textContent='Examen verificado. Vista previa sin alumnos ni entregas.';
     openDigital(p,selection);
    }catch(e){
     if(req===requestSeq)status.textContent='No disponible: '+String(e&&e.message||e).slice(0,140);
    }finally{button.disabled=false;}
   });
  }
  const picker=card.querySelector('[data-f111-qz24-pc-picker]');
  const button=card.querySelector('.f111-qz24-oneaction');
  const description=card.querySelector('.f111-qz24-selected-description');
  const status=card.querySelector('.f111-qz24-selected-status');
  const current=selectedCheck();if(!current)return;
  const key=current.nivel+'|'+current.numero;
  if(card.dataset.lastSelection!==key){
   // React puede reconstruir la ficha sin cambiar el examen. No cancelar un GET válido.
   if(lastSelectionKey!==key)requestSeq++;
   lastSelectionKey=key;card.dataset.lastSelection=key;
   picker.value=String(current.numero);
   description.textContent='Lección '+current.leccion+' · Unidades '+UNITS[current.numero-1];
   status.textContent=current.nivel==='B1'
    ?(current.numero<=2?'Banco digital histórico B1: consultar sin modificar notas.':'La vista B1 de este PC todavía no está disponible aquí.')
    :'Contenido para ensayo de personal autorizado. La disponibilidad se verifica al abrir.';
  }
  // Ocultar enlace heredado sin cambiar su destino, para mantener una sola acción visible.
  const b1=selected.querySelector('[data-f111-digital-oneclick]');
  if(b1&&b1.style.display!=='none')b1.style.display='none';
  const disabled=current.nivel==='B1'&&(current.numero>2||!b1);
  if(button.disabled!==disabled&&!/Verificando/.test(status.textContent))button.disabled=disabled;
  const old=selected.querySelector('p:not(.f111-qz24-selected-description):not(.f111-qz24-selected-status):not(.f111-qz24-selected-note)');
  if(old&&!old.hidden)old.hidden=true; // Mensaje antiguo de 'pendiente', ya desactualizado.
 }
 const observer=new MutationObserver(()=>{
  if(scheduled)return;
  scheduled=true;queueMicrotask(()=>{scheduled=false;mount();});
 });
 observer.observe(root,{childList:true,subtree:true});
 mount();
})();
