import fs from 'node:fs';
const path='src/lazy_loader.jsx';
let src=fs.readFileSync(path,'utf8');
function rep(oldText,newText,label){const count=src.split(oldText).length-1;if(count!==1)throw new Error(`${label}: expected 1 preimage, found ${count}`);src=src.replace(oldText,newText);console.log(`${label}: replaced 1`)}

rep(
`  function getStatus(){\n    return { version: VERSION, loaded: Array.from(loaded), loading: Array.from(loading.keys()) };\n  }\n\n  function LazyModuleView`,
`  function getStatus(){\n    return { version: VERSION, loaded: Array.from(loaded), loading: Array.from(loading.keys()) };\n  }\n\n  function reportLazyFailure(error,context={}){\n    console.warn('[LazyLoader] Detalle técnico oculto al usuario.', { ...context, error:error?.message || String(error || '') });\n  }\n\n  function LazyModuleView`,
'insert diagnostic helper');

rep(
`          else setState({ ready:false, error:'El módulo cargó, pero no publicó el componente ' + component + '.' });`,
`          else { reportLazyFailure(new Error('Componente no publicado'), { component, files:list }); setState({ ready:false, error:'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.' }); }`,
'sanitize missing component');

rep(
`        .catch(e => live && setState({ ready:false, error:e?.message || String(e) }));`,
`        .catch(e => { if (!live) return; reportLazyFailure(e,{ component, files:list }); setState({ ready:false, error:'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.' }); });`,
'sanitize lazy exception');

fs.writeFileSync(path,src);
console.log('CS21A197 exact lazy-loader safe-error patch applied');
