#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const packageName='CAMPUS_QA_CS21A196_CANDIDATO_MEMORY_MATCH_CONFLICT_RECONCILIATION';
const target=path.join(root,'dist',packageName);
const verifyOnly=process.argv.includes('--verify');

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function replaceExact(file,oldText,newText,label){
  const source=fs.readFileSync(file,'utf8');
  assert.ok(source.includes(oldText),`No se encontró ${label} en ${path.relative(root,file)}`);
  fs.writeFileSync(file,source.replace(oldText,newText),'utf8');
}
function allFiles(){
  const out=[];
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())walk(abs);else if(entry.name!=='SHA256SUMS.txt')out.push(abs);}};
  walk(target);return out.sort((a,b)=>a.localeCompare(b));
}
function writeManifest(){
  const lines=allFiles().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`);
  fs.writeFileSync(path.join(target,'SHA256SUMS.txt'),lines.join('\n')+'\n','utf8');
}
function setVersion(source,key,value){
  const cleaned=source.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'').replace(/\s*$/,'');
  return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');
}

function finalize(){
  assert.equal(fs.existsSync(target),true,`Falta ${packageName}. Ejecutá patch_qa_package_cs21a196.mjs primero.`);
  const adapter=path.join(target,'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx');
  const classic=path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx');

  // CS194 debe conservar su UX: mientras sólo la primera carta espera ACK,
  // la segunda permanece elegible. El bloqueo global mutationBusy era demasiado
  // amplio; el bloqueo correcto después del segundo click ya lo proveen
  // syncing + pairPendingRef durante toda la promesa que incluye el retry CS196.
  replaceExact(adapter,
    '        authoritativeOnly={true}\n        mutationBusy={busy}\n        onReady={props.onReady}',
    '        authoritativeOnly={true}\n        onReady={props.onReady}',
    'retiro mutationBusy global');

  replaceExact(classic,
`    const authoritativeBusy=!!(props&&props.mutationBusy);
    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !authoritativeBusy && !(props&&props.readOnly);`,
`    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !(props&&props.readOnly);`,
    'restaurar canPlay CS194');
  replaceExact(classic,
    'if(!canPlay || authoritativeBusy || pairPendingRef.current || syncing || isClaimed(shared,card) || waitingForFlipback) return;',
    'if(!canPlay || pairPendingRef.current || syncing || isClaimed(shared,card) || waitingForFlipback) return;',
    'restaurar guard click CS194');
  replaceExact(classic,
    '},[canPlay,authoritativeBusy,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction]);',
    '},[canPlay,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction]);',
    'restaurar dependencias CS194');
  replaceExact(classic,
    'disabled={!canPlay||authoritativeBusy||syncing||waitingForFlipback||(serverFirstId===card.id)}',
    'disabled={!canPlay||syncing||waitingForFlipback||(serverFirstId===card.id)}',
    'restaurar disabled CS194');

  let version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  version=setVersion(version,'PACKAGE_REVISION','2');
  version=setVersion(version,'FIRST_ACK_SECOND_PICK_PRESERVED','YES');
  version=setVersion(version,'PAIR_PENDING_LOCK_THROUGH_RETRY','YES');
  fs.writeFileSync(path.join(target,'VERSION.txt'),version.replace(/\s*$/,'')+'\n','utf8');
  writeManifest();
}

function verify(){
  const adapter=fs.readFileSync(path.join(target,'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx'),'utf8');
  const classic=fs.readFileSync(path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),'utf8');
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.doesNotMatch(adapter,/mutationBusy=\{busy\}/,'No debe existir bloqueo global de primera carta.');
  assert.doesNotMatch(classic,/authoritativeBusy/,'No debe existir authoritativeBusy en el tablero final.');
  assert.match(adapter,/upper\(received\.error\)==='STATE_CONFLICT'/,'Debe conservar retry CS196.');
  assert.match(classic,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s,'pairPending debe quedar protegido por interaction epoch.');
  assert.match(version,/PACKAGE_REVISION=2/);
  assert.match(version,/FIRST_ACK_SECOND_PICK_PRESERVED=YES/);
  assert.match(version,/PAIR_PENDING_LOCK_THROUGH_RETRY=YES/);
  const manifest=fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);
  for(const line of manifest){
    const match=line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);assert.ok(match,`Manifest inválido: ${line}`);
    assert.equal(sha256(path.join(target,match[2])),match[1],`Hash inválido: ${match[2]}`);
  }
  console.log(JSON.stringify({
    ok:true,packageName,revision:2,files:manifest.length,
    firstAckSecondPickPreserved:true,pairPendingLockThroughRetry:true,
  },null,2));
}

if(!verifyOnly)finalize();
verify();
