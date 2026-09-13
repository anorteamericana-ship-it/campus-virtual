/* CONAPE V4.4 LIVE MIRROR CORE
 * Target: CURRENT production Apps Script project, same Script ID as @424.
 * This file is build input only. It is NOT a standalone Apps Script project.
 *
 * Allowed writes by construction:
 *   Spreadsheet: CAMPUS_OPERATIVO only
 *   Sheets: CONAPE_RECLUTAMIENTO, CONAPE_MOVIMIENTOS_LOG only
 *
 * Entry points:
 *   conapeMirrorReadForSalesV44(body)           -> human Campus session path
 *   agentConapeMirrorApplySnapshotV44(data)     -> existing service-HMAC path
 */

var CONAPE_MIRROR_V44_OPERATIVO_ID = '1dbNtotJC51Bx40r4zZv3ugt8-P3GYYzeLxsMOEYismI';
var CONAPE_MIRROR_V44_ALLOWED_SHEETS = Object.freeze({
  CONAPE_RECLUTAMIENTO: true,
  CONAPE_MOVIMIENTOS_LOG: true
});
var CONAPE_MIRROR_V44_HEADERS = [
  'CEDULA','APELLIDO_1','APELLIDO_2','NOMBRE','TELEFONO','CORREO','ESTADO','FECHA_ESTADO',
  'FECHA_REGISTRO','USUARIO_REGISTRO','APROBACION','FORMALIZACION','ULTIMO_DESEMBOLSO',
  'PROXIMO_DESEMBOLSO','ULTIMO_SYNC'
];
var CONAPE_MIRROR_V44_MOVEMENT_TYPES = Object.freeze({
  PRIMER_DESEMBOLSO: true,
  NUEVO_DESEMBOLSO: true,
  DESEMBOLSO_REMOVIDO: true,
  APROBADO_SIN_DESEMBOLSO: true,
  RETIRADO_DE_LISTA: true
});

function _conapeMirrorV44Text_(v) {
  return String(v == null ? '' : v).trim();
}

function _conapeMirrorV44Upper_(v) {
  return _conapeMirrorV44Text_(v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/\s+/g, ' ').trim();
}

function _conapeMirrorV44Cedula_(v) {
  return _conapeMirrorV44Text_(v).replace(/\D/g, '');
}

function _conapeMirrorV44Hex_(bytes) {
  return (bytes || []).map(function(b) {
    var n = (b + 256) % 256;
    return ('0' + n.toString(16)).slice(-2);
  }).join('');
}

function _conapeMirrorV44Sha256_(v) {
  return _conapeMirrorV44Hex_(Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(v == null ? '' : v),
    Utilities.Charset.UTF_8
  ));
}

function _conapeMirrorV44HeaderMap_(headers) {
  var out = {};
  (headers || []).forEach(function(h, i) {
    var key = _conapeMirrorV44Upper_(h)
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    out[key] = i;
  });
  return out;
}

function _conapeMirrorV44Sheet_(name) {
  var key = _conapeMirrorV44Text_(name);
  if (!CONAPE_MIRROR_V44_ALLOWED_SHEETS[key]) throw new Error('CONAPE_MIRROR_SHEET_NOT_ALLOWED');
  var ss = SpreadsheetApp.openById(CONAPE_MIRROR_V44_OPERATIVO_ID);
  var ws = ss.getSheetByName(key);
  if (!ws) throw new Error('CONAPE_MIRROR_SHEET_MISSING_' + key);
  return ws;
}

function _conapeMirrorV44ValidateHeaders_(ws) {
  var got = ws.getRange(1, 1, 1, CONAPE_MIRROR_V44_HEADERS.length).getDisplayValues()[0];
  for (var i = 0; i < CONAPE_MIRROR_V44_HEADERS.length; i++) {
    if (_conapeMirrorV44Upper_(got[i]) !== CONAPE_MIRROR_V44_HEADERS[i]) {
      throw new Error('CONAPE_RECLUTAMIENTO_HEADERS_INVALID');
    }
  }
}

