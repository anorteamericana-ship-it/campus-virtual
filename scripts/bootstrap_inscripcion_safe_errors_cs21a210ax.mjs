import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const path='src/inscripcion.jsx';
const expectedBlob='310d7b6e888836baca1bd0da0ccc0730c23ca9c3';
const before=fs.readFileSync(path,'utf8');
const actual=execFileSync('git',['hash-object',path],{encoding:'utf8'}).trim();
if(actual!==expectedBlob) throw new Error(`preimage mismatch ${actual}`);

const helper=`\nfunction inscripcionSafeUserError(raw, fallback, context){\n  const detail=String(raw&&raw.message||raw||'').trim();\n  if(detail) console.warn('[inscripcion] '+context, detail);\n  return fallback;\n}\n`;
let out=before;
const anchor="\nfunction clean(v){ return String(v == null ? '' : v).trim(); }";
if((out.match(new RegExp(anchor.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&'),'g'))||[]).length!==1) throw new Error('helper anchor count');
out=out.replace(anchor,helper+anchor);

const replacements=[
  ["setErr(String(e&&e.message||'No se pudo abrir la foto.'));","setErr(captureErrorMessage(e&&e.message));"],
  ["}catch(e){ setErr(e.message); }","}catch(e){ setErr(inscripcionSafeUserError(e, 'No pudimos verificar la identificación. Intentá nuevamente.', 'verificarCedulaInscripcion')); }"],
  ["}catch(e){ setGroupsError(e.message); }","}catch(e){ setGroupsError(inscripcionSafeUserError(e, 'No pudimos cargar los grupos disponibles. Intentá nuevamente.', 'getGruposInscripcion')); }"],
  ["}catch(e){ if(mounted) setGlobalError(e.message); }","}catch(e){ if(mounted) setGlobalError(inscripcionSafeUserError(e, 'No pudimos cargar la información de inscripción. Intentá nuevamente.', 'cargaInicial')); }"],
  ["}catch(e){ setSubmitError(e.message); }","}catch(e){ setSubmitError(inscripcionSafeUserError(e, 'No pudimos enviar la inscripción. Revisá los datos e intentá nuevamente.', 'crearInscripcionPublica')); }"],
];
for(const [from,to] of replacements){
  const count=out.split(from).length-1;
  if(count!==1) throw new Error(`replacement count ${count}: ${from}`);
  out=out.replace(from,to);
}
fs.writeFileSync(path,out);
console.log('CS21A210AX patch applied');