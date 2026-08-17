import fs from 'node:fs';

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const failures = [];

const auth = readJson('security/sec001_auth_contract.json');
const poc = readJson('security/sec001_auth0_poc_contract.json');
const identity = readJson('security/sec001_identity_normalization_report.json');
const enrollment = fs.readFileSync('src/inscripcion.jsx', 'utf8');

if (auth.password_policy?.minimum_length_single_factor !== 6) {
  failures.push('SEC-001 product minimum must be 6');
}
if (poc.password?.minimum_characters_product_decision !== 6) {
  failures.push('Auth0 PoC contract minimum must be 6');
}
if (poc.tenant?.production_tenant_allowed !== false || poc.production_authorized !== false) {
  failures.push('PoC must remain DEV/QA only');
}
if (poc.identifier?.primary !== 'username') {
  failures.push('PoC must preserve username as primary login identifier');
}
if (poc.browser_flow?.authorization_flow !== 'Authorization Code with PKCE via Universal Login') {
  failures.push('SPA flow must use Authorization Code with PKCE');
}
if (poc.browser_flow?.client_secret_in_browser_allowed !== false) {
  failures.push('browser client secret must be prohibited');
}
if (poc.browser_flow?.steady_state_password_sent_to_apps_script !== false) {
  failures.push('steady-state password must never be sent to Apps Script');
}
if (poc.campus_bridge?.provider_roles_may_grant_campus_access !== false) {
  failures.push('provider roles must not grant Campus access');
}
if (poc.migration?.bulk_plaintext_export_allowed !== false || poc.migration?.legacy_password_copy_to_provider_allowed !== false) {
  failures.push('plaintext bulk/copy migration must remain prohibited');
}
if (poc.migration?.migrated_account_plaintext_fallback_allowed !== false) {
  failures.push('migrated accounts must never fall back to plaintext');
}
if (!poc.attack_protection?.suspicious_ip_throttling_required || !poc.attack_protection?.brute_force_protection_required) {
  failures.push('managed attack protection is required');
}
if (identity.active_account_count !== 19) {
  failures.push(`active account baseline changed: expected 19, got ${identity.active_account_count}`);
}
if (identity.active_account_findings?.blank_username_count < 1 || identity.active_account_findings?.duplicate_username_groups < 1) {
  failures.push('identity normalization blockers unexpectedly disappeared from the documented baseline; re-audit before changing report');
}
if (identity.migration_gate?.bulk_import_allowed_now !== false) {
  failures.push('bulk import must stay blocked until identity normalization is resolved');
}
if (!/minLength=\{6\}/.test(enrollment) || !/clean\(form\.clave\)\.length\s*<\s*6/.test(enrollment)) {
  failures.push('enrollment source does not enforce the product minimum 6');
}

for (const [path, obj] of [
  ['security/sec001_auth_contract.json', auth],
  ['security/sec001_auth0_poc_contract.json', poc],
  ['security/sec001_identity_normalization_report.json', identity],
]) {
  const raw = fs.readFileSync(path, 'utf8');
  if (/client_secret\s*[:=]\s*["'][^"']+/i.test(raw) || /password\s*[:=]\s*["'][^"']+/i.test(raw)) {
    failures.push(`${path} appears to contain a secret literal`);
  }
  if (obj.production_authorized !== false && path !== 'security/sec001_identity_normalization_report.json') {
    failures.push(`${path} must explicitly prohibit production`);
  }
}

if (failures.length) {
  console.error('SEC-001 AUTH0 POC CONTRACT: FAIL');
  failures.forEach((x) => console.error(`- ${x}`));
  process.exit(1);
}

console.log('SEC-001 AUTH0 POC CONTRACT: PASS');
console.log('- product password minimum: 6');
console.log('- username-first identity contract');
console.log('- PKCE/public-client flow; no browser secret');
console.log('- Apps Script steady-state receives no password');
console.log('- real-account import blocked by normalization gate');
console.log('- production remains unauthorized');
