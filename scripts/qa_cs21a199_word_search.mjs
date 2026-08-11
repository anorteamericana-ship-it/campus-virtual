#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const context=vm.createContext({console,Date,Math,JSON,Object,Array,String,Number,Boolean,Error,Set,Map});
context.window=context;
vm.runInContext(fs.readFileSync(path.join(root,'src/english_lab_games/word_search_curriculum_contract_cs21a199.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'src/english_lab_games/word_search_engine_cs21a199.js'),'utf8'),context);
const C=context.EnglishLabWordSearchCurriculumCS21A199;
const E=context.EnglishLabWordSearchEngineCS21A199;
assert.ok(C&&E,'No cargaron contrato/motor CS21A199');

const rows=[
  ['001','hello','hola'],['002','goodbye','adiós'],['003','name','nombre'],['004','teacher','profesor/a'],['005','student','estudiante']
].map(([id,word,hint])=>({LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:'VOCAB_01',ITEM_TYPE:'MCQ',STATUS:'ACTIVE',PLAY_ITEM_ID:`P1-${id}`,SOURCE_ITEM_ID:`VOC-B1-U01-${id}`,STEM:word,OPTION_A:hint,CORRECT_OPTION:'A'})).concat([
  ['006','phone number','número de teléfono'],['007','email','correo electrónico'],['008','zero','cero'],['009','please','por favor'],['010','thanks','gracias']
].map(([id,word,hint])=>({LEVEL_ID:'B1',UNIT_ID:'B1-U01',AREA_ID:'VOCAB',TEMPLATE_ID:'VOCAB_02',ITEM_TYPE:'MATCH',STATUS:'ACTIVE',PLAY_ITEM_ID:`P2-${id}`,SOURCE_ITEM_ID:`VOC-B1-U01-${id}`,MATCH_LEFT:word,MATCH_RIGHT:hint})));

const validation=C.validatePool(rows);
assert.equal(validation.ok,true,JSON.stringify(validation));
assert.equal(validation.count,10);
const vocabulary=C.vocabularyFromRows(rows);
assert.equal(vocabulary.length,10);
assert.equal(vocabulary.find(w=>w.label==='phone number')?.gridWord,'PHONENUMBER');
assert.equal(new Set(vocabulary.map(w=>w.sourceItemId)).size,10);

for(let seed=1;seed<=120;seed+=1){
  const puzzle=E.buildPuzzle(vocabulary,`CS199-SEED-${seed}`);
  assert.equal(puzzle.size,14);
  assert.equal(puzzle.words.length,10);
  assert.equal(puzzle.grid.length,14);
  puzzle.grid.forEach(row=>{assert.equal(row.length,14);assert.match(row.join(''),/^[A-Z]{14}$/);});
  for(const word of puzzle.words){
    const occurrence=E.occurrences(puzzle.grid,word.gridWord);
    assert.equal(occurrence.length,1,`${word.label} debe aparecer exactamente una vez en seed ${seed}`);
    const solution=puzzle.solutions[word.wordId];
    assert.ok(solution,`Falta solución ${word.wordId}`);
    assert.equal(E.lettersAt(puzzle.grid,solution.cells),word.gridWord);
    const direct=E.matchSelection(puzzle,solution.cells,[]);
    assert.equal(direct?.wordId,word.wordId);
    const reverse=E.matchSelection(puzzle,[...solution.cells].reverse(),[]);
    assert.equal(reverse?.wordId,word.wordId,'La selección inversa del mismo trazo debe aceptarse');
  }
  const pub=E.publicPuzzle(puzzle);
  assert.equal(Object.prototype.hasOwnProperty.call(pub,'solutions'),false,'El puzzle público no debe publicar coordenadas solución');
}

const puzzle=E.buildPuzzle(vocabulary,'ACTION-CHECK');
const first=puzzle.words[0],solution=puzzle.solutions[first.wordId];
const action=E.buildClaimAction(puzzle,first,solution.cells,'ACT-001');
assert.equal(action.action,'CLAIM_WORD');
assert.equal(action.word_id,first.wordId);
assert.equal(action.puzzle_id,puzzle.puzzleId);
assert.equal(E.lineBetween({row:0,col:0},{row:2,col:1}).length,0,'No se debe aceptar una línea torcida');
assert.deepEqual(JSON.parse(JSON.stringify(E.lineBetween({row:0,col:0},{row:3,col:3}))),[{row:0,col:0},{row:1,col:1},{row:2,col:2},{row:3,col:3}]);

console.log(JSON.stringify({ok:true,version:'CS21A199-WORD-SEARCH-CORE-1',unit:'B1-U01',words:10,grid:'14x14',seeds_tested:120,unique_occurrence:true,reverse_trace:true,public_solution_coordinates_hidden:true,apps_script_change:false},null,2));
