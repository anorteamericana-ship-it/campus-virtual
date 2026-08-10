#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseName='CAMPUS_QA_CS21A193_CANDIDATO_ENGLISH_LAB_CARGA_ESTABLE';
const packageName='CAMPUS_QA_CS21A194_CANDIDATO_MEMORY_MATCH_LATENCY_SAFE';
const base=path.join(root,'dist',baseName);
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const testMergeSha=process.env.TEST_MERGE_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'fix/cs21a194-memory-match-latency-safe-turn';
const verifyOnly=process.argv.includes('--verify');

const changed=[
  'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx',
  'src/english_lab_live_canonical_loader_cs21a193.js',
  'apps_script_patches/99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs',
  'apps_script_patches/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs',
  '00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_LATENCY_CS21A194.md',
];

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function write(relative,value){const out=path.join(target,relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,value,'utf8');}
function copy(relative,destination=relative){const source=path.join(root,relative);assert.equal(fs.existsSync(source),true,`Falta ${relative}`);const out=path.join(target,destination);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(source,out);}
function setVersion(source,key,value){const cleaned=source.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'').replace(/\s*$/,'');return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');}
function files(){const out=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name);if(entry.isDirectory())walk(absolute);else if(entry.name!=='SHA256SUMS.txt')out.push(absolute);}};walk(target);return out.sort((a,b)=>a.localeCompare(b));}
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
  copy('apps_script_patches/99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs','BACKEND_QA/99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs');
  copy('apps_script_patches/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs','BACKEND_QA/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs');

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A193.cmd');
  assert.equal(fs.existsSync(oldLauncher),true,'Falta launcher CS21A193.');
  write('ABRIR_CAMPUS_QA_CS21A194.cmd',fs.readFileSync(oldLauncher,'utf8').replaceAll('4193','4194').replaceAll('CS21A193','CS21A194'));
  let serve=fs.readFileSync(path.join(base,'serve.mjs'),'utf8');
  assert.match(serve,/4193/,'serve.mjs base no usa puerto 4193.');
  write('serve.mjs',serve.replaceAll('4193','4194'));

  write('LEEME_PRIMERO_CS21A194.txt',`CAMPUS QA CS21A194 - MEMORY MATCH LATENCY SAFE\n=================================================\n\nESTADO\n- Candidato QA aislado. NO producción y NO main.\n- Base exacta: ${baseName}.\n- Rama: ${sourceBranch}\n- SHA fuente: ${sourceHeadSha}\n- Corrige la falla autenticada de LAB-5137: la primera carta tardaba tanto en confirmarse que el jugador casi no tenía tiempo de escoger la segunda.\n\nCAMBIO FRONTEND\n- La primera carta abre localmente de inmediato.\n- La segunda carta puede seleccionarse mientras el ACK de la primera sigue en vuelo.\n- SUBMIT_PAIR queda en cola y solo sale después del ACK real de DISCOVER_CARD.\n- Un rechazo real revierte el estado optimista.\n\nCAMBIO BACKEND QA\n- Nueva capa: CS21A194-MM-LATENCY-SAFE-1.\n- Cuando FIRST_REVEALED queda aceptado, el deadline garantiza al menos 30 segundos desde revealed_at para completar la segunda selección.\n- La extensión es idempotente y ocurre dentro de la misma escritura protegida del submit.\n\nIMPORTANTE\n- Este candidato SI cambia backend QA respecto a CS21A193.\n- NO modificar producción.\n- NO pegar parches sueltos. Para la prueba autenticada, instalar únicamente el archivo completo BACKEND_QA/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs en el Apps Script QA y crear una nueva versión del MISMO deployment QA /exec.\n- No hacer esa instalación hasta que la evidencia automática CS21A194 esté en PASS.\n\nFRONTEND QA\n1. Cierre el servidor 4193.\n2. Extraiga este ZIP en carpeta nueva.\n3. Ejecute ABRIR_CAMPUS_QA_CS21A194.cmd.\n4. Abra http://127.0.0.1:4194/qa-setup.html y configure el mismo /exec QA ya verificado después de actualizar únicamente el backend QA.\n5. Cree una sala nueva Memory Match B1/U01, 6 parejas, Individual.\n6. Entre con Chu y Naty; docente debe ver exactamente 2 participantes.\n7. Inicie. En turno activo, toque primera carta y luego una segunda inmediatamente, sin esperar mensajes de sincronización.\n8. La primera debe abrir instantáneamente; la segunda debe poder abrir antes del ACK de la primera.\n9. Los tres paneles deben converger en las mismas dos cartas, turno, reloj y resultado.\n\nNO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.\n`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A194.txt',`REGISTRO QA CS21A194 - MEMORY MATCH LATENCY SAFE\n==================================================\nEstado inicial: PENDIENTE\nFecha:\nSala nueva:\nBackend QA versionado con CS21A194 completo: SI / NO\nDocente:\nChu:\nNaty:\n\n[ ] VERSION.txt muestra CS21A194 y puerto 4194.\n[ ] Backend QA devuelve CS21A194-MM-LATENCY-SAFE-1.\n[ ] Docente ve 2 participantes antes de iniciar.\n[ ] Los 3 cargan el mismo tablero al iniciar.\n[ ] Primera carta abre visualmente en menos de 500 ms en el jugador activo.\n[ ] Segunda carta puede seleccionarse sin esperar el ACK de la primera.\n[ ] SUBMIT_PAIR no llega al backend antes del ACK DISCOVER_CARD.\n[ ] Tras FIRST_REVEALED el servidor garantiza al menos 30 s para segunda selección.\n[ ] Los 3 convergen en cartas, turno, reloj, parejas y resultado.\n[ ] Timeout rota una sola vez y no duplica eventos.\n[ ] Desktop 1440x900 usable.\n[ ] Móvil 390x844 usable y sin desborde horizontal.\n[ ] Ahorcado y entrada CS21A193 siguen en PASS.\n\nResultado final: PASS / FAIL / BLOCKED\nPrimera falla observable:\nHora y panel:\nMensaje exacto:\nEvidencia:\n`);

  let version=fs.readFileSync(path.join(base,'VERSION.txt'),'utf8');
  for(const [key,value] of [
    ['VERSION','CS21A194'],['PACKAGE_REVISION','1'],['STATUS','QA_CANDIDATE_NOT_FINAL'],
    ['PURPOSE','Memory Match latency-safe first and second card interaction QA candidate'],
    ['PACKAGE_BASE',baseName],['QA_PORT','4194'],['SOURCE_BRANCH',sourceBranch],['SOURCE_HEAD_SHA',sourceHeadSha],['TEST_MERGE_SHA',testMergeSha],
    ['FRONTEND_LAYER','CS21A194_MEMORY_MATCH_LATENCY_SAFE'],['BACKEND_LAYER','CS21A194-MM-LATENCY-SAFE-1'],
    ['APPS_SCRIPT_CHANGE','YES_QA_ONLY'],['APPS_SCRIPT_ACTION','INSTALL_COMPLETE_CS21A194_QA_FILE_AFTER_AUTOMATED_PASS'],
    ['APPS_SCRIPT_COMPLETE_FILE','BACKEND_QA/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs'],
    ['MEMORY_MATCH_SYNC_BASE','CS21A192-MM-CONSISTENCY-2'],['MEMORY_MATCH_LATENCY_SAFE_VERSION','CS21A194-MM-LATENCY-SAFE-1'],
    ['MEMORY_MATCH_MIN_SECOND_PICK_MS','30000'],['MEMORY_MATCH_OPTIMISTIC_FIRST_CARD','true'],['MEMORY_MATCH_QUEUED_SECOND_CARD','true'],
    ['MEMORY_MATCH_AUTHENTICATED_QA_STATUS','PENDING_CS21A194'],
  ])version=setVersion(version,key,value);
  write('VERSION.txt',version.replace(/\s*$/,'')+'\n');
  writeManifest();
}

