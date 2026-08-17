import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// SEC-002 modular reconciliation is intentionally narrow. These are the only
// modules proven by the 2026-08-17 33-file diagnostic to host the 24 bundle
// hunks after modularization.
const ALLOWED_CHANGED_BASENAMES = new Set([
  '01_Router',
  '02_Auth_Sesiones_Usuarios',
  '10_Estudiantes',
  '14_Notas_Cierre_Certificados',
]);
const FORBIDDEN_NAME_MARKERS = ['ENGLISH_LAB', 'MEMORY_MATCH'];
const PRIVATE_ENDPOINTS = [
  'descargarMiCertificadoPrivado',
  'descargarDocumentoExtraPrivado',
  'descargarComprobantePagoPrivado',
  'descargarMatriculaFirmadaPrivada',
];

// Two certificate hunks became structurally ambiguous after modularization:
// the router contains both legacy GET and active POST authorization layers.
// SEC-002 private delivery is POST, so these two closed-form resolutions target
// only the active POST matrix/ownership guard. Every other hunk remains exact 1/1.
const SPECIAL_RESOLVERS = new Map([
  ['qa/sec002_private_certificate_delta.patch#1', {
    fileBase: '01_Router',
    functionName: '_an4406_rolesPorEndpoint_',
    anchor: '    getMisCertificadosEstado: estudianteCampus,',
    insert: "    descargarMiCertificadoPrivado: ['student', 'admin', 'superadmin'],",
    reason: 'post_role_matrix_only',
  }],
  ['qa/sec002_private_certificate_delta.patch#2', {
    fileBase: '01_Router',
    functionName: '_an4406_validarPropiedadPost_',
    anchor: '      getMisCertificadosEstado: true,',
    insert: '      descargarMiCertificadoPrivado: true,',
    reason: 'post_student_ownership_guard_only',
  }],
]);

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
function rel(root, file) { return path.relative(root, file).replaceAll('\\','/'); }

function findFileByBase(files, wantedBase) {
  const matches = files.filter(f => baseNoExt(f) === wantedBase);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${wantedBase}.js/.gs, found ${matches.length}`);
  return matches[0];
}

function functionSegment(source, functionName) {
  const marker = `function ${functionName}(`;
  const starts = [];
  let at = 0;
  while (true) {
    const p = source.indexOf(marker, at);
    if (p < 0) break;
    starts.push(p);
    at = p + marker.length;
  }
  if (starts.length !== 1) {
    throw new Error(`Expected exactly one function ${functionName}, found ${starts.length}`);
  }
  const start = starts[0];
  const next = source.indexOf('\nfunction ', start + marker.length);
  const end = next < 0 ? source.length : next;
  return {start, end, text:source.slice(start,end)};
}

function applySpecialResolver({rule, files, text, appsDir, patch, hunk, header}) {
  const target = findFileByBase(files, rule.fileBase);
  const upper = path.basename(target).toUpperCase();
  if (FORBIDDEN_NAME_MARKERS.some(x=>upper.includes(x))) {
    throw new Error(`Special resolver targeted forbidden LAB/Memory module: ${rel(appsDir,target)}`);
  }
  const source = text.get(target);
  const seg = functionSegment(source, rule.functionName);
  const anchorCount = countOccurrences(seg.text, rule.anchor);
  const insertCount = countOccurrences(seg.text, rule.insert);
  if (anchorCount !== 1 || insertCount !== 0) {
    throw new Error(`Special resolver precondition failed ${patch}#${hunk}: function=${rule.functionName} anchor_count=${anchorCount} insert_count=${insertCount}`);
  }
  const localPos = seg.text.indexOf(rule.anchor);
  const globalPos = seg.start + localPos + rule.anchor.length;
  const updated = source.slice(0, globalPos) + '\n' + rule.insert + source.slice(globalPos);
  text.set(target, updated);
  return {
    patch, hunk, header,
    file: rel(appsDir,target),
    resolution: 'SPECIAL_POST_LAYER_INSERT',
    function: rule.functionName,
    reason: rule.reason,
    anchor: rule.anchor,
    inserted: rule.insert,
  };
}

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
    const key = `${h.patch}#${h.hunk}`;
    const special = SPECIAL_RESOLVERS.get(key);
    if (special) {
      try {
        applied.push(applySpecialResolver({rule:special, files, text, appsDir, patch:h.patch, hunk:h.hunk, header:h.header}));
      } catch (err) {
        failures.push({patch:h.patch,hunk:h.hunk,header:h.header,error:'special_resolution_failed',message:String(err && err.message || err),rule:special});
        break outer;
      }
      continue;
    }

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
      if (a) for (const f of files) { const n=countOccurrences(text.get(f),a); if(n) anchorHits.push({file:rel(appsDir,f),count:n}); }
      failures.push({patch:h.patch,hunk:h.hunk,header:h.header,exact_match_count:exactTotal,exact_match_files:matches.map(m=>({file:rel(appsDir,m.file),count:m.count})),anchor:a,anchor_hits:anchorHits});
      break outer;
    }
    const target = matches.find(m=>m.count===1).file;
    const base = baseNoExt(target);
    const upper = path.basename(target).toUpperCase();
    if (!ALLOWED_CHANGED_BASENAMES.has(base)) {
      failures.push({patch:h.patch,hunk:h.hunk,header:h.header,error:'unexpected_target_module',file:rel(appsDir,target),allowed:[...ALLOWED_CHANGED_BASENAMES].sort()});
      break outer;
    }
    if (FORBIDDEN_NAME_MARKERS.some(x=>upper.includes(x))) {
      failures.push({patch:h.patch,hunk:h.hunk,header:h.header,error:'forbidden_lab_memory_target',file:rel(appsDir,target)});
      break outer;
    }
    text.set(target, text.get(target).replace(oldText,newText));
    applied.push({patch:h.patch,hunk:h.hunk,header:h.header,file:rel(appsDir,target),resolution:'EXACT_SINGLE_PREIMAGE'});
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

