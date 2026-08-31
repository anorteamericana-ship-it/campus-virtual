import fs from 'node:fs';

const src = fs.readFileSync('src/lazy_loader.jsx', 'utf8');
const start = src.indexOf('function LazyModuleView(');
const end = src.indexOf('\n  window.anLazyCampus', start);
const view = start >= 0 && end > start ? src.slice(start, end) : '';

function check(condition, message) {
  if (!condition) {
    console.error(`FAIL CS21A197: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

check(src.includes("throw new Error('No se pudo cargar ' + src + ' (' + r.status + ')')"), 'loadOne keeps technical HTTP diagnostic');
check(src.includes("errors.push({ file:f, error:e && e.message ? e.message : String(e) })"), 'validateMap keeps raw diagnostic inventory');
check(view.includes("const safeError = 'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.'"), 'stable user error copy exists');
check(view.includes("console.warn('[LazyLoader] Componente no publicado.'"), 'missing component detail is logged internally');
check(view.includes("console.warn('[LazyLoader] Error técnico preparando pantalla.'"), 'loader exception detail is logged internally');
check(view.includes("error:e?.message || String(e)"), 'raw exception remains available only in console diagnostic payload');
check(view.includes("title || 'Campus Virtual'"), 'technical component name is not used as title fallback');
check(!view.includes("'El módulo cargó, pero no publicó el componente ' + component"), 'component identifier is not shown to user');
check(!view.includes('setState({ ready:false, error:e?.message || String(e) })'), 'raw exception is not stored in visible LazyModuleView state');
check(!view.includes('setState({ ready:false, error:e.message || String(e) })'), 'raw error.message is not stored in visible LazyModuleView state');
check(!view.includes('title || component'), 'component identifier is not used as visible title fallback');
check(view.includes("'Preparando pantalla…'"), 'normal loading copy remains');
check(view.includes("'Recargar'"), 'recovery action remains');

if (process.exitCode) process.exit(process.exitCode);
console.log('CS21A197 LAZY LOADER SAFE USER ERRORS: PASS');
console.log('VISIBLE_TECHNICAL_DETAILS=NO');
console.log('DIAGNOSTIC_LAYER=PRESERVED');