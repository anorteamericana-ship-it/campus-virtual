import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx','utf8');

function must(ok,label){ if(!ok) throw new Error(`CS21A191 FAIL: ${label}`); }

must(src.includes('function adminStudentsSafeUserError'), 'shared admin students sanitizer present');
must(src.includes("'No pudimos cargar los grupos. Intentá de nuevo.'"), 'groups fallback present');
must(src.includes("'No pudimos cargar la radiografía del grupo. Intentá de nuevo.'"), 'radiography fallback present');
must(src.includes("'No se pudo sincronizar CONAPE. Intentá de nuevo.'"), 'CONAPE fallback present');
must(src.includes("'No se pudo cargar el expediente. Intentá de nuevo.'"), 'student detail fallback present');
must(src.includes("'No se pudo completar la operación. Intentá de nuevo.'"), 'generic action fallback present');

const forbidden = [
  "setError((d && d.error) || 'Respuesta no válida del servidor')",
  "setError('Error de conexión: ' + (e.message || e))",
  "setError('Error de conexión: ' + (e?.message || e))",
  "setError('Error de conexión: ' + e.message)",
  "alert(e?.message||String(e))",
  "alert(err?.message || String(err))",
  "error:'Error de conexión: '+(e?.message||e)",
  "error:'Error de conexión: ' + (e?.message || e)",
  "error:'Error de conexión: ' + (e.message || e)",
  "Detalle: ${e.message || e}",
];
for (const pattern of forbidden) must(!src.includes(pattern), `raw user-visible technical pattern removed: ${pattern}`);

must(src.includes("postAdminStudents('getAdminDashboard')"), 'dashboard endpoint preserved');
must(src.includes("postAdminStudents('getRadiografiaGrupo'"), 'radiography endpoint preserved');
must(src.includes("postAdminStudents('ejecutarCierreAcademicoNivel'"), 'academic close endpoint preserved');
must(src.includes("postAdminStudents('ejecutarCambioGrupo'"), 'group move endpoint preserved');
must(src.includes("postAdminStudents('sincronizarCONAPE'"), 'CONAPE endpoint preserved');

console.log('CS21A191 ADMIN STUDENTS SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('BUSINESS_ENDPOINTS=PRESERVED');
