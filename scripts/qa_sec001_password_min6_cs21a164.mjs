import fs from 'node:fs';

const path = 'src/inscripcion.jsx';
const s = fs.readFileSync(path, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

check('DatosStep enforces minimum 6', s.includes("clean(form.clave).length < 6) missing.push('clave mínima de 6 caracteres')"));
check('input exposes minLength 6', s.includes('minLength={6}'));
check('input caps password length at 128', s.includes('maxLength={128}'));
check('submit validator independently enforces 6', s.includes("if(clean(form.clave).length < 6) return 'La clave debe tener al menos 6 caracteres.';"));
check('legacy 4-character copy removed', !s.includes('clave mínima de 4 caracteres'));
check('legacy 4-character validator removed', !s.includes('clean(form.clave).length < 4'));
check('field remains password type', /TextInput type="password"[^>]*value=\{form\.clave\}/.test(s));
check('new password autocomplete remains', s.includes('autoComplete="new-password"'));

if (failures.length) {
  console.error(`SEC001 PASSWORD MIN6 CS21A164: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC001 PASSWORD MIN6 CS21A164: PASS');
