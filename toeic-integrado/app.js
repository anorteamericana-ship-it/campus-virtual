/* Pilot integrated practice. Local-only records, no student backend writes. */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const DATA=root.EPL_FORMS, TASKS=root.AN_FOUR_SKILLS_TASKS, CORE=root.TOEIC4Core;
if(!DATA?.A||!DATA?.B||!TASKS||!CORE)throw new Error('Banco de práctica incompleto');
const STORE='an_toeic_integrado_pilot_v1';
const items=[...DATA.A.items,...DATA.B.items],byId=new Map(items.map(i=>[i.item_id,i]));
const groups=new Map([...DATA.A.groups,...DATA.B.groups].map(g=>[g.passage_group_id,g]));
const sectionOrder=['listening','reading','speaking','writing'];
const records=new Map();let rec=null,prepUntil=null,wTimer={};
let state=null;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load(){try{const a=JSON.parse(localStorage.getItem(STORE)||'null');return a?.version===1?a:null}catch{return null}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(state));return true}catch{return false}}
function fresh(){return {version:1,started:Date.now(),phase:'test',section:'listening',stage:1,index:0,unitIds:{listening:[[],[]],reading:[[],[]]},routes:{},answers:{},writes:{},recorded:{},deadline:Date.now()+CORE.MINUTES.listening[0]*60000,sectionUntil:0};}
function stageItems(){return state.unitIds[state.section][state.stage-1].map(id=>byId.get(id)).filter(Boolean)}
function tasks(){return TASKS[state.section]||[]}
function current(){return ['listening','reading'].includes(state.section)?stageItems()[state.index]:tasks()[state.index]}
function safeState(){return state&&state.phase==='test'&&current()}
function score(section){const ids=(state.unitIds[section]||[]).flat(),arr=ids.map(id=>byId.get(id)).filter(Boolean);
return {correct:arr.filter(i=>state.answers[i.item_id]===i.correct).length,answered:arr.filter(i=>state.answers[i.item_id]!=null).length,total:arr.length};}
function reset(){if(!root.confirm('¿Borrar todo el progreso y los textos de este navegador? Las grabaciones sin descargar se perderán.'))return;
 stopRecord();for(const r of records.values())URL.revokeObjectURL(r.url);records.clear();
 localStorage.removeItem(STORE);state=null;$('welcome').hidden=false;$('exam').hidden=true;$('done').hidden=true;$('resume').hidden=true;$('reset').hidden=true;}
