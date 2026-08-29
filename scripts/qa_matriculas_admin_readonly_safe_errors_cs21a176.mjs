import fs from 'node:fs';

const src = fs.readFileSync('src/matriculas_admin.jsx', 'utf8');
const failures = [];
const check = (ok, msg) => ok ? console.log(`PASS: ${msg}`) : failures.push(msg);

check(src.includes('function matSafeUserError('), 'helper de error seguro existe');
check(src.includes("console.warn('[Matrículas] Detalle técnico oculto al usuario.'"), 'diagnóstico técnico queda en consola');

check(src.includes('const editableOf = () => false;'), 'ficha general queda fail-closed en solo lectura');
check(!src.includes('const canEditAll ='), 'no existe permiso visual de edición sin persistencia');
check(!src.includes('const [edited, setEdited]'), 'no existe estado local que simule edición persistente');
check(!src.includes('guardarCambios'), 'handler falso Guardar cambios eliminado');
check(!src.includes('Próximamente: guardado completo de campos.'), 'toast de falso guardado eliminado');
check(!src.includes('>Guardar cambios</button>'), 'botón Guardar cambios no se presenta');
check(src.includes("{saving ? 'Guardando…' : 'Guardar nota'}"), 'Guardar nota de Ventas permanece operativo');
check(src.includes('Datos generales · solo lectura en esta vista.'), 'staff recibe estado de solo lectura explícito');

check(!src.includes('setError(e.message)'), 'ningún catch muestra e.message directo');
check(!src.includes("onToast('Error de conexión: ' + e.message"), 'ningún toast concatena e.message directo');
check(!src.includes("onToast('Error de conexión: ' + (e && e.message"), 'generación de matrícula no muestra excepción cruda');
check(!src.includes("setError((d && d.error) ||"), 'cargas no muestran d.error directo');
check(!src.includes("onToast((r && r.error) ||"), 'acciones no muestran r.error directo');
check(!src.includes("setError((r && r.error) ||"), 'CONAPE no muestra r.error directo');
check(src.includes("matSafeUserError(r && r.error, 'No se pudo guardar la nota.'"), 'nota usa filtro seguro');
check(src.includes("matSafeUserError(r && r.error, 'No se pudo consultar el estado CONAPE.'"), 'CONAPE usa filtro seguro');

// Regresiones del corte base CS21A175.
check(src.includes('WhatsApp · adjuntar PDF'), 'proforma mantiene transición de adjunto manual');
check(!src.includes('Podés verla aquí: ${url}'), 'proforma no vuelve a propagar URL por WhatsApp');

if (failures.length) {
  console.error('QA MATRICULAS ADMIN READONLY SAFE ERRORS CS21A176 FAIL');
  failures.forEach(x => console.error('-', x));
  process.exit(1);
}
console.log('QA MATRICULAS ADMIN READONLY SAFE ERRORS CS21A176 PASS');
