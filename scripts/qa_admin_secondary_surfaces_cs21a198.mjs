import fs from 'node:fs';

const supervision = fs.readFileSync('src/panel_admin_supervision.jsx', 'utf8');
const suspensiones = fs.readFileSync('src/panel_suspensiones.jsx', 'utf8');
const aperturas = fs.readFileSync('src/aperturas_admin_cs21a20.jsx', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A198 FAIL: ${label}`);
}

// Supervisión docente: error técnico no cruza a ErrorState.
must(supervision.includes('No pudimos cargar la supervisión de docentes. Intentá de nuevo.'), 'supervision stable user copy');
must(supervision.includes("console.warn('[AdminSupervision] Respuesta de carga no disponible.'"), 'supervision backend diagnostic');
must(supervision.includes("console.error('[AdminSupervision] Error técnico cargando supervisión.'"), 'supervision exception diagnostic');
must(!supervision.includes("setError(res?.error || 'No se pudo obtener la lista de docentes atrasados.')"), 'supervision raw backend error removed');
must(!supervision.includes(".catch(e => setError(e.message || 'Error de conexión.'))"), 'supervision raw exception removed');
must(supervision.includes('fetchDocentesAtrasados()'), 'supervision endpoint preserved');
must(supervision.includes('ModalCierreLeccion'), 'supervision close lesson behavior preserved');

// Suspensiones: errores seguros y busy state siempre liberado.
must(suspensiones.includes("function psuSafeUserError(raw, fallback, context = '')"), 'suspensiones sanitizer');
must(suspensiones.includes("console.warn('[AdminSuspensiones] Detalle técnico oculto al operador.'"), 'suspensiones diagnostic');
must(suspensiones.includes("console.error('[AdminSuspensiones] Error técnico aprobando solicitud.'"), 'approve exception diagnostic');
must(suspensiones.includes("console.error('[AdminSuspensiones] Error técnico rechazando solicitud.'"), 'reject exception diagnostic');
must((suspensiones.match(/finally \{ setResolviendo\(null\); \}/g) || []).length === 2, 'approve/reject always release busy state');
must(!suspensiones.includes("setErr('Error de red: ' + e.message)"), 'suspensiones raw network error removed');
must(!suspensiones.includes("showToast(res?.error || 'No se pudo aprobar la solicitud.'"), 'approve raw backend error removed');
must(!suspensiones.includes("showToast(res?.error || 'No se pudo rechazar la solicitud.'"), 'reject raw backend error removed');
must(suspensiones.includes('window.fetchGetSolicitudesSuspension(estado)'), 'suspensiones list endpoint preserved');
must(suspensiones.includes('window.fetchResolverSolicitudSuspension({'), 'suspensiones resolver endpoint preserved');
must(suspensiones.includes("accion: 'aprobar'"), 'approve action preserved');
must(suspensiones.includes("accion: 'rechazar'"), 'reject action preserved');

// Aperturas: persistencia real intacta; solo frontera de errores saneada.
must(aperturas.includes("function apSafeUserError(raw, fallback, context = '')"), 'aperturas sanitizer');
must(aperturas.includes("console.warn('[AdminAperturas] Detalle técnico oculto al operador.'"), 'aperturas diagnostic');
must(aperturas.includes("apSafeUserError(e?.message || String(e), 'No se pudo actualizar la apertura. Intentá de nuevo.', 'guardar_apertura')"), 'aperturas save safe error');
must(aperturas.includes("apSafeUserError(e?.message || String(e), 'No se pudieron cargar las aperturas. Intentá de nuevo.', 'cargar_aperturas')"), 'aperturas load safe error');
must(!aperturas.includes("setError(e && e.message ? e.message : 'No se pudo actualizar la apertura.')"), 'aperturas raw save exception removed');
must(!aperturas.includes("setError(e && e.message ? e.message : 'No se pudieron cargar las aperturas.')"), 'aperturas raw load exception removed');
must(aperturas.includes("apPost('getAperturasAdmin')"), 'aperturas read endpoint preserved');
must(aperturas.includes("apPost('actualizarAperturaAdmin'"), 'aperturas write endpoint preserved');
must(aperturas.includes('finally { setSaving(false); }'), 'aperturas saving state preserved');
must(aperturas.includes('fechas:form.fechas'), 'aperturas dates payload preserved');
must(aperturas.includes('precios:form.precios'), 'aperturas prices payload preserved');

console.log('CS21A198 ADMIN SECONDARY SURFACES INTEGRATION: PASS');
console.log('SUPERVISION_SAFE_ERRORS=YES');
console.log('SUSPENSION_BUSY_RELEASE=YES');
console.log('APERTURAS_SAFE_ERRORS=YES');
console.log('BUSINESS_ENDPOINTS=PRESERVED');
