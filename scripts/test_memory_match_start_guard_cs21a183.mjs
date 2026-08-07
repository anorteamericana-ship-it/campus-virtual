#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'apps_script_patches/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs';
assert.equal(fs.existsSync(file), true, `Falta ${file}`);
const source = fs.readFileSync(file, 'utf8');

const checks = {
  version: /CS21A183-MM-START-FIX3/.test(source),
  qaMaster: /getProperty\('QA_STAGING_MASTER_ID'\)/.test(source),
  qaOperational: /getProperty\('QA_STAGING_OPERATIVO_ID'\)/.test(source),
  qaFailClosed: /solo puede ejecutarse en QA\/STAGING/.test(source),
  safeSettings: /room && room\.SETTINGS_JSON/.test(source),
  directStart: /englishLabMemoryMatchStartRoomCS21A176 = function \(body\)/.test(source),
  noLegacyDelegate: /direct_start_no_legacy_delegate:true/.test(source) && !/_cs21a183MmStartBase_/.test(source),
  directRoomLookup: /_elive180FindRoom_\(roomId\)/.test(source),
  stagedError: /memory_match_start_fix3_error/.test(source) && /stage:stage/.test(source),
  presenceTtl: /CS21A183_MM_PRESENCE_TTL_MS = 60000/.test(source),
  lastSeen: /LAST_SEEN_AT \|\| row\.JOINED_AT/.test(source),
  staleExcluded: /stale_players_excluded:true/.test(source),
  freshPlayersStart: /_cs21a183MmPresenceRows_\(room, Date\.now\(\)\)/.test(source),
  teamsNeedTwo: /equipos_requieren_dos_participantes/.test(source),
  controlPresence: /englishLabMemoryMatchGetRoomControlCS21A180 = function \(body\)/.test(source),
  presenceStats: /players_registered/.test(source) && /players_online/.test(source),
  ownVerifier: /function verificarMemoryMatchStartFixCS21A183\(\)/.test(source),
  preservesGlobalVerifier: !/verificarActualizacionQA\s*=\s*function/.test(source),
  verifierUndefined: /_elmm174Settings_\(undefined\)/.test(source),
  verifierFlags: /created_room_package_safe/.test(source) && /preserves_curriculum_verifier:true/.test(source),
  noProdFallback: !/1I5uxY88wu_wNietQLKcYMl7hw7b0-q5ABI3QorY6zI4/.test(source),
};

for (const [name, ok] of Object.entries(checks)) {
  assert.equal(ok, true, `Contrato 99D FIX3 falló: ${name}`);
}

console.log(JSON.stringify({ok:true, contract:'CS21A183_MEMORY_MATCH_START_PRESENCE_FIX3', checks}, null, 2));
