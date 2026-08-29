import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

await import(pathToFileURL(process.cwd()+'/scripts/bootstrap_patch_admin_students_safe_errors_cs21a191_v2.mjs').href+'?v='+Date.now());

const path='src/admin_students.jsx';
let s=fs.readFileSync(path,'utf8');
const patterns=[
  /setError\('Error de conexión: '\s*\+\s*\(e\?\.message\s*\|\|\s*e\)\)/g,
  /setError\('Error de conexión: '\s*\+\s*\(e\.message\s*\|\|\s*e\)\)/g,
];
let total=0;
for(const rx of patterns){
  const matches=s.match(rx)||[];
  total+=matches.length;
  s=s.replace(rx,"setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'))");
}
if(total<1) throw new Error('CS21A191 v3: expected at least one remaining setError connection variant');
fs.writeFileSync(path,s,'utf8');
console.log(`CS21A191 v3: replaced ${total} remaining setError connection variant(s)`);
