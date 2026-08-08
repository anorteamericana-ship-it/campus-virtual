#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/english_lab_games/hangman_engine_cs21a191.js', 'utf8');
const sandbox = { window:{} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, {filename:'hangman_engine_cs21a191.js'});
const h = sandbox.window.EnglishLabHangmanEngineCS21A191;

assert.ok(h, 'motor publicado');
assert.equal(h.VERSION, 'CS21A191');
assert.equal(h.GAME_ID, 'HANGMAN');
assert.equal(h.LETTERS.length, 26);
assert.equal(h.canonicalAnswer("  don't   worry  "), "DON'T WORRY");
assert.equal(h.canonicalAnswer('mother— in-law'), 'MOTHER- IN-LAW');
assert.deepEqual(Array.from(h.uniqueLetters('BOOK')), ['B','O','K']);
assert.equal(h.countOccurrences('BOOK', 'O'), 2);
assert.equal(h.scoreLetter('BOOK', 'O'), 20);
assert.equal(h.scoreSolve(6, 2), 140);
assert.equal(h.livesRemaining(6, 2), 4);
assert.equal(h.solvedByLetters('A-A', ['A']), true);
assert.equal(h.solvedByLetters('CHECK IN', ['C','H','E','K','I','N']), true);
assert.equal(h.solvedByLetters('CHECK IN', ['C','H','E','K','I']), false);

const hidden = h.buildMask("DON'T", []);
assert.equal(hidden.cells[3].kind, 'PUNCTUATION');
assert.equal(hidden.cells[3].value, "'");
assert.equal(hidden.cells.filter(c => c.kind === 'LETTER' && c.revealed).length, 0);
const revealed = h.buildMask('BOOK', ['O']);
assert.equal(revealed.cells.filter(c => c.value === 'O').length, 2);

const publicState = h.normalizePublicState({
  round_id:'LAB-1234-H1', index:1, total:5, clue:'A thing you read',
  display_pattern:'_ O O _', guessed_letters:['O'], wrong_letters:['X'],
  errors_used:1, max_errors:6, phase:'OPEN', completed:false,
  turn_state:{participation_policy:'RANDOM_PLAYER',active_player_id:'P1',turn_ends_at:new Date(Date.now()+10000).toISOString()}
});
assert.equal(publicState.clue, 'A thing you read');
assert.equal(publicState.livesRemaining, 5);
assert.deepEqual(Array.from(publicState.guessedLetters), ['O']);
assert.equal(h.canPlayerAct(publicState, {player_id:'P1'}), true);
assert.equal(h.canPlayerAct(publicState, {player_id:'P2'}), false);

console.log(JSON.stringify({
  ok:true,
  version:h.VERSION,
  canonical:true,
  punctuation_revealed:true,
  repeated_occurrences:true,
  score_letter:true,
  score_solve:true,
  turn_guard:true,
  mobile_keyboard_letters:h.LETTERS.length
}, null, 2));
