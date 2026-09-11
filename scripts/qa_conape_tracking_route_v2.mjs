import assert from 'node:assert/strict';
import { trackingQueryV2 } from '../services/conape-bridge/conape_tracking_route_v2.mjs';

const html = `
<table>
<thead><tr><th>Cédula</th><th>Estado</th><th>Fecha de estado</th><th>Fecha de registro</th><th>Usuario que registró</th></tr></thead>
<tbody>
<tr><td>1-1111-1111</td><td>CONFIRMADO</td><td>11/09/2026</td><td>10/09/2026</td><td>operador-demo</td></tr>
<tr><td>2-2222-2222</td><td>CREÓ CUENTA</td><td>11/09/2026</td><td>10/09/2026</td><td>fuera-demo</td></tr>
</tbody>
</table>`;

let sessionCalls = 0;
let campusCalls = 0;
let homeReads = 0;
const result = await trackingQueryV2({
  body:{ token:'synthetic-token', cedulas:['1-1111-1111','2-2222-2222'] },
  authorizeSession:async token => {
    sessionCalls += 1;
    assert.equal(token, 'synthetic-token');
    return { token, session:{ rol:'VENTAS' } };
  },
  campusCall:async payload => {
    campusCalls += 1;
    assert.equal(payload.fn, 'getProspectoDetalle');
    if (payload.cedula === '111111111') return { ok:true, prospecto:{ cedula:'1-1111-1111', financiamiento:'CONAPE' } };
    return { ok:true, prospecto:{ cedula:'2-2222-2222', financiamiento:'PROPIO' } };
  },
  extractCedula:p => p.cedula,
  extractFinancing:p => p.financiamiento,
  readHomeHtml:async () => { homeReads += 1; return html; },
  capturedAt:'2026-09-11T10:00:00.000Z',
});

assert.equal(sessionCalls, 1);
assert.equal(campusCalls, 2);
assert.equal(homeReads, 1);
assert.equal(result.ok, true);
assert.equal(result.records.length, 1);
assert.equal(result.records[0].cedula, '111111111');
assert.equal(result.records[0].estado_raw, 'CONFIRMADO');
assert.equal(result.records.some(row => row.cedula === '222222222'), false, 'fuera de alcance no debe cruzar la ruta');
assert.equal(result.metrics.requested_count, 2);
assert.equal(result.metrics.authorized_count, 1);
assert.equal(result.metrics.returned_count, 1);
const encoded = JSON.stringify(result);
for (const forbidden of ['nombre','apellido','telefono','correo','fuera-demo']) assert.equal(encoded.toLowerCase().includes(forbidden), false);

homeReads = 0;
const none = await trackingQueryV2({
  body:{ token:'synthetic-token', cedulas:['2-2222-2222'] },
  authorizeSession:async token => ({ token, session:{ rol:'VENTAS' } }),
  campusCall:async () => ({ ok:true, prospecto:{ cedula:'2-2222-2222', financiamiento:'PROPIO' } }),
  extractCedula:p => p.cedula,
  extractFinancing:p => p.financiamiento,
  readHomeHtml:async () => { homeReads += 1; return html; },
});
assert.equal(none.records.length, 0);
assert.equal(homeReads, 0, 'sin identidades autorizadas no debe leer Home CONAPE');

await assert.rejects(
  trackingQueryV2({
    body:{ token:'synthetic-token', cedulas:['1-1111-1111'] },
    authorizeSession:async token => ({ token, session:{ rol:'VENTAS' } }),
    campusCall:async () => ({ ok:true, prospecto:{ cedula:'1-1111-1111', financiamiento:'CONAPE' } }),
    extractCedula:p => p.cedula,
    extractFinancing:p => p.financiamiento,
    readHomeHtml:async () => '<html><body>no report</body></html>',
  }),
  error => error?.code === 'TRACKING_SOURCE_UNAVAILABLE' && error?.status === 503
);

console.log(JSON.stringify({ ok:true, suite:'conape_tracking_route_v2', checks:20, pii:false }));
