// CS21A188 · QA · compatibilidad de metadatos CS21A186 con Shared Discovery.
// APPEND-ONLY en el repositorio; el usuario recibe SIEMPRE el archivo Apps Script completo ensamblado.
// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.
//
// CS21A188 reemplaza el handler canónico para soportar DISCOVER_CARD y SUBMIT_PAIR,
// pero conserva semánticamente las reglas de CS21A186. Al reemplazar una función en
// JavaScript se pierden las propiedades custom del objeto función; este bloque restaura
// exclusivamente esa metadata para que la cadena histórica de verificadores pueda
// comprobar las reglas acumuladas sin alterar la lógica de ejecución.

var CS21A188_MM_RULES_COMPAT_VERSION = 'CS21A188-MM-RULES-COMPAT-1';

if (typeof englishLabMemoryMatchSubmitPairCS21A180 === 'function') {
  englishLabMemoryMatchSubmitPairCS21A180.__cs21a186CanonicalRules = true;
  englishLabMemoryMatchSubmitPairCS21A180.__cs21a188SharedDiscovery = true;
}
