import {
  IDENTITY_SOURCE,
  validatePreviewRequest,
  validateSubmitRequest,
  issueSourceVersion,
  sourceVersionExpired,
  classifyCreateOutcome,
  safeAuditEvent,
} from './conape_portal/recruit_bridge_contract_c3_5.mjs';

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

if (failures.length) {
  console.error('\nC3.5 FAILURES:');
  failures.forEach(f => console.error(`- ${f}`));
  process.exit(1);
}

console.log('\nC3.5 CONAPE Private Bridge Contract QA: PASS');
