import http from 'node:http';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const VERSION = 'V3.0.2';
const PORT = Number(process.env.PORT || 8080);
const CAMPUS_URL = String(process.env.CAMPUS_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec').trim();
const CONAPE_HOME = String(process.env.CONAPE_PORTAL_HOME_URL || 'https://online.conape.go.cr/apex/f?p=302:1').trim();
const CONAPE_FRIENDLY_HOME = 'https://online.conape.go.cr/apex/r/conaweb/prospectaci%C3%B3n-reclutador/home';
const CONAPE_USER = String(process.env.CONAPE_PORTAL_USERNAME || '');
const CONAPE_PASSWORD = String(process.env.CONAPE_PORTAL_PASSWORD || '');
const SOURCE_TTL_MS = Math.max(60_000, Number(process.env.SOURCE_TTL_MS || 180_000));
const REQUEST_TIMEOUT_MS = Math.max(5_000, Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70_000));
const SESSION_CACHE_TTL_MS = 30_000;
const STARTED_AT = new Date().toISOString();
const ALLOWED_ORIGINS = new Set(String(process.env.CAMPUS_ALLOWED_ORIGINS || 'https://anorteamerican.com,https://www.anorteamerican.com,https://anorteamericana-ship-it.github.io').split(',').map(v => v.trim()).filter(Boolean));
const ROLE_ALLOW = new Set(['VENTAS','ASESOR','ASESORA','ADMIN','ADMINISTRADOR','SUPERADMIN','SUPER ADMIN']);
const sourceVersions = new Map();
const rateBuckets = new Map();
const sessionValidationCache = new Map();
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
  for (const [key, value] of sessionValidationCache) {
    if (!value || value.expiresAt <= now) sessionValidationCache.delete(key);
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
      error.campus_ms = Date.now() - started;
      error.http_status = httpStatus;
      error.body_starts_with_angle = bodyStartsWithAngle;
      error.campus_busy = bodyStartsWithAngle && error.campus_ms >= 10_000;
      throw error;
    }
    if (!jsonParsed) {
      const error = new AppError('CAMPUS_BACKEND_INVALID', 'El Campus devolvió una respuesta inválida.', 503);
      error.fn = fn;
      error.campus_ms = Date.now() - started;
      error.http_status = httpStatus;
      throw error;
    }
    return parsed;
  } catch (error) {
    emit();
    if (!safeId(error?.fn)) {
      try { error.fn = fn; } catch {}
    }
    if (!Number.isFinite(Number(error?.campus_ms))) {
      try { error.campus_ms = Date.now() - started; } catch {}
    }
    throw error;
  }
}

async function cachedSessionValidation(cleanToken) {
  pruneState();
  const key = sha(cleanToken);
  const cached = sessionValidationCache.get(key);
  if (cached && cached.expiresAt > Date.now() && cached.session?.ok === true) {
    return { session:cached.session, cached:true };
  }
  const session = await campusCall({ fn:'validarSesion', token:cleanToken });
  if (session?.ok === true) sessionValidationCache.set(key, { session, expiresAt:Date.now() + SESSION_CACHE_TTL_MS });
  return { session, cached:false };
}

function validateSessionResult(session) {
  if (!session?.ok) throw new AppError('CAMPUS_SESSION_INVALID', 'La sesión del Campus no es válida.', 401);
  const role = roleOf(session);
  if (!ROLE_ALLOW.has(role)) throw new AppError('CAMPUS_ROLE_FORBIDDEN', 'Rol no autorizado para usar CONAPE.', 403);
  if (session.demo === true || session.read_only === true) throw new AppError('CAMPUS_READ_ONLY', 'La cuenta es de solo lectura.', 403);
  return { session, binding:userBinding(session) };
}

async function authorizeCampusSession(token) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401);
  rateLimit(cleanToken);
  const { session } = await cachedSessionValidation(cleanToken);
  const validated = validateSessionResult(session);
  return { ...validated, token:cleanToken };
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

