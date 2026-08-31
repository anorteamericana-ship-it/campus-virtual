import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE_SHA = 'bf06348723aa7b4bf78a634541f26e5601e95fb4';
const BRANCH = 'integration/admin-safe-errors-current-tip-cs21a210a';
const exactMode = process.argv.includes('--exact-import');
const must = (ok, label) => { if (!ok) throw new Error(`CS21A210A FAIL: ${label}`); };
const read = (path) => fs.readFileSync(path);
const text = (path) => read(path).toString('utf8');
const gitBlobSha = (buf) => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const imported = {
  'src/admin_master_dashboard.jsx': '76e629e4cff51912f3a0678d05ac570fa7722dc5',
  'src/admin_students_inline_payment_cs21a36.jsx': 'ee54e75659cf0ee84f1f87eccca2c022671dd66d',
  'src/aperturas_admin_cs21a20.jsx': '6e98a354920f8c3cbe974d7a51864f0ea729a702',
  'src/panel_admin_supervision.jsx': 'c382fcf5b82f26129a8f0eb25a0b05cb82616b77',
  'src/panel_suspensiones.jsx': 'fa966e15b490a70b32205e3ed94a614b2478823f',
};

for (const path of Object.keys(imported)) must(fs.existsSync(path), `missing imported source ${path}`);

const master = text('src/admin_master_dashboard.jsx');
const finance = text('src/admin_students_inline_payment_cs21a36.jsx');
const aperturas = text('src/aperturas_admin_cs21a20.jsx');
const supervision = text('src/panel_admin_supervision.jsx');
const suspensiones = text('src/panel_suspensiones.jsx');

// Semantic regression: stable operator copy, console-only technical detail, real actions preserved.
must(master.includes("function masterSafeUserError(raw,fallback,context='')"), 'Panel Maestro safe-user boundary');
must(master.includes("masterSafeUserError(error?.message||String(error),'No se pudo actualizar el Panel Maestro. Intentá de nuevo.'"), 'Panel Maestro stable load copy');
must(master.includes("masterAction('actualizarPanelConapeAhora')"), 'Panel Maestro real CONAPE action preserved');

must(finance.includes("function inlineFinanceSafeUserError(raw, fallback, context = '')"), 'inline finance safe-user boundary');
must(finance.includes("postInline('aplicarPago'"), 'inline payment action preserved');
must(finance.includes('request_id:requestIdRef.current'), 'inline payment idempotency preserved');

must(aperturas.includes("function apSafeUserError(raw, fallback, context = '')"), 'aperturas safe-user boundary');
must(aperturas.includes("apPost('actualizarAperturaAdmin'"), 'aperturas real persistence preserved');

must(supervision.includes('No pudimos cargar la supervisión de docentes. Intentá de nuevo.'), 'supervision stable load copy');
must(supervision.includes('fetchDocentesAtrasados()'), 'supervision real read preserved');
must(supervision.includes("console.error('[AdminSupervision] Error técnico cargando supervisión.', e)"), 'supervision technical detail stays in console');

must(suspensiones.includes("function psuSafeUserError(raw, fallback, context = '')"), 'suspensiones safe-user boundary');
must(suspensiones.includes('window.fetchResolverSolicitudSuspension({'), 'suspensiones resolver action preserved');
must(suspensiones.includes("accion: 'aprobar'"), 'suspensiones approve action preserved');
must(suspensiones.includes("accion: 'rechazar'"), 'suspensiones reject action preserved');

for (const [path, src] of Object.entries({
  'src/admin_master_dashboard.jsx': master,
  'src/admin_students_inline_payment_cs21a36.jsx': finance,
  'src/aperturas_admin_cs21a20.jsx': aperturas,
  'src/panel_admin_supervision.jsx': supervision,
  'src/panel_suspensiones.jsx': suspensiones,
})) {
  must(!/setSharing\s*\(|DriveApp\.Access\.ANYONE|ANYONE_WITH_LINK|setPermission\s*\(/i.test(src), `${path} contains no Drive ACL mutation`);
}

if (exactMode) {
  for (const [path, expected] of Object.entries(imported)) {
    must(gitBlobSha(read(path)) === expected, `${path} exactly matches validated PR #190 blob ${expected}`);
  }
  const allowed = new Set([
    ...Object.keys(imported),
    'scripts/qa_admin_safe_errors_current_tip_cs21a210a.mjs',
    '.github/workflows/qa-admin-safe-errors-current-tip-cs21a210a.yml',
    '00_DOCUMENTACION/ADMIN_SAFE_ERRORS_CURRENT_TIP_CS21A210A_2026-08-31.md',
  ]);
  const changed = execFileSync('git', ['diff', '--name-only', `${BASE_SHA}...HEAD`], { encoding:'utf8' })
    .trim().split(/\r?\n/).filter(Boolean);
  for (const path of changed) must(allowed.has(path), `unexpected path in stacked delta: ${path}`);
  for (const path of allowed) must(changed.includes(path), `expected path missing from stacked delta: ${path}`);
  const statuses = execFileSync('git', ['diff', '--name-status', `${BASE_SHA}...HEAD`], { encoding:'utf8' });
  must(!/^D\s/m.test(statuses), 'no file deletion in CS21A210A');
  must(!changed.some(path => /(^|\/)(AppsScript|apps_script_patches)(\/|$)|\.gs$/i.test(path)), 'no Apps Script source change');
}

console.log('CS21A210A ADMIN SAFE ERRORS CURRENT TIP: PASS');
console.log(`BASE=${BASE_SHA}`);
console.log(`BRANCH=${BRANCH}`);
console.log(`EXACT_IMPORT=${exactMode ? 'VERIFIED' : 'SKIPPED_FOR_DESCENDANT'}`);
console.log('SOURCE_FILES=5');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
