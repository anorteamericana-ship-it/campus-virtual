import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_legacy_certificate_tree_contract_cs21a194.json', 'utf8'));
const admin = fs.readFileSync('src/admin_students.jsx', 'utf8');
const student = fs.readFileSync('src/student_modules.jsx', 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A194R guard: ${msg}`);
}

must(contract.severity === 'P1', 'legacy certificate tree remains P1');
must(contract.state === 'OPEN_BLOCKER', 'blocker remains open');
must(contract.rebased_from === 'PR_186_CS21A194', 'parallel audited evidence remains traceable');
must(contract.base_pr === 202, 'contract is rebased onto current CS21A193 stack');
must(contract.drive_evidence.legacy_root_permission === 'anyone_reader_link_only', 'legacy root ACL evidence remains explicit');
must(contract.drive_evidence.group_folders_sampled >= 4, 'at least four group folders remain sampled');
must(contract.drive_evidence.group_folders_anyone_reader === contract.drive_evidence.group_folders_sampled, 'all sampled group folders are anyone-reader');
must(contract.drive_evidence.nested_level_folder_permission === 'anyone_reader_link_only', 'nested level ACL evidence remains explicit');
must(contract.drive_evidence.real_certificate_samples_checked >= 3, 'at least three real certificate samples remain recorded');
must(contract.drive_evidence.real_certificate_samples_anyone_reader === contract.drive_evidence.real_certificate_samples_checked, 'all recorded certificate samples are anyone-reader');
must(contract.drive_evidence.additional_recent_certificate_sample_current_audit === 'anyone_reader_link_only', 'current audit recent certificate sample remains explicit');
must(contract.drive_evidence.modern_signed_enrollment_QA_sample_permission === 'owner_only', 'modern private flow contrast remains explicit');
must(contract.drive_evidence.acl_change_in_this_cut === 'NONE', 'contract-only cut does not claim ACL changes');
const be = contract.backend_evidence || {};
must(be.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh modular snapshot remains pending');
must(be.portable_private_delta === 'qa/sec002_private_certificate_delta.patch documented by PR #110', 'portable historical delta evidence remains traceable');
must(be.portable_private_operation === 'descargarMiCertificadoPrivado', 'portable private operation remains explicit');
must(Array.isArray(be.portable_private_roles) && ['student','admin','superadmin'].every(r => be.portable_private_roles.includes(r)), 'historical private roles must include student/admin/superadmin');
must(be.portable_private_delta_status === 'DEFINED_AND_VERIFIED_HISTORICALLY_NOT_INSTALLED_IN_CURRENT_CANONICAL_RUNTIME', 'historical contract and current runtime state must remain separated');
must(be.staff_private_endpoint_runtime === 'PENDING_ISSUE_111', 'staff runtime endpoint remains pending, not invented as installed');
must(contract.release_gate === 'BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2', 'release remains blocked');

must(admin.includes("postAdminStudents('buscarCertificadoExistente'"), 'admin existing-certificate consumer remains inventoried');
must(admin.includes("postAdminStudents('generarCertificado'"), 'admin certificate generator remains inventoried');
const directAdminUrlOpens = (admin.match(/window\.open\(data\.url/g) || []).length;
must(directAdminUrlOpens === 3, `expected exactly 3 current direct certificate URL opens, found ${directAdminUrlOpens}`);
must(admin.includes("function abrirPdfBackend(payload, fallbackUrl = '', options = {})"), 'current CS21A193 private PDF helper remains present');
must(admin.includes('const allowUrl = options?.allowUrl !== false;'), 'CS21A193 fail-closed URL option remains present');
must(admin.includes("abrirPdfBackend(resp,'',{allowUrl:false})") || admin.includes("abrirPdfBackend(r,'',{allowUrl:false})"), 'CS21A193 private academic-doc paths remain wired');
must(student.includes('descargarMiCertificadoPrivado'), 'student private certificate source candidate remains present');

console.log('CS21A194R SEC002 CERTIFICATE TREE REBASE: PASS');
console.log('LEGACY_CERTIFICATE_TREE=P1_OPEN');
console.log(`GROUP_FOLDER_SAMPLES_ANYONE_READER=${contract.drive_evidence.group_folders_anyone_reader}/${contract.drive_evidence.group_folders_sampled}`);
console.log(`REAL_CERTIFICATE_SAMPLES_ANYONE_READER=${contract.drive_evidence.real_certificate_samples_anyone_reader}/${contract.drive_evidence.real_certificate_samples_checked}`);
console.log('ADMIN_DIRECT_CERTIFICATE_URL_CONSUMERS=3');
console.log('HISTORICAL_PRIVATE_CERT_CONTRACT=DEFINED_FOR_STUDENT_ADMIN_SUPERADMIN');
console.log('CURRENT_RUNTIME_PRIVATE_CERT_ENDPOINT=PENDING_ISSUE_111');
console.log('ACL_CHANGE=NONE');
console.log('RELEASE_GATE=PRIVATE_DELIVERY_PLUS_ACL_E2');
