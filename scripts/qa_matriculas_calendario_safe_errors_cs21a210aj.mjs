import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/matriculas_calendario.jsx';
const APP='src/app.jsx';
const BASE_BLOB='7c7b01858448f55d8a2e2092d5b569da298c83c0';
const OLD="      .catch(e => { if (!cancel) setErr(e.message || 'No se pudo cargar el calendario.'); });";
const NEW=`      .catch(e => {
        if (cancel) return;
        if (e?.message) console.warn('[MatriculasCalendario] Detalle técnico oculto al operador.', { context:'get_calendario_matriculas', error:String(e.message) });
        setErr('No pudimos cargar el calendario de matrículas. Intentá nuevamente.');
      });`;

function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
const src=fs.readFileSync(FILE,'utf8');
const app=fs.readFileSync(APP,'utf8');

must(src.includes(NEW),'Falta frontera segura AJ.');
must(!src.includes(OLD),'Permanece sink raw AJ.');
must(!/setErr\s*\(\s*e\.message/.test(src),'e.message todavía llega directo a setErr.');
must(src.includes("console.warn('[MatriculasCalendario] Detalle técnico oculto al operador.'"),'Falta diagnóstico console-only.');
must(src.includes("setErr('No pudimos cargar el calendario de matrículas. Intentá nuevamente.')"),'Falta copy seguro.');

// Contrato funcional del calendario: solo lectura y misma consulta.
must(src.includes("window.getCalendarioMatriculas(body)"),'Se alteró getCalendarioMatriculas.');
must(src.includes("const body = { con_tendencia: true };"),'Se alteró tendencia.');
must(src.includes("if (semanaInicio) body.semana_inicio = semanaInicio;"),'Se alteró navegación por semana.');
must(src.includes("return () => { cancel = true; };"),'Se alteró cancelación del efecto.');
must(src.includes("onClick={() => setTick(t => t + 1)}>Reintentar</button>"),'Se alteró reintento.');
must(src.includes('Solo visualización — nada editable.'),'Se perdió la declaración de solo lectura.');
must(app.includes("matriculas: ['src/matriculas_admin.jsx?v=F96.5G','src/matriculas_calendario.jsx?v=F96.5G','src/matriculas.jsx?v=F96.5G']"),'app.jsx ya no carga el canonical de calendario de matrículas.');

const restored=src.replace(NEW,OLD);
must(restored!==src,'No se pudo revertir AJ.');
must(sha(restored)===BASE_BLOB,`Reversión AJ no reconstruye la preimagen exacta: ${sha(restored)}`);
console.log('OK: CS21A210AJ safe-error boundary + exact preimage + canonical route contract');
