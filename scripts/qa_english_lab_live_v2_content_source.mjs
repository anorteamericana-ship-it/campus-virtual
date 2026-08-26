import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceDir = path.join(root, 'AppsScript', 'EnglishLabLiveV2');
const context = vm.createContext({ console, Object, Array, JSON, String, Error, Number, Date, RegExp });
for (const name of ['20_ContentResolver.js', '26_ApolloContentSource.js']) {
  vm.runInContext(fs.readFileSync(path.join(sourceDir, name), 'utf8'), context, { filename: name });
}

const unitHeaders = [
  'LEVEL_ID', 'UNIT_ID', 'UNIT_NUMBER', 'UNIT_NAME', 'UNIT_OBJECTIVE_ES',
  'PROGRAM_TOPIC', 'SOURCE_REFERENCE', 'STATUS'
];
const bankHeaders = [
  'PLAY_ITEM_ID', 'SOURCE_ITEM_ID', 'LEVEL_ID', 'UNIT_ID', 'AREA_ID', 'TEMPLATE_ID',
  'ITEM_TYPE', 'STATUS', 'GAME_ID', 'PROMPT_ES', 'STEM', 'OPTION_A', 'OPTION_B',
  'OPTION_C', 'OPTION_D', 'CORRECT_OPTION', 'MATCH_LEFT', 'MATCH_RIGHT',
  'WORDS_TO_ORDER', 'CORRECT_SENTENCE', 'MINI_TEXT_OR_DIALOGUE', 'EXPLANATION_ES'
];

const units = [{
  LEVEL_ID: 'B1', UNIT_ID: 'B1-U01', UNIT_NUMBER: '1', UNIT_NAME: "What's your name?",
  UNIT_OBJECTIVE_ES: 'Presentarse y compartir información personal básica.',
  PROGRAM_TOPIC: 'Introductions', SOURCE_REFERENCE: 'Interchange Intro 5e', STATUS: 'ACTIVE'
}];

const bank = [];
for (let i = 1; i <= 5; i += 1) {
  bank.push({
    PLAY_ITEM_ID: `SO-${i}`, SOURCE_ITEM_ID: `SO-SRC-${i}`, LEVEL_ID: 'B1', UNIT_ID: 'B1-U01',
    AREA_ID: 'GRAM', TEMPLATE_ID: 'GRAM_02', ITEM_TYPE: 'ORDER', STATUS: 'ACTIVE',
    GAME_ID: 'B1-U01-GRAM-02', PROMPT_ES: 'Ordená la oración.', STEM: `Sentence ${i}`,
    WORDS_TO_ORDER: `name | is | my | learner${i}`, CORRECT_SENTENCE: `My name is learner${i}.`,
    EXPLANATION_ES: 'Orden natural de la oración.'
  });
}

const vocabWords = ['hello', 'goodbye', 'name', 'teacher', 'student'];
const vocabHints = ['hola', 'adiós', 'nombre', 'docente', 'estudiante'];
for (let i = 0; i < 5; i += 1) {
  bank.push({
    PLAY_ITEM_ID: `V1-${i + 1}`, SOURCE_ITEM_ID: `V1-SRC-${i + 1}`, LEVEL_ID: 'B1', UNIT_ID: 'B1-U01',
    AREA_ID: 'VOCAB', TEMPLATE_ID: 'VOCAB_01', ITEM_TYPE: 'MCQ', STATUS: 'ACTIVE',
    STEM: vocabWords[i], OPTION_A: vocabHints[i], OPTION_B: 'x', OPTION_C: 'y', OPTION_D: 'z',
    CORRECT_OPTION: 'A', PROMPT_ES: 'Elegí el significado.', EXPLANATION_ES: 'Vocabulario de unidad.'
  });
}
for (let i = 1; i <= 5; i += 1) {
  bank.push({
    PLAY_ITEM_ID: `V2-${i}`, SOURCE_ITEM_ID: `V2-SRC-${i}`, LEVEL_ID: 'B1', UNIT_ID: 'B1-U01',
    AREA_ID: 'VOCAB', TEMPLATE_ID: 'VOCAB_02', ITEM_TYPE: 'MATCH', STATUS: 'ACTIVE',
    MATCH_LEFT: i === 1 ? 'phone number' : `term${i}`, MATCH_RIGHT: i === 1 ? 'número de teléfono' : `pista${i}`
  });
}

