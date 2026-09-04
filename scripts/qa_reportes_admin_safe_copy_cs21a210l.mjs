import fs from 'node:fs';

const src=fs.readFileSync('src/reportes_admin.jsx','utf8');
function must(cond,label){if(!cond)throw new Error(`CS21A210L FAIL: ${label}`);console.log(`OK|${label}`);}

must(src.includes('function repSafeUserError(raw, fallback, context = \'\')'),'safe-user helper exists');
must(src.includes("console.warn('[ReportesAdmin] Detalle técnico oculto al operador.'"),'technical detail remains console-only');
must(src.includes("repSafeUserError(e?.message || String(e), 'No se pudieron cargar los reportes administrativos. Intentá de nuevo.', 'cargar_reportes')"),'load catch crosses safe boundary');
must(!src.includes('.catch(e => setError(e.message || String(e)))'),'raw catch sink removed');
must(!src.includes('>F38 · Dirección</div>'),'visible F38 label removed');
must(src.includes('>Dirección académica</div>'),'operator-facing section label present');

must(src.includes("postReportesAdmin('getReportesAdministrativos', { detalle: true })"),'report endpoint preserved');
must(src.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"),'session token preserved');
must(src.includes("method: 'POST'"),'POST transport preserved');
must(src.includes('body: JSON.stringify({ fn, token, ...payload })'),'token body contract preserved');
must(src.includes("const rows = [['Grupo','Docente','Horario','Programa','Estudiantes','CA','APR/CNV','REP','Morosos','Cert. pendientes','Cert. registrados','Notas faltantes','Riesgo']];"),'CSV academic contract preserved');
must(src.includes("['ejecutivo','Ejecutivo'], ['grupos','Grupos'], ['academico','Académico'], ['financiero','Mora/CONAPE'], ['certificados','Certificados'], ['docentes','Docentes'], ['examenes','Exámenes'], ['cierre','Cierre']"),'report tabs preserved');
must(src.includes('setData(r);'),'successful data assignment preserved');
must(src.includes('.finally(() => setLoading(false));'),'loading release preserved');

console.log('CS21A210L PASS: Reportes Admin user boundary and contracts preserved');
