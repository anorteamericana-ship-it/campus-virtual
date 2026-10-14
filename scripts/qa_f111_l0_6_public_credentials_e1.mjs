// F111 L0-6 · QA pública: nunca incluir dos contraseñas demo literales en regex.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const script=fs.readFileSync(new URL('./qa_sec004_demo_outer_guard_cs21a163.mjs',import.meta.url),'utf8');
assert(!/\|[a-z]+\d{4}\|[a-z]+\d{4}\/i/i.test(script),
  'No publicar claves demo legadas como alternativas de regex');
assert(script.includes('F111_KNOWN_LEGACY_DEMO_SECRETS'),
  'La verificación opcional de secretos antiguos procede de variables de entorno');
console.log('PASS_E1_F111_L0_6_PUBLIC');
