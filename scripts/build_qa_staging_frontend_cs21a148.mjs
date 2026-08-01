import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'dist', 'qa-staging');
const entrypoints = ['campus.html', 'login.html', 'ventas.html', 'inscripcion.html'];
const deliveryDirs = ['assets', 'vendor', 'styles', 'src', 'modulos'];
const runtimeTagPattern = /<script\s+src=["']src\/runtime_config\.js[^"']*["']><\/script>/i;
const buildId = process.env.GITHUB_SHA || 'local';
const builtAt = new Date().toISOString();

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function write(relative, content) {
  const target = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, 'utf8');
}

function copyDirectory(relative) {
  const source = path.join(root, relative);
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, path.join(outDir, relative), {
    recursive: true,
    force: true,
  });
}

function injectBootstrap(html, entrypoint) {
  const matches = html.match(new RegExp(runtimeTagPattern.source, 'gi')) || [];
  if (matches.length !== 1) {
    throw new Error(`${entrypoint} debe contener exactamente una carga de src/runtime_config.js.`);
  }
  if (/campus_standalone|BACKUP_index_QA|Santiago Salazar Chacón/i.test(html)) {
    throw new Error(`${entrypoint} contiene una firma de frontend legado.`);
  }
  return html.replace(
    runtimeTagPattern,
    '<script src="qa-bootstrap.js?v=CS21A148"></script>\n$&',
  );
}

const productionUrl = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';

const bootstrap = `/* CS21A148 · Bootstrap exclusivo del artefacto QA. */
(function installQaBootstrap(global) {
  'use strict';

  var STORAGE_KEY = 'an_qa_apps_script_url';
  var RETURN_KEY = 'an_qa_return_to';
  var PROD = ${JSON.stringify(productionUrl)};

  function normalize(value) {
    try {
      var parsed = new URL(String(value || '').trim());
      var validHost = parsed.protocol === 'https:' && parsed.hostname === 'script.google.com';
      var validPath = /^\\/macros\\/s\\/[^/]+\\/(?:exec|dev)\\/?$/.test(parsed.pathname);
      parsed.search = '';
      parsed.hash = '';
      var normalized = parsed.href.replace(/\\/$/, '');
      if (!validHost || !validPath || normalized === PROD) return '';
      return normalized;
    } catch (_) {
      return '';
    }
  }

  var stored = '';
  try { stored = sessionStorage.getItem(STORAGE_KEY) || ''; } catch (_) {}
  var qaUrl = normalize(stored);

  global.__CAMPUS_RUNTIME_CONFIG__ = qaUrl
    ? { environment: 'qa', appsScriptUrl: qaUrl }
    : { environment: 'qa' };

  global.CAMPUS_QA_BOOTSTRAP = Object.freeze({
    valid: Boolean(qaUrl),
    environment: 'qa',
    storage: 'sessionStorage',
  });

  if (!qaUrl) {
    try {
      var current = String(location.pathname || '').split('/').pop() || 'login.html';
      sessionStorage.setItem(RETURN_KEY, current === 'index.html' ? 'campus.html' : current);
    } catch (_) {}
    if (!/qa-setup\\.html$/i.test(String(location.pathname || ''))) {
      location.replace('qa-setup.html');
    }
  }
})(window);
`;

