import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE_SHA='aafc10ff6f99edec321acfbe69b0639207ba4fac';
const BRANCH='fix/admin-master-conape-truth-boundary-cs21a210c';
const exactMode=process.argv.includes('--exact-import');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210C FAIL: ${label}`)};
const read=p=>fs.readFileSync(p);
const text=p=>read(p).toString('utf8');
const gitBlobSha=buf=>crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const imported={
 'src/admin_master_conape_data_cs21a96.jsx':'5c01b4e03ce0dd1bbe6c9a70bda4af2bf83533b4',
 'src/admin_master_conape_review_core_cs21a96.jsx':'d88195947faea716dfbe5d1c6afc4c2fdcfa8136',
};

const data=text('src/admin_master_conape_data_cs21a96.jsx');
const core=text('src/admin_master_conape_review_core_cs21a96.jsx');
const review=text('src/admin_master_conape_review_state_cs21a96.jsx');
const wa=text('src/admin_master_conape_wa_cs21a96.jsx');
const multi=text('src/admin_master_conape_multisort_cs21a109.jsx');
const inherited210b=text('scripts/qa_admin_master_conape_effective_safe_cs21a210b.mjs');
const inherited195=text('scripts/qa_admin_master_conape_safe_errors_cs21a195.mjs');
const inherited196=text('scripts/qa_admin_master_conape_user_copy_cs21a196.mjs');

must(data.includes("if(liveRef.current){if(!silent)setMsg('La verificación de morosidad ya está en curso.');return{ok:false,busy:true}}"),'busy mora refresh returns explicit failure state');
must(data.includes("if(!rowsRef.current.length)return{ok:true,empty:true}"),'empty mora refresh returns explicit empty state');
must(data.includes("return{ok:false}}finally{liveRef.current=false}"),'mora failure returns explicit failure state');
must(data.includes("const moraResult=await refreshMora(false);if(!moraResult?.ok)return"),'joint refresh stops after mora failure/busy');
must(data.includes("if(moraResult.empty){setMsg(result.mensaje||'CONAPE actualizado. No había registros para verificar morosidad.');return}"),'empty refresh uses truthful separate copy');
must(data.includes("setMsg(result.mensaje||'CONAPE y morosidad oficial actualizados.')"),'joint success remains only after both operations succeed');

must(core.includes('request_id|policy_unbound|sec00|getConape|getComentario|guardarComentario|actualizarPanel'),'safe-user boundary covers generic internal identifiers');
must(core.includes("console.warn('[MasterCONAPE] Detalle técnico oculto al operador.'"),'technical detail remains console-only');
must(core.includes('async function post(fn,payload={})'),'transport preserved');
must(core.includes("throw Error(data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`);return data"),'diagnostic throw remains internal transport behavior');

must(review.includes("masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision')"),'review-state safe action preserved');
must(wa.includes("alert(masterConapeSafeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp'))"),'CS21A210B WhatsApp boundary preserved');
must(multi.includes('No quedan desembolsos académicos 01 pendientes según el registro oficial.'),'CS21A210B effective copy preserved');
must(!multi.includes('7-morosidad'),'effective copy remains free of internal sheet name');

for(const [label,guard] of Object.entries({CS21A210B:inherited210b,CS21A195:inherited195,CS21A196:inherited196})){
 must(guard.includes('/function\\s+masterConapeSafeUserError'),`${label} uses descendant-safe semantic helper assertion`);
}
must(inherited195.includes('No se pudo verificar la morosidad en este momento. Intentá de nuevo.'),'CS21A195 guards final R2 mora copy');
must(inherited195.includes('No se pudo actualizar CONAPE en este momento. Intentá de nuevo.'),'CS21A195 guards final R2 refresh copy');
must(inherited195.includes('No se pudo cargar el seguimiento del estudiante. Intentá de nuevo.'),'CS21A195 guards final R2 detail-load copy');
must(inherited196.includes('Morosidad verificada con el registro oficial.'),'CS21A196 guards final R2 operational copy');

for(const [path,src] of Object.entries({'src/admin_master_conape_data_cs21a96.jsx':data,'src/admin_master_conape_review_core_cs21a96.jsx':core})){
 must(!/setSharing\s*\(|DriveApp\.Access\.ANYONE|ANYONE_WITH_LINK|setPermission\s*\(/i.test(src),`${path} has no Drive ACL mutation`);
}

if(exactMode){
 for(const [path,expected] of Object.entries(imported))must(gitBlobSha(read(path))===expected,`${path} exactly matches validated R2 blob ${expected}`);
 const allowed=new Set([
  ...Object.keys(imported),
  'scripts/qa_admin_master_conape_effective_safe_cs21a210b.mjs',
  'scripts/qa_admin_master_conape_safe_errors_cs21a195.mjs',
  'scripts/qa_admin_master_conape_user_copy_cs21a196.mjs',
  'scripts/qa_admin_master_conape_truth_boundary_cs21a210c.mjs',
  '.github/workflows/qa-admin-master-conape-truth-boundary-cs21a210c.yml',
  '00_DOCUMENTACION/ADMIN_MASTER_CONAPE_TRUTH_BOUNDARY_CS21A210C_2026-08-31.md'
 ]);
 const changed=execFileSync('git',['diff','--name-only',`${BASE_SHA}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
 for(const path of changed)must(allowed.has(path),`unexpected stacked path: ${path}`);
 for(const path of allowed)must(changed.includes(path),`expected stacked path missing: ${path}`);
 const statuses=execFileSync('git',['diff','--name-status',`${BASE_SHA}...HEAD`],{encoding:'utf8'});
 must(!/^D\s/m.test(statuses),'no deletion in CS21A210C');
 must(!changed.some(path=>(/(^|\/)(AppsScript|apps_script_patches)(\/|$)|\.gs$/i).test(path)),'no Apps Script source change');
}

console.log('CS21A210C ADMIN MASTER CONAPE TRUTH BOUNDARY: PASS');
console.log(`BASE=${BASE_SHA}`);
console.log(`BRANCH=${BRANCH}`);
console.log(`EXACT_IMPORT=${exactMode?'VERIFIED':'SKIPPED_FOR_DESCENDANT'}`);
console.log('FUNCTIONAL_FILES=2');
console.log('QA_GUARD_COMPATIBILITY_FILES=3');
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
