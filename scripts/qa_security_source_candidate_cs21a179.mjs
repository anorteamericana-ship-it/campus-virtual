import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const inscripcion = read('src/inscripcion.jsx');
const oidc = read('src/auth_provider_sec001_v2.jsx');
const loginHtml = read('login.html');
const loginJs = read('src/login.jsx');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

// CS21A164: visible password policy alignment, still explicitly frontend-only.
check((inscripcion.match(/form\.clave\)\.length < 6/g) || []).length >= 2, 'inscripción aplica mínimo 6 en paso y submit final');
check(inscripcion.includes('minLength={6}'), 'input password declara minLength 6');
check(inscripcion.includes('maxLength={128}'), 'input password limita longitud visible a 128');
check(!inscripcion.includes('clave mínima de 4 caracteres'), 'no queda copy legacy de 4 caracteres');

// CS21A165: provider-neutral adapter must remain inert and unloaded.
check(oidc.includes('enabled: false'), 'OIDC queda disabled por defecto');
check(oidc.includes("if (!['dev', 'qa'].includes(cfg.environment))"), 'OIDC se limita a dev/qa');
check(oidc.includes('global.SEC001_AUTH_PROVIDER_V2 = api'), 'adapter exporta superficie controlada');
check(!/\bfetch\s*\(/.test(oidc), 'adapter no hace fetch en carga');
check(!/\b(?:localStorage|sessionStorage)\b/.test(oidc), 'adapter no escribe storage');
check(!/\bsetSesion\s*\(/.test(oidc), 'adapter no muta sesión Campus');
check(!/client[_-]?secret/i.test(oidc), 'adapter no contiene client secret');
check(!loginHtml.includes('auth_provider_sec001_v2.jsx'), 'login entrypoint no carga OIDC');
check(!loginJs.includes('iniciarSesionOidc'), 'login vigente no enruta OIDC');
check(loginJs.includes("fn: 'iniciarSesion'" ) || loginJs.includes('fn:\'iniciarSesion\''), 'login vigente conserva iniciarSesion tradicional');

// Candidate below must preserve the already-green integrated Sales/Matrículas branch.
check(fs.existsSync('scripts/qa_matriculas_ventas_security_cs21a177.mjs'), 'guard integrado CS21A177 sigue presente');
check(fs.existsSync('security/sec002_identity_legacy_contract_cs21a174.json'), 'contrato SEC002 identidad sigue presente');

if (failures.length) {
  console.error('QA SECURITY SOURCE CANDIDATE CS21A179 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA SECURITY SOURCE CANDIDATE CS21A179 PASS');
