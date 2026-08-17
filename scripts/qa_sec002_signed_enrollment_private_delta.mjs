import fs from 'node:fs';

const patch = fs.readFileSync('qa/sec002_signed_enrollment_private_delta.patch', 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const hunks = (patch.match(/^@@ /gm) || []).length;
check('signed enrollment delta has six hunks', hunks === 6, `observed=${hunks}`);
check('signed enrollment delta targets Code.gs only', /^--- Code\.gs$/m.test(patch) && /^\+\+\+ Code\.gs\.sec002matf$/m.test(patch));

const added = patch.split(/\r?\n/).filter(x => /^\+(?!\+\+)/.test(x)).join('\n');
const removed = patch.split(/\r?\n/).filter(x => /^-(?!--)/.test(x)).join('\n');

check('private signed endpoint role map includes student+ventas+admin', added.includes("descargarMatriculaFirmadaPrivada: ['student', 'ventas', 'admin', 'superadmin']"));
check('private signed endpoint routed', added.includes("fn === 'descargarMatriculaFirmadaPrivada'"));
check('private endpoint requires injected session', added.includes("if (!sesion || sesion.ok !== true) return { ok:false, error:'sesion_requerida' };"));
check('student context comes from session', added.includes('var own = _sec002MatfStudentContext_(sesion)') && added.includes('cedula = own.cedula'));
check('student does not accept client file id', added.includes('// El estudiante siempre recibe la versión más reciente de su propio expediente.'));
check('staff reuses canonical prospect ownership auth', added.includes('var ctx = _matFirmadaAuth_(body)'));
check('authorized file is enumerated from signed folder', added.includes('function _matFirmadaFindAuthorizedFile_') && added.includes("getFoldersByName('01_MATRICULA_FIRMADA')") && added.includes('var it = folder.getFiles();'));
check('signed authorization no longer trusts DriveApp.getFileById', !/DriveApp\.getFileById/.test(added));
check('notify removes legacy getFileById', /DriveApp\.getFileById/.test(removed));

check('private signed endpoint rate limited', added.includes('SEC002_MATF_PRIVATE_RATE_MAX = 10') && added.includes("error:'rate_limit_no_disponible'"));
check('private signed endpoint max 9 MiB', added.includes('SEC002_MATF_PRIVATE_MAX_BYTES = 9 * 1024 * 1024'));
check('PDF magic is validated', added.includes('bytes[0] === 37') && added.includes('bytes[4] === 45') && added.includes("error:'contenido_pdf_firmado_invalido'"));
check('upload validates decoded size and PDF magic', added.includes("error:'pdf_invalido'") && added.includes('bytes.length > SEC002_MATF_PRIVATE_MAX_BYTES'));
check('private payload includes SHA-256 + base64', added.includes('sha256:_sec002MatfHexBytes_(digest)') && added.includes('data_base64:Utilities.base64Encode(bytes)'));

const responseStart = added.indexOf("version:'SEC002-MATF-PRIVATE-1'");
const responseEndMarker = 'rate_remaining:rate.remaining';
const responseEnd = responseStart >= 0 ? added.indexOf(responseEndMarker, responseStart) : -1;
const response = responseStart >= 0 && responseEnd >= responseStart ? added.slice(responseStart, responseEnd + responseEndMarker.length) : '';
check('private signed response isolated', !!response);
check('private signed response exposes no URL/file id', !!response && !/\burl\s*:|file_id\s*:|folder_url\s*:|drive_url\s*:/.test(response));

check('upload response stops exposing public URL/folder URL', added.includes('private_delivery_ready:true') && !/return \{ ok:true, url:url/.test(added));
check('new prospect note contains no Drive URL', added.includes("'Matrícula firmada adjuntada por ' + (actor || ctx.rol) + '.'"));
check('email is attachment-only, no link HTML', added.includes('También queda disponible dentro de Documentos y ayuda en el Campus.') && !/<a href/.test(added));
check('new campus alert stores blank URL', added.includes("msg, '', 'PENDIENTE'"));
check('historical signed alert URL stripped from student DTO', added.includes("url: esMatFirmada ? ''") && added.includes("recurso: esMatFirmada ? 'MATRICULA_FIRMADA'"));
check('notify success responses expose no signed URL', added.includes("return emailResp.ok ? { ok:true, canal:'correo', email:emailResp.email }") && added.includes("return { ok:true, canal:'campus', alerta:alertaResp }"));
check('lookup/notify stop re-publishing signed files', (removed.match(/setSharing\(DriveApp\.Access\.ANYONE_WITH_LINK/g) || []).length >= 2);
check('upload transition sharing still present', added.includes('Transición SEC-002: mantener ACL actual'));

check('no Memory Match change', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match/.test(added));
check('no English LAB game change', !/englishLabLive|englishLabQuizTime|englishLabWordSearch|englishLabHangman|englishLabSentenceOrder/.test(added));

if (failures.length) {
  console.error(`SEC002 SIGNED ENROLLMENT PRIVATE DELTA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 SIGNED ENROLLMENT PRIVATE DELTA: PASS');
