import assert from 'node:assert/strict';
import fs from 'node:fs';
const src=fs.readFileSync(new URL('../src/login.jsx',import.meta.url),'utf8');
const expected='Cédula o contraseña incorrectos. Si fallaste varias veces, esperá 15 minutos o usá Recuperar contraseña.';
assert(src.includes("credenciales_invalidas: '"+expected+"'"));
assert(src.includes('usuario_inactivo:'));
assert(src.includes('ERR_MSG[data.error] || ERR_MSG.credenciales_invalidas'));
assert(!src.includes('F111LG_'),'no public lock storage details');
console.log('PASS_F111_LOGIN_R1_PUBLIC_COPY 4/4');
