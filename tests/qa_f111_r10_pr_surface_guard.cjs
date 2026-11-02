'use strict';
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const allowed = new Set([
  '.github/workflows/f111_login_fast_qa.yml',
  'login.html',
  'scripts/build_login_fast.cjs',
  'scripts/qa_f111_login_unico_ui.mjs',
  'src/data.login.compiled.js',
  'src/login.compiled.js',
  'src/login.jsx',
  'tests/qa_f111_login_fast.cjs',
  'tests/qa_f111_r10_pr_surface_guard.cjs',
]);
function inspect(paths) {
  return {
    unexpected: paths.filter((path) => !allowed.has(path)),
    missing: [...allowed].filter((path) => !paths.includes(path)),
  };
}
assert.deepEqual(inspect([...allowed]).unexpected, []);
assert.deepEqual(inspect([...allowed, 'src/admin_students.jsx']).unexpected, ['src/admin_students.jsx']);
assert.deepEqual(inspect([...allowed, '00_DOCUMENTACION/PRODUCTION_STATE.md']).unexpected,
  ['00_DOCUMENTACION/PRODUCTION_STATE.md']);
// El guard protege la superficie permitida tanto en el PR inicial de 9
// archivos como en hotfixes apilados que solo cambian un subconjunto.
function unpairedArtifacts(paths) {
  return [
    ['src/login.jsx', 'src/login.compiled.js'],
    ['src/data.jsx', 'src/data.login.compiled.js'],
  ].filter(([source, compiled]) => paths.includes(source) !== paths.includes(compiled));
}
assert.deepEqual(unpairedArtifacts(['src/login.jsx', 'src/login.compiled.js']), []);
assert.equal(unpairedArtifacts(['src/login.jsx']).length, 1);
const base = process.argv[2] || process.env.F111_BASE_SHA;
if (!/^[0-9a-f]{40}$/.test(base || '')) {
  console.error('F111_R10_SCOPE_GUARD_NO_BASE_SHA');
  process.exit(2);
}
let output;
try {
  output = execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRT', base, 'HEAD'], {
    encoding: 'utf8', maxBuffer: 1024 * 1024,
  });
} catch (error) {
  console.error('F111_R10_SCOPE_GUARD_GIT_ERROR:', error.message);
  process.exit(2);
}
const paths = output.trim() ? output.trim().split(/\r?\n/) : [];
const { unexpected } = inspect(paths);
const unpaired = unpairedArtifacts(paths);
if (unexpected.length || !paths.length || unpaired.length) {
  console.error(JSON.stringify({ result: 'FAIL', unexpected, unpaired, changed: paths.length }));
  process.exit(1);
}
console.log(JSON.stringify({ result: 'PASS', changed: paths.length, unexpected: 0, unpaired: 0,
  scope: 'login-only; source/compiled paired; no student payments, docs, grades, or attendance' }));
