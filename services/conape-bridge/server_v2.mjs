import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const VERSION = 'V2.0.2';
const PORT = Number(process.env.PORT || 8080);
const CAMPUS_URL = String(process.env.CAMPUS_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec').trim();
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const CONAPE_USER = String(process.env.CONAPE_PORTAL_USERNAME || '');
const CONAPE_PASSWORD = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70_000));
const STARTED_AT = new Date().toISOString();
const ALLOWED_ORIGINS = new Set(String(process.env.CAMPUS_ALLOWED_ORIGINS || 'https://anorteamerican.com,https://www.anorteamerican.com,https://anorteamericana-ship-it.github.io').split(',').map(v => v.trim()).filter(Boolean));
const ROLE_ALLOW = new Set(['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN']);
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
  return !s || (s.length <= 128 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

function pruneState() {
  const now = Date.now();
  for (const [key, value] of sourceVersions) {
    if (!value || value.expiresAt <= now || value.consumed) sourceVersions.delete(key);
  }
  for (const [key, value] of rateBuckets) {
    if (!value || now - value.startedAt > 120_000) rateBuckets.delete(key);
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
  if (current.count > 30) throw new AppError('RATE_LIMITED', 'Demasiadas solicitudes. Intente de nuevo en un minuto.', 429);
}

function serial(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => {});
  return run;
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

function safeRequestToken(postData) {
  const raw = String(postData || '');
  const token = value => {
    const v = String(value || '').trim();
    return /^[A-Z][A-Z0-9_:\-]{0,39}$/i.test(v) ? v.toUpperCase() : '';
  };
  try {
    if (raw.trim().startsWith('{')) {
      const obj = JSON.parse(raw);
      return token(obj?.p_request || obj?.request || '');
    }
  } catch {}
  try {
    const p = new URLSearchParams(raw);
    return token(p.get('p_request') || p.get('request') || '');
  } catch {
    return '';
  }
}

async function campusCall(payload) {
  const fn = safeId(payload?.fn) || 'UNKNOWN';
  const started = Date.now();
  let httpStatus = 0;
  let raw = '';
  let bodyStartsWithAngle = false;
  let jsonParsed = false;
  let logged = false;
  const emit = () => {
    if (logged) return;
    logged = true;
    console.log(JSON.stringify({
      event:'campus_call',
      fn,
      http_status:httpStatus,
      ms:Date.now()-started,
      body_len:Buffer.byteLength(raw || '', 'utf8'),
      body_starts_with_angle:bodyStartsWithAngle,
      json_parsed:jsonParsed,
      pii:false,
    }));
  };

  try {
    const response = await fetch(CAMPUS_URL, {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(payload),
      redirect:'follow',
      signal:AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    httpStatus = Number(response.status || 0);
    raw = await response.text();
    bodyStartsWithAngle = raw.trim().startsWith('<');

    let parsed;
    if (raw && !bodyStartsWithAngle) {
      try {
        parsed = JSON.parse(raw);
        jsonParsed = true;
      } catch {}
    }

    emit();
    if (!response.ok || !raw || bodyStartsWithAngle) {
      const error = new AppError('CAMPUS_BACKEND_UNAVAILABLE', 'No se pudo validar la sesión del Campus.', 503);
      error.fn = fn;
      throw error;
    }
    if (!jsonParsed) {
      const error = new AppError('CAMPUS_BACKEND_INVALID', 'El Campus devolvió una respuesta inválida.', 503);
      error.fn = fn;
      throw error;
    }
    return parsed;
  } catch (error) {
    emit();
    if (!safeId(error?.fn)) {
      try { error.fn = fn; } catch {}
    }
    throw error;
  }
}

async function authorizeCampusSession(token) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401);
  rateLimit(cleanToken);
  const session = await campusCall({ fn:'validarSesion', token:cleanToken });
  if (!session?.ok) throw new AppError('CAMPUS_SESSION_INVALID', 'La sesión del Campus no es válida.', 401);
  const role = roleOf(session);
  if (!ROLE_ALLOW.has(role)) throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para usar CONAPE.', 403);
  if (session.demo === true || session.read_only === true) throw new AppError('CAMPUS_READ_ONLY', 'La cuenta es de solo lectura.', 403);
  return { session, token:cleanToken, binding:userBinding(session) };
}

async function authorizeCampus(token, cedula) {
  const base = await authorizeCampusSession(token);
  const cleanCedula = digits(cedula);
  if (cleanCedula.length < 8 || cleanCedula.length > 12) throw new AppError('CEDULA_INVALID', 'Cédula inválida.', 422);
  const detail = await campusCall({ fn:'getProspectoDetalle', token:base.token, cedula:cleanCedula });
  if (!detail || detail.ok === false) throw new AppError('PROSPECT_ACCESS_DENIED', 'No se pudo acceder a este prospecto.', 403);
  const prospecto = detail.prospecto || detail;
  if (campusCedula(prospecto) !== cleanCedula) throw new AppError('PROSPECT_CEDULA_MISMATCH', 'La cédula no coincide con el prospecto autorizado.', 409);
  if (financing(prospecto) !== 'CONAPE') throw new AppError('PROSPECT_NOT_CONAPE', 'El prospecto no utiliza financiamiento CONAPE.', 422);
  return { ...base, prospecto, cedula:cleanCedula };
}

async function clickVisibleByLabel(p, regex, notFoundCode) {
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
        if (notFoundCode === 'CONAPE_RECRUIT_BUTTON_NOT_FOUND') console.log(JSON.stringify({ event:'conape_recruit_nav', version:VERSION, method:'LABEL', pii:false }));
        return;
      }
    }

    if (notFoundCode === 'CONAPE_RECRUIT_BUTTON_NOT_FOUND') {
      for (const frame of p.frames()) {
        const links = frame.locator('a[href]');
        const index = await links.evaluateAll(nodes => {
          const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
          return nodes.findIndex(el => {
            if (!visible(el)) return false;
            const href = String(el.getAttribute('href') || '');
            return /prospecto/i.test(href) && /(?:\?|&)p2_eve_id=/i.test(href) && /(?:\?|&)p2_pro_id=/i.test(href);
          });
        }).catch(() => -1);
        if (index >= 0) {
          await links.nth(index).click({ timeout:15_000 });
          console.log(JSON.stringify({ event:'conape_recruit_nav', version:VERSION, method:'CONTEXT_LINK', pii:false }));
          return;
        }
      }
    }
    await sleep(250);
  }
  throw new AppError(notFoundCode, 'CONAPE no mostró el control esperado.', 503);
}

