import fs from 'node:fs';

const path = 'security/sec002_certificate_private_storage_contract_20260830.json';
const c = JSON.parse(fs.readFileSync(path, 'utf8'));

function eq(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function yes(value, label) {
  if (value !== true) throw new Error(`${label}: must be true`);
}
function includes(list, value, label) {
  if (!Array.isArray(list) || !list.includes(value)) throw new Error(`${label}: missing ${value}`);
}

eq(c.contract_id, 'SEC002_CERTIFICATE_PRIVATE_STORAGE_20260830', 'contract id');
eq(c.status, 'BACKEND_CONTRACT_ONLY_RUNTIME_PENDING', 'runtime status');
eq(c.document_class, 'student_certificate', 'document class');

eq(c.source_evidence.legacy_root, 'DOCUMENTOS_ESTUDIANTES', 'legacy root');
eq(c.source_evidence.legacy_acl_observed, 'ANYONE_READER_DISCOVERY_OFF', 'observed legacy ACL');
yes(c.source_evidence.recent_public_certificate_observed, 'recent public certificate evidence');
eq(c.source_evidence.modern_root, 'EXPEDIENTES_ESTUDIANTILES', 'modern root');
eq(c.source_evidence.modern_acl_observed, 'OWNER_ONLY', 'modern ACL');

eq(c.target_storage.path_template, '<CEDULA>/06_DOCUMENTOS_ACADEMICOS/<NIVEL>', 'private path');
eq(c.target_storage.acl_requirement, 'NO_ANYONE_NO_DOMAIN_PRIVATE', 'target ACL');
yes(c.target_storage.must_not_set_public_sharing, 'public sharing prohibition');

eq(c.generation_rules.preserve_endpoint, 'generarCertificado', 'generation endpoint');
yes(c.generation_rules.preserve_registry_semantics, 'registry semantics');
yes(c.generation_rules.preserve_existing_registration_number, 'registration preservation');
yes(c.generation_rules.no_new_registration_on_regeneration, 'regeneration idempotency');
yes(c.generation_rules.new_certificates_must_use_target_storage, 'new private storage');
yes(c.generation_rules.generated_file_must_not_inherit_anyone_permission, 'no public inheritance');

yes(c.lookup_rules.private_location_first, 'private lookup first');
yes(c.lookup_rules.legacy_location_fallback_read_only, 'legacy fallback read-only');
yes(c.lookup_rules.read_must_not_delete_duplicates, 'read no delete');
yes(c.lookup_rules.read_must_not_move_files, 'read no move');
yes(c.lookup_rules.read_must_not_change_acl, 'read no ACL mutation');
eq(c.lookup_rules.duplicate_handling, 'REPORT_ONLY_DURING_READ', 'duplicate read policy');

eq(c.delivery_rules.endpoint, 'descargarMiCertificadoPrivado', 'private delivery endpoint');
for (const role of ['student','admin','superadmin']) includes(c.delivery_rules.roles, role, 'roles');
yes(c.delivery_rules.student_ownership_required, 'student ownership');
eq(c.delivery_rules.mime, 'application/pdf', 'MIME');
eq(c.delivery_rules.max_bytes, 2097152, 'size limit');
yes(c.delivery_rules.sha256_required, 'SHA-256');
yes(c.delivery_rules.public_url_response_forbidden, 'no public URL response');

eq(c.legacy_migration_rules.strategy, 'COPY_VERIFY_THEN_DEPRECATE_SOURCE', 'migration strategy');
yes(c.legacy_migration_rules.copy_to_private_target_first, 'copy first');
yes(c.legacy_migration_rules.verify_size, 'verify size');
yes(c.legacy_migration_rules.verify_sha256, 'verify hash');
yes(c.legacy_migration_rules.do_not_delete_source_in_first_pass, 'no first-pass delete');
yes(c.legacy_migration_rules.do_not_remove_anyone_acl_until_e2_passes, 'no ACL removal before E2');

for (const gate of [
  'student_can_download_own_certificate',
  'student_cannot_download_other_students_certificate',
  'admin_can_download_authorized_certificate',
  'new_certificate_is_created_in_private_target',
  'new_certificate_has_no_anyone_permission',
  'regeneration_preserves_registration_number',
  'private_copy_hash_matches_source_before_legacy_acl_change'
]) includes(c.required_e2, gate, 'required E2');

yes(c.release_gates.fresh_modular_apps_script_snapshot_required, 'fresh snapshot gate');
yes(c.release_gates.issue_111_must_be_resolved_for_runtime_port, 'Issue #111 gate');
yes(c.release_gates.drive_acl_change_before_e2_forbidden, 'ACL-before-E2 prohibition');
yes(c.release_gates.production_change_requires_separate_authorization, 'production authorization');

console.log('SEC002 CERTIFICATE PRIVATE STORAGE CONTRACT: PASS');
console.log('RUNTIME_CHANGE=NO');
console.log('ACL_CHANGE=NO');
console.log('ISSUE_111_GATE=YES');
