#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const file = 'apps_script_patches/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs';
assert.equal(fs.existsSync(file), true, `Falta ${file}`);
const source = fs.readFileSync(file, 'utf8');

const checks = {
  version: /CS21A183-MM-START-FIX2/.test(source),
  qaMaster: /getProperty\('QA_STAGING_MASTER_ID'\)/.test(source),
  qaOperational: /getProperty\('QA_STAGING_OPERATIVO_ID'\)/.test(source),
  qaFailClosed: /solo puede ejecutarse en QA\/STAGING/.test(source),
  safeSettings: /var raw = room && room\.SETTINGS_JSON/.test(source),
  safePackageRoom: /room = room \|\| \{\};/.test(source),
  safePackageSettings: /var settings = _elmm174Settings_\(room\)/.test(source),
  wrapsStart176: /englishLabMemoryMatchStartRoomCS21A176 = function\(body\)/.test(source),
  controlledError: /memory_match_start_guard_error/.test(source),
  ownVerifier: /function verificarMemoryMatchStartFixCS21A183\(\)/.test(source),
  preservesGlobalVerifier: !/verificarActualizacionQA\s*=\s*function/.test(source),
  verifierUndefined: /_elmm174Settings_\(undefined\)/.test(source),
  verifierCreatedRoom: /STATUS:'CREATED'/.test(source) && /MODE:'TEAMS'/.test(source),
  verifierFlags: /settings_undefined_safe/.test(source) && /created_room_settings_safe/.test(source) && /created_room_package_safe/.test(source) && /preserves_curriculum_verifier:true/.test(source),
  noProdFallback: !/1I5uxY88wu_wNietQLKcYMl7hw7b0-q5ABI3QorY6zI4/.test(source),
};

for (const [name, ok] of Object.entries(checks)) {
  assert.equal(ok, true, `Contrato 99D falló: ${name}`);
}

console.log(JSON.stringify({ok:true, contract:'CS21A183_MEMORY_MATCH_START_GUARD_FIX2', checks}, null, 2));
