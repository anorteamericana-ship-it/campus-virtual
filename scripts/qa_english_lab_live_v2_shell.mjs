import fs from 'node:fs';
import vm from 'node:vm';

const shellPath = 'src/english_lab_live_v2.jsx';
const lazyPath = 'src/lazy_loader.jsx';
const appPath = 'src/app.jsx';
const babelPath = 'vendor/babel.js';

const shell = fs.readFileSync(shellPath, 'utf8');
const lazy = fs.readFileSync(lazyPath, 'utf8');
const app = fs.readFileSync(appPath, 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(`E10 shell guard: ${message}`);
}
function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

assert(shell.includes("const API_VERSION = 'english_lab_live.v2'"), 'missing exact v2 API version');
assert(shell.includes("window.EnglishLabLiveTeacherView=TeacherView"), 'teacher component not published');
assert(shell.includes("window.EnglishLabLiveStudentView=StudentView"), 'student component not published');
assert(shell.includes("window.getSessionToken"), 'Campus session token is not used');
assert(shell.includes("'Content-Type':'text/plain;charset=utf-8'"), 'transport must avoid browser CORS preflight');

const gameIds = ['SENTENCE_ORDER', 'HANGMAN', 'QUIZ_TIME', 'WORD_SEARCH'];
for (const id of gameIds) {
  assert(shell.includes(`id:'${id}'`), `production game missing: ${id}`);
}
assert((shell.match(/\{ id:'(?:SENTENCE_ORDER|HANGMAN|QUIZ_TIME|WORD_SEARCH)'/g) || []).length === 4,
  'visible production catalog must contain exactly four games');

const legacyFns = [
  'englishLabLiveCreateRoom', 'englishLabLiveJoinRoom', 'englishLabLiveGetState',
  'englishLabLiveStartRoom', 'englishLabLiveOpenRound', 'englishLabLiveSubmitAnswer',
  'VOCAB_SPRINT', 'WORD_MATCH', 'PHRASE_BUILDER', 'MINI_CHALLENGE', 'SURVIVAL_MISSION'
];
for (const token of legacyFns) assert(!shell.includes(token), `legacy token leaked into v2 shell: ${token}`);

for (const forbidden of ['student_id', 'teacher_id', 'player_name', 'cod_estudiante', 'correct_answer']) {
  assert(!shell.includes(forbidden), `browser shell must not send/own reserved identity or answer field: ${forbidden}`);
}
assert(!/payload\s*:\s*\{[^}]*\brole\s*:/s.test(shell), 'browser payload must not supply role');
assert(!/payload\s*:\s*\{[^}]*\bcapabilities\s*:/s.test(shell), 'browser payload must not supply capabilities');

for (const action of ['createRoom','joinRoom','getState','startRoom','prepareRound','openRound','lockRound','revealRound','submitAttempt','closeRound','closeRoom']) {
  assert(shell.includes(`'${action}'`) || shell.includes(`'${action}',`), `lifecycle action missing: ${action}`);
}
assert(shell.includes("action_type:'SUBMIT_ORDER'"), 'Sentence Order attempt contract missing');
assert(shell.includes("action_type:'GUESS_LETTER'"), 'Hangman attempt contract missing');
assert(shell.includes("action_type:'SUBMIT_QUIZ'"), 'Quiz Time attempt contract missing');
assert(shell.includes("action_type:'CLAIM_PATH'"), 'Word Search attempt contract missing');

assert(shell.includes('APOLLO_PLAY_V1:'), 'Apollo content_ref builder missing');
assert(shell.includes("kind:'SENTENCE_ORDER'"), 'Sentence Order Apollo kind missing');
assert(count(shell, "kind:'VOCABULARY'") === 2, 'Hangman and Word Search must use vocabulary Apollo kind');
assert(shell.includes("kind:'QUIZ_TIME'"), 'Quiz Time Apollo kind missing');

assert(shell.includes('@media (max-width:420px)'), '390-ish mobile breakpoint missing');
assert(shell.includes('grid-template-columns:repeat(14,minmax(0,1fr))'), '14-column Word Search responsive grid missing');
assert(shell.includes('min-height:44px'), 'mobile touch target guard missing');

assert(lazy.includes("return 'src/english_lab_live_v2.jsx?v=ELV2E10-20260826'"), 'lazy loader does not route English LAB Live to v2 shell');
assert(lazy.includes('/^src\\/english_lab_live\\.jsx'), 'legacy shell normalization hook missing');
assert(app.includes("english_lab_live: ['src/english_lab_live.jsx"), 'existing app route contract unexpectedly changed');
assert(app.includes('component=\"EnglishLabLiveTeacherView\"'), 'teacher route missing');
assert(app.includes('component=\"EnglishLabLiveStudentView\"'), 'student route missing');

// Compile the exact JSX with the same vendored Babel Standalone and options used by lazy_loader.jsx.
// This catches syntax/plugin incompatibilities that text guards alone cannot see.
const babelSource = fs.readFileSync(babelPath, 'utf8');
const sandbox = { console, setTimeout, clearTimeout };
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.global = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
try {
  vm.runInContext(babelSource, sandbox, { filename: babelPath, timeout: 15000 });
} catch (error) {
  throw new Error(`E10 shell guard: vendored Babel failed to initialize: ${error && error.message ? error.message : error}`);
}
assert(sandbox.Babel && typeof sandbox.Babel.transform === 'function', 'vendored Babel.transform unavailable');
let compiled = '';
try {
  compiled = sandbox.Babel.transform(shell, {
    presets: ['react'],
    plugins: ['transform-block-scoping']
  }).code;
} catch (error) {
  throw new Error(`E10 shell guard: JSX compile failed with Campus Babel config: ${error && error.message ? error.message : error}`);
}
assert(compiled.includes('EnglishLabLiveTeacherView'), 'compiled shell lost teacher export');
assert(compiled.includes('EnglishLabLiveStudentView'), 'compiled shell lost student export');

console.log('E10 PASS · visible English LAB LIVE v2 shell, four-game catalog, auth transport, mobile guard and Campus Babel compile');
