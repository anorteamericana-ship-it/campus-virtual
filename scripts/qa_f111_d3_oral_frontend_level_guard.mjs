// F111 D3/D4 R11: contrato de banco privado, sin red ni expedientes reales.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('modulos/examen_oral.html','utf8');
assert.ok(!html.includes('ORAL_BANCOS_IC5'),'No se puede consumir banco público');
assert.ok(!html.includes('const QB={'),'B1 no debe incrustarse en HTML');
assert.ok(!html.includes('oral_bancos_ic5.js'),'No cargar asset público');
assert.ok(!fs.existsSync('modulos/oral_bancos_ic5.js'),'Eliminar asset publicado en HEAD del candidato');
const inline=html.slice(html.indexOf('<script>\n')+8,html.lastIndexOf('</script>'));
new vm.Script(inline,{filename:'modulos/examen_oral.html'});
assert.ok(html.includes("api('oralGetBancoPreguntasDocente'"),'Banco obtenido exclusivamente de API');
assert.ok(html.includes('if(!state.bankReady)return toast'),'Borradores/PDF denegados sin banco');
assert.ok(html.includes("if(!state.bankReady)return'Banco docente"),'Cierre exige banco validado');
assert.ok(html.includes('oralNeedsReviewF111'),'No reintentar nota de cierre incierto');
assert.ok(html.includes("await api('oralGetEvaluacion'"),'Reconciliación por lectura después de timeout');
assert.ok(html.includes('data-original-unit'),'Selección histórica I1/I2 conservada');
assert.ok(html.includes('preguntas_json:state.questions'),'Contrato de borrador conservado');
function extract(name){
 const a=html.indexOf('function '+name+'(');
 assert.ok(a>=0,'Falta '+name);
 const b=html.indexOf('{',a);let depth=0;
 for(let i=b;i<html.length;i++){
  if(html[i]==='{')depth++;
  else if(html[i]==='}'&&--depth===0)return html.slice(html.slice(a-6,a)==='async '?a-6:a,i+1);
 }
 throw Error('No cierra '+name);
}
const fake={1:{title:'Solo fixture QA',qs:['simulado']},
 2:{title:'Solo fixture QA',qs:['simulado']},
 3:{title:'Solo fixture QA',qs:['simulado']},
 4:{title:'Solo fixture QA',qs:['simulado']}};
let calls=0;
const state={panel:{nivel:'B1'},bankReady:false,bank:null,scores:{}};
const ctx=vm.createContext({state,LECCIONES:{9:{units:[1,2,3,4]}},
 api:async(fn,body)=>{calls++; assert.equal(fn,'oralGetBancoPreguntasDocente');
  assert.equal(body.cod_grupo,'G-QA');
  return {ok:true,solo_docente:true,nivel:body.nivel,leccion:body.leccion,
   version:'TEST_QA',banco:fake};},
 String,Number,Object,Array});
for(const name of ['loadPrivateBankF111','questionBankForLevelF111','originalBankF111'])
 vm.runInContext(extract(name),ctx);
assert.equal(Object.keys(ctx.questionBankForLevelF111()).length,0,'Sin banco no mostrar preguntas');
const loaded=await ctx.loadPrivateBankF111({nivel:'B1',leccion:9,cod_grupo:'G-QA'});
assert.equal(calls,1);
state.bank=loaded;state.bankReady=true;
assert.equal(Object.keys(ctx.questionBankForLevelF111()).length,4,'B1 recibe sus 4 unidades privadas');
state.panel.nivel='B2';
assert.equal(Object.keys(ctx.questionBankForLevelF111()).length,4,'B2 usa mismo banco autenticado');
state.panel.nivel='I1';
assert.equal(Object.keys(ctx.originalBankF111()).length,4,'I1 conserva registro textual histórico');
state.panel.nivel='I2';
assert.equal(Object.keys(ctx.originalBankF111()).length,4,'I2 conserva registro textual histórico');
state.bankReady=false;
assert.equal(ctx.originalBankF111(),null,'Banco se invalida al perder autenticación');
console.log('F111_D3_R11_PRIVATE_BANK_E1_PASS: parse, 4 levels, no public asset, QA only, writes=0');
