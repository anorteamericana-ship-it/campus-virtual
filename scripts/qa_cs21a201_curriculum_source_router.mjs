#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files=[
  'apps_script_patches/99T_QUIZ_TIME_CURRICULAR_QA_CS21A198.gs',
  'apps_script_patches/99U_QUIZ_TIME_OPTION_BALANCE_QA_CS21A198.gs',
  'apps_script_unified/english_lab_word_search_module_cs21a200.gs',
  'apps_script_patches/99V_ENGLISH_LAB_CURRICULUM_SOURCE_QA_CS21A201.gs',
];
for(const file of files) assert.equal(fs.existsSync(file),true,`Falta ${file}`);

const unit={
  LEVEL_ID:'B1',UNIT_ID:'B1-U01',UNIT_NUMBER:'1',UNIT_NAME:"What's your name?",
  UNIT_OBJECTIVE_ES:'Presentarse e intercambiar información personal básica.',
  PROGRAM_TOPIC:'Introductions and personal information',SOURCE_REFERENCE:'Interchange Intro U1',
  DIFFICULTY_1_10:'1',STATUS:'ACTIVE'
};

const vocab=[
  ['001','hello','hola'],['002','goodbye','adiós'],['003','name','nombre'],['004','teacher','profesor/a'],['005','student','estudiante'],
  ['006','phone number','número de teléfono'],['007','email','correo electrónico'],['008','zero','cero'],['009','please','por favor'],['010','thanks','gracias'],
];
const bank=[];
vocab.slice(0,5).forEach(([id,word,hint])=>bank.push({
  LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:'VOCAB_01',ITEM_TYPE:'MCQ',STATUS:'ACTIVE',
  PLAY_ITEM_ID:`P-V-${id}`,SOURCE_ITEM_ID:`VOC-B1-U01-${id}`,PROMPT_ES:'Elegí el significado.',PROMPT_EN:'Choose the meaning.',
  STEM:word,OPTION_A:hint,OPTION_B:`distractor ${id} b`,OPTION_C:`distractor ${id} c`,OPTION_D:`distractor ${id} d`,CORRECT_OPTION:'A',
  EXPLANATION_ES:'Vocabulario de la unidad.',DIFFICULTY_1_10:'1'
}));
vocab.slice(5).forEach(([id,word,hint])=>bank.push({
  LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:'VOCAB_02',ITEM_TYPE:'MATCH',STATUS:'ACTIVE',
  PLAY_ITEM_ID:`P-V-${id}`,SOURCE_ITEM_ID:`VOC-B1-U01-${id}`,MATCH_LEFT:word,MATCH_RIGHT:hint
}));

const specs=[
  ['GRAM','GRAM_01','MCQ'],['SPEAK','SPEAK_02','MCQ'],['LISTEN','LISTEN_01','DIALOGUE_MCQ'],['READ','READ_01','READING_MCQ']
];
specs.forEach(([area,template,type])=>{
  for(let i=1;i<=5;i+=1) bank.push({
    LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:area,TEMPLATE_ID:template,ITEM_TYPE:type,STATUS:'ACTIVE',
    PLAY_ITEM_ID:`P-${area}-${i}`,SOURCE_ITEM_ID:`${area}-B1-U01-${i}`,PROMPT_ES:'Elegí la mejor respuesta.',PROMPT_EN:'Choose the best answer.',
    STEM:`${area} question ${i}`,OPTION_A:`correct ${area} ${i}`,OPTION_B:`wrong b ${i}`,OPTION_C:`wrong c ${i}`,OPTION_D:`wrong d ${i}`,
    CORRECT_OPTION:'A',MINI_TEXT_OR_DIALOGUE:area==='LISTEN'||area==='READ'?`Context ${area} ${i}`:'',EXPLANATION_ES:'Explicación curricular.',DIFFICULTY_1_10:'2'
  });
});
assert.equal(bank.length,30,'fixture: 10 vocab + 20 otras áreas');