const setup = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Configurar Campus QA · Academia Norteamericana</title>
<style>
:root { color-scheme: light; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f4f1ea; color: #172033; padding: 24px; }
main { width: min(680px, 100%); background: #fff; border: 1px solid #dfe3ea; border-radius: 18px; padding: 30px; box-shadow: 0 18px 50px rgba(23,32,51,.10); }
h1 { margin: 0 0 10px; font-size: clamp(24px, 4vw, 36px); }
p { line-height: 1.55; }
label { display: block; font-weight: 700; margin: 24px 0 8px; }
input { width: 100%; padding: 14px; border: 1px solid #b9c2d0; border-radius: 10px; font: inherit; }
button { margin-top: 14px; width: 100%; padding: 14px 18px; border: 0; border-radius: 10px; background: #173f70; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
small { display: block; margin-top: 14px; color: #596579; }
#error { min-height: 24px; color: #a22424; font-weight: 700; }
.badge { display: inline-block; padding: 5px 9px; border-radius: 999px; background: #fff0c8; color: #6d4b00; font-size: 12px; font-weight: 800; }
</style>
</head>
<body>
<main>
  <span class="badge">STAGING AISLADO</span>
  <h1>Conectar el Campus al backend QA</h1>
  <p>Esta copia contiene el frontend vigente del repositorio. La dirección del backend se conserva únicamente durante esta sesión del navegador y no se guarda en GitHub ni en el artefacto.</p>
  <form id="qa-form">
    <label for="qa-url">URL <code>/exec</code> del Apps Script QA</label>
    <input id="qa-url" name="qa-url" type="url" autocomplete="off" spellcheck="false" placeholder="https://script.google.com/macros/s/.../exec" required>
    <button type="submit">Abrir inicio de sesión QA</button>
    <p id="error" role="alert"></p>
  </form>
  <small>Se rechazan dominios distintos de script.google.com, rutas que no sean /exec o /dev y la URL productiva conocida.</small>
</main>
<script>
(function () {
  'use strict';
  var STORAGE_KEY = 'an_qa_apps_script_url';
  var RETURN_KEY = 'an_qa_return_to';
  var PROD = ${JSON.stringify(productionUrl)};
  var form = document.getElementById('qa-form');
  var input = document.getElementById('qa-url');
  var error = document.getElementById('error');

  function normalize(value) {
    try {
      var parsed = new URL(String(value || '').trim());
      var validHost = parsed.protocol === 'https:' && parsed.hostname === 'script.google.com';
      var validPath = /^\\/macros\\/s\\/[^/]+\\/(?:exec|dev)\\/?$/.test(parsed.pathname);
      parsed.search = '';
      parsed.hash = '';
      var normalized = parsed.href.replace(/\\/$/, '');
      if (!validHost || !validPath || normalized === PROD) return '';
      return normalized;
    } catch (_) {
      return '';
    }
  }

  try { input.value = sessionStorage.getItem(STORAGE_KEY) || ''; } catch (_) {}

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var normalized = normalize(input.value);
    if (!normalized) {
      error.textContent = 'La URL no corresponde a un deployment QA válido o coincide con producción.';
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, normalized);
      var target = sessionStorage.getItem(RETURN_KEY) || 'login.html';
      sessionStorage.removeItem(RETURN_KEY);
      location.replace(target);
    } catch (_) {
      error.textContent = 'El navegador no permitió guardar la configuración temporal de QA.';
    }
  });
})();
</script>
</body>
</html>
`;

const server = `import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf',
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = pathname === '/' ? 'qa-setup.html' : pathname.replace(/^\\/+/, '');
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('No encontrado');
    return;
  }
  response.writeHead(200, {
    'content-type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log('Campus QA disponible en http://127.0.0.1:' + port + '/qa-setup.html');
});
`;

const windowsLauncher = `@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado o no esta disponible en PATH.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4173/qa-setup.html"
node serve.mjs
`;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const dir of deliveryDirs) copyDirectory(dir);

for (const entrypoint of entrypoints) {
  const transformed = injectBootstrap(read(entrypoint), entrypoint);
  write(entrypoint, transformed);
  if (entrypoint === 'campus.html') write('index.html', transformed);
}

write('qa-bootstrap.js', bootstrap);
write('qa-setup.html', setup);
write('serve.mjs', server);
write('INICIAR_QA_STAGING.cmd', windowsLauncher);
write('.nojekyll', '');

const manifest = {
  marker: 'QA_STAGING_FRONTEND_CS21A148',
  sourceCommit: buildId,
  builtAt,
  entrypoints: [...entrypoints, 'index.html', 'qa-setup.html'],
  directories: deliveryDirs.filter(dir => fs.existsSync(path.join(root, dir))),
  backendUrlEmbedded: false,
  backendStorage: 'sessionStorage',
  productionDeploymentAllowed: false,
};
write('QA_STAGING_BUILD.json', `${JSON.stringify(manifest, null, 2)}\n`);

const digest = crypto
  .createHash('sha256')
  .update(fs.readFileSync(path.join(outDir, 'index.html')))
  .digest('hex');
console.log(`OK: frontend QA generado en ${path.relative(root, outDir)}.`);
console.log(`INFO: SHA-256 index.html ${digest}`);
