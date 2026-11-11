/**
 * F111 D1 R57: strict November selective release audit.
 * Historical D1 fixture dates from October and cannot reconstruct 2026-11
 * main (it fails on main itself). Preserve that historical script unmodified.
 * This contract proves exact reversible R57 overlay and ONE superadmin center.
 * Read-only: no GAS, no production data, no generated oral/PDF files.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const BASE='949eeab724bf84a4d9db2363278d19e5d01f43f0';
const read=x=>fs.readFileSync(x,'utf8').replace(/\r\n/g,'\n');
const atBase=x=>execFileSync('git',['show',BASE+':'+x],{encoding:'utf8',maxBuffer:32*1024*1024}).replace(/\r\n/g,'\n');
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const app=read('src/app.jsx');
const uiPins={
  'campus.html':'d9611baeb88d620a8d8c537c37f40e30ee05754610e7235e73e3079f7857998f',
  'src/app.jsx':'2a5f722779dc63cf28f3596f601143b5a805b0916cbe9fe094ad6865728702c3',
  'src/teacher_views.jsx':'469ccfe43237a18603be62544b3cf6e3af06a5ed57a136c6673966809025a58c',
  'src/teacher_agenda_slots_cs19f.jsx':'7522a52a5abb31d4692c8933190709a2ed35ac75fdfb6ec138c01e9f39649cf0',
  'src/teacher_quiz_review_f111.js':'594ceacaf67d40f823da98b734bac01874549800b9c45f825f4cb38b824d2a2f'
};
const f92=read('src/solicitudes_unificadas.jsx'),mode=read('src/examenes_modes.jsx');
const html=read('modulos/examenes.html'),bundle=read('src/examenes_bundle.jsx');
let count=0;
function gate(ok,label){assert.ok(ok,label);console.log('PASS '+(++count)+' '+label);}
gate(sha(mode)==='0321e49e09f221e7a27d3020717d65a0f95cf7dd7a623a4e917d229e7a5b3c7b',
 'written PDF module exact approved SHA, rejects any unrelated exam motor edits');
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx',
 'examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const prefix=bundle.slice(0,bundle.indexOf('// ===== '+names[0]+' ====='));
gate(prefix.includes('Generado desde:')&&
 bundle===prefix+names.map(n=>'// ===== '+n+' =====\n\n'+read('src/'+n)+'\n').join(''),
 'effective exam bundle is exactly reproducible from six sources');
for(const p of ['src/examenes_css.jsx','src/examenes_appcss.jsx','src/examenes_data.jsx',
 'src/examenes_render.jsx','src/examenes_app.jsx','src/sidebar.jsx',
 'src/vista_docente.jsx','src/student_modules.jsx',
 'src/student_experience.jsx','src/admin_students.jsx','src/aplicar_pago.jsx',
 'src/solicitudes_pago.jsx']){
 gate(read(p)===atBase(p),'immutable baseline '+p);
}
for(const [path,pin] of Object.entries(uiPins))
 gate(sha(read(path))===pin,'approved teacher UI exact SHA '+path);
const mount=/<LazyRoute\s+title="Reposiciones R57 del docente"\s+component="ReposicionesR57Docente"/g;
const guarded="const visible=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5'&&(role==='admin'||!['APLICADA','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase())));";
const legacy="const visible=rows.filter(r=>role==='admin'||!['APLICADA','CANCELADA'].includes(String(r.ESTADO||'').toUpperCase()));";
gate([...app.matchAll(mount)].length===1&&
 app.includes("files={['src/solicitudes_unificadas.jsx?v=F111R57B5PDF20261109C']}"),
 'exactly one R57 teacher mounting point, still protected');
gate(app.split(guarded).length-1===1,'exactly one R57/F91 segregation');
gate(app.split('F111R57WRITTENPDF20261109B').length-1===3,
 'exactly 3 approved PDF iframe cache references');
gate(app.split('F111R57B5PDF20261109C').length-1===4,
 'exactly 4 B5 cache references');
gate(app.includes('function ExamenesTeacherPanel(')&&
 app.includes('component="TeacherExamsWorkspaceF111"')&&
 app.includes('data-f111-exams-extras="true"')&&
 app.includes('teacherBankOpen&&bank')&&
 !app.includes('src/social_skill_docente_f111.jsx'),
 'approved teacher exam workspace preserves separated R57, model bank and routes');
gate(!app.includes('registrarNotaComponenteOficial(')&&
 !app.includes('F111_R57_ALLOW_ZERO_WRITES'),
 'teacher UI does not introduce official-grade or zero-worker mutations');
const centerStart=app.indexOf('function ExamenesAdminPanel()');
const centerEnd=app.indexOf('// F111: Student assessment presentation only.',centerStart);
const center=app.slice(centerStart,centerEnd);
gate(centerStart>=0&&centerEnd>centerStart,'bounded superadmin exam center');
gate(center.split("const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';").length-1===1,
 'superadmin session gate exists exactly once');
const branchStart=center.indexOf('if (superadmin) {'), branchEnd=center.indexOf('\n  const oralSrc=',branchStart);
const branch=center.slice(branchStart,branchEnd);
gate(branchStart>=0&&branchEnd>branchStart&&
 branch.includes('return <ExamenesIframePanel')&&branch.includes('hideHeader')&&
 branch.includes('view="admin"')&&
 !branch.includes('<ReposicionesPanelF91'),
 'superadmin center directly displays ONE iframe, no legacy duplicate');
gate(center.includes('return <section data-screen-label="Admin · Exámenes"')&&
 center.includes('<ReposicionesPanelF91 role="admin" />')&&
 branchEnd<center.indexOf('return <section data-screen-label="Admin · Exámenes"'),
 'regular admin legacy panel still works, outside superadmin branch');
gate(app.split('examenes:    <ExamenesAdminPanel />').length-1===1,
 'only ONE admin exam route mounts this center');
gate(app.includes("if (role === 'teacher') return 'perfil'")&&
 app.includes("if (role === 'student') return 'dashboard'"),
 'academic teacher/student entry routing preserved');
gate(f92.includes("f92Post('reposResolverSolicitudR57'")&&
 f92.includes("const isSuper=String(ses?.rol||'').toLowerCase()==='superadmin'"),
 'B5 SI/NO decisions independently limited to superadmin');
gate(f92.includes('Object.assign(window,{ReposicionesR57Estudiante,ReposicionesR57Admin,ReposicionesR57Docente});'),
 'B5 teacher, admin and student export exists');
gate(html.includes('F111R57WRITTENPDF20261109B'),
 'real written PDF iframe cache version synchronized');
gate(read('src/solicitudes_unificadas.jsx').includes("f92Post('reposCrearSolicitudR57'"),
 'R57 student submission uses official endpoint');
gate(!app.includes('src/social_skill_docente_f111.jsx'),
 'R57 selective branch does not pull unrelated Social Skill');
console.log('F111 D1 R57 SELECTIVE CENTER '+count+'/'+count+
 ' PASS; October legacy fixture retained separately; production_writes=0');
