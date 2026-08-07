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
  'apps_script_patches/99G_FIX_MEMORY_MATCH_RULES_QA_CS21A186.gs',
  'apps_script_patches/99H_FIX_ENGLISH_LAB_LIFECYCLE_QA_CS21A187.gs',
  'apps_script_patches/99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs',
];
const target = path.join(root, 'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');

for (const relative of sources) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) throw new Error(`Falta ${relative}`);
}

const header = `// =============================================================================\n// CS21A183-CS21A188 · APPS SCRIPT QA COMPLETO · COPIAR Y PEGAR TODO\n// Composición exacta: 99 + 99B + 99C + 99D FIX3 + 99E FIX4 + 99F CLOSED FIX + 99G RULES FIX + 99H LIFECYCLE FIX + 99I SHARED DISCOVERY\n// Reemplaza por completo el contenido del archivo Apps Script\n// 99_CS21A183_SENTENCE_ORDER_COMPLETO. No agregar parches manuales.\n// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.\n// =============================================================================\n`;

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
  "CS21A186_MM_RULES_FIX_VERSION = 'CS21A186-MM-RULES-FIX1'",
  "CS21A187_LIVE_LIFECYCLE_FIX_VERSION = 'CS21A187-LIVE-LIFECYCLE-FIX1'",
  "CS21A188_MM_SHARED_DISCOVERY_VERSION = 'CS21A188-MM-SHARED-DISCOVERY-1'",
  'CS21A183_MM_PRESENCE_TTL_MS = 60000',
  'function verificarMemoryMatchStartFixCS21A183()',
  'direct_start_no_legacy_delegate:true',
  'control_pair_metadata:true',
  'canonical_pair_count_from_room:true',
  'closed_room_terminal:true',
  'closed_room_turns_frozen:true',
  'closed_room_presence_frozen:true',
  'correct_pair_points:1',
  'correct_pair_keeps_player:true',
  'correct_pair_keeps_team:true',
  'incorrect_pair_rotates_turn:true',
  'timeout_rotates_turn:true',
  'recent_rooms_restored:true',
  'pair_count_8_blocked_before_room_creation:true',
  'shared_discovery:true',
  "card_states:'HIDDEN>DISCOVERED>CLAIMED'",
  'discoverer_does_not_own:true',
  'claim_owner_is_matcher:true',
  '__cs21a185ClosedTerminal',
  '__cs21a186CanonicalRules',
  '__cs21a187PairLimit',
  '__cs21a188SharedDiscovery',
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
  fix:'CS21A188-MM-SHARED-DISCOVERY-1',
  presenceTtlSeconds:60,
  closedRoomTerminal:true,
  correctPairKeepsTurn:true,
  correctPairPoints:1,
  sharedDiscovery:true,
  cardStates:['HIDDEN','DISCOVERED','CLAIMED'],
  discovererDoesNotOwn:true,
  claimOwnerIsMatcher:true,
  recentRooms:true,
  maxCanonicalPairs:6,
  bytes:Buffer.byteLength(check,'utf8')
}, null, 2));
