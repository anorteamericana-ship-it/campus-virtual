import fs from 'node:fs';
import vm from 'node:vm';

const backendArg = process.argv.slice(2).find(x => x.startsWith('--backend='));
if (!backendArg) {
  console.error('Usage: node scripts/qa_sec003_english_lab_live_backend_candidate.mjs --backend=/path/to/Code.gs');
  process.exit(2);
}
const backendPath = backendArg.slice('--backend='.length);
if (!fs.existsSync(backendPath)) {
  console.error(`Backend not found: ${backendPath}`);
  process.exit(2);
}
const source = fs.readFileSync(backendPath, 'utf8');
const failures = [];
const check = (name, ok, detail='') => {
  if (ok) console.log(`PASS ${name}`);
  else { failures.push(name); console.error(`FAIL ${name}${detail ? ` · ${detail}` : ''}`); }
};
function between(start, end, from=0) {
  const s = source.indexOf(start, from);
  const e = source.indexOf(end, s + start.length);
  if (s < 0 || e < 0) throw new Error(`Missing scope: ${start} -> ${end}`);
  return source.slice(s, e);
}

const player = between('function _eliveQuestionForPlayer_(room){', 'var _cs20cDoPostBase_ = doPost;');
const effectiveSubmit = between('englishLabLiveSubmitAnswer = function(body){', 'function englishLabLiveGetLeaderboard(body){');
const leaderboard = between('function englishLabLiveGetLeaderboard(body){', 'var _cs20dDoPostBase_ = doPost;');
const meta = between('function englishLabLiveGetQuestionBankMeta(body){', 'var _cs20fSetupBase_');

check('join requires student auth', /function englishLabLiveJoinRoom\(body\)[\s\S]*?_eliveAuthStudent_\(body\)/.test(player));
check('player state requires student auth', /function englishLabLiveGetPlayerState\(body\)[\s\S]*?_eliveAuthStudent_\(body\)/.test(player));
check('legacy submit requires student auth', /function englishLabLiveSubmitAnswer\(body\)[\s\S]*?_eliveAuthStudent_\(body\)/.test(player));
check('effective submit requires student auth', effectiveSubmit.includes('_eliveAuthStudent_(body)'));
check('effective submit canonicalizes identity', effectiveSubmit.includes('_elivePlayerBodyFromSession_(body, auth)'));
check('leaderboard requires authenticated room viewer', leaderboard.includes('_eliveAuthRoomViewer_(body, found.row)'));
check('leaderboard returns player-safe room', leaderboard.includes('_eliveRoomForPlayer_(found.row)'));
check('question-bank meta authenticates before setup/seed', meta.indexOf('_eliveAuthTeacher_(body)') >= 0 && meta.indexOf('_eliveAuthTeacher_(body)') < meta.indexOf('_eliveEnsureSheets_()'));
check('player state never returns raw room projection', !/phase:'PLAYER_JOIN_ANSWER', room:_eliveRoomPublic_/.test(player));

const helperStart = source.indexOf('function _eliveQuestionForPlayer_(room){');
const helperEnd = source.indexOf('function _elivePlayerState_(room, player){', helperStart);
if (helperStart < 0 || helperEnd < 0) throw new Error('SEC003 helper region missing');
const helperCode = source.slice(helperStart, helperEnd);
let sessionMode = 'valid';
const ctx = {
  JSON,
  _eliveText_: v => String(v == null ? '' : v).trim(),
  _eliveUpper_: v => String(v == null ? '' : v).trim().toUpperCase(),
  _eliveSafePlayerName_: v => String(v == null ? '' : v).replace(/[<>]/g,'').slice(0,80) || 'Estudiante',
  _eliveCurrentQuestion_: room => room.__q || null,
  _eliveRoomPublic_: room => ({ room_code:room.ROOM_CODE, cod_grupo:room.COD_GRUPO, current_question:room.__q ? JSON.parse(JSON.stringify(room.__q)) : null }),
  _eliveSessionOwnsGroupLoose_: (ses,cod) => Array.isArray(ses.grupos) && ses.grupos.some(g => String(g.grupo || g).toUpperCase() === String(cod).toUpperCase()),
  _eliveCanRoom_: (auth,room) => auth.rol === 'admin' || auth.rol === 'superadmin' || (auth.rol === 'teacher' && auth.sesion.grupos?.some(g => String(g.grupo || g) === String(room.COD_GRUPO))),
  validarSesion: () => {
    if (sessionMode === 'invalid') return {ok:false,error:'sesion_invalida'};
    if (sessionMode === 'teacher') return {ok:true,rol:'teacher',codigo:'T1',nombre:'Teacher',grupos:[{grupo:'B1-LM69-0001'}]};
    if (sessionMode === 'no-code') return {ok:true,rol:'student',codigo:null,nombre:'Free',grupos:[]};
    if (sessionMode === 'foreign') return {ok:true,rol:'student',codigo:'17161',nombre:'Real Student',grupos:[{grupo:'B2-KJ69-9999'}]};
    return {ok:true,rol:'student',codigo:'17161',nombre:'Real Student',grupos:[{grupo:'B2-KJ69-0007'}]};
  }
};
vm.createContext(ctx);
vm.runInContext(helperCode, ctx, {filename:'sec003-live-helpers.js'});

