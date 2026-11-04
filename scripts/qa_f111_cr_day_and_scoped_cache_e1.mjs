// F111 — Costa Rica civil-day boundaries + exact scoped cache triage, synthetic E1.
// This suite reads code only and never calls Apps Script or touches real student records.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(path, 'utf8');
const dashboard = read('src/student_dashboard.jsx');
const calendar = read('src/cronograma_grupo.jsx');
const app = read('src/app.jsx');
const staticQA = read('scripts/virtual_review_static.mjs');
const html = read('campus.html');

function extractPureFunction(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing ' + name);
  const end = source.indexOf('\n}', start);
  assert(end > start, 'function boundary ' + name);
  return vm.runInNewContext(source.slice(start, end + 2) + '\n' + name, { Intl, Date, Object });
}
const studentToday = extractPureFunction(dashboard, 'fechaHoyAcademiaF111');
const calendarToday = extractPureFunction(calendar, 'hoyCostaRicaCG');
const boundaries = [
  ['2026-11-05T01:15:00Z', '2026-11-04', 'evening after 6pm CR is still Nov 4'],
  ['2026-11-05T05:59:59Z', '2026-11-04', 'one second before midnight CR'],
  ['2026-11-05T06:00:00Z', '2026-11-05', 'midnight Costa Rica'],
  ['2027-01-01T05:59:59Z', '2026-12-31', 'year rollover before midnight CR'],
  ['2027-01-01T06:00:00Z', '2027-01-01', 'year rollover after midnight CR'],
];
for (const [instant, expected, why] of boundaries) {
  const date = new Date(instant);
  assert.equal(studentToday(date), expected, 'dashboard: ' + why);
  assert.equal(calendarToday(date), expected, 'calendar: ' + why);
}
assert.equal(dashboard.split('const todayIso = fechaHoyAcademiaF111();').length - 1, 2,
  'both student progress and attendance/grades use civil day');
assert.equal(dashboard.split('new Date().toISOString().slice(0,10)').length - 1, 0,
  'no stale UTC current-day calculation in student dashboard');
assert.equal(calendar.split('hoyCostaRicaCG()').length - 1, 2,
  'two calendar today comparisons use Costa Rica day');
assert(calendar.includes('function isoOf(d) { return d.toISOString().slice(0,10); }'),
  'date-grid serialization is unchanged; no academic schedule rewrite');
assert.equal(app.split('&crday=F111CRDAY20261104A').length - 1, 4,
  'dashboard + three calendar lazy routes refreshed');
assert.equal(html.split('&crday=F111CRDAY20261104A').length - 1, 1,
  'HTML updates only app script entrypoint');

const mapMatch = app.match(/const\s+F96_LAZY\s*=\s*(\{[\s\S]*?\n\};)/);
assert(mapMatch, 'app lazy manifest available');
const lazyMap = vm.runInNewContext('(' + mapMatch[1].replace(/;\s*$/, '') + ')');
const sourceStart = staticQA.indexOf('const scopedVersions = Object.freeze({');
const sourceEnd = staticQA.indexOf('for (const { source, file, refs } of refsBySurfaceAndFile.values())', sourceStart);
assert(sourceStart >= 0 && sourceEnd > sourceStart, 'reviewed scoped-cache contract found');
const contractSource = staticQA.slice(sourceStart, sourceEnd);
const cleanRef = value => String(value || '').split('#')[0].split('?')[0];
function guardWithMap(map) {
  return vm.runInNewContext(contractSource + '\n({scopedVersions,isReviewedScopedCache})',
    {lazyMap:map,cleanRef,Set,Object});
}
const {scopedVersions,isReviewedScopedCache} = guardWithMap(lazyMap);
const rules = Object.entries(scopedVersions);
assert.equal(rules.length,4,'only four documented and exact student-scoped versions');
for(const [file, rule] of rules) {
  const allowed = new Set([rule.base,rule.studentUrl || (rule.base + rule.suffix)]);
  assert(isReviewedScopedCache('src/app.jsx · F96_LAZY',file,allowed),
    'only exact scoped student and existing legacy route versions accepted: ' + file);
}
const mutated = JSON.parse(JSON.stringify(lazyMap));
const calendarIndex = mutated.student_course.findIndex(url=>cleanRef(url)==='src/cronograma_grupo.jsx');
assert(calendarIndex>=0,'calendar student route exists');
mutated.student_course[calendarIndex] = scopedVersions['src/cronograma_grupo.jsx'].base;
const tamper = guardWithMap(mutated);
const rule = scopedVersions['src/cronograma_grupo.jsx'];
assert.equal(tamper.isReviewedScopedCache('src/app.jsx · F96_LAZY','src/cronograma_grupo.jsx',
  new Set([rule.base,rule.studentUrl || (rule.base + rule.suffix)])),false,
  'student route losing scoped version must remain a P2');
assert.equal(isReviewedScopedCache('campus.html','src/cronograma_grupo.jsx',
  new Set([rule.base,rule.studentUrl || (rule.base + rule.suffix)])),false,
  'whitelist may never hide unexpected version differences in HTML');

console.log('F111 CR DAY + CACHE SCOPE E1 PASS: 10 date boundary assertions, 4 exact approved cache pairs, unexpected variants remain P2, zero backend writes.');
