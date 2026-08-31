import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_legacy_certificate_tree_contract_cs21a194.json', 'utf8'));
const admin = fs.readFileSync('src/admin_students.jsx', 'utf8');
const student = fs.readFileSync('src/student_modules.jsx', 'utf8');
const rebasePath = 'security/sec002_admin_certificate_private_rebase_cs21a197r.json';
const migrated = fs.existsSync(rebasePath);
const rebase = migrated ? JSON.parse(fs.readFileSync(rebasePath, 'utf8')) : null;

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A194R guard: ${msg}`);
}

must(contract.severity === 'P1', 'legacy certificate tree remains P1');
must(contract.state === 'OPEN_BLOCKER', 'legacy ACL blocker remains open');
must(contract.rebased_from === 'PR_186_CS21A194', 'parallel audited evidence remains traceable');
must(contract.drive_evidence.legacy_root_permission === 'anyone_reader_link_only', 'legacy root ACL evidence remains explicit');
must(contract.drive_evidence.group_folders_sampled >= 4, 'at least four group folders remain sampled');
must(contract.drive_evidence.group_folders_anyone_reader === contract.drive_evidence.group_folders_sampled, 'all sampled group folders are anyone-reader');
must(contract.drive_evidence.real_certificate_samples_anyone_reader === contract.drive_evidence.real_certificate_samples_checked, 'all recorded certificate samples are anyone-reader');
must(contract.drive_evidence.acl_change_in_this_cut === 'NONE', 'historical evidence cut did not change ACL');
const be = contract.backend_evidence || {};
must(be.portable_private_operation === 'descargarMiCertificadoPrivado', 'portable private operation remains explicit');
must(be.portable_private_delta_status === 'DEFINED_AND_VERIFIED_HISTORICALLY_NOT_INSTALLED_IN_CURRENT_CANONICAL_RUNTIME', 'runtime separation remains explicit');
must(be.staff_private_endpoint_runtime === 'PENDING_ISSUE_111', 'staff runtime remains pending');
must(contract.release_gate === 'BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2', 'release remains blocked');
must(admin.includes("function abrirPdfBackend(payload, fallbackUrl = '', options = {})"), 'current CS21A193 private PDF helper remains present');
must(admin.includes('const allowUrl = options?.allowUrl !== false;'), 'CS21A193 fail-closed URL option remains present');
must(student.includes('descargarMiCertificadoPrivado'), 'student private certificate source candidate remains present');

if (migrated) {
  must(rebase.state === 'SOURCE_PRIVATE_MIGRATED_RUNTIME_AND_ACL_OPEN', 'new rebase must preserve open runtime/ACL state');
  must(rebase.frontend.direct_certificate_drive_url_consumers === 0, 'new rebase declares zero direct admin URL consumers');
  must(rebase.backend.current_modular_QA_runtime === 'PENDING_ISSUE_111', 'new rebase cannot claim runtime');
  must((admin.match(/window\.open\(data\.url/g) || []).length === 0, 'direct admin certificate URL opens must be gone after migration');
  must(admin.includes('async function abrirCertificadoPrivadoAdmin'), 'private admin certificate helper must be present after migration');
  must(admin.includes("postAdminStudents('descargarMiCertificadoPrivado'"), 'private operation must be wired after migration');
  console.log('ADMIN_DIRECT_CERTIFICATE_URL_CONSUMERS=0_SOURCE_MIGRATED');
} else {
  must(admin.includes("postAdminStudents('buscarCertificadoExistente'"), 'admin existing-certificate consumer remains inventoried before migration');
  const directAdminUrlOpens = (admin.match(/window\.open\(data\.url/g) || []).length;
  must(directAdminUrlOpens === 3, `expected exactly 3 pre-migration direct certificate URL opens, found ${directAdminUrlOpens}`);
  console.log('ADMIN_DIRECT_CERTIFICATE_URL_CONSUMERS=3_PRE_MIGRATION');
}

console.log('CS21A194R SEC002 CERTIFICATE TREE REBASE: PASS');
console.log('LEGACY_CERTIFICATE_TREE=P1_OPEN');
console.log(`GROUP_FOLDER_SAMPLES_ANYONE_READER=${contract.drive_evidence.group_folders_anyone_reader}/${contract.drive_evidence.group_folders_sampled}`);
console.log(`REAL_CERTIFICATE_SAMPLES_ANYONE_READER=${contract.drive_evidence.real_certificate_samples_anyone_reader}/${contract.drive_evidence.real_certificate_samples_checked}`);
console.log('CURRENT_RUNTIME_PRIVATE_CERT_ENDPOINT=PENDING_ISSUE_111');
console.log('ACL_CHANGE=NONE');
console.log('RELEASE_GATE=PRIVATE_DELIVERY_PLUS_ACL_E2');
