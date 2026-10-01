import fs from 'node:fs';

const runner = fs.readFileSync('scripts/real_qa_sales_e2_cs21a170.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/qa-sales-e2-staging-cs21a170.yml', 'utf8');
const failures = [];
const check = (ok, message) => ok ? console.log(`PASS: ${message}`) : failures.push(message);

check(runner.includes("if (stagingUrl === prodMatch[1]) throw new Error('BLOQUEADO: la URL de staging coincide con producción.')"), 'runner bloquea URL productiva');
check(runner.includes("qa.marker === 'QA_STAGING_CS21A138'"), 'runner exige marcador QA canónico');
check(runner.includes('qa.writes_guarded === true'), 'runner exige writes_guarded=true');
check(runner.includes("process.env.QA_SALES_EXECUTE_WRITES === 'CS21A170_STAGING_ONLY'"), 'writes requieren sentinel explícito');
check(runner.includes("writeConfirmation !== 'CS21A170_STAGING_ONLY'"), 'writes requieren confirmación separada');
check(runner.includes("'foreign_prospect_detail_denied'"), 'runner prueba lectura ajena denegada');
check(runner.includes("'own_note_allowed'"), 'runner prueba mutación propia permitida');
check(runner.includes("'foreign_note_denied'"), 'runner prueba mutación ajena denegada');
check(runner.includes("'sales_activation_denied'"), 'runner prueba activación denegada para Sales');
check(!runner.includes('console.log(process.env.QA_SALES_PASS'), 'runner no imprime contraseña Sales');
check(!runner.includes('console.log(token'), 'runner no imprime token');

check(workflow.includes('workflow_dispatch:'), 'workflow requiere dispatch manual para E2');
check(workflow.includes("if: github.event_name == 'workflow_dispatch' && inputs.authenticated == true"), 'job autenticado no corre en pull_request');
check(workflow.includes('default: false'), 'inputs peligrosos están apagados por defecto');
check(workflow.includes('QA_SALES_USER: ${{ secrets.QA_SALES_USER }}'), 'usuario Sales proviene de secret');
check(workflow.includes('QA_SALES_PASS: ${{ secrets.QA_SALES_PASS }}'), 'contraseña Sales proviene de secret');
check(workflow.includes('QA_SALES_OWN_PROSPECT_CEDULA: ${{ secrets.QA_SALES_OWN_PROSPECT_CEDULA }}'), 'prospecto propio QA proviene de secret');
check(workflow.includes('QA_SALES_FOREIGN_PROSPECT_CEDULA: ${{ secrets.QA_SALES_FOREIGN_PROSPECT_CEDULA }}'), 'prospecto ajeno QA proviene de secret');
check(workflow.includes("QA_SALES_EXECUTE_WRITES: ${{ inputs.execute_writes && 'CS21A170_STAGING_ONLY' || 'NO' }}"), 'workflow traduce write opt-in a sentinel');
check(workflow.includes('Refuse incomplete Sales secret set'), 'workflow falla cerrado con secretos incompletos');

if (failures.length) {
  console.error('QA SALES E2 CONTRACT CS21A170 FAIL');
  failures.forEach(item => console.error('-', item));
  process.exit(1);
}
console.log('QA SALES E2 CONTRACT CS21A170 PASS');
