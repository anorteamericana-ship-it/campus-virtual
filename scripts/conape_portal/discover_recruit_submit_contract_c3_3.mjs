import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'online.conape.go.cr';
const POLL_MS = 700;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const NAV_RETRY_MS = 3000;
const NAV_HOLD_MS = 1400;
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

function allowedTarget(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return u.protocol === 'https:' && u.hostname.toLowerCase() === HOST && u.pathname.toLowerCase().startsWith('/apex/');
  } catch {
    return false;
  }
}

function safeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.toLowerCase() !== HOST) return '[NON_CONAPE_TARGET]';
    return `${u.origin}${u.pathname}`;
  } catch {
    return '[INVALID_URL]';
  }
}

function isProspectoPath(rawUrlOrPath) {
  try {
    const raw = String(rawUrlOrPath || '');
    const pathName = raw.includes('://') ? new URL(raw).pathname : raw;
    return decodeURIComponent(pathName).toLowerCase().includes('/prospecto');
  } catch {
    return String(rawUrlOrPath || '').toLowerCase().includes('/prospecto');
  }
}

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }
  async connect() {
    if (typeof globalThis.WebSocket !== 'function') {
      throw new DiscoveryError('WEBSOCKET_UNAVAILABLE', 'Se requiere Node 22 o superior.');
    }
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
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue:true,
      awaitPromise:true,
      userGesture:!!userGesture,
    });
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

function conapeTargets(targets) {
  return (targets || [])
    .filter(t => t?.type === 'page' && t?.webSocketDebuggerUrl && allowedTarget(t.url))
    .sort((a, b) => Number(isProspectoPath(b.url)) - Number(isProspectoPath(a.url)));
}

const FIND_AND_OPEN_RECRUIT = `(() => {
  const norm = v => String(v || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const buttons = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
  const hit = buttons.find(el => {
    const label = norm([el.textContent || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.value || ''].join(' '));
    return label === 'RECLUTAR' || label.includes('RECLUTAR PROSPECTOS');
  });
  if (!hit) return { found:false };
  hit.click();
  return { found:true };
})()`;

const INSPECT_SUBMIT = `(() => {
  const norm = v => String(v || '').replace(/\\s+/g,' ').trim();
  const normUpper = v => norm(v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const fieldIds = Array.from(document.querySelectorAll('input:not([type="hidden"]),select,textarea')).filter(visible).map(el => el.id || '').filter(Boolean);
  const candidates = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
  const hit = candidates.find(el => normUpper([el.textContent || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.value || ''].join(' ')).includes('CREAR NUEVO PROSPECTO'));
  if (!hit) return { ready:false, title:norm(document.title), path:location.pathname, fieldIds };

  const token = value => {
    const s = String(value || '').trim();
    return /^[A-Za-z0-9_:\\-]{1,80}$/.test(s) ? s : '';
  };
  const onclick = String(hit.getAttribute('onclick') || '');
  const requestMatches = [
    onclick.match(/request\\s*:\\s*['\"]([A-Za-z0-9_:\\-]{1,80})['\"]/i),
    onclick.match(/apex\\.(?:page\\.)?submit\\(\\s*['\"]([A-Za-z0-9_:\\-]{1,80})['\"]/i)
  ].filter(Boolean);
  const requestFromOnclick = requestMatches.length ? token(requestMatches[0][1]) : '';
  const request = token(hit.getAttribute('data-request')) || token(hit.getAttribute('data-action')) || requestFromOnclick;

  const form = hit.form || document.querySelector('form');
  let formPath = '';
  try {
    if (form) {
      const u = new URL(form.action, location.href);
      formPath = u.origin === location.origin ? u.pathname : '[EXTERNAL]';
    }
  } catch {}

  let formActionPath = '';
  try {
    const raw = hit.getAttribute('formaction');
    if (raw) {
      const u = new URL(raw, location.href);
      formActionPath = u.origin === location.origin ? u.pathname : '[EXTERNAL]';
    }
  } catch {}

  return {
    ready:true,
    title:norm(document.title),
    path:location.pathname,
    fieldIds,
    button:{
      label:norm(hit.textContent || hit.value || hit.getAttribute('aria-label') || hit.getAttribute('title') || ''),
      id:hit.id || '',
      name:hit.getAttribute('name') || '',
      type:(hit.getAttribute('type') || '').toLowerCase(),
      request_candidate:request,
      onclick_submit_detected:/apex\\.(?:page\\.)?submit\\s*\\(/i.test(onclick),
      onclick_present:onclick.length > 0,
      formaction_path:formActionPath
    },
    form:{
      id:form?.id || '',
      method:(form?.method || 'get').toLowerCase(),
      path:formPath
    },
    hidden_inputs_omitted:document.querySelectorAll('input[type="hidden"]').length,
    write_performed:false
  };
})()`;

