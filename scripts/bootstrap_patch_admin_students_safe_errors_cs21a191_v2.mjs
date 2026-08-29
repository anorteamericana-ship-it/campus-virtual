import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const original='scripts/bootstrap_patch_admin_students_safe_errors_cs21a191.mjs';
let code=fs.readFileSync(original,'utf8');
const pattern=/one\('history revert raw fallbacks',[\s\S]*?\);\none\('agenda ficha backend response'/;
if(!pattern.test(code)) throw new Error('CS21A191 v2: history matcher block not found exactly once');
code=code.replace(pattern,`many('history revert assisted fallback',"||r.error}\\\`","||adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo revertir.','revertir_cambio')}\\\`",1);\nmany('history revert simple fallback',"(r?.error||'No se pudo revertir.')","adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo revertir.','revertir_cambio')",1);\none('agenda ficha backend response'`);
const temp='/tmp/cs21a191-patcher-v2.mjs';
fs.writeFileSync(temp,code,'utf8');
await import(pathToFileURL(temp).href+'?v='+Date.now());
