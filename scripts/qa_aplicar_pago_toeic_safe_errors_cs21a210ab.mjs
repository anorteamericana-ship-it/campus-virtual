import fs from 'node:fs';

const src=fs.readFileSync('src/aplicar_pago.jsx','utf8');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210AB FAIL: ${label}`)};

must(src.includes("function apSafeUserError(raw, fallback, context = '')"),'CS21A210I helper preserved');
must(src.includes('getEstudiante|getComprobantes|aplicarPago|configurarToeicEstudiante/i.test(msg);'),'TOEIC endpoint added to technical filter');
must(!src.includes("setMensaje(data.error || 'No se pudo guardar la decisión TOEIC.')"),'raw TOEIC backend sink removed');
must(!src.includes("setMensaje('Error de conexión: ' + e.message)"),'raw TOEIC exception sink removed');
must(src.includes("setMensaje(apSafeUserError(data?.error || data?.mensaje, 'Error al guardar la decisión TOEIC. Intentá de nuevo.', 'configurar_toeic'))"),'TOEIC backend safe boundary');
must(src.includes("setMensaje(apSafeUserError(e?.message || String(e), 'Error al guardar la decisión TOEIC. Revisá la conexión e intentá de nuevo.', 'configurar_toeic'))"),'TOEIC exception safe boundary');

must(src.includes("postAP({ fn:'configurarToeicEstudiante', codigo:estSel?.CODIGO || estSel?.rec_m, omitido, motivo:motivo.trim() })"),'TOEIC endpoint and payload preserved');
must(src.includes('const f = data.ficha || {};'),'TOEIC returned ficha preserved');
must(src.includes('pendientes:f.pendientes || prev?.pendientes || {}'),'TOEIC state refresh preserved');
must(src.includes("setMensaje(omitido ? 'TOEIC omitido. Ya no bloquea la mora.' : 'TOEIC reactivado como pendiente de pago.');"),'TOEIC success copy preserved');
must(src.includes("mensaje.startsWith('Error')||mensaje.startsWith('Indicá')"),'error visual tone preserved');
must(src.includes("if (omitido && !motivo.trim()) { setMensaje('Indicá el motivo de la omisión.'); return; }"),'mandatory omission reason preserved');
must(src.includes('disabled={pagado||guardando||!cobrable}'),'TOEIC eligibility guard preserved');

console.log('CS21A210AB APLICAR PAGO TOEIC SAFE ERRORS: PASS');
console.log('RAW_TOEIC_SINKS=2_REMOVED');
console.log('PAYMENT_SEMANTICS=PRESERVED');
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
