import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),B=require('../vendor/babel.js');
const tv=fs.readFileSync('src/teacher_views.jsx','utf8'),
  vd=fs.readFileSync('src/vista_docente.jsx','utf8'),
  app=fs.readFileSync('src/app.jsx','utf8'),bridge=fs.readFileSync('src/att77_bridge.js','utf8'),
  shell=fs.readFileSync('campus.html','utf8');
for(const file of ['src/teacher_views.jsx','src/vista_docente.jsx','src/app.jsx'])
  B.transform(fs.readFileSync(file,'utf8'),{presets:['react'],plugins:['transform-block-scoping']});
assert(tv.includes("postTeacher('getAsistenciaBorradorF100'"));
assert(tv.includes("postTeacher('guardarAsistenciaBorradorF100'"));
assert(tv.includes('programa={draftProgram}'),'Official backend program drives UI');
assert(tv.includes("const verifiedProgram=String(r.programa||'')"),'Authoritative program received');
assert(tv.includes('initialAttendance={draftAttendance} initialComments={draftComments} requireExplicitAttendance={true}'));
assert(tv.includes('draftSessionId'));assert(tv.includes('draftDirty'));
assert(tv.includes('setDraftSaved(serialized)'));assert(tv.includes('setDraftCommentsSaved(serializedNotes)'));
assert(tv.includes('comentarios:commentsNow,modo:\'BORRADOR\''),'Partial autosave request includes comments');
assert(tv.includes("width:'min(1120px,98vw)'"),'Wide teacher drawer');
assert(tv.includes("if(draftLoad!=='ready'||!draftCompletion.canSave)"),'Cierre nunca evita la validación completa');
assert(vd.includes('requireExplicitAttendance && (!f || (f.presente!==true && f.presente!==false))'));
assert(vd.includes("typeof initialComments?.[e.code]==='string'?initialComments[e.code]:''"));
assert(vd.includes('includesPC && !f.pc.trim()'),'Progress Check still independently required');
for(const s of [app,bridge,shell])assert(s.includes('F104NEXTROSTER20261009'),'Cache bust present across all loaders');
const start=tv.indexOf('function tvAttendanceCompletionF102('),
  end=tv.indexOf('function LessonDrawerF82(',start);
assert(start>=0&&end>start);
const React={createElement:(type,props,...children)=>({type,props:props||{},children})};
const ctx={React};vm.createContext(ctx);
vm.runInContext(B.transform(tv.slice(start,end),{presets:['react']}).code,ctx);
const list=[
 {code:'17201',name:'Estudiante Primera'}, {code:'17202',name:'Estudiante Segundo'},
 {code:'17203',name:'Estudiante Tercera'}
];
const complete=ctx.tvAttendanceCompletionF102(list,
 {'17201':'P','17202':'A','17203':'P'},
 {'17201':'Avanzó','17202':'Ausente','17203':'Participó'},'INA');
assert(complete.canSave);assert.equal(complete.completedNotes,3);assert.equal(complete.pending,0);
const partial=ctx.tvAttendanceCompletionF102(list,{'17201':'P','17202':'A'},
 {'17201':'Avanzó'},'INA');
assert(!partial.canSave);assert.equal(partial.pending,1);
assert.deepEqual(Array.from(partial.missingComments),['17202','17203']);
assert(ctx.tvAttendanceCompletionF102(list,{'17201':'P','17202':'A','17203':'P'},
 {},'SIN_INA').canSave,'SIN_INA may omit all comments');
assert(!ctx.tvAttendanceCompletionF102(list,{'17201':'P','17202':'A','17203':'P'},
 {},'INA').canSave,'INA requires all notes even for absences');
assert(!ctx.tvAttendanceCompletionF102(list,{'17201':'P','17202':'A','17203':'P'},
 {},'').canSave,'Unknown program fails closed');
const flatten=x=>Array.isArray(x)?x.flatMap(flatten):x&&typeof x==='object'?
  [x,...(x.children||[]).flatMap(flatten)]:[];
