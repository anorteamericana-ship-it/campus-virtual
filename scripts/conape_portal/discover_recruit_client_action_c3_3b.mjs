import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allowedTarget,
  safeUrl,
  isProspectoPath,
  conapeTargets,
  FIND_AND_OPEN_RECRUIT,
} from './discover_recruit_submit_contract_c3_3.mjs';

const POLL_MS = 700;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const NAV_RETRY_MS = 3000;
const MAX_NAV_ATTEMPTS = 5;

class DiscoveryError extends Error {
  constructor(reason, message) {
    super(message);
    this.name = 'DiscoveryError';
    this.reason = reason;
  }
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseActivePort(raw) {
  const port = Number(String(raw || '').trim().split(/\r?\n/)[0]);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new DiscoveryError('DEVTOOLS_PORT_INVALID', 'DevToolsActivePort inválido.');
  }
  return port;
}

function classifyClientActionSource(rawSource) {
  const source = String(rawSource || '');
  const token = value => {
    const s = String(value || '').trim();
    return /^[A-Za-z0-9_:\-]{1,80}$/.test(s) ? s : '';
  };
  const matchToken = regex => token(source.match(regex)?.[1] || '');

  const objectRequest = matchToken(/\brequest\s*:\s*['"]([A-Za-z0-9_:\-]{1,80})['"]/i);
  const submitRequest = matchToken(/apex\.(?:page\.)?submit\s*\(\s*['"]([A-Za-z0-9_:\-]{1,80})['"]/i);
  const confirmRequest = matchToken(/apex\.(?:page\.)?confirm\s*\([\s\S]*?,\s*['"]([A-Za-z0-9_:\-]{1,80})['"]/i);
  const eventCandidate = matchToken(/apex\.event\.trigger\s*\([\s\S]*?,\s*['"]([A-Za-z0-9_:\-]{1,80})['"]/i);
  const processCandidate = matchToken(/apex\.server\.(?:process|plugin)\s*\(\s*['"]([A-Za-z0-9_:\-]{1,80})['"]/i);

  const apis = [
    ['apex.page.confirm', /apex\.page\.confirm\s*\(/i],
    ['apex.confirm', /apex\.confirm\s*\(/i],
    ['apex.page.submit', /apex\.page\.submit\s*\(/i],
    ['apex.submit', /apex\.submit\s*\(/i],
    ['apex.navigation.redirect', /apex\.navigation\.redirect\s*\(/i],
    ['apex.navigation.dialog', /apex\.navigation\.dialog\s*\(/i],
    ['apex.event.trigger', /apex\.event\.trigger\s*\(/i],
    ['apex.server.process', /apex\.server\.process\s*\(/i],
    ['apex.server.plugin', /apex\.server\.plugin\s*\(/i],
    ['apex.widget.button.redirect', /apex\.widget\.button\.redirect\s*\(/i],
  ].filter(([, regex]) => regex.test(source)).map(([name]) => name);

  let family = source.trim() ? 'JAVASCRIPT_OTHER' : 'NONE';
  if (/apex\.page\.confirm\s*\(/i.test(source)) family = 'APEX_PAGE_CONFIRM';
  else if (/apex\.confirm\s*\(/i.test(source)) family = 'APEX_CONFIRM';
  else if (/apex\.page\.submit\s*\(/i.test(source)) family = 'APEX_PAGE_SUBMIT';
  else if (/apex\.submit\s*\(/i.test(source)) family = 'APEX_SUBMIT';
  else if (/apex\.navigation\.redirect\s*\(/i.test(source)) family = 'APEX_NAVIGATION_REDIRECT';
  else if (/apex\.navigation\.dialog\s*\(/i.test(source)) family = 'APEX_NAVIGATION_DIALOG';
  else if (/apex\.event\.trigger\s*\(/i.test(source)) family = 'APEX_EVENT_TRIGGER';
  else if (/apex\.server\.process\s*\(/i.test(source)) family = 'APEX_SERVER_PROCESS';
  else if (/apex\.server\.plugin\s*\(/i.test(source)) family = 'APEX_SERVER_PLUGIN';
  else if (/apex\.widget\.button\.redirect\s*\(/i.test(source)) family = 'APEX_WIDGET_BUTTON_REDIRECT';

  return {
    family,
    request_candidate: objectRequest || submitRequest || confirmRequest,
    event_candidate: eventCandidate,
    process_candidate: processCandidate,
    confirmation_detected: /apex\.(?:page\.)?confirm\s*\(/i.test(source),
    submit_detected: /apex\.(?:page\.)?submit\s*\(/i.test(source),
    redirect_detected: /apex\.(?:navigation|widget\.button)\.(?:redirect|dialog)\s*\(/i.test(source),
    server_call_detected: /apex\.server\.(?:process|plugin)\s*\(/i.test(source),
    called_apis: apis,
    source_length: source.length,
  };
}

const CLASSIFIER_SOURCE = classifyClientActionSource.toString();
const INSPECT_CLIENT_ACTION = `(() => {
  const classify = ${CLASSIFIER_SOURCE};
  const norm = v => String(v || '').replace(/\\s+/g,' ').trim();
  const normUpper = v => norm(v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const candidates = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
  const hit = candidates.find(el => normUpper([el.textContent || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.value || ''].join(' ')).includes('CREAR NUEVO PROSPECTO'));
  if (!hit) return { ready:false, title:norm(document.title), path:location.pathname };

  const onclick = String(hit.getAttribute('onclick') || '');
  const action = classify(onclick);
  const safeToken = value => {
    const s = String(value || '').trim();
    return /^[A-Za-z0-9_:\\-]{1,80}$/.test(s) ? s : '';
  };
  const dataRequest = safeToken(hit.getAttribute('data-request')) || safeToken(hit.getAttribute('data-action'));
  if (!action.request_candidate && dataRequest) action.request_candidate = dataRequest;

  const form = hit.form || document.querySelector('form');
  let formPath = '';
  try {
    if (form) {
      const u = new URL(form.action, location.href);
      formPath = u.origin === location.origin ? u.pathname : '[EXTERNAL]';
    }
  } catch {}

  let jqueryEventTypes = [];
  try {
    const jq = window.apex?.jQuery || window.jQuery;
    if (jq && typeof jq._data === 'function') {
      const events = jq._data(hit, 'events') || {};
      jqueryEventTypes = Object.keys(events).filter(v => /^[A-Za-z0-9_:\\-]{1,40}$/.test(v)).sort();
    }
  } catch {}

  return {
    ready:true,
    title:norm(document.title),
    path:location.pathname,
    button:{
      label:norm(hit.textContent || hit.value || hit.getAttribute('aria-label') || hit.getAttribute('title') || ''),
      id:hit.id || '',
      type:(hit.getAttribute('type') || '').toLowerCase(),
      onclick_present:onclick.length > 0,
      action,
      jquery_event_types:jqueryEventTypes,
    },
    form:{
      id:form?.id || '',
      method:(form?.method || 'get').toLowerCase(),
      path:formPath,
    },
    hidden_values_read:false,
    raw_onclick_emitted:false,
    button_clicked:false,
    write_performed:false,
  };
})()`;

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }
  async connect() {
    if (typeof globalThis.WebSocket !== 'function') throw new DiscoveryError('WEBSOCKET_UNAVAILABLE', 'Se requiere Node 22 o superior.');
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.ws);
      this.socket = socket;
      const timer = setTimeout(() => reject(new DiscoveryError('CDP_CONNECT_TIMEOUT', 'Chrome DevTools no respondió.')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new DiscoveryError('CDP_CONNECT_FAILED', 'No se pudo conectar a Chrome DevTools.')); });
      socket.addEventListener('message', event => {
        let msg;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        if (!msg.id) return;
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.error) pending.reject(new DiscoveryError('CDP_PROTOCOL_ERROR', msg.error.message || 'Error CDP.'));
        else pending.resolve(msg.result || {});
      });
      socket.addEventListener('close', () => {
        for (const pending of this.pending.values()) pending.reject(new DiscoveryError('CDP_CLOSED', 'Chrome cerró CDP.'));
        this.pending.clear();
      });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression, userGesture = false) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true, userGesture:!!userGesture });
    if (result.exceptionDetails) throw new DiscoveryError('CDP_EVALUATION_ERROR', 'No se pudo evaluar la página.');
    return result.result?.value;
  }
  close() { try { this.socket?.close(); } catch {} }
}

async function listTargets(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal:AbortSignal.timeout(3000) });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function inspectTarget(target, expression, userGesture = false) {
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

async function run({ profileDir, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  if (!profileDir) throw new DiscoveryError('PROFILE_REQUIRED', 'Use --profile <perfil-temporal>.');
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  if (!fs.existsSync(portFile)) throw new DiscoveryError('DEVTOOLS_PORT_FILE_MISSING', 'No existe DevToolsActivePort.');
  const port = parseActivePort(fs.readFileSync(portFile, 'utf8'));
  const until = Date.now() + timeoutMs;
  let announced = false;
  let clickAttempts = 0;
  let lastClickAt = 0;

  while (Date.now() < until) {
    const targets = conapeTargets(await listTargets(port));
    if (!targets.length) {
      if (!announced) {
        console.log('C3.3b: inicie sesión y deje visible Reclutar Prospectos.');
        announced = true;
      }
      await sleep(POLL_MS);
      continue;
    }

    for (const target of targets.filter(t => isProspectoPath(t.url))) {
      try {
        const meta = await inspectTarget(target, INSPECT_CLIENT_ACTION);
        if (meta?.ready) {
          console.log('\nC3.3b CLIENT ACTION: PASS_READONLY');
          console.log(JSON.stringify({ target:safeUrl(target.url), ...meta }, null, 2));
          return;
        }
      } catch {}
    }

    const prospectoObserved = targets.some(target => isProspectoPath(target.url));
    if (!prospectoObserved && Date.now() - lastClickAt >= NAV_RETRY_MS) {
      if (clickAttempts >= MAX_NAV_ATTEMPTS) {
        throw new DiscoveryError('RECRUIT_NAVIGATION_NOT_OBSERVED', 'No se observó la página PROSPECTO. No se hizo ninguna escritura.');
      }
      for (const target of targets) {
        try {
          const result = await inspectTarget(target, FIND_AND_OPEN_RECRUIT, true);
          if (result?.found) {
            clickAttempts += 1;
            lastClickAt = Date.now();
            console.log(clickAttempts === 1
              ? 'C3.3b: Reclutar detectado; abriendo PROSPECTO. Crear nuevo Prospecto NO será presionado.'
              : `C3.3b: reintento seguro de navegación ${clickAttempts}/${MAX_NAV_ATTEMPTS}.`);
            break;
          }
        } catch {}
      }
    }

    await sleep(POLL_MS);
  }

  throw new DiscoveryError('CLIENT_ACTION_TIMEOUT', 'No se pudo clasificar la acción cliente de Crear nuevo Prospecto antes del timeout. No se hizo ninguna escritura.');
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--profile' && argv[i + 1]) { out.profileDir = path.resolve(argv[++i]); continue; }
    if (argv[i] === '--timeout-ms' && argv[i + 1]) { out.timeoutMs = Number(argv[++i]); continue; }
    throw new DiscoveryError('CLI_ARGUMENT_INVALID', `Argumento inválido: ${argv[i]}`);
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await run(args(process.argv.slice(2)));
  } catch (error) {
    console.error(`\nC3.3b CLIENT ACTION: BLOCK / ${error?.reason || 'UNEXPECTED_ERROR'}`);
    console.error(error?.message || String(error));
    process.exitCode = 1;
  }
}

export { classifyClientActionSource, INSPECT_CLIENT_ACTION };
