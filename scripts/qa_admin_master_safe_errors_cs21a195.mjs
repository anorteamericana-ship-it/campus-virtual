import fs from 'node:fs';

const src = fs.readFileSync('src/admin_master_dashboard.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A195 FAIL: ${label}`); }

must(src.includes('function masterSafeUserError(raw, fallback, context = \'\')'), 'shared Panel Maestro sanitizer exists');
must(src.includes("console.warn('[AdminMaster] Detalle técnico oculto al operador.'"), 'technical detail remains console-only');

for (const expected of [
  "masterSafeUserError(e?.message || String(e), 'No se pudo actualizar CONAPE. Intentá de nuevo.', 'actualizar_conape')",
  "masterSafeUserError(error?.message || String(error), 'No se pudo actualizar CONAPE. Intentá de nuevo.', 'auto_sync_conape')",
  "masterSafeUserError(error?.message || String(error), 'No pudimos cargar el Panel Maestro. Intentá de nuevo.', 'cargar_panel')",
  "masterSafeUserError(e?.message || String(e), 'No se pudo cargar el seguimiento. Intentá de nuevo.', 'cargar_seguimiento')",
  "masterSafeUserError(e?.message || String(e), 'No se pudo consultar el historial de publicación. Intentá de nuevo.', 'historial_publicacion')",
  "masterSafeUserError(e?.message || String(e), 'No se pudo completar el control de publicación. Intentá de nuevo.', 'control_publicacion')",
  "masterSafeUserError(e?.message || String(e), 'No se pudo registrar la versión estable. Intentá de nuevo.', 'registrar_version_estable')",
  "masterSafeUserError(syncMeta.error, 'CONAPE no pudo actualizarse. Intentá de nuevo.', 'estado_conape')",
]) must(src.includes(expected), `sanitized UI boundary present: ${expected}`);

for (const bad of [
  'catch(e){setMsg(e.message||String(e));}',
  'error:error?.message||String(error),movimientos_registrados:0',
  'error:error?.message||String(error),data:current.data',
  'error:e.message||String(e),data:s.data',
  'error:e.message||String(e),data:null',
  '...s,error:e.message||String(e)',
  'title={syncFailed?syncMeta.error:',
]) must(!src.includes(bad), `raw technical error not exposed: ${bad}`);

for (const keep of [
  "masterAction('actualizarPanelConapeAhora')",
  "masterPost({refresh:refresh||syncConape})",
  "masterAction('getSuperAdminSeguimientoResumen'",
  "masterAction('ejecutarSmokeTestSeguimiento'",
  "masterAction('confirmarVersionEstableSeguimiento'",
  'MasterProductionSmoke',
  'MasterConapeMovementsTable',
]) must(src.includes(keep), `business/control behavior preserved: ${keep}`);

console.log('CS21A195 ADMIN MASTER SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('MASTER_ACTIONS=PRESERVED');
