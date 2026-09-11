/* CONAPE Tracking V2 · parser read-only de Home. No hace red ni logging. */

const REQUIRED_COLUMNS = Object.freeze(['cedula','estado_raw','fecha_estado']);
const PROCESS_COLUMNS = Object.freeze([
  'cedula','estado_raw','fecha_estado','fecha_registro','usuario_registro',
  'fecha_aprobacion','fecha_formalizacion','ultimo_desembolso','proximo_desembolso',
]);

const HEADER_ALIASES = new Map([
  ['CEDULA','cedula'],
  ['IDENTIFICACION','cedula'],
  ['ESTADO','estado_raw'],
  ['FECHA_DE_ESTADO','fecha_estado'],
  ['FECHA_ESTADO','fecha_estado'],
  ['FECHA_DE_REGISTRO','fecha_registro'],
  ['FECHA_REGISTRO','fecha_registro'],
  ['USUARIO_QUE_REGISTRO','usuario_registro'],
  ['USUARIO_REGISTRO','usuario_registro'],
  ['APROBACION','fecha_aprobacion'],
  ['FECHA_DE_APROBACION','fecha_aprobacion'],
  ['FECHA_APROBACION','fecha_aprobacion'],
  ['FORMALIZACION','fecha_formalizacion'],
  ['FECHA_DE_FORMALIZACION','fecha_formalizacion'],
  ['FECHA_FORMALIZACION','fecha_formalizacion'],
  ['ULTIMO_DESEMBOLSO','ultimo_desembolso'],
  ['FECHA_ULTIMO_DESEMBOLSO','ultimo_desembolso'],
  ['PROXIMO_DESEMBOLSO','proximo_desembolso'],
  ['FECHA_PROXIMO_DESEMBOLSO','proximo_desembolso'],
]);

function decodeEntities(value) {
  const named = {
    amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ',
    Aacute:'Á', Eacute:'É', Iacute:'Í', Oacute:'Ó', Uacute:'Ú',
    aacute:'á', eacute:'é', iacute:'í', oacute:'ó', uacute:'ú',
    Ntilde:'Ñ', ntilde:'ñ',
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function normalizeTrackingHeader(value) {
  return HEADER_ALIASES.get(keyText(value)) || null;
}

export function normalizeTrackingIdentity(value) {
  const raw = stripTags(value);
  const cedula = raw.replace(/\D/g, '');
  return cedula.length >= 8 && cedula.length <= 12 ? cedula : null;
}

export function normalizeTrackingDate(value) {
  const raw = stripTags(value);
  if (!raw || raw === '-' || raw === '—') return { raw:null, iso:null, invalid:false };

  let match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (match) {
    const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
    const hour = match[4] == null ? 0 : Number(match[4]);
    const minute = match[5] == null ? 0 : Number(match[5]);
    const second = match[6] == null ? 0 : Number(match[6]);
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second;
    if (!valid) return { raw, iso:null, invalid:true };
    return { raw, iso:match[4] == null ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : date.toISOString(), invalid:false };
  }

  match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    return valid ? { raw, iso:raw, invalid:false } : { raw, iso:null, invalid:true };
  }
  return { raw, iso:null, invalid:true };
}

function extractRows(tableHtml) {
  const rows = [];
  const re = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = re.exec(tableHtml))) {
    const cells = [];
    const cellRe = /<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1]))) {
      cells.push({ kind:cellMatch[1].toLowerCase(), attrs:cellMatch[2] || '', text:stripTags(cellMatch[3]) });
    }
    if (cells.length) rows.push(cells);
  }
  return rows;
}

