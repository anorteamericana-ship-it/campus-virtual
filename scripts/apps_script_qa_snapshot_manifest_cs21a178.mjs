import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}
function flag(name) { return process.argv.includes(name); }
function walk(root) {
  const out = [];
  for (const ent of fs.readdirSync(root, { withFileTypes: true })) {
    if (ent.name === '.clasp.json' || ent.name === 'node_modules') continue;
    const full = path.join(root, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else if (ent.isFile() && (ent.name === 'appsscript.json' || /\.(?:js|gs|html)$/i.test(ent.name))) out.push(full);
  }
  return out.sort((a, b) => a.localeCompare(b));
}
function rel(root, p) { return path.relative(root, p).replaceAll('\\', '/'); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function lineNumbers(text, re) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const hits = [];
  lines.forEach((line, idx) => { if (re.test(line)) hits.push(idx + 1); re.lastIndex = 0; });
  return hits;
}

const sourceDir = path.resolve(arg('--source-dir'));
const output = path.resolve(arg('--output'));
const scriptId = arg('--script-id');
const minFiles = Number(arg('--min-files', '0')) || 0;
const expectBaseline = flag('--expect-baseline');
if (!sourceDir || !fs.existsSync(sourceDir)) throw new Error('Missing/invalid --source-dir');
if (!output) throw new Error('Missing --output');

const files = walk(sourceDir);
if (!files.length) throw new Error('Apps Script snapshot has no source files');
if (minFiles && files.length < minFiles) throw new Error(`Apps Script snapshot too small: ${files.length} < ${minFiles}`);

const requiredBasenames = [
  '01_Router.js',
  '44_English_LAB_Live_Base.js',
  '95_English_LAB_CS21A144_Al_Dia.js',
  '99_QA_Staging_Guard.js',
];
const baseNames = new Set(files.map(f => path.basename(f)));
const missingRequired = requiredBasenames.filter(x => !baseNames.has(x));
if (expectBaseline && missingRequired.length) {
  throw new Error(`QA modular baseline drift: missing ${missingRequired.join(', ')}`);
}

const rows = [];
const doPost = [];
for (const file of files) {
  const buf = fs.readFileSync(file);
  const text = buf.toString('utf8').replace(/^\uFEFF/, '');
  const relative = rel(sourceDir, file);
  const lineCount = text === '' ? 0 : text.split(/\r\n|\r|\n/).length;
  rows.push({ path: relative, bytes: buf.length, lines: lineCount, sha256: sha256(buf) });

  if (/\bdoPost\b/.test(text)) {
    const directDefinitionLines = lineNumbers(text, /\bfunction\s+doPost\s*\(/g);
    const assignmentDefinitionLines = lineNumbers(text, /\bdoPost\s*=\s*(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*)/g);
    const referenceLines = lineNumbers(text, /\bdoPost\b/g);
    doPost.push({
      path: relative,
      direct_definition_lines: directDefinitionLines,
      assignment_definition_lines: assignmentDefinitionLines,
      reference_lines: referenceLines,
      reference_count: referenceLines.length,
    });
  }
}

const manifestSeed = rows.map(r => `${r.path}\t${r.bytes}\t${r.sha256}`).join('\n');
const manifest = {
  schema: 'CAMPUS_APPS_SCRIPT_QA_SNAPSHOT_1',
  generated_at_utc: new Date().toISOString(),
  mode: 'READ_ONLY_CLASP_CLONE',
  script_id: scriptId || null,
  source_file_count: rows.length,
  source_total_bytes: rows.reduce((n, r) => n + r.bytes, 0),
  aggregate_sha256: sha256(Buffer.from(manifestSeed, 'utf8')),
  baseline: {
    minimum_source_files: minFiles || null,
    required_basenames: requiredBasenames,
    missing_required_basenames: missingRequired,
  },
  do_post_inventory: doPost,
  files: rows,
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(`APPS_SCRIPT_QA_SNAPSHOT_MANIFEST: PASS files=${rows.length} doPostFiles=${doPost.length}`);
console.log(`AGGREGATE_SHA256=${manifest.aggregate_sha256}`);
console.log(`OUTPUT=${output}`);
