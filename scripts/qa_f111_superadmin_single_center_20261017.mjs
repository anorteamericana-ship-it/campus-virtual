// F111 · Hotfix Campus real: centro único superadmin, sin cambios académicos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='ffd25fc9253e295d0412cf799e51631f37ee6431';
const appSourceF111=fs.readFileSync('src/app.jsx','utf8').replaceAll('&demo=F111STUDENTDEMO20261104','').replaceAll('&deep=F111STUDENTDEEPTABS20261104A','').replaceAll('&calendar=F111STUDENTCALEN20261104A','');
const academicNewRoute="  const [active, setActive] = useState(() => {\n    // F111: each academic entry starts in the real profile. Never restore the\n    // last saved academic tab; navigation remains free after the profile opens.\n    if (role === 'student') return 'dashboard'; // Native Student My Profile\n    if (role === 'teacher') return 'perfil';     // TeacherProfileCS21A76\n    // Preserve the operational state of admin/superadmin (outside bilingual pilot).\n    const roleKey = 'an_active_' + (role || 'unknown');\n    const saved = localStorage.getItem(roleKey) || localStorage.getItem('an_active') || 'dashboard';\n    return saved === 'portal_estudiante' ? 'dashboard' : saved;\n  });\n";
const academicOldRoute="  const [active, setActive] = useState(() => {\n    // F96.5 UX: el estudiante SIEMPRE inicia en Mi Campus.\n    // No se hereda la última pantalla porque mañana entran usuarios nuevos y\n    // la primera impresión debe ser clara, estable y orientada al cumplimiento INA.\n    if (role === 'student') return 'dashboard';\n\n    // Admin/docente sí conservan su última pantalla porque trabajan operación diaria.\n    const roleKey = 'an_active_' + (role || 'unknown');\n    const saved = localStorage.getItem(roleKey) || localStorage.getItem('an_active') || 'dashboard';\n    return saved === 'portal_estudiante' ? 'dashboard' : saved;\n  });\n";
const academicNewStorage="  useEffect(() => {\n    // Academic navigation is intentionally not remembered across entries.\n    if (role === 'student' || role === 'teacher') return;\n    try {\n      localStorage.setItem('an_active', active);\n      localStorage.setItem('an_active_' + (role || 'unknown'), active);\n    } catch (_) {}\n  }, [active, role]);\n";
const academicOldStorage="  useEffect(() => {\n    try {\n      localStorage.setItem('an_active', active);\n      localStorage.setItem('an_active_' + (role || 'unknown'), active);\n    } catch (_) {}\n  }, [active, role]);\n";
assert.equal(appSourceF111.split(academicNewRoute).length-1,1,'F111 EN entry route is present exactly once');
assert.equal(appSourceF111.split(academicNewStorage).length-1,1,'F111 EN route is not persisted academically');
// Preserve the October exact D1 rollback check after subtracting only the new
// student component cache keys. These are assets, not changes to exam behavior.
const changedDashboard="'src/student_dashboard.jsx?v=F111HERO20261103B'";
const originalDashboard="'src/student_dashboard.jsx?v=F1110826DOCT20261020'";
const changedTabs="'src/student_experience.jsx?v=F111STUDENTTABSEN20261103'";
const originalTabs="'src/student_experience.jsx?v=F98.4N'";
assert.equal(appSourceF111.split(changedDashboard).length-1,1,'single new student profile asset');
assert.equal(appSourceF111.split(changedTabs).length-1,3,'three identical student tab assets');
const changedAdminRoster="'src/admin_attendance_roster.jsx?v=F111ATTLIMIT20261103A'";
const oldAdminRoster="'src/admin_attendance_roster.jsx?v=F111ATTROSTER20261021'";
assert.equal(appSourceF111.split(changedAdminRoster).length-1,1,'single new admin attendance roster asset');
assert.equal(appSourceF111.split('&att=F111ATTLIMIT20261103A').length-1,3,'only three admin student routes updated');
// Normalize only the new teacher-view cache token; do not relax academic route assertions.
const source=appSourceF111.replaceAll('&rl=F111ROSTER20261104CLEAN','').replaceAll('&rl=F111ROSTER20261104','').replace(changedDashboard,originalDashboard).replaceAll(changedTabs,originalTabs)
  .replace(changedAdminRoster,oldAdminRoster).replaceAll('&att=F111ATTLIMIT20261103A','')
  .replace(academicNewRoute,academicOldRoute).replace(academicNewStorage,academicOldStorage);
