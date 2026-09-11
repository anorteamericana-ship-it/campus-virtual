/* CONAPE Tracking V2 · contrato read-only. No hace red ni escrituras. */

const DATE_FIELDS = Object.freeze([
  'fecha_estado', 'fecha_registro', 'fecha_aprobacion',
  'fecha_formalizacion', 'ultimo_desembolso', 'proximo_desembolso',
]);

const PROCESS_FIELDS = Object.freeze([
  'estado_raw', ...DATE_FIELDS, 'usuario_registro',
]);

const digits = value => String(value ?? '').replace(/\D/g, '');
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();

export function normalizeTrackingDate(value) {
  const raw = clean(value);
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

export function filterAuthorizedTracking(records, allowedIdentities) {
  const allowed = new Set(Array.from(allowedIdentities || [], digits).filter(Boolean));
  const grouped = new Map();

  for (const record of Array.isArray(records) ? records : []) {
    const id = digits(record?.cedula);
    if (!id || !allowed.has(id)) continue;
    const list = grouped.get(id) || [];
    list.push(record);
    grouped.set(id, list);
  }

  const output = [];
  const missing = [];
  const ambiguous = [];

  for (const id of allowed) {
    const matches = grouped.get(id) || [];
    if (!matches.length) { missing.push(id); continue; }
    if (matches.length !== 1) { ambiguous.push(id); continue; }

    const source = matches[0];
    const item = { cedula:id, estado_raw:clean(source.estado_raw) || null };
    for (const field of DATE_FIELDS) {
      const parsed = normalizeTrackingDate(source[field]);
      item[field] = parsed.iso;
      item[`${field}_raw`] = parsed.raw;
    }
    item.usuario_registro = clean(source.usuario_registro) || null;
    item.captured_at = source.captured_at || null;
    output.push(item);
  }

  return {
    records:output,
    missing,
    ambiguous,
    metrics:{ requested:allowed.size, returned:output.length, missing:missing.length, ambiguous:ambiguous.length },
  };
}

export const conapeTrackingContract = Object.freeze({
  endpoint:'/v1/tracking/query',
  method:'POST',
  maxRequestedIdentities:100,
  processFields:[...PROCESS_FIELDS],
  forbiddenResponseFields:['nombre','primer_apellido','segundo_apellido','telefono','correo'],
  observedStates:['REGISTRO','CONFIRMADO','CREÓ CUENTA'],
});
