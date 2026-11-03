// F111 autopass5 · E1 static lazy manifest: no network, no institutional data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseF96LazyMap } from './lib/parse_f96_lazy_map.mjs';

const fixture = "const F96_LAZY = {\n dashboard: ['src/dashboard.jsx?v=1', 'src/ui.js'],\n teacher: ['src/teacher.jsx']\n};";
let checks = 0;
const good = parseF96LazyMap(fixture);
assert.deepEqual(Object.keys(good), ['dashboard', 'teacher']); checks++;
assert.deepEqual(good.dashboard, ['src/dashboard.jsx?v=1', 'src/ui.js']); checks++;
assert.equal(Object.getPrototypeOf(good), null); checks++;
function rejects(source, pattern) {
  assert.throws(() => parseF96LazyMap(source), pattern);
  checks++;
}
rejects('const F96_LAZY = {};', /closing delimiter|empty manifest/);
rejects(fixture.replace('teacher:', 'dashboard:'), /duplicate route/);
rejects(fixture.replace("'src/ui.js'", "'src/dashboard.jsx?v=1'"), /duplicate asset/);
rejects(fixture.replace("'src/ui.js'", "window.location.href"), /nonliteral asset/);
rejects(fixture.replace("'src/ui.js'", "'https://example.invalid/x.js'"), /invalid relative asset/);
rejects(fixture.replace("'src/ui.js'", "'../secrets.js'"), /invalid relative asset/);
rejects(fixture.replace("'src/ui.js'", "'src/\\u0061.js'"), /escaped or multiline asset/);
rejects(fixture.replace("const F96_LAZY =", "let F96_LAZY ="), /one declaration/);
rejects(fixture + '\n' + fixture, /one declaration/);
globalThis.__F111_LAZY_PARSER_EXECUTED__ = false;
rejects(fixture.replace("'src/ui.js'", '(globalThis.__F111_LAZY_PARSER_EXECUTED__ = true)'), /nonliteral asset/);
assert.equal(globalThis.__F111_LAZY_PARSER_EXECUTED__, false); checks++;

const source = fs.readFileSync(new URL('../src/app.jsx', import.meta.url), 'utf8');
const live = parseF96LazyMap(source);
assert.equal(Object.keys(live).length, 33, '33 canonical lazy routes'); checks++;
const refs = Object.values(live).flat();
assert.equal(refs.length, 68, '68 route references'); checks++;
assert.equal(new Set(refs.map(x => x.split(/[?#]/)[0])).size, 41, '41 unique files'); checks++;
assert(live.teacher_views.includes('src/vista_docente.jsx?v=F111ARCHIVESEP20261020')); checks++;
const audit = fs.readFileSync(new URL('./audit_delivery_surface.mjs', import.meta.url), 'utf8');
assert(audit.includes('parseF96LazyMap(app)') && !audit.includes('Function('), 'audit must not evaluate app.jsx'); checks++;
console.log('F111_AUTOPASS5_LAZY_STATIC_E1_PASS checks=' + checks + ' routes=33 refs=68 files=41');
