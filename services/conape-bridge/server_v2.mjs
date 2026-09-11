import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const VERSION = 'V4.0.0';
const PORT = Number(process.env.PORT || 8080);
const CAMPUS_URL = String(process.env.CAMPUS_APPS_SCRIPT_URL || '').trim();
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const CONAPE_FRIENDLY_HOME = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home';
const CONAPE_FRIENDLY_PROSPECTO = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/prospecto';
const CONAPE_USER = String(process.env.CONAPE_PORTAL_USERNAME || '').trim();
const CONAPE_PASSWORD = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70_000));
const SESSION_CACHE_TTL_MS = 30_000;
const STARTED_AT = new Date().toISOString();
const ALLOWED_ORIGINS = new Set(String(process.env.CAMPUS_ALLOWED_ORIGINS || 'https://anorteamerican.com,https://www.anorteamerican.com,https://anorteamericana-ship-it.github.io').split(',').map(v => v.trim()).filter(Boolean));
const ROLE_ALLOW = new Set(['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN']);
const sessionValidationCache = new Map();
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

function validEmail(v) {
  const s = email(v);
  return !!s && s.length <= 128 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function serial(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
}

function rateLimit(token) {
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

  const raw = await response.text();
  const startsHtml = raw.trim().startsWith('<');
  if (!response.ok || !raw || startsHtml) {
    const error = new AppError('CAMPUS_BACKEND_UNAVAILABLE', startsHtml ? 'El Campus está ocupado, probá de nuevo en unos segundos.' : 'No se pudo consultar el Campus.', 503, 'CAMPUS');
    error.fn = fn;
    error.campus_busy = startsHtml || (Date.now() - started >= 10_000);
    error.retryable = fn === 'validarSesion' && error.campus_busy;
    error.campus_ms = Date.now() - started;
    throw error;
  }

  try {
    return JSON.parse(raw);
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

async function clickByLabel(p, regex, timeoutMs = 8_000) {
  const selector = 'button,a,[role="button"],input[type="button"],input[type="submit"]';
  const deadline = Date.now() + timeoutMs;
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
        await items.nth(index).click({ timeout:timeoutMs });
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
    return {
      ok:true,
      status:this.state,
      connected:this.state === 'CONNECTED',
      connected_at:this.connectedAt || null,
      last_activity:this.lastActivity || null,
      generation:this.generation,
      ...extra,
    };
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
    await this.login(p);
    this.state = 'CONNECTED';
    this.connectedAt = this.connectedAt || nowIso();
    this.lastActivity = nowIso();
    this.generation += 1;
    return this.snapshot({ ready:'HOME' });
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

  async freshProspecto() {
    const p = await this.browserPage();
    await this.login(p);
    let sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión válida.', 409, 'FORM');

    await p.goto(urlWithSession(CONAPE_FRIENDLY_PROSPECTO, sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    let until = Date.now() + 10_000;
    while (Date.now() < until) {
      if (await this.formReady(p)) {
        this.state = 'CONNECTED';
        this.lastActivity = nowIso();
        return { p, sessionId, navMode:'DIRECT_URL' };
      }
      await sleep(200);
    }

    // Alternativa no bloqueante: Home -> botón Reclutar. Nunca es requisito.
    try {
      await p.goto(urlWithSession(CONAPE_FRIENDLY_HOME, sessionId), { waitUntil:'domcontentloaded', timeout:20_000 });
      const clicked = await clickByLabel(p, /(^| )RECLUTAR( |$)/i, 4_000);
      if (clicked) {
        until = Date.now() + 8_000;
        while (Date.now() < until) {
          if (await this.formReady(p)) {
            sessionId = (await readApexSession(p)) || sessionId;
            this.state = 'CONNECTED';
            this.lastActivity = nowIso();
            return { p, sessionId, navMode:'HOME_BUTTON_FALLBACK' };
          }
          await sleep(200);
        }
      }
    } catch {}

    throw new AppError('CONAPE_FORM_NOT_READY', 'CONAPE no dejó listo el formulario de Prospecto.', 409, 'FORM');
  },
};

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
      cedula:val('P2_PRS_CEDULA'),
      apellido_1:val('P2_PRS_APELLIDO_1'),
      apellido_2:val('P2_PRS_APELLIDO_2'),
      nombre:val('P2_PRS_NOMBRE'),
      telefono:val('P2_PRS_CELULAR'),
      correo:val('P2_PRS_EMAIL'),
      categories,
      success_signal:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text) && !/ERROR|INVALID/.test(text),
      form_reset:!val('P2_PRS_CEDULA'),
    };
  });
}

