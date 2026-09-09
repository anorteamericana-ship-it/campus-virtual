import {
  APEX_PAGINATION_CLICK_NEXT_EXPRESSION,
  APEX_PAGINATION_PROBE_EXPRESSION,
  aggregateParsedPages,
  conapeCaptureContract,
  isAllowedConapeTarget,
  pageFingerprint,
  parseDevToolsActivePort,
  parsePaginationLabel,
  redactSensitiveText,
  safeCaptureSummary,
  sanitizeConapeUrl,
  selectConapeTarget,
} from './conape_portal/capture_chrome_cdp.mjs';
import { parseConapeApexReport } from './conape_portal/parse_apex_report.mjs';

const failures = [];
const pass = msg => console.log(`PASS C3.2: ${msg}`);
const check = (condition, msg) => condition ? pass(msg) : failures.push(msg);

const activePort = parseDevToolsActivePort('43127\n/devtools/browser/abc123\n');
check(activePort.port === 43127 && activePort.browserWebSocketPath === '/devtools/browser/abc123', 'DevToolsActivePort se interpreta sin depender de un puerto fijo');

check(isAllowedConapeTarget('https://online.conape.go.cr/apex/f?p=302:1:123456789:::::') === true, 'acepta únicamente la aplicación CONAPE esperada');
check(isAllowedConapeTarget('https://online.conape.go.cr/apex/f?p=999:1:123456789:::::') === false, 'rechaza otra aplicación APEX');
check(isAllowedConapeTarget('https://online.conape.go.cr.evil.example/apex/f?p=302:1') === false, 'rechaza hostname parecido pero no exacto');
check(isAllowedConapeTarget('http://online.conape.go.cr/apex/f?p=302:1') === false, 'rechaza esquema no HTTPS');

const sanitized = sanitizeConapeUrl('https://online.conape.go.cr/apex/f?p=302:1:987654321:RR,1:::&session=987654321&p_instance=222');
check(sanitized === 'https://online.conape.go.cr/apex/f?p=302:1', 'URL segura elimina sesión, request e instancia');
check(!/987654321|p_instance|session=/i.test(sanitized), 'URL segura no conserva secretos de sesión');

const redacted = redactSensitiveText('session=123456 p_instance=777 p_request=ABC cookie=SID123 authorization=BearerToken f?p=302:1:999999:REQ::::');
check(!/123456|777|ABC|SID123|BearerToken|999999/.test(redacted), 'redactor elimina identificadores de sesión y cabeceras sensibles');
check((redacted.match(/\[REDACTED\]/g) || []).length >= 6, 'redactor deja evidencia explícita de redacción');

const englishPage = parsePaginationLabel('1 - 15 of 37');
check(englishPage.start === 1 && englishPage.end === 15 && englishPage.total === 37, 'interpreta paginación APEX en inglés');
const spanishPage = parsePaginationLabel('16 - 30 de 37');
check(spanishPage.start === 16 && spanishPage.end === 30 && spanishPage.total === 37, 'interpreta paginación APEX en español');
const unknownTotal = parsePaginationLabel('31 - 37');
check(unknownTotal.start === 31 && unknownTotal.end === 37 && unknownTotal.total === null, 'tolera rango sin total sin inventarlo');

const targets = [
  { type: 'page', url: 'https://example.com/', webSocketDebuggerUrl: 'ws://127.0.0.1/other' },
  { type: 'page', url: 'https://online.conape.go.cr/apex/f?p=302:9:111:::::', webSocketDebuggerUrl: 'ws://127.0.0.1/page9' },
  { type: 'page', url: 'https://online.conape.go.cr/apex/f?p=302:1:222:::::', webSocketDebuggerUrl: 'ws://127.0.0.1/page1' },
];
const selected = selectConapeTarget(targets);
check(selected?.webSocketDebuggerUrl === 'ws://127.0.0.1/page1', 'selecciona la página 1 del app 302 cuando hay varias pestañas permitidas');