function verify(){
  for(const relative of ['VERSION.txt','SHA256SUMS.txt','serve.mjs','ABRIR_CAMPUS_QA_CS21A194.cmd','LEEME_PRIMERO_CS21A194.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A194.txt',...changed,'BACKEND_QA/99P_MEMORY_MATCH_LATENCY_SAFE_QA_CS21A194.gs','BACKEND_QA/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs'])assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta en paquete: ${relative}`);
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.match(version,/VERSION=CS21A194/);assert.match(version,/QA_PORT=4194/);assert.match(version,/BACKEND_LAYER=CS21A194-MM-LATENCY-SAFE-1/);assert.match(version,/MEMORY_MATCH_MIN_SECOND_PICK_MS=30000/);
  const frontend=fs.readFileSync(path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),'utf8');
  assert.match(frontend,/data-latency-safe-version=\{LATENCY_SAFE_VERSION\}/);assert.match(frontend,/Elegí la segunda mientras sincronizamos/);assert.match(frontend,/revealPromiseRef\.current=promise/);
  const loader=fs.readFileSync(path.join(target,'src/english_lab_live_canonical_loader_cs21a193.js'),'utf8');
  assert.match(loader,/memory_match_classic_sync_cs21a189\.jsx\?v=CS21A194/);assert.match(loader,/__cs21a194LatencySafe/);
  const backend=fs.readFileSync(path.join(target,'BACKEND_QA/99_CS21A194_MEMORY_MATCH_LATENCY_SAFE_COMPLETO.gs'),'utf8');
  assert.match(backend,/CS21A194_MM_MIN_SECOND_PICK_MS = 30000/);assert.match(backend,/_cs21a189WritePackage_\.__cs21a194LatencySafe = true/);
  const manifest=fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);
  for(const line of manifest){const match=line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);assert.ok(match,`Manifest inválido: ${line}`);assert.equal(sha256(path.join(target,match[2])),match[1],`Hash inválido: ${match[2]}`);}
  console.log(JSON.stringify({ok:true,packageName,files:manifest.length,port:4194,backend:'CS21A194-MM-LATENCY-SAFE-1',minSecondPickMs:30000},null,2));
}

if(!verifyOnly)build();
verify();
