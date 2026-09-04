import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/importador_banco_integridad_cs21a114.jsx';
const LOADER='src/importador_banco_loader_cs21a114.js';
const BASE_BLOB='8f7495f21c4da95eae9fc180c67e9d778f89195e';
const ANCHOR="const BANK114_URL = window.APPS_SCRIPT_URL;\n";
const HELPER=`\nfunction bank114SafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).replace(/\\s+/g,' ').trim();\n  if (msg) console.warn('[ImportadorBCR] Detalle técnico oculto al operador.', { context, error:msg });\n  if (/sesión administrativa no está disponible/i.test(msg)) return 'Tu sesión administrativa no está disponible. Ingresá nuevamente.';\n  if (/no se encontraron movimientos válidos/i.test(msg)) return 'No se encontraron movimientos válidos en el archivo BCR.';\n  if (/la base cambió durante la revisión/i.test(msg)) return 'Los datos cambiaron durante la revisión. Se recalcularon los estados; revisá los conflictos.';\n  return fallback;\n}\n`;
const OLD_ANALYZE=`    } catch (e) {\n      const missing = /endpoint_no_encontrado|no encontrado|previsualizar/i.test(String(e?.message||e));\n      setError(missing ? 'El frontend ya está corregido, pero falta publicar Code.gs CS21A114 en Apps Script.' : String(e?.message||e));\n    } finally { setCargando(false); }`;
const NEW_ANALYZE=`    } catch (e) {\n      setError(bank114SafeUserError(e?.message||e, 'No pudimos validar el extracto bancario. Intentá nuevamente.', 'previsualizar_extracto'));\n    } finally { setCargando(false); }`;
const OLD_FILE="      } catch (err) { setError('Error al leer el archivo: ' + err.message); }";
const NEW_FILE="      } catch (err) { setError(bank114SafeUserError(err?.message||err, 'No pudimos leer el archivo seleccionado. Revisá que sea un extracto BCR válido.', 'leer_archivo')); }";
const OLD_CONFIRM="    } catch (e) { setError(String(e?.message||e)); }";
const NEW_CONFIRM="    } catch (e) { setError(bank114SafeUserError(e?.message||e, 'No pudimos completar la importación. Revisá los movimientos e intentá nuevamente.', 'importar_extracto')); }";

function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
function replaceOnce(src,a,b,label){const n=src.split(a).length-1;must(n===1,`${label}: ${n} coincidencias`);return src.replace(a,b);}

const src=fs.readFileSync(FILE,'utf8');
const loader=fs.readFileSync(LOADER,'utf8');
must(src.includes(HELPER),'Falta helper AH.');
must(src.includes(NEW_ANALYZE),'Falta frontera segura de previsualización.');
must(src.includes(NEW_FILE),'Falta frontera segura de lectura.');
must(src.includes(NEW_CONFIRM),'Falta frontera segura de confirmación.');
must(!src.includes(OLD_ANALYZE),'Permanece error técnico de previsualización.');
must(!src.includes(OLD_FILE),'Permanece err.message visible de lectura.');
must(!src.includes(OLD_CONFIRM),'Permanece error raw visible de confirmación.');
must(!src.includes('falta publicar Code.gs CS21A114 en Apps Script'),'Permanece copy técnico de Apps Script.');

// El helper nunca retorna texto arbitrario: solo 3 mensajes locales conocidos o fallback controlado.
must(src.includes("if (/sesión administrativa no está disponible/i.test(msg)) return 'Tu sesión administrativa no está disponible. Ingresá nuevamente.';"),'Falta mapping de sesión.');
must(src.includes("if (/no se encontraron movimientos válidos/i.test(msg)) return 'No se encontraron movimientos válidos en el archivo BCR.';"),'Falta mapping de archivo vacío.');
must(src.includes("if (/la base cambió durante la revisión/i.test(msg)) return 'Los datos cambiaron durante la revisión. Se recalcularon los estados; revisá los conflictos.';"),'Falta mapping de concurrencia.');
must(src.includes('return fallback;'),'El helper debe cerrar con fallback controlado.');

// Contrato de integridad CS21A114 congelado.
must(src.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"),'Se alteró token administrativo.');
must(src.includes("bank114Post('previsualizarExtractoBanco', { filas:movs })"),'Se alteró previsualizarExtractoBanco.');
must(src.includes("bank114Post('importarExtracto',{ filas })"),'Se alteró importarExtracto.');
must(src.includes("data?.error === 'conflictos_bancarios'"),'Se alteró manejo de conflicto concurrente.');
must(src.includes('await analizar(movimientos.map(({indice,estado,diferencias,existente,...m}) => m))'),'Se alteró reanálisis antes de reintento.');
must(src.includes("const docs = new Set(data.agregados_docs || []);"),'Se alteró confirmación por agregados_docs.');
must(src.includes("const bank114New = m => m.estado === 'NUEVO';"),'Se alteró estado NUEVO.');
must(src.includes("['YA_EXISTE','DUPLICADO_ARCHIVO'].includes(m.estado)"),'Se alteraron estados existentes.');
must(src.includes("['CONFLICTO','CONFLICTO_ARCHIVO'].includes(m.estado)"),'Se alteraron estados conflicto.');
must(src.includes('window.ImportadorBancario = window.ImportadorBancarioCS21A114;'),'Se alteró instalación del reemplazo CS21A114.');
must(loader.includes("const src='src/importador_banco_integridad_cs21a114.jsx?v=F98.4Z6CS21A114';"),'Loader ya no apunta al reemplazo efectivo.');

// Reversión exacta: solo AH debe separar candidato y preimagen.
let restored=src;
restored=replaceOnce(restored,ANCHOR+HELPER,ANCHOR,'remove helper');
restored=replaceOnce(restored,NEW_ANALYZE,OLD_ANALYZE,'restore analyze');
restored=replaceOnce(restored,NEW_FILE,OLD_FILE,'restore file');
restored=replaceOnce(restored,NEW_CONFIRM,OLD_CONFIRM,'restore confirm');
must(sha(restored)===BASE_BLOB,`Reversión AH no reconstruye preimagen exacta: ${sha(restored)}`);
console.log('OK: CS21A210AH safe-error boundary + CS21A114 integrity contract + exact preimage reconstruction');
