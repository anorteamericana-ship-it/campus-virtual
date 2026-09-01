import fs from 'node:fs';

const workflowPath = '.github/workflows/real-qa-authenticated-readonly-cs21a210bo.yml';
const runnerPath = 'scripts/real_qa_authenticated_cs21a138.mjs';
const workflow = fs.readFileSync(workflowPath, 'utf8');
const runner = fs.readFileSync(runnerPath, 'utf8');

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

expect(/QA_EXECUTE_WRITES:\s*NO\b/.test(workflow), 'El workflow BO debe fijar QA_EXECUTE_WRITES=NO.');
expect(!/execute_writes\s*:/.test(workflow), 'El workflow BO no puede exponer input execute_writes.');
expect(/QA_BANK_DOCUMENT:\s*CS21A210BO_READONLY_UNUSED\b/.test(workflow), 'El workflow BO debe usar sentinel no sensible para QA_BANK_DOCUMENT en modo readonly.');
expect(/required=\(QA_STAGING_APPS_SCRIPT_URL QA_STUDENT_USER QA_STUDENT_PASS QA_TEACHER_USER QA_TEACHER_PASS QA_SUPERADMIN_USER QA_SUPERADMIN_PASS QA_STUDENT_CODE QA_GROUP_CODE\)/.test(workflow), 'El preflight readonly debe exigir solo URL + identidades/códigos de lectura.');
expect(!/required=\([^\n]*QA_BANK_DOCUMENT/.test(workflow), 'QA_BANK_DOCUMENT no puede ser requisito del preflight readonly.');
expect(/test "\$\{QA_EXECUTE_WRITES\}" = "NO"/.test(workflow), 'Debe existir una segunda sentinel que pruebe writes deshabilitados.');
expect(/const executeWrites = process\.env\.QA_EXECUTE_WRITES === 'CS21A138_STAGING_ONLY';/.test(runner), 'El runner heredado debe conservar el guard exacto de writes.');
expect(/if \(executeWrites\) \{/.test(runner), 'El bloque mutante debe seguir condicionado por executeWrites.');
expect(/doc: process\.env\.QA_BANK_DOCUMENT/.test(runner), 'QA_BANK_DOCUMENT debe permanecer confinado al payload de pago mutante.');

if (failures.length) {
  console.error('CS21A210BO READONLY CONTRACT: FAILURE');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('CS21A210BO READONLY CONTRACT: SUCCESS');
console.log('- workflow manual exclusivamente read-only');
console.log('- sin input de writes');
console.log('- QA_BANK_DOCUMENT no es secreto requerido para E2 read-only');
console.log('- runner mutante sigue detrás de CS21A138_STAGING_ONLY');
