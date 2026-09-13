/* CONAPE V4.4.0 · espejo de reclutamiento para Ventas.
 * Se agrega al final del Código.js productivo verificado. No usa coordinación entre ejecuciones.
 */

var CONAPE_MIRROR_V44_HEADERS = [
  'CEDULA','APELLIDO_1','APELLIDO_2','NOMBRE','TELEFONO','CORREO','ESTADO','FECHA_ESTADO',
  'FECHA_REGISTRO','USUARIO_REGISTRO','APROBACION','FORMALIZACION','ULTIMO_DESEMBOLSO',
  'PROXIMO_DESEMBOLSO','ULTIMO_SYNC'
];
var CONAPE_MIRROR_V44_ALLOWED_ROLES = ['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN'];

function _conapeV44Text_(v) { return String(v == null ? '' : v).trim(); }
function _conapeV44Upper_(v) {
  return _conapeV44Text_(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
}
function _conapeV44Cedula_(v) { return _conapeV44Text_(v).replace(/\D/g,''); }
function _conapeV44Hash_(v) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(v || ''), Utilities.Charset.UTF_8);
  return bytes.map(function(b){ var n=(b+256)%256; return ('0'+n.toString(16)).slice(-2); }).join('');
}
function _conapeV44HeaderMap_(headers) {
  var out = {};
  (headers || []).forEach(function(h,i){ out[_conapeV44Upper_(h).replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')] = i; });
  return out;
}
function _conapeV44RequireSession_(body) {
  body = body || {};
  var token = _conapeV44Text_(body.token || body.session_token);
  if (!token) throw new Error('CONAPE_MIRROR_SESSION_REQUIRED');
  var s = validarSesion(token);
  if (!s || s.ok !== true) throw new Error('CONAPE_MIRROR_SESSION_INVALID');
  var role = _conapeV44Upper_(s.rol || s.role || s.tipo_usuario);
  if (CONAPE_MIRROR_V44_ALLOWED_ROLES.indexOf(role) < 0) throw new Error('CONAPE_MIRROR_ROLE_FORBIDDEN');
  if (s.demo === true || s.read_only === true) throw new Error('CONAPE_MIRROR_READ_ONLY');
  return s;
}
function _conapeV44Sheet_() {
  var ss = SpreadsheetApp.openById(OPERATIVO_ID);
  var ws = ss.getSheetByName('CONAPE_RECLUTAMIENTO');
  if (!ws) throw new Error('CONAPE_RECLUTAMIENTO_MISSING');
  var headers = ws.getRange(1,1,1,CONAPE_MIRROR_V44_HEADERS.length).getDisplayValues()[0];
  for (var i=0;i<CONAPE_MIRROR_V44_HEADERS.length;i++) {
    if (_conapeV44Upper_(headers[i]) !== CONAPE_MIRROR_V44_HEADERS[i]) throw new Error('CONAPE_RECLUTAMIENTO_HEADERS_INVALID');
  }
  return ws;
}
function _conapeV44CanonicalSource_(row) {
  row = row || {};
  var ced = _conapeV44Cedula_(row.cedula);
  if (!ced) return null;
  return {
    CEDULA:ced,
    APELLIDO_1:_conapeV44Text_(row.apellido_1),
    APELLIDO_2:_conapeV44Text_(row.apellido_2),
    NOMBRE:_conapeV44Text_(row.nombre),
    TELEFONO:_conapeV44Text_(row.celular || row.telefono),
    CORREO:_conapeV44Text_(row.correo).toLowerCase(),
    ESTADO:_conapeV44Text_(row.estado),
    FECHA_ESTADO:_conapeV44Text_(row.fecha_estado),
    FECHA_REGISTRO:_conapeV44Text_(row.fecha_registro),
    USUARIO_REGISTRO:_conapeV44Text_(row.usuario_registro),
    APROBACION:_conapeV44Text_(row.aprobacion),
    FORMALIZACION:_conapeV44Text_(row.formalizacion),
    ULTIMO_DESEMBOLSO:_conapeV44Text_(row.ultimo_desembolso),
    PROXIMO_DESEMBOLSO:_conapeV44Text_(row.proximo_desembolso),
    ULTIMO_SYNC:''
  };
}
function _conapeV44ReadMirror_() {
  var ws = _conapeV44Sheet_();
  var last = ws.getLastRow();
  if (last < 2) return [];
  var values = ws.getRange(2,1,last-1,CONAPE_MIRROR_V44_HEADERS.length).getDisplayValues();
  return values.map(function(r){
    var o={}; CONAPE_MIRROR_V44_HEADERS.forEach(function(h,i){o[h]=_conapeV44Text_(r[i]);}); return o;
  }).filter(function(o){return !!_conapeV44Cedula_(o.CEDULA);});
}
function _conapeV44MirrorMap_() {
  var map = {};
  _conapeV44ReadMirror_().forEach(function(r){map[_conapeV44Cedula_(r.CEDULA)]=r;});
  return map;
}
function _conapeV44Stage_(r) {
  r = r || {};
  if (_conapeV44Text_(r.ULTIMO_DESEMBOLSO)) return 'CONAPE_DESEMBOLSO';
  if (_conapeV44Text_(r.FORMALIZACION)) return 'CONAPE_FORMALIZADO';
  if (_conapeV44Text_(r.APROBACION)) return 'CONAPE_APROBADO';
  var estado = _conapeV44Upper_(r.ESTADO);
  if (estado.indexOf('BPM') >= 0) return 'CONAPE_BPM';
  if (estado.indexOf('ANAL') >= 0 || estado.indexOf('REVISION') >= 0) return 'CONAPE_ANALISIS';
  if (estado.indexOf('INICIO') >= 0 || estado.indexOf('SOLICITUD') >= 0 || estado.indexOf('RECLUT') >= 0) return 'CONAPE_SOLICITUD';
  return '';
}
function _conapeV44StageRank_(v) {
  var k = _conapeV44Upper_(v).replace(/[^A-Z0-9]+/g,'_');
  var ranks = {
    LEAD:0,N0:0,IDENTIFICADO:5,N1:5,FORMA_PAGO:8,N2:8,
    CONAPE_SOLICITUD:10,SOLICITUD:10,C6:10,C7:10,F00:10,F01:10,F02:10,F03:10,F04:10,F05:10,F06:10,F07:10,F08:10,F09:10,F10:10,
    CONAPE_ANALISIS:20,ANALISIS:20,C8:20,CONAPE_BPM:30,BPM:30,C9:30,
    CONAPE_APROBADO:40,CONAPE_APROBADO_FIRMA:40,APROBADO:40,C10:40,
    CONAPE_FORMALIZADO:50,FORMALIZADO:50,C11:50,
    CONAPE_DESEMBOLSO:60,DESEMBOLSO:60,C12:60,MATRICULA:70,MATRICULADO:70,ACTIVO:70,C13:70,FIN:80
  };
  return Object.prototype.hasOwnProperty.call(ranks,k) ? ranks[k] : -1;
}
function _conapeV44MergeProspect_(p,row) {
  p = p || {}; row = row || {};
  if (_conapeV44Upper_(p.financiamiento || p.FINANCIAMIENTO) !== 'CONAPE') return p;
  var out = {};
  Object.keys(p).forEach(function(k){out[k]=p[k];});
  out.estado_conape_raw = row.ESTADO || '';
  out.fecha_estado_conape = row.FECHA_ESTADO || '';
  out.aprobacion_conape = row.APROBACION || '';
  out.formalizacion_conape = row.FORMALIZACION || '';
  out.ultimo_desembolso_conape = row.ULTIMO_DESEMBOLSO || '';
  out.proximo_desembolso_conape = row.PROXIMO_DESEMBOLSO || '';
  out.conape_ultimo_sync = row.ULTIMO_SYNC || '';
  var status = _conapeV44Upper_(p.estado || p.ESTADO);
  if (status === 'ACTIVO' || status === 'MATRICULADO' || _conapeV44Text_(p.codigo || p.CODIGO)) return out;
  var candidate = _conapeV44Stage_(row);
  var current = _conapeV44Text_(p.etapa_conape_ui || p.etapa || '');
  if (candidate && _conapeV44StageRank_(candidate) >= _conapeV44StageRank_(current)) out.etapa_conape_ui = candidate;
  return out;
}
function _conapeV44DisbursementParts_(raw) {
  var s=_conapeV44Text_(raw),m=s.match(/(^|\D)(\d{1,2})\D+(\d{1,2})\D+(\d{4})(\D|$)/);
  return m ? {num:m[2],mes:m[3],anio:m[4]} : {num:'',mes:'',anio:''};
}
function _conapeV44MovementSpec_(ced,type,row) {
  row=row||{};
  var d=_conapeV44DisbursementParts_(row.ULTIMO_DESEMBOLSO);
  var raw=_conapeV44Text_(row.ULTIMO_DESEMBOLSO || row.FORMALIZACION || row.APROBACION || row.FECHA_ESTADO);
  var fingerprint=[ced,type,raw,row.ESTADO,row.APROBACION,row.FORMALIZACION,row.ULTIMO_DESEMBOLSO,row.PROXIMO_DESEMBOLSO].join('|');
  return {
    cedula:ced,type:type,row:row,raw:raw,num:d.num,mes:d.mes,anio:d.anio,
    anchor:_conapeV44Hash_(fingerprint)
  };
}
function _conapeV44DetectMovements_(oldMap,newMap) {
  var out=[];
  Object.keys(newMap).sort().forEach(function(ced){
    var n=newMap[ced],o=oldMap[ced];
    if (!o) {
      if (_conapeV44Text_(n.ULTIMO_DESEMBOLSO)) out.push(_conapeV44MovementSpec_(ced,'PRIMER_DESEMBOLSO',n));
      else if (_conapeV44Text_(n.FORMALIZACION)) out.push(_conapeV44MovementSpec_(ced,'FORMALIZADO',n));
      else if (_conapeV44Text_(n.APROBACION)) out.push(_conapeV44MovementSpec_(ced,'APROBADO_SIN_DESEMBOLSO',n));
      else out.push(_conapeV44MovementSpec_(ced,'INGRESO_LISTA',n));
      return;
    }
    if (!_conapeV44Text_(o.ULTIMO_DESEMBOLSO) && _conapeV44Text_(n.ULTIMO_DESEMBOLSO)) out.push(_conapeV44MovementSpec_(ced,'PRIMER_DESEMBOLSO',n));
    else if (_conapeV44Text_(o.ULTIMO_DESEMBOLSO) && !_conapeV44Text_(n.ULTIMO_DESEMBOLSO)) out.push(_conapeV44MovementSpec_(ced,'DESEMBOLSO_REMOVIDO',n));
    else if (_conapeV44Text_(o.ULTIMO_DESEMBOLSO) !== _conapeV44Text_(n.ULTIMO_DESEMBOLSO)) out.push(_conapeV44MovementSpec_(ced,'NUEVO_DESEMBOLSO',n));
    if (!_conapeV44Text_(o.FORMALIZACION) && _conapeV44Text_(n.FORMALIZACION)) out.push(_conapeV44MovementSpec_(ced,'FORMALIZADO',n));
    if (!_conapeV44Text_(o.APROBACION) && _conapeV44Text_(n.APROBACION)) out.push(_conapeV44MovementSpec_(ced,'APROBADO_SIN_DESEMBOLSO',n));
    if (_conapeV44Text_(o.ESTADO) !== _conapeV44Text_(n.ESTADO)) out.push(_conapeV44MovementSpec_(ced,'CAMBIO_ESTADO',n));
  });
  Object.keys(oldMap).sort().forEach(function(ced){
    if (!newMap[ced]) out.push(_conapeV44MovementSpec_(ced,'RETIRADO_DE_LISTA',oldMap[ced]));
  });
  return out;
}
function _conapeV44AppendMovements_(events,syncId) {
  if (!events.length) return 0;
  var ss=SpreadsheetApp.openById(OPERATIVO_ID),ws=ss.getSheetByName('CONAPE_MOVIMIENTOS_LOG');
  if (!ws) throw new Error('CONAPE_MOVIMIENTOS_LOG_MISSING');
  var lastCol=ws.getLastColumn(),headers=ws.getRange(1,1,1,lastCol).getDisplayValues()[0],hm=_conapeV44HeaderMap_(headers);
  ['MOVIMIENTO_ID','DETECTADO_EN','CEDULA','NOMBRE','TIPO','ANCLA_HASH','SYNC_ID'].forEach(function(h){if(hm[h]==null)throw new Error('CONAPE_MOVIMIENTOS_LOG_HEADERS_INVALID');});
  var seen={};
  if (ws.getLastRow()>1) {
    var existing=ws.getRange(2,hm.ANCLA_HASH+1,ws.getLastRow()-1,1).getDisplayValues();
    existing.forEach(function(r){var h=_conapeV44Text_(r[0]);if(h)seen[h]=true;});
  }
  var rows=[];
  events.forEach(function(ev){
    if (seen[ev.anchor]) return;
    var values=new Array(lastCol).fill(''),r=ev.row||{};
    values[hm.MOVIMIENTO_ID]='MOV-'+Utilities.getUuid();
    values[hm.DETECTADO_EN]=new Date();
    values[hm.CEDULA]=ev.cedula;
    values[hm.NOMBRE]=[_conapeV44Text_(r.NOMBRE),_conapeV44Text_(r.APELLIDO_1),_conapeV44Text_(r.APELLIDO_2)].filter(Boolean).join(' ');
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
  if(rows.length)ws.getRange(ws.getLastRow()+1,1,rows.length,lastCol).setValues(rows);
  return rows.length;
}
function _conapeV44WriteMirror_(newMap,syncStamp) {
  var ws=_conapeV44Sheet_();
  var rows=Object.keys(newMap).sort().map(function(ced){
    var r=newMap[ced]; r.ULTIMO_SYNC=syncStamp;
    return CONAPE_MIRROR_V44_HEADERS.map(function(h){return r[h]||'';});
  });
  var last=ws.getLastRow();
  if(last>1)ws.getRange(2,1,last-1,CONAPE_MIRROR_V44_HEADERS.length).clearContent();
  if(rows.length)ws.getRange(2,1,rows.length,CONAPE_MIRROR_V44_HEADERS.length).setValues(rows);
  return rows.length;
}

function conapeMirrorApplySnapshotV44(body) {
  body=body||{};
  _conapeV44RequireSession_(body);
  var rowsCsv=Number(body.rows_csv),rowsHtml=Number(body.rows_html_all),rows=Array.isArray(body.rows)?body.rows:[];
  var valid=body.counts_match===true && body.columns_ok===true && _conapeV44Upper_(body.method)==='CSV_DOWNLOAD' && rowsCsv>0 && rowsHtml>0 && rowsCsv===rowsHtml && rows.length>0;
  if(!valid) return {ok:false,code:'CONAPE_SNAPSHOT_ABORTED',rows_csv:rowsCsv,rows_html_all:rowsHtml,counts_match:false,written:false};
  var newMap={};
  for(var i=0;i<rows.length;i++){
    var c=_conapeV44CanonicalSource_(rows[i]); if(!c)continue;
    if(newMap[c.CEDULA] && JSON.stringify(newMap[c.CEDULA])!==JSON.stringify(c)) return {ok:false,code:'CONAPE_DUPLICATE_CEDULA_CONFLICT',written:false};
    newMap[c.CEDULA]=c;
  }
  if(Object.keys(newMap).length!==rowsCsv) return {ok:false,code:'CONAPE_SNAPSHOT_COUNT_INVALID',rows_csv:rowsCsv,rows_html_all:rowsHtml,counts_match:false,written:false};

  var oldMap=_conapeV44MirrorMap_();
  var events=_conapeV44DetectMovements_(oldMap,newMap);
  var syncId='RECL-'+Utilities.getUuid();
  var logged=_conapeV44AppendMovements_(events,syncId); // movimientos siempre antes del espejo
  var stamp=Utilities.formatDate(new Date(),'America/Costa_Rica','yyyy-MM-dd HH:mm:ss');
  var written=_conapeV44WriteMirror_(newMap,stamp);
  SpreadsheetApp.flush();
  return {ok:true,code:'CONAPE_MIRROR_UPDATED',written:true,row_count:written,movements:logged,sync_id:syncId,captured_at:_conapeV44Text_(body.captured_at),ultimo_sync:stamp};
}

function conapeMirrorReadForSalesV44(body) {
  body=body||{};
  _conapeV44RequireSession_(body);
  var asesor=_conapeV44Text_(body.asesor);
  var dash=_conapeMirrorBaseGetDashboardVentasV44({token:body.token,asesor:asesor});
  if(!dash||dash.ok===false||!Array.isArray(dash.prospectos))return{ok:false,code:'CAMPUS_SALES_SCOPE_UNAVAILABLE',rows:[]};
  var allowed={}; dash.prospectos.forEach(function(p){var c=_conapeV44Cedula_(p.cedula||p.CEDULA);if(c)allowed[c]=true;});
  var rows=_conapeV44ReadMirror_().filter(function(r){return !!allowed[_conapeV44Cedula_(r.CEDULA)];}).map(function(r){return{
    cedula:r.CEDULA,estado:r.ESTADO,fecha_estado:r.FECHA_ESTADO,aprobacion:r.APROBACION,formalizacion:r.FORMALIZACION,
    ultimo_desembolso:r.ULTIMO_DESEMBOLSO,proximo_desembolso:r.PROXIMO_DESEMBOLSO,ultimo_sync:r.ULTIMO_SYNC
  };});
  return{ok:true,code:'CONAPE_MIRROR_SALES_READY',row_count:rows.length,rows:rows};
}

// Snapshot previo incorporado al primer render de Ventas. La consulta viva del bridge ocurre después.
var _conapeMirrorBaseGetDashboardVentasV44 = getDashboardVentas;
getDashboardVentas = function(params) {
  var dash=_conapeMirrorBaseGetDashboardVentasV44(params);
  if(!dash||dash.ok===false||!Array.isArray(dash.prospectos))return dash;
  try{
    var mirror=_conapeV44MirrorMap_(),visible=[];
    dash.prospectos.forEach(function(p){
      var ced=_conapeV44Cedula_(p.cedula||p.CEDULA),row=mirror[ced];
      if(row&&_conapeV44Text_(row.ULTIMO_DESEMBOLSO))return; // corte Ventas después del primer desembolso
      visible.push(row?_conapeV44MergeProspect_(p,row):p);
    });
    dash.prospectos=visible;
    dash.total_prospectos=visible.length;
  }catch(err){Logger.log('[CONAPE V4.4 mirror read] '+String(err&&err.message||err));}
  return dash;
};

// Dos endpoints internos del monolito, sin alterar las rutas anteriores.
var _conapeMirrorBaseDoPostV44 = doPost;
doPost = function(e) {
  try {
    var body={}; try{body=_an4406_parseBody_(e)||{};}catch(_){body={};}
    var fn=''; try{fn=String((e&&e.parameter&&e.parameter.fn)||body.fn||'').trim().toLowerCase();}catch(_){fn='';}
    if(fn==='conapemirrorapplysnapshotv44')return _an4406_json_(conapeMirrorApplySnapshotV44(body));
    if(fn==='conapemirrorreadforsalesv44')return _an4406_json_(conapeMirrorReadForSalesV44(body));
    return _conapeMirrorBaseDoPostV44(e);
  } catch(err) {
    return _an4406_json_({ok:false,error:'conape_mirror_v44_error',mensaje:String(err&&err.message?err.message:err)});
  }
};
