export const CS21A193_CORE_PATHS = Object.freeze([
  'src/english_lab_games/english_lab_runtime_cs21a173.js',
  'src/english_lab_games/memory_match_engine_cs21a173.jsx',
  'src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx',
  'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js',
  'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx',
  'src/english_lab_games/english_lab_game_registry_cs21a191.js',
  'src/english_lab_games/hangman_engine_cs21a191.js',
  'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx',
  'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx',
  'src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx',
  'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx',
  'src/english_lab_live.jsx',
]);

const manifestPath = raw => String(raw || '').split('#')[0].split('?')[0];

export function validateEnglishLabCanonicalManifestCS21A193(manifest) {
  if (!Array.isArray(manifest) || manifest.length < CS21A193_CORE_PATHS.length) {
    throw new Error('El MANIFEST canónico debe preservar al menos las 12 dependencias base CS21A193.');
  }
  if (!manifest.every(raw => /[?&]v=CS21A\d+(?:$|&)/.test(String(raw)))) {
    throw new Error('Cada dependencia del MANIFEST canónico debe declarar un epoch CS21A versionado.');
  }

  const paths = manifest.map(manifestPath);
  if (new Set(paths).size !== paths.length) {
    throw new Error('El MANIFEST canónico no puede contener rutas físicas duplicadas.');
  }

  let previousIndex = -1;
  for (const requiredPath of CS21A193_CORE_PATHS) {
    const currentIndex = paths.indexOf(requiredPath);
    if (currentIndex < 0) {
      throw new Error(`El MANIFEST canónico perdió la dependencia base ${requiredPath}.`);
    }
    if (currentIndex <= previousIndex) {
      throw new Error(`El MANIFEST canónico alteró el orden base antes de ${requiredPath}.`);
    }
    previousIndex = currentIndex;
  }
  return manifest;
}

export function extractF96LazyMapCS21A193(appSource, canonicalLoaderSource = '') {
  const match = String(appSource || '').match(/const\s+F96_LAZY\s*=\s*(\{[\s\S]*?\n\};)/);
  if (!match) throw new Error('No se pudo extraer F96_LAZY de src/app.jsx.');

  let englishLabManifest = [];
  if (match[1].includes('F96_ENGLISH_LAB_LIVE_CS21A193')) {
    const manifestMatch = String(canonicalLoaderSource || '')
      .match(/const\s+MANIFEST\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/);
    if (!manifestMatch) throw new Error('No se pudo extraer el MANIFEST canónico CS21A193.');
    englishLabManifest = Function(`"use strict";return (${manifestMatch[1]});`)();
    validateEnglishLabCanonicalManifestCS21A193(englishLabManifest);
  }

  return Function(
    'F96_ENGLISH_LAB_LIVE_CS21A193',
    `"use strict";return (${match[1].replace(/;\s*$/, '')});`,
  )(englishLabManifest);
}
