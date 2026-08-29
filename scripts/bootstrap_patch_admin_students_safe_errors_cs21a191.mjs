import fs from 'node:fs';

const path='src/admin_students.jsx';
let s=fs.readFileSync(path,'utf8');

function one(label,oldText,newText){
  const n=s.split(oldText).length-1;
  if(n!==1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s=s.replace(oldText,newText);
}
function many(label,oldText,newText,min=1){
  const n=s.split(oldText).length-1;
  if(n<min) throw new Error(`${label}: expected at least ${min}, found ${n}`);
  s=s.split(oldText).join(newText);
  console.log(`${label}: replaced ${n}`);
}

const helper=`function adminStudentsSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|\\bbase64\\b|sha-?256|\\bmime\\b|file_id|request_id|policy_unbound|sec00|apollo\\.|getAdmin|getRadiografia|getEstudiante|getCierre|ejecutarCierre|sincronizarCONAPE|generarCertificado|simularCambio|ejecutarCambio/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[AdminStudents] Detalle técnico oculto al operador.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n`;

one('insert sanitizer',"function abrirPdfBackend(payload, fallbackUrl = '') {",helper+"\nfunction abrirPdfBackend(payload, fallbackUrl = '') {");
one('individual CONAPE resync catch',"return { ok: false, error: 'Error de conexión: ' + (e.message || e) };","return { ok: false, error: adminStudentsSafeUserError(e?.message || String(e), 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'resincronizar_estudiante') };");
one('groups backend response',"setError((d && d.error) || 'Respuesta no válida del servidor');","setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No pudimos cargar los grupos. Intentá de nuevo.', 'cargar_grupos')); ");
one('groups catch',".catch(e => { if (activo) setError('Error de conexión: ' + (e.message || e)); })",".catch(e => { if (activo) setError(adminStudentsSafeUserError(e?.message || String(e), 'No pudimos cargar los grupos. Intentá de nuevo.', 'cargar_grupos')); })");
one('radiography backend response',"else setError((d && (d.error || d.mensaje)) || 'No se pudo cargar la radiografía del grupo.');","else setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No pudimos cargar la radiografía del grupo. Intentá de nuevo.', 'cargar_radiografia')); ");
one('radiography catch',".catch(e => { if (activo) setError('Error de conexión: ' + (e?.message || e)); })",".catch(e => { if (activo) setError(adminStudentsSafeUserError(e?.message || String(e), 'No pudimos cargar la radiografía del grupo. Intentá de nuevo.', 'cargar_radiografia')); })");
one('status backend response',"setError(data.error || 'Error al actualizar');","setError(adminStudentsSafeUserError(data?.error || data?.mensaje, 'No se pudo actualizar el estatus. Intentá de nuevo.', 'actualizar_estatus')); ");
one('status CONAPE retry',"setReintentoMsg('⚠ ' + (r.error || 'No se pudo sincronizar'));","setReintentoMsg('⚠ ' + adminStudentsSafeUserError(r?.error || r?.mensaje, 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'reintentar_conape')); ");
one('projection catch',"alert('No se creó la proyección: ' + (err?.message || err));","alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo crear la proyección. Intentá de nuevo.', 'crear_proyeccion')); ");
many('generic err alerts',"alert(err?.message || String(err));","alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));",1);
many('generic e alerts',"alert(e?.message||String(e));","alert(adminStudentsSafeUserError(e?.message||String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));",1);
many('setError legacy connection',"setError('Error de conexión: ' + (e.message || e));","setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));",1);
many('setError optional connection',"setError('Error de conexión: ' + (e?.message || e));","setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo completar la operación. Intentá de nuevo.', 'admin_operacion'));",1);
one('student detail catch',".catch(e => setError('Error de conexión: ' + e.message))",".catch(e => setError(adminStudentsSafeUserError(e?.message || String(e), 'No se pudo cargar el expediente. Intentá de nuevo.', 'cargar_expediente')))");
one('student detail backend response',".then(d => { if (d.ok) setDetalle(d); else setError(d.error || 'Error al cargar'); })",".then(d => { if (d.ok) setDetalle(d); else setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No se pudo cargar el expediente. Intentá de nuevo.', 'cargar_expediente')); })");
one('grade catch result',"setResultado({ ok:false, error:'Error de conexión: ' + (e.message || e) });","setResultado({ ok:false, error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo guardar la calificación. Intentá de nuevo.', 'guardar_calificacion') });");
one('grade result renderer',"`❌ ${resultado.error || resultado.mensaje || 'No se pudo guardar.'}`","`❌ ${adminStudentsSafeUserError(resultado.error || resultado.mensaje, 'No se pudo guardar. Intentá de nuevo.', 'resultado_calificacion')}`");
one('close preview backend response',"else setError((d && (d.mensaje || d.error)) || 'No se pudo cargar la vista previa del cierre.');","else setError(adminStudentsSafeUserError(d?.mensaje || d?.error, 'No se pudo cargar la vista previa del cierre. Intentá de nuevo.', 'preview_cierre')); ");
one('close execute backend response',"setError((d && (d.mensaje || d.error)) || 'No se pudo ejecutar el cierre académico.');","setError(adminStudentsSafeUserError(d?.mensaje || d?.error, 'No se pudo ejecutar el cierre académico. Intentá de nuevo.', 'ejecutar_cierre')); ");
one('CONAPE paused toast raw detail',"setToast({ tipo: 'err', msg: `Sincronización pausada${last?.procesados != null ? ` en ${last.procesados}/${last.total}` : ''}. No reinicie desde cero: presione Sync CONAPE para reanudar. Detalle: ${e.message || e}` });","console.warn('[AdminStudents] Sincronización CONAPE pausada.', e);\n      setToast({ tipo: 'err', msg: `Sincronización pausada${last?.procesados != null ? ` en ${last.procesados}/${last.total}` : ''}. Podés reanudarla con Sync CONAPE.` });");
one('certificate regeneration catch',"setCertEstado({ ok:false, masivo:true, regenerando:true, error:'Error de conexión: ' + (e?.message || e), nivel });","setCertEstado({ ok:false, masivo:true, regenerando:true, error:adminStudentsSafeUserError(e?.message || String(e), 'No se pudo regenerar los certificados. Intentá de nuevo.', 'regenerar_certificados'), nivel });");
one('certificate error renderer',"{certEstado.mensaje || certEstado.error}","{adminStudentsSafeUserError(certEstado.mensaje || certEstado.error, 'No se pudo completar la operación de certificados. Intentá de nuevo.', 'certificados')}");
one('change-group context backend',"if (!r?.ok) { setError(r?.error || 'No se pudo evaluar el expediente.'); return; }","if (!r?.ok) { setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No se pudo evaluar el expediente. Intentá de nuevo.', 'evaluar_cambio_grupo')); return; }");
one('change-group simulation backend',"if (!r?.ok) setError(r?.error || 'No fue posible simular el movimiento.');","if (!r?.ok) setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No fue posible simular el movimiento. Intentá de nuevo.', 'simular_cambio_grupo')); ");
one('change-group execute backend',"if (!r?.ok) { setError(r?.error || 'No fue posible ejecutar el movimiento.'); return; }","if (!r?.ok) { setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No fue posible ejecutar el movimiento. Intentá de nuevo.', 'ejecutar_cambio_grupo')); return; }");
one('change-group success message',"alert(r?.mensaje || (r?.ya_aplicado ? 'El movimiento ya estaba aplicado; no se creó un duplicado.' : 'Movimiento aplicado correctamente.'));","alert(adminStudentsSafeUserError(r?.mensaje, r?.ya_aplicado ? 'El movimiento ya estaba aplicado; no se creó un duplicado.' : 'Movimiento aplicado correctamente.', 'resultado_cambio_grupo')); ");
one('history loader',"function cargar(){setEstado({loading:true,error:'',rows:[]});postAdminStudents('getHistorialCambiosGrupo',{codigo}).then(r=>{if(r?.ok)setEstado({loading:false,error:'',rows:r.historial||[]});else setEstado({loading:false,error:r?.error||'No se pudo cargar el historial.',rows:[]});}).catch(e=>setEstado({loading:false,error:'Error de conexión: '+(e?.message||e),rows:[]}));}","function cargar(){setEstado({loading:true,error:'',rows:[]});postAdminStudents('getHistorialCambiosGrupo',{codigo}).then(r=>{if(r?.ok)setEstado({loading:false,error:'',rows:r.historial||[]});else setEstado({loading:false,error:adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo cargar el historial. Intentá de nuevo.','cargar_historial'),rows:[]});}).catch(e=>setEstado({loading:false,error:adminStudentsSafeUserError(e?.message||String(e),'No se pudo cargar el historial. Intentá de nuevo.','cargar_historial'),rows:[]}));}");
one('history revert raw fallbacks',"${(r.bloqueos||[]).join('\\\n')||r.error}`:(r?.error||'No se pudo revertir.'))","${(r.bloqueos||[]).join('\\\n')||adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo revertir.','revertir_cambio')}`:adminStudentsSafeUserError(r?.error||r?.mensaje,'No se pudo revertir.','revertir_cambio'))");
one('agenda ficha backend response',"error:(ficha&&ficha.error)||'No se pudo cargar el expediente.'","error:adminStudentsSafeUserError(ficha?.error||ficha?.mensaje,'No se pudo cargar el expediente. Intentá de nuevo.','agenda_expediente')");
one('agenda catch',"error:'Error de conexión: '+(e?.message||e)","error:adminStudentsSafeUserError(e?.message||String(e),'No se pudo cargar el expediente. Intentá de nuevo.','agenda_expediente')");

fs.writeFileSync(path,s,'utf8');
console.log('CS21A191 exact admin_students safe-error patch applied');
