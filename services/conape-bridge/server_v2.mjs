import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';
import { buildConapeProspectacionV2SignedEnvelope } from './conape_v44_publisher.mjs';
import {
  downloadProspectCsvViaDialog,
  verifyDoubleCsv,
} from './conape_v444_csv.mjs';
const VERSION = 'V4.5.17-ORDINAL14-RECOVERY';
const PORT = Number(process.env.PORT || 8080);
const CAMPUS_URL = String(process.env.CAMPUS_APPS_SCRIPT_URL || '').trim();
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const CONAPE_REPORT_URL = String(process.env.CONAPE_REPORT_URL || 'https://online.conape.go.cr/apex/f?p=302:1::::::').trim();
const CONAPE_FRIENDLY_HOME = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home';
const CONAPE_FRIENDLY_PROSPECTO = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/prospecto';
const CONAPE_USER = String(process.env.CONAPE_PORTAL_USERNAME || '').trim();
const CONAPE_PASSWORD = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const CONAPE_EVE_ID = String(process.env.CONAPE_EVE_ID || '').trim();
const CONAPE_PRO_ID = String(process.env.CONAPE_PRO_ID || '').trim();
const CONAPE_REPORT_PRO_ID = String(process.env.CONAPE_REPORT_PRO_ID || '').trim();
const CONAPE_REPORT_EVE_ID = String(process.env.CONAPE_REPORT_EVE_ID || '').trim();
const CONAPE_REPORT_PROSPECTADOR_LABEL = String(process.env.CONAPE_REPORT_PROSPECTADOR_LABEL || 'ACADEMIA NORTEAMERICANA').trim();
const CONAPE_REPORT_EVENT_LABEL = String(process.env.CONAPE_REPORT_EVENT_LABEL || '').trim();
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70_000));
const SESSION_CACHE_TTL_MS = 30_000;
const SESSION_STATUS_CACHE_TTL_MS = 300_000;
const CAMPUS_READ_ATTEMPT_TIMEOUT_MS = Math.min(18_000, REQUEST_TIMEOUT_MS);
const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));
const STARTED_AT = new Date().toISOString();
const ALLOWED_ORIGINS = new Set(String(process.env.CAMPUS_ALLOWED_ORIGINS || 'https://anorteamerican.com,https://www.anorteamerican.com,https://anorteamericana-ship-it.github.io').split(',').map(v => v.trim()).filter(Boolean));
const ROLE_ALLOW = new Set(['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN']);
const sessionValidationCache = new Map();
const sessionValidationInflight = new Map();
const sourceVersions = new Map();
const rateBuckets = new Map();
let queue = Promise.resolve();

class AppError extends Error {
  constructor(code, message, status = 400, stage = 'PRECHECK') {
    super(message);
    this.code = code;
    this.status = status;
    this.stage = stage;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const digits = v => String(v ?? '').replace(/\D/g, '');
const txt = v => String(v ?? '').trim();
const upper = v => txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
const email = v => txt(v).toLowerCase();
const sha = v => crypto.createHash('sha256').update(String(v ?? ''), 'utf8').digest('hex');
const nowIso = () => new Date().toISOString();
const safeId = v => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(String(v || '')) ? String(v) : '';

function first(obj, keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value != null && txt(value) !== '') return value;
  }
  return '';
}

function campusPhone(p) {
  const d = digits(first(p, ['whatsapp','WHATSAPP','telefono','TELEFONO','tel1','TEL1']));
  if (d.length === 11 && d.startsWith('506')) return d.slice(3);
  return d.slice(-8);
}

function campusEmail(p) {
  return email(first(p, ['correo','CORREO','email','EMAIL','correo_electronico','CORREO_ELECTRONICO']));
}

function campusCedula(p) {
  return digits(first(p, ['cedula','CEDULA','num_cedula','NUM_CEDULA']));
}

function financing(p) {
  return upper(first(p, ['financiamiento','FINANCIAMIENTO','tipo_financiamiento','TIPO_FINANCIAMIENTO']));
}

function roleOf(session) {
  return upper(first(session, ['rol','ROL','role','ROLE','tipo_usuario','TIPO_USUARIO']));
}

function userBinding(session) {
  return sha([roleOf(session), txt(first(session, ['usuario','USUARIO','email','EMAIL'])), txt(first(session, ['codigo','CODIGO','cedula','CEDULA']))].join('|'));
}

function identityHash(s) {
  return sha([txt(s?.apellido_1), txt(s?.apellido_2), txt(s?.nombre)].join('\n'));
}

function validEmail(v) {
  const s = email(v);
  return !!s && s.length <= 128 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function serial(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function pruneState() {
  const now = Date.now();
  for (const [key, value] of sourceVersions) {
    if (!value || value.expiresAt <= now || value.consumed) sourceVersions.delete(key);
  }
  for (const [key, value] of sessionValidationCache) {
    if (!value || value.expiresAt <= now) sessionValidationCache.delete(key);
  }
  for (const [key, value] of rateBuckets) {
    if (!value || now - value.startedAt >= 120_000) rateBuckets.delete(key);
  }
}

function rateLimit(token) {
  pruneState();
  const key = sha(token);
  const now = Date.now();
  const current = rateBuckets.get(key);
  if (!current || now - current.startedAt >= 60_000) {
    rateBuckets.set(key, { startedAt:now, count:1 });
    return;
  }
  current.count += 1;
  if (current.count > 30) throw new AppError('RATE_LIMITED', 'Demasiadas solicitudes. Intentá de nuevo en un minuto.', 429);
}

function safeRequestToken(postData) {
  const raw = String(postData || '');
  const clean = value => {
    const v = String(value || '').trim();
    return /^[A-Z][A-Z0-9_:\-]{0,39}$/i.test(v) ? v.toUpperCase() : '';
  };
  try {
    if (raw.trim().startsWith('{')) {
      const obj = JSON.parse(raw);
      return clean(obj?.p_request || obj?.request || '');
    }
  } catch {}
  try {
    const params = new URLSearchParams(raw);
    return clean(params.get('p_request') || params.get('request') || '');
  } catch {
    return '';
  }
}

function safeBodyKeys(postData) {
  const raw = String(postData || '');
  if (!raw) return [];
  try {
    if (raw.trim().startsWith('{')) {
      const obj = JSON.parse(raw);
      return Object.keys(obj || {}).filter(k => /^[A-Za-z0-9_:\-]{1,80}$/.test(k)).sort();
    }
  } catch {}
  try {
    return [...new Set([...new URLSearchParams(raw).keys()].filter(k => /^[A-Za-z0-9_:\-]{1,80}$/.test(k)))].sort();
  } catch {
    return [];
  }
}

async function campusRequest(payload, timeoutMs = REQUEST_TIMEOUT_MS) {
  const fn = safeId(payload?.fn) || 'UNKNOWN';
  const started = Date.now();
  let httpStatus = 0;
  let raw = '';
  let body_starts_with_angle = false;
  let json_parsed = false;
  const campusCallShape = { event:'campus_call', fn, http_status:httpStatus, body_starts_with_angle, json_parsed, pii:false };
  void campusCallShape;

  let response;
  try {
    response = await fetch(CAMPUS_URL, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(payload),
      redirect:'follow',
      signal:AbortSignal.timeout(Math.max(5_000, Number(timeoutMs || REQUEST_TIMEOUT_MS))),
    });
  } catch (cause) {
    const error = new AppError('CAMPUS_BACKEND_UNAVAILABLE', 'El Campus está ocupado, probá de nuevo en unos segundos.', 503, 'CAMPUS');
    error.fn = fn;
    error.campus_busy = true;
    error.retryable = ['validarSesion','getProspectoDetalle','getDashboardVentas'].includes(fn) && error.campus_busy;
    error.campus_ms = Date.now() - started;
    error.cause = cause;
    throw error;
  }

  httpStatus = Number(response.status || 0);
  raw = await response.text();
  body_starts_with_angle = raw.trim().startsWith('<');
  if (!response.ok || !raw || body_starts_with_angle) {
    const error = new AppError('CAMPUS_BACKEND_UNAVAILABLE', body_starts_with_angle ? 'El Campus está ocupado, probá de nuevo en unos segundos.' : 'No se pudo consultar el Campus.', 503, 'CAMPUS');
    error.fn = fn;
    error.campus_busy = body_starts_with_angle || (Date.now() - started >= 10_000);
    error.retryable = ['validarSesion','getProspectoDetalle','getDashboardVentas'].includes(fn) && error.campus_busy;
    error.campus_ms = Date.now() - started;
    throw error;
  }

  try {
    const parsed = JSON.parse(raw);
    json_parsed = true;
    return parsed;
  } catch {
    const error = new AppError('CAMPUS_BACKEND_INVALID', 'El Campus devolvió una respuesta inválida.', 503, 'CAMPUS');
    error.fn = fn;
    error.campus_ms = Date.now() - started;
    throw error;
  }
}

async function campusCall(payload) {
  const fn = safeId(payload?.fn) || 'UNKNOWN';
  const readOnly = fn === 'validarSesion' || fn === 'getProspectoDetalle' || fn === 'getDashboardVentas';
  const timeoutMs = readOnly ? CAMPUS_READ_ATTEMPT_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
  try {
    return await campusRequest(payload, timeoutMs);
  } catch (error) {
    if (readOnly && error?.retryable === true) {
      await sleep(750);
      return campusRequest(payload, timeoutMs);
    }
    throw error;
  }
}

async function cachedSessionValidation(cleanToken, maxAgeMs = SESSION_CACHE_TTL_MS) {
  pruneState();
  const key = sha(cleanToken);
  const now = Date.now();
  const cached = sessionValidationCache.get(key);
  if (cached && cached.session?.ok === true && Number(cached.validatedAt || 0) > 0 && now - cached.validatedAt <= maxAgeMs) return cached.session;

  const existing = sessionValidationInflight.get(key);
  if (existing) return existing;

  const pending = (async () => {
    const session = await campusCall({ fn:'validarSesion', token:cleanToken });
    if (session?.ok === true) {
      const validatedAt = Date.now();
      sessionValidationCache.set(key, { session, validatedAt, expiresAt:validatedAt + SESSION_STATUS_CACHE_TTL_MS });
    }
    return session;
  })();
  sessionValidationInflight.set(key, pending);
  try {
    return await pending;
  } finally {
    if (sessionValidationInflight.get(key) === pending) sessionValidationInflight.delete(key);
  }
}

function validateSessionResult(session) {
  if (!session?.ok) throw new AppError('CAMPUS_SESSION_INVALID', 'La sesión del Campus no es válida.', 401, 'CAMPUS');
  const role = roleOf(session);
  if (!ROLE_ALLOW.has(role)) throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para usar CONAPE.', 403, 'CAMPUS');
  if (session.demo === true || session.read_only === true) throw new AppError('CAMPUS_READ_ONLY', 'La cuenta es de solo lectura.', 403, 'CAMPUS');
  return { session, binding:userBinding(session) };
}

async function authorizeCampusSession(token) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401, 'CAMPUS');
  rateLimit(cleanToken);
  const session = await cachedSessionValidation(cleanToken);
  return { ...validateSessionResult(session), token:cleanToken };
}

async function authorizeCampusSessionStatus(token) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401, 'CAMPUS');
  rateLimit(cleanToken);
  const session = await cachedSessionValidation(cleanToken, SESSION_STATUS_CACHE_TTL_MS);
  return { ...validateSessionResult(session), token:cleanToken };
}

const REFRESH_TICKET_PURPOSE = 'CONAPE_PROSPECTACION_REFRESH_V1';
const REFRESH_TICKET_MAX_FUTURE_MS = 6 * 60 * 1000;

function timingSafeHexEqual(a, b) {
  const aa = txt(a).toLowerCase();
  const bb = txt(b).toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(aa) || !/^[0-9a-f]{64}$/.test(bb)) return false;
  return crypto.timingSafeEqual(Buffer.from(aa, 'hex'), Buffer.from(bb, 'hex'));
}

function authorizeProspectRefreshTicket(token, ticket) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401, 'CAMPUS');
  rateLimit(cleanToken);

  const t = ticket && typeof ticket === 'object' && !Array.isArray(ticket) ? ticket : null;
  if (!t) throw new AppError('CONAPE_REFRESH_TICKET_REQUIRED', 'Autorización de actualización requerida.', 401, 'CAMPUS');

  const secret = String(process.env.CAMPUS_SERVICE_SECRET || '');
  const expectedServiceId = txt(process.env.CAMPUS_SERVICE_ID);
  const purpose = txt(t.purpose);
  const serviceId = txt(t.service_id);
  const exp = Number(t.exp);
  const nonce = txt(t.nonce);
  const tokenHash = txt(t.token_hash).toLowerCase();
  const role = txt(t.role).toLowerCase();
  const signature = txt(t.signature).toLowerCase();
  const now = Date.now();

  if (!secret || !expectedServiceId) throw new AppError('CONAPE_REFRESH_TICKET_CONFIG_MISSING', 'El servicio de actualización no está configurado.', 503, 'CAMPUS');
  if (Number(t.v) !== 1 || purpose !== REFRESH_TICKET_PURPOSE || serviceId !== expectedServiceId) {
    throw new AppError('CONAPE_REFRESH_TICKET_INVALID', 'Autorización de actualización inválida.', 401, 'CAMPUS');
  }
  if (!Number.isFinite(exp) || exp <= now || exp - now > REFRESH_TICKET_MAX_FUTURE_MS || nonce.length < 16) {
    throw new AppError('CONAPE_REFRESH_TICKET_EXPIRED', 'La autorización de actualización expiró.', 401, 'CAMPUS');
  }
  if (tokenHash !== sha(cleanToken)) {
    throw new AppError('CONAPE_REFRESH_TICKET_TOKEN_MISMATCH', 'La autorización no corresponde a esta sesión.', 401, 'CAMPUS');
  }
  if (!ROLE_ALLOW.has(upper(role))) {
    throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para usar CONAPE.', 403, 'CAMPUS');
  }

  const canonical = [
    REFRESH_TICKET_PURPOSE,
    serviceId,
    String(exp),
    nonce,
    tokenHash,
    role
  ].join('\n');
  const expected = crypto.createHmac('sha256', secret).update(canonical, 'utf8').digest('hex');
  if (!timingSafeHexEqual(expected, signature)) {
    throw new AppError('CONAPE_REFRESH_TICKET_BAD_SIGNATURE', 'La autorización de actualización no es válida.', 401, 'CAMPUS');
  }

  return { token:cleanToken, role:upper(role), ticket:true };
}

async function authorizeCampus(token, cedula) {
  const base = await authorizeCampusSession(token);
  const cleanCedula = digits(cedula);
  if (cleanCedula.length < 8 || cleanCedula.length > 12) throw new AppError('CEDULA_INVALID', 'Cédula inválida.', 422, 'CAMPUS');
  const detail = await campusCall({ fn:'getProspectoDetalle', token:base.token, cedula:cleanCedula });
  if (!detail || detail.ok === false) throw new AppError('PROSPECT_ACCESS_DENIED', 'No se pudo acceder a este prospecto.', 403, 'CAMPUS');
  const prospecto = detail.prospecto || detail;
  if (campusCedula(prospecto) !== cleanCedula) throw new AppError('PROSPECT_CEDULA_MISMATCH', 'La cédula no coincide con el prospecto autorizado.', 409, 'CAMPUS');
  if (financing(prospecto) !== 'CONAPE') throw new AppError('PROSPECT_NOT_CONAPE', 'El prospecto no utiliza financiamiento CONAPE.', 422, 'CAMPUS');
  return { ...base, prospecto, cedula:cleanCedula };
}

async function authorizeCampusParallel(token, cedula) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401, 'CAMPUS');
  rateLimit(cleanToken);
  const cleanCedula = digits(cedula);
  if (cleanCedula.length < 8 || cleanCedula.length > 12) throw new AppError('CEDULA_INVALID', 'Cédula inválida.', 422, 'CAMPUS');
  const [session, detail] = await Promise.all([
    cachedSessionValidation(cleanToken),
    campusCall({ fn:'getProspectoDetalle', token:cleanToken, cedula:cleanCedula }),
  ]);
  const validated = validateSessionResult(session);
  if (!detail || detail.ok === false) throw new AppError('PROSPECT_ACCESS_DENIED', 'No se pudo acceder a este prospecto.', 403, 'CAMPUS');
  const prospecto = detail.prospecto || detail;
  if (campusCedula(prospecto) !== cleanCedula) throw new AppError('PROSPECT_CEDULA_MISMATCH', 'La cédula no coincide con el prospecto autorizado.', 409, 'CAMPUS');
  if (financing(prospecto) !== 'CONAPE') throw new AppError('PROSPECT_NOT_CONAPE', 'El prospecto no utiliza financiamiento CONAPE.', 422, 'CAMPUS');
  return { ...validated, token:cleanToken, prospecto, cedula:cleanCedula };
}

async function readApexSession(p) {
  return p.evaluate(() => {
    const clean = value => /^\d{4,}$/.test(String(value ?? '').trim()) ? String(value).trim() : '';
    try {
      const u = new URL(location.href);
      const friendly = clean(u.searchParams.get('session'));
      if (friendly) return friendly;
      const legacy = String(u.searchParams.get('p') || '').split(':');
      const fromLegacy = clean(legacy[2]);
      if (fromLegacy) return fromLegacy;
    } catch {}
    for (const node of [document.querySelector('input[name="p_instance"]'), document.querySelector('input[name="pInstance"]'), document.getElementById('pInstance')]) {
      const value = clean(node?.value);
      if (value) return value;
    }
    return '';
  }).catch(() => '');
}

function urlWithSession(base, sessionId) {
  const u = new URL(base);
  u.searchParams.set('session', sessionId);
  return u.href;
}

