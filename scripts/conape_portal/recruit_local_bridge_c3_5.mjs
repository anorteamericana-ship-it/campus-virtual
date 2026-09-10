import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IDENTITY_SOURCE,
  PREVIEW_TTL_MS,
  validatePreviewRequest,
  validateSubmitRequest,
  classifyCreateOutcome,
} from './recruit_bridge_contract_c3_5.mjs';
import { allowedTarget } from './discover_recruit_form_c3_3.mjs';

const HOST = 'online.conape.go.cr';
const DEFAULT_PORT = 8765;
const POLL_MS = 500;
const NAV_TIMEOUT_MS = 20000;
const LOOKUP_TIMEOUT_MS = 15000;
const CREATE_TIMEOUT_MS = 20000;

class BridgeError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'BridgeError';
    this.code = code;
    this.status = status;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const digits = value => String(value ?? '').replace(/\D/g, '');
const identityHash = state => crypto.createHash('sha256').update([
  String(state?.apellido_1 || '').trim(),
  String(state?.apellido_2 || '').trim(),
  String(state?.nombre || '').trim(),
].join('\n'), 'utf8').digest('hex');

function parseArgs(argv) {
  const out = { port:DEFAULT_PORT };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--profile' && value) { out.profileDir = path.resolve(value); i += 1; continue; }
    if (key === '--root' && value) { out.rootDir = path.resolve(value); i += 1; continue; }
    if (key === '--port' && value) { out.port = Number(value); i += 1; continue; }
    throw new BridgeError('CLI_ARGUMENT_INVALID', `Argumento inválido: ${key}`, 500);
  }
  if (!out.profileDir) throw new BridgeError('PROFILE_REQUIRED', 'Falta --profile.', 500);
  if (!out.rootDir) throw new BridgeError('ROOT_REQUIRED', 'Falta --root.', 500);
  if (!Number.isInteger(out.port) || out.port < 1024 || out.port > 65535) throw new BridgeError('PORT_INVALID', 'Puerto inválido.', 500);
  return out;
}

