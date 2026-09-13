/* CONAPE_MIRROR_SERVICE · V4.4.1
 * Standalone Apps Script. NO está bound a ningún Sheet.
 * Identidad de ejecución prevista: USER_DEPLOYING, cuenta institucional técnica.
 * Escritura permitida por construcción:
 *   spreadsheet: CAMPUS_OPERATIVO únicamente
 *   sheets: CONAPE_RECLUTAMIENTO y CONAPE_MOVIMIENTOS_LOG únicamente
 * No contiene ni invoca matrícula, pagos, notas, asistencia, login ni flujo estudiantil.
 */

var CONAPE_MIRROR_SERVICE_VERSION = 'V4.4.1';
var CONAPE_MIRROR_OPERATIVO_ID = '1dbNtotJC51Bx40r4zZv3ugt8-P3GYYzeLxsMOEYismI';
var CONAPE_MIRROR_ALLOWED_SHEETS = Object.freeze({
  CONAPE_RECLUTAMIENTO: true,
  CONAPE_MOVIMIENTOS_LOG: true
});
var CONAPE_MIRROR_HEADERS = [
  'CEDULA','APELLIDO_1','APELLIDO_2','NOMBRE','TELEFONO','CORREO','ESTADO','FECHA_ESTADO',
  'FECHA_REGISTRO','USUARIO_REGISTRO','APROBACION','FORMALIZACION','ULTIMO_DESEMBOLSO',
  'PROXIMO_DESEMBOLSO','ULTIMO_SYNC'
];
var CONAPE_MIRROR_HMAC_PROPERTY = 'CONAPE_MIRROR_HMAC_SECRET';
var CONAPE_MIRROR_NONCE_PREFIX = 'CONAPE_MIRROR_NONCE_';
var CONAPE_MIRROR_CLOCK_SKEW_MS = 180000; // ±3 minutos
var CONAPE_MIRROR_NONCE_TTL_MS = 600000;  // 10 minutos
var CONAPE_MIRROR_MAX_BODY_BYTES = 2000000;