async function clickVisibleByLabel(p, regex) {
  const selector = 'button,a,[role="button"],input[type="button"],input[type="submit"]';
  const searchTimeoutMs = Math.max(500, Number(p?.__conapeLabelSearchTimeoutMs || 15_000));
  const deadline = Date.now() + searchTimeoutMs;
  while (Date.now() < deadline) {
    for (const frame of p.frames()) {
      const items = frame.locator(selector);
      const index = await items.evaluateAll((nodes, source) => {
        const re = new RegExp(source, 'i');
        const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
        const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
        return nodes.findIndex(el => visible(el) && re.test(norm([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '))));
      }, regex.source).catch(() => -1);
      if (index >= 0) {
        await items.nth(index).click({ timeout:15_000 });
        return true;
      }
    }
    await sleep(200);
  }
  return false;
}

async function readHomeNavDebug(p) {
  let url_path = '';
  try { url_path = decodeURIComponent(new URL(p.url()).pathname || '').slice(0,160); } catch {}
  const visible_button_labels = [];
  const visible_link_labels = [];
  const addUnique = (target, values) => {
    for (const value of values || []) {
      if (!value || target.includes(value)) continue;
      target.push(value);
      if (target.length >= 40) break;
    }
  };
  for (const frame of p.frames()) {
    const labels = await frame.evaluate(() => {
      const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
      const safeLabel = el => String([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '))
        .replace(/\S+@\S*/g,'[MAIL]')
        .replace(/\d{5,}/g,'[NUM]')
        .replace(/\s+/g,' ')
        .trim()
        .slice(0,40);
      const collect = selector => Array.from(document.querySelectorAll(selector)).filter(visible).map(safeLabel).filter(Boolean).slice(0,40);
      return { buttons:collect('button,[role="button"],input[type="button"],input[type="submit"]'), links:collect('a') };
    }).catch(() => ({ buttons:[], links:[] }));
    addUnique(visible_button_labels, labels.buttons);
    addUnique(visible_link_labels, labels.links);
    if (visible_button_labels.length >= 40 && visible_link_labels.length >= 40) break;
  }
  return { url_path, frames_count:p.frames().length, visible_button_labels, visible_link_labels };
}


async function clickProspectacionModuleLink(p) {
  const links = p.locator('a:visible');
  const index = await links.evaluateAll(nodes => {
    const norm = value => String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .toUpperCase().replace(/\s+/g,' ').trim();
    return nodes.findIndex(node => norm([
      node.textContent || '',
      node.getAttribute('aria-label') || '',
      node.getAttribute('title') || '',
    ].join(' ')).includes('PROSPECTACION RECLUTADOR'));
  }).catch(() => -1);
  if (index < 0) return { found:false, clicked:false, signed_eve:false, signed_pro:false, has_cs:false };

  const meta = await links.nth(index).evaluate(node => {
    try {
      const href = String(node.href || node.getAttribute('href') || '');
      const u = new URL(href, location.href);
      const param = name => {
        for (const [key, value] of u.searchParams.entries()) {
          if (String(key || '').toLowerCase() === name) return String(value || '').trim();
        }
        return '';
      };
      return {
        found:true,
        signed_eve:!!param('p2_eve_id'),
        signed_pro:!!param('p2_pro_id'),
        has_cs:!!param('cs'),
      };
    } catch {
      return { found:true, signed_eve:false, signed_pro:false, has_cs:false };
    }
  }).catch(() => ({ found:true, signed_eve:false, signed_pro:false, has_cs:false }));

  await links.nth(index).click({ timeout:5_000 });
  await waitForApexDynamicAction(p);
  await sleep(150);
  return { ...meta, clicked:true };
}

async function readSignedNavigationTelemetry(p) {
  return p.evaluate(({ expectedEve, expectedPro }) => {
    const u = new URL(location.href);
    const param = name => {
      for (const [key, value] of u.searchParams.entries()) {
        if (String(key || '').toLowerCase() === name) return String(value || '').trim();
      }
      return '';
    };
    const eve = param('p2_eve_id');
    const pro = param('p2_pro_id');
    const cs = param('cs');
    return {
      nav_signed_eve:!!eve,
      nav_signed_pro:!!pro,
      nav_has_cs:!!cs,
      nav_eve_matches_env:expectedEve ? eve === expectedEve : null,
      nav_pro_matches_env:expectedPro ? pro === expectedPro : null,
    };
  }, { expectedEve:CONAPE_EVE_ID, expectedPro:CONAPE_PRO_ID }).catch(() => ({
    nav_signed_eve:false, nav_signed_pro:false, nav_has_cs:false,
    nav_eve_matches_env:CONAPE_EVE_ID ? false : null,
    nav_pro_matches_env:CONAPE_PRO_ID ? false : null,
  }));
}

const ConapeSession = {
  browser:null,
  context:null,
  page:null,
  state:'DISCONNECTED',
  connectedAt:'',
  lastActivity:'',
  generation:0,

  snapshot(extra = {}) {
    return { ok:true, status:this.state, connected:this.state === 'CONNECTED', connected_at:this.connectedAt || null, last_activity:this.lastActivity || null, generation:this.generation, ...extra };
  },

  async close() {
    try { await this.context?.close(); } catch {}
    try { await this.browser?.close(); } catch {}
    this.browser = null;
    this.context = null;
    this.page = null;
    this.state = 'DISCONNECTED';
    this.connectedAt = '';
    this.lastActivity = nowIso();
  },

  async browserPage() {
    if (this.browser?.isConnected() && this.context && this.page && !this.page.isClosed()) return this.page;
    await this.close().catch(() => {});
    this.browser = await chromium.launch({ headless:true, args:['--disable-dev-shm-usage'] });
    this.context = await this.browser.newContext({ locale:'es-CR', timezoneId:'America/Costa_Rica' });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(15_000);
    this.browser.on('disconnected', () => {
      this.browser = null;
      this.context = null;
      this.page = null;
      this.state = 'DISCONNECTED';
      this.lastActivity = nowIso();
    });
    return this.page;
  },

  async formReady(p) {
    return p.evaluate(() => ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id => !!document.getElementById(id))).catch(() => false);
  },

  async authState(p) {
    return p.evaluate(() => {
      const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
      const password = Array.from(document.querySelectorAll('input[type="password"]')).some(visible);
      const form = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id => !!document.getElementById(id));
      const report = !!document.getElementById('P1_PRO_ID') && !!document.getElementById('P1_EVE_ID') &&
        !!document.querySelector('select[id$="_row_select"]');
      const flow = String(document.querySelector('input[name="p_flow_id"]')?.value || '').trim();
      const step = String(document.querySelector('input[name="p_flow_step_id"]')?.value || '').trim();
      const apexHome = flow === '500' && step === '1';
      const path = decodeURIComponent(location.pathname || '').toLowerCase();
      const route = path.includes('/prospectacion-reclutador/') || (path.includes('/prospectaci') && path.includes('reclutador'));
      return { password, form, report, apexHome, route, authenticated:!password && (form || report || apexHome || route) };
    }).catch(() => ({ password:false, form:false, report:false, apexHome:false, route:false, authenticated:false }));
  },

  async login(p) {
    if (!CONAPE_USER || !CONAPE_PASSWORD) throw new AppError('CONAPE_CREDENTIALS_MISSING', 'Credenciales CONAPE no configuradas.', 503, 'FORM');
    let state = await this.authState(p);
    if (state.authenticated && await readApexSession(p)) return state;
    await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
    state = await this.authState(p);
    if (state.authenticated && await readApexSession(p)) return state;
    const pass = p.locator('input[type="password"]:visible').first();
    if (!(await pass.count())) throw new AppError('CONAPE_LOGIN_FORM_NOT_FOUND', 'No se encontró el acceso de CONAPE.', 503, 'FORM');
    let user = p.getByLabel(/usuario|c[eé]dula|identificaci[oó]n|user/i).first();
    if (!(await user.count())) user = p.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])').first();
    if (!(await user.count())) throw new AppError('CONAPE_LOGIN_USER_NOT_FOUND', 'No se encontró el usuario de CONAPE.', 503, 'FORM');
    await user.fill(CONAPE_USER);
    await pass.fill(CONAPE_PASSWORD);
    const login = p.getByRole('button', { name:/ingresar|iniciar sesi[oó]n|entrar|acceder|login|sign in/i }).first();
    if (await login.count()) await login.click(); else await pass.press('Enter');
    const until = Date.now() + 30_000;
    while (Date.now() < until) {
      await sleep(300);
      state = await this.authState(p);
      if (state.authenticated && await readApexSession(p)) return state;
    }
    throw new AppError('CONAPE_LOGIN_FAILED', 'CONAPE no confirmó la sesión.', 503, 'FORM');
  },

  async connect() {
    const p = await this.browserPage();
    const s = await this.login(p);
    this.state = 'CONNECTED';
    this.connectedAt = this.connectedAt || nowIso();
    this.lastActivity = nowIso();
    this.generation += 1;
    return this.snapshot({ ready:s.report ? 'REPORT' : (s.form ? 'PROSPECTO' : 'HOME') });
  },

  async status() {
    if (!this.page || this.page.isClosed()) {
      this.state = 'DISCONNECTED';
      return this.snapshot({ ready:null });
    }
    const state = await this.authState(this.page);
    if (!state.authenticated || !(await readApexSession(this.page))) {
      this.state = 'DISCONNECTED';
      return this.snapshot({ ready:null });
    }
    this.state = 'CONNECTED';
    this.lastActivity = nowIso();
    return this.snapshot({ ready:state.report ? 'REPORT' : (state.form ? 'PROSPECTO' : 'HOME') });
  },

  async freshProspectoFromHome() {
    let p = await this.browserPage();
    await this.login(p);
    let sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'FORM');

    const finish = async (entryPath, recruitClickFound) => {
      sessionId = (await readApexSession(p)) || sessionId;
      const nav = await readSignedNavigationTelemetry(p);
      const meta = { sessionId, navMode:entryPath, entryPath, recruitClickFound, ...nav };
      console.log(JSON.stringify({ event:'conape_prospecto_context', version:VERSION, gate:false, entry_path:entryPath, recruit_click_found:recruitClickFound, ...nav, pii:false }));
      this.state = 'CONNECTED';
      this.lastActivity = nowIso();
      return { p, meta };
    };

    // Camino principal: entrar al módulo mediante su enlace real para conservar
    // cualquier contexto firmado por APEX antes de buscar Reclutar Prospectos.
    await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    await waitForApexDynamicAction(p);
    const modulePagesBefore = new Set(p.context().pages());
    const moduleNav = await clickProspectacionModuleLink(p);
    // CONAPE/APEX puede abrir el módulo en otra pestaña; seguir la página
    // REAL donde terminó la navegación, no el Home anterior.
    await sleep(250);
    const modulePopup = p.context().pages().find(page => !modulePagesBefore.has(page) && !page.isClosed());
    if (modulePopup) {
      p = modulePopup;
      this.page = p;
      p.setDefaultTimeout(15_000);
      await p.waitForLoadState('domcontentloaded', { timeout:10_000 }).catch(() => {});
    }
    sessionId = (await readApexSession(p)) || sessionId;
    console.log(JSON.stringify({
      event:'conape_module_navigation',
      version:VERSION,
      found:moduleNav.found === true,
      clicked:moduleNav.clicked === true,
      signed_eve:moduleNav.signed_eve === true,
      signed_pro:moduleNav.signed_pro === true,
      has_cs:moduleNav.has_cs === true,
      pii:false,
    }));

    let clicked = false;
    const recruitPagesBefore = new Set(p.context().pages());
    try {
      p.__conapeLabelSearchTimeoutMs = 6_000;
      clicked = await clickVisibleByLabel(p, /(^| )RECLUTAR( |$)/i);
    } finally {
      delete p.__conapeLabelSearchTimeoutMs;
    }
    if (clicked) {
      await sleep(250);
      const recruitPopup = p.context().pages().find(page => !recruitPagesBefore.has(page) && !page.isClosed());
      if (recruitPopup) {
        p = recruitPopup;
        this.page = p;
        p.setDefaultTimeout(15_000);
        await p.waitForLoadState('domcontentloaded', { timeout:10_000 }).catch(() => {});
      }
      const until = Date.now() + 10_000;
      while (Date.now() < until) {
        if (await this.formReady(p)) return finish(recruitPopup ? 'RECRUIT_POPUP' : 'HOME_CLICK_RECRUIT', true);
        await sleep(250);
      }
    }

    // El clic del menú puede completarse sin montar el formulario (caso real
    // CONAPE_FORM_NOT_READY). Es NAVEGACIÓN, nunca reintento de CREATE:
    // abrir la URL canónica en la misma sesión y esperar sus campos reales.
    console.log(JSON.stringify({
      event:'conape_recruit_navigation_fallback', version:VERSION,
      reason:clicked ? 'CLICK_WITHOUT_FORM' : 'BUTTON_NOT_FOUND',
      popup_seen:p.context().pages().length > 1,
      pii:false,
    }));
    sessionId = (await readApexSession(p)) || sessionId;
    await p.goto(urlWithSession(CONAPE_FRIENDLY_PROSPECTO, sessionId), {
      waitUntil:'domcontentloaded', timeout:30_000,
    });
    await waitForApexDynamicAction(p);
    const until = Date.now() + 12_000;
    while (Date.now() < until) {
      if (await this.formReady(p)) return finish('DIRECT_URL_FALLBACK', clicked);
      await sleep(250);
    }
    const homeState = await this.authState(p);
    console.log(JSON.stringify({
      event:'conape_recruit_navigation_failed', version:VERSION,
      clicked, auth:homeState.authenticated === true,
      password_visible:homeState.password === true,
      frame_count:p.frames().length,
      pii:false,
    }));
    throw new AppError('CONAPE_FORM_NOT_READY',
      'CONAPE no dejó listo el formulario de Reclutar Prospectos.', 503, 'FORM');
  },
};

async function runNavSelftest() {
  const result = { ok:true, login:'FAIL', home:'FAIL', recruit_click:'FAIL', form_ready:'FAIL' };
  let browser;
  let context;
  try {
    browser = await chromium.launch({ headless:true, args:['--disable-dev-shm-usage'] });
    context = await browser.newContext({ locale:'es-CR', timezoneId:'America/Costa_Rica' });
    const p = await context.newPage();
    p.setDefaultTimeout(15_000);
    const s = await ConapeSession.login(p);
    result.login = s?.authenticated ? 'PASS' : 'FAIL';
    const sessionId = await readApexSession(p);
    if (sessionId) {
      await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
      result.home = 'PASS';
      await p.goto(urlWithSession(CONAPE_FRIENDLY_PROSPECTO, sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
      result.recruit_click = 'PASS';
      result.form_ready = await ConapeSession.formReady(p) ? 'PASS' : 'FAIL';
    }
    return result;
  } finally {
    try { await context?.close(); } catch {}
    try { await browser?.close(); } catch {}
  }
}

async function nativeSetValue(p, id, value) {
  return p.evaluate(({ id, value }) => {
    const el = document.getElementById(id);
    if (!el) return false;
    const proto = Object.getPrototypeOf(el);
    const desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc?.set) desc.set.call(el, value); else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
    el.focus();
    el.blur();
    return true;
  }, { id, value });
}

async function readFormState(p) {
  return p.evaluate(() => {
    const val = id => String(document.getElementById(id)?.value || '').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const safeToken = v => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(String(v || '')) ? String(v) : '';
    const alerts = Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
    const alertRawText = alerts.map(n => n.textContent || '').join(' ');
    const text = norm(alertRawText);
    const alertTextSanitized = String(alertRawText || '')
      .replace(/\S*@\S*/g, '[MAIL]')
      .replace(/\d{5,}/g, '[NUM]')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0,200);
    const categories = [];
    if (/YA FUE REGISTRAD|YA SE ENCUENTRA|YA EXIST|DUPLIC|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(text)) categories.push('YA_REGISTRADO');
    if (/OBLIGATOR|REQUERID|DEBE INGRESAR|DEBE COMPLETAR/.test(text)) categories.push('CAMPO_OBLIGATORIO');
    if (/INVALID|NO ES VALIDO|FORMATO|NO CORRESPONDE/.test(text)) categories.push('DATO_INVALIDO');
    if (/NO AUTORIZAD|SIN PERMISO|NO TIENE ACCESO/.test(text)) categories.push('SIN_PERMISO');
    if (!categories.length && /ERROR|NO SE PUDO|NO FUE POSIBLE/.test(text)) categories.push('ERROR_DE_PORTAL');
    if (!categories.length && text) categories.push('ALERTA_NO_CLASIFICADA');
    const alertDomIds = [...new Set(alerts.flatMap(node => {
      const tokens = [];
      const id = safeToken(node.id);
      if (id) tokens.push(`id:${id}`);
      for (const className of Array.from(node.classList || [])) {
        const cls = safeToken(className);
        if (cls) tokens.push(`class:${cls}`);
      }
      return tokens;
    }))].slice(0,40);
    const apexErrorItemIds = [...new Set(Array.from(document.querySelectorAll('.apex-page-item-error')).map(node => safeToken(node.id)).filter(Boolean))].slice(0,40);
    return {
      cedula:val('P2_PRS_CEDULA'), apellido_1:val('P2_PRS_APELLIDO_1'), apellido_2:val('P2_PRS_APELLIDO_2'), nombre:val('P2_PRS_NOMBRE'),
      telefono:val('P2_PRS_CELULAR'), correo:val('P2_PRS_EMAIL'), categories,
      alert_dom_ids:alertDomIds, apex_error_item_ids:apexErrorItemIds, alert_text_sanitized:alertTextSanitized,
      success_signal:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text) && !/ERROR|INVALID/.test(text),
      form_reset:!val('P2_PRS_CEDULA'),
    };
  });
}