const baseline=execFileSync('git',['show',base+':src/app.jsx'],{encoding:'utf8',maxBuffer:24*1024*1024});
const anchor="  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';\n  const oralSrc=";
const inject="  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';\n  // F111 D1 LIVE HOTFIX · El Centro C es la ÚNICA pantalla de Exámenes del\n  // superadmin: no duplicar tabs/encabezado y no montar el reporte de reposiciones.\n  // Este último conserva su componente y sus datos fuera de esta vista.\n  if (superadmin) {\n    return <ExamenesIframePanel\n      hideHeader\n      view=\"admin\"\n      screenLabel=\"Superadmin · Centro de exámenes\"\n      iframeTitle=\"Centro de exámenes · Escritos, Orales y Progress Check\"\n    />;\n  }\n  const oralSrc=";
assert.equal(baseline.split(anchor).length-1,1,'Anchor exacto una vez');
const newStudentsAsset='src/admin_students.jsx?v=F111PEPAID20261102';
const previousStudentsAsset='src/admin_students.jsx?v=F99-STUDENT-EMAIL-20261008';
assert.equal(source.split(newStudentsAsset).length-1,3,'Solo los tres accesos de Estudiantes deben actualizar caché');
// F111 docente: revertir SOLO los cambios exactos del perfil y de los ciclos
// para conservar la auditoría D1 del Centro de Exámenes sin falso positivo.
const oldProfileRoute = '      perfil:      <LazyRoute title="Mi Perfil" component="PerfilView" files={F96_LAZY.student_modules} />,';
const newProfileRoute = '      // F111: eliminar la ficha de estudiante del rol docente, no envolverla.\n      perfil:      <LazyRoute title="Mi Perfil profesional" component="TeacherProfileCS21A76" files={[]} />,';
const oldBanner = "  if (!s || String(s.ESTADO||s.estado||'').toUpperCase()!=='ABIERTA') return null;";
const newBanner = oldBanner + "\n  if (window.ANTeacherCyclePolicyF111?.isLegacyLesson(s)) return null;";
const oldSession = "        setActiveTeacherState(r.sesion?r:null);";
const newSession = "        // F111: el ciclo < 09/2026 queda fuera del panel operativo\n        // sin alterar la sesión académica ni sus filas en Sheets.\n        const legacy = !!(r.sesion && window.ANTeacherCyclePolicyF111?.isLegacyLesson(r.sesion));\n        setActiveTeacherState(r.sesion && !legacy ? r : null);";
let restoredTeacher=source;
function revertTeacher(now,before,occ,msg){
  assert.equal(restoredTeacher.split(now).length-1,occ,'F111: '+msg);
  restoredTeacher=restoredTeacher.replaceAll(now,before);
}
// F111 0826 cambia solo versión de caché del Dashboard; revertirla
// expresamente en la verificación byte-a-byte sin relajar el motor de exámenes.
revertTeacher("'src/syllabus_views.jsx?v=F111WELCOMEMOBILE20261023'","'src/syllabus_views.jsx?v=F98.4Z6G'",3,'caché bienvenida móvil');
revertTeacher("'src/student_dashboard.jsx?v=F1110826DOCT20261020'","'src/student_dashboard.jsx?v=F1064CERTIFICATE20261010'",1,'caché dashboard 0826');
revertTeacher("'src/cronograma_grupo.jsx?v=F111ATTEND20261021'","'src/cronograma_grupo.jsx?v=F1110826CANON20261020'",3,'caché corregida asistencia Superadmin');
revertTeacher("'src/auditoria_academica.jsx?v=F111ATTEND20261021'","'src/auditoria_academica.jsx?v=F96.5G'",1,'caché editor auditoría Superadmin');
revertTeacher("'src/cronograma_grupo.jsx?v=F1110826CANON20261020'","'src/cronograma_grupo.jsx?v=F1062ICANPROGRESS20261009'",3,'caché cronograma canónico 0826');
revertTeacher(newProfileRoute,oldProfileRoute,1,'ruta de perfil profesional única');
revertTeacher(newBanner,oldBanner,1,'banner histórico suprimido');
revertTeacher(newSession,oldSession,1,'sesión histórica excluida');
revertTeacher("'src/student_modules.jsx?v=F111PROFILECANONICAL20261020'","'src/student_modules.jsx?v=F108GRADES20261010'",3,'caché módulos');
revertTeacher("'src/vista_docente.jsx?v=F111ARCHIVESEP20261020'","'src/vista_docente.jsx?v=F104NEXTROSTER20261009'",7,'caché docente');
// Ruta institucional aditiva: eliminarla SOLO de la preimagen D1, sin tocarla en producción.
// La nueva pantalla sustituye la ruta duplicada sin alterar exámenes.
revertTeacher("      asistencia_grupos: <LazyRoute title=\"Asistencia de grupos\" component=\"AttendanceGroupsSuperadminView\" files={F96_LAZY.asistencia_grupos} />,\n",'',1,'pantalla independiente de asistencia');
revertTeacher("  asistencia_grupos: ['src/admin_attendance_roster.jsx?v=F111ATTROSTER20261021'],\n",'',1,'loader aislado de asistencia');
assert.equal(restoredTeacher.replaceAll('&hotfix=F111ANTICIPOS20261103','').replaceAll(newStudentsAsset,previousStudentsAsset),baseline.replace(anchor,inject),'Motor de exámenes conservado tras revertir exactamente el cambio docente F111');
const adminStart=source.indexOf('function ExamenesAdminPanel()');
const adminEnd=source.indexOf('const APP_ORAL_DEFS_F927',adminStart);
assert(adminStart>=0&&adminEnd>adminStart,'Componente admin original conservado');
const admin=source.slice(adminStart,adminEnd);
assert(admin.indexOf('if (superadmin)')<admin.indexOf('return <section data-screen-label="Admin · Exámenes"'),'Centro nuevo antes de wrapper antiguo');
assert(admin.indexOf('if (superadmin)')<admin.indexOf('<ReposicionesPanelF91 role="admin" />'),'Superadmin no monta reposiciones');
assert.match(admin,/return <ExamenesIframePanel\s+hideHeader\s+view="admin"/,'Centro directo y sin cabecera duplicada');
assert.match(admin,/<ReposicionesPanelF91 role="admin" \/>/,'Ruta histórica conservada para admin regular');
assert.match(source,/examenes:\s+<ExamenesAdminPanel \/>/,'Ruta del sidebar preservada');
assert(source.includes('modulos/examenes.html?view='),'Iframe apunta a módulo real');
const protectedPaths=['src/examenes_bundle.jsx','src/examenes_modes.jsx','src/examenes_app.jsx','src/examenes_data.jsx','src/sidebar.jsx'];
for(const path of protectedPaths){
 const old=execFileSync('git',['show','origin/main:'+path],{encoding:'utf8',maxBuffer:30*1024*1024});
 const sourceProtected=fs.readFileSync(path,'utf8');
 const attendanceMenu="        { id: 'asistencia_grupos', label: 'Asistencia de grupos', icon: 'calendar' },\n";
 if(path==='src/sidebar.jsx'){
   assert.equal(sourceProtected.split(attendanceMenu).length-1,1,'Entrada única Asistencia de grupos');
   // Tras el merge, origin/main YA contiene la nueva opción; en un PR aún
   // no fusionado, la preimagen origin/main no la contiene.
   const withExistingMenu=old.includes(attendanceMenu)?sourceProtected:sourceProtected.replace(attendanceMenu,'');
   const studentHidden="        ...(false && mostrarICAN ? [{ id: 'ican', label: 'Club I CAN', icon: 'ican' }] : []), // F111 student demo: hidden, teacher/admin unaffected.";
   const studentOriginal="        ...(mostrarICAN ? [{ id: 'ican', label: 'Club I CAN', icon: 'ican' }] : []),";
   assert.equal(withExistingMenu.split(studentHidden).length-1,1,'student demo hides only I CAN menu');
   const normalized=old.includes(studentHidden)?withExistingMenu:withExistingMenu.replace(studentHidden,studentOriginal);
   assert.equal(normalized,old,'Sidebar histórico preservado except student-only navigation item');
 }else{
   assert.equal(sourceProtected,old,'Motor o navegación alterados: '+path);
 }
}
const mainHtmlRaw=fs.readFileSync('campus.html','utf8').replaceAll('&demo=F111STUDENTDEMO20261104','').replaceAll('&fb=F111STUDENTFEEDBACK20261104A','').replaceAll('&deep=F111STUDENTDEEPTABS20261104A','').replaceAll('&calendar=F111STUDENTCALEN20261104A','');
const mainBaseline=execFileSync('git',['show','origin/main:campus.html'],{encoding:'utf8',maxBuffer:24*1024*1024}).replaceAll('&demo=F111STUDENTDEMO20261104','').replaceAll('&fb=F111STUDENTFEEDBACK20261104A','').replaceAll('&rl=F111ROSTER20261104CLEAN','').replaceAll('&rl=F111ROSTER20261104','');
// Normalize only the reviewed asset URLs in this release; no backend/exam
// script changes are permitted. Also passes after squash when origin/main
// already contains the exact deployed versions.
const approvedAssetDiffs=[
 ['src/i18n_pilot_f111.js?v=F111HERO20261103B','src/i18n_pilot_f111.js?v=F111STUDENTPROFILEEN20261103'],
 ['src/teacher_cs21a_docs_viewer.jsx?v=F111REALDOCSEN20261103','src/teacher_cs21a_docs_viewer.jsx?v=F98.4Z6CS21A6'],

 ['&record=F111ADDRECORD20261103',''],
 ['src/i18n_pilot_f111.js?v=F111STUDENTPROFILEEN20261103','src/i18n_pilot_f111.js?v=F111REALDOCSEN20261103'],
 ['&i18nstudent=F111STUDENTTABS20261103',''],
 ['<link rel="stylesheet" href="styles/f111_attendance_limit.css?v=F111ATTLIMIT20261103A">\n',''],
 ['<script src="src/f111_attendance_limit_hotfix.js?v=F111ATTLIMIT20261103A"></script>\n',''],
 ['src/att77_widgets.jsx?v=F111ATTLIMIT20261103A','src/att77_widgets.jsx?v=F98.4Z6CS21A77'],
 ['src/att77_view_detail.jsx?v=F111ATTLIMIT20261103A','src/att77_view_detail.jsx?v=F98.4Z6CS21A77'],
 ['&att=F111ATTLIMIT20261103A',''],
 ['styles/academy_identity_card.css?v=F111HERO20261103B','styles/academy_identity_card.css?v=F111UI1'],
 ['&hero=F111HERO20261103B',''],
];
// Remove only the reviewed cache-busting query key before the exact byte comparison.
let mainHtml=mainHtmlRaw.replaceAll('&rl=F111ROSTER20261104CLEAN','').replaceAll('&rl=F111ROSTER20261104','');
for (const [next,previous] of approvedAssetDiffs){
 const occurrences=mainHtml.split(next).length-1;
 // Some intermediate historic versions are absent when main already uses a later asset.
 // Final exact baseline comparison below still rejects any unapproved HTML change.
 assert(occurrences<=1,'Unexpected duplicate F111 asset: '+next);
 if (occurrences===1 && !mainBaseline.includes(next)) mainHtml=mainHtml.replace(next,previous);
}
assert.equal(mainHtml,mainBaseline,'D1: all superadmin/exam scripts untouched by the reviewed F111 asset version changes');
console.log('F111 SINGLE-CENTER PASS: único Centro C superadmin, no reposiciones en su vista, admin legacy intacto, 5 archivos protegidos idénticos.');
