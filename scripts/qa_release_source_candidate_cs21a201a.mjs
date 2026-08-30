import fs from 'node:fs';
import { execSync } from 'node:child_process';

const BASE = '858be40ed7f40fa321b22b818087e28115fdf334';
const must = (ok, label) => { if (!ok) throw new Error(`CS21A201A FAIL: ${label}`); };
const files = execSync(`git diff --name-only ${BASE}...HEAD`, { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);

const expectedSrc = [
  'src/admin_master_conape_data_cs21a96.jsx',
  'src/admin_master_conape_multisort_cs21a109.jsx',
  'src/admin_master_conape_review_core_cs21a96.jsx',
  'src/admin_master_conape_review_state_cs21a96.jsx',
  'src/admin_master_conape_view_cs21a96.jsx',
  'src/admin_master_conape_wa_cs21a96.jsx',
  'src/admin_master_dashboard.jsx',
  'src/admin_students.jsx',
  'src/admin_students_inline_payment_cs21a36.jsx',
  'src/admin_students_quick_update_conape_cs21a99.js',
  'src/admin_students_quick_update_core_cs21a99.js',
  'src/admin_students_quick_update_payment_cs21a99.js',
  'src/admin_students_quick_update_state_cs21a99.js',
  'src/aperturas_admin_cs21a20.jsx',
  'src/att77_bridge.js',
  'src/auth_provider_sec001_v2.jsx',
  'src/data.jsx',
  'src/inscripcion.jsx',
  'src/matriculas_admin.jsx',
  'src/panel_admin_supervision.jsx',
  'src/panel_suspensiones.jsx',
  'src/solicitudes_pago.jsx',
  'src/student_experience.jsx',
  'src/student_modules.jsx',
  'src/teacher_cs21a.jsx',
  'src/teacher_profile_cs21a76.jsx',
  'src/teacher_views.jsx',
  'src/ventas_dashboard.jsx',
  'src/ventas_drawer.jsx',
  'src/ventas_parts.jsx',
].sort();
const actualSrc = files.filter(f => f.startsWith('src/')).sort();
must(JSON.stringify(actualSrc) === JSON.stringify(expectedSrc), `exact src perimeter mismatch\nexpected=${expectedSrc.join(',')}\nactual=${actualSrc.join(',')}`);

const gsFiles = files.filter(f => f.endsWith('.gs')).sort();
must(JSON.stringify(gsFiles) === JSON.stringify(['apps_script_patches/ZZ_SEC004_DEMO_READONLY_OUTER_GUARD_V3.gs']), `unexpected Apps Script files in diff: ${gsFiles.join(',')}`);

for (const required of [
  'scripts/qa_matriculas_ventas_security_cs21a177.mjs',
  'scripts/qa_security_source_candidate_cs21a179.mjs',
  'scripts/qa_security_p1_source_tooling_cs21a180.mjs',
  'scripts/qa_sec002_private_student_admin_chain_cs21a181.mjs',
  'scripts/qa_solicitudes_pago_safe_errors_cs21a182.mjs',
  'scripts/qa_student_private_doc_safe_errors_cs21a183.mjs',
  'scripts/qa_sec002_teacher_profile_source_cs21a184.mjs',
  'scripts/qa_teacher_material_access_cs21a185.mjs',
  'scripts/qa_teacher_session_safe_errors_cs21a186.mjs',
  'scripts/qa_teacher_action_safe_errors_cs21a187.mjs',
  'scripts/qa_teacher_user_copy_cs21a188.mjs',
  'scripts/qa_admin_quick_update_safe_errors_cs21a189.mjs',
  'scripts/qa_admin_conape_user_copy_cs21a190.mjs',
  'scripts/qa_admin_students_safe_errors_cs21a191.mjs',
  'scripts/qa_admin_students_user_copy_cs21a192.mjs',
  'scripts/qa_sec002_admin_academic_pdf_delivery_cs21a193.mjs',
  'scripts/qa_sec002_legacy_certificate_tree_contract_cs21a194.mjs',
  'scripts/qa_sec002_identity_legacy_evidence_cs21a195.mjs',
  'scripts/qa_sec002_proforma_public_acl_contract_cs21a196.mjs',
  'scripts/qa_admin_security_consolidated_cs21a200a.mjs',
]) must(fs.existsSync(required), `required regression guard present: ${required}`);

const oidc = fs.readFileSync('src/auth_provider_sec001_v2.jsx', 'utf8');
must(oidc.includes('enabled:false') || oidc.includes('enabled: false'), 'OIDC foundation remains disabled by default');

const sec004 = JSON.parse(fs.readFileSync('security/sec004_demo_readonly_contract_v3.json', 'utf8'));
must(sec004.installed_in_qa === false || sec004.runtime?.installed_in_qa === false, 'SEC004 remains not installed in QA');

const teacherAccess = JSON.parse(fs.readFileSync('security/teacher_material_access_contract_v1.json', 'utf8'));
must(JSON.stringify(teacherAccess).includes('NOT_FIXED_PRIVATE_DELIVERY_PENDING'), 'teacher-material access blocker remains explicit');

const proforma = JSON.parse(fs.readFileSync('security/sec002_proforma_public_acl_contract_cs21a196.json', 'utf8'));
must(JSON.stringify(proforma).includes('BLOCK_UNTIL_PRIVATE_STAFF_DELIVERY_AND_ACL_MIGRATION_E2'), 'proforma ACL blocker remains explicit');

console.log('CS21A201A FLATTENED RELEASE SOURCE CANDIDATE: PASS');
console.log(`BASE=${BASE}`);
console.log(`SRC_PERIMETER=${actualSrc.length}`);
console.log('APPS_SCRIPT_RUNTIME_CHANGE=NO');
console.log('SECURITY_RUNTIME_CLOSURE=NOT_CLAIMED');
console.log('PRODUCTION_ACTION=NO');
