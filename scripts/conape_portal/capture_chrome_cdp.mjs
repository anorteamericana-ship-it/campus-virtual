import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseConapeApexReport } from './parse_apex_report.mjs';

const CONAPE_HOST = 'online.conape.go.cr';
const CONAPE_APP_ID = '302';
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_PAGE_CHANGE_TIMEOUT_MS = 20 * 1000;
const DEFAULT_MAX_PAGES = 250;
const POLL_MS = 750;

export class CaptureError extends Error {
  constructor(reason, message, details = null) {
    super(message);
    this.name = 'CaptureError';
    this.reason = reason;
    this.details = details;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function sha256(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function normalizeHeaderKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function parseDevToolsActivePort(raw) {
  const lines = String(raw || '').trim().split(/\r?\n/);
  const port = Number(lines[0]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new CaptureError('DEVTOOLS_PORT_INVALID', 'DevToolsActivePort no contiene un puerto válido.');
  }
  return {
    port,
    browserWebSocketPath: lines[1] || null,
  };
}

export function isAllowedConapeTarget(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== CONAPE_HOST) return false;
    if (!url.pathname.toLowerCase().startsWith('/apex/')) return false;
    const apexP = url.searchParams.get('p');
    if (!apexP) return true;
    return String(apexP).split(':')[0] === CONAPE_APP_ID;
  } catch {
    return false;
  }
}

export function sanitizeConapeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.hostname.toLowerCase() !== CONAPE_HOST) return '[NON_CONAPE_TARGET]';
    const apexP = url.searchParams.get('p');
    if (!apexP) return `${url.origin}${url.pathname}`;
    const parts = String(apexP).split(':');
    const app = parts[0] || '';
    const page = parts[1] || '';
    return `${url.origin}${url.pathname}?p=${app}:${page}`;
  } catch {
    return '[INVALID_TARGET_URL]';
  }
}

