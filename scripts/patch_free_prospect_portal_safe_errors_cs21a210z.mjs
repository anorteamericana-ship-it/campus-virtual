import fs from 'node:fs';

const path='src/prospect_free_student.jsx';
let src=fs.readFileSync(path,'utf8');
function replaceOnce(from,to,label){
  const n=src.split(from).length-1;
  if(n!==1) throw new Error(`${label}: expected 1 preimage, found ${n}`);
  src=src.replace(from,to);
}

replaceOnce(
  "async function freeStudentPost(fn,payload={}){",
  `function freeStudentVisibleError(error,fallback,context=''){\n  const raw=error&&typeof error==='object'?(error.message||error.error||error.mensaje||error):error;\n  if(raw) console.error('[Prematricula]',context||'operación',raw);\n  const text=String(raw==null?'':raw).trim();\n  if(/failed to fetch|network(?:error)?|load failed|fetch failed|connection|conexi[oó]n/i.test(text)) return fallback;\n  return freeStudentSafeError(text,fallback);\n}\n\nasync function freeStudentPost(fn,payload={}){`,
  'insert visible-error boundary'
);
replaceOnce(
  'setError(e.message);\n        setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||\'Prematrícula\'});',
  "setError(freeStudentVisibleError(e,'No pudimos cargar tu información. Intentá nuevamente o contactá a tu asesor.','freeUserMiPerfil'));\n        setPerfil({nombre:usuario?.nombre,cedula:usuario?.cedula,correo:usuario?.correo,telefono:usuario?.telefono,etapa:usuario?.etapa||'Prematrícula'});",
  'profile load catch'
);
replaceOnce(
  "}catch(e){setError(e.message);setLastAction('No se pudo solicitar.');}",
  "}catch(e){setError(freeStudentVisibleError(e,'No se pudo solicitar la entrada. Intentá nuevamente.','freeUserCrearSolicitud:QUIERO_MATRICULARME'));setLastAction('No se pudo solicitar.');}",
  'entry request catch'
);
replaceOnce(
  "}catch(e){setError(e.message);setLastAction('No se pudo contactar.');}",
  "}catch(e){setError(freeStudentVisibleError(e,'No se pudo contactar al asesor. Intentá nuevamente.','freeUserCrearSolicitud:HABLAR_ASESOR'));setLastAction('No se pudo contactar.');}",
  'advisor request catch'
);

fs.writeFileSync(path,src);
console.log('CS21A210Z PATCH OK');