async function lookupCedulaOnPage(p, cedula) {
  if (!(await nativeSetValue(p, 'P2_PRS_CEDULA', cedula))) throw new AppError('CEDULA_LOOKUP_START_FAILED', 'No se pudo iniciar la consulta por cédula.', 409, 'LOOKUP');
  const until = Date.now() + 12_000;
  let state = await readFormState(p);
  while (Date.now() < until && !(state.apellido_1 && state.nombre) && !state.categories.length) {
    await sleep(300);
    state = await readFormState(p);
  }
  if (state.categories.includes('YA_REGISTRADO')) throw Object.assign(new AppError('YA_REGISTRADO', 'CONAPE indica que la cédula ya fue registrada.', 409, 'LOOKUP'), { conape_state:state });
  if (!(state.apellido_1 && state.nombre)) {
    const code = state.categories[0] || 'IDENTITY_LOOKUP_FAILED';
    throw Object.assign(new AppError(code, 'CONAPE no devolvió la identidad para esta cédula.', 422, 'LOOKUP'), { conape_state:state });
  }
  return state;
}

async function lookupCedulaOnFreshPage(cedula) {
  const { p, meta } = await ConapeSession.freshProspectoFromHome();
  const state = await lookupCedulaOnPage(p, cedula);
  return { p, state, meta };
}

async function readFormMode(p) {
  return p.evaluate(() => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const controls = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
    const labels = controls.map(el => norm([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' ')));
    const hasCreate = labels.some(label => label.includes('CREAR NUEVO PROSPECTO'));
    const hasUpdate = labels.some(label => label.includes('APLICAR CAMBIOS'));
    const mode = hasCreate ? 'CREATE' : (hasUpdate ? 'UPDATE' : 'UNKNOWN');
    const ids = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
    const fields = ids.map(id => {
      const el = document.getElementById(id);
      const ariaReadonly = String(el?.getAttribute?.('aria-readonly') || '').toLowerCase() === 'true';
      const ariaDisabled = String(el?.getAttribute?.('aria-disabled') || '').toLowerCase() === 'true';
      const readonly = !!el && (el.readOnly === true || el.hasAttribute?.('readonly') || ariaReadonly);
      const disabled = !!el && (el.disabled === true || ariaDisabled);
      const editable = !!el && !readonly && !disabled;
      return { id, present:!!el, readonly, disabled, editable };
    });
    return { mode, has_create:hasCreate, has_update:hasUpdate, fields };
  }).catch(() => ({ mode:'UNKNOWN', has_create:false, has_update:false, fields:[] }));
}

function safeFormFields(fields) {
  return Array.isArray(fields) ? fields.map(field => ({
    id:safeId(field?.id), present:field?.present === true, readonly:field?.readonly === true, disabled:field?.disabled === true, editable:field?.editable === true,
  })).filter(field => !!field.id) : [];
}

function enforceRecruitFormMode(modeInfo, comparison, plan) {
  const mode = txt(modeInfo?.mode || 'UNKNOWN');
  const safeFields = safeFormFields(modeInfo?.fields);
  if (mode === 'CREATE') return { mode, fields:safeFields };
  if (mode === 'UPDATE') {
    const error = new AppError('ALREADY_RECRUITED', 'CONAPE ya tiene este prospecto reclutado.', 409, 'LOOKUP');
    error.comparison = comparison;
    error.form_mode = 'UPDATE';
    error.form_readonly_fields = safeFields;
    error.apply_changes_available = true;
    error.phone_update_available = plan?.update_telefono === true;
    throw error;
  }
  const error = new AppError('FORM_MODE_UNKNOWN', 'CONAPE no expuso una acción reconocible para este prospecto.', 409, 'LOOKUP');
  error.comparison = comparison;
  error.form_mode = 'UNKNOWN';
  error.form_readonly_fields = safeFields;
  throw error;
}

function deriveCampusIdentity(campus, conape) {
  const full = txt(first(campus, ['nombre','NOMBRE','nombre_completo','NOMBRE_COMPLETO']));
  const apellido1 = txt(first(campus, ['apellido_1','primer_apellido','APELLIDO_1','PRIMER_APELLIDO']));
  const apellido2 = txt(first(campus, ['apellido_2','segundo_apellido','APELLIDO_2','SEGUNDO_APELLIDO']));
  const given = txt(first(campus, ['nombres','NOMBRES','nombre_persona','NOMBRE_PERSONA']));
  if (apellido1 || apellido2 || given) return { apellido_1:apellido1, apellido_2:apellido2, nombre:given || full, full };
  const a = [conape.apellido_1, conape.apellido_2, conape.nombre].filter(Boolean).join(' ');
  const b = [conape.nombre, conape.apellido_1, conape.apellido_2].filter(Boolean).join(' ');
  if (full && (upper(full) === upper(a) || upper(full) === upper(b))) return { apellido_1:conape.apellido_1, apellido_2:conape.apellido_2, nombre:conape.nombre, full };
  return { apellido_1:'', apellido_2:'', nombre:full, full };
}

function compareValue(a, b, normalizer = upper) {
  const av = normalizer(a), bv = normalizer(b);
  if (!av && !bv) return 'vacio';
  if (!av || !bv) return 'falta';
  return av === bv ? 'igual' : 'diferente';
}

function contactPlan(campus, conape) {
  const phone = campusPhone(campus);
  if (phone.length !== 8) throw new AppError('CONTACT_VALIDATION_FAILED', 'El WhatsApp del Campus debe tener 8 dígitos.', 422, 'CONTACTS');
  const campusMail = campusEmail(campus);
  const conapeMail = email(conape.correo);
  const plan = {
    telefono:phone,
    correo:conapeMail || campusMail,
    update_telefono:true,
    update_correo:!conapeMail && !!campusMail,
  };
  if (!validEmail(plan.correo)) throw new AppError('CONTACT_VALIDATION_FAILED', 'No hay un correo válido para crear el prospecto.', 422, 'CONTACTS');
  return plan;
}

function buildComparison(campus, conape, plan) {
  const identity = deriveCampusIdentity(campus, conape);
  const campusData = { cedula:campusCedula(campus), apellido_1:identity.apellido_1, apellido_2:identity.apellido_2, nombre:identity.nombre, telefono:campusPhone(campus), correo:campusEmail(campus) };
  const conapeData = { cedula:digits(conape.cedula), apellido_1:txt(conape.apellido_1), apellido_2:txt(conape.apellido_2), nombre:txt(conape.nombre), telefono:digits(conape.telefono).slice(-8), correo:email(conape.correo) };
  return {
    campus:campusData, conape:conapeData,
    rows:[
      { key:'cedula', label:'Cédula', campus:campusData.cedula, conape:conapeData.cedula, final:conapeData.cedula || campusData.cedula, state:compareValue(campusData.cedula, conapeData.cedula, digits), rule:'Coincidencia por cédula' },
      { key:'apellido_1', label:'Primer Apellido', campus:campusData.apellido_1, conape:conapeData.apellido_1, final:conapeData.apellido_1, state:compareValue(campusData.apellido_1, conapeData.apellido_1), rule:'CONAPE manda · no se escribe identidad' },
      { key:'apellido_2', label:'Segundo Apellido', campus:campusData.apellido_2, conape:conapeData.apellido_2, final:conapeData.apellido_2, state:compareValue(campusData.apellido_2, conapeData.apellido_2), rule:'CONAPE manda · no se escribe identidad' },
      { key:'nombre', label:'Nombre', campus:campusData.nombre, conape:conapeData.nombre, final:conapeData.nombre, state:compareValue(campusData.nombre, conapeData.nombre), rule:'CONAPE manda · no se escribe identidad' },
      { key:'telefono', label:'Teléfono', campus:campusData.telefono, conape:conapeData.telefono, final:plan.telefono, state:compareValue(campusData.telefono, conapeData.telefono, digits), rule:'WhatsApp Campus normalizado a 8 dígitos' },
      { key:'correo', label:'Correo', campus:campusData.correo, conape:conapeData.correo, final:plan.correo, state:compareValue(campusData.correo, conapeData.correo, email), rule:conapeData.correo ? 'Conservar correo CONAPE' : 'Completar desde Campus' },
    ],
    final:{ telefono:plan.telefono, correo:plan.correo, update_telefono:plan.update_telefono, update_correo:plan.update_correo },
  };
}

function assertIdentityMatch(comparison) {
  for (const key of ['cedula','apellido_1','apellido_2','nombre']) {
    const row = comparison.rows.find(item => item.key === key);
    if (!row || row.state !== 'igual') {
      const error = new AppError('IDENTITY_MISMATCH', 'La identidad de CONAPE no coincide con el prospecto del Campus.', 409, 'BEFORE_CREATE');
      error.comparison = comparison;
      throw error;
    }
  }
}

async function waitForApexDynamicAction(p) {
  const idle = await p.waitForFunction(() => {
    try {
      const jq = window.apex?.jQuery;
      return !jq || Number(jq.active || 0) === 0;
    } catch { return true; }
  }, null, { timeout:5_000 }).then(() => true).catch(() => false);
  await sleep(200);
  return idle;
}

async function readContactFieldState(p, id) {
  return p.evaluate(fieldId => {
    const el = document.getElementById(fieldId);
    let apexValue = '';
    let apexReadable = false;
    try {
      const item = window.apex?.item?.(fieldId);
      if (item && typeof item.getValue === 'function') {
        apexReadable = true;
        apexValue = String(item.getValue() ?? '');
      }
    } catch {}
    return { domValue:String(el?.value ?? ''), apexValue, apexReadable };
  }, id).catch(() => ({ domValue:'', apexValue:'', apexReadable:false }));
}

function normalizeContactField(id, value) {
  return id === 'P2_PRS_CELULAR' ? digits(value).slice(-8) : email(value);
}

async function readFieldEditability(p, id) {
  return p.evaluate(fieldId => {
    const el = document.getElementById(fieldId);
    if (!el) return { present:false, readonly:false, disabled:false, editable:false };
    const ariaReadonly = String(el.getAttribute('aria-readonly') || '').toLowerCase() === 'true';
    const ariaDisabled = String(el.getAttribute('aria-disabled') || '').toLowerCase() === 'true';
    const readonly = el.readOnly === true || el.hasAttribute('readonly') || ariaReadonly;
    const disabled = el.disabled === true || ariaDisabled;
    return { present:true, readonly, disabled, editable:!readonly && !disabled };
  }, id).catch(() => ({ present:false, readonly:false, disabled:false, editable:false }));
}

async function writeContactField(p, id, value) {
  const target = txt(value);
  const targetNorm = normalizeContactField(id, target);
  const locator = p.locator(`#${id}`).first();
  const editability = await readFieldEditability(p, id);
  let method = id === 'P2_PRS_CELULAR' ? 'KEYBOARD' : 'FILL';
  let attempted = false;
  let readback = await readContactFieldState(p, id);

  if (!editability.editable) {
    return {
      field:id, attempted:false, verified:false, method:'SKIP', skipped_reason:'READONLY',
      target_len:target.length, readback_len:String(readback.domValue || '').length,
      match:false, apex_readable:readback.apexReadable === true, editable:false,
    };
  }

  try {
    if (!(await locator.count())) throw new Error('FIELD_NOT_FOUND');
    attempted = true;
    if (id === 'P2_PRS_CELULAR') {
      await locator.click({ timeout:5_000 });
      await locator.press('Control+A', { timeout:5_000 });
      await locator.press('Delete', { timeout:5_000 });
      await locator.type(target, { delay:30, timeout:5_000 });
      await locator.press('Tab', { timeout:5_000 });
    } else {
      await locator.fill('', { timeout:5_000 });
      await locator.fill(target, { timeout:5_000 });
      await locator.blur({ timeout:5_000 });
    }
    await waitForApexDynamicAction(p);
    readback = await readContactFieldState(p, id);
  } catch {}

  let match = readback.apexReadable === true
    && normalizeContactField(id, readback.domValue) === targetNorm
    && normalizeContactField(id, readback.apexValue) === targetNorm;
  if (!match) {
    method = 'APEX_SETVALUE_CHANGE';
    const apexSet = await p.evaluate(({ fieldId, fieldValue }) => {
      try {
        const item = window.apex?.item?.(fieldId);
        if (!item || typeof item.setValue !== 'function') return false;
        item.setValue(fieldValue);
        return true;
      } catch { return false; }
    }, { fieldId:id, fieldValue:target }).catch(() => false);
    if (apexSet) {
      attempted = true;
      await waitForApexDynamicAction(p);
      readback = await readContactFieldState(p, id);
      match = readback.apexReadable === true
        && normalizeContactField(id, readback.domValue) === targetNorm
        && normalizeContactField(id, readback.apexValue) === targetNorm;
    }
  }

  const result = {
    field:id, attempted, verified:match, method, target_len:target.length,
    readback_len:String(readback.domValue || '').length, match,
    apex_readable:readback.apexReadable === true, editable:true,
  };
  if (!match) {
    const error = new AppError('CONTACT_WRITE_FAILED', 'CONAPE no confirmó la escritura del contacto en APEX.', 422, 'FILL');
    error.fill_telemetry = {
      attempted_fields:attempted ? [id] : [], verified_fields:[], methods:[method], skipped_fields:[],
      field_apex_readable:{ [id]:readback.apexReadable === true },
      fill_target_len:result.target_len, fill_readback_len:result.readback_len, fill_match:false,
    };
    throw error;
  }
  return result;
}

async function fillContacts(p, plan) {
  const results = [];
  try {
    results.push(await writeContactField(p, 'P2_PRS_CELULAR', plan.telefono));
    if (plan.update_correo) results.push(await writeContactField(p, 'P2_PRS_EMAIL', plan.correo));
  } catch (error) {
    const prior = results;
    const failure = error?.fill_telemetry || {};
    error.fill_telemetry = {
      attempted_fields:[...prior.filter(r => r.attempted).map(r => r.field), ...(failure.attempted_fields || [])],
      verified_fields:[...prior.filter(r => r.verified).map(r => r.field), ...(failure.verified_fields || [])],
      methods:[...prior.map(r => r.method), ...(failure.methods || [])],
      skipped_fields:[...prior.filter(r => r.skipped_reason).map(r => ({ field:r.field, reason:r.skipped_reason })), ...(failure.skipped_fields || [])],
      field_apex_readable:{ ...Object.fromEntries(prior.map(r => [r.field, r.apex_readable === true])), ...(failure.field_apex_readable || {}) },
      fill_target_len:failure.fill_target_len ?? prior.at(-1)?.target_len ?? null,
      fill_readback_len:failure.fill_readback_len ?? prior.at(-1)?.readback_len ?? null,
      fill_match:failure.fill_match ?? prior.at(-1)?.match ?? null,
    };
    throw error;
  }
  const state = await readFormState(p);
  const last = results.at(-1) || null;
  return {
    state,
    telemetry:{
      attempted_fields:results.filter(r => r.attempted).map(r => r.field),
      verified_fields:results.filter(r => r.verified).map(r => r.field),
      methods:results.map(r => r.method),
      skipped_fields:results.filter(r => r.skipped_reason).map(r => ({ field:r.field, reason:r.skipped_reason })),
      field_apex_readable:Object.fromEntries(results.map(r => [r.field, r.apex_readable === true])),
      fill_target_len:last?.target_len ?? null,
      fill_readback_len:last?.readback_len ?? null,
      fill_match:last?.match ?? null,
    },
  };
}

async function readEventContextState(p) {
  return p.evaluate(() => {
    const read = id => {
      try {
        const item = window.apex?.item?.(id);
        if (!item || typeof item.getValue !== 'function') return { readable:false, present:false };
        return { readable:true, present:String(item.getValue() ?? '').trim() !== '' };
      } catch {
        return { readable:false, present:false };
      }
    };
    return { eve:read('P2_EVE_ID'), pro:read('P2_PRO_ID') };
  }).catch(() => ({ eve:{ readable:false, present:false }, pro:{ readable:false, present:false } }));
}

async function observeEventContext(p) {
  const state = await readEventContextState(p);
  const telemetry = {
    eve_id_source:state.eve.present ? 'PAGE' : 'NONE',
    eve_id_present:state.eve.present === true,
    pro_id_source:state.pro.present ? 'PAGE' : 'NONE',
    pro_id_present:state.pro.present === true,
  };
  console.log(JSON.stringify({ event:'conape_event_context', version:VERSION, ...telemetry, pii:false }));
  return telemetry;
}

async function assertPreCreateFields(p) {
  const required = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
  const gate = await p.evaluate(ids => {
    const missing = [];
    const unreadable = [];
    for (const id of ids) {
      try {
        const item = window.apex?.item?.(id);
        if (!item || typeof item.getValue !== 'function') {
          unreadable.push(id);
          continue;
        }
        if (!String(item.getValue() ?? '').trim()) missing.push(id);
      } catch {
        unreadable.push(id);
      }
    }
    return { missing, unreadable };
  }, required).catch(() => ({ missing:required.slice(), unreadable:required.slice() }));

  const phoneMissing = gate.missing.includes('P2_PRS_CELULAR');
  const phoneUnreadable = gate.unreadable.includes('P2_PRS_CELULAR');
  if (phoneMissing || phoneUnreadable) {
    const error = new AppError('CONTACT_WRITE_FAILED', 'CONAPE no confirmó el teléfono en el estado interno de APEX.', 422, 'FILL');
    error.empty_field_ids = phoneMissing ? ['P2_PRS_CELULAR'] : [];
    error.fill_telemetry = {
      attempted_fields:[], verified_fields:[], methods:['PRECLICK_APEX_GATE'], skipped_fields:[],
      field_apex_readable:{ P2_PRS_CELULAR:!phoneUnreadable },
      fill_target_len:null, fill_readback_len:null, fill_match:false,
    };
    throw error;
  }

  const missing = [...new Set([...gate.missing, ...gate.unreadable])];
  if (missing.length) {
    const error = new AppError('FORM_INCOMPLETE_BEFORE_CREATE', 'El formulario quedó incompleto en APEX antes de la acción final.', 422, 'BEFORE_CREATE');
    error.empty_field_ids = missing;
    throw error;
  }
  return [];
}

