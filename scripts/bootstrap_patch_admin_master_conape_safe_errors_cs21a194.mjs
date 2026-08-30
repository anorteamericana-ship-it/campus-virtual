import fs from 'node:fs';

function patchFile(path, replacements) {
  let src = fs.readFileSync(path,'utf8');
  for (const [oldText,newText,label] of replacements) {
    const count = src.split(oldText).length - 1;
    if (count !== 1) throw new Error(`${path} · ${label}: expected 1 preimage, found ${count}`);
    src = src.replace(oldText,newText);
    console.log(`${path} · ${label}: replaced 1`);
  }
  fs.writeFileSync(path,src);
}

patchFile('src/admin_master_conape_review_core_cs21a96.jsx', [
  [
    `async function post(fn,payload={}){`,
    `function safeUserError(raw,fallback,context=''){const msg=clean(raw);if(!msg)return fallback;const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg),technicalText=/apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|\\bbase64\\b|sha-?256|\\bmime\\b|file_id|request_id|getConape|setConape|actualizarPanelConapeAhora|getComentarioAdminEstudiante|guardarComentarioAdminEstudiante/i.test(msg);if(technicalCode||technicalText){console.warn('[MasterCONAPE] Detalle técnico oculto al operador.',{context,error:msg});return fallback}return msg}\nasync function post(fn,payload={}){`,
    'insert shared safeUserError'
  ],
  [
    `matchesSearch,post,pendingAmount`,
    `matchesSearch,safeUserError,post,pendingAmount`,
    'export safeUserError'
  ]
]);

patchFile('src/admin_master_conape_data_cs21a96.jsx', [
  [
    `const{clean,levelId,isAcademicDisbursement01,post,uniqueSorted,dedupeMovementRows,filterRows,compareRowsMulti,normalizeSortStack}=N;`,
    `const{clean,levelId,isAcademicDisbursement01,safeUserError,post,uniqueSorted,dedupeMovementRows,filterRows,compareRowsMulti,normalizeSortStack}=N;`,
    'import safeUserError'
  ],
  [
    `}catch(error){if(!silent)setMsg(error?.message||String(error))}finally{liveRef.current=false}`,
    `}catch(error){if(!silent)setMsg(safeUserError(error?.message||String(error),'No se pudo verificar la morosidad. Intentá de nuevo.','verificar_morosidad'))}finally{liveRef.current=false}`,
    'sanitize mora refresh'
  ],
  [
    `}catch(error){setMsg(error.message||String(error))}finally{setBusy(false)}}`,
    `}catch(error){setMsg(safeUserError(error?.message||String(error),'No se pudo actualizar CONAPE. Intentá de nuevo.','actualizar_panel'))}finally{setBusy(false)}}`,
    'sanitize manual refresh'
  ],
  [
    `}catch(error){setEditor(x=>x?{...x,loading:false,error:error.message||String(error)}:x)}}`,
    `}catch(error){setEditor(x=>x?{...x,loading:false,error:safeUserError(error?.message||String(error),'No se pudo cargar el seguimiento. Intentá de nuevo.','cargar_seguimiento')}:x)}}`,
    'sanitize detail load'
  ],
  [
    `}catch(error){setEditor(x=>x?{...x,saving:false,error:error.message||String(error)}:x)}}`,
    `}catch(error){setEditor(x=>x?{...x,saving:false,error:safeUserError(error?.message||String(error),'No se pudo guardar el seguimiento. Intentá de nuevo.','guardar_seguimiento')}:x)}}`,
    'sanitize detail save'
  ]
]);

patchFile('src/admin_master_conape_review_state_cs21a96.jsx', [
  [
    `const{clean,reviewStepValue,isAcademicDisbursement01,post}=N;`,
    `const{clean,reviewStepValue,isAcademicDisbursement01,safeUserError,post}=N;`,
    'import safeUserError'
  ],
  [
    `  }catch(error){\n   delete localRef.current[id];\n   if(clean(error?.message).toLowerCase().includes('cerrado'))setReviewSteps(current=>({...current,[id]:0}));else setReviewSteps(current=>({...current,[id]:previous}));\n   setMsg(error?.message||String(error));\n  }finally{setReviewBusy('')}`,
    `  }catch(error){\n   const rawError=error?.message||String(error);\n   delete localRef.current[id];\n   if(clean(rawError).toLowerCase().includes('cerrado'))setReviewSteps(current=>({...current,[id]:0}));else setReviewSteps(current=>({...current,[id]:previous}));\n   setMsg(safeUserError(rawError,'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision'));\n  }finally{setReviewBusy('')}`,
    'sanitize review save'
  ]
]);

patchFile('src/admin_master_conape_wa_cs21a96.jsx', [
  [
    `const {WA_TEMPLATES,clean,phone,levelId,periodKind,post,pendingAmount,waText}=N;`,
    `const {WA_TEMPLATES,clean,phone,levelId,periodKind,safeUserError,post,pendingAmount,waText}=N;`,
    'import safeUserError'
  ],
  [
    `alert('No se pudo preparar WhatsApp: '+(e?.message||e))`,
    `alert(safeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp'))`,
    'sanitize WhatsApp alert'
  ]
]);

patchFile('src/admin_master_conape_panel_cs21a96.jsx', [
  [
    `const{clean,levelId,injectStyles,useConapePanelData:baseUseConapePanelData,useConapeReview,PanelView,filterRows,compareRowsMulti,uniqueSorted,normalizeSortStack,historyPeriodCandidates}=N,VALID=['B1','B2','I1','I2'];`,
    `const{clean,levelId,safeUserError,injectStyles,useConapePanelData:baseUseConapePanelData,useConapeReview,PanelView,filterRows,compareRowsMulti,uniqueSorted,normalizeSortStack,historyPeriodCandidates}=N,VALID=['B1','B2','I1','I2'];`,
    'import safeUserError'
  ],
  [
    `}catch(error){if(alive.current)setState(x=>({loading:false,error:error?.message||String(error),data:x.data}))}finally{running.current=false}`,
    `}catch(error){if(alive.current)setState(x=>({loading:false,error:safeUserError(error?.message||String(error),'No se pudo cargar el Panel Maestro CONAPE. Intentá de nuevo.','cargar_panel_maestro'),data:x.data}))}finally{running.current=false}`,
    'sanitize master panel load'
  ]
]);

console.log('CS21A194 exact Master CONAPE safe-error patch applied');
