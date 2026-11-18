// F111 RECEIPT-01 · contrato de descarga real, pero pruebas sin Apps Script.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const modes=fs.readFileSync('src/examenes_modes.jsx','utf8');
const app=fs.readFileSync('src/examenes_app.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const start=modes.indexOf('function SentCard({');
const end=modes.indexOf('// ════════════════════════════════════════════════════════════════',start);
assert.ok(start>0&&end>start,'SentCard se localiza');
const sent=modes.slice(start,end);
assert.ok(bundle.includes(sent),'motor de descarga coincidente con bundle');
assert.ok(sent.includes('data-f111-written-receipt-download="true"'),
 'botón solo en entrega ya confirmada');
assert.ok(sent.includes("String(r.attempt_id||'') !== String(attemptId)"),
 'debe comparar el ID del servidor con el intento activo');
assert.ok(sent.includes("r.mime !== 'application/pdf'"),
 'rechazar tipo distinto de PDF');
assert.ok(sent.includes("binary.slice(0,4) !== '%PDF'"),
 'verificar firma PDF');
assert.ok(sent.includes("URL.revokeObjectURL(url)"),
 'liberar archivo temporal local');
assert.ok(sent.includes("No pudimos descargar el recibo. Tu entrega permanece registrada;"),
 'fallo de PDF no revierte entrega');
assert.ok(!sent.includes("setStage('taking')"),
 'no reabre intento por error de documento');
const a=app.indexOf('  const getWrittenReceipt = async (id) => {');
const b=app.indexOf('  if (loading) return <StudentLiveLoading />;',a);
assert.ok(a>0&&b>a);
const getReceipt=app.slice(a,b);
assert.ok(bundle.includes(getReceipt),'aplicación y bundle sincronizados');
assert.ok(getReceipt.includes("examPostLive('examGetStudentWrittenReceiptPdf', { attempt_id:id })"),
 'lectura desde backend autenticado');
assert.ok(getReceipt.includes("String(id) !== String(attemptId)"),
 'no permite pedir recibo de otro intento desde este componente');
assert.ok(modes.includes("onGetReceipt={backend && backend.onGetReceipt}"),
 'solo etapa enviada muestra la opción');
assert.ok(app.includes("onGetReceipt:getWrittenReceipt,")&&bundle.includes("onGetReceipt:getWrittenReceipt,"),
 'callback llega realmente a StudentMode');
console.log('F111 RECEIPT-01 FRONT PASS: entrega, ID, PDF, blob privado, bundle');


// F111 FINAL-01: el informe de nota firme SOLO se descarga mediante endpoint
// student autenticado. Paridad de motor y bundle, sin clave ni cálculo browser.
const finalMode=[
  'data-f111-written-final-report="true"',
  'onGetFinalReport={backend && backend.onGetFinalReport}',
  'const downloadFinalReport = async () =>',
  "String(r.attempt_id||'') !== String(attemptId)",
  "r.mime !== 'application/pdf'",
  "binary.slice(0,4)!=='%PDF'",
  "onGetFinalReport(attemptId)"
];
for(const marker of finalMode){
  assert.ok(modes.includes(marker),'FINAL-01: falta en motor: '+marker);
  assert.ok(bundle.includes(marker),'FINAL-01: falta en bundle: '+marker);
}
const finalApp=app.indexOf('  const getWrittenFinalReport = async (id) => {');
const endFinalApp=app.indexOf('  if (loading) return <StudentLiveLoading />;',finalApp);
assert.ok(finalApp>0&&endFinalApp>finalApp,'callback en app');
const finalCb=app.slice(finalApp,endFinalApp);
assert.ok(finalCb.includes("String(id) !== String(attemptId)"),'ID no intercambiable');
assert.ok(finalCb.includes("examPostLive('examGetStudentWrittenFinalReportPdf', { attempt_id:id })"),
  'backend oficial autenticado');
assert.ok(bundle.includes(finalCb),'callback final sincronizado en bundle');
assert.ok(app.includes('onGetFinalReport:getWrittenFinalReport,') &&
  bundle.includes('onGetFinalReport:getWrittenFinalReport,'),
  'conexión hasta StudentMode');
assert.ok(!modes.slice(start,end).includes("setStage('taking')"),
  'consultar el PDF no reabre un intento');
console.log('F111 FINAL-01 FRONT PASS: circuito documento sin nota del navegador, solo intento del alumno');
