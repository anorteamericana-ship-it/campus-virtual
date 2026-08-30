import fs from 'node:fs';

const path = 'src/student_menu_academic_cs21a120.jsx';
const src = fs.readFileSync(path, 'utf8');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(src.includes('function studentAcademicSafeUserError('), 'safe-error helper missing');
must(src.includes("console.warn('[StudentAcademic] Detalle técnico oculto al estudiante.'"), 'technical diagnostics must remain console-only');

must(!src.includes("error:'El cargador del Campus no está disponible.'"), 'loader implementation detail still visible');
must(!src.includes(".catch(error=>setState({loading:false,error:error?.message||String(error)}));"), 'raw lazy/summary error still visible');
must(!src.includes(".catch(error=>setState({loading:false,error:error?.message||String(error),catalog:null}));"), 'raw catalog error still visible');
must(!src.includes(".catch(error=>live&&setState({loading:false,error:error?.message||String(error),src:''}));"), 'raw audio error still visible');

must(src.includes("'No pudimos preparar esta pantalla. Intentá de nuevo.'"), 'generic screen fallback missing');
must(src.includes("'No pudimos cargar tu resumen académico. Intentá de nuevo.'"), 'summary fallback missing');
must(src.includes("'No pudimos cargar el contenido académico. Intentá de nuevo.'"), 'catalog fallback missing');
must(src.includes("'No pudimos cargar el audio. Intentá de nuevo.'"), 'audio fallback missing');

// Business/access semantics must remain intact.
must(src.includes("post('getBibliotecaNivelEstudiante'"), 'student catalog endpoint changed');
must(src.includes("post('getAudioPistaEstudiante'"), 'student audio endpoint changed');
must(src.includes("response?.acceso===false"), 'backend access-denied branch removed');
must(src.includes("response?.motivo||'La biblioteca no está habilitada para tu estado académico.'"), 'human access message removed');
must(src.includes("URL.createObjectURL(new Blob([bytes],{type:response.audio.mime||'audio/mpeg'}))"), 'private audio Blob/ObjectURL path changed');
must(src.includes("URL.revokeObjectURL(url)"), 'audio ObjectURL revoke removed');
must(src.includes("window.ProgramInfoSharedCS21A119"), 'program info route changed unexpectedly');
must(src.includes("window.AdditionalResourcesPanel"), 'additional resources route changed unexpectedly');

console.log('CS21A200G STUDENT ACADEMIC MENU SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('BUSINESS_ACCESS_MESSAGES=PRESERVED');
console.log('CATALOG_AND_AUDIO_ENDPOINTS=PRESERVED');
