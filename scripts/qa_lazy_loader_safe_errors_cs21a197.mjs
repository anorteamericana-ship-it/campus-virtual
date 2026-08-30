import fs from 'node:fs';
const src=fs.readFileSync('src/lazy_loader.jsx','utf8');
const req=(s,l)=>{if(!src.includes(s))throw new Error(`CS21A197 missing: ${l}`)};
const forbid=(s,l)=>{if(src.includes(s))throw new Error(`CS21A197 forbidden: ${l}`)};

req("function reportLazyFailure(error,context={})",'lazy diagnostic helper');
req("console.warn('[LazyLoader] Detalle técnico oculto al usuario.'",'console diagnostics');
req("error:'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.'",'stable missing-component copy');
req("reportLazyFailure(e,{ component, files:list });",'caught lazy failure diagnostic');
req("error:'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.'",'stable catch copy');

forbid("error:'El módulo cargó, pero no publicó el componente ' + component + '.'",'internal component name in visible error');
forbid(".catch(e => live && setState({ ready:false, error:e?.message || String(e) }))",'raw error.message to UI');

req("errors.push({ file:f, error:e && e.message ? e.message : String(e) });",'validateMap diagnostics preserved');
req("if(!r.ok) throw new Error('No se pudo cargar ' + src + ' (' + r.status + ')');",'loadOne diagnostic preserved');
req("const VERSION = 'F98.4-Z6-CS21A124';",'loader version preserved');

console.log('CS21A197 LAZY LOADER SAFE ERRORS: PASS');
console.log('USER_VISIBLE_TECHNICAL_DETAILS=NO_FOR_LAZY_SCREEN');
console.log('QA_DIAGNOSTICS=PRESERVED');
