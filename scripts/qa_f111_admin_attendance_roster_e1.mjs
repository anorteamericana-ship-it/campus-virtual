// F111 P0: contrato estático de UI de lista independiente de asistencia.
// No lee estudiantes reales ni ejecuta endpoints; JSX se parsea con Babel.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {parse}=require('@babel/parser');
const src=fs.readFileSync('src/admin_attendance_roster.jsx','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const html=fs.readFileSync('campus.html','utf8');
const audit=fs.readFileSync('src/auditoria_academica.jsx','utf8');
parse(src,{sourceType:'script',plugins:['jsx','optionalChaining','nullishCoalescingOperator']});
const one=(source,match,label)=>{
 const n=source.split(match).length-1;assert.equal(n,1,label+' debe aparecer exactamente una vez');
};
one(app,'asistencia_grupos: <LazyRoute title="Asistencia de grupos" component="AttendanceGroupsSuperadminView" files={F96_LAZY.asistencia_grupos} />','Ruta lista docente');
one(app,"asistencia_grupos: ['src/admin_attendance_roster.jsx?v=F111ATTROSTER20261021']",'Lazy asset');
one(app,'auditoria_academica: <LazyRoute title="Auditoría Académica" component="AuditoriaAcademicaView" files={F96_LAZY.auditoria} />','Auditoría sin sustituir');
one(html,'src/app.jsx?v=F111ATTROSTER20261021','Cache-bust del router');
one(src,"Object.assign(window,{AttendanceGroupsSuperadminView});",'Export lazy global');
assert(!src.includes('<AuditoriaAcademicaView'),'No volver a duplicar la auditoría como lista');
assert(audit.includes('function AuditoriaAcademicaView('),'Auditoría histórica conservada');
assert(src.includes('Matriz de asistencia · lecciones 1–32'),'Matriz docente de 32 lecciones');
assert(src.includes('Comentario del docente / corrección'),'Comentarios en fila');
assert(src.includes('if(!isSuper||readonly||saving||!activeLesson)return'),'Solo superadmin edita');
assert(src.includes("const readonly=!isSuper||!activeLesson||(!attIsClosed(activeLesson)&&!editableByEvidence)"),'Solo editar lección cerrada o fecha pasada con asistencia oficial');
assert(src.includes('lessonEvidence&&fechaPast'),'No dar acceso a clase futura o sin asistencia oficial');
assert(src.includes('changes.missing.length&&reason.trim().length<12'),'Justificación obligatoria de altas');
assert(src.includes("No se puede crear una presencia retroactiva sin registro previo"),'No fabricar presencia');
assert(src.includes("window.fetchEditarAsistenciaNotaCerrada({"),'Motor backend real de asistencia');
assert(src.includes("window.fetchEditarRetroPCCerrada({"),'Motor backend real de comentarios');
assert(src.includes("attSaved!==changes.att.length"),'No confundir ok con cero cambios');
assert(src.includes("const after=await reload(true)"),'Readback después del guardado');
assert(src.includes("mismatches.length||noteMismatch.length"),'Verificar asistencia y comentario');
assert(src.includes("return c.presente===true||c.presente===false;"),'Mostrar clases aun si el calendario dice pendiente');
console.log('F111_ADMIN_ATTENDANCE_LIST_E1_PASS: distinct route, JSX valid, attendance+comments matrix, editor, guard+readback');