function identifyTable(html) {
  const candidates = [];
  const tableRe = /<table\b[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  while ((tableMatch = tableRe.exec(html))) {
    const rows = extractRows(tableMatch[1]);
    const headerRow = rows.find(row => row.some(cell => cell.kind === 'th'));
    if (!headerRow) continue;
    const mapped = headerRow.map(cell => normalizeTrackingHeader(cell.text));
    const requiredFound = REQUIRED_COLUMNS.filter(column => mapped.includes(column)).length;
    candidates.push({ rows, headerRow, mapped, requiredFound });
  }
  candidates.sort((a,b) => b.requiredFound - a.requiredFound);
  return candidates[0] || null;
}

function blockedSourceReason(html) {
  const text = stripTags(html).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  if (/ORA-\d{4,}/.test(text)) return 'APEX_ORACLE_ERROR';
  if (text.includes('SESSION EXPIRED') || text.includes('SESION EXPIRADA')) return 'APEX_SESSION_EXPIRED';
  if ((text.includes('PASSWORD') || text.includes('CONTRASENA')) && (text.includes('USUARIO') || text.includes('USERNAME'))) return 'APEX_LOGIN_PAGE';
  return null;
}

export function parseConapeTrackingHome(rawHtml, { capturedAt = null } = {}) {
  const started = Date.now();
  const html = String(rawHtml || '');
  const blocked = blockedSourceReason(html);
  if (blocked) return { ok:false, error:{ code:'BLOCK_SOURCE', reason:blocked }, records:[], metrics:{ parse_duration_ms:Date.now()-started } };

  const table = identifyTable(html);
  if (!table) return { ok:false, error:{ code:'BLOCK_SOURCE', reason:'TRACKING_REPORT_NOT_FOUND' }, records:[], metrics:{ parse_duration_ms:Date.now()-started } };

  const headers = table.headerRow.map(cell => normalizeTrackingHeader(cell.text));
  const present = new Set(headers.filter(Boolean));
  const missingRequired = REQUIRED_COLUMNS.filter(column => !present.has(column));
  if (missingRequired.length) return { ok:false, error:{ code:'BLOCK_PARSE', reason:'REQUIRED_COLUMN_MISSING', columns:missingRequired }, records:[], metrics:{ parse_duration_ms:Date.now()-started } };

  const headerIndex = table.rows.indexOf(table.headerRow);
  const dataRows = table.rows.slice(headerIndex + 1).filter(row => {
    const cells = row.filter(cell => cell.kind === 'td');
    return cells.length > 1 || (cells.length === 1 && !/colspan\s*=/i.test(cells[0].attrs));
  });

  const records = [];
  let invalidIdentities = 0;
  let invalidDates = 0;
  for (const row of dataRows) {
    const cells = row.filter(cell => cell.kind === 'td');
    const source = {};
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i];
      if (!key || !PROCESS_COLUMNS.includes(key)) continue;
      source[key] = cells[i]?.text || '';
    }
    const cedula = normalizeTrackingIdentity(source.cedula);
    if (!cedula) { invalidIdentities += 1; continue; }
    const item = { cedula, estado_raw:stripTags(source.estado_raw) || null, usuario_registro:stripTags(source.usuario_registro) || null, captured_at:capturedAt || null };
    for (const field of ['fecha_estado','fecha_registro','fecha_aprobacion','fecha_formalizacion','ultimo_desembolso','proximo_desembolso']) {
      const parsed = normalizeTrackingDate(source[field]);
      item[field] = parsed.iso;
      item[`${field}_raw`] = parsed.raw;
      if (parsed.invalid) invalidDates += 1;
    }
    records.push(item);
  }

  return {
    ok:true,
    records,
    metrics:{
      html_rows_detected:dataRows.length,
      records_parsed:records.length,
      invalid_identifications:invalidIdentities,
      invalid_dates:invalidDates,
      parse_duration_ms:Date.now()-started,
    },
  };
}

export const conapeTrackingParserContract = Object.freeze({
  requiredColumns:[...REQUIRED_COLUMNS],
  processColumns:[...PROCESS_COLUMNS],
  headerAliases:Object.freeze(Object.fromEntries(HEADER_ALIASES)),
});
