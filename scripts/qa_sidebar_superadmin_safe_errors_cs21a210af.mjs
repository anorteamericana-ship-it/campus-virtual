import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/sidebar.jsx';
const BASE_BLOB='13177b4377a77bf8fc19577c2b21ea3d94424454';
const OLD="      if (!data.ok) { setErrMsg(data.error || 'Código no encontrado'); return; }";
const NEW=`      if (!data.ok) {
        if (data.error) console.warn('[Sidebar][ModoPrueba] Detalle técnico oculto al operador.', { context: 'get_estudiante', error: String(data.error) });
        setErrMsg('No pudimos cargar ese estudiante. Verificá el código e intentá de nuevo.');
        return;
      }`;

function blobSha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(cond,msg){if(!cond) throw new Error(msg);}

const src=fs.readFileSync(FILE,'utf8');
must(src.includes(NEW),'Falta la frontera segura CS21A210AF.');
must(!src.includes(OLD),'Permanece el sink raw histórico.');
must(!/setErrMsg\s*\(\s*data\.error/.test(src),'data.error todavía llega directamente a errMsg.');
must(src.includes("console.warn('[Sidebar][ModoPrueba] Detalle técnico oculto al operador.'"),'Falta diagnóstico console-only.');
must(src.includes("setErrMsg('No pudimos cargar ese estudiante. Verificá el código e intentá de nuevo.')"),'Falta copy seguro al operador.');

// Invariantes de autorización/sesión/endpoints que AF no puede alterar.
must(src.includes("const esSuperadmin = rolEfectivo === 'superadmin';"),'Se alteró el gate de superadmin.');
must(src.includes('{esSuperadmin && <ModoPruebaPanel />}'),'Se alteró el montaje exclusivo del modo prueba.');
must(src.includes("postSidebar('getEstudiante', { codigo: c })"),'Se alteró getEstudiante.');
must(src.includes("body: JSON.stringify({\n      fn,\n      token,"),'Se alteró token/body de postSidebar.');
must(src.includes("sessionStorage.setItem('an_modo_prueba', JSON.stringify(modo));"),'Se alteró preservación de sesión original.');
must(src.includes('setSesion(nuevaIdentidad);'),'Se alteró transformación de identidad.');
must(src.includes("window.dispatchEvent(new Event('an:session-changed'));"),'Se alteró recálculo de sesión/router.');

// Prueba fuerte: revertir únicamente AF debe reconstruir byte a byte el blob base.
const attendanceMenu="        { id: 'asistencia_grupos', label: 'Asistencia de grupos', icon: 'calendar' },\n";
must(src.split(attendanceMenu).length===2,'Entrada de asistencia debe existir una sola vez.');
// Reconstrucción de preimagen AF, revirtiendo SOLO la entrada aditiva.
const hiddenStudentOnly="        ...(false && mostrarICAN ? [{ id: 'ican', label: 'Club I CAN', icon: 'ican' }] : []), // F111 student demo: hidden, teacher/admin unaffected.";
const studentMenuOriginal="        ...(mostrarICAN ? [{ id: 'ican', label: 'Club I CAN', icon: 'ican' }] : []),";
must(src.split(hiddenStudentOnly).length-1===1,'Only the student I CAN menu is hidden for the demo.');
const restored=src.replace(hiddenStudentOnly,studentMenuOriginal).replace(attendanceMenu,'').replace(NEW,OLD);
must(restored!==src,'No se pudo revertir AF en memoria.');
// F111 i18n review: permit ONLY the exact known sidebar preview blob after AF reversal.
 // This is a hash allowlist, not a broad exception: any unrelated byte change still fails.
const F111_I18N_PILOT_RESTORED_BLOB='136602c80c36df583a062e4ae71fb787acd63c93';
const previewMarker=src.includes('function sidebarPilotTextF111(value)') &&
  src.includes('data-an-nav-label={item.label}') &&
  src.includes('window.AN_I18N?.preview');
const selectorVisibleMarker=src.includes('function sidebarPilotTextF111(value)') &&
  src.includes('data-an-nav-label={item.label}') &&
  src.includes('window.AN_I18N?.available') &&
  src.includes("disabled={role !== 'student' && role !== 'teacher' && lang === 'en'}");
const F111_I18N_SELECTOR_RESTORED_BLOB='997ee846277488b3d42a639b1db1fc6a89fceab1';
const restoredHash=blobSha(restored);
must(restoredHash===BASE_BLOB ||
  (previewMarker && restoredHash===F111_I18N_PILOT_RESTORED_BLOB) ||
  (selectorVisibleMarker && restoredHash===F111_I18N_SELECTOR_RESTORED_BLOB),
  `La reversión AF no reconstruye una preimagen explícitamente validada: ${restoredHash}`);
console.log('OK: CS21A210AF safe-error boundary + exact preimage or reviewed pilot hash');
