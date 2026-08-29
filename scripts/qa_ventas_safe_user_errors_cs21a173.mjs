import fs from 'node:fs';

const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const dashboard = fs.readFileSync('src/ventas_dashboard.jsx', 'utf8');
const guard = fs.readFileSync('src/ventas_runtime_guard_cs21a152.js', 'utf8');
const failures = [];
const pass = msg => console.log(`PASS: ${msg}`);
const check = (ok, msg) => ok ? pass(msg) : failures.push(msg);

check(drawer.includes('function vxSafeUserError('), 'drawer define filtro de mensajes visible');
check(drawer.includes("console.warn('[Ventas] Detalle técnico oculto al usuario.'"), 'detalle técnico queda solo en consola');
check(drawer.includes('typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed'), 'filtro cubre errores técnicos del navegador/red');
check(drawer.includes("vxSafeUserError(r && (r.mensaje || r.error), msgFalla"), 'generación documental sanea mensaje backend');
check(drawer.includes("vxSafeUserError(r && (r.mensaje || r.error), 'No se pudo subir la matrícula firmada.'"), 'subida firmada sanea mensaje backend');
check(drawer.includes("vxSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir la matrícula firmada.'"), 'apertura firmada sanea códigos privados');
check(drawer.includes("vxSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir el documento.'"), 'documento extra sanea códigos privados');
check(drawer.includes("vxSafeUserError(r && r.error, 'No se pudo registrar el cobro. Intentá de nuevo.'"), 'cobro sanea error backend');
check(drawer.includes("vxSafeUserError(res && res.error, 'No se pudo reportar el pago. Intentá de nuevo.'"), 'reporte de pago sanea error backend');
check(drawer.includes("vxSafeUserError(d && d.error, 'No se pudo cargar el prospecto.'"), 'detalle prospecto sanea error backend');
check(drawer.includes("vxSafeUserError(r && (r.mensaje || r.error), 'No se pudo generar la proforma.'"), 'proforma sanea error backend');
check(!drawer.includes("msg:e?.message || 'No se pudo abrir el documento.'"), 'toast privado no expone e.message directo');
check(!drawer.includes("msg: (err && err.message) || 'Error de conexión.'"), 'proforma no expone err.message directo');

const demoFallbacks = drawer.match(/setGrupos\(window\.DEMO_GRUPOS\)/g) || [];
check(demoFallbacks.length === 1, 'DEMO_GRUPOS queda solo en rama demo explícita');
check(drawer.includes("catch (err) {\n        console.error('[Ventas CS21A173] Falló la carga real de grupos disponibles.', err);\n        if (!cancel) setGrupos([]);\n      }"), 'fallo real de grupos queda fail-closed sin demo');
check(drawer.includes("if (!grupos.some(g => g.codigo === value)) onChange('');"), 'grupo tentativo obsoleto se limpia si no existe en lista real');
check(drawer.includes("disabled={grupos.length === 0}"), 'selector se deshabilita si no hay grupos reales');
check(drawer.includes("grupos.length ? 'Seleccioná un grupo…' : 'No hay grupos disponibles'"), 'selector explica ausencia de grupos sin datos demo');

check(dashboard.includes("console.error('[Ventas CS21A173] No se pudo cargar el dashboard real.'"), 'dashboard conserva diagnóstico técnico en consola');
check(!dashboard.includes("throw new Error((data && data.error) || 'No se pudo cargar el panel.')"), 'dashboard no arroja data.error visible');
check(!dashboard.includes("setErrorCarga(e.message || 'No pudimos cargar tu panel desde el servidor.')"), 'dashboard no muestra e.message directo');
check(dashboard.includes("setErrorCarga('No pudimos cargar tu panel. Recargá la página e intentá nuevamente.')"), 'dashboard usa recuperación visible estable');

check(guard.includes('getGruposVentasSinFallbackDemo'), 'guard CS21A152 de grupos sigue presente');
check(guard.includes("return { ok:false, grupos:[], error:'No se pudieron cargar los grupos disponibles.' }"), 'guard CS21A152 mantiene respuesta fail-closed');

if (failures.length) {
  console.error('QA VENTAS SAFE USER ERRORS CS21A173 FAIL');
  failures.forEach(item => console.error('-', item));
  process.exit(1);
}
console.log('QA VENTAS SAFE USER ERRORS CS21A173 PASS');