export function redactSensitiveText(raw) {
  return String(raw ?? '')
    .replace(/((?:session|p_instance|p_request|p_page_submission_id|authorization|cookie)\s*[:=]\s*)[^\s&;,'"<>]+/gi, '$1[REDACTED]')
    .replace(/([?&](?:session|p_instance|p_request|p_page_submission_id)=)[^&\s'"<>]+/gi, '$1[REDACTED]')
    .replace(/(f\?p=\d+:\d+:)[^:&\s'"<>]+/gi, '$1[REDACTED]');
}

export function parsePaginationLabel(rawLabel) {
  const label = String(rawLabel || '').replace(/\s+/g, ' ').trim();
  if (!label) return { label: '', start: null, end: null, total: null };

  const withTotal = label.match(/(\d+)\s*-\s*(\d+)\s*(?:of|de)\s*(\d+)/i);
  if (withTotal) {
    return {
      label,
      start: Number(withTotal[1]),
      end: Number(withTotal[2]),
      total: Number(withTotal[3]),
    };
  }

  const rangeOnly = label.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeOnly) {
    return {
      label,
      start: Number(rangeOnly[1]),
      end: Number(rangeOnly[2]),
      total: null,
    };
  }

  const single = label.match(/^\s*(\d+)\s*$/);
  if (single) {
    const n = Number(single[1]);
    return { label, start: n, end: n, total: n };
  }

  return { label, start: null, end: null, total: null };
}

export function pageFingerprint(parsed) {
  if (!parsed?.ok) return null;
  return sha256(parsed.records.map(record => record.record_hash).join('\n'));
}

export function aggregateParsedPages(parsedPages, paginationStates = []) {
  if (!Array.isArray(parsedPages) || parsedPages.length === 0) {
    throw new CaptureError('NO_PARSED_PAGES', 'No hay páginas válidas para agregar.');
  }

  const records = [];
  const seenPages = new Set();
  const states = new Map();
  const warnings = [];
  let invalidDates = 0;
  let invalidIdentifications = 0;
  let duplicateIdentities = 0;
  let unknownStates = 0;

  for (let i = 0; i < parsedPages.length; i += 1) {
    const parsed = parsedPages[i];
    if (!parsed?.ok) {
      throw new CaptureError('PARSED_PAGE_INVALID', `La página ${i + 1} no pasó el parser C3.1.`);
    }
    const fingerprint = pageFingerprint(parsed);
    if (seenPages.has(fingerprint)) {
      throw new CaptureError('PAGINATION_LOOP', `La página ${i + 1} repite una página ya capturada.`);
    }
    seenPages.add(fingerprint);

    records.push(...parsed.records);
    warnings.push(...parsed.warnings.map(warning => ({ page: i + 1, ...warning })));
    invalidDates += parsed.metrics.invalid_dates;
    invalidIdentifications += parsed.metrics.invalid_identifications;
    duplicateIdentities += parsed.metrics.duplicate_identities;
    unknownStates += parsed.metrics.unknown_states;

    for (const record of parsed.records) {
      const key = record.estado_key || '(VACIO)';
      states.set(key, (states.get(key) || 0) + 1);
    }
  }

  const totals = paginationStates
    .map(state => state?.parsedLabel?.total)
    .filter(total => Number.isInteger(total));
  const distinctTotals = [...new Set(totals)];
  if (distinctTotals.length > 1) {
    throw new CaptureError('PAGINATION_TOTAL_CHANGED', 'El total reportado por APEX cambió durante la captura.', { totals: distinctTotals });
  }
  if (distinctTotals.length === 1 && distinctTotals[0] !== records.length) {
    throw new CaptureError(
      'PAGINATION_TOTAL_MISMATCH',
      `APEX reportó ${distinctTotals[0]} filas pero se capturaron ${records.length}.`,
      { reportedTotal: distinctTotals[0], capturedRows: records.length },
    );
  }

  const datasetFingerprint = sha256(records.map(record => record.record_hash).join('\n'));
  return {
    ok: true,
    records,
    summary: {
      source: 'CONAPE_APEX_PROSPECTACION',
      pages_captured: parsedPages.length,
      records_captured: records.length,
      dataset_fingerprint: datasetFingerprint,
      states: Object.fromEntries([...states.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
      warnings_count: warnings.length,
      invalid_dates: invalidDates,
      invalid_identifications: invalidIdentifications,
      duplicate_identities: duplicateIdentities,
      unknown_states: unknownStates,
      pagination_total: distinctTotals.length === 1 ? distinctTotals[0] : null,
    },
    warnings,
  };
}

function requiredHeaderTableExpression() {
  return `(() => {
    const norm = value => String(value || '')
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const tables = Array.from(document.querySelectorAll('table'));
    return tables.find(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => norm(th.textContent));
      const hasCedula = headers.includes('CEDULA');
      const hasEstado = headers.includes('ESTADO');
      const hasFechaEstado = headers.includes('FECHA_DE_ESTADO') || headers.includes('FECHA_ESTADO');
      return hasCedula && hasEstado && hasFechaEstado;
    }) || null;
  })()`;
}

export const APEX_PAGINATION_PROBE_EXPRESSION = `(() => {
  const norm = value => String(value || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const tables = Array.from(document.querySelectorAll('table'));
  const table = tables.find(candidate => {
    const headers = Array.from(candidate.querySelectorAll('th')).map(th => norm(th.textContent));
    return headers.includes('CEDULA') && headers.includes('ESTADO') && (headers.includes('FECHA_DE_ESTADO') || headers.includes('FECHA_ESTADO'));
  });
  if (!table) return { tableFound: false, label: '', nextFound: false, nextEnabled: false };
  const region = table.closest('.a-IRR-region') || table.closest('.a-IRR') || table.parentElement || document;
  const labelEl = region.querySelector('.a-IRR-pagination-label') || document.querySelector('.a-IRR-pagination-label');
  const buttons = Array.from(region.querySelectorAll('.a-IRR-pagination button, button.a-IRR-button--pagination, .a-IRR-pagination a, a.a-IRR-button--pagination'));
  const isNext = element => {
    const text = norm([
      element.getAttribute('aria-label') || '',
      element.getAttribute('title') || '',
      element.textContent || '',
    ].join(' '));
    if (text.includes('NEXT') || text.includes('SIGUIENTE') || text.includes('PROXIMO')) return true;
    return Boolean(element.querySelector('.icon-right-chevron, .fa-chevron-right, .fa-angle-right'));
  };
  const next = buttons.find(isNext) || null;
  const disabled = !next || next.disabled || next.getAttribute('aria-disabled') === 'true' || next.classList.contains('is-disabled') || next.closest('li')?.classList.contains('is-disabled');
  return {
    tableFound: true,
    label: labelEl ? String(labelEl.textContent || '').replace(/\\s+/g, ' ').trim() : '',
    nextFound: Boolean(next),
    nextEnabled: Boolean(next && !disabled),
  };
})()`;

export const APEX_PAGINATION_CLICK_NEXT_EXPRESSION = `(() => {
  const norm = value => String(value || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const tables = Array.from(document.querySelectorAll('table'));
  const table = tables.find(candidate => {
    const headers = Array.from(candidate.querySelectorAll('th')).map(th => norm(th.textContent));
    return headers.includes('CEDULA') && headers.includes('ESTADO') && (headers.includes('FECHA_DE_ESTADO') || headers.includes('FECHA_ESTADO'));
  });
  if (!table) return { clicked: false, reason: 'TABLE_NOT_FOUND' };
  const region = table.closest('.a-IRR-region') || table.closest('.a-IRR') || table.parentElement || document;
  const buttons = Array.from(region.querySelectorAll('.a-IRR-pagination button, button.a-IRR-button--pagination, .a-IRR-pagination a, a.a-IRR-button--pagination'));
  const isNext = element => {
    const text = norm([
      element.getAttribute('aria-label') || '',
      element.getAttribute('title') || '',
      element.textContent || '',
    ].join(' '));
    if (text.includes('NEXT') || text.includes('SIGUIENTE') || text.includes('PROXIMO')) return true;
    return Boolean(element.querySelector('.icon-right-chevron, .fa-chevron-right, .fa-angle-right'));
  };
  const next = buttons.find(isNext) || null;
  const disabled = !next || next.disabled || next.getAttribute('aria-disabled') === 'true' || next.classList.contains('is-disabled') || next.closest('li')?.classList.contains('is-disabled');
  if (!next) return { clicked: false, reason: 'NEXT_NOT_FOUND' };
  if (disabled) return { clicked: false, reason: 'NEXT_DISABLED' };
  next.click();
  return { clicked: true, reason: null };
})()`;

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocketUrl = webSocketUrl;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    if (typeof globalThis.WebSocket !== 'function') {
      throw new CaptureError('WEBSOCKET_UNAVAILABLE', 'Node no expone WebSocket. Se requiere Node 22 o superior.');
    }
    await new Promise((resolve, reject) => {
      const socket = new globalThis.WebSocket(this.webSocketUrl);
      this.socket = socket;
      const timer = setTimeout(() => reject(new CaptureError('CDP_CONNECT_TIMEOUT', 'Chrome DevTools no respondió a tiempo.')), 10000);
      socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new CaptureError('CDP_CONNECT_FAILED', 'No fue posible conectar con Chrome DevTools.'));
      });
      socket.addEventListener('message', event => {
        try {
          const message = JSON.parse(String(event.data));
          if (!message.id) return;
          const pending = this.pending.get(message.id);
          if (!pending) return;
          this.pending.delete(message.id);
          if (message.error) pending.reject(new CaptureError('CDP_PROTOCOL_ERROR', message.error.message || 'Error de protocolo CDP.'));
          else pending.resolve(message.result || {});
        } catch {
          // Ignorar eventos CDP no relacionados con una solicitud pendiente.
        }
      });
      socket.addEventListener('close', () => {
        for (const pending of this.pending.values()) {
          pending.reject(new CaptureError('CDP_CLOSED', 'Chrome DevTools cerró la conexión.'));
        }
        this.pending.clear();
      });
    });
  }

  send(method, params = {}) {
    if (!this.socket || this.socket.readyState !== globalThis.WebSocket.OPEN) {
      return Promise.reject(new CaptureError('CDP_NOT_CONNECTED', 'Chrome DevTools no está conectado.'));
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: false,
    });
    if (result.exceptionDetails) {
      throw new CaptureError('CDP_EVALUATION_ERROR', 'Chrome no pudo evaluar el estado de la página.');
    }
    return result.result?.value;
  }

  close() {
    try {
      this.socket?.close();
    } catch {
      // Cierre best-effort de una conexión local efímera.
    }
  }
}

async function listTargets(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new CaptureError('DEVTOOLS_HTTP_ERROR', `Chrome DevTools respondió HTTP ${response.status}.`);
  const targets = await response.json();
  return Array.isArray(targets) ? targets : [];
}

export function selectConapeTarget(targets) {
  const candidates = (Array.isArray(targets) ? targets : [])
    .filter(target => target?.type === 'page' && target?.webSocketDebuggerUrl && isAllowedConapeTarget(target.url));
  candidates.sort((a, b) => {
    const aP = new URL(a.url).searchParams.get('p') || '';
    const bP = new URL(b.url).searchParams.get('p') || '';
    const aExact = aP.startsWith(`${CONAPE_APP_ID}:1`) ? 1 : 0;
    const bExact = bP.startsWith(`${CONAPE_APP_ID}:1`) ? 1 : 0;
    return bExact - aExact;
  });
  return candidates[0] || null;
}

async function waitForConapeTarget(port, timeoutAt, onStatus) {
  let lastStatus = '';
  while (Date.now() < timeoutAt) {
    try {
      const target = selectConapeTarget(await listTargets(port));
      if (target) return target;
    } catch (error) {
      if (lastStatus !== 'waiting-devtools') {
        onStatus?.('waiting-devtools', error);
        lastStatus = 'waiting-devtools';
      }
    }
    await sleep(POLL_MS);
  }
  throw new CaptureError('CONAPE_TAB_NOT_FOUND', 'No apareció una pestaña permitida de CONAPE antes del timeout.');
}

async function readOuterHtml(client) {
  return String(await client.evaluate('document.documentElement ? document.documentElement.outerHTML : ""') || '');
}

async function waitForParsableReport(client, timeoutAt, onStatus) {
  let announcedLogin = false;
  while (Date.now() < timeoutAt) {
    const html = await readOuterHtml(client);
    const parsed = parseConapeApexReport(html, { capturedAt: new Date().toISOString() });
    if (parsed.ok) return { html, parsed };

    const reason = parsed.error?.reason;
    if (reason === 'APEX_ORACLE_ERROR' || reason === 'APEX_ERROR') {
      throw new CaptureError('APEX_SOURCE_ERROR', `CONAPE devolvió ${reason}.`);
    }
    if (!announcedLogin && (reason === 'APEX_LOGIN_PAGE' || reason === 'APEX_SESSION_EXPIRED' || reason === 'APEX_REPORT_NOT_FOUND')) {
      onStatus?.('waiting-login-or-report', { reason });
      announcedLogin = true;
    }
    await sleep(POLL_MS);
  }
  throw new CaptureError('APEX_REPORT_TIMEOUT', 'No apareció un reporte CONAPE parseable antes del timeout.');
}

async function probePagination(client) {
  const value = await client.evaluate(APEX_PAGINATION_PROBE_EXPRESSION);
  const probe = value && typeof value === 'object' ? value : {};
  return {
    tableFound: Boolean(probe.tableFound),
    label: String(probe.label || ''),
    parsedLabel: parsePaginationLabel(probe.label),
    nextFound: Boolean(probe.nextFound),
    nextEnabled: Boolean(probe.nextEnabled),
  };
}

async function clickNext(client) {
  const value = await client.evaluate(APEX_PAGINATION_CLICK_NEXT_EXPRESSION);
  return value && typeof value === 'object' ? value : { clicked: false, reason: 'INVALID_RESULT' };
}

async function waitForDifferentPage(client, previousFingerprint, timeoutMs) {
  const timeoutAt = Date.now() + timeoutMs;
  while (Date.now() < timeoutAt) {
    await sleep(POLL_MS);
    const html = await readOuterHtml(client);
    const parsed = parseConapeApexReport(html, { capturedAt: new Date().toISOString() });
    if (!parsed.ok) continue;
    const fingerprint = pageFingerprint(parsed);
    if (fingerprint && fingerprint !== previousFingerprint) return { html, parsed };
  }
  throw new CaptureError('PAGINATION_TIMEOUT', 'APEX no cambió de página después de solicitar Siguiente.');
}

function resolveDevToolsPort({ profileDir, port }) {
  if (port != null) {
    const numeric = Number(port);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 65535) {
      throw new CaptureError('DEVTOOLS_PORT_INVALID', '--port debe ser un entero entre 1 y 65535.');
    }
    return numeric;
  }
  if (!profileDir) throw new CaptureError('DEVTOOLS_ENDPOINT_REQUIRED', 'Se requiere --profile o --port.');
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  if (!fs.existsSync(portFile)) throw new CaptureError('DEVTOOLS_PORT_FILE_MISSING', 'No existe DevToolsActivePort en el perfil temporal.');
  return parseDevToolsActivePort(fs.readFileSync(portFile, 'utf8')).port;
}

