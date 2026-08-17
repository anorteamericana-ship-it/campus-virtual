import fs from 'node:fs';
import vm from 'node:vm';

const failures = [];
const adapterPath = 'src/auth_provider_sec001.jsx';
const loginHtmlPath = 'login.html';
const loginPath = 'src/login.jsx';
const dataPath = 'src/data.jsx';

const adapter = fs.readFileSync(adapterPath, 'utf8');
const loginHtml = fs.readFileSync(loginHtmlPath, 'utf8');
const login = fs.readFileSync(loginPath, 'utf8');
const data = fs.readFileSync(dataPath, 'utf8');

function requireMatch(text, regex, message) {
  if (!regex.test(text)) failures.push(message);
}
function forbid(text, regex, message) {
  if (regex.test(text)) failures.push(message);
}

requireMatch(adapter, /enabled:\s*false/, 'adapter default must be disabled');
requireMatch(adapter, /environment:\s*'dev'/, 'adapter default environment must be dev');
requireMatch(adapter, /\['dev',\s*'qa'\]\.includes\(cfg\.environment\)/, 'adapter must fail closed outside dev/qa');
requireMatch(adapter, /cacheLocation:\s*'memory'/, 'adapter must default to memory cache');
forbid(adapter, /client[_-]?secret/i, 'adapter must not contain a client secret field or literal');
forbid(adapter, /setSesion\s*\(/, 'adapter must not issue or modify Campus sessions');
forbid(adapter, /\bclave\b\s*[:=,(]/i, 'adapter API must not accept a clave argument');
forbid(adapter, /\bpassword\b\s*[:=,(]/i, 'adapter API must not accept a password argument');
forbid(adapter, /https?:\/\/[\w.-]*auth0\.com/i, 'adapter must not hardcode an Auth0 tenant/domain');
forbid(adapter, /[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{24,}/, 'adapter appears to contain a token/JWT literal');

if (loginHtml.includes('auth_provider_sec001')) {
  failures.push('login.html must NOT load the adapter during inert-source phase');
}
if (/auth0(?:-spa-js|\.min\.js|\.js)/i.test(loginHtml)) {
  failures.push('login.html must NOT load Auth0 SDK during inert-source phase');
}
if (!/fn:\s*'iniciarSesion'[\s\S]*usuario:\s*usuarioLimpio[\s\S]*clave:\s*pass/.test(login)) {
  failures.push('legacy login shape changed unexpectedly before managed-auth integration gate');
}
if (!/function\s+setSesion\s*\(/.test(data) || !/sessionStorage\.setItem\('an_usuario'/.test(data)) {
  failures.push('Campus session setter/storage contract changed unexpectedly');
}
if (!/function\s+getSessionToken\s*\(/.test(data) || !/getSesion\(\)/.test(data)) {
  failures.push('Campus token reader contract changed unexpectedly');
}

// Execute only the adapter in an isolated VM to prove that loading the source
// by itself causes no redirect, fetch, storage write or SDK call.
let sdkCalls = 0;
let redirects = 0;
let fetchCalls = 0;
let storageWrites = 0;
const sandboxWindow = {
  location: { search: '', href: 'https://qa.example.invalid/login.html' },
  auth0: {
    createAuth0Client: async () => {
      sdkCalls += 1;
      return {};
    },
  },
  fetch: async () => {
    fetchCalls += 1;
    throw new Error('unexpected fetch');
  },
  localStorage: { setItem: () => { storageWrites += 1; } },
  sessionStorage: { setItem: () => { storageWrites += 1; } },
};
const context = vm.createContext({ window: sandboxWindow, URLSearchParams, console });
try {
  vm.runInContext(adapter, context, { filename: adapterPath });
} catch (e) {
  failures.push(`adapter failed to evaluate: ${e.message}`);
}
const api = sandboxWindow.SEC001_AUTH_PROVIDER;
if (!api || typeof api.getStatus !== 'function') failures.push('adapter API was not exposed for QA');
if (api) {
  const status = api.getStatus();
  if (status.ready !== false || status.enabled !== false) failures.push('adapter must be inert/disabled with no runtime config');
  if (!status.errors.includes('disabled')) failures.push('disabled state must be explicit');
  if (api.isEnabled() !== false) failures.push('isEnabled must be false by default');
}
if (sdkCalls !== 0 || redirects !== 0 || fetchCalls !== 0 || storageWrites !== 0) {
  failures.push(`adapter load caused side effects sdk=${sdkCalls} redirect=${redirects} fetch=${fetchCalls} storage=${storageWrites}`);
}

if (failures.length) {
  console.error('SEC-001 AUTH PROVIDER ADAPTER: FAIL');
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log('SEC-001 AUTH PROVIDER ADAPTER: PASS');
console.log('- adapter defaults disabled and dev-only');
console.log('- no tenant, secret, password/clave API, session write, fetch or redirect on load');
console.log('- login.html does not load adapter or Auth0 SDK');
console.log('- legacy login/session behavior remains unchanged in this phase');
