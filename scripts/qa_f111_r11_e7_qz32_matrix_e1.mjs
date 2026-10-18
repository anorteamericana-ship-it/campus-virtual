// F111 R11-E7 D5: 32 SLOTS de Progress Check según el Campus real.
// SOLO metadatos y calendario pedagógico: NO es banco Cambridge ni 32 quizzes digitalizados.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync('src/student_academic_summary_core_cs21a113.js','utf8');
const dom=fs.readFileSync('src/student_academic_summary_dom_cs21a113.js','utf8');
function readConst(name){
 const match=src.match(new RegExp('const\\s+'+name+'\\s*=\\s*(\\[[^;]+\\]);'));
 assert(match,'Matriz '+name+' inexistente en Resumen Académico');
 return vm.runInNewContext('('+match[1]+')');
}
const lessons=Array.from(readConst('PC'));
const defs=Array.from(readConst('DEFS'));
const levels=['B1','B2','I1','I2'];
let checks=0;
assert.equal(lessons.length,8);checks++;
assert.equal(new Set(lessons).size,8);checks++;
for(const n of lessons){assert(Number.isInteger(n)&&n>=1&&n<=32);checks++;}
assert.deepEqual(lessons,[4,8,13,16,21,24,28,30]);checks++;
assert.equal(defs.length,8);checks++;
const names=defs.map(row=>row[0]);
assert.deepEqual(names,['ORAL_1','ORAL_2','ESCRITO_1','ORAL_3','ORAL_4',
 'ESCRITO_2','SOCIAL','ICAN']);checks++;
assert(!names.includes('PROGRESS_CHECK'));checks++;
const examLessons=defs.map(row=>row[2]).filter(Boolean);
assert(examLessons.every(n=>!lessons.includes(n)),'Progress Check no es examen INA oficial');checks++;
assert(dom.includes("C.up(r?.tipo)==='PROGRESS_CHECK'"),
 'Campus muestra feedback en Resumen Académico');checks++;
assert(dom.includes("d.pcMap.get(n)?.comentario"),
 'El Progress Check almacena comentario pedagógico');checks++;
const matrix=levels.flatMap(level=>lessons.map((lesson,i)=>({
 id:level+'-PC-'+String(i+1).padStart(2,'0'),nivel:level,leccion:lesson,
 porcentaje_ina:0,comentario_pedagogico:true
})));
assert.equal(matrix.length,32);checks++;
assert.equal(new Set(matrix.map(x=>x.id)).size,32);checks++;
const maxima={'ORAL_1':15,'ORAL_2':15,'ORAL_3':15,'ORAL_4':15,
 'ESCRITO_1':5,'ESCRITO_2':5,'SOCIAL':10,'ICAN':20};
assert.equal(Object.values(maxima).reduce((a,b)=>a+b,0),100);checks++;
assert(matrix.every(x=>x.porcentaje_ina===0));checks++;
assert.equal(checks,19);
console.log(JSON.stringify({verdict:'PASS_F111_E7_QZ32_METADATA_ONLY',
 checks,levels:levels.length,progress_checks_per_level:8,slots:matrix.length,
 lessons,ina_weight_added:0,
 caveat:'NO certifica 32 cuestionarios Cambridge, audio, respuestas o activaciones reales.'}));