export async function captureConapeFromChrome({
  profileDir = null,
  port = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pageChangeTimeoutMs = DEFAULT_PAGE_CHANGE_TIMEOUT_MS,
  maxPages = DEFAULT_MAX_PAGES,
  onStatus = null,
} = {}) {
  const devToolsPort = resolveDevToolsPort({ profileDir, port });
  const timeoutAt = Date.now() + Number(timeoutMs || DEFAULT_TIMEOUT_MS);
  const target = await waitForConapeTarget(devToolsPort, timeoutAt, onStatus);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  const capturedAt = new Date().toISOString();

  try {
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');

    let current = await waitForParsableReport(client, timeoutAt, onStatus);
    const parsedPages = [];
    const paginationStates = [];
    const seen = new Set();

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      const fingerprint = pageFingerprint(current.parsed);
      if (!fingerprint) throw new CaptureError('PAGE_FINGERPRINT_MISSING', `No se pudo identificar la página ${pageNumber}.`);
      if (seen.has(fingerprint)) throw new CaptureError('PAGINATION_LOOP', `La página ${pageNumber} ya había sido capturada.`);
      seen.add(fingerprint);

      parsedPages.push(current.parsed);
      const pagination = await probePagination(client);
      paginationStates.push(pagination);
      onStatus?.('page-captured', {
        page: pageNumber,
        rows: current.parsed.records.length,
        label: pagination.label,
      });

      if (!pagination.nextEnabled) {
        const aggregate = aggregateParsedPages(parsedPages, paginationStates);
        return {
          ok: true,
          evidence: 'E2_AUTHENTICATED_READONLY',
          captured_at: capturedAt,
          target: sanitizeConapeUrl(target.url),
          coverage: pagination.nextFound ? 'END_OF_APEX_PAGINATION' : (parsedPages.length === 1 ? 'SINGLE_PAGE_OR_NO_PAGINATION' : 'END_OF_DISCOVERED_PAGINATION'),
          ...aggregate,
        };
      }

      const clicked = await clickNext(client);
      if (!clicked.clicked) {
        throw new CaptureError('PAGINATION_CLICK_BLOCKED', `No se pudo avanzar a la página ${pageNumber + 1}.`, { reason: clicked.reason });
      }
      current = await waitForDifferentPage(client, fingerprint, pageChangeTimeoutMs);
    }

    throw new CaptureError('MAX_PAGES_EXCEEDED', `La captura alcanzó el límite de ${maxPages} páginas.`);
  } finally {
    client.close();
  }
}

