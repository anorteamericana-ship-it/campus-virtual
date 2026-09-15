import assert from 'node:assert/strict';
import { csvCedulaFingerprint, verifyDoubleCsv } from './conape_v444_csv.mjs';

const row = (cedula, estado = 'EN PROCESO') => ({ cedula, estado });
const parsed = rows => ({ ok:true, columns_ok:true, rows });

{
  const result = csvCedulaFingerprint([
    row('1-1111-1111'),
    row('222222222'),
  ]);
  assert.equal(result.count, 2);
  assert.match(result.hash, /^[0-9a-f]{64}$/);
}

{
  const a = parsed([row('111111111'), row('222222222')]);
  const b = parsed([row('222222222'), row('111111111')]);
  const verified = verifyDoubleCsv(a, b);
  assert.equal(verified.ok, true);
  assert.equal(verified.rows_csv_a, 2);
  assert.equal(verified.rows_csv_b, 2);
  assert.equal(verified.counts_match, true);
  assert.equal(verified.columns_ok, true);
  assert.equal(verified.verification_method, 'CSV_DOUBLE');
  assert.deepEqual(verified.rows, a.rows);
}

{
  assert.throws(
    () => verifyDoubleCsv(parsed([row('111111111')]), parsed([row('222222222')])),
    error => error?.code === 'CONAPE_V444_CSV_DOUBLE_MISMATCH',
  );
}

{
  assert.throws(
    () => verifyDoubleCsv(parsed([row('111111111'), row('111111111')]), parsed([row('111111111')])),
    /CONAPE_V444_CSV_DUPLICATE_CEDULA/,
  );
}

{
  assert.throws(
    () => verifyDoubleCsv({ ok:false, reason:'X', columns_ok:false, rows:[] }, parsed([row('111111111')])),
    error => error?.code === 'CONAPE_V444_CSV_A_INVALID' && error?.reason === 'X',
  );
}

console.log('CONAPE V4.4.4 double CSV helper QA: PASS');
