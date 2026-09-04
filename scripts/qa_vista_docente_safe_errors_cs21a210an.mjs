import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/vista_docente.jsx';
const BASE_BLOB='63c80d004caba982156f5f7ed53c53d1490e7cf7';
const ANCHOR='function VistaDocente({ cedulaOverride, nombreOverride } = {}) {';
const HELPER=`function vistaDocenteSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).replace(/\\s+/g, ' ').trim();\n  if (msg) console.warn('[VistaDocente] Detalle técnico oculto al docente.', { context, error: msg });\n  return fallback;\n}\n\n`;
const OLD_REFETCH="      .catch(e => setError(e.message || 'Error de conexión.'))";
const NEW_REFETCH=`      .catch(e => setError(vistaDocenteSafeUserError(e && e.message, 'No pudimos cargar tus pendientes. Intentá nuevamente.', 'refetch_docente')))`;
const OLD_INITIAL="      .catch(e => { if (!cancel) setError(e.message || 'Error de conexión.'); })";
const NEW_INITIAL=`      .catch(e => {\n        if (cancel) return;\n        setError(vistaDocenteSafeUserError(e && e.message, 'No pudimos cargar tus pendientes. Intentá nuevamente.', 'carga_docente'));\n      })`;
function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
const src=fs.readFileSync(FILE,'utf8');
const app=fs.readFileSync('src/app.jsx','utf8');

must(src.includes(HELPER),'Falta helper AN.');
must(src.includes(NEW_REFETCH),'Falta frontera segura de refetch.');
must(src.includes(NEW_INITIAL),'Falta frontera segura de carga inicial.');
must(!src.includes(OLD_REFETCH) && !src.includes(OLD_INITIAL),'Permanece e.message visible histórico.');
must(!/setError\s*\(\s*e\.message/.test(src),'e.message todavía llega directo a setError.');
must((src.match(/fetchCalendarioDocente\(idDocente\)/g)||[]).length===2,'Cambió consulta de calendario docente.');
must((src.match(/fetchTareasPendientesDocente\(idDocente\)/g)||[]).length===2,'Cambió consulta de pendientes docente.');
must(src.includes('<ErrorState message={error} onRetry={refetch} />'),'Cambió wiring de ErrorState/retry.');
must(src.includes('const sesion = React.useMemo(() => leerSesionDocente(), []);'),'Cambió lectura de sesión docente.');
must(src.includes("window.cerrarSesionServidor") && src.includes("window.location.href = 'login.html'"),'Cambió cierre/redirección de sesión.');
must(app.includes("teacher_views: ['src/vista_docente.jsx") && app.includes("vista_docente: ['src/vista_docente.jsx"),'app dejó de cargar vista_docente en rutas efectivas.');

let restored=src.replace(HELPER+ANCHOR,ANCHOR).replace(NEW_REFETCH,OLD_REFETCH).replace(NEW_INITIAL,OLD_INITIAL);
must(sha(restored)===BASE_BLOB,`Reversión AN no reconstruye preimagen exacta: ${sha(restored)}`);
console.log('QA VISTA DOCENTE SAFE ERRORS CS21A210AN PASS');
