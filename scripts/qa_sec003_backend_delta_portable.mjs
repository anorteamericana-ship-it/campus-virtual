import fs from 'node:fs';

const path = 'qa/sec003_codegs_live_auth_delta.patch';
const patch = fs.readFileSync(path, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};

const hunkCount = (patch.match(/^@@ /gm) || []).length;
check('delta has exactly seven hunks', hunkCount === 7, `observed=${hunkCount}`);
check('delta targets only Code.gs', /^--- Code\.gs$/m.test(patch) && /^\+\+\+ Code\.gs\.sec003$/m.test(patch));

const required = [
  'function _eliveRoomForPlayer_(room)',
  'function _eliveAuthStudent_(body)',
  'function _eliveStudentCanRoom_(auth, room)',
  'function _elivePlayerBodyFromSession_(body, auth)',
  'function _eliveAuthRoomViewer_(body, room)',
  'function englishLabLiveJoinRoom(body)',
  'function englishLabLiveGetPlayerState(body)',
  'function englishLabLiveSubmitAnswer(body)',
  'englishLabLiveSubmitAnswer = function(body)',
  'function englishLabLiveGetLeaderboard(body)',
  'function englishLabLiveGetQuestionBankMeta(body)',
  'room:_eliveRoomForPlayer_(room)',
  'room:_eliveRoomForPlayer_(found.row)',
];
for (const marker of required) check(`required marker: ${marker}`, patch.includes(marker));

const forbidden = [
  'englishLabMemoryMatch',
  'MEMORY_MATCH',
  'Memory Match',
  'memory_match',
];
for (const marker of forbidden) check(`Memory Match boundary excludes: ${marker}`, !patch.includes(marker));

const changedFunctionLines = patch
  .split(/\r?\n/)
  .filter(line => /^[+-](?![+-])/.test(line))
  .join('\n');
check('player identity comes from session code', changedFunctionLines.includes('player_id:auth.codigo') && changedFunctionLines.includes('cod_estudiante:auth.codigo'));
check('open player state switches away from raw room projection', changedFunctionLines.includes('-  return { ok:true, version:ELIVE_CS20B_VERSION') && changedFunctionLines.includes('+  return { ok:true, version:ELIVE_CS20B_VERSION'));
check('join authenticates before sheet initialization', patch.indexOf('+  var auth = _eliveAuthStudent_(body); if (!auth.ok) return auth;') < patch.indexOf('+  _eliveEnsureSheets_();'));
check('question bank auth is added before setup seed', patch.includes('+  var auth = _eliveAuthTeacher_(body); if (!auth.ok) return auth;'));

if (failures.length) {
  console.error(`SEC003 BACKEND DELTA PORTABILITY: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC003 BACKEND DELTA PORTABILITY: PASS');