function _conapeMirrorV44CanonicalRow_(row) {
  row = row || {};
  var ced = _conapeMirrorV44Cedula_(row.cedula);
  if (!ced) return null;
  return {
    CEDULA: ced,
    APELLIDO_1: _conapeMirrorV44Text_(row.apellido_1),
    APELLIDO_2: _conapeMirrorV44Text_(row.apellido_2),
    NOMBRE: _conapeMirrorV44Text_(row.nombre),
    TELEFONO: _conapeMirrorV44Text_(row.celular || row.telefono),
    CORREO: _conapeMirrorV44Text_(row.correo).toLowerCase(),
    ESTADO: _conapeMirrorV44Text_(row.estado),
    FECHA_ESTADO: _conapeMirrorV44Text_(row.fecha_estado),
    FECHA_REGISTRO: _conapeMirrorV44Text_(row.fecha_registro),
    USUARIO_REGISTRO: _conapeMirrorV44Text_(row.usuario_registro),
    APROBACION: _conapeMirrorV44Text_(row.aprobacion),
    FORMALIZACION: _conapeMirrorV44Text_(row.formalizacion),
    ULTIMO_DESEMBOLSO: _conapeMirrorV44Text_(row.ultimo_desembolso),
    PROXIMO_DESEMBOLSO: _conapeMirrorV44Text_(row.proximo_desembolso),
    ULTIMO_SYNC: ''
  };
}

function _conapeMirrorV44ReadRows_() {
  var ws = _conapeMirrorV44Sheet_('CONAPE_RECLUTAMIENTO');
  _conapeMirrorV44ValidateHeaders_(ws);
  var last = ws.getLastRow();
  if (last < 2) return [];
  var values = ws.getRange(2, 1, last - 1, CONAPE_MIRROR_V44_HEADERS.length).getDisplayValues();
  return values.map(function(r) {
    var obj = {};
    CONAPE_MIRROR_V44_HEADERS.forEach(function(h, i) { obj[h] = _conapeMirrorV44Text_(r[i]); });
    return obj;
  }).filter(function(obj) { return !!_conapeMirrorV44Cedula_(obj.CEDULA); });
}

function _conapeMirrorV44Map_() {
  var map = {};
  _conapeMirrorV44ReadRows_().forEach(function(r) {
    map[_conapeMirrorV44Cedula_(r.CEDULA)] = r;
  });
  return map;
}

function _conapeMirrorV44DisbursementParts_(raw) {
  var s = _conapeMirrorV44Text_(raw);
  var m = s.match(/(^|\D)(\d{1,2})\D+(\d{1,2})\D+(\d{4})(\D|$)/);
  return m ? { num:m[2], mes:m[3], anio:m[4] } : { num:'', mes:'', anio:'' };
}

function _conapeMirrorV44Movement_(ced, type, row) {
  if (!CONAPE_MIRROR_V44_MOVEMENT_TYPES[type]) throw new Error('CONAPE_MOVEMENT_TYPE_NOT_ALLOWED');
  row = row || {};
  var parts = _conapeMirrorV44DisbursementParts_(row.ULTIMO_DESEMBOLSO);
  var raw = type === 'APROBADO_SIN_DESEMBOLSO'
    ? _conapeMirrorV44Text_(row.APROBACION)
    : _conapeMirrorV44Text_(row.ULTIMO_DESEMBOLSO || row.FECHA_ESTADO);
  var fingerprint = [
    ced, type, raw, row.ESTADO, row.APROBACION, row.FORMALIZACION,
    row.ULTIMO_DESEMBOLSO, row.PROXIMO_DESEMBOLSO
  ].join('|');
  return {
    cedula:ced,
    type:type,
    row:row,
    raw:raw,
    num:parts.num,
    mes:parts.mes,
    anio:parts.anio,
    anchor:_conapeMirrorV44Sha256_(fingerprint)
  };
}

