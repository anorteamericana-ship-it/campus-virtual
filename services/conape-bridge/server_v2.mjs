import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const VERSION = 'V4.1.2';
const PORT = Number(process.env.PORT || 8080);
const CAMPUS_URL = String(process.env.CAMPUS_APPS_SCRIPT_URL || '').trim();
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const CONAPE_FRIENDLY_HOME = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home';
const CONAPE_FRIENDLY_PROSPECTO = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/prospecto';
const CONAPE_USER = String(process.env.CONAPE_PORTAL_USERNAME || '').trim();
const CONAPE_PASSWORD = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70_000));
const SESSION_CACHE_TTL_MS = 30_000;
const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));
const STARTED_AT = new Date().toISOString();
const ALLOWED_ORIGINS = new Set(String(process.env.CAMPUS_ALLOWED_ORIGINS || 'https://anorteamerican.com,https://www.anorteamerican.com,https://anorteamericana-ship-it.github.io').split(',').map(v => v.trim()).filter(Boolean));
const ROLE_ALLOW = new Set(['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN']);
const sessionValidationCache = new Map();
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

async function campusRequest(payload) {
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
      signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    const error = new AppError('CAMPUS_BACKEND_UNAVAILABLE', 'El Campus está ocupado, probá de nuevo en unos segundos.', 503, 'CAMPUS');
    error.fn = fn;
    error.campus_busy = true;
    error.retryable = fn === 'validarSesion';
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
    error.retryable = fn === 'validarSesion' && error.campus_busy;
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
  try {
    return await campusRequest(payload);
  } catch (error) {
    if (payload?.fn === 'validarSesion' && error?.retryable === true) {
      await sleep(3_000);
      return campusRequest(payload);
    }
    throw error;
  }
}

