import fs from 'node:fs';

const ventas = fs.readFileSync('src/ventas_parts.jsx', 'utf8');
const admin = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/sec002_identity_legacy_contract_cs21a174.json', 'utf8'));
const failures = [];
const check = (ok, msg) => ok ? console.log('PASS: '+msg) : failures.push(msg);

check(contract.status === 'ventas_private_delivery_candidate_backend_pr4_required_before_publish', 'contract records C2-R14 candidate state');
check(contract.no_acl_change === true, 'historical identity/title ACL remains unchanged in this cut');
check(contract.no_consumer_switch_before_backend === false, 'backend dependency has moved from hypothetical to explicit PR dependency');
check(contract.backend_dependency?.repo === 'campus_backend' && contract.backend_dependency?.pr === 4, 'backend PR #4 dependency is explicit');
check(contract.backend_dependency?.operation === 'descargarDocumentoInscripcionPrivado', 'actual private endpoint contract named');
check(contract.backend_dependency?.must_be_in_prod_before_frontend === true, 'backend must reach PROD before frontend publish');

check(contract.consumers?.some(c => c.surface === 'ventas' && c.path === 'src/ventas_parts.jsx' && c.migration_state === 'candidate_private_delivery'), 'Ventas consumer mapped as private-delivery candidate');
check(contract.consumers?.some(c => c.surface === 'matriculas_admin' && c.path === 'src/matriculas_admin.jsx' && c.migration_state === 'legacy_consumer_unchanged_in_c2_r14'), 'Matr?culas Admin legacy consumer remains explicitly unchanged');
check(contract.target_delivery?.proposed_operation === 'descargarDocumentoInscripcionPrivado', 'target delivery matches implemented backend operation');
check(contract.target_delivery?.server_requirements?.includes('no public URL in response'), 'server response still forbids public URL');
check(contract.runtime_gate?.some(x => x.includes('backend PR #4') && x.includes('before frontend merge')), 'release ordering gate preserved');
check(contract.known_ui_bug?.status === 'resolved_in_c2_r14_candidate', 'legacy manual-upload mismatch is explicitly resolved in candidate');

check(/\['foto_ced_frente',[^\n]*'CEDULA_FRENTE'\]/.test(ventas), 'Ventas front identity slot is mapped to logical private type');
check(/\['foto_ced_dorso',[^\n]*'CEDULA_DORSO'\]/.test(ventas), 'Ventas back identity slot is mapped to logical private type');
check(/\['foto_titulo',[^\n]*'TITULO'\]/.test(ventas), 'Ventas title slot is mapped to logical private type');
check(ventas.includes('const canOpenPrivate = !!privateFileId || (!!src && !legacyInline);'), 'legacy stored URLs are routed to private delivery');
check(ventas.includes('onClick={() => onOpenPrivate(tipo, cap)}'), 'Ventas invokes private identity/title delivery');
check(!ventas.includes('Subir manualmente'), 'Ventas canonical identity/title manual upload is removed');

check(admin.includes("get('foto_ced_frente', 'FOTO_CED_FRENTE')"), 'Matr?culas Admin legacy identity consumer remains traceable');
check(admin.includes('function MatDocPhoto({ cap, src, onOpen })'), 'Matr?culas Admin legacy image consumer remains unchanged');

const forbiddenGuidance = [
  'permisos p?blicos al subir',
  'setSharing p?blico al subir',
  'fix de fondo ?permisos p?blicos',
  'fix de fondo ?setSharing p?blico',
];
for (const phrase of forbiddenGuidance) {
  check(!ventas.toLowerCase().includes(phrase.toLowerCase()), 'Ventas no recomienda ACL p?blica: '+phrase);
  check(!admin.toLowerCase().includes(phrase.toLowerCase()), 'Admin no recomienda ACL p?blica: '+phrase);
}

check(ventas.includes('SEC-002 CS21A174'), 'Ventas path retains SEC-002 provenance warning');
check(admin.includes('SEC-002 CS21A174'), 'Admin legacy path retains SEC-002 provenance warning');

if (failures.length) {
  console.error('QA SEC002 IDENTITY LEGACY CONTRACT CS21A174 FAIL');
  failures.forEach(x => console.error('- '+x));
  process.exit(1);
}
console.log('QA SEC002 IDENTITY LEGACY CONTRACT CS21A174 PASS');
