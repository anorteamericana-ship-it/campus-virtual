// Only the new My Groups closed-attendance editor; no legacy exam suite reruns.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const tv=read('src/teacher_views.jsx'),app=read('src/app.jsx'),html=read('campus.html');
const a=tv.indexOf('function ClosedAttendanceEditorF111('),b=tv.indexOf('function LessonDrawerF82(',a);
assert.ok(a>0&&b>a,'editor is isolated before My Groups lesson drawer');
const edit=tv.slice(a,b),drawer=tv.slice(b,tv.indexOf('function NotaDetalleDrawerF79(',b));
let n=0;function check(ok,label){assert.ok(ok,label);console.log('PASS '+(++n)+' '+label);}
check(edit.includes("postTeacher('docenteGetAsistenciaCerradaF111'")&&
 edit.includes("postTeacher('docenteEditarAsistenciaCerradaF111'"),
 'explicit read/write endpoints for one closed lesson');
check(edit.includes('r.clase_cerrada!==true')&&edit.includes('r.cod_grupo!==group')&&
 edit.includes('r.nivel!==level')&&edit.includes('r.riel!==riel')&&
 edit.includes('Number(r.leccion)!==number'),'contextual response cannot cross group/level/rail/lesson');
check(edit.includes('!x||x.presente!==change.presente||x.editable!==true')&&
 edit.includes('No reintentar')&&edit.includes("onSaved&&onSaved(fresh,changes.length)"),
 'save acknowledgment plus mandatory readback before UI success');
check(edit.includes("change.presente")||edit.includes("presente:form[x.code]"),
 'sends only selected attendance marks');
check(!/registrarAsistencia|editarAsistenciaNotaCerrada|docenteCerrarClaseConAsistencia|guardarAsistenciaBorradorF100|registrarNota/.test(edit),
 'editor cannot call course closing, legacy grade, or admin attendance APIs');
check(drawer.includes('data-f111-edit-closed-attendance="true"')&&
 drawer.includes('data-f111-closed-attendance-editor')===false&&
 drawer.includes('closedAttendanceEditing&&<ClosedAttendanceEditorF111'),
 'exactly one new button and one isolated modal in lesson drawer');
check(drawer.includes("canOperateRail&&sessionCheck==='ok'")&&
 drawer.includes("(closed||sesionCerrada)"),
 'button only rendered for a closed class with confirmed teacher rail');
check(drawer.includes('closedAttendanceOverride||asistenciaDetalle?'),
 'readback refreshes visible existing attendance rows');
check(app.split('&attedit=F111ATTEDIT20261112').length===3,
 'both lesson route loaders invalidate only teacher_views cache');
check(html.split('&attendance=F111ATTEDIT20261112').length===2,
 'Campus document invalidates app source cache exactly once');
console.log('F111_ATT_EDIT_FRONTEND_TARGETED '+n+'/'+n+' PASS (static integration; not authenticated LIVE E2)');
