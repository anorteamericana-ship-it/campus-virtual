import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  safeUrl,
  isProspectoPath,
  conapeTargets,
  FIND_AND_OPEN_RECRUIT,
} from './discover_recruit_submit_contract_c3_3.mjs';
import { classifyClientActionSource } from './discover_recruit_client_action_c3_3b.mjs';

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

function classifyBoundSource(rawSource) {
  const source = String(rawSource || '');
  const base = classifyClientActionSource(source);
  const called = new Set(base.called_apis || []);
  const markers = [
    ['apex.da.handleEvent', /apex\.da\.handleEvent\b/i],
    ['apex.da.initDaEventList', /apex\.da\.initDaEventList\b/i],
    ['apex.da', /apex\.da\b/i],
    ['jQuery.on', /\.on\s*\(\s*['"]click/i],
    ['jQuery.trigger', /\.trigger\s*\(/i],
  ];
  for (const [name, regex] of markers) if (regex.test(source)) called.add(name);

  const safeUpperToken = value => {
    const s = String(value || '').trim();
    if (!/^[A-Z][A-Z0-9_:\-]{0,39}$/.test(s)) return '';
    if (/^\d+$/.test(s)) return '';
    return s;
  };

  const daActions = [];
  const seen = new Set();
  const actionRe = /(?:['"]?action['"]?)\s*:\s*['"](NATIVE_[A-Z0-9_:\-]{1,70})['"]/gi;
  let match;
  while ((match = actionRe.exec(source)) && daActions.length < 12) {
    const action = safeUpperToken(String(match[1] || '').toUpperCase());
    if (!action) continue;
    const segment = source.slice(match.index, Math.min(source.length, match.index + 1800));
    const attributes = {};
    for (let i = 1; i <= 15; i += 1) {
      const suffix = String(i).padStart(2, '0');
      const regex = new RegExp(`(?:['"]?attribute${suffix}['"]?)\\s*:\\s*['"]([A-Za-z0-9_:\\-]{1,80})['"]`, 'i');
      const candidate = safeUpperToken(String(segment.match(regex)?.[1] || '').toUpperCase());
      if (candidate) attributes[`attribute${suffix}`] = candidate;
    }
    const key = `${action}:${JSON.stringify(attributes)}`;
    if (!seen.has(key)) {
      seen.add(key);
      daActions.push({ action, attributes });
    }
  }

  return {
    ...base,
    dynamic_action_detected: /apex\.da\b|NATIVE_[A-Z0-9_:\-]+/i.test(source),
    called_apis: [...called],
    apex_da_actions: daActions,
  };
}

const CLASSIFIER_SOURCE = classifyBoundSource.toString();
const BASE_CLASSIFIER_SOURCE = classifyClientActionSource.toString();

const INSPECT_BOUND_HANDLERS = `(() => {
  const classifyBase = ${BASE_CLASSIFIER_SOURCE};
  const classify = (${CLASSIFIER_SOURCE.replace('classifyClientActionSource(source)', 'classifyBase(source)')});
  const norm = v => String(v || '').replace(/\\s+/g,' ').trim();
  const normUpper = v => norm(v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const candidates = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
  const hit = candidates.find(el => normUpper([el.textContent || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.value || ''].join(' ')).includes('CREAR NUEVO PROSPECTO'));
  if (!hit) return { ready:false, title:norm(document.title), path:location.pathname };

  const safeEventToken = value => {
    const s = String(value || '').trim();
    return /^[A-Za-z0-9_:\\-]{0,50}$/.test(s) ? s : '';
  };

  const sanitizeHandler = (entry, binding) => {
    let source = '';
    try { source = typeof entry?.handler === 'function' ? Function.prototype.toString.call(entry.handler) : ''; } catch {}
    return {
      binding,
      event:'click',
      namespace:safeEventToken(entry?.namespace || ''),
      selector_present:!!entry?.selector,
      source_length:source.length,
      action:classify(source),
    };
  };

  const jq = window.apex?.jQuery || window.jQuery;
  const direct = [];
  const delegated = [];
  if (jq && typeof jq._data === 'function') {
    try {
      const own = jq._data(hit, 'events')?.click || [];
      for (const entry of own) direct.push(sanitizeHandler(entry, 'direct'));
    } catch {}

    const ancestry = [];
    let node = hit.parentElement;
    while (node) { ancestry.push(node); node = node.parentElement; }
    ancestry.push(document);
    for (const owner of ancestry) {
      try {
        const handlers = jq._data(owner, 'events')?.click || [];
        for (const entry of handlers) {
          if (!entry?.selector) continue;
          let matches = false;
          try { matches = hit.matches(entry.selector) || !!hit.closest(entry.selector); } catch {}
          if (matches) delegated.push(sanitizeHandler(entry, 'delegated'));
        }
      } catch {}
    }
  }

  const inlineRefs = [];
  const buttonId = String(hit.id || '');
  if (buttonId) {
    for (const script of Array.from(document.scripts)) {
      const text = String(script.textContent || '');
      if (!text || !text.includes(buttonId)) continue;
      let cursor = 0;
      while (inlineRefs.length < 12) {
        const index = text.indexOf(buttonId, cursor);
        if (index < 0) break;
        const start = Math.max(0, index - 5000);
        const end = Math.min(text.length, index + buttonId.length + 5000);
        const context = text.slice(start, end);
        inlineRefs.push({
          source:'inline_script_context',
          context_length:context.length,
          action:classify(context),
        });
        cursor = index + buttonId.length;
      }
      if (inlineRefs.length >= 12) break;
    }
  }

  const summarizeDaActions = entries => {
    const out = [];
    const seen = new Set();
    for (const entry of entries) {
      for (const candidate of entry?.action?.apex_da_actions || []) {
        const key = JSON.stringify(candidate);
        if (!seen.has(key)) { seen.add(key); out.push(candidate); }
      }
    }
    return out.slice(0, 20);
  };

  return {
    ready:true,
    title:norm(document.title),
    path:location.pathname,
    button:{
      label:norm(hit.textContent || hit.value || hit.getAttribute('aria-label') || hit.getAttribute('title') || ''),
      id:hit.id || '',
      type:(hit.getAttribute('type') || '').toLowerCase(),
    },
    jquery_available:!!jq,
    direct_click_handlers:direct,
    delegated_click_handlers:delegated,
    inline_script_matches:inlineRefs,
    apex_da_action_candidates:summarizeDaActions([...direct, ...delegated, ...inlineRefs]),
    raw_handler_source_emitted:false,
    raw_inline_script_emitted:false,
    hidden_values_read:false,
    handler_invoked:false,
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
        console.log('C3.3c: inicie sesión y deje visible Reclutar Prospectos.');
        announced = true;
      }
      await sleep(POLL_MS);
      continue;
    }

    for (const target of targets.filter(t => isProspectoPath(t.url))) {
      try {
        const meta = await inspectTarget(target, INSPECT_BOUND_HANDLERS);
        if (meta?.ready) {
          console.log('\nC3.3c BOUND HANDLERS: PASS_READONLY');
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
              ? 'C3.3c: Reclutar detectado; abriendo PROSPECTO. Crear nuevo Prospecto NO será presionado.'
              : `C3.3c: reintento seguro de navegación ${clickAttempts}/${MAX_NAV_ATTEMPTS}.`);
            break;
          }
        } catch {}
      }
    }

    await sleep(POLL_MS);
  }

  throw new DiscoveryError('BOUND_HANDLER_TIMEOUT', 'No se pudo inspeccionar de forma segura el handler enlazado al botón antes del timeout. No se hizo ninguna escritura.');
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
    console.error(`\nC3.3c BOUND HANDLERS: BLOCK / ${error?.reason || 'UNEXPECTED_ERROR'}`);
    console.error(error?.message || String(error));
    process.exitCode = 1;
  }
}

export { classifyBoundSource, INSPECT_BOUND_HANDLERS };
