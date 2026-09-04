import fs from 'node:fs';

const view = fs.readFileSync('src/admin_students_quick_update_conape_cs21a99.js','utf8');
const state = fs.readFileSync('src/admin_students_quick_update_state_cs21a99.js','utf8');
const core = fs.readFileSync('src/admin_students_quick_update_core_cs21a99.js','utf8');

function must(ok,label){ if(!ok) throw new Error(`CS21A190 FAIL: ${label}`); }

must(view.includes('Se actualizará CONAPE una sola vez. Después se recargará automáticamente este mismo estudiante hasta mostrarlo actualizado.'), 'operational CONAPE copy present');
must(!view.includes('sincronización de las hojas 4–7'), 'internal sheet names no longer user-visible');
must(view.includes("'Dejar CONAPE pendiente'"), 'pending action preserved');
must(view.includes("'Actualizar CONAPE ahora'"), 'sync action preserved');
must(state.includes("post('sincronizarConapePuestaAlDia'"), 'CONAPE endpoint call preserved');
must(state.includes('quickUpdateSafeUserError'), 'CS21A189 safe error boundary preserved');
must(core.includes('function quickUpdateSafeUserError'), 'shared CS21A189 sanitizer preserved');

console.log('CS21A190 ADMIN CONAPE USER COPY: PASS');
console.log('INTERNAL_SHEET_NAMES_VISIBLE=NO');
console.log('CONAPE_ACTIONS=UNCHANGED');
console.log('CS21A189_SAFE_ERRORS=PRESERVED');
