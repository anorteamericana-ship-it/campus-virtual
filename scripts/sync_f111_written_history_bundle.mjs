// Sincroniza SOLO la sección app del bundle F111; preserva CSS/data/modes.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'src/examenes_app.jsx'),'utf8');
const bundlePath=path.join(root,'src/examenes_bundle.jsx');
const bundle=fs.readFileSync(bundlePath,'utf8');
const marker='// ===== examenes_app.jsx =====';
const index=bundle.indexOf(marker);
if(index<0 || bundle.indexOf(marker,index+1)>=0)
 throw Error('F111 bundle marker ambiguo');
const before=bundle.slice(0,index);
const previous=bundle.slice(index+marker.length);
if(!previous.includes('function StudentLiveExamApp()') ||
   !previous.includes('confirmExamMountF950'))
 throw Error('F111 bundle: estructura app histórica inesperada');
const newline=bundle.includes('\r\n')?'\r\n':'\n';
const app=source.replace(/\r\n|\r|\n/g,newline).trimEnd();
const next=before+marker+newline+newline+app+newline;
fs.writeFileSync(bundlePath,next,'utf8');
console.log('F111 HISTORY app-bundle sync OK; prefix bytes preserved:',Buffer.byteLength(before));
