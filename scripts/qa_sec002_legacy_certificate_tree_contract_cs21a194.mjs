import fs from 'node:fs';

const contract = JSON.parse(fs.readFileSync('security/sec002_legacy_certificate_tree_contract_cs21a194.json', 'utf8'));
const admin = fs.readFileSync('src/admin_students.jsx', 'utf8');
const student = fs.readFileSync('src/student_modules.jsx', 'utf8');

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A194 guard: ${msg}`);
}

must(contract.severity === 'P1', 'legacy public certificate tree must remain P1');
must(contract.state === 'OPEN_BLOCKER', 'blocker must remain open until runtime migration');
must(contract.drive_evidence.legacy_root_permission === 'anyone_reader_link_only', 'Drive root evidence must remain explicit');
must(contract.drive_evidence.group_folders_sampled >= 4, 'cross-group ACL sample must remain recorded');
must(contract.drive_evidence.group_folders_anyone_reader === contract.drive_evidence.group_folders_sampled, 'all sampled group folders were anyone-reader');
must(contract.drive_evidence.group_sample_includes_recent_august_2026_folder === true, 'sample must include a recent August 2026 group folder');
must(contract.drive_evidence.nested_level_folder_permission === 'anyone_reader_link_only', 'nested level ACL evidence must remain explicit');
must(contract.drive_evidence.real_certificate_samples_checked >= 3, 'at least three real certificate samples must be recorded');
must(contract.drive_evidence.real_certificate_samples_anyone_reader === contract.drive_evidence.real_certificate_samples_checked, 'all sampled real certificates were anyone-reader');
must(contract.drive_evidence.modern_signed_enrollment_QA_sample_permission === 'owner_only', 'modern private-flow contrast must remain explicit');
must(contract.drive_evidence.acl_change_in_this_cut === 'NONE', 'contract-only cut must not claim ACL changes');
must(contract.backend_evidence.fresh_modular_QA_snapshot === 'PENDING_ISSUE_111', 'fresh modular snapshot remains pending');
must(contract.release_gate === 'BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2', 'release gate must remain blocking');

must(admin.includes("postAdminStudents('buscarCertificadoExistente'"), 'admin existing-certificate consumer must remain inventoried');
must(admin.includes("postAdminStudents('generarCertificado'"), 'admin certificate generation consumer must remain inventoried');
const directAdminUrlOpens = (admin.match(/window\.open\(data\.url/g) || []).length;
must(directAdminUrlOpens === 3, `expected exactly 3 current direct admin certificate URL opens, found ${directAdminUrlOpens}`);
must(admin.includes('function abrirPdfPrivadoAdmin(payload)'), 'strict private PDF helper from CS21A193 must remain available for future migration');
must(student.includes('descargarMiCertificadoPrivado'), 'student private certificate source candidate from CS21A160/#132 must remain present');

console.log('CS21A194 SEC002 LEGACY CERTIFICATE TREE CONTRACT: PASS');
console.log('P1_PUBLIC_LEGACY_TREE=OPEN');
console.log(`GROUP_FOLDER_SAMPLES_ANYONE_READER=${contract.drive_evidence.group_folders_anyone_reader}/${contract.drive_evidence.group_folders_sampled}`);
console.log(`REAL_CERTIFICATE_SAMPLES_ANYONE_READER=${contract.drive_evidence.real_certificate_samples_anyone_reader}/${contract.drive_evidence.real_certificate_samples_checked}`);
console.log('ADMIN_DIRECT_URL_CONSUMERS=3');
console.log('MODERN_SIGNED_ENROLLMENT_QA=OWNER_ONLY');
console.log('ACL_CHANGE=NONE');
console.log('RELEASE_GATE=PRIVATE_DELIVERY_PLUS_ACL_E2');
