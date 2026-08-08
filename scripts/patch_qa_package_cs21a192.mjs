#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const base=path.join(root,'dist','CAMPUS_QA_CS21A191_CANDIDATO_HANGMAN_LIVE');
const packageName='CAMPUS_QA_CS21A192_CANDIDATO_MEMORY_MATCH_SYNC';
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'fix/cs21a192-memory-match-authoritative-sync';
const verifyOnly=process.argv.includes('--verify');

const CS190_GUARD='<script src="src/english_lab_live_timeout_style_guard_cs21a190.js?v=F98.4Z6CS21A190"></script>';
const CS192_GUARD='<script src="src/english_lab_live_authoritative_sync_guard_cs21a192.js?v=F98.4Z6CS21A192"></script>';

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function copy(relative,destinationRelative=relative){
  const source=path.join(root,relative);
  const destination=path.join(target,destinationRelative);
  assert.equal(fs.existsSync(source),true,`Falta ${relative}`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}
function text(relative){return fs.readFileSync(path.join(target,relative),'utf8');}
function write(relative,value){
  const destination=path.join(target,relative);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,value,'utf8');
}
function files(){
  const out=[];
  const walk=dir=>{
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const absolute=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(absolute);
      else if(entry.name!=='SHA256SUMS.txt') out.push(absolute);
    }
  };
  walk(target);
  return out.sort((left,right)=>left.localeCompare(right));
}
function writeManifest(){
  const lines=files().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`);
  write('SHA256SUMS.txt',lines.join('\n')+'\n');
}
function setVersion(source,key,value){
  const cleaned=source
    .replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'')
    .replace(/\s*$/,'');
  return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');
}
function replaceRequired(source,pattern,replacement,label){
  assert.match(source,pattern,`No se encontró ${label}.`);
  return source.replace(pattern,replacement);
}

function build(){
  assert.equal(fs.existsSync(base),true,'Falta el paquete CS21A191 finalizado. Ejecute la cadena 183/187/189/190/191/finalize antes de CS21A192.');
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(base,target,{recursive:true});

  for(const stale of [
    'LEEME_PRIMERO_CS21A191.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A191.txt',
    'ABRIR_CAMPUS_QA_CS21A191.cmd',
    'SHA256SUMS.txt',
  ]) fs.rmSync(path.join(target,stale),{recursive:true,force:true});

  [
    'src/english_lab_live.jsx',
    'src/english_lab_ux_cs21a181.js',
    'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx',
    'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx',
    'src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html',
    'src/english_lab_live_authoritative_sync_guard_cs21a192.js',
    'styles/english_lab_memory_match_cs21a173.css',
    'apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs',
    'apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
    'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
    '00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_SYNC_CS21A192.md',
  ].forEach(relative=>copy(relative));
  copy('apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs','BACKEND_QA/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs');
  copy('apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs','BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');

  let campus=text('campus.html');
  campus=campus.replace(/\n?<script src="src\/english_lab_live_authoritative_sync_guard_cs21a192\.js\?v=[^"]+"><\/script>/g,'');
  assert.ok(campus.includes(CS190_GUARD),'campus.html no contiene el guard CS21A190 requerido.');
  campus=campus.replace(CS190_GUARD,`${CS190_GUARD}\n${CS192_GUARD}`);
  campus=replaceRequired(
    campus,
    /styles\/english_lab_memory_match_cs21a173\.css\?v=[^"]+/,
    'styles/english_lab_memory_match_cs21a173.css?v=CS21A192',
    'la hoja base Memory Match',
  );
  write('campus.html',campus);

  let app=text('src/app.jsx');
  app=replaceRequired(
    app,
    /src\/english_lab_live\.jsx\?v=[^'"\s]+/,
    'src/english_lab_live.jsx?v=F98.4Z6CS21A192',
    'la referencia lazy de english_lab_live.jsx',
  );
  write('src/app.jsx',app);

  let runtime=text('src/runtime_config.js');
  runtime=replaceRequired(
    runtime,
    /src\/english_lab_ux_cs21a181\.js\?v=[^'"\s]+/,
    'src/english_lab_ux_cs21a181.js?v=F98.4Z6CS21A192',
    'la referencia de english_lab_ux_cs21a181.js',
  );
  write('src/runtime_config.js',runtime);

  let classicGuard=text('src/english_lab_live_classic_sync_guard_cs21a189.js');
  classicGuard=replaceRequired(
    classicGuard,
    /src\/english_lab_games\/memory_match_classic_sync_cs21a189\.jsx\?v=[^'"\s]+/,
    'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx?v=CS21A192',
    'el motor clásico Memory Match en su guard',
  );
  write('src/english_lab_live_classic_sync_guard_cs21a189.js',classicGuard);

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A191.cmd');
  assert.equal(fs.existsSync(oldLauncher),true,'Falta el launcher CS21A191 en el paquete base.');
  const launcher=fs.readFileSync(oldLauncher,'utf8').replaceAll('4191','4192').replaceAll('CS21A191','CS21A192');
  write('ABRIR_CAMPUS_QA_CS21A192.cmd',launcher);

  let serve=text('serve.mjs');
  assert.match(serve,/4191/,'serve.mjs CS21A191 no contiene el puerto base 4191.');
  serve=serve.replaceAll('4191','4192');
  write('serve.mjs',serve);

  write('LEEME_PRIMERO_CS21A192.txt',`CAMPUS QA CS21A192 - MEMORY MATCH SINCRONIZACIÓN AUTORITATIVA
================================================================

ESTADO REAL
- Candidato QA aislado. NO producción y NO main.
- Base acumulada exacta: paquete finalizado CS21A191.
- Rama: ${sourceBranch}
- SHA fuente: ${sourceHeadSha}
- Corrige la divergencia observada en LAB-9317 entre docente, Chu y Naty.
- El estado se ordena por state_revision y los tres paneles consumen el mismo snapshot canónico.
- Las jugadas nacidas de una revisión o turno anterior se rechazan sin mutar la sala.
- El polling de estado tiene un único dueño, timeout de 8 segundos y se detiene al cerrar la ronda.
- La primera carta se oculta al deadline autoritativo y el mismatch usa una ventana común de 6 segundos.
- CI y verificadores sintéticos NO sustituyen la prueba autenticada de tres paneles.

APPS SCRIPT QA - REGLA OBLIGATORIA
1. NO pegue 99O por separado.
2. Entre únicamente al proyecto Apps Script QA/STAGING.
3. Abra el archivo objetivo 99_CS21A183_SENTENCE_ORDER_COMPLETO.
4. Use Ctrl+A y elimine TODO el contenido anterior.
5. Pegue TODO BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs una sola vez.
6. Guarde y ejecute verificarMemoryMatchStartFixCS21A183().
7. El último bloque debe ser CS21A192-MM-CONSISTENCY-1 con ok=true.
8. Actualice una nueva versión del mismo deployment QA y conserve la misma URL /exec.
9. NO cambie Code.gs, producción ni el deployment productivo.

FRONTEND QA
1. Extraiga completamente el ZIP en una carpeta nueva.
2. Ejecute ABRIR_CAMPUS_QA_CS21A192.cmd.
3. Mantenga abierta la ventana del servidor.
4. Se abrirá http://127.0.0.1:4192/qa-setup.html
5. Configure la URL /exec del mismo deployment QA actualizado.

PRUEBA OBLIGATORIA
1. Cree una sala NUEVA Memory Match B1/U01, 6 parejas, Individual.
2. Abra docente, Chu y Naty simultáneamente; no reutilice LAB-9317.
3. Confirme que state_revision nunca retrocede en ningún panel.
4. Confirme que turno, jugador, deadline, cartas y parejas coinciden.
5. Pruebe respuesta fuera de orden, timeout sin carta, timeout con primera carta y mismatch.
6. Pruebe contención/retry y reanudación de pestaña.
7. Repita a 1440x900 y 390x844.
8. Repita el flujo crítico en Equipos y cierre terminal.

NO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A192.txt',`REGISTRO QA CS21A192 - MEMORY MATCH SYNC
==========================================
Estado inicial: PENDIENTE
Fecha:
Sala nueva:
Deployment QA:
Docente:
Estudiante 1 (Chu):
Estudiante 2 (Naty):

[ ] verificarMemoryMatchStartFixCS21A183() termina en CS21A192-MM-CONSISTENCY-1 y ok=true.
[ ] atomic_timeout_cleanup=true.
[ ] one_state_write_per_timeout=true.
[ ] stale_snapshot_resurrection_blocked=true.
[ ] revision_keyed_snapshot=true.
[ ] monotonic_state_revision=true.
[ ] fresh_server_now_outside_cache=true.
[ ] lock_failure_returns_retry=true.
[ ] teacher_student_same_snapshot_path=true.
[ ] expected_state_revision_guard=true.
[ ] expected_turn_number_guard=true.
[ ] stale_action_rejected_without_mutation=true.
[ ] timeout_event_cache_invalidated=true.
[ ] mismatch_reveal_ms=6000.
[ ] hangman_router_untouched=true.
[ ] Tres paneles coinciden en revisión, turno, jugador, deadline y tablero.
[ ] Diferencia del cronómetro tras converger <= 1 segundo.
[ ] Respuesta fuera de orden no reemplaza una revisión nueva.
[ ] Timeout sin carta avanza exactamente una vez.
[ ] Timeout con primera carta limpia el reveal y avanza exactamente una vez.
[ ] Mismatch no produce doble avance junto al timeout.
[ ] Pareja correcta suma 1 punto y conserva el turno.
[ ] Contención de lock produce retry, nunca snapshot vencido.
[ ] Reanudación de pestaña converge de inmediato.
[ ] Una lectura colgada termina a los 8 segundos y el siguiente poll recupera la sala.
[ ] Al vencer el turno, FIRST_REVEALED se oculta en todos los paneles.
[ ] Tras cerrar ronda/sala no se producen polls posteriores.
[ ] Desktop 1440x900 usable y sincronizado.
[ ] Móvil 390x844 usable, sincronizado y sin desborde horizontal.
[ ] Equipos conserva/rota según las reglas vigentes.
[ ] Cierre de sala es terminal.
[ ] Regresión de Ahorcado CS21A191 aprobada.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
state_revision por panel:
Latencias aplicadas:
Evidencia (capturas, registro Apps Script y métricas):
`);

  let version=text('VERSION.txt');
  for(const [key,value] of [
    ['VERSION','CS21A192'],
    ['STATUS','QA_CANDIDATE_NOT_FINAL'],
    ['PURPOSE','English LAB Memory Match authoritative synchronization QA candidate'],
    ['PACKAGE_BASE','CS21A191_FINALIZED'],
    ['QA_PORT','4192'],
    ['SOURCE_BRANCH',sourceBranch],
    ['SOURCE_HEAD_SHA',sourceHeadSha],
    ['FRONTEND_LAYER','F98.4-Z6-CS21A192'],
    ['BACKEND_LAYER','CS21A192-MM-CONSISTENCY-1'],
    ['APPS_SCRIPT_CHANGE','YES_QA_ONLY_REPLACE_COMPLETE_99_AFTER_98'],
    ['APPS_SCRIPT_INSTALL_MODE','SINGLE_COMPLETE_FILE_99_THROUGH_99O_AFTER_98'],
    ['APPS_SCRIPT_COMPLETE_FILE','BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs'],
    ['APPS_SCRIPT_INTERNAL_LAYER','BACKEND_QA/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs'],
    ['MEMORY_MATCH_SYNC_VERSION','CS21A192-MM-CONSISTENCY-1'],
    ['MEMORY_MATCH_STATE_REVISION','MONOTONIC'],
    ['MEMORY_MATCH_POLL_OWNER','SINGLE_RECURSIVE'],
    ['MEMORY_MATCH_READ_CACHE_MS','0'],
    ['MEMORY_MATCH_RECENT_STATE_CACHE','DISABLED'],
    ['MEMORY_MATCH_CACHE_EPOCH','CS21A192'],
    ['MEMORY_MATCH_BROWSER_CACHE_EPOCH','CS21A192'],
    ['MEMORY_MATCH_STYLE_CACHE_EPOCH','CS21A192'],
    ['MEMORY_MATCH_AUTHORITATIVE_ONLY','true'],
    ['MEMORY_MATCH_MISMATCH_REVEAL_MS','6000'],
    ['MEMORY_MATCH_POLL_TIMEOUT_MS','8000'],
    ['MEMORY_MATCH_EXPECTED_STATE_GUARD','true'],
    ['MEMORY_MATCH_FIRST_REVEAL_DEADLINE','AUTHORITATIVE'],
    ['MEMORY_MATCH_TERMINAL_POLL_STOP','true'],
    ['MEMORY_MATCH_LOAD_MODEL_MAX_PLAYERS','25'],
    ['MEMORY_MATCH_AUTHENTICATED_QA_STATUS','PENDING'],
  ]) version=setVersion(version,key,value);
  write('VERSION.txt',version.replace(/\s*$/,'')+'\n');

  writeManifest();
}

function verify(){
  for(const relative of [
    'ABRIR_CAMPUS_QA_CS21A192.cmd',
    'LEEME_PRIMERO_CS21A192.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A192.txt',
    'VERSION.txt','SHA256SUMS.txt','campus.html','serve.mjs',
    'src/app.jsx','src/runtime_config.js','src/english_lab_live.jsx','src/english_lab_ux_cs21a181.js',
    'src/english_lab_live_classic_sync_guard_cs21a189.js',
    'src/english_lab_live_authoritative_sync_guard_cs21a192.js',
    'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx',
    'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx',
    'src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html',
    'styles/english_lab_memory_match_cs21a173.css',
    'apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs',
    'apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
    'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
    'BACKEND_QA/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
    'BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
    '00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_SYNC_CS21A192.md',
  ]) assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta ${relative}`);

  const campus=text('campus.html');
  assert.match(campus,/english_lab_live_authoritative_sync_guard_cs21a192\.js\?v=F98\.4Z6CS21A192/);
  assert.match(campus,/english_lab_memory_match_cs21a173\.css\?v=CS21A192/);
  assert.ok(campus.indexOf(CS192_GUARD)>campus.indexOf(CS190_GUARD),'El guard CS21A192 debe quedar después de CS21A190.');
  assert.equal((campus.match(/english_lab_live_authoritative_sync_guard_cs21a192\.js/g)||[]).length,1,'El guard CS21A192 debe aparecer una sola vez.');

  assert.match(text('src/app.jsx'),/english_lab_live\.jsx\?v=F98\.4Z6CS21A192/);
  assert.match(text('src/runtime_config.js'),/english_lab_ux_cs21a181\.js\?v=F98\.4Z6CS21A192/);
  assert.match(text('src/english_lab_live_classic_sync_guard_cs21a189.js'),/memory_match_classic_sync_cs21a189\.jsx\?v=CS21A192/);
  assert.match(text('src/english_lab_live.jsx'),/EnglishLabMemoryMatchAuthoritativeSyncCS21A192/);
  assert.match(text('src/english_lab_ux_cs21a181.js'),/CS21A192/);
  assert.match(text('src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),/authoritativeOnly/);
  const adapter=text('src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx');
  assert.match(adapter,/data-authoritative-sync="true"/);
  assert.match(adapter,/const POLL_TIMEOUT_MS=8000;/);
  assert.match(adapter,/expected_state_revision:currentRevision\.stateRevision/);
  assert.match(adapter,/expected_turn_number:currentRevision\.turnNumber/);
  assert.match(adapter,/if\(!disposed&&!isTerminalState\(stateRef\.current\)\)\{/);
  assert.match(adapter,/data-live-terminal=\{isTerminalState\(state\)\?'true':'false'\}/);
  assert.match(text('src/english_lab_live_authoritative_sync_guard_cs21a192.js'),/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192\.jsx\?v=CS21A192/);
  assert.match(text('styles/english_lab_memory_match_cs21a173.css'),/box-sizing:border-box/);
  assert.match(text('styles/english_lab_memory_match_cs21a173.css'),/min-width:0/);

  const classicBackend=text('apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs');
  const internal=text('BACKEND_QA/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs');
  const complete=text('BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');
  assert.match(classicBackend,/_cs21a192ExpectedStateConflict_\(normalized, pkg, turnState\)/);
  assert.match(internal,/CS21A192-MM-CONSISTENCY-1/);
  assert.match(internal,/state_transition_busy/);
  assert.match(internal,/var CS21A192_MM_MAX_POLL_MS = 2200;/);
  assert.match(internal,/var CS21A192_MM_TESTED_LATENCY_MS = 2500;/);
  assert.match(internal,/var CS21A192_MM_REVEAL_MARGIN_MS = 1300;/);
  assert.match(internal,/expected_state_revision_guard:true/);
  assert.match(internal,/timeout_event_cache_invalidated:true/);
  assert.match(complete,/BLOQUE 15\/15: 99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192\.gs/);
  assert.match(complete,/CS21A192-MM-CONSISTENCY-1/);
  assert.match(complete,/_cs21a192ExpectedStateConflict_\(normalized, pkg, turnState\)/);
  assert.match(complete,/mismatch_reveal_ms:CS21A192_MM_MISMATCH_REVEAL_MS/);
  assert.equal(sha256(path.join(root,'apps_script_patches','99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs')),sha256(path.join(target,'apps_script_patches','99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs')),'99K modificado no coincide con la fuente empaquetada.');
  assert.equal(sha256(path.join(target,'apps_script_patches','99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs')),sha256(path.join(target,'BACKEND_QA','99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs')),'99O difiere entre trazabilidad y BACKEND_QA.');
  assert.equal(sha256(path.join(target,'apps_script_patches','99_CS21A183_SENTENCE_ORDER_COMPLETO.gs')),sha256(path.join(target,'BACKEND_QA','99_CS21A183_SENTENCE_ORDER_COMPLETO.gs')),'El archivo completo difiere entre trazabilidad y BACKEND_QA.');

  const readme=text('LEEME_PRIMERO_CS21A192.txt');
  assert.match(readme,/NO pegue 99O por separado/);
  assert.match(readme,/Ctrl\+A/);
  assert.match(readme,/CI y verificadores sintéticos NO sustituyen/);
  assert.doesNotMatch(readme,/pegue 99O debajo/i);
  const register=text('REGISTRO_PRUEBA_AUTENTICADA_CS21A192.txt');
  assert.match(register,/Desktop 1440x900/);
  assert.match(register,/Móvil 390x844/);
  assert.match(register,/Resultado final: PASS \/ FAIL \/ BLOCKED/);

  const version=text('VERSION.txt');
  for(const marker of [
    'VERSION=CS21A192','STATUS=QA_CANDIDATE_NOT_FINAL','PACKAGE_BASE=CS21A191_FINALIZED','QA_PORT=4192',
    'APPS_SCRIPT_INSTALL_MODE=SINGLE_COMPLETE_FILE_99_THROUGH_99O_AFTER_98',
    'APPS_SCRIPT_COMPLETE_FILE=BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
    'MEMORY_MATCH_SYNC_VERSION=CS21A192-MM-CONSISTENCY-1','MEMORY_MATCH_STATE_REVISION=MONOTONIC',
    'MEMORY_MATCH_POLL_OWNER=SINGLE_RECURSIVE','MEMORY_MATCH_READ_CACHE_MS=0',
    'MEMORY_MATCH_RECENT_STATE_CACHE=DISABLED','MEMORY_MATCH_BROWSER_CACHE_EPOCH=CS21A192',
    'MEMORY_MATCH_STYLE_CACHE_EPOCH=CS21A192',
    'MEMORY_MATCH_MISMATCH_REVEAL_MS=6000','MEMORY_MATCH_POLL_TIMEOUT_MS=8000',
    'MEMORY_MATCH_EXPECTED_STATE_GUARD=true','MEMORY_MATCH_FIRST_REVEAL_DEADLINE=AUTHORITATIVE',
    'MEMORY_MATCH_TERMINAL_POLL_STOP=true','MEMORY_MATCH_LOAD_MODEL_MAX_PLAYERS=25',
    'MEMORY_MATCH_AUTHENTICATED_QA_STATUS=PENDING',
  ]) assert.ok(version.includes(marker),`VERSION.txt no contiene ${marker}`);
  assert.match(text('ABRIR_CAMPUS_QA_CS21A192.cmd'),/127\.0\.0\.1:4192\/qa-setup\.html/);
  assert.match(text('serve.mjs'),/4192/);
  for(const stale of ['LEEME_PRIMERO_CS21A191.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A191.txt','ABRIR_CAMPUS_QA_CS21A191.cmd']){
    assert.equal(fs.existsSync(path.join(target,stale)),false,`El paquete conserva ${stale}.`);
  }

  const manifest=new Map();
  for(const line of text('SHA256SUMS.txt').trim().split(/\r?\n/)){
    const match=line.match(/^([0-9a-f]{64})  \.\/(.+)$/);
    assert.ok(match,`SHA inválida: ${line}`);
    assert.equal(manifest.has(match[2]),false,`Entrada duplicada en manifiesto: ${match[2]}`);
    manifest.set(match[2],match[1]);
  }
  const all=files();
  assert.equal(manifest.size,all.length,'El manifiesto debe cubrir cada archivo exactamente una vez.');
  for(const file of all){
    const relative=path.relative(target,file).split(path.sep).join('/');
    assert.equal(manifest.get(relative),sha256(file),`Hash inválido: ${relative}`);
  }

  console.log(JSON.stringify({
    ok:true,
    package:packageName,
    base:'CAMPUS_QA_CS21A191_CANDIDATO_HANGMAN_LIVE',
    version:'CS21A192',
    port:4192,
    authoritativeSync:true,
    stateRevision:'MONOTONIC',
    singlePollOwner:true,
    recentStateCache:false,
    mismatchRevealMs:6000,
    pollTimeoutMs:8000,
    expectedStateGuard:true,
    timeoutEventCacheInvalidated:true,
    firstRevealDeadline:'AUTHORITATIVE',
    terminalPollStop:true,
    loadModelMaxPlayers:25,
    backendCompleteOnly:true,
    authenticatedQa:'PENDING',
    files:all.length,
  },null,2));
}

if(!verifyOnly) build();
verify();
