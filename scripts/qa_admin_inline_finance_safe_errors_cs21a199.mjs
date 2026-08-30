import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students_inline_payment_cs21a36.jsx', 'utf8');
function must(ok, label) { if (!ok) throw new Error(`CS21A199 FAIL: ${label}`); }

must(src.includes("function inlineFinanceSafeUserError(raw, fallback, context = '')"), 'safe finance UI boundary exists');
must(src.includes("console.warn('[AdminInlineFinance] Detalle técnico oculto al operador.'"), 'technical detail remains console-only');

for (const expected of [
  "inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos cargar la información financiera. Intentá de nuevo.', 'cargar_finanzas')",
  "inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos buscar los comprobantes. Intentá de nuevo.', 'buscar_comprobante')",
  "inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos actualizar el comprobante. Intentá de nuevo.', 'seleccionar_comprobante')",
  "inlineFinanceSafeUserError(e?.message || String(e), 'No pudimos aplicar el pago. Revisá los datos e intentá de nuevo.', 'aplicar_pago')",
]) must(src.includes(expected), `safe catch present: ${expected}`);

for (const bad of [
  ".catch(e=>alive&&setError(e?.message||String(e)))",
  "catch(e){setError(e?.message||String(e));}finally{setSearching(false);}",
  "catch(e){setReceipt(null);setError(e?.message||String(e));}finally{setSearching(false);}",
  "catch(e){setError(e?.message||String(e));}finally{setApplying(false);}",
]) must(!src.includes(bad), `raw exception no longer reaches UI: ${bad}`);

// Human business messages and mutation contract stay intact.
for (const keep of [
  'No existe información financiera vigente para',
  'Este intento es histórico. El grupo financiero vigente es',
  'ya no tiene saldo disponible.',
  'ya fue agotado o retirado.',
  'El saldo cambió. Disponible ahora:',
  "postInline('getEstudiante'",
  "postInline('getComprobantes'",
  "postInline('aplicarPago'",
  'request_id:requestIdRef.current',
  'monto_total:total',
  'rubros:selected',
  'finally{setApplying(false);}',
]) must(src.includes(keep), `business/payment behavior preserved: ${keep}`);

must(src.includes("const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|getEstudiante|getComprobantes|aplicarPago/i.test(msg);"), 'technical classifier remains scoped');

console.log('CS21A199 ADMIN INLINE FINANCE SAFE ERRORS: PASS');
console.log('RAW_TECHNICAL_ERRORS_VISIBLE=NO_FOR_GUARDED_PATHS');
console.log('BUSINESS_MESSAGES=PRESERVED');
console.log('PAYMENT_ENDPOINTS_AND_PAYLOAD=PRESERVED');
