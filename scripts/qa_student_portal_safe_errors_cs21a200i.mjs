import fs from 'node:fs';

const path = 'src/student_portal.jsx';
const src = fs.readFileSync(path, 'utf8');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(src.includes('function studentPortalSafeUserError('), 'student portal safe-error helper missing');
must(src.includes("console.warn('[StudentPortal] Detalle técnico oculto al estudiante.'"), 'student portal console diagnostic missing');
must(!src.includes("error:d?.error || base?.error || 'No se pudo cargar el portal.'"), 'raw portal/base error still visible');
must(src.includes("studentPortalSafeUserError(d?.error || base?.error, 'No pudimos cargar tu portal. Intentá de nuevo.', 'portal_y_fallback')"), 'safe portal fallback missing');

// Existing fallback behavior and user/session copy must remain intact.
must(src.includes("postStudentPortal('getPortalEstudianteCompleto', { codigo })"), 'primary portal endpoint changed');
must(src.includes("postStudentPortal('getEstudiante', { codigo }).catch(() => null)"), 'honest getEstudiante fallback changed');
must(src.includes("modo:'fallback_frontend'"), 'fallback frontend marker removed');
must(src.includes("error:'Sin código de estudiante en sesión.'"), 'session-specific copy changed unexpectedly');
must(src.includes("error:'Error de conexión con el servidor.'"), 'network fallback changed unexpectedly');
must(src.includes('<ErrorState message={error} onRetry={reload} />'), 'portal retry UI changed unexpectedly');
must(src.includes('deriveStudentAccess'), 'student access derivation removed');

console.log('CS21A200I STUDENT PORTAL SAFE ERRORS: PASS');
console.log('RAW_BACKEND_ERRORS_VISIBLE=NO_FOR_PORTAL_FALLBACK');
console.log('HONEST_FALLBACK=PRESERVED');
console.log('PORTAL_ENDPOINTS=PRESERVED');
