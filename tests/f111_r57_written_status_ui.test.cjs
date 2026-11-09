// R57: validation only for new written-status views; no browser or prod data.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'src','solicitudes_unificadas.jsx'),'utf8');
const babel=require(path.join(root,'vendor','babel.js'));
const out=babel.transform(source,{presets:['react'],filename:'solicitudes_unificadas.jsx'}).code;
new vm.Script(out);
let n=0;const check=(a,label)=>{assert.ok(a,label);n++};
check(source.includes("f92Post('reposEstadoEscritoR57')")&&
  source.includes("writtenResult.status==='fulfilled'?writtenResult.value:null")&&
  source.includes("Promise.allSettled"),'safe student written status fallback with independent settling');
check(source.includes("setPartial(!optionsOk)")&&source.includes("setEnabled(optionsOk||cyclesList.length>0)"),'student historical cycles remain visible on eligibility failure');
check(source.includes("if(cyclesResult.status!=='fulfilled')")&&source.includes("setOptions([])"),'no new request when cycle authorization cannot be verified');
check(source.includes('data-r57-partial-readonly="true"'),'partial data warning when eligibility fails');
check(source.includes("f92Post('reposEstadoEscritoR57',{cod_grupo:group,nivel:level}).catch(()=>null)"),'teacher scope and fallback');
check(source.includes("data-r57-written-status=\"true\""),'student written status visible');
check(source.includes("data-r57-teacher-written-status=\"true\""),'teacher written status visible');
check(source.includes("escrito.nota_oficial===true"),'student note only if official');
check(source.includes("status?.nota_oficial===true"),'teacher note only if official');
check(source.includes("REVISADO_PENDIENTE_NOTA"),'review not equal official grade');
check(source.includes("REQUIERE_CONCILIACION"),'manual reconciliation state');
check(source.includes("Nota oficial: {escrito.nota_componente}/{escrito.max_puntos}"),'weighted score display');
check(!source.includes("escrito.nota_oficial||"),'zero score not lost on falsy check');
check(source.includes("setEscritos(w&&w.solo_lectura&&Array.isArray(w.rows)?w.rows:null)"),'server read-only condition');
check(source.includes("setEscritosDocente(w&&w.solo_lectura&&Array.isArray(w.rows)?w.rows:null)"),'teacher server read-only condition');
const grades=fs.readFileSync(path.join(root,'src','student_modules.jsx'),'utf8');
new vm.Script(babel.transform(grades,{presets:['react'],filename:'student_modules.jsx'}).code);
check(grades.includes("postStudentModules('reposEstadoEscritoR57', { codigo })"),'Mis Notas uses student session API');
check(grades.includes('data-r57-mis-notas-escritos="true"'),'Mis Notas shows written status');
check(grades.includes('r.nota_oficial===true'),'Mis Notas does not treat reviewed as official');
check(grades.includes("El acumulado del nivel utiliza únicamente las evaluaciones oficiales de ESTATUS"),'Mis Notas preserves official total');
check(grades.includes('data-r57-mis-notas-parcial="true"')&&
  grades.includes("Array.isArray(escritosR57)&&escritosR57.length>0"),
  'R57 status remains visible if the general official grade reader fails');
check(grades.includes("no permiten inferir ni calcular la calificación oficial del nivel"),
  'partial R57 status must not claim an official level grade');
check(grades.includes("CALIFICADO:studentGradesR57PartialT('Nota verificada en expediente R57','Grade verified in R57 record')"),
  'R57 partial status never copies component points into official total');
check(grades.includes("studentGradesR57PartialT('Seguimiento de escritos R57 · Solo lectura','R57 written exam status · Read-only')"),
  'R57 partial status has both Spanish and English label');
check(grades.includes("Not attempted")&&grades.includes("Sin intento"),
  'R57 partial status is translated without inventing grades');
const tr=grades.match(/const studentGradesR57PartialT = .+;/)?.[0];
assert(tr,'R57 partial language helper exists');
const ctx=vm.createContext({window:{AN_I18N:{getLang:()=> 'en'}}});
vm.runInContext(tr,ctx);
check(vm.runInContext("studentGradesR57PartialT('Español','English')",ctx)==='English',
  'R57 partial actual English selection');
ctx.window.AN_I18N.getLang=()=> 'es';
check(vm.runInContext("studentGradesR57PartialT('Español','English')",ctx)==='Español',
  'R57 partial actual Spanish selection');
console.log('F111_R57_WRITTEN_UI_PASS checks='+n+' JSX_PARSE_PASS');