async function cachedSessionValidation(cleanToken) {
  pruneState();
  const key = sha(cleanToken);
  const cached = sessionValidationCache.get(key);
  if (cached && cached.expiresAt > Date.now() && cached.session?.ok === true) return cached.session;
  const session = await campusCall({ fn:'validarSesion', token:cleanToken });
  if (session?.ok === true) sessionValidationCache.set(key, { session, expiresAt:Date.now() + SESSION_CACHE_TTL_MS });
  return session;
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
  const deadline = Date.now() + 15_000;
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
      const path = decodeURIComponent(location.pathname || '').toLowerCase();
      const route = path.includes('/prospectacion-reclutador/') || (path.includes('/prospectaci') && path.includes('reclutador'));
      return { password, form, route, authenticated:!password && (form || route) };
    }).catch(() => ({ password:false, form:false, route:false, authenticated:false }));
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
    return this.snapshot({ ready:s.form ? 'PROSPECTO' : 'HOME' });
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
    return this.snapshot({ ready:state.form ? 'PROSPECTO' : 'HOME' });
  },

  async freshProspectoFromHome() {
    const p = await this.browserPage();
    await this.login(p);
    let sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'FORM');

    // Camino principal: formulario fresco por URL /prospecto con la misma sesión APEX.
    await p.goto(urlWithSession(CONAPE_FRIENDLY_PROSPECTO, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    let until = Date.now() + 10_000;
    while (Date.now() < until) {
      if (await this.formReady(p)) {
        const meta = { sessionId, navMode:'DIRECT_URL' };
        const contextTelemetry = { event:'conape_prospecto_context', gate:false, session_param_present:true, pii:false };
        void contextTelemetry;
        this.state = 'CONNECTED';
        this.lastActivity = nowIso();
        return { p, meta };
      }
      await sleep(200);
    }

    // Alternativa no bloqueante: si la URL directa no renderiza, intentar Home -> Reclutar.
    try {
      await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
      if (await clickVisibleByLabel(p, /(^| )RECLUTAR( |$)/i)) {
        until = Date.now() + 8_000;
        while (Date.now() < until) {
          if (await this.formReady(p)) {
            sessionId = (await readApexSession(p)) || sessionId;
            const meta = { sessionId, navMode:'HOME_BUTTON_FALLBACK' };
            this.state = 'CONNECTED';
            this.lastActivity = nowIso();
            return { p, meta };
          }
          await sleep(200);
        }
      }
    } catch {}
    throw new AppError('CONAPE_FORM_NOT_READY', 'CONAPE no dejó listo el formulario de Prospecto.', 409, 'FORM');
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
    const alerts = Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
    const text = norm(alerts.map(n => n.textContent || '').join(' '));
    const categories = [];
    if (/YA FUE REGISTRAD|YA SE ENCUENTRA|YA EXIST|DUPLIC|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(text)) categories.push('YA_REGISTRADO');
    if (/OBLIGATOR|REQUERID|DEBE INGRESAR|DEBE COMPLETAR/.test(text)) categories.push('CAMPO_OBLIGATORIO');
    if (/INVALID|NO ES VALIDO|FORMATO|NO CORRESPONDE/.test(text)) categories.push('DATO_INVALIDO');
    if (/NO AUTORIZAD|SIN PERMISO|NO TIENE ACCESO/.test(text)) categories.push('SIN_PERMISO');
    if (!categories.length && /ERROR|NO SE PUDO|NO FUE POSIBLE/.test(text)) categories.push('ERROR_DE_PORTAL');
    if (!categories.length && text) categories.push('ALERTA_NO_CLASIFICADA');
    return {
      cedula:val('P2_PRS_CEDULA'), apellido_1:val('P2_PRS_APELLIDO_1'), apellido_2:val('P2_PRS_APELLIDO_2'), nombre:val('P2_PRS_NOMBRE'),
      telefono:val('P2_PRS_CELULAR'), correo:val('P2_PRS_EMAIL'), categories,
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
    update_telefono:digits(conape.telefono).slice(-8) !== phone,
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

async function writeContactField(p, id, value) {
  const target = txt(value);
  const targetNorm = normalizeContactField(id, target);
  const locator = p.locator(`#${id}`).first();
  let method = 'FILL';
  let attempted = false;
  let readback = { domValue:'', apexValue:'', apexReadable:false };

  try {
    if (!(await locator.count())) throw new Error('FIELD_NOT_FOUND');
    attempted = true;
    await locator.fill(target, { timeout:5_000 });
    await locator.blur({ timeout:5_000 });
    await waitForApexDynamicAction(p);
    readback = await readContactFieldState(p, id);
  } catch {}

  let match = normalizeContactField(id, readback.domValue) === targetNorm && (!readback.apexReadable || normalizeContactField(id, readback.apexValue) === targetNorm);
  if (!match) {
    method = 'APEX_SETVALUE';
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
      await locator.focus({ timeout:5_000 }).catch(() => {});
      await locator.blur({ timeout:5_000 }).catch(() => {});
      await waitForApexDynamicAction(p);
      readback = await readContactFieldState(p, id);
      match = normalizeContactField(id, readback.domValue) === targetNorm && (!readback.apexReadable || normalizeContactField(id, readback.apexValue) === targetNorm);
    }
  }

  const result = {
    field:id,
    attempted,
    verified:match,
    method,
    target_len:target.length,
    readback_len:String(readback.domValue || '').length,
    match,
  };
  if (!match) {
    const error = new AppError('CONTACT_WRITE_FAILED', 'CONAPE no confirmó la escritura del contacto.', 422, 'FILL');
    error.fill_telemetry = {
      attempted_fields:attempted ? [id] : [], verified_fields:[], methods:[method],
      fill_target_len:result.target_len, fill_readback_len:result.readback_len, fill_match:false,
    };
    throw error;
  }
  return result;
}

async function fillContacts(p, plan) {
  const results = [];
  try {
    if (plan.update_telefono) results.push(await writeContactField(p, 'P2_PRS_CELULAR', plan.telefono));
    if (plan.update_correo) results.push(await writeContactField(p, 'P2_PRS_EMAIL', plan.correo));
  } catch (error) {
    const prior = results;
    const failure = error?.fill_telemetry || {};
    error.fill_telemetry = {
      attempted_fields:[...prior.filter(r => r.attempted).map(r => r.field), ...(failure.attempted_fields || [])],
      verified_fields:[...prior.filter(r => r.verified).map(r => r.field), ...(failure.verified_fields || [])],
      methods:[...prior.map(r => r.method), ...(failure.methods || [])],
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
      fill_target_len:last?.target_len ?? null,
      fill_readback_len:last?.readback_len ?? null,
      fill_match:last?.match ?? null,
    },
  };
}

async function assertPreCreateFields(p) {
  const missing = await p.evaluate(() => ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].filter(id => !String(document.getElementById(id)?.value || '').trim())).catch(() => ['FORM']);
  if (missing.length) {
    const error = new AppError('FORM_INCOMPLETE_BEFORE_CREATE', 'El formulario quedó incompleto antes de CREATE.', 422, 'BEFORE_CREATE');
    error.empty_field_ids = missing;
    throw error;
  }
  return [];
}

async function collectPageItemIds(p) {
  return p.evaluate(() => Array.from(document.querySelectorAll('[id]')).map(el => String(el.id || '')).filter(id => /^P[0-9]_/.test(id) && /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(id)).slice(0,120)).catch(() => []);
}

async function clickCreateOnce(p) {
  await assertPreCreateFields(p);
  const page_item_ids = await collectPageItemIds(p);
  const createRequests = [];
  const onRequest = req => {
    try {
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const raw = String(req.postData() || '');
      if (safeRequestToken(raw) !== 'CREATE') return;
      createRequests.push({ body_keys:safeBodyKeys(raw), status:null });
    } catch {}
  };
  const onResponse = response => {
    try {
      const req = response.request();
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      if (safeRequestToken(String(req.postData() || '')) !== 'CREATE') return;
      const hit = createRequests.find(item => item.status == null);
      if (hit) hit.status = response.status();
    } catch {}
  };
  p.on('request', onRequest);
  p.on('response', onResponse);
  try {
    if (!(await clickVisibleByLabel(p, /CREAR NUEVO PROSPECTO/i))) throw new AppError('CREATE_BUTTON_NOT_FOUND', 'No se encontró Crear nuevo Prospecto.', 409, 'CREATE');
    const until = Date.now() + 10_000;
    let state = await readFormState(p);
    while (Date.now() < until) {
      if (createRequests.length && (createRequests[0].status != null || state.categories.length || state.success_signal || state.form_reset)) break;
      await sleep(250);
      state = await readFormState(p);
    }
    return { createCount:createRequests.length, outcome:state, request:createRequests[0] || null, page_item_ids };
  } finally {
    p.off('request', onRequest);
    p.off('response', onResponse);
  }
}

async function confirmInHome(p, sessionId, cedula) {
  await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
  const search = p.locator('input[type="search"]:visible,input[id$="_search_field"]:visible').first();
  if (await search.count()) {
    await search.fill(cedula);
    const go = p.getByRole('button', { name:/^go$|buscar|search/i }).first();
    if (await go.count()) await go.click(); else await search.press('Enter');
    await sleep(900);
  }
  return p.evaluate(value => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const clean = v => String(v || '').replace(/\D/g,'');
    for (const table of Array.from(document.querySelectorAll('table'))) {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => norm(th.textContent));
      const iCedula = headers.findIndex(h => h.includes('CEDULA'));
      const iEstado = headers.findIndex(h => h === 'ESTADO');
      if (iCedula < 0 || iEstado < 0) continue;
      for (const tr of Array.from(table.querySelectorAll('tbody tr'))) {
        const cells = Array.from(tr.querySelectorAll('td'));
        if (cells.length <= Math.max(iCedula, iEstado)) continue;
        if (clean(cells[iCedula].textContent) === value) {
          const estado = String(cells[iEstado].textContent || '').trim();
          return { found:true, estado };
        }
      }
    }
    return { found:false, estado:'' };
  }, cedula).catch(() => ({ found:false, estado:'' }));
}

