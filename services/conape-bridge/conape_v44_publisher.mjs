import crypto from 'node:crypto';

const CONAPE_V44_ACTION = 'agentConapeMirrorApplySnapshotV44';
const CONAPE_V44_ROW_FIELDS = Object.freeze([
  'cedula','apellido_1','apellido_2','nombre','telefono','celular','correo','estado',
  'fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion',
  'ultimo_desembolso','proximo_desembolso',
]);

function text(value) {
  return String(value == null ? '' : value).trim();
}

function rawText(value) {
  return String(value == null ? '' : value);
}

function plainObject(value) {
  return !!value && Object.prototype.toString.call(value) === '[object Object]';
}

function stableValue(value) {
  if (value == null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(stableValue);
  if (plainObject(value)) {
    const out = {};
    for (const key of Object.keys(value).sort()) out[key] = stableValue(value[key]);
    return out;
  }
  return null;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function hmacSha256Hex(secret, canonical) {
  return crypto.createHmac('sha256', rawText(secret)).update(String(canonical), 'utf8').digest('hex');
}

function publisherError(code, details = {}) {
  const error = new Error(code);
  error.code = code;
  Object.assign(error, details);
  return error;
}

function projectRow(row, index) {
  if (!plainObject(row)) throw publisherError('CONAPE_V44_PUBLISHER_ROW_INVALID', { row_index:index });
  const projected = {};
  for (const field of CONAPE_V44_ROW_FIELDS) projected[field] = text(row[field]);
  projected.cedula = projected.cedula.replace(/\D/g, '');
  if (!projected.cedula) throw publisherError('CONAPE_V44_PUBLISHER_CEDULA_INVALID', { row_index:index });
  if (!projected.estado) throw publisherError('CONAPE_V44_PUBLISHER_ESTADO_INVALID', { row_index:index });
  return projected;
}

function buildConapeV44Snapshot(listResult) {
  if (!plainObject(listResult)) throw publisherError('CONAPE_V44_PUBLISHER_SOURCE_INVALID');

  const method = text(listResult.method).toUpperCase();
  const rowsCsv = Number(listResult.rows_csv);
  const rowsHtmlAll = Number(listResult.rows_html_all);
  const rows = Array.isArray(listResult.rows) ? listResult.rows : [];

  if (method !== 'CSV_DOWNLOAD') throw publisherError('CONAPE_V44_PUBLISHER_REQUIRES_CSV', { method });
  if (listResult.columns_ok !== true) throw publisherError('CONAPE_V44_PUBLISHER_COLUMNS_NOT_OK');
  if (listResult.counts_match !== true) throw publisherError('CONAPE_V44_PUBLISHER_COUNTS_NOT_MATCHED');
  if (!Number.isInteger(rowsCsv) || rowsCsv <= 0 || !Number.isInteger(rowsHtmlAll) || rowsHtmlAll <= 0) {
    throw publisherError('CONAPE_V44_PUBLISHER_COUNT_INVALID');
  }
  if (rowsCsv !== rowsHtmlAll || rows.length !== rowsCsv) {
    throw publisherError('CONAPE_V44_PUBLISHER_COUNT_INVALID', {
      rows_csv:Number.isInteger(rowsCsv) ? rowsCsv : null,
      rows_html_all:Number.isInteger(rowsHtmlAll) ? rowsHtmlAll : null,
      rows_length:rows.length,
    });
  }

  const projectedRows = [];
  const seenCedulas = new Set();
  for (let i = 0; i < rows.length; i += 1) {
    const projected = projectRow(rows[i], i + 1);
    if (seenCedulas.has(projected.cedula)) {
      throw publisherError('CONAPE_V44_PUBLISHER_DUPLICATE_CEDULA', { row_index:i + 1 });
    }
    seenCedulas.add(projected.cedula);
    projectedRows.push(projected);
  }

  const capturedAt = text(listResult.captured_at);
  if (!capturedAt || Number.isNaN(Date.parse(capturedAt))) {
    throw publisherError('CONAPE_V44_PUBLISHER_CAPTURED_AT_INVALID');
  }

  return {
    method:'CSV_DOWNLOAD',
    columns_ok:true,
    counts_match:true,
    rows_csv:rowsCsv,
    rows_html_all:rowsHtmlAll,
    captured_at:capturedAt,
    rows:projectedRows,
  };
}

function canonicalForEnvelope({ serviceId, timestamp, nonce, requestId, action, data }) {
  const payloadHash = sha256Hex(stableJson(data || {}));
  return {
    payloadHash,
    canonical:[text(serviceId), text(timestamp), text(nonce), text(requestId), text(action), payloadHash].join('\n'),
  };
}

function buildConapeV44SignedEnvelope(listResult, options = {}) {
  const data = buildConapeV44Snapshot(listResult);
  const serviceId = text(options.serviceId ?? process.env.CAMPUS_SERVICE_ID);
  const secret = rawText(options.secret ?? process.env.CAMPUS_SERVICE_SECRET);
  if (!serviceId) throw publisherError('CONAPE_V44_PUBLISHER_SERVICE_ID_MISSING');
  if (!secret) throw publisherError('CONAPE_V44_PUBLISHER_SECRET_MISSING');

  const timestamp = options.timestamp == null ? Date.now() : Number(options.timestamp);
  if (!Number.isFinite(timestamp) || timestamp <= 0) throw publisherError('CONAPE_V44_PUBLISHER_TIMESTAMP_INVALID');

  const nonce = text(options.nonce || crypto.randomBytes(16).toString('hex'));
  const requestId = text(options.requestId || `conape-v44-${crypto.randomUUID()}`);
  if (nonce.length < 16) throw publisherError('CONAPE_V44_PUBLISHER_NONCE_INVALID');
  if (requestId.length < 8) throw publisherError('CONAPE_V44_PUBLISHER_REQUEST_ID_INVALID');

  const action = CONAPE_V44_ACTION;
  const { payloadHash, canonical } = canonicalForEnvelope({ serviceId, timestamp, nonce, requestId, action, data });
  const signature = hmacSha256Hex(secret, canonical);

  return {
    envelope:{ action, serviceId, requestId, timestamp, nonce, signature, data },
    meta:{ action, payload_hash:payloadHash, row_count:data.rows.length, apply_enabled:false },
  };
}

function buildConapeV44DryRunSummary(listResult, env = process.env) {
  const data = buildConapeV44Snapshot(listResult);
  const payloadHash = sha256Hex(stableJson(data));
  const serviceId = text(env?.CAMPUS_SERVICE_ID);
  const secret = rawText(env?.CAMPUS_SERVICE_SECRET);
  let signatureReady = false;

  if (serviceId && secret) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const requestId = `conape-v44-preview-${crypto.randomUUID()}`;
    const { canonical } = canonicalForEnvelope({
      serviceId,
      timestamp,
      nonce,
      requestId,
      action:CONAPE_V44_ACTION,
      data,
    });
    signatureReady = /^[0-9a-f]{64}$/.test(hmacSha256Hex(secret, canonical));
  }

  return {
    ok:true,
    code:'CONAPE_V44_PUBLISHER_READY',
    action:CONAPE_V44_ACTION,
    method:data.method,
    columns_ok:data.columns_ok,
    counts_match:data.counts_match,
    rows_csv:data.rows_csv,
    rows_html_all:data.rows_html_all,
    row_count:data.rows.length,
    captured_at:data.captured_at,
    payload_hash_prefix:payloadHash.slice(0, 16),
    service_id_configured:!!serviceId,
    secret_configured:!!secret,
    signature_ready:signatureReady,
    apply_enabled:false,
  };
}

export {
  CONAPE_V44_ACTION,
  CONAPE_V44_ROW_FIELDS,
  stableJson,
  sha256Hex,
  hmacSha256Hex,
  buildConapeV44Snapshot,
  canonicalForEnvelope,
  buildConapeV44SignedEnvelope,
  buildConapeV44DryRunSummary,
};
