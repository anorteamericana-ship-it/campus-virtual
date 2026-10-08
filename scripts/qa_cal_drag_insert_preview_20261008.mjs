import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Babel=require('../vendor/babel.js');
const source=fs.readFileSync('src/cronograma_grupo.jsx','utf8');
Babel.transform(source,{presets:['react'],plugins:['transform-block-scoping']});
const from=source.indexOf('function cgFechaEditable(');
const to=source.indexOf('function idLeccion(',from);
assert(from>0&&to>from,'Calendar helpers found');
const sandbox={
  diasEntre:iso=>Math.round((new Date(iso+'T00:00:00Z')-new Date('2026-10-08T00:00:00Z'))/86400000),
  normalizarNivelCG:n=>n,
  FERIADOS_CR_NAMES:{'2026-12-01':'Abolición del Ejército','2026-12-25':'Navidad'},
};
vm.createContext(sandbox);
vm.runInContext(source.slice(from,to),sandbox);
const d=new Date('2026-10-08T12:00:00Z'),rows=[];
while(rows.length<32){
  if([2,4].includes(d.getUTCDay()) && d.toISOString().slice(0,10)!=='2026-12-01'){
    rows.push({cod_grupo:'B1-KJ18-C3-0826',nivel:'B1',leccion:rows.length+1,fecha:d.toISOString().slice(0,10),
      hora_inicio:'18:00',hora_fin:'21:00',tipo:'CLASE',estado:'PROGRAMADA'});
  }
  d.setUTCDate(d.getUTCDate()+1);
}
assert.equal(rows[24].fecha,'2027-01-05','Lección 25 del patrón después del feriado 1/dic');
assert.equal(rows[31].fecha,'2027-01-28','Lección 32 original');
const preview=sandbox.cgPropuestaAdelanto(rows,'B1-KJ18-C3-0826','B1','2026-12-21');
assert(preview.ok,preview.motivo);
assert.equal(preview.primera,21);
assert.equal(preview.cambios[0].nueva,'2026-12-21');
assert.equal(preview.cambios[1].nueva,'2026-12-22');
assert.equal(preview.cambios[2].nueva,'2026-12-24');
assert.equal(preview.cambios.at(-1).nueva,'2027-01-26');
assert.equal(preview.fechaLiberada,'2027-01-28');
assert.equal(preview.cambios.length,12);
assert.equal(sandbox.cgPropuestaAdelanto(rows,'B1-KJ18-C3-0826','B1','2026-12-01').ok,false,'Feriado bloqueado');
const closed=rows.map(x=>({...x}));closed[24].estado='CERRADA';
assert.equal(sandbox.cgPropuestaAdelanto(closed,'B1-KJ18-C3-0826','B1','2026-12-21').ok,false,'Cerradas bloqueadas');
assert.equal(sandbox.cgLeccionArrastrable(rows[24]),true,'Programada futura draggable');
assert.equal(sandbox.cgLeccionArrastrable({...rows[24],estado:'CALCULADA'}),false,'Calculadas no persistidas bloqueadas');
assert.equal(sandbox.cgLeccionArrastrable({...rows[24],estado:'CERRADA'}),false,'Cerradas bloqueadas');
assert(source.includes("postCronoGrupo('solicitarSuspension'"),'Move uses existing authenticated request');
assert(source.includes('tipo_solicitud:\'REPROGRAMACION\''),'Reprogramming request type');
assert(source.includes('Simulación solamente.'),'Insert explicitly preview only');
assert(source.includes('Arrastrá una lección futura'), 'Instruction visible');
const app=fs.readFileSync('src/app.jsx','utf8');
const bridge=fs.readFileSync('src/att77_bridge.js','utf8');
const shell=fs.readFileSync('campus.html','utf8');
assert((app.match(/src\/cronograma_grupo\.jsx\?v=F99CALMOVE20261008/g)||[]).length===3,'All lazy routes load current version');
assert(bridge.includes('src/cronograma_grupo.jsx?v=F99CALMOVE20261008'),'Attendance bridge loads same version');
assert(shell.includes('src/att77_bridge.js?v=F99CALMOVE20261008'),'Attendance bridge busts cache');
assert(shell.includes('src/app.jsx?v=F99CALMOVE20261008'),'Main app busts cache');
console.log('PASS_CAL_DRAG_INSERT_PREVIEW');
console.log('B1-KJ18: 21 dic inserts L21, L22 on 22 dic, L23 on 24 dic, L32 on 26 ene, 28 ene freed');
console.log('GUARDS: holiday, 32 lessons, completed/calc rows; no insert writes');