function begin(){state=fresh();const units=CORE.pick(DATA.A,'listening',1,[],'foundation');state.unitIds.listening[0]=units.map(x=>x.item_id);save();render();}
function finishStage(){
 if(!state||state.phase!=='test')return;stopRecord();
 if(['listening','reading'].includes(state.section)){
  const section=state.section;
  if(state.stage===1){
   const first=stageItems(),result=CORE.route(state.answers,first);
   state.routes[section]=result;
   const used=first.map(x=>x.item_id),bank=result.branch==='upper'?DATA.B:DATA.A;
   const second=CORE.pick(bank,section,2,used,result.branch);
   state.unitIds[section][1]=second.map(x=>x.item_id);
   state.stage=2;state.index=0;state.deadline=Date.now()+CORE.MINUTES[section][1]*60000;
   save();render();return;
  }
  if(section==='listening'){
   state.section='reading';state.stage=1;state.index=0;
   state.unitIds.reading[0]=CORE.pick(DATA.A,'reading',1,[],'foundation').map(x=>x.item_id);
   state.deadline=Date.now()+CORE.MINUTES.reading[0]*60000;
   save();render();return;
  }
  state.section='speaking';state.index=0;state.stage=0;
  state.sectionUntil=Date.now()+20*60000;state.deadline=state.sectionUntil;
  save();render();return;
 }
 if(state.section==='speaking'){
  state.section='writing';state.index=0;state.sectionUntil=Date.now()+60*60000;state.deadline=state.sectionUntil;
  save();render();return;
 }
 state.phase='done';state.deadline=0;state.sectionUntil=0;state.finished=Date.now();save();render();
}
function stepNext(){
 if(!safeState())return;
 if(state.index < (['listening','reading'].includes(state.section)?stageItems().length:tasks().length)-1){
  stopRecord();state.index++;save();render();
 }else finishStage();
}
function renderTable(columns,rows){return '<table class="data-table"><thead><tr>'+columns.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
function passage(p){
 if(!p)return '';
 let h='<div class="context">';
 if(p.label)h+='<small>'+esc(p.label)+'</small>';
 if(p.title)h+='<h2>'+esc(p.title)+'</h2>';
 if(Array.isArray(p.header))for(const x of p.header)h+='<div><b>'+esc(x[0])+':</b> '+esc(x[1])+'</div>';
 if(Array.isArray(p.meta))for(const x of p.meta)h+='<p>'+esc(x)+'</p>';
 if(Array.isArray(p.body))for(const x of p.body)h+='<p>'+esc(x)+'</p>';
 if(Array.isArray(p.messages))for(const x of p.messages)h+='<p><b>'+esc(x[0])+' '+esc(x[1])+':</b> '+esc(x[2])+'</p>';
 if(p.columns&&p.rows)h+=renderTable(p.columns,p.rows);
 if(Array.isArray(p.notes))for(const x of p.notes)h+='<p>'+esc(x)+'</p>';
 return h+'</div>';
}
function contextLR(item){
 let h='';
 if(item.image_asset)h+='<div class="context"><img src="../prototipos/exam_prep_lab/'+esc(item.image_asset)+'" alt="Ilustración para la pregunta; elegí la opción que corresponde."></div>';
 const group=item.passage_group_id?groups.get(item.passage_group_id):null;
 if(group){
  if(group.intro)h+='<p class="small">'+esc(group.intro)+'</p>';
  if(group.passage)h+=passage(group.passage);
  if(Array.isArray(group.passages))for(const p of group.passages)h+=passage(p);
  if(Array.isArray(group.documents))for(const p of group.documents)h+=passage(p);
  if(group.graphic){const g=group.graphic;h+='<div class="context"><b>'+esc(g.title||'Información')+'</b>'+renderTable(g.columns||[],g.rows||[])+'</div>'}
 }
 const audio=item.audio_asset||(group?.audio_asset);
 if(audio)h+='<audio class="audio" controls preload="metadata" src="../prototipos/exam_prep_lab/'+esc(audio)+'"></audio><p class="note">Audio sintético de práctica. Podés escucharlo de nuevo; esta repetición no imita exactamente las restricciones del examen oficial.</p>';
 return h;
}
function renderLR(item){
 $('question-title').textContent='Parte '+item.part+' · '+(item.skill==='listening'?'Listening':'Reading');
 $('question-context').innerHTML=contextLR(item);
 $('question-body').innerHTML='<p class="prompt">'+esc(item.stem|| (item.part===1?'Look at the picture and choose the correct description.':'Listen and select the correct response.'))+'</p>';
 const value=state.answers[item.item_id],spoken=[1,2].includes(item.part);
 $('response-area').innerHTML='<fieldset class="options"><legend>Seleccioná una respuesta</legend>'+
 item.options.map(o=>'<label><input type="radio" name="answer" value="'+esc(o.id)+'" '+(value===o.id?'checked':'')+'> <span><b>'+esc(o.id.toUpperCase())+'.</b> '+(spoken?'Respuesta en el audio':esc(o.text))+'</span></label>').join('')+'</fieldset>';
}
function contextSW(item){
 let h='';
 if(item.image)h+='<div class="context"><img src="'+esc(item.image)+'" alt="Ilustración para la tarea de producción en inglés"></div>';
 if(item.information)h+='<div class="context"><b>'+esc(item.information.title)+'</b>'+renderTable(['Time','Activity','Speaker / location'],item.information.rows)+'</div>';
 if(item.email)h+='<div class="context"><div><b>From:</b> '+esc(item.email.from)+'</div><div><b>Subject:</b> '+esc(item.email.subject)+'</div><p>'+esc(item.email.body)+'</p></div>';
 if(item.words)h+='<p>Usá ambas palabras: <b>'+item.words.map(esc).join(' · ')+'</b></p>';
 return h;
}
function renderSW(t){
 const isSpeaking=state.section==='speaking';
 $('question-title').textContent=(isSpeaking?'Speaking':'Writing')+' · Tarea '+t.n;
 $('question-context').innerHTML=contextSW(t);
 $('question-body').innerHTML='<p class="prompt">'+esc(t.prompt)+'</p><p class="note">'+t.criteria.map(esc).join(' · ')+'</p>';
 if(isSpeaking){
  const saved=records.get(t.id),active=rec?.id===t.id;
  $('response-area').innerHTML='<p class="small">Preparación '+t.prepare+' s · respuesta '+t.respond+' s. La preparación y la grabación se inician al pulsar sus botones.</p>'+
   '<div class="buttons"><button type="button" data-act="prepare">Preparar</button><button type="button" data-act="record" '+(active?'disabled':'')+'>Grabar respuesta</button><button type="button" data-act="stop" '+(active?'':'disabled')+'>Detener</button></div>'+
   '<p class="note">'+(t.type==='information'?'Las preguntas de esta práctica están escritas; todavía no se reproducen como consignas orales.':'La grabación es voluntaria, no se guarda en el servidor.')+'</p>'+
   (saved?'<audio controls src="'+saved.url+'" class="audio"></audio><a class="download" download="'+t.id+'.'+saved.ext+'" href="'+saved.url+'">Descargar grabación '+t.id+'</a>':'')+
   '<p class="note">'+(state.recorded[t.id]?'Se grabó una respuesta en esta sesión (archivo disponible solo hasta recargar).':'Sin grabación guardada')+'</p>';
 }else{
  const timer=t.n<=5?'8 minutos compartidos entre tareas 1–5':t.minutes+' minutos';
  $('response-area').innerHTML='<label for="writing">Tu respuesta en inglés</label><textarea id="writing" class="'+(t.type==='essay'?'essay':'')+'" maxlength="12000" spellcheck="true" placeholder="Write your answer…"></textarea><p class="note">'+timer+' · el cronómetro global de Writing es 60 minutos. Borrador guardado solo en este navegador.</p><p id="writing-clock" class="note"></p><p id="wordcount" class="note"></p>';
  $('writing').value=state.writes[t.id]||'';updateWords();writingDeadline(t);
 }
}
function writingDeadline(t){
 if(!state.writeUntil)state.writeUntil={};
 const key=t.n<=5?'W01-W05':t.id;
 if(!state.writeUntil[key]){state.writeUntil[key]=Date.now()+(t.n<=5?8:t.minutes)*60000;save();}
 return Math.min(state.writeUntil[key],state.sectionUntil||Infinity);
}
function updateWords(){if($('wordcount')&&$('writing'))$('wordcount').textContent=($('writing').value.trim().match(/\S+/g)||[]).length+' palabras';}
function render(){
 $('welcome').hidden=!!state;$('exam').hidden=!state||state.phase!=='test';$('done').hidden=!state||state.phase!=='done';
 $('resume').hidden=!state;$('reset').hidden=!state;
 if(!state)return;
 if(state.phase==='done')return renderDone();
 const isLR=['listening','reading'].includes(state.section),list=isLR?stageItems():tasks(),t=current();
 if(!t){$('status').textContent='No se pudo cargar esta pregunta.';return}
 $('phase-label').textContent=state.section.toUpperCase()+(isLR?' · Unidad '+state.stage+'/2'+(state.stage===2?' · ruta '+(state.routes[state.section]?.branch==='upper'?'avanzada':'fundamentos'):''):'');
 $('question-index').textContent='Pregunta '+(state.index+1)+' de '+list.length;
 $('meter-fill').style.width=((state.index+1)/list.length*100)+'%';
 $('prev').disabled=state.index===0;
 $('next').textContent=state.index===list.length-1?'Completar '+(isLR?'unidad':'sección'):'Siguiente';
 $('finish-stage').hidden=!isLR;
 $('finish-stage').textContent='Finalizar unidad antes del reloj';
 $('status').textContent='';
 if(isLR)renderLR(t);else renderSW(t);
 tick();
}
function renderDone(){
 const L=score('listening'),R=score('reading'),sw=Object.values(state.recorded).filter(Boolean).length,ww=TASKS.writing.filter(t=>(state.writes[t.id]||'').trim()).length;
 $('results').innerHTML='<div class="stats"><div><b>'+L.correct+'/'+L.total+'</b>Listening · aciertos formativos</div><div><b>'+R.correct+'/'+R.total+'</b>Reading · aciertos formativos</div><div><b>'+sw+'/11</b>Speaking · grabaciones iniciadas</div><div><b>'+ww+'/8</b>Writing · textos contestados</div></div>'+
 '<p>No son puntuaciones ETS. La dificultad de la segunda etapa se eligió con un umbral pedagógico del 68 % de respuestas correctas en la primera; no es una calibración psicométrica.</p>';
}
function tick(){
 if(!state||state.phase!=='test')return;
 if(state.section==='writing'&&current()){
  const t=current(),end=writingDeadline(t),left=Math.max(0,Math.ceil((end-Date.now())/1000));
  const clock=$('writing-clock');
  if(clock)clock.textContent='Tiempo restante de este bloque: '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
  if(!left){
   if(t.n<=5)state.index=5;
   else if(t.n<8)state.index=t.n;
   else{finishStage();return}
   save();render();return;
  }
 }
 const seconds=Math.max(0,Math.ceil((state.deadline-Date.now())/1000));
 $('timer').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
 if(!seconds){if(rec)stopRecord();finishStage();}
}
function stopRecord(){
 if(!rec)return;const r=rec;rec=null;
 if(r.media.state!=='inactive')r.media.stop();
 r.stream.getTracks().forEach(track=>track.stop());
}
async function startRecording(){
 if(rec||!safeState())return;
 if(!root.isSecureContext||!navigator.mediaDevices?.getUserMedia||!root.MediaRecorder){$('status').textContent='Micrófono no disponible; necesitás HTTPS y un navegador compatible.';return}
 const task=current();let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){$('status').textContent='Permiso de micrófono no concedido.';return}
 if(state.section!=='speaking'||current()?.id!==task.id){stream.getTracks().forEach(x=>x.stop());return}
 try{
  const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm',''].find(x=>!x||MediaRecorder.isTypeSupported(x));
  const media=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),parts=[];
  const r={id:task.id,stream,media};rec=r;media.ondataavailable=e=>{if(e.data.size)parts.push(e.data)};
  media.onstop=()=>{if(!parts.length)return;const blob=new Blob(parts,{type:media.mimeType||'audio/webm'});
   const ext=blob.type.includes('mp4')?'m4a':'webm';const prev=records.get(r.id);if(prev)URL.revokeObjectURL(prev.url);
   records.set(r.id,{url:URL.createObjectURL(blob),ext});state.recorded[r.id]=true;save();if(state.section==='speaking'&&current()?.id===r.id)render();};
  media.start(250);root.setTimeout(()=>{if(rec===r)stopRecord()},task.respond*1000);
  render();$('status').textContent='Grabando… la respuesta se detendrá automáticamente según el tiempo de la tarea.';
 }catch(e){stream.getTracks().forEach(x=>x.stop());rec=null;$('status').textContent='No fue posible activar la grabación.';}
}
function exportText(){
 const s=state, lines=['Academia Norteamericana · TOEIC 4-Skills · resumen de práctica (NO ETS)','Fecha: '+new Date().toLocaleString('es-CR'),''];
 for(const skill of ['listening','reading']){const a=score(skill);lines.push(skill+': '+a.correct+'/'+a.total+' aciertos; '+a.answered+' contestadas. Ruta: '+(s.routes[skill]?.branch||'n/d'));}
 lines.push('Speaking: '+Object.values(s.recorded).filter(Boolean).length+'/11 grabaciones registradas (audios requieren descarga separada)','');
 for(const task of TASKS.writing)lines.push('WRITING '+task.id+' · '+task.prompt+'\n'+(s.writes[task.id]||'[Sin respuesta]')+'\n');
 const blob=new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='academia-toeic-integrado-respuestas.txt';document.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
$('begin').addEventListener('click',begin);
$('resume').addEventListener('click',()=>render());
$('reset').addEventListener('click',reset);
$('reset-done').addEventListener('click',reset);
$('export').addEventListener('click',exportText);
$('prev').addEventListener('click',()=>{if(!safeState()||state.index===0)return;stopRecord();state.index--;save();render()});
$('next').addEventListener('click',stepNext);
$('finish-stage').addEventListener('click',()=>{if(root.confirm('¿Finalizar esta unidad? Las respuestas pendientes quedarán en blanco.'))finishStage()});
$('response-area').addEventListener('change',e=>{
 if(e.target.name!=='answer'||!safeState())return;state.answers[current().item_id]=e.target.value;if(!save())$('status').textContent='No se pudo guardar el intento en este navegador.';
});
$('response-area').addEventListener('input',e=>{
 if(e.target.id!=='writing'||!safeState())return;state.writes[current().id]=e.target.value;save();updateWords();
});
$('response-area').addEventListener('click',async e=>{
 const b=e.target.closest('button[data-act]');if(!b)return;
 if(b.dataset.act==='record')await startRecording();
 if(b.dataset.act==='stop')stopRecord();
 if(b.dataset.act==='prepare'){prepUntil=Date.now()+current().prepare*1000;$('status').textContent='Preparación iniciada; contá '+current().prepare+' segundos y luego grabá.';}
});
root.addEventListener('beforeunload',()=>{stopRecord();for(const r of records.values())URL.revokeObjectURL(r.url)});
state=load();if(state&&state.phase==='test'&&['listening','reading'].includes(state.section)&&!stageItems().length){state=null;localStorage.removeItem(STORE);}
render();root.setInterval(tick,500);
root.TOEIC4Debug={state:()=>state,score,finishStage,begin};
})(window);
