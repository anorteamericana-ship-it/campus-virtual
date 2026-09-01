import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE='ed458ff9715338cb2fcd75f9896f2753d8d019b9';
const expectedBlobs={'src/examenes_bundle.jsx':'c56642aa4906ab443f54b4aedb5d5d83c417d88a','src/examenes_modes.jsx':'75ec9cf1be92fee52a45a220ebc7a1aa08e4ccc1'};
const helper=`function examStudentSafeUserError(raw, fallback, context) {
  const detail = String(raw == null ? '' : raw).trim();
  if (detail) console.warn(\`[CS21A210AY][StudentMode][\${context || 'unknown'}]\`, detail);
  return fallback;
}
`;
const marker=`function examFormatClock(sec) {
  const n = Math.max(0, Number(sec) || 0);
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? \`${'${h}:${mm}:${ss}'}\` : \`${'${mm}:${ss}'}\`;
}
`;
const replacements=[
  ["setSaveMsg(r.mensaje || 'Autoguardado pospuesto; se intentará nuevamente.');", "setSaveMsg(examStudentSafeUserError(r.mensaje, 'Autoguardado pospuesto; se intentará nuevamente.', 'save_deferred'));"],
  ["setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo guardar.');", "setSaveMsg(examStudentSafeUserError(r && (r.mensaje || r.error), 'No se pudo guardar. Intentá nuevamente.', 'save'));"],
  ["setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo enviar el examen.');", "setSaveMsg(examStudentSafeUserError(r && (r.mensaje || r.error), 'No se pudo enviar el examen. Intentá nuevamente.', 'submit'));"],
  ["setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo validar el estado del intento.');", "setSaveMsg(examStudentSafeUserError(r && (r.mensaje || r.error), 'No pudimos validar el estado del intento. Intentá nuevamente.', 'heartbeat'));"],
  ["if (r.can_submit === false) setSaveMsg(r.mensaje || 'El intento ya no está disponible para envío.');", "if (r.can_submit === false) setSaveMsg(examStudentSafeUserError(r.mensaje, 'El intento ya no está disponible para envío.', 'heartbeat_unavailable'));"],
  ["setSaveMsg((r && (r.mensaje || r.error)) || 'No se pudo iniciar el intento.');", "setSaveMsg(examStudentSafeUserError(r && (r.mensaje || r.error), 'No se pudo iniciar el intento. Intentá nuevamente.', 'start'));"],
];
const blob=text=>execFileSync('git',['hash-object','--stdin'],{input:text,encoding:'utf8'}).trim();
function reconstruct(path){
  let s=execFileSync('git',['show',`${BASE}:${path}`],{encoding:'utf8'});
  if(blob(s)!==expectedBlobs[path]) throw new Error(`preimage blob mismatch ${path}`);
  if(s.split(marker).length-1!==1) throw new Error(`marker mismatch ${path}`);
  s=s.replace(marker,marker+'\n'+helper);
  for(const [oldText,newText] of replacements){if(s.split(oldText).length-1!==1) throw new Error(`replacement mismatch ${path}: ${oldText}`);s=s.replace(oldText,newText);}
  return s;
}
const html=fs.readFileSync('modulos/examenes.html','utf8');
if(!html.includes('../src/examenes_bundle.jsx?v=')) throw new Error('effective runtime bundle route missing');
const bundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
if(!bundle.includes('Generado desde: examenes_css.jsx, examenes_appcss.jsx, examenes_data.jsx, examenes_render.jsx, examenes_modes.jsx, examenes_app.jsx')) throw new Error('bundle build-source relation missing');
for(const path of Object.keys(expectedBlobs)){
  const actual=fs.readFileSync(path,'utf8');
  if(actual!==reconstruct(path)) throw new Error(`exact reconstruction mismatch ${path}`);
  for(const [oldText] of replacements) if(actual.includes(oldText)) throw new Error(`raw StudentMode sink remains ${path}`);
  if(actual.split('function examStudentSafeUserError(').length-1!==1) throw new Error(`helper count mismatch ${path}`);
}
console.log('CS21A210AY exact StudentMode reconstruction PASS');