async function readProspectoContext(p) {
  return p.evaluate(() => {
    const nonZero = v => { const s=String(v ?? '').trim(); return !!s && s !== '0'; };
    const byId = ids => ids.some(id => { const el=document.getElementById(id); if(!el) return false; return nonZero('value' in el ? el.value : el.textContent); });
    const u = new URL(location.href);
    return {
      evento:nonZero(u.searchParams.get('p2_eve_id')) || byId(['P2_EVE_ID','P2_PRS_EVE_ID','P2_EVENTO_ID']),
      prospectador:nonZero(u.searchParams.get('p2_pro_id')) || byId(['P2_PRO_ID','P2_PRS_PRO_ID','P2_PROSPECTADOR_ID']),
      session_param_present:nonZero(u.searchParams.get('session')),
      page_time_origin:Number(performance.timeOrigin || 0),
      path:location.pathname,
    };
  }).catch(() => ({ evento:false, prospectador:false, session_param_present:false, page_time_origin:0, path:'' }));
}

const ConapeSession = {
  browser:null,
  context:null,
  page:null,
  state:'DISCONNECTED',
  connectedAt:'',
  lastActivity:'',
  lastError:'',
  generation:0,

  snapshot(extra = {}) {
    return {
      ok:true,
      status:this.state,
      connected:this.state === 'CONNECTED',
      connected_at:this.connectedAt || null,
      last_activity:this.lastActivity || null,
      last_error:this.lastError || null,
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
    try { await this.close(); } catch {}
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

  async recruitVisible(p) {
    return p.evaluate(() => {
      const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
      return Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).some(el => norm([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' ')).includes('RECLUTAR PROSPECTOS'));
    }).catch(() => false);
  },

  async authState(p) {
    return p.evaluate(() => {
      const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
      const password = Array.from(document.querySelectorAll('input[type="password"]')).some(visible);
      const form = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id => !!document.getElementById(id));
      const path = decodeURIComponent(location.pathname || '').toLowerCase();
      const title = norm(document.title || '');
      const route = path.includes('/prospectacion-reclutador/') || path.includes('/prospectaci') && path.includes('reclutador');
      return { password, form, route, title, authenticated:!password && (form || route || title.includes('PROSPECTACION RECLUTADOR')) };
    }).catch(() => ({ password:false, form:false, route:false, title:'', authenticated:false }));
  },

  async login(p) {
    if (!CONAPE_USER || !CONAPE_PASSWORD) throw new AppError('CONAPE_CREDENTIALS_MISSING', 'Credenciales CONAPE no configuradas en el bridge.', 503);
    let state = await this.authState(p);
    if (state.authenticated) return state;
    await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
    state = await this.authState(p);
    if (state.authenticated) return state;

    const pass = p.locator('input[type="password"]:visible').first();
    if (!(await pass.count())) throw new AppError('CONAPE_LOGIN_FORM_NOT_FOUND', 'No se encontró el formulario de acceso de CONAPE.', 503);
    let user = p.getByLabel(/usuario|c[eé]dula|identificaci[oó]n|user/i).first();
    if (!(await user.count())) user = p.locator('input:visible:not([type="password"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])').first();
    if (!(await user.count())) throw new AppError('CONAPE_LOGIN_USER_NOT_FOUND', 'No se encontró el campo de usuario de CONAPE.', 503);

    await user.fill(CONAPE_USER);
    await pass.fill(CONAPE_PASSWORD);
    let login = p.getByRole('button', { name:/ingresar|iniciar sesi[oó]n|entrar|acceder|login|sign in/i }).first();
    if (await login.count()) await login.click(); else await pass.press('Enter');

    const until = Date.now() + 45_000;
    while (Date.now() < until) {
      await sleep(500);
      state = await this.authState(p);
      if (state.authenticated) return state;
    }
    throw new AppError('CONAPE_LOGIN_FAILED', 'CONAPE no confirmó la sesión del bridge.', 503);
  },

  async connect() {
    if (this.state === 'CONNECTED' && this.page && !this.page.isClosed()) {
      const s = await this.authState(this.page);
      if (s.authenticated) {
        this.lastActivity = nowIso();
        return this.snapshot({ ready:s.form ? 'PROSPECTO' : 'HOME' });
      }
    }
    this.state = 'CONNECTING';
    this.lastError = '';
    this.lastActivity = nowIso();
    try {
      const p = await this.browserPage();
      const s = await this.login(p);
      this.state = 'CONNECTED';
      this.connectedAt = this.connectedAt || nowIso();
      this.lastActivity = nowIso();
      this.lastError = '';
      this.generation += 1;
      return this.snapshot({ ready:s.form ? 'PROSPECTO' : 'HOME' });
    } catch (error) {
      this.state = 'ERROR';
      this.lastError = txt(error?.code || 'CONAPE_CONNECT_FAILED');
      this.lastActivity = nowIso();
      throw error;
    }
  },

  async status() {
    if (!this.page || this.page.isClosed()) {
      this.state = 'DISCONNECTED';
      return this.snapshot({ ready:null });
    }
    const s = await this.authState(this.page);
    if (!s.authenticated) {
      this.state = 'DISCONNECTED';
      return this.snapshot({ ready:null });
    }
    this.state = 'CONNECTED';
    this.lastActivity = nowIso();
    return this.snapshot({ ready:s.form ? 'PROSPECTO' : 'HOME' });
  },

  async freshProspectoFromHome() {
    const p = await this.browserPage();
    await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
    await this.login(p);
    await clickVisibleByLabel(p, /RECLUTAR PROSPECTOS/i, 'CONAPE_RECRUIT_BUTTON_NOT_FOUND');

    const until = Date.now() + 15_000;
    while (Date.now() < until) {
      await sleep(250);
      if (!(await this.formReady(p))) continue;
      const meta = await readProspectoContext(p);
      console.log(JSON.stringify({ event:'conape_prospecto_context', version:VERSION, entry:'HOME_CLICK_RECRUIT', evento:!!meta.evento, prospectador:!!meta.prospectador, session_param_present:!!meta.session_param_present, gate:false, pii:false }));
      this.state = 'CONNECTED';
      this.lastActivity = nowIso();
      return { p, meta:{ ...meta, entry_path:'HOME_CLICK_RECRUIT' } };
    }
    throw new AppError('CONAPE_PROSPECTO_NOT_READY', 'CONAPE no renderizó un formulario nuevo de Prospecto.', 503);
  },
};

