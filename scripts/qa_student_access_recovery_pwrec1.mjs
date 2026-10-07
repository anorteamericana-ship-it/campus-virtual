import fs from 'node:fs';

const ui = fs.readFileSync('src/recovery.jsx', 'utf8');
const html = fs.readFileSync('recovery.html', 'utf8');

const checks = [
  ['request endpoint', ui.includes("fn:'solicitarRecuperacionContrasena'")],
  ['reset endpoint', ui.includes("fn:'restablecerContrasena'")],
  ['universal identifier copy', ui.includes('Cédula o usuario')],
  ['request sends usuario', ui.includes("usuario:c")],
  ['reset sends usuario', ui.includes("usuario:String(identificador || '').trim()")],
  ['one time code autocomplete', ui.includes('autoComplete="one-time-code"')],
  ['new credential autocomplete', ui.includes('autoComplete="new-password"')],
  ['minimum length UX', ui.includes('al menos 8 caracteres')],
  ['generic account message', ui.includes('Si existe una cuenta activa')],
  ['no local storage', !ui.includes('localStorage')],
  ['no session storage', !ui.includes('sessionStorage')],
  ['no credential reveal', !ui.includes('mostrar contraseña actual')],
  ['cache bust PWREC2', html.includes('recovery.jsx?v=F98.4Z6PWREC2')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name);
if (failed.length) process.exit(1);
console.log('PWREC2 FRONTEND QA: PASS ' + checks.length + '/' + checks.length);
