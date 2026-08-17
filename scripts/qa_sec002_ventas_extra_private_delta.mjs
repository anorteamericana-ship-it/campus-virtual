import fs from 'node:fs';

const patch = fs.readFileSync('qa/sec002_ventas_extra_private_delta.patch', 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const hunks = (patch.match(/^@@ /gm) || []).length;
check('delta has exactly six hunks', hunks === 6, `observed=${hunks}`);
check('delta targets Code.gs only', /^--- Code\.gs$/m.test(patch) && /^\+\+\+ Code\.gs\.sec002extra$/m.test(patch));

const addedLines = patch.split(/\r?\n/).filter(line => /^\+(?!\+\+)/.test(line));
const removedLines = patch.split(/\r?\n/).filter(line => /^-(?!--)/.test(line));
const added = addedLines.join('\n');
const removed = removedLines.join('\n');

check('permission map declares private extra-doc download', added.includes('+    descargarDocumentoExtraPrivado: ventasAdminSuper,'));
check('dispatcher routes private extra-doc download', added.includes("+    else if (fn === 'descargarDocumentoExtraPrivado') result = descargarDocumentoExtraPrivado(body);"));
check('ventas ownership guard covers upload and private download', added.includes("fn === 'getProspectoDetalle' || fn === 'subirDocumentoExtra' || fn === 'descargarDocumentoExtraPrivado'"));
check('ownership guard uses canonical prospect ownership helper', patch.includes('_sec006cVentasPuedeProspecto_(sesion, pCed.prospecto)'));

check('upload now enforces existing frontend 5 MiB limit', added.includes('SEC002_EXTRA_PRIVATE_MAX_BYTES = 5 * 1024 * 1024') && added.includes("error:'archivo_excede_limite'"));
check('upload/listing expose stable file_id for migration', added.includes('file_id:file.getId()') && added.includes('file_id:f.getId()'));
check('listing exposes mime and size metadata', added.includes('mime_type:String(f.getMimeType') && added.includes('size_bytes:Number(f.getSize'));

check('private endpoint requires injected authenticated session', added.includes("if (!sesion || sesion.ok !== true) return { ok:false, error:'sesion_requerida' };"));
check('private endpoint restricts roles', added.includes("if (['ventas','admin','superadmin'].indexOf(rol) < 0)"));
check('ventas ownership is rechecked inside endpoint', added.includes("error:'no_autorizado_recurso'"));
check('private endpoint requires cedula + file_id', added.includes("error:'cedula_file_id_requeridos'"));
check('file authorization enumerates immediate files', added.includes('var it = folder.getFiles();') && added.includes("if (String(f.getId()) === wanted) return f;"));
check('private lookup does not trust DriveApp.getFileById(file_id)', !/DriveApp\.getFileById\s*\(\s*(?:fileId|wanted|body\.file_id)/.test(added));

const folderStart = added.indexOf('function _sec002ExtraExistingFolder_');
const folderEnd = added.indexOf('function _sec002ExtraFindImmediateFile_', folderStart);
const folderHelper = folderStart >= 0 && folderEnd > folderStart ? added.slice(folderStart, folderEnd) : '';
check('private lookup is read-only and does not create/move folders', folderHelper && !/createFolder|_getOrCreateChildFolder|moveTo\s*\(/.test(folderHelper));

check('rate limiter is present and fail-closed', added.includes('SEC002_EXTRA_PRIVATE_RATE_MAX = 10') && added.includes("error:'rate_limit_no_disponible'"));
check('private payload includes base64 + SHA-256 integrity', added.includes('data_base64:Utilities.base64Encode(bytes)') && added.includes('sha256:_sec002ExtraHexBytes_(digest)'));

const responseStart = added.indexOf("version:'SEC002-EXTRA-PRIVATE-1'");
const responseEndMarker = 'rate_remaining:rate.remaining';
const responseEnd = responseStart >= 0 ? added.indexOf(responseEndMarker, responseStart) : -1;
const responseTail = responseStart >= 0 && responseEnd >= responseStart
  ? added.slice(responseStart, responseEnd + responseEndMarker.length)
  : '';
check('private download success payload is isolated by marker', !!responseTail);
check('private download success payload exposes no Drive URL', !!responseTail && !/\burl\s*:|drive_url\s*:|folder_url\s*:/.test(responseTail));
check('private download success payload exposes no file_id', !!responseTail && !/file_id\s*:/.test(responseTail));

check('transition does not remove existing public sharing yet', !/ANYONE_WITH_LINK|setSharing\s*\(/.test(removed));
check('delta does not edit LAB/Memory engine symbols', !/englishLabMemoryMatch|MEMORY_MATCH|memory_match|englishLabWordSearch|englishLabQuizTime|englishLabSentenceOrder|englishLabHangman/.test(added));

if (failures.length) {
  console.error(`SEC002 VENTAS EXTRA PRIVATE DELTA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC002 VENTAS EXTRA PRIVATE DELTA: PASS');
