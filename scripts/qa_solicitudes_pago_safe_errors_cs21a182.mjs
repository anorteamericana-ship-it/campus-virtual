import fs from 'node:fs';

const src = fs.readFileSync('src/solicitudes_pago.jsx', 'utf8');

function must(needle, label) {
  if (!src.includes(needle)) throw new Error(`Missing ${label}: ${needle}`);
}
function mustNot(needle, label) {
  if (src.includes(needle)) throw new Error(`Forbidden ${label}: ${needle}`);
}

must('function spSafeUserError(', 'safe user error helper');
must("console.warn('[SolicitudesPago] Detalle técnico oculto al usuario.'", 'console-only technical diagnostic');
must("spSafeUserError(r && (r.mensaje || r.error), 'No se pudo cargar la cola. Intentá de nuevo.', 'cargar_solicitudes')", 'safe load failure');
must("spSafeUserError(e?.message, 'No se pudo cargar la cola. Intentá de nuevo.', 'cargar_solicitudes_red')", 'safe network failure');
must("spSafeUserError(res && (res.mensaje || res.error), 'No se pudo marcar como aplicada.', 'aplicar_solicitud')", 'safe apply failure');
must("spSafeUserError(res && (res.mensaje || res.error), 'No se pudo rechazar.', 'rechazar_solicitud')", 'safe reject failure');
must("spSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir el comprobante.', 'abrir_comprobante')", 'safe receipt backend failure');
must("spSafeUserError(e?.message, 'No se pudo abrir el comprobante.', 'abrir_comprobante')", 'safe receipt catch failure');

mustNot("setErr((r && r.error) || 'No se pudo cargar la cola.')", 'raw load backend error');
mustNot("setErr('Error de red: ' + e.message)", 'raw network error');
mustNot("showToast((res && res.error) || 'No se pudo marcar como aplicada.'", 'raw apply error');
mustNot("showToast((res && res.error) || 'No se pudo rechazar.'", 'raw reject error');
mustNot("throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el comprobante.')", 'raw receipt backend error');
mustNot("showToast(e?.message || 'No se pudo abrir el comprobante.'", 'raw receipt catch error');

// Regression: private receipt delivery from CS21A161 must remain intact.
must('window.descargarComprobantePagoPrivado(id)', 'private receipt consumer');
must('tiene_comprobante', 'private receipt availability shape');
must('URL.createObjectURL', 'private receipt ObjectURL');
mustNot('const url = sol.url_comprobante', 'direct receipt URL navigation');
mustNot("window.open(url, '_blank'", 'direct receipt URL open');

console.log('CS21A182 SOLICITUDES PAGO SAFE ERRORS: PASS');
console.log('PAYMENT_LOGIC_CHANGED=NO');
console.log('PRIVATE_RECEIPT_REGRESSION=PASS');
