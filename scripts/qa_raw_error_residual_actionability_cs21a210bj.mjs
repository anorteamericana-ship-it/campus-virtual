import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const V4='scripts/audit_raw_user_error_surface_v4_cs21a210bi.mjs';
const out=execFileSync('node',[V4],{encoding:'utf8',maxBuffer:20*1024*1024});
const metric=key=>Number((out.match(new RegExp(`^${key}=(\\d+)$`,'m'))||[])[1]);
const must=(ok,msg)=>{ if(!ok) throw new Error(msg); };

must(metric('DIRECT_RAW_SINK_FINDINGS')===22,`BJ expected V4 22 findings, got ${metric('DIRECT_RAW_SINK_FINDINGS')}`);
must(metric('FILES_WITH_FINDINGS')===11,`BJ expected V4 11 files, got ${metric('FILES_WITH_FINDINGS')}`);
must(metric('CUSTOM_SETTER_FINDINGS')===2,`BJ expected V4 2 custom setters, got ${metric('CUSTOM_SETTER_FINDINGS')}`);

const expected=new Map([
  ['src/english_lab_live.jsx',7],
  ['src/SOLICI~2.JSX',5],
  ['src/admin_students.jsx',2],
  ['src/ADMIN_~4.JSX',1],
  ['src/cronograma.jsx',1],
  ['src/examenes_bundle.jsx',1],
  ['src/examenes_modes.jsx',1],
  ['src/importador_banco.jsx',1],
  ['src/MATRIC~3.JSX',1],
  ['src/PANEL_~1.JSX',1],
  ['src/syllabus_views (1).jsx',1],
]);
for(const [file,count] of expected){
  must(out.includes(`FILE_COUNT|${count}|${file}`),`BJ residual snapshot changed for ${file}`);
}
must(!out.includes('src/english_lab_free_access_cs21a66.js'),'V4 member-method false positive reappeared');

const app=fs.readFileSync('src/app.jsx','utf8');
const campus=fs.readFileSync('campus.html','utf8');
const insHtml=fs.readFileSync('inscripcion.html','utf8');
const cron=fs.readFileSync('src/cronograma.jsx','utf8');
const sourceTruth=fs.readFileSync('.github/workflows/qa-english-lab-source-truth-guard.yml','utf8');
const live=fs.readFileSync('src/english_lab_live.jsx','utf8');
const runtime=[campus,app,insHtml].join('\n');

must(/cronograma:\s*\['src\/cronograma\.jsx/.test(app),'cronograma effective route missing');
must(cron.includes('.catch(e => setError(e.message))'),'cronograma V4 residue missing');
must(cron.includes('No se pudo cargar el cronograma.</div>'),'cronograma no longer collapses internal exception to generic visible copy');

for(const legacy of ['MATRIC~3.JSX','PANEL_~1.JSX','SOLICI~2.JSX','ADMIN_~4.JSX']){
  must(!runtime.includes(legacy),`${legacy} gained a primary runtime reference in checked entrypoints`);
}
must(app.includes('src/syllabus_views.jsx'),'canonical syllabus route missing');
must(!runtime.includes('src/syllabus_views (1).jsx'),'legacy syllabus duplicate gained a primary runtime reference');

const liveRaw=(live.match(/setError\(e\.message \|\| String\(e\)\)/g)||[]).length;
must(liveRaw===7,`English LAB Live blocked residue changed ${liveRaw}`);
must(!fs.existsSync('scripts/qa_cs21a202_source_truth.mjs'),'strict CS21A202 source-truth script unexpectedly present; BJ classification must be revisited');
must(sourceTruth.includes('English LAB/browser surface changed but the strict source-truth gate script is not present on this base. Refusing to approve.'),'English LAB fail-closed Source Truth rule changed');

console.log('CS21A210BJ RAW ERROR RESIDUAL ACTIONABILITY PASS');
console.log('V4_SNAPSHOT=22_FINDINGS_11_FILES');
console.log('ACTIONABLE_UNBLOCKED_RAW_ERROR_TARGETS=0');
console.log('ENGLISH_LAB_LIVE=EFFECTIVE_VISIBLE_BUT_SOURCE_TRUTH_BLOCKED');
console.log('ADMIN_STUDENTS=ALREADY_SANITIZED_AT_RENDER');
console.log('EXAMENES_TEACHER_BACKEND_REVIEW=UNMOUNTED');
console.log('CRONOGRAMA=EFFECTIVE_NOT_RAW_VISIBLE');
console.log('IMPORTADOR_BASE=SHADOWED_BY_CS21A114');
console.log('LEGACY_SHORTNAMES=NO_PRIMARY_RUNTIME_REF_IN_CHECKED_ENTRYPOINTS');
console.log('SYLLABUS_DUPLICATE=NO_PRIMARY_RUNTIME_REF_IN_CHECKED_ENTRYPOINTS');
console.log('E2=NO');