async function lookupCedula(p, cedula) {
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

function deriveCampusIdentity(campus, conape) {
  const full = txt(first(campus, ['nombre','NOMBRE','nombre_completo','NOMBRE_COMPLETO']));
  const apellido1 = txt(first(campus, ['apellido_1','primer_apellido','APELLIDO_1','PRIMER_APELLIDO']));
  const apellido2 = txt(first(campus, ['apellido_2','segundo_apellido','APELLIDO_2','SEGUNDO_APELLIDO']));
  const given = txt(first(campus, ['nombres','NOMBRES','nombre_persona','NOMBRE_PERSONA']));
  if (apellido1 || apellido2 || given) return { apellido_1:apellido1, apellido_2:apellido2, nombre:given || full, full };
  const conapeA = [conape.apellido_1, conape.apellido_2, conape.nombre].filter(Boolean).join(' ');
  const conapeB = [conape.nombre, conape.apellido_1, conape.apellido_2].filter(Boolean).join(' ');
  if (full && (upper(full) === upper(conapeA) || upper(full) === upper(conapeB))) {
    return { apellido_1:conape.apellido_1, apellido_2:conape.apellido_2, nombre:conape.nombre, full };
  }
  return { apellido_1:'', apellido_2:'', nombre:full, full };
}

function compareValue(a, b, normalizer = upper) {
  const av = normalizer(a);
  const bv = normalizer(b);
  if (!av && !bv) return 'vacio';
  if (!av || !bv) return 'falta';
  return av === bv ? 'igual' : 'diferente';
}

function contactPlan(campus, conape) {
  const phone = campusPhone(campus);
  if (phone.length !== 8) throw new AppError('CONTACT_VALIDATION_FAILED', 'El WhatsApp del Campus debe tener 8 dígitos.', 422, 'CONTACTS');
  const campusMail = campusEmail(campus);
  const conapeMail = email(conape.correo);
  const finalMail = conapeMail || campusMail;
  if (!validEmail(finalMail)) throw new AppError('CONTACT_VALIDATION_FAILED', 'No hay un correo válido para crear el prospecto.', 422, 'CONTACTS');
  return {
    telefono:phone,
    correo:finalMail,
    update_telefono:digits(conape.telefono).slice(-8) !== phone,
    update_correo:!conapeMail,
  };
}

function buildComparison(campus, conape, plan) {
  const identity = deriveCampusIdentity(campus, conape);
  const campusData = {
    cedula:campusCedula(campus),
    apellido_1:identity.apellido_1,
    apellido_2:identity.apellido_2,
    nombre:identity.nombre,
    telefono:campusPhone(campus),
    correo:campusEmail(campus),
  };
  const conapeData = {
    cedula:digits(conape.cedula),
    apellido_1:txt(conape.apellido_1),
    apellido_2:txt(conape.apellido_2),
    nombre:txt(conape.nombre),
    telefono:digits(conape.telefono).slice(-8),
    correo:email(conape.correo),
  };
  return {
    campus:campusData,
    conape:conapeData,
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
      const error = new AppError('IDENTITY_MISMATCH', 'La identidad de CONAPE no coincide con el prospecto del Campus.', 409, 'IDENTITY');
      error.comparison = comparison;
      throw error;
    }
  }
}

async function fillContacts(p, plan) {
  if (plan.update_telefono && !(await nativeSetValue(p, 'P2_PRS_CELULAR', plan.telefono))) throw new AppError('CONTACT_FILL_FAILED', 'No se pudo aplicar el teléfono.', 422, 'CONTACTS');
  if (plan.update_correo && !(await nativeSetValue(p, 'P2_PRS_EMAIL', plan.correo))) throw new AppError('CONTACT_FILL_FAILED', 'No se pudo aplicar el correo.', 422, 'CONTACTS');
  await sleep(250);
  const state = await readFormState(p);
  if (digits(state.telefono).slice(-8) !== plan.telefono) throw new AppError('CONTACT_VALIDATION_FAILED', 'El teléfono no quedó aplicado.', 422, 'CONTACTS');
  if (email(state.correo) !== plan.correo) throw new AppError('CONTACT_VALIDATION_FAILED', 'El correo no quedó aplicado.', 422, 'CONTACTS');
  return state;
}

async function assertPreCreateFields(p) {
  const result = await p.evaluate(() => {
    const ids = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
    return ids.filter(id => !String(document.getElementById(id)?.value || '').trim());
  }).catch(() => ['FORM']);
  if (result.length) throw new AppError('CAMPO_OBLIGATORIO', 'Faltan campos obligatorios antes de CREATE.', 422, 'BEFORE_CREATE');
}