const openRoom = { ROOM_CODE:'LAB-1234', COD_GRUPO:'B2-KJ69-0007', STATUS:'LIVE', ROUND_STATUS:'OPEN', __q:{index:1,prompt:'Question?',options:['A','B'],correct:'B',explanation:'Because'} };
let q = ctx._eliveQuestionForPlayer_(openRoom);
let safeRoom = ctx._eliveRoomForPlayer_(openRoom);
check('open question strips correct', !('correct' in q));
check('open question strips explanation', !('explanation' in q));
check('open room.current_question strips correct', !('correct' in safeRoom.current_question));
check('open room.current_question strips explanation', !('explanation' in safeRoom.current_question));
const closedRoom = {...openRoom, ROUND_STATUS:'CLOSED'};
q = ctx._eliveQuestionForPlayer_(closedRoom);
safeRoom = ctx._eliveRoomForPlayer_(closedRoom);
check('closed round can reveal answer', q.correct === 'B' && safeRoom.current_question.correct === 'B');

sessionMode='invalid'; let auth=ctx._eliveAuthStudent_({token:'x'});
check('invalid session rejected', auth.ok === false && auth.error === 'sesion_invalida');
sessionMode='teacher'; auth=ctx._eliveAuthStudent_({token:'x'});
check('teacher rejected as player', auth.ok === false && auth.error === 'no_autorizado');
sessionMode='no-code'; auth=ctx._eliveAuthStudent_({token:'x'});
check('student without enrolled code rejected', auth.ok === false && auth.error === 'estudiante_no_matriculado');
sessionMode='valid'; auth=ctx._eliveAuthStudent_({token:'x'});
check('enrolled student accepted', auth.ok === true && auth.codigo === '17161');
check('matching room group accepted', ctx._eliveStudentCanRoom_(auth, openRoom) === true);
sessionMode='foreign'; const foreign=ctx._eliveAuthStudent_({token:'x'});
check('foreign room group rejected', ctx._eliveStudentCanRoom_(foreign, openRoom) === false);
const canonical=ctx._elivePlayerBodyFromSession_({player_id:'VICTIM',cod_estudiante:'VICTIM',player_name:'Forged',team:'Hackers'}, auth);
check('forged player id ignored', canonical.player_id === '17161' && canonical.cod_estudiante === '17161');
check('forged player name ignored', canonical.player_name === 'Real Student');
check('browser team assignment ignored in this cut', canonical.team === '');

// Dynamic join proves invalid auth fails before sheet setup and that successful
// join writes only the session-canonical identity.
const joinStart = source.indexOf('function englishLabLiveJoinRoom(body){');
const joinEnd = source.indexOf('function englishLabLiveGetPlayerState(body){', joinStart);
const joinCode = source.slice(joinStart, joinEnd);
let ensureCalls=0, upsertBody=null;
Object.assign(ctx, {
  _eliveEnsureSheets_:()=>{ensureCalls++;},
  _eliveFindRoom_:()=>({row:openRoom}),
  _eliveUpsertPlayer_:(room,body)=>{upsertBody=body; return {COD_ESTUDIANTE:body.cod_estudiante,NOMBRE:body.player_name};},
  _elivePlayerState_:(room,player)=>({ok:true,player})
});
vm.runInContext(joinCode, ctx, {filename:'sec003-live-join.js'});
sessionMode='invalid'; ensureCalls=0; let result=ctx.englishLabLiveJoinRoom({token:'bad',room_code:'LAB-1234',player_id:'VICTIM'});
check('unauthenticated join stops before sheet I/O', result.ok === false && ensureCalls === 0);
sessionMode='valid'; ensureCalls=0; upsertBody=null; result=ctx.englishLabLiveJoinRoom({token:'ok',room_code:'LAB-1234',player_id:'VICTIM',player_name:'Forged',team:'Hackers'});
check('authorized join succeeds', result.ok === true && ensureCalls === 1);
check('join writes canonical identity only', upsertBody?.cod_estudiante === '17161' && upsertBody?.player_name === 'Real Student' && upsertBody?.team === '');
sessionMode='foreign'; upsertBody=null; result=ctx.englishLabLiveJoinRoom({token:'ok',room_code:'LAB-1234'});
check('foreign-group join denied before player upsert', result.ok === false && result.error === 'sala_no_disponible' && upsertBody === null);

if (failures.length) {
  console.error(`SEC003 ENGLISH LAB LIVE BACKEND QA: FAIL (${failures.length})`);
  process.exit(1);
}
console.log('SEC003 ENGLISH LAB LIVE BACKEND QA: PASS');