export function safeCaptureSummary(capture) {
  return {
    ok: Boolean(capture?.ok),
    evidence: capture?.evidence || null,
    captured_at: capture?.captured_at || null,
    target: capture?.target || null,
    coverage: capture?.coverage || null,
    source: capture?.summary?.source || null,
    pages_captured: capture?.summary?.pages_captured ?? null,
    records_captured: capture?.summary?.records_captured ?? null,
    dataset_fingerprint: capture?.summary?.dataset_fingerprint || null,
    states: capture?.summary?.states || {},
    warnings_count: capture?.summary?.warnings_count ?? null,
    invalid_dates: capture?.summary?.invalid_dates ?? null,
    invalid_identifications: capture?.summary?.invalid_identifications ?? null,
    duplicate_identities: capture?.summary?.duplicate_identities ?? null,
    unknown_states: capture?.summary?.unknown_states ?? null,
    pagination_total: capture?.summary?.pagination_total ?? null,
  };
}

function parseCliArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];
    if (token === '--profile' && next) { args.profileDir = path.resolve(next); i += 1; continue; }
    if (token === '--port' && next) { args.port = Number(next); i += 1; continue; }
    if (token === '--timeout-ms' && next) { args.timeoutMs = Number(next); i += 1; continue; }
    if (token === '--page-timeout-ms' && next) { args.pageChangeTimeoutMs = Number(next); i += 1; continue; }
    if (token === '--max-pages' && next) { args.maxPages = Number(next); i += 1; continue; }
    if (token === '--help' || token === '-h') { args.help = true; continue; }
    throw new CaptureError('CLI_ARGUMENT_INVALID', `Argumento no reconocido: ${redactSensitiveText(token)}`);
  }
  return args;
}

