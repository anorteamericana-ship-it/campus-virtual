import fs from 'node:fs';

const certPath = 'security/sec002_legacy_certificate_tree_contract_cs21a194.json';
const cert = JSON.parse(fs.readFileSync(certPath, 'utf8'));

if (cert.state !== 'OPEN_BLOCKER') throw new Error(`Unexpected certificate state: ${cert.state}`);
if (cert.drive_evidence?.legacy_root_permission !== 'anyone_reader_link_only') throw new Error('Certificate ACL evidence changed unexpectedly');
if (cert.backend_evidence?.staff_private_endpoint_runtime !== 'PENDING_ISSUE_111') throw new Error('Certificate runtime gate changed unexpectedly');
if (cert.release_gate !== 'BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2') throw new Error('Certificate release gate changed unexpectedly');

cert.frontend_state = 'SOURCE_MIGRATED_PRIVATE_RUNTIME_UNPROVEN';
cert.source_migration_evidence = {
  authority_prs: [200, 201],
  authority_head: 'd3f0a2f36d95a71b55b7604cd67398c0d1beeff6',
  admin_source_consumer: 'descargarMiCertificadoPrivado',
  direct_drive_url_consumer_removed: true,
  integrity_controls: ['mime_application_pdf', 'base64_decode', 'max_2_mib', 'pdf_signature', 'sha256_when_available'],
  runtime_verified: false,
  runtime_gate: 'PENDING_ISSUE_111'
};
cert.current_consumers = {
  admin_existing_certificate: 'SOURCE_PRIVATE: descargarMiCertificadoPrivado; no direct Drive URL; runtime pending Issue #111',
  admin_regenerate_certificate: 'SOURCE_PRIVATE: generarCertificado then descargarMiCertificadoPrivado; no direct Drive URL; runtime pending Issue #111',
  admin_generate_certificate: 'SOURCE_PRIVATE: generarCertificado then descargarMiCertificadoPrivado; no direct Drive URL; runtime pending Issue #111',
  student_certificate: 'SOURCE_PRIVATE_CANDIDATE: descargarMiCertificadoPrivado; runtime pending Issue #111'
};
cert.required_migration_order = [
  'Obtain fresh complete modular QA Apps Script snapshot and prove effective dispatcher order.',
  'Port/reconcile descargarMiCertificadoPrivado onto that exact QA source with server-side role/ownership enforcement.',
  'Run authenticated E2 for admin, superadmin and student plus negative cross-user/unauthorized cases.',
  'Inventory every legacy certificate object/folder that still has anyone-reader ACL.',
  'Remove public ACL only after private delivery is proven for all required consumers.',
  'Verify anonymous/link-only access is denied after ACL migration.'
];
cert.integration_reconciliation = {
  date: '2026-08-31',
  source_base_pr: 198,
  admin_students_authority_pr: 201,
  acl_evidence_authority_pr: 205,
  note: 'Frontend source migration and Drive ACL migration are separate gates. Source-private does not imply runtime-private or ACL-private.'
};

fs.writeFileSync(certPath, JSON.stringify(cert, null, 2) + '\n', 'utf8');
console.log('Certificate contract reconciled for current source candidate');
