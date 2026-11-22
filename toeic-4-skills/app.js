/* Academia Norteamericana — Speaking & Writing practice. No official ETS scoring. */
(function(root){
'use strict';
const DATA=root.AN_FOUR_SKILLS_TASKS;
if(!DATA||DATA.speaking.length!==11||DATA.writing.length!==8)throw new Error('Invalid practice task bank');
const $=id=>document.getElementById(id);
const STORE='an_toeic_four_skills_writing_v1', REVIEWS='an_toeic_four_skills_checks_v1';
const load=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}};
const state={track:'speaking',index:0,drafts:load(STORE),checks:load(REVIEWS),audio:new Map(),recording:null,timers:{},interval:null};
const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tasks=()=>DATA[state.track];
const task=()=>tasks()[state.index];
const shortTime=n=>{const total=Math.ceil(Math.max(0,n));return Math.floor(total/60)+':'+String(total%60).padStart(2,'0')};
const wordCount=s=>(s.trim().match(/\S+/g)||[]).length;
function timerKey(t){return t.type==='sentence'?'W-GROUP-1-5':t.id}
function timeLeft(t){const x=state.timers[timerKey(t)];return x?Math.max(0,(x.until-Date.now())/1000):null}
function status(message,problem){
 const node=$('control-status');if(node){node.textContent=message||'';node.classList.toggle('error',!!problem)}
}
function completed(t){return state.track==='writing'?!!(state.drafts[t.id]||'').trim():state.audio.has(t.id)}
function renderNav(){
 const list=tasks();$('track-name').textContent=state.track==='speaking'?'Speaking':'Writing';
 $('progress').textContent=list.filter(completed).length+' de '+list.length+' tareas con respuesta';
 $('task-nav').innerHTML=list.map((t,i)=>'<button type="button" class="'+(i===state.index?'selected ':'')+(completed(t)?'done':'')+'" data-index="'+i+'" aria-current="'+(i===state.index?'step':'false')+'">Tarea '+t.n+'</button>').join('');
}
function renderPicture(t){
 return t.image?'<figure class="visual"><img src="'+safe(t.image)+'" alt="Ilustración para practicar la descripción; no se proporciona la respuesta visual en texto"><figcaption class="small-note">Ilustración original de práctica, no fotografía oficial ETS.</figcaption></figure>':'';
}
function renderInfo(t){
 if(!t.information)return '';
 let h='<div class="email"><strong>'+safe(t.information.title)+'</strong><table class="info-table"><thead><tr><th>Time</th><th>Activity</th><th>Speaker / location</th></tr></thead><tbody>';
 for(const row of t.information.rows)h+='<tr>'+row.map(c=>'<td>'+safe(c)+'</td>').join('')+'</tr>';
 return h+'</tbody></table></div>';
}
function renderEmail(t){
 if(!t.email)return '';
 return '<div class="email"><div><strong>From:</strong> '+safe(t.email.from)+'</div><div><strong>Subject:</strong> '+safe(t.email.subject)+'</div><p>'+safe(t.email.body)+'</p></div>';
}
function displayTitle(t){
 if(state.track==='speaking'){
 const labels={read:'Read a text aloud',picture:'Describe a picture',question:'Respond to questions',information:'Respond using information',opinion:'Express an opinion'};
 return labels[t.type]||t.type;
 }
 return t.type==='sentence'?'Write a sentence based on a picture':t.type==='email'?'Respond to a written request':'Write an opinion essay';
}
function renderContent(t){
 let out='';
 if(t.image)out+=renderPicture(t);
 if(t.information)out+=renderInfo(t);
 if(t.email)out+=renderEmail(t);
 if(t.words)out+='<div class="required-words"><strong>Required words:</strong> '+t.words.map(safe).join(' / ')+'</div>';
 out+='<div class="prompt"><p>'+safe(t.prompt)+'</p></div>';
 if(t.type==='information')out+='<p class="small-note">Para practicar, la pregunta aparece escrita. En la prueba real se escucha y la número 10 se repite dos veces; este piloto todavía no reproduce esa locución oficial.</p>';
 return out;
}
function renderCriteria(t){
 const marked=state.checks[t.id]||{};
 $('review-criteria').innerHTML=t.criteria.map((c,i)=>'<label><input type="checkbox" data-check="'+i+'" '+(marked[i]?'checked':'')+'> '+safe(c)+'</label>').join('')+
 '<p class="review-check">Lista orientativa para revisión propia o con un docente. No determina una nota TOEIC ni un nivel MCER.</p>';
}
function renderControls(t){
 if(state.track==='speaking'){
 const saved=state.audio.get(t.id),active=state.recording&&state.recording.id===t.id;
 $('time-advice').textContent='Preparación: '+t.prepare+' s · Respuesta: '+t.respond+' s';
 let out='<div class="control-panel"><p>1. Mirá el ejercicio. 2. Prepará tu idea. 3. Tocá «Grabar respuesta» si autorizás usar el micrófono. No se envía ningún audio.</p>'+
 '<div class="actions"><button type="button" data-action="prep">Iniciar preparación ('+t.prepare+' s)</button>'+
 '<button type="button" data-action="record" '+(active?'disabled':'')+'>🎤 Grabar respuesta ('+t.respond+' s)</button>'+
 '<button type="button" data-action="stop" '+(!active?'disabled':'')+'>Detener grabación</button>'+
 '<button type="button" data-action="practice-time">Practicar sin grabar</button>'+
 '<span class="timer" id="countdown" aria-live="off">--:--</span></div>';
 if(saved)out+='<p class="small-note">Grabación disponible en esta pestaña. Descargala antes de recargar o cerrarla.</p>'+
 '<audio class="playback" controls src="'+saved.url+'"></audio><a class="file-link" download="'+t.id+'.'+saved.ext+'" href="'+saved.url+'">Descargar mi respuesta</a>';
 out+='<div class="status" id="control-status" role="status"></div>'+
 '<p class="small-note">Si el navegador no admite grabación, usá el temporizador sin micrófono. La voz nunca se guarda en este servidor.</p></div>';
 $('practice-controls').innerHTML=out;
 } else {
 const value=state.drafts[t.id]||'',group=t.n<=5;
 $('time-advice').textContent=group?'8 min compartidos para las preguntas 1–5':t.minutes+' min para esta pregunta';
 let out='<div class="control-panel"><p>Escribí en inglés. El borrador se guarda en este navegador; nadie lo recibe automáticamente.</p>'+
 '<label for="response">Tu respuesta</label><textarea id="response" '+(t.type==='essay'?'class="essay"':'')+
 ' maxlength="12000" spellcheck="true" autocomplete="off" placeholder="Write your answer in English…"></textarea>'+
 '<div class="wordcount" id="wordcount"></div><div class="actions">'+
 '<button type="button" data-action="writing-timer">Iniciar '+(group?'los 8 minutos compartidos':t.minutes+' minutos')+'</button>'+
 '<span class="timer" id="countdown" aria-live="off">--:--</span>'+
 '<button type="button" data-action="download-writing">Exportar textos (.txt)</button>'+
 '<button type="button" data-action="clear-writing">Borrar borradores</button></div>'+
 '<div class="status" id="control-status" role="status"></div>'+
 '<p class="small-note">'+(t.type==='essay'?'En el TOEIC, un ensayo eficaz suele tener al menos 300 palabras. Eso es una recomendación, no una calificación automática.':group?'Los ocho minutos son para las cinco oraciones en conjunto; el cronómetro permanece activo al cambiar de una a otra.':'En la prueba oficial hay diez minutos por correo o treinta para el ensayo.')+'</p></div>';
 $('practice-controls').innerHTML=out;
 $('response').value=value;updateWords(t);
 }
 tick();
}
function updateWords(t){
 if(!$('wordcount'))return;const count=wordCount($('response').value);const essay=t.type==='essay';
 $('wordcount').textContent=count+' palabras'+(essay?' · referencia orientativa: 300 o más':'');
 $('wordcount').classList.toggle('good',essay&&count>=300);
}
function tick(){
 const timer=$('countdown');if(!timer)return;
 const remaining=timeLeft(task());timer.textContent=remaining===null?'--:--':shortTime(remaining);
 timer.classList.toggle('ended',remaining!==null&&remaining<=0);
 if(remaining!==null&&remaining<=0){
  const rec=state.recording;if(rec&&rec.id===task().id&&state.timers[timerKey(task())]?.stage==='response')stopRecording();
 }
}
function startTimer(seconds,stage){
 state.timers[timerKey(task())]={until:Date.now()+seconds*1000,stage};
 tick();
 status(stage==='prepare'?'Preparación iniciada. Organizá tus ideas.':stage==='response'?'Respondé ahora.':'Cronómetro de práctica iniciado.');
}
function stopRecording(){
 const rec=state.recording;if(!rec)return;
 state.recording=null;
 if(rec.media.state!=='inactive')rec.media.stop();
 for(const track of rec.stream.getTracks())track.stop();
}
async function recordResponse(){
 if(state.recording)return;
 const t=task();
 if(!root.isSecureContext||!navigator.mediaDevices?.getUserMedia||typeof root.MediaRecorder!=='function'){
  status('Este navegador no permite grabar aquí. Probá con Chrome o Safari actualizado y conexión HTTPS; también podés practicar sin grabar.',true);return;
 }
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}
 catch(e){status('No se activó el micrófono. Revisá sus permisos o practicá sin grabar.',true);return}
 const types=['audio/webm;codecs=opus','audio/mp4','audio/webm',''];
 const mime=types.find(x=>!x||MediaRecorder.isTypeSupported(x))||'';
 try{
  const media=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[],recId=t.id;
  const rec={id:recId,stream,media};state.recording=rec;
  media.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};
  media.onerror=()=>{status('Falló la grabación; probá nuevamente.',true)};
  media.onstop=()=>{
   if(!chunks.length)return;
   const blob=new Blob(chunks,{type:media.mimeType||'audio/webm'});
   const ext=blob.type.includes('mp4')?'m4a':blob.type.includes('ogg')?'ogg':'webm';
   const previous=state.audio.get(recId);if(previous)URL.revokeObjectURL(previous.url);
   state.audio.set(recId,{url:URL.createObjectURL(blob),ext});
   if(task().id===recId){renderNav();renderControls(task());status('Grabación disponible para escuchar o descargar.')}
  };
  media.start(250);
  startTimer(t.respond,'response');
  renderControls(t);status('Grabando… El audio queda solo en esta pestaña.');
 }catch(e){for(const tr of stream.getTracks())tr.stop();state.recording=null;status('No fue posible iniciar la grabación en este navegador.',true)}
}
function downloadDrafts(){
 const lines=['Academia Norteamericana — TOEIC Writing practice (not scored)','Generated: '+new Date().toLocaleString('es-CR'),''];
 for(const t of DATA.writing)lines.push('Question '+t.n+' · '+displayTitle(t)+'\n'+t.prompt+'\n\n'+(state.drafts[t.id]||'[No answer]')+'\n');
 const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='academia-toeic-writing-practice.txt';
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 status('Se preparó el archivo de respuestas. Podés compartirlo voluntariamente con tu docente.');
}
function render(){
 stopRecording();
 const t=task(),list=tasks();
 $('task-number').textContent=(state.track==='speaking'?'Speaking':'Writing')+' · '+t.n+'/'+list.length;
 $('exercise-title').textContent=displayTitle(t);
 $('task-content').innerHTML=renderContent(t);
 renderControls(t);renderCriteria(t);renderNav();
 $('previous').disabled=state.index===0;$('next').disabled=state.index===list.length-1;
 $('next').textContent=state.index===list.length-1?'Última tarea':'Siguiente tarea';
}
function pick(track,index){
 if(track!=='speaking'&&track!=='writing')return;
 stopRecording();state.track=track;state.index=Math.max(0,Math.min((track==='speaking'?11:8)-1,index||0));
 render();$('exercise-title').focus?.();
}
$('choose-speaking').addEventListener('click',()=>pick('speaking',0));
$('choose-writing').addEventListener('click',()=>pick('writing',0));
$('task-nav').addEventListener('click',e=>{const btn=e.target.closest('button[data-index]');if(btn)pick(state.track,Number(btn.dataset.index))});
$('previous').addEventListener('click',()=>pick(state.track,state.index-1));
$('next').addEventListener('click',()=>pick(state.track,state.index+1));
$('review-criteria').addEventListener('change',e=>{
 const input=e.target.closest('input[data-check]');if(!input)return;
 const id=task().id;state.checks[id]=state.checks[id]||{};state.checks[id][input.dataset.check]=input.checked;
 save(REVIEWS,state.checks);
});
$('practice-controls').addEventListener('input',e=>{
 if(e.target.id!=='response')return;
 state.drafts[task().id]=e.target.value;const ok=save(STORE,state.drafts);
 updateWords(task());renderNav();if(!ok)status('No se pudo guardar localmente. Exportá los textos para conservarlos.',true);
});
$('practice-controls').addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-action]');if(!btn)return;
 switch(btn.dataset.action){
 case 'prep':startTimer(task().prepare,'prepare');break;
 case 'record':await recordResponse();break;
 case 'stop':stopRecording();status('Grabación finalizada.');break;
 case 'practice-time':startTimer(task().respond,'response');break;
 case 'writing-timer':startTimer(task().n<=5?480:task().minutes*60,'writing');break;
 case 'download-writing':downloadDrafts();break;
 case 'clear-writing':if(root.confirm('¿Borrar TODOS los borradores escritos guardados en este navegador?')){state.drafts={};save(STORE,state.drafts);render()}break;
 }
});
root.addEventListener('beforeunload',()=>{for(const v of state.audio.values())URL.revokeObjectURL(v.url);stopRecording()});
state.interval=setInterval(tick,350);
render();
root.AN_FOUR_SKILLS_DEBUG={getTrack:()=>state.track,getCount:()=>tasks().length,getDrafts:()=>Object.assign({},state.drafts)};
})(window);
