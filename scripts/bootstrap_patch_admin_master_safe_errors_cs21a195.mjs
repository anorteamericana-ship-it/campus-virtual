import fs from 'node:fs';

const path = 'src/admin_master_dashboard.jsx';
let s = fs.readFileSync(path, 'utf8');
function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
}

const helper = `function masterSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|\\bversion\\b|\\bdetalle\\b|getSuperAdmin|actualizarPanelConapeAhora|ejecutarSmokeTest|confirmarVersionEstable/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[AdminMaster] Detalle técnico oculto al operador.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n`;

one(
  'insert Panel Maestro sanitizer',
  "  return data;\n}\nfunction masterWhatsAppPhone(v)",
  "  return data;\n}\n" + helper + "function masterWhatsAppPhone(v)"
);

one(
  'manual CONAPE refresh error',
  "catch(e){setMsg(e.message||String(e));}",
  "catch(e){setMsg(masterSafeUserError(e?.message || String(e), 'No se pudo actualizar CONAPE. Intentá de nuevo.', 'actualizar_conape'));}"
);

one(
  'automatic CONAPE sync error',
  "conapeAutoSync={ok:false,error:error?.message||String(error),movimientos_registrados:0,nuevos:0};",
  "conapeAutoSync={ok:false,error:masterSafeUserError(error?.message || String(error), 'No se pudo actualizar CONAPE. Intentá de nuevo.', 'auto_sync_conape'),movimientos_registrados:0,nuevos:0};"
);

one(
  'Panel Maestro load error',
  "setState(current=>({loading:false,error:error?.message||String(error),data:current.data}));",
  "setState(current=>({loading:false,error:masterSafeUserError(error?.message || String(error), 'No pudimos cargar el Panel Maestro. Intentá de nuevo.', 'cargar_panel'),data:current.data}));"
);

one(
  'tracking load error',
  ".catch(e=>setState(s=>({loading:false,error:e.message||String(e),data:s.data})));",
  ".catch(e=>setState(s=>({loading:false,error:masterSafeUserError(e?.message || String(e), 'No se pudo cargar el seguimiento. Intentá de nuevo.', 'cargar_seguimiento'),data:s.data})));"
);

one(
  'release registry error',
  "catch(e){setRegistry(s=>({loading:false,error:e.message||String(e),data:s.data}));}",
  "catch(e){setRegistry(s=>({loading:false,error:masterSafeUserError(e?.message || String(e), 'No se pudo consultar el historial de publicación. Intentá de nuevo.', 'historial_publicacion'),data:s.data}));}"
);

one(
  'publication control error',
  "catch(e){setState({loading:false,error:e.message||String(e),data:null});}",
  "catch(e){setState({loading:false,error:masterSafeUserError(e?.message || String(e), 'No se pudo completar el control de publicación. Intentá de nuevo.', 'control_publicacion'),data:null});}"
);

one(
  'stable version registration error',
  "catch(e){setState(s=>({...s,error:e.message||String(e)}));}",
  "catch(e){setState(s=>({...s,error:masterSafeUserError(e?.message || String(e), 'No se pudo registrar la versión estable. Intentá de nuevo.', 'registrar_version_estable')}));}"
);

one(
  'CONAPE chip title safe boundary',
  "title={syncFailed?syncMeta.error:'CONAPE se consulta al entrar y cada 30 minutos.'}",
  "title={syncFailed?masterSafeUserError(syncMeta.error, 'CONAPE no pudo actualizarse. Intentá de nuevo.', 'estado_conape'):'CONAPE se consulta al entrar y cada 30 minutos.'}"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A195 exact Panel Maestro safe-error patch applied');
