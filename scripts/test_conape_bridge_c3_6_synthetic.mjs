import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const sourcePath = new URL('../services/conape-bridge/server.mjs', import.meta.url);
let source = fs.readFileSync(sourcePath, 'utf8');
source = source
  .replace(/^import http from 'node:http';\n/m, '')
  .replace(/^import crypto from 'node:crypto';\n/m, '')
  .replace(/^import \{ chromium \} from 'playwright';\n/m, '');
const cut = source.indexOf('\nconst server = http.createServer');
assert.ok(cut > 0, 'No se pudo aislar el bridge antes de abrir el servidor');
source = source.slice(0, cut) + `\n;globalThis.__c36 = {\n  AppError, campusPhone, campusEmail, contactPlan, authorizeCampus, roleOf, userBinding, identityHash,\n  sourceVersions, rateBuckets, submit, corsHeaders\n};`;

let fetchQueue = [];
const fakeFetch = async () => {
  const item = fetchQueue.shift();
  if (!item) throw new Error('synthetic_fetch_queue_empty');
  return {
    ok: item.ok !== false,
    async text() { return typeof item.body === 'string' ? item.body : JSON.stringify(item.body); },
  };
};

const context = vm.createContext({
  crypto,
  fetch: fakeFetch,
  process: { env: { SOURCE_TTL_MS:'180000', CAMPUS_ALLOWED_ORIGINS:'https://anorteamerican.com' } },
  console,
  URL,
  URLSearchParams,
  Buffer,
  AbortSignal,
  Date,
  setTimeout,
  clearTimeout,
});
vm.runInContext(source, context, { filename:'server.mjs' });
const c36 = context.__c36;

function okSession(overrides = {}) {
  return { ok:true, rol:'VENTAS', usuario:'qa.synthetic@example.invalid', codigo:'QA-SYNTH', ...overrides };
}
function okProspect(overrides = {}) {
  return { cedula:'123456789', financiamiento:'CONAPE', whatsapp:'88887777', correo:'qa.synthetic@example.invalid', ...overrides };
}
function queueCampus(session = okSession(), prospect = okProspect()) {
  fetchQueue = [{ body:session }, { body:{ ok:true, prospecto:prospect } }];
}
async function expectCode(fn, code) {
  let error;
  try { await fn(); } catch (e) { error = e; }
  assert.ok(error, `Se esperaba error ${code}`);
  assert.equal(error.code, code);
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('telefono acepta 8 digitos exactos', () => {
  assert.equal(c36.campusPhone({ whatsapp:'8888-7777' }), '88887777');
});

test('telefono acepta +506 + 8 digitos', () => {
  assert.equal(c36.campusPhone({ whatsapp:'+506 8888-7777' }), '88887777');
});

test('telefono no trunca silenciosamente una longitud invalida', () => {
  assert.equal(c36.campusPhone({ whatsapp:'188887777' }), '188887777');
  assert.throws(() => c36.contactPlan({ whatsapp:'188887777' }, {}), e => e?.code === 'CONTACT_VALIDATION_FAILED');
});

test('correo invalido se rechaza', () => {
  assert.throws(() => c36.contactPlan({ whatsapp:'88887777', correo:'no-es-correo' }, {}), e => e?.code === 'CONTACT_VALIDATION_FAILED');
});

test('rol no permitido falla cerrado', async () => {
  fetchQueue = [{ body:okSession({ rol:'ESTUDIANTE' }) }];
  await expectCode(() => c36.authorizeCampus('token-role', '123456789'), 'CAMPUS_ROLE_FORBIDDEN');
});

test('sesion read-only falla cerrado', async () => {
  fetchQueue = [{ body:okSession({ read_only:true }) }];
  await expectCode(() => c36.authorizeCampus('token-ro', '123456789'), 'CAMPUS_READ_ONLY');
});

test('prospecto fuera de CONAPE se rechaza server-side', async () => {
  queueCampus(okSession(), okProspect({ financiamiento:'CONTADO' }));
  await expectCode(() => c36.authorizeCampus('token-fin', '123456789'), 'PROSPECT_NOT_CONAPE');
});

test('cedula devuelta por Campus debe coincidir exactamente', async () => {
  queueCampus(okSession(), okProspect({ cedula:'999999999' }));
  await expectCode(() => c36.authorizeCampus('token-ced', '123456789'), 'PROSPECT_CEDULA_MISMATCH');
});

test('campos de identidad enviados desde Campus se prohíben antes de cualquier CREATE', async () => {
  fetchQueue = [];
  await expectCode(() => c36.submit({ token:'x', cedula:'123456789', prospecto:{ nombre:'NO PERMITIDO' } }), 'IDENTITY_FIELDS_FORBIDDEN');
  assert.equal(fetchQueue.length, 0);
});

test('source_version consumido se rechaza', async () => {
  const session = okSession();
  const binding = c36.userBinding(session);
  c36.sourceVersions.set('used', { cedula:'123456789', binding, identityHash:'x', expiresAt:Date.now()+60000, consumed:true });
  queueCampus(session, okProspect());
  await expectCode(() => c36.submit({ token:'token-used', cedula:'123456789', source_version:'used' }), 'SOURCE_VERSION_USED');
});

test('source_version vencido se rechaza', async () => {
  const session = okSession();
  c36.sourceVersions.set('expired', { cedula:'123456789', binding:c36.userBinding(session), identityHash:'x', expiresAt:Date.now()-1, consumed:false });
  queueCampus(session, okProspect());
  await expectCode(() => c36.submit({ token:'token-exp', cedula:'123456789', source_version:'expired' }), 'SOURCE_VERSION_EXPIRED');
});

test('source_version de otra sesion se rechaza', async () => {
  const owner = okSession({ usuario:'owner@example.invalid' });
  const caller = okSession({ usuario:'caller@example.invalid' });
  c36.sourceVersions.set('owner', { cedula:'123456789', binding:c36.userBinding(owner), identityHash:'x', expiresAt:Date.now()+60000, consumed:false });
  queueCampus(caller, okProspect());
  await expectCode(() => c36.submit({ token:'token-owner', cedula:'123456789', source_version:'owner' }), 'SOURCE_VERSION_OWNER_MISMATCH');
});

test('source_version no puede cambiar de cedula', async () => {
  const session = okSession();
  c36.sourceVersions.set('cedula', { cedula:'987654321', binding:c36.userBinding(session), identityHash:'x', expiresAt:Date.now()+60000, consumed:false });
  queueCampus(session, okProspect());
  await expectCode(() => c36.submit({ token:'token-cm', cedula:'123456789', source_version:'cedula' }), 'CEDULA_MISMATCH');
});

test('CORS solo refleja origen allowlisted', () => {
  assert.equal(c36.corsHeaders('https://anorteamerican.com')['Access-Control-Allow-Origin'], 'https://anorteamerican.com');
  assert.deepEqual(Object.keys(c36.corsHeaders('https://evil.invalid')), []);
});

test('rate limit corta la solicitud 31 del mismo token', async () => {
  const token = 'token-rate-limit';
  for (let i = 0; i < 30; i += 1) {
    queueCampus(okSession(), okProspect());
    const result = await c36.authorizeCampus(token, '123456789');
    assert.equal(result.cedula, '123456789');
  }
  fetchQueue = [];
  await expectCode(() => c36.authorizeCampus(token, '123456789'), 'RATE_LIMITED');
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log(`PASS · ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL · ${name}`);
    console.error(error?.stack || error);
    process.exitCode = 1;
  }
}
if (process.exitCode) process.exit(process.exitCode);
console.log(`C3.6 synthetic bridge PASS · ${passed}/${tests.length}`);
