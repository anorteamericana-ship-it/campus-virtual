import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='c018e5c3f6d0a48605c5de5dce4427604e9e8c21';
const exact=process.argv.includes('--exact-import');
const out=execFileSync('node',['scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs'],{encoding:'utf8'});
const findings=Number((out.match(/DIRECT_RAW_SINK_FINDINGS=(\d+)/)||[])[1]);
const files=Number((out.match(/FILES_WITH_FINDINGS=(\d+)/)||[])[1]);
if(!Number.isFinite(findings)||!Number.isFinite(files)) throw new Error('V3 summary missing');
if(exact){ if(findings!==28||files!==12) throw new Error(`BD exact V3 mismatch ${findings}/${files}`); }
else { if(findings>28||files>12) throw new Error(`BD V3 regression ${findings}/${files}`); }

const app=fs.readFileSync('src/app.jsx','utf8');
const campus=fs.readFileSync('campus.html','utf8');
const live=fs.readFileSync('src/english_lab_live.jsx','utf8');
const free=fs.readFileSync('src/english_lab_free_access_cs21a66.js','utf8');
const examBundle=fs.readFileSync('src/examenes_bundle.jsx','utf8');
const examModes=fs.readFileSync('src/examenes_modes.jsx','utf8');

if(!app.includes("english_lab_live: ['src/english_lab_live.jsx")) throw new Error('English LAB Live lazy route missing');
const liveRaw=(live.match(/setError\(e\.message \|\| String\(e\)\)/g)||[]).length;
if(exact){
  if(liveRaw!==7) throw new Error(`English LAB Live exact raw sink count changed: ${liveRaw}`);
}else if(liveRaw===0){
  if((live.match(/function englishLabLiveSafeUserError\(/g)||[]).length!==1) throw new Error('English LAB Live safe helper missing');
  for(const c of ['room_control_load','room_control_action','player_state','join_room','submit_answer','teacher_data','create_room']){
    if((live.match(new RegExp("'"+c+"'",'g'))||[]).length!==1) throw new Error(`English LAB Live safe context mismatch: ${c}`);
  }
}else{
  throw new Error(`English LAB Live partially migrated raw sinks: ${liveRaw}`);
}
if(!live.includes('{error && <Alert tone="err">{error}</Alert>}') && !live.includes('error ? <Alert tone="err">{error}</Alert>')) throw new Error('English LAB Live error UI projection missing');
if(!app.includes("admin_students: ['src/admin_students.jsx")) throw new Error('admin_students effective route missing');
if(!app.includes("banco: ['src/importador_banco.jsx") || !app.includes("src/importador_banco_integridad_cs21a114.jsx")) throw new Error('BCR override wiring changed');
if(examBundle.includes('<TeacherBackendReviewPanel')||examModes.includes('<TeacherBackendReviewPanel')) throw new Error('TeacherBackendReviewPanel unexpectedly mounted');
if(!campus.includes('src/english_lab_free_access_cs21a66.js')) throw new Error('English LAB free-access loader missing');
if(!free.includes('sessionStorage.setItem(CACHE_KEY')) throw new Error('free-access cache sink changed');
if(app.includes('src/syllabus_views (1).jsx')) throw new Error('duplicate syllabus unexpectedly became primary route');
if(!app.includes('src/syllabus_views.jsx')) throw new Error('primary syllabus route missing');
for(const p of ['ADMIN_~4.JSX','MATRIC~3.JSX','PANEL_~1.JSX','SOLICI~2.JSX']){
  if(app.includes(p)||campus.includes(p)) throw new Error(`${p} unexpectedly referenced by primary app/campus entrypoint`);
}

const report=fs.readFileSync('00_DOCUMENTACION/RAW_USER_ERROR_SURFACE_POST_BC_CS21A210BD_2026-09-01.md','utf8');
if(!report.includes('DIRECT_RAW_SINK_FINDINGS=28')||!report.includes('FILES_WITH_FINDINGS=12')) throw new Error('materialized BD report summary mismatch');
console.log(exact ? 'CS21A210BD exact audit snapshot PASS' : 'CS21A210BD descendant non-regression PASS');
console.log(`V3=${findings}/${files}`);
console.log('NEXT_EFFECTIVE_CANDIDATE=src/english_lab_live.jsx');
console.log('E2=NO');