async function clickCreateOnce(p) {
  await assertPreCreateFields(p);
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
    const clicked = await clickByLabel(p, /CREAR NUEVO PROSPECTO/i, 8_000);
    if (!clicked) throw new AppError('CREATE_BUTTON_NOT_FOUND', 'No se encontró Crear nuevo Prospecto.', 409, 'CREATE');

    const until = Date.now() + 10_000;
    let state = await readFormState(p);
    while (Date.now() < until) {
      if (createRequests.length && (createRequests[0].status != null || state.categories.length || state.success_signal || state.form_reset)) break;
      await sleep(250);
      state = await readFormState(p);
    }
    if (createRequests.length !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se observó una única solicitud CREATE. No repita el envío.', 409, 'AFTER_CREATE');
    return { state, request:createRequests[0] };
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
          return { found:true, estado, registro:norm(estado) === 'REGISTRO' };
        }
      }
    }
    return { found:false, estado:'', registro:false };
  }, cedula).catch(() => ({ found:false, estado:'', registro:false }));
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

async function execute(body) {
  const started = Date.now();
  const timing = { campus:null, formulario:null, lookup:null, contactos:null, create:null, confirmacion:null };
  let finalCode = 'BRIDGE_ERROR';
  let finalStage = 'PRECHECK';
  let comparison = null;
  let navMode = null;
  let createObserved = false;
  let createHttpStatus = null;
  let confirmationFound = false;
  let confirmationRegistro = false;

  try {
    let t = Date.now();
    const auth = await authorizeCampusParallel(body?.token, body?.cedula);
    timing.campus = Date.now() - t;

    t = Date.now();
    const { p, sessionId, navMode:mode } = await ConapeSession.freshProspecto();
    navMode = mode;
    timing.formulario = Date.now() - t;

    t = Date.now();
    const conape = await lookupCedula(p, auth.cedula);
    timing.lookup = Date.now() - t;

    const plan = contactPlan(auth.prospecto, conape);
    comparison = buildComparison(auth.prospecto, conape, plan);
    assertIdentityMatch(comparison);

    t = Date.now();
    await fillContacts(p, plan);
    timing.contactos = Date.now() - t;

    t = Date.now();
    const created = await clickCreateOnce(p);
    timing.create = Date.now() - t;
    createObserved = true;
    createHttpStatus = Number(created.request?.status || 0) || null;

    t = Date.now();
    const confirmation = await confirmInHome(p, sessionId, auth.cedula);
    timing.confirmacion = Date.now() - t;
    confirmationFound = !!confirmation.found;
    confirmationRegistro = !!confirmation.registro;

    const categories = created.state?.categories || [];
    if (categories.includes('YA_REGISTRADO')) {
      finalCode = 'YA_REGISTRADO';
      finalStage = 'CONFIRMATION';
      throw Object.assign(new AppError('YA_REGISTRADO', 'CONAPE indicó que el prospecto ya estaba registrado.', 409, 'CONFIRMATION'), { comparison, confirmation });
    }

    if (confirmation.registro) {
      finalCode = 'CREATED';
      finalStage = 'CONFIRMED';
      return {
        ok:true,
        confirmed:true,
        code:'CREATED',
        stage:'CONFIRMED',
        estado_conape_raw:confirmation.estado,
        comparison,
        timing:{ ...timing, total:Date.now()-started },
      };
    }

    // Éxito visual gana sobre error genérico, pero sin REGISTRO la escritura sigue sin confirmar.
    const meaningful = categories.find(code => code !== 'ERROR_DE_PORTAL' && code !== 'ALERTA_NO_CLASIFICADA');
    if (meaningful) {
      finalCode = meaningful;
      finalStage = 'AFTER_CREATE';
      throw Object.assign(new AppError(meaningful, 'CONAPE rechazó la creación.', categoryStatus(meaningful), 'AFTER_CREATE'), { comparison, confirmation });
    }

    finalCode = 'WRITE_RESULT_UNCERTAIN';
    finalStage = 'CONFIRMATION';
    throw Object.assign(new AppError('WRITE_RESULT_UNCERTAIN', 'CREATE fue enviado, pero la lista no confirmó Estado REGISTRO. No repita el envío.', 409, 'CONFIRMATION'), { comparison, confirmation });
  } catch (error) {
    finalCode = txt(error?.code || finalCode || 'BRIDGE_ERROR');
    finalStage = sanitizedStage(error);
    if (comparison && !error?.comparison) error.comparison = comparison;
    error.execute_timing = { ...timing, total:Date.now()-started };
    throw error;
  } finally {
    console.log(JSON.stringify({
      event:'conape_execute',
      version:VERSION,
      code:finalCode,
      stage:finalStage,
      ms_total:Date.now()-started,
      ms_campus:timing.campus,
      ms_formulario:timing.formulario,
      ms_lookup:timing.lookup,
      ms_contactos:timing.contactos,
      ms_create:timing.create,
      ms_confirmacion:timing.confirmacion,
      nav_mode:navMode,
      create_observed:createObserved,
      create_http_status:createHttpStatus,
      confirmation_found:confirmationFound,
      confirmation_registro:confirmationRegistro,
      pii:false,
    }));
  }
}

