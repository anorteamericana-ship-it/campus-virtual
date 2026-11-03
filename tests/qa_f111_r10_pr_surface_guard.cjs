'use strict';
// F111 R10 — revisión de superficie para TODAS las actualizaciones del login.
// La entrega inicial incluyó 9 archivos, pero no deben exigirse los mismos 9
// en cada hotfix posterior. Siempre se bloquean cambios fuera del login.
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
  const changed = new Set(paths);
  const unexpected = paths.filter(p => !allowed.has(p));
  const mismatch = changed.has('src/login.jsx') !== changed.has('src/login.compiled.js')
    ? ['src/login.jsx', 'src/login.compiled.js'] : [];
  return { unexpected, mismatch };
}
assert.deepEqual(inspect([...allowed]).unexpected, []);
assert.deepEqual(inspect([...allowed, 'src/admin_students.jsx']).unexpected, ['src/admin_students.jsx']);
assert.deepEqual(inspect([...allowed, '00_DOCUMENTACION/PRODUCTION_STATE.md']).unexpected,
  ['00_DOCUMENTACION/PRODUCTION_STATE.md']);
assert.deepEqual(inspect(['src/login.jsx','src/login.compiled.js']).mismatch, []);
assert.deepEqual(inspect(['src/login.jsx']).mismatch, ['src/login.jsx','src/login.compiled.js']);
assert.deepEqual(inspect(['src/login.compiled.js']).mismatch, ['src/login.jsx','src/login.compiled.js']);
const base = process.argv[2] || process.env.F111_BASE_SHA;
if (!/^[0-9a-f]{40}$/.test(base || '')) {
  console.error('F111_R10_SCOPE_GUARD_NO_BASE_SHA'); process.exit(2);
}
let output;
try {
  output = execFileSync('git', ['diff','--name-only','--diff-filter=ACMRT',base,'HEAD'], {
    encoding:'utf8',maxBuffer:1024*1024,
  });
} catch (error) {
  console.error('F111_R10_SCOPE_GUARD_GIT_ERROR:',error.message); process.exit(2);
}
const paths = output.trim() ? output.trim().split(/\r?\n/) : [];
const { unexpected, mismatch } = inspect(paths);
if (!paths.length || unexpected.length || mismatch.length) {
  console.error(JSON.stringify({result:'FAIL',unexpected,mismatch,changed:paths.length}));
  process.exit(1);
}
console.log(JSON.stringify({result:'PASS',changed:paths.length,unexpected:0,mismatch:0,
 scope:'login-only; JSX+compiled stay synchronized; no finance/academic files'}));
