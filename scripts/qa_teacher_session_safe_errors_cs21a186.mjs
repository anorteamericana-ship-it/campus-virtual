import fs from 'node:fs';

const views = fs.readFileSync('src/teacher_views.jsx', 'utf8');
const bridge = fs.readFileSync('src/att77_bridge.js', 'utf8');

function must(ok, label) {
  if (!ok) throw new Error(`CS21A186 FAIL: ${label}`);
}

must(views.includes('function teacherSessionSafeUserError'), 'teacher session safe-error helper present');
must(views.includes("'No pudimos cargar tus grupos. Intentá de nuevo.'"), 'stable group-load fallback present');
must(views.includes("'No pudimos cargar la información del grupo. Intentá de nuevo.'"), 'stable panel fallback present');
must(views.includes("'No hay grupos activos asignados en este momento.'"), 'non-technical empty-groups copy present');
must(!views.includes("setErrorGroups(e?.message || String(e))"), 'raw group error no longer stored');
must(!views.includes("setErrorPanel(e?.message || String(e))"), 'raw panel error no longer stored');
must(!views.includes('No hay grupos marcados En curso para este docente en APOLLO.GRUPOS.'), 'internal APOLLO.GRUPOS copy removed from visible fallback');

must(bridge.includes('function att77SafeUserError'), 'attendance bridge safe-error helper present');
must(bridge.includes("'No pudimos preparar el seguimiento académico. Intentá de nuevo.'"), 'stable attendance bridge fallback present');
must(!bridge.includes("error:'No se publicó la fuente docente.'"), 'technical source-publication copy removed');
must(!bridge.includes("error:e.message||String(e)"), 'raw bridge error no longer rendered');

must(views.includes("if (!res.ok) throw new Error((data && (data.error || data.mensaje)) || `HTTP ${res.status}`);"), 'internal diagnostic contract preserved');
must(bridge.includes("if(!loader||typeof loader.loadMany!=='function')return Promise.reject(new Error('El cargador del Campus todavía no está disponible.'));"), 'internal loader diagnostic preserved');

console.log('CS21A186 TEACHER SESSION SAFE ERRORS: PASS');
console.log('GROUP_ERROR_SOURCE=SANITIZED');
console.log('PANEL_ERROR_SOURCE=SANITIZED');
console.log('ATT77_BRIDGE_ERROR=SANITIZED');
console.log('INTERNAL_DIAGNOSTICS=PRESERVED');