function _conapeMirrorV44DetectMovements_(oldMap, newMap) {
  var out = [];
  Object.keys(newMap).sort().forEach(function(ced) {
    var n = newMap[ced];
    var o = oldMap[ced];
    if (!o) {
      if (_conapeMirrorV44Text_(n.ULTIMO_DESEMBOLSO)) {
        out.push(_conapeMirrorV44Movement_(ced, 'PRIMER_DESEMBOLSO', n));
      } else if (_conapeMirrorV44Text_(n.APROBACION)) {
        out.push(_conapeMirrorV44Movement_(ced, 'APROBADO_SIN_DESEMBOLSO', n));
      }
      return;
    }

    var oldDisb = _conapeMirrorV44Text_(o.ULTIMO_DESEMBOLSO);
    var newDisb = _conapeMirrorV44Text_(n.ULTIMO_DESEMBOLSO);
    if (!oldDisb && newDisb) {
      out.push(_conapeMirrorV44Movement_(ced, 'PRIMER_DESEMBOLSO', n));
    } else if (oldDisb && !newDisb) {
      out.push(_conapeMirrorV44Movement_(ced, 'DESEMBOLSO_REMOVIDO', o));
    } else if (oldDisb && newDisb && oldDisb !== newDisb) {
      out.push(_conapeMirrorV44Movement_(ced, 'NUEVO_DESEMBOLSO', n));
    }

    if (!_conapeMirrorV44Text_(o.APROBACION) && _conapeMirrorV44Text_(n.APROBACION) && !newDisb) {
      out.push(_conapeMirrorV44Movement_(ced, 'APROBADO_SIN_DESEMBOLSO', n));
    }
  });

  Object.keys(oldMap).sort().forEach(function(ced) {
    if (!newMap[ced]) out.push(_conapeMirrorV44Movement_(ced, 'RETIRADO_DE_LISTA', oldMap[ced]));
  });
  return out;
}

function _conapeMirrorV44AppendMovements_(events, syncId) {
  if (!events.length) return 0;
  var ws = _conapeMirrorV44Sheet_('CONAPE_MOVIMIENTOS_LOG');
  var lastCol = ws.getLastColumn();
  var headers = ws.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  var hm = _conapeMirrorV44HeaderMap_(headers);
  ['MOVIMIENTO_ID','DETECTADO_EN','CEDULA','NOMBRE','TIPO','ANCLA_HASH','SYNC_ID'].forEach(function(h) {
    if (hm[h] == null) throw new Error('CONAPE_MOVIMIENTOS_LOG_HEADERS_INVALID');
  });

  var seen = {};
  if (ws.getLastRow() > 1) {
    ws.getRange(2, hm.ANCLA_HASH + 1, ws.getLastRow() - 1, 1).getDisplayValues().forEach(function(r) {
      var h = _conapeMirrorV44Text_(r[0]);
      if (h) seen[h] = true;
    });
  }

  var rows = [];
  events.forEach(function(ev) {
    if (seen[ev.anchor]) return;
    var values = new Array(lastCol).fill('');
    var r = ev.row || {};
    values[hm.MOVIMIENTO_ID] = 'MOV-' + ev.anchor.slice(0, 32);
    values[hm.DETECTADO_EN] = new Date();
    values[hm.CEDULA] = ev.cedula;
    values[hm.NOMBRE] = [r.NOMBRE, r.APELLIDO_1, r.APELLIDO_2].map(_conapeMirrorV44Text_).filter(Boolean).join(' ');
    values[hm.TIPO] = ev.type;
    if (hm.NUM_DESEMBOLSO != null) values[hm.NUM_DESEMBOLSO] = ev.num;
    if (hm.PERIODO_MES != null) values[hm.PERIODO_MES] = ev.mes;
    if (hm.PERIODO_ANIO != null) values[hm.PERIODO_ANIO] = ev.anio;
    if (hm.FECHA_RAW != null) values[hm.FECHA_RAW] = ev.raw;
    if (hm.TELEFONO != null) values[hm.TELEFONO] = r.TELEFONO || '';
    if (hm.ESTADO_VINCULO != null) values[hm.ESTADO_VINCULO] = 'SIN_VINCULAR';
    if (hm.PRIMER_DESEMBOLSO_DETECTADO_EN != null && ev.type === 'PRIMER_DESEMBOLSO') {
      values[hm.PRIMER_DESEMBOLSO_DETECTADO_EN] = new Date();
    }
    values[hm.ANCLA_HASH] = ev.anchor;
    values[hm.SYNC_ID] = syncId;
    rows.push(values);
    seen[ev.anchor] = true;
  });

  if (rows.length) ws.getRange(ws.getLastRow() + 1, 1, rows.length, lastCol).setValues(rows);
  return rows.length;
}