const calls=[];
const base={roster:list,states:{'17201':'P','17202':'A','17203':'P'},comments:{'17201':'Avanzó'},
  counts:{P:2,A:1,pending:0},status:'ready',dirty:true,busy:false,programa:'INA',notice:'',
  onMark:(code,state)=>calls.push(['mark',code,state]),onComment:(code,note)=>calls.push(['note',code,note]),
  onFinalize:()=>calls.push(['finalize']),onSaveNow:()=>calls.push(['retrySave']),onRetry:()=>calls.push(['retry'])};
const tree=ctx.LiveAttendancePanelF100(base),nodes=flatten(tree);
const inputs=nodes.filter(x=>x.type==='textarea');
assert.equal(inputs.length,3,'ALL comments always visible, one per student');
assert(inputs.every(x=>x.props.maxLength===800));
assert.equal(new Set(inputs.map(x=>x.props.id)).size,3);
assert(!nodes.some(x=>x.props?.title==='Agregar comentario'),'No hidden expand controls');
inputs[1].props.onChange({target:{value:'Participación constante'}});
assert.deepEqual(calls.at(-1),['note','17202','Participación constante']);
const buttons=nodes.filter(x=>x.type==='button');
assert.equal(buttons.filter(x=>x.props['aria-pressed']!==undefined).length,9);
const save=buttons.find(x=>x.children?.[0]==='Guardar y cerrar clase');
assert(save&&save.props.disabled,'INA incomplete cannot save');
const ready=ctx.LiveAttendancePanelF100({...base,dirty:false,comments:{
 '17201':'Avanzó','17202':'Ausente','17203':'Participó'}});
const save2=flatten(ready).find(x=>x.type==='button'&&x.children?.[0]==='Guardar y cerrar clase');
assert(save2&&!save2.props.disabled);
save2.props.onClick();assert.deepEqual(calls.at(-1),['finalize']);
const libre=ctx.LiveAttendancePanelF100({...base,dirty:false,programa:'SIN_INA',comments:{}});
const save3=flatten(libre).find(x=>x.type==='button'&&x.children?.[0]==='Guardar y cerrar clase');
assert(save3&&!save3.props.disabled,'SIN_INA no comments needed');
const loading=ctx.LiveAttendancePanelF100({...base,status:'loading'});
assert.equal(flatten(loading).filter(x=>x.type==='textarea').length,0,'No fields before authentication');
assert(tv.includes('setTimeout(()=>{void guardarBorrador();},900)'), 'Autosave with debounce');
assert(tv.includes("window.addEventListener('beforeunload',warn)"),'Warn before closing with unsynced changes');
assert(tv.includes('postTeacher(\'getDocenteContactosF103\''),'Contacts retrieved for Mis grupos');
assert(tv.includes('function tvSelectContactTextF104('),'Selective double-click helper');
assert(tv.includes('onDoubleClick={contacto.telefono?tvSelectContactTextF104:undefined}'),'Phone specific text selection');
assert(tv.includes('onDoubleClick={contacto.correo?tvSelectContactTextF104:undefined}'),'Email specific text selection');
assert(!tv.includes('tvCopyContactF103('),'No legacy copy function');
assert(!tv.includes('}>Copiar</button>'),'No inline copy buttons');
assert(tv.includes("viewMode==='total'?nextLesson"),'Only one next event across both rails in total view');
assert(tv.includes('Vista TOTAL: lecciones e I CAN, ordenados por fecha y hora.'),'Schedule subtitle explains ordering');
assert(!tv.includes('mezclados por fecha y hora'),'No mixed wording');
assert(tv.includes('const isNextTile=active&&!!nextEvent'),'Weekly upcoming badge uses single event');
assert(tv.includes('lecciones={lecciones}'),'Weekly calendar uses group real lessons');
assert(tv.includes('Date.UTC(dateParts[0],dateParts[1]-1,dateParts[2])'),'Weekday calculation timezone stable');
console.log('QA_F104_NEXT_SELECT_CONTACT_FRONTEND_PASS');
console.log('QA_F103_AUTOSAVE_CONTACT_FRONTEND_PASS');
console.log('QA_F102_VISIBLE_ATTENDANCE_FRONTEND_PASS');
console.log('PASS: full-row comments x3, INA/SIN_INA, pending attendance, guard save, backend program, 1120px drawer, close validations, cache bust');
