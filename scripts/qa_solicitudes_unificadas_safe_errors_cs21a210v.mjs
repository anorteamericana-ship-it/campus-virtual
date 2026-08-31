import fs from 'node:fs';

const src=fs.readFileSync('src/solicitudes_unificadas.jsx','utf8');
function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}
function count(s,n){return s.split(n).length-1;}

must(src.includes('function f92SafeUserError('),'shared safe-user helper exists');
must(src.includes("console.error('[Solicitudes]'"),'technical detail remains console-only');
must(count(src,'f92SafeUserError(')===8,'exactly seven safe call sites plus helper');
must(!src.includes('setError(e.message)'),'all seven raw e.message UI sinks removed');

for(const [needle,label] of [
  ["f92SafeUserError(e,'Intentá nuevamente en unos segundos.','reposMiEstadoF92:card')",'compact student status load safe'],
  ["f92SafeUserError(e,'No se pudieron cargar las reposiciones.','reposMiEstadoF92:view')",'student repos load safe'],
  ["f92SafeUserError(e,'No se pudo enviar la solicitud. Intentá nuevamente.','reposEnviarSolicitudF92')",'student repos send safe'],
  ["f92SafeUserError(e,'No se pudieron cargar las solicitudes de reposición.','reposListarSolicitudesF92')",'admin repos load safe'],
  ["f92SafeUserError(e,'No se pudo actualizar la solicitud de reposición.','reposResolverSolicitudF92')",'admin repos resolve safe'],
  ["f92SafeUserError(e,'No se pudieron cargar las solicitudes de contacto.','freeUserListarSolicitudes')",'free-user list safe'],
  ["f92SafeUserError(e,'No se pudo actualizar la solicitud de contacto.','freeUserResolverSolicitud')",'free-user resolve safe']
]) must(src.includes(needle),label);

for(const fn of ['reposMiEstadoF92','reposEnviarSolicitudF92','reposListarSolicitudesF92','reposResolverSolicitudF92','freeUserListarSolicitudes','freeUserResolverSolicitud']){
  must(src.includes(`'${fn}'`),`endpoint preserved: ${fn}`);
}

must(src.includes("body:JSON.stringify({fn,token:f92Token(),...payload})"),'POST body + token contract preserved');
must(src.includes("reposicion_id:selected.REPOSICION_ID,tipo_solicitud:pago?'PAGO':'JUSTIFICACION',motivo,referencia_pago:ref,archivo_base64:b64,archivo_mime:file.type,archivo_nombre:file.name"),'student evidence payload preserved');
must(src.includes("reposicion_id:r.REPOSICION_ID,accion,admin_nota:note,pago_referencia:note"),'admin repos resolution payload preserved');
must(src.includes("{estado,limit:200}"),'free-user list filter/limit preserved');
must(src.includes("{id:r.ID,estado:estadoFinal,respuesta:nota||'',responsable:''}"),'free-user resolution payload preserved');
must(src.includes("window.dispatchEvent(new CustomEvent('an:free-user-solicitudes-changed'))"),'free-user change event preserved');
must(src.includes("const esSuperadmin=String(sesion?.rol||'').toLowerCase()==='superadmin'"),'existing superadmin decision flag preserved');
must(src.includes('PanelSuspensiones'),'suspensions integration preserved');
must(src.includes('SolicitudesPagoView'),'payment-request integration preserved');

if(!process.exitCode) console.log('CS21A210V PASS');
