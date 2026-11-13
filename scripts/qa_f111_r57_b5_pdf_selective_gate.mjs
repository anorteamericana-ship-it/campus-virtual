/**
 * F111 R57 selective release guard: only new B5+PDF integration.
 * Does not rerun oral, R51 PDF, F90 grade, or production student data suites.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseF96LazyMap} from './lib/parse_f96_lazy_map.mjs';
const base='949eeab724bf84a4d9db2363278d19e5d01f43f0';
const read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const app=read('src/app.jsx'),f92=read('src/solicitudes_unificadas.jsx'),
 modes=read('src/examenes_modes.jsx'),bundle=read('src/examenes_bundle.jsx'),
 html=read('modulos/examenes.html');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
let passed=0;
function check(ok, label){assert.ok(ok,label);console.log('PASS '+(++passed)+' '+label);}
const diff=execFileSync('git',['diff','--name-only',base,'--','src','modulos'],{encoding:'utf8'})
 .trim().split(/\r?\n/).filter(Boolean).sort();
const expected=['modulos/examenes.html','src/app.jsx','src/examenes_bundle.jsx',
 'src/examenes_modes.jsx','src/solicitudes_unificadas.jsx','src/teacher_views.jsx',
 'src/teacher_agenda_slots_cs19f.jsx','src/teacher_quiz_review_f111.js',
 // Existing main source added after the historical R57 baseline, not changed by ATT-EDIT.
 'src/northbound_weekly_pilot_cta.js'].sort();
check(JSON.stringify(diff)===JSON.stringify(expected),
 'only the previously approved R57 overlay and three teacher UI sources changed');
for(const target of ['src/admin_students.jsx','src/aplicar_pago.jsx','src/solicitudes_pago.jsx',
 'src/vista_docente.jsx','src/student_modules.jsx',
 'src/student_experience.jsx','src/sidebar.jsx','src/cronograma_grupo.jsx']){
 const before=execFileSync('git',['show',base+':'+target],{encoding:'utf8',maxBuffer:30e6}).replace(/\r\n/g,'\n');
 check(read(target)===before,'untouched '+target);
}
// EXUI-05B: updated SHA256 exact pins after protected today-action review (#757).
// Every unrelated R57/B5/finance baseline and mutating endpoint remains unchanged.
// ATT-EDIT-01: exact pins renewed only for My Groups editor; exam engines untouched.
// EXUI-05C: exact source pins renewed for contextual read-only inbox and
// oral rubric navigation; R57, PDF, grade, financial and lazy-route checks stay strict.
const uiPins={
  'campus.html':'c9a8e49133969f6a3eae292745684327b44d17cc895ed171b0cc71fcfaf8dcc3',
  'src/app.jsx':'47829cab5abd712d896aff7190584b068b262026760547b4c222f99c457534e5',
  'src/teacher_views.jsx':'35755560553d693b036e0809d9928792c6c681d3c9dd5f2da4912bf1b25503a0',
  'src/teacher_agenda_slots_cs19f.jsx':'7522a52a5abb31d4692c8933190709a2ed35ac75fdfb6ec138c01e9f39649cf0',
  'src/teacher_quiz_review_f111.js':'053794b19ebae1b17f9d2cd6a63bce9ad25f3bc56203df4da6a5cf3175626305'
};
for(const [path,pin] of Object.entries(uiPins))
 check(sha(read(path))===pin,'approved teacher UI source pinned '+path);
check(sha(modes)==='da7899a45adb6abb8dff83fb605ea498adf51fdcfb9613c1fab9447afffa6bbf',
 'written review source pinned exact SHA');
// Protect the pre-existing weekly CTA added to main since the old R57 baseline.
check(sha(read('src/northbound_weekly_pilot_cta.js'))===
 'd4b4c1d7ac618962acc6db8d46b512e1a44be77aaa84b64e55c61657a932b4f3',
 'pre-existing weekly CTA source unchanged by attendance patch');
check(bundle.includes(modes),'served exam bundle includes pinned official PDF UI source');
const previouslyShipped=execFileSync('git',['show',
 'efbad33163466cca97ed7db4b481a59ed37055af:src/examenes_modes.jsx'],
 {encoding:'utf8',maxBuffer:32e6}).replace(/\r\n/g,'\n');
function outsideInbox(source){
 const start=source.indexOf('function TeacherWrittenLiveInbox()');
 const end=source.indexOf('function TeacherReview(',start);
 assert.ok(start>=0&&end>start,'written inbox module boundaries');
 return source.slice(0,start)+'EXUI05C_READONLY_INBOX'+source.slice(end);
}
check(outsideInbox(modes)===outsideInbox(previouslyShipped),
 'EXUI-05C changes only read-only inbox: official review, grades and PDF unchanged');

const m=parseF96LazyMap(app);
check(Object.keys(m).length===33,'33 original lazy route keys preserved');
check(Object.values(m).flat().length===68,'68 original lazy asset refs preserved');
check(new Set(Object.values(m).flat().map(x=>x.split(/[?#]/)[0])).size===41,
 '41 original lazy source files preserved');
const version='F111R57B5PDF20261109C';
const assets=Object.values(m).flat().filter(x=>x.startsWith('src/solicitudes_unificadas.jsx?'));
check(assets.length===3&&assets.every(x=>x.startsWith('src/solicitudes_unificadas.jsx?v='+version))&&
 assets.filter(x=>x.endsWith('&deep=F111STUDENTDEEPTABS20261104A')).length===1,
 'student/admin B5 loaders are versioned and preserve bilingual deep-link cache scope');
check(app.includes('component="ReposicionesR57Docente"')&&
 app.includes("files={['src/solicitudes_unificadas.jsx?v="+version+"']}"),
 'teacher Exámenes explicitly lazy-loads B5 before rendering');
check(f92.includes('Object.assign(window,{ReposicionesR57Estudiante,ReposicionesR57Admin,ReposicionesR57Docente});'),
 'teacher target published as actual window component');
check(f92.includes("f92Post('reposCrearSolicitudR57'")&&
 f92.includes('data-r57-student-requests="true"'),
 'student uses authenticated B5 create endpoint');
check(f92.includes("f92Post('reposInvitarSolicitudR57'")&&
 f92.includes('data-r57-teacher-invitations="true"'),
 'teacher uses authenticated invitation endpoint');
check(f92.includes("f92Post('reposResolverSolicitudR57'")&&
 f92.includes("const isSuper=String(ses?.rol||'').toLowerCase()==='superadmin'"),
 'only superadmin UI has SI/NO decisions');
check(f92.includes("if(cyclesResult.status!=='fulfilled')")&&
 f92.includes('setEnabled(false);setPartial(false);'),
 'student fails closed without verified B5 cycle history');
const area=f92.split('// F111 R57 B5 — superficies nuevas')[1]?.split('function ReposicionStudentCardF92(')[0]||'';
check(area.length>13000&&!/f92Post\('(reposEnviarSolicitudF92|reposResolverSolicitudF92|CONFIRMAR_PAGO)/.test(area),
 'new B5 surfaces contain no historical paid flow');
check(!area.includes("String(e?.message||'sin_detalle')")&&
 area.includes('R57:recovery:diagnose')&&area.includes('R57:recovery:execute'),
 'admin recovery never exposes raw backend error details');
check(f92.includes("const legacyRows=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5')")&&
 app.includes("const visible=rows.filter(r=>String(r.SOURCE||'')!=='F111_R57_B5'"),
 'legacy F91/F92 lists exclude duplicate R57 records');
check(f92.includes('<ReposicionesR57Admin />')&&f92.includes('<ReposicionesR57Estudiante />'),
 'superadmin and student mount their true B5 components');
check(modes.includes("postExamBackend('reposGenerarPdfEscritoR57'")&&
 modes.includes("postExamBackend('reposConsultarPdfEscritoR57'")&&
 modes.includes('closed && pushed && pdfState'),
 'written PDF is still bound to officially closed, pushed attempt');
check(app.includes('F111R57WRITTENPDF20261109B')&&html.includes('F111R57WRITTENPDF20261109B'),
 'parent and iframe share PDF bundle cache version');
check(!app.includes('src/social_skill_docente_f111.jsx'),
 'unrelated Social Skill not loaded in selective branch');
check(f92.includes('data-r57-admin-requests="unavailable"')&&
 f92.includes('Reintentar consulta')&&f92.includes('Bandeja R57 no disponible'),
 'admin inbox remains visible with safe retry when the R57 read fails');
check(f92.includes("if(!Array.isArray(r.rows))throw new Error('r57_formato_listado_invalido')")&&
 f92.includes('setRows([]);setEnabled(false);'),
 'invalid R57 list cannot display stale admin decisions');
check(f92.includes('Actualizar bandeja R57')&&
 f92.includes('disabled={loading||!!busy}'),
 'manual read-only refresh blocks concurrent R57 decisions');
check(f92.includes('data-r57-legacy-history="true"')&&
 f92.includes('HISTORIAL · SISTEMA ANTERIOR (F92)')&&
 f92.includes('No hay reposiciones en el sistema anterior.'),
 'legacy F92 records are clearly separated from R57 and have truthful empty state');
check(!f92.includes('if(loading)return <div className="card">Cargando solicitudes de examen…</div>')&&
 f92.includes('Cargando historial anterior…'),
 'R57 admin inbox mounts independently of legacy F92 loading');
check(f92.includes('function ReposicionesR57Diagnostico()')&&
 f92.includes("f92Post('reposListarCiclosR57',{incluir_diagnostico:true})"),
 'superadmin diagnostic reuses authenticated R57 read-only endpoint');
check(f92.includes('data.flags?.escritura_ceros===true')&&
 f92.includes('No activés procesos de escritura.'),
 'readiness warns about zero-write flag and safely handles read failures');
check(f92.includes('{isSuper&&<ReposicionesR57Diagnostico/>}'),
 'readiness UI stays inaccessible to teacher/student roles');
check(f92.includes("f92Post('reposConfigurarInicioProspectivoR57'")&&
 f92.includes("CONFIRMAR_INICIO_B5_2026_11_12"),
 'prospective date POST is explicit and PINNED to 12 Nov superadmin UI');
check(f92.includes('data.b5_programado')&&f92.includes('data.inicio_iso')&&
 f92.includes("timeZone:'America/Costa_Rica'"),
 'policy status distinguishes scheduled/active date in Costa Rica');
check(f92.includes('data.auxiliares_preparadas')&&f92.includes('data.auxiliares_total'),
 'readiness displays four separate auxiliary sheets');
check(f92.includes("Object.values(data.flags||{}).some(v=>v===true)")&&
 f92.includes('No habilita exámenes ni reabre lecciones históricas.'),
 'superadmin date button disabled if any mutating flag is ON or history might reopen');
// EXUI-03: new teacher card/list is read-only and must not trigger F91's
// historical deadline synchronization from the main teacher workflow.
const teacherView=read('src/teacher_views.jsx');
const teacherArea=teacherView.split('function TeacherExamsWorkspaceF111(')[1]?.split('function GruposView(')[0]||'';
check(teacherArea.includes("postTeacher('reposListarCiclosR57',{},30000)")&&
 teacherArea.includes("String(r.SOURCE||'')==='F111_R57_B5'"),
 'teacher main list reads ONLY authenticated scoped R57 cycles');
check(teacherArea.includes('String(r.COD_GRUPO||\'\')===groupCode')&&
 teacherArea.includes('tvUpper(r.NIVEL)===tvUpper(nivel)')&&
 teacherArea.includes('Number(r.LECCION)===d.lesson'),
 'make-up rows require exact group, level and exam lesson');
check(teacherArea.includes("!!r57Verified&&!official&&!conflicting&&makeupAuthorized")&&
 teacherArea.includes('reposicion_id:r57.REPOSICION_ID'),
 'only server-authorized make-up without official grade opens the oral');
check(!teacherArea.includes("postTeacher('reposListarExamenes'")&&
 !teacherArea.includes("postTeacher('reposResolverExamen'")&&
 !teacherArea.includes("postTeacher('registrarNota"),
 'teacher focused list avoids historical deadline side effects and grade mutation');
check(teacherArea.includes("tr('Reposición autorizada · 48 h','Make-up authorized · 48 h')")&&
 teacherArea.includes("tr('Reposición vencida · sin nueva nota','Make-up expired · no new grade')"),
 'make-up states bilingual without auto-zero claims');
const quizReview=read('src/teacher_quiz_review_f111.js');
check(teacherArea.includes("postTeacher('examTeacherStatusSnapshotF111',{cod_grupo:groupCode,nivel},30000)")&&
 teacherArea.includes('reply.solo_lectura!==true')&&
 teacherArea.includes('reply.production_writes!==0'),
 'historical F91 and oral drafts only through separate verified status-only endpoint');
check(teacherArea.includes("const hasLegacy=otherStatuses.some(r=>r.source==='F91')")&&
 teacherArea.includes("r.source==='ORAL_ORDINARIO'&&tvUpper(r.estado)==='BORRADOR'"),
 'teacher exam roster identifies historical and ordinary oral draft statuses');
check(teacherArea.includes("legacyVerified&&hasRegularDraft&&sessionFor(selected.lesson)")&&
 teacherArea.includes("legacyVerified&&hasLegacy&&<button"),
 'ordinary draft resume only for active oral lesson; historical status routes to special controls');
check(quizReview.includes('window.F111_QZ_openTeacherControls=openB1ProgressFromExamCard')&&
 teacherArea.includes('if(launch(lesson,groupCode)!==false)return;'),
 'quiz 2–8 primary card opens the existing official teacher controls for selected group');
check(quizReview.includes("postQuiz('qzProgressTeacherAvailability',context())")&&
 quizReview.includes("postQuiz('qzProgressTeacherSetAvailability',{...context(),estado:next})")&&
 quizReview.includes('buildB1TeacherOpenControls(Number(lesson),String(group))'),
 'quiz 2 uses teacher-owned server availability with real readback, not an invented second quiz motor');
console.log('F111_R57_B5_PDF_SELECTIVE '+passed+'/'+passed+
 ' PASS; finance_writes=0; production_writes=0; release=PHASE1_AUTHORIZED_DATE_PENDING');
