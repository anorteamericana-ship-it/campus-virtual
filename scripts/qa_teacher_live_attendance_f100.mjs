import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),B=require('../vendor/babel.js');
const tv=fs.readFileSync('src/teacher_views.jsx','utf8');
const vd=fs.readFileSync('src/vista_docente.jsx','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const bridge=fs.readFileSync('src/att77_bridge.js','utf8');
const shell=fs.readFileSync('campus.html','utf8');
for(const p of ['src/teacher_views.jsx','src/vista_docente.jsx','src/app.jsx']){
  B.transform(fs.readFileSync(p,'utf8'),{presets:['react'],plugins:['transform-block-scoping']});
}
assert(tv.includes("postTeacher('getAsistenciaBorradorF100'"));
assert(tv.includes("postTeacher('guardarAsistenciaBorradorF100'"));
assert(tv.includes('initialAttendance={draftAttendance} initialComments={draftComments} requireExplicitAttendance={true}'));
assert(tv.includes('draftSessionId'),'Session-specific draft');
assert(tv.includes('draftDirty'),'Unsaved changes visible');
assert(tv.includes('getAsistenciaBorradorF100'),'Loads saved draft');
assert(tv.includes('guardarAsistenciaBorradorF100'),'Explicit save');
assert(tv.includes('setDraftSaved(serialized)'),'Saved snapshot for dirty comparison');
assert(vd.includes('requireExplicitAttendance && (!f || (f.presente!==true && f.presente!==false))'),'No unmarked roster closes');
assert(vd.includes("status==='P'?true:status==='A'?false:(requireExplicitAttendance?null:true)"),'No default present for teachers');
assert(vd.includes('s.presente!==initial'),'Cancel checks genuinely changed attendance');
assert(vd.includes("background: presente === false ? '#B3261E'"),'Pending not highlighted absent');
for(const s of [app,bridge,shell])assert(s.includes('F101COMMENTS20261008'));
assert(!app.includes('src/vista_docente.jsx?v=F99SININA1'),'No stale closure UI');
const start=tv.indexOf('function LiveAttendancePanelF100(');
const end=tv.indexOf('function LessonDrawerF82(',start);
assert(start>=0&&end>start);
let hookIndex=0;const hooks=[];
const ctx={React:{createElement:(type,props,...children)=>({type,props:props||{},children}),
  useState:(initial)=>{const i=hookIndex++;if(!(i in hooks))hooks[i]=initial;
    return [hooks[i],next=>{hooks[i]=typeof next==='function'?next(hooks[i]):next;}];}}};
vm.createContext(ctx);
vm.runInContext(B.transform(tv.slice(start,end),{presets:['react']}).code,ctx);
const calls=[],roster=[
 {code:'17201',name:'Estudiante Primera'}, {code:'17202',name:'Estudiante Segundo'}, {code:'17203',name:'Estudiante Tercera'}
];
const props={roster,states:{17201:'P',17202:'A'},comments:{'17201':'Buen trabajo'},onComment:(code,value)=>calls.push([code,value]),
  counts:{P:1,A:1,pending:1},status:'ready',dirty:true,busy:false,notice:'',
  onMark:(code,status)=>calls.push([code,status]),onSave:()=>calls.push(['save']),onRetry:()=>calls.push(['retry'])};
const tree=ctx.LiveAttendancePanelF100(props);
const flatten=x=>Array.isArray(x)?x.flatMap(flatten):x&&typeof x==='object'?[x,...(x.children||[]).flatMap(flatten)]:[];
const all=flatten(tree), buttons=all.filter(x=>x.type==='button');
assert.equal(buttons.length,13,'3 mark controls plus comment per student + save');
const third=buttons.filter(b=>b.props['aria-label']?.includes('Estudiante Tercera'));
assert.equal(third.length,4);
assert.equal(third.filter(b=>b.props['aria-pressed']).length,1);
assert(third.find(b=>b.props.title==='Pendiente').props['aria-pressed']);
third.find(b=>b.props.title==='Presente').props.onClick();
buttons.find(b=>b.children?.[0]==='Guardar avance').props.onClick();
assert.deepEqual(calls,[['17203','P'],['save']]);
const noteButton=third.find(b=>b.props['aria-label']==='Agregar comentario de Estudiante Tercera');
assert(noteButton,'Independent comment button per student');
noteButton.props.onClick();hookIndex=0;
const expanded=ctx.LiveAttendancePanelF100(props);
const noteField=flatten(expanded).find(x=>x.type==='textarea'&&x.props.id==='f101-comment-17203');
assert(noteField,'Comment opens inline in the correct student row');
noteField.props.onChange({target:{value:'Avanzó con speaking'}});
assert.deepEqual(calls.at(-1),['17203','Avanzó con speaking']);
assert(flatten(tree).some(x=>x.props?.title==='Editar comentario'),'Saved comment indicated visually');
hookIndex=0;const readOnly=ctx.LiveAttendancePanelF100({roster,states:{},comments:{},counts:{P:0,A:0,pending:3},status:'loading',dirty:false,busy:false,notice:'',onMark:()=>{},onComment:()=>{},onSave:()=>{},onRetry:()=>{}});
assert.equal(flatten(readOnly).filter(x=>x.type==='button').length,1,'Only disabled save while loading');
assert(flatten(readOnly).find(x=>x.type==='button')?.props?.disabled);
assert(tv.includes('comentarios:commentsNow'),'Save request includes comments');
assert(vd.includes("typeof initialComments?.[e.code]==='string'?initialComments[e.code]:''"),'Closure prefilled with prior notes');
assert(vd.includes('includesPC && !f.pc.trim()'),'Progress Check requirements untouched');
console.log('QA_F101_COMMENTS_FRONTEND_PASS');
console.log('QA_LIVE_ATTENDANCE_FRONTEND_PASS');
console.log('PASS: P/A/Pendiente controls, explicit draft save, no default presence, closure validation, lazy paths, JSX parse');
