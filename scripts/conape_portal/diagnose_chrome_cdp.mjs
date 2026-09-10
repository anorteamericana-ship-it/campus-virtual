import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseConapeApexReport } from './parse_apex_report.mjs';

const HOST = 'online.conape.go.cr';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function sanitizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.hostname.toLowerCase() !== HOST) return '[NON_CONAPE_TARGET]';
    const p = u.searchParams.get('p');
    if (!p) return `${u.origin}${u.pathname}`;
    const parts = String(p).split(':');
    return `${u.origin}${u.pathname}?p=${parts[0] || ''}:${parts[1] || ''}`;
  } catch {
    return '[INVALID_URL]';
  }
}

function parsePort(profileDir) {
  const portFile = path.join(profileDir, 'DevToolsActivePort');
  if (!fs.existsSync(portFile)) throw new Error('DEVTOOLS_PORT_FILE_MISSING');
  const raw = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/)[0];
  const port = Number(raw);
  if (!Number.isInteger(port)) throw new Error('DEVTOOLS_PORT_INVALID');
  return port;
}

class Cdp {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.socket = null;
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(this.wsUrl);
      this.socket = socket;
      const timer = setTimeout(() => reject(new Error('CDP_CONNECT_TIMEOUT')), 8000);
      socket.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      socket.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('CDP_CONNECT_FAILED'));
      });
      socket.addEventListener('message', event => {
        let msg;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        if (!msg.id) return;
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(msg.error.message || 'CDP_PROTOCOL_ERROR'));
        else pending.resolve(msg.result || {});
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

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.result?.value;
  }

  close() {
    try { this.socket?.close(); } catch { }
  }
}

const STRUCTURE_EXPR = `(() => {
  const norm = value => String(value || '')
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const out = [];
  const seen = new Set();

  function walk(doc, depth, label) {
    if (!doc || seen.has(doc) || depth > 4) return;
    seen.add(doc);

    const tables = Array.from(doc.querySelectorAll('table')).map((table, index) => ({
      index,
      headers: Array.from(table.querySelectorAll('th'))
        .map(th => norm(th.textContent))
        .filter(Boolean)
        .slice(0, 40),
      html: table.outerHTML,
    }));

    out.push({
      depth,
      label,
      title: String(doc.title || '').slice(0, 120),
      url: String(doc.location?.href || ''),
      tables,
      iframeCount: doc.querySelectorAll('iframe').length,
    });

    for (const [i, frame] of Array.from(doc.querySelectorAll('iframe')).entries()) {
      try {
        const child = frame.contentDocument;
        if (child) walk(child, depth + 1, label + '/iframe-' + i);
      } catch { }
    }
  }

  walk(document, 0, 'top');
  return out;
})()`;

async function main() {
  const argv = process.argv.slice(2);
  const profileIdx = argv.indexOf('--profile');
  if (profileIdx < 0 || !argv[profileIdx + 1]) throw new Error('PROFILE_REQUIRED');
  const profileDir = path.resolve(argv[profileIdx + 1]);
  const port = parsePort(profileDir);

  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`DEVTOOLS_HTTP_${response.status}`);
  const targets = await response.json();
  const candidates = (Array.isArray(targets) ? targets : []).filter(t => {
    try {
      const u = new URL(t.url);
      return t.type === 'page' && t.webSocketDebuggerUrl && u.hostname.toLowerCase() === HOST;
    } catch {
      return false;
    }
  });

  if (!candidates.length) throw new Error('NO_CONAPE_TARGET');

  console.log('\nC3.2 DIAGNOSTICO SEGURO');
  console.log(`targets_conape=${candidates.length}`);

  for (let targetIndex = 0; targetIndex < candidates.length; targetIndex += 1) {
    const target = candidates[targetIndex];
    const cdp = new Cdp(target.webSocketDebuggerUrl);
    try {
      await cdp.connect();
      await cdp.send('Runtime.enable');
      await sleep(100);
      const docs = await cdp.evaluate(STRUCTURE_EXPR);
      console.log(`\ntarget_${targetIndex + 1}=${sanitizeUrl(target.url)}`);

      for (const doc of Array.isArray(docs) ? docs : []) {
        console.log(`documento=${doc.label} depth=${doc.depth} iframes=${doc.iframeCount} url=${sanitizeUrl(doc.url)}`);
        console.log(`titulo=${String(doc.title || '').replace(/[\r\n]+/g, ' ').slice(0, 120)}`);
        console.log(`tablas=${Array.isArray(doc.tables) ? doc.tables.length : 0}`);

        for (const table of Array.isArray(doc.tables) ? doc.tables : []) {
          const headers = Array.isArray(table.headers) ? table.headers.map(normalizeHeader) : [];
          if (!headers.length) continue;
          const parsed = parseConapeApexReport(table.html || '');
          const reason = parsed.ok ? 'OK' : `${parsed.error?.code || 'NO_CODE'}/${parsed.error?.reason || 'NO_REASON'}`;
          console.log(`tabla_${table.index}: headers=${headers.join('|')}`);
          console.log(`tabla_${table.index}: parser=${reason}${parsed.ok ? ` rows=${parsed.records.length}` : ''}`);
        }
      }
    } finally {
      cdp.close();
    }
  }

  console.log('\nC3.2 DIAGNOSTICO: FIN');
  console.log('No se imprimieron valores de filas, credenciales, cookies ni tokens.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await main();
  } catch (error) {
    console.error(`C3.2 DIAGNOSTICO: ERROR / ${String(error?.message || error)}`);
    process.exitCode = 1;
  }
}
