import fs from 'node:fs';

const core = fs.readFileSync('src/admin_students_quick_update_core_cs21a99.js', 'utf8');
const state = fs.readFileSync('src/admin_students_quick_update_state_cs21a99.js', 'utf8');
const payment = fs.readFileSync('src/admin_students_quick_update_payment_cs21a99.js', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A189 FAIL: ${label}`);
}

must(core.includes('function quickUpdateSafeUserError'), 'shared admin quick-update sanitizer present');
must(core.includes('quickUpdateSafeUserError'), 'sanitizer exported through core namespace');
must(core.includes("console.warn('[QuickUpdate] Detalle técnico oculto al operador.'"), 'technical detail retained in console');

must(!state.includes('setError(e.message||String(e))'), 'raw compact state errors removed');
must(!state.includes('setError(lastError?.message||'), 'raw fresh-retry error removed');
must(state.includes("'No se pudo guardar el cambio de estatus. Intentá de nuevo.'"), 'legacy status fallback present');
must(state.includes("'No se pudo actualizar el expediente académico. Intentá de nuevo.'"), 'academic fallback present');
must(state.includes("'No se pudo consultar el comprobante. Intentá de nuevo.'"), 'receipt lookup fallback present');
must(state.includes("'No se pudo aplicar el pago. Intentá de nuevo.'"), 'payment fallback present');
must(state.includes("'No se pudo actualizar CONAPE. Intentá de nuevo.'"), 'CONAPE fallback present');
must(state.includes("'El cambio quedó guardado, pero la ficha todavía no terminó de refrescar. Usá “Cargar estudiante actualizado”.'"), 'fresh-retry stable fallback preserved');

must(!payment.includes("s.academic?.mensaje||'Expediente académico actualizado.'"), 'raw academic success message no longer rendered');
must(payment.includes("quickUpdateSafeUserError(s.academic?.mensaje,'Expediente académico actualizado.','academic_success')"), 'academic message sanitized at display boundary');

must(core.includes('data?.mensaje||data?.error||`No se pudo ejecutar ${fn}.`'), 'internal transport diagnostic contract preserved');
must(state.includes('El comprobante ${doc} no existe o ya no tiene saldo disponible.'), 'local actionable receipt message preserved');

console.log('CS21A189 ADMIN QUICK UPDATE SAFE ERRORS: PASS');
console.log('STATE_ERROR_BOUNDARY=SANITIZED');
console.log('ACADEMIC_MESSAGE_BOUNDARY=SANITIZED');
console.log('BUSINESS_MESSAGES=PRESERVED');
console.log('INTERNAL_DIAGNOSTICS=PRESERVED');
