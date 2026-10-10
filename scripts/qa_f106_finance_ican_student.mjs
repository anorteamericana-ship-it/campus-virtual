import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../src/',import.meta.url);
const text=f=>fs.readFileSync(new URL(f,root),'utf8');
const dash=text('student_dashboard.jsx'),pay=text('student_modules.jsx'),sum=text('student_academic_summary_dom_cs21a113.js'),app=text('app.jsx'),menu=text('student_menu_academic_cs21a120.jsx'),calendar=text('cronograma_grupo.jsx');
assert(dash.includes('saldoVerificado')&&pay.includes('saldoVerificado'),'Missing financial values are not zero');
assert(dash.includes('Saldo por verificar')&&pay.includes('Saldo por verificar'),'Missing amounts have honest status');
assert(dash.includes('vencimientos por verificar')&&pay.includes('vencimientos por verificar'),'Future contractual quotas not shown as automatically overdue');
assert(pay.includes('Certificado futuro · aún no exigible'),'Certificate while in course explicitly future');
assert(dash.includes('Saldo contractual por cubrir; no equivale necesariamente a morosidad.'),'Tile distinguishes debt');
assert(pay.includes('No implican por sí solos cuotas vencidas ni morosidad'),'Detail distinguishes contractual vs overdue');
assert(dash.includes('certificado_exigible')&&pay.includes('certificado_exigible'),'Exigibility from backend');
assert(app.includes('student_dashboard.jsx?v=F106FINANCEICAN20261009'),'Dashboard asset versioned');
assert(app.includes('student_modules.jsx?v=F106FINANCEICAN20261009'),'Payments asset versioned');
assert(menu.includes('student_academic_summary_dom_cs21a113.js?v=F106FINANCEICAN20261009'),'Summary asset versioned');
assert(calendar.includes("nivel:nivelRealIcan, riel:'ican'"),'Student ICAN reads actual level through read-only backend API');
assert(calendar.includes("if (programaIcan === 'SIN_INA')"),'SIN_INA program explicitly excluded');
assert(calendar.includes("if (esStudent)"),'Change scoped to student; teacher/admin untouched');
assert(calendar.includes('seq !== loadSeqRef.current'),'Async group-switching responses ignored');
assert(app.includes('cronograma_grupo.jsx?v=F106FINANCEICAN20261009'),'Student calendar cache-bust');

const a=sum.indexOf('  function normalize('),b=sum.indexOf('  function matrix(',a);
assert(a>=0&&b>a);
const stub={
  arr:()=>[],defaultLevel:()=> 'B1',level:()=> 'B1',levelGroup:()=> 'B1-LM18-C3-0726',
  group:()=>'',latest:()=>[],up:v=>String(v||'').toUpperCase(),type:()=>'',lesson:()=>0,
  DEFS:[['SOCIAL','Social Skill',1,'oral']],registered:()=>false,num:(_,def)=>def,final:()=>null,
  PC:[],status:()=> 'CA',name:x=>x,COLORS:{B1:'#F6B000'},BOOKS:{B1:'Interchange Intro'}
};
const context={C:stub,val:(o,...keys)=>{for(const k of keys)if(o?.[k]!=null&&o[k]!=='')return o[k];return '';}};vm.runInNewContext(sum.slice(a,b)+'\nthis.normalize=normalize;',context);
function check(gp,session,expected){
 const portal={programa:'SIN_INA',grupo:gp||{},estudiante:{NOMBRE:'Alumno QA'},
    niveles:{B1:{estatus:'CA',grupo:'B1-LM18-C3-0726'}},asistencia:[],evaluaciones:[],retroalimentacion:[]};
 const out=context.normalize(portal,{},'B1',session||{});
 assert.equal(out.isINA,expected);
}
check({}, {programa:'INA'},true); // fallback explícito SIN_INA no puede anular sesión INA
check({PROGRAMA:'INA'}, {programa:'SIN_INA'},true); // fuente autorizada de grupo prevalece
check({PROGRAMA:'SIN_INA'}, {programa:'INA'},false); // grupo explícito SIN_INA prevalece
check({}, {programa:'SIN_INA'},false); // sin datos INA no inventar
new vm.Script(sum,{filename:'academic-summary-f106.js'});
console.log('QA_F106_FINANCE_ICA_N_ELIGIBILITY_PASS');
