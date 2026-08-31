import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const src = read('src/admin_students.jsx');
const cert = JSON.parse(read('security/sec002_legacy_certificate_tree_contract_cs21a194.json'));
const identity = JSON.parse(read('security/sec002_identity_legacy_contract_cs21a174.json'));
const proforma = JSON.parse(read('security/sec002_proforma_public_acl_contract_cs21a196.json'));
const sec006 = JSON.parse(read('security/sec006_additional_resources_access_contract_v1.json'));

const must = (cond, label) => { if (!cond) throw new Error(`SECURITY CURRENT CANDIDATE missing: ${label}`); };
const forbid = (cond, label) => { if (cond) throw new Error(`SECURITY CURRENT CANDIDATE forbidden: ${label}`); };

// Source authority: #201 admin_students.
must(src.includes("postAdminStudents('descargarMiCertificadoPrivado'"), 'admin private certificate operation');
must(src.includes('async function adminCertSha256Hex'), 'certificate SHA-256 verification');
must(src.includes("if (String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf')"), 'certificate MIME guard');
must(src.includes("bytes.length > 2 * 1024 * 1024"), 'certificate size bound');
must(src.includes("bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45"), 'PDF signature verification');
forbid(src.includes('window.open(data.url'), 'direct admin certificate data.url open');
forbid(src.includes('buscarCertificadoExistente -> data.url'), 'stale direct certificate consumer marker in source');
must((src.match(/include_base64:true/g) || []).length >= 2, 'private CONAPE/transfer byte requests');
must(src.includes('function abrirPdfPrivadoBackend(payload)'), 'fail-closed private academic PDF helper');
must(src.includes("'generar_documento_comun'"), 'common document safe-error boundary');

// Certificate ACL evidence remains P1 even though source consumer is migrated.
must(cert.state === 'OPEN_BLOCKER', 'legacy certificate P1 remains open');
must(cert.drive_evidence?.legacy_root_permission === 'anyone_reader_link_only', 'legacy certificate root ACL evidence');
must(cert.drive_evidence?.group_folders_sampled === 4 && cert.drive_evidence?.group_folders_anyone_reader === 4, '4/4 group folder ACL evidence');
must(cert.drive_evidence?.real_certificate_samples_checked === 3 && cert.drive_evidence?.real_certificate_samples_anyone_reader === 3, '3/3 certificate ACL evidence');
must(cert.frontend_state === 'SOURCE_MIGRATED_PRIVATE_RUNTIME_UNPROVEN', 'certificate frontend state reconciled');
must(cert.backend_evidence?.staff_private_endpoint_runtime === 'PENDING_ISSUE_111', 'certificate runtime gate preserved');
must(cert.release_gate === 'BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2', 'certificate release gate preserved');

// Identity: historical public publisher proven, current object ACL still unknown.
must(identity.historical_acl_evidence?.sharing_behavior?.includes('ANYONE_WITH_LINK'), 'identity historical public sharing evidence');
must(identity.historical_acl_evidence?.current_object_acl === 'NOT_PROVEN', 'identity current ACL not overclaimed');
must(identity.target_delivery?.proposed_operation === 'descargarDocumentoIdentidadPrivado', 'identity private target preserved');

// Proformas: current public ACL remains proven and staff URL consumers are still blockers.
must(proforma.state === 'OPEN_BLOCKER', 'proforma P1 remains open');
must(proforma.drive_evidence?.real_recent_samples_checked === 3 && proforma.drive_evidence?.real_recent_samples_anyone_reader === 3, '3/3 recent proforma ACL evidence');
must(proforma.historical_backend_evidence?.private_bytes_delivery_demonstrated === false, 'proforma private bytes not overclaimed');
must(proforma.current_frontend?.whatsapp_link_propagation === 'REMOVED_BY_CS21A175_PR147', 'safe WhatsApp behavior preserved');
must(proforma.release_gate === 'BLOCK_UNTIL_PRIVATE_STAFF_DELIVERY_AND_ACL_MIGRATION_E2', 'proforma release gate preserved');

// SEC-006 remains independently open.
must(sec006.contract_id === 'SEC-006-ADDITIONAL-RESOURCES-ACCESS-V1', 'additional resources access contract preserved');
must(sec006.classification === 'P1_ACCESS_CONTROL', 'SEC-006 P1 classification preserved');
must(sec006.drive_evidence?.root_folders_checked === 4 && sec006.drive_evidence?.root_folders_anyone_reader === 4, 'SEC-006 4/4 root ACL evidence');
must(sec006.release_gate === 'BLOCK_UNTIL_ROLE_BOUND_DELIVERY_AND_ACL_E2', 'SEC-006 release gate preserved');

// Never claim runtime/ACL completion in this integration cut.
must(cert.production === 'NO_CHANGE' && proforma.production === 'NO_CHANGE', 'no production change contracts');
must(sec006.acl_changed_by_this_cut === false && sec006.apps_script_changed_by_this_cut === false && sec006.production_changed_by_this_cut === false, 'SEC-006 no-change boundaries');

console.log('SECURITY CURRENT CANDIDATE 2026-08-31: PASS');
console.log('ADMIN_STUDENTS_SOURCE=#201_AUTHORITY');
console.log('CERTIFICATE_FRONTEND=PRIVATE_SOURCE_RUNTIME_UNPROVEN');
console.log('CERTIFICATE_ACL_P1=OPEN');
console.log('IDENTITY_CURRENT_ACL=NOT_PROVEN');
console.log('PROFORMA_ACL_P1=OPEN');
console.log('SEC006_ACCESS_P1=OPEN');
console.log('APPS_SCRIPT=UNCHANGED');
console.log('DRIVE_ACL=UNCHANGED');
console.log('PRODUCTION=UNCHANGED');
