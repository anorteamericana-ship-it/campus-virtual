import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  IR_REGION_ID,
  IR_WIDGET_ID,
  IR_REPORT_ID,
  csvCedulaFingerprint,
  verifyDoubleCsv,
  normalizeDownloadLink,
} from './conape_v444_csv.mjs';

const row = (cedula, estado = 'EN PROCESO') => ({ cedula, estado });
const parsed = rows => ({ ok:true, columns_ok:true, rows });
const helperSource = fs.readFileSync(new URL('./conape_v444_csv.mjs', import.meta.url), 'utf8');

assert.equal(IR_REGION_ID, '204245917046361543');
assert.equal(IR_WIDGET_ID, '204246013985361544');
assert.equal(IR_REPORT_ID, '205107064996977403');
assert.match(helperSource, /apexServer\.pluginUrl\(ajaxIdentifier/);
assert.match(helperSource, /p_widget_action', 'GET_DOWNLOAD_LINK'/);
assert.match(helperSource, /return downloadProspectCsvViaApexDirect\(page, parseProspectCsv\)/);
{
  const start = helperSource.indexOf('async function downloadProspectCsvViaDialog');
  const end = helperSource.indexOf('\n}\n\nexport {', start);
  const compatibilityBlock = start >= 0 && end > start ? helperSource.slice(start, end) : '';
  assert.ok(compatibilityBlock);
  assert.doesNotMatch(compatibilityBlock, /getByRole|locator\(|\.click\(/);
}

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

{
  const link = normalizeDownloadLink(
    '/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home?request=PLUGIN%3Dabc&session=123456789&x01=FILE_ID%3Dxyz&cs=1234567890abcdef',
    'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home?session=123456789',
  );
  assert.match(link, /^https:\/\/online\.conape\.go\.cr\/apex\/r\/conaweb\//);
  assert.throws(
    () => normalizeDownloadLink(
      'https://example.com/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home?request=PLUGIN%3Dabc&session=123456789&x01=FILE_ID%3Dxyz&cs=1234567890abcdef',
      'https://online.conape.go.cr/',
    ),
    /CSV_DOWNLOAD_LINK_ORIGIN_INVALID/,
  );
}

console.log('CONAPE V4.4.5 direct APEX CSV helper QA: PASS');