async function collectPageItemIds(p) {
  return p.evaluate(() => Array.from(document.querySelectorAll('[id]')).map(el => String(el.id || '')).filter(id => /^P[0-9]_/.test(id) && /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(id)).slice(0,120)).catch(() => []);
}

async function collectPreActionTelemetry(p) {
  return p.evaluate(() => {
    const safe = value => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(String(value || '')) ? String(value) : '';
    const controls = Array.from(document.querySelectorAll('input[id^="P2_PRS_"],select[id^="P2_PRS_"],textarea[id^="P2_PRS_"]'));
    const precreate_apex_values = {};
    const precreate_dom_values = {};
    const field_editable = {};
    const apex_readable = {};
    for (const el of controls) {
      const id = safe(el.id);
      if (!id) continue;
      const ariaReadonly = String(el.getAttribute('aria-readonly') || '').toLowerCase() === 'true';
      const ariaDisabled = String(el.getAttribute('aria-disabled') || '').toLowerCase() === 'true';
      const readonly = el.readOnly === true || el.hasAttribute('readonly') || ariaReadonly;
      const disabled = el.disabled === true || ariaDisabled;
      field_editable[id] = !readonly && !disabled;
      precreate_dom_values[id] = String(el.value ?? '').trim() !== '';
      let apexValue = '';
      let readable = false;
      try {
        const item = window.apex?.item?.(id);
        if (item && typeof item.getValue === 'function') {
          readable = true;
          apexValue = String(item.getValue() ?? '');
        }
      } catch {}
      apex_readable[id] = readable;
      precreate_apex_values[id] = apexValue.trim() !== '';
    }
    return { precreate_apex_values, precreate_dom_values, field_editable, apex_readable };
  }).catch(() => ({ precreate_apex_values:{}, precreate_dom_values:{}, field_editable:{}, apex_readable:{} }));
}

async function clickFinalAction(p, formMode) {
  const eventContext = await observeEventContext(p);
  const preaction = await collectPreActionTelemetry(p);
  try {
    await assertPreCreateFields(p);
  } catch (error) {
    error.event_context_telemetry = eventContext;
    error.preaction_telemetry = preaction;
    throw error;
  }
  const page_item_ids = await collectPageItemIds(p);
  const before = await readFormState(p);
  const actionRequests = [];
  const onRequest = req => {
    try {
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const raw = String(req.postData() || '');
      actionRequests.push({ body_keys:safeBodyKeys(raw), request_token:safeRequestToken(raw), status:null });
    } catch {}
  };
  const onResponse = response => {
    try {
      const req = response.request();
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const hit = actionRequests.find(item => item.status == null);
      if (hit) hit.status = response.status();
    } catch {}
  };
  p.on('request', onRequest);
  p.on('response', onResponse);
  try {
    const mode = txt(formMode);
    const label = mode === 'CREATE' ? /CREAR NUEVO PROSPECTO/i : (mode === 'UPDATE' ? /APLICAR CAMBIOS/i : null);
    if (!label) throw new AppError('FORM_MODE_UNKNOWN', 'CONAPE no expuso una acción reconocible para este prospecto.', 409, 'LOOKUP');
    if (!(await clickVisibleByLabel(p, label))) throw new AppError('FINAL_ACTION_BUTTON_NOT_FOUND', 'CONAPE no mostró el botón final esperado.', 409, 'ACTION');
    const until = Date.now() + 10_000;
    let state = await readFormState(p);
    while (Date.now() < until) {
      if (actionRequests.length && (actionRequests[0].status != null || state.categories.length || state.success_signal || state.form_reset)) break;
      await sleep(250);
      state = await readFormState(p);
    }
    return {
      actionCount:actionRequests.length,
      createCount:mode === 'CREATE' ? actionRequests.length : 0,
      updateCount:mode === 'UPDATE' ? actionRequests.length : 0,
      final_action:mode,
      outcome:state,
      request:actionRequests[0] || null,
      page_item_ids,
      alerts_before:before.categories || [],
      event_context_telemetry:eventContext,
      ...preaction,
    };
  } finally {
    p.off('request', onRequest);
    p.off('response', onResponse);
  }
}

async function countIrFilters(p) {
  return p.evaluate(() => {
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const selectors = ['.a-IRR-controls-item--filter','.a-IRR-controls-item[data-filter]','.a-IRR-controls .a-IRR-controls-item'];
    const nodes = new Set();
    for (const selector of selectors) for (const el of document.querySelectorAll(selector)) if (visible(el)) nodes.add(el);
    return nodes.size;
  }).catch(() => 0);
}

async function resetInteractiveReport(p) {
  const ir_filters_before = await countIrFilters(p);
  let ir_reset_method = 'NONE';
  const actions = p.getByRole('button', { name:/actions|acciones/i }).first();
  if (await actions.count()) {
    try {
      await actions.click({ timeout:5_000 });
      await sleep(120);
      const report = p.getByRole('menuitem', { name:/^report$|^informe$/i }).first();
      if (await report.count()) {
        await report.click({ timeout:5_000 });
        await sleep(120);
      }
      const reset = p.getByRole('menuitem', { name:/reset|restablecer|reiniciar/i }).first();
      if (await reset.count()) {
        await reset.click({ timeout:5_000 });
        await waitForApexDynamicAction(p);
        await sleep(120);
        if ((await countIrFilters(p)) === 0) ir_reset_method = 'ACTIONS_RESET';
      }
    } catch {}
  }
  if (ir_reset_method === 'NONE' && ir_filters_before > 0) {
    const closeButtons = p.locator('.a-IRR-controls-item--filter button:visible,.a-IRR-controls-item[data-filter] button:visible,.a-IRR-controls button.a-Button--noLabel:visible,[aria-label*="Remove filter" i]:visible,[title*="Remove filter" i]:visible');
    let closed = 0;
    for (let guard = 0; guard < 100; guard += 1) {
      const count = await closeButtons.count().catch(() => 0);
      if (!count) break;
      let clicked = false;
      for (let i = 0; i < count; i += 1) {
        try {
          await closeButtons.nth(i).click({ timeout:2_000 });
          closed += 1;
          clicked = true;
          await waitForApexDynamicAction(p);
          break;
        } catch {}
      }
      if (!clicked) break;
    }
    if (closed > 0) ir_reset_method = 'CHIP_CLOSE';
  }
  return { ir_filters_before, ir_reset_method };
}

async function findCedulaInCurrentProspectPage(p, cedula) {
  const snapshot = await readProspectListPage(p);
  if (!snapshot.ok) return { found:false, estado:'', rows:0, schema_ok:false };
  const rows = snapshot.rows.map(row => ({ ...row, cedula:digits(row.cedula) })).filter(row => !!row.cedula);
  const hit = rows.find(row => row.cedula === cedula);
  return { found:!!hit, estado:txt(hit?.estado || ''), rows:rows.length, schema_ok:true };
}

async function scanProspectPagesForCedula(p, cedula) {
  await maximizeProspectRows(p);
  let pages_scanned = 0;
  let rows_scanned = 0;
  const pageFingerprints = new Set();
  for (let guard = 0; guard < 100; guard += 1) {
    const snapshot = await readProspectListPage(p);
    if (!snapshot.ok) return { found:false, estado:'', pages_scanned, rows_scanned, complete:false };
    const rows = snapshot.rows.map(row => ({ ...row, cedula:digits(row.cedula) })).filter(row => !!row.cedula);
    const fingerprint = sha(rows.map(row => row.cedula).join('|'));
    if (pageFingerprints.has(fingerprint)) break;
    pageFingerprints.add(fingerprint);
    pages_scanned += 1;
    rows_scanned += rows.length;
    const hit = rows.find(row => row.cedula === cedula);
    if (hit) return { found:true, estado:txt(hit.estado || ''), pages_scanned, rows_scanned, complete:true };
    const moved = await clickProspectNextPage(p);
    if (!moved) return { found:false, estado:'', pages_scanned, rows_scanned, complete:true };
    const until = Date.now() + 10_000;
    let changed = false;
    while (Date.now() < until) {
      await sleep(200);
      const next = await readProspectListPage(p);
      if (!next.ok) continue;
      const nextFingerprint = sha(next.rows.map(row => digits(row.cedula)).filter(Boolean).join('|'));
      if (nextFingerprint !== fingerprint) { changed = true; break; }
    }
    if (!changed) return { found:false, estado:'', pages_scanned, rows_scanned, complete:false };
  }
  return { found:false, estado:'', pages_scanned, rows_scanned, complete:false };
}

function confirmationResetUrl(sessionId) {
  const u = new URL(CONAPE_HOME);
  const cleanSession = digits(sessionId);
  u.search = `?p=302:1:${cleanSession}:::RIR:`;
  return u.href;
}

async function readConfirmationProspectPage(p) {
  return p.evaluate(() => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    const text = v => String(v || '').replace(/\s+/g,' ').trim();
    let best = null;
    for (const table of Array.from(document.querySelectorAll('table'))) {
      let headerNodes = Array.from(table.querySelectorAll('thead th,thead td'));
      if (!headerNodes.length) headerNodes = Array.from(table.querySelectorAll('tr:first-child th,tr:first-child td'));
      const headers = headerNodes.map(node => norm(node.textContent));
      const cedulaIndex = headers.findIndex(h => h === 'CEDULA' || h.includes('CEDULA'));
      if (cedulaIndex < 0) continue;
      const estadoIndex = headers.findIndex(h => h === 'ESTADO');
      const rowCount = table.querySelectorAll('tbody tr').length;
      if (!best || rowCount > best.rowCount) best = { table, cedulaIndex, estadoIndex, rowCount };
    }
    if (!best) return { ok:false, rows:[] };
    const rows = [];
    for (const tr of Array.from(best.table.querySelectorAll('tbody tr'))) {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (!cells.length || (cells.length === 1 && cells[0].hasAttribute('colspan'))) continue;
      const cedula = text(cells[best.cedulaIndex]?.textContent);
      if (!cedula) continue;
      rows.push({ cedula, estado:best.estadoIndex >= 0 ? text(cells[best.estadoIndex]?.textContent) : '' });
    }
    return { ok:true, rows };
  }).catch(() => ({ ok:false, rows:[] }));
}

async function clickConfirmationNextPage(p) {
  const controls = p.locator('a,button');
  const index = await controls.evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const hasCedula = region => Array.from((region || document).querySelectorAll('table')).some(table => {
      const headers = Array.from(table.querySelectorAll('thead th,thead td,tr:first-child th')).map(th => norm(th.textContent));
      return headers.some(h => h.includes('CEDULA'));
    });
    return nodes.findIndex(el => {
      if (!visible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      const region = el.closest('.a-IRR,.a-IRR-region,.t-Region');
      if (!region || !hasCedula(region)) return false;
      const label = norm([el.textContent,el.getAttribute('aria-label'),el.getAttribute('title')].filter(Boolean).join(' '));
      return el.classList.contains('a-IRR-pagination-next') || /^(NEXT|SIGUIENTE|PROXIMA|PROXIMO)$/.test(label) || /NEXT PAGE|PAGINA SIGUIENTE/.test(label);
    });
  }).catch(() => -1);
  if (index < 0) return false;
  await controls.nth(index).click({ timeout:5_000 });
  return true;
}

async function waitConfirmationSnapshot(p, previousFingerprint = '') {
  const until = Date.now() + 5_000;
  let last = { ok:false, rows:[], fingerprint:'' };
  while (Date.now() < until) {
    const snapshot = await readConfirmationProspectPage(p);
    if (snapshot.ok) {
      const rows = snapshot.rows.map(row => ({ ...row, cedula:digits(row.cedula) })).filter(row => !!row.cedula);
      const fingerprint = sha(rows.map(row => row.cedula).join('|'));
      last = { ok:true, rows, fingerprint };
      if (!previousFingerprint || fingerprint !== previousFingerprint) return last;
    }
    await sleep(150);
  }
  return last;
}

async function scanConfirmationPagesForCedula(p, cedula) {
  let pages_scanned = 0;
  let rows_scanned = 0;
  const seen = new Set();
  let current = await waitConfirmationSnapshot(p);
  if (!current.ok) return { found:false, estado:'', pages_scanned, rows_scanned, complete:false };
  for (let guard = 0; guard < 100; guard += 1) {
    if (seen.has(current.fingerprint)) break;
    seen.add(current.fingerprint);
    pages_scanned += 1;
    rows_scanned += current.rows.length;
    const hit = current.rows.find(row => row.cedula === cedula);
    if (hit) return { found:true, estado:txt(hit.estado || ''), pages_scanned, rows_scanned, complete:true };
    const moved = await clickConfirmationNextPage(p);
    if (!moved) return { found:false, estado:'', pages_scanned, rows_scanned, complete:true };
    const next = await waitConfirmationSnapshot(p, current.fingerprint);
    if (!next.ok || next.fingerprint === current.fingerprint) return { found:false, estado:'', pages_scanned, rows_scanned, complete:false };
    current = next;
  }
  return { found:false, estado:'', pages_scanned, rows_scanned, complete:false };
}

async function confirmInHome(p, sessionId, cedula) {
  const started = Date.now();
  await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
  const ir_filters_before = await countIrFilters(p);
  await p.goto(confirmationResetUrl(sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
  await waitForApexDynamicAction(p);
  await sleep(100);
  const ir_filters_after = await countIrFilters(p);
  const scanned = await scanConfirmationPagesForCedula(p, cedula);
  return {
    found:scanned.found,
    estado:scanned.estado,
    ir_filters_before,
    ir_filters_after,
    ir_reset_method:'URL_RIR',
    pages_scanned:scanned.pages_scanned,
    rows_scanned:scanned.rows_scanned,
    ms_confirmation:Date.now()-started,
  };
}

async function confirmAfterCreate(cedula, sessionId) {
  const started = Date.now();
  let primaryMode = 'UNKNOWN';
  let primaryFields = [];
  try {
    const fresh = await ConapeSession.freshProspectoFromHome();
    await lookupCedulaOnPage(fresh.p, cedula);
    const modeInfo = await readFormMode(fresh.p);
    primaryMode = modeInfo.mode;
    primaryFields = safeFormFields(modeInfo.fields);
    if (primaryMode === 'UPDATE') {
      return {
        found:true, estado:'', confirmation_method:'FORM_MODE_UPDATE', form_mode:'UPDATE', form_readonly_fields:primaryFields,
        ir_filters_before:0, ir_filters_after:0, ir_reset_method:'SKIPPED_FORM_MODE', pages_scanned:0, rows_scanned:0,
        ms_confirmation:Date.now()-started,
      };
    }
    const fallback = await confirmInHome(fresh.p, fresh.meta?.sessionId || sessionId, cedula);
    return { ...fallback, confirmation_method:'HOME_FALLBACK', form_mode:primaryMode, form_readonly_fields:primaryFields, ms_confirmation:Date.now()-started };
  } catch {
    const p = await ConapeSession.browserPage();
    const fallback = await confirmInHome(p, sessionId, cedula);
    return { ...fallback, confirmation_method:'HOME_FALLBACK', form_mode:primaryMode, form_readonly_fields:primaryFields, ms_confirmation:Date.now()-started };
  }
}

const PROSPECT_LIST_FIELDS = ['cedula','apellido_1','apellido_2','nombre','telefono','celular','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];
const PROSPECT_LIST_HEADER_ALIASES = new Map([
  ['CEDULA','cedula'],['C_DULA','cedula'],
  ['PRIMER_APELLIDO','apellido_1'],['SEGUNDO_APELLIDO','apellido_2'],['NOMBRE','nombre'],
  ['TELEFONO','telefono'],['CELULAR','celular'],['TELEFONO_CELULAR','celular'],['TELEFONOCELULAR','celular'],['TEL_FONOCELULAR','celular'],
  ['CORREO_ELECTRONICO','correo'],['CORREO_ELECTR_NICO','correo'],['CORREO','correo'],
  ['ESTADO','estado'],
  ['FECHA_DE_ESTADO','fecha_estado'],['FECHA_ESTADO','fecha_estado'],['FECHA_DEESTADO','fecha_estado'],
  ['FECHA_DE_REGISTRO','fecha_registro'],['FECHA_REGISTRO','fecha_registro'],['FECHA_DEREGISTRO','fecha_registro'],
  ['USUARIO_QUE_REGISTRO','usuario_registro'],['USUARIO_QUEREGISTRO','usuario_registro'],['USUARIO_QUEREGISTR','usuario_registro'],['USUARIO_REGISTRO','usuario_registro'],
  ['APROBACION','aprobacion'],['APROBACI_N','aprobacion'],
  ['FORMALIZACION','formalizacion'],['FORMALIZACI_N','formalizacion'],
  ['ULTIMO_DESEMBOLSO','ultimo_desembolso'],['ULTIMODESEMBOLSO','ultimo_desembolso'],['LTIMODESEMBOLSO','ultimo_desembolso'],
  ['PROXIMO_DESEMBOLSO','proximo_desembolso'],['PROXIMODESEMBOLSO','proximo_desembolso'],['PR_XIMODESEMBOLSO','proximo_desembolso'],
]);
const PROSPECT_LIST_PHONE_FIELDS = ['telefono','celular'];
const PROSPECT_LIST_REQUIRED_FIELDS = PROSPECT_LIST_FIELDS.filter(key => !PROSPECT_LIST_PHONE_FIELDS.includes(key));

function normalizeProspectListHeader(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}

function prospectListMissingFields(headers) {
  const present = new Set((Array.isArray(headers) ? headers : []).filter(Boolean));
  const missing = PROSPECT_LIST_REQUIRED_FIELDS.filter(key => !present.has(key));
  if (!PROSPECT_LIST_PHONE_FIELDS.some(key => present.has(key))) missing.push('telefono_o_celular');
  return missing;
}

function normalizeProspectRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(row => ({
    ...Object.fromEntries(PROSPECT_LIST_FIELDS.map(key => [key, txt(row?.[key] || '')])),
    cedula:digits(row?.cedula),
  })).filter(row => !!row.cedula);
}

function addProspectRows(rowsByCedula, rows) {
  for (const row of normalizeProspectRows(rows)) {
    const previous = rowsByCedula.get(row.cedula);
    if (previous && JSON.stringify(previous) !== JSON.stringify(row)) {
      throw new AppError('CONAPE_LIST_DUPLICATE_CEDULA', 'CONAPE devolvió una cédula duplicada con datos distintos.', 409, 'LIST');
    }
    rowsByCedula.set(row.cedula, row);
  }
}

function detectCsvDelimiter(line) {
  const counts = new Map([[',',0],[';',0],['\t',0]]);
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { i += 1; continue; }
      quoted = !quoted;
      continue;
    }
    if (!quoted && counts.has(ch)) counts.set(ch, counts.get(ch) + 1);
  }
  return [...counts.entries()].sort((a,b) => b[1] - a[1])[0]?.[0] || ',';
}

