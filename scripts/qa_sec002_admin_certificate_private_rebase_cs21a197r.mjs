import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const next = JSON.parse(fs.readFileSync('security/sec002_admin_certificate_private_rebase_cs21a197r.json', 'utf8'));
const legacy = JSON.parse(fs.readFileSync('security/sec002_legacy_certificate_tree_contract_cs21a194.json', 'utf8'));

function must(cond, msg) {
  if (!cond) throw new Error(`CS21A197R guard: ${msg}`);
}
function block(start, end, label) {
  const a = src.indexOf(start);
  if (a < 0) throw new Error(`CS21A197R missing start: ${label}`);
  const b = src.indexOf(end, a + start.length);
  if (b < 0) throw new Error(`CS21A197R missing end: ${label}`);
  return src.slice(a, b);
}

must(next.severity === 'P1', 'certificate class remains P1');
must(next.state === 'SOURCE_PRIVATE_MIGRATED_RUNTIME_AND_ACL_OPEN', 'state must separate source migration from runtime/ACL closure');
must(next.base_pr === 205, 'rebase must sit on current canonical SEC-002 tip');
must(Array.isArray(next.rebased_evidence_from) && next.rebased_evidence_from.includes(203) && next.rebased_evidence_from.includes(200), 'both evidence and source origins remain traceable');
must(next.frontend.direct_certificate_drive_url_consumers === 0, 'contract must declare zero direct certificate URL consumers after source migration');
must(next.frontend.migration_status === 'SOURCE_ONLY', 'frontend migration cannot claim runtime');
must(next.backend.private_operation === 'descargarMiCertificadoPrivado', 'private operation remains the audited portable contract');
must(next.backend.current_modular_QA_runtime === 'PENDING_ISSUE_111', 'current QA runtime remains pending');
must(next.backend.installed_claim === false, 'must not claim backend installation');
must(next.drive_acl.legacy_tree === 'P1_ANYONE_READER_LINK_ONLY_PROVEN', 'legacy public ACL evidence remains explicit');
must(next.drive_acl.acl_change_in_this_cut === 'NONE', 'no ACL change allowed in this cut');
must(next.release_gate === 'BLOCK_UNTIL_PRIVATE_DELIVERY_AND_ACL_MIGRATION_E2', 'release remains blocked');

must(legacy.drive_evidence.legacy_root_permission === 'anyone_reader_link_only', 'legacy root evidence remains preserved');
must(legacy.drive_evidence.real_certificate_samples_anyone_reader === legacy.drive_evidence.real_certificate_samples_checked, 'certificate sample ACL evidence remains preserved');

must(src.includes('async function abrirCertificadoPrivadoAdmin'), 'private admin certificate helper present');
must(src.includes("postAdminStudents('descargarMiCertificadoPrivado'"), 'private certificate operation wired');
must(src.includes("String(r.mime_type || '').trim().toLowerCase() !== 'application/pdf'"), 'PDF MIME validation present');
must(src.includes('bytes.length > 2 * 1024 * 1024'), '2 MiB bound present');
must(src.includes('bytes[0] === 37 && bytes[1] === 80 && bytes[2] === 68 && bytes[3] === 70 && bytes[4] === 45'), 'PDF signature validation present');
must(src.includes("window.crypto.subtle.digest('SHA-256', bytes)"), 'SHA-256 validation present');
must(src.includes("URL.createObjectURL(new Blob([bytes], { type:'application/pdf' }))"), 'Blob/ObjectURL delivery present');
must(src.includes('URL.revokeObjectURL(url)'), 'ObjectURL cleanup present');

const cert = block('  const buscarCertificado = async () => {', '  const certResult = res[certKey];', 'certificate actions');
const privateCalls = (cert.match(/abrirCertificadoPrivadoAdmin\s*\(/g) || []).length;
must(privateCalls >= 3, `expected at least 3 private certificate opens, found ${privateCalls}`);
must(!/window\.open\s*\(\s*data\.url/i.test(cert), 'direct data.url certificate open must be gone');
must(!/buscarCertificadoExistente/.test(cert), 'legacy URL lookup must be gone from admin certificate consumer');
must(!/search_url/.test(cert), 'Drive search fallback must be gone from certificate actions');

const render = block('  const certResult = res[certKey];', '      <div style={{ marginTop:14,', 'certificate render');
must(!/certResult\?\.url|href=\{certResult\.url\}|search_url|Buscar en Drive/.test(render), 'certificate render cannot expose URL/search fallback');
must(render.includes('certResult?.private'), 'private result state must render');

must(src.includes("postAdminStudents('generarCertificado'"), 'certificate generation preserved');
must(src.includes('generarCertificadosNivel'), 'bulk generation preserved');
must(src.includes('adminStudentsSafeUserError'), 'safe-error boundary preserved');
must(src.includes("function abrirPdfBackend(payload, fallbackUrl = '', options = {})"), 'CS21A193 academic private helper preserved');
must(src.includes('const allowUrl = options?.allowUrl !== false;'), 'CS21A193 allowUrl policy preserved');
must(src.includes('security') === false || true, 'no-op semantic guard');

console.log('CS21A197R SEC002 ADMIN CERTIFICATE PRIVATE REBASE: PASS');
console.log('ADMIN_CERTIFICATE_SOURCE=PRIVATE_BYTES');
console.log('CURRENT_RUNTIME_PRIVATE_CERT_ENDPOINT=PENDING_ISSUE_111');
console.log('LEGACY_CERTIFICATE_ACL=P1_OPEN_ANYONE_READER');
console.log('ACL_CHANGE=NONE');
console.log('RELEASE_GATE=PRIVATE_DELIVERY_PLUS_ACL_E2');
