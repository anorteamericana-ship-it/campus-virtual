import fs from 'node:fs';

const manualWorkflowPath = '.github/workflows/real-qa-authenticated-readonly-cs21a210bo.yml';
const registeredWorkflowPath = '.github/workflows/real-qa-staging-cs21a138.yml';
const runnerPath = 'scripts/real_qa_authenticated_readonly_cs21a210bo.mjs';
const manualWorkflow = fs.readFileSync(manualWorkflowPath, 'utf8');
const registeredWorkflow = fs.readFileSync(registeredWorkflowPath, 'utf8');
const runner = fs.readFileSync(runnerPath, 'utf8');

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const forbiddenMutations = /aplicarPago|registrarNotaEstatus|registrarEvaluacion|registrarAsistencia|cerrarLeccionCompleta/;

expect(/QA_EXECUTE_WRITES:\s*NO\b/.test(manualWorkflow), 'El workflow manual BO debe fijar QA_EXECUTE_WRITES=NO.');
expect(!/execute_writes\s*:/.test(manualWorkflow), 'El workflow manual BO no puede exponer input execute_writes.');
expect(/QA_EXECUTE_WRITES:\s*NO\b/.test(registeredWorkflow), 'El job autenticado del workflow registrado debe fijar QA_EXECUTE_WRITES=NO.');
expect(!/QA_BANK_DOCUMENT/.test(manualWorkflow), 'El workflow manual BO no debe consumir QA_BANK_DOCUMENT.');
expect(!/QA_BANK_DOCUMENT/.test(runner), 'El runner BO no debe conocer QA_BANK_DOCUMENT.');
expect(!forbiddenMutations.test(runner), 'El runner BO no puede contener funciones mutantes de pago/notas/asistencia/cierre.');
expect(/QA_STAGING_APPS_SCRIPT_URL/.test(runner), 'El runner BO debe exigir URL QA explícita.');
expect(/stagingUrl === productionUrl/.test(runner), 'El runner BO debe rechazar igualdad QA=PROD.');
expect(/\/\^QA-\//.test(runner), 'El runner BO debe exigir identidad de estudiante QA-.');
expect(/-99\\d\\d\$/.test(runner), 'El runner BO debe exigir grupo QA -99XX localmente.');
expect(/qaUsers\.some\(user => !\/\^qa_\/i\.test\(user\)\)/.test(runner), 'El runner BO debe exigir usuarios qa_ antes de transmitir credenciales.');
expect(/getJson\('getInfoGeneral'\)/.test(runner), 'El runner BO debe consultar getInfoGeneral antes del login.');
expect(/QA_STAGING_CS21A144/.test(runner), 'El runner BO debe exigir el marker QA nativo CS21A144.');
expect(/infoProbe\.data\.qa_staging === true/.test(runner), 'El runner BO debe exigir qa_staging=true.');
expect(/infoProbe\.data\.qa_ids_ok === true/.test(runner), 'El runner BO debe exigir qa_ids_ok=true.');
expect(/infoProbe\.data\.qa_properties_configured === true/.test(runner), 'El runner BO debe exigir qa_properties_configured=true.');
expect(!/groupPayload\.includes\(groupCode\)/.test(runner), 'El catálogo de grupos no debe usarse como prueba de identidad del entorno QA.');
expect(runner.indexOf("getJson('getInfoGeneral')") < runner.indexOf("postJson('iniciarSesion'"), 'La prueba QA nativa debe pasar antes del primer login.');

// El browser real debe probar el mismo gate de sesión del Campus y no capturar
// como éxito la pantalla transitoria de validación.
expect(/roleRead\('student', 'validarSesion'\)/.test(runner), 'Debe verificarse validarSesion con token estudiante.');
expect(/roleRead\('teacher', 'validarSesion'\)/.test(runner), 'Debe verificarse validarSesion con token docente.');
expect(/roleRead\('superadmin', 'validarSesion'\)/.test(runner), 'Debe verificarse validarSesion con token superadmin.');
expect(/timeout:\s*18000/.test(runner), 'El browser debe dar margen superior al timeout de 14 s de CampusGate.');
expect(/Validando tu sesi\[oó\]n/.test(runner), 'El browser debe detectar explícitamente el estado Validando tu sesión.');
expect(/appMounted/.test(runner) && /state\.appMounted/.test(runner), 'El browser debe exigir árbol principal montado.');
expect(/clickLabel:\s*'Libros y Audios'/.test(runner), 'Libros y Audios debe navegarse desde dashboard como el Campus real.');
expect(/scenario\.role === 'student' \? 'dashboard' : scenario\.route/.test(runner), 'El estudiante debe arrancar en dashboard antes de navegar.');

expect(/real_qa_authenticated_readonly_cs21a210bo\.mjs/.test(manualWorkflow), 'El workflow manual debe usar el runner BO especializado.');
expect(/real_qa_authenticated_readonly_cs21a210bo\.mjs/.test(registeredWorkflow), 'El workflow registrado debe usar el runner BO especializado para el job autenticado.');

if (failures.length) {
  console.error('CS21A210BO READONLY CONTRACT: FAILURE');
  failures.forEach(item => console.error(`- ${item}`));
  process.exit(1);
}

console.log('CS21A210BO READONLY CONTRACT: SUCCESS');
console.log('- runner BO especializado y sin superficie de escritura');
console.log('- URL QA explícita y PROD rechazada');
console.log('- identidades QA validadas localmente');
console.log('- proof nativo CS21A144 pasa antes de transmitir credenciales');
console.log('- validarSesion se prueba con los tres tokens antes del browser');
console.log('- browser espera CampusGate, exige App montada y navega Libros y Audios desde dashboard');
console.log('- workflow manual y workflow registrado usan el mismo runner read-only');
