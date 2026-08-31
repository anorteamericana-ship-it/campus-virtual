import fs from 'node:fs';

function replaceExact(src, oldText, newText, label) {
  const count = src.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected 1, found ${count}`);
  console.log(`${label}: replaced 1`);
  return src.replace(oldText, newText);
}

const path = 'src/lazy_loader.jsx';
let src = fs.readFileSync(path, 'utf8');

src = replaceExact(
  src,
  "    const list = (files || []).map(normalize);\n    const depsReady = () => list.every(f => loaded.has(f));",
  "    const list = (files || []).map(normalize);\n    const safeError = 'No pudimos preparar esta pantalla. Recargá e intentá nuevamente.';\n    const depsReady = () => list.every(f => loaded.has(f));",
  'stable visible error copy'
);

src = replaceExact(
  src,
  "          else setState({ ready:false, error:'El módulo cargó, pero no publicó el componente ' + component + '.' });",
  "          else { console.warn('[LazyLoader] Componente no publicado.', { component, files:list }); setState({ ready:false, error:safeError }); }",
  'missing component boundary'
);

src = replaceExact(
  src,
  "        .catch(e => live && setState({ ready:false, error:e?.message || String(e) }));",
  "        .catch(e => { if(!live) return; console.warn('[LazyLoader] Error técnico preparando pantalla.', { component, files:list, error:e?.message || String(e) }); setState({ ready:false, error:safeError }); });",
  'loader exception boundary'
);

src = replaceExact(
  src,
  "title || component",
  "title || 'Campus Virtual'",
  'visible title fallback'
);

fs.writeFileSync(path, src);
console.log('CS21A197 exact lazy-loader safe-user patch applied');