#!/usr/bin/env node
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const assembler=path.join(root,'scripts/assemble_apps_script_cs21a212_unified.mjs');
const patch=path.join(root,'apps_script_patches/99X_MEMORY_MATCH_LATENCY_SAFE_FAST_TURN_QA_CS21A212.gs');
const target=path.join(root,'apps_script_patches/99_CS21A212_ENGLISH_LAB_UNIFIED_COMPLETO.gs');
for(const file of [assembler,patch]) assert.equal(fs.existsSync(file),true,`Falta ${path.relative(root,file)}`);

execFileSync(process.execPath,[assembler],{cwd:root,stdio:'inherit'});
assert.equal(fs.existsSync(target),true,'No se generó backend CS21A212.');
const backend=fs.readFileSync(target,'utf8');
const finalPatch=fs.readFileSync(patch,'utf8');

assert.match(finalPatch,/CS21A212_MM_INITIAL_TURN_MS = 15000/);
assert.match(finalPatch,/CS21A212_MM_MIN_SECOND_PICK_MS = 15000/);
assert.match(finalPatch,/CS21A212_MM_PAIR_REVEAL_MS = 3000/);
assert.match(finalPatch,/if \(phase !== 'FIRST_REVEALED'\)/,'CS212 debe restaurar early-return por fase');
assert.match(finalPatch,/Math\.max\(currentEndMs \|\| 0, requiredEndMs\)/,'CS212 nunca puede reducir el deadline actual');
assert.match(finalPatch,/requiredEndMs = revealedMs \+ CS21A212_MM_MIN_SECOND_PICK_MS/,'la segunda ventana nace del revealed_at autoritativo');
assert.match(finalPatch,/_cs21a212FirstRevealEffectiveDeadlineMs_/,'debe existir deadline efectivo del intento FIRST_REVEALED');
assert.match(finalPatch,/if \(protectedUntil && nowMs < protectedUntil\) return false/,'CS192 no puede rotar mientras FIRST_REVEALED siga vigente');
assert.match(finalPatch,/_cs21a192TransitionNeeded_\.__cs21a212FirstRevealProtected = true/);

const cs211Pos=backend.indexOf("CS21A211_MM_FAST_TURN_VERSION = 'CS21A211-MM-10S-3S-1'");
const cs212Pos=backend.lastIndexOf("CS21A212_MM_VERSION = 'CS21A212-MM-LATENCY-SAFE-15S-ACK-1'");
assert.ok(cs211Pos>=0&&cs212Pos>cs211Pos,'La capa final CS212 debe quedar después de CS211.');
assert.match(backend,/revealUntil = new Date\(now\.getTime\(\) \+ CS21A211_MM_PAIR_REVEAL_MS\);/,'mismatch runtime sigue fijado a 3 s por CS211');
assert.match(backend,/_cs21a186MmContinueSamePlayer_\(turnState, now, durationMs, 'PAIR_MATCHED_CONTINUE'\)/,'MATCH conserva jugador');
assert.match(backend,/_elive176NextTurn_\(turnState, revealUntil, durationMs, 'PAIR_MISMATCH_AFTER_FLIPBACK'\)/,'MISMATCH rota al terminar reveal');

function timeline({pollAgeMs,humanMs,discoverMs,pairThinkMs,pairMs}){
  const start=0;
  const initialEnd=start+15000;
  const firstClick=pollAgeMs+humanMs;
  const serverReveal=firstClick+discoverMs;
  const firstAccepted=serverReveal<initialEnd;
  const safeEnd=Math.max(initialEnd,serverReveal+15000);
  const secondClick=serverReveal+pairThinkMs;
  const pairArrives=secondClick+pairMs;
  const pairAccepted=pairArrives<safeEnd;
  return {pollAgeMs,humanMs,discoverMs,pairThinkMs,pairMs,initialEnd,firstClick,serverReveal,safeEnd,secondClick,pairArrives,firstAccepted,pairAccepted};
}

const latency3=timeline({pollAgeMs:2200,humanMs:600,discoverMs:3000,pairThinkMs:250,pairMs:3000});
const latency8=timeline({pollAgeMs:2200,humanMs:600,discoverMs:8000,pairThinkMs:250,pairMs:8000});
assert.equal(latency3.firstAccepted,true);
assert.equal(latency3.pairAccepted,true);
assert.equal(latency8.firstAccepted,true,'15 s iniciales deben tolerar poll 2.2 s + humano + backend 8 s');
assert.equal(latency8.pairAccepted,true,'15 s desde server reveal deben tolerar segunda llamada de 8 s');

const old10FirstArrival=2200+600+8000;
assert.ok(old10FirstArrival>10000,'El modelo debe demostrar por qué 10 s iniciales no cubren la latencia observada.');

for(const marker of [
  "ELCS201_VERSION = 'CS21A201-CURRICULUM-SOURCE-1'",
  "ELWS200_VERSION = 'CS21A200-WORD-SEARCH-LIVE-1'",
  "ELQ198_OPTION_BALANCE_VERSION = 'CS21A198-QUIZ-TIME-B1U01-2'",
  'function englishLabWordSearchClaimWordCS21A200',
  'function englishLabQuizTimeAnswerCS21A198'
]) assert.ok(backend.includes(marker),`CS212 perdió componente del stack: ${marker}`);

const tmp='/tmp/cs21a212-backend-check.js';
fs.writeFileSync(tmp,backend,'utf8');
execFileSync(process.execPath,['--check',tmp],{stdio:'inherit'});

console.log(JSON.stringify({
  ok:true,
  verdict:'PASS_CS21A212_MEMORY_MATCH_LATENCY_SAFE_BACKEND',
  version:'CS21A212-MM-LATENCY-SAFE-15S-ACK-1',
  initialTurnMs:15000,
  secondPickFromServerRevealMs:15000,
  mismatchRevealMs:3000,
  deadlineNeverReduced:true,
  firstRevealOnly:true,
  firstRevealProtectedFromTimeout:true,
  scenarios:{latency3,latency8},
  old10sWouldMissFirstDiscoverAtMs:old10FirstArrival,
  preserves:['SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH']
},null,2));
