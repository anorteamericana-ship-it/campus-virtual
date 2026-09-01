import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='328afb1b98b29be31cd536b2d60e8dffcf7b6a1b';
const expected={
  'src/examenes_bundle.jsx':'76e4017b73de426530fca6ed09ae6bf76c195cbf',
  'src/examenes_modes.jsx':'e9009020f4d081f000205b52028d8907f4b3c8d4',
};
const blob=text=>execFileSync('git',['hash-object','--stdin'],{input:text,encoding:'utf8'}).trim();
const html=fs.readFileSync('modulos/examenes.html','utf8');
if(!html.includes('../src/examenes_bundle.jsx?v=')) throw new Error('effective exam runtime bundle route missing');

const requiredTeacherPatterns=[
  "setErr((attRes && (attRes.mensaje || attRes.error)) || 'No se pudo abrir la entrega.');",
  "setErr((createRes && (createRes.mensaje || createRes.error)) || 'No se pudo preparar la revisión.');",
  "setErr((revRes && (revRes.mensaje || revRes.error)) || 'No se pudo cargar la revisión.');",
  "setErr((closeRes && (closeRes.mensaje || closeRes.error)) || 'No se pudo cerrar la revisión.');",
  "setErr((pushRes && (pushRes.mensaje || pushRes.error)) || 'La revisión se cerró, pero no se pudo registrar la nota. Presioná Enviar Nota nuevamente.');",
  "if (!r || r.ok === false) { setErr((r && (r.mensaje || r.error)) || 'No se pudo enviar la nota.'); return; }",
  "setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar la bandeja de entregas.');",
];

for(const [path,sha] of Object.entries(expected)){
  const current=fs.readFileSync(path,'utf8');
  const pre=execFileSync('git',['show',`${BASE}:${path}`],{encoding:'utf8'});
  if(blob(pre)!==sha) throw new Error(`preimage blob mismatch ${path}`);
  if(current!==pre) throw new Error(`audit-only source changed ${path}`);
  if(!current.includes('function TeacherWrittenBackendReviewF940(')) throw new Error(`teacher review boundary missing ${path}`);
  if(!current.includes('function TeacherWrittenLiveInbox(')) throw new Error(`teacher inbox boundary missing ${path}`);
  for(const p of requiredTeacherPatterns){
    const n=current.split(p).length-1;
    if(n!==1) throw new Error(`teacher raw sink count mismatch ${path}: ${n} :: ${p}`);
  }
  const teacherStart=current.indexOf('function TeacherWrittenBackendReviewF940(');
  const teacherEnd=current.indexOf('function TeacherReview(', teacherStart);
  const teacherSlice=current.slice(teacherStart, teacherEnd);
  if(!teacherSlice.includes('{err && <div className="rev-live-err">')) throw new Error(`review err UI missing ${path}`);
  if(!teacherSlice.includes('{err && <div className="ex-errmsg">')) throw new Error(`inbox err UI missing ${path}`);
  if(!current.includes('function ActivationBackendPanel(') || !current.includes('function BackendOperationsPanel(')) throw new Error(`admin boundary missing ${path}`);
  if(!current.includes("const detail = r && (r.mensaje || r.error || (r.errores && r.errores.join(' · ')));")) throw new Error(`activation admin raw projection missing ${path}`);
  if(!current.includes("else { setMsg(''); setErr((r && (r.mensaje || r.error)) || 'No se pudo completar la operación.'); }")) throw new Error(`ops admin raw projection missing ${path}`);
}

console.log('CS21A210AZ teacher/admin effective error-boundary audit PASS');
console.log('TEACHER_RAW_VISIBLE_SINKS_PER_REPRESENTATION=7');
console.log('TEACHER_RAW_VISIBLE_SINKS_SYNCHRONIZED_TOTAL=14');
console.log('NEXT_FUNCTIONAL_SCOPE=teacher_written_only');
