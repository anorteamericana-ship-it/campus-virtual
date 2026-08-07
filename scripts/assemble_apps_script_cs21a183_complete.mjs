#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sources = [
  'apps_script_patches/99_ACTUALIZACION_QA_CS21A183.gs',
  'apps_script_patches/99B_VALIDACION_CURRICULAR_CS21A183.gs',
  'apps_script_patches/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs',
  'apps_script_patches/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs',
  'apps_script_patches/99E_FIX_MEMORY_MATCH_PAIR_METADATA_QA_CS21A183.gs',
  'apps_script_patches/99F_FIX_MEMORY_MATCH_CLOSED_ROOM_QA_CS21A185.gs',
];
const target = path.join(root, 'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');

for (const relative of sources) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) throw new Error(`Falta ${relative}`);
}

const header = `// =============================================================================\n// CS21A183-CS21A185 · APPS SCRIPT QA COMPLETO · COPIAR Y PEGAR TODO\n// Composición exacta: 99 + 99B + 99C + 99D FIX3 + 99E FIX4 + 99F CLOSED FIX\n// Reemplaza por completo el contenido del archivo Apps Script\n// 99_CS21A183_SENTENCE_ORDER_COMPLETO. No agregar parches manuales.\n// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.\n// =============================================================================\n`;

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
  "CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX3'",
  "CS21A183_MM_PAIR_METADATA_FIX_VERSION = 'CS21A183-MM-PAIR-METADATA-FIX4'",
  "CS21A185_MM_CLOSED_ROOM_FIX_VERSION = 'CS21A185-MM-CLOSED-ROOM-FIX1'",
  'CS21A183_MM_PRESENCE_TTL_MS = 60000',
  'function verificarMemoryMatchStartFixCS21A183()',
  'direct_start_no_legacy_delegate:true',
  'control_pair_metadata:true',
  'canonical_pair_count_from_room:true',
  'closed_room_terminal:true',
  'closed_room_turns_frozen:true',
  'closed_room_presence_frozen:true',
  '__cs21a185ClosedTerminal',
  'players_online',
  'players_registered',
];
for (const marker of required) {
  if (!check.includes(marker)) throw new Error(`Archivo completo no contiene: ${marker}`);
}
if ((check.match(/verificarActualizacionQA = function/g) || []).length < 3) {
  throw new Error('La cadena de verificación curricular no quedó completa.');
}
if (check.includes("CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX2'")) {
  throw new Error('El archivo completo conserva FIX2 obsoleto.');
}
console.log(JSON.stringify({
  ok:true,
  target,
  path:target,
  sources,
  fix:'CS21A185-MM-CLOSED-ROOM-FIX1',
  presenceTtlSeconds:60,
  closedRoomTerminal:true,
  bytes:Buffer.byteLength(check,'utf8')
}, null, 2));
