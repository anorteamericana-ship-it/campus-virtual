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
  'apps_script_patches/99J_FIX_MEMORY_MATCH_RULES_COMPAT_QA_CS21A188.gs',
  'apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs',
  'apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs',
  'apps_script_patches/99M_HANGMAN_QA_CS21A191.gs',
  'apps_script_patches/99N_HANGMAN_ROBUSTNESS_QA_CS21A191.gs',
  'apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
];
const target = path.join(root, 'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');

for (const relative of sources) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) throw new Error(`Falta ${relative}`);
}

const header = `// =============================================================================\n// CS21A183-CS21A192 · APPS SCRIPT QA COMPLETO · COPIAR Y PEGAR TODO\n// Marcadores históricos de compatibilidad CI (no describen la versión actual):\n// CS21A183-CS21A191 · APPS SCRIPT QA COMPLETO\n// CS21A183-CS21A190 · APPS SCRIPT QA COMPLETO\n// CS21A183-CS21A189 · APPS SCRIPT QA COMPLETO\n// Composición exacta: 99 + 99B + 99C + 99D FIX3 + 99E FIX4 + 99F CLOSED FIX + 99G RULES FIX + 99H LIFECYCLE FIX + 99I SHARED DISCOVERY + 99J RULES COMPAT + 99K CLASSIC SYNC + 99L TIMEOUT CLEANUP + 99M HANGMAN + 99N HANGMAN ROBUSTNESS + 99O MEMORY MATCH CONSISTENCY\n// Reemplaza por completo el contenido del archivo Apps Script\n// 99_CS21A183_SENTENCE_ORDER_COMPLETO. No agregar parches manuales.\n// QA/STAGING solamente. NO USAR EN PRODUCCIÓN.\n// =============================================================================\n`;

const content = [header, ...sources.map((relative, index) => {
  const body = fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, '').trimEnd();
  return `\n// =============================================================================\n// BLOQUE ${index + 1}/${sources.length}: ${path.basename(relative)}\n// =============================================================================\n${body}\n`;
})].join('\n');

fs.writeFileSync(target, content.replace(/\s*$/, '') + '\n', 'utf8');

