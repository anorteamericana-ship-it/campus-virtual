import fs from 'node:fs';

const corePath = 'src/admin_master_conape_review_core_cs21a96.jsx';
const dataPath = 'src/admin_master_conape_data_cs21a96.jsx';
let core = fs.readFileSync(corePath, 'utf8');
let data = fs.readFileSync(dataPath, 'utf8');

function replaceOnce(target, label, from, to) {
  const count = target.split(from).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  return target.replace(from, to);
}

core = replaceOnce(core, 'insert safe helper', `return data}\nfunction pendingAmount`, `return data}\nfunction masterConapeSafeUserError(raw,fallback,context){const msg=clean(raw);if(!msg)return fallback;const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg),technicalText=/apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request_id|policy_unbound|sec00|getConape|getComentario|guardarComentario|actualizarPanel/i.test(msg);if(technicalCode||technicalText){console.warn('[MasterCONAPE] Detalle técnico oculto al operador.',{context,error:msg});return fallback}return msg}\nfunction pendingAmount`);
core = replaceOnce(core, 'export safe helper', `,post,pendingAmount,`, `,post,masterConapeSafeUserError,pendingAmount,`);

data = replaceOnce(data, 'import safe helper', `const{clean,levelId,isAcademicDisbursement01,post,uniqueSorted,dedupeMovementRows,filterRows,compareRowsMulti,normalizeSortStack}=N;`, `const{clean,levelId,isAcademicDisbursement01,post,masterConapeSafeUserError,uniqueSorted,dedupeMovementRows,filterRows,compareRowsMulti,normalizeSortStack}=N;`);
data = replaceOnce(data, 'sanitize mora refresh', `}catch(error){if(!silent)setMsg(error?.message||String(error))}finally{liveRef.current=false}`, `}catch(error){if(!silent)setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo verificar la morosidad en este momento. Intentá de nuevo.','verificar_morosidad'))}finally{liveRef.current=false}`);
data = replaceOnce(data, 'sanitize panel refresh', `}catch(error){setMsg(error.message||String(error))}finally{setBusy(false)}}`, `}catch(error){setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo actualizar CONAPE en este momento. Intentá de nuevo.','actualizar_conape'))}finally{setBusy(false)}}`);
data = replaceOnce(data, 'sanitize detail load', `}catch(error){setEditor(x=>x?{...x,loading:false,error:error.message||String(error)}:x)}}`, `}catch(error){setEditor(x=>x?{...x,loading:false,error:masterConapeSafeUserError(error?.message||String(error),'No se pudo cargar el seguimiento del estudiante. Intentá de nuevo.','cargar_seguimiento')}:x)}}`);
data = replaceOnce(data, 'sanitize detail save', `}catch(error){setEditor(x=>x?{...x,saving:false,error:error.message||String(error)}:x)}}`, `}catch(error){setEditor(x=>x?{...x,saving:false,error:masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar el seguimiento. Intentá de nuevo.','guardar_seguimiento')}:x)}}`);

fs.writeFileSync(corePath, core);
fs.writeFileSync(dataPath, data);
console.log('CS21A194R2 exact master CONAPE safe-error patch applied');
