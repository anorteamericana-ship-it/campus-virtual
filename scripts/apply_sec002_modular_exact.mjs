import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ALLOWED_CHANGED_BASENAMES = new Set([
  '01_Router',
  '14_Notas_Cierre_Certificados',
  '20_Inscripcion_Ventas_Matricula',
  '21_Pagos_Banco_CONAPE',
]);
const FORBIDDEN_NAME_MARKERS = ['ENGLISH_LAB', 'MEMORY_MATCH'];
const PRIVATE_ENDPOINTS = [
  'descargarMiCertificadoPrivado',
  'descargarDocumentoExtraPrivado',
  'descargarComprobantePagoPrivado',
  'descargarMatriculaFirmadaPrivada',
];

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i < 0 || i + 1 >= process.argv.length) throw new Error(`Missing ${name}`);
  return process.argv[i + 1];
}
function normalize(text) { return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n'); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0, start = 0;
  while (true) {
    const p = text.indexOf(needle, start);
    if (p < 0) return count;
    count++; start = p + 1;
  }
}
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && /\.(?:js|gs)$/i.test(ent.name)) out.push(p);
  }
  return out.sort();
}
function parsePatch(filePath, displayPath) {
  const lines = normalize(fs.readFileSync(filePath, 'utf8')).split('\n');
  const hunks = [];
  let i = 0, hidx = 0;
  while (i < lines.length) {
    if (!lines[i].startsWith('@@ ')) { i++; continue; }
    const header = lines[i++];
    const oldLines = [], newLines = [];
    while (i < lines.length && !lines[i].startsWith('@@ ')) {
      const line = lines[i];
      if (line.startsWith('--- ') || line.startsWith('+++ ')) break;
      if (line.startsWith('\\ No newline at end of file')) { i++; continue; }
      if (!line) { i++; continue; }
      const prefix = line[0], body = line.slice(1);
      if (prefix === ' ') { oldLines.push(body); newLines.push(body); }
      else if (prefix === '-') oldLines.push(body);
      else if (prefix === '+') newLines.push(body);
      else break;
      i++;
    }
    hidx++;
    if (!oldLines.length) throw new Error(`Hunk without preimage: ${displayPath} ${header}`);
    hunks.push({patch:displayPath, hunk:hidx, header, oldLines, newLines});
  }
  return hunks;
}
function anchor(lines) {
  return [...lines].filter(x => x.trim().length >= 12).sort((a,b)=>b.trim().length-a.trim().length)[0]?.trim() || '';
}
function baseNoExt(file) { return path.basename(file).replace(/\.(?:js|gs)$/i, ''); }

const appsDir = path.resolve(argValue('--apps-dir'));
const repoRoot = path.resolve(argValue('--repo-root'));
const reportPath = path.resolve(argValue('--report'));
const manifestPath = path.join(repoRoot, 'qa', 'sec002_private_delivery_bundle_manifest.json');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const ordered = [...manifest.ordered_deltas].sort((a,b)=>Number(a.order)-Number(b.order));
const files = walk(appsDir);
if (!files.length) throw new Error('No .js/.gs server files found in clasp clone');

const original = new Map();
const text = new Map();
const newline = new Map();
for (const f of files) {
  const b = fs.readFileSync(f);
  original.set(f, b);
  const s = b.toString('utf8').replace(/^\uFEFF/, '');
  text.set(f, normalize(s));
  newline.set(f, (b.toString('binary').match(/\r\n/g)||[]).length > (b.toString('binary').match(/(?<!\r)\n/g)||[]).length ? '\r\n' : '\n');
}

const totalExpected = ordered.reduce((n,x)=>n+Number(x.expected_hunks),0);
const applied = [];
const failures = [];

