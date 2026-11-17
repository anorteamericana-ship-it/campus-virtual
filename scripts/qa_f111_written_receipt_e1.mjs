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
