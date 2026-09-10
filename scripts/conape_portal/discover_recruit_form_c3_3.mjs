import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = 'online.conape.go.cr';
const APP_ID = '302';
const POLL_MS = 700;
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;

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
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new DiscoveryError('DEVTOOLS_PORT_INVALID', 'DevToolsActivePort inválido.');
  return port;
}

function allowedTarget(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== HOST) return false;
    if (!u.pathname.toLowerCase().startsWith('/apex/')) return false;
    const p = u.searchParams.get('p');
    return !p || p.split(':')[0] === APP_ID;
  } catch { return false; }
}

function safeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.toLowerCase() !== HOST) return '[NON_CONAPE_TARGET]';
    const p = u.searchParams.get('p');
    if (!p) return `${u.origin}${u.pathname}`;
    const parts = p.split(':');
    return `${u.origin}${u.pathname}?p=${parts[0] || ''}:${parts[1] || ''}`;
  } catch { return '[INVALID_URL]'; }
}

class CdpClient {
  constructor(ws) { this.ws = ws; this.socket = null; this.nextId = 1; this.pending = new Map(); }
  async connect() {
    if (typeof globalThis.WebSocket !== 'function') throw new DiscoveryError('WEBSOCKET_UNAVAILABLE', 'Se requiere Node 22 o superior.');
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.ws); this.socket = socket;
      const timer = setTimeout(() => reject(new DiscoveryError('CDP_CONNECT_TIMEOUT', 'Chrome DevTools no respondió.')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new DiscoveryError('CDP_CONNECT_FAILED', 'No se pudo conectar a Chrome DevTools.')); });
      socket.addEventListener('message', e => {
        let m; try { m = JSON.parse(String(e.data)); } catch { return; }
        if (!m.id) return; const pending = this.pending.get(m.id); if (!pending) return;
        this.pending.delete(m.id); m.error ? pending.reject(new DiscoveryError('CDP_PROTOCOL_ERROR', m.error.message || 'Error CDP.')) : pending.resolve(m.result || {});
      });
      socket.addEventListener('close', () => { for (const p of this.pending.values()) p.reject(new DiscoveryError('CDP_CLOSED', 'Chrome cerró CDP.')); this.pending.clear(); });
    });
  }
  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.socket.send(JSON.stringify({ id, method, params })); });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue:true, awaitPromise:true, userGesture:false });
    if (r.exceptionDetails) throw new DiscoveryError('CDP_EVALUATION_ERROR', 'No se pudo evaluar la página.');
    return r.result?.value;
  }
  close() { try { this.socket?.close(); } catch {} }
}

async function listTargets(port) {
  const r = await fetch(`http://127.0.0.1:${port}/json/list`, { signal:AbortSignal.timeout(3000) });
  if (!r.ok) return [];
  const data = await r.json(); return Array.isArray(data) ? data : [];
}

function pickTarget(targets) {
  return (targets || []).find(t => t?.type === 'page' && t?.webSocketDebuggerUrl && allowedTarget(t.url)) || null;
}

const FIND_RECRUIT = `(() => {
  const norm = v => String(v || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const candidates = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible);
  const hit = candidates.find(el => {
    const label = norm([el.textContent || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.value || ''].join(' '));
    return label === 'RECLUTAR' || label.includes(' RECLUTAR') || label.includes('RECLUTAR ');
  });
  if (!hit) return { found:false, visibleButtons:candidates.map(el => norm(el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '')).filter(Boolean).slice(0,30) };
  return { found:true, tag:hit.tagName, label:norm(hit.textContent || hit.value || hit.getAttribute('aria-label') || hit.getAttribute('title') || '') };
})()`;

const CLICK_RECRUIT = `(() => {
  const norm = v => String(v || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toUpperCase().replace(/\\s+/g,' ').trim();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const hit = Array.from(document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')).filter(visible).find(el => {
    const label = norm([el.textContent || '', el.getAttribute('aria-label') || '', el.getAttribute('title') || '', el.value || ''].join(' '));
    return label === 'RECLUTAR' || label.includes(' RECLUTAR') || label.includes('RECLUTAR ');
  });
  if (!hit) return { clicked:false };
  hit.click();
  return { clicked:true };
})()`;

