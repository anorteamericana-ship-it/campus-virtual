#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const packageName='CAMPUS_QA_CS21A197_CANDIDATO_MEMORY_MATCH_SPECTATOR_REVEAL';
const target=path.join(root,'dist',packageName);
const verifyOnly=process.argv.includes('--verify');

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function replaceExact(file,oldText,newText,label){const source=fs.readFileSync(file,'utf8');assert.ok(source.includes(oldText),`No se encontro ${label} en ${path.relative(root,file)}`);fs.writeFileSync(file,source.replace(oldText,newText),'utf8');}
function allFiles(){const out=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())walk(abs);else if(entry.name!=='SHA256SUMS.txt')out.push(abs);}};walk(target);return out.sort((a,b)=>a.localeCompare(b));}
function writeManifest(){fs.writeFileSync(path.join(target,'SHA256SUMS.txt'),allFiles().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n','utf8');}

const timingOld=`    // CS21A197: iniciar el reveal despues de persistir la respuesta del intento.\n    now = new Date();\n\n    var durationMs = Number(pkg.rules && pkg.rules.round_duration_ms || 30000) || 30000;`;
const revealOld=`      revealUntil = new Date(now.getTime() + CS21A189_MM_MISMATCH_REVEAL_MS);`;
const revealNew=`      revealUntil = new Date(now.getTime() + Math.max(\n        Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,\n        Number(CS21A197_MM_SPECTATOR_REVEAL_MS || 0) || 0\n      ));`;
const rulesOld=`    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;\n    pkg.rules = pkg.rules && typeof pkg.rules === 'object' ? pkg.rules : {};\n    pkg.rules.mismatch_reveal_ms = Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0;\n    pkg.rules.spectator_reveal_ms = pkg.rules.mismatch_reveal_ms;\n    pkg.turn_state = nextTurn;`;
const rulesNew=`    pkg.version = CS21A189_MM_CLASSIC_SYNC_VERSION;\n    pkg.rules = pkg.rules && typeof pkg.rules === 'object' ? pkg.rules : {};\n    pkg.rules.mismatch_reveal_ms = Math.max(\n      Number(CS21A189_MM_MISMATCH_REVEAL_MS || 0) || 0,\n      Number(CS21A197_MM_SPECTATOR_REVEAL_MS || 0) || 0\n    );\n    pkg.rules.spectator_reveal_ms = pkg.rules.mismatch_reveal_ms;\n    pkg.turn_state = nextTurn;`;

const timerOld=`  function Timer({remainingMs,durationMs,waiting,syncingTurn}) {
    const duration=Math.max(1,Number(durationMs)||1);
    const pct=Math.max(0,Math.min(100,(remainingMs/duration)*100));
    const seconds=Math.max(0,Math.ceil(remainingMs/1000));
    const label=syncingTurn?'Sincronizando turno':waiting?'Cambio de turno':'Tiempo';
    return <div className={\`elmm-timer \${(waiting||syncingTurn)?'is-transition':''}\`} role="timer" aria-label={syncingTurn?'Sincronizando cambio de turno':waiting?'Cambio de turno':\`\${seconds} segundos restantes\`}>
      <div className="elmm-timer-copy"><span>{label}</span><strong>{(waiting||syncingTurn)?'…':\`\${seconds}s\`}</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:syncingTurn?'0%':waiting?'100%':\`\${pct}%\`}}/></div>
    </div>;
  }`;
const timerNew=`  function Timer({remainingMs,durationMs,waiting,syncingTurn,revealWaiting}) {
    const duration=Math.max(1,Number(durationMs)||1);
    const pct=Math.max(0,Math.min(100,(remainingMs/duration)*100));
    const seconds=Math.max(0,Math.ceil(remainingMs/1000));
    const transition=!!(waiting||syncingTurn||revealWaiting);
    const label=revealWaiting?'Cartas':syncingTurn?'Sincronizando turno':waiting?'Cambio de turno':'Tiempo';
    const aria=revealWaiting?\`Pareja visible, \${seconds} segundos para memorizar\`:syncingTurn?'Sincronizando cambio de turno':waiting?'Cambio de turno':\`\${seconds} segundos restantes\`;
    const value=revealWaiting?\`\${seconds}s\`:(syncingTurn||waiting)?'…':\`\${seconds}s\`;
    const fillWidth=syncingTurn?'0%':revealWaiting?\`\${pct}%\`:waiting?'100%':\`\${pct}%\`;
    return <div className={\`elmm-timer \${transition?'is-transition':''}\`} role="timer" aria-label={aria} data-reveal-waiting={revealWaiting?'true':'false'}>
      <div className="elmm-timer-copy"><span>{label}</span><strong>{value}</strong></div>
      <div className="elmm-timer-track"><div className="elmm-timer-fill" style={{width:fillWidth}}/></div>
    </div>;
  }`;
const timerCallOld=`      <Timer remainingMs={timerRemainingMs} durationMs={timerDurationMs} waiting={waitingForFlipback || turnStartsIn>0} syncingTurn={syncingTurn}/>`;
const timerCallNew=`      <Timer remainingMs={timerRemainingMs} durationMs={timerDurationMs} waiting={turnStartsIn>0} revealWaiting={waitingForFlipback} syncingTurn={syncingTurn}/>`;

function finalize(){
  assert.equal(fs.existsSync(target),true,`Falta ${packageName}. Ejecuta patch_qa_package_cs21a197.mjs primero.`);
  for(const relative of ['apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','BACKEND_QA/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs']){
    const file=path.join(target,relative);
    if(!fs.existsSync(file))continue;
    const source=fs.readFileSync(file,'utf8');
    assert.ok(source.includes(timingOld),'El source CS197 debe conservar el refresh temporal.');
    if(source.includes(revealOld))replaceExact(file,revealOld,revealNew,'reveal runtime CS197');
    const afterReveal=fs.readFileSync(file,'utf8');
    if(afterReveal.includes(rulesOld))replaceExact(file,rulesOld,rulesNew,'rules runtime CS197');
  }
  const classicFile=path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx');
  assert.equal(fs.existsSync(classicFile),true,'Falta componente classic sync en candidato.');
  const classic=fs.readFileSync(classicFile,'utf8');
  if(classic.includes(timerOld))replaceExact(classicFile,timerOld,timerNew,'Timer reveal countdown');
  const afterTimer=fs.readFileSync(classicFile,'utf8');
  if(afterTimer.includes(timerCallOld))replaceExact(classicFile,timerCallOld,timerCallNew,'Timer call revealWaiting');
  writeManifest();
}

function verify(){
  assert.equal(fs.existsSync(target),true,`Falta ${packageName}.`);
  const backendFile=path.join(target,'BACKEND_QA/99_CS21A197_MEMORY_MATCH_SPECTATOR_REVEAL_COMPLETO.gs');
  assert.equal(fs.existsSync(backendFile),true,'Falta backend completo CS197.');
  const backend=fs.readFileSync(backendFile,'utf8');
  assert.match(backend,/CS21A197_MM_SPECTATOR_REVEAL_MS = 8500/);
  assert.match(backend,/revealUntil = new Date\(now\.getTime\(\) \+ Math\.max\([\s\S]*CS21A197_MM_SPECTATOR_REVEAL_MS/);
  assert.match(backend,/pkg\.rules\.mismatch_reveal_ms = Math\.max\([\s\S]*CS21A197_MM_SPECTATOR_REVEAL_MS/);
  assert.match(backend,/var CS21A192_MM_MISMATCH_REVEAL_MS = CS21A192_MM_MAX_POLL_MS \+[\s\S]*CS21A192_MM_REVEAL_MARGIN_MS/);
  assert.doesNotMatch(backend,/CS21A189_MM_MISMATCH_REVEAL_MS = Math\.max\([\s\S]{0,180}CS21A197_MM_SPECTATOR_REVEAL_MS/,'CS197 no debe mutar el contrato historico global.');
  for(const relative of ['apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','BACKEND_QA/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs']){
    const file=path.join(target,relative);if(!fs.existsSync(file))continue;
    const source=fs.readFileSync(file,'utf8');
    assert.match(source,/revealUntil = new Date\(now\.getTime\(\) \+ Math\.max\([\s\S]*CS21A197_MM_SPECTATOR_REVEAL_MS/);
    assert.match(source,/pkg\.rules\.mismatch_reveal_ms = Math\.max\([\s\S]*CS21A197_MM_SPECTATOR_REVEAL_MS/);
  }
  const classic=fs.readFileSync(path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),'utf8');
  assert.match(classic,/function Timer\(\{remainingMs,durationMs,waiting,syncingTurn,revealWaiting\}\)/);
  assert.match(classic,/const label=revealWaiting\?'Cartas'/);
  assert.match(classic,/const value=revealWaiting\?`\$\{seconds\}s`/);
  assert.match(classic,/const fillWidth=syncingTurn\?'0%'\:revealWaiting\?/);
  assert.match(classic,/data-reveal-waiting=\{revealWaiting\?'true':'false'\}/);
  assert.match(classic,/revealWaiting=\{waitingForFlipback\}/);
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.match(version,/MISMATCH_REVEAL_MS=8500/);
  assert.match(version,/APPS_SCRIPT_INSTALL_MODE=REPLACE_QA_COMPLETE_FILE_AND_VERSION_SAME_DEPLOYMENT/);
  const manifest=fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);
  for(const line of manifest){const match=line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);assert.ok(match,`Manifest invalido: ${line}`);assert.equal(sha256(path.join(target,match[2])),match[1],`Hash invalido: ${match[2]}`);}
  console.log(JSON.stringify({ok:true,packageName,files:manifest.length,historicalRevealMs:6000,spectatorRevealMs:8500,historicalContractPreserved:true,revealCountdownVisible:true,revealCountdownOverridesTurnWait:true},null,2));
}

if(!verifyOnly)finalize();
verify();
