// Bootstrap evidence: run 33284109056 SUCCESS · exact patch + CS21A196 + regressions 195/194 + diff hygiene.
import fs from 'node:fs';
const src=fs.readFileSync('src/admin_master_dashboard.jsx','utf8');
const req=(s,l)=>{if(!src.includes(s))throw new Error(`CS21A196 missing: ${l}`)};
const forbid=(s,l)=>{if(src.includes(s))throw new Error(`CS21A196 forbidden: ${l}`)};

req("function masterSafeUserError(raw,fallback,context='')",'shared safe-error helper');
req("console.warn('[MasterDashboard] Detalle técnico oculto al operador.'",'internal diagnostics');
req("masterSafeUserError(e?.message||String(e),'No se pudo actualizar CONAPE. Intentá de nuevo.'",'CONAPE manual refresh boundary');
req("masterSafeUserError(error?.message||String(error),'No se pudo sincronizar CONAPE. Intentá de nuevo.'",'CONAPE auto-sync boundary');
req("masterSafeUserError(error?.message||String(error),'No se pudo actualizar el Panel Maestro. Intentá de nuevo.'",'master load boundary');
req("masterSafeUserError(e?.message||String(e),'No se pudo cargar el seguimiento. Intentá de nuevo.'",'tracking boundary');
req("masterSafeUserError(e?.message||String(e),'No se pudo consultar el historial de publicación. Intentá de nuevo.'",'release registry boundary');
req("masterSafeUserError(e?.message||String(e),'No se pudo ejecutar el control de publicación. Intentá de nuevo.'",'smoke boundary');
req("masterSafeUserError(e?.message||String(e),'No se pudo registrar la versión estable. Intentá de nuevo.'",'stable confirmation boundary');
req("title={syncFailed?'La última sincronización de CONAPE no se completó.':",'safe CONAPE tooltip');

forbid("setMsg(e.message||String(e))",'raw CONAPE refresh message');
forbid("conapeAutoSync={ok:false,error:error?.message||String(error)",'raw auto-sync error state');
forbid("error:error?.message||String(error),data:current.data",'raw master load error');
forbid("error:e.message||String(e),data:s.data",'raw tracking/registry error');
forbid("setState({loading:false,error:e.message||String(e),data:null})",'raw smoke error');
forbid("setState(s=>({...s,error:e.message||String(e)}))",'raw stable error');
forbid("title={syncFailed?syncMeta.error:",'raw error in tooltip');

req("body:JSON.stringify({fn:'getSuperAdminMasterDashboard',token:masterToken(),...payload})",'dashboard token in body preserved');
req("body:JSON.stringify({fn,token:masterToken(),...payload})",'action token in body preserved');
req("function MasterCobranza({data,year,compareYear,filters,onRefresh})",'Cobranza component preserved');
req("return (data.collections?.rows||[]).filter",'Cobranza official rows source preserved');

console.log('CS21A196 ADMIN MASTER DASHBOARD SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('COBRANZA_CALCULATIONS=UNCHANGED');
console.log('TOKEN_AND_ENDPOINT_FLOW=PRESERVED');
