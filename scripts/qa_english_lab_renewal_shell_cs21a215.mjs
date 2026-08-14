import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const hub=read('src/english_lab_hub_cs21a215.jsx');
const hubStyle=read('src/english_lab_hub_style_cs21a215.js');
const loader=read('src/english_lab_live_canonical_loader_cs21a193.js');
const shell=read('src/english_lab_games/english_lab_unified_shell_cs21a205.jsx');
const practice=read('src/academia_play.jsx');
const app=read('src/app.jsx');
const sounds=read('assets/sounds/README_SONIDOS.md');
const roadmap=read('00_DOCUMENTACION/ROADMAP_VISUAL_PRIORIZADO.md');
const inventory=read('00_DOCUMENTACION/ENGLISH_LAB_RENEWAL_INVENTORY_CS21A214.md');
const legacyBrand=['Academia','Play'].join(' ');
const legacyBrandRe=new RegExp(legacyBrand,'i');

const failures=[];
const passes=[];
function expect(label,condition,detail=''){
  if(condition) passes.push(label);
  else failures.push(`${label}${detail?` · ${detail}`:''}`);
}
function has(text,needle){return text.includes(needle);}

expect('hub version CS21A215',has(hub,"const VERSION='CS21A215'"));
for(const label of ['Practicar & Competir','Jugar en equipos','Clase en vivo']){
  expect(`hub mode visible: ${label}`,has(hub,label));
}
expect('practice reuses existing curricular surface',has(hub,'const PracticeView=global.AcademiaPlayView'));
expect('student class surface is wrapped, not rewritten',has(hub,'const LegacyStudent=global.EnglishLabLiveStudentView'));
expect('teacher class surface is wrapped, not rewritten',has(hub,'const LegacyTeacher=global.EnglishLabLiveTeacherView'));
expect('hub does not implement a new transport',!has(hub,'fetch(') && !has(hub,'APPS_SCRIPT_URL'));
expect('shared Memory is explicitly quarantined',has(hub,'sharedMemoryQuarantined:true') && /Memory Match compartido:[\s\S]{0,260}?conserva íntegro en código[\s\S]{0,260}?fuera de la nueva entrada/.test(hub));
expect('new live entry avoids defaulting to shared Memory',has(hub,"onLive('HANGMAN')") && has(hub,"setGame('HANGMAN')"));
expect('hub style hides shared Memory tab inside renewed live surface',has(hubStyle,'.el215-live-wrap .el205-game-grid button:first-child{display:none!important}'));

for(const game of ['Hangman · Equipos','Quiz Time','Taboo','Categories Battle','Vocabulary Bingo','Conversation Cards']){
  expect(`team catalogue visible: ${game}`,has(hub,game));
}
for(const planned of ['Taboo','Categories Battle','Vocabulary Bingo','Conversation Cards']){
  const pattern=new RegExp(planned.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[\\s\\S]{0,420}?Próximamente');
  expect(`planned team game is not overdeclared: ${planned}`,pattern.test(hub));
}

expect('loader epoch updated to CS21A215',has(loader,"const VERSION = 'F98.4-Z6-CS21A215'") && has(loader,"const CACHE_EPOCH = 'CS21A215'"));
const pShell=loader.indexOf('english_lab_unified_shell_cs21a205.jsx');
const pPractice=loader.indexOf("src/academia_play.jsx?v=CS21A215");
const pStyle=loader.indexOf('english_lab_hub_style_cs21a215.js?v=CS21A215');
const pHub=loader.indexOf('english_lab_hub_cs21a215.jsx?v=CS21A215');
expect('loader keeps existing class shell before renewal hub',pShell>=0 && pShell<pPractice);
expect('loader adds curricular practice before hub',pPractice>pShell && pPractice<pStyle);
expect('loader adds hub style before hub component',pStyle>pPractice && pStyle<pHub);
expect('renewal hub is last manifest entry',/english_lab_hub_cs21a215\.jsx\?v=CS21A215',\s*\n\s*\]\);/.test(loader));
expect('loader compatibility requires CS21A215 wrappers',has(loader,"global.EnglishLabLiveStudentView.__cs21a215EnglishLabHub === true") && has(loader,"global.EnglishLabLiveTeacherView.__cs21a215EnglishLabHub === true"));
expect('loader publishes renewal hub epoch',has(loader,"renewalHubEpoch:'CS21A215'"));

const LIVE_GAMES=['MEMORY_MATCH','SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH'];
for(const id of LIVE_GAMES) expect(`existing class engine preserved: ${id}`,has(shell,`id:'${id}'`));
expect('Memory engine remains preserved in legacy shell',has(shell,"MEMORY_MATCH:typeof MemoryTeacher") && has(shell,"MEMORY_MATCH:typeof LegacyStudentCurrent"));

const FREE_GAMES=['vocabulary','word_match','daily','phrase_builder','survival_english'];
for(const id of FREE_GAMES) expect(`free practice preserved: ${id}`,new RegExp(`id:\\s*['\"]${id}['\"][\\s\\S]{0,700}?status:\\s*['\"]free['\"]`).test(practice));
for(const template of ['VOCAB_01','VOCAB_02','GRAM_01','GRAM_02','SPEAK_01','SPEAK_02','LISTEN_01','LISTEN_02','READ_01','READ_02','MIX_01','MIX_02']){
  expect(`unit template preserved: ${template}`,has(practice,template));
}
expect('four levels preserved',has(practice,"const AP_LEVEL_ORDER = ['B1', 'B2', 'I1', 'I2']"));
expect('16 units preserved',/Array\.from\(\{\s*length\s*:\s*16\s*\}/.test(practice));
expect('bank endpoint preserved',has(practice,"apPost('academiaPlayBankCatalog'"));
expect('curricular IDs preserved',['GAME_ID','UNIT_ID','PLAY_ITEM_ID'].every(key=>practice.toUpperCase().includes(key)));

for(const [name,text] of [
  ['app',app],['practice',practice],['class shell',shell],['hub',hub],['hub style',hubStyle],['loader',loader],
  ['sounds README',sounds],['visual roadmap',roadmap],['renewal inventory',inventory],
]){
  expect(`legacy visible brand absent from ${name}`,!legacyBrandRe.test(text));
}
expect('official product name present',/English LAB/.test(hub) && /English LAB/.test(practice));

console.log('English LAB renewal shell gate CS21A215');
console.log(`PASS ${passes.length}`);
passes.forEach(item=>console.log(`  ✓ ${item}`));
if(failures.length){
  console.error(`FAIL ${failures.length}`);
  failures.forEach(item=>console.error(`  ✗ ${item}`));
  process.exit(1);
}
console.log('RESULT=PASS · English LAB hub + no-loss + branding contract intact');