outer:
for (const item of ordered) {
  const patchRel = String(item.path);
  const hunks = parsePatch(path.join(repoRoot, patchRel), patchRel);
  if (hunks.length !== Number(item.expected_hunks)) throw new Error(`Hunk contract mismatch ${patchRel}: expected=${item.expected_hunks} parsed=${hunks.length}`);
  for (const h of hunks) {
    const oldText = h.oldLines.join('\n');
    const newText = h.newLines.join('\n');
    const matches = [];
    for (const f of files) {
      const n = countOccurrences(text.get(f), oldText);
      if (n) matches.push({file:f,count:n});
    }
    const exactTotal = matches.reduce((n,m)=>n+m.count,0);
    if (exactTotal !== 1) {
      const a = anchor(h.oldLines);
      const anchorHits = [];
      if (a) for (const f of files) { const n=countOccurrences(text.get(f),a); if(n) anchorHits.push({file:path.relative(appsDir,f).replaceAll('\\','/'),count:n}); }
      failures.push({patch:h.patch,hunk:h.hunk,header:h.header,exact_match_count:exactTotal,exact_match_files:matches.map(m=>({file:path.relative(appsDir,m.file).replaceAll('\\','/'),count:m.count})),anchor:a,anchor_hits:anchorHits});
      break outer;
    }
    const target = matches.find(m=>m.count===1).file;
    const base = baseNoExt(target);
    const upper = path.basename(target).toUpperCase();
    if (!ALLOWED_CHANGED_BASENAMES.has(base)) {
      failures.push({patch:h.patch,hunk:h.hunk,header:h.header,error:'unexpected_target_module',file:path.relative(appsDir,target).replaceAll('\\','/'),allowed:[...ALLOWED_CHANGED_BASENAMES].sort()});
      break outer;
    }
    if (FORBIDDEN_NAME_MARKERS.some(x=>upper.includes(x))) {
      failures.push({patch:h.patch,hunk:h.hunk,header:h.header,error:'forbidden_lab_memory_target',file:path.relative(appsDir,target).replaceAll('\\','/')});
      break outer;
    }
    text.set(target, text.get(target).replace(oldText,newText));
    applied.push({patch:h.patch,hunk:h.hunk,header:h.header,file:path.relative(appsDir,target).replaceAll('\\','/')});
  }
}

if (!failures.length && applied.length !== totalExpected) failures.push({error:'applied_hunk_total_mismatch',expected:totalExpected,observed:applied.length});

const changed = [];
if (!failures.length) {
  for (const f of files) {
    const orig = normalize(original.get(f).toString('utf8').replace(/^\uFEFF/,''));
    if (text.get(f) !== orig) changed.push(f);
  }
  const bad = changed.map(baseNoExt).filter(x=>!ALLOWED_CHANGED_BASENAMES.has(x));
  if (bad.length) failures.push({error:'changed_file_allowlist_violation',observed:bad,allowed:[...ALLOWED_CHANGED_BASENAMES].sort()});
}

let endpointCounts = {};
if (!failures.length) {
  const combined = files.map(f=>text.get(f)).join('\n');
  for (const endpoint of PRIVATE_ENDPOINTS) {
    const re = new RegExp(`function\\s+${endpoint}\\s*\\(`,'g');
    endpointCounts[endpoint] = (combined.match(re)||[]).length;
  }
  if (Object.values(endpointCounts).some(n=>n!==1)) failures.push({error:'private_endpoint_definition_count',counts:endpointCounts});
}

const beforeSha = {}, afterSha = {};
if (!failures.length) {
  for (const f of changed) {
    const rel = path.relative(appsDir,f).replaceAll('\\','/');
    beforeSha[rel] = sha256(original.get(f));
    const out = text.get(f).replace(/\n/g,newline.get(f));
    fs.writeFileSync(f,out,'utf8');
    afterSha[rel] = sha256(fs.readFileSync(f));
  }
}

const report = {
  ok: !failures.length,
  mode: 'SEC002_MODULAR_EXACT_REBASE_V1',
  apps_dir: appsDir,
  manifest: manifestPath,
  total_expected_hunks: totalExpected,
  applied_hunks: applied.length,
  applied,
  changed_files: changed.map(f=>path.relative(appsDir,f).replaceAll('\\','/')),
  before_sha256: beforeSha,
  after_sha256: afterSha,
  endpoint_definition_counts: endpointCounts,
  failures,
};
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath,JSON.stringify(report,null,2),'utf8');

if (failures.length) {
  console.log('SEC002_MODULAR_REBASE_STOP');
  console.log(JSON.stringify(failures[0]));
  console.log(`REPORT=${reportPath}`);
  process.exit(2);
}
console.log('SEC002_MODULAR_REBASE_PASS');
console.log(`APPLIED_HUNKS=${applied.length}`);
console.log(`CHANGED_FILES=${report.changed_files.join(',')}`);
for (const rel of report.changed_files) console.log(`SHA ${rel} before=${beforeSha[rel]} after=${afterSha[rel]}`);
console.log(`REPORT=${reportPath}`);
