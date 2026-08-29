import fs from 'node:fs';

const path = 'src/inscripcion.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceExact(oldText, newText, expected = 1) {
  const count = s.split(oldText).length - 1;
  if (count !== expected) {
    throw new Error(`preimage mismatch for ${JSON.stringify(oldText.slice(0,80))}: expected ${expected}, found ${count}`);
  }
  s = s.split(oldText).join(newText);
}

replaceExact(
  "if(!clean(form.clave) || clean(form.clave).length < 4) missing.push('clave mínima de 4 caracteres');",
  "if(!clean(form.clave) || clean(form.clave).length < 6) missing.push('clave mínima de 6 caracteres');"
);

replaceExact(
  '<Field label="Crea tu contraseña para ingresar al Campus virtual" required hint="La usarás con tu cédula para revisar tu solicitud."><TextInput type="password" value={form.clave} onChange={v=>setForm({clave:v})} autoComplete="new-password" /></Field>',
  '<Field label="Crea tu contraseña para ingresar al Campus virtual" required hint="Usá al menos 6 caracteres. Podés usar una frase fácil de recordar."><TextInput type="password" value={form.clave} onChange={v=>setForm({clave:v})} minLength={6} maxLength={128} autoComplete="new-password" /></Field>'
);

replaceExact(
  "if(!clean(form.nombre) || !clean(form.cedula) || !clean(form.clave)) return 'Faltan nombre, cédula o clave.';",
  "if(!clean(form.nombre) || !clean(form.cedula) || !clean(form.clave)) return 'Faltan nombre, cédula o clave.';\n    if(clean(form.clave).length < 6) return 'La clave debe tener al menos 6 caracteres.';"
);

if (/clave mínima de 4 caracteres/.test(s)) throw new Error('legacy 4-char copy remains');
if (/clean\(form\.clave\)\.length < 4/.test(s)) throw new Error('legacy 4-char validation remains');
if (!/minLength=\{6\}/.test(s)) throw new Error('minLength=6 missing');
if (!/maxLength=\{128\}/.test(s)) throw new Error('maxLength=128 missing');

fs.writeFileSync(path, s);
console.log('PATCHED SEC001 password min-6 policy in src/inscripcion.jsx');
