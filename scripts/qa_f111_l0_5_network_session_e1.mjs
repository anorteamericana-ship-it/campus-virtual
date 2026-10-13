// F111 L0-5 · E1 unitario sin red ni datos institucionales.
// La prueba Playwright del flujo completo debe ejecutarse antes de solicitar merge.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../src/data.jsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
const teacher=fs.readFileSync(new URL('../src/teacher_views.jsx',import.meta.url),'utf8');
const begin=source.indexOf('async function validarSesionServidor() {');
const end=source.indexOf('\n// Cierra la sesión en el backend',begin);
assert(begin>=0 && end>begin,'La función de validación debe estar localizable');
const snippet=source.slice(begin,end);
let checks=0;
async function exercise(fetchMock){
 const session={rol:'student',token:'QA_FAKE_TOKEN'};
 let localClearCount=0;
 const sandbox={
  APPS_SCRIPT_URL:'https://fake.invalid/exec',
  getSessionToken:()=>session.token,
  fetch:fetchMock,
  JSON,Error,
  localStorage:{clear(){localClearCount++}},
 };
 const fn=vm.runInNewContext(snippet+'\nvalidarSesionServidor',sandbox);
 const result=await fn();
 assert.equal(localClearCount,0,'No borrar sesión al validar');
 return result;
}
const cases=[
 {name:'red abortada',fetch:async()=>{throw new Error('network aborted')},flag:true},
 {name:'non-JSON',fetch:async()=>({ok:true,json:async()=>{throw new SyntaxError('not json')}}),flag:true},
 {name:'HTTP 502 no JSON',fetch:async()=>({ok:false,status:502,json:async()=>{throw new SyntaxError('html')}}),flag:true},
 {name:'sesión expirada',fetch:async()=>({ok:true,json:async()=>({ok:false,error:'sesion_expirada'})}),flag:false,expired:true},
 {name:'sesión válida',fetch:async()=>({ok:true,json:async()=>({ok:true,rol:'student'})}),flag:false,valid:true}
];
for(const c of cases){
 const v=await exercise(c.fetch);
 assert.equal(Boolean(v.network_error),c.flag,c.name+' network_error');
 if(c.expired)assert.equal(v.error,'sesion_expirada',c.name);
 if(c.valid)assert.equal(v.ok,true,c.name);
 checks++;
}
assert(app.includes("estado === 'expirada'"),'Gate debe mostrar sesión expirada');
assert(app.includes('sesion_expirada'),'Gate debe distinguir expiración real');
assert(app.includes('Ir al inicio de sesión'),'Gate debe incluir botón a login');
assert(teacher.includes('network_error'),'Filtro docente distingue error de red');
checks+=4;
console.log('PASS_E1_F111_L0_5 checks='+checks);
