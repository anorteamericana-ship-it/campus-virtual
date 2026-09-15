import crypto from 'node:crypto';

const MAX_DOWNLOAD_BYTES = 16 * 1024 * 1024;
const CONAPE_ORIGIN = 'https://online.conape.go.cr';
const IR_REGION_ID = '204245917046361543';
const IR_WIDGET_ID = '204246013985361544';
const IR_REPORT_ID = '205107064996977403';

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

function safeReason(error, fallback) {
  return text(error?.code || error?.message || fallback).slice(0,80);
}

async function parseSignedCsvResponse(page, signedLink, parseProspectCsv) {
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
  const parsed = parseProspectCsv(body.toString('utf8'));
  return { ...parsed, transport:'APEX_DIRECT' };
}

async function discoverWorksheetAjaxIdentifier(page) {
  return page.evaluate(({ regionId }) => {
    const clean = value => String(value == null ? '' : value).trim();
    const decodeRegionToken = token => {
      try {
        const first = clean(token).replace(/^PLUGIN=/i, '').split('/')[0];
        if (!first) return '';
        const normalized = first.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
        return atob(padded);
      } catch {
        return '';
      }
    };
    const valid = token => decodeRegionToken(token).includes(`REGION TYPE~~${regionId}`);
    const normalize = token => clean(token).replace(/^PLUGIN=/i, '');
    const candidateFrom = value => {
      const token = normalize(value);
      return token && valid(token) ? token : '';
    };

    try {
      const ids = [`R${regionId}`, regionId];
      for (const id of ids) {
        const region = window.apex?.region?.(id);
        const candidates = [
          region?.ajaxIdentifier,
          region?.ajax_identifier,
          region?.widget?.()?.ajaxIdentifier,
          region?.widget?.()?.ajax_identifier,
        ];
        for (const candidate of candidates) {
          const token = candidateFrom(candidate);
          if (token) return token;
        }
      }
    } catch {}

    try {
      const regions = window.apex?.regions || {};
      for (const [key, region] of Object.entries(regions)) {
        const candidates = [
          region?.ajaxIdentifier,
          region?.ajax_identifier,
          region?.widget?.()?.ajaxIdentifier,
          region?.widget?.()?.ajax_identifier,
        ];
        for (const candidate of candidates) {
          const token = candidateFrom(candidate);
          if (token) return token;
        }
        const elementId = clean(region?.element?.attr?.('id') || region?.element?.[0]?.id || '');
        const regionKey = clean(region?.id || region?.regionId || key);
        if (elementId.includes(regionId) || regionKey.includes(regionId)) {
          for (const candidate of candidates) {
            const token = normalize(candidate);
            if (token) return token;
          }
        }
      }
    } catch {}

    const html = String(document.documentElement?.outerHTML || '').replace(/&amp;/g, '&');
    const patterns = [
      /PLUGIN=([A-Za-z0-9_-]+\/[A-Za-z0-9_-]+)/gi,
      /PLUGIN%3D([A-Za-z0-9_-]+%2F[A-Za-z0-9_-]+)/gi,
      /(UkVHSU9OIFRZUEV[A-Za-z0-9_-]*\/[A-Za-z0-9_-]+)/g,
      /(UkVHSU9OIFRZUEV[A-Za-z0-9_-]*%2F[A-Za-z0-9_-]+)/g,
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html))) {
        let token = clean(match[1] || match[0]);
        try { token = decodeURIComponent(token); } catch {}
        token = normalize(token);
        if (valid(token)) return token;
      }
    }
    return '';
  }, { regionId:IR_REGION_ID });
}

async function buildDirectDownloadLinkRequestUrl(page, ajaxIdentifier) {
  return page.evaluate(({ ajaxIdentifier, regionId, widgetId, reportId }) => {
    const apexServer = window.apex?.server;
    if (!apexServer || typeof apexServer.pluginUrl !== 'function') return '';

    const f01 = [
      `R${regionId}_download_format`,
      `R${regionId}_data_only`,
      `R${regionId}_pdf_page_size`,
      `R${regionId}_pdf_orientation`,
      `R${regionId}_strip_rich_text`,
      `R${regionId}_accessible`,
    ];
    const f02 = ['CSV', '', 'LETTER', 'HORIZONTAL', '', ''];

    const generated = apexServer.pluginUrl(ajaxIdentifier, {
      x01:widgetId,
      x02:reportId,
      f01,
      f02,
    });
    if (!generated) return '';
    const url = new URL(generated, window.location.href);
    url.searchParams.set('p_widget_name', 'worksheet');
    url.searchParams.set('p_widget_mod', 'ACTION');
    url.searchParams.set('p_widget_action', 'GET_DOWNLOAD_LINK');
    url.searchParams.set('p_widget_num_return', '100000');
    return url.href;
  }, {
    ajaxIdentifier,
    regionId:IR_REGION_ID,
    widgetId:IR_WIDGET_ID,
    reportId:IR_REPORT_ID,
  });
}

async function downloadProspectCsvViaApexDirect(page, parseProspectCsv) {
  if (!page || typeof parseProspectCsv !== 'function') {
    return { ok:false, reason:'CSV_V445_ARGUMENT_INVALID', columns_ok:false, rows:[] };
  }
  try {
    const ajaxIdentifier = text(await discoverWorksheetAjaxIdentifier(page));
    if (!ajaxIdentifier) return { ok:false, reason:'CSV_V445_AJAX_IDENTIFIER_NOT_FOUND', columns_ok:false, rows:[] };

    const requestUrl = text(await buildDirectDownloadLinkRequestUrl(page, ajaxIdentifier));
    if (!requestUrl) return { ok:false, reason:'CSV_V445_PLUGIN_URL_NOT_BUILT', columns_ok:false, rows:[] };
    const parsedRequestUrl = new URL(requestUrl);
    if (parsedRequestUrl.origin !== CONAPE_ORIGIN || !/\/wwv_flow\.ajax$/.test(parsedRequestUrl.pathname)) {
      return { ok:false, reason:'CSV_V445_PLUGIN_URL_INVALID', columns_ok:false, rows:[] };
    }

    const linkResponse = await page.context().request.get(requestUrl, {
      timeout:15_000,
      failOnStatusCode:false,
    });
    if (linkResponse.status() !== 200) return { ok:false, reason:'CSV_V445_LINK_HTTP', columns_ok:false, rows:[] };

    const signedLink = normalizeDownloadLink(await linkResponse.text(), page.url());
    return await parseSignedCsvResponse(page, signedLink, parseProspectCsv);
  } catch (error) {
    return {
      ok:false,
      reason:safeReason(error, 'CSV_V445_DIRECT_FAILED'),
      columns_ok:false,
      rows:[],
    };
  }
}

// Nombre legacy conservado para no tocar todavía el contrato del runtime.
// Desde V4.4.5 NO abre Actions/Download/CSV ni depende de controles DOM.
async function downloadProspectCsvViaDialog(page, parseProspectCsv) {
  return downloadProspectCsvViaApexDirect(page, parseProspectCsv);
}

export {
  IR_REGION_ID,
  IR_WIDGET_ID,
  IR_REPORT_ID,
  csvCedulaFingerprint,
  verifyDoubleCsv,
  normalizeDownloadLink,
  discoverWorksheetAjaxIdentifier,
  buildDirectDownloadLinkRequestUrl,
  downloadProspectCsvViaApexDirect,
  downloadProspectCsvViaDialog,
};
