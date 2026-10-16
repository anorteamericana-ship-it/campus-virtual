import fs from 'node:fs';

const read = p => fs.readFileSync(p, 'utf8');
const inscripcion = read('src/inscripcion.jsx');
const oidc = read('src/auth_provider_sec001_v2.jsx');
const loginHtml = read('login.html');
const loginJs = read('src/login.jsx');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

// CS21A164 superseded by F111 @463: no password is ever created in public enrollment.
const recovery=read('src/recovery.jsx');
check(!inscripcion.includes('Crea tu contraseña para ingresar al Campus virtual'), 'inscripción no solicita contraseña');
check(!inscripcion.includes("missing.push('clave mínima de 6 caracteres')"), 'inscripción no valida claves de login');
check(inscripcion.includes('delete payload.clave;'), 'payload público descarta cualquier clave de versiones anteriores');
check(recovery.includes('if (clave.length < 8)'), 'clave propia exige 8 caracteres al activar mediante PWREC2');
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
