import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');
const OUT = path.resolve('qa/rel001_english_lab_frontend_endpoints.json');
const EXT = new Set(['.js', '.jsx']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return EXT.has(path.extname(entry.name).toLowerCase()) ? [full] : [];
  });
}

const files = walk(ROOT);
const endpointRe = /(['"`])(englishLab[A-Za-z0-9_]+)\1/g;
const byEndpoint = new Map();

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}
function classifyContext(text, start, end) {
  const before = text.slice(Math.max(0, start - 120), start);
  const after = text.slice(end, Math.min(text.length, end + 120));
  const window = before + text.slice(start, end) + after;
  const directCall = /(?:postLive|postAuthenticated|postStudent|postTeacher|postVentas|apPost|fetchJson|callApi|post)\s*\([^)]*englishLab/i.test(window);
  const fnParam = /(?:fn|endpoint|action)\s*[:=][^\n]{0,80}englishLab/i.test(window);
  const routeCompare = /(?:fn|endpoint|action)[^\n]{0,80}(?:===|==|includes|case)[^\n]{0,80}englishLab/i.test(window);
  return directCall ? 'direct_call' : fnParam ? 'endpoint_param' : routeCompare ? 'route_reference' : 'literal_reference';
}

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = endpointRe.exec(text))) {
    const endpoint = match[2];
    const rel = path.relative(process.cwd(), file).replaceAll('\\', '/');
    const callsite = {
      file: rel,
      line: lineNumber(text, match.index),
      kind: classifyContext(text, match.index, endpointRe.lastIndex),
    };
    if (!byEndpoint.has(endpoint)) byEndpoint.set(endpoint, []);
    byEndpoint.get(endpoint).push(callsite);
  }
}

const endpoints = [...byEndpoint.entries()]
  .map(([name, callsites]) => ({
    name,
    callsites: callsites.sort((a,b) => a.file.localeCompare(b.file) || a.line - b.line),
    kinds: [...new Set(callsites.map(x => x.kind))].sort(),
  }))
  .sort((a,b) => a.name.localeCompare(b.name));

const runtimeLikely = endpoints.filter(e => e.kinds.some(k => ['direct_call', 'endpoint_param'].includes(k)));
const manifest = {
  schema: 'REL001_FRONTEND_ENDPOINTS_V1',
  source_ref: process.env.GITHUB_SHA || null,
  scanned_root: 'src',
  file_count: files.length,
  literal_endpoint_count: endpoints.length,
  runtime_likely_count: runtimeLikely.length,
  endpoints,
  runtime_likely: runtimeLikely.map(e => e.name),
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`REL001 literal endpoints: ${manifest.literal_endpoint_count}`);
console.log(`REL001 runtime-likely endpoints: ${manifest.runtime_likely_count}`);
for (const e of endpoints) {
  console.log(`${e.name}\t${e.kinds.join(',')}\t${e.callsites.map(c => `${c.file}:${c.line}`).join(',')}`);
}
