// F111 QZ32: consulta de quizzes para docentes sin alterar el Centro protegido.
// Read-only: abrir una vista previa no activa ni entrega evaluaciones a estudiantes.
(function(){
'use strict';
const LEVELS=[['B1','Básico I','#D5A525'],['B2','Básico II','#B42E3C'],['I1','Intermedio I','#2C75B0'],['I2','Intermedio II','#347D50']];
const LESSONS=[[4,'1–2'],[8,'3–4'],[13,'5–6'],[16,'7–8'],[21,'9–10'],[24,'11–12'],[28,'13–14'],[30,'15–16']];
const STYLE='F111-TEACHER-QUIZ-REVIEW';
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
  return;
 }
 if(document.querySelector('[data-f111-b1-private-preview]'))return;
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
   make('p','Cuestionario y MP3 originales · sin guardado, entrega ni activación de estudiantes'));
 const close=make('button','CERRAR','f111-tqr-close');close.type='button';
 header.append(ttl,close);
 const frame=make('iframe');frame.className='f111-tqr-exam-frame';
 frame.style.cssText='flex:1;min-height:0;max-height:none;height:100%;width:100%;border:0';
 frame.title='Progress Check B1 · vista privada docente';
 const url=new URL('modulos/quiz_progress.html',new URL('./',location.href));
 url.searchParams.set('teacher_preview','1');
 url.searchParams.set('grupo',authorizedGroup||QZ_GROUP);
 url.searchParams.set('nivel','B1');
 url.searchParams.set('leccion',String(lesson));
 frame.src=url.href;
 function dismiss(){overlay.remove();document.removeEventListener('keydown',onKey);}
 function onKey(e){if(e.key==='Escape'){e.preventDefault();dismiss();}}
 close.onclick=dismiss;
 overlay.onclick=e=>{if(e.target===overlay)dismiss();};
 document.addEventListener('keydown',onKey);
 shell.append(header,frame);overlay.append(shell);document.body.append(overlay);
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
function buildB1TeacherOpenControls(lesson){
 const wrap=make('div',null,'f111-tqr-r9-controls');
 const select=make('select',null,'f111-tqr-r9-group');
 select.setAttribute('aria-label','Grupo B1 autorizado');
 const status=make('small','Consultando grupos docentes…','f111-tqr-feedback');
 status.setAttribute('role','status');
 const previewBtn=make('button','VER PDF + AUDIO DEL GRUPO','f111-tqr-open');
 const toggle=make('button','CONSULTANDO…','f111-tqr-activate');
 for(const b of [previewBtn,toggle]){b.type='button';b.disabled=true;}
 wrap.append(select,previewBtn,toggle,status);
 let info=null,busy=false;
 const context=()=>({cod_grupo:select.value,nivel:'B1',leccion:lesson});
 async function refresh(){
  toggle.disabled=true;info=null;
  if(!select.value){status.textContent='Seleccioná un grupo autorizado.';return;}
  try{
   const data=await postQuiz('qzProgressTeacherAvailability',context());
   if(data.grupo!==select.value||Number(data.leccion)!==lesson||data.digital_disponible!==true)
    throw Error('Grupo o lección no habilitados');
   info=data;
   toggle.textContent=data.estado==='ABIERTO'?'CERRAR QUIZ PARA ESTUDIANTES':'ACTIVAR QUIZ PARA ESTUDIANTES';
   toggle.disabled=busy||(data.estado!=='ABIERTO'&&data.puede_abrir!==true);
   status.textContent='Quiz '+String(LESSONS.findIndex(x=>x[0]===lesson)+1)+' · '+
    (data.estado==='ABIERTO'?'Abierto por docente':data.puede_abrir?'Cerrado; requiere activación expresa':'No elegible según fecha, clase o permisos');
  }catch(e){status.textContent='Servidor: '+String(e.message||e);toggle.disabled=true;}
 }
 select.addEventListener('change',()=>{previewBtn.disabled=!select.value;void refresh();});
 previewBtn.addEventListener('click',()=>{if(select.value)previewB1Protected(lesson,select.value);});
 toggle.addEventListener('click',async()=>{
  if(busy||!info||!select.value)return;
  const next=info.estado==='ABIERTO'?'CERRADO':'ABIERTO';
  if(next==='ABIERTO'&&info.puede_abrir!==true)return;
  if(!window.confirm((next==='ABIERTO'?'¿ACTIVAR':'¿CERRAR')+' el Quiz '+
      String(LESSONS.findIndex(x=>x[0]===lesson)+1)+' del grupo '+select.value+
      '? Esta acción afecta la disponibilidad para estudiantes reales.'))return;
  busy=true;toggle.disabled=true;select.disabled=true;status.textContent='Verificando cambio…';
  try{
   const data=await postQuiz('qzProgressTeacherSetAvailability',{...context(),estado:next});
   if(data.estado!==next)throw Error('Servidor no confirmó el estado');
   const readback=await postQuiz('qzProgressTeacherAvailability',context());
   if(readback.estado!==next)throw Error('La lectura posterior no coincide');
   status.textContent='Confirmado: '+next;
  }catch(e){status.textContent='Cambio no confirmado: '+String(e.message||e);}
  finally{busy=false;select.disabled=false;void refresh();}
 });
 authorizedB1Groups().then(data=>{
  if(!wrap.isConnected)return;
  const groups=(Array.isArray(data.grupos)?data.grupos:[])
   .filter(x=>x.nivel==='B1'&&typeof x.cod_grupo==='string');
  const empty=make('option','Seleccioná tu grupo B1');empty.value='';select.append(empty);
  for(const group of groups){const option=make('option',group.cod_grupo);option.value=group.cod_grupo;select.append(option);}
  status.textContent=groups.length?'Elegí el grupo de la lección.':'No hay grupos B1 asignados.';
 }).catch(e=>{status.textContent='Grupos no disponibles: '+String(e.message||e);});
 return wrap;
}
function previewPC02(){
 // PC02 no está autorizado en GAS PROD; solo cuestionario de revisión editorial.
 const url=new URL('modulos/qz_b1_pc02_preview.html',new URL('./',location.href));
 url.searchParams.set('preview','1');
 window.open(url.href,'_blank','noopener,noreferrer');
}
function preview(){
 const url=new URL('modulos/qz_b1_pc01_digital.html',new URL('./',location.href));
 url.searchParams.set('preview','1');
 url.searchParams.set('rol','docente');
 window.open(url.href,'_blank','noopener,noreferrer');
}
const QZ_GROUP='B1-KJ18-C3-0826';
const qzContext={cod_grupo:QZ_GROUP,nivel:'B1',leccion:4};
async function postQuiz(fn,data){
 const token=window.getSessionToken?window.getSessionToken():'';
 // Las operaciones Progress Check usan @467; padrón docente y login siguen en @462.
 const isQuiz=/^qzProgress[A-Za-z0-9]+$/.test(String(fn||'')); // R10: B1 endpoints must use Quiz @477
 const base=String((isQuiz&&window.F111_QZ_API_URL)||window.APPS_SCRIPT_URL||'');
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
function openReviewWorkspace(){
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
  rows=rows.filter(r=>r&&getCode(r)&&['ENTREGADO','REVISADO'].includes(String(r.ESTADO)));
  // Los nombres proceden del padrón autorizado; una falla no oculta entregas.
  try{
   const r=await postQuiz('getEstudiantesParaCierre',{cod_grupo:QZ_GROUP,nivel:'B1'});
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
  detail.append(make('p','Cada pregunta muestra la respuesta del estudiante y la clave privada de Cambridge. Podés ajustar 0, 0,5 o 1 punto; el resultado es diagnóstico y no modifica las notas oficiales.','f111-tqr-info'));
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
    const saved=(Array.isArray(verified.intentos)?verified.intentos:[]).find(r=>getCode(r)===code);
    if(!saved||saved.ESTADO!=='REVISADO'||Number(saved.RESULTADO)!==savedScore.percentage)
      throw Error('Sin lectura de regreso del resultado. Revisá el listado antes de reintentar.');
    rows=(Array.isArray(verified.intentos)?verified.intentos:[]).filter(r=>getCode(r));
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
async function confirmGroupQuizInvitation(button,feedback,refresh){
 button.disabled=true;feedback.textContent='Consultando lista de estudiantes…';
 try{
  const r=await postQuiz('getEstudiantesParaCierre',{cod_grupo:QZ_GROUP,nivel:'B1'});
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

function attachLessonAction(){
 const drawers=document.querySelectorAll('aside[data-teacher-level="B1"][data-teacher-lesson="4"][data-teacher-rail="curso"]');
 drawers.forEach(drawer=>{
  const previewButton=drawer.querySelector('[data-f111-lesson-quiz="B1-L4"]');
  if(!previewButton||drawer.querySelector('[data-f111-quiz-activation]'))return;
  const text=drawer.textContent||'';
  // La vista previa B1-L4 solo se renderiza en JSX para el grupo Diego autorizado.
  // El encabezado docente muestra horario/0826, no el codigo largo de grupo.
  if(!text.includes('GUARDAR Y CERRAR CLASE'))return;
  const button=make('button','Consultando apertura del quiz…','f111-tqr-activate');
  button.type='button';button.dataset.f111QuizActivation='B1-L4';button.disabled=true;
  const feedback=make('small','','f111-tqr-feedback');
  previewButton.parentNode.insertBefore(button,previewButton.nextSibling);
  button.after(feedback);
  const refresh=()=>{
   postQuiz('qzProgressTeacherAvailability',qzContext).then(r=>{
    if(r.digital_disponible!==true)throw Error('Quiz no disponible');
    button.dataset.status=r.estado;
    button.textContent=r.estado==='ABIERTO'?'Cerrar quiz para estudiantes':'Habilitar Quiz 1 para estudiantes';
    button.disabled=false;
    feedback.textContent=r.estado==='ABIERTO'?'Abierto: los estudiantes pueden guardar y entregar.':'Todavía no disponible para estudiantes.';
   }).catch(err=>{button.disabled=true;button.textContent='Activación pendiente del servidor';feedback.textContent='Servidor: '+String(err.message||'No disponible')+'. La vista previa sigue disponible.';});
  };
  button.addEventListener('click',async()=>{
   const next=button.dataset.status==='ABIERTO'?'CERRADO':'ABIERTO';
   if(next==='ABIERTO'){void confirmGroupQuizInvitation(button,feedback,refresh);return;}
   if(!confirm('¿Cerrar el Quiz 1? No podrán enviar nuevas respuestas.'))return;
   button.disabled=true;feedback.textContent='Actualizando…';
   try{
    const r=await postQuiz('qzProgressTeacherSetAvailability',Object.assign({},qzContext,{estado:next}));
    if(r.estado!==next)throw Error('Apertura sin confirmación');
    refresh();
   }catch(err){feedback.textContent='No se confirmó el cambio: '+err.message;refresh();}
  });
  window.f111PC01TeacherLaunch=()=>{
   if(!button.isConnected||button.disabled||button.dataset.status==='ABIERTO'){preview();return;}
   const invite=window.confirm('¿Querés enviar la invitación del Quiz 1 a los estudiantes del grupo? Aceptar: revisar lista y habilitar. Cancelar: abrir solo la vista docente.');
   if(invite){void confirmGroupQuizInvitation(button,feedback,refresh);}
   else preview();
  };
  refresh();
 });
}


function buildQuizOpenControls(){
 const wrapper=make('div',null,'f111-tqr-open-controls');
 wrapper.dataset.f111QuizStatus='B1-L4';
 const state=make('small','Consultando estado del Quiz 1…','f111-tqr-feedback');
 state.setAttribute('role','status');
 const toggle=make('button','Consultando disponibilidad…','f111-tqr-activate');
 toggle.type='button';toggle.disabled=true;toggle.dataset.mode='DESCONOCIDO';
 const refresh=()=>{
  postQuiz('qzProgressTeacherAvailability',qzContext).then(r=>{
   if(!wrapper.isConnected)return;
   if(r.digital_disponible!==true)throw Error('no_disponible');
   toggle.dataset.mode=r.estado;
   toggle.disabled=false;
   toggle.textContent=r.estado==='ABIERTO'?'CERRAR QUIZ 1':'ACTIVAR QUIZ 1 · INVITAR ESTUDIANTES';
   state.textContent=r.estado==='ABIERTO'?'Quiz abierto: continuará disponible después de cerrar la clase hasta que lo cerrés aquí.':'Sin habilitar: para activarlo, primero debe estar abierta la lección 4.';
  }).catch(err=>{
   if(!wrapper.isConnected)return;
   toggle.disabled=true;
   state.textContent='Activación no disponible: '+String(err.message||'error del servidor')+'. La vista previa permanece disponible.';
  });
 };
 toggle.onclick=async()=>{
  if(toggle.disabled)return;
  if(toggle.dataset.mode!=='ABIERTO'){
   await confirmGroupQuizInvitation(toggle,state,refresh);
   return;
  }
  if(!window.confirm('¿Cerrar el Quiz 1 para el grupo? Los estudiantes ya no podrán enviar respuestas nuevas. Las entregas guardadas se conservan.'))return;
  toggle.disabled=true;state.textContent='Cerrando y confirmando estado…';
  try{
   const response=await postQuiz('qzProgressTeacherSetAvailability',Object.assign({},qzContext,{estado:'CERRADO'}));
   if(response.estado!=='CERRADO')throw Error('cierre_no_confirmado');
   const verify=await postQuiz('qzProgressTeacherAvailability',qzContext);
   if(verify.estado!=='CERRADO')throw Error('readback_no_confirmado');
   state.textContent='Quiz cerrado. Las entregas existentes permanecen para revisión.';
  }catch(_){
   state.textContent='No se confirmó el cierre. Consultá de nuevo el estado antes de repetir la operación.';
  }finally{refresh();}
 };
 wrapper.append(toggle,state);
 refresh();
 return wrapper;
}
function renderGrid(container,level){
 container.replaceChildren();
 LESSONS.forEach(([lesson,units],i)=>{
  const ready=level==='B1'&&lesson===4;
  const card=make('div',null,'f111-tqr-card'+(ready?' is-ready':''));
  card.append(make('small','PROGRESS CHECK '+String(i+1).padStart(2,'0')));
  card.append(make('strong','Lección '+lesson));
  card.append(make('span','Unidades '+units));
  if(ready){
    const button=make('button','VER QUIZ ↗','f111-tqr-open');
    button.type='button';
    button.setAttribute('data-f111-quiz-preview','B1-L4');
    button.addEventListener('click',preview);
    card.append(button);
    const gradeBtn=make('button','REVISAR ENTREGAS Y CALIFICAR','f111-tqr-open');
    gradeBtn.type='button';
    gradeBtn.dataset.f111QuizTeacherReviews='B1-L4';
    gradeBtn.addEventListener('click',openReviewWorkspace);
    card.append(gradeBtn);
    card.append(buildQuizOpenControls());
  }else if(level==='B1'){
    const track=String(i+1).padStart(2,'0');
    card.append(make('em','Cuestionario Cambridge 25 puntos · MP3 original '+track+' localizado en Drive privado'));
    if(lesson===8){
      const editorial=make('button','VISTA EDITORIAL PC02 ↗','f111-tqr-open');
      editorial.type='button';editorial.dataset.f111QuizPreview='B1-L8-EDITORIAL';
      editorial.addEventListener('click',previewPC02);card.append(editorial);
    }
    // R9: group must be selected from a list verified by the backend.
    // No fallback to historic PC01's hardcoded group for PC02–PC08.
    card.append(buildB1TeacherOpenControls(lesson));
    card.append(make('em','Activación por grupo, fecha elegible y confirmación expresa del docente; no se abre al visitar esta pantalla.'));
  }else{
    card.append(make('em','Pendiente de digitalizar'));
  }
  container.append(card);
 });
}
function build(){
 const box=make('section',null,'f111-tqr');
 box.setAttribute('aria-label','Revisión de material de quizzes');
 box.setAttribute('data-f111-teacher-quizzes','true');
 box.append(make('small','PROGRESS CHECK · MATERIAL DOCENTE'));
 box.append(make('h3','Revisión de material de quizzes'));
 box.append(make('p','Revisá las preguntas antes de iniciar la lección.'));
 const nav=make('div',null,'f111-tqr-levels');
 nav.setAttribute('role','group');
 nav.setAttribute('aria-label','Seleccionar nivel');
 const grid=make('div',null,'f111-tqr-grid');
 let selected='B1';
 const buttons=[];
 LEVELS.forEach(([code,label,color])=>{
  const b=make('button',code+' · '+label,'f111-tqr-level');
  b.type='button';
  b.dataset.level=code;
  b.style.setProperty('--f111-level-color',color);
  b.addEventListener('click',()=>{
   selected=code;
   buttons.forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.level===selected)));
   renderGrid(grid,selected);
  });
  buttons.push(b);nav.append(b);
 });
 box.append(nav,grid,make('p','Vista previa docente · No habilita estudiantes ni registra notas.','f111-tqr-foot'));
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===selected)));
 renderGrid(grid,selected);
 return box;
}
function attach(){
 attachLessonAction();
 const screen=document.querySelector('section[data-screen-label="Docente · Exámenes"]');
 if(!screen||screen.querySelector('[data-f111-teacher-quizzes]'))return;
 const heading=Array.from(screen.children).find(el=>(el.textContent||'').includes('EXÁMENES DEL DOCENTE'));
 if(!heading)return;
 heading.insertAdjacentElement('afterend',build());
}
function installStyle(){
 if(document.getElementById(STYLE))return;
 const s=make('style');s.id=STYLE;
 s.textContent=[
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
