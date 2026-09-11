import fs from 'node:fs';

const must = (ok, msg) => {
  if (!ok) throw new Error(`C2_PAYMENT_CONTRACT_FAIL: ${msg}`);
};

const read = (path) => fs.readFileSync(path, 'utf8');
const ventas = read('src/ventas_drawer.jsx');
const aplicar = read('src/aplicar_pago.jsx');
const inline = read('src/admin_students_inline_payment_cs21a36.jsx');
const historical = read('scripts/real_qa_authenticated_cs21a138.mjs');

const reportStart = ventas.indexOf('function ReportarPagoModal');
must(reportStart >= 0, 'ReportarPagoModal missing');
const reportEndCandidate = ventas.indexOf('\nfunction ', reportStart + 30);
const reportBlock = ventas.slice(reportStart, reportEndCandidate > reportStart ? reportEndCandidate : ventas.length);

for (const token of [
  'numero_comprobante: numComp.trim()',
  'monto_reportado: parseFloat(monto)',
  'foto_base64:',
  'foto_mime: foto.type',
  'window.reportarPago(body)',
]) {
  must(reportBlock.includes(token), `reportarPago contract changed: ${token}`);
}
must(!/request_id|idempot/i.test(reportBlock), 'reportarPago gained idempotency marker; re-audit before changing E4 policy');

for (const token of [
  "fn:             'aplicarPago'",
  'request_id:     requestIdRef.current',
  'monto_total:    total',
]) {
  must(aplicar.includes(token), `aplicarPago contract changed: ${token}`);
}
must(aplicar.includes("requestIdRef.current = '';"), 'aplicarPago success reset missing');

must(inline.includes("if(!requestIdRef.current)requestIdRef.current=requestId();"), 'inline payment request_id creation missing');
must(inline.includes("postInline('aplicarPago',{request_id:requestIdRef.current"), 'inline aplicarPago request_id missing');
must(inline.includes("requestIdRef.current=''"), 'inline payment success reset missing');

for (const token of [
  "request_id: 'QA-CS21A138-PAGO-MATRICULA-001'",
  'repeatedPayment.data.idempotent === true',
]) {
  must(historical.includes(token), `historical aplicarPago replay evidence changed: ${token}`);
}
must(!/restoreSnapshot|rollbackPayment|rollbackPago|cleanupPaymentFixture|restoreFinancialState/i.test(historical), 'historical harness now contains payment rollback; re-audit before keeping STOP');

console.log('C2 payment contract main rebase PASS');
console.log('REPORTAR_PAGO_IDEMPOTENT=NO');
console.log('APLICAR_PAGO_REQUEST_ID=YES');
console.log('APLICAR_PAGO_REPLAY_EVIDENCE=HISTORICAL_E1');
console.log('APLICAR_PAGO_ROLLBACK_DEMONSTRATED=NO');
console.log('C2_E4=STOP');
