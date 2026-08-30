import fs from 'node:fs';

const src = fs.readFileSync('src/panel_admin_supervision.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A194 FAIL: ${label}`); }

const safeCopy = 'No pudimos cargar la supervisión de docentes. Intentá de nuevo.';
must(src.includes(safeCopy), 'stable operator-facing load error exists');
must(src.includes("console.warn('[AdminSupervision] Respuesta de carga no disponible.'"), 'backend diagnostic stays console-only');
must(src.includes("console.error('[AdminSupervision] Error técnico cargando supervisión.'"), 'network/runtime diagnostic stays console-only');

for (const bad of [
  "setError(res?.error || 'No se pudo obtener la lista de docentes atrasados.')",
  ".catch(e => setError(e.message || 'Error de conexión.'))",
  'message={res?.error}',
  'message={e.message}',
]) must(!src.includes(bad), `raw technical error not rendered: ${bad}`);

for (const keep of [
  'fetchDocentesAtrasados()',
  'ModalCierreLeccion',
  'setData(res)',
  'onRetry={cargar}',
  "loading ? 'Actualizando…' : 'Actualizar'",
]) must(src.includes(keep), `supervision behavior preserved: ${keep}`);

console.log('CS21A194 ADMIN SUPERVISION SAFE ERRORS: PASS');
console.log('RAW_LOAD_ERRORS_VISIBLE=NO');
console.log('SUPERVISION_BEHAVIOR=PRESERVED');
