// F111 EX-04 · PR-D2 E1 · contrato estudiante real, sin escribir datos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const app=fs.readFileSync('src/examenes_app.jsx','utf8');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const data=fs.readFileSync('src/examenes_data.jsx','utf8');
const marker='// F111 PR-D2 E1 · contrato estricto';
const start=app.indexOf(marker),end=app.indexOf('function StudentLiveExamApp()',start);
assert(start>=0&&end>start,'Contrato estudiante ausente del frontend real');
const contract=vm.runInNewContext(app.slice(start,end)+'\\nf111ExamPublicContractSafe;');
const activation={EXAM_ID:'B1_WRITTEN_L18_TEST1_A'};
const sample=()=>({exam_id:activation.EXAM_ID,id:activation.EXAM_ID,payload_scope:'student_public_no_keys',public_payload_version:'V10H',sections:[{letter:'A',questions:[{id:'A1',stem:'Sample question',opts:[['a','A'],['b','B']]}]}]});
assert.equal(contract(sample(),activation),true,'Cuestionario público autorizado debería pasar');
const invalid=[
  ['sin payload',null],
  ['sin secciones',{...sample(),sections:[]}],
  ['versión antigua',{...sample(),public_payload_version:'V10G'}],
  ['sin marca privada',{...sample(),payload_scope:'unknown'}],
  ['ID ajeno',{...sample(),exam_id:'I2_WRITTEN_L32_TEST2_B',id:'I2_WRITTEN_L32_TEST2_B'}],
  ['claves top-level',{...sample(),answer_key:{A1:'b'}}],
  ['clave anidada',{...sample(),sections:[{questions:[{id:'A1',correct:'b'}]}]}],
  ['aceptadas anidadas',{...sample(),sections:[{questions:[{id:'A1',accepted:['b']}]}]}],
  ['guion de audio',{...sample(),sections:[{audioScript:'secret',questions:[]}]}],
  ['campo con espacios',{...sample(),sections:[{questions:[{'correct answer':'B'}]}]}]
];
for(const [name,payload] of invalid)assert.equal(contract(payload,activation),false,name);
const live=app.slice(app.indexOf('function StudentLiveExamApp()'),app.indexOf('function TeacherPreviewLiveApp()'));
const guardIdx=live.indexOf('if (!f111ExamPublicContractSafe(publicExam, activation))');
const renderIdx=live.indexOf('return <StudentMode');
assert(guardIdx>0 && renderIdx>guardIdx,'El guard debe correr antes de montar StudentMode o iniciar el examen');
assert(bundle.includes(marker),'El runtime efectivo debe contener el contrato (no solo el source)');
assert(!live.includes('examOverride || getExam('),'El runtime de la app no debe incluir un fallback local explícito');
console.log('F111 EX-04 E1 CONTRACT PASS: ID, esquema, claves anidadas, versiones, sin fallback operativo.');
const keyPatterns=[/\\bcorrect\\s*:/g,/\\baccepted\\s*:/g,/\\baudioScript\\s*:/g];
const sourceHits=keyPatterns.map(re=>(data.match(re)||[]).length);
const bundleHits=keyPatterns.map(re=>(bundle.match(re)||[]).length);
const exposed=sourceHits.some(x=>x>0)||bundleHits.some(x=>x>0);
console.log('F111 EX-04 PUBLIC-DISTRIBUTION '+(exposed?'NO_GO':'CLEAN')+' (cuentas de marcadores sensibles, sin valores): source='+sourceHits.join('/')+' bundle='+bundleHits.join('/'));
if(process.env.F111_EX04_REQUIRE_CLEAN==='1')assert.equal(exposed,false,'NO-GO: las claves siguen en la distribución pública; no promover runtime estudiante.');
