import fs from 'node:fs';
import path from 'node:path';
import {
  IDENTITY_SOURCE,
  validatePreviewRequest,
  validateSubmitRequest,
  issueSourceVersion,
  sourceVersionExpired,
  classifyCreateOutcome,
  safeAuditEvent,
} from './conape_portal/recruit_bridge_contract_c3_5.mjs';
import {
  safeStaticPath,
  localOriginAllowed,
  contactFillExpression,
  reportSearchExpression,
  reportStatusExpression,
} from './conape_portal/recruit_local_bridge_c3_5.mjs';

const failures=[];
const check=(ok,msg)=>ok?console.log(`PASS C3.5: ${msg}`):failures.push(msg);

check(validatePreviewRequest({cedula:'1-2345-6789'}).cedula==='123456789','preview normaliza cédula a dígitos');
check(validatePreviewRequest({cedula:'12'}).ok===false,'preview rechaza cédula inválida');
const good=validateSubmitRequest({cedula:'1-2345-6789',source_version:'opaque-preview-token',prospecto:{cedula:'123456789',telefono:'+506 8888-1234',correo:'TEST@example.com',update_telefono:true,update_correo:true,identity_source:IDENTITY_SOURCE}});
check(good.ok===true,'submit acepta solo contactos + identidad por lookup CONAPE');
check(good.prospecto.telefono==='88881234','submit deja teléfono en 8 dígitos');
check(good.prospecto.correo==='test@example.com','submit normaliza correo');
const identityInjection=validateSubmitRequest({cedula:'123456789',source_version:'opaque-preview-token',prospecto:{cedula:'123456789',nombre:'NOMBRE INVENTADO',telefono:'88881234',update_telefono:true,update_correo:false,identity_source:IDENTITY_SOURCE}});
check(identityInjection.error==='IDENTITY_FIELDS_FORBIDDEN','submit bloquea nombre/apellidos enviados por Campus');
const mismatch=validateSubmitRequest({cedula:'123456789',source_version:'opaque-preview-token',prospecto:{cedula:'987654321',identity_source:IDENTITY_SOURCE}});
check(mismatch.error==='CEDULA_MISMATCH','submit bloquea cédula distinta entre preflight y payload');
const source=issueSourceVersion({now:Date.parse('2026-09-09T20:00:00-06:00'),ttlMs:300000});
check(!!source.source_version&&!source.source_version.includes('123456789'),'source_version es opaco y no deriva de PII');
check(sourceVersionExpired(source.expires_at,Date.parse('2026-09-09T20:04:00-06:00'))===false,'source_version vigente antes del TTL');
check(sourceVersionExpired(source.expires_at,Date.parse('2026-09-09T20:06:00-06:00'))===true,'source_version expira después del TTL');
const confirmed=classifyCreateOutcome({create_request_observed:true,request_contract:[{request_token:'CREATE'}],outcome:{success_message:true,duplicate_message:false,error_message:false},success_signal:true,write_performed:true,write_count:1});
check(confirmed.ok===true&&confirmed.code==='CREATED','éxito requiere CREATE + señal portal + una escritura');
const httpOnly=classifyCreateOutcome({create_request_observed:true,request_contract:[{request_token:'CREATE',status:200}],outcome:{success_message:false,duplicate_message:false,error_message:false},success_signal:false,write_performed:true,write_count:1});
check(httpOnly.ok===false&&httpOnly.code==='WRITE_RESULT_UNCERTAIN','HTTP 200 sin señal portal no se declara éxito');
const audit=safeAuditEvent({action:'submit',result:'CREATED',requestId:'req-test',sourceVersion:'opaque'});
check(audit.pii_emitted===false&&audit.cookies_emitted===false&&audit.hidden_values_emitted===false,'auditoría segura no emite PII/cookies/hidden');

const fillExpr=contactFillExpression({telefono:'88881234',correo:'qa@example.com',update_telefono:true,update_correo:true});
check(fillExpr.includes('P2_PRS_CELULAR')&&fillExpr.includes('P2_PRS_EMAIL'),'bridge local solo prepara los dos campos de contacto');
check(!fillExpr.includes('P2_PRS_NOMBRE')&&!fillExpr.includes('P2_PRS_APELLIDO_1')&&!fillExpr.includes('P2_PRS_APELLIDO_2'),'bridge local nunca escribe identidad');
const searchExpr=reportSearchExpression('123456789');
const statusExpr=reportStatusExpression('123456789');
check(searchExpr.includes('search_field')&&searchExpr.includes('GO'),'bridge puede filtrar el reporte por cédula tras CREATE');
check(statusExpr.includes("h==='ESTADO'")&&statusExpr.includes('tbody tr'),'bridge lee la columna Estado del reporte sin hardcodear su valor');

