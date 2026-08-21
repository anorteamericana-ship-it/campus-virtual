import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const required=[
  path.join(root,'src','document-scanner.js'),
  path.join(root,'scripts','write_document_scanner_lab_cs21a147.mjs'),
  path.join(root,'scripts','qa_document_scanner_cs21a147.mjs')
];
for(const p of required) if(!fs.existsSync(p)) throw new Error('Falta archivo requerido: '+p);
function run(script){
  const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
  if(r.stdout) process.stdout.write(r.stdout);
  if(r.stderr) process.stderr.write(r.stderr);
  if(r.status!==0) throw new Error('Falló '+path.basename(script));
}
console.log('=== CS21A147 · FINAL PHOTO QA RUNNER ===');
console.log('PASS scanner fuente desde rama; no toca Apps Script ni PROD');
run(path.join(root,'scripts','write_document_scanner_lab_cs21a147.mjs'));
run(path.join(root,'scripts','qa_document_scanner_cs21a147.mjs'));
const diff=spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8',shell:false});
if(diff.stdout) process.stdout.write(diff.stdout);
if(diff.stderr) process.stderr.write(diff.stderr);
if(diff.status!==0) throw new Error('git diff --check falló');
console.log('PASS git diff --check');
console.log('=== RESULTADO ===');
console.log('PASS CS21A147 listo para QA visual real');
console.log('LAB http://127.0.0.1:4173/qa/document-scanner-local.html');
console.log('Flujo: foto -> 4 esquinas -> vista final -> Subir esta foto');
console.log('PROD no tocado · PR sigue DRAFT · NO merge · NO deploy');