async function runNavSelftest() {
  const result = {
    ok:true,
    login:'FAIL',
    home:'FAIL',
    recruit_click:'FAIL',
    form_ready:'FAIL',
    context:{ evento:false, prospectador:false },
    ms_por_tramo:{ login:null, home:null, recruit_click:null, form_ready:null },
  };
  let browser;
  let context;
  try {
    browser = await chromium.launch({ headless:true, args:['--disable-dev-shm-usage'] });
    context = await browser.newContext({ locale:'es-CR', timezoneId:'America/Costa_Rica' });
    const p = await context.newPage();
    p.setDefaultTimeout(15_000);

    let started = Date.now();
    try {
      const state = await ConapeSession.login(p);
      result.login = state?.authenticated ? 'PASS' : 'FAIL';
    } catch {}
    result.ms_por_tramo.login = Date.now() - started;

    started = Date.now();
    if (result.login === 'PASS') {
      try {
        await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
        const state = await ConapeSession.login(p);
        result.home = state?.authenticated ? 'PASS' : 'FAIL';
      } catch {}
    }
    result.ms_por_tramo.home = Date.now() - started;

    started = Date.now();
    if (result.home === 'PASS') {
      try {
        await clickVisibleByLabel(p, /RECLUTAR PROSPECTOS/i, 'CONAPE_RECRUIT_BUTTON_NOT_FOUND');
        result.recruit_click = 'PASS';
      } catch {}
    }
    result.ms_por_tramo.recruit_click = Date.now() - started;

    started = Date.now();
    if (result.recruit_click === 'PASS') {
      const until = Date.now() + 15_000;
      while (Date.now() < until) {
        if (await ConapeSession.formReady(p)) {
          result.form_ready = 'PASS';
          const meta = await readProspectoContext(p);
          result.context = { evento:!!meta.evento, prospectador:!!meta.prospectador };
          break;
        }
        await sleep(250);
      }
    }
    result.ms_por_tramo.form_ready = Date.now() - started;

    console.log(JSON.stringify({ event:'conape_nav_selftest', version:VERSION, login:result.login, home:result.home, recruit_click:result.recruit_click, form_ready:result.form_ready, context:result.context, ms_por_tramo:result.ms_por_tramo, pii:false }));
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

async function lookupState(p) {
  return p.evaluate(() => {
    const val = id => String(document.getElementById(id)?.value || '').trim();
    const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const nodes = Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
    const alertText = norm(nodes.map(n => n.textContent || '').join(' '));
    const state = {
      cedula:val('P2_PRS_CEDULA'),
      apellido_1:val('P2_PRS_APELLIDO_1'),
      apellido_2:val('P2_PRS_APELLIDO_2'),
      nombre:val('P2_PRS_NOMBRE'),
      telefono:val('P2_PRS_CELULAR'),
      correo:val('P2_PRS_EMAIL'),
      duplicate_warning:/YA EXIST|DUPLIC|YA FUE REGISTRAD|YA SE ENCUENTRA|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(alertText),
      validation_warning:/ERROR|INVALID|OBLIGATOR|REQUERID|DEBE INGRESAR|DEBE COMPLETAR/.test(alertText),
    };
    state.identity_ready = !!(state.apellido_1 && state.nombre);
    return state;
  });
}

async function lookupCedulaOnFreshPage(cedula) {
  const { p, meta } = await ConapeSession.freshProspectoFromHome();
  const started = await nativeSetValue(p, 'P2_PRS_CEDULA', cedula);
  if (!started) throw new AppError('CEDULA_LOOKUP_START_FAILED', 'No se pudo iniciar la búsqueda por cédula en CONAPE.', 503);
  const until = Date.now() + 15_000;
  let state = await lookupState(p);
  while (Date.now() < until && !state.identity_ready && !state.duplicate_warning && !state.validation_warning) {
    await sleep(400);
    state = await lookupState(p);
  }
  if (state.duplicate_warning) throw new AppError('DUPLICATE', 'CONAPE indica que esta cédula ya fue reclutada.', 409);
  if (state.validation_warning && !state.identity_ready) throw new AppError('CONAPE_VALIDATION', 'CONAPE mostró una validación para esta cédula.', 422);
  if (!state.identity_ready) throw new AppError('IDENTITY_LOOKUP_FAILED', 'CONAPE no devolvió nombre y apellidos para esta cédula.', 422);
  return { p, state, meta };
}

function contactPlan(campus, conape) {
  const phone = campusPhone(campus);
  const campusMail = campusEmail(campus);
  const conapePhone = digits(conape?.telefono).slice(-8);
  const conapeMail = email(conape?.correo);
  if (phone && phone.length !== 8) throw new AppError('CONTACT_VALIDATION_FAILED', 'El WhatsApp del Campus no tiene 8 dígitos.', 422);
  if (!validEmail(campusMail)) throw new AppError('CONTACT_VALIDATION_FAILED', 'El correo del Campus no es válido.', 422);
  return {
    telefono:phone || conapePhone,
    correo:conapeMail || campusMail,
    update_telefono:!!phone && phone !== conapePhone,
    update_correo:!conapeMail && !!campusMail,
  };
}

async function fillContacts(p, plan) {
  if (plan.update_telefono) {
    const ok = await nativeSetValue(p, 'P2_PRS_CELULAR', plan.telefono);
    if (!ok) throw new AppError('CONTACT_FILL_FAILED', 'No se pudo completar el teléfono en CONAPE.', 422, 'BEFORE_CREATE');
  }
  if (plan.update_correo) {
    const ok = await nativeSetValue(p, 'P2_PRS_EMAIL', plan.correo);
    if (!ok) throw new AppError('CONTACT_FILL_FAILED', 'No se pudo completar el correo en CONAPE.', 422, 'BEFORE_CREATE');
  }
  await sleep(350);
  const state = await lookupState(p);
  if (!state.identity_ready) throw new AppError('IDENTITY_LOOKUP_FAILED', 'La identidad CONAPE dejó de estar disponible antes de crear.', 409, 'BEFORE_CREATE');
  if (plan.telefono && digits(state.telefono).slice(-8) !== plan.telefono) throw new AppError('CONTACT_VALIDATION_FAILED', 'El teléfono no quedó aplicado en el formulario CONAPE.', 422, 'BEFORE_CREATE');
  if (plan.correo && email(state.correo) !== plan.correo) throw new AppError('CONTACT_VALIDATION_FAILED', 'El correo no quedó aplicado en el formulario CONAPE.', 422, 'BEFORE_CREATE');
  return state;
}

async function collectSafePageState(p) {
  return p.evaluate(() => {
    const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
    const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
    const ids = Array.from(document.querySelectorAll('input,select,textarea,button')).map(el => String(el.id || '')).filter(id => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(id));
    const alertNodes = Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
    const text = norm(alertNodes.map(n => n.textContent || '').join(' '));
    const categories = [];
    if (/YA FUE REGISTRAD|YA SE ENCUENTRA|YA EXIST|DUPLIC|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(text)) categories.push('YA_REGISTRADO');
    if (/OBLIGATOR|REQUERID|DEBE INGRESAR|DEBE COMPLETAR/.test(text)) categories.push('CAMPO_OBLIGATORIO');
    if (/INVALID|NO ES VALIDO|FORMATO|NO CORRESPONDE/.test(text)) categories.push('DATO_INVALIDO');
    if (/NO AUTORIZAD|SIN PERMISO|NO TIENE ACCESO/.test(text)) categories.push('SIN_PERMISO');
    if (!categories.length && /ERROR|NO SE PUDO|NO FUE POSIBLE/.test(text)) categories.push('ERROR_DE_PORTAL');
    if (!categories.length && text) categories.push('ALERTA_NO_CLASIFICADA');
    const errorIds = Array.from(document.querySelectorAll('.apex-page-item-error,[id$="_error"]')).map(el => String(el.id || el.getAttribute('data-for') || '')).filter(id => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(id));
    return {
      page_item_ids:[...new Set(ids)].sort(),
      visible_alerts:[...new Set(categories)],
      alert_dom_ids:[...new Set(alertNodes.map(n => String(n.id || '')).filter(id => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(id)))].sort(),
      apex_error_item_ids:[...new Set(errorIds)].sort(),
      alert_text_length:text.length,
      success_message:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text) && !/ERROR|INVALID/.test(text),
      duplicate_message:/YA FUE REGISTRAD|YA SE ENCUENTRA|YA EXIST|DUPLIC|PERTENECE A OTRO|OTRO RECLUTADOR|EN PROCESO/.test(text),
      server_error_message:/ERROR|NO SE PUDO|NO FUE POSIBLE|INVALID|OBLIGATOR|REQUERID/.test(text),
      form_reset:!String(document.getElementById('P2_PRS_CEDULA')?.value || '').trim(),
      path:location.pathname,
      page_time_origin:Number(performance.timeOrigin || 0),
    };
  }).catch(() => ({ page_item_ids:[], visible_alerts:[], alert_dom_ids:[], apex_error_item_ids:[], alert_text_length:0, success_message:false, duplicate_message:false, server_error_message:false, form_reset:false, path:'', page_time_origin:0 }));
}

async function readEstadoAfterCreate(p, cedula) {
  try {
    await p.goto(CONAPE_HOME, { waitUntil:'domcontentloaded', timeout:30_000 });
    await ConapeSession.login(p);
    const search = p.locator('input[type="search"]:visible,input[id$="_search_field"]:visible').first();
    if (!(await search.count())) return '';
    await search.fill(cedula);
    const go = p.getByRole('button', { name:/^go$/i }).first();
    if (await go.count()) await go.click(); else await search.press('Enter');
    await sleep(1200);
    return await p.evaluate(value => {
      const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const clean=v=>String(v||'').replace(/\D/g,'');
      for (const table of Array.from(document.querySelectorAll('table'))) {
        const headers=Array.from(table.querySelectorAll('thead th')).map(th=>norm(th.textContent));
        const iCed=headers.findIndex(h=>h==='CEDULA'||h.includes('CEDULA'));
        const iEstado=headers.findIndex(h=>h==='ESTADO');
        if(iCed<0||iEstado<0) continue;
        for(const tr of Array.from(table.querySelectorAll('tbody tr'))){
          const cells=Array.from(tr.querySelectorAll('td'));
          if(cells.length<=Math.max(iCed,iEstado)) continue;
          if(clean(cells[iCed].textContent)===value) return String(cells[iEstado].textContent||'').trim();
        }
      }
      return '';
    }, cedula);
  } catch {
    return '';
  }
}

async function clickCreateOnce(p, meta, previewTimeOrigin) {
  const before = await collectSafePageState(p);
  const pathBefore = before.path || '';
  const clickedAt = Date.now();
  const createRequests = [];
  const statusById = new Map();

  const onRequest = req => {
    try {
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const raw = String(req.postData() || '');
      const requestToken = safeRequestToken(raw);
      if (requestToken !== 'CREATE') return;
      createRequests.push({ requestId:req._guid || crypto.randomUUID(), body_keys:safeBodyKeys(raw), request_token:requestToken });
    } catch {}
  };
  const onResponse = response => {
    try {
      const req = response.request();
      const u = new URL(req.url());
      if (req.method() !== 'POST' || !u.pathname.endsWith('/apex/wwv_flow.accept')) return;
      const token = safeRequestToken(String(req.postData() || ''));
      if (token !== 'CREATE') return;
      const hit = createRequests.find(r => r.request_token === 'CREATE' && !r.status_set);
      if (hit) { hit.status_set = true; hit.status = Number(response.status() || 0); }
    } catch {}
  };

  p.on('request', onRequest);
  p.on('response', onResponse);
  try {
    await clickVisibleByLabel(p, /CREAR NUEVO PROSPECTO/i, 'CREATE_BUTTON_NOT_FOUND');
    const responseDeadline = Date.now() + 20_000;
    let outcome = await collectSafePageState(p);
    while (Date.now() < responseDeadline) {
      await sleep(250);
      outcome = await collectSafePageState(p);
      if (outcome.success_message || outcome.duplicate_message || outcome.server_error_message || outcome.path !== pathBefore) break;
    }
    const classifiedAt = Date.now();
    const create = createRequests[0] || { body_keys:[], request_token:'', status:null };
    const currentOrigin = Number(outcome.page_time_origin || before.page_time_origin || 0);
    const telemetry = {
      event:'conape_create_telemetry',
      version:VERSION,
      stage:'after_create_click',
      create_body_keys:create.body_keys || [],
      page_item_ids:before.page_item_ids || [],
      entry_path:meta.entry_path || 'HOME_CLICK_RECRUIT',
      session_param_present:!!meta.session_param_present,
      page_age_ms:currentOrigin ? Math.max(0, Math.round(clickedAt - currentOrigin)) : null,
      page_reused_from_preview:!!(previewTimeOrigin && currentOrigin && Math.abs(previewTimeOrigin - currentOrigin) < 1),
      apex_http_status:Number(create.status || 0) || null,
      create_count:createRequests.length,
      alerts_before:before.visible_alerts || [],
      visible_alerts:outcome.visible_alerts || [],
      alert_dom_ids:outcome.alert_dom_ids || [],
      apex_error_item_ids:outcome.apex_error_item_ids || [],
      alert_text_length:Number(outcome.alert_text_length || 0),
      form_reset:!!outcome.form_reset,
      path_before:pathBefore,
      path_after:outcome.path || '',
      ms_click_to_response:create.status ? Math.max(0, classifiedAt - clickedAt) : null,
      ms_response_to_classification:0,
      pii:false,
    };
    console.log(JSON.stringify(telemetry));
    return { createCount:createRequests.length, outcome, telemetry };
  } finally {
    p.off('request', onRequest);
    p.off('response', onResponse);
  }
}

async function preview(body) {
  const auth = await authorizeCampus(body?.token, body?.cedula);
  const { state, meta } = await lookupCedulaOnFreshPage(auth.cedula);
  const plan = contactPlan(auth.prospecto, state);
  pruneState();
  const token = crypto.randomBytes(24).toString('base64url');
  sourceVersions.set(token, {
    cedula:auth.cedula,
    binding:auth.binding,
    identityHash:identityHash(state),
    previewPageTimeOrigin:Number(meta.page_time_origin || 0),
    expiresAt:Date.now() + SOURCE_TTL_MS,
    consumed:false,
  });
  return {
    ok:true,
    found:true,
    prospecto:{
      cedula:auth.cedula,
      apellido_1:state.apellido_1,
      apellido_2:state.apellido_2,
      nombre:state.nombre,
      telefono:state.telefono,
      correo:state.correo,
    },
    source_version:token,
    source_expires_at:new Date(Date.now() + SOURCE_TTL_MS).toISOString(),
    can_submit:true,
    contact_plan:{ update_telefono:plan.update_telefono, update_correo:plan.update_correo },
    identity_source:'CONAPE_CEDULA_LOOKUP',
  };
}

async function submit(body) {
  const forbidden = ['nombre','apellido_1','apellido_2','P2_PRS_NOMBRE','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2'];
  const prospectoBody = body?.prospecto && typeof body.prospecto === 'object' ? body.prospecto : {};
  if (forbidden.some(key => Object.prototype.hasOwnProperty.call(prospectoBody, key))) throw new AppError('IDENTITY_FIELDS_FORBIDDEN', 'Nombre y apellidos no pueden enviarse desde Campus.', 422);

  const auth = await authorizeCampus(body?.token, body?.cedula || prospectoBody.cedula);
  const sourceKey = txt(body?.source_version);
  const source = sourceVersions.get(sourceKey);
  if (!source) throw new AppError('SOURCE_VERSION_REQUIRED', 'Debe volver a consultar la cédula antes de enviar.', 409);
  if (source.consumed) throw new AppError('SOURCE_VERSION_USED', 'Esta previsualización ya fue utilizada.', 409);
  if (source.expiresAt <= Date.now()) { sourceVersions.delete(sourceKey); throw new AppError('SOURCE_VERSION_EXPIRED', 'La consulta venció; vuelva a consultar la cédula.', 409); }
  if (source.cedula !== auth.cedula) throw new AppError('CEDULA_MISMATCH', 'La cédula cambió desde la consulta.', 409);
  if (source.binding !== auth.binding) throw new AppError('SOURCE_VERSION_OWNER_MISMATCH', 'La consulta pertenece a otra sesión.', 403);

  source.consumed = true;
  try {
    const { p, state, meta } = await lookupCedulaOnFreshPage(auth.cedula);
    if (identityHash(state) !== source.identityHash) throw new AppError('IDENTITY_CHANGED', 'La identidad devuelta por CONAPE cambió; vuelva a consultar.', 409, 'BEFORE_CREATE');
    const plan = contactPlan(auth.prospecto, state);
    const afterFill = await fillContacts(p, plan);
    if (identityHash(afterFill) !== source.identityHash) throw new AppError('IDENTITY_CHANGED', 'La identidad CONAPE cambió antes del envío.', 409, 'BEFORE_CREATE');

    const created = await clickCreateOnce(p, meta, source.previewPageTimeOrigin);
    const outcome = created.outcome || {};
    if (created.createCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se pudo confirmar una única solicitud CREATE. No repita el envío.', 409, 'AFTER_CREATE');
    if (outcome.duplicate_message) throw new AppError('DUPLICATE', 'CONAPE indicó que el prospecto ya existe.', 409, 'AFTER_CREATE');

    if (outcome.success_message && !outcome.server_error_message) {
      const estado = await readEstadoAfterCreate(p, auth.cedula);
      return { ok:true, confirmed:true, code:'CREATED', create_request_observed:true, write_count:1, success_signal:true, estado_conape_raw:estado };
    }

    const estado = await readEstadoAfterCreate(p, auth.cedula);
    if (estado) return { ok:true, confirmed:true, code:'CREATED', create_request_observed:true, write_count:1, success_signal:true, estado_conape_raw:estado };
    if (outcome.server_error_message) throw new AppError('PORTAL_ERROR', 'CONAPE rechazó la creación.', 422, 'AFTER_CREATE');
    throw new AppError('WRITE_RESULT_UNCERTAIN', 'CONAPE recibió CREATE pero no confirmó el resultado. No repita el envío.', 409, 'AFTER_CREATE');
  } finally {
    sourceVersions.delete(sourceKey);
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

function sanitizedStage(error) {
  const stage = upper(error?.stage || 'PRECHECK').replace(/[^A-Z0-9_]/g, '').slice(0, 32);
  return stage || 'PRECHECK';
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
      res.writeHead(204, corsHeaders(origin));
      res.end();
      return;
    }
    if (req.method === 'GET' && url.pathname === '/v1/selftest/nav') {
      action = 'selftest_nav';
      await authorizeCampusSession(campusTokenFromRequest(req));
      const result = await serial(() => runNavSelftest());
      console.log(JSON.stringify({ rid, action, result:'OK', ms:Date.now()-started, pii:false }));
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
    else throw new AppError('NOT_FOUND', 'Ruta no encontrada.', 404);

    let result;
    if (action === 'session_status') {
      await authorizeCampusSession(body?.token);
      result = await serial(() => ConapeSession.status());
    } else if (action === 'session_connect') {
      await authorizeCampusSession(body?.token);
      result = await serial(() => ConapeSession.connect());
    } else if (action === 'session_disconnect') {
      await authorizeCampusSession(body?.token);
      result = await serial(async () => { await ConapeSession.close(); return ConapeSession.snapshot({ ready:null }); });
    } else {
      result = await serial(() => action === 'preview' ? preview(body) : submit(body));
    }

    console.log(JSON.stringify({ rid, action, result:result.code || result.status || 'OK', ms:Date.now()-started, pii:false }));
    sendJson(res, 200, result, origin);
  } catch (error) {
    const status = Number(error?.status || 500);
    const code = txt(error?.code || 'BRIDGE_ERROR');
    const stage = sanitizedStage(error);
    const errorFn = safeId(error?.fn);
    console.log(JSON.stringify({ rid, action, result:code, stage, status, ...(errorFn ? { fn:errorFn } : {}), ms:Date.now()-started, pii:false }));
    sendJson(res, status, { ok:false, error:code, code, stage, message:status >= 500 ? 'Servicio CONAPE temporalmente no disponible.' : txt(error?.message || 'Operación rechazada.') }, origin);
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

export { safeBodyKeys, safeRequestToken, contactPlan, sanitizedStage };
