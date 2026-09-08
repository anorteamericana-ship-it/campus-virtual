import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const must=(ok,msg)=>{if(!ok) throw new Error(`C2_C4_ROLLBACK_COVERAGE_FAIL: ${msg}`)};
const hash=p=>execFileSync('git',['hash-object',p],{encoding:'utf8'}).trim();
const frozen={
  'scripts/real_qa_authenticated_cs21a138.mjs':'e3e13af0123fe8af58ca1e8bd91f98847856e45e',
  'qa/apps_script_qa_guard_cs21a138.gs':'26a011034a64df9bf5e00d2cd48baa757f7e379d',
  'src/ventas_drawer.jsx':'273ab0a22fa8b03ab5e3821c20ee742dea4b4668',
  'src/aplicar_pago.jsx':'5f67af62d0551a130a2af2f438b626eaa7ee4bd2',
};
for(const [p,h] of Object.entries(frozen)) must(hash(p)===h,`preimage drift ${p}`);
const real=fs.readFileSync('scripts/real_qa_authenticated_cs21a138.mjs','utf8');
const guard=fs.readFileSync('qa/apps_script_qa_guard_cs21a138.gs','utf8');
const ventas=fs.readFileSync('src/ventas_drawer.jsx','utf8');
const apply=fs.readFileSync('src/aplicar_pago.jsx','utf8');

for(const token of ["doc: process.env.QA_BANK_DOCUMENT","cod_estudiante: process.env.QA_STUDENT_CODE","monto_total: 20000","request_id: 'QA-CS21A138-PAGO-MATRICULA-001'","rubros: [{ tipo: 'MATRICULA', nivel: 'B1', monto: 20000, grupo: process.env.QA_GROUP_CODE }]","repeatedPayment.data.idempotent === true"]) must(real.includes(token),`historical payment contract changed: ${token}`);
for(const token of ["tipo_eval: 'ORAL_1'","nota: 12","leccion_num: 9","registrado_por: 'QA DOCENTE'"]) must(real.includes(token),`historical grade contract changed: ${token}`);
must(!real.includes("post('cerrarLeccionCompleta'"),'historical harness unexpectedly started closing lessons');
must(!/rollback|restoreSnapshot|cleanupWriteFixture|deleteQaFixture/i.test(real),'historical harness now contains rollback logic; re-audit classification');

for(const token of ['numero_comprobante: numComp.trim()','monto_reportado: parseFloat(monto)','foto_base64:','foto_mime: foto.type',"const res = await window.reportarPago(body)"]) must(ventas.includes(token),`reportarPago payload changed: ${token}`);
const reportBlock=ventas.slice(ventas.indexOf('function ReportarPagoModal'),ventas.indexOf('// ──',ventas.indexOf('function ReportarPagoModal')+20));
must(!/request_id|idempot/i.test(reportBlock),'reportarPago now has idempotency marker; re-audit');
must(apply.includes("request_id:     requestIdRef.current"),'aplicarPago request_id missing');

must(guard.includes('var asistencia = body && body.asistencias || {};'),'C3 historical guard attendance boundary changed');
must(!guard.slice(guard.indexOf('var _qaCerrarLeccionBaseCS21A138_'),guard.indexOf('} catch (_) {}',guard.indexOf('var _qaCerrarLeccionBaseCS21A138_'))).includes('retroalimentacion'),'C3 guard now validates retroalimentacion; re-audit');
must(!guard.slice(guard.indexOf('var _qaCerrarLeccionBaseCS21A138_'),guard.indexOf('} catch (_) {}',guard.indexOf('var _qaCerrarLeccionBaseCS21A138_'))).includes('progress_check'),'C3 guard now validates progress_check; re-audit');

const report=fs.readFileSync('00_DOCUMENTACION/C2_C4_ROLLBACK_COVERAGE_2026-09-08.md','utf8');
for(const marker of ['HISTORICAL_WRITE_HARNESS_NOT_ROLLBACK_SAFE_FOR_BLOCK_C','C0 continúa `BLOQUEADO_HUMANO`','C1–C4 continúan `E4 STOP`']) must(report.includes(marker),`report marker missing ${marker}`);
console.log('C2-C4 rollback coverage audit PASS');
console.log('HISTORICAL_HARNESS_ROLLBACK_SAFE=NO');
console.log('C2_C3_C4_E4=STOP');