function printHelp() {
  console.log('Uso: node capture_chrome_cdp.mjs --profile <directorio> [--timeout-ms 300000]');
  console.log('Alternativa: node capture_chrome_cdp.mjs --port <puerto-local>');
  console.log('El capturador no imprime registros personales ni persiste HTML/cookies/sesiones.');
}

async function mainCli() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      return;
    }

    let loginMessageShown = false;
    const capture = await captureConapeFromChrome({
      ...args,
      onStatus: (event, detail) => {
        if (event === 'waiting-login-or-report' && !loginMessageShown) {
          console.log('C3.2: esperando que complete el inicio de sesión y aparezca el reporte Prospectación Reclutador...');
          loginMessageShown = true;
        } else if (event === 'page-captured') {
          const suffix = detail.label ? ` · ${detail.label}` : '';
          console.log(`C3.2: página ${detail.page} capturada · ${detail.rows} filas${suffix}`);
        }
      },
    });

    console.log('\nC3.2 CONAPE Portal Capture: PASS');
    console.log(JSON.stringify(safeCaptureSummary(capture), null, 2));
  } catch (error) {
    const reason = error instanceof CaptureError ? error.reason : 'UNEXPECTED_ERROR';
    console.error(`\nC3.2 CONAPE Portal Capture: BLOCK_CAPTURE / ${reason}`);
    console.error(redactSensitiveText(error?.message || String(error)));
    process.exitCode = 1;
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  await mainCli();
}

export const conapeCaptureContract = Object.freeze({
  host: CONAPE_HOST,
  appId: CONAPE_APP_ID,
  defaultTimeoutMs: DEFAULT_TIMEOUT_MS,
  defaultMaxPages: DEFAULT_MAX_PAGES,
  requiredHeaderKeys: ['CEDULA', 'ESTADO', 'FECHA_DE_ESTADO'],
  requiredHeaderTableExpression,
});
