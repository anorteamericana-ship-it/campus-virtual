// F111 QZ32: consulta de quizzes para docentes sin alterar el Centro protegido.
// Read-only: abrir una vista previa no activa ni entrega evaluaciones a estudiantes.
(function(){
'use strict';
const LEVELS=[['B1','Básico I','#D5A525'],['B2','Básico II','#B42E3C'],['I1','Intermedio I','#2C75B0'],['I2','Intermedio II','#347D50']];
const LESSONS=[[4,'1–2'],[8,'3–4'],[13,'5–6'],[16,'7–8'],[21,'9–10'],[24,'11–12'],[28,'13–14'],[30,'15–16']];
const STYLE='F111-TEACHER-QUIZ-REVIEW';
// R29: a NEW dedicated, versioned Apps Script deployment for teacher-only
// QZ24 rehearsals. Existing B1 QUIZ @504 and CORE @502 URLs stay untouched.
const QZ24_TEACHER_PREVIEW_API='https://script.google.com/macros/s/AKfycbx8S98VaY9QwC5qHMAtpVvzrijYsnINHQMCshA-l9SI47V7QLfLdcJ32L_UMV6Wd23xJg/exec';
const QZ24_LOCAL_QA=/^(localhost|127\.0\.0\.1)$/.test(String(location.hostname||''));
function make(tag,text,className){
 const e=document.createElement(tag);
 if(text!==null&&text!==undefined)e.textContent=text;
 if(className)e.className=className;
 return e;
}
// B1 PC02–08: una sola vista de cuestionario PDF y audio MP3 originales,
// servidos exclusivamente desde Apps Script con sesión de docente y grupo.
// No hay claves ni binarios Cambridge en Pages, ni se habilita el quiz al mirar.
function previewB1Protected(lesson,authorizedGroup){
 const token=window.getSessionToken?String(window.getSessionToken()||''):'';
 if(!token||!window.F111_QZ_API_URL){
  window.alert('Abrí el Campus con tu sesión docente para consultar el material protegido.');
  return false;
 }
 if(document.querySelector('[data-f111-b1-private-preview]'))return true;
 const overlay=make('div',null,'f111-tqr-workspace-backdrop');
 overlay.dataset.f111B1PrivatePreview='true';
 overlay.setAttribute('role','dialog');
 overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','Vista previa privada de Progress Check');
 const shell=make('section',null,'f111-tqr-workspace');
 const header=make('header',null,'f111-tqr-workspace-header');
 const ttl=make('div');
 ttl.append(make('small','PROGRESS CHECK · BÁSICO I · ACCESO DOCENTE'),
   make('h2','Vista previa del Quiz '+(LESSONS.findIndex(x=>x[0]===lesson)+1)),
   make('p',[8,13].includes(Number(lesson))?
    'Modelo digital':
    'Modelo de examen'));
 const close=make('button','CERRAR','f111-tqr-close');close.type='button';
 header.append(ttl,close);
 const frame=make('iframe');frame.className='f111-tqr-exam-frame';
 frame.style.cssText='flex:1;min-height:0;max-height:none;height:100%;width:100%;border:0';
 frame.title='Progress Check B1 · vista privada docente';
 const l=Number(lesson),earlyDigital=l===8||l===13;
 const digital=earlyDigital||[16,21,24,28,30].includes(l);
 const url=new URL(earlyDigital?'modulos/qz_b1_pc02_pc03_digital.html':
    digital?'modulos/qz_b1_pc04_pc08_digital.html':'modulos/quiz_progress.html',
   new URL('./',location.href));
 url.searchParams.set('teacher_preview','1');
 if(digital)url.searchParams.set('v','F111R65B1DIGITAL20261119');
 url.searchParams.set('grupo',authorizedGroup);
 url.searchParams.set('nivel','B1');
 url.searchParams.set('leccion',String(lesson));
 frame.src=url.href;
 function dismiss(){overlay.remove();document.removeEventListener('keydown',onKey);}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();dismiss();}}
 close.onclick=dismiss;
 overlay.onclick=e=>{if(e.target===overlay)dismiss();};
 document.addEventListener('keydown',onKey);
 shell.append(header,frame);overlay.append(shell);document.body.append(overlay);
 close.focus();return true;
}
// F111 D5: revisión digital compartida para B1 PC02–PC08.
// Solo profesor autenticado y grupo que ya pasó qzProgressTeacherB1Groups.
// Nunca altera notas oficiales, asistencia ni contenidos del PDF Cambridge.
function f111NormalizeApprovedRaw26(raw){
  if((typeof raw!=="number"&&typeof raw!=="string")||!/^(\d{1,2})(\.\d{1,2})?$/.test(String(raw).trim()))return null;
  const points=Number(raw);
  if(!Number.isFinite(points)||points<0||points>26)return null;
  return Math.floor((Math.round(points*100)*100+13)/26)/100;
}
function openB1TeacherReview(lesson,group,level='B1'){
 const en=()=>window.AN_I18N?.getLang()==='en';
 const copy=(es,english)=>en()?english:es;
 const number=LESSONS.findIndex(x=>x[0]===lesson)+1;
 const upper=['B2','I1','I2'].includes(level);
 if((!upper&&level!=='B1')||number<(upper?1:2)||number>8||!group||document.querySelector('[data-f111-b1-review]'))return;
 const previous=document.activeElement,context={cod_grupo:group,nivel:level,leccion:lesson};
 const quizId='IC5_'+level+'_WQ'+String(number).padStart(2,'0');
 const approvedRaw26=level==='I1'&&((lesson===24&&quizId==='IC5_I1_WQ06')||(lesson===30&&quizId==='IC5_I1_WQ08'));
 const backdrop=make('div',null,'f111-tqr-workspace-backdrop');
 backdrop.dataset.f111B1Review='true';
 backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');
 backdrop.setAttribute('aria-label','Revisión docente del Progress Check '+number);
 const layout=make('section',null,'f111-tqr-workspace');
 const header=make('header',null,'f111-tqr-workspace-header');
 const intro=make('div');
 intro.append(make('small',(copy(LEVELS.find(x=>x[0]===level)?.[1]||level,({B1:'Basic I',B2:'Basic II',I1:'Intermediate I',I2:'Intermediate II'})[level]||level).toUpperCase()+' · PROGRESS CHECK ')+String(number).padStart(2,'0')),
   make('h2',copy('Revisión de entregas · Lección ','Submission Review · Lesson ')+lesson),
   make('p',copy('Grupo ','Group ')+group+copy(' · diagnóstico 0% oficial · notas y comentarios independientes de asistencia',' · diagnostic, 0% official weight · scores and feedback independent of attendance')));
 const close=make('button',copy('CERRAR REVISIÓN','CLOSE REVIEW'),'f111-tqr-close');close.type='button';
 header.append(intro,close);layout.append(header);
 const columns=make('div',null,'f111-tqr-workspace-columns');
 const sidebar=make('aside',null,'f111-tqr-students');
 sidebar.append(make('h3',copy('Entregas del grupo','Group Submissions')));
 const tally=make('div',copy('Consultando entregas…','Loading submissions…'),'f111-tqr-group-average');
 tally.setAttribute('role','status');sidebar.append(tally);
 const students=make('div',null,'f111-tqr-student-list');sidebar.append(students);
 const detail=make('section',null,'f111-tqr-detail');
 detail.append(make('p',copy('Seleccioná una entrega para revisarla.','Select a submission to review.'),'f111-tqr-empty'));
 columns.append(sidebar,detail);layout.append(columns);backdrop.append(layout);document.body.append(backdrop);
 let rows=[],selected='',busy=false,uncertain=false,keyUrl=null,reviewCleanup=()=>{};
 function clearKey(){if(keyUrl){URL.revokeObjectURL(keyUrl);keyUrl=null;}}
 function dismiss(){reviewCleanup();clearKey();backdrop.remove();document.removeEventListener('keydown',onKey);
   if(previous&&previous.isConnected)previous.focus();}
 function onKey(event){if(event.key==='Escape'&&!busy){event.preventDefault();dismiss();}}
 close.onclick=()=>{if(!busy)dismiss();};
 backdrop.addEventListener('click',e=>{if(e.target===backdrop&&!busy)dismiss();});
 document.addEventListener('keydown',onKey);
 function code(row){return String(row.COD_ESTUDIANTE||'').trim();}
 function viewList(){
   const done=rows.filter(x=>String(x.ESTADO)==='REVISADO').length;
   tally.textContent=done+' / '+rows.length+copy(' entregas revisadas. Quizzes diagnósticos: 0% de nota oficial.',' submissions reviewed. Diagnostic quizzes: 0% official weight.');
   students.replaceChildren();
   if(!rows.length){students.append(make('p',copy('No hay entregas registradas para este Quiz.','No submissions recorded for this quiz.')));return;}
   for(const row of rows){
     const id=code(row),button=make('button',null,'f111-tqr-student-choice');
     button.type='button';button.setAttribute('aria-pressed',String(id===selected));
     button.append(make('strong',copy('Estudiante ','Student ')+id),
       make('small',row.ESTADO==='REVISADO'?copy('REVISADO · ','REVIEWED · ')+String(row.RESULTADO)+' / 100':copy('ENTREGADO · pendiente','SUBMITTED · pending review')));
     button.onclick=()=>{if(busy)return;selected=id;viewList();view(row);};
     students.append(button);
   }
 }
 async function refresh(){
   const data=await postQuiz('qzProgressTeacherList',context);
   if(data.quiz_id!==quizId||Number(data.leccion)!==lesson||!Array.isArray(data.intentos))
     throw Error('El servidor respondió con otro cuestionario.');
   const seen=new Set();
   rows=data.intentos.filter(x=>{
     const id=code(x);
     if(x.QUIZ_ID!==quizId||x.COD_GRUPO!==group||x.NIVEL!==level||
        Number(x.LECCION)!==lesson||!id||seen.has(id)||
        !['ENTREGADO','REVISADO'].includes(String(x.ESTADO)))return false;
     seen.add(id);return true;
   });
   viewList();
 }
 function view(row){
   reviewCleanup();reviewCleanup=()=>{};clearKey();uncertain=false;detail.replaceChildren();
   const id=code(row);
   detail.append(make('h3',copy('Estudiante ','Student ')+id));
   detail.append(make('p',copy('Respuestas archivadas · sin edición del intento · peso oficial 0%','Archived answers · read-only attempt · 0% official weight'),'f111-tqr-info'));
   const answers=make('div',null,'f111-tqr-answers');
   let reviewReady=!upper;
   let obj={};try{obj=JSON.parse(String(row.RESPUESTAS_JSON||'{}'))||{}}catch(_){}
   if(!obj||typeof obj!=='object'||Array.isArray(obj))obj={};
   const items=Object.keys(obj).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
   if(upper||(number>=2&&number<=8)){
     const frame=make('iframe');
     frame.title='Cuestionario digital con respuestas archivadas · Quiz '+number;
     frame.style.cssText='height:570px;max-height:65vh;width:100%;border:1px solid #d5e1ef;border-radius:11px;background:white';
     const url=new URL(upper?'modulos/qz_levels_digital.html':number<=3?'modulos/qz_b1_pc02_pc03_digital.html':
       'modulos/qz_b1_pc04_pc08_digital.html',new URL('./',location.href));
     url.searchParams.set('review','1');if(upper)url.searchParams.set('nivel',level);url.searchParams.set('grupo',group);
     url.searchParams.set('leccion',String(lesson));url.searchParams.set('v','F111R65B1DIGITAL20261119');
     if(upper)url.searchParams.set('raw26','F111RAW2620261127');
     frame.src=url.href;
     if(upper){
       const handler=event=>{
         if(event.origin!==location.origin||event.source!==frame.contentWindow||!frame.isConnected||event.data?.grupo!==group||event.data?.nivel!==level||event.data?.leccion!==lesson)return;
         if(event.data.type==='F111_QZ24_REVIEW_LOADED'){
           reviewReady=!approvedRaw26||(event.data.quiz_id===quizId&&event.data.puntos_total===26);return;
         }
         if(event.data.type!=='F111_QZ24_REVIEW_READY')return;
         frame.contentWindow.postMessage({type:'F111_QZ24_DIGITAL_REVIEW',leccion:lesson,grupo:group,nivel:level,respuestas:obj},location.origin);
       };
       window.addEventListener('message',handler);reviewCleanup=()=>window.removeEventListener('message',handler);
     }else frame.onload=()=>frame.contentWindow?.postMessage({
       type:'F111_PC23_TEACHER_REVIEW',leccion:lesson,grupo:group,respuestas:obj
     },location.origin);
     answers.append(frame);
   }else if(!items.length)answers.append(make('p','No hay respuestas archivadas.'));
   else for(const key of items){
     const val=String(obj[key]==null?'':obj[key]).slice(0,4000);
     answers.append(make('div',key+' · '+val));
   }
   detail.append(answers);
   const keyBtn=make('button',copy('VER CLAVE CAMBRIDGE (SOLO DOCENTE)','VIEW CAMBRIDGE ANSWER KEY (TEACHER ONLY)'),'f111-tqr-open');
   keyBtn.type='button';
   const keyStatus=make('small',copy('La clave se consulta bajo sesión docente; nunca aparece para estudiantes.','The answer key requires a teacher session and is never shown to students.'),'f111-tqr-feedback');
   detail.append(keyBtn,keyStatus);
   keyBtn.onclick=async()=>{
     keyBtn.disabled=true;keyStatus.textContent=copy('Cargando clave privada…','Loading private answer key…');
     try{
       const r=await postQuiz('qzProgressTeacherMaterials',{...context,material:'clave'});
       if(r.quiz_id!==quizId||r.material!=='clave'||r.mime!=='application/pdf'||
         typeof r.pdf_base64!=='string')throw Error('Clave no identificada');
       const raw=atob(r.pdf_base64);
       if(!raw.startsWith('%PDF-')||raw.length>5*1024*1024)throw Error('Documento inválido');
       const bytes=Uint8Array.from(raw,x=>x.charCodeAt(0));
       clearKey();keyUrl=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
       const frame=make('iframe');frame.className='f111-tqr-key-frame';
       frame.title='Clave privada de revisión · Quiz '+number;frame.src=keyUrl;
       detail.insertBefore(frame,gradeForm);
       keyStatus.textContent=copy('Clave Cambridge original (solo profesor).','Original Cambridge answer key (teacher only).');
     }catch(e){keyBtn.disabled=false;keyStatus.textContent='No se pudo consultar la clave: '+String(e.message||e);}
   };
   const gradeForm=make('form',null,'f111-tqr-grade-form');
   gradeForm.addEventListener('submit',e=>e.preventDefault());
   if(row.ESTADO==='REVISADO'){
     gradeForm.append(make('div',copy('REVISADO · ','REVIEWED · ')+String(row.RESULTADO)+' / 100','f111-tqr-reviewed'));
     gradeForm.append(make('p',copy('Comentario docente: ','Teacher feedback: ')+String(row.COMENTARIO_DOCENTE||'')));
     detail.append(gradeForm);return;
   }
   gradeForm.append(make('p',approvedRaw26?copy('Ingresá los puntos de la clave original sobre 26; se convierten automáticamente a 100. Ponderación oficial 0%.','Enter points from the original key out of 26; they are automatically converted to 100. Official weight 0%.'):copy('Puntuación diagnóstica manual 0–100. Consultá la clave y las respuestas originales antes de cerrar.','Manual diagnostic score (0–100). Review the answer key and original answers before closing.')));
   const gradeLabel=make('label',approvedRaw26?copy('Puntos obtenidos (0–26)','Points earned (0–26)'):copy('Nota del Quiz (0–100)','Quiz Score (0–100)'));
   const grade=make('input');grade.type='number';grade.min='0';grade.max=approvedRaw26?'26':'100';
   grade.step='0.01';grade.required=true;grade.setAttribute('aria-label',approvedRaw26?copy('Puntos obtenidos','Points earned'):copy('Nota del Quiz','Quiz Score'));
   gradeLabel.append(grade);
   if(approvedRaw26){
     const result=make('span',copy('Nota diagnóstica: — / 100','Diagnostic score: — / 100'),'f111-tqr-feedback');
     result.setAttribute('role','status');gradeLabel.append(result);
     grade.addEventListener('input',()=>{
       const normalized=f111NormalizeApprovedRaw26(grade.value);
       result.textContent=copy('Nota diagnóstica: ','Diagnostic score: ')+(normalized===null?'—':normalized.toFixed(2))+' / 100';
     });
   }
   const commentLabel=make('label',copy('Comentario de mejora (obligatorio)','Improvement Feedback (required)'));
   const comment=make('textarea');comment.maxLength=1500;comment.minLength=5;comment.required=true;
   comment.rows=4;comment.setAttribute('aria-label',copy('Comentario de mejora','Improvement Feedback'));
   commentLabel.append(comment);
   const save=make('button',copy('GUARDAR REVISIÓN DIAGNÓSTICA','SAVE DIAGNOSTIC REVIEW'),'f111-tqr-activate');
   save.type='submit';
   const feedback=make('div',copy('Al cerrar la revisión, el intento no podrá editarse.','After closing the review, the attempt cannot be edited.'),'f111-tqr-feedback');
   gradeForm.append(gradeLabel,commentLabel,save,feedback);
   gradeForm.onsubmit=async e=>{
     e.preventDefault();
     const raw=grade.value.trim(),value=approvedRaw26?f111NormalizeApprovedRaw26(raw):Number(raw),note=comment.value.trim();
     if(busy||uncertain)return;
     if(approvedRaw26?value===null:(!/^\d{1,3}(?:\.\d{1,2})?$/.test(raw)||!Number.isFinite(value)||value<0||value>100)){
       feedback.textContent=approvedRaw26?copy('Ingresá puntos válidos entre 0 y 26.','Enter valid points between 0 and 26.'):copy('Ingresá una nota numérica entre 0 y 100.','Enter a numeric score between 0 and 100.');return;
     }
     if(note.length<5||note.length>1500){feedback.textContent=copy('Comentario requerido: entre 5 y 1500 caracteres.','Feedback required: 5 to 1500 characters.');return;}
     if(upper&&!reviewReady){feedback.textContent=copy('Esperá la confirmación del formulario archivado.','Wait for the archived form to load.');return;}
     const scoreLabel=approvedRaw26?Number(raw)+'/26 = '+value.toFixed(2)+'/100':value+'/100';
     if(!window.confirm(en()?('Close diagnostic review for '+id+' with '+scoreLabel+'? Official grades will not change.'):('¿Cerrar la revisión diagnóstica de '+id+' con '+scoreLabel+'? No cambia la nota oficial.')))return;
     busy=true;save.disabled=true;grade.disabled=true;comment.disabled=true;
     feedback.textContent=copy('Guardando y comprobando el expediente…','Saving and verifying the record…');
     try{
       const r=await postQuiz('qzProgressTeacherReview',{...context,cod_estudiante:id,
         nota:value,...(approvedRaw26?{puntos_brutos:Number(raw)}:{}),comentario_progress_check:note});
       if(r.estado!=='REVISADO'||Number(r.nota)!==value||r.peso_oficial!==0)
         throw Error('Sin confirmación de la revisión.');
       await refresh();
       const verified=rows.find(x=>code(x)===id);
       if(!verified||verified.ESTADO!=='REVISADO'||Math.abs(Number(verified.RESULTADO)-value)>.011||
           String(verified.COMENTARIO_DOCENTE||'').trim()!==note)
         throw Error('La lectura posterior no coincide; no reenviés la revisión.');
       selected=id;viewList();view(verified);
     }catch(e){
       uncertain=true;
       feedback.textContent='Cierre sin verificar: '+String(e.message||e)+
         '. Cerrá y reabrí la revisión para leer su estado antes de repetir.';
     }finally{busy=false;}
   };
   detail.append(gradeForm);
 }
 refresh().catch(e=>{
   tally.textContent='No se pudieron consultar las entregas: '+String(e.message||e);
   detail.replaceChildren(make('p','La revisión no está disponible. No se modificaron notas.'));
 });
 close.focus();
}

