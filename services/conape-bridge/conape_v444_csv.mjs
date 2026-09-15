import crypto from 'node:crypto';

const MAX_DOWNLOAD_BYTES = 16 * 1024 * 1024;

const text = value => String(value == null ? '' : value).trim();
const digits = value => text(value).replace(/\D/g, '');
const sha256 = value => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');

function csvCedulaSet(rows) {
  const set = new Set();
  for (const row of Array.isArray(rows) ? rows : []) {
    const cedula = digits(row?.cedula);
    if (!cedula) throw new Error('CONAPE_V444_CSV_CEDULA_INVALID');
    if (set.has(cedula)) throw new Error('CONAPE_V444_CSV_DUPLICATE_CEDULA');
    set.add(cedula);
  }
  return set;
}

function csvCedulaFingerprint(rows) {
  const set = csvCedulaSet(rows);
  const keys = [...set].sort();
  return {
    count:keys.length,
    hash:sha256(keys.join('|')),
  };
}

function verifyDoubleCsv(first, second) {
  if (!first?.ok || first?.columns_ok !== true) {
    const error = new Error('CONAPE_V444_CSV_A_INVALID');
    error.code = 'CONAPE_V444_CSV_A_INVALID';
    error.reason = text(first?.reason || 'UNKNOWN');
    throw error;
  }
  if (!second?.ok || second?.columns_ok !== true) {
    const error = new Error('CONAPE_V444_CSV_B_INVALID');
    error.code = 'CONAPE_V444_CSV_B_INVALID';
    error.reason = text(second?.reason || 'UNKNOWN');
    throw error;
  }

  const a = csvCedulaFingerprint(first.rows);
  const b = csvCedulaFingerprint(second.rows);
  if (a.count <= 0 || b.count <= 0) {
    const error = new Error('CONAPE_V444_CSV_EMPTY');
    error.code = 'CONAPE_V444_CSV_EMPTY';
    throw error;
  }
  if (a.count !== b.count || a.hash !== b.hash) {
    const error = new Error('CONAPE_V444_CSV_DOUBLE_MISMATCH');
    error.code = 'CONAPE_V444_CSV_DOUBLE_MISMATCH';
    error.rows_csv_a = a.count;
    error.rows_csv_b = b.count;
    throw error;
  }

  return {
    ok:true,
    rows:first.rows,
    rows_csv_a:a.count,
    rows_csv_b:b.count,
    cedula_hash:a.hash,
    counts_match:true,
    columns_ok:true,
    verification_method:'CSV_DOUBLE',
  };
}

async function readDownloadUtf8(download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('DOWNLOAD_STREAM_UNAVAILABLE');
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > MAX_DOWNLOAD_BYTES) throw new Error('DOWNLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function firstVisible(locator) {
  const count = await locator.count().catch(() => 0);
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function downloadProspectCsvViaDialog(page, parseProspectCsv) {
  if (!page || typeof parseProspectCsv !== 'function') {
    return { ok:false, reason:'CSV_V444_ARGUMENT_INVALID', columns_ok:false, rows:[] };
  }

  let download = null;
  try {
    const actions = await firstVisible(page.getByRole('button', { name:/actions|acciones/i }));
    if (!actions) return { ok:false, reason:'ACTIONS_NOT_FOUND', columns_ok:false, rows:[] };
    await actions.click({ timeout:5_000 });

    const downloadItem = await firstVisible(page.getByRole('menuitem', { name:/download|descargar/i }));
    if (!downloadItem) return { ok:false, reason:'DOWNLOAD_NOT_FOUND', columns_ok:false, rows:[] };
    await downloadItem.click({ timeout:5_000 });

    const dialogCandidates = page.locator('[role="dialog"],.ui-dialog,.a-Dialog');
    let dialog = await firstVisible(dialogCandidates);
    if (!dialog) {
      await page.waitForTimeout(150);
      dialog = await firstVisible(dialogCandidates);
    }
    const scope = dialog || page;

    let csv = await firstVisible(scope.getByRole('button', { name:/^CSV$/i }));
    if (!csv) csv = await firstVisible(scope.getByRole('link', { name:/^CSV$/i }));
    if (!csv) csv = await firstVisible(scope.getByText(/^CSV$/i));
    if (!csv) return { ok:false, reason:'CSV_CONTROL_NOT_FOUND', columns_ok:false, rows:[] };
    await csv.click({ timeout:5_000 });

    let finalDownload = await firstVisible(scope.getByRole('button', { name:/^(download|descargar)$/i }));
    if (!finalDownload) finalDownload = await firstVisible(page.getByRole('button', { name:/^(download|descargar)$/i }));
    if (!finalDownload) return { ok:false, reason:'CSV_FINAL_DOWNLOAD_NOT_FOUND', columns_ok:false, rows:[] };

    const pending = page.waitForEvent('download', { timeout:10_000 }).catch(() => null);
    await finalDownload.click({ timeout:5_000 });
    download = await pending;
    if (!download) return { ok:false, reason:'CSV_DOWNLOAD_NOT_OBSERVED', columns_ok:false, rows:[] };

    const raw = await readDownloadUtf8(download);
    return parseProspectCsv(raw);
  } catch (error) {
    return {
      ok:false,
      reason:text(error?.code || error?.message || 'CSV_V444_DOWNLOAD_FAILED').slice(0,80),
      columns_ok:false,
      rows:[],
    };
  } finally {
    try { await download?.delete(); } catch {}
  }
}

export {
  csvCedulaFingerprint,
  verifyDoubleCsv,
  downloadProspectCsvViaDialog,
};
