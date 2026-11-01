'use strict';
// F111 AUTOPASS1 · QA E1 aislada, sin red ni credenciales reales.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const html = read('login.html');
const dataCompiled = read('src/data.login.compiled.js');
const loginCompiled = read('src/login.compiled.js');

test('login carga React, DOM y dos scripts compilados, nunca Babel en runtime', () => {
  const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1].split('?')[0]);
  assert.deepEqual(scripts, [
    'vendor/react.js',
    'vendor/react-dom.js',
    'src/data.login.compiled.js',
    'src/login.compiled.js',
  ]);
  assert.doesNotMatch(html, /type="text\/babel"|vendor\/babel\.js|src\/data\.jsx|src\/login\.jsx/i);
  assert.match(html, /window\.APPS_SCRIPT_URL/);
  assert.match(dataCompiled, /f111HttpTimingOptIn/); // f111_diag sigue disponible.
});

test('los artefactos son reproducibles y no están desactualizados', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts/build_login_fast.cjs'), '--check'], {
    cwd: root, stdio: 'pipe', timeout: 30000,
  });
});

test('la imagen inicial tiene prioridad; no precargar las otras tres', () => {
  const hints = [...html.matchAll(/rel="preload" as="image"/g)];
  assert.equal(hints.length, 1);
  assert.match(html, /login_hero_1\.jpg/);
  for (const i of [2, 3, 4]) assert.doesNotMatch(html, new RegExp('rel="preload"[^>]*login_hero_' + i));
  const source = read('src/login.jsx');
  assert.match(source, /requestedScenes.*useState\(\[0, 1\]\)/);
  assert.match(source, /readyScenes\.current\.has\(next\)/);
  assert.match(source, /requestedScenes\.includes\(index\)/);
  assert.match(source, /loading=\{index === 0 \? 'eager' : 'lazy'\}/);
});

function makeStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function findElement(element, predicate) {
  if (element == null || typeof element === 'boolean') return null;
  if (Array.isArray(element)) {
    for (const child of element) {
      const result = findElement(child, predicate);
      if (result) return result;
    }
    return null;
  }
  if (typeof element !== 'object') return null;
  if (predicate(element)) return element;
  return findElement(element.props && element.props.children, predicate);
}

function createLoginHarness(role) {
  const hooks = [];
  let hookIndex = 0;
  let rootElement = null;
  const requests = [];
  const timers = [];
  const sessionStorage = makeStorage();
  const localStorage = makeStorage();
  const window = {
    APPS_SCRIPT_URL: 'https://example.invalid/exec',
    location: { search: '', href: 'login.html' },
    sessionStorage, localStorage,
  };
  const React = {
    useState(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial;
      return [hooks[index], value => {
        hooks[index] = typeof value === 'function' ? value(hooks[index]) : value;
      }];
    },
    useRef(initial) {
      const index = hookIndex++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect() { hookIndex++; }, // E1: no DOM real ni timers del carrusel.
    createElement(type, props, ...children) {
      return { type, props: { ...(props || {}), children } };
    },
  };
  const ReactDOM = { createRoot() { return { render(element) { rootElement = element; } }; } };
  const document = { getElementById() { return {}; } };
  const context = vm.createContext({
    React, ReactDOM, window, document, sessionStorage, localStorage, URLSearchParams,
    console: { log() {}, warn() {}, error() {} },
    fetch: async (url, options) => {
      requests.push({ url, body: JSON.parse(options.body) });
      return { status: 200, text: async () => JSON.stringify({
        ok: true, rol: role, nombre: 'PERSONA SINTETICA', token: 'token-sintetico',
        grupo: 'GRUPO-QA', expira: 999999,
      }) };
    },
    setTimeout(fn, ms) { timers.push({ fn, ms }); return timers.length; },
    clearTimeout() {},
  });
  vm.runInContext(dataCompiled, context, { timeout: 5000 });
  vm.runInContext(loginCompiled, context, { timeout: 5000 });
  assert.equal(typeof rootElement.type, 'function');
  return {
    render() { hookIndex = 0; return rootElement.type(); },
    requests, timers, sessionStorage, localStorage, window,
  };
}

for (const role of ['student', 'teacher', 'admin', 'superadmin', 'ventas']) {
  test('login sintético ' + role + ': 1 POST, sesión íntegra y redirección rápida', async () => {
    const h = createLoginHarness(role);
    let tree = h.render();
    findElement(tree, e => e.type === 'input' && e.props.id === 'usuario')
      .props.onChange({ target: { value: 'usuario-qa' } });
    findElement(tree, e => e.type === 'input' && e.props.id === 'clave')
      .props.onChange({ target: { value: 'clave-qa' } });
    tree = h.render();
    const form = findElement(tree, e => e.type === 'form');
    assert.ok(form);
    await form.props.onSubmit({ preventDefault() {} });
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].body.fn, 'iniciarSesion');
    assert.equal(h.requests[0].body.usuario, 'usuario-qa');
    const saved = JSON.parse(h.sessionStorage.getItem('an_usuario'));
    assert.equal(saved.rol, role);
    assert.equal(saved.token, 'token-sintetico');
    assert.equal(saved.grupo, 'GRUPO-QA');
    assert.equal(h.timers.length, 1);
    assert.equal(h.timers[0].ms, 180);
    h.timers[0].fn();
    assert.equal(h.window.location.href, role === 'ventas' ? 'ventas.html' : 'campus.html');
    assert.equal(h.localStorage.getItem('an_role'), role === 'ventas' ? 'ventas'
      : role === 'student' ? 'student' : role === 'teacher' ? 'teacher' : 'admin');
  });
}

test('sin backend real: las cinco rutas y sesiones fueron evaluadas solo en VM', () => {
  assert.ok(dataCompiled.length > 20000 && loginCompiled.length > 10000);
  assert.doesNotMatch(html, /data:application\/json|secret|password=./i);
});
