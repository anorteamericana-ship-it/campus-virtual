import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const loaderSource = fs.readFileSync('src/lazy_loader.jsx', 'utf8');
const studentMenuSource = fs.readFileSync('src/student_menu_academic_cs21a120.jsx', 'utf8');
const studentModulesSource = fs.readFileSync('src/student_modules.jsx', 'utf8');

assert.match(loaderSource, /F98\.4-Z6-CS21A179/);
assert.match(loaderSource, /const\s+routeKey\s*=\s*component\s*\+\s*['"]\|['"]/);
assert.match(loaderSource, /state\.routeKey\s*===\s*routeKey\s*\?\s*state\.View\s*:\s*null/);
assert.match(loaderSource, /return\s+React\.createElement\(View,\s*props\s*\|\|\s*\{\}\)/);
assert.match(loaderSource, /async\s+function\s+resolveRoute\s*\(files,\s*component\)/);
assert.match(loaderSource, /window\.anLazyCampus\s*=\s*\{[^}]*resolveRoute/);

assert.match(studentMenuSource, /F98\.4-Z6-CS21A179/);
assert.match(studentMenuSource, /loader\.resolveRoute\(files\s*\|\|\s*\[\],\s*component\)/);
assert.match(studentMenuSource, /src\/solicitudes_unificadas\.jsx\?v=F98\.4A/);
assert.match(studentMenuSource, /React\.createElement\(state\.View,\s*props\)/);
assert.doesNotMatch(studentMenuSource, /const\s+Component\s*=\s*window\[component\]/);
assert.doesNotMatch(studentModulesSource, /Información profesional del docente|Documentos del docente|esTeacherPerfil/);

for (const contract of [
  '__cs21a76TeacherProfile',
  '__cs21a144AccessGate',
  '__cs21a20AperturasWrapper',
  '__a77',
  '__cs21a122',
]) {
  assert.ok(loaderSource.includes(contract), `Falta el contrato canónico ${contract}.`);
}

const modules = new Map([
  ['profile-base.jsx', `
    function LegacyProfile(){ return 'LEGACY_PROFILE'; }
    window.PerfilView = LegacyProfile;
  `],
]);
const listeners = new Map();
const stateSlots = [];
const effectSlots = [];
let stateIndex = 0;
let effectIndex = 0;
let pendingEffects = [];

const React = {
  useState(initial) {
    const index = stateIndex++;
    if (!(index in stateSlots)) stateSlots[index] = typeof initial === 'function' ? initial() : initial;
    return [stateSlots[index], value => {
      stateSlots[index] = typeof value === 'function' ? value(stateSlots[index]) : value;
    }];
  },
  useEffect(effect, deps) {
    const index = effectIndex++;
    const previous = effectSlots[index];
    const changed = !previous || deps.length !== previous.deps.length || deps.some((value, i) => value !== previous.deps[i]);
    if (changed) pendingEffects.push({ index, effect, deps });
  },
  createElement(type, props, ...children) {
    return { type, props: props || {}, children };
  },
};

const context = vm.createContext({
  console,
  Date,
  Map,
  Promise,
  Set,
  clearInterval,
  clearTimeout,
  setInterval,
  setTimeout,
  React,
});
context.window = context;
context.location = { reload() {} };
context.addEventListener = (name, listener) => {
  if (!listeners.has(name)) listeners.set(name, []);
  listeners.get(name).push(listener);
};
context.dispatchEvent = event => {
  for (const listener of listeners.get(event.type) || []) listener(event);
};
context.CustomEvent = class CustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
};
context.fetch = async source => ({
  ok: modules.has(source),
  status: modules.has(source) ? 200 : 404,
  text: async () => modules.get(source) || '',
});
context.document = {
  createElement: () => ({}),
  head: {
    appendChild(script) {
      vm.runInContext(script.text, context);
    },
  },
};

vm.runInContext(loaderSource, context, { filename: 'src/lazy_loader.jsx' });

context.addEventListener('an:lazy-module-loaded', event => {
  if (event?.detail?.src !== 'profile-base.jsx') return;
  setTimeout(() => {
    const Base = context.PerfilView;
    function CanonicalProfile(props) { return Base(props); }
    CanonicalProfile.__cs21a76TeacherProfile = true;
    context.PerfilView = CanonicalProfile;
  }, 30);
});

function render(props) {
  stateIndex = 0;
  effectIndex = 0;
  pendingEffects = [];
  return context.LazyModuleView(props);
}

function runEffects() {
  for (const pending of pendingEffects) {
    const previous = effectSlots[pending.index];
    if (typeof previous?.cleanup === 'function') previous.cleanup();
    effectSlots[pending.index] = {
      deps: pending.deps,
      cleanup: pending.effect(),
    };
  }
  pendingEffects = [];
}

const profileProps = {
  files: ['profile-base.jsx'],
  component: 'PerfilView',
  props: { role: 'teacher' },
  title: 'Mi Perfil',
};

const firstProfileFrame = render(profileProps);
assert.equal(firstProfileFrame.type, 'div', 'La primera trama debe ser el estado neutro de carga.');
runEffects();
await new Promise(resolve => setTimeout(resolve, 180));

const canonicalProfileFrame = render(profileProps);
assert.equal(typeof canonicalProfileFrame.type, 'function');
assert.equal(canonicalProfileFrame.type.__cs21a76TeacherProfile, true);
assert.notEqual(canonicalProfileFrame.type.name, 'LegacyProfile');

function OtherCanonicalView() { return 'OTHER_CANONICAL'; }
context.OtherCanonicalView = OtherCanonicalView;
const otherProps = { files: [], component: 'OtherCanonicalView', props: {}, title: 'Otra ruta' };
const firstOtherFrame = render(otherProps);
assert.equal(firstOtherFrame.type, 'div', 'Un cambio de menú no debe reutilizar la vista anterior.');
runEffects();
await new Promise(resolve => setTimeout(resolve, 120));

const canonicalOtherFrame = render(otherProps);
assert.equal(canonicalOtherFrame.type, OtherCanonicalView);

function LateReplacement() { return 'LATE_REPLACEMENT'; }
context.OtherCanonicalView = LateReplacement;
const pinnedOtherFrame = render(otherProps);
assert.equal(pinnedOtherFrame.type, OtherCanonicalView, 'La ruta montada debe conservar la autoridad canónica fijada.');

for (const slot of effectSlots) if (typeof slot?.cleanup === 'function') slot.cleanup();

console.log('OK CS21A179: las rutas se montan de forma atómica y nunca renderizan el componente histórico transitorio.');
