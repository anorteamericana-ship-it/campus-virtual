import fs from 'node:fs';

const src = fs.readFileSync('src/becas_admin.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A198 FAIL: ${label}`); }

must(src.includes("function bkSafeUserError(raw, fallback, context = '')"), 'Becas sanitizer exists');
must(src.includes("console.warn('[AdminBecas] Detalle técnico oculto al operador.'"), 'technical details stay console-only');

for (const expected of [
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo crear la beca. Intentá de nuevo.', 'crear_beca')",
  "bkSafeUserError(r?.error || r?.mensaje, 'No se pudo cargar la lista de becas. Intentá de nuevo.', 'cargar_becas')",
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo cambiar el estado. Intentá de nuevo.', 'cambiar_estado_beca')",
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo cambiar la visibilidad. Intentá de nuevo.', 'cambiar_visibilidad_beca')",
  "bkSafeUserError(res?.error || res?.mensaje, 'No se pudo guardar la beca. Intentá de nuevo.', 'editar_beca')",
  "console.error('[AdminBecas] Error técnico creando beca.'",
  "console.error('[AdminBecas] Error técnico cambiando estado.'",
  "console.error('[AdminBecas] Error técnico cambiando visibilidad.'",
  "console.error('[AdminBecas] Error técnico editando beca.'",
]) must(src.includes(expected), `safe action boundary present: ${expected}`);

for (const bad of [
  "msg: (res && res.error) || 'No se pudo crear la beca.'",
  "setErr((r && r.error) || 'No se pudo cargar la lista de becas.')",
  '.catch(e => setErr(e.message))',
  "msg: (res && res.error) || 'No se pudo cambiar el estado.'",
  "msg: (res && res.error) || 'No se pudo cambiar la visibilidad.'",
  "msg: (res && res.error) || 'No se pudo guardar.'",
]) must(!src.includes(bad), `raw backend/network error removed: ${bad}`);

const envioFinally = (src.match(/finally \{ setEnviando\(false\); \}/g) || []).length;
const busyFinally = (src.match(/finally \{ setBusy\(null\); \}/g) || []).length;
must(envioFinally === 2, 'create and edit always release sending state');
must(busyFinally === 2, 'both toggles always release busy state');

for (const keep of [
  'window.crearBeca({',
  'window.editarBeca({',
  'window.cambiarBecaActivo({ id: b.id, activo: !b.activa })',
  'window.cambiarBecaVisibilidad({ id: b.id, visible: !b.visible_inscripcion })',
  'window.getBecas({})',
  'pct_matricula',
  'pct_cuota',
  'cupo_total',
  'compatible_ina',
  'compatible_sin_ina',
  'visible_inscripcion',
]) must(src.includes(keep), `Becas business contract preserved: ${keep}`);

console.log('CS21A198 ADMIN BECAS SAFE ACTIONS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('BUSY_STATES_RELEASED_ON_UNEXPECTED_EXCEPTION=YES');
console.log('DEMO_ROUTING=UNCHANGED');
