import fs from 'node:fs';

const src=fs.readFileSync('src/admin_students.jsx','utf8');
function must(ok,label){if(!ok)throw new Error(`CS21A192 FAIL: ${label}`);}

const required=[
  'Estatus guardado en el Campus, pero CONAPE quedó pendiente de actualización',
  'La actualización de CONAPE quedó pendiente. Podés reintentar ahora o sincronizar después.',
  'No se pudo conectar con la bitácora oficial. El seguimiento queda temporalmente en este navegador.',
  'Guardado temporalmente en este navegador. La bitácora oficial no está disponible.',
  'Este comentario es interno y queda asociado al expediente del estudiante.',
  'Preparando expediente académico, grupo, intentos y pagos…',
  'El sistema comprueba que el número de certificado corresponde exactamente al nivel seleccionado.',
];
for(const text of required)must(src.includes(text),`required user copy present: ${text}`);

const forbidden=[
  'Estatus guardado en APOLLO',
  'Las hojas 4-7 de CONAPE',
  'hojas 4, 5, 6 y 7',
  'Apps Script F24',
  'Backend F24',
  'hoja SEGUIMIENTO_ESTUDIANTES',
  'DATOS · COMENTARIO_ADMIN',
  'Apps Script y GitHub estén en la misma versión',
  'publicado en las hojas CONAPE',
  'nuevo plan en las hojas CONAPE',
  'REG_CERTIFICADOS NO generan',
  'mismo REG_CERTIFICADOS',
  'No se cambiará ESTATUS ni REG_CERTIFICADOS',
  'actualiza ESTATUS',
  'nota vigente registrada en ESTATUS',
  'Cruzando DATOS, ESTATUS, GRUPOS',
  'Control F98.3-C:',
];
for(const text of forbidden)must(!src.includes(text),`technical copy removed: ${text}`);

must(src.includes("postAdminStudents('sincronizarCONAPE'"),'CONAPE sync endpoint preserved');
must(src.includes("postAdminStudents('generarCertificadosNivel'"),'certificate endpoint preserved');
must(src.includes("postAdminStudents('guardarComentarioAdminEstudiante'"),'admin comment endpoint preserved');
must(src.includes('function adminStudentsSafeUserError'),'CS21A191 safe-error boundary preserved');

console.log('CS21A192 ADMIN STUDENTS USER COPY: PASS');
console.log('INTERNAL_IMPLEMENTATION_COPY_VISIBLE=NO_FOR_GUARDED_STRINGS');
console.log('BUSINESS_ACTIONS=PRESERVED');
