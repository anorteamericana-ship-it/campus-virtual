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
} from './conape_portal/recruit_local_bridge_c3_5.mjs';

const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS C3.5: ${msg}`) : failures.push(msg);

check(validatePreviewRequest({ cedula:'1-2345-6789' }).cedula === '123456789', 'preview normaliza cédula a dígitos');
check(validatePreviewRequest({ cedula:'12' }).ok === false, 'preview rechaza cédula inválida');

const good = validateSubmitRequest({
  cedula:'1-2345-6789',
  source_version:'opaque-preview-token',
  prospecto:{
    cedula:'123456789',
    telefono:'+506 8888-1234',
    correo:'TEST@example.com',
    update_telefono:true,
    update_correo:true,
    identity_source:IDENTITY_SOURCE,
  },
});
check(good.ok === true, 'submit acepta solo contactos + identidad por lookup CONAPE');
check(good.prospecto.telefono === '88881234', 'submit deja teléfono en 8 dígitos');
check(good.prospecto.correo === 'test@example.com', 'submit normaliza correo');

const identityInjection = validateSubmitRequest({
  cedula:'123456789',
  source_version:'opaque-preview-token',
  prospecto:{
    cedula:'123456789',
    nombre:'NOMBRE INVENTADO',
    telefono:'88881234',
    update_telefono:true,
    update_correo:false,
    identity_source:IDENTITY_SOURCE,
  },
});
check(identityInjection.error === 'IDENTITY_FIELDS_FORBIDDEN', 'submit bloquea nombre/apellidos enviados por Campus');

const mismatch = validateSubmitRequest({
  cedula:'123456789',
  source_version:'opaque-preview-token',
  prospecto:{ cedula:'987654321', identity_source:IDENTITY_SOURCE },
});
check(mismatch.error === 'CEDULA_MISMATCH', 'submit bloquea cédula distinta entre preflight y payload');

const source = issueSourceVersion({ now:Date.parse('2026-09-09T20:00:00-06:00'), ttlMs:300000 });
check(!!source.source_version && !source.source_version.includes('123456789'), 'source_version es opaco y no deriva de PII');
check(sourceVersionExpired(source.expires_at, Date.parse('2026-09-09T20:04:00-06:00')) === false, 'source_version vigente antes del TTL');
check(sourceVersionExpired(source.expires_at, Date.parse('2026-09-09T20:06:00-06:00')) === true, 'source_version expira después del TTL');

const confirmed = classifyCreateOutcome({
  create_request_observed:true,
  request_contract:[{ request_token:'CREATE' }],
  outcome:{ success_message:true, duplicate_message:false, error_message:false },
  success_signal:true,
  write_performed:true,
  write_count:1,
});
check(confirmed.ok === true && confirmed.confirmed === true && confirmed.code === 'CREATED', 'éxito requiere CREATE + señal portal + una escritura');

const httpOnly = classifyCreateOutcome({
  create_request_observed:true,
  request_contract:[{ request_token:'CREATE', status:200 }],
  outcome:{ success_message:false, duplicate_message:false, error_message:false },
  success_signal:false,
  write_performed:true,
  write_count:1,
});
check(httpOnly.ok === false && httpOnly.confirmed === false && httpOnly.code === 'WRITE_RESULT_UNCERTAIN', 'HTTP 200 sin señal portal no se declara éxito');

const duplicate = classifyCreateOutcome({
  create_request_observed:true,
  request_contract:[{ request_token:'CREATE' }],
  outcome:{ success_message:false, duplicate_message:true, error_message:false },
  write_performed:false,
  write_count:0,
});
check(duplicate.ok === false && duplicate.code === 'DUPLICATE', 'duplicado queda bloqueado explícitamente');

const audit = safeAuditEvent({ action:'submit', result:'CREATED', requestId:'req-test', sourceVersion:'opaque' });
check(audit.pii_emitted === false && audit.cookies_emitted === false && audit.hidden_values_emitted === false, 'auditoría segura no emite PII/cookies/hidden');

const fillExpr = contactFillExpression({ telefono:'88881234', correo:'qa@example.com', update_telefono:true, update_correo:true });
check(fillExpr.includes('P2_PRS_CELULAR') && fillExpr.includes('P2_PRS_EMAIL'), 'bridge local solo prepara los dos campos de contacto');
check(!fillExpr.includes('P2_PRS_NOMBRE') && !fillExpr.includes('P2_PRS_APELLIDO_1') && !fillExpr.includes('P2_PRS_APELLIDO_2'), 'bridge local nunca escribe identidad');

const fakeReqOk = { headers:{ origin:'http://127.0.0.1:8765', 'sec-fetch-site':'same-origin', cookie:'an_c35_bridge=secret' } };
const fakeReqBad = { headers:{ origin:'https://evil.example', 'sec-fetch-site':'cross-site', cookie:'an_c35_bridge=secret' } };
check(localOriginAllowed(fakeReqOk, 8765, 'an_c35_bridge', 'secret') === true, 'API local acepta únicamente origen loopback con cookie de sesión');
check(localOriginAllowed(fakeReqBad, 8765, 'an_c35_bridge', 'secret') === false, 'API local rechaza origen cross-site');

const root = path.resolve('.');
check(!!safeStaticPath(root, '/ventas.html'), 'servidor local permite ventas.html');
check(!!safeStaticPath(root, '/src/ventas_data.jsx'), 'servidor local permite assets frontend requeridos');
check(safeStaticPath(root, '/scripts/conape_portal/recruit_local_bridge_c3_5.mjs') === null, 'servidor local no expone scripts internos');
check(safeStaticPath(root, '/../AGENTS.md') === null, 'servidor local bloquea traversal y archivos fuera del allowlist');

const bridgeSrc = fs.readFileSync('scripts/conape_portal/recruit_local_bridge_c3_5.mjs', 'utf8');
const shimSrc = fs.readFileSync('src/conape_local_bridge_shim_c3_5.js', 'utf8');
const launcherSrc = fs.readFileSync('scripts/conape_portal/run_conape_recruit_button_test_c3_5_windows.ps1', 'utf8');
const ventasHtml = fs.readFileSync('ventas.html', 'utf8');
check(bridgeSrc.includes("server.listen(options.port, '127.0.0.1'"), 'bridge escucha solo en 127.0.0.1');
check(!bridgeSrc.includes("'Access-Control-Allow-Origin':'*'") && !bridgeSrc.includes('0.0.0.0'), 'bridge no expone CORS abierto ni escucha en todas las interfaces');
check(bridgeSrc.includes('source.consumed = true') && bridgeSrc.includes('writeInProgress = true'), 'submit local tiene token one-shot y lock de escritura');
check(bridgeSrc.includes("u.pathname === '/apex/wwv_flow.accept'") && bridgeSrc.includes("requestToken === 'CREATE'"), 'éxito observa el POST CREATE real de APEX');
check(shimSrc.includes("host !== '127.0.0.1' && host !== 'localhost'"), 'shim queda inerte fuera de localhost');
check(shimSrc.includes("body?.fn === 'conapePortalRecruitPreview'") && shimSrc.includes("body?.fn === 'conapePortalRecruitSubmit'"), 'shim intercepta solo preview/submit CONAPE');
check(ventasHtml.includes('src/conape_local_bridge_shim_c3_5.js?v=C3.5'), 'ventas carga shim C3.5');
check(launcherSrc.includes('--remote-debugging-address=127.0.0.1') && launcherSrc.includes('an-conape-c35-'), 'launcher usa CDP loopback y perfil temporal aislado');
check(launcherSrc.includes('run_conape_recruit_button_test_c3_5_windows.ps1') === false, 'launcher no se auto-invoca recursivamente');

if (failures.length) {
  console.error('\nC3.5 FAILURES:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('\nC3.5 CONAPE Private Bridge + Local Button QA: PASS');
