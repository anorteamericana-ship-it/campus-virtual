import fs from 'node:fs';

const admin=fs.readFileSync('src/free_user_admin.jsx','utf8');
const ventas=fs.readFileSync('src/ventas_prematriculas.jsx','utf8');

function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}
function count(src,needle){return src.split(needle).length-1;}

must(admin.includes('function freeAdminSafeUserError('),'admin safe-user helper exists');
must(admin.includes("console.error('[Prematrículas admin]'"),'admin technical detail stays console-only');
must(admin.includes("setError(freeAdminSafeUserError(e,'No se pudieron cargar las prematrículas.'"),'admin list catch crosses safe boundary');
must(admin.includes("setError(freeAdminSafeUserError(e,'No se pudo actualizar la prematrícula.'"),'admin update catch crosses safe boundary');
must(!admin.includes('setError(e.message)'),'admin raw exception sinks removed');
must(count(admin,'setError(freeAdminSafeUserError(')===2,'admin has exactly two safe catch sinks');

must(ventas.includes('function ventasPrematSafeUserError('),'ventas safe-user helper exists');
must(ventas.includes("console.error('[Prematrículas ventas]'"),'ventas technical detail stays console-only');
must(ventas.includes("setError(ventasPrematSafeUserError(e,'No se pudieron cargar las prematrículas.'"),'ventas list catch crosses safe boundary');
must(ventas.includes("setError(ventasPrematSafeUserError(e,'No se pudo actualizar la prematrícula.'"),'ventas update catch crosses safe boundary');
must(!ventas.includes('setError(e.message)'),'ventas raw exception sinks removed');
must(count(ventas,'setError(ventasPrematSafeUserError(')===2,'ventas has exactly two safe catch sinks');

for(const [name,src] of [['admin',admin],['ventas',ventas]]){
  must(src.includes("'freeUserListarSolicitudes'"),`${name} list endpoint preserved`);
  must(src.includes("'freeUserResolverSolicitud'"),`${name} resolver endpoint preserved`);
  must(src.includes("method:'POST'"),`${name} POST transport preserved`);
  must(src.includes('token:'),`${name} token contract preserved`);
  must(src.includes("estado:next" ) || src.includes('estado:nextEstado'),`${name} target status payload preserved`);
  must(src.includes("respuesta:nota||''"),`${name} response payload preserved`);
  must(src.includes("nota:nota||''"),`${name} note payload preserved`);
  must(src.includes('responsable:'),`${name} responsible payload preserved`);
}

for(const state of ['PENDIENTE','EN_GESTION','RESPONDIDA','CONVERTIDA','CERRADA','DESCARTADA']){
  must(admin.includes(state)&&ventas.includes(state),`shared state preserved: ${state}`);
}

must(admin.includes("window.open(`https://wa.me/${cr}?text=${msg}`"),'admin WhatsApp behavior preserved');
must(ventas.includes("window.open(`https://wa.me/${cr}?text=${msg}`"),'ventas WhatsApp behavior preserved');

if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A210P PASS: shared Prematrículas safe-error boundary; access-policy contradiction intentionally unchanged');
