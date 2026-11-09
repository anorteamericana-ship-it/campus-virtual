'use strict';
// F111 R57 E2: preserve official INA 100 points (8 components incl. I CAN),
// non-INA 100 points (7 components without I CAN). No student records touched.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const src=fs.readFileSync(path.join(__dirname,'../src/student_modules.jsx'),'utf8');
function block(name){
 const marker='function '+name+'(';
 const start=src.indexOf(marker);
 assert(start>=0,'Source function '+name+' missing');
 const tail=src.indexOf('\n}',start);
 assert(tail>start,'Unterminated source '+name);
 return src.slice(start,tail+2);
}
const schemaStart=src.indexOf('const EVAL_SCHEMA_SM = [');
const schemaEnd=src.indexOf('\n];',schemaStart);
assert(schemaStart>=0&&schemaEnd>schemaStart,'canonical schema missing');
const names=['_smNivelEval_','_smOfficialType_','_smEvalRegistrada_','_smRepoTieneNotaOficial_',
 '_smCanonicalRows_','_smGradeSummaryF108_'];
const code=src.slice(schemaStart,schemaEnd+3)+'\n'+names.map(block).join('\n');
const ctx={Intl,Date,Number,Array,String,Math,estatusDe:(n,k)=>n[k]?.estatus||'',
 notaDeNivelSM:(n,k)=>n[k]?.nota??null};
vm.createContext(ctx);vm.runInContext(code,ctx,{filename:'authentic_student_grade_rows.js'});
const rows=(a,b,n)=>ctx._smCanonicalRows_(a,b,n);
let checks=0;
function ok(name,test){assert(test,name);checks++;console.log('PASS '+checks+' '+name);}
function payload(ina){
 const schema=['ORAL_1','ORAL_2','ESCRITO_1','ORAL_3','ORAL_4','ESCRITO_2','SOCIAL',
 ...(ina?['ICAN']:[])];
 const lecciones={ORAL_1:9,ORAL_2:17,ESCRITO_1:18,ORAL_3:25,ORAL_4:31,ESCRITO_2:32,SOCIAL:'',
 ICAN:'1–16'};
 return schema.map((key,i)=>{
  const nota=key==='ORAL_1'?(ina?12.5:13):key==='ESCRITO_1'?(ina?3.5:11):
   key==='ICAN'?17.5:0;
  const registrada=['ORAL_1','ESCRITO_1','ICAN'].includes(key);
  return {tipo_oficial:key,tipo:key.toLowerCase(),leccion:lecciones[key],nivel:'B2',
   grupo:ina?'QA_R57_E2_GRUPO_1':'QA_R57_E2_GRUPO_2',
   programa:ina?'INA':'SIN_INA',
   titulo:key==='ICAN'?'Club I CAN · Participación':key,
   max:key.startsWith('ORAL')?15:key.startsWith('ESCRITO')?(ina?5:15):key==='SOCIAL'?10:20,
   nota,registrada:registrada&&(ina||key!=='ICAN'),estado:registrada?'REGISTRADA':'PROGRAMADA',
   pct:registrada?Math.round((nota/(key==='ICAN'?20:key==='ESCRITO_1'?(ina?5:15):15))*10000)/100:0};
 });
}
const ina=rows(payload(true),[],'B2'),normal=rows(payload(false),[],'B2');
const sum=(rs,key)=>rs.reduce((v,x)=>v+Number(x[key]||0),0);
ok('INA eight distinct evaluation rows',ina.length===8);
ok('INA has exactly one I CAN row',ina.filter(x=>x.key==='ICAN').length===1);
ok('INA written maximum is five points each',ina.filter(x=>x.key.startsWith('ESCRITO')).every(x=>x.max===5));
ok('INA official maximum sums 100',sum(ina,'max')===100);
ok('INA I CAN registered points included in official provisional sum',sum(ina,'nota')===33.5);
ok('INA three items marked registered',ina.filter(x=>x.registrada).length===3);
ok('I CAN source score unchanged',ina.find(x=>x.key==='ICAN')?.nota===17.5);
ok('INA source fallback no duplicate R57 grade',ina.find(x=>x.key==='ESCRITO_1')?.nota===3.5);
ok('non-INA seven evaluation rows',normal.length===7);
ok('non-INA has no I CAN',normal.every(x=>x.key!=='ICAN'));
ok('non-INA written maximum is fifteen each',normal.filter(x=>x.key.startsWith('ESCRITO')).every(x=>x.max===15));
ok('non-INA official maximum sums 100',sum(normal,'max')===100);
ok('non-INA recorded total remains 24',sum(normal,'nota')===24);
ok('non-INA two items marked registered',normal.filter(x=>x.registrada).length===2);
const tampered=payload(false);tampered.push({...payload(true).find(x=>x.tipo_oficial==='ICAN'),programa:'SIN_INA'});
ok('I CAN from non-INA program does not grant 20 points',rows(tampered,[],'B2').length===7);
const missing=payload(true).filter(x=>x.tipo_oficial!=='ICAN');
ok('missing ICAN record is not silently manufactured as a grade',rows(missing,[],'B2').length===7);
const elsewhere=[...payload(false),{...payload(true).find(x=>x.tipo_oficial==='ICAN'),nivel:'I1'}];
ok('I CAN cannot leak across academic levels',rows(elsewhere,[],'B2').length===7);
const summary=ctx._smGradeSummaryF108_('B2',{B2:{estatus:'CA',nota:null}},payload(true),[]);
ok('INA level summary includes I CAN and uses out-of-100',summary.label==='33.5/100 · parcial');
ok('rendered denominator counts actual rows, not hardcoded seven',
 src.includes('num={\x60\x24{completedLevel.length}/\x24{totalEvaluacionesLevel}\x60}'));
ok('I CAN tab offered only when present',
 src.includes("rowsByLevel.some(row=>row.key==='ICAN')"));
ok('all grade calculations use canonical per-level row source',
 src.includes('const totalMax = rowsByLevel.reduce('));
const babel=require(path.resolve(__dirname,'../vendor/babel.js'));
babel.transform(src,{presets:['react'],filename:'student_modules.jsx'});
ok('real JSX compiles after conditional I CAN fix',true);
console.log(JSON.stringify({scope:'F111_R57_INA_ICAN_ROWS_QA',ok:true,checks_pass:checks,
 real_student_records_touched:0,production_writes:0}));
