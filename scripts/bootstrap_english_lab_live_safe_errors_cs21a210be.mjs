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

let s=fs.readFileSync(PATH,'utf8');
if(hash(s)!==PRE) throw new Error(`English LAB Live preimage mismatch: ${hash(s)}`);
const base=execFileSync('git',['show',`${BASE}:${PATH}`],{encoding:'utf8',maxBuffer:20*1024*1024});
if(base!==s) throw new Error('working source differs from exact BD base');
if((s.split(raw).length-1)!==7) throw new Error('expected exactly 7 raw Live exception sinks');
if((s.split(anchor).length-1)!==1) throw new Error('RoomControl anchor mismatch');
if(s.includes('function englishLabLiveSafeUserError(')) throw new Error('safe helper already present');
s=s.replace(anchor,helper+anchor);
for(const [context,fallback] of contexts){
  const replacement=`setError(englishLabLiveSafeUserError(e, ${JSON.stringify(fallback)}, '${context}'));`;
  const idx=s.indexOf(raw);
  if(idx<0) throw new Error(`missing raw sink for ${context}`);
  s=s.slice(0,idx)+replacement+s.slice(idx+raw.length);
}
if(s.includes(raw)) throw new Error('raw Live sink remains after seven replacements');
fs.writeFileSync(PATH,s);
console.log('CS21A210BE English LAB Live source transform PASS');
