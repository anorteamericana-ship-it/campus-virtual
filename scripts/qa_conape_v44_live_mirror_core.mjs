import fs from 'node:fs';

const path = 'scripts/conape_v44_live_mirror_core.js';
const src = fs.readFileSync(path, 'utf8');
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };

assert(src.includes("var CONAPE_MIRROR_V44_OPERATIVO_ID = '1dbNtotJC51Bx40r4zZv3ugt8-P3GYYzeLxsMOEYismI';"), 'CAMPUS_OPERATIVO exacto ausente');
assert(src.includes('CONAPE_RECLUTAMIENTO: true'), 'allowlist CONAPE_RECLUTAMIENTO ausente');
assert(src.includes('CONAPE_MOVIMIENTOS_LOG: true'), 'allowlist CONAPE_MOVIMIENTOS_LOG ausente');
assert(src.includes("if (!CONAPE_MIRROR_V44_ALLOWED_SHEETS[key]) throw new Error('CONAPE_MIRROR_SHEET_NOT_ALLOWED');"), 'guard duro de hojas ausente');
assert(src.includes('SpreadsheetApp.openById(CONAPE_MIRROR_V44_OPERATIVO_ID)'), 'openById fijo ausente');

for (const forbidden of [
  'SpreadsheetApp.getActive', 'SpreadsheetApp.openByUrl', 'insertSheet(', 'deleteSheet(',
  'LockService', 'ScriptApp.newTrigger', 'UrlFetchApp', 'function doPost(', 'function doGet('
]) assert(!src.includes(forbidden), `superficie prohibida detectada: ${forbidden}`);

const getSheetCalls = [...src.matchAll(/getSheetByName\(([^)]+)\)/g)].map(match => match[1].trim());
assert(getSheetCalls.length === 1 && getSheetCalls[0] === 'key', 'toda apertura de hoja debe pasar por el resolver allowlisted');

const headerLiteral = [
  'CEDULA','APELLIDO_1','APELLIDO_2','NOMBRE','TELEFONO','CORREO','ESTADO','FECHA_ESTADO',
  'FECHA_REGISTRO','USUARIO_REGISTRO','APROBACION','FORMALIZACION','ULTIMO_DESEMBOLSO',
  'PROXIMO_DESEMBOLSO','ULTIMO_SYNC'
];
for (const header of headerLiteral) assert(src.includes(`'${header}'`), `header ${header} ausente`);

for (const movement of [
  'PRIMER_DESEMBOLSO','NUEVO_DESEMBOLSO','DESEMBOLSO_REMOVIDO','APROBADO_SIN_DESEMBOLSO','RETIRADO_DE_LISTA'
]) assert(src.includes(`${movement}: true`), `movimiento canónico ausente: ${movement}`);
for (const forbiddenMovement of ['FORMALIZADO','INGRESO_LISTA','CAMBIO_ESTADO']) {
  assert(!src.includes(`'${forbiddenMovement}'`), `movimiento no autorizado detectado: ${forbiddenMovement}`);
}
assert(
  src.includes("out.push(_conapeMirrorV44Movement_(ced, 'DESEMBOLSO_REMOVIDO', o));"),
  'DESEMBOLSO_REMOVIDO debe anclarse al snapshot anterior'
);
assert(
  !src.includes("out.push(_conapeMirrorV44Movement_(ced, 'DESEMBOLSO_REMOVIDO', n));"),
  'DESEMBOLSO_REMOVIDO no puede anclarse a la fila nueva vacía'
);

assert(src.includes("_conapeMirrorV44Upper_(body.method) === 'CSV_DOWNLOAD'"), 'gate CSV_DOWNLOAD ausente');
assert(src.includes('body.counts_match === true'), 'gate counts_match ausente');
assert(src.includes('body.columns_ok === true'), 'gate columns_ok ausente');
assert(src.includes('rowsCsv === rowsHtml'), 'gate rows_csv === rows_html_all ausente');
assert(src.includes('rows.length > 0'), 'gate lista no vacía ausente');

const handler = src.indexOf('function agentConapeMirrorApplySnapshotV44(data)');
const validation = src.indexOf('var gate = _conapeMirrorV44ValidateSnapshot_(data);', handler);
const abortReturn = src.indexOf('if (!gate.ok) return gate;', validation);
const oldMap = src.indexOf('var oldMap = _conapeMirrorV44Map_();', handler);
const detect = src.indexOf('var events = _conapeMirrorV44DetectMovements_(oldMap, newMap);', handler);
const append = src.indexOf('var logged = _conapeMirrorV44AppendMovements_(events, syncId);', handler);
const mirrorWrite = src.indexOf('var written = _conapeMirrorV44WriteMirror_(newMap, stamp);', handler);
assert(handler >= 0 && validation > handler && abortReturn > validation && oldMap > abortReturn && detect > oldMap, 'orden de validación/movimientos inválido');
assert(append > detect && mirrorWrite > append, 'movimientos deben escribirse antes del espejo');
assert(!src.includes('.clearContent()'), 'clearContent separado prohibido');
assert(src.includes('ws.getRange(2, 1, total, CONAPE_MIRROR_V44_HEADERS.length).setValues(matrix);'), 'escritura matricial única ausente');

assert(src.includes('function conapeMirrorReadForSalesV44(body)'), 'handler humano de lectura ausente');
assert(src.includes('var sesion = body._auth_session || null;'), 'lectura no consume sesión ya autorizada');
assert(src.includes("role === 'VENTAS'"), 'rol Ventas no protegido');
assert(src.includes("role === 'ADMIN'"), 'rol Admin no protegido');
assert(src.includes("role === 'SUPERADMIN'"), 'rol Superadmin no protegido');
assert(src.includes("var dash = getDashboardVentas({ asesor:asesor });"), 'scope de vendedor no reutiliza getDashboardVentas');
assert(src.includes('function agentConapeMirrorApplySnapshotV44(data)'), 'handler técnico de apply ausente');

for (const forbiddenFlow of [
  'aplicarPago(', 'registrarPago(', 'guardarNota(', 'registrarNota', 'registrarAsistencia(',
  'matricularEstudiante(', 'generarMatricula(', 'crearUsuarioEstudiante(', 'crearInscripcionPublica('
]) assert(!src.includes(forbiddenFlow), `flujo ajeno detectado: ${forbiddenFlow}`);

const builderSrc = fs.readFileSync('scripts/build_conape_v44_live_candidate.ps1', 'utf8');
assert(builderSrc.includes('$bodyParam=$dispatchInfo.Params[1]'), 'builder no enlaza segundo parámetro body del dispatcher');
assert(builderSrc.includes('$bodyParam.data'), 'builder no enruta data desde body');
assert(!builderSrc.includes('$requestParam.data'), 'builder no puede enrutar data desde auth/requestParam');

console.log('CONAPE V4.4 LIVE MIRROR CORE QA PASS');
