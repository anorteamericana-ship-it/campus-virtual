import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/app.jsx';
const BASE_BLOB='d57cf007013beca1b1830d2993ad69be8e049f64';
const ANCHOR=`  } finally { clearTimeout(timer); }\n}\nfunction reposEstadoF91(estado) {`;
const HELPER=`  } finally { clearTimeout(timer); }\n}\n\nfunction appSafeUserErrorF91(raw, fallback, context = '') {\n  const msg=String(raw?.message ?? raw ?? '').replace(/\\s+/g,' ').trim();\n  if(!msg)return fallback;\n  const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText=/apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|file[_ -]?id|sha-?256|mime|base64|reposListarExamenes|reposResolverExamen|reposResolverSolicitudF92|reposProgramarEscrito|reposCoordinarOralF926|getMisNotasF921|examGetCronogramaExamAvailability/i.test(msg);\n  if(technicalCode||technicalText){console.warn('[CampusApp] Detalle técnico oculto al usuario.',{context,error:msg});return fallback;}\n  return msg;\n}\nfunction reposEstadoF91(estado) {`;
const OLD_LOAD=`  const load=React.useCallback(()=>{setLoading(true);setError('');appPostF91('reposListarExamenes').then(r=>setRows(r.rows||[])).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);`;
const NEW_LOAD=`  const load=React.useCallback(()=>{setLoading(true);setError('');appPostF91('reposListarExamenes').then(r=>setRows(r.rows||[])).catch(e=>setError(appSafeUserErrorF91(e,'No pudimos consultar las reposiciones. Intentá nuevamente.','repos_listar'))).finally(()=>setLoading(false));},[]);`;
const OLD_ACT=`}catch(e){setError(e.message);}finally{setBusy('');}};`;
const NEW_ACT=`}catch(e){setError(appSafeUserErrorF91(e,'No pudimos completar la operación de reposición. Intentá nuevamente.','repos_accion'));}finally{setBusy('');}};`;
const OLD_STUDENT=`      .catch(e=>setState({loading:false,error:e.message||String(e),evals:[],repos:[],nivelActivo:''}));`;
const NEW_STUDENT=`      .catch(e=>setState({loading:false,error:appSafeUserErrorF91(e,'No pudimos cargar tus evaluaciones. Intentá nuevamente.','evaluaciones_estudiante'),evals:[],repos:[],nivelActivo:''}));`;
const OLD_WRITTEN=`      .catch(e=>setState({loading:false,error:e.message||String(e),assigned:false,data:null}));`;
const NEW_WRITTEN=`      .catch(e=>setState({loading:false,error:appSafeUserErrorF91(e,'No pudimos verificar la disponibilidad del examen escrito. Intentá nuevamente.','examen_escrito_docente'),assigned:false,data:null}));`;

function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
function replaceOnce(src,a,b,label){const n=src.split(a).length-1;must(n===1,`${label}: ${n} coincidencias`);return src.replace(a,b);}
const src=fs.readFileSync(FILE,'utf8');
for(const [needle,label] of [[HELPER,'helper'],[NEW_LOAD,'repos load'],[NEW_ACT,'repos action'],[NEW_STUDENT,'student evaluations'],[NEW_WRITTEN,'teacher written availability']]) must(src.includes(needle),`Falta ${label}`);
for(const [needle,label] of [[OLD_LOAD,'raw repos load'],[OLD_ACT,'raw repos action'],[OLD_STUDENT,'raw student evaluations'],[OLD_WRITTEN,'raw teacher written']]) must(!src.includes(needle),`Permanece ${label}`);

// Mantener mensajes humanos de negocio y ocultar diagnósticos/códigos técnicos.
must(src.includes('if(!msg)return fallback;'),'Helper no conserva fallback vacío.');
must(src.includes('if(technicalCode||technicalText)'),'Helper perdió frontera técnica.');
must(src.includes("return msg;\n}\nfunction reposEstadoF91"),'Helper debe conservar mensajes humanos no técnicos.');
must(src.includes("console.warn('[CampusApp] Detalle técnico oculto al usuario.'"),'Falta diagnóstico solo en consola.');

// Contratos funcionales congelados.
for(const invariant of [
  "appPostF91('reposListarExamenes')",
  "endpoint='reposResolverExamen'",
  "endpoint='reposResolverSolicitudF92'",
  "endpoint='reposProgramarEscrito'",
  "endpoint='reposCoordinarOralF926'",
  "appPostF91('getMisNotasF921',{codigo},60000)",
  "appPostF91('examGetCronogramaExamAvailability',{cod_grupo:group,nivel:level,tipo:'ORDINARIO'},60000)",
  "banco: ['src/importador_banco.jsx?v=F96.5G','src/importador_banco_integridad_cs21a114.jsx?v=F98.4Z6CS21A114']",
]) must(src.includes(invariant),`Contrato alterado: ${invariant}`);

let restored=src;
restored=replaceOnce(restored,NEW_WRITTEN,OLD_WRITTEN,'restore written');
restored=replaceOnce(restored,NEW_STUDENT,OLD_STUDENT,'restore student');
restored=replaceOnce(restored,NEW_ACT,OLD_ACT,'restore action');
restored=replaceOnce(restored,NEW_LOAD,OLD_LOAD,'restore load');
restored=replaceOnce(restored,HELPER,ANCHOR,'remove helper');
must(sha(restored)===BASE_BLOB,`Reversión AT no reconstruye preimagen exacta: ${sha(restored)} != ${BASE_BLOB}`);
console.log('QA APP SHARED SAFE ERRORS CS21A210AT PASS');
