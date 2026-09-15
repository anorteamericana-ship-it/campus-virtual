import crypto from 'node:crypto';

const MAX_DOWNLOAD_BYTES = 16 * 1024 * 1024;
const CONAPE_ORIGIN = 'https://online.conape.go.cr';

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

function normalizeDownloadLink(raw, baseUrl) {
  let value = text(raw);
  if (!value) throw new Error('CSV_DOWNLOAD_LINK_EMPTY');
  if (value.startsWith('"') && value.endsWith('"')) {
    try { value = JSON.parse(value); } catch {}
  }
  const url = new URL(value, baseUrl);
  const decodedPath = decodeURIComponent(url.pathname || '');
  if (url.origin !== CONAPE_ORIGIN) throw new Error('CSV_DOWNLOAD_LINK_ORIGIN_INVALID');
  if (!decodedPath.endsWith('/apex/r/conaweb/prospectación-reclutador/home')) throw new Error('CSV_DOWNLOAD_LINK_PATH_INVALID');
  if (!text(url.searchParams.get('request')).startsWith('PLUGIN=')) throw new Error('CSV_DOWNLOAD_LINK_REQUEST_INVALID');
  if (!/^\d{4,}$/.test(text(url.searchParams.get('session')))) throw new Error('CSV_DOWNLOAD_LINK_SESSION_INVALID');
  if (!text(url.searchParams.get('x01')).startsWith('FILE_ID=')) throw new Error('CSV_DOWNLOAD_LINK_FILE_INVALID');
  if (text(url.searchParams.get('cs')).length < 16) throw new Error('CSV_DOWNLOAD_LINK_CHECKSUM_INVALID');
  return url.href;
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

    const linkResponsePromise = page.waitForResponse(response => {
      try {
        const request = response.request();
        return request.method() === 'POST'
          && /\/wwv_flow\.ajax(?:\?|$)/.test(response.url())
          && String(request.postData() || '').includes('GET_DOWNLOAD_LINK');
      } catch {
        return false;
      }
    }, { timeout:10_000 }).catch(() => null);

    await finalDownload.click({ timeout:5_000 });
    const linkResponse = await linkResponsePromise;
    if (!linkResponse) return { ok:false, reason:'CSV_DOWNLOAD_LINK_NOT_OBSERVED', columns_ok:false, rows:[] };
    if (linkResponse.status() !== 200) return { ok:false, reason:'CSV_DOWNLOAD_LINK_HTTP', columns_ok:false, rows:[] };

    const signedLink = normalizeDownloadLink(await linkResponse.text(), page.url());
    const csvResponse = await page.context().request.get(signedLink, {
      timeout:15_000,
      failOnStatusCode:false,
    });
    if (csvResponse.status() !== 200) return { ok:false, reason:'CSV_FILE_HTTP', columns_ok:false, rows:[] };

    const headers = csvResponse.headers();
    const contentType = text(headers['content-type']).toLowerCase();
    const disposition = text(headers['content-disposition']).toLowerCase();
    if (!contentType.includes('text/csv')) return { ok:false, reason:'CSV_FILE_CONTENT_TYPE', columns_ok:false, rows:[] };
    if (!disposition.includes('attachment') || !disposition.includes('.csv')) {
      return { ok:false, reason:'CSV_FILE_DISPOSITION', columns_ok:false, rows:[] };
    }

    const body = await csvResponse.body();
    if (!body?.length) return { ok:false, reason:'CSV_FILE_EMPTY', columns_ok:false, rows:[] };
    if (body.length > MAX_DOWNLOAD_BYTES) return { ok:false, reason:'CSV_FILE_TOO_LARGE', columns_ok:false, rows:[] };
    return parseProspectCsv(body.toString('utf8'));
  } catch (error) {
    return {
      ok:false,
      reason:text(error?.code || error?.message || 'CSV_V444_DOWNLOAD_FAILED').slice(0,80),
      columns_ok:false,
      rows:[],
    };
  }
}

export {
  csvCedulaFingerprint,
  verifyDoubleCsv,
  normalizeDownloadLink,
  downloadProspectCsvViaDialog,
};
