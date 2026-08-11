#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseName='CAMPUS_QA_CS21A196_CANDIDATO_MEMORY_MATCH_CONFLICT_RECONCILIATION';
const packageName='CAMPUS_QA_CS21A197_CANDIDATO_MEMORY_MATCH_SPECTATOR_REVEAL';
const base=path.join(root,'dist',baseName);
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const testMergeSha=process.env.TEST_MERGE_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'fix/cs21a197-memory-match-spectator-reveal';
const verifyOnly=process.argv.includes('--verify');

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function write(relative,value){const out=path.join(target,relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,value,'utf8');}
function copy(relative,destination=relative){const source=path.join(root,relative);assert.equal(fs.existsSync(source),true,`Falta ${relative}`);const out=path.join(target,destination);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(source,out);}
function setVersion(source,key,value){const cleaned=source.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'').replace(/\s*$/,'');return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');}
function replaceExact(relative,oldText,newText,label){const file=path.join(target,relative);assert.equal(fs.existsSync(file),true,`Falta ${relative}`);const source=fs.readFileSync(file,'utf8');assert.ok(source.includes(oldText),`No se encontro ${label} en ${relative}`);fs.writeFileSync(file,source.replace(oldText,newText),'utf8');}
function files(){const out=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())walk(abs);else if(entry.name!=='SHA256SUMS.txt')out.push(abs);}};walk(target);return out.sort((a,b)=>a.localeCompare(b));}
function writeManifest(){write('SHA256SUMS.txt',files().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n');}

function patchFrontend(){
  const adapter='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx';
  replaceExact(adapter,
`  function pollBackoffMs(baseMs,failures){`,
`  function transientAttemptPhase(state){
    const source=state&&typeof state==='object'?state:{};
    const pkg=packageFrom(source)||{};
    const attempt=pkg.shared_state&&pkg.shared_state.active_attempt||source.shared_state&&source.shared_state.active_attempt||null;
    return upper(attempt&&attempt.phase);
  }
  function pollMsForState(state){
    const source=state&&typeof state==='object'?state:{};
    const normal=pollMsForPlayers(base.participantCount(source,packageFrom(source)));
    const phase=transientAttemptPhase(source);
    if(phase==='FIRST_REVEALED'||phase==='MISMATCH_REVEAL') return Math.max(250,Math.round(normal/2));
    return normal;
  }
  function pollBackoffMs(baseMs,failures){`,'transient poll helper');
  replaceExact(adapter,
`      function delayForCurrent(){const current=stateRef.current||{};return pollMsForPlayers(base.participantCount(current,packageFrom(current)));}`,
`      function delayForCurrent(){const current=stateRef.current||{};return pollMsForState(current);}`,'transient poll scheduling');
  replaceExact(adapter,
`    const pollMs=pollMsForPlayers(playersOnline);`,
`    const pollMs=pollMsForPlayers(playersOnline);
    const currentPollMs=pollMsForState(state);`,'current poll metric');
  replaceExact(adapter,
`      data-live-poll-ms={pollMs}
      data-live-poll-timeout-ms={POLL_TIMEOUT_MS}`,
`      data-live-poll-ms={pollMs}
      data-live-current-poll-ms={currentPollMs}
      data-live-poll-timeout-ms={POLL_TIMEOUT_MS}`,'current poll data attribute');
  replaceExact(adapter,
`    livePollMsForPlayers:pollMsForPlayers,
    pollBackoffMs,`,
`    livePollMsForPlayers:pollMsForPlayers,
    livePollMsForState:pollMsForState,
    pollBackoffMs,`,'poll state API');

  const classic='src/english_lab_games/memory_match_classic_sync_cs21a189.jsx';
  replaceExact(classic,
`    const transitionText=waitingForFlipback ? 'No coinciden · memorízalas antes de que se cierren' : '';`,
`    const revealSeconds=waitingForFlipback?Math.max(1,Math.ceil(Number(reveal.remainingMs||0)/1000)):0;
    const revealRuleMs=Math.max(1,Number(packageInput&&packageInput.rules&&(packageInput.rules.spectator_reveal_ms||packageInput.rules.mismatch_reveal_ms)||8500)||8500);
    const timerRemainingMs=waitingForFlipback?Math.max(0,Number(reveal.remainingMs||0)):remainingMs;
    const timerDurationMs=waitingForFlipback?revealRuleMs:normalized.rules.roundDurationMs;
    const transitionText=waitingForFlipback ? \`No coinciden · memorízalas · se cierran en \${revealSeconds}s\` : '';`,'readable reveal countdown');
  replaceExact(classic,
`      <Timer remainingMs={remainingMs} durationMs={normalized.rules.roundDurationMs} waiting={waitingForFlipback || turnStartsIn>0} syncingTurn={syncingTurn}/>`,
`      <Timer remainingMs={timerRemainingMs} durationMs={timerDurationMs} waiting={waitingForFlipback || turnStartsIn>0} syncingTurn={syncingTurn}/>`,'reveal timer source');
  replaceExact(classic,
`    return <section className="elmm-shell elmm-classic-sync" data-game-engine="MEMORY_MATCH" data-classic-sync="true" data-version={VERSION} data-latency-safe-version={LATENCY_SAFE_VERSION}>`,
`    return <section className="elmm-shell elmm-classic-sync" data-game-engine="MEMORY_MATCH" data-classic-sync="true" data-version={VERSION} data-latency-safe-version={LATENCY_SAFE_VERSION} data-spectator-reveal-ms={revealRuleMs}>`,'spectator reveal data');

  const css='styles/english_lab_memory_match_classic_sync_cs21a189.css';
  const cssFile=path.join(target,css);
  const cssSource=fs.readFileSync(cssFile,'utf8').replace(/\s*$/,'');
  fs.writeFileSync(cssFile,`${cssSource}\n/* CS21A197 · giro visual rapido: la red manda, la animacion no agrega espera. */\n.elmm-classic-sync .elmm-card-inner{transition:transform .20s cubic-bezier(.2,.75,.25,1)}\n`,'utf8');
}

function patchBackendSources(){
  const timingOld=`    });\n\n    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;`;
  const timingNew=`    });\n\n    // CS21A197: iniciar el reveal despues de persistir la respuesta del intento.\n    now = new Date();\n\n    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;`;
  const rulesOld=`    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;\n    pkg.turn_state = nextTurn;`;
  const rulesNew=`    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;\n    pkg.rules = pkg.rules && typeof pkg.rules === 'object' ? pkg.rules : {};\n    pkg.rules.mismatch_reveal_ms = Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0;\n    pkg.rules.spectator_reveal_ms = pkg.rules.mismatch_reveal_ms;\n    pkg.turn_state = nextTurn;`;
  for(const relative of ['apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','BACKEND_QA/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs']){
    const file=path.join(target,relative);if(!fs.existsSync(file))continue;
    replaceExact(relative,timingOld,timingNew,'commit aligned reveal');
    replaceExact(relative,rulesOld,rulesNew,'spectator reveal rules');
  }
}

function build(){
  assert.equal(fs.existsSync(base),true,`Falta paquete base ${baseName}.`);
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(base,target,{recursive:true});
  for(const name of fs.readdirSync(target)){
    if(name==='SHA256SUMS.txt'||/^(?:LEEME_PRIMERO|REGISTRO_PRUEBA_AUTENTICADA|ABRIR_CAMPUS_QA)_CS21A\d+/i.test(name))fs.rmSync(path.join(target,name),{recursive:true,force:true});
  }
  fs.rmSync(path.join(target,'EVIDENCIA_AUTOMATICA'),{recursive:true,force:true});

  patchFrontend();
  patchBackendSources();
  copy('apps_script_patches/99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs');
  copy('apps_script_patches/99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs','BACKEND_QA/99S_MEMORY_MATCH_SPECTATOR_REVEAL_QA_CS21A197.gs');
  copy('apps_script_patches/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs');
  copy('apps_script_patches/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs','BACKEND_QA/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs');
  copy('00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_SPECTATOR_REVEAL_CS21A197.md');

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A196.cmd');
  assert.equal(fs.existsSync(oldLauncher),true,'Falta launcher CS21A196.');
  write('ABRIR_CAMPUS_QA_CS21A197.cmd',fs.readFileSync(oldLauncher,'utf8').replaceAll('4196','4197').replaceAll('CS21A196','CS21A197'));
  let serve=fs.readFileSync(path.join(base,'serve.mjs'),'utf8');
  assert.match(serve,/4196/,'serve.mjs base no usa puerto 4196.');
  write('serve.mjs',serve.replaceAll('4196','4197'));

  write('LEEME_PRIMERO_CS21A197.txt',`CAMPUS QA CS21A197 - MEMORY MATCH SPECTATOR REVEAL\n====================================================\n\n- QA aislada, no produccion.\n- Base exacta CS21A196 final.\n- Conserva el bloqueo de tercera carta y la segunda seleccion latency-safe.\n- El mismatch dispone de 8.5 s desde el commit de la pareja, no desde el inicio lento del submit.\n- Durante FIRST_REVEALED/MISMATCH_REVEAL el polling entra en rafaga sin requests simultaneos.\n- La animacion de giro baja de 420 ms a 200 ms.\n- Instalar BACKEND_QA/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs solo despues del PASS automatico.\n- Versionar el MISMO deployment QA y conservar el mismo /exec.\n- Cerrar 4196 y ejecutar ABRIR_CAMPUS_QA_CS21A197.cmd en puerto 4197.\n- Crear sala NUEVA con docente + Naty + Chu.\n- No usar Actualizar manual.\n`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A197.txt',`REGISTRO QA CS21A197\n======================\nEstado inicial: PENDIENTE\nSala:\n[ ] Backend CS21A197-MM-SPECTATOR-REVEAL-1\n[ ] 2 participantes antes de iniciar\n[ ] primera carta publica en los tres\n[ ] segunda carta aparece rapidamente en observador y docente\n[ ] mismatch visible y legible en los tres\n[ ] countdown de reveal usa la ventana de cartas\n[ ] tercera carta imposible durante resolucion\n[ ] match +1 conserva turno\n[ ] cero refresh manual\nResultado: PASS / FAIL / BLOCKED\n`);

  let version=fs.readFileSync(path.join(base,'VERSION.txt'),'utf8');
  for(const [key,value] of [
    ['VERSION','CS21A197'],['PACKAGE_REVISION','1'],['STATUS','QA_CANDIDATE_NOT_FINAL'],
    ['PURPOSE','Memory Match spectator reveal timing QA candidate'],['PACKAGE_BASE',baseName],['QA_PORT','4197'],
    ['SOURCE_BRANCH',sourceBranch],['SOURCE_HEAD_SHA',sourceHeadSha],['TEST_MERGE_SHA',testMergeSha],
    ['FRONTEND_LAYER','CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL'],['BACKEND_LAYER','CS21A197-MM-SPECTATOR-REVEAL-1'],
    ['APPS_SCRIPT_CHANGE','YES_QA_ONLY'],['APPS_SCRIPT_ACTION','INSTALL_COMPLETE_CS21A197_QA_FILE_AFTER_AUTOMATED_PASS'],
    ['APPS_SCRIPT_INSTALL_MODE','REPLACE_QA_COMPLETE_FILE_AND_VERSION_SAME_DEPLOYMENT'],
    ['APPS_SCRIPT_COMPLETE_FILE','BACKEND_QA/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs'],
    ['MEMORY_MATCH_SYNC_BASE','CS21A196-MM-CONFLICT-RECONCILIATION-1'],
    ['MEMORY_MATCH_SPECTATOR_REVEAL_VERSION','CS21A197-MM-SPECTATOR-REVEAL-1'],
    ['MISMATCH_REVEAL_MS','8500'],['TRANSIENT_POLL_FLOOR_MS','250'],['CARD_FLIP_ANIMATION_MS','200'],
    ['MEMORY_MATCH_AUTHENTICATED_QA_STATUS','PENDING_CS21A197'],
  ])version=setVersion(version,key,value);
  write('VERSION.txt',version.replace(/\s*$/,'')+'\n');
  writeManifest();
}

function verify(){
  for(const relative of ['VERSION.txt','SHA256SUMS.txt','serve.mjs','ABRIR_CAMPUS_QA_CS21A197.cmd','LEEME_PRIMERO_CS21A197.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A197.txt','src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx','src/english_lab_games/memory_match_classic_sync_cs21a189.jsx','styles/english_lab_memory_match_classic_sync_cs21a189.css','BACKEND_QA/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs'])assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta en paquete: ${relative}`);
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.match(version,/VERSION=CS21A197/);assert.match(version,/QA_PORT=4197/);assert.match(version,/BACKEND_LAYER=CS21A197-MM-SPECTATOR-REVEAL-1/);assert.match(version,/APPS_SCRIPT_INSTALL_MODE=REPLACE_QA_COMPLETE_FILE_AND_VERSION_SAME_DEPLOYMENT/);
  const backend=fs.readFileSync(path.join(target,'BACKEND_QA/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs'),'utf8');
  assert.match(backend,/CS21A197_MM_SPECTATOR_REVEAL_VERSION = 'CS21A197-MM-SPECTATOR-REVEAL-1'/);assert.match(backend,/CS21A197_MM_SPECTATOR_REVEAL_MS = 8500/);assert.match(backend,/CS21A197: el reloj del resultado empieza DESPUES/);
  const adapter=fs.readFileSync(path.join(target,'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx'),'utf8');
  const classic=fs.readFileSync(path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),'utf8');
  const css=fs.readFileSync(path.join(target,'styles/english_lab_memory_match_classic_sync_cs21a189.css'),'utf8');
  assert.match(adapter,/function pollMsForState\(state\)/);assert.match(adapter,/return Math\.max\(250,Math\.round\(normal\/2\)\)/);assert.match(adapter,/data-live-current-poll-ms=\{currentPollMs\}/);
  assert.match(classic,/se cierran en \$\{revealSeconds\}s/);assert.match(classic,/data-spectator-reveal-ms=\{revealRuleMs\}/);assert.match(classic,/timerRemainingMs/);
  assert.match(css,/transition:transform \.20s/);
  const manifest=fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);
  for(const line of manifest){const match=line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);assert.ok(match,`Manifest invalido: ${line}`);assert.equal(sha256(path.join(target,match[2])),match[1],`Hash invalido: ${match[2]}`);}
  console.log(JSON.stringify({ok:true,packageName,files:manifest.length,port:4197,backend:'CS21A197-MM-SPECTATOR-REVEAL-1',spectatorRevealMs:8500,transientPollFloorMs:250,flipMs:200},null,2));
}

if(!verifyOnly)build();
verify();