const INSPECT_FORM = `(() => {
  const norm = v => String(v || '').replace(/\\s+/g,' ').trim();
  const visible = el => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
  const controls = Array.from(document.querySelectorAll('input:not([type="hidden"]),select,textarea')).filter(visible);
  const labelFor = el => {
    if (el.id) { const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l) return norm(l.textContent); }
    const wrap = el.closest('label'); if (wrap) return norm(wrap.textContent);
    const item = el.closest('.t-Form-fieldContainer,.a-Form-fieldContainer,.t-Form-inputContainer') || el.parentElement;
    if (item) { const l = item.querySelector('label'); if (l) return norm(l.textContent); }
    return '';
  };
  const field = el => ({
    label:labelFor(el),
    tag:el.tagName.toLowerCase(),
    type:(el.getAttribute('type') || '').toLowerCase(),
    id:el.id || '',
    name:el.getAttribute('name') || '',
    required:!!el.required || el.getAttribute('aria-required') === 'true',
    readonly:!!el.readOnly,
    disabled:!!el.disabled,
    maxlength:Number.isFinite(el.maxLength) && el.maxLength > 0 ? el.maxLength : null,
    pattern:el.getAttribute('pattern') || '',
    options:el.tagName === 'SELECT' ? Array.from(el.options).map(o => norm(o.textContent)).filter(Boolean).slice(0,80) : undefined
  });
  const buttons = Array.from(document.querySelectorAll('button,input[type="button"],input[type="submit"],a[role="button"]')).filter(visible).map(el => norm(el.textContent || el.value || el.getAttribute('aria-label') || el.getAttribute('title') || '')).filter(Boolean).slice(0,40);
  const forms = Array.from(document.querySelectorAll('form')).filter(visible).map(f => ({ id:f.id || '', method:(f.method || 'get').toLowerCase(), path:(() => { try { const u = new URL(f.action, location.href); return u.origin === location.origin ? u.pathname : '[EXTERNAL]'; } catch { return ''; } })() }));
  return { title:norm(document.title), controls:controls.map(field), buttons, forms, hiddenInputCount:document.querySelectorAll('input[type="hidden"]').length };
})()`;

async function waitForTarget(port, until) {
  while (Date.now() < until) {
    const t = pickTarget(await listTargets(port)); if (t) return t; await sleep(POLL_MS);
  }
  throw new DiscoveryError('CONAPE_TAB_NOT_FOUND', 'No apareció una pestaña CONAPE.');
}

async function run({ profileDir, port, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  let p = port;
  if (!p) {
    if (!profileDir) throw new DiscoveryError('DEVTOOLS_ENDPOINT_REQUIRED', 'Use --profile o --port.');
    const file = path.join(profileDir, 'DevToolsActivePort');
    if (!fs.existsSync(file)) throw new DiscoveryError('DEVTOOLS_PORT_FILE_MISSING', 'No existe DevToolsActivePort.');
    p = parseActivePort(fs.readFileSync(file, 'utf8'));
  }
  const until = Date.now() + timeoutMs;
  const target = await waitForTarget(p, until);
  const client = new CdpClient(target.webSocketDebuggerUrl);
  try {
    await client.connect(); await client.send('Runtime.enable'); await client.send('Page.enable');
    let announced = false;
    while (Date.now() < until) {
      const found = await client.eval(FIND_RECRUIT);
      if (found?.found) {
        console.log(`C3.3: botón Reclutar detectado (${found.label}). Abriendo solo para descubrir el formulario; NO se enviará.`);
        const clicked = await client.eval(CLICK_RECRUIT);
        if (!clicked?.clicked) throw new DiscoveryError('RECRUIT_CLICK_FAILED', 'No se pudo abrir Reclutar.');
        await sleep(1200);
        for (let i = 0; i < 20; i += 1) {
          const meta = await client.eval(INSPECT_FORM);
          if (meta?.controls?.length) {
            console.log('\nC3.3 RECLUTAR DISCOVERY: PASS_READONLY');
            console.log(JSON.stringify({
              target:safeUrl(target.url),
              title:meta.title,
              visible_fields:meta.controls.length,
              hidden_inputs_omitted:meta.hiddenInputCount,
              fields:meta.controls,
              buttons:meta.buttons,
              forms:meta.forms,
              write_performed:false,
            }, null, 2));
            return;
          }
          await sleep(POLL_MS);
        }
        throw new DiscoveryError('RECRUIT_FORM_NOT_FOUND', 'Reclutar abrió, pero no aparecieron campos visibles.');
      }
      if (!announced) {
        console.log('C3.3: inicie sesión y deje visible la pantalla donde aparece el botón Reclutar. El script lo detectará solo.');
        announced = true;
      }
      await sleep(POLL_MS);
    }
    throw new DiscoveryError('RECRUIT_BUTTON_TIMEOUT', 'No apareció el botón Reclutar antes del timeout.');
  } finally { client.close(); }
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--profile' && argv[i+1]) { out.profileDir = path.resolve(argv[++i]); continue; }
    if (argv[i] === '--port' && argv[i+1]) { out.port = Number(argv[++i]); continue; }
    if (argv[i] === '--timeout-ms' && argv[i+1]) { out.timeoutMs = Number(argv[++i]); continue; }
    if (argv[i] === '--help') { out.help = true; continue; }
    throw new DiscoveryError('CLI_ARGUMENT_INVALID', `Argumento inválido: ${argv[i]}`);
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    const a = args(process.argv.slice(2));
    if (a.help) console.log('node discover_recruit_form_c3_3.mjs --profile <perfil-temporal>');
    else await run(a);
  } catch (e) {
    console.error(`\nC3.3 RECLUTAR DISCOVERY: BLOCK / ${e?.reason || 'UNEXPECTED_ERROR'}`);
    console.error(e?.message || String(e));
    process.exitCode = 1;
  }
}

export { allowedTarget, safeUrl, FIND_RECRUIT, CLICK_RECRUIT, INSPECT_FORM };
