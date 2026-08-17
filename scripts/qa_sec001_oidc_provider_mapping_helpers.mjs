import fs from 'node:fs';

const path = 'qa/sec001_oidc_provider_mapping_helpers.gs';
const s = fs.readFileSync(path, 'utf8');
const fail = [];
const need = (re, msg) => { if (!re.test(s)) fail.push(msg); };
const forbid = (re, msg) => { if (re.test(s)) fail.push(msg); };

need(/getProperty\('SEC001_AUTH0_DOMAIN'\)/, 'tenant domain must come from Script Properties');
need(/https:\/\/' \+ domain \+ '\/userinfo'/, 'UserInfo URL must be constructed from server-side domain');
need(/Authorization:\s*'Bearer '\s*\+\s*proof/, 'provider proof must be sent as bearer to UserInfo');
need(/getResponseCode\(\) !== 200/, 'non-200 UserInfo must fail');
need(/String\(profile && profile\.sub \|\| ''\)/, 'stable provider sub is required');
need(/count !== 1/, 'provider subject mapping must resolve exactly one row');
need(/MIGRATION_STATUS[\s\S]*MIGRATED/, 'mapping must require MIGRATED state');
need(/\['USUARIOS','DATOS'\]/, 'local source allowlist required');
need(/return \{ ok: false, error: 'credenciales_invalidas' \}/, 'uniform external auth failure required');

forbid(/function\s+doPost\s*\(/, 'helper module must not define doPost');
forbid(/function\s+doGet\s*\(/, 'helper module must not define doGet');
forbid(/function\s+iniciarSesionOidc\s*\(/, 'future endpoint must remain unrouted/unimplemented in this helper phase');
forbid(/appendRow\s*\(|setValue\s*\(|setValues\s*\(|insertSheet\s*\(|createSheet\s*\(/, 'helper module must not write/create Sheets');
forbid(/Logger\.log|console\.log/, 'provider proof path must not log');
forbid(/setProperty\s*\(|CacheService\.get/, 'provider proof must not be persisted/cached in this helper phase');
forbid(/client[_-]?secret/i, 'client secret must not appear');
forbid(/body\.(?:domain|issuer|userinfo)/i, 'provider endpoint must not come from request body');

if (fail.length) {
  console.error('SEC-001 OIDC PROVIDER/MAPPING HELPERS: FAIL');
  fail.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('SEC-001 OIDC PROVIDER/MAPPING HELPERS: PASS');
console.log('- no route, no session issuance, no sheet writes');
console.log('- UserInfo tenant is server-configured and provider sub maps exactly once');
console.log('- non-MIGRATED/ambiguous mappings fail with uniform credential error');