function _cmsText_(v) { return String(v == null ? '' : v).trim(); }
function _cmsUpper_(v) {
  return _cmsText_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
}
function _cmsCedula_(v) { return _cmsText_(v).replace(/\D/g,''); }
function _cmsHex_(bytes) {
  return (bytes || []).map(function(b){ var n=(b+256)%256; return ('0'+n.toString(16)).slice(-2); }).join('');
}
function _cmsSha256_(v) {
  return _cmsHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v || ''), Utilities.Charset.UTF_8));
}
function _cmsHmac_(canonical, secret) {
  return _cmsHex_(Utilities.computeHmacSha256Signature(String(canonical || ''), String(secret || ''), Utilities.Charset.UTF_8));
}
function _cmsConstantTimeEquals_(a,b) {
  a=String(a||''); b=String(b||'');
  var mismatch=a.length^b.length, len=Math.max(a.length,b.length);
  for(var i=0;i<len;i++) mismatch |= (a.charCodeAt(i%Math.max(1,a.length))||0) ^ (b.charCodeAt(i%Math.max(1,b.length))||0);
  return mismatch===0;
}
function _cmsJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function _cmsHeaderMap_(headers) {
  var out={};
  (headers||[]).forEach(function(h,i){out[_cmsUpper_(h).replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')]=i;});
  return out;
}

function _cmsSheet_(name) {
  var key=_cmsText_(name);
  if (!CONAPE_MIRROR_ALLOWED_SHEETS[key]) throw new Error('SHEET_NOT_ALLOWED');
  var ss=SpreadsheetApp.openById(CONAPE_MIRROR_OPERATIVO_ID);
  var ws=ss.getSheetByName(key);
  if(!ws) throw new Error(key+'_MISSING');
  return ws;
}

function _cmsValidateMirrorHeaders_(ws) {
  var headers=ws.getRange(1,1,1,CONAPE_MIRROR_HEADERS.length).getDisplayValues()[0];
  for(var i=0;i<CONAPE_MIRROR_HEADERS.length;i++) {
    if(_cmsUpper_(headers[i])!==CONAPE_MIRROR_HEADERS[i]) throw new Error('CONAPE_RECLUTAMIENTO_HEADERS_INVALID');
  }
}

function _cmsCleanupNonces_(props, now) {
  var all=props.getProperties();
  Object.keys(all).forEach(function(k){
    if(k.indexOf(CONAPE_MIRROR_NONCE_PREFIX)!==0) return;
    var expiry=Number(all[k]||0);
    if(!Number.isFinite(expiry)||expiry<=now) props.deleteProperty(k);
  });
}

function _cmsAuthenticate_(request) {
  request=request||{};
  var ts=Number(request.ts);
  var nonce=_cmsText_(request.nonce);
  var payloadJson=String(request.payload_json||'');
  var sig=_cmsText_(request.sig).toLowerCase();
  var now=Date.now();
  if(!Number.isFinite(ts)||Math.abs(now-ts)>CONAPE_MIRROR_CLOCK_SKEW_MS) throw new Error('HMAC_TIMESTAMP_REJECTED');
  if(!/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) throw new Error('HMAC_NONCE_INVALID');
  if(!payloadJson||payloadJson.length>CONAPE_MIRROR_MAX_BODY_BYTES) throw new Error('HMAC_PAYLOAD_INVALID');
  if(!/^[a-f0-9]{64}$/.test(sig)) throw new Error('HMAC_SIGNATURE_INVALID');

  var props=PropertiesService.getScriptProperties();
  var secret=_cmsText_(props.getProperty(CONAPE_MIRROR_HMAC_PROPERTY));
  if(!secret) throw new Error('HMAC_SECRET_NOT_CONFIGURED');
  var canonical=String(ts)+'\n'+nonce+'\n'+payloadJson;
  var expected=_cmsHmac_(canonical,secret);
  if(!_cmsConstantTimeEquals_(sig,expected)) throw new Error('HMAC_SIGNATURE_REJECTED');

  _cmsCleanupNonces_(props,now);
  var nonceKey=CONAPE_MIRROR_NONCE_PREFIX+_cmsSha256_(nonce);
  var existing=Number(props.getProperty(nonceKey)||0);
  if(existing>now) throw new Error('HMAC_REPLAY_REJECTED');
  // Persistente con TTL. Diseño deliberadamente lock-free por decisión operativa.
  props.setProperty(nonceKey,String(now+CONAPE_MIRROR_NONCE_TTL_MS));

  var payload;
  try { payload=JSON.parse(payloadJson); }
  catch(_){ throw new Error('HMAC_PAYLOAD_JSON_INVALID'); }
  if(!payload||typeof payload!=='object'||Array.isArray(payload)) throw new Error('HMAC_PAYLOAD_JSON_INVALID');
  return payload;
}

function _cmsCanonicalSource_(row) {
  row=row||{};
  var ced=_cmsCedula_(row.cedula);
  if(!ced) return null;
  return {
    CEDULA:ced,
    APELLIDO_1:_cmsText_(row.apellido_1),
    APELLIDO_2:_cmsText_(row.apellido_2),
    NOMBRE:_cmsText_(row.nombre),
    TELEFONO:_cmsText_(row.celular||row.telefono),
    CORREO:_cmsText_(row.correo).toLowerCase(),
    ESTADO:_cmsText_(row.estado),
    FECHA_ESTADO:_cmsText_(row.fecha_estado),
    FECHA_REGISTRO:_cmsText_(row.fecha_registro),
    USUARIO_REGISTRO:_cmsText_(row.usuario_registro),
    APROBACION:_cmsText_(row.aprobacion),
    FORMALIZACION:_cmsText_(row.formalizacion),
    ULTIMO_DESEMBOLSO:_cmsText_(row.ultimo_desembolso),
    PROXIMO_DESEMBOLSO:_cmsText_(row.proximo_desembolso),
    ULTIMO_SYNC:''
  };
}

function _cmsReadMirror_() {
  var ws=_cmsSheet_('CONAPE_RECLUTAMIENTO');
  _cmsValidateMirrorHeaders_(ws);
  var last=ws.getLastRow();
  if(last<2) return [];
  var values=ws.getRange(2,1,last-1,CONAPE_MIRROR_HEADERS.length).getDisplayValues();
  return values.map(function(r){
    var o={}; CONAPE_MIRROR_HEADERS.forEach(function(h,i){o[h]=_cmsText_(r[i]);}); return o;
  }).filter(function(o){return !!_cmsCedula_(o.CEDULA);});
}

function _cmsMirrorMap_() {
  var map={};
  _cmsReadMirror_().forEach(function(r){map[_cmsCedula_(r.CEDULA)]=r;});
  return map;
}

function _cmsDisbursementParts_(raw) {
  var s=_cmsText_(raw),m=s.match(/(^|\D)(\d{1,2})\D+(\d{1,2})\D+(\d{4})(\D|$)/);
  return m?{num:m[2],mes:m[3],anio:m[4]}:{num:'',mes:'',anio:''};
}
function _cmsMovementSpec_(ced,type,row) {
  row=row||{};
  var d=_cmsDisbursementParts_(row.ULTIMO_DESEMBOLSO);
  var raw=_cmsText_(row.ULTIMO_DESEMBOLSO||row.FORMALIZACION||row.APROBACION||row.FECHA_ESTADO);
  var fingerprint=[ced,type,raw,row.ESTADO,row.APROBACION,row.FORMALIZACION,row.ULTIMO_DESEMBOLSO,row.PROXIMO_DESEMBOLSO].join('|');
  return {cedula:ced,type:type,row:row,raw:raw,num:d.num,mes:d.mes,anio:d.anio,anchor:_cmsSha256_(fingerprint)};
}
function _cmsDetectMovements_(oldMap,newMap) {
  var out=[];
  Object.keys(newMap).sort().forEach(function(ced){
    var n=newMap[ced],o=oldMap[ced];
    if(!o) {
      if(_cmsText_(n.ULTIMO_DESEMBOLSO)) out.push(_cmsMovementSpec_(ced,'PRIMER_DESEMBOLSO',n));
      else if(_cmsText_(n.FORMALIZACION)) out.push(_cmsMovementSpec_(ced,'FORMALIZADO',n));
      else if(_cmsText_(n.APROBACION)) out.push(_cmsMovementSpec_(ced,'APROBADO_SIN_DESEMBOLSO',n));
      else out.push(_cmsMovementSpec_(ced,'INGRESO_LISTA',n));
      return;
    }
    if(!_cmsText_(o.ULTIMO_DESEMBOLSO)&&_cmsText_(n.ULTIMO_DESEMBOLSO)) out.push(_cmsMovementSpec_(ced,'PRIMER_DESEMBOLSO',n));
    else if(_cmsText_(o.ULTIMO_DESEMBOLSO)&&!_cmsText_(n.ULTIMO_DESEMBOLSO)) out.push(_cmsMovementSpec_(ced,'DESEMBOLSO_REMOVIDO',n));
    else if(_cmsText_(o.ULTIMO_DESEMBOLSO)!==_cmsText_(n.ULTIMO_DESEMBOLSO)) out.push(_cmsMovementSpec_(ced,'NUEVO_DESEMBOLSO',n));
    if(!_cmsText_(o.FORMALIZACION)&&_cmsText_(n.FORMALIZACION)) out.push(_cmsMovementSpec_(ced,'FORMALIZADO',n));
    if(!_cmsText_(o.APROBACION)&&_cmsText_(n.APROBACION)) out.push(_cmsMovementSpec_(ced,'APROBADO_SIN_DESEMBOLSO',n));
    if(_cmsText_(o.ESTADO)!==_cmsText_(n.ESTADO)) out.push(_cmsMovementSpec_(ced,'CAMBIO_ESTADO',n));
  });
  Object.keys(oldMap).sort().forEach(function(ced){if(!newMap[ced]) out.push(_cmsMovementSpec_(ced,'RETIRADO_DE_LISTA',oldMap[ced]));});
  return out;
}

function _cmsAppendMovements_(events,syncId) {
  if(!events.length) return 0;
  var ws=_cmsSheet_('CONAPE_MOVIMIENTOS_LOG');
  var lastCol=ws.getLastColumn();
  var headers=ws.getRange(1,1,1,lastCol).getDisplayValues()[0];
  var hm=_cmsHeaderMap_(headers);
  ['MOVIMIENTO_ID','DETECTADO_EN','CEDULA','NOMBRE','TIPO','ANCLA_HASH','SYNC_ID'].forEach(function(h){if(hm[h]==null)throw new Error('CONAPE_MOVIMIENTOS_LOG_HEADERS_INVALID');});
  var seen={};
  if(ws.getLastRow()>1) {
    ws.getRange(2,hm.ANCLA_HASH+1,ws.getLastRow()-1,1).getDisplayValues().forEach(function(r){var h=_cmsText_(r[0]);if(h)seen[h]=true;});
  }
  var rows=[];
  events.forEach(function(ev){
    if(seen[ev.anchor]) return;
    var values=new Array(lastCol).fill(''),r=ev.row||{};
    // MOVIMIENTO_ID determinista por anchor: facilita auditoría/dedupe externa.
    values[hm.MOVIMIENTO_ID]='MOV-'+ev.anchor.slice(0,32);
    values[hm.DETECTADO_EN]=new Date();
    values[hm.CEDULA]=ev.cedula;
    values[hm.NOMBRE]=[_cmsText_(r.NOMBRE),_cmsText_(r.APELLIDO_1),_cmsText_(r.APELLIDO_2)].filter(Boolean).join(' ');
    values[hm.TIPO]=ev.type;
    if(hm.NUM_DESEMBOLSO!=null)values[hm.NUM_DESEMBOLSO]=ev.num;
    if(hm.PERIODO_MES!=null)values[hm.PERIODO_MES]=ev.mes;
    if(hm.PERIODO_ANIO!=null)values[hm.PERIODO_ANIO]=ev.anio;
    if(hm.FECHA_RAW!=null)values[hm.FECHA_RAW]=ev.raw;
    if(hm.TELEFONO!=null)values[hm.TELEFONO]=r.TELEFONO||'';
    if(hm.ESTADO_VINCULO!=null)values[hm.ESTADO_VINCULO]='SIN_VINCULAR';
    values[hm.ANCLA_HASH]=ev.anchor;
    values[hm.SYNC_ID]=syncId;
    rows.push(values); seen[ev.anchor]=true;
  });
  if(rows.length) ws.getRange(ws.getLastRow()+1,1,rows.length,lastCol).setValues(rows);
  return rows.length;
}

function _cmsWriteMirror_(newMap,syncStamp) {
  var ws=_cmsSheet_('CONAPE_RECLUTAMIENTO');
  _cmsValidateMirrorHeaders_(ws);
  var rows=Object.keys(newMap).sort().map(function(ced){
    var r=newMap[ced]; r.ULTIMO_SYNC=syncStamp;
    return CONAPE_MIRROR_HEADERS.map(function(h){return r[h]||'';});
  });
  var existing=Math.max(0,ws.getLastRow()-1);
  var total=Math.max(existing,rows.length);
  if(total>0) {
    var matrix=[];
    for(var i=0;i<total;i++) matrix.push(i<rows.length?rows[i]:new Array(CONAPE_MIRROR_HEADERS.length).fill(''));
    // Una sola escritura matricial: no existe ventana clear() -> setValues().
    ws.getRange(2,1,total,CONAPE_MIRROR_HEADERS.length).setValues(matrix);
  }
  return rows.length;
}

function _cmsApplySnapshot_(body) {
  body=body||{};
  var rowsCsv=Number(body.rows_csv),rowsHtml=Number(body.rows_html_all),rows=Array.isArray(body.rows)?body.rows:[];
  var valid=body.counts_match===true&&body.columns_ok===true&&_cmsUpper_(body.method)==='CSV_DOWNLOAD'&&rowsCsv>0&&rowsHtml>0&&rowsCsv===rowsHtml&&rows.length>0;
  if(!valid) return {ok:false,code:'CONAPE_SNAPSHOT_ABORTED',rows_csv:rowsCsv,rows_html_all:rowsHtml,counts_match:false,written:false};

  var newMap={};
  for(var i=0;i<rows.length;i++) {
    var c=_cmsCanonicalSource_(rows[i]); if(!c)continue;
    if(newMap[c.CEDULA]&&JSON.stringify(newMap[c.CEDULA])!==JSON.stringify(c)) return {ok:false,code:'CONAPE_DUPLICATE_CEDULA_CONFLICT',written:false};
    newMap[c.CEDULA]=c;
  }
  if(Object.keys(newMap).length!==rowsCsv) return {ok:false,code:'CONAPE_SNAPSHOT_COUNT_INVALID',rows_csv:rowsCsv,rows_html_all:rowsHtml,counts_match:false,written:false};

  var oldMap=_cmsMirrorMap_();
  var events=_cmsDetectMovements_(oldMap,newMap);
  var syncId='RECL-'+Utilities.getUuid();
  var logged=_cmsAppendMovements_(events,syncId); // SIEMPRE antes del espejo
  var stamp=Utilities.formatDate(new Date(),'America/Costa_Rica','yyyy-MM-dd HH:mm:ss');
  var written=_cmsWriteMirror_(newMap,stamp);
  SpreadsheetApp.flush();
  return {ok:true,code:'CONAPE_MIRROR_UPDATED',written:true,row_count:written,movements:logged,sync_id:syncId,captured_at:_cmsText_(body.captured_at),ultimo_sync:stamp};
}

function _cmsReadForBridge_() {
  var rows=_cmsReadMirror_().map(function(r){return {
    cedula:r.CEDULA,
    estado:r.ESTADO,
    fecha_estado:r.FECHA_ESTADO,
    aprobacion:r.APROBACION,
    formalizacion:r.FORMALIZACION,
    ultimo_desembolso:r.ULTIMO_DESEMBOLSO,
    proximo_desembolso:r.PROXIMO_DESEMBOLSO,
    ultimo_sync:r.ULTIMO_SYNC
  };});
  var lastSync='';
  rows.forEach(function(r){if(r.ultimo_sync&&r.ultimo_sync>lastSync)lastSync=r.ultimo_sync;});
  return {ok:true,code:'CONAPE_MIRROR_READY',row_count:rows.length,ultimo_sync:lastSync,rows:rows};
}

function doPost(e) {
  try {
    var raw=String(e&&e.postData&&e.postData.contents||'');
    if(!raw||raw.length>CONAPE_MIRROR_MAX_BODY_BYTES) return _cmsJson_({ok:false,code:'REQUEST_REJECTED'});
    var request;
    try { request=JSON.parse(raw); } catch(_) { return _cmsJson_({ok:false,code:'REQUEST_REJECTED'}); }
    var payload=_cmsAuthenticate_(request);
    var action=_cmsText_(payload.action).toLowerCase();
    if(action==='apply_snapshot') return _cmsJson_(_cmsApplySnapshot_(payload));
    if(action==='read_mirror') return _cmsJson_(_cmsReadForBridge_());
    return _cmsJson_({ok:false,code:'ACTION_NOT_ALLOWED'});
  } catch(err) {
    // No revelar firma, nonce, secreto ni contenido de prospectos.
    return _cmsJson_({ok:false,code:_cmsText_(err&&err.message||'SERVICE_ERROR').slice(0,80)});
  }
}

function doGet() {
  return _cmsJson_({ok:false,code:'METHOD_NOT_ALLOWED',service:'CONAPE_MIRROR_SERVICE',version:CONAPE_MIRROR_SERVICE_VERSION});
}
