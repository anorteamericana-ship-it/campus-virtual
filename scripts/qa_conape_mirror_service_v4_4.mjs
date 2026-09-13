import fs from 'node:fs';

const path = 'services/conape-mirror-service/Code.gs';
const src = fs.readFileSync(path, 'utf8');
const fail = msg => { throw new Error(msg); };
const assert = (cond, msg) => { if (!cond) fail(msg); };

assert(src.includes("var CONAPE_MIRROR_OPERATIVO_ID = '1dbNtotJC51Bx40r4zZv3ugt8-P3GYYzeLxsMOEYismI';"), 'OPERATIVO_ID exacto ausente');
assert(src.includes('CONAPE_RECLUTAMIENTO: true'), 'allowlist CONAPE_RECLUTAMIENTO ausente');
assert(src.includes('CONAPE_MOVIMIENTOS_LOG: true'), 'allowlist CONAPE_MOVIMIENTOS_LOG ausente');
assert(src.includes("if (!CONAPE_MIRROR_ALLOWED_SHEETS[key]) throw new Error('SHEET_NOT_ALLOWED');"), 'guard duro de hojas ausente');
assert(src.includes('SpreadsheetApp.openById(CONAPE_MIRROR_OPERATIVO_ID)'), 'openById canónico ausente');
assert(!src.includes('SpreadsheetApp.getActive'), 'prohibido usar spreadsheet activo');
assert(!src.includes('SpreadsheetApp.openByUrl'), 'prohibido abrir spreadsheet por URL');
assert(!src.includes('insertSheet('), 'prohibido crear hojas');
assert(!src.includes('deleteSheet('), 'prohibido borrar hojas');
assert(!src.includes('UrlFetchApp'), 'el mirror service no debe llamar servicios externos');
assert(!src.includes('LockService'), 'decisión operativa: sin locks');
assert(!src.includes('ScriptApp.newTrigger'), 'el standalone no crea triggers');

const getSheetNames = [...src.matchAll(/getSheetByName\(([^)]+)\)/g)].map(m => m[1]);
assert(getSheetNames.length === 1 && getSheetNames[0] === 'key', 'getSheetByName debe pasar exclusivamente por _cmsSheet_ allowlisted');

for (const forbidden of ['validarSesion(', 'getDashboardVentas(', 'conapeMirrorApplySnapshotV44', '_conapeMirrorBaseDoPostV44', '_conapeMirrorBaseGetDashboardVentasV44']) {
  assert(!src.includes(forbidden), `acoplamiento al monolito detectado: ${forbidden}`);
}
for (const forbidden of ['aplicarPago(', 'registrarPago(', 'guardarNota(', 'registrarAsistencia(', 'matricularEstudiante(', 'crearMatricula(']) {
  assert(!src.includes(forbidden), `flujo estudiantil prohibido detectado: ${forbidden}`);
}

assert(src.includes("var CONAPE_MIRROR_HMAC_PROPERTY = 'CONAPE_MIRROR_HMAC_SECRET';"), 'Script Property HMAC ausente');
assert(src.includes('var CONAPE_MIRROR_CLOCK_SKEW_MS = 180000;'), 'tolerancia ±3 min ausente');
assert(src.includes('var CONAPE_MIRROR_NONCE_TTL_MS = 600000;'), 'TTL nonce 10 min ausente');
assert(src.includes('HMAC_REPLAY_REJECTED'), 'replay gate ausente');
assert(src.includes('props.setProperty(nonceKey,String(now+CONAPE_MIRROR_NONCE_TTL_MS))'), 'persistencia nonce ausente');
assert(src.includes("String(ts)+'\\n'+nonce+'\\n'+payloadJson"), 'canonical string HMAC ausente');
assert(src.includes('computeHmacSha256Signature'), 'HMAC-SHA256 ausente');

assert(src.includes("_cmsUpper_(body.method)==='CSV_DOWNLOAD'"), 'gate CSV_DOWNLOAD ausente');
assert(src.includes('body.counts_match===true'), 'gate counts_match ausente');
assert(src.includes('body.columns_ok===true'), 'gate columns_ok ausente');
assert(src.includes('rowsCsv===rowsHtml'), 'gate rows_csv === rows_html_all ausente');
assert(src.includes('rows.length>0'), 'gate lista no vacía ausente');

const movementIndex = src.indexOf('var logged=_cmsAppendMovements_(events,syncId);');
const mirrorIndex = src.indexOf('var written=_cmsWriteMirror_(newMap,stamp);');
assert(movementIndex >= 0 && mirrorIndex > movementIndex, 'movimientos deben escribirse antes del espejo');
assert(src.includes("if(action==='apply_snapshot')"), 'acción apply_snapshot ausente');
assert(src.includes("if(action==='read_mirror')"), 'acción read_mirror ausente');
assert(src.includes("return _cmsJson_({ok:false,code:'ACTION_NOT_ALLOWED'});"), 'allowlist de acciones ausente');
assert(src.includes('ws.getRange(2,1,total,CONAPE_MIRROR_HEADERS.length).setValues(matrix);'), 'escritura matricial única del espejo ausente');
assert(!src.includes('.clearContent()'), 'no debe existir clearContent separado antes del espejo');

console.log('CONAPE_MIRROR_SERVICE V4.4 QA PASS');
