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
  ['new password eye control', ui.includes("type={verClave ? 'text' : 'password'}") && ui.includes("setVerClave(v => !v)")],
  ['confirm password eye control', ui.includes("type={verConfirmar ? 'text' : 'password'}") && ui.includes("setVerConfirmar(v => !v)")],
  ['independent show/hide states', ui.includes("React.useState(false);") && ui.includes('verConfirmar, setVerConfirmar')],
  ['accessible new password button', ui.includes("'Mostrar nueva contraseña'") && ui.includes("'Ocultar nueva contraseña'")],
  ['accessible confirm password button', ui.includes("'Mostrar confirmación de contraseña'") && ui.includes("'Ocultar confirmación de contraseña'")],
  ['buttons do not submit form', (ui.match(/className="toggle-eye"/g) || []).length === 2 && (ui.match(/<button type="button" className="toggle-eye"/g) || []).length === 2],
  ['eye icon parity with login', ui.includes('const EyeIcon = ({ off }) =>') && ui.includes('<EyeIcon off={verClave} />') && ui.includes('<EyeIcon off={verConfirmar} />')],
  ['eye control reserves input spacing', (ui.match(/paddingRight:54/g) || []).length === 2],
  ['cache bust PWREC2 eye', html.includes('recovery.jsx?v=F98.4Z6PWREC2EYE1')],
];

const failed = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name);
if (failed.length) process.exit(1);
console.log('PWREC2 FRONTEND QA: PASS ' + checks.length + '/' + checks.length);