function parseCsvRecords(raw) {
  let source = String(raw || '').replace(/^\uFEFF/, '');
  let delimiter = '';
  const sepMatch = source.match(/^sep=(,|;|\t)\r?\n/i);
  if (sepMatch) {
    delimiter = sepMatch[1];
    source = source.slice(sepMatch[0].length);
  }
  if (!delimiter) delimiter = detectCsvDelimiter(source.split(/\r?\n/, 1)[0] || '');
  const records = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"') {
        if (source[i + 1] === '"') { field += '"'; i += 1; }
        else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delimiter) { row.push(field); field = ''; continue; }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some(value => String(value || '').trim() !== '')) records.push(row);
      row = [];
      continue;
    }
    field += ch;
  }
  row.push(field);
  if (row.some(value => String(value || '').trim() !== '')) records.push(row);
  return records;
}

function parseProspectCsv(raw) {
  const records = parseCsvRecords(raw);
  if (!records.length) return { ok:false, reason:'CSV_EMPTY', columns_ok:false, rows:[], schema:[], missing:[] };
  const rawHeaders = records.shift().map(header => normalizeProspectListHeader(header));
  const headers = rawHeaders.map(header => PROSPECT_LIST_HEADER_ALIASES.get(header) || null);
  const missing = prospectListMissingFields(headers);
  if (missing.length) return { ok:false, reason:'REQUIRED_COLUMN_MISSING', columns_ok:false, rows:[], schema:rawHeaders, missing };
  const rows = [];
  for (const cells of records) {
    const row = Object.fromEntries(PROSPECT_LIST_FIELDS.map(key => [key,'']));
    for (let i = 0; i < headers.length; i += 1) {
      const key = headers[i];
      if (key) row[key] = txt(cells[i] || '');
    }
    if (Object.values(row).some(Boolean)) rows.push(row);
  }
  return { ok:true, reason:'', columns_ok:true, rows, schema:rawHeaders, missing:[] };
}

async function readDownloadUtf8(download) {
  const stream = await download.createReadStream();
  if (!stream) throw new Error('DOWNLOAD_STREAM_UNAVAILABLE');
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > 16 * 1024 * 1024) throw new Error('DOWNLOAD_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function downloadProspectCsv(p) {
  return downloadProspectCsvViaDialog(p, parseProspectCsv);
}


async function readProspectListPage(p) {
  return p.evaluate(({ fields, required, phoneFields }) => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    const text = v => String(v || '').replace(/\s+/g,' ').trim();
    const aliases = new Map([
      ['CEDULA','cedula'],['C_DULA','cedula'],
      ['PRIMER_APELLIDO','apellido_1'],['SEGUNDO_APELLIDO','apellido_2'],['NOMBRE','nombre'],
      ['TELEFONO','telefono'],['CELULAR','celular'],['TELEFONO_CELULAR','celular'],['TELEFONOCELULAR','celular'],['TEL_FONOCELULAR','celular'],
      ['CORREO_ELECTRONICO','correo'],['CORREO_ELECTR_NICO','correo'],['CORREO','correo'],
      ['ESTADO','estado'],
      ['FECHA_DE_ESTADO','fecha_estado'],['FECHA_ESTADO','fecha_estado'],['FECHA_DEESTADO','fecha_estado'],
      ['FECHA_DE_REGISTRO','fecha_registro'],['FECHA_REGISTRO','fecha_registro'],['FECHA_DEREGISTRO','fecha_registro'],
      ['USUARIO_QUE_REGISTRO','usuario_registro'],['USUARIO_QUEREGISTRO','usuario_registro'],['USUARIO_QUEREGISTR','usuario_registro'],['USUARIO_REGISTRO','usuario_registro'],
      ['APROBACION','aprobacion'],['APROBACI_N','aprobacion'],
      ['FORMALIZACION','formalizacion'],['FORMALIZACI_N','formalizacion'],
      ['ULTIMO_DESEMBOLSO','ultimo_desembolso'],['ULTIMODESEMBOLSO','ultimo_desembolso'],['LTIMODESEMBOLSO','ultimo_desembolso'],
      ['PROXIMO_DESEMBOLSO','proximo_desembolso'],['PROXIMODESEMBOLSO','proximo_desembolso'],['PR_XIMODESEMBOLSO','proximo_desembolso'],
    ]);
    let best = null;
    let schemaMode = 'HEADER';
    const allTables = Array.from(document.querySelectorAll('table'));
    for (const table of allTables) {
      const headers = Array.from(table.querySelectorAll('th')).map(th => aliases.get(norm(th.textContent)) || null);
      const phoneOk = phoneFields.some(key => headers.includes(key));
      const score = required.filter(key => headers.includes(key)).length + (phoneOk ? 1 : 0);
      const dataRows = Array.from(table.querySelectorAll('tbody tr')).filter(tr => {
        const cells = Array.from(tr.querySelectorAll('td'));
        return cells.length > 1 || (cells.length === 1 && !cells[0].hasAttribute('colspan'));
      }).length;
      if (!best || score > best.score || (score === best.score && dataRows > best.dataRows)) {
        best = { table, headers, score, dataRows };
      }
    }

    // SIFA ha cambiado etiquetas visibles del Interactive Report sin cambiar
    // el contrato/orden de sus 14 columnas. Si los headers no coinciden por
    // texto, aceptar únicamente una tabla de 14 columnas cuyo primer campo se
    // comporte como cédula en la gran mayoría de las filas. Esto evita elegir
    // tablas auxiliares de APEX y mantiene una validación fuerte del esquema.
    const ordinal14 = [
      'cedula','apellido_1','apellido_2','nombre','telefono','correo','estado',
      'fecha_estado','fecha_registro','usuario_registro','aprobacion',
      'formalizacion','ultimo_desembolso','proximo_desembolso'
    ];
    const missingByHeader = best
      ? required.filter(key => !best.headers.includes(key)).concat(
          phoneFields.some(key => best.headers.includes(key)) ? [] : ['telefono_o_celular']
        )
      : required.slice();

    if (!best || best.score < 2 || missingByHeader.length) {
      let ordinalBest = null;
      for (const table of allTables) {
        const thCount = table.querySelectorAll('th').length;
        if (thCount !== ordinal14.length) continue;
        const trs = Array.from(table.querySelectorAll('tbody tr')).filter(tr => {
          const cells = Array.from(tr.querySelectorAll('td'));
          return cells.length === ordinal14.length;
        });
        if (!trs.length) continue;
        const sample = trs.slice(0, Math.min(20, trs.length));
        const cedulaLike = sample.filter(tr => {
          const first = String(tr.querySelector('td')?.textContent || '').replace(/\D/g,'');
          return first.length >= 8 && first.length <= 12;
        }).length;
        const ratio = sample.length ? cedulaLike / sample.length : 0;
        if (ratio < 0.7) continue;
        if (!ordinalBest || trs.length > ordinalBest.dataRows) {
          ordinalBest = { table, headers:ordinal14.slice(), score:required.length + 1, dataRows:trs.length };
        }
      }
      if (ordinalBest) {
        best = ordinalBest;
        schemaMode = 'ORDINAL14';
      }
    }

    if (!best || best.score < 2) return { ok:false, reason:'REPORT_NOT_FOUND', missing:required, rows:[] };
    const missing = required.filter(key => !best.headers.includes(key));
    if (!phoneFields.some(key => best.headers.includes(key))) missing.push('telefono_o_celular');
    if (missing.length) return { ok:false, reason:'REQUIRED_COLUMN_MISSING', missing, rows:[] };
    const rows = [];
    for (const tr of Array.from(best.table.querySelectorAll('tbody tr'))) {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (!cells.length || (cells.length === 1 && cells[0].hasAttribute('colspan'))) continue;
      const row = Object.fromEntries(fields.map(key => [key,'']));
      for (let i = 0; i < best.headers.length; i += 1) {
        const key = best.headers[i];
        if (key && cells[i]) row[key] = text(cells[i].textContent);
      }
      if (Object.values(row).some(Boolean)) rows.push(row);
    }
    return { ok:true, missing:[], rows, schema_mode:schemaMode };
  }, { fields:PROSPECT_LIST_FIELDS, required:PROSPECT_LIST_REQUIRED_FIELDS, phoneFields:PROSPECT_LIST_PHONE_FIELDS }).catch(() => ({ ok:false, reason:'REPORT_READ_FAILED', missing:[], rows:[] }));
}

async function waitProspectListReady(p, timeoutMs = 8_000) {
  const started = Date.now();
  const until = started + Math.max(1_000, Number(timeoutMs || 8_000));
  let last = { ok:false, reason:'REPORT_NOT_FOUND', missing:[] };
  while (Date.now() < until) {
    last = await readProspectListPage(p);
    if (last.ok) return last;
    await sleep(200);
  }
    const frame_debug = [];

  for (const frame of p.frames()) {
    const info = await frame.evaluate(() => {
      let url_path = '';
      try {
        url_path = decodeURIComponent(location.pathname || '').slice(0,160);
      } catch {}

      return {
        url_path,
        table_count: document.querySelectorAll('table').length,
        irr_table_count: document.querySelectorAll('table.a-IRR-table').length,
        th_count: document.querySelectorAll('th').length,
        irr_th_counts: Array.from(
          document.querySelectorAll('table.a-IRR-table')
        ).map(table => table.querySelectorAll('th').length).slice(0,10),
      };
    }).catch(() => null);

    if (info) frame_debug.push(info);
  }

  console.log(JSON.stringify({
    event:'conape_list_dom_debug',
    version:VERSION,
    frames:frame_debug,
    pii:false,
  }));
  console.log(JSON.stringify({
    event:'conape_list_ready_timeout', version:VERSION,
    reason:txt(last?.reason || 'UNKNOWN'),
    missing:Array.isArray(last?.missing) ? last.missing : [],
    timeout_ms:Date.now()-started,
    pii:false,
  }));
  throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso el contrato de columnas esperado.', 503, 'LIST');
}

async function setProspectRowsAll(p) {
  const selectCandidate = await p.locator('select').evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!visible(el)) continue;
      const context = norm([el.getAttribute('aria-label'),el.getAttribute('title'),el.name,el.id,el.parentElement?.textContent].filter(Boolean).join(' '));
      if (!/(ROWS|FILAS|PAGINA|PAGE)/.test(context)) continue;
      const option = Array.from(el.options || []).find(o => /^(ALL|TODAS|TODOS)$/.test(norm(o.textContent || '')) || String(o.value || '').trim() === '-1');
      if (option) return { index:i, value:option.value };
    }
    return null;
  }).catch(() => null);
  if (selectCandidate) {
    try {
      await p.locator('select').nth(selectCandidate.index).selectOption(selectCandidate.value);
      await waitForApexDynamicAction(p);
      await waitProspectListReady(p);
      return true;
    } catch {}
  }

  const actions = p.getByRole('button', { name:/actions|acciones/i }).first();
  if (!(await actions.count())) return false;
  try {
    await actions.click({ timeout:5_000 });
    await sleep(120);
    const rowsMenu = p.getByRole('menuitem', { name:/rows per page|filas por p[aá]gina|filas/i }).first();
    if (!(await rowsMenu.count())) return false;
    await rowsMenu.click({ timeout:5_000 });
    await sleep(120);
    const menuItems = p.locator('[role="menuitem"]:visible,.a-Menu-content .a-Menu-label:visible');
    const index = await menuItems.evaluateAll(nodes => {
      const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      return nodes.findIndex(node => /^(ALL|TODAS|TODOS)$/.test(norm(node.textContent || '')));
    }).catch(() => -1);
    if (index < 0) return false;
    await menuItems.nth(index).click({ timeout:5_000 });
    await waitForApexDynamicAction(p);
    await waitProspectListReady(p);
    return true;
  } catch {
    return false;
  }
}

async function maximizeProspectRows(p) {
  const candidate = await p.locator('select').evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    for (let i = 0; i < nodes.length; i += 1) {
      const el = nodes[i];
      if (!visible(el)) continue;
      const context = norm([el.getAttribute('aria-label'),el.getAttribute('title'),el.name,el.id,el.parentElement?.textContent].filter(Boolean).join(' '));
      if (!/(ROWS|FILAS|PAGINA|PAGE)/.test(context)) continue;
      const options = Array.from(el.options || []).map(o => ({ value:o.value, n:Number(String(o.textContent || o.value).replace(/[^0-9]/g,'')) })).filter(o => Number.isFinite(o.n) && o.n > 0);
      if (!options.length) continue;
      options.sort((a,b) => b.n-a.n);
      return { index:i, value:options[0].value };
    }
    return null;
  }).catch(() => null);
  if (candidate) {
    await p.locator('select').nth(candidate.index).selectOption(candidate.value).catch(() => {});
    await waitForApexDynamicAction(p);
    await waitProspectListReady(p);
    return true;
  }
  return false;
}

async function prospectNextPageIndex(p) {
  const controls = p.locator('a,button');
  return controls.evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const reportRegion = el => el.closest('.a-IRR,.a-IRR-region,.t-Region');
    const hasProspectTable = region => Array.from((region || document).querySelectorAll('table')).some(table => {
      const headers = Array.from(table.querySelectorAll('th')).map(th => norm(th.textContent));
      return headers.some(h => h.includes('CEDULA')) && headers.some(h => h === 'ESTADO');
    });
    return nodes.findIndex(el => {
      if (!visible(el) || el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
      const region = reportRegion(el);
      if (!region || !hasProspectTable(region)) return false;
      const label = norm([el.textContent,el.getAttribute('aria-label'),el.getAttribute('title')].filter(Boolean).join(' '));
      return el.classList.contains('a-IRR-pagination-next') || /^(NEXT|SIGUIENTE|PROXIMA|PROXIMO)$/.test(label) || /NEXT PAGE|PAGINA SIGUIENTE/.test(label);
    });
  }).catch(() => -1);
}

async function clickProspectNextPage(p) {
  const index = await prospectNextPageIndex(p);
  if (index < 0) return false;
  await p.locator('a,button').nth(index).click({ timeout:10_000 });
  return true;
}

async function readPagedProspects(p, rowsByCedula) {
  await maximizeProspectRows(p);
  let pages = 0;
  const pageFingerprints = new Set();
  for (let guard = 0; guard < 100; guard += 1) {
    const snapshot = await readProspectListPage(p);
    if (!snapshot.ok) throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', 'La lista CONAPE no expuso el contrato de columnas esperado.', 503, 'LIST');
    const normalizedRows = normalizeProspectRows(snapshot.rows);
    const fingerprint = sha(normalizedRows.map(row => row.cedula).join('|'));
    if (pageFingerprints.has(fingerprint)) break;
    pageFingerprints.add(fingerprint);
    pages += 1;
    addProspectRows(rowsByCedula, normalizedRows);
    const moved = await clickProspectNextPage(p);
    if (!moved) break;
    const until = Date.now() + 10_000;
    let changed = false;
    while (Date.now() < until) {
      await sleep(250);
      const next = await readProspectListPage(p);
      if (!next.ok) continue;
      const nextFingerprint = sha(normalizeProspectRows(next.rows).map(row => row.cedula).join('|'));
      if (nextFingerprint !== fingerprint) { changed = true; break; }
    }
    if (!changed) throw new AppError('CONAPE_LIST_PAGINATION_STALLED', 'La paginación de CONAPE no avanzó.', 503, 'LIST');
  }
  return pages;
}

function prospectListResetUrl(sessionId) {
  const u = new URL(CONAPE_FRIENDLY_HOME);
  const cleanSession = digits(sessionId);
  u.searchParams.set('session', cleanSession);
  u.searchParams.set('clear', 'RR');
  return u.href;
}

async function openProspectListHome(p, sessionId) {
  await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  await waitForApexDynamicAction(p);
  return waitProspectListReady(p);
}

async function readEventContextValues(p) {
  return p.evaluate(() => {
    const read = id => {
      try {
        const item = window.apex?.item?.(id);
        if (item && typeof item.getValue === 'function') return String(item.getValue() ?? '').trim();
      } catch {}
      return String(document.getElementById(id)?.value || '').trim();
    };
    return { eve:read('P2_EVE_ID'), pro:read('P2_PRO_ID') };
  }).catch(() => ({ eve:'', pro:'' }));
}

