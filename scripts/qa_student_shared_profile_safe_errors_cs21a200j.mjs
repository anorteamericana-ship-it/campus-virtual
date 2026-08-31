import fs from 'node:fs';

const primitives = fs.readFileSync('src/primitives.jsx', 'utf8');
const modules = fs.readFileSync('src/student_modules.jsx', 'utf8');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(primitives.includes('function studentSharedProfileSafeUserError('), 'shared student safe-error helper missing');
must(primitives.includes("console.warn('[StudentSharedProfile] Detalle técnico oculto al estudiante.'"), 'shared student diagnostic logging missing');
must(!primitives.includes("setError((d && d.error) || 'No se pudo cargar la información del estudiante');"), 'raw getEstudiante error still visible');
must(primitives.includes("setError(studentSharedProfileSafeUserError(d && d.error, 'No pudimos cargar tu información. Intentá de nuevo.', 'get_estudiante'));"), 'safe getEstudiante boundary missing');

// Transport/cache/reload behavior must remain unchanged.
must(primitives.includes("postPrimitives('getEstudiante', { codigo })"), 'getEstudiante endpoint changed');
must(primitives.includes("const STUDENT_PROFILE_CACHE_TTL_MS = 90 * 1000;"), 'student profile cache TTL changed');
must(primitives.includes('studentProfileCacheGet(codigo)'), 'student profile cache read removed');
must(primitives.includes('studentProfileCachePut(codigo, d);'), 'student profile cache write removed');
must(primitives.includes("sessionStorage.removeItem(studentProfileCacheKey(codigo))"), 'student profile reload cache clear removed');
must(primitives.includes(".catch(() => { if (!cancelled) setError('Error de conexión'); })"), 'stable network error copy changed');
must(primitives.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"), 'session token body behavior changed');

// Current shared-consumer wiring: views call useEstudianteDeSesion(), which bridges to useEstudiante(codigo).
must(modules.includes('function useEstudianteDeSesion()'), 'shared session wrapper missing');
must(modules.includes('const r = useEstudiante(codigo);'), 'shared useEstudiante bridge missing');
const consumerNames = ['NotasView','PagosView','PerfilView'];
let consumerCount = 0;
for (const name of consumerNames) {
  const start = modules.indexOf(`function ${name}`);
  must(start >= 0, `${name} consumer missing`);
  const next = modules.indexOf('\nfunction ', start + 1);
  const body = modules.slice(start, next < 0 ? modules.length : next);
  must(body.includes('useEstudianteDeSesion()'), `${name} no longer uses shared session hook`);
  consumerCount += 1;
}

console.log('CS21A200J STUDENT SHARED PROFILE SAFE ERRORS: PASS');
console.log('RAW_GETESTUDIANTE_ERROR_VISIBLE=NO');
console.log(`SHARED_CONSUMERS=${consumerCount}`);
console.log('CACHE_RELOAD_AND_TOKEN=PRESERVED');