// R10: one groups lookup per session, shared by PC02–08 (not seven Drive reads).
// Reset on account switch; failed requests are retryable. No mutable server state.
let b1GroupsCacheToken='',b1GroupsCache=null;
function authorizedB1Groups(){
 const token=window.getSessionToken?String(window.getSessionToken()||''):'';
 if(token!==b1GroupsCacheToken){b1GroupsCacheToken=token;b1GroupsCache=null;}
 if(!b1GroupsCache)b1GroupsCache=postQuiz('qzProgressTeacherB1Groups',{}).catch(error=>{
  b1GroupsCache=null;throw error;
 });
 return b1GroupsCache;
}
// R9: the assigned teacher explicitly selects a B1 group; no automatic opening.
// Only the backend decides if the lesson/date/role permits activation.
function buildB1TeacherOpenControls(lesson,preferredGroup){
 const wrap=make('div',null,'f111-tqr-r9-controls');
 const select=make('select',null,'f111-tqr-r9-group');
 // EXUI-05A: el grupo se fija en el selector único de Mis exámenes.
 select.setAttribute('aria-label','Grupo B1 autorizado');
 select.hidden=true;
 const status=make('small','Consultando grupos docentes…','f111-tqr-feedback');
 status.setAttribute('role','status');
 const previewBtn=make('button',([8,13,16,21,24,28,30].includes(Number(lesson))?
   'VER CUESTIONARIO DIGITAL':'VER MODELO DEL GRUPO'),'f111-tqr-open');
 const toggle=make('button','CONSULTANDO…','f111-tqr-activate');
 const reviewBtn=make('button','REVISAR ENTREGAS','f111-tqr-open');
 const resendBtn=make('button','REENVIAR INVITACIÓN','f111-tqr-activate');
 const studentsBtn=make('button','ACTUALIZAR ESTUDIANTES','f111-tqr-open');
 const rosterBox=make('div',null,'f111-r62-quiz-roster');
 rosterBox.setAttribute('role','region');
 rosterBox.setAttribute('aria-label','Estudiantes del Quiz y estado de entrega');
 rosterBox.style.cssText='width:100%;margin-top:12px;display:grid;gap:7px;background:#f8faff;border:1px solid #d8e1ef;border-radius:12px;padding:12px';
 for(const b of [previewBtn,toggle,reviewBtn,resendBtn,studentsBtn]){b.type='button';b.disabled=true;}
 wrap.append(make('strong','Grupo seleccionado: '+String(preferredGroup||'sin grupo')),select,previewBtn,toggle,resendBtn,reviewBtn,studentsBtn,status,rosterBox);
 let info=null,busy=false;
 const context=()=>({cod_grupo:select.value,nivel:'B1',leccion:lesson});
 async function refreshRoster(){
  rosterBox.replaceChildren(make('small','Consultando estudiantes y entregas reales…'));
  if(!select.value)return;
  try{
   const data=await postQuiz('qzProgressTeacherList',context());
   if(data?.ok!==true||Number(data.leccion)!==lesson||
      data.padron_verificado!==true||!Array.isArray(data.estudiantes))
    throw Error('El servidor no confirmó el padrón completo; no inferir ausencias.');
   const students=data.estudiantes;
   const groups=[['SIN_INICIAR','Listos para iniciar'],['BORRADOR','Borrador guardado'],
      ['ENTREGADO','Entregados · por revisar'],['REVISADO','Aplicados y revisados'],
      ['NO_HABILITADO','Matrícula no habilitada'],['VERIFICAR','Expediente por verificar']];
   rosterBox.replaceChildren();
   const valid=students.filter(x=>x.elegible===true);
   rosterBox.append(make('strong','Estado real · '+valid.length+' estudiantes habilitados'),
    make('small',students.filter(x=>x.estado==='REVISADO').length+' revisados · '+
      students.filter(x=>x.estado==='ENTREGADO').length+' entregados · '+
      students.filter(x=>x.estado==='BORRADOR').length+' borradores · '+
      students.filter(x=>x.estado==='SIN_INICIAR').length+' sin iniciar'));
   groups.forEach(([state,label])=>{
    const rows=students.filter(x=>x.estado===state);if(!rows.length)return;
    const details=make('details');details.open=state==='SIN_INICIAR'||state==='BORRADOR';
    const title=make('summary',label+' ('+rows.length+')');
    title.style.cssText='cursor:pointer;font-size:12px;font-weight:900;color:#173d67;padding:5px';
    details.append(title);
    rows.forEach(x=>{
      const el=make('div',String(x.nombre||x.codigo)+' · #'+String(x.codigo)+
        (state==='REVISADO'&&x.nota!==''?' · '+x.nota+'/100 (diagnóstico)':''));
      el.style.cssText='font-size:11px;padding:6px 8px;border-top:1px solid #d8e1ef';
      details.append(el);
    });
    rosterBox.append(details);
   });
   if(!students.length)rosterBox.append(make('p','Sin estudiantes verificables para este grupo y nivel.'));
  }catch(err){rosterBox.replaceChildren(make('p','No se pudo verificar la lista completa: '+String(err.message||err)));}
 }
 async function refresh(){
  toggle.disabled=true;previewBtn.disabled=true;reviewBtn.disabled=true;
  resendBtn.disabled=true;studentsBtn.disabled=true;info=null;
  if(!select.value){toggle.textContent='SIN GRUPO SELECCIONADO';status.textContent='Seleccioná un grupo autorizado.';return;}
  try{
   const data=await postQuiz('qzProgressTeacherAvailability',context());
   if(data.grupo!==select.value||Number(data.leccion)!==lesson||data.digital_disponible!==true)
    throw Error('Grupo o lección no habilitados');
   info=data;
   previewBtn.disabled=false;reviewBtn.disabled=false;studentsBtn.disabled=false;
   resendBtn.disabled=busy||data.estado!=='ABIERTO'||data.puede_reenviar!==true;
   toggle.textContent=data.estado==='ABIERTO'?(data.puede_cerrar===false?'QUIZ ASIGNADO':'CERRAR QUIZ PARA ESTUDIANTES'):'ACTIVAR QUIZ PARA ESTUDIANTES';
   toggle.disabled=busy||(data.estado==='ABIERTO'&&data.puede_cerrar===false)||(data.estado!=='ABIERTO'&&data.puede_abrir!==true);
   status.textContent='Quiz '+String(LESSONS.findIndex(x=>x[0]===lesson)+1)+' · '+
    (data.estado==='ABIERTO'?'Abierto por docente':data.puede_abrir?
     'Disponible para apertura docente. Si la fecha ya pasó, puede aplicarse hoy sin cambiar el calendario ni notas anteriores.':
     'No elegible según fecha, clase o permisos')+
    (data.fecha_programada?' · Fecha original: '+data.fecha_programada:'')+
    (data.estado==='ABIERTO'?' · Podés reenviar invitación sin cerrar ni reiniciar el Quiz.':'');
   void refreshRoster();
  }catch(e){toggle.textContent='NO DISPONIBLE';status.textContent='Servidor: '+String(e.message||e);toggle.disabled=true;
   rosterBox.replaceChildren(make('p','No se pudo consultar el estado del Quiz.'));}
 }
 studentsBtn.addEventListener('click',()=>{if(!busy)void refreshRoster()});
 resendBtn.addEventListener('click',async()=>{
  if(busy||!info||info.estado!=='ABIERTO'||!select.value)return;
  if(!window.confirm('¿Reenviar la invitación interna del Quiz al grupo '+select.value+
    '? Los estudiantes pendientes y con borrador volverán a ver el aviso en Evaluaciones. No se borran respuestas ni entregas.'))return;
  busy=true;resendBtn.disabled=true;select.disabled=true;
  status.textContent='Registrando nueva invitación interna…';
  try{
   const old=String(info.invitacion_version||'');
   const result=await postQuiz('qzProgressTeacherSetAvailability',
     {...context(),estado:'ABIERTO',reenviar_invitacion:true});
   if(result.reenviada!==true||!String(result.invitacion_version||'')||
      String(result.invitacion_version)===old)
    throw Error('El servidor no confirmó una invitación nueva.');
   const check=await postQuiz('qzProgressTeacherAvailability',context());
   if(check.estado!=='ABIERTO'||check.invitacion_version!==result.invitacion_version)
    throw Error('No coincide la lectura posterior; verificar antes de reenviar otra vez.');
   status.textContent='Nueva invitación interna registrada. Al entrar al Campus, cada estudiante pendiente verá el aviso.';
  }catch(err){status.textContent='Reenvío NO confirmado: '+String(err.message||err);}
  finally{busy=false;select.disabled=false;void refresh()}
 });
 select.addEventListener('change',()=>{previewBtn.disabled=!select.value;reviewBtn.disabled=!select.value;void refresh();});
 previewBtn.addEventListener('click',()=>{if(select.value)previewB1Protected(lesson,select.value);});
 reviewBtn.addEventListener('click',()=>{if(select.value){if(Number(lesson)===4)openReviewWorkspace(select.value);else openB1TeacherReview(lesson,select.value);}});
 toggle.addEventListener('click',async()=>{
  if(busy||!info||!select.value)return;
  if(info.estado==='ABIERTO'&&info.puede_cerrar===false)return;
  const next=info.estado==='ABIERTO'?'CERRADO':'ABIERTO';
  if(next==='ABIERTO'&&info.puede_abrir!==true)return;
  if(next==='ABIERTO'&&Number(lesson)===4){
   busy=true;try{await confirmGroupQuizInvitation(select.value,toggle,status,()=>{});}
   finally{busy=false;void refresh();}return;
  }
  if(!window.confirm((next==='ABIERTO'?'¿ACTIVAR':'¿CERRAR')+' el Quiz '+
      String(LESSONS.findIndex(x=>x[0]===lesson)+1)+' del grupo '+select.value+
      '? Esta acción afecta la disponibilidad para estudiantes reales.'))return;
  busy=true;toggle.disabled=true;select.disabled=true;status.textContent='Verificando cambio…';
  try{
   const data=await postQuiz('qzProgressTeacherSetAvailability',{...context(),estado:next});
   if(data.estado!==next)throw Error('Servidor no confirmó el estado');
   const readback=await postQuiz('qzProgressTeacherAvailability',context());
   if(readback.estado!==next||readback.grupo!==select.value||Number(readback.leccion)!==Number(lesson))throw Error('La lectura posterior no coincide');
   status.textContent='Confirmado: '+next;
  }catch(e){status.textContent='Cambio no confirmado: '+String(e.message||e);}
  finally{busy=false;select.disabled=false;void refresh();}
 });
 if(!String(preferredGroup||'').trim()){
  toggle.textContent='SIN GRUPO SELECCIONADO';
  status.textContent='Seleccioná primero un grupo en Mis exámenes.';
  return wrap;
 }
 authorizedB1Groups().then(data=>{
  if(!wrap.isConnected)return;
  const groups=(Array.isArray(data.grupos)?data.grupos:[])
   .filter(x=>x.nivel==='B1'&&typeof x.cod_grupo==='string');
  const empty=make('option','Seleccioná tu grupo B1');empty.value='';select.append(empty);
  for(const group of groups){const option=make('option',group.cod_grupo);option.value=group.cod_grupo;select.append(option);}
  const pinned=String(preferredGroup||'').trim().toUpperCase();
  if(pinned&&groups.some(x=>String(x.cod_grupo).trim().toUpperCase()===pinned)){
   select.value=groups.find(x=>String(x.cod_grupo).trim().toUpperCase()===pinned).cod_grupo;
   void refresh();
  }else{toggle.textContent='NO AUTORIZADO';status.textContent=groups.length?
    'El grupo seleccionado no está autorizado para este docente.':'No hay grupos B1 asignados.';}
 }).catch(e=>{toggle.textContent='NO DISPONIBLE';status.textContent='Grupos no disponibles: '+String(e.message||e);});
 return wrap;
}
// EXUI-05B: consulta estrictamente read-only para la Acción de hoy.
// La asignación docente y la elegibilidad de un PC se comprueban contra QUIZ;
// no habilita estudiantes, no crea entregas, no asigna notas.
async function readB1TeacherAvailabilityForToday(lesson,group){
 const number=Number(lesson),pinned=String(group||'').trim().toUpperCase();
 if(!LESSONS.some(x=>Number(x[0])===number)||!pinned)
  return {ok:false,reason:'invalid_context'};
 const assigned=await authorizedB1Groups();
 const groups=Array.isArray(assigned?.grupos)?assigned.grupos:[];
 if(!groups.some(x=>String(x.cod_grupo||'').trim().toUpperCase()===pinned&&x.nivel==='B1'))
  return {ok:false,reason:'not_assigned'};
 const data=await postQuiz('qzProgressTeacherAvailability',{cod_grupo:group,nivel:'B1',leccion:number});
 if(data?.ok!==true||String(data.grupo||'').trim().toUpperCase()!==pinned||
    Number(data.leccion)!==number||data.digital_disponible!==true||
    (data.nivel&&String(data.nivel).toUpperCase()!=='B1'))
  return {ok:false,reason:'not_available'};
 const estado=String(data.estado||'').toUpperCase();
 if(!['ABIERTO','CERRADO'].includes(estado))
  return {ok:false,reason:'not_available'};
 return {ok:true,estado,eligible:estado==='ABIERTO'||data.puede_abrir===true,
   alreadyOpen:estado==='ABIERTO'};
}
window.F111_QZ_readTeacherAvailability=readB1TeacherAvailabilityForToday;
// El mismo control de PC02–08 que usa el panel histórico puede abrirse
// directamente desde la tarjeta del grupo. Sin nuevas rutas ni permisos.
function openB1ProgressFromExamCard(lesson,group){
 const number=LESSONS.findIndex(x=>x[0]===Number(lesson))+1;
 if(number<1||number>8||!String(group||'').trim())return false;
 if(document.querySelector('[data-f111-b1-focus-control]'))return true;
 installStyle();
 const overlay=make('div',null,'f111-tqr-workspace-backdrop');
 overlay.dataset.f111B1FocusControl='true';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label','Control docente del Quiz '+number);
 const card=make('section',null,'f111-tqr-workspace');
 card.style.cssText='height:auto;max-height:90vh;width:min(630px,100%);overflow:auto';
 const header=make('header',null,'f111-tqr-workspace-header');
 const intro=make('div');
 intro.append(make('small','BÁSICO I · LECCIÓN '+lesson),
   make('h2','Quiz '+number+' · grupo '+String(group)),
   make('p','Material protegido, estado de apertura y revisión. El servidor valida cada operación.'));
 const close=make('button','CERRAR','f111-tqr-close');close.type='button';
 header.append(intro,close);
 const body=make('div',null,'f111-teacher-exam-card');
 body.style.cssText='margin:17px;display:grid;gap:12px';
 body.append(make('p','La apertura del Quiz exige autorización docente para el grupo y la lección. No altera notas oficiales.'),
   buildB1TeacherOpenControls(Number(lesson),String(group)));
 card.append(header,body);overlay.append(card);document.body.append(overlay);
 function dismiss(){overlay.remove();document.removeEventListener('keydown',onKey);}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();dismiss();}}
 close.onclick=dismiss;
 overlay.addEventListener('click',e=>{if(e.target===overlay)dismiss();});
 document.addEventListener('keydown',onKey);close.focus();return true;
}
window.F111_QZ_openTeacherControls=openB1ProgressFromExamCard;
// F111: acceso a MODELOS desde la plantilla docente principal, reutilizando
// los visores protegidos existentes. Jamás abre una evaluación al estudiante.
// La fecha programada no condiciona consultar materiales; la apertura sí
// requiere el control docente y la validación de QUIZ.
async function openTeacherQuizModelF111(lesson,group,level){
 const i=LESSONS.findIndex(x=>x[0]===Number(lesson));
 const lv=String(level||'').toUpperCase(),g=String(group||'').trim().toUpperCase();
 if(i<0||!g||!['B1','B2','I1','I2'].includes(lv))return false;
 const session=window.getSessionToken?String(window.getSessionToken()||''):'';
 if(!session)return false;
 if(lv==='B1'){
  // PC01 tampoco debe abrir el antiguo demo sintético; usa el mismo
  // modelo protegido de PDF, MP3 y controles por sesión real.
  return previewB1Protected(Number(lesson),g)===true;
 }
 // Estos tres niveles siguen bajo habilitación explícita de QUIZ.
 // La consulta comprueba rol, grupo, nivel y modelo desde el servidor.
 const response=await postQuiz('qzProgressGet',
  {cod_grupo:g,nivel:lv,leccion:Number(lesson)},
  {qz24TeacherPreview:true});
 if(response?.ok!==true||response.quiz_id!=='IC5_'+lv+'_WQ'+String(i+1).padStart(2,'0')||
    String(response.nivel)!==lv||Number(response.leccion)!==Number(lesson)||
    response.vista_previa!==true||Number(response.peso_oficial)!==0)
    return false;
 f111TeacherExamModal('Modelo docente · '+lv+' · PC'+String(i+1).padStart(2,'0'),
   f111ExamPageUrl('modulos/quiz_progress.html',
     {teacher_preview:1,qz24_preview:1,grupo:g,nivel:lv,leccion:Number(lesson)}));
 return true;
}
window.F111_QZ_openTeacherModel=openTeacherQuizModelF111;
function previewPC02(){
 // Vista editorial histórica, nunca concede acceso de estudiantes.
 const url=new URL('modulos/qz_b1_pc02_pc03_digital.html',new URL('./',location.href));
 url.searchParams.set('leccion','8');
 url.searchParams.set('preview','1');
 window.open(url.href,'_blank','noopener,noreferrer');
}
function preview(group){
 const url=new URL('modulos/qz_b1_pc01_digital.html',new URL('./',location.href));
 url.searchParams.set('preview','1');
 url.searchParams.set('rol','docente');
 if(group)url.searchParams.set('grupo',String(group));
 window.open(url.href,'_blank','noopener,noreferrer');
}
async function postQuiz(fn,data,options={}){
 const token=window.getSessionToken?window.getSessionToken():'';
 // Only this guarded teacher rehearsal path may target the NEW deployment.
 // Its URL is pinned here, never supplied by untrusted query parameters.
 const qz24Teacher=options.qz24TeacherPreview===true;
 if(qz24Teacher&&fn!=='qzProgressGet')
  throw Error('Endpoint no autorizado para el ensayo docente.');
 const isQuiz=/^qzProgress[A-Za-z0-9]+$/.test(String(fn||''));
 const original=String((isQuiz&&window.F111_QZ_API_URL)||window.APPS_SCRIPT_URL||'');
 const base=qz24Teacher&&!QZ24_LOCAL_QA?QZ24_TEACHER_PREVIEW_API:original;
 if(!token||!base)throw Error('Sesión docente no disponible');
 const res=await fetch(base+'?fn='+encodeURIComponent(fn),{
  method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify(Object.assign({fn,token},data||{}))
 });
 let j;try{j=await res.json()}catch(_){throw Error('Sin respuesta del servidor')}
 if(!res.ok||!j||j.ok!==true)throw Error(j&&j.error||'Operación no disponible');
 return j;
}
// Revisión ampliada: listado primero, luego examen REAL en vista de solo lectura.
// No crea exámenes ni reescribe notas oficiales o comentarios de asistencia.
function openReviewWorkspace(group){
 const groupCode=String(group||'').trim().toUpperCase();
 if(!groupCode)return;
 const qzContext={cod_grupo:groupCode,nivel:'B1',leccion:4};
 if(document.querySelector('[data-f111-review-workspace]'))return;
 const previous=document.activeElement;
 const backdrop=make('div',null,'f111-tqr-workspace-backdrop');
 backdrop.dataset.f111ReviewWorkspace='true';
 backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');
 backdrop.setAttribute('aria-label','Revisión de entregas · Quiz 1');
 const layout=make('section',null,'f111-tqr-workspace');
 const header=make('header',null,'f111-tqr-workspace-header');
 const hgroup=make('div');
 hgroup.append(make('small','ACADEMIA NORTEAMERICANA · PROGRESS CHECK 01'),
   make('h2','Revisión de entregas · Básico I'),
   make('p','Lección 4 · Unidades 1–2 · peso oficial 0% · comentario independiente de asistencia'));
 const close=make('button','CERRAR REVISIÓN','f111-tqr-close');close.type='button';
 header.append(hgroup,close);layout.append(header);
 const columns=make('div',null,'f111-tqr-workspace-columns');
 const sidebar=make('aside',null,'f111-tqr-students');
 sidebar.append(make('h3','Estudiantes que entregaron'));
 const groupAverage=make('div','PROMEDIO DEL GRUPO · Aún sin revisiones calificadas.','f111-tqr-group-average');
 groupAverage.setAttribute('role','status');sidebar.append(groupAverage);
 const listBox=make('div',null,'f111-tqr-student-list');
 listBox.setAttribute('role','list');listBox.append(make('p','Consultando entregas…'));
 sidebar.append(listBox);
 const detail=make('section',null,'f111-tqr-detail');
 detail.append(make('p','Elegí un estudiante para abrir el examen con sus respuestas.','f111-tqr-empty'));
 columns.append(sidebar,detail);layout.append(columns);backdrop.append(layout);document.body.append(backdrop);
 let rows=[],roster=new Map(),selectedCode='',keyBlobUrl=null;
 function cleanupKey(){if(keyBlobUrl){URL.revokeObjectURL(keyBlobUrl);keyBlobUrl=null;}}
 function dismiss(){cleanupKey();backdrop.remove();document.removeEventListener('keydown',onKey);window.removeEventListener('message',onGradeMessage);if(previous&&previous.isConnected)previous.focus();}
 function onKey(event){if(event.key==='Escape'){event.preventDefault();dismiss();}}
 close.onclick=dismiss;
 backdrop.addEventListener('click',event=>{if(event.target===backdrop)dismiss();});
 document.addEventListener('keydown',onKey);
 function getCode(row){return String(row.COD_ESTUDIANTE||'').trim();}
 function studentLabel(code){return roster.get(code)||'Estudiante '+code;}
 function parseAnswers(row){
  try{const obj=JSON.parse(String(row.RESPUESTAS_JSON||'{}'));
   return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
  }catch(_){return {};}
 }
 function displaySelection(){
  // Promedio solo de expedientes REVISADO con nota válida; pendientes no cuentan como 0.
  const reviewed=rows.filter(r=>String(r.ESTADO)==='REVISADO'&&
   r.RESULTADO!==null&&r.RESULTADO!==undefined&&String(r.RESULTADO).trim()!==''&&Number.isFinite(Number(r.RESULTADO))&&
   Number(r.RESULTADO)>=0&&Number(r.RESULTADO)<=100);
  if(reviewed.length){
   const average=reviewed.reduce((sum,r)=>sum+Number(r.RESULTADO),0)/reviewed.length;
   const rounded=Math.round(average*10)/10;
   groupAverage.textContent='PROMEDIO DEL GRUPO · '+(rounded/4).toFixed(1)+
    '/25 · '+rounded.toFixed(1)+'% · '+letterFor(average)+
    ' · '+reviewed.length+' de '+rows.length+' entregas revisadas · peso oficial 0%';
  }else groupAverage.textContent='PROMEDIO DEL GRUPO · 0 de '+rows.length+
   ' entregas revisadas. Pendientes no cuentan como cero; peso oficial 0%.';
  listBox.replaceChildren();
  if(!rows.length){listBox.append(make('p','Todavía no hay pruebas entregadas.'));return;}
  rows.forEach(row=>{
   const code=getCode(row),btn=make('button',null,'f111-tqr-student-choice');
   btn.type='button';btn.setAttribute('role','listitem');
   btn.setAttribute('aria-pressed',String(code===selectedCode));
   btn.append(make('strong',studentLabel(code)),make('small','Código '+code+' · '+(row.ESTADO==='REVISADO'?'REVISADO':'ENTREGADO')));
   btn.onclick=()=>{selectedCode=code;displaySelection();showStudent(row);};
   listBox.append(btn);
  });
 }
 async function loadRows(selectFirst){
  const delivered=await postQuiz('qzProgressTeacherList',qzContext);
  rows=Array.isArray(delivered.intentos)?delivered.intentos:[];
  rows=rows.filter(r=>r&&getCode(r)&&String(r.COD_GRUPO||'')===groupCode&&
   String(r.NIVEL||'')==='B1'&&Number(r.LECCION)===4&&
   ['ENTREGADO','REVISADO'].includes(String(r.ESTADO)));
  // Los nombres proceden del padrón autorizado; una falla no oculta entregas.
  try{
   const r=await postQuiz('getEstudiantesParaCierre',{cod_grupo:groupCode,nivel:'B1'});
   (Array.isArray(r.estudiantes)?r.estudiantes:[]).forEach(person=>{
    const code=String(person.code||person.codigo||person.CODIGO||'').trim();
    const name=String(person.name||person.nombre||person.NOMBRE||'').trim();
    if(code&&name)roster.set(code,name);
   });
  }catch(_){}
  if(selectFirst&&!rows.some(r=>getCode(r)===selectedCode))selectedCode='';
  displaySelection();
 }
 let gradeReceiver=null,reviewSeq=0;
 function onGradeMessage(event){if(typeof gradeReceiver==='function'&&event.origin===location.origin)gradeReceiver(event);}
 window.addEventListener('message',onGradeMessage);
 function letterFor(percentage){
  const p=Number(percentage);
  return p>=90?'A':p>=87?'B+':p>=80?'B':p>=77?'C+':p>=70?'C':p>=60?'D':'F';
 }
 function showStudent(row){
  cleanupKey();detail.replaceChildren();
  const code=getCode(row),nonce='review-'+(++reviewSeq);
  const top=make('div',null,'f111-tqr-detail-top');
  top.append(make('h3',studentLabel(code)),make('small','Quiz 1 · '+String(row.ESTADO||'ENTREGADO')+' · 25 preguntas · peso oficial 0%'));
  detail.append(top);
  const gradePanel=make('div',String(row.ESTADO)==='REVISADO'?'Revisión cerrada · el resultado definitivo aparece debajo.':'Cargando la clave privada del docente…','f111-tqr-score-banner');
  gradePanel.setAttribute('role','status');detail.append(gradePanel);
  const frame=make('iframe');frame.className='f111-tqr-exam-frame';frame.title='Examen del estudiante y corrección por pregunta';
  const url=new URL('modulos/qz_b1_pc01_digital.html',new URL('./',location.href));
  url.searchParams.set('review','1');
  url.searchParams.set('v','F111PC01REVIEWCOLORS20261024');
  let frameLoaded=false,payload=null,score=null;
  frame.addEventListener('load',()=>{
   frameLoaded=true;
   if(payload&&frame.isConnected&&frame.contentWindow)
    frame.contentWindow.postMessage(payload,location.origin);
  });
  frame.src=url.href;detail.append(frame);
  gradeReceiver=function(event){
   const data=event.data;
   if(String(row.ESTADO)==='REVISADO'||event.source!==frame.contentWindow||!data||data.type!=='F111_PC01_TEACHER_GRADE'||
      data.nonce!==nonce||data.weight_official!==0)return;
   if(typeof data.points!=='number'||data.points<0||data.points>25||
      !Number.isFinite(data.percentage)||Math.abs(data.percentage-data.points*4)>0.001)return;
   score=data;
   gradePanel.textContent='RESULTADO DIAGNÓSTICO · '+score.points+'/25 · '+score.percentage.toFixed(0)+'% · '+score.letter+' · Ponderación oficial 0%';
   gradePanel.dataset.ready='true';
   if(gradeInput){gradeInput.value=score.points+'/25 · '+score.percentage.toFixed(0)+'% · '+score.letter+' · Ponderación oficial 0%';gradeInput.dataset.gradeBand=score.percentage>=90?'alta':score.percentage>=70?'media':'baja';}
   if(gradeSubmit)gradeSubmit.disabled=false;
  };
  // La clave NO existe en Pages; qzProgressTeacherMaterials exige sesión docente válida.
  void postQuiz('qzProgressTeacherMaterials',Object.assign({},qzContext,{material:'clave_items'}))
   .then(result=>{
    if(reviewSeq!==Number(nonce.split('-')[1])||!frame.isConnected)return;
    const keys=result.claves;
    if(!result.solo_docente||Number(result.puntos_total)!==25||Number(result.peso_oficial)!==0||
       !keys||Object.keys(keys).length!==25)throw Error('Clave Cambridge incompleta');
    payload={type:'F111_PC01_TEACHER_REVIEW',answers:parseAnswers(row),keys,nonce,locked:String(row.ESTADO)==='REVISADO'};
    if(frameLoaded&&frame.contentWindow)frame.contentWindow.postMessage(payload,location.origin);
   })
   .catch(err=>{if(frame.isConnected){gradePanel.textContent='No se pudo verificar la clave privada: '+String(err.message||'Error')+'. No es posible cerrar una revisión sin su clave.';gradePanel.dataset.ready='false';}});
  let gradeInput=null,gradeSubmit=null;
  if(String(row.ESTADO)==='REVISADO'){
   const pct=Number(row.RESULTADO);
   if(Number.isFinite(pct)&&pct>=0&&pct<=100)
    detail.append(make('p','REVISADO · '+(pct/4).toFixed(pct%4===0?0:1)+'/25 · '+pct+'% · '+letterFor(pct)+' · peso oficial 0%','f111-tqr-reviewed'));
   else detail.append(make('p','REVISADO · Resultado pendiente de validar','f111-tqr-reviewed'));
   detail.append(make('p','Comentario de Progress Check: '+String(row.COMENTARIO_DOCENTE||'—'),'f111-tqr-info'));
   return;
  }
  const form=make('form',null,'f111-tqr-grade-form');
  const label=make('label','Resultado diagnóstico · puntos /25 · porcentaje · letra (ponderación oficial 0%)');
  gradeInput=make('input');gradeInput.type='text';gradeInput.className='f111-tqr-grade-result';
  gradeInput.readOnly=true;gradeInput.required=true;
  gradeInput.placeholder='Se calcula desde las 25 respuestas';
  gradeInput.setAttribute('aria-label','Nota diagnóstica en puntos, porcentaje y letra; peso oficial cero');
  label.append(gradeInput);
  const commentLabel=make('label','Comentario de Progress Check (obligatorio, independiente de asistencia)');
  const comment=make('textarea');comment.required=true;comment.minLength=5;comment.maxLength=1500;comment.rows=4;
  commentLabel.append(comment);
  gradeSubmit=make('button','GUARDAR RESULTADO DIAGNÓSTICO Y COMENTARIO','f111-tqr-open');
  gradeSubmit.type='submit';gradeSubmit.disabled=true;
  const feedback=make('p','','f111-tqr-feedback');feedback.setAttribute('role','status');
  form.append(label,commentLabel,gradeSubmit,feedback);detail.append(form);
  form.addEventListener('submit',async ev=>{
   ev.preventDefault();if(!form.reportValidity()||!score||gradeSubmit.disabled)return;
   const savedScore={...score};
   if(!window.confirm('Cerrar revisión de '+studentLabel(code)+' con '+savedScore.points+'/25 = '+
      savedScore.percentage+'% ('+savedScore.letter+') y comentario? Peso oficial: 0%.'))return;
   gradeSubmit.disabled=true;feedback.textContent='Guardando resultado y comprobando la revisión…';
   try{
    const result=await postQuiz('qzProgressTeacherReview',Object.assign({},qzContext,{
     cod_estudiante:code,nota:savedScore.percentage,comentario_progress_check:comment.value.trim()
    }));
    if(result.estado!=='REVISADO'||result.comentario_asistencia_modificado!==false||
       Number(result.nota)!==savedScore.percentage||Number(result.peso_oficial)!==0)
      throw Error('Sin confirmación de resultado diagnóstico');
    const verified=await postQuiz('qzProgressTeacherList',qzContext);
    const inScope=r=>r&&String(r.COD_GRUPO||'')===groupCode&&String(r.NIVEL||'')==='B1'&&Number(r.LECCION)===4;
    const saved=(Array.isArray(verified.intentos)?verified.intentos:[]).find(r=>inScope(r)&&getCode(r)===code);
    if(!saved||saved.ESTADO!=='REVISADO'||Number(saved.RESULTADO)!==savedScore.percentage)
      throw Error('Sin lectura de regreso del resultado. Revisá el listado antes de reintentar.');
    rows=(Array.isArray(verified.intentos)?verified.intentos:[]).filter(r=>inScope(r)&&getCode(r));
    displaySelection();showStudent(saved);
   }catch(err){
    feedback.textContent='No se pudo confirmar la revisión: '+String(err.message||'Error')+'. Consultá el listado antes de reintentar.';
    gradeSubmit.disabled=false;
   }
  });
 }

 void loadRows(true).catch(err=>{
  listBox.replaceChildren(make('p','No se pudieron consultar las entregas: '+String(err.message||'Error')));
 });
 close.focus();
}
async function confirmGroupQuizInvitation(group,button,feedback,refresh){
 const groupCode=String(group||'').trim().toUpperCase();
 if(!groupCode){feedback.textContent='Seleccioná un grupo autorizado.';return;}
 const qzContext={cod_grupo:groupCode,nivel:'B1',leccion:4};
 button.disabled=true;feedback.textContent='Consultando lista de estudiantes…';
 try{
  const gate=await postQuiz('qzProgressTeacherAvailability',qzContext);
  if(gate.grupo!==groupCode||Number(gate.leccion)!==4||gate.digital_disponible!==true||
     gate.estado!=='CERRADO'||gate.puede_abrir!==true)
   throw Error('Apertura no autorizada para grupo/lección');
  const r=await postQuiz('getEstudiantesParaCierre',{cod_grupo:groupCode,nivel:'B1'});
  const students=Array.isArray(r.estudiantes)?r.estudiantes:[];
  const list=[...new Map(students.map(s=>{
   const code=String(s.code||s.codigo||s.CODIGO||'').trim();
   const name=String(s.name||s.nombre||s.NOMBRE||'').trim();
   return [code,name];
  }).filter(pair=>pair[0])).entries()];
  if(!list.length)throw Error('lista_no_disponible');
  const message='¿Activar Quiz 1 y enviar la invitación interna a estos '+list.length+
    ' estudiantes del grupo?'+String.fromCharCode(10,10)+
    list.map(([code,name])=>(name||'Estudiante')+' · '+code).join(String.fromCharCode(10))+
    String.fromCharCode(10,10)+'El aviso aparecerá cuando entren al Campus.';
  if(!window.confirm(message)){refresh();return;}
  const result=await postQuiz('qzProgressTeacherSetAvailability',Object.assign({},qzContext,{estado:'ABIERTO'}));
  if(result.estado!=='ABIERTO')throw Error('apertura_no_confirmada');
  const verify=await postQuiz('qzProgressTeacherAvailability',qzContext);
  if(verify.estado!=='ABIERTO')throw Error('readback_no_confirmado');
  feedback.textContent='Quiz habilitado para el grupo. Los estudiantes elegibles verán el aviso al ingresar.';
  refresh();
 }catch(err){
  feedback.textContent='Invitación no confirmada: '+String(err.message||'No disponible')+'.';
  refresh();
 }
}

