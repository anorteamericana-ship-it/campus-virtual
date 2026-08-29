import fs from 'node:fs';

function patchFile(path, patches) {
  let s = fs.readFileSync(path, 'utf8');
  for (const [oldText, newText, label] of patches) {
    const count = s.split(oldText).length - 1;
    if (count !== 1) throw new Error(`${path} · ${label}: expected exact preimage once, found ${count}`);
    s = s.replace(oldText, newText);
  }
  fs.writeFileSync(path, s, 'utf8');
}

const helper = `function quickUpdateSafeUserError(raw,fallback,context=''){const msg=clean(raw);if(!msg)return fallback;const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg),technicalText=/apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|\\bbase64\\b|sha-?256|\\bmime\\b|file_id|request_id|policy_unbound|sec00|apollo\\.|getEstudiante|getComprobantes|aplicarPuesta|aplicarPago|sincronizarConape/i.test(msg);if(technicalCode||technicalText){console.warn('[QuickUpdate] Detalle técnico oculto al operador.',{context,error:msg});return fallback}return msg}`;

patchFile('src/admin_students_quick_update_core_cs21a99.js', [
  [
    'async function post(fn,payload={},timeout=90000)',
    `${helper}\nasync function post(fn,payload={},timeout=90000)`,
    'insert shared sanitizer'
  ],
  [
    'Object.assign(N,{BUILD,h,NEXT,LABEL,STATUS,clean,upper,num,round,money,requestId,post,fillDebt,injectStyles});',
    'Object.assign(N,{BUILD,h,NEXT,LABEL,STATUS,clean,upper,num,round,money,requestId,quickUpdateSafeUserError,post,fillDebt,injectStyles});',
    'export sanitizer'
  ],
]);

