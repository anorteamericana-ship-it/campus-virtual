import { createHash } from 'node:crypto';

const REQUIRED_COLUMNS = ['cedula', 'estado_raw', 'fecha_estado'];
const OPTIONAL_COLUMNS = [
  'primer_apellido', 'segundo_apellido', 'nombre', 'telefono', 'correo',
  'fecha_registro', 'usuario_registro', 'fecha_aprobacion',
  'fecha_formalizacion', 'ultimo_desembolso', 'proximo_desembolso',
];

const KNOWN_STATES = new Set([
  'INICIO_SOLICITUD',
  'DOCUMENTOS_PENDIENTES',
  'ANALISIS',
  'PASADA_A_BPM',
  'REGISTRO',
]);

const HEADER_ALIASES = new Map([
  ['CEDULA', 'cedula'],
  ['PRIMER_APELLIDO', 'primer_apellido'],
  ['SEGUNDO_APELLIDO', 'segundo_apellido'],
  ['NOMBRE', 'nombre'],
  ['TELEFONO_CELULAR', 'telefono'],
  ['TELEFONO', 'telefono'],
  ['CORREO_ELECTRONICO', 'correo'],
  ['CORREO', 'correo'],
  ['ESTADO', 'estado_raw'],
  ['FECHA_DE_ESTADO', 'fecha_estado'],
  ['FECHA_ESTADO', 'fecha_estado'],
  ['FECHA_DE_REGISTRO', 'fecha_registro'],
  ['FECHA_REGISTRO', 'fecha_registro'],
  ['USUARIO_QUE_REGISTRO', 'usuario_registro'],
  ['USUARIO_REGISTRO', 'usuario_registro'],
  ['APROBACION', 'fecha_aprobacion'],
  ['FORMALIZACION', 'fecha_formalizacion'],
  ['ULTIMO_DESEMBOLSO', 'ultimo_desembolso'],
  ['PROXIMO_DESEMBOLSO', 'proximo_desembolso'],
]);

function decodeEntities(value) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    Ntilde: 'Ñ', ntilde: 'ñ',
  };
  return String(value || '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => Object.prototype.hasOwnProperty.call(named, name) ? named[name] : m);
}