async function readProspectListPage(p) {
  return p.evaluate(() => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    const text = v => String(v || '').replace(/\s+/g,' ').trim();
    const aliases = new Map([
      ['CEDULA','cedula'],['PRIMER_APELLIDO','apellido_1'],['SEGUNDO_APELLIDO','apellido_2'],['NOMBRE','nombre'],
      ['TELEFONO_CELULAR','telefono'],['TELEFONO','telefono'],['CORREO_ELECTRONICO','correo'],['CORREO','correo'],
      ['ESTADO','estado'],['FECHA_DE_ESTADO','fecha_estado'],['FECHA_ESTADO','fecha_estado'],['FECHA_DE_REGISTRO','fecha_registro'],['FECHA_REGISTRO','fecha_registro'],
      ['USUARIO_QUE_REGISTRO','usuario_registro'],['USUARIO_REGISTRO','usuario_registro'],['APROBACION','aprobacion'],['FORMALIZACION','formalizacion'],
      ['ULTIMO_DESEMBOLSO','ultimo_desembolso'],['PROXIMO_DESEMBOLSO','proximo_desembolso'],
    ]);
    const required = ['cedula','apellido_1','apellido_2','nombre','telefono','correo','estado','fecha_estado','fecha_registro','usuario_registro','aprobacion','formalizacion','ultimo_desembolso','proximo_desembolso'];
    let best = null;
    for (const table of Array.from(document.querySelectorAll('table'))) {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => aliases.get(norm(th.textContent)) || null);
      const score = required.filter(key => headers.includes(key)).length;
      if (!best || score > best.score) best = { table, headers, score };
    }
    if (!best || best.score < 2) return { ok:false, reason:'REPORT_NOT_FOUND', missing:required, rows:[] };
    const missing = required.filter(key => !best.headers.includes(key));
    if (missing.length) return { ok:false, reason:'REQUIRED_COLUMN_MISSING', missing, rows:[] };
    const rows = [];
    for (const tr of Array.from(best.table.querySelectorAll('tbody tr'))) {
      const cells = Array.from(tr.querySelectorAll('td'));
      if (!cells.length || (cells.length === 1 && cells[0].hasAttribute('colspan'))) continue;
      const row = Object.fromEntries(required.map(key => [key,'']));
      for (let i = 0; i < best.headers.length; i += 1) {
        const key = best.headers[i];
        if (key && cells[i]) row[key] = text(cells[i].textContent);
      }
      if (Object.values(row).some(Boolean)) rows.push(row);
    }
    return { ok:true, missing:[], rows };
  }).catch(() => ({ ok:false, reason:'REPORT_READ_FAILED', missing:[], rows:[] }));
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
    await sleep(700);
    return true;
  }
  const actions = p.getByRole('button', { name:/actions|acciones/i }).first();
  if (!(await actions.count())) return false;
  try {
    await actions.click({ timeout:5_000 });
    await sleep(150);
    const rowsMenu = p.getByRole('menuitem', { name:/rows per page|filas por p[aá]gina|filas/i }).first();
    if (!(await rowsMenu.count())) return false;
    await rowsMenu.click({ timeout:5_000 });
    await sleep(150);
    const menuItems = p.locator('[role="menuitem"]:visible,.a-Menu-content .a-Menu-label:visible');
    const index = await menuItems.evaluateAll(nodes => {
      let best = null;
      for (let i = 0; i < nodes.length; i += 1) {
        const label = String(nodes[i].textContent || '').trim();
        const n = Number(label.replace(/[^0-9]/g,''));
        if (!Number.isFinite(n) || n <= 0) continue;
        if (!best || n > best.n) best = { index:i, n };
      }
      return best?.index ?? -1;
    }).catch(() => -1);
    if (index < 0) return false;
    await menuItems.nth(index).click({ timeout:5_000 });
    await sleep(700);
    return true;
  } catch {
    return false;
  }
}

