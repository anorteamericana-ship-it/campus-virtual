#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sources = [
  'apps_script_patches/99_ACTUALIZACION_QA_CS21A183.gs',
  'apps_script_patches/99B_VALIDACION_CURRICULAR_CS21A183.gs',
  'apps_script_patches/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs',
  'apps_script_patches/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs',
];
const target = path.join(root, 'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');

for (const relative of sources) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) throw new Error(`Falta ${relative}`);
}

const header = `// =============================================================================\n// CS21A183 · APPS SCRIPT QA COMPLETO · COPIAR Y PEGAR TODO\n// Composición exacta: 99 + 99B + 99C + 99D FIX2\n// Reemplaza por completo el contenido del archivo Apps Script\n// 99_CS21A183_SENTENCE_ORDER_COMPLETO. No agregar parches manuales.\n// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.\n// =============================================================================\n`;

const content = [header, ...sources.map((relative, index) => {
  const body = fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, '').trimEnd();
  return `\n// =============================================================================\n// BLOQUE ${index + 1}/${sources.length}: ${path.basename(relative)}\n// =============================================================================\n${body}\n`;
})].join('\n');

fs.writeFileSync(target, content.replace(/\s*$/, '') + '\n', 'utf8');

const check = fs.readFileSync(target, 'utf8');
const required = [
  "var ELSO183_VERSION = 'CS21A183'",
  "ELSO183_CURRICULUM_VERSION = 'CS21A183-CURRICULUM'",
  "ELSO183_APOLLO_SOURCE_FIX_VERSION = 'CS21A183-APOLLO-QA-FIX'",
  "CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX2'",
  'function verificarMemoryMatchStartFixCS21A183()',
];
for (const marker of required) {
  if (!check.includes(marker)) throw new Error(`Archivo completo no contiene: ${marker}`);
}
if ((check.match(/verificarActualizacionQA = function/g) || []).length < 3) {
  throw new Error('La cadena de verificación curricular no quedó completa.');
}
console.log(JSON.stringify({ok:true,target,path:target,sources,bytes:Buffer.byteLength(check,'utf8')}, null, 2));
