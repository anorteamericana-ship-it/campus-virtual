import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE_SHA='954f7df752651b81efe655b8ad3e030971704b0a';
const BRANCH='integration/secondary-safe-errors-current-tip-cs21a210d';
const exactMode=process.argv.includes('--exact-import');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210D FAIL: ${label}`)};
const read=p=>fs.readFileSync(p);
const text=p=>read(p).toString('utf8');
const gitBlobSha=buf=>crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const imported={
  'src/book_unit_starts_cs21a60.jsx':'5abdab2412938e33ffcae1ea042463909ed25db2',
  'src/cronograma_grupo.jsx':'b4b29b4a3910f05c21505a1bca872ae5f008baa4',
  'src/admin_resources_direct_cs21a74.js':'d7d6d0b87aa3e803eac15b683b6121ce6c164ba2',
  'src/additional_resources_panel_cs21a68.jsx':'0cde70aa72f879c03df865f07179861561239745',
  'src/student_menu_academic_cs21a120.jsx':'af8730ad3a133aa8ec7553deebe97d1d59f2c727',
  'src/student_portal.jsx':'a0f02e3006124e92d1cbce13f8832c3c80d98cd3',
};
const preservedLazy='46f90c843560c74dfda022afbaf650b5fce75572';

const book=text('src/book_unit_starts_cs21a60.jsx');
const crono=text('src/cronograma_grupo.jsx');
const adminRoute=text('src/admin_resources_direct_cs21a74.js');
const additional=text('src/additional_resources_panel_cs21a68.jsx');
const studentMenu=text('src/student_menu_academic_cs21a120.jsx');
const portal=text('src/student_portal.jsx');
const lazy=text('src/lazy_loader.jsx');
const conapeData=text('src/admin_master_conape_data_cs21a96.jsx');
const conapeCore=text('src/admin_master_conape_review_core_cs21a96.jsx');

must(book.includes('function bookResourcesSafeUserError(raw, fallback, context = \'\')'),'book resources safe-error helper exists');
must(book.includes("setError(bookResourcesSafeUserError(reason, 'No se pudo cargar el libro. Reintentá.', 'cargar_libro'))"),'book load error is sanitized');
must(book.includes("setError(bookResourcesSafeUserError(reason, 'No se pudo guardar el inicio de la unidad. Intentá de nuevo.', 'guardar_inicio_unidad'))"),'unit-start save error is sanitized');
must(book.includes("setError(bookResourcesSafeUserError(reason, 'No se pudo actualizar el libro. Intentá de nuevo.', 'actualizar_libro'))"),'book refresh error is sanitized');
must(!book.includes("setError(String(reason?.message || reason || 'No se pudo cargar el libro.'))"),'raw book load exception is not user-visible');

must(crono.includes('function cronoSafeUserError(raw, fallback, context = \'\')'),'cronograma safe-error helper exists');
must(crono.includes("'No hay grupos en curso o proyectados asignados a este docente.'"),'teacher group copy is operational');
must(crono.includes("cronoSafeUserError(e, 'No se pudo cargar la agenda docente. Intentá de nuevo.', 'agenda_docente')"),'teacher agenda error is sanitized');
must(crono.includes("cronoSafeUserError(e, 'No se pudieron guardar los cambios. Intentá de nuevo.', 'guardar_leccion')"),'lesson-save error is sanitized');
must(!crono.includes('No hay grupos en curso o proyectados para este docente según APOLLO.GRUPOS. Revisá columna DOCENTE y fechas de inicio.'),'internal APOLLO/column copy removed from teacher UI');
must(!crono.includes("'Error de conexión cargando grupos docentes desde GRUPOS: ' + (e?.message || e)"),'raw cronograma network error removed from UI');

must(adminRoute.includes("const ADDITIONAL_MODE_KEY = 'an_resources_panel_mode_cs21a68'"),'admin resources route tracks additional mode');
must(adminRoute.includes("const ADDITIONAL_EVENT = 'an:resources-panel-mode'"),'admin resources route listens to additional-mode event');
must(adminRoute.includes('function additionalComponent()'),'admin route resolves AdditionalResourcesPanel');
must(adminRoute.includes("route.mode === 'additional' ? additionalComponent() : viewerComponent()"),'admin route selects effective component by mode');

must(additional.includes('function additionalResourcesSafeUserError(raw, fallback, context = \'\')'),'additional-resources safe-error helper exists');
must(additional.includes("additionalResourcesSafeUserError(error, 'No se pudieron cargar los recursos. Intentá de nuevo.', 'cargar_recursos_adicionales')"),'additional-resources catalog catch is sanitized');
must(!additional.includes("error:clean(error?.message || error || 'No se pudieron cargar los recursos.')"),'raw additional-resources exception is not placed in state.error');

must(studentMenu.includes('function studentAcademicSafeUserError(raw, fallback, context = \'\')'),'student academic safe-error helper exists');
must(studentMenu.includes("'No pudimos preparar esta pantalla. Intentá de nuevo.'"),'student lazy-route copy is safe');
must(studentMenu.includes("studentAcademicSafeUserError(error, 'No pudimos cargar tu resumen académico. Intentá de nuevo.', 'resumen_academico')"),'student summary catch is sanitized');
must(studentMenu.includes("studentAcademicSafeUserError(error, 'No pudimos cargar el contenido académico. Intentá de nuevo.', 'catalogo_estudiante')"),'student catalog catch is sanitized');
must(studentMenu.includes("studentAcademicSafeUserError(error, 'No pudimos cargar el audio. Intentá de nuevo.', 'audio_estudiante')"),'student private-audio catch is sanitized');
must(!studentMenu.includes('error:error?.message||String(error)'),'student menu no longer writes raw exception into visible error state');

must(portal.includes('function studentPortalSafeUserError(raw, fallback, context = \'\')'),'student portal safe-error helper exists');
must(portal.includes("studentPortalSafeUserError(d?.error || base?.error, 'No pudimos cargar tu portal. Intentá de nuevo.', 'portal_y_fallback')"),'portal/fallback visible error is sanitized');
must(!portal.includes("error:d?.error || base?.error || 'No se pudo cargar el portal.'"),'portal no longer exposes backend raw error');
must(portal.includes("postStudentPortal('getPortalEstudianteCompleto', { codigo })"),'primary portal endpoint preserved');
must(portal.includes("postStudentPortal('getEstudiante', { codigo }).catch(() => null)"),'honest portal fallback preserved');

must(gitBlobSha(read('src/lazy_loader.jsx'))===preservedLazy,'newer CS21A124 lazy loader is preserved exactly');
must(lazy.includes("const safeError = 'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.'"),'newer lazy loader keeps safe visible copy');
must(lazy.includes('waitForRouteEnhancers(component)'),'newer lazy loader route-enhancer behavior is preserved');

must(conapeData.includes('const moraResult=await refreshMora(false);if(!moraResult?.ok)return'),'CS21A210C truthful CONAPE refresh is preserved');
must(conapeCore.includes('request_id|policy_unbound|sec00|getConape|getComentario|guardarComentario|actualizarPanel'),'CS21A210C technical boundary is preserved');

for(const [path] of Object.entries(imported)){
  const src=text(path);
  must(!/setSharing\s*\(|DriveApp\.Access\.ANYONE|ANYONE_WITH_LINK|setPermission\s*\(/i.test(src),`${path} has no Drive ACL mutation`);
}

if(exactMode){
  for(const [path,expected] of Object.entries(imported))must(gitBlobSha(read(path))===expected,`${path} exactly matches validated source blob ${expected}`);
  const allowed=new Set([
    ...Object.keys(imported),
    'scripts/qa_secondary_safe_errors_current_tip_cs21a210d.mjs',
    '.github/workflows/qa-secondary-safe-errors-current-tip-cs21a210d.yml',
    '00_DOCUMENTACION/SECONDARY_SAFE_ERRORS_CURRENT_TIP_CS21A210D_2026-08-31.md'
  ]);
  const changed=execFileSync('git',['diff','--name-only',`${BASE_SHA}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  for(const path of changed)must(allowed.has(path),`unexpected stacked path: ${path}`);
  for(const path of allowed)must(changed.includes(path),`expected stacked path missing: ${path}`);
  const statuses=execFileSync('git',['diff','--name-status',`${BASE_SHA}...HEAD`],{encoding:'utf8'});
  must(!/^D\s/m.test(statuses),'no deletion in CS21A210D');
  must(!changed.some(path=>(/(^|\/)(AppsScript|apps_script_patches)(\/|$)|\.gs$/i).test(path)),'no Apps Script source change');
}

console.log('CS21A210D SECONDARY SAFE ERRORS CURRENT TIP: PASS');
console.log(`BASE=${BASE_SHA}`);
console.log(`BRANCH=${BRANCH}`);
console.log(`EXACT_IMPORT=${exactMode?'VERIFIED':'SKIPPED_FOR_DESCENDANT'}`);
console.log('FUNCTIONAL_FILES=6');
console.log('LAZY_LOADER_NEWER_VERSION=PRESERVED');
console.log('SEC006_ACL_CHANGE=NO');
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
