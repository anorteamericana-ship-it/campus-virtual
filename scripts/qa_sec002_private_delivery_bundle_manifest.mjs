import fs from 'node:fs';
import crypto from 'node:crypto';

const manifest = JSON.parse(fs.readFileSync('qa/sec002_private_delivery_bundle_manifest.json', 'utf8'));
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

check('bundle id/version fixed', manifest.id === 'SEC002-PRIVATE-DELIVERY-BUNDLE-1');
check('production explicitly forbidden', manifest.production_allowed === false);
check('canonical source SHA fixed', manifest.canonical_code_sha256 === 'd24fc63c59e60ba92808d4d870f4eb95e35bb6f1c158a130229b187a66e35d37');
check('canonical bundle SHA fixed', manifest.canonical_bundle?.expected_sha256 === '4cd23d409e1c09881b214df9c75be36be7413790b3a13d2ddbaefa3c1a359abe');
check('canonical bundle size fixed', manifest.canonical_bundle?.expected_size_bytes === 2991930);
check('bundle expects 18 combined hunks', manifest.canonical_bundle?.expected_diff_hunks === 18);
check('bundle keeps 13 transition public shares', manifest.canonical_bundle?.expected_anyone_with_link_calls === 13);
check('Memory Match declared unchanged', manifest.canonical_bundle?.memory_match_changed_lines === 0 && manifest.install_gate?.memory_match_read_only === true);
check('English LAB declared unchanged', manifest.canonical_bundle?.english_lab_changed_lines === 0);
check('project files preserved', manifest.install_gate?.never_replace_full_project === true && manifest.install_gate?.preserve_other_apps_script_files === true && manifest.install_gate?.preserve_cs21a201_and_later_files === true);
check('same QA deployment required', manifest.install_gate?.keep_existing_qa_deployment_id === true);
check('ACL removal forbidden during bundle install', manifest.install_gate?.remove_public_acl_during_bundle_install === false);
check('mismatched current Code.gs must stop', manifest.install_gate?.if_current_code_sha_differs === 'STOP_AND_RECONCILE_CURRENT_QA_CODE');

const expectedPaths = [
  'qa/sec002_private_certificate_delta.patch',
  'qa/sec002_ventas_extra_private_delta.patch',
  'qa/sec002_payment_receipt_private_delta.patch',
];
const ordered = [...(manifest.ordered_deltas || [])].sort((a,b) => a.order - b.order);
check('exactly three ordered deltas', ordered.length === 3);
check('delta order fixed', ordered.map(x => x.path).join('|') === expectedPaths.join('|'));

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
check('individual hunk total is 18', totalHunks === 18, `observed=${totalHunks}`);

for (const fn of ['descargarMiCertificadoPrivado','descargarDocumentoExtraPrivado','descargarComprobantePagoPrivado']) {
  check(`bundle sources declare ${fn}`, allAdded.includes(`function ${fn}`));
}
check('bundle sources do not remove ANYONE_WITH_LINK transition', !/ANYONE_WITH_LINK|setSharing\s*\(/.test(allRemoved));
check('bundle sources do not edit Memory Match', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match/.test(allAdded));
check('bundle sources do not edit English LAB games', !/englishLabLive|englishLabQuizTime|englishLabWordSearch|englishLabHangman|englishLabSentenceOrder/.test(allAdded));

const builder = fs.readFileSync('scripts/build_sec002_private_delivery_bundle.py', 'utf8');
check('builder verifies input canonical SHA before patch', builder.includes("observed_sha != canonical_sha") && builder.includes('STOP_AND_RECONCILE_CURRENT_QA_CODE'));
check('builder applies manifest order', builder.includes("for item in manifest['ordered_deltas']"));
check('builder requires final SHA and size', builder.includes("expected['expected_sha256']") && builder.includes("expected['expected_size_bytes']"));
check('builder requires exact endpoint definition counts', builder.includes("expected_private_endpoint_definitions"));

if (failures.length) {
  console.error(`SEC002 PRIVATE DELIVERY BUNDLE MANIFEST: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 PRIVATE DELIVERY BUNDLE MANIFEST: PASS');
