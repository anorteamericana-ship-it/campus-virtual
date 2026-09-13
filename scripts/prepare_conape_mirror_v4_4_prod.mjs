import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const EXPECTED_SCRIPT_ID = '1kV4wKnD_OU5DPQSawScjPsUbo1MOg_rAHbtpYupSMPkqywIVSQwdV4y2';
const EXPECTED_BASE_SHA256 = 'eab988abb79705444358ec7f9a24a8023c9c6fc560b2e0656ed91296ab0471ac';
const START = '/* === CONAPE_MIRROR_V4_4_BEGIN === */';
const END = '/* === CONAPE_MIRROR_V4_4_END === */';

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : '';
}

function fail(code, detail) {
  console.error(JSON.stringify({ ok:false, code, detail:detail || '' }));
  process.exit(1);
}

const codePath = path.resolve(arg('--code') || 'Código.js');
const claspPath = path.resolve(arg('--clasp') || '.clasp.json');
const patchPath = path.resolve(arg('--patch') || 'apps-script-patches/conape_reclutamiento_mirror_v4_4.js');
const outPath = path.resolve(arg('--out') || path.join(path.dirname(codePath), 'Código.CONAPE_V4_4_PROPOSED.js'));

for (const [label, file] of [['Código.js', codePath], ['.clasp.json', claspPath], ['patch', patchPath]]) {
  if (!fs.existsSync(file)) fail('INPUT_MISSING', `${label}: ${file}`);
}

let clasp;
try { clasp = JSON.parse(fs.readFileSync(claspPath, 'utf8')); }
catch (error) { fail('CLASP_JSON_INVALID', error.message); }
if (String(clasp?.scriptId || '').trim() !== EXPECTED_SCRIPT_ID) {
  fail('SCRIPT_ID_MISMATCH', `expected=${EXPECTED_SCRIPT_ID} actual=${String(clasp?.scriptId || '').trim()}`);
}

const base = fs.readFileSync(codePath, 'utf8');
const baseHash = sha256(base);
if (baseHash !== EXPECTED_BASE_SHA256) {
  fail('BASE_SHA256_MISMATCH', `expected=${EXPECTED_BASE_SHA256} actual=${baseHash}`);
}
if (base.includes(START) || base.includes('CONAPE_MIRROR_V44_HEADERS')) {
  fail('PATCH_ALREADY_PRESENT', 'El Código.js ya contiene CONAPE Mirror V4.4.');
}

const requiredAnchors = [
  'function validarSesion',
  'getDashboardVentas',
  'function doPost',
  '_an4406_parseBody_',
  '_an4406_json_',
  'OPERATIVO_ID',
];
for (const anchor of requiredAnchors) {
  if (!base.includes(anchor)) fail('BASE_SEMANTIC_ANCHOR_MISSING', anchor);
}

const patch = fs.readFileSync(patchPath, 'utf8').trim();
if (!patch.includes('function conapeMirrorApplySnapshotV44(body)')) fail('PATCH_CONTRACT_INVALID', 'apply endpoint missing');
if (!patch.includes("getSheetByName('CONAPE_RECLUTAMIENTO')")) fail('PATCH_CONTRACT_INVALID', 'mirror sheet missing');
if (/LockService|ScriptApp\.newTrigger|debounce/i.test(patch)) fail('PATCH_FORBIDDEN_COORDINATION', 'lock/trigger/debounce detected');

const proposed = `${base.replace(/\s+$/,'')}\n\n${START}\n${patch}\n${END}\n`;
fs.writeFileSync(outPath, proposed, 'utf8');

const proposedHash = sha256(proposed);
console.log(JSON.stringify({
  ok:true,
  code:'CONAPE_V4_4_PROPOSED_READY',
  script_id:EXPECTED_SCRIPT_ID,
  baseline_sha256:baseHash,
  proposed_sha256:proposedHash,
  baseline_bytes:Buffer.byteLength(base, 'utf8'),
  proposed_bytes:Buffer.byteLength(proposed, 'utf8'),
  output:outPath,
  remote_write:false,
}, null, 2));