// EXUI-05A: sin activación inyectada ni segundo catálogo visual.
// F111 D3: Extensión del MISMO centro docente existente. No muta los
// componentes React ni el paquete inmutable de exámenes escritos EX04.
function f111TeacherExamModal(title,url){
 if(document.querySelector('[data-f111-teacher-exam-modal]'))return;
 const overlay=make('div',null,'f111-tqr-workspace-backdrop');
 overlay.dataset.f111TeacherExamModal='true';
 overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');
 overlay.setAttribute('aria-label',title);
 const shell=make('section',null,'f111-tqr-workspace');
 const bar=make('header',null,'f111-tqr-workspace-header');
 const info=make('div');
 const historialOral=new URL(url,location.href).searchParams.get('historial')==='1';
 info.append(make('small','ACADEMIA NORTEAMERICANA · CAMPUS VIRTUAL'),make('h2',title),
  make('p',historialOral?'Revisá y guardá cada borrador. La nota oficial preexistente exige conciliación antes del cierre.':'Vista institucional por nivel · La vista previa no crea calificaciones ni entregas.'));
 const close=make('button','CERRAR','f111-tqr-close');close.type='button';
 bar.append(info,close);
 const frame=make('iframe');frame.title=title;frame.src=url;
 frame.style.cssText='flex:1;min-height:0;width:100%;height:100%;border:0;background:white';
 // R49: the oral document lives inside this modal iframe. A user-initiated
 // official Drive link must open outside the sandbox; downloads also need permission.
 frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-modals allow-presentation allow-popups allow-popups-to-escape-sandbox allow-downloads');
 shell.append(bar,frame);overlay.append(shell);document.body.append(overlay);
 const off=()=>{document.removeEventListener('keydown',key);overlay.remove();};
 const key=e=>{if(e.key==='Escape')off();};
 close.addEventListener('click',off);overlay.addEventListener('click',e=>{if(e.target===overlay)off();});
 document.addEventListener('keydown',key);close.focus();
}
function f111ExamPageUrl(path,params){
 const url=new URL(path,new URL('./',location.href));
 for(const [k,v] of Object.entries(params||{}))if(v!=null)url.searchParams.set(k,String(v));
 if(path==='modulos/examen_oral.html'&&String(params?.historial||'')==='1')url.searchParams.set('ui','F111R50ESTADOS20261103');url.searchParams.set('acciones','F111R49TWO20261102');if(path==='modulos/examen_oral.html')url.searchParams.set('r50fix','F111ORALRETRY20261125');
 return url.href;
}
function f111TeacherGroups(){
 const ses=typeof window.getSesion==='function'?window.getSesion()||{}:{};
 const raw=[ses.grupo,ses.grupoActivo,ses.cod_grupo];
 if(Array.isArray(ses.grupos))
  for(const g of ses.grupos)raw.push(typeof g==='string'?g:g&&(g.grupo||g.cod_grupo||g.codigo));
 return Array.from(new Set(raw.map(x=>String(x||'').trim()).filter(Boolean)));
}
// F111 R17: obtener la lista autorizada por APOLLO.GRUPOS, no por sesión local.
// getDocenteGruposActuales devuelve todos (incluye niveles históricos) y grupos
// (únicamente COMENTARIO=En curso). Para el historial se necesitan ambos casos.
function f111AuthorizedCourseGroups(data){
 const rows=Array.isArray(data&&data.todos)?data.todos:
  (Array.isArray(data&&data.grupos)?data.grupos:[]);
 const seen=new Set(),out=[];
 for(const row of rows){
  if(!row||row.puede_curso===false||row.permisos_riel?.curso===false)continue;
  const code=String(typeof row==='string'?row:
   (row.code||row.cod_grupo||row.codigo_grupo||row.grupo||row.codigo||'')).trim();
  if(!code||seen.has(code))continue;
  seen.add(code);out.push(code);
 }
 return out;
}
// EXUI-05C: acceso contextual al expediente oral ya existente; SOLO lectura
// de grupos asignados e historia real. Un contexto suministrado por la UI
// nunca concede permisos, ni crea borradores, notas o archivos PDF.
async function openSavedOralForStudent(context){
 const group=String(context?.grupo||'').trim().toUpperCase(),
   level=String(context?.nivel||'').trim().toUpperCase(),
   lesson=Number(context?.leccion),
   student=String(context?.cod_estudiante||'').trim();
 if(!/^[A-Z0-9][A-Z0-9-]{5,45}$/.test(group)||
    !['B1','B2','I1','I2'].includes(level)||
    ![9,17,25,31].includes(lesson)||!/^[A-Za-z0-9_-]{2,60}$/.test(student))
  return {ok:false,reason:'contexto_invalido'};
 try{
  const owned=await postQuiz('getDocenteGruposActuales',{});
  if(!f111AuthorizedCourseGroups(owned).some(x=>String(x).trim().toUpperCase()===group))
   return {ok:false,reason:'grupo_no_asignado'};
  const result=await postQuiz('oralListEvaluacionesDocente',{cod_grupo:group});
  if(result?.ok===false||!Array.isArray(result?.rows))
   return {ok:false,reason:'historial_no_verificable'};
  const matching=result.rows.filter(r=>
   String(r.nivel||'').trim().toUpperCase()===level&&Number(r.leccion)===lesson&&
   String(r.cod_estudiante||'').trim()===student&&
   (!r.cod_grupo||String(r.cod_grupo).trim().toUpperCase()===group));
  if(matching.length!==1)return {ok:false,reason:matching.length?'historial_ambiguo':'sin_expediente'};
  const record=matching[0];
  f111TeacherExamModal('Expediente oral · '+level+' · L'+lesson,
   f111ExamPageUrl('modulos/examen_oral.html',{
    historial:1,grupo:group,nivel:level,leccion:lesson,
    fecha:String(record.fecha||''),cod_estudiante:student
   }));
  return {ok:true};
 }catch(_){return {ok:false,reason:'consulta_no_disponible'};}
}
window.F111_QZ_openSavedOral=openSavedOralForStudent;
// F111 QZ24 · selector docente de ensayo SIN activar alumnos ni crear intentos.
// Los grupos vienen exclusivamente de getDocenteGruposActuales; cada clic
// repite validación de contexto en qzProgressGet, read-only, antes del iframe.
// El backend en PROD sigue B1-only hasta cierre global 24/24.
function createQz24RehearsalCard(groupSelector){
 const card=make('article',null,'f111-teacher-exam-card');
 card.dataset.f111Qz24Rehearsal='true';
 card.append(make('h4','Ensayo interactivo · Progress Checks'),
   make('p','Elegí un grupo docente autorizado y uno de sus 8 quizzes. Podés rellenar las respuestas y consultar el PDF/audio desde tu sesión, pero el ensayo NO guarda, entrega ni abre evaluaciones.'));
 const state=make('p','Consultando grupos autorizados…','f111-tqr-feedback');
 state.setAttribute('role','status');
 const filter=make('div',null,'f111-teacher-exam-controls');
 const levelPicker=make('select');levelPicker.dataset.f111Qz24Level='true';
 levelPicker.setAttribute('aria-label','Nivel que desea ensayar el docente');
 for(const [key,name] of LEVELS){const option=make('option',name);option.value=key;levelPicker.append(option);}
 filter.append(make('span','Nivel del quiz:'),levelPicker);
 const grid=make('div',null,'f111-teacher-exam-controls');
 grid.dataset.f111Qz24Lessons='true';
 card.append(state,filter,grid);
 let requestId=0,previousGroup='';
 function render(){
  requestId++;
  const group=String(groupSelector.value||'').trim().toUpperCase();
  // El prefijo del grupo ofrece solo el valor inicial: los grupos pueden
  // ascender de nivel sin cambiar de código. El backend decide los permisos.
  if(group!==previousGroup){
    previousGroup=group;
    const preferred=group.match(/^(B1|B2|I1|I2)-/);
    if(preferred)levelPicker.value=preferred[1];
  }
  const level=String(levelPicker.value||'').toUpperCase();
  grid.replaceChildren();
  if(!/^[A-Z0-9][A-Z0-9-]{5,45}$/.test(group)||!LEVELS.some(x=>x[0]===level)){
   state.textContent='Seleccioná un grupo autorizado y un nivel válido.';
   return;
  }
  const levelInfo=LEVELS.find(x=>x[0]===level);
  state.textContent=(levelInfo?levelInfo[1]:level)+' · '+group+' · ensayo de docente solamente. El servidor comprobará el permiso antes de abrir.';
  for(let i=0;i<LESSONS.length;i++){
   const lesson=LESSONS[i][0],number=i+1;
   const btn=make('button','PC'+String(number).padStart(2,'0')+' · U'+LESSONS[i][1],'f111-tqr-open');
   btn.type='button';btn.dataset.f111Qz24Lesson=String(lesson);
   btn.addEventListener('click',async()=>{
    const wanted=String(groupSelector.value||'').trim().toUpperCase();
    if(wanted!==group||!window.getSessionToken||!window.getSessionToken())return;
    const serial=++requestId;
    btn.disabled=true;state.textContent='Verificando acceso docente a '+level+' PC'+number+'…';
    try{
     // No confiar solo en el selector: el servidor autentica docente/grupo/nivel
     // y valida calendario. Un error 403/PROD bloqueado NO abre el iframe.
     const q=await postQuiz('qzProgressGet',{cod_grupo:group,nivel:level,leccion:lesson},{qz24TeacherPreview:true});
     if(serial!==requestId||String(groupSelector.value||'').trim().toUpperCase()!==group)return;
     if(q.quiz_id!=='IC5_'+level+'_WQ'+String(number).padStart(2,'0')||
        q.nivel!==level||Number(q.leccion)!==lesson||
        q.peso_oficial!==0||q.vista_previa!==true)
       throw Error('El servidor no confirmó un ensayo de este grupo y nivel.');
     state.textContent='Ensayo privado autorizado para '+level+' · PC'+String(number).padStart(2,'0')+'.';
     f111TeacherExamModal('Ensayo docente · '+level+' · PC'+String(number).padStart(2,'0'),
       f111ExamPageUrl('modulos/quiz_progress.html',{
         teacher_preview:1,qz24_preview:1,grupo:group,nivel:level,leccion:lesson
       }));
    }catch(e){
     if(serial===requestId){
      const reason=String(e&&e.message||e);
      if(reason.includes('qz_prod_fuera_de_alcance'))
       state.textContent='Ensayo privado todavía sin autorizar para este nivel. Dirección debe habilitar el acceso docente en QUIZ; los estudiantes continúan bloqueados.';
      else if(reason.includes('no_autorizado_grupo_nivel'))
       state.textContent='Este grupo y nivel no están autorizados para tu sesión docente. Verificá la asignación antes de intentar otro examen.';
      else if(reason.includes('progress_check_no_programado')||reason.includes('calendario_no_disponible'))
       state.textContent='No se pudo validar el calendario de este examen. El ensayo permanece bloqueado sin realizar cambios.';
      else
       state.textContent='Ensayo no habilitado: '+reason;
     }
    }finally{btn.disabled=false;}
   });
   grid.append(btn);
   if(level!=='B1'){
    const reviewButton=make('button','REVISAR ENTREGAS PC'+String(number).padStart(2,'0'),'f111-tqr-open');
    reviewButton.type='button';reviewButton.dataset.f111Qz24ReviewLesson=String(lesson);
    reviewButton.onclick=async()=>{
      if(String(groupSelector.value||'').trim().toUpperCase()!==group||levelPicker.value!==level)return;
      reviewButton.disabled=true;
      try{const q=await postQuiz('qzProgressTeacherAvailability',{cod_grupo:group,nivel:level,leccion:lesson});
       if(q.quiz_id!=='IC5_'+level+'_WQ'+String(number).padStart(2,'0')||q.grupo!==group||Number(q.leccion)!==lesson||q.peso_oficial!==0||q.digital_disponible!==true)throw Error('Revisión digital todavía no habilitada.');
       if(String(groupSelector.value||'').trim().toUpperCase()===group&&levelPicker.value===level)openB1TeacherReview(lesson,group,level);
      }catch(e){state.textContent='Revisión no disponible: '+String(e.message||e);}finally{reviewButton.disabled=false;}
    };grid.append(reviewButton);
   }
  }
 }
 levelPicker.addEventListener('change',render);
 render();
 return {card,render,levelPicker};
}
function buildTeacherExamsF111(){
 const section=make('section',null,'f111-teacher-exam-center');
 section.dataset.f111TeacherExamCenter='true';
 section.append(make('small','ACADEMIA NORTEAMERICANA · EXÁMENES DEL DOCENTE'),
  make('h3','Mis evaluaciones y modelos'),
  make('p','Consultá los orales guardados aunque la clase esté cerrada. Los modelos son únicamente para vista previa.'));
 const summary=make('div',null,'f111-teacher-exam-grid');
 const history=make('article',null,'f111-teacher-exam-card');
 history.append(make('h4','Historial · Exámenes orales'));
 history.append(make('p','Borradores, evaluaciones cerradas y PDF del grupo. La consulta no reabre lecciones.'));
 const control=make('div',null,'f111-teacher-exam-controls');
 const select=make('select');
 select.setAttribute('aria-label','Grupo docente para historial oral');
 // Selector inicialmente vacío: solo se ofrece el grupo después de comprobar
 // la lista autenticada del backend. Nunca elevar USUARIOS.grupo a permiso.
 const refresh=make('button','Actualizar historial','f111-tqr-open');refresh.type='button';
 const lookup=make('input');lookup.type='search';lookup.placeholder='Código de grupo: B1-LM69-C2-0526';
 lookup.setAttribute('aria-label','Buscar grupo de orales guardados');
 lookup.style.cssText='min-width:220px;max-width:100%;padding:8px;border:1px solid #c9d7e6;border-radius:8px';
 const lookupBtn=make('button','BUSCAR GRUPO','f111-tqr-open');lookupBtn.type='button';
 control.append(select,refresh,lookup,lookupBtn);
 const result=make('div',null,'f111-teacher-exam-results');result.setAttribute('role','status');
 history.append(control,result);
 const rehearsal=createQz24RehearsalCard(select);
 let busy=false;
 async function loadHistory(){
  if(busy)return;
  const grupo=String(select.value||'').trim();
  result.replaceChildren();
  if(!grupo){result.append(make('p','No hay un grupo asignado en la sesión docente.'));return;}
  busy=true;refresh.disabled=true;refresh.textContent='Consultando…';
  try{
   const data=await postQuiz('oralListEvaluacionesDocente',{cod_grupo:grupo});
   if(!section.isConnected||String(select.value)!==grupo)return;
   const map=new Map();
   for(const row of Array.isArray(data.rows)?data.rows:[]){
    const nivel=String(row.nivel||'').toUpperCase(),lec=Number(row.leccion);
    if(!['B1','B2','I1','I2'].includes(nivel)||![9,17,25,31].includes(lec))continue;
    const k=nivel+'|'+lec+'|'+String(row.fecha||'');
    if(!map.has(k))map.set(k,{nivel,lec,fecha:String(row.fecha||''),total:0,borradores:0,pdf:0,students:[]});
    const entry=map.get(k);entry.total++;
    if(String(row.estado)==='BORRADOR')entry.borradores++;
    if(row.pdf_generado)entry.pdf++;
    entry.students.push({code:String(row.cod_estudiante||''),name:String(row.nombre||row.cod_estudiante||'Estudiante'),estado:String(row.estado||'GUARDADO')});
   }
   if(!map.size)result.append(make('p','Sin expedientes para este grupo. Los 17 orales de Keylor están en B1-LM69-C2-0526; buscá ese código si tenés acceso autorizado.'));
   for(const row of map.values()){
    const item=make('div',null,'f111-teacher-exam-entry');
    item.append(make('strong',row.nivel+' · Oral lección '+String(row.lec).padStart(2,'0')),
     make('p',row.total+' expedientes · '+row.borradores+' borradores · '+row.pdf+' PDF'));
    const view=make('button','REVISAR EXPEDIENTES','f111-tqr-open');view.type='button';
    view.addEventListener('click',()=>{
      // NO reabrir sesión ni alterar calendario: solo contexto académico.
      f111TeacherExamModal('Historial oral · '+row.nivel+' · L'+row.lec,
       f111ExamPageUrl('modulos/examen_oral.html',{
        historial:1,grupo,nivel:row.nivel,leccion:row.lec,fecha:row.fecha
       }));
    });
    item.append(view);
    const details=make('details'),summary=make('summary','VER '+row.students.length+' EXÁMENES GUARDADOS');
    summary.style.cssText='cursor:pointer;font-size:12px;font-weight:800;color:#173d67;margin:10px 0';
    details.append(summary);
    for(const student of row.students){
     const line=make('div');line.style.cssText='display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:1px solid #dee6ef;padding:7px 0;font-size:11px';
     line.append(make('span',student.name+' · '+student.estado));
     const open=make('button','VER RÚBRICA / PDF','f111-tqr-open');open.type='button';
     open.addEventListener('click',()=>f111TeacherExamModal('Examen guardado · '+row.nivel+' · L'+row.lec,
       f111ExamPageUrl('modulos/examen_oral.html',{historial:1,grupo,nivel:row.nivel,leccion:row.lec,fecha:row.fecha,cod_estudiante:student.code})));
     line.append(open);details.append(line);
    }
    item.append(details);result.append(item);
   }
  }catch(e){if(section.isConnected)result.append(make('p',
   'No fue posible leer el historial. '+String(e&&e.message||e)));}
  finally{busy=false;refresh.disabled=false;refresh.textContent='Actualizar historial';}
 }
 async function loadAuthorizedGroups(){
  if(busy)return;
  const oldGroup=String(select.value||'').trim();
  select.disabled=true;refresh.disabled=true;
  result.replaceChildren();result.append(make('p','Consultando grupos docentes autorizados…'));
  try{
   // Identidad de sesión del servidor: no enviar docente arbitrario.
   const reply=await postQuiz('getDocenteGruposActuales',{});
   if(!section.isConnected)return;
   const allowed=f111AuthorizedCourseGroups(reply);
   select.replaceChildren();
   for(const group of allowed){const item=make('option',group);item.value=group;select.append(item);}
   if(!allowed.length){
    result.replaceChildren();
    result.append(make('p','No hay grupos de curso autorizados para consultar.'));
    return;
   }
   select.value=allowed.includes(oldGroup)?oldGroup:allowed[0];
   rehearsal.render();
  }catch(e){
   if(section.isConnected){
    select.replaceChildren();result.replaceChildren();
    result.append(make('p','No se pudo verificar la asignación docente. '+String(e&&e.message||e)));
   }
   return;
  }finally{select.disabled=false;refresh.disabled=false;}
  await loadHistory();
 }
 lookupBtn.addEventListener('click',async()=>{
  const group=String(lookup.value||'').trim().toUpperCase();
  if(!/^[A-Z0-9][A-Z0-9-]{5,45}$/.test(group)){
   result.replaceChildren(make('p','Ingresá un código de grupo válido.'));return;
  }
  lookupBtn.disabled=true;
  try{
   // Escribir un código nunca concede permisos: autorización desde Apps Script.
   await postQuiz('oralListEvaluacionesDocente',{cod_grupo:group});
   if(!Array.from(select.options).some(x=>x.value===group)){
    const option=make('option',group);option.value=group;select.append(option);
   }
   select.value=group;rehearsal.render();await loadHistory();
  }catch(e){result.replaceChildren(make('p','Grupo no autorizado o no disponible: '+String(e&&e.message||e)));}
  finally{lookupBtn.disabled=false;}
 });
 lookup.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();lookupBtn.click();}});
 select.addEventListener('change',()=>{rehearsal.render();void loadHistory();});
 refresh.addEventListener('click',loadAuthorizedGroups);
 summary.append(history,rehearsal.card);section.append(summary);
 // R32: el profesor inspecciona el examen SIN códigos, permisos de grupo,
 // activación, entrega, PDF paralelo ni llamadas al backend.
 const quick=make('article',null,'f111-teacher-exam-card');
 quick.dataset.f111B1Pc02Oneclick='true';
 quick.append(make('h4','B1 · Progress Check 02 · Lección 8 · Unidades 3–4'),
  make('p','25 preguntas digitalizadas y listening original. Vista igual al estudiante, sin guardar ni enviar respuestas.'));
 const view=make('button','Ver Progress Check','f111-tqr-open');
 view.type='button';
 view.addEventListener('click',previewPC02);
 quick.append(view);
 section.append(quick);
 // Cargar solo cuando se conecta esta tarjeta, y luego por cambio o botón.
 queueMicrotask(()=>{if(section.isConnected)void loadAuthorizedGroups();});
 return section;
}