function stripTags(value) {
  return decodeEntities(String(value || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function keyText(value) {
  return stripTags(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeHeader(value) {
  const key = keyText(value);
  return HEADER_ALIASES.get(key) || null;
}

export function normalizeCedula(raw) {
  const value = stripTags(raw);
  const digits = value.replace(/\D/g, '');
  return { cedula_raw: value || null, cedula: digits || null };
}

export function normalizeDate(raw) {
  const value = stripTags(raw);
  if (!value || value === '-' || value === '—') return { value: null, invalid: false };
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return { value: null, invalid: true };
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!valid) return { value: null, invalid: true };
  return { value: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, invalid: false };
}

export function normalizeState(raw) {
  const estado_raw = stripTags(raw).replace(/\s+/g, ' ').trim();
  return { estado_raw: estado_raw || null, estado_key: estado_raw ? keyText(estado_raw) : null };
}

function sha256(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function extractRows(tableHtml) {
  const rows = [];
  const re = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = re.exec(tableHtml))) {
    const rowHtml = rowMatch[1];
    const cells = [];
    const cellRe = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowHtml))) {
      cells.push({
        kind: cellMatch[1].toLowerCase(),
        attrs: cellMatch[2] || '',
        text: stripTags(cellMatch[3]),
      });
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function identifyTable(html) {
  const tables = [];
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tableRe.exec(html))) {
    const rows = extractRows(tableMatch[1]);
    const headerRow = rows.find(r => r.some(c => c.kind === 'th'));
    if (!headerRow) continue;
    const mapped = headerRow.map(c => normalizeHeader(c.text));
    const requiredFound = REQUIRED_COLUMNS.filter(c => mapped.includes(c)).length;
    tables.push({ html: tableMatch[1], rows, headerRow, mapped, requiredFound });
  }
  tables.sort((a, b) => b.requiredFound - a.requiredFound);
  return tables[0] || null;
}

function looksLikeBlockedSource(html) {
  const text = stripTags(html).toUpperCase();
  if (/ORA-\d{4,}/.test(text)) return 'APEX_ORACLE_ERROR';
  if (text.includes('APEX ERROR') || text.includes('ERROR APEX')) return 'APEX_ERROR';
  if ((text.includes('CONTRASENA') || text.includes('PASSWORD')) && (text.includes('USUARIO') || text.includes('USERNAME'))) return 'APEX_LOGIN_PAGE';
  if (text.includes('SESION EXPIRADA') || text.includes('SESSION EXPIRED')) return 'APEX_SESSION_EXPIRED';
  return null;
}

function baseResult() {
  return {
    ok: false,
    source: 'CONAPE_APEX_PROSPECTACION',
    records: [],
    warnings: [],
    metrics: {
      html_rows_detected: 0,
      records_parsed: 0,
      invalid_identifications: 0,
      invalid_dates: 0,
      duplicate_identities: 0,
      unknown_states: 0,
      missing_required_columns: 0,
      missing_optional_columns: 0,
    },
  };
}

export function parseConapeApexReport(rawHtml, { capturedAt = null } = {}) {
  const out = baseResult();
  const html = String(rawHtml || '');
  const blocked = looksLikeBlockedSource(html);
  if (blocked) {
    out.error = { code: 'BLOCK_SOURCE', reason: blocked };
    return out;
  }

  const table = identifyTable(html);
  if (!table) {
    out.error = { code: 'BLOCK_SOURCE', reason: 'APEX_REPORT_NOT_FOUND' };
    return out;
  }

  const headerIndex = table.rows.indexOf(table.headerRow);
  const headers = table.headerRow.map(c => normalizeHeader(c.text));
  const present = new Set(headers.filter(Boolean));
  const missingRequired = REQUIRED_COLUMNS.filter(c => !present.has(c));
  const missingOptional = OPTIONAL_COLUMNS.filter(c => !present.has(c));
  out.metrics.missing_required_columns = missingRequired.length;
  out.metrics.missing_optional_columns = missingOptional.length;

  if (missingRequired.length) {
    out.error = { code: 'BLOCK_PARSE', reason: 'REQUIRED_COLUMN_MISSING', columns: missingRequired };
    return out;
  }
  for (const column of missingOptional) {
    out.warnings.push({ code: 'OPTIONAL_COLUMN_MISSING', column });
  }

  const dataRows = table.rows.slice(headerIndex + 1).filter(row => {
    const tdCells = row.filter(c => c.kind === 'td');
    if (!tdCells.length) return false;
    if (tdCells.length === 1 && /colspan\s*=/.test(tdCells[0].attrs)) return false;
    return true;
  });
  out.metrics.html_rows_detected = dataRows.length;

  const seen = new Map();
  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const row = dataRows[rowIndex];
    const tdCells = row.filter(c => c.kind === 'td');
    const raw = {};
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i];
      if (!key) continue;
      raw[key] = tdCells[i] ? tdCells[i].text : '';
    }

    const id = normalizeCedula(raw.cedula);
    if (!id.cedula) out.metrics.invalid_identifications += 1;
    const state = normalizeState(raw.estado_raw);
    const dates = {};
    for (const field of ['fecha_estado', 'fecha_registro', 'fecha_aprobacion', 'fecha_formalizacion', 'ultimo_desembolso', 'proximo_desembolso']) {
      const parsed = normalizeDate(raw[field]);
      dates[field] = parsed.value;
      if (parsed.invalid) {
        out.metrics.invalid_dates += 1;
        out.warnings.push({ code: 'INVALID_DATE', row: rowIndex + 1, field });
      }
    }

    const record = {
      cedula_raw: id.cedula_raw,
      cedula: id.cedula,
      primer_apellido: stripTags(raw.primer_apellido) || null,
      segundo_apellido: stripTags(raw.segundo_apellido) || null,
      nombre: stripTags(raw.nombre) || null,
      telefono: stripTags(raw.telefono) || null,
      correo: stripTags(raw.correo) || null,
      estado_raw: state.estado_raw,
      estado_key: state.estado_key,
      fecha_estado: dates.fecha_estado,
      fecha_registro: dates.fecha_registro,
      usuario_registro: stripTags(raw.usuario_registro) || null,
      fecha_aprobacion: dates.fecha_aprobacion,
      fecha_formalizacion: dates.fecha_formalizacion,
      ultimo_desembolso: dates.ultimo_desembolso,
      proximo_desembolso: dates.proximo_desembolso,
      captured_at: capturedAt || null,
    };

    const processShape = {
      cedula: record.cedula,
      estado_raw: record.estado_raw,
      fecha_estado: record.fecha_estado,
      fecha_registro: record.fecha_registro,
      fecha_aprobacion: record.fecha_aprobacion,
      fecha_formalizacion: record.fecha_formalizacion,
      ultimo_desembolso: record.ultimo_desembolso,
      proximo_desembolso: record.proximo_desembolso,
    };
    const recordShape = { ...record, captured_at: undefined };
    record.process_hash = sha256(processShape);
    record.record_hash = sha256(recordShape);

    if (record.estado_key && !KNOWN_STATES.has(record.estado_key)) {
      out.metrics.unknown_states += 1;
      out.warnings.push({ code: 'UNKNOWN_CONAPE_STATE', row: rowIndex + 1, estado_raw: record.estado_raw });
    }
    if (record.cedula) {
      if (seen.has(record.cedula)) {
        out.metrics.duplicate_identities += 1;
        out.warnings.push({ code: 'DUPLICATE_SOURCE_IDENTITY', cedula: record.cedula, rows: [seen.get(record.cedula), rowIndex + 1] });
      } else {
        seen.set(record.cedula, rowIndex + 1);
      }
    }
    out.records.push(record);
  }

  out.metrics.records_parsed = out.records.length;
  if (out.metrics.html_rows_detected !== out.metrics.records_parsed) {
    out.error = { code: 'BLOCK_PARSE', reason: 'ROW_COUNT_MISMATCH' };
    return out;
  }

  out.ok = true;
  return out;
}

export const conapePortalContract = Object.freeze({
  requiredColumns: [...REQUIRED_COLUMNS],
  optionalColumns: [...OPTIONAL_COLUMNS],
  knownStates: [...KNOWN_STATES],
});
