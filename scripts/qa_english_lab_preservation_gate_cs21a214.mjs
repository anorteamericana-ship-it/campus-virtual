import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const academia = read('src/academia_play.jsx');
const app = read('src/app.jsx');
const shell = read('src/english_lab_games/english_lab_unified_shell_cs21a205.jsx');

const failures = [];
const passes = [];

function expect(label, condition, detail = '') {
  if (condition) passes.push(label);
  else failures.push(`${label}${detail ? ` · ${detail}` : ''}`);
}
function has(text, needle) { return text.includes(needle); }

const FREE_GAMES = [
  ['vocabulary', 'Vocabulary Sprint'],
  ['word_match', 'Word Match'],
  ['daily', 'Daily Challenge'],
  ['phrase_builder', 'Phrase Builder'],
  ['survival_english', 'Survival English'],
];
for (const [id, title] of FREE_GAMES) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`id:\\s*['\"]${id}['\"][\\s\\S]{0,420}?title:\\s*['\"]${escapedTitle}['\"][\\s\\S]{0,520}?status:\\s*['\"]free['\"]`);
  expect(`free game preserved: ${title}`, re.test(academia));
}
expect('free-user detector preserved', has(academia, 'function apEsUsuarioGratis('));

const TEMPLATES = {
  VOCAB_01: 'Vocabulary Sprint',
  VOCAB_02: 'Word Match',
  GRAM_01: 'Grammar Fix',
  GRAM_02: 'Sentence Order',
  SPEAK_01: 'Phrase Builder',
  SPEAK_02: 'Response Builder',
  LISTEN_01: 'Listening Choice',
  LISTEN_02: 'Listen & Match',
  READ_01: 'Reading Flash',
  READ_02: 'Detail Hunter',
  MIX_01: 'Mini Challenge',
  MIX_02: 'Survival Mission',
};
for (const [template, label] of Object.entries(TEMPLATES)) {
  expect(
    `unit template preserved: ${template} → ${label}`,
    has(academia, `${template}:'${label}'`) || has(academia, `${template}: '${label}'`),
  );
}

expect('four canonical levels preserved', has(academia, "const AP_LEVEL_ORDER = ['B1', 'B2', 'I1', 'I2']"));
expect('16-unit progress builder preserved', /Array\.from\(\{\s*length\s*:\s*16\s*\}/.test(academia));
expect('unit IDs remain LEVEL-U01..U16', /'\-U'\s*\+\s*String\(i\s*\+\s*1\)\.padStart\(2,\s*'0'\)/.test(academia));
expect('unit progress function preserved', has(academia, 'function apBuildUnitProgress('));

expect('bank catalog endpoint preserved', has(academia, "apPost('academiaPlayBankCatalog'"));
expect('bank card adapter preserved', has(academia, 'function apBankGameToCard('));
expect('bank flow adapter preserved', has(academia, 'function apFlowFromBankGame('));
expect('MATCH → local match adapter preserved', /if\s*\(itemType\s*===\s*['\"]MATCH['\"]\)[\s\S]{0,260}?kind\s*:\s*['\"]match['\"]/.test(academia));
expect('ORDER → local order adapter preserved', /if\s*\(itemType\s*===\s*['\"]ORDER['\"]\)[\s\S]{0,260}?kind\s*:\s*['\"]order['\"]/.test(academia));
expect('fallback choice adapter preserved', /kind\s*:\s*['\"]choice['\"][\s\S]{0,260}?questions\s*:\s*safeItems\.map/.test(academia));

for (const field of ['game_id', 'unit_id', 'play_item_id']) {
  expect(`curricular identity field referenced: ${field.toUpperCase()}`, has(academia.toLowerCase(), field));
}

expect('practice remains formative, not official grade', /no genera nota oficial/i.test(academia));

const LIVE_GAMES = [
  ['MEMORY_MATCH', 'Memory Match'],
  ['SENTENCE_ORDER', 'Sentence Order'],
  ['HANGMAN', 'Hangman'],
  ['QUIZ_TIME', 'Quiz Time'],
  ['WORD_SEARCH', 'Word Search'],
];
for (const [id, label] of LIVE_GAMES) {
  expect(`live game preserved: ${label}`, has(shell, `id:'${id}'`) && has(shell, `label:'${label}'`));
}
expect('unified live shell still exposes all five canonical game IDs', LIVE_GAMES.every(([id]) => has(shell, id)));

expect('free prospect still routes to AcademiaPlayView', /academia_play:\s*esProspectoGratis[\s\S]{0,260}?AcademiaPlayView/.test(app));
expect('matriculated student still routes to EnglishLabLiveStudentView', /academia_play:\s*esProspectoGratis[\s\S]{0,520}?EnglishLabLiveStudentView/.test(app));
expect('direct english_lab_live route preserved', /english_lab_live:\s*<LazyRoute[\s\S]{0,180}?EnglishLabLiveStudentView/.test(app));
expect('Academia Play lazy source preserved', has(app, "academia_play: ['src/academia_play.jsx"));
expect('English LAB canonical live loader preserved', has(app, 'F96_ENGLISH_LAB_LIVE_CS21A193'));

console.log('English LAB preservation gate CS21A214');
console.log(`PASS ${passes.length}`);
passes.forEach(item => console.log(`  ✓ ${item}`));
if (failures.length) {
  console.error(`FAIL ${failures.length}`);
  failures.forEach(item => console.error(`  ✗ ${item}`));
  process.exit(1);
}
console.log('RESULT=PASS · no-loss contract intact');
