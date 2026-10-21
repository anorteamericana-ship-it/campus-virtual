// F111 · Hotfix Campus real: centro único superadmin, sin cambios académicos.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='ffd25fc9253e295d0412cf799e51631f37ee6431';
const source=fs.readFileSync('src/app.jsx','utf8');
const baseline=execFileSync('git',['show',base+':src/app.jsx'],{encoding:'utf8',maxBuffer:24*1024*1024});
const anchor="  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';\n  const oralSrc=";
const inject="  const superadmin=String(ses?.rol||'').toLowerCase()==='superadmin';\n  // F111 D1 LIVE HOTFIX · El Centro C es la ÚNICA pantalla de Exámenes del\n  // superadmin: no duplicar tabs/encabezado y no montar el reporte de reposiciones.\n  // Este último conserva su componente y sus datos fuera de esta vista.\n  if (superadmin) {\n    return <ExamenesIframePanel\n      hideHeader\n      view=\"admin\"\n      screenLabel=\"Superadmin · Centro de exámenes\"\n      iframeTitle=\"Centro de exámenes · Escritos, Orales y Progress Check\"\n    />;\n  }\n  const oralSrc=";
assert.equal(baseline.split(anchor).length-1,1,'Anchor exacto una vez');
const newStudentsAsset='src/admin_students.jsx?v=F111I2PROJECTED20261020';
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
assert.equal(restoredTeacher.replaceAll(newStudentsAsset,previousStudentsAsset),baseline.replace(anchor,inject),'Motor de exámenes conservado tras revertir exactamente el cambio docente F111');
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
   const normalized=old.includes(attendanceMenu)?sourceProtected:sourceProtected.replace(attendanceMenu,'');
   assert.equal(normalized,old,'Sidebar histórico preservado salvo ruta aditiva');
 }else{
   assert.equal(sourceProtected,old,'Motor o navegación alterados: '+path);
 }
}
const mainHtml=fs.readFileSync('campus.html','utf8');
const mainBaseline=execFileSync('git',['show','origin/main:campus.html'],{encoding:'utf8',maxBuffer:24*1024*1024});
const currentAppSrc=(mainHtml.match(/src[/]app[.]jsx[?]v=[A-Za-z0-9_.-]+/)||[])[0];
const baselineAppSrc=(mainBaseline.match(/src[/]app[.]jsx[?]v=[A-Za-z0-9_.-]+/)||[])[0];
const currentSidebarSrc=(mainHtml.match(/src[/]sidebar[.]jsx[?]v=[A-Za-z0-9_.-]+/)||[])[0];
const baselineSidebarSrc=(mainBaseline.match(/src[/]sidebar[.]jsx[?]v=[A-Za-z0-9_.-]+/)||[])[0];
assert(currentSidebarSrc&&baselineSidebarSrc,'Se conserva asset del menú Superadmin');
assert(currentAppSrc&&baselineAppSrc,'Se conserva asset principal del Campus');
// El HTML F111 agrega únicamente el loader del filtro y el asset de
// perfil profesional, sin reordenar otros scripts productivos.
const oldProfileScript='<script type="text/babel" data-plugins="transform-block-scoping" src="src/teacher_profile_cs21a76.jsx?v=F98.4Z6CS21A76"></script>';
const newProfileScript='<script src="src/teacher_cycle_policy_f111.js?v=F111ARCHIVESEP20261020"></script>\n<script type="text/babel" data-plugins="transform-block-scoping" src="src/teacher_profile_cs21a76.jsx?v=F111PROFILECANONICAL20261020"></script>';
assert.equal(mainHtml.split(newProfileScript).length-1,1,'F111: activos docentes sólo una vez');
if (mainBaseline.includes(newProfileScript)) {
  // En el push posterior al merge, origin/main ya contiene la corrección.
  // Se exige igualdad exacta y se evita revertirla contra sí misma.
  // Únicamente se permite modificar el cache-bust del punto de entrada:
  // se mantiene sin alterar el resto del HTML, los motores y los scripts.
  const expectedApp='src/app.jsx?v=F111ATTROSTER20261021';
  const expectedSidebar='src/sidebar.jsx?v=F111ATTEND20261021';
  assert.equal(currentAppSrc,expectedApp,'F111: app Superadmin con versión de asistencia actual');
  assert.equal(currentSidebarSrc,expectedSidebar,'F111: sidebar Superadmin con versión de asistencia actual');
  assert.equal(mainHtml.replace(currentAppSrc,baselineAppSrc).replace(currentSidebarSrc,baselineSidebarSrc),
    mainBaseline,'MAIN conserva HTML F111 salvo cache-bust de app y sidebar');
} else {
  // En el PR original, origin/main todavía no incluía el cambio.
  // Se mantiene la prueba de inversión exacta de las líneas nuevas.
  let restoredHtml=mainHtml.replace(newProfileScript,oldProfileScript);
  restoredHtml=restoredHtml.replace(currentAppSrc,baselineAppSrc);
  assert.equal(restoredHtml,mainBaseline,'HTML conserva fuente original al revertir cambios explícitos F111');
}
console.log('F111 SINGLE-CENTER PASS: único Centro C superadmin, no reposiciones en su vista, admin legacy intacto, 5 archivos protegidos idénticos.');