async function applyProspectEventFilter(p, eventId) {
  const effectiveEventId = txt(eventId || CONAPE_EVE_ID);
  if (!effectiveEventId) {
    throw new AppError('CONAPE_LIST_EVENT_CONTEXT_MISSING', 'No existe un Evento disponible para Prospectación.', 503, 'LIST');
  }
  const actions = p.getByRole('button', { name:/actions|acciones/i }).first();
  if (!(await actions.count())) {
    throw new AppError('CONAPE_LIST_ACTIONS_NOT_FOUND', 'CONAPE no expuso Actions en Prospectación.', 503, 'LIST');
  }
  await actions.click({ timeout:5_000 });
  await sleep(120);

  const filter = p.getByRole('menuitem', { name:/^filter$|^filtro$/i }).first();
  if (!(await filter.count())) {
    throw new AppError('CONAPE_LIST_FILTER_MENU_NOT_FOUND', 'CONAPE no expuso Filter en Actions.', 503, 'LIST');
  }
  await filter.click({ timeout:5_000 });
  await waitForApexDynamicAction(p);
  await sleep(150);

  const columnRadio = p.locator('input[id$="_filter_type_0"][type="radio"]:visible').first();
  const column = p.locator('select[id$="_column_name"]:visible').first();
  const operator = p.locator('select[id$="_OPT"]:visible').first();
  const expression = p.locator('input[id$="_expression"]:visible,textarea[id$="_expression"]:visible').first();
  const dialog = p.locator('[role="dialog"]:visible,.ui-dialog:visible,.a-IRR-dialog:visible').last();
  const apply = dialog.getByRole('button', { name:/^apply$|^aplicar$/i }).first();

  if (!(await column.count()) || !(await operator.count()) || !(await expression.count()) || !(await apply.count())) {
    throw new AppError('CONAPE_LIST_FILTER_CONTROLS_NOT_FOUND', 'CONAPE no expuso los controles requeridos del filtro.', 503, 'LIST');
  }

  if (await columnRadio.count()) await columnRadio.check({ timeout:3_000 }).catch(() => {});

  const optionIndex = async (locator, expected) => locator.locator('option').evaluateAll((options, wanted) => {
    const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    return options.findIndex(option => norm(option.textContent || '') === wanted);
  }, expected);
  const columnIndex = await optionIndex(column, 'REG EVE ID');
  if (columnIndex < 0) {
    throw new AppError('CONAPE_LIST_FILTER_OPTION_NOT_FOUND', 'CONAPE cambió la columna de contexto de Prospectación.', 503, 'LIST');
  }
  await column.selectOption({ index:columnIndex });
  await waitForApexDynamicAction(p);
  await sleep(120);
  const operatorIndex = await optionIndex(operator, '=');
  if (operatorIndex < 0) {
    throw new AppError('CONAPE_LIST_FILTER_OPERATOR_NOT_FOUND', 'CONAPE cambió el operador del filtro de Prospectación.', 503, 'LIST');
  }
  await operator.selectOption({ index:operatorIndex });
  await expression.fill(effectiveEventId);

  const selected = await Promise.all([
    column.locator('option:checked').textContent().catch(() => ''),
    operator.locator('option:checked').textContent().catch(() => ''),
  ]);
  const expressionOk = (await expression.inputValue().catch(() => '')) === effectiveEventId;
  if (upper(selected[0]) !== 'REG EVE ID' || upper(selected[1]) !== '=' || !expressionOk) {
    throw new AppError('CONAPE_LIST_FILTER_SELECTION_FAILED', 'CONAPE no confirmó el contexto de Evento de Prospectación.', 503, 'LIST');
  }

  await apply.click({ timeout:5_000 });
  await waitForApexDynamicAction(p);

  const until = Date.now() + 12_000;
  while (Date.now() < until) {
    const loaded = await readProspectListPage(p);
    if (loaded.ok === true && Array.isArray(loaded.rows) && loaded.rows.length > 0) {
      console.log(JSON.stringify({
        event:'conape_list_rows_ready',
        version:VERSION,
        method:'EVENT_CONTEXT_FILTER',
        first_page_rows:loaded.rows.length,
        pii:false,
      }));
      return loaded.rows.length;
    }
    await sleep(250);
  }

  throw new AppError('CONAPE_LIST_EVENT_FILTER_EMPTY', 'CONAPE no devolvió filas para el Evento configurado de Prospectación.', 503, 'LIST');
}

async function resetProspectListReport(p, sessionId, eventId) {
  // La lista de Prospectación vive en la Friendly Home. No usar aquí el
  // f?p=302:1:...:::RIR: clásico: en producción puede desviar a login y
  // desmontar el dataset del Interactive Report.
  await openProspectListHome(p, sessionId);

  const filtersBefore = await countIrFilters(p);
  if (filtersBefore > 0) {
    await resetInteractiveReport(p);
    await waitForApexDynamicAction(p);
    await waitProspectListReady(p);
    const remaining = await countIrFilters(p);
    if (remaining !== 0) {
      throw new AppError('CONAPE_LIST_FILTER_RESET_FAILED', 'CONAPE no permitió limpiar los filtros previos de Prospectación.', 503, 'LIST');
    }
  }

  await applyProspectEventFilter(p, eventId);

  const filtersAfter = await countIrFilters(p);
  if (filtersAfter < 1) {
    throw new AppError('CONAPE_LIST_FILTER_NOT_APPLIED', 'CONAPE no conservó el filtro completo de Prospectación.', 503, 'LIST');
  }

  console.log(JSON.stringify({
    event:'conape_list_report_ready',
    version:VERSION,
    reset_method:filtersBefore > 0 ? 'FRIENDLY_HOME_CONSERVATIVE_RESET_EVENT' : 'FRIENDLY_HOME_EVENT_FILTER',
    filters_before:filtersBefore,
    filters_after:filtersAfter,
    event_source:eventId ? 'PAGE' : 'ENV_FALLBACK',
    event_matches_env:eventId && CONAPE_EVE_ID ? txt(eventId) === txt(CONAPE_EVE_ID) : null,
    pii:false,
  }));

  return filtersBefore;
}

function prospectSnapshotFingerprint(rows) {
  const normalized = normalizeProspectRows(rows).sort((a,b) => a.cedula.localeCompare(b.cedula));
  return sha(normalized.map(row => PROSPECT_LIST_FIELDS.map(key => txt(row?.[key] || '')).join('\u001f')).join('\u001e'));
}

async function readHtmlProspectSnapshot(p, sessionId, eventId) {
  const irFiltersBefore = await resetProspectListReport(p, sessionId, eventId);
  await waitProspectListReady(p);
  const rowsByCedula = new Map();
  const pages = await readPagedProspects(p, rowsByCedula);
  const rows = [...rowsByCedula.values()].sort((a,b) => a.cedula.localeCompare(b.cedula));
  if (!rows.length) throw new AppError('CONAPE_LIST_HTML_EMPTY', 'La lista visible de CONAPE no devolvió prospectos.', 503, 'LIST');
  return {
    rows,
    pages,
    ir_filters_before:irFiltersBefore,
    fingerprint:prospectSnapshotFingerprint(rows),
  };
}

function conapeReportUrlWithSession(sessionId) {
  const cleanSession = digits(sessionId);
  if (!cleanSession) return CONAPE_REPORT_URL;
  const u = new URL(CONAPE_REPORT_URL);
  u.searchParams.set('p', '302:1:' + cleanSession + ':::::');
  return u.href;
}

async function loginCurrentConapePage(p) {
  const pass = p.locator('input[type="password"]:visible').first();
  if (!(await pass.count())) return null;
  if (!CONAPE_USER || !CONAPE_PASSWORD) {
    throw new AppError('CONAPE_CREDENTIALS_MISSING', 'Credenciales CONAPE no configuradas.', 503, 'REPORT');
  }
  let user = p.getByLabel(/usuario|c[eé]dula|identificaci[oó]n|user/i).first();
  if (!(await user.count())) {
    user = p.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])').first();
  }
  if (!(await user.count())) {
    throw new AppError('CONAPE_LOGIN_USER_NOT_FOUND', 'No se encontró el usuario de CONAPE.', 503, 'REPORT');
  }
  await user.fill(CONAPE_USER);
  await pass.fill(CONAPE_PASSWORD);
  const login = p.getByRole('button', { name:/ingresar|iniciar sesi[oó]n|entrar|acceder|login|sign in/i }).first();
  if (await login.count()) await login.click(); else await pass.press('Enter');

  const until = Date.now() + 30_000;
  while (Date.now() < until) {
    await sleep(300);
    const state = await ConapeSession.authState(p);
    const sessionId = await readApexSession(p);
    if (state.authenticated && sessionId) return { state, sessionId };
  }
  throw new AppError('CONAPE_LOGIN_FAILED', 'CONAPE no confirmó la sesión del reporte.', 503, 'REPORT');
}

async function readProspectReportContext(p) {
  return p.evaluate(({ expectedPro, expectedEve }) => {
    const read = id => {
      try {
        const item = window.apex?.item?.(id);
        if (item && typeof item.getValue === 'function') return String(item.getValue() ?? '').trim();
      } catch {}
      return '';
    };
    const rows = document.querySelector('select[id$="_row_select"]');
    const selectedRows = String(rows?.options?.[rows.selectedIndex]?.text || '').trim();
    const pro = read('P1_PRO_ID');
    const eve = read('P1_EVE_ID');
    return {
      ready:!!document.getElementById('P1_PRO_ID') && !!document.getElementById('P1_EVE_ID') && !!rows,
      pro_present:!!pro,
      eve_present:!!eve,
      pro_matches_env:expectedPro ? pro === expectedPro : null,
      eve_matches_env:expectedEve ? eve === expectedEve : null,
      rows:selectedRows,
    };
  }, { expectedPro:CONAPE_REPORT_PRO_ID, expectedEve:CONAPE_REPORT_EVE_ID }).catch(() => ({
    ready:false, pro_present:false, eve_present:false,
    pro_matches_env:CONAPE_REPORT_PRO_ID ? false : null,
    eve_matches_env:CONAPE_REPORT_EVE_ID ? false : null,
    rows:'',
  }));
}

async function setReportApexItem(p, id, value, displayValue = '') {
  const clean = txt(value);
  const display = txt(displayValue);
  if (!clean) return false;
  const written = await p.evaluate(({ id, value, display }) => {
    try {
      const item = window.apex?.item?.(id);
      if (!item || typeof item.setValue !== 'function' || typeof item.getValue !== 'function') return false;
      item.setValue(value, display || undefined, false);
      return String(item.getValue() ?? '').trim() === String(value).trim();
    } catch {
      return false;
    }
  }, { id, value:clean, display }).catch(() => false);
  if (!written) return false;
  await waitForApexDynamicAction(p);
  await sleep(250);
  return p.evaluate(({ id, value }) => {
    try { return String(window.apex?.item?.(id)?.getValue?.() ?? '').trim() === String(value).trim(); }
    catch { return false; }
  }, { id, value:clean }).catch(() => false);
}

async function selectSingleReportLov(p, inputId, expectedLabel = '', force = false) {
  const current = await p.evaluate(id => {
    try { return String(window.apex?.item?.(id)?.getValue?.() ?? '').trim(); }
    catch { return ''; }
  }, inputId).catch(() => '');
  if (current && !force) return true;

  const button = p.locator('#' + inputId + '_lov_btn:visible').first();
  if (!(await button.count())) return false;
  await button.click({ timeout:5_000 });

  const dialog = p.locator('.a-PopupLOV-dialog:visible,[role="dialog"]:visible').last();
  try { await dialog.waitFor({ state:'visible', timeout:5_000 }); } catch { return false; }

  const searchInput = dialog.locator('input[type="search"]:visible,input:visible').first();
  if (await searchInput.count()) {
    await searchInput.fill(expectedLabel || '');
  }
  // En SIFA el boton Search del Popup LOV dispara una consulta AJAX. El resultado
  // real expone la etiqueta en textContent del <li role="option">, no en aria-label.
  let search = dialog.getByRole('button', { name:/^search$|^buscar$/i }).first();
  if (!(await search.count())) search = dialog.locator('button.a-PopupLOV-doSearch:visible,[aria-label="Search"]:visible,[aria-label="Buscar"]:visible').first();
  if (await search.count()) {
    await search.click({ timeout:5_000 });
    await waitForApexDynamicAction(p);
  }

  const expected = upper(expectedLabel);
  const options = dialog.locator('li:visible,[role="option"]:visible');
  const optionsUntil = Date.now() + 5_000;
  let optionIndex = -1;
  while (Date.now() < optionsUntil) {
    const labels = await options.evaluateAll(nodes => nodes.map((node, index) => ({
      index,
      text:String(node.textContent || node.getAttribute('aria-label') || '').replace(/\s+/g,' ').trim(),
    }))).catch(() => []);
    const usable = labels.filter(item => {
      const label = upper(item.text);
      return !!label && !/^(SELECCIONE EL PROSPECTADOR|SELECCIONE EL EVENTO|NO RESULTS FOUND|SIN RESULTADOS)$/.test(label);
    });
    if (expected) {
      const exact = usable.find(item => upper(item.text) === expected);
      const contains = usable.find(item => upper(item.text).includes(expected));
      optionIndex = (exact || contains)?.index ?? -1;
    } else if (usable.length === 1) {
      optionIndex = usable[0].index;
    }
    if (optionIndex >= 0) break;
    await sleep(150);
  }
  if (optionIndex < 0) return false;

  await options.nth(optionIndex).click({ timeout:5_000 });
  await waitForApexDynamicAction(p);
  await sleep(500);

  let after = await p.evaluate(id => {
    try { return String(window.apex?.item?.(id)?.getValue?.() ?? '').trim(); }
    catch { return ''; }
  }, inputId).catch(() => '');
  if (after) return true;

  const until = Date.now() + 8_000;
  while (Date.now() < until) {
    after = await p.evaluate(id => {
      try { return String(window.apex?.item?.(id)?.getValue?.() ?? '').trim(); }
      catch { return ''; }
    }, inputId).catch(() => '');
    if (after) {
      await waitForApexDynamicAction(p);
      return true;
    }
    await sleep(150);
  }
  return false;
}

