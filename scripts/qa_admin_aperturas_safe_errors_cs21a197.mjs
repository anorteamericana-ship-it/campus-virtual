import fs from 'node:fs';

const src = fs.readFileSync('src/aperturas_admin_cs21a20.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A197 FAIL: ${label}`); }

must(src.includes("function apSafeUserError(raw, fallback, context = '')"), 'Aperturas sanitizer exists');
must(src.includes("console.warn('[AdminAperturas] Detalle técnico oculto al operador.'"), 'technical detail stays console-only');

for (const expected of [
  "apSafeUserError(e?.message || String(e), 'No se pudo actualizar la apertura. Intentá de nuevo.', 'guardar_apertura')",
  "apSafeUserError(e?.message || String(e), 'No se pudieron cargar las aperturas. Intentá de nuevo.', 'cargar_aperturas')",
]) must(src.includes(expected), `safe UI boundary present: ${expected}`);

for (const bad of [
  "setError(e && e.message ? e.message : 'No se pudo actualizar la apertura.')",
  "setError(e && e.message ? e.message : 'No se pudieron cargar las aperturas.')",
]) must(!src.includes(bad), `raw exception no longer rendered: ${bad}`);

for (const keep of [
  "apPost('getAperturasAdmin')",
  "apPost('actualizarAperturaAdmin'",
  'codigo_grupo:apertura.codigo_grupo',
  'fechas:form.fechas',
  'precios:form.precios',
  'finally { setSaving(false); }',
  "setNotice((res && res.mensaje) || 'Apertura actualizada y calendario recalculado.')",
  'form.confirmado',
  'dateError',
]) must(src.includes(keep), `Aperturas behavior preserved: ${keep}`);

console.log('CS21A197 ADMIN APERTURAS SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('DATES_PRICES_RECALCULATION=PRESERVED');
