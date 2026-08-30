import fs from 'node:fs';

const path='src/admin_master_conape_multisort_cs21a109.jsx';
let src=fs.readFileSync(path,'utf8');
const from='No quedan desembolsos académicos 01 pendientes según 7-morosidad.';
const to='No quedan desembolsos académicos 01 pendientes según el registro oficial.';
const count=src.split(from).length-1;
if(count!==1)throw new Error(`CS21A198R2 expected exactly 1 multisort preimage, found ${count}`);
src=src.replace(from,to);
fs.writeFileSync(path,src);
console.log('CS21A198R2 exact multisort copy patch applied');
