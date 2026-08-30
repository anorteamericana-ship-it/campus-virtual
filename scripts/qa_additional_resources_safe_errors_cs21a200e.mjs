import fs from 'node:fs';

const src=fs.readFileSync('src/additional_resources_panel_cs21a68.jsx','utf8');
const direct=fs.readFileSync('src/admin_resources_direct_cs21a74.js','utf8');

const must=(ok,label)=>{if(!ok){console.error(`CS21A200E FAIL: ${label}`);process.exit(1);}};

must(src.includes("function additionalResourcesSafeUserError(raw, fallback, context = '')"),'falta frontera de error segura');
must(src.includes("additionalResourcesSafeUserError(error, 'No se pudieron cargar los recursos. Intentá de nuevo.', 'cargar_recursos_adicionales')"),'catch visible no saneado');
must(!src.includes("error:clean(error?.message || error || 'No se pudieron cargar los recursos.')"),'error.message sigue pasando directo a UI');

must(src.includes("post('getBibliotecaNivelEstudiante'"),'endpoint catálogo alterado');
must(src.includes("const view = role === 'student' || role === 'estudiante' ? 'estudiante' : 'docente';"),'scope por rol alterado');
must(src.includes("const canChooseLevel = role === 'admin' || role === 'superadmin';"),'selector admin/superadmin alterado');
must(src.includes("return item?.tipo === 'folder'"),'resolución de URL alterada');
must(src.includes("window.open(url, '_blank', 'noopener,noreferrer')"),'apertura de recurso alterada en este corte');
must(src.includes('window.AdditionalResourcesPanel = AdditionalResourcesPanel;'),'publicación de componente perdida');

must(direct.includes("const ADDITIONAL_MODE_KEY = 'an_resources_panel_mode_cs21a68';"),'routing CS21A200D perdido');
must(direct.includes("const Viewer = route.mode === 'additional' ? additionalComponent() : viewerComponent();"),'routing efectivo CS21A200D perdido');

console.log('CS21A200E ADDITIONAL RESOURCES SAFE ERRORS: PASS');
console.log('CATALOG_ENDPOINT=PRESERVED');
console.log('RESOURCE_URL_BEHAVIOR=UNCHANGED_PENDING_ACL_AUDIT');
console.log('ADMIN_ROUTE_CS21A200D=PRESERVED');
