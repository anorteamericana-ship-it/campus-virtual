import fs from 'node:fs';

const ventas = fs.readFileSync('src/ventas_parts.jsx', 'utf8');
const admin = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_identity_legacy_contract_cs21a174.json', 'utf8'));
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

check(contract.status === 'legacy_consumers_mapped_backend_private_endpoint_pending', 'contract status is explicit and non-runtime');
check(contract.no_acl_change === true, 'contract forbids ACL change in this cut');
check(contract.no_consumer_switch_before_backend === true, 'consumer switch is blocked before backend endpoint');
check(contract.consumers?.some(c => c.surface === 'ventas' && c.path === 'src/ventas_parts.jsx'), 'Ventas consumer mapped');
check(contract.consumers?.some(c => c.surface === 'matriculas_admin' && c.path === 'src/matriculas_admin.jsx'), 'Matrículas Admin consumer mapped');
check(contract.target_delivery?.proposed_operation === 'descargarDocumentoIdentidadPrivado', 'private endpoint contract named');
check(contract.target_delivery?.server_requirements?.includes('no public URL in response'), 'target server response forbids public URL');
check(contract.runtime_gate?.includes('fresh current Apps Script QA snapshot per Issue #111'), 'Issue #111 fresh snapshot gate preserved');
check(contract.known_ui_bug?.description?.includes('subirDocumentoExtra'), 'legacy manual-upload mismatch documented');

check(ventas.includes("['foto_ced_frente', 'Cédula · frente']"), 'Ventas still has mapped legacy identity consumer');
check(ventas.includes('function vxDriveCandidates(url)'), 'Ventas current public-candidate legacy path remains traceable');
check(admin.includes("get('foto_ced_frente', 'FOTO_CED_FRENTE')"), 'Admin still has mapped legacy identity consumer');
check(admin.includes('function MatDocPhoto({ cap, src, onOpen })'), 'Admin current legacy image consumer remains traceable');

const forbiddenGuidance = [
  'permisos públicos al subir',
  'setSharing público al subir',
  'fix de fondo —permisos públicos',
  'fix de fondo —setSharing público',
];
for (const phrase of forbiddenGuidance) {
  check(!ventas.toLowerCase().includes(phrase.toLowerCase()), `Ventas no recomienda ACL pública: ${phrase}`);
  check(!admin.toLowerCase().includes(phrase.toLowerCase()), `Admin no recomienda ACL pública: ${phrase}`);
}

check(ventas.includes('SEC-002 CS21A174'), 'Ventas legacy path carries SEC-002 migration warning');
check(admin.includes('SEC-002 CS21A174'), 'Admin legacy path carries SEC-002 migration warning');

if (failures.length) {
  console.error('QA SEC002 IDENTITY LEGACY CONTRACT CS21A174 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA SEC002 IDENTITY LEGACY CONTRACT CS21A174 PASS');