// Card-local written controls; the server remains the source of authorization.
function buildTeacherWrittenCardAction(slot){
 const context={cod_grupo:String(slot.dataset.group||'').trim().toUpperCase(),
  nivel:String(slot.dataset.level||'').trim().toUpperCase(),leccion:Number(slot.dataset.lesson)};
 const en=slot.dataset.lang==='en',tr=(es,english)=>en?english:es;
 const root=make('span',null,'f111-written-card-action');root.dataset.f111WrittenCardAction='true';
 root.style.cssText='display:inline-flex;flex-wrap:wrap;align-items:center;gap:5px;max-width:100%';
 const action=make('button',tr('Abrir para estudiantes','Open for students'),'f111-tqr-activate');action.type='button';action.disabled=true;
 const status=make('small',tr('Verificando disponibilidad.','Checking availability.'),'f111-tqr-feedback');status.setAttribute('role','status');
 root.append(action,status);
 const errors={grupo_no_habilitado_manual:tr('Apertura manual no habilitada para este grupo.','Manual opening is not enabled for this group.'),
  grupo_nivel_no_autorizado_o_no_en_curso:tr('Grupo o nivel no autorizado.','Group or level not authorized.'),
  test2_antes_leccion_25:tr('Disponible al cerrar la lecci\u00f3n 25.','Available after lesson 25 is closed.'),
  ordinario_ya_aplicado:tr('Ordinario aplicado.','Regular exam already used.'),
  otro_escrito_abierto:tr('Cerr\u00e1 el otro escrito primero.','Close the other written exam first.')};
 let current=null, busy=false, seq=0;
 async function refresh(message=''){
  const id=++seq;current=null;action.disabled=true;
  try{
   const r=await postQuiz('examTeacherWrittenActivationF111',{...context,accion:'estado'});
   if(id!==seq||!root.isConnected)return;
   if(!['OPEN','CLOSED','DRAFT'].includes(r.estado)||r.opcion!=='A')throw Error('estado_no_confirmado');
   const open=r.estado==='OPEN',closed=r.estado==='CLOSED';current={open};
   action.textContent=open?tr('Cerrar para estudiantes','Close for students'):tr('Abrir para estudiantes','Open for students');
   action.disabled=closed||(!open&&r.modo_manual!==true);
   status.textContent=message||(open?tr('Abierto.','Open.'):closed?tr('Ordinario cerrado.','Regular exam closed.'):
    action.disabled?(errors[r.motivo]||tr('Apertura no habilitada.','Opening not enabled.')):'');
  }catch(e){if(id===seq&&root.isConnected)status.textContent=errors[e.message]||tr('No se pudo verificar.','Could not verify availability.');}
 }
 action.addEventListener('click',async()=>{
  if(busy||action.disabled||!current||!root.isConnected)return;
  const open=current.open, name=tr('Escrito ','Written exam ')+(context.leccion===18?'1':'2');
  if(!window.confirm((open?tr('\u00bfCerrar ','Close '):tr('\u00bfAbrir ','Open '))+name+' ('+context.cod_grupo+')?'))return;
  busy=true;action.disabled=true;status.textContent=tr('Procesando.','Processing.');let message='';
  try{const r=await postQuiz('examTeacherWrittenActivationF111',{...context,accion:open?'cerrar':'abrir'});
   if(r.estado!==(open?'CLOSED':'OPEN')||r.opcion!=='A')throw Error('cambio_no_confirmado');
  }catch(e){message=errors[e.message]||tr('Cambio no confirmado.','Change not confirmed.');}
  finally{busy=false;await refresh(message);}
 });
 queueMicrotask(()=>{if(root.isConnected&&context.cod_grupo&&context.nivel&&[18,32].includes(context.leccion))void refresh();});
 return root;
}

