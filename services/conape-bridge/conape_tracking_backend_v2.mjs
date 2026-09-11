/* CONAPE Tracking V2 · autorización y filtrado backend. No hace logging. */

const digits = value => String(value ?? '').replace(/\D/g, '');
const upper = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();

export function normalizeRequestedTrackingIdentities(values, max = 100) {
  if (!Array.isArray(values)) throw Object.assign(new Error('Lista de cédulas requerida.'), { code:'TRACKING_IDENTITIES_REQUIRED', status:422 });
  if (values.length > max) throw Object.assign(new Error('Demasiadas cédulas solicitadas.'), { code:'TRACKING_IDENTITIES_LIMIT', status:422 });
  const unique = [];
  const seen = new Set();
  let invalid = 0;
  for (const value of values) {
    const id = digits(value);
    if (id.length < 8 || id.length > 12) { invalid += 1; continue; }
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(id);
  }
  return { identities:unique, invalid_count:invalid, duplicate_count:values.length - invalid - unique.length };
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function runner() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length:Math.min(limit, items.length || 1) }, () => runner()));
  return results;
}

export async function authorizeTrackingIdentities({
  token,
  cedulas,
  maxRequested = 100,
  concurrency = 6,
  authorizeSession,
  getProspectoDetalle,
  extractCedula,
  extractFinancing,
}) {
  if (typeof authorizeSession !== 'function' || typeof getProspectoDetalle !== 'function') throw new TypeError('Tracking authorization callbacks required.');
  const requested = normalizeRequestedTrackingIdentities(cedulas, maxRequested);
  const base = await authorizeSession(token);
  const outcomes = await mapLimit(requested.identities, Math.max(1, Math.min(10, Number(concurrency) || 6)), async cedula => {
    const detail = await getProspectoDetalle(base.token, cedula);
    if (!detail || detail.ok === false) return { authorized:false, reason:'access' };
    const prospecto = detail.prospecto || detail;
    const actual = digits(typeof extractCedula === 'function' ? extractCedula(prospecto) : prospecto?.cedula);
    if (actual !== cedula) return { authorized:false, reason:'identity_mismatch' };
    const financing = upper(typeof extractFinancing === 'function' ? extractFinancing(prospecto) : prospecto?.financiamiento);
    if (financing !== 'CONAPE') return { authorized:false, reason:'not_conape' };
    return { authorized:true, cedula };
  });
  const authorizedCedulas = outcomes.filter(item => item?.authorized).map(item => item.cedula);
  return {
    base,
    authorizedCedulas,
    metrics:{
      requested_count:requested.identities.length,
      authorized_count:authorizedCedulas.length,
      denied_count:outcomes.length - authorizedCedulas.length,
      invalid_count:requested.invalid_count,
      duplicate_count:requested.duplicate_count,
    },
  };
}

export function publicTrackingMetrics({ authorization = {}, parser = {}, filtered = {} } = {}) {
  return {
    requested_count:Number(authorization.requested_count || 0),
    authorized_count:Number(authorization.authorized_count || 0),
    returned_count:Number(filtered.returned || 0),
    missing_count:Number(filtered.missing || 0),
    ambiguous_count:Number(filtered.ambiguous || 0),
    invalid_date_count:Number(parser.invalid_dates || 0),
    parse_duration_ms:Number(parser.parse_duration_ms || 0),
  };
}
