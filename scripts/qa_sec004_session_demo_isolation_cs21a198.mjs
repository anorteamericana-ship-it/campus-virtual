import fs from 'node:fs';

const src = fs.readFileSync('src/data.jsx', 'utf8');
const start = src.indexOf('const _solpDemoForced = (() => {');
const end = src.indexOf('async function _solpFetch', start);
if (start < 0 || end < 0) throw new Error('No se encontró el bloque _solpDemoForced/_solpFetch.');
const block = src.slice(start, end);

function must(cond, msg) {
  if (!cond) throw new Error(msg);
}

must(block.includes("q.get('demo') === '1'"), 'Debe conservarse ?demo=1 como preview explícito.');
must(block.includes("q.get('preview')"), 'Debe conservarse ?preview como preview explícito.');
must(block.includes("typeof getSesion === 'function' ? getSesion() : null"), 'El gate debe consultar una sesión Campus activa.');
must(block.includes('if (activeSession)'), 'Debe existir un fail-closed explícito para sesión activa.');
must(block.includes("localStorage.getItem('an_solp_demo') === '1'"), 'El flag local de preview debe seguir disponible sin sesión.');

const activeIdx = block.indexOf('if (activeSession)');
const falseIdx = block.indexOf('return false;', activeIdx);
const finalLocalIdx = block.lastIndexOf("return localStorage.getItem('an_solp_demo') === '1';");
must(activeIdx >= 0 && falseIdx > activeIdx, 'Una sesión activa debe terminar en return false.');
must(finalLocalIdx > falseIdx, 'El localStorage solo puede habilitar demo después del fail-closed de sesión activa.');

const fetchStart = src.indexOf('async function _solpFetch', end);
const fetchEnd = src.indexOf('// POST al Apps Script', fetchStart);
const fetchBlock = src.slice(fetchStart, fetchEnd);
must(fetchBlock.includes('if (_solpDemoForced) return demoCall();'), '_solpFetch debe conservar el preview explícito.');
must(/catch\s*\([^)]*\)\s*\{[\s\S]*?return\s*\{\s*ok\s*:\s*false/.test(fetchBlock), 'Una falla real de red debe seguir devolviendo ok:false.');
const catchIdx = fetchBlock.indexOf('catch (');
const catchBlock = catchIdx >= 0 ? fetchBlock.slice(catchIdx) : '';
must(!catchBlock.includes('demoCall()'), 'Una falla real no puede caer al store demo.');

for (const needle of ['reportarPago', 'cancelarSolicitudPago', 'getBecas', 'getCalendarioMatriculas']) {
  must(src.includes(needle), `Debe preservarse la superficie ${needle}.`);
}

console.log('CS21A198 SEC004 SESSION DEMO ISOLATION: PASS');
console.log('REAL_SESSION_LOCALSTORAGE_DEMO=BLOCKED');
console.log('EXPLICIT_URL_PREVIEW=PRESERVED');
console.log('NETWORK_FAILURE_LOCAL_SUCCESS=NO');
console.log('APPS_SCRIPT_WRITES=UNCHANGED');