function _conapeMirrorV44WriteMirror_(newMap, syncStamp) {
  var ws = _conapeMirrorV44Sheet_('CONAPE_RECLUTAMIENTO');
  _conapeMirrorV44ValidateHeaders_(ws);
  var rows = Object.keys(newMap).sort().map(function(ced) {
    var r = newMap[ced];
    r.ULTIMO_SYNC = syncStamp;
    return CONAPE_MIRROR_V44_HEADERS.map(function(h) { return r[h] || ''; });
  });

  var existing = Math.max(0, ws.getLastRow() - 1);
  var total = Math.max(existing, rows.length);
  if (total > 0) {
    var matrix = [];
    for (var i = 0; i < total; i++) {
      matrix.push(i < rows.length ? rows[i] : new Array(CONAPE_MIRROR_V44_HEADERS.length).fill(''));
    }
    ws.getRange(2, 1, total, CONAPE_MIRROR_V44_HEADERS.length).setValues(matrix);
  }
  return rows.length;
}

function _conapeMirrorV44ValidateSnapshot_(body) {
  body = body || {};
  var rowsCsv = Number(body.rows_csv);
  var rowsHtml = Number(body.rows_html_all);
  var rows = Array.isArray(body.rows) ? body.rows : [];
  var valid = body.counts_match === true &&
    body.columns_ok === true &&
    _conapeMirrorV44Upper_(body.method) === 'CSV_DOWNLOAD' &&
    Number.isInteger(rowsCsv) && rowsCsv > 0 &&
    Number.isInteger(rowsHtml) && rowsHtml > 0 &&
    rowsCsv === rowsHtml && rows.length > 0;
  if (!valid) {
    return {
      ok:false,
      code:'CONAPE_SNAPSHOT_ABORTED',
      rows_csv:Number.isInteger(rowsCsv) ? rowsCsv : null,
      rows_html_all:Number.isInteger(rowsHtml) ? rowsHtml : null,
      counts_match:false,
      written:false
    };
  }
  return { ok:true, rows_csv:rowsCsv, rows_html_all:rowsHtml, rows:rows };
}

