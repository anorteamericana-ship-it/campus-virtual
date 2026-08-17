import fs from 'node:fs';

const failures = [];
const bridge = JSON.parse(fs.readFileSync('security/sec001_oidc_bridge_contract.json', 'utf8'));
const adapter = fs.readFileSync('src/auth_provider_sec001.jsx', 'utf8');
const loginHtml = fs.readFileSync('login.html', 'utf8');
const login = fs.readFileSync('src/login.jsx', 'utf8');

if (bridge.future_endpoint !== 'iniciarSesionOidc') failures.push('unexpected future endpoint name');
if (bridge.status !== 'design_ready_not_routed_not_deployed') failures.push('bridge status must remain not routed/not deployed');
if (bridge.request?.password_or_clave_allowed !== false) failures.push('OIDC bridge must prohibit password/clave');
if (bridge.request?.requires_existing_campus_token !== false) failures.push('pre-session bridge cannot require an existing Campus token');
if (bridge.provider_verification?.userinfo_url_from_request_allowed !== false) failures.push('provider URL must never come from request');
if (bridge.provider_verification?.bearer_token_logged_or_persisted !== false) failures.push('provider proof must never be logged/persisted');
if (bridge.identity_mapping?.mapping_must_resolve_exactly_one_local_principal !== true) failures.push('identity mapping must be exactly one');
if (bridge.identity_mapping?.local_principal_reference_must_not_depend_only_on_username !== true) failures.push('mapping must not depend only on username');
if (bridge.local_authorization_after_identity?.provider_claims_cannot_override_local_fields !== true) failures.push('provider claims must not grant local authorization');
if (bridge.response?.includes_provider_access_token !== false || bridge.response?.includes_password !== false) failures.push('Campus response must not echo provider proof/password');
if (bridge.routing_gate?.doPost_route_may_be_added_before_tenant_exists !== false) failures.push('router must stay closed before tenant exists');
if (bridge.routing_gate?.adapter_may_be_loaded_by_login_html_before_backend_QA_pass !== false) failures.push('adapter must stay unloaded before backend QA pass');
if (bridge.production_authorized !== false) failures.push('production must remain unauthorized');

if (loginHtml.includes('auth_provider_sec001') || /auth0(?:-spa-js|\.min\.js|\.js)/i.test(loginHtml)) {
  failures.push('login.html exposed managed auth before backend gate');
}
if (!/fn:\s*'iniciarSesion'[\s\S]*clave:\s*pass/.test(login)) {
  failures.push('legacy login unexpectedly changed during bridge design phase');
}
if (/iniciarSesionOidc/.test(loginHtml) || /iniciarSesionOidc/.test(login) || /iniciarSesionOidc/.test(adapter)) {
  failures.push('future OIDC endpoint must not be invoked by frontend yet');
}
if (/client[_-]?secret/i.test(adapter)) failures.push('adapter contains forbidden client secret concept');

if (failures.length) {
  console.error('SEC-001 OIDC BRIDGE CONTRACT: FAIL');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('SEC-001 OIDC BRIDGE CONTRACT: PASS');
console.log('- OIDC bridge is design-only and not routed');
console.log('- provider proof replaces password in target steady-state');
console.log('- stable sub -> exact local principal mapping required');
console.log('- Campus remains source of truth for roles/scopes');
console.log('- frontend remains on unchanged legacy route until backend QA gate');
