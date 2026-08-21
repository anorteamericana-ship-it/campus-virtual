import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const jsxPath=path.join(root,'src','inscripcion.jsx');

if(!fs.existsSync(jsxPath)) throw new Error('Falta src/inscripcion.jsx');

let jsx=fs.readFileSync(jsxPath,'utf8');
const before=jsx;
jsx=jsx.replace(/\/>\}\s+\r?\n/g,'/>}\n');

if(jsx!==before){
  fs.writeFileSync(jsxPath,jsx,'utf8');
  console.log('PASS CS21A146 trailing whitespace corregido en inscripcion.jsx');
}else{
  console.log('PASS CS21A146 sin trailing whitespace pendiente');
}
