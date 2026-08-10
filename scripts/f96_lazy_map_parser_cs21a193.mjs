export function extractF96LazyMapCS21A193(appSource, canonicalLoaderSource = '') {
  const match = String(appSource || '').match(/const\s+F96_LAZY\s*=\s*(\{[\s\S]*?\n\};)/);
  if (!match) throw new Error('No se pudo extraer F96_LAZY de src/app.jsx.');

  let englishLabManifest = [];
  if (match[1].includes('F96_ENGLISH_LAB_LIVE_CS21A193')) {
    const manifestMatch = String(canonicalLoaderSource || '')
      .match(/const\s+MANIFEST\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/);
    if (!manifestMatch) throw new Error('No se pudo extraer el MANIFEST canónico CS21A193.');
    englishLabManifest = Function(`"use strict";return (${manifestMatch[1]});`)();
    if (!Array.isArray(englishLabManifest) || englishLabManifest.length !== 12) {
      throw new Error('El MANIFEST canónico CS21A193 debe contener 12 dependencias.');
    }
    if (!englishLabManifest.every(raw => /[?&]v=CS21A193(?:$|&)/.test(String(raw)))) {
      throw new Error('El MANIFEST canónico CS21A193 mezcla epochs.');
    }
  }

  return Function(
    'F96_ENGLISH_LAB_LIVE_CS21A193',
    `"use strict";return (${match[1].replace(/;\s*$/, '')});`,
  )(englishLabManifest);
}
