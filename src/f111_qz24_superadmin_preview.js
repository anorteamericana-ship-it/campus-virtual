// F111 R30 · Ensayo QZ24 in the EXISTING superadmin Centro de exámenes.
// This is an additive entry point. All authorization is server-side in @505.
// Never calls student save/submit, activation, grading, or CORE mutation APIs.
(function () {
 'use strict';
 const PREVIEW_API='https://script.google.com/macros/s/AKfycbx8S98VaY9QwC5qHMAtpVvzrijYsnINHQMCshA-l9SI47V7QLfLdcJ32L_UMV6Wd23xJg/exec';
 const LESSONS=[4,8,13,16,21,24,28,30];
 const root=document.getElementById('root');
 if(!root)return;
 let lastGroup='';
 let scheduling=false;

 function parentSuperadmin(){
  try{
   const p=window.parent;
   if(!p||p===window||typeof p.getSesion!=='function')return null;
   const session=p.getSesion()||{};
   return String(session.rol||'').trim().toLowerCase()==='superadmin'?p:null;
  }catch(_){return null}
 }
 function selectedCheck(){
  const label=root.querySelector('.d1-master .d1-pc-selected b');
  const match=String(label&&label.textContent||'').match(/\b(B1|B2|I1|I2)\s*[·-]\s*Progress Check\s*0?([1-8])\b/i);
  if(!match)return null;
  const number=Number(match[2]);
  return {nivel:match[1].toUpperCase(),numero:number,leccion:LESSONS[number-1]};
 }
 function make(doc,tag,text){
  const el=doc.createElement(tag);
  if(text!==undefined&&text!==null)el.textContent=text;
  return el;
 }
 function showPreview(parent,group,selection){
  const doc=parent.document;
  if(doc.querySelector('[data-f111-qz24-superadmin-modal]'))return;
  const backdrop=make(doc,'div');
  backdrop.dataset.f111Qz24SuperadminModal='true';
  backdrop.setAttribute('role','dialog');
  backdrop.setAttribute('aria-modal','true');
  backdrop.setAttribute('aria-label','Ensayo privado docente de Progress Check');
  backdrop.style.cssText='position:fixed;inset:0;z-index:65000;background:rgba(3,21,44,.76);display:flex;align-items:center;justify-content:center;padding:14px';
  const box=make(doc,'section');
  box.style.cssText='width:min(1250px,100%);height:min(94vh,950px);background:#fff;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 20px 65px #001b3c88';
  const bar=make(doc,'header');
  bar.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:14px;padding:15px 20px;background:#073b7a;color:#fff;font:600 14px Poppins,Arial,sans-serif';
  const heading=make(doc,'div','ENSAYO DOCENTE · '+selection.nivel+' · PC'+String(selection.numero).padStart(2,'0')+' · '+group);
  const close=make(doc,'button','Cerrar');
  close.type='button';
  close.style.cssText='border:0;border-radius:8px;padding:10px 15px;background:#fff;color:#073b7a;font:700 12px Poppins,Arial,sans-serif;cursor:pointer';
  bar.append(heading,close);
  const frame=make(doc,'iframe');
  frame.title='Cuestionario original · ensayo privado de docente';
  frame.style.cssText='width:100%;flex:1;min-height:0;border:0;background:#f5f7fc';
  const url=new URL('quiz_progress.html',location.href);
  url.searchParams.set('teacher_preview','1');
  url.searchParams.set('qz24_preview','1');
  url.searchParams.set('grupo',group);
  url.searchParams.set('nivel',selection.nivel);
  url.searchParams.set('leccion',String(selection.leccion));
  frame.src=url.href; // No token or credential in the URL.
  function dismiss(){
   doc.removeEventListener('keydown',esc);
   backdrop.remove();
  }
  function esc(e){if(e.key==='Escape'){e.preventDefault();dismiss()}}
  close.addEventListener('click',dismiss);
  backdrop.addEventListener('click',e=>{if(e.target===backdrop)dismiss()});
  doc.addEventListener('keydown',esc);
  box.append(bar,frame);
  backdrop.append(box);
  doc.body.append(backdrop);
  close.focus();
 }
 function mount(){
  const host=parentSuperadmin();
  if(!host)return;
  const section=root.querySelector('.d1-master .d1-pc');
  if(!section||section.querySelector('[data-f111-qz24-superadmin-preview]'))return;
  const card=make(document,'section');
  card.dataset.f111Qz24SuperadminPreview='true';
  card.style.cssText='margin-top:16px;padding:18px;border-radius:12px;border:1px solid #c8d8ec;background:#f5f9ff;color:#173c62;font:13px Poppins,Arial,sans-serif';
  const title=make(document,'h3','Ensayo interactivo · Progress Checks');
  title.style.cssText='margin:0 0 7px;font-size:17px;color:#073b7a';
  const explanation=make(document,'p','Vista previa exclusiva para superadmin. Seleccioná B2, I1 o I2 y PC01–PC08 arriba. Ingresá el código real del grupo; el servidor verifica la sesión antes de mostrar PDF y audio. No guarda respuestas ni activa estudiantes.');
  explanation.style.cssText='margin:0 0 12px;line-height:1.55';
  const controls=make(document,'div');
  controls.style.cssText='display:flex;gap:10px;flex-wrap:wrap;align-items:end';
  const label=make(document,'label','Código de grupo');
  label.style.cssText='display:grid;gap:5px;flex:1;min-width:210px;font-weight:700';
  const input=make(document,'input');
  input.type='text';
  input.dataset.f111Qz24Group='true';
  input.autocomplete='off';
  input.maxLength=45;
  input.placeholder='Ej. B2-LM69-C2-0526';
  input.value=lastGroup;
  input.style.cssText='border:1px solid #aebfd5;border-radius:8px;padding:10px;font:13px Poppins,Arial,sans-serif;width:100%';
  input.addEventListener('input',()=>{lastGroup=input.value});
  label.append(input);
  const button=make(document,'button','Abrir ensayo docente');
  button.type='button';
  button.style.cssText='border:0;border-radius:9px;padding:11px 16px;background:#073b7a;color:#fff;font:700 13px Poppins,Arial,sans-serif;cursor:pointer';
  const status=make(document,'p','Seleccioná un Progress Check de B2, I1 o I2. La apertura requiere un grupo real.');
  status.setAttribute('role','status');
  status.style.cssText='margin:10px 0 0;color:#4c617b;font-size:12px';
  controls.append(label,button);
  card.append(title,explanation,controls,status);
  button.addEventListener('click',async()=>{
   const hostNow=parentSuperadmin();
   const select=selectedCheck();
   const group=String(input.value||'').trim().toUpperCase();
   if(!hostNow){status.textContent='Tu sesión superadmin no está disponible. Volvé a ingresar al Campus.';return}
   if(!select){status.textContent='Primero seleccioná un Progress Check en la tabla superior.';return}
   if(select.nivel==='B1'){status.textContent='Para Básico I usá el control histórico B1 de la versión @504; este ensayo nuevo es solo B2, I1 e I2.';return}
   if(!/^[A-Z0-9][A-Z0-9-]{5,45}$/.test(group)){
    status.textContent='Ingresá un código válido de grupo académico.';return
   }
   const token=typeof hostNow.getSessionToken==='function'?String(hostNow.getSessionToken()||''):'';
   if(!token){status.textContent='Sesión no disponible. Cerrá sesión e ingresá nuevamente.';return}
   button.disabled=true;
   status.textContent='Validando grupo, nivel y acceso privado en el servidor…';
   try{
    const response=await fetch(PREVIEW_API+'?fn=qzProgressGet',{
     method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
     body:JSON.stringify({fn:'qzProgressGet',token,cod_grupo:group,nivel:select.nivel,leccion:select.leccion})
    });
    let data=null;
    try{data=await response.json()}catch(_){throw Error('La API devolvió una respuesta no válida.')}
    if(!response.ok||!data||data.ok!==true)throw Error(String(data&&data.error||'ensayo_no_disponible'));
    const expected='IC5_'+select.nivel+'_WQ'+String(select.numero).padStart(2,'0');
    if(data.quiz_id!==expected||data.nivel!==select.nivel||Number(data.leccion)!==select.leccion||
       data.vista_previa!==true||data.peso_oficial!==0)
     throw Error('El servidor no confirmó un ensayo privado de este quiz.');
    status.textContent='Acceso confirmado. Abriendo ensayo docente sin entregas ni notas.';
    showPreview(hostNow,group,select);
   }catch(err){
    const reason=String(err&&err.message||'');
    status.textContent=reason==='qz_prod_fuera_de_alcance'
     ?'La vista previa todavía está bloqueada en Apps Script; revisá la propiedad autorizada.'
     :reason==='no_autorizado_grupo_nivel'
      ?'El servidor no autoriza este grupo y nivel.'
      :'No se pudo abrir el ensayo: '+reason.slice(0,140);
   }finally{button.disabled=false}
  });
  section.append(card);
 }
 const observer=new MutationObserver(()=>{
  if(scheduling)return;
  scheduling=true;
  queueMicrotask(()=>{scheduling=false;mount()});
 });
 observer.observe(root,{childList:true,subtree:true});
 mount();
})();