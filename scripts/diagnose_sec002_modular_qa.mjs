import fs from 'node:fs';
import path from 'node:path';

const ALLOWED = new Set([
  '01_Router',
  '14_Notas_Cierre_Certificados',
  '20_Inscripcion_Ventas_Matricula',
  '21_Pagos_Banco_CONAPE',
]);

function argValue(name) {
  const i = process.argv.indexOf(name);
  if (i < 0 || i + 1 >= process.argv.length) throw new Error(`Missing ${name}`);
  return process.argv[i + 1];
}
function normalize(s) { return String(s).replace(/\r\n/g, '\n').replace(/\r/g, '\n'); }
function baseNoExt(file) { return path.basename(file).replace(/\.(?:js|gs)$/i, ''); }
function rel(root, file) { return path.relative(root, file).replaceAll('\\', '/'); }
function countOccurrences(text, needle) {
  if (!needle) return 0;
  let n = 0, at = 0;
  while (true) {
    const p = text.indexOf(needle, at);
    if (p < 0) return n;
    n++; at = p + Math.max(1, needle.length);
  }
}
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (ent.isFile() && /\.(?:js|gs)$/i.test(ent.name) && ALLOWED.has(baseNoExt(ent.name))) out.push(p);
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
      if (line === '') { i++; continue; }
      const prefix = line[0], body = line.slice(1);
      if (prefix === ' ') { oldLines.push(body); newLines.push(body); }
      else if (prefix === '-') oldLines.push(body);
      else if (prefix === '+') newLines.push(body);
      else break;
      i++;
    }
    hidx++;
    hunks.push({patch:displayPath, hunk:hidx, header, oldLines, newLines});
  }
  return hunks;
}
function informative(lines) {
  const seen = new Set();
  return lines
    .map(x => String(x).trim())
    .filter(x => x.length >= 10 && !/^[{};,]+$/.test(x))
    .filter(x => { if (seen.has(x)) return false; seen.add(x); return true; });
}
function lineHits(lines, needle) {
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].includes(needle)) hits.push(i + 1);
  return hits;
}
function context(lines, lineNo, radius=3) {
  const start = Math.max(1, lineNo - radius), end = Math.min(lines.length, lineNo + radius);
  const out = [];
  for (let n = start; n <= end; n++) out.push(`${String(n).padStart(5,' ')}: ${lines[n-1]}`);
  return out;
}
function scoreCandidate(fileText, infoLines) {
  let matched = 0, weighted = 0;
  const matchedLines = [];
  for (const l of infoLines) {
    const present = fileText.includes(l);
    if (!present) continue;
    matched++;
    let w = 1;
    if (/\bfunction\b|\bvar\b|\belse if\b|:\s*(?:true|\[|[A-Za-z_])/.test(l)) w += 2;
    if (/SEC002|descargar|subir|reportarPago|Matricula|Certificado|DocumentoExtra|Comprobante/.test(l)) w += 2;
    weighted += w;
    matchedLines.push(l);
  }
  return {matched, total:infoLines.length, weighted, matchedLines};
}

const appsDir = path.resolve(argValue('--apps-dir'));
const repoRoot = path.resolve(argValue('--repo-root'));
const reportPath = path.resolve(argValue('--report'));
const manifestPath = path.join(repoRoot, 'qa', 'sec002_private_delivery_bundle_manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const ordered = [...manifest.ordered_deltas].sort((a,b)=>Number(a.order)-Number(b.order));
const files = walk(appsDir);
if (files.length !== 4) throw new Error(`Expected 4 SEC002 core modules, found ${files.length}: ${files.map(f=>rel(appsDir,f)).join(', ')}`);

const fileData = new Map();
for (const f of files) {
  const txt = normalize(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
  fileData.set(f, {text:txt, lines:txt.split('\n')});
}

const results = [];
for (const item of ordered) {
  const patchRel = String(item.path);
  const hunks = parsePatch(path.join(repoRoot, patchRel), patchRel);
  if (hunks.length !== Number(item.expected_hunks)) throw new Error(`Hunk contract mismatch ${patchRel}`);
  for (const h of hunks) {
    const oldText = h.oldLines.join('\n');
    const exact = [];
    for (const f of files) {
      const n = countOccurrences(fileData.get(f).text, oldText);
      if (n) exact.push({file:rel(appsDir,f), count:n});
    }
    const info = informative(h.oldLines);
    const candidates = files.map(f => {
      const d = fileData.get(f);
      const s = scoreCandidate(d.text, info);
      const anchorChoices = [...s.matchedLines].sort((a,b)=>b.length-a.length).slice(0,3);
      const anchors = [];
      for (const a of anchorChoices) {
        const hits = lineHits(d.lines, a);
        anchors.push({text:a, line_hits:hits.slice(0,8), contexts:hits.slice(0,3).map(n=>context(d.lines,n,3))});
      }
      return {file:rel(appsDir,f), ...s, coverage:info.length ? Number((s.matched/info.length).toFixed(4)) : 0, anchors};
    }).sort((a,b)=> b.weighted-a.weighted || b.matched-a.matched || a.file.localeCompare(b.file));
    results.push({
      patch:h.patch,
      hunk:h.hunk,
      header:h.header,
      exact_match_count:exact.reduce((n,x)=>n+x.count,0),
      exact_matches:exact,
      informative_line_count:info.length,
      top_candidates:candidates.slice(0,2),
    });
  }
}

const expected = ordered.reduce((n,x)=>n+Number(x.expected_hunks),0);
if (results.length !== expected) throw new Error(`Expected ${expected} hunks, diagnosed ${results.length}`);
const report = {
  ok:true,
  mode:'SEC002_MODULAR_DIAGNOSTIC_READONLY_V1',
  apps_dir:appsDir,
  expected_hunks:expected,
  diagnosed_hunks:results.length,
  source_files:files.map(f=>rel(appsDir,f)),
  results,
};
fs.mkdirSync(path.dirname(reportPath),{recursive:true});
fs.writeFileSync(reportPath, JSON.stringify(report,null,2), 'utf8');

console.log('SEC002_MODULAR_DIAGNOSTIC_READONLY: PASS');
console.log(`DIAGNOSED_HUNKS=${results.length}`);
for (const r of results) {
  const c = r.top_candidates[0];
  const alt = r.top_candidates[1];
  console.log(`${r.patch}#${r.hunk} exact=${r.exact_match_count} best=${c.file} score=${c.weighted} coverage=${c.matched}/${c.total}` + (alt ? ` alt=${alt.file}:${alt.weighted}` : ''));
  for (const a of c.anchors.slice(0,2)) console.log(`  anchor lines=${a.line_hits.join(',') || '-'} :: ${a.text.slice(0,180)}`);
}
console.log(`REPORT=${reportPath}`);
