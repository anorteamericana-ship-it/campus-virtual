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
 const isQuiz=/^qzProgress[A-Za-z]+$/.test(String(fn||''));
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
function buildReviewEditor(container){
 if(container.dataset.loading==='1')return;
 container.dataset.loading='1';
 container.replaceChildren(make('p','Consultando entregas…'));
 postQuiz('qzProgressTeacherList',qzContext).then(result=>{
  container.replaceChildren();
  const list=Array.isArray(result.intentos)?result.intentos:[];
  if(!list.length){container.append(make('p','Todavía no hay quizzes entregados.'));return;}
  list.forEach(row=>{
   const entry=make('article',null,'f111-tqr-entry');
   const code=String(row.COD_ESTUDIANTE||'');
   entry.append(make('h4','Estudiante · '+code));
   const answers=make('div',null,'f111-tqr-answers');
   let a={};try{a=JSON.parse(String(row.RESPUESTAS_JSON||'{}'))}catch(_){}
   Object.keys(a).sort().forEach(key=>{
    const line=make('div');
    line.append(make('b',key+' · '),make('span',String(a[key]).slice(0,1500)));
    answers.append(line);
   });
   entry.append(answers);
   if(String(row.ESTADO)==='REVISADO'){
    entry.append(make('p','Nota: '+String(row.RESULTADO||'—')+'/100'));
    entry.append(make('p','Comentario de Progress Check: '+String(row.COMENTARIO_DOCENTE||'—')));
   }else{
    const form=make('form',null,'f111-tqr-form');
    const label=make('label','Nota del Quiz 1 (0–100)');
    const grade=make('input');grade.type='number';grade.min='0';grade.max='100';grade.step='0.01';grade.required=true;
    label.append(grade);
    const commentLabel=make('label','Comentario de Progress Check (obligatorio, independiente de asistencia)');
    const comment=make('textarea');comment.required=true;comment.minLength=5;comment.maxLength=1500;comment.rows=3;
    commentLabel.append(comment);
    const button=make('button','Guardar nota y comentario','f111-tqr-open');
    button.type='submit';
    const feedback=make('p','','f111-tqr-feedback');
    form.append(label,commentLabel,button,feedback);
    form.addEventListener('submit',async ev=>{
     ev.preventDefault();
     if(!form.reportValidity())return;
     if(!confirm('Cerrar revisión del Progress Check de '+code+' con nota '+grade.value+'/100 y comentario obligatorio?'))return;
     button.disabled=true;feedback.textContent='Guardando revisión…';
     try{
      const result=await postQuiz('qzProgressTeacherReview',Object.assign({},qzContext,{
        cod_estudiante:code,nota:grade.value,comentario_progress_check:comment.value.trim()
      }));
      if(result.estado!=='REVISADO'||result.comentario_asistencia_modificado!==false)throw Error('Sin readback de revisión');
      feedback.textContent='Nota y comentario guardados. El comentario de asistencia sigue siendo obligatorio por separado.';
      // El readback confirma el cierre. Actualizamos la lista sin reenviar.
      container.dataset.loading='0';
      buildReviewEditor(container);
     }catch(err){feedback.textContent='No se pudo guardar. Verificá la entrega antes de reintentar: '+err.message;button.disabled=false;}
    });
    entry.append(form);
   }
   container.append(entry);
  });
 }).catch(err=>{container.replaceChildren(make('p','No se pudieron consultar las entregas: '+err.message));})
 .finally(()=>{container.dataset.loading='0'});
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
    const gradePanel=make('div',null,'f111-tqr-review-panel');
    gradePanel.hidden=true;
    gradeBtn.addEventListener('click',()=>{
      gradePanel.hidden=!gradePanel.hidden;
      if(!gradePanel.hidden)buildReviewEditor(gradePanel);
    });
    card.append(gradeBtn,gradePanel);
    card.append(buildQuizOpenControls());
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
 '.f111-tqr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:9px}',
 '.f111-tqr-card{border:1px solid #DAE3ED;background:#F9FBFD;border-radius:10px;padding:11px;display:flex;flex-direction:column;gap:5px}',
 '.f111-tqr-card.is-ready{background:#FFFCED;border-color:#E0C271}',
 '.f111-tqr-card small{font-size:9px;color:#657A91;font-weight:900;letter-spacing:.04em}',
 '.f111-tqr-card strong{font-size:14px;font-weight:900;color:#143C63}',
 '.f111-tqr-card span{font-size:11px;color:#697C91}',
 '.f111-tqr-card em{font-size:10px;font-style:normal;color:#7A8A9A;margin-top:7px}',
 '.f111-tqr-open{padding:9px 10px;border-radius:8px;background:#F2C83D;color:#173959;border:1px solid #D9B12B;font-size:11px;font-weight:900;cursor:pointer;margin-top:4px}',
 '.f111-tqr .f111-tqr-foot{font-size:11px;color:#667D92;margin:12px 0 0}',
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
