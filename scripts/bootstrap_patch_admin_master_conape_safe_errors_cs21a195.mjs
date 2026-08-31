import fs from 'node:fs';

function replaceExact(src, oldText, newText, label, expected = 1) {
  const count = src.split(oldText).length - 1;
  if (count !== expected) throw new Error(`${label}: expected ${expected}, found ${count}`);
  console.log(`${label}: replaced ${count}`);
  return src.replace(oldText, newText);
}

const corePath = 'src/admin_master_conape_review_core_cs21a96.jsx';
const dataPath = 'src/admin_master_conape_data_cs21a96.jsx';
const reviewPath = 'src/admin_master_conape_review_state_cs21a96.jsx';
let core = fs.readFileSync(corePath, 'utf8');
let data = fs.readFileSync(dataPath, 'utf8');
let review = fs.readFileSync(reviewPath, 'utf8');

const helper = String.raw`function masterConapeSafeUserError(raw,fallback,context=''){
 const msg=clean(raw);if(!msg)return fallback;
 const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
 const technicalText=/apps?\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\bjson\b|\btoken\b|unauthorized|forbidden|internal server|http\s*\d{3}|status\s*\d{3}|respuesta inv[aá]lida|getConapeMoraStates|actualizarPanelConapeAhora|getComentarioAdminEstudiante|guardarComentarioAdminEstudiante|getConapeRevisionChanges|setConapeRevisionSemaforo/i.test(msg);
 if(technicalCode||technicalText){console.warn('[MasterCONAPE] Detalle técnico oculto al operador.',{context,error:msg});return fallback}
 return msg;
}`;

core = replaceExact(
  core,
  'return data}\nfunction pendingAmount',
  `return data}\n${helper}\nfunction pendingAmount`,
  'core helper insertion'
);
core = replaceExact(
  core,
  'matchesSearch,post,pendingAmount',
  'matchesSearch,post,masterConapeSafeUserError,pendingAmount',
  'core helper export'
);

data = replaceExact(
  data,
  'const{clean,levelId,isAcademicDisbursement01,post,uniqueSorted,dedupeMovementRows,filterRows,compareRowsMulti,normalizeSortStack}=N;',
  'const{clean,levelId,isAcademicDisbursement01,post,masterConapeSafeUserError,uniqueSorted,dedupeMovementRows,filterRows,compareRowsMulti,normalizeSortStack}=N;',
  'data helper import'
);
data = replaceExact(
  data,
  'catch(error){if(!silent)setMsg(error?.message||String(error))}',
  "catch(error){if(!silent)setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad. Intentá de nuevo.','verificar_morosidad'))}",
  'mora visible error'
);
data = replaceExact(
  data,
  'catch(error){setMsg(error.message||String(error))}finally{setBusy(false)}',
  "catch(error){setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo actualizar el panel CONAPE. Intentá de nuevo.','actualizar_panel'))}finally{setBusy(false)}",
  'panel refresh visible error'
);
data = replaceExact(
  data,
  'catch(error){setEditor(x=>x?{...x,loading:false,error:error.message||String(error)}:x)}}',
  "catch(error){setEditor(x=>x?{...x,loading:false,error:masterConapeSafeUserError(error?.message||String(error),'No se pudo cargar el seguimiento. Intentá de nuevo.','cargar_seguimiento')}:x)}}",
  'detail load visible error'
);
data = replaceExact(
  data,
  'catch(error){setEditor(x=>x?{...x,saving:false,error:error.message||String(error)}:x)}}',
  "catch(error){setEditor(x=>x?{...x,saving:false,error:masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar el seguimiento. Intentá de nuevo.','guardar_seguimiento')}:x)}}",
  'detail save visible error'
);

review = replaceExact(
  review,
  'const{clean,reviewStepValue,isAcademicDisbursement01,post}=N;',
  'const{clean,reviewStepValue,isAcademicDisbursement01,post,masterConapeSafeUserError}=N;',
  'review helper import'
);
review = replaceExact(
  review,
  'setMsg(error?.message||String(error));',
  "setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision'));",
  'review visible error'
);

fs.writeFileSync(corePath, core);
fs.writeFileSync(dataPath, data);
fs.writeFileSync(reviewPath, review);
console.log('CS21A195 exact Panel Maestro CONAPE safe-error patch applied');