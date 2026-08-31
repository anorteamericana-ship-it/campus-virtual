import fs from 'node:fs';

const app=fs.readFileSync('src/app.jsx','utf8');
const sidebar=fs.readFileSync('src/sidebar.jsx','utf8');
const diag=fs.readFileSync('src/diagnostico_interno.jsx','utf8');

function must(ok,label){
  if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}
  console.log(`OK|${label}`);
}
function count(src,needle){return src.split(needle).length-1;}

must(app.includes("diagnostico_interno: rolReal === 'superadmin'"),'router gates Diagnóstico interno to real superadmin');
must(app.includes(': <NoAutorizadoCampus rol={rolReal} />') || app.includes('<NoAutorizadoCampus rol={rolReal} />'),'router has explicit unauthorized fallback');
must(!app.includes('diagnostico_interno: <LazyRoute title="Diagnóstico interno"'),'ungated router mapping removed');
must(sidebar.includes("...(esSuperadmin ? [{ id: 'diagnostico_interno', label: 'Diagnóstico interno', icon: 'settings' }] : [])"),'sidebar exposes Diagnóstico interno only to superadmin');
must(!sidebar.includes("        { id: 'diagnostico_interno', label: 'Diagnóstico interno', icon: 'settings' },"),'ungated sidebar item removed');

must(diag.includes('function diagnosticoSafeUserError('),'safe-user helper exists');
must(diag.includes("console.error('[Diagnóstico interno]'"),'technical error remains console-only');
must(diag.includes("setError(diagnosticoSafeUserError(e,'No se pudo completar el diagnóstico.'"),'general/audit catch crosses safe boundary');
must(diag.includes("setMoraError(diagnosticoSafeUserError(e,'No se pudo consultar la revisión de morosidad.'"),'mora audit catch crosses safe boundary');
must(diag.includes("setMoraError(diagnosticoSafeUserError(e,'No se pudo aplicar la corrección de morosidad.'"),'mora write catch crosses safe boundary');
must(!diag.includes('setError(e.message||String(e))'),'raw general catch sink removed');
must(!diag.includes('setMoraError(e.message||String(e))'),'raw mora catch sinks removed');
must(count(diag,'setMoraError(diagnosticoSafeUserError(')===2,'both mora catches use safe boundary');

for(const fn of ['diagnosticoSistemaInterno','auditarArchivosCONAPE','auditarMorosidadConapeManual','aplicarCorreccionMorosidadConapeManual']){
  must(diag.includes(`'${fn}'`),`endpoint contract preserved: ${fn}`);
}
must(diag.includes("method:'POST'"),'POST transport preserved');
must(diag.includes('body=JSON.stringify({fn,token,...payload});'),'token body contract preserved');
must(diag.includes('window.confirm(`Se va a ${label}'),'explicit write confirmation preserved');
must(diag.includes("accion==='DELETE'?'eliminar la fila':accion==='SET_SI'?'establecer MORA SI':'establecer MORA NO'"),'mora action semantics preserved');
must(diag.includes('motivo.length<10'),'minimum correction reason preserved');
must(diag.includes("firma_actual:item.firma_actual||''"),'optimistic/current-signature contract preserved');
must(diag.includes('cantidad_actual:(item.filas_morosidad||[]).length'),'current row-count contract preserved');

if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A210O PASS: Diagnóstico interno frontend gate + safe error boundary; backend authorization remains outside source proof');