async function ensureProspectReportContext(p) {
  // El refresh usa directamente el reporte SIFA 302:1 como fuente canónica.
  await ConapeSession.login(p);
  let sessionId = await readApexSession(p);
  if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'REPORT');

  let state = await readProspectReportContext(p);
  if (!state.ready) {
    await p.goto(CONAPE_REPORT_URL, { waitUntil:'domcontentloaded', timeout:30_000 });
    await waitForApexDynamicAction(p);

    const currentAuth = await ConapeSession.authState(p);
    if (currentAuth.password) {
      const logged = await loginCurrentConapePage(p);
      sessionId = logged?.sessionId || sessionId;
    } else {
      sessionId = (await readApexSession(p)) || sessionId;
    }

    state = await readProspectReportContext(p);
    if (!state.ready) {
      // Si el login aterriza en Inicio, reabrir 302:1 con la sesión APEX recién creada.
      const reportSession = (await readApexSession(p)) || sessionId;
      await p.goto(conapeReportUrlWithSession(reportSession), { waitUntil:'domcontentloaded', timeout:30_000 });
      await waitForApexDynamicAction(p);
      sessionId = (await readApexSession(p)) || reportSession;
      state = await readProspectReportContext(p);
    }
  }

  if (!state.ready) {
    throw new AppError('CONAPE_REPORT_NOT_READY', 'CONAPE no dejó listo el reporte 302:1.', 503, 'REPORT');
  }

  let materializedRows = null;

  // Ruta can?nica probada en SIFA real: usar los Popup LOV visibles.
  // No escribir IDs ocultos con apex.item.setValue(): APEX necesita el clic
  // real del LOV para disparar sus Dynamic Actions y materializar el reporte.
  const proNeedsSelection = !state.pro_present || state.pro_matches_env === false;
  if (proNeedsSelection) {
    const ok = await selectSingleReportLov(p, 'P1_PRO_ID', CONAPE_REPORT_PROSPECTADOR_LABEL, true);
    if (!ok) throw new AppError('CONAPE_REPORT_PROSPECTADOR_NOT_SELECTED', 'CONAPE no permitio seleccionar el Prospectador.', 503, 'REPORT');
    // Evento depende de Prospectador en SIFA. Esperar la Dynamic Action y su LOV dependiente
    // antes de intentar abrirlo evita leer una lista todavía vacía.
    await waitForApexDynamicAction(p);
    await sleep(900);
  }

  state = await readProspectReportContext(p);
  if (CONAPE_REPORT_PRO_ID && state.pro_matches_env !== true) {
    throw new AppError('CONAPE_REPORT_PROSPECTADOR_MISMATCH', 'CONAPE no confirmo el Prospectador esperado.', 503, 'REPORT');
  }

  const eveNeedsSelection = !state.eve_present || state.eve_matches_env === false;
  if (eveNeedsSelection) {
    const ok = await selectSingleReportLov(p, 'P1_EVE_ID', CONAPE_REPORT_EVENT_LABEL, true);
    if (!ok) throw new AppError('CONAPE_REPORT_EVENTO_NOT_SELECTED', 'CONAPE no permitio seleccionar el Evento.', 503, 'REPORT');
  }

  state = await readProspectReportContext(p);
  if (CONAPE_REPORT_EVE_ID && state.eve_matches_env !== true) {
    throw new AppError('CONAPE_REPORT_EVENTO_MISMATCH', 'CONAPE no confirmo el Evento esperado.', 503, 'REPORT');
  }

  const rows = p.locator('select[id$="_row_select"]:visible').first();
  if (!(await rows.count())) throw new AppError('CONAPE_REPORT_ROWS_SELECTOR_MISSING', 'CONAPE no expuso el selector Rows.', 503, 'REPORT');
  const allText = (await rows.locator('option').allTextContents()).find(value => upper(value) === 'ALL');
  if (!allText) throw new AppError('CONAPE_REPORT_ROWS_ALL_MISSING', 'CONAPE no expuso Rows = All.', 503, 'REPORT');
  await rows.selectOption({ label:allText });
  await waitForApexDynamicAction(p);
  // selectOption dispara el change de APEX; su AJAX puede arrancar unas décimas
  // después de que jQuery.active todavía reporta 0. Dar margen antes de Go.
  await sleep(800);

  state = await readProspectReportContext(p);
  if (!state.pro_present || !state.eve_present ||
      (CONAPE_REPORT_PRO_ID && state.pro_matches_env !== true) ||
      (CONAPE_REPORT_EVE_ID && state.eve_matches_env !== true)) {
    throw new AppError('CONAPE_REPORT_CONTEXT_LOST_BEFORE_GO', 'CONAPE perdio el contexto antes de ejecutar Go.', 503, 'REPORT');
  }

  // SIFA 302:1 no materializa necesariamente el Interactive Report solo por
  // cambiar Rows. La secuencia real comprobada en navegador termina en Go.
  const reportGo = p.locator('button[id$="_search_button"]:visible').first();
  const roleGo = p.getByRole('button', { name:/^go$/i }).first();
  const goButton = (await reportGo.count()) ? reportGo : roleGo;
  if (!(await goButton.count())) {
    throw new AppError('CONAPE_REPORT_GO_MISSING', 'CONAPE no expuso el boton Go del reporte.', 503, 'REPORT');
  }
  await goButton.click({ timeout:5_000 });
  await waitForApexDynamicAction(p);

  let materialized = null;
  let lastCandidate = null;
  const rowsUntil = Date.now() + 12_000;
  while (Date.now() < rowsUntil) {
    const candidate = await readProspectListPage(p);
    lastCandidate = candidate;
    if (candidate?.ok === true && Array.isArray(candidate.rows) && candidate.rows.length > 0) {
      materialized = candidate;
      break;
    }
    await sleep(250);
  }
  materializedRows = materialized?.rows?.length || 0;
  if (materializedRows <= 0) {
    const shape = await p.evaluate(() => {
      const tables = [...document.querySelectorAll('table')];
      const rowSelect = document.querySelector('select[id$="_row_select"]');
      const rowText = String(rowSelect?.options?.[rowSelect.selectedIndex]?.text || '').trim();
      return {
        table_count:tables.length,
        max_tr:tables.reduce((m,t) => Math.max(m, t.querySelectorAll('tr').length), 0),
        max_th:tables.reduce((m,t) => Math.max(m, t.querySelectorAll('th').length), 0),
        rows_all:rowText.toUpperCase() === 'ALL',
      };
    }).catch(() => ({ table_count:0, max_tr:0, max_th:0, rows_all:false }));
    console.log(JSON.stringify({
      event:'conape_report_after_go_debug',
      version:VERSION,
      read_ok:lastCandidate?.ok === true,
      reason:txt(lastCandidate?.reason || 'NO_RESULT'),
      missing_count:Array.isArray(lastCandidate?.missing) ? lastCandidate.missing.length : 0,
      table_count:Number(shape.table_count || 0),
      max_tr:Number(shape.max_tr || 0),
      max_th:Number(shape.max_th || 0),
      rows_all:shape.rows_all === true,
      pro_matches_env:state.pro_matches_env,
      eve_matches_env:state.eve_matches_env,
      pii:false,
    }));
    throw new AppError('CONAPE_REPORT_EMPTY_AFTER_GO', 'CONAPE ejecuto Go pero no materializo filas del reporte.', 503, 'REPORT');
  }

  state = await readProspectReportContext(p);
  if (!state.pro_present || !state.eve_present || upper(state.rows) !== 'ALL') {
    throw new AppError('CONAPE_REPORT_CONTEXT_INCOMPLETE', 'CONAPE no confirmó Prospectador, Evento y Rows = All.', 503, 'REPORT');
  }

  console.log(JSON.stringify({
    event:'conape_report_context_ready',
    version:VERSION,
    source:'302:1',
    prospectador:true,
    evento:true,
    rows_all:true,
    selection_method:'POPUP_LOV_EXACT_CONTEXT_GO',
    materialized_rows:materializedRows,
    pro_matches_env:state.pro_matches_env,
    eve_matches_env:state.eve_matches_env,
    pii:false,
  }));

  return { sessionId, state };
}

async function readRowsAllSnapshot(p) {
  await ensureProspectReportContext(p);
  const loaded = await waitProspectListReady(p, 12_000);
  if (!loaded?.ok) {
    const error = new AppError('CONAPE_REPORT_SCHEMA_NOT_READY', 'CONAPE no expuso las columnas esperadas del reporte.', 503, 'REPORT');
    error.reason = txt(loaded?.reason || 'UNKNOWN');
    throw error;
  }
  const rows = normalizeProspectRows(loaded.rows).sort((a,b) => a.cedula.localeCompare(b.cedula));
  if (!rows.length) throw new AppError('CONAPE_REPORT_EMPTY', 'CONAPE no devolvió prospectos en el reporte.', 503, 'REPORT');
  if ((await prospectNextPageIndex(p)) >= 0) {
    throw new AppError('CONAPE_REPORT_ROWS_ALL_INCOMPLETE', 'Rows = All dejó paginación activa.', 503, 'REPORT');
  }
  return { rows, fingerprint:prospectSnapshotFingerprint(rows) };
}

// CONAPE Prospectación — recuperación de lectura contra sesión APEX caducada.
// La ruta es exclusivamente de lectura: nunca publica snapshots ni altera eventos.
// Si el primer intento falla, descartamos contexto/cookies/navegador y hacemos
// UNA lectura nueva. Cada intento exige dos lecturas completas concordantes.
async function readProspectRowsWithSessionRecovery() {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let step = 'BROWSER';
    try {
      const p = await ConapeSession.browserPage();
      step = 'FIRST_READ';
      const first = await readRowsAllSnapshot(p);
      step = 'RELOAD';
      await p.reload({ waitUntil:'domcontentloaded', timeout:30_000 });
      await waitForApexDynamicAction(p);
      step = 'SECOND_READ';
      const second = await readRowsAllSnapshot(p);
      return { first, second, recovery_used:attempt === 2 };
    } catch (error) {
      const safeCode = txt(error?.code || error?.name || 'UNEXPECTED')
        .toUpperCase().replace(/[^A-Z0-9_]/g, '_').slice(0, 64);
      console.log(JSON.stringify({
        event:'conape_prospectacion_read_failed',
        version:VERSION, step, attempt, code:safeCode,
        recovery:attempt === 1 ? 'FRESH_BROWSER_RETRY' : 'EXHAUSTED',
        pii:false,
      }));
      if (attempt === 2) {
        // No exponer stack, URL, sesión, credenciales ni texto externo al cliente.
        if (error instanceof AppError) throw error;
        throw new AppError('CONAPE_REPORT_READ_UNEXPECTED',
          'CONAPE no permitió completar la lectura del reporte.', 503, 'REPORT');
      }
      await ConapeSession.close().catch(() => {});
    }
  }
  throw new AppError('CONAPE_REPORT_READ_EXHAUSTED',
    'CONAPE no permitió completar el reporte.', 503, 'REPORT');
}

async function listProspectsFromHome() {
  const started = Date.now();
  const method = 'HTML_DOUBLE';
  const verificationMethod = 'ROWS_ALL_DOUBLE';
  const irFiltersBefore = 0;
  const rowsByCedula = new Map();
  let rowsA = null;
  let rowsB = null;
  let countsMatch = false;
  let columnsOk = false;
  let recoveryUsed = false;

  try {
    const { first, second, recovery_used } = await readProspectRowsWithSessionRecovery();
    recoveryUsed = recovery_used;

    rowsA = first.rows.length;
    rowsB = second.rows.length;
    countsMatch = rowsA === rowsB && first.fingerprint === second.fingerprint;
    if (!countsMatch) {
      const mismatch = new AppError('CONAPE_REPORT_DOUBLE_MISMATCH', 'Las dos lecturas completas de CONAPE no coincidieron.', 503, 'REPORT');
      mismatch.rows_a = rowsA;
      mismatch.rows_b = rowsB;
      throw mismatch;
    }

    addProspectRows(rowsByCedula, second.rows);
    columnsOk = rowsByCedula.size === rowsB && rowsB > 0;
    if (!columnsOk) {
      throw new AppError('CONAPE_REPORT_VERIFICATION_FAILED', 'La lectura completa de CONAPE no superó la verificación.', 503, 'REPORT');
    }

    ConapeSession.state = 'CONNECTED';
    ConapeSession.connectedAt = ConapeSession.connectedAt || nowIso();
    ConapeSession.lastActivity = nowIso();

    return {
      ok:true,
      code:'PROSPECT_LIST_READY',
      rows:[...rowsByCedula.values()].sort((a,b) => a.cedula.localeCompare(b.cedula)),
      row_count:rowsByCedula.size,
      pages:1,
      method,
      rows_a:rowsA,
      rows_b:rowsB,
      rows_csv:rowsA,
      rows_html_all:rowsB,
      counts_match:true,
      columns_ok:true,
      verification_method:verificationMethod,
      recovery_used:recoveryUsed,
      ms:Date.now() - started,
      ir_filters_before:irFiltersBefore,
      captured_at:nowIso(),
    };
  } finally {
    console.log(JSON.stringify({
      event:'conape_list_dump',
      method,
      rows:rowsByCedula.size,
      rows_a:rowsA,
      rows_b:rowsB,
      rows_csv:rowsA,
      rows_html_all:rowsB,
      counts_match:countsMatch,
      columns_ok:columnsOk,
      verification_method:verificationMethod,
      recovery_used:recoveryUsed,
      ms:Date.now() - started,
      ir_filters_before:irFiltersBefore,
      pii:false,
    }));
  }
}


async function publishProspectacionSnapshot(list) {
  if (!CAMPUS_URL) throw new AppError('CAMPUS_URL_MISSING', 'El backend del Campus no está configurado.', 503, 'CAMPUS');
  let signed;
  try {
    signed = buildConapeProspectacionV2SignedEnvelope(list);
  } catch (cause) {
    const error = new AppError('CONAPE_V2_SIGN_FAILED', 'No se pudo firmar el snapshot de Prospectación.', 503, 'PUBLISH');
    error.cause = cause;
    throw error;
  }

  let response;
  try {
    response = await fetch(CAMPUS_URL, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(signed.envelope),
      redirect:'follow',
      signal:AbortSignal.timeout(Math.max(10_000, REQUEST_TIMEOUT_MS)),
    });
  } catch (cause) {
    const error = new AppError('CAMPUS_PROSPECTACION_UNAVAILABLE', 'No se pudo publicar la actualización de Prospectación.', 503, 'PUBLISH');
    error.cause = cause;
    throw error;
  }

  const raw = await response.text();
  let data;
  try { data = JSON.parse(raw || '{}'); }
  catch {
    throw new AppError('CAMPUS_PROSPECTACION_INVALID_RESPONSE', 'El Campus devolvió una respuesta inválida al actualizar Prospectación.', 503, 'PUBLISH');
  }
  if (!response.ok || !data || data.ok !== true) {
    const code = txt(data?.error?.code || data?.error || data?.code || 'CAMPUS_PROSPECTACION_APPLY_FAILED');
    const error = new AppError(code, 'El Campus rechazó la actualización de Prospectación.', 503, 'PUBLISH');
    throw error;
  }
  return data;
}

async function refreshProspectacionVentas(body) {
  // Fast path: ticket firmado. Si no verifica, NO autoriza; obliga a pasar por
  // la validación Campus normal/caché. El ticket es optimización, no requisito.
  let ticketAuthorized = false;
  if (body?.refresh_ticket) {
    try {
      authorizeProspectRefreshTicket(body?.token, body.refresh_ticket);
      ticketAuthorized = true;
    } catch (ticketError) {
      console.log(JSON.stringify({
        event:'conape_refresh_ticket_fallback',
        version:VERSION,
        code:txt(ticketError?.code || 'TICKET_REJECTED'),
        pii:false,
      }));
    }
  }
  if (!ticketAuthorized) await authorizeCampusSessionStatus(body?.token);
  const list = await listProspectsFromHome();
  const applied = await publishProspectacionSnapshot(list);
  return {
    ok:true,
    code:'PROSPECTACION_VENTAS_REFRESHED',
    method:list.method,
    row_count:list.row_count,
    rows_a:list.rows_a,
    rows_b:list.rows_b,
    counts_match:list.counts_match === true,
    captured_at:list.captured_at,
    ultimo_sync:txt(applied.ultimo_sync || ''),
    nuevos:Number(applied.nuevos || 0),
    filas_actualizadas:Number(applied.filas_actualizadas || 0),
    movimientos_registrados:Number(applied.movimientos_registrados || 0),
  };
}


