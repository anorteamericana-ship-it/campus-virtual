// F111 @463: contrato visual de activación, SIN tocar backend ni estudiantes reales.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const babel=require('../vendor/babel.js');
const login=fs.readFileSync('src/login.jsx','utf8');
const recovery=fs.readFileSync('src/recovery.jsx','utf8');
const loginHtml=fs.readFileSync('login.html','utf8');
const recoveryHtml=fs.readFileSync('recovery.html','utf8');
for(const name of ['src/login.jsx','src/recovery.jsx']){
  babel.transform(fs.readFileSync(name,'utf8'),{presets:['react'],plugins:['transform-block-scoping']});
}
assert(login.includes('cuenta_no_activada'),'El login debe detectar la cuenta no activada');
assert(login.includes('Activar cuenta'),'Debe ofrecer activación explícita sin pedir código de estudiante');
assert(login.includes('encodeURIComponent(usuarioLimpio')||login.includes('encodeURIComponent(String(usuario'),
  'La activación debe prefijar cédula en URL (sin contraseña)');
assert(login.includes('Cédula') && login.includes('Contraseña'),'Los dos campos de ingreso son cédula/usuario y contraseña');
assert(login.includes("fn: 'iniciarSesion'"),'No cambiar el endpoint de login');
assert(!login.includes('Te enviamos un código'),'No afirmar envío antes de solicitud');
assert(recovery.includes('solicitarRecuperacionAccesoUniversal'),'La activación usa PWREC2 universal');
assert(recovery.includes('restablecerAccesoUniversal'),'El cambio de clave usa PWREC2 universal');
assert(!recovery.includes("fn:'restablecerContrasena'"),'No usar el camino PWREC1 que escribía texto plano');
assert(!recovery.includes("fn:'solicitarRecuperacionContrasena'"),'No usar PWREC1');
assert(recovery.includes("URLSearchParams") && recovery.includes("get('cedula')"),'Prefill de cédula sin usuario ni contraseña');
assert(recovery.includes('Si la cuenta tiene un correo registrado')||recovery.includes('Si existe una cuenta activa'),
  'Respuesta genérica, sin enumeración de cuentas');
assert(
  loginHtml.includes('src/login.jsx?v=F111LOGINUNICO20261015') ||
  (loginHtml.includes('src/login.compiled.js?v=F111AUTOPASS1') &&
   loginHtml.includes('src/data.login.compiled.js?v=F111AUTOPASS1') &&
   !loginHtml.includes('vendor/babel.js')),
  'Bust de caché login: JSX histórico o build compilado verificable'
);
assert(recoveryHtml.includes('src/recovery.jsx?v=F111LOGINUNICO20261015'),'Bust de caché recovery');
const enrollment=fs.readFileSync('src/inscripcion.jsx','utf8');
const enrollmentHtml=fs.readFileSync('inscripcion.html','utf8');
assert(!enrollment.includes('Crea tu contraseña para ingresar al Campus virtual'),
  'La inscripción no puede pedir una contraseña antes de autenticar el correo');
assert(!enrollment.includes("CLAVE: String(body.clave"),
  'No reenviar contraseñas mediante el formulario');
assert(!enrollment.includes("missing.push('clave mínima de 6 caracteres')"),
  'El avance de matrícula no debe exigir contraseña');
assert(!enrollment.includes("La que acabás de elegir"),
  'El comprobante no debe afirmar que el estudiante ya tiene una clave');
assert(enrollment.includes('delete payload.clave'),
  'El request de inscripción debe eliminar cualquier contraseña arrastrada por datos previos');
assert(enrollmentHtml.includes('src/inscripcion.jsx?v=F111LOGINUNICO20261015'),
  'Invalidar cache del formulario sin contraseña');
console.log('F111_LOGIN_UNICO_UI_E1_PASS: cédula + contraseña, activación PWREC2, privacidad, prefill, cache');
