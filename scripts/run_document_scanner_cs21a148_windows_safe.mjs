import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const productFiles=[
  path.join(root,'src','document-scanner.js'),
  path.join(root,'scripts','write_document_scanner_lab_cs21a147.mjs')
];
const patch=path.join(root,'scripts','patch_document_scanner_native_manual_cs21a148.mjs');
const qa=path.join(root,'scripts','qa_document_scanner_cs21a148.mjs');
const writer=path.join(root,'scripts','write_document_scanner_lab_cs21a147.mjs');
for(const p of [...productFiles,patch,qa,writer]) if(!fs.existsSync(p)) throw new Error('Falta archivo requerido: '+p);

const backups=new Map(productFiles.map(p=>[p,fs.readFileSync(p)]));
function restore(){for(const [p,bytes] of backups) fs.writeFileSync(p,bytes)}
function run(script){
  const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
  if(r.stdout) process.stdout.write(r.stdout);
  if(r.stderr) process.stderr.write(r.stderr);
  if(r.status!==0) throw new Error('Falló '+path.basename(script));
}

try{
  console.log('=== CS21A148 · WINDOWS SAFE RUNNER ===');
  console.log('PASS backup byte a byte scanner + laboratorio fuente');
  run(patch);
  run(qa);
  run(writer);
  const diff=spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8',shell:false});
  if(diff.stdout) process.stdout.write(diff.stdout);
  if(diff.stderr) process.stderr.write(diff.stderr);
  if(diff.status!==0) throw new Error('git diff --check falló');
  console.log('PASS git diff --check');
  console.log('=== RESULTADO ===');
  console.log('PASS CS21A148 listo para QA visual sin espera OpenCV');
  console.log('LAB http://127.0.0.1:4173/qa/document-scanner-local.html');
  console.log('Flujo: foto -> 4 esquinas -> vista final -> Subir esta foto');
  console.log('NO commit local · NO merge · NO deploy · PROD no tocado');
}catch(err){
  restore();
  console.error('FAIL '+err.message);
  console.error('ROLLBACK local: scanner + laboratorio fuente restaurados byte a byte.');
  process.exit(1);
}