patchFile('src/admin_students_quick_update_state_cs21a99.js', [
  [
    'const N=window.ANQuickUpdate99,{NEXT,clean,upper,num,round,money,requestId,post,fillDebt}=N;',
    'const N=window.ANQuickUpdate99,{NEXT,clean,upper,num,round,money,requestId,quickUpdateSafeUserError,post,fillDebt}=N;',
    'import sanitizer'
  ],
  [
    "async function legacy(){if(nuevo===actual)return props.onClose?.();setBusy('legacy');setError('');try{const r=await post('actualizarEstatus',{codigo,cod_estudiante:codigo,nivel,estatus:nuevo,nota:estudiante.nota??null,grupo});props.onClose?.();setTimeout(()=>props.onSuccess?.(r),0)}catch(e){setError(e.message||String(e))}finally{setBusy('')}}",
    "async function legacy(){if(nuevo===actual)return props.onClose?.();setBusy('legacy');setError('');try{const r=await post('actualizarEstatus',{codigo,cod_estudiante:codigo,nivel,estatus:nuevo,nota:estudiante.nota??null,grupo});props.onClose?.();setTimeout(()=>props.onSuccess?.(r),0)}catch(e){setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo guardar el cambio de estatus. Intentá de nuevo.','legacy_estatus'))}finally{setBusy('')}}",
    'legacy error'
  ],
  [
    "async function academicSave(){setBusy('academic');setError('');try{const r=await post('aplicarPuestaAlDiaAcademica',{request_id:academicReq.current,codigo,cod_estudiante:codigo,nivel,nota:estudiante.nota??null,grupo},120000);setAcademic(r);setModel(r.pago||null);setSelected({});setStep(r.pago?.sin_deuda||!r.pago?.items?.some(x=>x.seleccionable)?'CONAPE':'PAYMENT')}catch(e){setError(e.message||String(e))}finally{setBusy('')}}",
    "async function academicSave(){setBusy('academic');setError('');try{const r=await post('aplicarPuestaAlDiaAcademica',{request_id:academicReq.current,codigo,cod_estudiante:codigo,nivel,nota:estudiante.nota??null,grupo},120000);setAcademic(r);setModel(r.pago||null);setSelected({});setStep(r.pago?.sin_deuda||!r.pago?.items?.some(x=>x.seleccionable)?'CONAPE':'PAYMENT')}catch(e){setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo actualizar el expediente académico. Intentá de nuevo.','actualizar_academico'))}finally{setBusy('')}}",
    'academic error'
  ],
  [
    "async function receiptFind(){const doc=clean(query);if(!/^\\d{4,}$/.test(doc))return setError('Pegá el número exacto del comprobante bancario.');setBusy('receipt');setError('');try{const r=await post('getComprobantes',{numero_documento:doc,consulta_en:Date.now()},50000),found=(r.comprobantes||[]).find(x=>clean(x.doc)===doc);if(!found)throw Error(`El comprobante ${doc} no existe o ya no tiene saldo disponible.`);setReceipt(found);setSelected(fillDebt(items,found))}catch(e){setReceipt(null);setSelected({});setError(e.message||String(e))}finally{setBusy('')}}",
    "async function receiptFind(){const doc=clean(query);if(!/^\\d{4,}$/.test(doc))return setError('Pegá el número exacto del comprobante bancario.');setBusy('receipt');setError('');try{const r=await post('getComprobantes',{numero_documento:doc,consulta_en:Date.now()},50000),found=(r.comprobantes||[]).find(x=>clean(x.doc)===doc);if(!found)throw Error(`El comprobante ${doc} no existe o ya no tiene saldo disponible.`);setReceipt(found);setSelected(fillDebt(items,found))}catch(e){setReceipt(null);setSelected({});setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo consultar el comprobante. Intentá de nuevo.','buscar_comprobante'))}finally{setBusy('')}}",
    'receipt error'
  ],
  [
    "const rubros=items.filter(x=>num(selected[x.tipo])>.009).map(x=>({tipo:x.tipo,nivel:model.nivel,monto:round(selected[x.tipo]),grupo:model.grupo}));setBusy('payment');setError('');try{const r=await post('aplicarPagoPuestaAlDia',{request_id:paymentReq.current,codigo,doc:receipt.doc,monto_total:total,rubros},120000);setPayment(r);setStep('CONAPE')}catch(e){setError(e.message||String(e))}finally{setBusy('')}}",
    "const rubros=items.filter(x=>num(selected[x.tipo])>.009).map(x=>({tipo:x.tipo,nivel:model.nivel,monto:round(selected[x.tipo]),grupo:model.grupo}));setBusy('payment');setError('');try{const r=await post('aplicarPagoPuestaAlDia',{request_id:paymentReq.current,codigo,doc:receipt.doc,monto_total:total,rubros},120000);setPayment(r);setStep('CONAPE')}catch(e){setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo aplicar el pago. Intentá de nuevo.','aplicar_pago'))}finally{setBusy('')}}",
    'payment error'
  ],
  [
    "setFresh(last);setBusy('');if(!freshReady(last,academic)){finishingRef.current=false;setStep('DONE');setError(lastError?.message||'El cambio quedó guardado, pero la ficha todavía no terminó de refrescar. Usá “Cargar estudiante actualizado”.');return}",
    "setFresh(last);setBusy('');if(!freshReady(last,academic)){finishingRef.current=false;setStep('DONE');setError(quickUpdateSafeUserError(lastError?.message,'El cambio quedó guardado, pero la ficha todavía no terminó de refrescar. Usá “Cargar estudiante actualizado”.','refrescar_ficha'));return}",
    'fresh retry error'
  ],
  [
    "async function conapeSync(){if(syncingRef.current||busy)return;syncingRef.current=true;setBusy('conape');setError('');try{const r=await post('sincronizarConapePuestaAlDia',{codigo,operacion_id:payment?.operacion_id||'',request_id:conapeReq.current},120000);setConape(r);await loadFreshAndReturn(r)}catch(e){syncingRef.current=false;setError(e.message||String(e));setBusy('')}}",
    "async function conapeSync(){if(syncingRef.current||busy)return;syncingRef.current=true;setBusy('conape');setError('');try{const r=await post('sincronizarConapePuestaAlDia',{codigo,operacion_id:payment?.operacion_id||'',request_id:conapeReq.current},120000);setConape(r);await loadFreshAndReturn(r)}catch(e){syncingRef.current=false;setError(quickUpdateSafeUserError(e?.message||String(e),'No se pudo actualizar CONAPE. Intentá de nuevo.','sincronizar_conape'));setBusy('')}}",
    'CONAPE error'
  ],
]);

patchFile('src/admin_students_quick_update_payment_cs21a99.js', [
  [
    "const N=window.ANQuickUpdate99,{h,num,money,Steps,Summary,LineCard,ErrorBox}=N;",
    "const N=window.ANQuickUpdate99,{h,num,money,quickUpdateSafeUserError,Steps,Summary,LineCard,ErrorBox}=N;",
    'import sanitizer'
  ],
  [
    "h('div',{className:'a99-ok'},s.academic?.mensaje||'Expediente académico actualizado.'),",
    "h('div',{className:'a99-ok'},quickUpdateSafeUserError(s.academic?.mensaje,'Expediente académico actualizado.','academic_success')),
",
    'sanitize academic message'
  ],
]);

console.log('CS21A189 exact patch applied');
