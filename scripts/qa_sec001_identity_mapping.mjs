import fs from 'node:fs';

const schema = JSON.parse(fs.readFileSync('security/sec001_auth_identities_schema.json', 'utf8'));
const fail = [];
const normProvider = v => String(v || '').trim().toLowerCase();
const normKey = (type, value) => {
  const t = String(type || '').trim().toUpperCase();
  const raw = String(value || '').trim();
  if (t === 'CEDULA') return raw.replace(/[-\s]/g, '');
  if (t === 'CODIGO') return raw.toUpperCase();
  return raw;
};

function resolveIdentity(rows, provider, sub) {
  const p = normProvider(provider);
  const s = String(sub || '');
  if (!p || !s) return { ok:false, error:'identidad_invalida' };
  const matches = rows.filter(r => normProvider(r.PROVIDER) === p && String(r.PROVIDER_SUB || '') === s);
  if (matches.length !== 1) return { ok:false, error:'identidad_ambigua_o_inexistente' };
  const row = matches[0];
  if (String(row.MIGRATION_STATUS || '').trim().toUpperCase() !== 'MIGRATED') return { ok:false, error:'identidad_no_migrada' };
  const source = String(row.LOCAL_SOURCE || '').trim().toUpperCase();
  const keyType = String(row.LOCAL_KEY_TYPE || '').trim().toUpperCase();
  const key = normKey(keyType, row.LOCAL_KEY);
  if (!['USUARIOS','DATOS'].includes(source) || !['CEDULA','CODIGO','AUTH_PRINCIPAL_ID'].includes(keyType) || !key) {
    return { ok:false, error:'principal_local_invalido' };
  }
  return { ok:true, principal:{ source, keyType, key } };
}

const base = {
  IDENTITY_ID:'fixture-1', PROVIDER:'auth0', PROVIDER_SUB:'auth0|fixture-1',
  LOCAL_SOURCE:'USUARIOS', LOCAL_KEY_TYPE:'CEDULA', LOCAL_KEY:'9-9999-9999',
  USERNAME_CANONICO:'same-fixture-name', MIGRATION_STATUS:'MIGRATED'
};
const cases = [
  ['valid', [base], 'AUTH0', 'auth0|fixture-1', true, null],
  ['same username irrelevant', [base,{...base,IDENTITY_ID:'fixture-2',PROVIDER_SUB:'auth0|fixture-2',LOCAL_KEY:'8-8888-8888'}], 'auth0','auth0|fixture-1', true, null],
  ['duplicate sub', [base,{...base,IDENTITY_ID:'fixture-dup'}], 'auth0','auth0|fixture-1', false,'identidad_ambigua_o_inexistente'],
  ['pending', [{...base,MIGRATION_STATUS:'PENDING'}], 'auth0','auth0|fixture-1', false,'identidad_no_migrada'],
  ['reset required', [{...base,MIGRATION_STATUS:'RESET_REQUIRED'}], 'auth0','auth0|fixture-1', false,'identidad_no_migrada'],
  ['revoked', [{...base,MIGRATION_STATUS:'REVOKED'}], 'auth0','auth0|fixture-1', false,'identidad_no_migrada'],
  ['sub case sensitive', [base], 'auth0','AUTH0|fixture-1', false,'identidad_ambigua_o_inexistente'],
  ['username key forbidden', [{...base,LOCAL_KEY_TYPE:'USUARIO'}], 'auth0','auth0|fixture-1', false,'principal_local_invalido'],
  ['blank local key', [{...base,LOCAL_KEY:''}], 'auth0','auth0|fixture-1', false,'principal_local_invalido'],
];
for (const [name, rows, provider, sub, expectedOk, expectedError] of cases) {
  const r = resolveIdentity(rows, provider, sub);
  if (!!r.ok !== expectedOk) fail.push(`${name}: wrong ok ${JSON.stringify(r)}`);
  if (expectedError && r.error !== expectedError) fail.push(`${name}: expected ${expectedError}, got ${r.error}`);
}
const valid = resolveIdentity([base], 'auth0', 'auth0|fixture-1');
if (valid.principal?.key !== '999999999') fail.push('CEDULA normalization failed');
if (schema.sheet_name !== 'AUTH_IDENTIDADES') fail.push('wrong sheet name');
if (schema.lookup_rules?.username_only_lookup_allowed !== false) fail.push('username-only mapping became allowed');
if (schema.lookup_rules?.provider_sub_case_sensitive !== true) fail.push('sub must remain case-sensitive');
if (schema.production_authorized !== false) fail.push('production became authorized');
const cols = new Set((schema.columns || []).map(c => c.name));
for (const c of ['IDENTITY_ID','PROVIDER','PROVIDER_SUB','LOCAL_SOURCE','LOCAL_KEY_TYPE','LOCAL_KEY','MIGRATION_STATUS','LEGACY_CLEARED_AT']) if (!cols.has(c)) fail.push(`missing ${c}`);

if (fail.length) {
  console.error('SEC-001 IDENTITY MAPPING: FAIL');
  fail.forEach(x => console.error(`- ${x}`));
  process.exit(1);
}
console.log('SEC-001 IDENTITY MAPPING: PASS');
console.log(`- ${cases.length} fictitious cases passed`);
console.log('- duplicates/non-MIGRATED/invalid principals fail closed');
console.log('- no real user data used');
