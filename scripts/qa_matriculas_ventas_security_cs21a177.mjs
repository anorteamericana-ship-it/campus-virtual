import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const ventasDrawer = read('src/ventas_drawer.jsx');
const ventasDash = read('src/ventas_dashboard.jsx');
const ventasParts = read('src/ventas_parts.jsx');
const matriculas = read('src/matriculas_admin.jsx');
const identityContract = JSON.parse(read('security/sec002_identity_legacy_contract_cs21a174.json'));
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

// CS21A173 · Ventas fail-closed + user-safe errors.
check(ventasDrawer.includes('function vxSafeUserError('), 'Ventas conserva filtro de errores seguros');
check((ventasDrawer.match(/setGrupos\(window\.DEMO_GRUPOS\)/g) || []).length === 1, 'DEMO_GRUPOS solo existe en preview explícito');
check(ventasDrawer.includes('if (!grupos.some(g => g.codigo === value)) onChange(\'\');'), 'grupo tentativo obsoleto se limpia');
check(ventasDash.includes("setErrorCarga('No pudimos cargar tu panel. Recargá la página e intentá nuevamente.')"), 'dashboard usa copy estable');

// CS21A174 · identidad histórica inventariada y sin recomendación de ACL pública.
check(identityContract.class === 'student_identity_and_title_images', 'contrato identifica clase de identidad histórica');
check(Array.isArray(identityContract.consumers) && identityContract.consumers.some(x => String(x.surface || '').includes('Ventas')), 'contrato incluye consumidor Ventas');
check(Array.isArray(identityContract.consumers) && identityContract.consumers.some(x => String(x.surface || '').includes('Matr')), 'contrato incluye consumidor Matrículas Admin');
check(ventasParts.includes('SEC-002') && matriculas.includes('SEC-002'), 'ambos consumidores marcan deuda legacy SEC-002');
check(!ventasParts.includes('fix de fondo —permisos públicos al subir'), 'Ventas no recomienda permisos públicos');
check(!matriculas.includes('fix de fondo —setSharing público al subir'), 'Admin no recomienda setSharing público');

// CS21A175 · no propagar proforma pública por WhatsApp.
check(!ventasDrawer.includes('Podés verla aquí: ${d.proforma_url'), 'Ventas no incrusta URL curso en WhatsApp');
check(!ventasDrawer.includes('Podés verla aquí: ${d.proforma_equipo_url'), 'Ventas no incrusta URL equipo en WhatsApp');
check(!matriculas.includes('Podés verla aquí: ${url}'), 'Admin no incrusta URL de proforma en WhatsApp');
check(ventasDrawer.includes('WhatsApp · adjuntar PDF') && matriculas.includes('WhatsApp · adjuntar PDF'), 'ambas superficies indican adjunto manual');

// CS21A176 · ficha general fail-closed, nota real preservada y errores seguros.
check(matriculas.includes('function matSafeUserError('), 'Matrículas conserva filtro de errores seguros');
check(matriculas.includes('const editableOf = () => false;'), 'ficha general permanece solo lectura');
check(!matriculas.includes('Guardar cambios</button>'), 'no vuelve botón de guardado ficticio');
check(!matriculas.includes('Próximamente: guardado completo de campos.'), 'no vuelve toast de falsa persistencia');
check(matriculas.includes("{saving ? 'Guardando…' : 'Guardar nota'}"), 'Guardar nota real permanece');
check(!matriculas.includes('setError(e.message)'), 'Matrículas no expone e.message directo');
check(!matriculas.includes("onToast((r && r.error) ||"), 'Matrículas no expone r.error directo');

// Límites honestos: legacy sigue inventariado; no declarar cierre backend/ACL.
check(identityContract.runtime_state === 'legacy_public_url_consumer_pending_private_backend', 'contrato mantiene runtime legacy explícito');
check(identityContract.no_acl_change === true, 'contrato mantiene ACL sin cambios');

if (failures.length) {
  console.error('QA MATRICULAS VENTAS SECURITY CS21A177 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA MATRICULAS VENTAS SECURITY CS21A177 PASS');