const SALES_STATUS_FIELDS = ['cedula','estado','fecha_estado','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];

function salesStatusRow(row) {
  const source = row && typeof row === 'object' ? row : {};
  return Object.fromEntries(SALES_STATUS_FIELDS.map(key => [key, key === 'cedula' ? digits(source[key]) : txt(source[key])]));
}

async function listProspectStatusesForSales(body) {
  const auth = await authorizeCampusSession(body?.token);
  const asesor = txt(body?.asesor || '');
  const snapshot = await campusCall({ fn:'getConapeProspectacionVentas', token:auth.token, asesor });
  if (!snapshot?.ok || !Array.isArray(snapshot?.rows)) {
    throw new AppError('CAMPUS_PROSPECTACION_SNAPSHOT_UNAVAILABLE', 'No se pudo leer el snapshot de Prospectación.', 503, 'CAMPUS');
  }
  const rows = snapshot.rows.map(salesStatusRow);
  return {
    ok:true,
    code:'PROSPECT_SALES_STATUS_READY',
    source:'CAMPUS_SNAPSHOT',
    row_count:rows.length,
    actualizado_en:txt(snapshot.actualizado_en || ''),
    edad_minutos:Number.isFinite(Number(snapshot.edad_minutos)) ? Number(snapshot.edad_minutos) : null,
    requiere_actualizacion:snapshot.requiere_actualizacion === true,
    rows,
  };
}


function categoryStatus(code) {
  if (code === 'SIN_PERMISO') return 403;
  if (code === 'YA_REGISTRADO') return 409;
  if (code === 'CAMPO_OBLIGATORIO' || code === 'DATO_INVALIDO') return 422;
  return 409;
}

function sanitizedStage(error) {
  const stage = upper(error?.stage || 'PRECHECK').replace(/[^A-Z0-9_]/g, '').slice(0, 32);
  return stage || 'PRECHECK';
}

async function preview(body) {
  const auth = await authorizeCampus(body?.token, body?.cedula);
  const { p, state, meta } = await lookupCedulaOnFreshPage(auth.cedula);
  const modeInfo = await readFormMode(p);
  const plan = contactPlan(auth.prospecto, state);
  const comparison = buildComparison(auth.prospecto, state, plan);
  enforceRecruitFormMode(modeInfo, comparison, plan);
  assertIdentityMatch(comparison);
  pruneState();
  const source_version = crypto.randomBytes(24).toString('base64url');
  sourceVersions.set(source_version, { cedula:auth.cedula, binding:auth.binding, identityHash:identityHash(state), expiresAt:Date.now()+SOURCE_TTL_MS, consumed:false });
  return { ok:true, code:'PREVIEW_READY', source_version, comparison, form_mode:'CREATE', meta:{ nav_mode:meta.navMode } };
}

async function submit(body) {
  const auth = await authorizeCampus(body?.token, body?.cedula);
  const sourceKey = txt(body?.source_version);
  const source = sourceVersions.get(sourceKey);
  if (!source) throw new AppError('SOURCE_VERSION_REQUIRED', 'Debe volver a consultar antes de enviar.', 409);
  if (source.consumed) throw new AppError('SOURCE_VERSION_USED', 'Esta consulta ya fue utilizada.', 409);
  if (source.expiresAt <= Date.now()) { sourceVersions.delete(sourceKey); throw new AppError('SOURCE_VERSION_EXPIRED', 'La consulta venció.', 409); }
  if (source.binding !== auth.binding) throw new AppError('SOURCE_VERSION_OWNER_MISMATCH', 'La consulta pertenece a otra sesión.', 403);
  source.consumed = true;
  try {
    const { p, state, meta } = await lookupCedulaOnFreshPage(auth.cedula);
    const modeInfo = await readFormMode(p);
    if (identityHash(state) !== source.identityHash) throw new AppError('IDENTITY_MISMATCH', 'La identidad cambió.', 409, 'BEFORE_CREATE');
    const plan = contactPlan(auth.prospecto, state);
    const comparison = buildComparison(auth.prospecto, state, plan);
    enforceRecruitFormMode(modeInfo, comparison, plan);
    assertIdentityMatch(comparison);
    await fillContacts(p, plan);
    const created = await clickFinalAction(p, 'CREATE');
    if (created.createCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud CREATE.', 409, 'AFTER_CREATE');
    const confirmation = await confirmAfterCreate(auth.cedula, meta.sessionId);
    if (confirmation.found) return { ok:true, confirmed:true, code:'CREATED', confirmation_found:true, confirmation_estado:upper(confirmation.estado), estado_conape_raw:confirmation.estado, confirmation_method:confirmation.confirmation_method };
    throw new AppError('WRITE_RESULT_UNCERTAIN', 'CREATE no quedó confirmado en CONAPE.', 409, 'CONFIRMATION');
  } finally {
    sourceVersions.delete(sourceKey);
  }
}

async function execute(body) {
  const started = Date.now();
  const timing = { campus:null, form:null, lookup:null, fill:null, create:null, confirmation:null };
  let finalCode = 'BRIDGE_ERROR';
  let finalStage = 'PRECHECK';
  let comparison = null;
  let navMode = null;
  let entryPath = '';
  let recruitClickFound = null;
  let navTelemetry = { nav_signed_eve:false, nav_signed_pro:false, nav_has_cs:false, nav_eve_matches_env:null, nav_pro_matches_env:null };
  let created = null;
  let confirmation = null;
  let formMode = 'UNKNOWN';
  let formReadonlyFields = [];
  let fillTelemetry = { attempted_fields:[], verified_fields:[], methods:[], skipped_fields:[], field_apex_readable:{}, fill_target_len:null, fill_readback_len:null, fill_match:null };
  let preActionTelemetry = { precreate_apex_values:{}, precreate_dom_values:{}, field_editable:{}, apex_readable:{} };
  let eventContextTelemetry = { eve_id_source:'NONE', eve_id_present:false, pro_id_source:'NONE', pro_id_present:false };
  let finalActionName = '';
  let formIncompleteIds = [];
  try {
    let t = Date.now();
    let auth;
    try {
      auth = await authorizeCampusParallel(body?.token, body?.cedula);
    } catch (error) {
      timing.campus = Date.now() - t;
      throw error;
    }
    timing.campus = Date.now() - t;

    t = Date.now();
    const { p, meta } = await ConapeSession.freshProspectoFromHome();
    navMode = meta.navMode;
    entryPath = txt(meta.entryPath || meta.navMode || '');
    recruitClickFound = typeof meta.recruitClickFound === 'boolean' ? meta.recruitClickFound : null;
    navTelemetry = {
      nav_signed_eve:meta.nav_signed_eve === true,
      nav_signed_pro:meta.nav_signed_pro === true,
      nav_has_cs:meta.nav_has_cs === true,
      nav_eve_matches_env:typeof meta.nav_eve_matches_env === 'boolean' ? meta.nav_eve_matches_env : null,
      nav_pro_matches_env:typeof meta.nav_pro_matches_env === 'boolean' ? meta.nav_pro_matches_env : null,
    };
    timing.form = Date.now() - t;

    t = Date.now();
    const state = await lookupCedulaOnPage(p, auth.cedula);
    timing.lookup = Date.now() - t;

    const modeInfo = await readFormMode(p);
    formMode = modeInfo.mode;
    formReadonlyFields = safeFormFields(modeInfo.fields);

    const plan = contactPlan(auth.prospecto, state);
    comparison = buildComparison(auth.prospecto, state, plan);
    if (formMode === 'UNKNOWN') enforceRecruitFormMode(modeInfo, comparison, plan);
    assertIdentityMatch(comparison);

    t = Date.now();
    try {
      const fillResult = await fillContacts(p, plan);
      fillTelemetry = fillResult.telemetry;
    } catch (error) {
      timing.fill = Date.now() - t;
      throw error;
    }
    timing.fill = Date.now() - t;

    t = Date.now();
    created = await clickFinalAction(p, formMode);
    timing.create = Date.now() - t;
    finalActionName = created.final_action;
    eventContextTelemetry = created.event_context_telemetry || eventContextTelemetry;
    preActionTelemetry = {
      precreate_apex_values:created.precreate_apex_values || {},
      precreate_dom_values:created.precreate_dom_values || {},
      field_editable:created.field_editable || {},
      apex_readable:created.apex_readable || {},
    };
    if (created.actionCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud final. No repita el envío.', 409, 'AFTER_ACTION');

    t = Date.now();
    confirmation = await confirmAfterCreate(auth.cedula, meta.sessionId);
    timing.confirmation = Date.now() - t;

    const categories = created.outcome?.categories || [];
    if (formMode === 'CREATE' && categories.includes('YA_REGISTRADO')) throw Object.assign(new AppError('YA_REGISTRADO', 'CONAPE indicó que el prospecto ya estaba registrado.', 409, 'CONFIRMATION'), { comparison, confirmation });
    if (confirmation.found) {
      finalCode = formMode === 'UPDATE' ? 'UPDATED' : 'CREATED';
      finalStage = 'CONFIRMED';
      return { ok:true, confirmed:true, code:finalCode, stage:'CONFIRMED', form_mode:formMode, final_action:finalActionName, confirmation_found:true, confirmation_estado:upper(confirmation.estado), estado_conape_raw:confirmation.estado, confirmation_method:confirmation.confirmation_method, confirmation_form_mode:confirmation.form_mode, comparison, timing:{ ...timing, action:timing.create, total:Date.now()-started } };
    }
    const meaningful = categories.find(code => code !== 'ERROR_DE_PORTAL' && code !== 'ALERTA_NO_CLASIFICADA');
    if (meaningful) throw Object.assign(new AppError(meaningful, 'CONAPE rechazó la acción final.', categoryStatus(meaningful), 'AFTER_ACTION'), { comparison, confirmation });
    throw Object.assign(new AppError('WRITE_RESULT_UNCERTAIN', 'La acción final fue enviada, pero no quedó confirmada en CONAPE. No repita el envío.', 409, 'CONFIRMATION'), { comparison, confirmation });
  } catch (error) {
    finalCode = txt(error?.code || finalCode || 'BRIDGE_ERROR');
    finalStage = sanitizedStage(error);
    if (error?.fill_telemetry) fillTelemetry = error.fill_telemetry;
    if (error?.preaction_telemetry) preActionTelemetry = error.preaction_telemetry;
    if (error?.event_context_telemetry) eventContextTelemetry = error.event_context_telemetry;
    if (Array.isArray(error?.empty_field_ids)) formIncompleteIds = error.empty_field_ids;
    if (error?.form_mode) formMode = txt(error.form_mode);
    if (Array.isArray(error?.form_readonly_fields)) formReadonlyFields = error.form_readonly_fields;
    if (comparison && !error?.comparison) error.comparison = comparison;
    error.execute_timing = { ...timing, total:Date.now()-started };
    throw error;
  } finally {
    console.log(JSON.stringify({
      event:'conape_execute_telemetry', version:VERSION, code:finalCode, stage:finalStage,
      ms_total:Date.now()-started, ms_campus:timing.campus, ms_form:timing.form, ms_lookup:timing.lookup, ms_fill:timing.fill, ms_create:timing.create, ms_confirmation:timing.confirmation,
      nav_mode:navMode, entry_path:entryPath, recruit_click_found:recruitClickFound,
      nav_signed_eve:navTelemetry.nav_signed_eve === true, nav_signed_pro:navTelemetry.nav_signed_pro === true, nav_has_cs:navTelemetry.nav_has_cs === true,
      nav_eve_matches_env:navTelemetry.nav_eve_matches_env, nav_pro_matches_env:navTelemetry.nav_pro_matches_env,
      form_mode:formMode, form_readonly_fields:formReadonlyFields,
      eve_id_source:eventContextTelemetry.eve_id_source || 'NONE', eve_id_present:eventContextTelemetry.eve_id_present === true,
      pro_id_source:eventContextTelemetry.pro_id_source || 'NONE', pro_id_present:eventContextTelemetry.pro_id_present === true,
      create_body_keys:created?.request?.body_keys || [], page_item_ids:created?.page_item_ids || [], apex_http_status:Number(created?.request?.status || 0) || null,
      alerts_before:created?.alerts_before || [], visible_alerts:created?.outcome?.categories || [], alert_dom_ids:created?.outcome?.alert_dom_ids || [], apex_error_item_ids:created?.outcome?.apex_error_item_ids || [], alert_text_sanitized:created?.outcome?.alert_text_sanitized || '',
      final_action:txt(finalActionName || created?.final_action || ''), action_count:Number(created?.actionCount || 0), create_count:Number(created?.createCount || 0), update_count:Number(created?.updateCount || 0),
      precreate_apex_values:preActionTelemetry.precreate_apex_values || {}, precreate_dom_values:preActionTelemetry.precreate_dom_values || {}, apex_readable:preActionTelemetry.apex_readable || {}, field_editable:preActionTelemetry.field_editable || {},
      confirmation_found:!!confirmation?.found, confirmation_estado:upper(confirmation?.estado || ''),
      confirmation_method:txt(confirmation?.confirmation_method || ''), confirmation_form_mode:txt(confirmation?.form_mode || ''), confirmation_readonly_fields:safeFormFields(confirmation?.form_readonly_fields),
      ir_filters_before:Number(confirmation?.ir_filters_before || 0), ir_filters_after:Number(confirmation?.ir_filters_after || 0), ir_reset_method:txt(confirmation?.ir_reset_method || 'NONE'), pages_scanned:Number(confirmation?.pages_scanned || 0), rows_scanned:Number(confirmation?.rows_scanned || 0),
      fill_attempted_fields:fillTelemetry.attempted_fields || [], fill_verified_fields:fillTelemetry.verified_fields || [], fill_methods:fillTelemetry.methods || [],
      skipped_fields:fillTelemetry.skipped_fields || [], field_apex_readable:fillTelemetry.field_apex_readable || {},
      fill_target_len:fillTelemetry.fill_target_len ?? null, fill_readback_len:fillTelemetry.fill_readback_len ?? null, fill_match:fillTelemetry.fill_match ?? null,
      form_incomplete_ids:formIncompleteIds, pii:false,
    }));
  }
}

function corsHeaders(origin) {
  return origin && ALLOWED_ORIGINS.has(origin) ? { 'Access-Control-Allow-Origin':origin, 'Vary':'Origin', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Campus-Token', 'Access-Control-Max-Age':'600' } : {};
}

function sendJson(res, status, data, origin = '') {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':Buffer.byteLength(body), 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'no-referrer', ...corsHeaders(origin) });
  res.end(body);
}

function readJson(req, max = 32_768) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > max) { reject(new AppError('BODY_TOO_LARGE', 'Solicitud demasiado grande.', 413)); req.destroy(); return; } chunks.push(chunk); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new AppError('BAD_JSON', 'JSON inválido.', 400)); } });
    req.on('error', reject);
  });
}

function campusTokenFromRequest(req) {
  const authorization = txt(req.headers.authorization);
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  return txt((bearer && bearer[1]) || req.headers['x-campus-token'] || '');
}

const server = http.createServer(async (req, res) => {
  const rid = crypto.randomBytes(8).toString('hex');
  const started = Date.now();
  const origin = txt(req.headers.origin);
  let action = 'unknown';
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok:true, service:'CONAPE_PORTAL_BRIDGE', version:VERSION, commit:process.env.RAILWAY_GIT_COMMIT_SHA || null, started_at:STARTED_AT, time:nowIso() });
      return;
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) throw new AppError('ORIGIN_FORBIDDEN', 'Origen no autorizado.', 403);
    if (req.method === 'OPTIONS') {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) throw new AppError('ORIGIN_FORBIDDEN', 'Origen no autorizado.', 403);
      res.writeHead(204, corsHeaders(origin)); res.end(); return;
    }
    if (req.method === 'GET' && url.pathname === '/v1/selftest/nav') {
      action = 'selftest_nav';
      await authorizeCampusSession(campusTokenFromRequest(req));
      const result = await serial(() => runNavSelftest());
      console.log(JSON.stringify({ rid, action, result:'OK', ms:Date.now()-started, pii:false }));
      sendJson(res, 200, result, origin);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/v1/prospects/v44-publisher-preview') {
      action = 'v44_publisher_preview';
      const auth = await authorizeCampusSession(campusTokenFromRequest(req));
      const previewRole = roleOf(auth.session);
      if (!['ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN'].includes(previewRole)) {
        throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para preparar el publisher de Prospectación.', 403, 'CAMPUS');
      }
      const result = await serial(() => listProspectsFromHome());
      const signed = buildConapeProspectacionV2SignedEnvelope(result);
      const payload = {
        ok:true,
        code:'CONAPE_PROSPECTACION_V2_PUBLISHER_READY',
        action:signed.meta.action,
        method:result.method,
        rows_a:result.rows_a,
        rows_b:result.rows_b,
        row_count:result.row_count,
        counts_match:result.counts_match === true,
        columns_ok:result.columns_ok === true,
        captured_at:result.captured_at,
        apply_enabled:true,
      };
      console.log(JSON.stringify({ rid, action, result:payload.code, method:payload.method, rows_a:payload.rows_a, rows_b:payload.rows_b, counts_match:payload.counts_match, columns_ok:payload.columns_ok, apply_enabled:true, ms:Date.now()-started, pii:false }));
      sendJson(res, 200, payload, origin);
      return;
    }
    if (req.method === 'GET' && url.pathname === '/v1/prospects/list') {
      action = 'prospects_list';
      const auth = await authorizeCampusSession(campusTokenFromRequest(req));
      const fullListRole = roleOf(auth.session);
      if (!['ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN'].includes(fullListRole)) {
        throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para la lista completa de CONAPE.', 403, 'CAMPUS');
      }
      const result = await serial(() => listProspectsFromHome());
      const summaryOnly = /^(1|true)$/i.test(txt(url.searchParams.get('summary')));
      const payload = summaryOnly ? {
        ok:true, code:result.code, method:result.method, rows_csv:result.rows_csv, rows_html_all:result.rows_html_all,
        counts_match:result.counts_match === true, columns_ok:result.columns_ok === true,
        ms:Number(result.ms || 0), ir_filters_before:Number(result.ir_filters_before || 0),
      } : result;
      sendJson(res, 200, payload, origin);
      return;
    }
    if (req.method !== 'POST') throw new AppError('METHOD_NOT_ALLOWED', 'Método no permitido.', 405);
    const body = await readJson(req);
    if (url.pathname === '/v1/session/status') action = 'session_status';
    else if (url.pathname === '/v1/session/connect') action = 'session_connect';
    else if (url.pathname === '/v1/session/disconnect') action = 'session_disconnect';
    else if (url.pathname === '/v1/prospects/sales-status') action = 'prospects_sales_status';
    else if (url.pathname === '/v1/prospects/refresh') action = 'prospects_refresh';
    else if (url.pathname === '/v1/recruit/preview') action = 'preview';
    else if (url.pathname === '/v1/recruit/submit') action = 'submit';
    else if (url.pathname === '/v1/recruit/execute') action = 'execute';
    else throw new AppError('NOT_FOUND', 'Ruta no encontrada.', 404);

    let result;
    if (action === 'session_status') { await authorizeCampusSessionStatus(body?.token); result = ConapeSession.snapshot({ ready:ConapeSession.state === 'CONNECTED' ? 'MEMORY' : null }); }
    else if (action === 'session_connect') { await authorizeCampusSession(body?.token); result = await serial(() => ConapeSession.connect()); }
    else if (action === 'session_disconnect') { await authorizeCampusSession(body?.token); result = await serial(async () => { await ConapeSession.close(); return ConapeSession.snapshot({ ready:null }); }); }
    else if (action === 'prospects_sales_status') result = await serial(() => listProspectStatusesForSales(body));
    else if (action === 'prospects_refresh') result = await serial(() => refreshProspectacionVentas(body));
    else if (action === 'preview') result = await serial(() => preview(body));
    else if (action === 'submit') result = await serial(() => submit(body));
    else result = await serial(() => execute(body));

    if (action !== 'execute') console.log(JSON.stringify({ rid, action, result:result.code || result.status || 'OK', ms:Date.now()-started, pii:false }));
    sendJson(res, 200, result, origin);
  } catch (error) {
    const status = Number(error?.status || 500);
    const code = txt(error?.code || 'BRIDGE_ERROR');
    const stage = sanitizedStage(error);
    const campusBusy = error?.campus_busy === true;
    if (action !== 'execute') console.log(JSON.stringify({ rid, action, result:code, stage, status, ms:Date.now()-started, pii:false }));
    sendJson(res, status, {
      ok:false, error:code, code, stage,
      message:campusBusy ? 'El Campus está ocupado, probá de nuevo en unos segundos.' : (status >= 500 ? 'Servicio CONAPE temporalmente no disponible.' : txt(error?.message || 'Operación rechazada.')),
      ...(campusBusy ? { campus_busy:true, retryable:true } : {}),
      ...(error?.comparison ? { comparison:error.comparison } : {}),
      ...(error?.confirmation ? { confirmation:error.confirmation } : {}),
      ...(Array.isArray(error?.empty_field_ids) ? { empty_field_ids:error.empty_field_ids } : {}),
      ...(error?.execute_timing ? { timing:error.execute_timing } : {}),
      ...(error?.form_mode ? { form_mode:error.form_mode } : {}),
      ...(Array.isArray(error?.form_readonly_fields) ? { form_readonly_fields:error.form_readonly_fields } : {}),
      ...(error?.apply_changes_available === true ? { apply_changes_available:true } : {}),
      ...(typeof error?.phone_update_available === 'boolean' ? { phone_update_available:error.phone_update_available } : {}),
      ...(Number.isInteger(error?.rows_csv) ? { rows_csv:error.rows_csv } : {}),
      ...(Number.isInteger(error?.rows_html_all) ? { rows_html_all:error.rows_html_all } : {}),
      ...(typeof error?.counts_match === 'boolean' ? { counts_match:error.counts_match } : {}),
      ...(typeof error?.columns_ok === 'boolean' ? { columns_ok:error.columns_ok } : {}),
      ...(error?.method ? { method:txt(error.method) } : {}),
      ...(Number.isFinite(Number(error?.ms)) ? { ms:Number(error.ms) } : {}),
      ...(Number.isFinite(Number(error?.ir_filters_before)) ? { ir_filters_before:Number(error.ir_filters_before) } : {}),
    }, origin);
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(JSON.stringify({ event:'bridge_ready', version:VERSION, port:PORT, clean_runtime:true, pii:false })));

async function shutdown() {
  try { await ConapeSession.close(); } catch {}
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { safeBodyKeys, safeRequestToken, contactPlan, sanitizedStage, buildComparison };