function corsHeaders(origin) {
  return origin && ALLOWED_ORIGINS.has(origin) ? {
    'Access-Control-Allow-Origin':origin,
    'Vary':'Origin',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, Authorization, X-Campus-Token',
    'Access-Control-Max-Age':'600',
  } : {};
}

function sendJson(res, status, data, origin = '') {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(body),
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    ...corsHeaders(origin),
  });
  res.end(body);
}

function readJson(req, max = 32_768) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > max) { reject(new AppError('BODY_TOO_LARGE', 'Solicitud demasiado grande.', 413)); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new AppError('BAD_JSON', 'JSON inválido.', 400)); }
    });
    req.on('error', reject);
  });
}

function campusTokenFromRequest(req) {
  const authorization = txt(req.headers.authorization);
  const bearer = authorization.match(/^Bearer\s+(.+)$/i);
  return txt((bearer && bearer[1]) || req.headers['x-campus-token'] || '');
}

const server = http.createServer(async (req, res) => {
  const origin = txt(req.headers.origin);
  try {
    const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok:true, service:'CONAPE_PORTAL_BRIDGE', version:VERSION, commit:process.env.RAILWAY_GIT_COMMIT_SHA || null, started_at:STARTED_AT, time:nowIso() });
      return;
    }
    if (origin && !ALLOWED_ORIGINS.has(origin)) throw new AppError('ORIGIN_FORBIDDEN', 'Origen no autorizado.', 403);
    if (req.method === 'OPTIONS') {
      if (!origin || !ALLOWED_ORIGINS.has(origin)) throw new AppError('ORIGIN_FORBIDDEN', 'Origen no autorizado.', 403);
      res.writeHead(204, corsHeaders(origin));
      res.end();
      return;
    }
    if (req.method !== 'POST') throw new AppError('METHOD_NOT_ALLOWED', 'Método no permitido.', 405);
    const body = await readJson(req);

    if (url.pathname === '/v1/session/status') {
      await authorizeCampusSession(body?.token);
      sendJson(res, 200, await serial(() => ConapeSession.status()), origin);
      return;
    }
    if (url.pathname === '/v1/session/connect') {
      await authorizeCampusSession(body?.token);
      sendJson(res, 200, await serial(() => ConapeSession.connect()), origin);
      return;
    }
    if (url.pathname === '/v1/session/disconnect') {
      await authorizeCampusSession(body?.token);
      sendJson(res, 200, await serial(async () => { await ConapeSession.close(); return ConapeSession.snapshot({ ready:null }); }), origin);
      return;
    }
    if (url.pathname === '/v1/recruit/execute') {
      sendJson(res, 200, await serial(() => execute(body)), origin);
      return;
    }
    if (url.pathname === '/v1/recruit/preview' || url.pathname === '/v1/recruit/submit') {
      throw new AppError('LEGACY_FLOW_DISABLED', 'El reclutamiento ahora se ejecuta en un solo paso.', 410, 'PRECHECK');
    }
    throw new AppError('NOT_FOUND', 'Ruta no encontrada.', 404);
  } catch (error) {
    const status = Number(error?.status || 500);
    const code = txt(error?.code || 'BRIDGE_ERROR');
    const stage = sanitizedStage(error);
    const campusBusy = error?.campus_busy === true;
    sendJson(res, status, {
      ok:false,
      error:code,
      code,
      stage,
      message:campusBusy ? 'El Campus está ocupado, probá de nuevo en unos segundos.' : (status >= 500 ? 'Servicio CONAPE temporalmente no disponible.' : txt(error?.message || 'Operación rechazada.')),
      ...(campusBusy ? { campus_busy:true, retryable:true } : {}),
      ...(error?.comparison ? { comparison:error.comparison } : {}),
      ...(error?.confirmation ? { confirmation:error.confirmation } : {}),
      ...(error?.execute_timing ? { timing:error.execute_timing } : {}),
    }, origin);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ event:'bridge_ready', version:VERSION, port:PORT, clean_runtime:true, pii:false }));
});

async function shutdown() {
  try { await ConapeSession.close(); } catch {}
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { safeBodyKeys, safeRequestToken, contactPlan, sanitizedStage, buildComparison };
