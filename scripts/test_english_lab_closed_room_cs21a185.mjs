#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const backend = fs.readFileSync('apps_script_patches/99F_FIX_MEMORY_MATCH_CLOSED_ROOM_QA_CS21A185.gs', 'utf8');
const complete = fs.readFileSync('apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs', 'utf8');
const frontend = fs.readFileSync('src/english_lab_live_student_dependency_guard_cs21a184.js', 'utf8');

// Backend: CLOSED debe cortocircuitar antes de leer/avanzar el paquete y también
// después del refetch bajo lock, evitando la carrera cierre-vs-timeout.
assert.match(backend, /CS21A185-MM-CLOSED-ROOM-FIX1/);
assert.match(backend, /if \(_cs21a185MmRoomClosed_\(found\.row\)\) return found\.row;/);
assert.match(backend, /var room = fresh\.row;\s*if \(_cs21a185MmRoomClosed_\(room\)\) return room;/);
assert.match(backend, /_elive180TouchPlayer_ = function \(room, player\) \{\s*if \(_cs21a185MmRoomClosed_\(room\)\) return;/);
assert.match(backend, /closed_room_turns_frozen:true/);
assert.match(backend, /closed_room_presence_frozen:true/);
assert.match(complete, /99F_FIX_MEMORY_MATCH_CLOSED_ROOM_QA_CS21A185\.gs/);
assert.match(complete, /CS21A185-MM-CLOSED-ROOM-FIX1/);

class MemoryStorage {
  constructor(initial = {}) { this.map = new Map(Object.entries(initial)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const localStorage = new MemoryStorage({
  elive_last_room:'LAB-3481',
  'elive_player_LAB-3481':'QA-STU-005',
});
const listeners = new Map();
const document = {
  addEventListener(type, handler) { listeners.set(type, handler); },
};
const loaded = [];
const lazy = {
  async loadOne(src) { loaded.push(src); return src; },
  async loadMany(files) { loaded.push(...files); },
};
const events = [];
const window = {
  localStorage,
  document,
  location:{href:'http://127.0.0.1:4181/campus.html#academia_play'},
  anLazyCampus:lazy,
  fetch:async () => new Response(JSON.stringify({ok:true}), {status:200, headers:{'content-type':'application/json'}}),
  Response,
  URL,
  CustomEvent:class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
  dispatchEvent(event) { events.push(event); return true; },
  addEventListener() {},
  setInterval() { return 1; },
  clearInterval() {},
  setTimeout() { return 1; },
};
window.window = window;

vm.runInNewContext(frontend, {window, URL, Response, console}, {filename:'english_lab_live_student_dependency_guard_cs21a184.js'});
const api = window.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__;
assert.ok(api);
assert.equal(api.closedRoomVersion, 'F98.4-Z6-CS21A185');

// Reproduce LAB-3481: una respuesta CLOSED elimina la restauración y el player guardado.
api.inspectStatePayload({room:{room_code:'LAB-3481', status:'CLOSED'}});
assert.equal(localStorage.getItem('elive_last_room'), null);
assert.equal(localStorage.getItem('elive_player_LAB-3481'), null);
assert.equal(api.isKnownClosedRoom('LAB-3481'), true);
assert.equal(api.getActiveRoomCode(), 'LAB-3481');
assert.equal(events.some(event => event.type === 'an:english-lab-room-closed'), true);

// Incluso si un navegador viejo vuelve a escribir la sala cerrada, el arranque la sanea.
localStorage.setItem('elive_last_room', 'LAB-3481');
localStorage.setItem('elive_player_LAB-3481', 'QA-STU-005');
assert.equal(api.sanitizePersistedLastRoom(), '');
assert.equal(localStorage.getItem('elive_last_room'), null);
assert.equal(localStorage.getItem('elive_player_LAB-3481'), null);

// Una sala nueva sí puede ser activa y Cambiar sala limpia su persistencia.
api.inspectStatePayload({room:{room_code:'LAB-3386', status:'CREATED'}});
localStorage.setItem('elive_last_room', 'LAB-3386');
localStorage.setItem('elive_player_LAB-3386', 'QA-STU-005');
const click = listeners.get('click');
assert.equal(typeof click, 'function');
const button = {textContent:'← Cambiar sala'};
click({target:{closest:selector => selector === 'button' ? button : null}});
assert.equal(localStorage.getItem('elive_last_room'), null);
assert.equal(localStorage.getItem('elive_player_LAB-3386'), null);
assert.equal(api.isKnownClosedRoom('LAB-3386'), false);

// CS21A184 sigue intacto: al cargar Live se deben cargar antes las 4 dependencias.
window.EnglishLabMemoryMatchLiveCS21A174 = {};
window.MemoryMatchLiveRoundCS21A174 = function () {};
await window.anLazyCampus.loadOne('src/english_lab_live.jsx?v=F98.4Z6CS20H');
for (const required of api.prerequisites) assert.equal(loaded.includes(required), true, `Falta dependencia ${required}`);
assert.equal(loaded.some(item => /english_lab_live\.jsx/.test(item)), true);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A185',
  closed_room_terminal:true,
  closed_room_turns_frozen:true,
  closed_room_presence_frozen:true,
  closed_room_local_storage_cleared:true,
  change_room_clears_persistence:true,
  stale_closed_room_not_restored:true,
  cs21a184_dependencies_preserved:true,
}, null, 2));