async function inspectTarget(target, expression, { userGesture = false, holdMs = 0 } = {}) {
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.connect();
    await client.send('Runtime.enable');
    await client.send('Page.enable');
    const result = await client.eval(expression, userGesture);
    if (holdMs > 0) await sleep(holdMs);
    return result;
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
  let prospectoObserved = false;

  while (Date.now() < until) {
    const targets = conapeTargets(await listTargets(port));
    if (!targets.length) {
      if (!announced) {
        console.log('C3.3: inicie sesión y deje visible Reclutar Prospectos.');
        announced = true;
      }
      await sleep(POLL_MS);
      continue;
    }

    prospectoObserved = prospectoObserved || targets.some(target => isProspectoPath(target.url));

    for (const target of targets) {
      try {
        const meta = await inspectTarget(target, INSPECT_SUBMIT);
        prospectoObserved = prospectoObserved || isProspectoPath(target.url) || isProspectoPath(meta?.path);
        if (meta?.ready) {
          console.log('\nC3.3 SUBMIT CONTRACT: PASS_READONLY');
          console.log(JSON.stringify({ target:safeUrl(target.url), ...meta }, null, 2));
          return;
        }
      } catch {
        // La navegación APEX puede invalidar un target durante unos milisegundos.
      }
    }

    if (!prospectoObserved && Date.now() - lastClickAt >= NAV_RETRY_MS) {
      if (clickAttempts >= MAX_NAV_ATTEMPTS) {
        throw new DiscoveryError(
          'RECRUIT_NAVIGATION_NOT_OBSERVED',
          `Reclutar fue activado ${clickAttempts} veces, pero Chrome no llegó a la página PROSPECTO. No se hizo ninguna escritura.`
        );
      }

      let clicked = false;
      for (const target of targets) {
        try {
          const result = await inspectTarget(target, FIND_AND_OPEN_RECRUIT, { userGesture:true, holdMs:NAV_HOLD_MS });
          if (result?.found) {
            clickAttempts += 1;
            lastClickAt = Date.now();
            clicked = true;
            if (clickAttempts === 1) {
              console.log('C3.3: botón Reclutar detectado. Abriendo la página PROSPECTO; NO se presionará Crear nuevo Prospecto.');
            } else {
              console.log(`C3.3: la navegación a PROSPECTO aún no se observó; reintento seguro ${clickAttempts}/${MAX_NAV_ATTEMPTS}.`);
            }
            break;
          }
        } catch {
          // seguir probando otros targets CONAPE
        }
      }

      if (!clicked && !announced) {
        console.log('C3.3: inicie sesión y deje visible Reclutar Prospectos.');
        announced = true;
      }
    }

    await sleep(POLL_MS);
  }

  throw new DiscoveryError(
    prospectoObserved ? 'SUBMIT_CONTRACT_TIMEOUT' : 'RECRUIT_NAVIGATION_NOT_OBSERVED',
    prospectoObserved
      ? 'Se observó la página PROSPECTO, pero no se pudo identificar el contrato seguro del botón Crear nuevo Prospecto antes del timeout.'
      : 'No se observó la navegación a PROSPECTO antes del timeout. No se hizo ninguna escritura.'
  );
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
    console.error(`\nC3.3 SUBMIT CONTRACT: BLOCK / ${error?.reason || 'UNEXPECTED_ERROR'}`);
    console.error(error?.message || String(error));
    process.exitCode = 1;
  }
}

export {
  allowedTarget,
  safeUrl,
  isProspectoPath,
  conapeTargets,
  FIND_AND_OPEN_RECRUIT,
  INSPECT_SUBMIT,
};
