import assert from 'node:assert/strict';
import { conapeTrackingContract, filterAuthorizedTracking, normalizeTrackingDate } from '../services/conape-bridge/conape_tracking_contract_v2.mjs';

assert.equal(conapeTrackingContract.endpoint, '/v1/tracking/query');
assert.equal(conapeTrackingContract.method, 'POST');
assert.equal(conapeTrackingContract.maxRequestedIdentities, 100);
for (const forbidden of ['nombre','primer_apellido','segundo_apellido','telefono','correo']) {
  assert.ok(conapeTrackingContract.forbiddenResponseFields.includes(forbidden));
}

assert.deepEqual(normalizeTrackingDate('11/09/2026'), { raw:'11/09/2026', iso:'2026-09-11', invalid:false });
assert.equal(normalizeTrackingDate('31/02/2026').iso, null);
assert.equal(normalizeTrackingDate('31/02/2026').invalid, true);
assert.equal(normalizeTrackingDate('fecha desconocida').iso, null);
assert.equal(normalizeTrackingDate('fecha desconocida').raw, 'fecha desconocida');

const fixture = [
  {
    cedula:'1-1111-1111', estado_raw:'REGISTRO', fecha_estado:'10/09/2026', fecha_registro:'09/09/2026',
    usuario_registro:'operador-demo', fecha_aprobacion:'', fecha_formalizacion:'', ultimo_desembolso:'', proximo_desembolso:'',
    nombre:'NO DEBE SALIR', correo:'no-debe-salir@example.invalid', telefono:'88888888', captured_at:'2026-09-11T07:00:00.000Z',
  },
  {
    cedula:'2-2222-2222', estado_raw:'CONFIRMADO', fecha_estado:'11/09/2026 08:15', fecha_registro:'09/09/2026',
    usuario_registro:'otro-demo', nombre:'FUERA DE ALCANCE', correo:'otro@example.invalid', telefono:'87777777',
  },
  {
    cedula:'3-3333-3333', estado_raw:'CREÓ CUENTA', fecha_estado:'11/09/2026', fecha_registro:'10/09/2026', usuario_registro:'demo',
  },
  {
    cedula:'3-3333-3333', estado_raw:'CONFIRMADO', fecha_estado:'11/09/2026', fecha_registro:'10/09/2026', usuario_registro:'demo',
  },
];

const result = filterAuthorizedTracking(fixture, ['1-1111-1111','3-3333-3333','4-4444-4444']);
assert.equal(result.metrics.requested, 3);
assert.equal(result.metrics.returned, 1);
assert.equal(result.metrics.missing, 1);
assert.equal(result.metrics.ambiguous, 1);
assert.equal(result.records[0].cedula, '111111111');
assert.equal(result.records[0].estado_raw, 'REGISTRO');
assert.equal(result.records[0].fecha_estado, '2026-09-10');
assert.ok(!Object.prototype.hasOwnProperty.call(result.records[0], 'nombre'));
assert.ok(!Object.prototype.hasOwnProperty.call(result.records[0], 'correo'));
assert.ok(!Object.prototype.hasOwnProperty.call(result.records[0], 'telefono'));
assert.ok(!result.records.some(row => row.cedula === '222222222'));
assert.deepEqual(result.ambiguous, ['333333333']);
assert.deepEqual(result.missing, ['444444444']);

console.log(JSON.stringify({ ok:true, suite:'conape_tracking_contract_v2', checks:18, pii:false }));
