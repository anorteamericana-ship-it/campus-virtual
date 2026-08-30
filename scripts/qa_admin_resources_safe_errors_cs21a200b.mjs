import fs from 'node:fs';

const src = fs.readFileSync('src/book_unit_starts_cs21a60.jsx', 'utf8');
const direct = fs.readFileSync('src/admin_resources_direct_cs21a74.js', 'utf8');

const must = (condition, message) => {
  if (!condition) {
    console.error(`CS21A200B FAIL: ${message}`);
    process.exit(1);
  }
};

must(src.includes('function bookResourcesSafeUserError(raw, fallback, context = \'\')'), 'falta frontera de error segura');
must(src.includes("bookResourcesSafeUserError(reason, 'No se pudo cargar el libro. Reintentá.', 'cargar_libro')"), 'carga de libro no saneada');
must(src.includes("bookResourcesSafeUserError(reason, 'No se pudo guardar el inicio de la unidad. Intentá de nuevo.', 'guardar_inicio_unidad')"), 'guardado de inicio no saneado');
must(src.includes("bookResourcesSafeUserError(reason, 'No se pudo actualizar el libro. Intentá de nuevo.', 'actualizar_libro')"), 'refresh de libro no saneado');

must(!src.includes("setError(String(reason?.message || reason || 'No se pudo cargar el libro.'))"), 'carga todavía muestra reason.message');
must(!src.includes("setMessage(''); setError(String(reason?.message || reason || 'No se pudo guardar el inicio de la unidad.'));"), 'guardado todavía muestra reason.message');
must(!src.includes("setMessage(''); setError(String(reason?.message || reason || 'No se pudo actualizar el libro desde Drive.'));"), 'refresh todavía muestra reason.message');

must(src.includes("post('teacherBooksOpenImageBook'"), 'se alteró endpoint de apertura de libro');
must(src.includes("post('superadminBooksSetUnitStart'"), 'se alteró endpoint de inicio de unidad');
must(src.includes("post('adminBooksRefreshOpenBook'"), 'se alteró endpoint de refresh');
must(src.includes("const canCalibrate = storedRole === 'superadmin';"), 'se alteró permiso de calibración');
must(src.includes("const canRefreshDrive = storedRole === 'admin' || storedRole === 'superadmin';"), 'se alteró permiso de refresh');
must(src.includes('window.__AN_BOOK_RESOURCES_COMPONENT__ = BookResourcesCS21A60;'), 'se perdió componente efectivo');
must(direct.includes('window.__AN_BOOK_RESOURCES_COMPONENT__'), 'ruta directa ya no usa componente efectivo');

console.log('CS21A200B ADMIN RESOURCES SAFE ERRORS: PASS');
console.log('EFFECTIVE_VIEWER=BookResourcesCS21A60');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('RESOURCE_ENDPOINTS_AND_ROLES=PRESERVED');
