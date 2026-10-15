// SEC001 CS21A164 rebasado a la regla firmada F111 @463: inscripción SIN clave.
// La longitud mínima sigue validándose al ACTIVAR por PWREC2, no en el formulario.
import fs from 'node:fs';
const source=fs.readFileSync('src/inscripcion.jsx','utf8');
const recovery=fs.readFileSync('src/recovery.jsx','utf8');
const problems=[];
const check=(name,condition)=>{
  if(condition)console.log('PASS '+name);
  else{problems.push(name);console.error('FAIL '+name);}
};
check('enrollment does not ask for password',!source.includes('Crea tu contraseña para ingresar al Campus virtual'));
check('enrollment does not require 6-character key',!source.includes("missing.push('clave mínima de 6 caracteres')"));
check('enrollment does not render a password field',!/TextInput type="password"[^>]*value=\{form\.clave\}/.test(source));
check('submit deletes stale password fields',source.includes('delete payload.clave;')&&source.includes('delete payload.claveConf;'));
check('no password selection claim in success ticket',!source.includes('La que acabás de elegir'));
check('universal recovery endpoint',recovery.includes("fn:'restablecerAccesoUniversal'"));
check('activation enforces >=8 characters',recovery.includes('if (clave.length < 8)'));
check('activation requires matching confirmation',recovery.includes('clave !== confirmar'));
check('activation input uses new-password autocomplete',recovery.includes('autoComplete="new-password"'));
if(problems.length){console.error('SEC001 F111 @463 PASSWORD CUT: FAIL ('+problems.length+')');process.exit(1);}
console.log('SEC001 F111 @463 PASSWORD CUT: PASS');
