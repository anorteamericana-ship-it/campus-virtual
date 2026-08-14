#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('.');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const shellPath='src/english_lab_games/english_lab_unified_shell_cs21a205.jsx';
const stylePath='styles/english_lab_unified_shell_cs21a205.css';
const previewPath='src/english_lab_games/english_lab_unified_shell_preview_cs21a205.html';
const loaderPath='src/english_lab_live_canonical_loader_cs21a193.js';

for(const file of [shellPath,stylePath,previewPath,loaderPath]){
  assert.ok(fs.existsSync(path.join(root,file)),`Falta ${file}`);
}

const shell=read(shellPath);
const css=read(stylePath);
const preview=read(previewPath);
const loader=read(loaderPath);

assert.match(shell,/const VERSION='CS21A205'/,'El shell debe identificarse como CS21A205.');
assert.match(shell,/global\.EnglishLabUnifiedShellCS21A205/,'El shell debe publicar una API verificable.');
assert.match(css,/\.el205-shell\b/,'El CSS debe estar aislado bajo el namespace el205.');
assert.match(preview,/english_lab_unified_shell_cs21a205\.jsx\?v=CS21A205/,'El preview debe cargar el shell real, no una copia.');

const gamesBlock=shell.match(/const GAMES=Object\.freeze\(\[(.*?)\]\);\s*const GAME_IDS/s)?.[1]||'';
assert.ok(gamesBlock,'No se encontró el registro GAMES de CS21A205.');
const ids=[...gamesBlock.matchAll(/id:'([A-Z_]+)'/g)].map(match=>match[1]);
const expected=['MEMORY_MATCH','SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'];
assert.deepEqual(ids,expected,'El shell debe ofrecer exactamente los cinco juegos vigentes y en orden estable.');
assert.equal(new Set(ids).size,5,'No puede haber IDs de juego duplicados.');
for(const retired of ['VOCAB_SPRINT','WORD_MATCH','PHRASE_BUILDER','MINI_CHALLENGE','SURVIVAL_MISSION','LIVE_TRIVIA']){
  assert.equal(gamesBlock.includes(retired),false,`${retired} no debe aparecer como juego vigente del shell.`);
}

assert.match(shell,/Hangman\?\.HangmanTeacherView/,'Hangman debe reutilizar su vista docente real.');
assert.match(shell,/QuizGateway\?\.TeacherQuiz/,'Quiz Time debe reutilizar su vista docente real.');
assert.match(shell,/QuizGateway\?\.StudentQuiz/,'Quiz Time debe reutilizar su vista estudiante real.');
assert.match(shell,/WordGateway\?\.TeacherWordSearch/,'Word Search debe reutilizar su vista docente real.');
assert.match(shell,/WordGateway\?\.StudentWordSearch/,'Word Search debe reutilizar su vista estudiante real.');
assert.match(shell,/__cs21a183Base/,'Memory Match debe desenvolver la consola histórica de Sentence Order en vez de duplicarla.');
assert.match(shell,/__cs21a183SentenceWrapped=true/,'La asignación final debe respetar el hook histórico de Sentence Order.');

for(const forbidden of [
  'SpreadsheetApp',
  'PropertiesService',
  'google.script.run',
  'APPS_SCRIPT_URL',
  '/exec',
  'PLAY-4821',
  'Naty',
  'Chu',
]){
  assert.equal(shell.includes(forbidden),false,`El shell frontend no debe contener ${forbidden}.`);
}
assert.equal(/\bfetch\s*\(/.test(shell),false,'El shell no debe crear una nueva ruta de red paralela.');

const sentence='src/english_lab_sentence_order_cs21a183.js?v=CS21A205';
const quizGateway='src/english_lab_games/english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198';
const wordGateway='src/english_lab_games/english_lab_word_search_gateway_cs21a200.jsx?v=CS21A200';
const unified='src/english_lab_games/english_lab_unified_shell_cs21a205.jsx?v=CS21A205';
for(const source of [sentence,quizGateway,wordGateway,unified]){
  assert.ok(loader.includes(`'${source}'`),`El manifest canónico debe incluir ${source}`);
}
assert.ok(loader.indexOf(sentence)<loader.indexOf(quizGateway),'Sentence Order debe instalarse antes del gateway Quiz para que LegacyTeacher/LegacyStudent capturen el wrapper correcto.');
assert.ok(loader.indexOf(quizGateway)<loader.indexOf(wordGateway),'Quiz gateway debe preceder Word Search gateway.');
assert.ok(loader.indexOf(wordGateway)<loader.indexOf(unified),'El shell final debe instalarse después de los gateways directos.');
assert.match(loader,/const VERSION = 'F98\.4-Z6-CS21A205'/,'El loader debe identificar la convergencia CS21A205.');
assert.match(loader,/const CACHE_EPOCH = 'CS21A205'/,'El cache epoch del shell sigue siendo CS21A205.');
assert.match(loader,/const LATENCY_SAFE_EPOCH = 'CS21A211'/,'El loader debe aceptar el Memory Match latency-safe vigente CS21A211.');
assert.match(loader,/const INTENT_EPOCH = 'CS21A213'/,'El loader debe exigir el intento idempotente vigente CS21A213.');
assert.match(loader,/global\.EnglishLabMemoryMatchClassicSyncCS21A189\.latencySafeVersion === LATENCY_SAFE_EPOCH/,'compatibility() debe comprobar el epoch Memory Match vigente.');
assert.match(loader,/global\.EnglishLabMemoryMatchClassicSyncCS21A189\.intentVersion === INTENT_EPOCH/,'compatibility() debe comprobar el intento idempotente vigente.');
assert.match(loader,/global\.EnglishLabSentenceOrderCS21A183/,'compatibility() debe exigir Sentence Order.');
assert.match(loader,/global\.EnglishLabUnifiedShellCS21A205/,'compatibility() debe exigir el shell final.');
assert.match(loader,/sentenceOrder:true/,'La API del loader debe declarar Sentence Order.');
assert.match(loader,/unifiedShell:true/,'La API del loader debe declarar el shell unificado.');

const report={
  ok:true,
  version:'CS21A211-SHELL-COMPAT-1',
  shellVersion:'CS21A205',
  games:ids,
  sentence_before_quiz_gateway:true,
  shell_after_word_search_gateway:true,
  memory_latency_safe_epoch:'CS21A211',
  memory_intent_epoch:'CS21A213',
  canonical_manifest_preserved:true,
  network_path_added:false,
  apps_script_logic_added:false,
};
console.log(JSON.stringify(report,null,2));
