import fs from 'node:fs';

const views = fs.readFileSync('src/teacher_views.jsx', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A187 FAIL: ${label}`);
}

must(views.includes('function teacherSessionSafeUserError'), 'shared safe-error helper preserved');
must(!views.includes('alert(e.message || String(e))'), 'raw spaced alert error removed');
must(!views.includes('alert(e.message||String(e))'), 'raw compact alert error removed');
must(!views.includes("setErrGlobal('Error de conexión: ' + e.message)"), 'raw connection error copy removed');
must(!views.includes("setErrGlobal(data.error || 'Error al registrar asistencia')"), 'raw attendance backend error removed');

must(views.includes("'No se pudo iniciar la clase. Intentá de nuevo.'"), 'safe class-start fallback present');
must(views.includes("'No se pudo cerrar la clase. Intentá de nuevo.'"), 'safe class-close fallback present');
must(views.includes("'No se pudieron guardar las calificaciones. Intentá de nuevo.'"), 'safe grade-save fallback present');
must(views.includes("'No se pudo registrar la asistencia. Intentá de nuevo.'"), 'safe attendance-save fallback present');

must(views.includes("teacherSessionSafeUserError(e?.message || String(e), 'No se pudo iniciar la clase. Intentá de nuevo.'"), 'class-start uses shared sanitizer');
must(views.includes("teacherSessionSafeUserError(e?.message || String(e), 'No se pudo cerrar la clase. Intentá de nuevo.'"), 'class-close uses shared sanitizer');
must(views.includes("teacherSessionSafeUserError(e?.message || String(e), 'No se pudieron guardar las calificaciones. Intentá de nuevo.'"), 'grade-save uses shared sanitizer');
must(views.includes("teacherSessionSafeUserError(data?.error, 'No se pudo registrar la asistencia. Intentá de nuevo.'"), 'attendance backend response uses shared sanitizer');
must(views.includes("teacherSessionSafeUserError(e?.message || String(e), 'No se pudo registrar la asistencia. Intentá de nuevo.'"), 'attendance exception uses shared sanitizer');

must(views.includes("if (!res.ok) throw new Error((data && (data.error || data.mensaje)) || `HTTP ${res.status}`);"), 'internal transport diagnostics preserved');

console.log('CS21A187 TEACHER ACTION SAFE ERRORS: PASS');
console.log('CLASS_START=SANITIZED');
console.log('CLASS_CLOSE=SANITIZED');
console.log('DRAWER_CLASS_START=SANITIZED');
console.log('GRADE_SAVE=SANITIZED');
console.log('ATTENDANCE_BACKEND_RESPONSE=SANITIZED');
console.log('ATTENDANCE_EXCEPTION=SANITIZED');
