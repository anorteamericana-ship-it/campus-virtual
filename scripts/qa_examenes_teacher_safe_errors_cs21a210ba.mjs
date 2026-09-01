import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const BASE='3d161df00606dab513cb9bce706502a4ca6be433';
const pre={'src/examenes_modes.jsx':'e9009020f4d081f000205b52028d8907f4b3c8d4','src/examenes_bundle.jsx':'76e4017b73de426530fca6ed09ae6bf76c195cbf'};
const cand={'src/examenes_modes.jsx':'9d86826c3c3d0ac12e4a915d461e9fcc42be3705','src/examenes_bundle.jsx':'4ee147afe2c06c3318d075b478a47497994a93dc'};
const contexts=['get_attempt','create_review','get_review','close_review','push_after_close','push_retry','review_inbox'];
for(const path of Object.keys(pre)){
 const s=fs.readFileSync(path,'utf8');
 const sha=execFileSync('git',['hash-object','--stdin'],{input:s,encoding:'utf8'}).trim();
 if(sha!==cand[path]) throw Error(`${path}: candidate blob mismatch ${sha}`);
 if((s.match(/function examTeacherSafeUserError\(/g)||[]).length!==1) throw Error(path+' helper count');
 for(const c of contexts) if((s.match(new RegExp("'"+c+"'",'g'))||[]).length!==1) throw Error(`${path}: context ${c}`);
 for(const ep of ['examGetAttempt','examCreateReviewDraft','examGetReview','examCloseReview','examPushReviewToNotas','examReviewInbox']) if(!s.includes(ep)) throw Error(`${path}: endpoint lost ${ep}`);
 const old=execFileSync('git',['show',`${BASE}:${path}`],{encoding:'utf8'});
 const oldSha=execFileSync('git',['hash-object','--stdin'],{input:old,encoding:'utf8'}).trim();
 if(oldSha!==pre[path]) throw Error(`${path}: frozen preimage mismatch`);
 let reversed=s.replace(/function examTeacherSafeUserError\(raw, fallback, context\) \{[\s\S]*?\n\}\n\n(?=function TeacherWrittenBackendReviewF940)/,'');
 const pairs=[
 ["setErr(examTeacherSafeUserError(attRes && (attRes.mensaje || attRes.error), 'No se pudo abrir la entrega. Intentá nuevamente.', 'get_attempt'));","setErr((attRes && (attRes.mensaje || attRes.error)) || 'No se pudo abrir la entrega.');"],
 ["setErr(examTeacherSafeUserError(createRes && (createRes.mensaje || createRes.error), 'No se pudo preparar la revisión. Intentá nuevamente.', 'create_review'));","setErr((createRes && (createRes.mensaje || createRes.error)) || 'No se pudo preparar la revisión.');"],
 ["setErr(examTeacherSafeUserError(revRes && (revRes.mensaje || revRes.error), 'No se pudo cargar la revisión. Intentá nuevamente.', 'get_review'));","setErr((revRes && (revRes.mensaje || revRes.error)) || 'No se pudo cargar la revisión.');"],
 ["setErr(examTeacherSafeUserError(closeRes && (closeRes.mensaje || closeRes.error), 'No se pudo cerrar la revisión. Intentá nuevamente.', 'close_review'));","setErr((closeRes && (closeRes.mensaje || closeRes.error)) || 'No se pudo cerrar la revisión.');"],
 ["setErr(examTeacherSafeUserError(pushRes && (pushRes.mensaje || pushRes.error), 'La revisión se cerró, pero no se pudo registrar la nota. Presioná Enviar Nota nuevamente.', 'push_after_close'));","setErr((pushRes && (pushRes.mensaje || pushRes.error)) || 'La revisión se cerró, pero no se pudo registrar la nota. Presioná Enviar Nota nuevamente.');"],
 ["if (!r || r.ok === false) { setErr(examTeacherSafeUserError(r && (r.mensaje || r.error), 'No se pudo enviar la nota. Intentá nuevamente.', 'push_retry')); return; }","if (!r || r.ok === false) { setErr((r && (r.mensaje || r.error)) || 'No se pudo enviar la nota.'); return; }"],
 ["setErr(examTeacherSafeUserError(r && (r.mensaje || r.error), 'No se pudo consultar la bandeja de entregas. Intentá nuevamente.', 'review_inbox'));","setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar la bandeja de entregas.');"]];
 for(const [n,o] of pairs){ if((reversed.split(n).length-1)!==1) throw Error(`${path}: reverse anchor missing`); reversed=reversed.replace(n,o); }
 if(reversed!==old) throw Error(`${path}: exact preimage reconstruction failed`);
}
console.log('CS21A210BA PASS · 7 teacher sinks x 2 · exact reconstruction');