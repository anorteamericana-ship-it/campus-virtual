import fs from 'node:fs';

const src = fs.readFileSync('src/admin_views.jsx', 'utf8');
function must(cond, msg) { if (!cond) throw new Error(msg); }

must(src.includes('function adminPreviewMode()'), 'Debe existir helper adminPreviewMode.');
must(src.includes("q.get('demo') === '1' || !!q.get('preview')"), 'Debe preservarse preview explícito por URL.');
must(src.includes('const esDemo = adminPreviewMode();'), 'useAdminDashboard debe compartir el mismo detector de preview.');

const dashStart = src.indexOf('function AdminDashboard(');
const dashEnd = src.indexOf('\nfunction ', dashStart + 20);
const dash = src.slice(dashStart, dashEnd > dashStart ? dashEnd : src.length);
must(dash.includes('const adminPreview = adminPreviewMode();'), 'AdminDashboard debe resolver preview una vez.');
must(dash.includes("if (adminPreview) { alert('Modo demostración: esta vista es solo lectura. No se enviaron cambios.'); return; }"), 'Sincronizar CONAPE debe fallar cerrado en preview.');
must(dash.includes('disabled={syncing || adminPreview}'), 'Botón Sincronizar CONAPE debe quedar deshabilitado en preview.');
must(dash.includes("postCampus('sincronizarCONAPE')"), 'Debe preservarse sincronización real fuera de preview.');

const wizStart = src.indexOf('function WizardCrearGrupo(');
const wizEnd = src.indexOf('\nfunction ', wizStart + 20);
const wiz = src.slice(wizStart, wizEnd > wizStart ? wizEnd : src.length);
must(wiz.includes('const adminPreview = adminPreviewMode();'), 'WizardCrearGrupo debe resolver preview.');
must(wiz.includes("if (adminPreview) { alert('Modo demostración: esta vista es solo lectura. No se abrió ningún grupo.'); return; }"), 'Crear grupo debe fallar cerrado antes del POST.');
must(wiz.includes('disabled={!form.confirmado || guardando || adminPreview}'), 'ABRIR GRUPO debe quedar deshabilitado en preview.');
must(wiz.includes("?fn=crearGrupo"), 'Debe preservarse crearGrupo real fuera de preview.');

console.log('CS21A198C SEC004 ADMIN PREVIEW READONLY: PASS');
console.log('DEMO_SYNC_CONAPE_WRITE=BLOCKED');
console.log('DEMO_CREATE_GROUP_WRITE=BLOCKED');
console.log('PRODUCTION_MUTATIONS=PRESERVED');
