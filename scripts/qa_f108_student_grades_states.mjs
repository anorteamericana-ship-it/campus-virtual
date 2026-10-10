import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const Babel=require('../vendor/babel.js');
const src=fs.readFileSync(new URL('../src/student_modules.jsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../campus.html',import.meta.url),'utf8');
assert(src.includes('function _smGradeSummaryF108_('),'Missing grade helper');
const start=src.indexOf('function _smGradeSummaryF108_(');
const end=src.indexOf('function NotasView({ onNavigate })',start);
assert(start>=0 && end>start);
const helper=src.slice(start,end);
const ctx={
  estatusDe:(niveles,n)=>(niveles[n]||{}).estatus||'',
  notaDeNivelSM:(niveles,n)=>(niveles[n]||{}).nota??null,
  _smCanonicalRows_:(evals,repos,n)=>Array.isArray(evals)?evals.filter(e=>e.nivel===n):[],
};
vm.runInNewContext(helper+'this.summary=_smGradeSummaryF108_;this.rowScore=_smRowScoreF108_;this.footer=_smFooterStatusF108_;',ctx);
const grades=ctx.summary, score=ctx.rowScore, footer=ctx.footer;
assert.equal(grades('B1',{B1:{estatus:'CA',nota:0}},[],[]).label,'Sin evaluaciones calificadas');
assert.equal(grades('B2',{B2:{estatus:'PE',nota:0}},[],[]).label,'Sin nota final registrada');
assert.equal(grades('B1',{B1:{estatus:'CA',nota:0}},null,[]).label,'Consultando notas…');
assert.equal(grades('B1',{B1:{estatus:'CA',nota:0}},[{nivel:'B1',registrada:true,nota:0}],[]).label,'0/100 · parcial');
assert.equal(grades('B1',{B1:{estatus:'CA',nota:0}},[{nivel:'B1',registrada:true,nota:12}],[]).label,'12/100 · parcial');
assert.equal(grades('B1',{B1:{estatus:'APR',nota:88}},[{nivel:'B1',registrada:true,nota:12}],[]).label,'88/100 · nota oficial');
assert.equal(grades('I2',{I2:{estatus:'REP',nota:62}},[{nivel:'I2',registrada:true,nota:12}],[]).label,'62/100 · nota oficial');
assert.equal(score({registrada:false,estado:'PROGRAMADA',nota:0,max:15,pct:0}).score,'—');
assert.equal(score({registrada:false,estado:'SIN_NOTA',nota:0,max:15,pct:0}).percent,'—');
assert.equal(score({registrada:false,estado:'VENCIDA_0',nota:0,max:15,pct:0}).score,'0/15');
assert.equal(score({registrada:true,estado:'REGISTRADA',nota:0,max:15,pct:0}).score,'0/15');
assert.equal(footer('CA'),'EN CURSO');
assert.equal(footer('PE'),'—');
assert.equal(footer('APR'),'APR');
assert.equal(footer('REP'),'REP');
assert.equal(footer('CNV'),'CNV');
assert(src.includes("evalErr ?") && src.includes('setEvalRetry(n=>n+1)'),'Retryable failure state missing');
assert(src.includes('setEvaluaciones(null); setEvalErr('),'Error must not masquerade as empty evaluations');
assert(src.includes("timeZone:'America/Costa_Rica'"),'Dates must use CR local calendar');
assert(html.includes('src/app.jsx?v=F108GRADES20261010'),'HTML cache-bust missing');
assert(app.includes('src/student_modules.jsx?v=F108GRADES20261010'),'Module cache-bust missing');
const compiled=Babel.transform(src,{presets:['react'],plugins:['transform-block-scoping']}).code;
new vm.Script(compiled,{filename:'student_modules_F108.compiled.js'});
console.log('QA_F108_GRADE_ZERO_VS_ABSENCE_PASS');
console.log('QA_F108_OFFICIAL_APPROVAL_ONLY_PASS');
console.log('QA_F108_ERROR_RETRY_AND_CR_DATE_PASS');
console.log('QA_F108_JSX_SYNTAX_PASS');
