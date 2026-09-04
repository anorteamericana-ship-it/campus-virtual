import fs from 'node:fs';

const data = fs.readFileSync('src/ventas_data.jsx', 'utf8');
const dashboard = fs.readFileSync('src/ventas_dashboard.jsx', 'utf8');
const drawer = fs.readFileSync('src/ventas_drawer.jsx', 'utf8');
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
  else console.log(`PASS: ${message}`);
}

const postStart = data.indexOf('async function postVentas(');
const postEnd = data.indexOf('// FIX-VENTAS-DATA-POST-001:', postStart);
const postBlock = postStart >= 0 && postEnd > postStart ? data.slice(postStart, postEnd) : '';

check(postBlock.includes('async function postVentas(payload = {})'), 'postVentas acepta payload seguro por defecto');
check(postBlock.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"), 'postVentas obtiene token de la sesión actual');
check(postBlock.includes('body: JSON.stringify({ ...payload, token })'), 'postVentas inyecta token después del payload');
check(!postBlock.includes('body: JSON.stringify(payload)'), 'postVentas no serializa payload sin autenticación');

for (const name of [
  'agregarNotaProspecto',
  'subirDocumentoExtra',
  'marcarEtapaProspecto',
  'cobrarMatriculaProspecto',
  'activarEstudiante',
  'aprobarBecaProspecto',
]) check(data.includes(name), `${name} permanece presente tras el cambio de transporte`);

check(dashboard.includes('<window.MiMatriculasMes asesor={scopeAsesor} />'), 'MiMatriculasMes usa scopeAsesor');
check(!dashboard.includes('<window.MiMatriculasMes asesor={usuario.nombre} />'), 'MiMatriculasMes no usa identidad de supervisor');
check(dashboard.includes('asesor={scopeAsesor}\n          usuario={usuario}'), 'ProspectoDrawer recibe scopeAsesor');
check(!dashboard.includes('asesor={usuario.nombre}\n          usuario={usuario}'), 'ProspectoDrawer no usa identidad de supervisor');

check(dashboard.includes("const VX_ROLES_PERMITIDOS = ['superadmin', 'admin', 'ventas'];"), 'roles de acceso Ventas no se amplían');
check(!drawer.includes("setModal('activar')"), 'drawer no reintroduce trigger directo legacy activar');
check(!drawer.includes('setModal("activar")'), 'drawer no reintroduce trigger doble-comilla legacy activar');
check(drawer.includes("modal === 'activar' && <ActivarModal"), 'compatibilidad legacy sigue explícita y vigilada');

if (failures.length) {
  console.error('QA REL-002 CS21A155 FAIL');
  failures.forEach(f => console.error('-', f));
  process.exit(1);
}
console.log('QA REL-002 CS21A155 PASS');