async function authorizeCampusParallel(token, cedula) {
  const cleanToken = txt(token);
  if (!cleanToken) throw new AppError('CAMPUS_TOKEN_REQUIRED', 'Sesión de Campus requerida.', 401);
  rateLimit(cleanToken);
  const cleanCedula = digits(cedula);
  if (cleanCedula.length < 8 || cleanCedula.length > 12) throw new AppError('CEDULA_INVALID', 'Cédula inválida.', 422);

  const [{ session }, detail] = await Promise.all([
    cachedSessionValidation(cleanToken),
    campusCall({ fn:'getProspectoDetalle', token:cleanToken, cedula:cleanCedula }),
  ]);

  const validated = validateSessionResult(session);
  if (!detail || detail.ok === false) throw new AppError('PROSPECT_ACCESS_DENIED', 'No se pudo acceder a este prospecto.', 403);
  const prospecto = detail.prospecto || detail;
  if (campusCedula(prospecto) !== cleanCedula) throw new AppError('PROSPECT_CEDULA_MISMATCH', 'La cédula no coincide con el prospecto autorizado.', 409);
  if (financing(prospecto) !== 'CONAPE') throw new AppError('PROSPECT_NOT_CONAPE', 'El prospecto no utiliza financiamiento CONAPE.', 422);
  return { ...validated, token:cleanToken, prospecto, cedula:cleanCedula };
}

