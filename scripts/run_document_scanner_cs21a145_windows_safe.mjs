import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const productFiles = [
  path.join(root,'src','inscripcion.jsx'),
  path.join(root,'styles','inscripcion.css'),
  path.join(root,'inscripcion.html')
];
const scripts = [
  path.join(root,'scripts','apply_document_scanner_cs21a145.mjs'),
  path.join(root,'scripts','qa_document_scanner_cs21a145.mjs'),
  path.join(root,'scripts','qa_apps_script_documentos_cs21a145.mjs')
];

for(const p of [...productFiles,...scripts]) if(!fs.existsSync(p)) throw new Error('Falta archivo requerido: '+p);
if(!fs.existsSync(path.join(root,'src','document-scanner.js'))) throw new Error('Falta src/document-scanner.js');

const backups = new Map(productFiles.map(p=>[p,fs.readFileSync(p)]));
function restore(){
  for(const [p,bytes] of backups) fs.writeFileSync(p,bytes);
}
function run(script){
  const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
  if(r.stdout) process.stdout.write(r.stdout);
  if(r.stderr) process.stderr.write(r.stderr);
  if(r.status!==0) throw new Error('Falló '+path.basename(script));
}

try{
  // Aplicadores históricos de esta rama comparan preimágenes LF; normalizar solo
  // temporalmente evita falsos negativos por checkout CRLF en Windows.
  for(const p of productFiles){
    const text=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
    fs.writeFileSync(p,text,'utf8');
  }

  console.log('=== CS21A145 · WINDOWS SAFE RUNNER ===');
  console.log('PASS backup byte a byte de archivos producto');
  console.log('PASS normalización CRLF→LF solo para aplicación local');

  run(scripts[0]);
  run(scripts[1]);
  run(scripts[2]);

  const diff=spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8',shell:false});
  if(diff.stdout) process.stdout.write(diff.stdout);
  if(diff.stderr) process.stderr.write(diff.stderr);
  if(diff.status!==0) throw new Error('git diff --check falló');

  console.log('PASS git diff --check');
  console.log('=== RESULTADO ===');
  console.log('PASS CS21A145 aplicado localmente y QA estática/sintética en verde');
  console.log('NO commit · NO push · NO merge · NO deploy · PROD no tocado');
} catch(err){
  restore();
  console.error('FAIL '+err.message);
  console.error('ROLLBACK local: archivos producto restaurados byte a byte.');
  process.exit(1);
}
