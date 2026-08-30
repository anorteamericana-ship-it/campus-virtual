import fs from 'node:fs';

const path = 'src/lazy_loader.jsx';
const src = fs.readFileSync(path, 'utf8');

function must(condition, message) {
  if (!condition) throw new Error(message);
}

must(src.includes('function lazySafeUserError('), 'lazySafeUserError helper missing');
must(src.includes("console.warn('[LazyLoader] Detalle técnico oculto al usuario.'"), 'UI technical diagnostic logging missing');

must(!src.includes("error:'El módulo cargó, pero no publicó el componente ' + component + '.'"), 'component implementation detail still visible');
must(!src.includes("error:e?.message || String(e)"), 'raw lazy error still visible in LazyModuleView');
must(src.includes("'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.'"), 'missing component fallback missing');
must(src.includes("'No pudimos cargar esta pantalla. Recargá e intentá nuevamente.'"), 'load failure fallback missing');

// Diagnostics and loader semantics must remain available for QA and runtime.
must(src.includes("throw new Error('No se pudo cargar ' + src + ' (' + r.status + ')')"), 'loadOne raw diagnostic changed');
must(src.includes("errors.push({ file:f, error:e && e.message ? e.message : String(e) })"), 'validateMap diagnostic detail removed');
must(src.includes('window.anLazyCampus = { loadOne, loadMany, validateMap, loaded, VERSION, getStatus }'), 'public lazy-loader API changed');
must(src.includes("fetch(src, { cache: 'no-cache' })"), 'loadOne fetch behavior changed');
must(src.includes("window.Babel.transform(code, { presets: ['react'], plugins: ['transform-block-scoping'] }).code"), 'Babel transform behavior changed');
must(src.includes("window.dispatchEvent(new CustomEvent('an:lazy-module-loaded'"), 'lazy module event changed');
must(src.includes('waitForRouteEnhancers(component)'), 'route enhancer wait removed');

console.log('CS21A200H LAZY LOADER SAFE ERRORS: PASS');
console.log('RAW_UI_DIAGNOSTICS=HIDDEN');
console.log('VALIDATEMAP_DIAGNOSTICS=PRESERVED');
console.log('LOAD_SEMANTICS=PRESERVED');
