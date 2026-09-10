import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CaptureError,
  captureConapeFromChrome,
  redactSensitiveText,
  safeCaptureSummary,
} from './capture_chrome_cdp.mjs';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const RETRY_DELAY_MS = 1000;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

export function classifyLiveCapture(capture) {
  if (!capture?.ok) {
    return { ready: false, reason: 'CAPTURE_NOT_OK' };
  }
  const rows = Number(capture?.summary?.records_captured ?? capture?.records?.length ?? 0);
  if (!Number.isInteger(rows) || rows < 1) {
    return { ready: false, reason: 'ZERO_ROWS_UNCONFIRMED', rows: 0 };
  }
  return { ready: true, reason: null, rows };
}

export async function captureConapeLiveGate({
  profileDir = null,
  port = null,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pageChangeTimeoutMs = 20_000,
  maxPages = 250,
  onStatus = null,
} = {}) {
  const deadline = Date.now() + Number(timeoutMs || DEFAULT_TIMEOUT_MS);
  let zeroSeen = false;
  let zeroNoticeSent = false;
  let loginNoticeSent = false;

  while (Date.now() < deadline) {
    const remainingMs = Math.max(1000, deadline - Date.now());
    try {
      const capture = await captureConapeFromChrome({
        profileDir,
        port,
        timeoutMs: remainingMs,
        pageChangeTimeoutMs,
        maxPages,
        onStatus: (event, detail) => {
          if (event === 'waiting-login-or-report') {
            if (!loginNoticeSent) {
              onStatus?.(event, detail);
              loginNoticeSent = true;
            }
            return;
          }
          if (event === 'page-captured' && Number(detail?.rows || 0) === 0) {
            return;
          }
          onStatus?.(event, detail);
        },
      });

      const classification = classifyLiveCapture(capture);
      if (classification.ready) {
        return capture;
      }

      zeroSeen = true;
      if (!zeroNoticeSent) {
        onStatus?.('zero-rows-unconfirmed', {
          message: 'El reporte fue reconocido, pero todavía tiene 0 filas. C3.2 no lo acepta como E2; seleccione los filtros necesarios y ejecute Go/Buscar.',
        });
        zeroNoticeSent = true;
      }
      await sleep(RETRY_DELAY_MS);
    } catch (error) {
      if (error instanceof CaptureError && error.reason === 'APEX_REPORT_TIMEOUT' && zeroSeen) {
        throw new CaptureError(
          'ZERO_ROWS_UNCONFIRMED',
          'El reporte fue reconocido durante la sesión, pero nunca presentó al menos una fila antes del timeout. No se declara E2.',
        );
      }
      throw error;
    }
  }

  throw new CaptureError(
    zeroSeen ? 'ZERO_ROWS_UNCONFIRMED' : 'APEX_REPORT_TIMEOUT',
    zeroSeen
      ? 'El reporte permaneció en 0 filas hasta agotar el tiempo. No se declara E2.'
      : 'No apareció un reporte CONAPE parseable antes del timeout.',
  );
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
  console.log('Uso: node capture_live_gate.mjs --profile <directorio> [--timeout-ms 600000]');
  console.log('C3.2b exige al menos una fila real antes de declarar E2 autenticada read-only.');
}

async function mainCli() {
  try {
    const args = parseCliArgs(process.argv.slice(2));
    if (args.help) {
      printHelp();
      return;
    }

    const capture = await captureConapeLiveGate({
      ...args,
      onStatus: (event, detail) => {
        if (event === 'waiting-login-or-report') {
          console.log('C3.2: esperando que complete el inicio de sesión y aparezca el reporte Prospectación Reclutador...');
        } else if (event === 'zero-rows-unconfirmed') {
          console.log('C3.2: reporte reconocido con 0 filas; esperando que seleccione Prospectador/Evento y ejecute Go/Buscar. No se declara E2 todavía.');
        } else if (event === 'page-captured') {
          const suffix = detail?.label ? ` · ${detail.label}` : '';
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
