// F111 D3/D4 R12. El banco privado no se transforma en índices de catálogo oficial ajeno.
// Ejecutable GitHub Actions, sin red, Apps Script, notas ni datos reales.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('modulos/examen_oral.html','utf8');
assert(!html.includes('ORAL_BANCOS_IC5'));
assert(!html.includes('const QB={'));
assert(!html.includes('oral_bancos_ic5.js'));
assert(!fs.existsSync('modulos/oral_bancos_ic5.js'));
assert(html.includes("api('oralGetBancoPreguntasDocente'"));
assert(html.includes("preguntas_json:state.questions"));
assert(html.includes("otras_preguntas:document.getElementById('otras-global').value"));
assert(html.includes("if(!state.bankReady)return toast"));
assert(html.includes("if(!state.bankReady)return'Banco docente"));
assert(html.includes('oralNeedsReviewF111'));
assert(html.includes("await api('oralGetEvaluacion'"));
const inline=html.slice(html.indexOf('<script>\n')+8,html.lastIndexOf('</script>'));
new vm.Script(inline,{filename:'examen_oral.html'});
function extract(name) {
 const k='function '+name+'(',at=html.indexOf(k);
 assert(at>=0,'Falta '+name);
 const brace=html.indexOf('{',at);let d=0;
 for(let i=brace;i<html.length;i++){
  if(html[i]==='{') d++;
  else if(html[i]==='}'&&--d===0)return html.slice(html.slice(at-6,at)==='async '?at-6:at,i+1);
 }
 throw Error('Función incompleta '+name);
}
const lessons={9:[1,2,3,4],17:[5,6,7,8],25:[9,10,11,12],31:[13,14,15,16]},
levels=['B1','B2','I1','I2'], calls=[],notifications=[];
const state={panel:null,selected:{codigo:'SIM-R12-001'},evaluations:{},
 uncertainCloseCodes:{},busy:false,dirty:false,questions:{},bank:null,bankReady:false};
let responseCorruption='';
const field={value:''};
const ctx=vm.createContext({
 state, LECCIONES:Object.fromEntries(Object.entries(lessons).map(([l,units])=>[l,{units}])),
 api:async (fn,body)=>{
  assert.equal(fn,'oralGetBancoPreguntasDocente');
  calls.push({...body});
  const bank=Object.fromEntries((lessons[body.leccion]||[]).map(u=>[u,{
    title:'Unit '+u+' QA synthetic',qs:Array.from({length:9},(_,i)=>'QA question '+u+'-'+i)
  }]));
  if(responseCorruption==='wrong-level')return {solo_docente:true,version:'SIM',nivel:'I2',leccion:body.leccion,banco:bank};
  if(responseCorruption==='unit-missing')delete bank[lessons[body.leccion][0]];
  return {solo_docente:true,version:'SIM',nivel:body.nivel,leccion:body.leccion,banco:bank};
 },
 document:{getElementById:()=>field},
 oralLockedF111:()=>false,toast:x=>notifications.push(x),
 String,Number,Object,Array
});
for(const name of ['loadPrivateBankF111','questionBankForLevelF111','originalBankF111',
 'originalQuestionEntryF111','setOriginalQuestionF111'])vm.runInContext(extract(name),ctx);
assert.equal(Object.keys(ctx.questionBankForLevelF111()).length,0);
let n=0;
for(const level of levels)for(const lesson of Object.keys(lessons).map(Number)){
  state.bankReady=false; state.bank=null;state.panel={nivel:level,leccion:lesson,cod_grupo:'QA-ONLY-GRP'};
  assert.equal(ctx.originalBankF111(),null,'fail-closed before private API');
  state.bank=await ctx.loadPrivateBankF111(state.panel);state.bankReady=true;
  assert.equal(Object.keys(ctx.originalBankF111()).length,4,'4 private units only');
  assert.equal(Object.keys(ctx.questionBankForLevelF111()).length,0,
    'NEVER send private Cambridge indices to legacy B1/B2 grader');
  const u=lessons[lesson][0];state.dirty=false;field.value='';
  assert.equal(ctx.setOriginalQuestionF111(u,8,true),true,'9th private question must be selectable');
  assert(field.value.includes('QA question '+u+'-8')&&state.dirty,'Track actual text');
  assert.equal(Object.keys(state.questions).length,0,'No unsupported numeric indices');
  ctx.setOriginalQuestionF111(u,8,true);
  assert.equal(field.value.split('QA question '+u+'-8').length,2,'No duplicated trace');
  assert.equal(ctx.setOriginalQuestionF111(u,8,false),true,'Uncheck prompt');
  assert.equal(field.value,'');
  n++;
}
assert.equal(n,16,'All 4 levels x 4 lessons');
assert.equal(calls.length,16,'Only 16 calls to private endpoint');
state.panel={nivel:'B2',leccion:9,cod_grupo:'QA-ONLY-GRP'};
responseCorruption='wrong-level';
await assert.rejects(ctx.loadPrivateBankF111(state.panel),/no confirmó/);
responseCorruption='unit-missing';
await assert.rejects(ctx.loadPrivateBankF111(state.panel),/no confirmó/);
responseCorruption='';
state.bankReady=false;
assert.equal(ctx.originalBankF111(),null,'No bank after invalidation');
state.evaluations['SIM-R12-001']={ESTADO:'CERRADO'};
state.bankReady=true;state.bank=await ctx.loadPrivateBankF111(state.panel);
assert.equal(ctx.setOriginalQuestionF111(1,0,true),false,'Closed reviews are immutable');
console.log('F111_R12_ORAL_CLIENT_CONTRACT_PASS: 16/16 level-lesson contexts, 64 unit slots, full-text trace, no B1/B2 index mismatch, 2 malformed payloads denied, closed denied, prodWrites=0');
