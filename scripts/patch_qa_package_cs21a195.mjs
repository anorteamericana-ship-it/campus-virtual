#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseName='CAMPUS_QA_CS21A194_CANDIDATO_MEMORY_MATCH_LATENCY_SAFE';
const packageName='CAMPUS_QA_CS21A195_CANDIDATO_MEMORY_MATCH_CONVERGENCE';
const base=path.join(root,'dist',baseName);
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const testMergeSha=process.env.TEST_MERGE_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'fix/cs21a195-memory-match-convergence-relay';
const verifyOnly=process.argv.includes('--verify');
const changed=[
  'apps_script_patches/99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs',
  'apps_script_patches/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs',
  '00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_CONVERGENCE_CS21A195.md',
];

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function write(relative,value){const out=path.join(target,relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,value,'utf8');}
function copy(relative,destination=relative){const source=path.join(root,relative);assert.equal(fs.existsSync(source),true,`Falta ${relative}`);const out=path.join(target,destination);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(source,out);}
function setVersion(source,key,value){const cleaned=source.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'').replace(/\s*$/,'');return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');}
function files(){const out=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())walk(abs);else if(entry.name!=='SHA256SUMS.txt')out.push(abs);}};walk(target);return out.sort((a,b)=>a.localeCompare(b));}
function writeManifest(){write('SHA256SUMS.txt',files().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n');}

function build(){
  assert.equal(fs.existsSync(base),true,`Falta paquete base ${baseName}.`);
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(base,target,{recursive:true});
  for(const name of fs.readdirSync(target)){
    if(name==='SHA256SUMS.txt'||/^(?:LEEME_PRIMERO|REGISTRO_PRUEBA_AUTENTICADA|ABRIR_CAMPUS_QA)_CS21A\d+/i.test(name))fs.rmSync(path.join(target,name),{recursive:true,force:true});
  }
  fs.rmSync(path.join(target,'EVIDENCIA_AUTOMATICA'),{recursive:true,force:true});
  changed.forEach(relative=>copy(relative));
  copy('apps_script_patches/99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs','BACKEND_QA/99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs');
  copy('apps_script_patches/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs','BACKEND_QA/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs');

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A194.cmd');
  assert.equal(fs.existsSync(oldLauncher),true,'Falta launcher CS21A194.');
  write('ABRIR_CAMPUS_QA_CS21A195.cmd',fs.readFileSync(oldLauncher,'utf8').replaceAll('4194','4195').replaceAll('CS21A194','CS21A195'));
  let serve=fs.readFileSync(path.join(base,'serve.mjs'),'utf8');
  assert.match(serve,/4194/,'serve.mjs base no usa puerto 4194.');
  write('serve.mjs',serve.replaceAll('4194','4195'));

  write('LEEME_PRIMERO_CS21A195.txt',`CAMPUS QA CS21A195 - MEMORY MATCH CONVERGENCE\n================================================\n\nESTADO\n- Candidato QA aislado. NO producción y NO main.\n- Base exacta: ${baseName}.\n- Rama: ${sourceBranch}\n- SHA fuente: ${sourceHeadSha}\n- Corrige la divergencia real observada en LAB-3103 entre docente, Chu y Naty.\n\nCAMBIO\n- Frontend: se conserva CS21A194 sin cambios funcionales.\n- Backend QA: agrega CS21A195-MM-CONVERGENCE-RELAY-1.\n- Cada escritura revisionada Memory Match publica un relay rápido.\n- Una lectura lenta nunca puede devolver una revisión inferior al relay más reciente.\n- Estado y turnos usan fast-path; cada 30 s se permite refresh completo.\n- Si hay timeout/transición pendiente se usa la ruta canónica con lock.\n\nBACKEND QA\n- Instalar únicamente BACKEND_QA/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs en Apps Script QA después de PASS automático.\n- Versionar el MISMO deployment QA y conservar el mismo /exec.\n- NO tocar producción.\n\nFRONTEND QA\n1. Cierre 4194.\n2. Extraiga el ZIP en carpeta nueva.\n3. Ejecute ABRIR_CAMPUS_QA_CS21A195.cmd.\n4. Abra http://127.0.0.1:4195/qa-setup.html y configure el mismo /exec QA.\n5. Cree sala nueva Memory Match B1/U01, 6 parejas, Individual.\n6. Entre con Chu y Naty; docente debe ver 2 participantes.\n7. Inicie y juegue varias parejas correctas e incorrectas sin usar Actualizar manual.\n8. Docente, Chu y Naty deben converger en cartas, turno y jugador sin quedar un ciclo atrás.\n\nNO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.\n`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A195.txt',`REGISTRO QA CS21A195 - CONVERGENCIA MEMORY MATCH\n=================================================\nEstado inicial: PENDIENTE\nFecha:\nSala:\n\n[ ] VERSION.txt muestra CS21A195 y puerto 4195.\n[ ] Backend QA devuelve CS21A195-MM-CONVERGENCE-RELAY-1.\n[ ] Docente ve 2 participantes antes de iniciar.\n[ ] Primera y segunda carta siguen siendo inmediatas para el jugador activo.\n[ ] Docente y observador reciben la misma pareja sin Actualizar manual.\n[ ] Durante mismatch los 3 ven las mismas dos cartas antes del flip-back.\n[ ] Después del flip-back los 3 muestran el mismo turno/jugador.\n[ ] Ningún panel queda en Esperando servidor cuando otro ya avanzó.\n[ ] Timeout rota una sola vez.\n[ ] Ahorcado sin regresión.\n\nResultado final: PASS / FAIL / BLOCKED\nPrimera falla observable:\nHora/panel:\nEvidencia:\n`);

  let version=fs.readFileSync(path.join(base,'VERSION.txt'),'utf8');
  for(const [key,value] of [
    ['VERSION','CS21A195'],['PACKAGE_REVISION','1'],['STATUS','QA_CANDIDATE_NOT_FINAL'],
    ['PURPOSE','Memory Match cross-client convergence relay QA candidate'],
    ['PACKAGE_BASE',baseName],['QA_PORT','4195'],['SOURCE_BRANCH',sourceBranch],['SOURCE_HEAD_SHA',sourceHeadSha],['TEST_MERGE_SHA',testMergeSha],
    ['FRONTEND_LAYER','CS21A194_MEMORY_MATCH_LATENCY_SAFE'],['BACKEND_LAYER','CS21A195-MM-CONVERGENCE-RELAY-1'],
    ['APPS_SCRIPT_CHANGE','YES_QA_ONLY'],['APPS_SCRIPT_ACTION','INSTALL_COMPLETE_CS21A195_QA_FILE_AFTER_AUTOMATED_PASS'],
    ['APPS_SCRIPT_COMPLETE_FILE','BACKEND_QA/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs'],
    ['MEMORY_MATCH_SYNC_BASE','CS21A194-MM-LATENCY-SAFE-1'],['MEMORY_MATCH_CONVERGENCE_VERSION','CS21A195-MM-CONVERGENCE-RELAY-1'],
    ['MEMORY_MATCH_RELAY_TTL_SECONDS','90'],['MEMORY_MATCH_FULL_REFRESH_MS','30000'],['MEMORY_MATCH_AUTHENTICATED_QA_STATUS','PENDING_CS21A195'],
  ])version=setVersion(version,key,value);
  write('VERSION.txt',version.replace(/\s*$/,'')+'\n');
  writeManifest();
}

function verify(){
  for(const relative of ['VERSION.txt','SHA256SUMS.txt','serve.mjs','ABRIR_CAMPUS_QA_CS21A195.cmd','LEEME_PRIMERO_CS21A195.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A195.txt',...changed,'BACKEND_QA/99Q_MEMORY_MATCH_CONVERGENCE_RELAY_QA_CS21A195.gs','BACKEND_QA/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs'])assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta en paquete: ${relative}`);
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.match(version,/VERSION=CS21A195/);assert.match(version,/QA_PORT=4195/);assert.match(version,/BACKEND_LAYER=CS21A195-MM-CONVERGENCE-RELAY-1/);
  const backend=fs.readFileSync(path.join(target,'BACKEND_QA/99_CS21A195_MEMORY_MATCH_CONVERGENCE_COMPLETO.gs'),'utf8');
  assert.match(backend,/CS21A195_MM_CONVERGENCE_VERSION = 'CS21A195-MM-CONVERGENCE-RELAY-1'/);assert.match(backend,/__cs21a195StaleReadShield/);assert.match(backend,/__cs21a195FastRelay/);
  const manifest=fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);
  for(const line of manifest){const match=line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);assert.ok(match,`Manifest inválido: ${line}`);assert.equal(sha256(path.join(target,match[2])),match[1],`Hash inválido: ${match[2]}`);}
  console.log(JSON.stringify({ok:true,packageName,files:manifest.length,port:4195,backend:'CS21A195-MM-CONVERGENCE-RELAY-1'},null,2));
}

if(!verifyOnly)build();
verify();