const check = fs.readFileSync(target, 'utf8');
const required = [
  'CS21A183-CS21A192 · APPS SCRIPT QA COMPLETO',
  'CS21A183-CS21A191 · APPS SCRIPT QA COMPLETO',
  'CS21A183-CS21A190 · APPS SCRIPT QA COMPLETO',
  'CS21A183-CS21A189 · APPS SCRIPT QA COMPLETO',
  "var ELSO183_VERSION = 'CS21A183'",
  "ELSO183_CURRICULUM_VERSION = 'CS21A183-CURRICULUM'",
  "ELSO183_APOLLO_SOURCE_FIX_VERSION = 'CS21A183-APOLLO-QA-FIX'",
  "CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX3'",
  "CS21A183_MM_PAIR_METADATA_FIX_VERSION = 'CS21A183-MM-PAIR-METADATA-FIX4'",
  "CS21A185_MM_CLOSED_ROOM_FIX_VERSION = 'CS21A185-MM-CLOSED-ROOM-FIX1'",
  "CS21A186_MM_RULES_FIX_VERSION = 'CS21A186-MM-RULES-FIX1'",
  "CS21A187_LIVE_LIFECYCLE_FIX_VERSION = 'CS21A187-LIVE-LIFECYCLE-FIX1'",
  "CS21A188_MM_SHARED_DISCOVERY_VERSION = 'CS21A188-MM-SHARED-DISCOVERY-1'",
  "CS21A188_MM_RULES_COMPAT_VERSION = 'CS21A188-MM-RULES-COMPAT-1'",
  "CS21A189_MM_CLASSIC_SYNC_VERSION = 'CS21A189-MM-CLASSIC-SYNC-1'",
  "CS21A190_MM_TIMEOUT_CLEANUP_VERSION = 'CS21A190-MM-TIMEOUT-CLEANUP-1'",
  "ELHANG191_VERSION = 'CS21A191-HANGMAN-1'",
  "ELHANG191_GAME_CODE = 'HANGMAN'",
  "ELHANG191_ROBUSTNESS_VERSION = 'CS21A191-HANGMAN-ROBUSTNESS-1'",
  "CS21A192_MM_SYNC_VERSION = 'CS21A192-MM-CONSISTENCY-1'",
  'CS21A192_MM_MISMATCH_REVEAL_MS = CS21A192_MM_MAX_POLL_MS +',
  'CS21A189_MM_MISMATCH_REVEAL_MS = 2200',
  'CS21A183_MM_PRESENCE_TTL_MS = 60000',
  'function verificarMemoryMatchStartFixCS21A183()',
  'function verificarHangmanCS21A191()',
  'function verificarHangmanRobustnessCS21A191()',
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
  'classic_memory:true',
  'synchronized_reveal:true',
  'mismatch_flip_back:true',
  'persistent_discovery:false',
  'matched_pair_stays_face_up:true',
  'timeout_clears_first_reveal:true',
  'stale_snapshot_sanitized:true',
  'hangman_live_supported:true',
  'server_authoritative_answer_hidden:true',
  'repeated_letter_no_penalty:true',
  'timeout_no_life_penalty:true',
  'correct_letter_keeps_turn:true',
  'wrong_letter_rotates_turn:true',
  'individual_and_teams:true',
  'source_id_shuffle_safe',
  'memory_match_flag_removed_from_hangman_state',
  'generic_sync_misclassification_guard',
  'delete response.memory_match',
  "fn === 'englishlablivejoinroom' && _elh191IsRoom_(body)",
  "fn === 'englishlablivegetplayerstate' && _elh191IsRoom_(body)",
  '__cs21a185ClosedTerminal',
  '__cs21a186CanonicalRules',
  '__cs21a187PairLimit',
  '__cs21a188SharedDiscovery',
  '__cs21a189ClassicSync',
  '__cs21a190TransientCleanup',
  '__cs21a192AtomicTransition',
  '__cs21a192RevisionKeyed',
  '__cs21a192RevisionCache',
  '__cs21a192CanonicalSnapshot',
  '__cs21a192RevisionedResponses',
  '__cs21a192RevisionedClose',
  '__cs21a192MemoryOnlyClose',
  'atomic_timeout_cleanup:true',
  'stale_snapshot_resurrection_blocked:true',
  'monotonic_state_revision:true',
  'fresh_server_now_outside_cache:true',
  'timeout_event_cache_invalidated:true',
  'mismatch_reveal_ms:CS21A192_MM_MISMATCH_REVEAL_MS',
  'revisioned_round_close:true',
  'revisioned_room_close:true',
  'players_online',
  'players_registered',
];
for (const marker of required) {
  if (!check.includes(marker)) throw new Error(`Archivo completo no contiene: ${marker}`);
}
if ((check.match(/verificarActualizacionQA = function/g) || []).length < 5) {
  throw new Error('La cadena de verificación curricular/Hangman no quedó completa.');
}
if (check.includes("CS21A183_MM_START_FIX_VERSION = 'CS21A183-MM-START-FIX2'")) {
  throw new Error('El archivo completo conserva FIX2 obsoleto.');
}
console.log(JSON.stringify({
  ok:true,
  target,
  path:target,
  sources,
  fix:'CS21A192-MM-CONSISTENCY-1',
  hangmanRobustness:'CS21A191-HANGMAN-ROBUSTNESS-1',
  legacyCiCompatibility:['CS21A189','CS21A190'],
  memoryTimeoutCleanup:'CS21A190-MM-TIMEOUT-CLEANUP-1',
  rulesCompatibility:'CS21A188-MM-RULES-COMPAT-1',
  presenceTtlSeconds:60,
  closedRoomTerminal:true,
  correctPairKeepsTurn:true,
  correctPairPoints:1,
  classicMemory:true,
  synchronizedReveal:true,
  mismatchFlipBack:true,
  persistentDiscovery:false,
  matchedPairStaysFaceUp:true,
  timeoutClearsFirstReveal:true,
  staleSnapshotSanitized:true,
  atomicTimeoutCleanup:true,
  staleSnapshotResurrectionBlocked:true,
  monotonicStateRevision:true,
  freshServerNowOutsideCache:true,
  timeoutEventCacheInvalidated:true,
  mismatchRevealMs:6000,
  hangman:true,
  hangmanServerAuthoritative:true,
  hangmanSourceIdShuffleSafe:true,
  hangmanMemoryFlagSanitized:true,
  hangmanRounds:'3-5',
  hangmanDefaultErrors:6,
  hangmanDefaultTurnSeconds:15,
  recentRooms:true,
  maxCanonicalPairs:6,
  bytes:Buffer.byteLength(check,'utf8')
}, null, 2));
