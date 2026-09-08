import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const must=(ok,msg)=>{ if(!ok) throw new Error(`BLOCK_C_GUARD_COVERAGE_FAIL: ${msg}`); };
const hash=p=>execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();

const guardPath='qa/apps_script_qa_guard_cs21a138.gs';
const vistaPath='src/vista_docente.jsx';
const adminPath='src/admin_students.jsx';

must(hash(guardPath)==='26a011034a64df9bf5e00d2cd48baa757f7e379d','historical QA guard blob drift');
must(hash(vistaPath)==='ec415d0ba2c1b52c56732cc6d09a11e026cbfbd4','vista_docente blob drift');

const guard=fs.readFileSync(guardPath,'utf8');
const vista=fs.readFileSync(vistaPath,'utf8');
const admin=fs.readFileSync(adminPath,'utf8');

for(const wrapped of ['aplicarPago','registrarNotaEstatus','registrarEvaluacion','registrarAsistencia','cerrarLeccionCompleta']) {
  must(guard.includes(`= ${wrapped};`),`expected historical wrapper missing ${wrapped}`);
}
for(const uncovered of ['crearInscripcionPublica','generarMatricula','reportarPago']) {
  must(!guard.includes(`= ${uncovered};`),`coverage assumption changed: ${uncovered} is now wrapped in historical guard`);
}

must(guard.includes('var asistencia = body && body.asistencias || {};'),'C3 historical guard no longer uses asistencia map as expected');
must(guard.includes('var codes = Object.keys(asistencia);'),'C3 historical guard key check changed');
must(!guard.includes('Object.keys(body.retroalimentacion'),'historical guard now validates retroalimentacion; update audit');
must(!guard.includes('Object.keys(body.progress_check'),'historical guard now validates progress_check; update audit');
for(const token of ['asistencias,','retroalimentacion,','progress_check,']) must(vista.includes(token),`C3 frontend payload token missing ${token}`);

must(guard.includes("code.indexOf('QA-') !== 0"),'student QA prefix guard missing');
must(guard.includes("!/-99\\d\\d$/.test(group)"),'group QA suffix guard missing');
must(guard.includes("String(body.doc || body.documento || '').trim().toUpperCase().indexOf('QA') !== 0"),'aplicarPago QA doc guard missing');

must(admin.includes("postAdminStudents('registrarNotaComponenteOficial', payload)"),'C4 admin primary grade endpoint missing');
must(admin.includes("postAdminStudents('registrarNotaEstatus', { ...payload, nota: puntosCalc })"),'C4 admin fallback endpoint missing');

const doc=fs.readFileSync('00_DOCUMENTACION/BLOQUE_C_E4_GUARD_COVERAGE_2026-09-08.md','utf8');
for(const marker of ['C1 · crearInscripcionPublica + generarMatricula','C2 · reportarPago + aplicarPago','C3 · cerrarLeccionCompleta','C4 · registrarNotaEstatus','P1 · RIESGO CONFIRMADO DEL GUARD HISTÓRICO · E0','E4: **NO**']) must(doc.includes(marker),`documentation marker missing ${marker}`);

console.log('BLOCK C E4 GUARD COVERAGE PASS');
console.log('C1_GUARD_HISTORICAL=UNCOVERED');
console.log('C2_REPORT_GUARD_HISTORICAL=UNCOVERED');
console.log('C3_IDENTITY_MAP_COVERAGE=INCOMPLETE');
console.log('C4_HISTORICAL_IDENTITY_GROUP_GUARD=PRESENT');
console.log('E4=STOP');