async function collectRecruitNavDebug(p) {
  const visibleButtonLabels = [];
  const selectRows = [];
  const apexItems = new Set();
  for (const frame of p.frames()) {
    const data = await frame.evaluate(() => {
      const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
      const clean = value => String(value || '').replace(/\s+/g,' ').trim();
      const controls = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
      const buttons = controls.map(el => clean([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '))).filter(Boolean).map(v => v.slice(0,40));
      const selects = Array.from(document.querySelectorAll('select')).filter(visible).map(el => {
        const id = String(el.id || '').trim();
        const value = String(el.value || '').trim();
        return { id, has_value:!!value && value !== '0' && value !== '-1' };
      }).filter(row => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(row.id));
      const apex = Array.from(document.querySelectorAll('[id^="P1_"],[id^="P2_"]')).map(el => String(el.id || '').trim()).filter(id => /^[A-Za-z][A-Za-z0-9_:\-.]{0,79}$/.test(id));
      return { buttons, selects, apex };
    }).catch(() => ({ buttons:[], selects:[], apex:[] }));
    for (const label of data.buttons || []) {
      if (visibleButtonLabels.length >= 40) break;
      if (!visibleButtonLabels.includes(label)) visibleButtonLabels.push(label);
    }
    for (const row of data.selects || []) {
      if (!selectRows.some(item => item.id === row.id)) selectRows.push({ id:row.id, has_value:!!row.has_value });
    }
    for (const id of data.apex || []) apexItems.add(id);
  }
  let urlPath = '';
  try { urlPath = new URL(p.url()).pathname; } catch {}
  return {
    event:'conape_recruit_nav_debug',
    version:VERSION,
    url_path:String(urlPath || '').slice(0,160),
    frames_count:p.frames().length,
    visible_button_labels:visibleButtonLabels.slice(0,40),
    select_ids:selectRows.map(row => row.id),
    select_has_value:selectRows.map(row => row.has_value),
    apex_items:[...apexItems],
    pii:false,
  };
}

async function selectRecruitContext(p, kind) {
  for (const frame of p.frames()) {
    const selects = frame.locator('select');
    const candidate = await selects.evaluateAll((nodes, targetKind) => {
      const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const visible = el => { try { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; } catch { return false; } };
      const labelOf = el => {
        const parts = [el.id || '', el.name || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || ''];
        try { for (const label of Array.from(el.labels || [])) parts.push(label.textContent || ''); } catch {}
        const container = el.closest('.t-Form-fieldContainer,.apex-item-wrapper,.t-Form-inputContainer');
        if (container) parts.push(container.querySelector('label')?.textContent || '');
        return norm(parts.join(' '));
      };
      const isTarget = text => targetKind === 'prospectador' ? /PROSPECTADOR|PROSPECTOR|RECLUTADOR/.test(text) : /EVENTO/.test(text);
      const index = nodes.findIndex(el => visible(el) && isTarget(labelOf(el)));
      if (index < 0) return null;
      const el = nodes[index];
      const current = String(el.value || '').trim();
      const hasValue = !!current && current !== '0' && current !== '-1';
      const options = Array.from(el.options || []).map(option => ({
        value:String(option.value || '').trim(),
        label:norm(option.textContent || option.label || ''),
        disabled:!!option.disabled,
      })).filter(option => !option.disabled && option.value && option.value !== '0' && option.value !== '-1' && !/SELECC|ESCOJA|--/.test(option.label));
      let target = '';
      if (!hasValue && options.length) {
        if (targetKind === 'prospectador') {
          target = (options.find(option => option.label.includes('ACADEMIA NORTEAMERICANA')) || options[0]).value;
        } else {
          const year = String(new Date().getFullYear());
          target = (options.find(option => /ACTIV|VIGENTE|ABIERTO|ACTUAL/.test(option.label)) || options.find(option => option.label.includes(year)) || options[0]).value;
        }
      }
      return { index, hasValue, target };
    }, kind).catch(() => null);
    if (!candidate) continue;
    let selected = false;
    if (!candidate.hasValue && candidate.target) {
      try {
        const select = selects.nth(candidate.index);
        await select.evaluate((el, value) => {
          el.value = value;
          el.dispatchEvent(new Event('input', { bubbles:true }));
          el.dispatchEvent(new Event('change', { bubbles:true }));
        }, candidate.target);
        selected = true;
        await sleep(1200);
      } catch {}
    }
    return { found:true, had_value:!!candidate.hasValue, selected };
  }
  return { found:false, had_value:false, selected:false };
}

async function prepareRecruitContext(p) {
  let prospectador = { found:false, had_value:false, selected:false };
  let evento = { found:false, had_value:false, selected:false };
  try { prospectador = await selectRecruitContext(p, 'prospectador'); } catch {}
  try { evento = await selectRecruitContext(p, 'evento'); } catch {}
  console.log(JSON.stringify({
    event:'conape_recruit_context',
    version:VERSION,
    prospectador_found:!!prospectador.found,
    prospectador_had_value:!!prospectador.had_value,
    prospectador_selected:!!prospectador.selected,
    evento_found:!!evento.found,
    evento_had_value:!!evento.had_value,
    evento_selected:!!evento.selected,
    pii:false,
  }));
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
  if (notFoundCode === 'CONAPE_RECRUIT_BUTTON_NOT_FOUND') {
    try { console.log(JSON.stringify(await collectRecruitNavDebug(p))); } catch {}
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

async function readApexSession(p) {
  return p.evaluate(() => {
    const clean = value => {
      const v = String(value ?? '').trim();
      return /^\d{4,}$/.test(v) ? v : '';
    };
    try {
      const u = new URL(location.href);
      const friendly = clean(u.searchParams.get('session'));
      if (friendly) return friendly;
      const legacy = String(u.searchParams.get('p') || '').split(':');
      const fromLegacy = clean(legacy[2]);
      if (fromLegacy) return fromLegacy;
    } catch {}
    const nodes = [
      document.querySelector('input[name="p_instance"]'),
      document.querySelector('input[name="pInstance"]'),
      document.getElementById('pInstance'),
    ];
    for (const node of nodes) {
      const value = clean(node?.value);
      if (value) return value;
    }
    return '';
  }).catch(() => '');
}

function homeUrlWithSession(sessionId) {
  const u = new URL(CONAPE_FRIENDLY_HOME);
  u.searchParams.set('session', sessionId);
  return u.href;
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
      return Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).some(el => /(^| )RECLUTAR( |$)/.test(norm([el.textContent||'',el.value||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||''].join(' '))));
    }).catch(() => false);
  },

  async authState(p) {
    return p.evaluate(() => {
      const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim();
      const visible = el => { const s=getComputedStyle(el),r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
      const cleanSession = value => /^\d{4,}$/.test(String(value ?? '').trim());
      const password = Array.from(document.querySelectorAll('input[type="password"]')).some(visible);
      const form = ['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'].every(id => !!document.getElementById(id));
      const path = decodeURIComponent(location.pathname || '').toLowerCase();
      const title = norm(document.title || '');
      const route = path.includes('/prospectacion-reclutador/') || path.includes('/prospectaci') && path.includes('reclutador');
      let sessionPresent = false;
      try {
        const u = new URL(location.href);
        sessionPresent = cleanSession(u.searchParams.get('session'));
        if (!sessionPresent) {
          const legacy = String(u.searchParams.get('p') || '').split(':');
          sessionPresent = cleanSession(legacy[2]);
        }
      } catch {}
      if (!sessionPresent) {
        const candidates = [document.querySelector('input[name="p_instance"]'), document.querySelector('input[name="pInstance"]'), document.getElementById('pInstance')];
        sessionPresent = candidates.some(node => cleanSession(node?.value));
      }
      const authenticated = !password && (form || (sessionPresent && (route || title.includes('PROSPECTACION RECLUTADOR'))));
      return { password, form, route, title, session_present:sessionPresent, authenticated };
    }).catch(() => ({ password:false, form:false, route:false, title:'', session_present:false, authenticated:false }));
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

  async homeWithSession(p) {
    let state = await this.authState(p);
    if (!state.authenticated) state = await this.login(p);
    const sessionId = await readApexSession(p);
    if (!sessionId) throw new AppError('CONAPE_APEX_SESSION_MISSING', 'CONAPE no expuso una sesión APEX válida.', 503);
    await p.goto(homeUrlWithSession(sessionId), { waitUntil:'domcontentloaded', timeout:30_000 });
    state = await this.authState(p);
    const sessionAfter = await readApexSession(p);
    console.log(JSON.stringify({ event:'conape_home_nav', version:VERSION, session_before:true, session_after:!!sessionAfter, authenticated:!!state.authenticated, route_ok:!!state.route, pii:false }));
    if (!state.authenticated || !sessionAfter) throw new AppError('CONAPE_HOME_SESSION_LOST', 'CONAPE no conservó la sesión al abrir Prospectación Reclutador.', 503);
    await prepareRecruitContext(p);
    return state;
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
    await this.homeWithSession(p);
    await clickVisibleByLabel(p, /(^| )RECLUTAR( |$)/i, 'CONAPE_RECRUIT_BUTTON_NOT_FOUND');

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
        const state = await ConapeSession.homeWithSession(p);
        result.home = state?.authenticated ? 'PASS' : 'FAIL';
      } catch {}
    }
    result.ms_por_tramo.home = Date.now() - started;

    started = Date.now();
    if (result.home === 'PASS') {
      try {
        await clickVisibleByLabel(p, /(^| )RECLUTAR( |$)/i, 'CONAPE_RECRUIT_BUTTON_NOT_FOUND');
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

async function lookupCedulaOnPage(p, cedula) {
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
  return state;
}

async function lookupCedulaOnFreshPage(cedula) {
  const { p, meta } = await ConapeSession.freshProspectoFromHome();
  const state = await lookupCedulaOnPage(p, cedula);
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

function campusIdentityForComparison(campus, conape) {
  const full = txt(first(campus, ['nombre','NOMBRE','nombre_completo','NOMBRE_COMPLETO']));
  const apellido1 = txt(first(campus, ['apellido_1','primer_apellido','APELLIDO_1','PRIMER_APELLIDO']));
  const apellido2 = txt(first(campus, ['apellido_2','segundo_apellido','APELLIDO_2','SEGUNDO_APELLIDO']));
  const given = txt(first(campus, ['nombres','NOMBRES','nombre_persona','NOMBRE_PERSONA']));
  if (apellido1 || apellido2 || given) return { apellido_1:apellido1, apellido_2:apellido2, nombre:given || full, full };

  const expected = [conape?.apellido_1, conape?.apellido_2, conape?.nombre].filter(Boolean).join(' ');
  if (full && expected && upper(full) === upper(expected)) {
    return { apellido_1:txt(conape?.apellido_1), apellido_2:txt(conape?.apellido_2), nombre:txt(conape?.nombre), full };
  }

  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 3) return { apellido_1:parts[0], apellido_2:parts[1], nombre:parts.slice(2).join(' '), full };
  return { apellido_1:'', apellido_2:'', nombre:full, full };
}

function compareState(a, b, normalizer = upper) {
  const av = normalizer(a);
  const bv = normalizer(b);
  if (!av && !bv) return 'vacio';
  if (!av || !bv) return 'falta';
  return av === bv ? 'igual' : 'diferente';
}

function buildExecutionComparison(campus, conape, plan) {
  const identity = campusIdentityForComparison(campus, conape);
  const campusData = {
    cedula:campusCedula(campus),
    apellido_1:identity.apellido_1,
    apellido_2:identity.apellido_2,
    nombre:identity.nombre,
    correo:campusEmail(campus),
    whatsapp:campusPhone(campus),
  };
  const conapeData = {
    cedula:digits(conape?.cedula),
    apellido_1:txt(conape?.apellido_1),
    apellido_2:txt(conape?.apellido_2),
    nombre:txt(conape?.nombre),
    correo:email(conape?.correo),
    telefono:digits(conape?.telefono).slice(-8),
  };
  const phoneAction = plan.update_telefono ? 'Actualizar desde Campus' : (campusData.whatsapp && campusData.whatsapp === conapeData.telefono ? 'Coincide' : 'Conservar CONAPE');
  const mailAction = plan.update_correo ? 'Completar desde Campus' : (campusData.correo && conapeData.correo && campusData.correo !== conapeData.correo ? 'Conservar CONAPE · Campus queda alterno' : (campusData.correo && campusData.correo === conapeData.correo ? 'Coincide' : 'Conservar CONAPE'));
  return {
    campus:campusData,
    conape:conapeData,
    rows:[
      { key:'cedula', label:'Cédula', campus:campusData.cedula, conape:conapeData.cedula, final:conapeData.cedula || campusData.cedula, state:compareState(campusData.cedula, conapeData.cedula, digits), rule:'Coincidencia por cédula' },
      { key:'apellido_1', label:'Primer Apellido', campus:campusData.apellido_1, conape:conapeData.apellido_1, final:conapeData.apellido_1, state:compareState(campusData.apellido_1, conapeData.apellido_1), rule:'Comparación Campus ↔ CONAPE · no se modifica identidad' },
      { key:'apellido_2', label:'Segundo Apellido', campus:campusData.apellido_2, conape:conapeData.apellido_2, final:conapeData.apellido_2, state:compareState(campusData.apellido_2, conapeData.apellido_2), rule:'Comparación Campus ↔ CONAPE · no se modifica identidad' },
      { key:'nombre', label:'Nombre', campus:campusData.nombre, conape:conapeData.nombre, final:conapeData.nombre, state:compareState(campusData.nombre, conapeData.nombre), rule:'Comparación Campus ↔ CONAPE · no se modifica identidad' },
      { key:'telefono', label:'Teléfono', campus:campusData.whatsapp, conape:conapeData.telefono, final:plan.telefono, state:compareState(campusData.whatsapp, conapeData.telefono, digits), rule:`${phoneAction} · WhatsApp Campus normalizado a 8 dígitos` },
      { key:'correo', label:'Correo', campus:campusData.correo, conape:conapeData.correo, final:plan.correo, state:compareState(campusData.correo, conapeData.correo, email), rule:mailAction },
    ],
    final:{ telefono:plan.telefono, correo:plan.correo, update_telefono:plan.update_telefono, update_correo:plan.update_correo },
  };
}

function assertIdentityMatch(comparison) {
  const keys = ['cedula','apellido_1','apellido_2','nombre'];
  if (comparison.rows.some(row => keys.includes(row.key) && row.state !== 'igual')) {
    const error = new AppError('IDENTITY_MISMATCH', 'La identidad de CONAPE no coincide con el prospecto del Campus.', 409, 'BEFORE_CREATE');
    error.comparison = comparison;
    throw error;
  }
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
    await ConapeSession.homeWithSession(p);
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

async function execute(body) {
  const started = Date.now();
  const timing = { campus:null, form:null, lookup:null, fill:null, create:null };
  let finalCode = 'BRIDGE_ERROR';
  let finalStage = 'PRECHECK';
  let comparison = null;
  try {
    let t = Date.now();
    const auth = await authorizeCampusParallel(body?.token, body?.cedula);
    timing.campus = Date.now() - t;

    t = Date.now();
    const { p, meta } = await ConapeSession.freshProspectoFromHome();
    timing.form = Date.now() - t;

    t = Date.now();
    const state = await lookupCedulaOnPage(p, auth.cedula);
    timing.lookup = Date.now() - t;

    const plan = contactPlan(auth.prospecto, state);
    comparison = buildExecutionComparison(auth.prospecto, state, plan);
    assertIdentityMatch(comparison);

    t = Date.now();
    const afterFill = await fillContacts(p, plan);
    timing.fill = Date.now() - t;
    if (identityHash(afterFill) !== identityHash(state)) {
      const error = new AppError('IDENTITY_CHANGED', 'La identidad CONAPE cambió antes del envío.', 409, 'BEFORE_CREATE');
      error.comparison = comparison;
      throw error;
    }

    t = Date.now();
    const created = await clickCreateOnce(p, meta, 0);
    const outcome = created.outcome || {};
    if (created.createCount !== 1) throw new AppError('WRITE_RESULT_UNCERTAIN', 'No se pudo confirmar una única solicitud CREATE. No repita el envío.', 409, 'AFTER_CREATE');
    if (outcome.duplicate_message) throw new AppError('DUPLICATE', 'CONAPE indicó que el prospecto ya existe.', 409, 'AFTER_CREATE');

    let estado = '';
    if (outcome.success_message && !outcome.server_error_message) {
      estado = await readEstadoAfterCreate(p, auth.cedula);
    } else {
      estado = await readEstadoAfterCreate(p, auth.cedula);
      if (!estado && outcome.server_error_message) throw new AppError('PORTAL_ERROR', 'CONAPE rechazó la creación.', 422, 'AFTER_CREATE');
      if (!estado) throw new AppError('WRITE_RESULT_UNCERTAIN', 'CONAPE recibió CREATE pero no confirmó el resultado. No repita el envío.', 409, 'AFTER_CREATE');
    }
    timing.create = Date.now() - t;

    finalCode = 'CREATED';
    finalStage = 'AFTER_CREATE';
    return {
      ok:true,
      confirmed:true,
      code:'CREATED',
      stage:'AFTER_CREATE',
      create_request_observed:true,
      write_count:1,
      success_signal:true,
      estado_conape_raw:estado,
      comparison,
      timing:{ ...timing, total:Date.now() - started },
    };
  } catch (error) {
    finalCode = txt(error?.code || 'BRIDGE_ERROR');
    finalStage = sanitizedStage(error);
    if (comparison && !error?.comparison) {
      try { error.comparison = comparison; } catch {}
    }
    try { error.execute_timing = { ...timing, total:Date.now() - started }; } catch {}
    throw error;
  } finally {
    console.log(JSON.stringify({
      event:'conape_execute_telemetry',
      version:VERSION,
      code:finalCode,
      stage:finalStage,
      ms_total:Date.now() - started,
      ms_campus:timing.campus,
      ms_form:timing.form,
      ms_lookup:timing.lookup,
      ms_fill:timing.fill,
      ms_create:timing.create,
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
    else if (url.pathname === '/v1/recruit/execute') action = 'execute';
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
    } else if (action === 'execute') {
      result = await serial(() => execute(body));
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
    const campusBusy = error?.campus_busy === true;
    console.log(JSON.stringify({ rid, action, result:code, stage, status, ...(errorFn ? { fn:errorFn } : {}), ms:Date.now()-started, pii:false }));
    sendJson(res, status, {
      ok:false,
      error:code,
      code,
      stage,
      message:campusBusy ? 'El Campus está ocupado, probá de nuevo en unos segundos.' : (status >= 500 ? 'Servicio CONAPE temporalmente no disponible.' : txt(error?.message || 'Operación rechazada.')),
      ...(campusBusy ? { campus_busy:true, retryable:true } : {}),
      ...(error?.comparison ? { comparison:error.comparison } : {}),
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

export { safeBodyKeys, safeRequestToken, contactPlan, sanitizedStage, buildExecutionComparison };
