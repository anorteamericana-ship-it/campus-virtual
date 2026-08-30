import fs from 'node:fs';

const src = fs.readFileSync('src/cronograma_grupo.jsx', 'utf8');
const install = fs.readFileSync('src/calendar88_install.js', 'utf8');

const must = (ok, label) => {
  if (!ok) {
    console.error(`CS21A200C FAIL: ${label}`);
    process.exit(1);
  }
};

must(src.includes("function cronoSafeUserError(raw, fallback, context = '')"), 'falta frontera de error del cronograma');
must(src.includes("cronoSafeUserError(d?.mensaje || d?.error, 'No hay grupos en curso o proyectados asignados a este docente.', 'cargar_grupos_docente')"), 'grupos docente no saneados');
must(src.includes("cronoSafeUserError(e, 'No pudimos cargar los grupos asignados. Intentá de nuevo.', 'cargar_grupos_docente')"), 'red grupos docente no saneada');
must(src.includes("cronoSafeUserError(d?.error, 'No se pudo cargar el calendario académico. Intentá de nuevo.', 'cargar_grupos_admin')"), 'grupos admin no saneados');
must(src.includes("cronoSafeUserError(e, 'No se pudo cargar el calendario académico. Intentá de nuevo.', 'cargar_grupos_admin')"), 'red grupos admin no saneada');
must(src.includes("cronoSafeUserError(e, 'No se pudieron cargar las lecciones. Intentá de nuevo.', 'cargar_lecciones')"), 'lecciones no saneadas');
must(src.includes("cronoSafeUserError(d?.mensaje || d?.error, 'No se pudieron cargar las lecciones de este grupo.', 'agenda_grupo')"), 'agenda por grupo no saneada');
must(src.includes("cronoSafeUserError(e, 'No se pudieron cargar las lecciones de este grupo.', 'agenda_grupo')"), 'red agenda por grupo no saneada');
must(src.includes("cronoSafeUserError(e, 'No se pudo cargar la agenda docente. Intentá de nuevo.', 'agenda_docente')"), 'agenda docente no saneada');
must(src.includes("cronoSafeUserError(res?.error, 'No se pudo asignar la cobertura. Intentá de nuevo.', 'asignar_cobertura')"), 'cobertura no saneada');
must(src.includes("cronoSafeUserError(r?.error, 'No se pudieron cargar los estudiantes. Intentá de nuevo.', 'cargar_estudiantes')"), 'carga estudiantes no saneada');
must(src.includes("cronoSafeUserError(e, 'No se pudieron cargar los estudiantes. Intentá de nuevo.', 'cargar_estudiantes')"), 'red estudiantes no saneada');
must(src.includes("cronoSafeUserError(e, 'No se pudieron guardar los cambios. Intentá de nuevo.', 'guardar_leccion')"), 'guardado lección no saneado');

must(!src.includes('según APOLLO.GRUPOS. Revisá columna DOCENTE'), 'copy interno APOLLO.GRUPOS sigue visible');
must(!src.includes("setErrorGrupos('Error de conexión cargando grupos docentes desde GRUPOS: '"), 'error técnico de grupos docente sigue visible');
must(!src.includes("setErrorGrupos('Error de red: ' + (e?.message || e))"), 'error técnico de grupos admin sigue visible');
must(!src.includes("setErrorAgenda('No se pudo cargar la agenda docente: ' + (e?.message || e))"), 'error técnico de agenda sigue visible');
must(!src.includes("setErrCarga('Error de red: ' + e.message)"), 'error técnico de estudiantes sigue visible');
must(!src.includes("setErrEnvio(e.message || 'Error guardando cambios.')"), 'error técnico de guardado sigue visible');

must(src.includes("postCronoGrupo('getGrupoInfo'"), 'endpoint estudiante getGrupoInfo preservado');
must(src.includes("postCronoGrupo('getGruposActivos'"), 'endpoint getGruposActivos preservado');
must(src.includes("postCronoGrupo('getFechasGrupo'"), 'endpoint getFechasGrupo preservado');
must(src.includes("const TODOS_GRUPOS = '__TODOS__';"), 'sentinel global preservado');
must(src.includes("typeof window.TodosLosGruposView === 'function'"), 'resolución dinámica de vista global preservada');
must(install.includes('window.TodosLosGruposView = core.CalendarView;'), 'override efectivo CS21A88 preservado');
must(src.includes('No pudimos cargar las lecciones de tu grupo. Intentá de nuevo o contactá a la administración.'), 'fallback estudiante preservado');

console.log('CS21A200C CRONOGRAMA SAFE ERRORS: PASS');
console.log('EFFECTIVE_INDIVIDUAL_SURFACE=cronograma_grupo.jsx');
console.log('GLOBAL_OVERRIDE_CS21A88=PRESERVED');
console.log('STUDENT_SAFE_COPY=PRESERVED');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