// Closed-form authorization invariants for the two reconciled certificate hunks.
if (!failures.length) {
  try {
    const router = text.get(findFileByBase(files,'01_Router'));
    const rolesSeg = functionSegment(router,'_an4406_rolesPorEndpoint_').text;
    const ownerSeg = functionSegment(router,'_an4406_validarPropiedadPost_').text;
    if (countOccurrences(rolesSeg, "descargarMiCertificadoPrivado: ['student', 'admin', 'superadmin'],") !== 1) {
      failures.push({error:'certificate_post_role_matrix_invariant_failed'});
    }
    if (countOccurrences(ownerSeg, 'descargarMiCertificadoPrivado: true,') !== 1) {
      failures.push({error:'certificate_post_ownership_invariant_failed'});
    }
  } catch (err) {
    failures.push({error:'certificate_post_layer_invariant_exception',message:String(err && err.message || err)});
  }
}

const beforeSha = {}, afterSha = {};
if (!failures.length) {
  for (const f of changed) {
    const r = rel(appsDir,f);
    beforeSha[r] = sha256(original.get(f));
    const out = text.get(f).replace(/\n/g,newline.get(f));
    fs.writeFileSync(f,out,'utf8');
    afterSha[r] = sha256(fs.readFileSync(f));
  }
}

const specialApplied = applied.filter(x=>x.resolution==='SPECIAL_POST_LAYER_INSERT');
const exactApplied = applied.filter(x=>x.resolution==='EXACT_SINGLE_PREIMAGE');
const report = {
  ok: !failures.length,
  mode: 'SEC002_MODULAR_EXACT_REBASE_V2_POST_LAYER_RECONCILED',
  apps_dir: appsDir,
  manifest: manifestPath,
  total_expected_hunks: totalExpected,
  applied_hunks: applied.length,
  exact_hunks: exactApplied.length,
  special_hunks: specialApplied.length,
  applied,
  changed_files: changed.map(f=>rel(appsDir,f)),
  allowed_changed_modules:[...ALLOWED_CHANGED_BASENAMES].sort(),
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
console.log(`EXACT_HUNKS=${exactApplied.length}`);
console.log(`SPECIAL_POST_LAYER_HUNKS=${specialApplied.length}`);
console.log(`CHANGED_FILES=${report.changed_files.join(',')}`);
for (const r of specialApplied) console.log(`SPECIAL ${r.patch}#${r.hunk} -> ${r.file} :: ${r.function} :: ${r.reason}`);
for (const r of report.changed_files) console.log(`SHA ${r} before=${beforeSha[r]} after=${afterSha[r]}`);
console.log(`REPORT=${reportPath}`);