const quizSpecs = [
  ['GRAM', 'GRAM_01', 'MCQ'],
  ['SPEAK', 'SPEAK_02', 'MCQ'],
  ['LISTEN', 'LISTEN_01', 'DIALOGUE_MCQ'],
  ['READ', 'READ_01', 'READING_MCQ']
];
for (const [area, template, type] of quizSpecs) {
  for (let i = 1; i <= 5; i += 1) {
    bank.push({
      PLAY_ITEM_ID: `Q-${area}-${i}`, SOURCE_ITEM_ID: `Q-SRC-${area}-${i}`, LEVEL_ID: 'B1', UNIT_ID: 'B1-U01',
      AREA_ID: area, TEMPLATE_ID: template, ITEM_TYPE: type, STATUS: 'ACTIVE',
      PROMPT_ES: 'Elegí la respuesta correcta.', STEM: `${area} question ${i}`,
      OPTION_A: 'answer', OPTION_B: 'b', OPTION_C: 'c', OPTION_D: 'd', CORRECT_OPTION: 'A',
      MINI_TEXT_OR_DIALOGUE: type === 'MCQ' ? '' : `${area} context ${i}`,
      EXPLANATION_ES: 'Explicación curricular.'
    });
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
function makeReader(unitRows = units, bankRows = bank, unitHeaderList = unitHeaders, bankHeaderList = bankHeaders) {
  return {
    readSheet(name) {
      if (name === 'CONFIG_UNIDADES') return { headers: clone(unitHeaderList), rows: clone(unitRows) };
      if (name === 'ACADEMIA_PLAY_BANK') return { headers: clone(bankHeaderList), rows: clone(bankRows) };
      throw new Error(`unexpected sheet ${name}`);
    }
  };
}

const source = context.ELV2_createApolloContentSource(makeReader());
const resolver = context.ELV2_createContentResolver(source);

const sentenceRef = context.ELV2_apolloContentRef('B1', 'B1-U01', 'SENTENCE_ORDER');
assert.equal(sentenceRef, 'APOLLO_PLAY_V1:B1:B1-U01:SENTENCE_ORDER');
const sentence = resolver.resolve(sentenceRef, 'SENTENCE_ORDER', {});
assert.equal(sentence.content_version, 'APOLLO_PLAY_V1');
assert.equal(sentence.content.content_type, 'SENTENCE_ORDER_SET');
assert.equal(sentence.content.items.length, 5);
assert.equal(sentence.content.curriculum.status, 'ACTIVE');
assert.equal(sentence.content.items[0].correct_sentence, 'My name is learner1.');

const vocabRef = context.ELV2_apolloContentRef('B1', 'B1-U01', 'VOCABULARY');
const hangman = resolver.resolve(vocabRef, 'HANGMAN', {});
const wordSearch = resolver.resolve(vocabRef, 'WORD_SEARCH', {});
assert.equal(hangman.content.content_type, 'VOCABULARY_SET');
assert.equal(hangman.content.items.length, 10);
assert.equal(wordSearch.content.items.length, 10);
assert.equal(wordSearch.content.items.find(item => item.label === 'phone number').hint_es, 'número de teléfono');
assert.equal(source.getByRef(vocabRef, 'QUIZ_TIME', {}), null, 'game/content kind mismatch must fail closed');

const quizRef = context.ELV2_apolloContentRef('B1', 'B1-U01', 'QUIZ_TIME');
const quiz = resolver.resolve(quizRef, 'QUIZ_TIME', {});
assert.equal(quiz.content.content_type, 'QUIZ_TIME_POOL');
assert.equal(quiz.content.items.length, 25);
for (const area of ['VOCAB', 'GRAM', 'SPEAK', 'LISTEN', 'READ']) {
  assert.equal(quiz.content.items.filter(item => item.area_id === area).length, 5);
}
assert.equal(quiz.content.items.find(item => item.area_id === 'LISTEN').mini_text_or_dialogue.startsWith('LISTEN context'), true);

assert.throws(() => context.ELV2_apolloContentRef('B1', 'B1-U17', 'VOCABULARY'), /ELV2_CONTENT_REF_INVALID/);
assert.throws(() => source.getByRef('APOLLO_PLAY_V1:B1:B2-U01:VOCABULARY', 'HANGMAN'), /ELV2_CONTENT_REF_INVALID/);

const missingStatusHeaders = unitHeaders.filter(header => header !== 'STATUS');
const missingStatusSource = context.ELV2_createApolloContentSource(makeReader(units, bank, missingStatusHeaders, bankHeaders));
assert.throws(() => missingStatusSource.getByRef(vocabRef, 'HANGMAN'), /ELV2_CURRICULUM_SCHEMA_INVALID/,
  'STATUS must be structurally required; missing header cannot imply ACTIVE');

const blankStatusUnits = clone(units);
blankStatusUnits[0].STATUS = '';
const blankStatusSource = context.ELV2_createApolloContentSource(makeReader(blankStatusUnits, bank));
assert.throws(() => blankStatusSource.getByRef(vocabRef, 'HANGMAN'), /ELV2_CURRICULUM_UNIT_NOT_AVAILABLE/,
  'blank unit status must not default to ACTIVE');

const duplicateUnits = clone(units);
duplicateUnits.push(clone(units[0]));
const duplicateUnitSource = context.ELV2_createApolloContentSource(makeReader(duplicateUnits, bank));
assert.throws(() => duplicateUnitSource.getByRef(vocabRef, 'WORD_SEARCH'), /ELV2_CURRICULUM_UNIT_NOT_AVAILABLE/,
  'duplicate active curricular units must fail closed');

const duplicateVocab = clone(bank);
const vocabRows = duplicateVocab.filter(row => row.TEMPLATE_ID === 'VOCAB_01');
vocabRows[1].SOURCE_ITEM_ID = vocabRows[0].SOURCE_ITEM_ID;
const duplicateVocabSource = context.ELV2_createApolloContentSource(makeReader(units, duplicateVocab));
assert.throws(() => duplicateVocabSource.getByRef(vocabRef, 'HANGMAN'), /ELV2_CURRICULUM_POOL_INVALID/,
  'duplicate source ids must fail closed');

const inactiveVocab = clone(bank);
inactiveVocab.find(row => row.TEMPLATE_ID === 'VOCAB_02').STATUS = '';
const inactiveVocabSource = context.ELV2_createApolloContentSource(makeReader(units, inactiveVocab));
assert.throws(() => inactiveVocabSource.getByRef(vocabRef, 'WORD_SEARCH'), /ELV2_CURRICULUM_POOL_INVALID/,
  'blank row status must not count as ACTIVE');

// Apps Script adapter is lazy and read-only: construction performs zero spreadsheet reads.
function matrix(headers, rows) {
  return [headers, ...rows.map(row => headers.map(header => row[header] ?? ''))];
}
const matrices = {
  CONFIG_UNIDADES: matrix(unitHeaders, units),
  ACADEMIA_PLAY_BANK: matrix(bankHeaders, bank)
};
let openCount = 0;
context.SpreadsheetApp = {
  openById(id) {
    assert.equal(id, 'APOLLO-STAGING-ID');
    openCount += 1;
    return {
      getSheetByName(name) {
        const values = matrices[name];
        if (!values) return null;
        return {
          getLastRow: () => values.length,
          getLastColumn: () => values[0].length,
          getRange: (row, col, numRows, numCols) => {
            assert.deepEqual([row, col, numRows, numCols], [1, 1, values.length, values[0].length]);
            return { getDisplayValues: () => clone(values) };
          }
        };
      }
    };
  }
};
const appsScriptSource = context.ELV2_createAppsScriptApolloContentSource('APOLLO-STAGING-ID');
assert.equal(openCount, 0, 'ContentSource construction must perform no spreadsheet read or write');
const lazyResolved = appsScriptSource.getByRef(sentenceRef, 'SENTENCE_ORDER', {});
assert.equal(lazyResolved.content.items.length, 5);
assert.equal(openCount, 2, 'resolution reads CONFIG_UNIDADES and ACADEMIA_PLAY_BANK only');

console.log(JSON.stringify({
  ok: true,
  version: 'E5',
  source: 'CONFIG_UNIDADES + ACADEMIA_PLAY_BANK',
  sentence_order_items: sentence.content.items.length,
  vocabulary_items: hangman.content.items.length,
  quiz_items: quiz.content.items.length,
  apps_script_lazy_reads: openCount,
  writes: 0
}));