let operationalCalls=0;
const apolloCalls=[];
const context={
  console,JSON,Date,Math,String,Number,Object,Array,RegExp,isFinite,parseInt,Error,
  doPost:()=>({}),
  _an4406_parseBody_:()=>({}),_an4406_json_:value=>value,
  _cs21a171QaEnvironment_:()=>({ok:true}),
  _elive176Rows_:(sheetName)=>{operationalCalls+=1;throw new Error(`Falta la hoja ${sheetName}.`);},
  _elso183ApolloRows_:(sheetName)=>{
    apolloCalls.push(sheetName);
    if(sheetName==='CONFIG_UNIDADES') return [unit];
    if(sheetName==='ACADEMIA_PLAY_BANK') return bank;
    throw new Error(`Hoja Apollo inesperada: ${sheetName}`);
  },
  _elive176Shuffle_:(rows)=>Array.isArray(rows)?rows.slice():[],
  Utilities:{getUuid:()=> 'QA-UUID'},
};
vm.createContext(context);
for(const file of files) vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});

// Reproduce exactamente el entorno autenticado: la lectura operativa falla,
// pero Quiz/Word Search deben usar el mismo Apollo QA de Sentence Order.
assert.throws(()=>context._elive176Rows_('CONFIG_UNIDADES'),/Falta la hoja CONFIG_UNIDADES/);
operationalCalls=0;

const quiz=context.verificarQuizTimeCS21A198();
assert.equal(quiz.ok,true,'Quiz Time debe pasar con Apollo QA aunque falte CONFIG_UNIDADES operativa');
assert.equal(quiz.version,'CS21A201-CURRICULUM-SOURCE-1');
assert.equal(quiz.curriculum_source,'QA_STAGING_MASTER_ID');
assert.equal(quiz.operational_sheet_dependency_removed,true);

const wordSearch=context.verificarWordSearchCS21A200();
assert.equal(wordSearch.ok,true,'Word Search debe pasar con Apollo QA aunque falte CONFIG_UNIDADES operativa');
assert.equal(wordSearch.version,'CS21A201-CURRICULUM-SOURCE-1');
assert.equal(wordSearch.curriculum_source,'QA_STAGING_MASTER_ID');
assert.equal(wordSearch.operational_sheet_dependency_removed,true);

assert.equal(operationalCalls,0,'Quiz/Word Search no deben volver a _elive176Rows_ para currículo');
assert.ok(apolloCalls.filter(name=>name==='CONFIG_UNIDADES').length>=2,'debe consultar CONFIG_UNIDADES por Apollo QA');
assert.ok(apolloCalls.filter(name=>name==='ACADEMIA_PLAY_BANK').length>=2,'debe consultar ACADEMIA_PLAY_BANK por Apollo QA');
assert.equal(context._elq198ValidatePool_(context._elq198PoolRows_()).ok,true,'pool Quiz canónico');
assert.equal(context._elws200ValidatePool_(context._elws200PoolWords_()).ok,true,'pool Word Search canónico');

const patch=fs.readFileSync(files.at(-1),'utf8');
assert.equal(patch.includes('SpreadsheetApp.openById'),false,'CS201 no debe duplicar acceso directo a spreadsheets');
assert.ok(patch.includes("_elso183ApolloRows_"),'CS201 debe reutilizar el lector validado CS183');
assert.ok(patch.includes("ELCS201_SOURCE = 'QA_STAGING_MASTER_ID'"),'fuente QA explícita');

console.log(JSON.stringify({
  ok:true,
  version:'CS21A201-CURRICULUM-SOURCE-1',
  reproduced_authenticated_failure:'operational CONFIG_UNIDADES missing',
  operational_curriculum_reads_after_patch:operationalCalls,
  apollo_qa_reads:apolloCalls.length,
  quiz_time_pass:true,
  word_search_pass:true,
  quiz_pool:context._elq198PoolRows_().length,
  word_search_pool:context._elws200PoolWords_().length,
  reused_reader:'_elso183ApolloRows_',
  source:'QA_STAGING_MASTER_ID'
},null,2));
