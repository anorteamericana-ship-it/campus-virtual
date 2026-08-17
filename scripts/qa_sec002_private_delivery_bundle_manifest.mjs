import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('qa/sec002_private_delivery_bundle_manifest.json', 'utf8'));
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

check('bundle id/version fixed', manifest.id === 'SEC002-PRIVATE-DELIVERY-BUNDLE-2');
check('production explicitly forbidden', manifest.production_allowed === false);
check('canonical source SHA fixed', manifest.canonical_code_sha256 === 'd24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37');
check('canonical bundle SHA fixed', manifest.canonical_bundle?.expected_sha256 === 'da81ffbd44341dba884c2ff647f721cbd1b53b447b39c6e11cf2d67c8ac6df06');
check('canonical bundle size fixed', manifest.canonical_bundle?.expected_size_bytes === 2997898);
check('bundle expects 23 canonical diff hunks', manifest.canonical_bundle?.expected_diff_hunks === 23);
check('bundle expects 24 ordered patch hunks', manifest.canonical_bundle?.expected_ordered_patch_hunks === 24);
check('bundle expects +687/-57 canonical diff', manifest.canonical_bundle?.expected_additions === 687 && manifest.canonical_bundle?.expected_deletions === 57);
check('bundle keeps 11 transition public-share calls', manifest.canonical_bundle?.expected_anyone_with_link_calls === 11);
check('Memory Match declared unchanged', manifest.canonical_bundle?.memory_match_changed_lines === 0 && manifest.install_gate?.memory_match_read_only === true);
check('English LAB declared unchanged', manifest.canonical_bundle?.english_lab_changed_lines === 0);
check('project files preserved', manifest.install_gate?.never_replace_full_project === true && manifest.install_gate?.preserve_other_apps_script_files === true && manifest.install_gate?.preserve_cs21a201_and_later_files === true);
check('same QA deployment required', manifest.install_gate?.keep_existing_qa_deployment_id === true);
check('ACL removal forbidden during bundle install', manifest.install_gate?.remove_public_acl_during_bundle_install === false);
check('mismatched current Code.gs must stop', manifest.install_gate?.if_current_code_sha_differs === 'STOP_AND_RECONCILE_CURRENT_QA_CODE');
check('fuzzy application is forbidden', manifest.install_gate?.automatic_fuzzy_patch_application === false);

const expectedPaths = [
  'qa/sec002_private_certificate_delta.patch',
  'qa/sec002_ventas_extra_private_delta.patch',
  'qa/sec002_payment_receipt_private_delta.patch',
  'qa/sec002_signed_enrollment_on_bundle_delta.patch',
];
const ordered = [...(manifest.ordered_deltas || [])].sort((a,b) => a.order - b.order);
check('exactly four ordered deltas', ordered.length === 4);
check('delta order fixed', ordered.map(x => x.path).join('|') === expectedPaths.join('|'));
check('signed enrollment reconciled base SHA fixed', ordered[3]?.reconciled_base_sha256 === '4cd23d409e1c09881b214df9c75be36be7413790b3a13d2ddbaefa3c1a359abe');
check('signed enrollment fuzz explicitly forbidden', ordered[3]?.fuzz_allowed === false);

let totalHunks = 0;
let allAdded = '';
let allRemoved = '';
for (const item of ordered) {
  check(`patch exists ${item.path}`, fs.existsSync(item.path));
  if (!fs.existsSync(item.path)) continue;
  const text = fs.readFileSync(item.path, 'utf8');
  const hunks = (text.match(/^@@ /gm) || []).length;
  totalHunks += hunks;
  check(`hunk contract ${item.path}`, hunks === item.expected_hunks, `expected=${item.expected_hunks} observed=${hunks}`);
  allAdded += '\n' + text.split(/\r?\n/).filter(x => /^\+(?!\+\+)/.test(x)).join('\n');
  allRemoved += '\n' + text.split(/\r?\n/).filter(x => /^-(?!--)/.test(x)).join('\n');
}
check('individual ordered patch hunk total is 24', totalHunks === 24, `observed=${totalHunks}`);

for (const fn of ['descargarMiCertificadoPrivado','descargarDocumentoExtraPrivado','descargarComprobantePagoPrivado','descargarMatriculaFirmadaPrivada']) {
  check(`bundle sources declare ${fn}`, allAdded.includes(`function ${fn}`));
}
check('bundle sources do not edit Memory Match', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match/.test(allAdded));
check('bundle sources do not edit English LAB games', !/englishLabLive|englishLabQuizTime|englishLabWordSearch|englishLabHangman|englishLabSentenceOrder/.test(allAdded));

// The signed-enrollment reconciliation intentionally removes two setSharing calls
// that used to re-publicize files on lookup/notification. It does NOT revoke an ACL.
const signedPatch = fs.readFileSync('qa/sec002_signed_enrollment_on_bundle_delta.patch', 'utf8');
const signedRemoved = signedPatch.split(/\r?\n/).filter(x => /^-(?!--)/.test(x)).join('\n');
const signedAdded = signedPatch.split(/\r?\n/).filter(x => /^\+(?!\+\+)/.test(x)).join('\n');
check('signed bundle step removes two re-publication calls only', (signedRemoved.match(/setSharing\(DriveApp\.Access\.ANYONE_WITH_LINK/g) || []).length === 2);
check('signed upload still preserves transition public sharing', signedAdded.includes('Transición SEC-002: mantener ACL actual'));
check('signed step has no setSharing revoke/private ACL mutation', !/DriveApp\.Access\.PRIVATE|revokePermissions|removeViewer|removeEditor/.test(signedAdded));

const builder = fs.readFileSync('scripts/build_sec002_private_delivery_bundle.py', 'utf8');
check('builder verifies input canonical SHA before patch', builder.includes("observed_sha != canonical_sha") && builder.includes('STOP_AND_RECONCILE_CURRENT_QA_CODE'));
check('builder applies manifest order', builder.includes("for item in manifest['ordered_deltas']"));
check('builder requires fuzz zero', builder.includes("'--fuzz=0'"));
check('builder verifies reconciled intermediate base SHA', builder.includes("item.get('reconciled_base_sha256')") && builder.includes('reconciled base SHA mismatch'));
check('builder requires final SHA and size', builder.includes("expected['expected_sha256']") && builder.includes("expected['expected_size_bytes']"));
check('builder requires exact endpoint definition counts', builder.includes('expected_private_endpoint_definitions'));

if (failures.length) {
  console.error(`SEC002 PRIVATE DELIVERY BUNDLE MANIFEST: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 PRIVATE DELIVERY BUNDLE MANIFEST: PASS');
