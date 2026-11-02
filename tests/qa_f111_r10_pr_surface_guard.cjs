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
/*
 * F111 R11: isolated release-candidate combines login PR #686
 * with ONLY the four permitted teacher-suspension paths from PR #685.
 * Other branches retain the login-only scope.
 */
const combinedReleaseCandidate = process.env.GITHUB_HEAD_REF ===
  'feat/f111-release-candidate-frontend-20261102';
if (combinedReleaseCandidate) {
  const teacherScope = [
    '.github/workflows/f111_teacher_suspension_preopen_e1.yml',
    'scripts/qa_f111_suspension_preopen_e1.mjs',
    'scripts/qa_vista_docente_safe_errors_cs21a210an.mjs',
    'src/vista_docente.jsx',
  ];
  for (const file of teacherScope) allowed.add(file);
}
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
const { unexpected, missing } = inspect(paths);
if (unexpected.length || missing.length) {
  console.error(JSON.stringify({ result: 'FAIL', unexpected, missing, changed: paths.length }));
  process.exit(1);
}
console.log(JSON.stringify({ result: 'PASS', changed: paths.length, unexpected: 0, missing: 0,
  scope: combinedReleaseCandidate ? 'login+teacher-suspension-only; no students, payments, docs, grades or attendance' : 'login-only; no student payments, docs, grades, or attendance' }));
