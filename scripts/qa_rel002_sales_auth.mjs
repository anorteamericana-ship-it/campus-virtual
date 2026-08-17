import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const dashboard = fs.readFileSync('src/ventas_dashboard.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL REL-002: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

const postStart = data.indexOf('async function postVentas(');
const postEnd = data.indexOf('// FIX-VENTAS-DATA-POST-001:', postStart);
const postBlock = postStart >= 0 && postEnd > postStart ? data.slice(postStart, postEnd) : '';

check(postBlock.includes('async function postVentas(payload = {})'), 'postVentas accepts a safe default payload');
check(postBlock.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"), 'postVentas obtains the current Campus session token');
check(postBlock.includes('body: JSON.stringify({ ...payload, token })'), 'postVentas injects the server-bound token after payload fields');
check(!postBlock.includes('body: JSON.stringify(payload)'), 'postVentas no longer serializes an unauthenticated payload');

const protectedWrappers = [
  'agregarNotaProspecto',
  'subirDocumentoExtra',
  'marcarEtapaProspecto',
  'cobrarMatriculaProspecto',
  'activarEstudiante',
  'aprobarBecaProspecto',
];
for (const name of protectedWrappers) {
  check(data.includes(name), `${name} remains present after auth transport fix`);
}

check(dashboard.includes('<window.MiMatriculasMes asesor={scopeAsesor} />'), 'monthly enrollments use the selected/real advisor scope');
check(!dashboard.includes('<window.MiMatriculasMes asesor={usuario.nombre} />'), 'monthly enrollments do not silently fall back to supervisor identity');
check(dashboard.includes('asesor={scopeAsesor}\n          usuario={usuario}'), 'drawer receives the same advisor scope as the dashboard');
check(!dashboard.includes('asesor={usuario.nombre}\n          usuario={usuario}'), 'drawer does not silently fall back to supervisor identity');

check(dashboard.includes("const VX_ROLES_PERMITIDOS = ['superadmin', 'admin', 'ventas'];"), 'Ventas page access roles remain unchanged');
check(!drawer.includes("setModal('activar')"), 'current drawer has no accessible legacy activar trigger');
check(!drawer.includes('setModal("activar")'), 'current drawer has no double-quoted legacy activar trigger');
check(drawer.includes("modal === 'activar' && <ActivarModal"), 'legacy activation compatibility code is documented by the guard, not silently deleted');

if (process.exitCode) process.exit(process.exitCode);
console.log('REL-002 static QA PASS');
