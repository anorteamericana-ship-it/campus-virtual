import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='ddd243a73e74c109420fc8a3e9a82e7c2bf31349';
const PATH='src/english_lab_live.jsx';
const PRE='f4c865510b1ba3f7fdf8b67be8ea21cf21762cc4';
const hash=s=>execFileSync('git',['hash-object','--stdin'],{input:s,encoding:'utf8'}).trim();
const raw='setError(e.message || String(e));';
const anchor='  function RoomControl({roomRef, onBack, onChanged}){';
const contexts=[
  ['room_control_load','No pudimos cargar el control de la sala. Intentá nuevamente.'],
  ['room_control_action','No pudimos completar la acción de la sala. Intentá nuevamente.'],
  ['player_state','No pudimos actualizar el estado de la sala. Intentá nuevamente.'],
  ['join_room','No pudimos entrar a la sala. Verificá el código e intentá nuevamente.'],
  ['submit_answer','No pudimos enviar tu respuesta. Intentá nuevamente.'],
  ['teacher_data','No pudimos cargar las salas y grupos. Intentá nuevamente.'],
  ['create_room','No pudimos crear la sala. Intentá nuevamente.'],
];
const helper="  function englishLabLiveSafeUserError(error, fallback, context){\n    const detail = String(error && (error.message || error) || '').trim();\n    if(detail) console.warn('[CS21A210BE][EnglishLabLive][' + (context || 'unknown') + ']', detail);\n    return fallback;\n  }\n\n";
function transform(s){
  if(hash(s)!==PRE) throw new Error('BE frozen preimage hash mismatch');
  if((s.split(raw).length-1)!==7||(s.split(anchor).length-1)!==1) throw new Error('BE preimage cardinality mismatch');
  s=s.replace(anchor,helper+anchor);
  for(const [context,fallback] of contexts){
    const replacement=`setError(englishLabLiveSafeUserError(e, ${JSON.stringify(fallback)}, '${context}'));`;
    s=s.replace(raw,replacement);
  }
  return s;
}
const base=execFileSync('git',['show',`${BASE}:${PATH}`],{encoding:'utf8',maxBuffer:20*1024*1024});
if(hash(base)!==PRE) throw new Error('BE base source preimage mismatch');
const current=fs.readFileSync(PATH,'utf8');
if(current!==transform(base)) throw new Error('English LAB Live is not exact BE reconstruction');
if((current.match(/function englishLabLiveSafeUserError\(/g)||[]).length!==1) throw new Error('safe helper cardinality mismatch');
if(current.includes(raw)) throw new Error('raw Live exception sink remains');
for(const [context] of contexts){ if((current.match(new RegExp("'"+context+"'",'g'))||[]).length!==1) throw new Error(`safe context mismatch ${context}`); }
for(const endpoint of ['englishLabLiveGetRoomControl','englishLabLiveGetPlayerState','englishLabLiveJoinRoom','englishLabLiveSubmitAnswer','englishLabLiveGetTeacherData','englishLabLiveCreateRoom','englishLabLiveCloseRoom','englishLabLiveStartRoom','englishLabLiveLaunchQuestion','englishLabLiveCloseRound']){
  if(!current.includes(endpoint)) throw new Error(`Live endpoint/action lost: ${endpoint}`);
}
for(const invariant of ['setState(r); setJoined(!!(r.player && r.player.cod_estudiante));','await loadState();','setCreated(r.room || r);','setControlRoom(r.room || r);']){
  if(!current.includes(invariant)) throw new Error(`Live flow invariant lost: ${invariant}`);
}
const app=fs.readFileSync('src/app.jsx','utf8');
if(!app.includes("english_lab_live: ['src/english_lab_live.jsx")) throw new Error('effective Live lazy route lost');
console.log('CS21A210BE exact reconstruction PASS');
console.log('SAFE_VISIBLE_SINKS=7');
console.log('E2=NO');
