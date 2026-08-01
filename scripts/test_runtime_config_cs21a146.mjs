import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'src/runtime_config.js'), 'utf8');
const PROD = 'https://script.google.com/macros/s/AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ/exec';
const QA = 'https://script.google.com/macros/s/QA_DEPLOYMENT_ID/exec';

function boot({ override, legacyUrl } = {}) {
  const calls = [];
  const window = {
    __CAMPUS_RUNTIME_CONFIG__: override,
    APPS_SCRIPT_URL: legacyUrl,
    fetch: async (input, init) => {
      calls.push({ input: String(input), init });
      return { ok: true };
    },
    dispatchEvent() {},
  };
  const document = { documentElement: { dataset: {} } };
  const context = {
    window,
    document,
    URL,
    Request: undefined,
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    },
    Object,
    String,
    Array,
    console,
  };
  vm.runInNewContext(source, context, { filename: 'src/runtime_config.js' });
  return { window, document, calls };
}

{
  const { window, document } = boot();
  assert.equal(window.APPS_SCRIPT_URL, PROD);
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.environment, 'production');
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.isProduction, true);
  assert.equal(document.documentElement.dataset.campusEnvironment, 'production');
}

{
  const { window, document, calls } = boot({
    override: { environment: 'qa', appsScriptUrl: QA },
  });
  assert.equal(window.APPS_SCRIPT_URL, QA);
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.environment, 'qa');
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.isProduction, false);
  assert.equal(document.documentElement.dataset.campusEnvironment, 'qa');

  await window.fetch(`${PROD}?fn=getInfoGeneral`, { method: 'POST' });
  assert.equal(calls[0].input, `${QA}?fn=getInfoGeneral`);

  await window.fetch('https://example.com/data.json');
  assert.equal(calls[1].input, 'https://example.com/data.json');
}

{
  const { window } = boot({ legacyUrl: QA });
  assert.equal(window.APPS_SCRIPT_URL, QA);
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.environment, 'qa');
}

{
  const { window } = boot({
    override: { environment: 'qa', appsScriptUrl: 'https://example.com/not-apps-script' },
  });
  assert.equal(window.APPS_SCRIPT_URL, PROD);
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.environment, 'qa');
  assert.equal(window.CAMPUS_RUNTIME_CONFIG.isProduction, false);
}

for (const entrypoint of ['campus.html', 'login.html', 'ventas.html', 'inscripcion.html']) {
  const html = fs.readFileSync(path.join(root, entrypoint), 'utf8');
  const runtimeIndex = html.indexOf('src/runtime_config.js');
  assert.notEqual(runtimeIndex, -1, `${entrypoint} debe cargar src/runtime_config.js`);
  assert.equal(html.includes(PROD), false, `${entrypoint} no debe repetir la URL productiva`);

  const firstAppScript = Math.min(
    ...['src/data.jsx', 'src/login.jsx', 'src/ventas_data.jsx', 'src/inscripcion.jsx']
      .map(file => html.indexOf(file))
      .filter(index => index >= 0),
  );
  assert.equal(runtimeIndex < firstAppScript, true, `${entrypoint} debe cargar runtime_config antes del código de aplicación`);
}

console.log('OK: CS21A146 runtime config central, override QA y orden de carga verificados.');
