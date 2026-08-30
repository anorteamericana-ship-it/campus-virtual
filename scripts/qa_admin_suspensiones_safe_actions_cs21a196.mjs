import fs from 'node:fs';

const src = fs.readFileSync('src/panel_suspensiones.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A196 FAIL: ${label}`); }

must(src.includes("function psuSafeUserError(raw, fallback, context = '')"), 'suspensiones sanitizer exists');
must(src.includes("console.warn('[AdminSuspensiones] Detalle técnico oculto al operador.'"), 'technical details stay console-only');

for (const expected of [
  "psuSafeUserError(r?.error || r?.mensaje, 'No se pudo cargar la cola. Intentá de nuevo.', 'cargar_cola')",
  "psuSafeUserError(res?.error || res?.mensaje, 'No se pudo aprobar la solicitud. Intentá de nuevo.', 'aprobar_solicitud')",
  "psuSafeUserError(res?.error || res?.mensaje, 'No se pudo rechazar la solicitud. Intentá de nuevo.', 'rechazar_solicitud')",
  "console.error('[AdminSuspensiones] Error técnico aprobando solicitud.', e)",
  "console.error('[AdminSuspensiones] Error técnico rechazando solicitud.', e)",
  "finally { setResolviendo(null); }",
]) must(src.includes(expected), `safe action boundary present: ${expected}`);

for (const bad of [
  "setErr(r?.error || 'No se pudo cargar la cola.')",
  "setErr('Error de red: ' + e.message)",
  "showToast(res?.error || 'No se pudo aprobar la solicitud.'",
  "showToast(res?.error || 'No se pudo rechazar la solicitud.'",
]) must(!src.includes(bad), `raw error path removed: ${bad}`);

for (const keep of [
  'window.fetchGetSolicitudesSuspension(estado)',
  "accion: 'aprobar'",
  "accion: 'rechazar'",
  'resuelto_por: adminNombre',
  'nota_resolucion: nota ||',
  "setLista(prev => prev.filter(s => s.id !== sol.id))",
]) must(src.includes(keep), `business behavior preserved: ${keep}`);

const finallyCount = (src.match(/finally \{ setResolviendo\(null\); \}/g) || []).length;
must(finallyCount === 2, 'approve and reject both always release busy state');

console.log('CS21A196 ADMIN SUSPENSIONES SAFE ACTIONS: PASS');
console.log('BUSY_STATE_RELEASED_ON_EXCEPTION=YES');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
