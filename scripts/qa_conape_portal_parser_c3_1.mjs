import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseConapeApexReport, normalizeDate, normalizeState } from './conape_portal/parse_apex_report.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const fixture = name => fs.readFileSync(path.join(root, 'tests', 'fixtures', 'conape_portal', name), 'utf8');
const failures = [];
const pass = msg => console.log(`PASS C3.1: ${msg}`);
const check = (condition, msg) => condition ? pass(msg) : failures.push(msg);

const capturedAt = '2026-09-09T17:15:00-06:00';

const multi = parseConapeApexReport(fixture('report_multi_row.html'), { capturedAt });
check(multi.ok === true, 'multi-row fixture parses');
check(multi.metrics.html_rows_detected === 3 && multi.metrics.records_parsed === 3, 'row parity 3 = 3');
check(multi.records[0]?.cedula === '111111111', 'Costa Rica formatted identification is normalized to digits');
check(multi.records[0]?.estado_raw === 'INICIÓ SOLICITUD' && multi.records[0]?.estado_key === 'INICIO_SOLICITUD', 'raw state is preserved and key normalized');
check(multi.records[1]?.fecha_estado === '2026-09-09', 'DD/MM/YYYY is normalized explicitly');
check(multi.records[2]?.fecha_aprobacion === '2026-08-31' && multi.records[2]?.fecha_formalizacion === '2026-09-04', 'approval/formalization dates parse');
check(multi.records.every(r => /^[a-f0-9]{64}$/.test(r.process_hash) && /^[a-f0-9]{64}$/.test(r.record_hash)), 'process and record hashes are SHA-256');

const unknown = parseConapeApexReport(fixture('report_unknown_state.html'));
check(unknown.ok === true, 'unknown state does not block parsing');
check(unknown.metrics.unknown_states === 1 && unknown.warnings.some(w => w.code === 'UNKNOWN_CONAPE_STATE'), 'unknown state emits explicit warning');

const duplicate = parseConapeApexReport(fixture('report_duplicate_identity.html'));
check(duplicate.ok === true, 'duplicate identity remains observable instead of being collapsed');
check(duplicate.records.length === 2 && duplicate.metrics.duplicate_identities === 1, 'duplicate identity is detected');
check(duplicate.warnings.some(w => w.code === 'DUPLICATE_SOURCE_IDENTITY'), 'duplicate identity warning is emitted');

const missingOptional = parseConapeApexReport(fixture('report_missing_optional.html'));
check(missingOptional.ok === true, 'missing optional columns do not block');
check(missingOptional.metrics.missing_optional_columns > 0 && missingOptional.warnings.some(w => w.code === 'OPTIONAL_COLUMN_MISSING'), 'missing optional columns emit warnings');

const missingRequired = parseConapeApexReport(fixture('report_missing_required.html'));
check(missingRequired.ok === false, 'missing required column blocks parser');
check(missingRequired.error?.code === 'BLOCK_PARSE' && missingRequired.error?.reason === 'REQUIRED_COLUMN_MISSING', 'required-column failure is classified');

const empty = parseConapeApexReport(fixture('report_empty.html'));
check(empty.ok === true && empty.records.length === 0, 'empty report is accepted only when valid report headers exist');
check(empty.metrics.html_rows_detected === 0 && empty.metrics.records_parsed === 0, 'empty report preserves 0 = 0 parity');

const reordered = parseConapeApexReport(fixture('report_reordered_columns.html'));
check(reordered.ok === true, 'reordered columns parse by header instead of fixed position');
check(reordered.records[0]?.cedula === '888888888' && reordered.records[0]?.estado_key === 'ANALISIS', 'reordered row maps to correct fields');

const login = parseConapeApexReport('<html><body><h1>Iniciar sesión</h1><label>Usuario</label><input><label>Contraseña</label><input type="password"></body></html>');
check(login.ok === false && login.error?.code === 'BLOCK_SOURCE', 'login/session source cannot masquerade as an empty report');

const invalidDate = normalizeDate('31/02/2026');
check(invalidDate.invalid === true && invalidDate.value === null, 'impossible date fails closed');
check(normalizeState('  Pasada   a BPM ').estado_key === 'PASADA_A_BPM', 'state whitespace normalization is deterministic');

function oneRow(name, phone) {
  return `<table><tr><th>Cédula</th><th>Nombre</th><th>Teléfono</th><th>Estado</th><th>Fecha de Estado</th></tr><tr><td>9-9999-9999</td><td>${name}</td><td>${phone}</td><td>ANÁLISIS</td><td>09/09/2026</td></tr></table>`;
}
const contactA = parseConapeApexReport(oneRow('PERSONA A', '80000001'));
const contactB = parseConapeApexReport(oneRow('PERSONA CORREGIDA', '80000002'));
check(contactA.ok && contactB.ok, 'contact-change samples parse');
check(contactA.records[0].process_hash === contactB.records[0].process_hash, 'contact-only change does not create a process movement');
check(contactA.records[0].record_hash !== contactB.records[0].record_hash, 'contact-only change remains detectable at record level');

const serialized = JSON.stringify({ multi, unknown, duplicate, missingOptional, empty, reordered });
for (const forbidden of ['session=', 'p_instance', 'cookie', 'authorization', 'p_request']) {
  check(!serialized.toLowerCase().includes(forbidden), `output does not persist ${forbidden}`);
}

if (failures.length) {
  console.error('\nC3.1 FAILURES:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log(`\nC3.1 CONAPE Portal Parser: PASS (${multi.metrics.records_parsed} representative rows + edge cases)`);