function parseActivePort(raw) {
  const port = Number(String(raw || '').trim().split(/\r?\n/)[0]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new BridgeError('DEVTOOLS_PORT_INVALID', 'DevToolsActivePort inválido.', 500);
  return port;
}

function isProspectoPath(raw) {
  try {
    const u = new URL(raw);
    return decodeURIComponent(u.pathname).toLowerCase().includes('/prospecto');
  } catch {
    return String(raw || '').toLowerCase().includes('/prospecto');
  }
}

async function listTargets(cdpPort) {
  const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`, { signal:AbortSignal.timeout(3000) });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function conapeTargets(targets) {
  return (targets || [])
    .filter(t => t?.type === 'page' && t?.webSocketDebuggerUrl && allowedTarget(t.url))
    .sort((a, b) => Number(isProspectoPath(b.url)) - Number(isProspectoPath(a.url)));
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }
  async connect() {
    if (typeof globalThis.WebSocket !== 'function') throw new BridgeError('WEBSOCKET_UNAVAILABLE', 'Se requiere Node 22 o superior.', 500);
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.wsUrl);
      this.socket = socket;
      const timer = setTimeout(() => reject(new BridgeError('CDP_CONNECT_TIMEOUT', 'Chrome no respondió.', 503)), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new BridgeError('CDP_CONNECT_FAILED', 'No se pudo conectar al navegador CONAPE.', 503)); });
      socket.addEventListener('message', event => {
        let msg;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        if (msg.id) {
          const pending = this.pending.get(msg.id);
          if (!pending) return;
          this.pending.delete(msg.id);
          if (msg.error) pending.reject(new BridgeError('CDP_PROTOCOL_ERROR', msg.error.message || 'Error CDP.', 503));
          else pending.resolve(msg.result || {});
          return;
        }
        for (const fn of this.listeners.get(msg.method) || []) {
          try { fn(msg.params || {}); } catch {}
        }
      });
      socket.addEventListener('close', () => {
        for (const pending of this.pending.values()) pending.reject(new BridgeError('CDP_CLOSED', 'Se cerró la sesión del navegador CONAPE.', 503));
        this.pending.clear();
      });
    });
  }
  on(method, fn) {
    const list = this.listeners.get(method) || [];
    list.push(fn);
    this.listeners.set(method, list);
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, userGesture = false) {
    const response = await this.send('Runtime.evaluate', {
      expression,
      returnByValue:true,
      awaitPromise:true,
      userGesture:!!userGesture,
    });
    if (response.exceptionDetails) throw new BridgeError('CDP_EVALUATION_ERROR', 'No se pudo evaluar la página CONAPE.', 503);
    return response.result?.value;
  }
  close() { try { this.socket?.close(); } catch {} }
}

async function inspect(target, expression, userGesture = false) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    return await client.eval(expression, userGesture);
  } finally {
    client.close();
  }
}

const FIND_RECRUIT = `(() => {
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
  const hit=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el=>norm([el.textContent||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||'',el.value||''].join(' ')).includes('RECLUTAR PROSPECTOS'));
  if(!hit)return {found:false};
  hit.click();
  return {found:true};
})()`;

const FORM_READY = `(() => {
  const ids=['P2_PRS_CEDULA','P2_PRS_APELLIDO_1','P2_PRS_APELLIDO_2','P2_PRS_NOMBRE','P2_PRS_CELULAR','P2_PRS_EMAIL'];
  return {ready:ids.every(id=>!!document.getElementById(id)),path:location.pathname};
})()`;

function cedulaLookupExpression(cedula) {
  const value = JSON.stringify(cedula);
  return `(() => {
    const el=document.getElementById('P2_PRS_CEDULA');
    if(!el)return {ok:false};
    const proto=Object.getPrototypeOf(el),d=Object.getOwnPropertyDescriptor(proto,'value');
    if(d&&d.set)d.set.call(el,${value});else el.value=${value};
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    el.focus();el.blur();
    return {ok:true};
  })()`;
}

const LOOKUP_DETAILS = `(() => {
  const val=id=>String(document.getElementById(id)?.value||'').trim();
  const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
  const alertText=norm(nodes.map(n=>n.textContent||'').join(' '));
  const result={
    cedula:val('P2_PRS_CEDULA'),
    apellido_1:val('P2_PRS_APELLIDO_1'),
    apellido_2:val('P2_PRS_APELLIDO_2'),
    nombre:val('P2_PRS_NOMBRE'),
    telefono:val('P2_PRS_CELULAR'),
    correo:val('P2_PRS_EMAIL'),
    visible_alerts:nodes.length,
    duplicate_warning:/YA EXIST|DUPLIC/.test(alertText)&&/CEDULA|PROSPECT/.test(alertText),
    validation_warning:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(alertText)
  };
  result.identity_ready=!!(result.apellido_1&&result.nombre);
  return result;
})()`;

function contactFillExpression({ telefono, correo, update_telefono, update_correo }) {
  const data = JSON.stringify({ telefono, correo, update_telefono:!!update_telefono, update_correo:!!update_correo }).replace(/</g, '\\u003c');
  return `(() => {
    const data=${data};
    const setValue=(id,value)=>{
      const el=document.getElementById(id);if(!el)return false;
      const proto=Object.getPrototypeOf(el),d=Object.getOwnPropertyDescriptor(proto,'value');
      if(d&&d.set)d.set.call(el,value);else el.value=value;
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
      el.focus();el.blur();return true;
    };
    let changed=0;
    if(data.update_telefono){if(!setValue('P2_PRS_CELULAR',data.telefono))return {ok:false};changed++;}
    if(data.update_correo){if(!setValue('P2_PRS_EMAIL',data.correo))return {ok:false};changed++;}
    return {ok:true,changed};
  })()`;
}

const VALIDATION_STATE = `(() => {
  const val=id=>String(document.getElementById(id)?.value||'').trim();
  const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error,.t-Alert--danger,.t-Alert--warning')).filter(visible);
  const text=norm(nodes.map(n=>n.textContent||'').join(' '));
  const phone=val('P2_PRS_CELULAR').replace(/\D/g,'');
  return {
    cedula:val('P2_PRS_CEDULA'),apellido_1:val('P2_PRS_APELLIDO_1'),apellido_2:val('P2_PRS_APELLIDO_2'),nombre:val('P2_PRS_NOMBRE'),
    identity_ready:!!(val('P2_PRS_APELLIDO_1')&&val('P2_PRS_NOMBRE')),
    phone_ready:phone.length===8,
    duplicate_warning:/YA EXIST|DUPLIC/.test(text)&&/CEDULA|PROSPECT/.test(text),
    validation_warning:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(text),
    visible_alerts:nodes.length
  };
})()`;

const CLICK_CREATE = `(() => {
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
  const hit=Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el=>norm([el.textContent||'',el.getAttribute('aria-label')||'',el.getAttribute('title')||'',el.value||''].join(' ')).includes('CREAR NUEVO PROSPECTO'));
  if(!hit)return {clicked:false};hit.click();return {clicked:true};
})()`;

const OUTCOME_STATE = `(() => {
  const visible=el=>{try{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;}catch{return false;}};
  const norm=v=>String(v||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const nodes=Array.from(document.querySelectorAll('[role="alert"],.t-Alert,.a-Alert,.t-Body-alert,.t-Form-error,.apex-page-item-error')).filter(visible);
  const text=norm(nodes.map(n=>n.textContent||'').join(' '));
  return {path:location.pathname,success_message:/CREAD|REGISTRAD|GUARDAD|CORRECTAMENTE|EXITOS/.test(text)&&!/ERROR|INVALID/.test(text),duplicate_message:/YA EXIST|DUPLIC/.test(text),error_message:/ERROR|INVALID|OBLIGATOR|REQUERID/.test(text),visible_alerts:nodes.length};
})()`;

function safeRequestToken(postData) {
  const raw = String(postData || '');
  try {
    const params = new URLSearchParams(raw);
    const value = String(params.get('p_request') || '').trim().toUpperCase();
    return /^[A-Z][A-Z0-9_:\-]{0,39}$/.test(value) ? value : '';
  } catch { return ''; }
}

async function ensureProspectoTarget(cdpPort) {
  const deadline = Date.now() + NAV_TIMEOUT_MS;
  let lastClick = 0;
  while (Date.now() < deadline) {
    const targets = conapeTargets(await listTargets(cdpPort));
    const prospect = targets.find(t => isProspectoPath(t.url));
    if (prospect) {
      const ready = await inspect(prospect, FORM_READY).catch(() => null);
      if (ready?.ready) return prospect;
    }
    if (Date.now() - lastClick > 1800) {
      for (const target of targets) {
        const result = await inspect(target, FIND_RECRUIT, true).catch(() => null);
        if (result?.found) { lastClick = Date.now(); break; }
      }
    }
    await sleep(POLL_MS);
  }
  throw new BridgeError('CONAPE_SESSION_NOT_READY', 'Inicie sesión en CONAPE y deje abierta la pantalla de Reclutamiento.', 503);
}

async function lookupCedula(target, cedula) {
  const start = await inspect(target, cedulaLookupExpression(cedula));
  if (!start?.ok) throw new BridgeError('CEDULA_LOOKUP_START_FAILED', 'No se pudo iniciar la búsqueda por cédula en CONAPE.', 502);
  const deadline = Date.now() + LOOKUP_TIMEOUT_MS;
  let state = null;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    state = await inspect(target, LOOKUP_DETAILS).catch(() => null);
    if (state?.identity_ready || state?.duplicate_warning || state?.validation_warning) break;
  }
  if (!state?.identity_ready) {
    if (state?.duplicate_warning) throw new BridgeError('DUPLICATE', 'CONAPE indica que la cédula ya está registrada.', 409);
    if (state?.validation_warning) throw new BridgeError('CONAPE_VALIDATION', 'CONAPE rechazó o no reconoció la cédula.', 422);
    throw new BridgeError('CONAPE_IDENTITY_NOT_FOUND', 'CONAPE no devolvió nombre y primer apellido para esa cédula.', 422);
  }
  if (digits(state.cedula) !== cedula) throw new BridgeError('CEDULA_LOOKUP_MISMATCH', 'La cédula devuelta por CONAPE no coincide.', 409);
  return state;
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
    '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon',
  })[ext] || 'application/octet-stream';
}

function safeStaticPath(rootDir, pathname) {
  const decoded = decodeURIComponent(pathname.split('?')[0] || '/');
  const rel = decoded === '/' ? 'login.html' : decoded.replace(/^\/+/, '');
  const top = rel.split(/[\\/]/)[0];
  const rootFiles = new Set(['login.html','ventas.html','campus.html','favicon.ico']);
  const allowedDirs = new Set(['src','styles','vendor','assets']);
  if (!rootFiles.has(rel) && !allowedDirs.has(top)) return null;
  const full = path.resolve(rootDir, rel);
  const root = path.resolve(rootDir) + path.sep;
  if (!full.startsWith(root) && full !== path.resolve(rootDir)) return null;
  return full;
}

function readJsonBody(req, maxBytes = 65536) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) { reject(new BridgeError('BODY_TOO_LARGE', 'Solicitud demasiado grande.', 413)); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new BridgeError('BAD_JSON', 'JSON inválido.', 400)); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(body),
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',
  });
  res.end(body);
}

function cookieHas(req, name, value) {
  const cookie = String(req.headers.cookie || '');
  return cookie.split(';').map(v => v.trim()).some(v => v === `${name}=${value}`);
}

function localOriginAllowed(req, port, cookieName, cookieValue) {
  const origin = String(req.headers.origin || '');
  const fetchSite = String(req.headers['sec-fetch-site'] || '');
  const allowedOrigin = origin === `http://127.0.0.1:${port}` || origin === `http://localhost:${port}`;
  return allowedOrigin && (fetchSite === 'same-origin' || fetchSite === '') && cookieHas(req, cookieName, cookieValue);
}