function agentConapeMirrorApplySnapshotV44(data) {
  var gate = _conapeMirrorV44ValidateSnapshot_(data);
  if (!gate.ok) return gate; // CRITICAL: no movement detection before this return.

  var newMap = {};
  for (var i = 0; i < gate.rows.length; i++) {
    var c = _conapeMirrorV44CanonicalRow_(gate.rows[i]);
    if (!c) continue;
    if (newMap[c.CEDULA] && JSON.stringify(newMap[c.CEDULA]) !== JSON.stringify(c)) {
      return { ok:false, code:'CONAPE_DUPLICATE_CEDULA_CONFLICT', written:false };
    }
    newMap[c.CEDULA] = c;
  }

  if (Object.keys(newMap).length !== gate.rows_csv) {
    return {
      ok:false,
      code:'CONAPE_SNAPSHOT_COUNT_INVALID',
      rows_csv:gate.rows_csv,
      rows_html_all:gate.rows_html_all,
      counts_match:false,
      written:false
    };
  }

  var oldMap = _conapeMirrorV44Map_();
  var events = _conapeMirrorV44DetectMovements_(oldMap, newMap);
  var syncId = 'RECL-' + Utilities.getUuid();
  var logged = _conapeMirrorV44AppendMovements_(events, syncId); // MUST precede mirror write.
  var stamp = Utilities.formatDate(new Date(), 'America/Costa_Rica', 'yyyy-MM-dd HH:mm:ss');
  var written = _conapeMirrorV44WriteMirror_(newMap, stamp);
  SpreadsheetApp.flush();
  return {
    ok:true,
    code:'CONAPE_MIRROR_UPDATED',
    written:true,
    row_count:written,
    movements:logged,
    sync_id:syncId,
    captured_at:_conapeMirrorV44Text_(data && data.captured_at),
    ultimo_sync:stamp
  };
}

function _conapeMirrorV44PublicRow_(r) {
  return {
    cedula:_conapeMirrorV44Cedula_(r.CEDULA),
    estado:_conapeMirrorV44Text_(r.ESTADO),
    fecha_estado:_conapeMirrorV44Text_(r.FECHA_ESTADO),
    aprobacion:_conapeMirrorV44Text_(r.APROBACION),
    formalizacion:_conapeMirrorV44Text_(r.FORMALIZACION),
    ultimo_desembolso:_conapeMirrorV44Text_(r.ULTIMO_DESEMBOLSO),
    proximo_desembolso:_conapeMirrorV44Text_(r.PROXIMO_DESEMBOLSO),
    ultimo_sync:_conapeMirrorV44Text_(r.ULTIMO_SYNC)
  };
}

function conapeMirrorReadForSalesV44(body) {
  body = body || {};
  var sesion = body._auth_session || null;
  if (!sesion) return { ok:false, error:'no_autorizado', code:'SESSION_REQUIRED' };

  var role = _conapeMirrorV44Upper_(sesion.rol || sesion.role).replace(/\s+/g, '');
  var allowedRole = role === 'VENTAS' || role === 'ASESOR' || role === 'ASESORA' ||
    role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'SUPERADMIN';
  if (!allowedRole) return { ok:false, error:'no_autorizado', code:'ROLE_FORBIDDEN' };

  var sesionNombre = _conapeMirrorV44Text_(sesion.nombre || sesion.name || sesion.usuario);
  var asesor = role === 'VENTAS' || role === 'ASESOR' || role === 'ASESORA'
    ? sesionNombre
    : _conapeMirrorV44Text_(body.asesor || sesionNombre);
  if (!asesor) return { ok:false, error:'asesor_requerido', code:'ASESOR_REQUIRED' };

  var dash = getDashboardVentas({ asesor:asesor });
  if (!dash || dash.ok !== true || !Array.isArray(dash.prospectos)) {
    return { ok:false, error:'ventas_scope_unavailable', code:'VENTAS_SCOPE_UNAVAILABLE' };
  }

  var allowed = {};
  dash.prospectos.forEach(function(p) {
    var ced = _conapeMirrorV44Cedula_(p && p.cedula);
    if (ced) allowed[ced] = true;
  });

  var rows = _conapeMirrorV44ReadRows_()
    .filter(function(r) { return !!allowed[_conapeMirrorV44Cedula_(r.CEDULA)]; })
    .map(_conapeMirrorV44PublicRow_);

  var lastSync = '';
  rows.forEach(function(r) { if (r.ultimo_sync && r.ultimo_sync > lastSync) lastSync = r.ultimo_sync; });
  return {
    ok:true,
    code:'CONAPE_MIRROR_READY',
    source:'MIRROR',
    asesor:asesor,
    row_count:rows.length,
    ultimo_sync:lastSync,
    rows:rows
  };
}
