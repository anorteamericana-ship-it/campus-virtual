import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/ventas_calendario.jsx';
const BASE_BLOB='b9b11b349d8f25d7352cf20904adc0e2e2c4e794';
const ANCHOR="const { useState: cvUseState, useEffect: cvUseEffect } = React;\n\n";
const HELPER=`function ventasCalendarioSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).replace(/\\s+/g, ' ').trim();\n  if (msg) console.warn('[VentasCalendario] Detalle técnico oculto al usuario.', { context, error: msg });\n  return fallback;\n}\n\n`;
const OLD_WEEK="      .catch(e => { if (!cancel) setErr(e.message || 'No se pudo cargar el calendario.'); });";
const NEW_WEEK=`      .catch(e => {\n        if (cancel) return;\n        setErr(ventasCalendarioSafeUserError(e && e.message, 'No pudimos cargar tu calendario. Intentá nuevamente.', 'calendario_semanal'));\n      });`;
const OLD_MONTH="      .catch(e => { if (!cancel) setErr(e.message || 'No se pudieron cargar tus matrículas.'); });";
const NEW_MONTH=`      .catch(e => {\n        if (cancel) return;\n        setErr(ventasCalendarioSafeUserError(e && e.message, 'No pudimos cargar tus matrículas. Intentá nuevamente.', 'matriculas_mes'));\n      });`;
const OLD_NOTE=`        <div className="vx-mm-note">\n          Mostrando solo la <b>semana actual</b>: el backend aún entrega una sola semana. El total mensual completo requiere ampliar <code>getCalendarioMatriculas</code> (ver Requerimientos backend).\n        </div>`;
const NEW_NOTE=`        <div className="vx-mm-note">\n          Mostrando solo la <b>semana actual</b>. La vista mensual completa todavía no está disponible.\n        </div>`;
function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
const src=fs.readFileSync(FILE,'utf8');
const html=fs.readFileSync('ventas.html','utf8');
const dash=fs.readFileSync('src/ventas_dashboard.jsx','utf8');

must(src.includes(HELPER),'Falta helper AL.');
must(src.includes(NEW_WEEK),'Falta frontera semanal segura.');
must(src.includes(NEW_MONTH),'Falta frontera mensual segura.');
must(src.includes(NEW_NOTE),'Falta copy mensual no técnico.');
must(!src.includes(OLD_WEEK) && !src.includes(OLD_MONTH),'Permanece e.message visible histórico.');
must(!src.includes(OLD_NOTE),'Permanece aviso técnico mensual histórico.');
must(!/setErr\s*\(\s*e\.message/.test(src),'e.message todavía llega directo a setErr.');
must((src.match(/window\.getCalendarioMatriculas\s*\(/g)||[]).length===2,'Deben mantenerse exactamente dos consultas calendario.');
must(src.includes("{ asesor_filtro: asesor, con_tendencia: false }"),'Contrato semanal cambió.');
must(src.includes("{ asesor_filtro: asesor, mes: mesISO, con_tendencia: false }"),'Contrato mensual cambió.');
must(src.includes('function mmConstruirSemanas(') && src.includes('function mmExtraerPorFecha('),'Agrupación mensual cambió.');
must(src.includes('Object.assign(window, { MiCalendarioSemanal });') && src.includes('Object.assign(window, { MiMatriculasMes });'),'Exports calendario Ventas cambiaron.');
must(html.includes('<script type="text/babel" src="src/ventas_calendario.jsx"></script>'),'ventas.html dejó de cargar el módulo efectivo.');
must(dash.includes('<window.MiMatriculasMes asesor={scopeAsesor} />'),'Dashboard dejó de montar la vista mensual vigente.');

let restored=src;
restored=restored.replace(ANCHOR+HELPER,ANCHOR).replace(NEW_WEEK,OLD_WEEK).replace(NEW_MONTH,OLD_MONTH).replace(NEW_NOTE,OLD_NOTE);
must(sha(restored)===BASE_BLOB,`Reversión AL no reconstruye preimagen exacta: ${sha(restored)}`);
console.log('QA VENTAS CALENDARIO SAFE ERRORS CS21A210AL PASS');
