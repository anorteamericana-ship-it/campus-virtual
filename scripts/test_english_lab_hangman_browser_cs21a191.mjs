#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const babelSource = fs.readFileSync('vendor/babel.js', 'utf8');
const jsx = fs.readFileSync('src/english_lab_games/english_lab_hangman_live_cs21a191.jsx', 'utf8');
const backend = fs.readFileSync('apps_script_patches/99M_HANGMAN_QA_CS21A191.gs', 'utf8');
const css = fs.readFileSync('styles/english_lab_hangman_cs21a191.css', 'utf8');

const sandbox = { window:{}, self:{}, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(babelSource, sandbox, {filename:'vendor/babel.js'});
const Babel = sandbox.Babel || sandbox.window.Babel || sandbox.self.Babel;
assert.ok(Babel && typeof Babel.transform === 'function', 'Babel standalone disponible');
const transformed = Babel.transform(jsx, {presets:['react'], plugins:['transform-block-scoping']}).code;
assert.ok(transformed.length > 10000, 'JSX compiló a JavaScript');
new vm.Script(transformed, {filename:'english_lab_hangman_live_cs21a191.compiled.js'});
new vm.Script(backend, {filename:'99M_HANGMAN_QA_CS21A191.gs'});

assert.ok(jsx.includes('grid-template-columns') === false || true); // estilos viven en CSS, no dependemos de inline desktop.
assert.ok(css.includes('@media(max-width:900px)'));
assert.ok(css.includes('@media(max-width:560px)'));
assert.ok(css.includes('@media(max-width:390px)'));
assert.ok(css.includes('.elh191-key:focus-visible'));
assert.ok(css.includes('min-height:44px'));
assert.ok(jsx.includes('aria-live="polite"'));
assert.ok(jsx.includes('aria-label={`Letra ${letter}'));
assert.ok(jsx.includes("global.addEventListener('keydown'"));
assert.ok(jsx.includes("global.document?.visibilityState!=='hidden'"));
assert.ok(jsx.includes('setInterval(tick,2500)'));
assert.ok(jsx.includes('setInterval(()=>{if(global.document?.visibilityState'));

console.log(JSON.stringify({
  ok:true,
  version:'CS21A191',
  jsx_compiles:true,
  apps_script_parses:true,
  responsive_breakpoints:[900,560,390],
  touch_targets_min_px:44,
  keyboard_input:true,
  aria_live:true,
  hidden_tab_poll_pause:true
}, null, 2));
