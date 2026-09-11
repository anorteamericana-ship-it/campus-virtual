import assert from 'node:assert/strict';
import { parseConapeTrackingHome } from '../services/conape-bridge/conape_tracking_parser_v2.mjs';
import { authorizeTrackingIdentities, normalizeRequestedTrackingIdentities, publicTrackingMetrics } from '../services/conape-bridge/conape_tracking_backend_v2.mjs';
import { filterAuthorizedTracking } from '../services/conape-bridge/conape_tracking_contract_v2.mjs';

const html = `
<html><body>
<table id="tracking">
<thead><tr>
<th>Cédula</th><th>Primer apellido</th><th>Nombre</th><th>Correo electrónico</th><th>Estado</th>
<th>Fecha de estado</th><th>Fecha registro</th><th>Usuario que registró</th><th>Aprobación</th><th>Formalización</th><th>Último desembolso</th><th>Próximo desembolso</th>
</tr></thead>
<tbody>
<tr><td>1-1111-1111</td><td>PII</td><td>PII</td><td>pii@example.invalid</td><td>CONFIRMADO</td><td>11/09/2026 08:15</td><td>10/09/2026</td><td>operador-demo</td><td>11/09/2026</td><td>-</td><td></td><td>30/09/2026</td></tr>
<tr><td>2-2222-2222</td><td>FUERA</td><td>ALCANCE</td><td>fuera@example.invalid</td><td>CREÓ CUENTA</td><td>11/09/2026</td><td>10/09/2026</td><td>otro-demo</td><td></td><td></td><td></td><td></td></tr>
<tr><td>3-3333-3333</td><td>DUP</td><td>UNO</td><td>dup1@example.invalid</td><td>REGISTRO</td><td>11/09/2026</td><td>10/09/2026</td><td>demo</td><td></td><td></td><td></td><td></td></tr>
<tr><td>3-3333-3333</td><td>DUP</td><td>DOS</td><td>dup2@example.invalid</td><td>CONFIRMADO</td><td>11/09/2026</td><td>10/09/2026</td><td>demo</td><td></td><td></td><td></td><td></td></tr>
</tbody></table>
</body></html>`;

const parsed = parseConapeTrackingHome(html, { capturedAt:'2026-09-11T08:00:00.000Z' });
assert.equal(parsed.ok, true);
assert.equal(parsed.records.length, 4);
assert.equal(parsed.records[0].cedula, '111111111');
assert.equal(parsed.records[0].estado_raw, 'CONFIRMADO');
assert.equal(parsed.records[0].fecha_estado, '2026-09-11T08:15:00.000Z');
assert.equal(parsed.records[0].fecha_registro, '2026-09-10');
assert.equal(parsed.records[0].proximo_desembolso, '2026-09-30');
for (const forbidden of ['nombre','primer_apellido','segundo_apellido','telefono','correo']) {
  assert.equal(Object.prototype.hasOwnProperty.call(parsed.records[0], forbidden), false);
}

const normalized = normalizeRequestedTrackingIdentities(['1-1111-1111','1 1111 1111','bad','2-2222-2222']);
assert.deepEqual(normalized.identities, ['111111111','222222222']);
assert.equal(normalized.invalid_count, 1);
assert.equal(normalized.duplicate_count, 1);
assert.throws(() => normalizeRequestedTrackingIdentities(Array.from({ length:101 }, (_,i) => `1${String(i).padStart(8,'0')}`)), error => error.code === 'TRACKING_IDENTITIES_LIMIT');

let sessionCalls = 0;
let detailCalls = 0;
const auth = await authorizeTrackingIdentities({
  token:'synthetic-token',
  cedulas:['1-1111-1111','2-2222-2222','4-4444-4444'],
  authorizeSession:async token => { sessionCalls += 1; assert.equal(token, 'synthetic-token'); return { token, session:{ rol:'VENTAS' } }; },
  getProspectoDetalle:async (_token, cedula) => {
    detailCalls += 1;
    if (cedula === '111111111') return { ok:true, prospecto:{ cedula:'1-1111-1111', financiamiento:'CONAPE' } };
    if (cedula === '222222222') return { ok:true, prospecto:{ cedula:'2-2222-2222', financiamiento:'PROPIO' } };
    return { ok:false };
  },
  extractCedula:p => p.cedula,
  extractFinancing:p => p.financiamiento,
});
assert.equal(sessionCalls, 1, 'validarSesion debe ocurrir una sola vez por tracking request');
assert.equal(detailCalls, 3, 'cada identidad debe revalidarse individualmente');
assert.deepEqual(auth.authorizedCedulas, ['111111111']);
assert.equal(auth.metrics.denied_count, 2);

const filtered = filterAuthorizedTracking(parsed.records, auth.authorizedCedulas);
assert.equal(filtered.records.length, 1);
assert.equal(filtered.records[0].cedula, '111111111');
assert.equal(filtered.records[0].estado_raw, 'CONFIRMADO');
assert.equal(filtered.records.some(row => row.cedula === '222222222'), false, 'fila fuera de alcance nunca debe salir');
assert.equal(filtered.records.some(row => row.cedula === '333333333'), false, 'fila no solicitada nunca debe salir');

const dupFiltered = filterAuthorizedTracking(parsed.records, ['333333333']);
assert.deepEqual(dupFiltered.ambiguous, ['333333333']);
assert.equal(dupFiltered.records.length, 0);

const metrics = publicTrackingMetrics({ authorization:auth.metrics, parser:parsed.metrics, filtered:filtered.metrics });
assert.deepEqual(Object.keys(metrics).sort(), ['ambiguous_count','authorized_count','invalid_date_count','missing_count','parse_duration_ms','requested_count','returned_count'].sort());
assert.equal(JSON.stringify(metrics).includes('111111111'), false);

const unknownStateHtml = html.replace('CONFIRMADO</td><td>11/09/2026 08:15', 'ESTADO NUEVO DEL PORTAL</td><td>11/09/2026 08:15');
const unknown = parseConapeTrackingHome(unknownStateHtml);
assert.equal(unknown.records[0].estado_raw, 'ESTADO NUEVO DEL PORTAL');

const badDate = parseConapeTrackingHome(html.replace('11/09/2026 08:15', 'fecha rara'));
assert.equal(badDate.records[0].fecha_estado, null);
assert.equal(badDate.records[0].fecha_estado_raw, 'fecha rara');
assert.equal(badDate.metrics.invalid_dates > 0, true);

console.log(JSON.stringify({ ok:true, suite:'conape_tracking_backend_v2', checks:32, pii:false }));
