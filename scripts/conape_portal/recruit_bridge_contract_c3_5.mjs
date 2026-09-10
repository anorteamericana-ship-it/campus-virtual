import crypto from 'node:crypto';

export const PREVIEW_TTL_MS = 5 * 60 * 1000;
export const IDENTITY_SOURCE = 'CONAPE_CEDULA_LOOKUP';
export const FORBIDDEN_IDENTITY_KEYS = Object.freeze([
  'nombre', 'apellido_1', 'apellido_2',
  'P2_PRS_NOMBRE', 'P2_PRS_APELLIDO_1', 'P2_PRS_APELLIDO_2',
]);

export function digits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function localPhone(value) {
  const d = digits(value);
  if (d.length === 11 && d.startsWith('506')) return d.slice(3);
  return d.slice(-8);
}

export function cleanEmail(value) {
  return String(value ?? '').trim().toLowerCase().slice(0, 128);
}

export function validEmail(value) {
  const e = cleanEmail(value);
  return !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export function validatePreviewRequest(raw) {
  const cedula = digits(raw?.cedula);
  if (cedula.length < 8 || cedula.length > 12) {
    return { ok:false, error:'CEDULA_INVALIDA' };
  }
  return { ok:true, cedula };
}

export function validateSubmitRequest(raw) {
  const cedula = digits(raw?.cedula);
  const p = raw?.prospecto && typeof raw.prospecto === 'object' ? raw.prospecto : {};
  const sourceVersion = String(raw?.source_version || '').trim();

  if (cedula.length < 8 || cedula.length > 12) return { ok:false, error:'CEDULA_INVALIDA' };
  if (!sourceVersion || sourceVersion.length > 200) return { ok:false, error:'SOURCE_VERSION_REQUIRED' };

  const forbidden = FORBIDDEN_IDENTITY_KEYS.filter(key => Object.prototype.hasOwnProperty.call(p, key));
  if (forbidden.length) return { ok:false, error:'IDENTITY_FIELDS_FORBIDDEN', forbidden_keys:forbidden };

  const identitySource = String(p.identity_source || '');
  if (identitySource !== IDENTITY_SOURCE) return { ok:false, error:'IDENTITY_SOURCE_INVALID' };

  const payloadCedula = digits(p.cedula);
  if (payloadCedula && payloadCedula !== cedula) return { ok:false, error:'CEDULA_MISMATCH' };

  const updateTelefono = p.update_telefono === true;
  const updateCorreo = p.update_correo === true;
  const telefono = localPhone(p.telefono);
  const correo = cleanEmail(p.correo);

  if (updateTelefono && telefono.length !== 8) return { ok:false, error:'TELEFONO_INVALIDO' };
  if (updateCorreo && (!correo || !validEmail(correo))) return { ok:false, error:'CORREO_INVALIDO' };

  return {
    ok:true,
    cedula,
    source_version:sourceVersion,
    prospecto:{
      cedula,
      telefono,
      correo,
      update_telefono:updateTelefono,
      update_correo:updateCorreo,
      identity_source:IDENTITY_SOURCE,
    },
  };
}

export function issueSourceVersion({ now = Date.now(), ttlMs = PREVIEW_TTL_MS } = {}) {
  const issuedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + ttlMs).toISOString();
  return {
    source_version:crypto.randomBytes(24).toString('base64url'),
    issued_at:issuedAt,
    expires_at:expiresAt,
  };
}

export function sourceVersionExpired(expiresAt, now = Date.now()) {
  const t = Date.parse(String(expiresAt || ''));
  return !Number.isFinite(t) || t <= now;
}

export function classifyCreateOutcome(meta = {}) {
  const requestObserved = meta.create_request_observed === true;
  const requestToken = String(meta.request_token || meta.request_contract?.[0]?.request_token || '').toUpperCase();
  const writePerformed = meta.write_performed === true;
  const writeCount = Number(meta.write_count || 0);
  const outcome = meta.outcome || {};
  const success = outcome.success_message === true || meta.success_signal === true;
  const duplicate = outcome.duplicate_message === true;
  const error = outcome.error_message === true;

  if (duplicate) return { ok:false, confirmed:true, code:'DUPLICATE' };
  if (error) return { ok:false, confirmed:true, code:'PORTAL_ERROR' };
  if (requestObserved && requestToken === 'CREATE' && writePerformed && writeCount === 1 && success) {
    return { ok:true, confirmed:true, code:'CREATED' };
  }
  if (writePerformed) return { ok:false, confirmed:false, code:'WRITE_RESULT_UNCERTAIN' };
  return { ok:false, confirmed:true, code:'NOT_CREATED' };
}

export function safeAuditEvent({ action, result, requestId, sourceVersion } = {}) {
  return {
    action:String(action || ''),
    result:String(result || ''),
    request_id:String(requestId || ''),
    source_version_present:!!String(sourceVersion || ''),
    pii_emitted:false,
    cookies_emitted:false,
    hidden_values_emitted:false,
  };
}
