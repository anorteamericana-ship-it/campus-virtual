import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const productFiles=[
  path.join(root,'src','inscripcion.jsx'),
  path.join(root,'styles','inscripcion.css'),
  path.join(root,'inscripcion.html'),
  path.join(root,'src','document-scanner.js')
];
const scripts={
  apply145:path.join(root,'scripts','run_document_scanner_cs21a145_windows_safe.mjs'),
  patch146:path.join(root,'scripts','patch_document_scanner_manual_cs21a146.mjs'),
  qa145:path.join(root,'scripts','qa_document_scanner_cs21a145.mjs'),
  qa146:path.join(root,'scripts','qa_document_scanner_manual_cs21a146.mjs'),
  qaBackend:path.join(root,'scripts','qa_apps_script_documentos_cs21a145.mjs'),
  lab:path.join(root,'scripts','write_document_scanner_lab_cs21a146.mjs')
};

for(const p of [...productFiles,...Object.values(scripts)]) if(!fs.existsSync(p)) throw new Error('Falta archivo requerido: '+p);

const backups=new Map(productFiles.map(p=>[p,fs.readFileSync(p)]));
function restore(){for(const [p,bytes] of backups) fs.writeFileSync(p,bytes)}
function run(script){
  const r=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
  if(r.stdout) process.stdout.write(r.stdout);
  if(r.stderr) process.stderr.write(r.stderr);
  if(r.status!==0) throw new Error('Falló '+path.basename(script));
}

try{
  console.log('=== CS21A146 · WINDOWS SAFE RUNNER ===');
  console.log('PASS backup byte a byte de frontend + scanner');

  const jsxNow=fs.readFileSync(path.join(root,'src','inscripcion.jsx'),'utf8');
  const already145=jsxNow.includes("const INS_VERSION = 'F98.4-Z6-IP4B';");
  if(already145){
    console.log('INFO CS21A145/IP4B ya estaba aplicado localmente; se reutiliza y se revalida.');
  }else{
    run(scripts.apply145);
  }

  run(scripts.patch146);
  run(scripts.qa145);
  run(scripts.qa146);
  run(scripts.qaBackend);
  run(scripts.lab);

  const diff=spawnSync('git',['diff','--check'],{cwd:root,encoding:'utf8',shell:false});
  if(diff.stdout) process.stdout.write(diff.stdout);
  if(diff.stderr) process.stderr.write(diff.stderr);
  if(diff.status!==0) throw new Error('git diff --check falló');

  console.log('PASS git diff --check');
  console.log('=== RESULTADO ===');
  console.log('PASS CS21A146 automático + ajuste manual listos para QA visual');
  console.log('LAB http://127.0.0.1:4173/qa/document-scanner-local.html');
  console.log('NO commit local · NO merge · NO deploy · PROD no tocado');
}catch(err){
  restore();
  console.error('FAIL '+err.message);
  console.error('ROLLBACK local: frontend + scanner restaurados byte a byte.');
  process.exit(1);
}
