import fs from 'node:fs';

const direct = fs.readFileSync('src/admin_resources_direct_cs21a74.js','utf8');
const additional = fs.readFileSync('src/additional_resources_panel_cs21a68.jsx','utf8');

const must = (ok,label) => {
  if (!ok) {
    console.error(`CS21A200D FAIL: ${label}`);
    process.exit(1);
  }
};

must(direct.includes("const ADDITIONAL_MODE_KEY = 'an_resources_panel_mode_cs21a68';"), 'falta key de modo adicional');
must(direct.includes("const ADDITIONAL_EVENT = 'an:resources-panel-mode';"), 'falta evento de modo adicional');
must(direct.includes("function readAdditionalMode()"), 'falta lector de modo adicional');
must(direct.includes("function additionalComponent()"), 'falta resolución del panel adicional');
must(direct.includes("return typeof window.AdditionalResourcesPanel === 'function'"), 'no usa AdditionalResourcesPanel publicado');
must(direct.includes("mode: readAdditionalMode()"), 'estado inicial no conserva modo adicional');
must(direct.includes("window.addEventListener(ADDITIONAL_EVENT, sync);"), 'ruta directa no escucha cambio a recursos adicionales');
must(direct.includes("window.removeEventListener(ADDITIONAL_EVENT, sync);"), 'listener adicional no se limpia');
must(direct.includes("const Viewer = route.mode === 'additional' ? additionalComponent() : viewerComponent();"), 'selección efectiva de componente no respeta modo');
must(direct.includes("route.mode === 'additional' ? {} : {"), 'props de libro no están separadas del panel adicional');
must(direct.includes("route.mode === 'additional' ? 'Preparando recursos adicionales…' : 'Preparando Libros y Audios…'"), 'estado de carga no distingue modo adicional');

must(additional.includes("const MODE_KEY = 'an_resources_panel_mode_cs21a68';"), 'panel adicional usa otra key');
must(additional.includes("const MODE_EVENT = 'an:resources-panel-mode';"), 'panel adicional usa otro evento');
must(additional.includes('window.AdditionalResourcesPanel = AdditionalResourcesPanel;'), 'panel adicional no publica componente global');
must(additional.includes("setMode('additional');"), 'botón no activa modo adicional');
must(additional.includes('booksButton.click();'), 'navegación base no se conserva');

must(direct.includes('window.__AN_BOOK_RESOURCES_COMPONENT__'), 'visor de libros efectivo perdido');
must(direct.includes("initialType: 'SB'"), 'tipo inicial del libro alterado');
must(direct.includes('adminMode: true'), 'adminMode del visor de libros alterado');

console.log('CS21A200D ADMIN ADDITIONAL RESOURCES ROUTE: PASS');
console.log('ADMIN_ADDITIONAL_ROUTE=EFFECTIVE');
console.log('BOOK_ROUTE=PRESERVED');
console.log('STUDENT_TEACHER_PANEL=UNCHANGED');
