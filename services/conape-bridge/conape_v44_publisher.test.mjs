import assert from 'node:assert/strict';
import {
  CONAPE_V44_ACTION,
  CONAPE_V44_ROW_FIELDS,
  stableJson,
  sha256Hex,
  buildConapeV44Snapshot,
  canonicalForEnvelope,
  buildConapeV44SignedEnvelope,
  buildConapeV44DryRunSummary,
} from './conape_v44_publisher.mjs';

function fixture(overrides = {}) {
  const rows = [{
    cedula:'1-2345-6789', apellido_1:'Pérez', apellido_2:'Mora', nombre:'Ana',
    telefono:'', celular:'88887777', correo:'ANA@example.com', estado:'REGISTRADO',
    fecha_estado:'14/09/2026', fecha_registro:'14/09/2026', usuario_registro:'asesor',
    aprobacion:'', formalizacion:'', ultimo_desembolso:'', proximo_desembolso:'', ignored:'NO_DEBE_SALIR',
  }];
  return {
    ok:true, code:'PROSPECT_LIST_READY', method:'CSV_DOWNLOAD', rows,
    row_count:1, rows_csv:1, rows_html_all:1, counts_match:true, columns_ok:true,
    captured_at:'2026-09-14T18:00:00.000Z', ...overrides,
  };
}

function expectCode(fn, code) {
  assert.throws(fn, error => error?.code === code);
}

assert.equal(stableJson({ z:1, a:{ y:2, x:3 }, b:[{ d:4, c:5 }] }), '{"a":{"x":3,"y":2},"b":[{"c":5,"d":4}],"z":1}');
assert.equal(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');

const snapshot = buildConapeV44Snapshot(fixture());
assert.equal(snapshot.method, 'CSV_DOWNLOAD');
assert.equal(snapshot.rows.length, 1);
assert.equal(snapshot.rows[0].cedula, '123456789');
assert.equal(snapshot.rows[0].estado, 'REGISTRADO');
assert.deepEqual(Object.keys(snapshot.rows[0]), [...CONAPE_V44_ROW_FIELDS]);
assert.equal('ignored' in snapshot.rows[0], false);

expectCode(() => buildConapeV44Snapshot(fixture({ method:'HTML_ROWS_ALL' })), 'CONAPE_V44_PUBLISHER_REQUIRES_CSV');
expectCode(() => buildConapeV44Snapshot(fixture({ columns_ok:false })), 'CONAPE_V44_PUBLISHER_COLUMNS_NOT_OK');
expectCode(() => buildConapeV44Snapshot(fixture({ counts_match:false })), 'CONAPE_V44_PUBLISHER_COUNTS_NOT_MATCHED');
expectCode(() => buildConapeV44Snapshot(fixture({ rows_html_all:2 })), 'CONAPE_V44_PUBLISHER_COUNT_INVALID');
expectCode(() => buildConapeV44Snapshot(fixture({ rows:[] })), 'CONAPE_V44_PUBLISHER_COUNT_INVALID');
expectCode(() => buildConapeV44Snapshot(fixture({ rows:[{ ...fixture().rows[0], estado:'' }] })), 'CONAPE_V44_PUBLISHER_ESTADO_INVALID');
expectCode(() => buildConapeV44Snapshot(fixture({ rows:[fixture().rows[0], fixture().rows[0]], rows_csv:2, rows_html_all:2, row_count:2 })), 'CONAPE_V44_PUBLISHER_DUPLICATE_CEDULA');

const fixedOptions = {
  serviceId:'REBECA_WHATSAPP', secret:'synthetic-test-secret', timestamp:1757890000123,
  nonce:'00112233445566778899aabbccddeeff', requestId:'req-v44-test-001',
};
const signed = buildConapeV44SignedEnvelope(fixture(), fixedOptions);
assert.equal(signed.envelope.action, CONAPE_V44_ACTION);
assert.equal(signed.envelope.serviceId, 'REBECA_WHATSAPP');
assert.equal(signed.envelope.timestamp, 1757890000123);
assert.match(signed.envelope.signature, /^[0-9a-f]{64}$/);
assert.equal(signed.meta.apply_enabled, false);

const canonical = canonicalForEnvelope(signed.envelope);
assert.equal(canonical.payloadHash, signed.meta.payload_hash);
assert.equal(signed.envelope.signature, '88492abe554f46730ea96f0339ea956b0b8ed7e5fa42c52a930e870effb241c6');

const spacedSecret = buildConapeV44SignedEnvelope(fixture(), { ...fixedOptions, secret:' synthetic-test-secret ' });
assert.match(spacedSecret.envelope.signature, /^[0-9a-f]{64}$/);
assert.notEqual(spacedSecret.envelope.signature, signed.envelope.signature, 'El secreto HMAC no debe trimmease: Apps Script firma el String exacto.');

const summaryMissingSecret = buildConapeV44DryRunSummary(fixture(), { CAMPUS_SERVICE_ID:'REBECA_WHATSAPP', CAMPUS_SERVICE_SECRET:'' });
assert.equal(summaryMissingSecret.ok, true);
assert.equal(summaryMissingSecret.apply_enabled, false);
assert.equal(summaryMissingSecret.service_id_configured, true);
assert.equal(summaryMissingSecret.secret_configured, false);
assert.equal(summaryMissingSecret.signature_ready, false);
assert.match(summaryMissingSecret.payload_hash_prefix, /^[0-9a-f]{16}$/);
assert.equal('rows' in summaryMissingSecret, false);
assert.equal('signature' in summaryMissingSecret, false);

const summaryReady = buildConapeV44DryRunSummary(fixture(), { CAMPUS_SERVICE_ID:'REBECA_WHATSAPP', CAMPUS_SERVICE_SECRET:' synthetic-test-secret ' });
assert.equal(summaryReady.ok, true);
assert.equal(summaryReady.service_id_configured, true);
assert.equal(summaryReady.secret_configured, true);
assert.equal(summaryReady.signature_ready, true);
assert.equal(summaryReady.apply_enabled, false);
assert.equal('rows' in summaryReady, false);
assert.equal('signature' in summaryReady, false);

const source = await import('node:fs').then(fs => fs.readFileSync(new URL('./conape_v44_publisher.mjs', import.meta.url), 'utf8'));
assert.equal(/\bfetch\s*\(/.test(source), false);
assert.equal(/https?:\/\//.test(source), false);

console.log('CONAPE V4.4 publisher dry-run QA: PASS');
