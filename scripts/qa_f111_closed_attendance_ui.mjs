// Focused regression: editable attendance + comments + incomplete historical rosters.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const tv=fs.readFileSync('src/teacher_views.jsx','utf8'),
 app=fs.readFileSync('src/app.jsx','utf8'),html=fs.readFileSync('campus.html','utf8');
const a=tv.indexOf('function ClosedAttendanceEditorF111('),
 b=tv.indexOf('function LessonDrawerF82(',a);
assert.ok(a>0&&b>a);
const edit=tv.slice(a,b),drawer=tv.slice(b,tv.indexOf('function NotaDetalleDrawerF79(',b));
let n=0;
function check(ok,name){assert.ok(ok,name);console.log('PASS '+(++n)+' '+name);}
check(edit.includes("postTeacher('docenteGetAsistenciaCerradaF111'")&&
 edit.includes("postTeacher('docenteEditarAsistenciaCerradaF111'"),
 'isolated secure attendance list endpoints');
check(edit.includes('r.clase_cerrada!==true')&&edit.includes('r.cod_grupo!==group')&&
 edit.includes('r.nivel!==level')&&edit.includes('r.riel!==riel')&&
 edit.includes('Number(r.leccion)!==number'),
 'bound to selected closed lesson group, level and rail');
check(edit.includes('x.sugerencia_presente')&&edit.includes('x.presente')&&
 edit.includes("comentario:x.comentario||''")&&!edit.includes('comentario:x.comentario||x.sugerencia_comentario'),
 'teacher attendance marks can be recovered but draft comments are not auto-published');
check(edit.includes("comentario_antes:x.comentario")&&edit.includes('comentario:form[x.code].comentario')&&
 edit.includes('presente:form[x.code].presente'),
 'sends attendance and comments with optimistic concurrency data');
check(edit.includes('r.comentarios_editados')&&edit.includes('r.asistencias_editadas')&&
 edit.includes("(x.comentario||'')!==ch.comentario")&&
 edit.includes('onSaved&&onSaved(fresh,changes.length)'),
 'save and re-read verify every changed field');
check(edit.includes('aria-label={\'Comentario de \'+')&&edit.includes('maxLength={800}')&&
 edit.includes('Presente')&&edit.includes('Ausente'),
 'simple P/A and individual comment controls');
check(!/registrarAsistencia|editarAsistenciaNotaCerrada|docenteCerrarClaseConAsistencia|registrarNota/.test(edit),
 'does not call grade, close-class or legacy admin endpoints');
check(!edit.includes('Motivo de corrección')&&!edit.includes('Corregí únicamente')&&
 !edit.includes('MY GROUPS · ASISTENCIA OFICIAL'),
 'teacher sees no internal warning or development terminology');
check(drawer.includes('data-f111-edit-closed-attendance="true"')&&
 drawer.includes('closedAttendanceEditing&&<ClosedAttendanceEditorF111')&&
 drawer.includes('Editar lista'), 'one clear button beside closed lesson');
check(drawer.includes("canOperateRail&&sessionCheck==='ok'")&&
 drawer.includes('(closed||sesionCerrada)'), 'closed-only teacher rail');
check(drawer.includes('closedAttendanceOverride||asistenciaDetalle?')&&
 drawer.includes("setClosedAttendanceNotice('Cambios guardados.');"),
 'refreshes teacher view and uses short success text');
check(app.split('&attedit=F111ATTEDITV320261113').length===3,
 'both lazy routes invalidate frontend cache');
check(html.split('&attendance=F111ATTEDITV320261113').length===2,
 'campus document invalidates app cache');
check(edit.includes('data-f111-pending-save=')&&
 edit.includes("pendingSave?'#FFF4D5'")&&edit.includes('POR GUARDAR')&&
 edit.includes('SIN GUARDAR'),
 'pending and modified student rows use visible light yellow cards');
check(edit.includes('const missingComments=rows.filter(')&&
 edit.includes("!String(form[x.code]?.comentario||'').trim()")&&
 edit.includes('if(missingComments.length){')&&
 edit.includes('setValidationAttempted(true)'),
 'missing comments stop save before network request');
check(edit.includes('aria-invalid={validationAttempted&&commentEmpty}')&&
 edit.includes('required')&&edit.includes('Falta el comentario.')&&
 edit.includes("validationAttempted&&commentEmpty?'#C74439'"),
 'blank comments are visibly marked and cannot be overlooked');
console.log('F111_ATT_EDIT_V3_UI '+n+'/'+n+' PASS');
