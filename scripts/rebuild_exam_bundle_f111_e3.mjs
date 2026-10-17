// F111 · Rebuild reproducible 6/6, only within authorized GitHub branch.
import fs from 'node:fs';
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const path='src/examenes_bundle.jsx';
const existing=fs.readFileSync(path,'utf8');
const cut=existing.indexOf('// ===== '+names[0]+' =====');
if(cut<0)throw Error('Bundle 6/6 markers absent');
const header=existing.slice(0,cut);
if(!header.includes('Generado desde:'))throw Error('Expected generated bundle header');
const rebuilt=header+names.map(n=>'// ===== '+n+' =====\\n\\n'+fs.readFileSync('src/'+n,'utf8')+'\\n').join('').replaceAll('\\n','\n');
const demos=fs.readFileSync('src/examenes_data.jsx','utf8').match(/respuestas:\\s*\\{\\}/g)||[];
if(demos.length!==16)throw Error('Expected 16 emptied sample response fixtures: '+demos.length);
fs.writeFileSync(path,rebuilt,'utf8');
console.log('F111 E3 bundle 6/6 rebuilt; 16 answer demos empty; no production deploy.');
