// F111 AUDIO-PRIVATE-01 · sync quirúrgico de render/modes/app hacia bundle.
// Preserva CSS, appcss, data y cabecera legacy. --check nunca escribe.
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const file=path.join(root,'src/examenes_bundle.jsx');
let bundle=fs.readFileSync(file,'utf8');
const nl=bundle.includes('\r\n')?'\r\n':'\n';
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const targets=new Set(['examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx']);
const marker=name=>'// ===== '+name+' =====';
const count=(s,needle)=>s.split(needle).length-1;
for(const name of names) {
 if(count(bundle,marker(name))!==1) throw Error('F111 audio bundle marker faltante/duplicado: '+name);
}
const normalize=s=>s.replace(/\r\n|\r|\n/g,nl).trim();
let changed=0;
for(const name of names) {
 const start=bundle.indexOf(marker(name))+marker(name).length;
 const idx=names.indexOf(name);
 const end=idx===names.length-1?bundle.length:bundle.indexOf(marker(names[idx+1]),start);
 if(end<=start)throw Error('F111 audio bundle delimitador inválido: '+name);
 const segment=bundle.slice(start,end);
 const source=normalize(fs.readFileSync(path.join(root,'src',name),'utf8'));
 const current=normalize(segment);
 if(!targets.has(name)) {
  if(source!==current)throw Error('F111 audio bundle drift de fuente protegida: '+name);
  continue;
 }
 if(source!==current) {
  if(process.argv.includes('--check'))
   throw Error('F111 audio bundle drift de fuente: '+name);
  const leading=(segment.match(/^\s*/)||[''])[0];
  const trailing=(segment.match(/\s*$/)||[''])[0];
  const replacement=leading+source+trailing;
  bundle=bundle.slice(0,start)+replacement+bundle.slice(end);
  changed++;
 }
}
if(changed&&!process.argv.includes('--check'))fs.writeFileSync(file,bundle,'utf8');
console.log('F111 AUDIO-PRIVATE bundle '+(process.argv.includes('--check')?'CHECK':'SYNC')+' PASS; changed_sections='+changed+'; protected=3/3; targeted=3/3');
