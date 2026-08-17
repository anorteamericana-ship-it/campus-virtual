import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const assert = (cond, msg) => {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  }
};

const contract = readJson('security/sec001_auth_contract.json');
const decision = readJson('security/sec001_identity_provider_decision.json');
const protocol = readJson('security/sec001_auth_verifier_protocol.json');
const legacy = readJson('security/sec001_legacy_credential_surface.json');
const machine = readJson('security/sec001_migration_state_machine.json');
const recovery = fs.readFileSync(path.join(root, 'src/recovery.jsx'), 'utf8');

assert(contract.version >= 4, 'SEC-001 closure contract must be version 4+');
assert(contract.storage?.plaintext_allowed === false, 'plaintext must remain forbidden');
assert(contract.storage?.fast_unsalted_hash_allowed === false, 'fast unsalted hashes must remain forbidden');
assert(contract.password_policy?.minimum_length_single_factor >= 15, 'password minimum must remain >= 15');
assert(contract.password_policy?.arbitrary_composition_rules === false, 'forced composition must remain disabled');
assert(contract.login?.session_tokens_remain_separate_from_identity_credentials === true, 'Campus session must remain separate from IdP credentials');
assert(contract.login?.idp_role_claims_must_not_grant_campus_access === true, 'IdP roles must never grant Campus authorization');
assert(contract.migration?.bulk_export_of_plaintext_credentials_allowed === false, 'bulk plaintext export must remain forbidden');
assert(contract.migration?.silently_copy_stored_legacy_password_to_idp_allowed === false, 'stored legacy passwords must not be silently copied');
assert(contract.migration?.migrated_account_may_fallback_to_legacy === false, 'migrated accounts must not fall back to legacy credentials');
assert(contract.new_accounts?.password_may_be_persisted_in_PROSPECTOS === false, 'new prospect passwords must not be persisted');
assert(contract.new_accounts?.password_may_be_persisted_in_USUARIOS === false, 'new USUARIOS passwords must not be persisted');
assert(contract.new_accounts?.password_may_be_persisted_in_DATOS === false, 'new DATOS passwords must not be persisted');

assert(contract.provisioning?.campus_generated_reusable_password_allowed === false, 'provisioning must not generate reusable passwords');
assert(contract.provisioning?.default_or_short_temporary_password_allowed === false, 'provisioning must not use short/default temporary passwords');
assert(contract.provisioning?.academic_identifier_may_be_used_as_password === false, 'academic identifiers must never become passwords');
assert(contract.provisioning?.password_may_be_communicated_by_staff_or_whatsapp === false, 'staff/WhatsApp password communication must remain forbidden');
assert(contract.provisioning?.password_may_be_copied_from_PROSPECTOS_into_USUARIOS === false, 'provisioning must not copy PROSPECTOS.CLAVE into USUARIOS.clave');
assert(contract.provisioning?.DATOS_clave_may_be_set_to_CODIGO === false, 'DATOS.clave must not duplicate CODIGO');
assert((contract.provisioning?.covered_paths || []).includes('activarEstudiante'), 'activarEstudiante must remain in provisioning scope');
assert((contract.provisioning?.covered_paths || []).includes('generarMatricula'), 'generarMatricula must remain in provisioning scope');
assert(String(contract.provisioning?.target || '').includes('managed IdP account-establishment'), 'provisioning target must remain managed IdP account establishment');