const fakeReqOk={headers:{origin:'http://127.0.0.1:8765','sec-fetch-site':'same-origin',cookie:'an_c35_bridge=secret'}};
const fakeReqBad={headers:{origin:'https://evil.example','sec-fetch-site':'cross-site',cookie:'an_c35_bridge=secret'}};
check(localOriginAllowed(fakeReqOk,8765,'an_c35_bridge','secret')===true,'API local acepta únicamente origen loopback con cookie de sesión');
check(localOriginAllowed(fakeReqBad,8765,'an_c35_bridge','secret')===false,'API local rechaza origen cross-site');
const root=path.resolve('.');
check(!!safeStaticPath(root,'/ventas.html'),'servidor local permite ventas.html');
check(!!safeStaticPath(root,'/src/ventas_data.jsx'),'servidor local permite frontend requerido');
check(safeStaticPath(root,'/scripts/conape_portal/recruit_local_bridge_c3_5.mjs')===null,'servidor local no expone scripts internos');
check(safeStaticPath(root,'/../AGENTS.md')===null,'servidor local bloquea traversal');

const bridgeSrc=fs.readFileSync('scripts/conape_portal/recruit_local_bridge_c3_5.mjs','utf8');
const shimSrc=fs.readFileSync('src/conape_local_bridge_shim_c3_5.js','utf8');
const rowSrc=fs.readFileSync('src/ventas_conape_reclutar_row_c3_5.jsx','utf8');
const tableSrc=fs.readFileSync('src/ventas_sortable_table_cs21a20.jsx','utf8');
const launcherSrc=fs.readFileSync('scripts/conape_portal/run_conape_recruit_button_test_c3_5_windows.ps1','utf8');
const ventasHtml=fs.readFileSync('ventas.html','utf8');
check(bridgeSrc.includes("server.listen(options.port,'127.0.0.1'")||bridgeSrc.includes("server.listen(options.port, '127.0.0.1'"),'bridge escucha solo en 127.0.0.1');
check(!bridgeSrc.includes('0.0.0.0'),'bridge no escucha en todas las interfaces');
check(/source\.consumed\s*=\s*true/.test(bridgeSrc)&&/writeInProgress\s*=\s*true/.test(bridgeSrc),'submit local tiene token one-shot y lock de escritura');
check(bridgeSrc.includes("'/apex/wwv_flow.accept'")&&bridgeSrc.includes("'CREATE'"),'bridge observa el POST CREATE real de APEX');
check(bridgeSrc.includes('current?.identity_ready')&&bridgeSrc.includes('digits(current.cedula)===cedula'),'preview reutiliza identidad ya cargada para la misma cédula');
check(bridgeSrc.includes('estado_conape_raw:estadoConapeRaw'),'submit devuelve Estado observado en CONAPE cuando está disponible');
check(bridgeSrc.includes('NAV_HOLD_MS = 1400')&&bridgeSrc.includes('inspect(target,FIND_RECRUIT,true,NAV_HOLD_MS)'),'bridge mantiene CDP abierto tras Reclutar igual que el discovery E2 que sí navega');
check(bridgeSrc.includes('MAX_NAV_ATTEMPTS = 5')&&bridgeSrc.includes('NAV_RETRY_MS = 3000'),'navegación Reclutar usa reintentos limitados y espaciados');
check(shimSrc.includes("host !== '127.0.0.1' && host !== 'localhost'"),'shim queda inerte fuera de localhost');
check(ventasHtml.includes('src/conape_local_bridge_shim_c3_5.js?v=C3.5'),'ventas carga shim local C3.5');
check(ventasHtml.includes('src/ventas_conape_reclutar_row_c3_5.jsx?v=C3.5A'),'ventas carga acción CONAPE por fila');
check(!ventasHtml.includes('src/ventas_prematriculas.jsx'),'widget flotante Prematrículas queda oculto por completo');
check(rowSrc.includes('.vx-c33-launch{display:none!important}'),'botón CONAPE flotante del drawer queda oculto');
check(rowSrc.includes('ConapeRecruitRowButtonC35'),'acción Reclutar se expone como botón de fila');
check(rowSrc.includes("estadoVentas === 'MATRICULADO'")&&rowSrc.includes('if (estadoConape || codigo'),'acción Reclutar se oculta si ya existe estado CONAPE o matrícula aplicada');
check(tableSrc.includes('<th>CONAPE</th><th>Acción</th>'),'botón CONAPE queda inmediatamente a la izquierda de Acción');
check(tableSrc.includes("p?.estado_conape_raw||p?.estado_conape||p?.etapa"),'columna Etapa prioriza el estado bruto devuelto por CONAPE');
check(tableSrc.includes('conapeEtapas'),'tabla refleja de inmediato el Estado CONAPE devuelto por el submit');
check(launcherSrc.includes('--remote-debugging-address=127.0.0.1')&&launcherSrc.includes('an-conape-c35-'),'launcher usa CDP loopback y perfil temporal aislado');

if(failures.length){console.error('\nC3.5 FAILURES:');failures.forEach(f=>console.error(`- ${f}`));process.exit(1);}
console.log('\nC3.5 CONAPE Private Bridge + Row Button QA: PASS');