function attach(){
 const screen=document.querySelector('section[data-screen-label="Docente · Exámenes"]');
 if(screen)for(const slot of screen.querySelectorAll('[data-f111-written-card-slot]')){
  if(!slot.querySelector('[data-f111-written-card-action]'))slot.append(buildTeacherWrittenCardAction(slot));
 }
 const slot=screen&&screen.querySelector('[data-f111-exams-tool-slot]');
 const details=slot&&slot.closest('details');
 if(!details)return;
 const mount=()=>{
  if(details.open&&slot.isConnected&&!slot.querySelector('[data-f111-teacher-exam-center]'))
   slot.append(buildTeacherExamsF111());
 };
 if(!details.dataset.f111QuizAttach){details.dataset.f111QuizAttach='true';details.addEventListener('toggle',mount);}
 mount();
}
function installStyle(){
 if(document.getElementById(STYLE))return;
 const s=make('style');s.id=STYLE;
 s.textContent=[

 '.f111-teacher-exam-center{background:#fff;border:1px solid #DCE3EA;border-radius:14px;padding:16px;color:#143452;font-family:Poppins,system-ui,sans-serif}',
 '.f111-teacher-exam-center>small{display:block;color:#7A1E2C;font-size:10px;font-weight:900;letter-spacing:.12em}',
 '.f111-teacher-exam-center h3{font-size:20px;margin:5px 0 2px;color:#073B7A}',
 '.f111-teacher-exam-center p{font-size:12px;color:#64748B;margin:5px 0 12px}',
 '.f111-teacher-exam-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(295px,1fr));gap:12px}',
 '.f111-teacher-exam-card{border:1px solid #DDE5EF;border-radius:12px;background:#F8FAFD;padding:13px}',
 '.f111-teacher-exam-card h4{font-size:15px;margin:0;color:#073B7A}',
 '.f111-teacher-exam-controls{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px;align-items:center}',
 '.f111-teacher-exam-controls select{border:1px solid #D5E0EC;border-radius:8px;background:#fff;color:#143F64;padding:9px;font:12px Poppins,system-ui,sans-serif}',
 '.f111-teacher-exam-entry{border-top:1px solid #DBE5F0;padding:12px 0}',
 '.f111-teacher-exam-entry strong{font-size:13px;color:#123E67}',
 '.f111-tqr{background:#fff;border:1px solid #D6E0EB;border-radius:14px;padding:16px;margin:2px 0;box-shadow:0 3px 12px rgba(10,55,92,.04)}',
 '.f111-tqr>small{font-size:10px;letter-spacing:.12em;font-weight:900;color:#8C6B1C}',
 '.f111-tqr h3{font-size:19px;color:#113A61;font-weight:900;margin:5px 0}',
 '.f111-tqr p{font-size:12px;color:#556F86;margin:5px 0 12px}',
 '.f111-tqr-levels{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:13px}',
 '.f111-tqr-level{border:1px solid #D2DCE7;border-radius:9px;background:white;padding:8px 11px;color:#193F65;font-weight:800;font-size:11px;cursor:pointer}',
 '.f111-tqr-level[aria-pressed=true]{border:2px solid var(--f111-level-color);background:#F5F9FE}',
 '.f111-tqr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:9px}',
 '.f111-tqr-r9-controls{display:flex;flex-direction:column;gap:7px;margin-top:8px}',
 '.f111-tqr-r9-group{width:100%;max-width:100%;padding:8px;border:1px solid #c9d7e6;border-radius:7px;color:#173959;background:#fff}',
 '.f111-tqr-card{border:1px solid #DAE3ED;background:#F9FBFD;border-radius:10px;padding:11px;display:flex;flex-direction:column;gap:5px}',
 '.f111-tqr-card.is-ready{background:#FFFCED;border-color:#E0C271}',
 '.f111-tqr-card small{font-size:9px;color:#657A91;font-weight:900;letter-spacing:.04em}',
 '.f111-tqr-card strong{font-size:14px;font-weight:900;color:#143C63}',
 '.f111-tqr-card span{font-size:11px;color:#697C91}',
 '.f111-tqr-card em{font-size:10px;font-style:normal;color:#7A8A9A;margin-top:7px}',
 '.f111-tqr-open{padding:9px 10px;border-radius:8px;background:#F2C83D;color:#173959;border:1px solid #D9B12B;font-size:11px;font-weight:900;cursor:pointer;margin-top:4px}',
 '.f111-tqr .f111-tqr-foot{font-size:11px;color:#667D92;margin:12px 0 0}',
 '.f111-tqr-workspace-backdrop{position:fixed;inset:0;z-index:60000;background:rgba(4,23,47,.73);padding:16px;display:grid;place-items:center}',
 '.f111-tqr-workspace{background:#f4f8fc;border-radius:15px;width:min(1300px,100%);height:min(94vh,1000px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 80px #082c55aa}',
 '.f111-tqr-workspace-header{background:#fff;display:flex;justify-content:space-between;align-items:center;gap:14px;padding:18px 22px;border-bottom:1px solid #d5e0ec}',
 '.f111-tqr-workspace-header small{font-size:10px;letter-spacing:.08em;color:#9a7520;font-weight:900}',
 '.f111-tqr-workspace-header h2{font-size:23px;color:#153e65;margin:5px 0}',
 '.f111-tqr-workspace-header p{font-size:12px;color:#637991;margin:0}',
 '.f111-tqr-close{background:#edf3fa;color:#174168;border:1px solid #c9d7e6;border-radius:9px;padding:10px 16px;cursor:pointer;font-weight:800}',
 '.f111-tqr-workspace-columns{display:grid;grid-template-columns:minmax(230px,280px) minmax(0,1fr);min-height:0;flex:1}',
 '.f111-tqr-students{border-right:1px solid #d2e0ee;padding:17px;background:#fff;overflow-y:auto;min-width:0}',
 '.f111-tqr-students h3{font-size:14px;color:#163c62;margin:0 0 14px}',
 '.f111-tqr-group-average{background:#eff5fc;border:1px solid #cbdbec;color:#143e65;border-radius:10px;padding:12px;margin-bottom:15px;font-size:12px;line-height:1.55;font-weight:800}',
 '.f111-tqr-student-list{display:grid;gap:8px}',
 '.f111-tqr-student-choice{text-align:left;display:grid;gap:4px;width:100%;padding:12px;border-radius:10px;border:1px solid #cfdaea;background:#f8fbfe;color:#174067;cursor:pointer}',
 '.f111-tqr-student-choice[aria-pressed=true]{background:#fff5d6;border:2px solid #ddb93a}',
 '.f111-tqr-student-choice strong{font-size:12px;overflow-wrap:anywhere}',
 '.f111-tqr-student-choice small{font-size:10px;color:#698097}',
 '.f111-tqr-detail{overflow-y:auto;padding:18px;min-width:0}',
 '.f111-tqr-detail-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}',
 '.f111-tqr-detail-top h3{font-size:20px;color:#133d68;margin:0}',
 '.f111-tqr-detail-top small{font-size:11px;color:#70839a}',
 '.f111-tqr-info{font-size:13px;line-height:1.55;color:#5a7087;margin:10px 0 15px}',
 '.f111-tqr-empty{font-size:15px;color:#667c93;margin:30px 0}',
 '.f111-tqr-exam-frame{width:100%;height:610px;max-height:70vh;border:1px solid #cbdbe9;border-radius:11px;background:#fff}',
 '.f111-tqr-materials{display:grid;gap:10px;margin:15px 0}',
 '.f111-tqr-key-frame{width:100%;height:420px;border:1px solid #cbdbe9;border-radius:10px;background:#fff}',
 '.f111-tqr-score-banner{background:#fff2d0;color:#694b17;border:1px solid #e6cb79;border-radius:12px;padding:17px;margin:11px 0;font-weight:900;font-size:17px}',
 '.f111-tqr-score-banner[data-ready=true]{background:#e8f5eb;border-color:#9ed1ad;color:#17513a}',
 '.f111-tqr-grade-form{display:grid;gap:13px;background:#fff;padding:17px;border-radius:12px;border:1px solid #d9e4ee;margin:18px 0}',
 '.f111-tqr-grade-form label{display:grid;gap:5px;font-size:12px;font-weight:800;color:#1c476e}',
 '.f111-tqr-grade-form .f111-tqr-grade-result{font-size:16px;line-height:1.4;font-weight:900;color:#174c32;background:#eaf7ed;border:1px solid #95c9a6;min-height:48px}',
 '.f111-tqr-grade-form .f111-tqr-grade-result[data-grade-band=baja]{background:#fff0ee;border-color:#dba5a0;color:#a52b27}',
 '.f111-tqr-grade-form .f111-tqr-grade-result[data-grade-band=media]{background:#fff7e5;border-color:#e9c68e;color:#855b1e}',
 '.f111-tqr-grade-form input,.f111-tqr-grade-form textarea{font:inherit;border-radius:8px;border:1px solid #bdcfdf;padding:11px;width:100%}',
 '.f111-tqr-reviewed{background:#e9f8ed;border:1px solid #b9dcc4;padding:14px;border-radius:9px;color:#225b39;font-weight:800}',
 '@media(max-width:760px){.f111-tqr-workspace-backdrop{padding:4px}.f111-tqr-workspace{height:99vh}.f111-tqr-workspace-header{padding:12px;align-items:flex-start}.f111-tqr-workspace-header h2{font-size:17px}.f111-tqr-workspace-columns{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}.f111-tqr-students{max-height:150px;border-right:0;border-bottom:1px solid #d2e0ee;padding:10px}.f111-tqr-student-list{display:flex;overflow-x:auto}.f111-tqr-student-choice{min-width:145px}.f111-tqr-detail{padding:10px}.f111-tqr-exam-frame{height:480px}}',
 '.f111-tqr-review-panel[hidden]{display:none!important}',
 '.f111-tqr-review-panel{grid-column:1/-1;padding:10px;margin-top:8px;border-top:1px solid #d6e3ef;max-height:520px;overflow:auto}',
 '.f111-tqr-entry{background:white;border:1px solid #d6e3ef;border-radius:10px;padding:11px;margin-top:10px}',
 '.f111-tqr-entry h4{font-size:13px;color:#163d65;margin:2px 0 8px}',
 '.f111-tqr-answers{font-size:11px;max-height:150px;overflow:auto;white-space:pre-wrap;color:#45647c;padding:7px;background:#f5f8fc}',
 '.f111-tqr-answers>div{padding:3px 0;border-bottom:1px solid #dde6ef}',
 '.f111-tqr-form{margin-top:10px;display:grid;gap:10px}',
 '.f111-tqr-form label{display:grid;gap:5px;font-size:12px;font-weight:700;color:#254f72}',
 '.f111-tqr-form input,.f111-tqr-form textarea{border:1px solid #c8d8e8;border-radius:8px;padding:9px;font:inherit;width:100%}',
 '.f111-tqr-feedback{font-size:11px;color:#617791;line-height:1.4;display:block}',
 '.f111-tqr-activate{border:1px solid #ceab36;background:#f2c83d;color:#193858;border-radius:9px;font-size:12px;font-weight:900;padding:10px;cursor:pointer}',
 '.f111-tqr-activate:disabled{opacity:.65;cursor:not-allowed}'
 ].join('\n');
 document.head.append(s);
}
function install(){
 const root=document.getElementById('root');
 if(!root)return;
 installStyle();
 let queued=false;
 const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;attach()});
 });
 observer.observe(root,{subtree:true,childList:true});
 attach();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