assert(contract.recovery?.existing_password_may_be_revealed === false, 'recovery must never reveal an existing password');
assert(contract.recovery?.unknown_account_may_be_enumerated === false, 'recovery must not enumerate account existence');
assert(contract.recovery?.legacy_password_may_be_reactivated_after_idp_binding === false, 'recovery must not reactivate legacy auth');
// Current source positive control: recovery UI is intentionally local/uniform and makes no backend request.
assert(!/\bfetch\s*\(/.test(recovery), 'current recovery UI unexpectedly performs a fetch');
assert(!/recuperarContrasena\s*\(/.test(recovery), 'current recovery UI unexpectedly invokes legacy recovery endpoint');
assert(recovery.includes('las contraseñas no se muestran'), 'current recovery UI must keep uniform non-disclosure copy');

assert(decision.preferred_provider?.provider === 'Auth0', 'preferred PoC provider must remain explicit');
assert(decision.preferred_provider?.plan === 'Essentials', 'PoC must not silently drift to Auth0 Professional');
assert(decision.production_authorized === false, 'architecture branch must never authorize production');
assert(decision.steady_state?.browser_authenticates_directly_with_idp === true, 'steady-state browser must authenticate directly with IdP');
assert(decision.steady_state?.password_received_by_apps_script === false, 'steady-state Apps Script must not receive password');
assert(decision.steady_state?.campus_authorization_source_remains_local === true, 'Campus must remain authorization source');

assert(protocol.version >= 2, 'verifier protocol must be version 2+');
assert(protocol.steady_state?.browser_to_idp?.apps_script_receives_password === false, 'steady-state Apps Script password receipt forbidden');
assert(protocol.mfa?.campus_does_not_store_totp_secret === true, 'Campus must not store TOTP secrets');
assert(protocol.mfa?.campus_does_not_verify_totp === true, 'Campus must not become TOTP verifier');
assert(protocol.temporary_migration_bridge?.retirement_required === true, 'migration bridge must be temporary');
assert(protocol.temporary_migration_bridge?.migrated_account_plaintext_fallback_allowed === false, 'migration bridge must not re-enable fallback');

assert(legacy.version >= 3, 'legacy credential surface inventory must be version 3+');
const ids = new Set((legacy.surfaces || []).map((s) => s.id));
for (const required of [
  'USUARIOS_PLAINTEXT_PASSWORD',
  'PROSPECTOS_PLAINTEXT_PASSWORD',
  'DATOS_CODE_AS_PASSWORD',
  'DATOS_CLAVE_DUPLICATES_CODIGO',
  'ACTIVATION_WEAK_PASSWORD_FALLBACK',
  'MATRICULA_CODE_AS_PASSWORD_FALLBACK',
  'DEMO_CREDENTIALS'
]) {
  assert(ids.has(required), `legacy credential surface missing: ${required}`);
}

const datosCode = (legacy.surfaces || []).find((s) => s.id === 'DATOS_CODE_AS_PASSWORD');
assert(datosCode?.target?.includes('remove authentication meaning from CODIGO'), 'CODIGO must be demoted to non-secret identifier');

const datosClave = (legacy.surfaces || []).find((s) => s.id === 'DATOS_CLAVE_DUPLICATES_CODIGO');
assert(datosClave?.path?.includes('clave = codigoEst'), 'DATOS.clave duplication evidence must remain explicit');
assert(datosClave?.target?.includes('must not store CODIGO'), 'DATOS.clave target must forbid storing CODIGO');

const activationFallback = (legacy.surfaces || []).find((s) => s.id === 'ACTIVATION_WEAK_PASSWORD_FALLBACK');
assert(activationFallback?.source_behavior?.includes("'an' + random four digits"), 'activation weak fallback evidence must remain explicit');
assert(activationFallback?.target?.includes('never generates or communicates a reusable password'), 'activation target must forbid generated/communicated passwords');

const matriculaFallback = (legacy.surfaces || []).find((s) => s.id === 'MATRICULA_CODE_AS_PASSWORD_FALLBACK');
assert(matriculaFallback?.path?.includes('codigoEst'), 'generarMatricula code-as-password evidence must remain explicit');
assert(matriculaFallback?.target?.includes('must never provision credentials'), 'generarMatricula target must forbid credential provisioning');
assert(legacy.production_authorized === false, 'legacy inventory must not authorize production');

assert(machine.version >= 2, 'migration state machine must be version 2+');
assert(machine.production_authorized === false, 'migration state machine must not authorize production');
assert(machine.migration_transaction?.must_be_created_before_external_identity_call === true, 'migration transaction must be persisted before external IdP call');
assert(machine.migration_transaction?.may_contain_password === false, 'migration journal must never contain password');
assert(machine.migration_transaction?.journal_required === true, 'migration journal must remain required');

const states = new Map((machine.account_states || []).map((s) => [s.state, s]));
for (const required of ['LEGACY', 'MIGRATION_PENDING', 'IDP_BOUND_CLEANUP_PENDING', 'MIGRATED', 'RESET_REQUIRED', 'LOCKED']) {
  assert(states.has(required), `migration state missing: ${required}`);
}
assert(states.get('LEGACY')?.legacy_auth_allowed === true, 'only legacy state may keep bounded legacy authentication');
assert(states.get('IDP_BOUND_CLEANUP_PENDING')?.legacy_auth_allowed === false, 'IdP-bound cleanup state must deny legacy authentication');
assert(states.get('MIGRATED')?.legacy_auth_allowed === false, 'migrated state must deny legacy authentication');
assert(states.get('RESET_REQUIRED')?.legacy_auth_allowed === false, 'reset-required state must deny legacy authentication');
assert(states.get('LOCKED')?.legacy_auth_allowed === false, 'locked state must deny legacy authentication');

const transitions = machine.transition_rules || [];
const noBoundRollback = transitions.find((t) => t.from === 'IDP_BOUND_CLEANUP_PENDING' && t.to === 'LEGACY');
const noMigratedRollback = transitions.find((t) => t.from === 'MIGRATED' && t.to === 'LEGACY');
assert(noBoundRollback?.allowed === false, 'IdP-bound account must never roll back to legacy auth');
assert(noMigratedRollback?.allowed === false, 'migrated account must never roll back to legacy auth');
assert(String(machine.login_routing_invariant || '').includes('checked before any legacy verifier'), 'AUTH_STATE/AUTH_SUB must be checked before legacy verifiers');
assert(String(machine.new_account_provisioning_invariant || '').includes('generarMatricula'), 'state machine must constrain generarMatricula provisioning');
assert((machine.legacy_cleanup_surfaces || []).some((x) => x.includes('NUM_CEDULA + CODIGO')), 'state machine must clean up cédula+CODIGO auth');
assert((machine.legacy_cleanup_surfaces || []).some((x) => x.includes('an####')), 'state machine must clean up activation fallback');
assert((machine.legacy_cleanup_surfaces || []).some((x) => x.includes('generarMatricula') && x.includes('codigoEst')), 'state machine must clean up generarMatricula CODIGO fallback');

if (!process.exitCode) {
  console.log('PASS: SEC-001 identity, recovery, provisioning and migration-state contracts are internally consistent.');
}
