import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

const read = file => fs.readFileSync(file, 'utf8');
const adapterPath = 'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx';
const livePath = 'src/english_lab_live.jsx';
const backendPath = 'apps_script_patches/97_ACTUALIZACION_QA.gs';
const appPath = 'src/app.jsx';
const builderPath = 'scripts/build_qa_staging_frontend_cs21a148.mjs';

const adapter = read(adapterPath);
const live = read(livePath);
const backend = read(backendPath);
const app = read(appPath);
const builder = read(builderPath);

const ast = parse(adapter, {
  sourceType: 'script',
  plugins: ['jsx', 'optionalChaining', 'objectRestSpread'],
});

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object' && value.type) walk(value, visit);
  }
}

const functions = new Map();
walk(ast, node => {
  if (node.type === 'FunctionDeclaration' && node.id?.name) functions.set(node.id.name, node);
});

function functionSource(name) {
  const node = functions.get(name);
  assert.ok(node, `Falta la función ${name}.`);
  return adapter.slice(node.start, node.end);
}

assert.match(adapter, /const VERSION = 'CS21A177'/, 'El adaptador no publica CS21A177.');
assert.match(functionSource('isMemoryMatchRoom'), /memory_match === true/, 'No reconoce la bandera memory_match.');
assert.match(functionSource('isMemoryMatchRoom'), /roomGameLabel\(room\) === GAME_LABEL/, 'No reconoce la etiqueta Memory Match.');
assert.match(functionSource('isMemoryMatchRoom'), /isMemoryMatchRoom\(room\.room\)/, 'No reconoce respuestas que envuelven room.');
assert.match(functionSource('installTransportGuard'), /inFlightReads\.get\(key\)/, 'No reutiliza lecturas idénticas pendientes.');
assert.match(functionSource('installTransportGuard'), /COALESCED_READ_ENDPOINTS/, 'No limita la consolidación a endpoints de lectura.');
assert.match(functionSource('installTransportGuard'), /recordMetric/, 'No registra latencia de endpoints.');
assert.ok(adapter.indexOf('installTransportGuard();') < adapter.indexOf('const api = Object.freeze'), 'El guard de transporte debe instalarse al cargar el adaptador.');

const detectionNames = ['clean', 'upper', 'roomGameId', 'roomGameLabel', 'isMemoryMatchRoom'];
const detectionCode = detectionNames.map(functionSource).join('\n');
const detectionSandbox = { results: null };
vm.runInNewContext(`
  const GAME_ID = 'MEMORY_MATCH';
  const GAME_LABEL = 'MEMORY MATCH';
  ${detectionCode}
  results = [
    isMemoryMatchRoom({game_id:'MEMORY_MATCH'}),
    isMemoryMatchRoom({game_code:'memory_match'}),
    isMemoryMatchRoom({game_label:'Memory Match'}),
    isMemoryMatchRoom({memory_match:true}),
    isMemoryMatchRoom({room:{game_label:'Memory Match'}}),
    isMemoryMatchRoom({game_label:'Vocabulary Sprint'}),
    isMemoryMatchRoom({})
  ];
`, detectionSandbox);
assert.deepEqual(Array.from(detectionSandbox.results), [true, true, true, true, true, false, false]);

const transportNames = [
  'clean', 'upper', 'endpointFromRequest', 'metricsStore', 'recordMetric',
  'responseSnapshot', 'responseFromSnapshot', 'installTransportGuard',
];
const transportCode = transportNames.map(functionSource).join('\n');
let backendCalls = 0;
const sandbox = {
  Map,
  Object,
  Array,
  Date,
  URL,
  Response,
  Promise,
  Math,
  setTimeout,
  clearTimeout,
  location: { href: 'http://127.0.0.1:4174/campus.html' },
  dispatchEvent() {},
  CustomEvent: class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } },
  fetch: async () => {
    backendCalls += 1;
    await new Promise(resolve => setTimeout(resolve, 25));
    return new Response(JSON.stringify({ok:true, call:backendCalls}), {
      status: 200,
      headers: {'content-type':'application/json'},
    });
  },
};
sandbox.global = sandbox;
vm.runInNewContext(`
  const VERSION = 'CS21A177';
  const MAX_METRICS = 100;
  const ENDPOINTS = Object.freeze({
    getPlayerState:'englishLabMemoryMatchGetPlayerState',
    getRoomControl:'englishLabMemoryMatchGetRoomControl'
  });
  const COALESCED_READ_ENDPOINTS = Object.freeze([ENDPOINTS.getPlayerState, ENDPOINTS.getRoomControl]);
  let transportInstalled = false;
  const inFlightReads = new Map();
  ${transportCode}
  installTransportGuard();
`, sandbox);

const readUrl = 'https://script.google.com/macros/s/qa/exec?fn=englishLabMemoryMatchGetPlayerState';
const readInit = {method:'POST', body:JSON.stringify({room_code:'LAB-TEST', player_id:'P1'})};
const [readA, readB] = await Promise.all([
  sandbox.fetch(readUrl, readInit),
  sandbox.fetch(readUrl, readInit),
]);
assert.equal(backendCalls, 1, 'Dos polls idénticos simultáneos llegaron dos veces al backend.');
assert.deepEqual(JSON.parse(await readA.text()), JSON.parse(await readB.text()), 'Las respuestas consolidadas no coinciden.');
assert.equal(sandbox.__ENGLISH_LAB_LIVE_METRICS__.length, 2, 'No registró las dos observaciones de latencia.');
assert.equal(sandbox.__ENGLISH_LAB_LIVE_METRICS__.filter(item => item.coalesced).length, 1, 'No marcó la lectura reutilizada.');

const writeUrl = 'https://script.google.com/macros/s/qa/exec?fn=englishLabMemoryMatchSubmitPair';
const writeInit = {method:'POST', body:JSON.stringify({room_code:'LAB-TEST', answer_value:{first_card_id:'A',second_card_id:'B'}})};
await Promise.all([sandbox.fetch(writeUrl, writeInit), sandbox.fetch(writeUrl, writeInit)]);
assert.equal(backendCalls, 3, 'Una escritura fue consolidada indebidamente.');

assert.match(live, /isMemoryMatchRoom\(r\?\.room\)/, 'El estudiante no vuelve a clasificar la respuesta del endpoint base.');
assert.match(live, /englishLabMemoryMatchGetPlayerState/, 'El estudiante no solicita el estado Memory Match.');
assert.match(backend, /fn === 'englishlablivegetplayerstate' && _elive176IsMemoryRoom_\(body\)/, 'El router QA no redirige la lectura histórica de una sala Memory Match.');
assert.match(builder, /'cache-control': 'no-store'/, 'El servidor QA puede reutilizar un adaptador antiguo por caché.');

const adapterIndex = app.indexOf('english_lab_live_memory_match_adapter_cs21a174.jsx');
const liveIndex = app.indexOf('src/english_lab_live.jsx');
assert.ok(adapterIndex >= 0 && liveIndex > adapterIndex, 'El adaptador debe cargar antes de la vista English LAB Live.');

console.log(JSON.stringify({
  ok: true,
  version: 'CS21A177',
  detection_cases: detectionSandbox.results.length,
  duplicate_reads_backend_calls: 1,
  write_calls_backend_calls: 2,
  metrics: sandbox.__ENGLISH_LAB_LIVE_METRICS__.length,
}));
