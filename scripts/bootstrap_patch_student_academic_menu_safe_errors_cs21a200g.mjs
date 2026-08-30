import fs from 'node:fs';

const path = 'src/student_menu_academic_cs21a120.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(before, after);
}

const anchor = '  function ensureCss(){';
const helper = `  function studentAcademicSafeUserError(raw, fallback, context = '') {\n    const msg = String(raw?.message ?? raw ?? '').trim();\n    if (!msg) return fallback;\n    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request_id|file_id|base64|sha-?256|mime|anlazycampus|mountstudentacademicsummary|getbibliotecanivelestudiante|getaudiopistaestudiante|cargador del campus|no se encontr[oó] el componente/i.test(msg);\n    if (technicalCode || technicalText) {\n      console.warn('[StudentAcademic] Detalle técnico oculto al estudiante.', { context, error: msg });\n      return fallback;\n    }\n    return msg;\n  }\n\n`;
replaceExact(anchor, helper + anchor, 'insert safe-error helper');

replaceExact(
  "      if (!loader?.loadMany) { setState({loading:false,error:'El cargador del Campus no está disponible.'}); return; }",
  "      if (!loader?.loadMany) { setState({loading:false,error:'No pudimos preparar esta pantalla. Intentá de nuevo.'}); return; }",
  'lazy loader missing copy'
);

replaceExact(
  "      }).catch(error=>setState({loading:false,error:error?.message||String(error)}));\n    },[component,JSON.stringify(files||[])]);",
  "      }).catch(error=>setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos preparar esta pantalla. Intentá de nuevo.', 'cargar_pantalla')}));\n    },[component,JSON.stringify(files||[])]);",
  'lazy route catch'
);

replaceExact(
  "      }).catch(error=>setState({loading:false,error:error?.message||String(error)}));\n    },[]);",
  "      }).catch(error=>setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos cargar tu resumen académico. Intentá de nuevo.', 'resumen_academico')}));\n    },[]);",
  'summary catch'
);

replaceExact(
  "      }).catch(error=>setState({loading:false,error:error?.message||String(error),catalog:null}));",
  "      }).catch(error=>setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos cargar el contenido académico. Intentá de nuevo.', 'catalogo_estudiante'),catalog:null}));",
  'catalog catch'
);

replaceExact(
  "      }).catch(error=>live&&setState({loading:false,error:error?.message||String(error),src:''}));",
  "      }).catch(error=>live&&setState({loading:false,error:studentAcademicSafeUserError(error, 'No pudimos cargar el audio. Intentá de nuevo.', 'audio_estudiante'),src:''}));",
  'audio catch'
);

replaceExact(
  "    if(typeof Component!=='function')return <ErrorCard text=\"No se encontró el panel de recursos adicionales.\"/>;",
  "    if(typeof Component!=='function')return <ErrorCard text=\"No pudimos preparar Recursos adicionales. Intentá de nuevo.\"/>;",
  'additional resources component copy'
);

replaceExact(
  "      return typeof Component==='function'?<Component/>:<ErrorCard text=\"No se encontró Información General del Programa.\"/>;",
  "      return typeof Component==='function'?<Component/>:<ErrorCard text=\"No pudimos preparar Información General del Programa. Intentá de nuevo.\"/>;",
  'program info component copy'
);

fs.writeFileSync(path, src);
console.log('CS21A200G exact student academic menu safe-error patch applied');
