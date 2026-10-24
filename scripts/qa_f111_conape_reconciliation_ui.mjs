// F111 P0: interfaz CONAPE nunca ofrece reintentar aprobación parcial.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync('src/admin_students.jsx','utf8');
const action=src.slice(src.indexOf('  async function aprobarConape(r){'),src.indexOf('  function prepararCierreConapeNoContinuo',src.indexOf('  async function aprobarConape(r){')));
const render=src.slice(src.indexOf('const conapeEstado=String(r.CONAPE_EXPEDIENTE_ESTADO'),src.indexOf('const puedeCerrarNoContinuo=',src.indexOf('const conapeEstado=String(r.CONAPE_EXPEDIENTE_ESTADO')));
assert(action.includes("estado==='REQUIERE_CONCILIACION'||estado==='APROBANDO_CONAPE'"),'Guard incluso si una pestaña vieja solicita reintentar');
assert(action.indexOf('REQUIERE_CONCILIACION')<action.indexOf("postAdminStudents('aprobarAplicarCambioConape'"),'Nunca llamar al servidor antes del guard');
const pending=(render.match(/const conapePendienteActivo=(.+?);/)||[])[1]||'';
assert(pending.includes('PENDIENTE_APROBACION')&&pending.includes('ENVIADO_CONAPE'),'Los pendientes válidos conservan botón');
assert(!pending.includes('APROBANDO_CONAPE'),'Una publicación en curso no es accionable');
assert(!pending.includes('REQUIERE_CONCILIACION'),'Una publicación parcial no es accionable');
assert(src.includes("const conapeRequiereConciliacion=conapeEstado==='REQUIERE_CONCILIACION'"),'Estado visible de conciliación');
assert(src.includes('Publicación bloqueada hasta revisión administrativa.'),'Mensaje de resolución inequívoca');
assert(src.includes('{!simple&&conapePendienteActivo&&')||src.includes('{!simple&&conapePendienteActivo&&<AkActionButton'),'Botón utiliza gate seguro');
console.log('F111_CONAPE_UI_FAILCLOSED_E1_PASS: pending actionable, publishing/reconciliation blocked, operator warning visible');
