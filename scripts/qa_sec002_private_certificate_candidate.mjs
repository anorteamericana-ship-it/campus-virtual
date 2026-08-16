import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const arg = process.argv.slice(2).find(x => x.startsWith('--backend='));
if (!arg) {
  console.error('Usage: node scripts/qa_sec002_private_certificate_candidate.mjs --backend=/path/to/Code.gs');
  process.exit(2);
}
const backendPath = arg.slice('--backend='.length);
if (!fs.existsSync(backendPath)) {
  console.error(`Backend not found: ${backendPath}`);
  process.exit(2);
}
const source = fs.readFileSync(backendPath, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};
function between(start, end) {
  const s = source.indexOf(start);
  const e = source.indexOf(end, s + start.length);
  if (s < 0 || e < 0) throw new Error(`Missing scope: ${start} -> ${end}`);
  return source.slice(s, e);
}

const finder = between('function buscarCertificadoExistente(data)', '// Override seguro de generarCertificado.');
check('certificate lookup is read-only', !finder.includes('_certF984TEliminarDuplicadosOficiales_') && !finder.includes('.setTrashed('));
check('duplicate detection is reported', finder.includes('duplicados_detectados:duplicadosDetectados'));

const permissions = between('function _an4406_rolesPorEndpoint_(fn)', 'function _sec004bRolesPorEndpoint_(fn)');
check('POST permission map declares private download', permissions.includes("descargarMiCertificadoPrivado: ['student', 'admin', 'superadmin']"));
const ownership = between('function _an4406_validarPropiedadPost_(fn, body, sesion)', 'function _an4406PublicPostEndpoint_(fn)');
check('student ownership guard covers private download', ownership.includes('descargarMiCertificadoPrivado: true'));
const dispatcher = between('function doPost_BASE_F59(e)', 'function _diagF33EndpointCheck_(fn, modulo)');
check('POST dispatcher routes private download', dispatcher.includes("fn === 'descargarMiCertificadoPrivado'"));

const pilot = between('// SEC-002 CERT PRIVATE PILOT', '// Override seguro de generarCertificado.');
let cache = new Map();
let searchCalls = 0;
let blobCalls = 0;
let cfg = { mime:'application/pdf', size:8, bytes:[37,80,68,70,45,49,46,55], name:'CERTIFICADO TEST.pdf' };
let found = { ok:true, file_id:'FILE-1', registro:'SJ01-TEST-2026', nombre:cfg.name, duplicados_detectados:2 };
const signed = b => [...b].map(x => x > 127 ? x - 256 : x);
const digest = value => {
  const bytes = typeof value === 'string' ? Buffer.from(value, 'utf8') : Buffer.from((value || []).map(x => x < 0 ? x + 256 : x));
  return signed(crypto.createHash('sha256').update(bytes).digest());
};
const ctx = {
  Utilities:{
    DigestAlgorithm:{SHA_256:'SHA_256'}, Charset:{UTF_8:'UTF_8'},
    computeDigest:(_a,v,_c)=>digest(v),
    base64Encode:bytes=>Buffer.from(bytes.map(x=>x<0?x+256:x)).toString('base64')
  },
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  CacheService:{getScriptCache:()=>({get:k=>cache.get(k) ?? null,put:(k,v)=>cache.set(k,v)})},
  DriveApp:{getFileById:()=>({
    getMimeType:()=>cfg.mime, getSize:()=>cfg.size, getName:()=>cfg.name,
    getBlob:()=>{blobCalls++; return {getBytes:()=>cfg.bytes};}
  })},
  _sec006cCodigoProp_:v=>String(v ?? '').replace(/\D+/g,''),
  buscarCertificadoExistente:()=>{searchCalls++; return {...found};}
};
vm.createContext(ctx);
vm.runInContext(pilot, ctx, {filename:'sec002-private-cert-pilot.js'});
const reset = () => {
  cache = new Map(); searchCalls = 0; blobCalls = 0;
  cfg = { mime:'application/pdf', size:8, bytes:[37,80,68,70,45,49,46,55], name:'CERTIFICADO TEST.pdf' };
  found = { ok:true, file_id:'FILE-1', registro:'SJ01-TEST-2026', nombre:cfg.name, duplicados_detectados:2 };
};
const request = codigo => ({codigo,nivel:'B2',_auth_session:{ok:true,rol:'student',codigo:'17161',usuario:'120010572'}});

reset();
let r = ctx.descargarMiCertificadoPrivado(request('17161'));
check('authorized student receives one-shot private payload', r.ok === true && r.private_delivery === true);
check('private payload exposes no Drive URL or file id', !('url' in r) && !('file_id' in r));
check('base64 round-trip is exact', Buffer.from(r.data_base64,'base64').equals(Buffer.from(cfg.bytes)));
check('sha256 integrity is exact', r.sha256 === crypto.createHash('sha256').update(Buffer.from(cfg.bytes)).digest('hex'));

reset();
r = ctx.descargarMiCertificadoPrivado(request('99999'));
check('cross-student request is denied', r.ok === false && r.error === 'no_autorizado');
check('cross-student denial occurs before Drive search', searchCalls === 0 && blobCalls === 0);

reset();
cfg.size = 2 * 1024 * 1024 + 1;
r = ctx.descargarMiCertificadoPrivado(request('17161'));
check('oversized PDF is rejected', r.ok === false && r.error === 'certificado_excede_limite_privado');
check('oversized PDF is rejected before blob read', blobCalls === 0);

reset();
cfg.mime = 'text/html';
r = ctx.descargarMiCertificadoPrivado(request('17161'));
check('non-PDF is rejected', r.ok === false && r.error === 'tipo_archivo_no_permitido');
check('non-PDF is rejected before blob read', blobCalls === 0);

reset();
const attempts = Array.from({length:6}, () => ctx.descargarMiCertificadoPrivado(request('17161')));
check('first five downloads pass pilot limiter', attempts.slice(0,5).every(x => x.ok === true));
check('sixth download is limited', attempts[5]?.ok === false && attempts[5]?.error === 'limite_descarga');
check('limited request does not search Drive', searchCalls === 5, `searchCalls=${searchCalls}`);

reset();
r = ctx.descargarMiCertificadoPrivado({codigo:'17161',nivel:'B2',_auth_session:{ok:true,rol:'teacher',codigo:'T1',usuario:'teacher'}});
check('teacher is denied by certificate pilot', r.ok === false && r.error === 'no_autorizado');
check('denied role does not touch Drive', searchCalls === 0 && blobCalls === 0);

if (failures.length) {
  console.error(`SEC002 PRIVATE CERT QA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 PRIVATE CERT QA: PASS');
