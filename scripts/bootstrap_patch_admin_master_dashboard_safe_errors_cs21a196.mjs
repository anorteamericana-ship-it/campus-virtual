import fs from 'node:fs';
const path='src/admin_master_dashboard.jsx';
let src=fs.readFileSync(path,'utf8');
function rep(oldText,newText,label){const count=src.split(oldText).length-1;if(count!==1)throw new Error(`${label}: expected 1 preimage, found ${count}`);src=src.replace(oldText,newText);console.log(`${label}: replaced 1`)}

rep(
`  return data;\n}\nfunction masterWhatsAppPhone(v){`,
`  return data;\n}\nfunction masterSafeUserError(raw,fallback,context=''){\n  const msg=String(raw==null?'':raw).trim();\n  if(!msg)return fallback;\n  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText=/apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|actualizarPanelConapeAhora|getSuperAdminMasterDashboard|getSuperAdminSeguimientoResumen|getSeguimientoReleaseEstado|ejecutarSmokeTestSeguimiento|confirmarVersionEstableSeguimiento/i.test(msg);\n  if(technicalCode||technicalText){console.warn('[MasterDashboard] Detalle técnico oculto al operador.',{context,error:msg});return fallback;}\n  return msg;\n}\nfunction masterWhatsAppPhone(v){`,
'insert masterSafeUserError');

rep(`catch(e){setMsg(e.message||String(e));}`,`catch(e){setMsg(masterSafeUserError(e?.message||String(e),'No se pudo actualizar CONAPE. Intentá de nuevo.','actualizar_conape'));}`,'CONAPE manual refresh');
rep(`conapeAutoSync={ok:false,error:error?.message||String(error),movimientos_registrados:0,nuevos:0};`,`conapeAutoSync={ok:false,error:masterSafeUserError(error?.message||String(error),'No se pudo sincronizar CONAPE. Intentá de nuevo.','sincronizar_conape'),movimientos_registrados:0,nuevos:0};`,'CONAPE auto sync');
rep(`setState(current=>({loading:false,error:error?.message||String(error),data:current.data}));`,`setState(current=>({loading:false,error:masterSafeUserError(error?.message||String(error),'No se pudo actualizar el Panel Maestro. Intentá de nuevo.','cargar_panel_maestro'),data:current.data}));`,'master data load');
rep(`.catch(e=>setState(s=>({loading:false,error:e.message||String(e),data:s.data})));`,`.catch(e=>setState(s=>({loading:false,error:masterSafeUserError(e?.message||String(e),'No se pudo cargar el seguimiento. Intentá de nuevo.','cargar_seguimiento'),data:s.data})));`,'tracking load');
rep(`catch(e){setRegistry(s=>({loading:false,error:e.message||String(e),data:s.data}));}`,`catch(e){setRegistry(s=>({loading:false,error:masterSafeUserError(e?.message||String(e),'No se pudo consultar el historial de publicación. Intentá de nuevo.','historial_publicacion'),data:s.data}));}`,'release registry');
rep(`catch(e){setState({loading:false,error:e.message||String(e),data:null});}`,`catch(e){setState({loading:false,error:masterSafeUserError(e?.message||String(e),'No se pudo ejecutar el control de publicación. Intentá de nuevo.','control_publicacion'),data:null});}`,'smoke control');
rep(`catch(e){setState(s=>({...s,error:e.message||String(e)}));}`,`catch(e){setState(s=>({...s,error:masterSafeUserError(e?.message||String(e),'No se pudo registrar la versión estable. Intentá de nuevo.','registrar_version_estable')}));}`,'stable confirmation');
rep(`title={syncFailed?syncMeta.error:'CONAPE se consulta al entrar y cada 30 minutos.'}`,`title={syncFailed?'La última sincronización de CONAPE no se completó.':'CONAPE se consulta al entrar y cada 30 minutos.'}`,'safe CONAPE tooltip');

fs.writeFileSync(path,src);
console.log('CS21A196 exact Master Dashboard safe-error patch applied');