function createBridge({ profileDir, rootDir, port }) {
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  if (!fs.existsSync(portFile)) throw new BridgeError('DEVTOOLS_PORT_FILE_MISSING', 'No existe DevToolsActivePort.', 500);
  const cdpPort = parseActivePort(fs.readFileSync(portFile, 'utf8'));
  const sourceVersions = new Map();
  const cookieName = 'an_c35_bridge';
  const cookieValue = crypto.randomBytes(24).toString('base64url');
  let writeInProgress = false;

  const prune = () => {
    const now = Date.now();
    for (const [key, value] of sourceVersions) if (!value || value.expiresAt <= now || value.consumed) sourceVersions.delete(key);
  };

  async function preview(body) {
    const parsed = validatePreviewRequest(body);
    if (!parsed.ok) throw new BridgeError(parsed.error, 'Cédula inválida.', 422);
    const target = await ensureProspectoTarget(cdpPort);
    const state = await lookupCedula(target, parsed.cedula);
    if (state.duplicate_warning) throw new BridgeError('DUPLICATE', 'CONAPE indica que la cédula ya está registrada.', 409);
    if (state.validation_warning) throw new BridgeError('CONAPE_VALIDATION', 'CONAPE mostró una validación para esa cédula.', 422);

    prune();
    const token = crypto.randomBytes(24).toString('base64url');
    sourceVersions.set(token, {
      cedula:parsed.cedula,
      identityHash:identityHash(state),
      expiresAt:Date.now() + PREVIEW_TTL_MS,
      consumed:false,
    });
    return {
      ok:true,
      found:true,
      prospecto:{
        cedula:parsed.cedula,
        apellido_1:state.apellido_1,
        apellido_2:state.apellido_2,
        nombre:state.nombre,
        telefono:state.telefono,
        correo:state.correo,
      },
      source_version:token,
      expires_at:new Date(Date.now() + PREVIEW_TTL_MS).toISOString(),
      can_submit:true,
      identity_source:IDENTITY_SOURCE,
      local_bridge:true,
    };
  }

  async function submit(body) {
    if (writeInProgress) throw new BridgeError('WRITE_IN_PROGRESS', 'Ya hay una creación en curso.', 409);
    const parsed = validateSubmitRequest(body);
    if (!parsed.ok) throw new BridgeError(parsed.error, 'La solicitud de creación no pasó las guardas del bridge.', 422);
    prune();
    const source = sourceVersions.get(parsed.source_version);
    if (!source || source.consumed) throw new BridgeError('SOURCE_VERSION_INVALID', 'La comparación venció o ya fue utilizada. Vuelva a abrir Reclutar en CONAPE.', 409);
    if (source.expiresAt <= Date.now()) { sourceVersions.delete(parsed.source_version); throw new BridgeError('SOURCE_VERSION_EXPIRED', 'La comparación venció. Vuelva a abrir Reclutar en CONAPE.', 409); }
    if (source.cedula !== parsed.cedula) throw new BridgeError('SOURCE_VERSION_CEDULA_MISMATCH', 'La cédula no coincide con el preflight.', 409);

    const target = await ensureProspectoTarget(cdpPort);
    const current = await inspect(target, LOOKUP_DETAILS);
    if (!current?.identity_ready || digits(current.cedula) !== parsed.cedula) throw new BridgeError('PREVIEW_CONTEXT_CHANGED', 'La pantalla CONAPE cambió desde la comparación. Vuelva a abrir Reclutar.', 409);
    if (identityHash(current) !== source.identityHash) throw new BridgeError('IDENTITY_CHANGED', 'La identidad devuelta por CONAPE cambió. Vuelva a comparar antes de crear.', 409);
    if (current.duplicate_warning) throw new BridgeError('DUPLICATE', 'CONAPE indica que la cédula ya está registrada.', 409);

    const fill = await inspect(target, contactFillExpression(parsed.prospecto));
    if (!fill?.ok) throw new BridgeError('CONTACT_FILL_FAILED', 'No se pudieron preparar teléfono/correo.', 502);
    await sleep(1000);
    const validation = await inspect(target, VALIDATION_STATE);
    if (!validation?.identity_ready || digits(validation.cedula) !== parsed.cedula) throw new BridgeError('IDENTITY_LOST_BEFORE_CREATE', 'La identidad cambió antes de crear.', 409);
    if (identityHash(validation) !== source.identityHash) throw new BridgeError('IDENTITY_CHANGED_BEFORE_CREATE', 'Nombre/apellidos cambiaron antes de crear.', 409);
    if (!validation.phone_ready) throw new BridgeError('PHONE_NOT_READY', 'El teléfono final debe quedar en 8 dígitos.', 422);
    if (validation.duplicate_warning) throw new BridgeError('DUPLICATE', 'CONAPE indica que la cédula ya está registrada.', 409);
    if (validation.validation_warning) throw new BridgeError('CONAPE_VALIDATION', 'CONAPE muestra una validación; no se hará CREATE.', 422);

    source.consumed = true;
    writeInProgress = true;
    const client = new CdpClient(target.webSocketDebuggerUrl);
    const requests = [];
    const statusById = new Map();
    try {
      await client.connect();
      await client.send('Runtime.enable');
      await client.send('Page.enable');
      await client.send('Network.enable');
      client.on('Network.requestWillBeSent', params => {
        try {
          const req = params.request || {};
          const u = new URL(req.url);
          if (u.hostname.toLowerCase() !== HOST || String(req.method || '').toUpperCase() !== 'POST') return;
          const requestToken = safeRequestToken(req.postData || '');
          if (u.pathname === '/apex/wwv_flow.accept' && requestToken === 'CREATE') requests.push({ requestId:params.requestId, request_token:requestToken });
        } catch {}
      });
      client.on('Network.responseReceived', params => {
        try {
          const u = new URL(params.response?.url || '');
          if (u.hostname.toLowerCase() === HOST) statusById.set(params.requestId, Number(params.response?.status || 0));
        } catch {}
      });

      const clicked = await client.eval(CLICK_CREATE, true);
      if (!clicked?.clicked) throw new BridgeError('CREATE_CLICK_FAILED', 'No se encontró Crear nuevo Prospecto.', 502);

      const deadline = Date.now() + CREATE_TIMEOUT_MS;
      let outcome = null;
      while (Date.now() < deadline) {
        await sleep(POLL_MS);
        outcome = await client.eval(OUTCOME_STATE).catch(() => null);
        if (outcome?.success_message || outcome?.duplicate_message || outcome?.error_message) break;
      }
      const createRequests = requests.map(r => ({ request_token:r.request_token, status:statusById.get(r.requestId) || null }));
      const writeCount = createRequests.length;
      const meta = {
        create_request_observed:writeCount > 0,
        request_contract:createRequests,
        outcome:outcome || {},
        success_signal:!!outcome?.success_message,
        write_performed:writeCount > 0,
        write_count:writeCount,
      };
      const result = classifyCreateOutcome(meta);
      const requestId = crypto.randomBytes(8).toString('hex');
      console.log(`[C3.5] submit result=${result.code} request=${requestId} pii=false cookies=false hidden=false`);
      return {
        ok:result.ok,
        confirmed:result.confirmed,
        code:result.code,
        request_id:requestId,
        create_request_observed:meta.create_request_observed,
        write_count:writeCount,
        success_signal:meta.success_signal,
        duplicate_message:!!outcome?.duplicate_message,
        error_message:!!outcome?.error_message,
        local_bridge:true,
      };
    } finally {
      client.close();
      writeInProgress = false;
      sourceVersions.delete(parsed.source_version);
    }
  }

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
      if (req.method === 'GET' && url.pathname === '/api/conape-recruit/health') {
        sendJson(res, 200, { ok:true, service:'C3.5_LOCAL_BRIDGE', loopback:true, write_in_progress:writeInProgress });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/conape-recruit') {
        if (!localOriginAllowed(req, port, cookieName, cookieValue)) throw new BridgeError('LOCAL_ORIGIN_REQUIRED', 'Solicitud rechazada por la guarda loopback.', 403);
        const body = await readJsonBody(req);
        let result;
        if (body?.fn === 'conapePortalRecruitPreview') result = await preview(body);
        else if (body?.fn === 'conapePortalRecruitSubmit') result = await submit(body);
        else throw new BridgeError('FN_NOT_ALLOWED', 'Función no permitida en el bridge.', 404);
        sendJson(res, 200, result);
        return;
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') throw new BridgeError('METHOD_NOT_ALLOWED', 'Método no permitido.', 405);
      const file = safeStaticPath(rootDir, url.pathname);
      if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw new BridgeError('NOT_FOUND', 'Archivo no encontrado.', 404);
      const data = fs.readFileSync(file);
      res.writeHead(200, {
        'Content-Type':mimeFor(file),
        'Content-Length':data.length,
        'Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff',
        'Set-Cookie':`${cookieName}=${cookieValue}; HttpOnly; SameSite=Strict; Path=/`,
      });
      if (req.method === 'HEAD') res.end(); else res.end(data);
    } catch (error) {
      const status = Number(error?.status || 500);
      const code = String(error?.code || 'BRIDGE_ERROR');
      if (status >= 500) console.error(`[C3.5] ${code}: ${error?.message || 'error'}`);
      sendJson(res, status, { ok:false, error:code, message:error?.message || 'Error del bridge local.' });
    }
  });

  return { server, cdpPort };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { server } = createBridge(options);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, '127.0.0.1', resolve);
  });
  console.log(`C3.5 LOCAL BRIDGE READY · http://127.0.0.1:${options.port}`);
  console.log('Loopback only · identidad CONAPE read-only · CREATE solo desde el botón explícito del Campus.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try { await main(); }
  catch (error) {
    console.error(`C3.5 LOCAL BRIDGE: BLOCK / ${error?.code || 'UNEXPECTED_ERROR'}`);
    console.error(error?.message || String(error));
    process.exitCode = 1;
  }
}

export {
  parseArgs,
  parseActivePort,
  safeStaticPath,
  localOriginAllowed,
  identityHash,
  contactFillExpression,
  LOOKUP_DETAILS,
  VALIDATION_STATE,
};
