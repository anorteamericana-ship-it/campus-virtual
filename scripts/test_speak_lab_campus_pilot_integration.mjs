import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const source = fs.readFileSync('src/speak_lab_pilot_integration_cs21a216.js', 'utf8');

const dom = new JSDOM(`<!doctype html><html><head></head><body>
  <aside class="sb" data-role="teacher">
    <button class="sb-item teacher-sb-item"><span class="sb-label">Mi Perfil</span></button>
    <button class="sb-item teacher-sb-item"><span class="sb-label">English LAB</span></button>
    <button class="sb-item teacher-sb-item"><span class="sb-label">English LAB Live</span></button>
    <button class="sb-item teacher-sb-item"><span class="sb-label">Exámenes</span></button>
    <div class="sb-user">Usuario</div>
  </aside>
  <main class="main"><div id="underlying">Pantalla Campus existente</div></main>
</body></html>`, {
  url:'https://qa-campus.example/campus-virtual',
  runScripts:'outside-only',
  pretendToBeVisual:true,
});

const { window } = dom;
const { document } = window;
let role = 'teacher';
let loadedFiles = null;
let renderedElement = null;
let unmountCount = 0;
const main = document.querySelector('main.main');
main.getBoundingClientRect = () => ({ left:244, top:0, right:1200, bottom:800, width:956, height:800 });

window.getSesion = () => ({ rol:role, token:'opaque-session-test' });
window.React = {
  createElement(component, props){ return { component, props }; },
};
window.ReactDOM = {
  createRoot(host){
    assert.equal(host.getAttribute('data-speak-lab-pilot-overlay'), 'CS21A216');
    return {
      render(element){ renderedElement = element; },
      unmount(){ unmountCount += 1; },
    };
  },
};
window.anLazyCampus = {
  async loadMany(files){
    loadedFiles = [...files];
    window.SpeakLabPilotRuntimeCS21A216 = Object.freeze({ version:'CS21A216-test' });
    window.SpeakLabPilotView = function SpeakLabPilotViewTest(){};
  },
};

window.eval(source);
document.dispatchEvent(new window.Event('DOMContentLoaded'));
await new Promise(resolve => window.setTimeout(resolve, 10));

const labels = () => [...document.querySelectorAll('aside.sb button.sb-item .sb-label')].map(node => node.textContent.trim());
let speakButton = document.querySelector('[data-speak-lab-pilot="CS21A216"]');
assert.ok(speakButton, 'Speak LAB debe insertarse para docente.');
assert.equal(speakButton.getAttribute('data-nav-id'), 'speak_lab');
assert.match(speakButton.className, /teacher-sb-item/);
assert.deepEqual(labels(), ['Mi Perfil','English LAB','English LAB Live','Speak LAB','Exámenes']);
assert.equal(document.querySelector('#underlying').textContent, 'Pantalla Campus existente');

speakButton.click();
await new Promise(resolve => window.setTimeout(resolve, 15));

const overlay = document.querySelector('[data-speak-lab-pilot-overlay="CS21A216"]');
assert.ok(overlay, 'Click debe abrir overlay Speak LAB.');
assert.equal(overlay.style.left, '244px');
assert.equal(overlay.style.top, '0px');
assert.ok(Array.isArray(loadedFiles));
assert.deepEqual(loadedFiles, [
  'src/speak_lab_pilot_runtime_cs21a216.js?v=CS21A216',
  'src/speak_lab_pilot_view_cs21a216.jsx?v=CS21A216',
]);
assert.equal(typeof renderedElement?.component, 'function');
assert.equal(typeof renderedElement?.props?.onClose, 'function');
assert.match(speakButton.className, /active/);

renderedElement.props.onClose();
assert.equal(document.querySelector('[data-speak-lab-pilot-overlay]'), null);
assert.equal(unmountCount, 1);
assert.doesNotMatch(speakButton.className, /active/);
assert.equal(document.querySelector('#underlying').textContent, 'Pantalla Campus existente');

// Un rol administrativo no recibe entrada piloto.
role = 'admin';
window.dispatchEvent(new window.Event('an:session-changed'));
await new Promise(resolve => window.setTimeout(resolve, 30));
assert.equal(document.querySelector('[data-speak-lab-pilot]'), null);

// Al volver como estudiante, la entrada reaparece sin duplicarse.
role = 'student';
document.querySelector('aside.sb').setAttribute('data-role', 'student');
window.dispatchEvent(new window.Event('an:session-changed'));
await new Promise(resolve => window.setTimeout(resolve, 30));
speakButton = document.querySelector('[data-speak-lab-pilot="CS21A216"]');
assert.ok(speakButton);
assert.match(speakButton.className, /student-sb-item/);
assert.equal(document.querySelectorAll('[data-speak-lab-pilot]').length, 1);

console.log(JSON.stringify({
  ok:true,
  cut:'CS21A216',
  integration:'sidebar-overlay-dom-smoke',
  teacher_entry:true,
  student_entry:true,
  admin_entry:false,
  inserted_after_english_lab_live:true,
  overlay_preserves_underlying_screen:true,
  lazy_files:loadedFiles,
  duplicate_buttons:0,
}, null, 2));

dom.window.close();