function oneRow(cedula, name, state, date) {
  return `<html><body><table><tr><th>Cédula</th><th>Nombre</th><th>Estado</th><th>Fecha de Estado</th></tr><tr><td>${cedula}</td><td>${name}</td><td>${state}</td><td>${date}</td></tr></table></body></html>`;
}

const pageA = parseConapeApexReport(oneRow('1-1111-1111', 'PERSONA A', 'REGISTRO', '08/09/2026'));
const pageB = parseConapeApexReport(oneRow('2-2222-2222', 'PERSONA B', 'ANÁLISIS', '09/09/2026'));
check(pageA.ok && pageB.ok, 'páginas sintéticas pasan por el mismo parser C3.1');
check(pageFingerprint(pageA) !== pageFingerprint(pageB), 'fingerprint de página detecta avance real de paginación');

const aggregate = aggregateParsedPages(
  [pageA, pageB],
  [
    { parsedLabel: parsePaginationLabel('1 - 1 of 2') },
    { parsedLabel: parsePaginationLabel('2 - 2 of 2') },
  ],
);
check(aggregate.ok === true && aggregate.summary.records_captured === 2 && aggregate.summary.pages_captured === 2, 'agrega páginas sin perder paridad de filas');
check(aggregate.summary.pagination_total === 2, 'valida total reportado contra total capturado');
check(/^[a-f0-9]{64}$/.test(aggregate.summary.dataset_fingerprint), 'dataset fingerprint es SHA-256');
check(aggregate.summary.states.REGISTRO === 1 && aggregate.summary.states.ANALISIS === 1, 'resumen por estado no necesita imprimir PII');

let mismatchBlocked = false;
try {
  aggregateParsedPages([pageA, pageB], [{ parsedLabel: parsePaginationLabel('1 - 1 of 3') }, { parsedLabel: parsePaginationLabel('2 - 2 of 3') }]);
} catch (error) {
  mismatchBlocked = error?.reason === 'PAGINATION_TOTAL_MISMATCH';
}
check(mismatchBlocked, 'bloquea si APEX reporta más filas que las capturadas');

let loopBlocked = false;
try {
  aggregateParsedPages([pageA, pageA], [{ parsedLabel: parsePaginationLabel('1 - 1') }, { parsedLabel: parsePaginationLabel('1 - 1') }]);
} catch (error) {
  loopBlocked = error?.reason === 'PAGINATION_LOOP';
}
check(loopBlocked, 'bloquea repetición de página en vez de duplicar filas silenciosamente');

const safeSummary = safeCaptureSummary({
  ok: true,
  evidence: 'E2_AUTHENTICATED_READONLY',
  captured_at: '2026-09-09T23:30:00.000Z',
  target: sanitized,
  coverage: 'END_OF_APEX_PAGINATION',
  summary: aggregate.summary,
  records: aggregate.records,
});
const safeSerialized = JSON.stringify(safeSummary);
check(!safeSerialized.includes('PERSONA A') && !safeSerialized.includes('111111111'), 'salida CLI segura excluye nombres y cédulas');
check(safeSummary.records_captured === 2 && safeSummary.dataset_fingerprint === aggregate.summary.dataset_fingerprint, 'salida CLI conserva métricas y fingerprint útiles');

check(conapeCaptureContract.host === 'online.conape.go.cr' && conapeCaptureContract.appId === '302', 'contrato fija host y app permitidos');
check(new Function(`return ${APEX_PAGINATION_PROBE_EXPRESSION};`) !== null, 'expresión de sondeo de paginación compila');
check(new Function(`return ${APEX_PAGINATION_CLICK_NEXT_EXPRESSION};`) !== null, 'expresión de avance de paginación compila');

if (failures.length) {
  console.error('\nC3.2 FAILURES:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('\nC3.2 CONAPE Portal Capture QA: PASS (contrato local/CDP + privacidad + paginación)');