async function clickProspectNextPage(p) {
  const controls = p.locator('a,button');
  const index = await controls.evaluateAll(nodes => {
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const reportRegion = el => el.closest('.a-IRR,.a-IRR-region,.t-Region');
    const hasProspectTable = region => Array.from((region || document).querySelectorAll('table')).some(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => norm(th.textContent));
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
  if (index < 0) return false;
  await controls.nth(index).click({ timeout:10_000 });
  return true;
}

async function listProspectsFromHome() {
  const started = Date.now();
  let pages = 0;
  const rowsByCedula = new Map();
  try {
    const p = await ConapeSession.browserPage();
    await ConapeSession.login(p);
    const sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'LIST');
    await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    await maximizeProspectRows(p);
    const pageFingerprints = new Set();
    for (let guard = 0; guard < 100; guard += 1) {
      const snapshot = await readProspectListPage(p);
      if (!snapshot.ok) throw new AppError('CONAPE_LIST_SCHEMA_NOT_READY', `La lista CONAPE no expuso el esquema esperado: ${snapshot.reason || 'UNKNOWN'}.`, 503, 'LIST');
      const normalizedRows = snapshot.rows.map(row => ({ ...row, cedula:digits(row.cedula) })).filter(row => !!row.cedula);
      const fingerprint = sha(normalizedRows.map(row => row.cedula).join('|'));
      if (pageFingerprints.has(fingerprint)) break;
      pageFingerprints.add(fingerprint);
      pages += 1;
      for (const row of normalizedRows) {
        const previous = rowsByCedula.get(row.cedula);
        if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw new AppError('CONAPE_LIST_DUPLICATE_CEDULA', 'CONAPE devolvió una cédula duplicada con datos distintos.', 409, 'LIST');
        rowsByCedula.set(row.cedula, row);
      }
      const moved = await clickProspectNextPage(p);
      if (!moved) break;
      const until = Date.now() + 10_000;
      let changed = false;
      while (Date.now() < until) {
        await sleep(250);
        const next = await readProspectListPage(p);
        if (!next.ok) continue;
        const nextFingerprint = sha(next.rows.map(row => digits(row.cedula)).filter(Boolean).join('|'));
        if (nextFingerprint !== fingerprint) { changed = true; break; }
      }
      if (!changed) throw new AppError('CONAPE_LIST_PAGINATION_STALLED', 'La paginación de CONAPE no avanzó.', 503, 'LIST');
    }
    ConapeSession.state = 'CONNECTED';
    ConapeSession.lastActivity = nowIso();
    return { ok:true, code:'PROSPECT_LIST_READY', rows:[...rowsByCedula.values()], pages, captured_at:nowIso() };
  } finally {
    console.log(JSON.stringify({ event:'conape_list_dump', rows:rowsByCedula.size, pages, ms:Date.now()-started, pii:false }));
  }
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
  const { state, meta } = await lookupCedulaOnFreshPage(auth.cedula);
  const plan = contactPlan(auth.prospecto, state);
  const comparison = buildComparison(auth.prospecto, state, plan);
  assertIdentityMatch(comparison);
  pruneState();
  const source_version = crypto.randomBytes(24).toString('base64url');
  sourceVersions.set(source_version, { cedula:auth.cedula, binding:auth.binding, identityHash:identityHash(state), expiresAt:Date.now()+SOURCE_TTL_MS, consumed:false });
  return { ok:true, code:'PREVIEW_READY', source_version, comparison, meta:{ nav_mode:meta.navMode } };
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
    if (identityHash(state) !== source.identityHash) throw new AppError('IDENTITY_MISMATCH', 'La identidad cambió.', 409, 'BEFORE_CREATE');
    const plan = contactPlan(auth.prospecto, state);
    await fillContacts(p, plan);
    const created = await clickCreateOnce(p);
    if (created.createCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud CREATE.', 409, 'AFTER_CREATE');
    const confirmation = await confirmInHome(p, meta.sessionId, auth.cedula);
    if (confirmation.found) return { ok:true, confirmed:true, code:'CREATED', confirmation_found:true, confirmation_estado:upper(confirmation.estado), estado_conape_raw:confirmation.estado };
    throw new AppError('WRITE_RESULT_UNCERTAIN', 'CREATE no quedó confirmado en la lista.', 409, 'CONFIRMATION');
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
  let created = null;
  let confirmation = null;
  let fillTelemetry = { attempted_fields:[], verified_fields:[], methods:[], fill_target_len:null, fill_readback_len:null, fill_match:null };
  let formIncompleteIds = [];
  try {
    let t = Date.now();
    const auth = await authorizeCampusParallel(body?.token, body?.cedula);
    timing.campus = Date.now() - t;

    t = Date.now();
    const { p, meta } = await ConapeSession.freshProspectoFromHome();
    navMode = meta.navMode;
    timing.form = Date.now() - t;

    t = Date.now();
    const state = await lookupCedulaOnPage(p, auth.cedula);
    timing.lookup = Date.now() - t;

    const plan = contactPlan(auth.prospecto, state);
    comparison = buildComparison(auth.prospecto, state, plan);
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
    created = await clickCreateOnce(p);
    timing.create = Date.now() - t;
    if (created.createCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud CREATE. No repita el envío.', 409, 'AFTER_CREATE');

    t = Date.now();
    confirmation = await confirmInHome(p, meta.sessionId, auth.cedula);
    timing.confirmation = Date.now() - t;

    const categories = created.outcome?.categories || [];
    if (categories.includes('YA_REGISTRADO')) throw Object.assign(new AppError('YA_REGISTRADO', 'CONAPE indicó que el prospecto ya estaba registrado.', 409, 'CONFIRMATION'), { comparison, confirmation });
    if (confirmation.found) {
      finalCode = 'CREATED';
      finalStage = 'CONFIRMED';
      return { ok:true, confirmed:true, code:'CREATED', stage:'CONFIRMED', confirmation_found:true, confirmation_estado:upper(confirmation.estado), estado_conape_raw:confirmation.estado, comparison, timing:{ ...timing, total:Date.now()-started } };
    }
    const meaningful = categories.find(code => code !== 'ERROR_DE_PORTAL' && code !== 'ALERTA_NO_CLASIFICADA');
    if (meaningful) throw Object.assign(new AppError(meaningful, 'CONAPE rechazó la creación.', categoryStatus(meaningful), 'AFTER_CREATE'), { comparison, confirmation });
    throw Object.assign(new AppError('WRITE_RESULT_UNCERTAIN', 'CREATE fue enviado, pero la cédula no apareció en la lista de CONAPE. No repita el envío.', 409, 'CONFIRMATION'), { comparison, confirmation });
  } catch (error) {
    finalCode = txt(error?.code || finalCode || 'BRIDGE_ERROR');
    finalStage = sanitizedStage(error);
    if (error?.fill_telemetry) fillTelemetry = error.fill_telemetry;
    if (Array.isArray(error?.empty_field_ids)) formIncompleteIds = error.empty_field_ids;
    if (comparison && !error?.comparison) error.comparison = comparison;
    error.execute_timing = { ...timing, total:Date.now()-started };
    throw error;
  } finally {
    console.log(JSON.stringify({
      event:'conape_execute_telemetry', version:VERSION, code:finalCode, stage:finalStage,
      ms_total:Date.now()-started, ms_campus:timing.campus, ms_form:timing.form, ms_lookup:timing.lookup, ms_fill:timing.fill, ms_create:timing.create, ms_confirmation:timing.confirmation,
      nav_mode:navMode,
      create_body_keys:created?.request?.body_keys || [], page_item_ids:created?.page_item_ids || [], apex_http_status:Number(created?.request?.status || 0) || null,
      create_count:Number(created?.createCount || 0), confirmation_found:!!confirmation?.found, confirmation_estado:upper(confirmation?.estado || ''),
      fill_attempted_fields:fillTelemetry.attempted_fields || [], fill_verified_fields:fillTelemetry.verified_fields || [], fill_methods:fillTelemetry.methods || [],
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
    if (req.method === 'GET' && url.pathname === '/v1/prospects/list') {
      action = 'prospects_list';
      await authorizeCampusSession(campusTokenFromRequest(req));
      const result = await serial(() => listProspectsFromHome());
      sendJson(res, 200, result, origin);
      return;
    }
    if (req.method !== 'POST') throw new AppError('METHOD_NOT_ALLOWED', 'Método no permitido.', 405);
    const body = await readJson(req);
    if (url.pathname === '/v1/session/status') action = 'session_status';
    else if (url.pathname === '/v1/session/connect') action = 'session_connect';
    else if (url.pathname === '/v1/session/disconnect') action = 'session_disconnect';
    else if (url.pathname === '/v1/recruit/preview') action = 'preview';
    else if (url.pathname === '/v1/recruit/submit') action = 'submit';
    else if (url.pathname === '/v1/recruit/execute') action = 'execute';
    else throw new AppError('NOT_FOUND', 'Ruta no encontrada.', 404);

    let result;
    if (action === 'session_status') { await authorizeCampusSession(body?.token); result = await serial(() => ConapeSession.status()); }
    else if (action === 'session_connect') { await authorizeCampusSession(body?.token); result = await serial(() => ConapeSession.connect()); }
    else if (action === 'session_disconnect') { await authorizeCampusSession(body?.token); result = await serial(async () => { await ConapeSession.close(); return ConapeSession.snapshot({ ready:null }); }); }
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
