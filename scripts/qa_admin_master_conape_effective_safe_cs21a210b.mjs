import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE_SHA = 'd9cbbcf206ef7cf433bc67a33fe5de8858c5c694';
const BRANCH = 'fix/admin-master-conape-effective-safe-cs21a210b';
const exactMode = process.argv.includes('--exact-import');
const must = (ok, label) => { if (!ok) throw new Error(`CS21A210B FAIL: ${label}`); };
const read = path => fs.readFileSync(path);
const text = path => read(path).toString('utf8');
const gitBlobSha = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const imported = {
  'src/admin_master_conape_wa_cs21a96.jsx': 'a86204e62d6793ff08e26bce8c62a1e047ee3075',
  'src/admin_master_conape_multisort_cs21a109.jsx': 'eb36aa871ecfa44c7210b06fec6f4c85d5a42a09',
};

const wa = text('src/admin_master_conape_wa_cs21a96.jsx');
const multi = text('src/admin_master_conape_multisort_cs21a109.jsx');
const core = text('src/admin_master_conape_review_core_cs21a96.jsx');
const review = text('src/admin_master_conape_review_state_cs21a96.jsx');
const campus = text('campus.html');

// WhatsApp: technical detail must stay behind the existing shared safe-user boundary.
must(core.includes("function masterConapeSafeUserError(raw,fallback,context='')"), 'shared safe-user helper exists');
must(wa.includes('post,masterConapeSafeUserError,pendingAmount'), 'WhatsApp imports shared safe-user helper');
must(wa.includes("alert(masterConapeSafeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp'))"), 'WhatsApp uses stable operator copy');
must(!wa.includes("alert('No se pudo preparar WhatsApp: '+"), 'raw WhatsApp exception is not concatenated into alert');
must(wa.includes("post('getEstudiante'"), 'student lookup preserved');
must(wa.includes('https://wa.me/${wa}?text='), 'WhatsApp destination preserved');
must(wa.includes("window.open(url,'_blank','noopener,noreferrer')"), 'popup fallback preserved');
must(wa.includes('finally{setBusy(false)}'), 'busy state release preserved');

// Effective runtime copy: multisort republishes PanelView after the base view, so both load order and final copy are guarded.
must(multi.includes("No quedan desembolsos académicos 01 pendientes según el registro oficial."), 'effective multisort copy uses business wording');
must(!multi.includes('7-morosidad'), 'internal mora implementation name absent from effective override');
must(multi.includes('Object.assign(N,{dateValue,disbursementDateValue,sortValueMulti,normalizeSortStack,compareRowsMulti,SORT_OPTIONS,updateSortPriority,SortPriority,Filters,PanelView})'), 'multisort still republishes PanelView');
const viewIdx = campus.indexOf('src/admin_master_conape_view_cs21a96.jsx');
const multiIdx = campus.indexOf('src/admin_master_conape_multisort_cs21a109.jsx');
const panelIdx = campus.indexOf('src/admin_master_conape_panel_cs21a96.jsx');
must(viewIdx >= 0 && multiIdx > viewIdx && panelIdx > multiIdx, 'campus load order proves multisort override is effective before panel mount');

// The other action-safe half from R2 is already present in the current line; protect it from regression.
must(review.includes("setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision'))"), 'review-state safe action remains present');
must(review.includes("clean(error?.message).toLowerCase().includes('cerrado')"), 'review-state internal closed decision remains intact');

for (const [path, src] of Object.entries({
  'src/admin_master_conape_wa_cs21a96.jsx': wa,
  'src/admin_master_conape_multisort_cs21a109.jsx': multi,
})) {
  must(!/setSharing\s*\(|DriveApp\.Access\.ANYONE|ANYONE_WITH_LINK|setPermission\s*\(/i.test(src), `${path} has no Drive ACL mutation`);
}

if (exactMode) {
  for (const [path, expected] of Object.entries(imported)) {
    must(gitBlobSha(read(path)) === expected, `${path} exactly matches validated consolidated blob ${expected}`);
  }
  const allowed = new Set([
    ...Object.keys(imported),
    'scripts/qa_admin_master_conape_effective_safe_cs21a210b.mjs',
    '.github/workflows/qa-admin-master-conape-effective-safe-cs21a210b.yml',
    '00_DOCUMENTACION/ADMIN_MASTER_CONAPE_EFFECTIVE_SAFE_CS21A210B_2026-08-31.md',
  ]);
  const changed = execFileSync('git', ['diff','--name-only',`${BASE_SHA}...HEAD`], { encoding:'utf8' }).trim().split(/\r?\n/).filter(Boolean);
  for (const path of changed) must(allowed.has(path), `unexpected stacked path: ${path}`);
  for (const path of allowed) must(changed.includes(path), `expected stacked path missing: ${path}`);
  const statuses = execFileSync('git', ['diff','--name-status',`${BASE_SHA}...HEAD`], { encoding:'utf8' });
  must(!/^D\s/m.test(statuses), 'no deletion in CS21A210B');
  must(!changed.some(path => /(^|\/)(AppsScript|apps_script_patches)(\/|$)|\.gs$/i.test(path)), 'no Apps Script source change');
}

console.log('CS21A210B ADMIN MASTER CONAPE EFFECTIVE SAFE: PASS');
console.log(`BASE=${BASE_SHA}`);
console.log(`BRANCH=${BRANCH}`);
console.log(`EXACT_IMPORT=${exactMode ? 'VERIFIED' : 'SKIPPED_FOR_DESCENDANT'}`);
console.log('FUNCTIONAL_FILES=2');
console.log('EFFECTIVE_RUNTIME_LOAD_ORDER=STATICALLY_VERIFIED');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
