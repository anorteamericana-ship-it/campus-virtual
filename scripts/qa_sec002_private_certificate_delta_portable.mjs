import fs from 'node:fs';

const patch = fs.readFileSync('qa/sec002_private_certificate_delta.patch', 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const hunks = (patch.match(/^@@ /gm) || []).length;
check('delta has exactly five hunks', hunks === 5, `observed=${hunks}`);
check('delta targets Code.gs only', /^--- Code\.gs$/m.test(patch) && /^\+\+\+ Code\.gs\.sec002$/m.test(patch));
check('permission map declares private certificate download', patch.includes("+    descargarMiCertificadoPrivado: ['student', 'admin', 'superadmin'],"));
check('student ownership map declares private certificate download', patch.includes('+      descargarMiCertificadoPrivado: true,'));
check('dispatcher routes private certificate download', patch.includes("+    else if (fn === 'descargarMiCertificadoPrivado') result = descargarMiCertificadoPrivado(body);"));

const added = patch.split(/\r?\n/).filter(line => /^\+(?!\+\+)/.test(line)).join('\n');
const removed = patch.split(/\r?\n/).filter(line => /^-(?!--)/.test(line)).join('\n');
check('delta adds no public Drive sharing', !/ANYONE_WITH_LINK|setSharing\s*\(/.test(added));
check('delta adds no trash/delete side effect', !/setTrashed\s*\(|setTrashed\s*=|_certF984TEliminarDuplicadosOficiales_/.test(added));
check('delta removes destructive duplicate cleanup from lookup', removed.includes('_certF984TEliminarDuplicadosOficiales_'));
check('delta reports duplicates without deleting them', added.includes('duplicados_detectados:duplicadosDetectados') && added.includes('duplicados_eliminados:0'));

check('private endpoint requires injected authenticated session', added.includes("if (!sesion || sesion.ok !== true) return { ok:false, error:'sesion_requerida' };"));
check('private endpoint allows only student/admin/superadmin', added.includes("if (['student','admin','superadmin'].indexOf(rol) < 0)"));
check('student ownership is rechecked inside endpoint', added.includes("return { ok:false, error:'no_autorizado', mensaje:'No tiene permiso para descargar certificados de otro expediente.' };"));
check('rate limiter is present and fail-closed', added.includes('SEC002_CERT_PRIVATE_RATE_MAX = 5') && added.includes("error:'rate_limit_no_disponible'"));
check('pilot limits binary file size to 2 MiB', added.includes('SEC002_CERT_PRIVATE_MAX_BYTES = 2 * 1024 * 1024'));
check('pilot accepts PDFs only', added.includes("if (mime !== 'application/pdf')"));
check('private payload is base64 with SHA-256 integrity', added.includes('data_base64:Utilities.base64Encode(bytes)') && added.includes('sha256:_sec002HexBytes_(digest)'));

const successStart = added.indexOf("version:'SEC002-CERT-PRIVATE-1'");
const successTail = successStart >= 0 ? added.slice(successStart) : '';
check('success payload exposes no Drive URL', !/\burl\s*:|folder_url\s*:|search_url\s*:/.test(successTail));
check('success payload exposes no file_id', !/file_id\s*:/.test(successTail));
check('delta does not edit LAB/Memory engine symbols', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match|englishLabWordSearch|englishLabQuizTime|englishLabSentenceOrder|englishLabHangman/.test(added));

if (failures.length) {
  console.error(`SEC002 PRIVATE CERT DELTA PORTABILITY: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 PRIVATE CERT DELTA PORTABILITY: PASS');
