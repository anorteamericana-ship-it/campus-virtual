#!/usr/bin/env node
// Este contrato también ancla el RC después de regenerar el archivo Apps Script completo 99–99K.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const backend=fs.readFileSync('apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','utf8');
const engine=fs.readFileSync('src/english_lab_games/memory_match_classic_sync_cs21a189.jsx','utf8');
const adapter=fs.readFileSync('src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx','utf8');
const guard=fs.readFileSync('src/english_lab_live_classic_sync_guard_cs21a189.js','utf8');
const css=fs.readFileSync('styles/english_lab_memory_match_classic_sync_cs21a189.css','utf8');

for(const marker of [
  "CS21A189_MM_CLASSIC_SYNC_VERSION = 'CS21A189-MM-CLASSIC-SYNC-1'",
  'CS21A189_MM_MISMATCH_REVEAL_MS = 2200',
  "'FIRST_REVEALED'",
  "'MISMATCH_REVEAL'",
  "'PAIR_MISMATCH_AFTER_FLIPBACK'",
  'persistent_discovery:false',
  'mismatch_flip_back:true',
  'matched_pair_stays_face_up:true',
  '__cs21a189ClassicSync = true',
]) assert.ok(backend.includes(marker),`Backend no contiene ${marker}`);

assert.ok(backend.includes("shared.discovered_cards = {}"),'CS21A189 debe desactivar descubrimiento persistente.');
assert.ok(backend.includes('_cs21a186MmContinueSamePlayer_'),'Acierto debe conservar jugador/equipo.');
assert.ok(backend.includes('_elive176NextTurn_(turnState, revealUntil'),'Fallo debe programar próximo turno después del flip-back.');
assert.ok(backend.includes('turn_started_at'),'Debe respetar inicio diferido del turno siguiente.');

for(const marker of [
  'data-classic-sync="true"',
  "phase === 'FIRST_REVEALED'",
  "phase === 'MISMATCH_REVEAL'",
  'No coinciden · memorízalas antes de que se cierren',
  'Volteá dos cartas',
  'data-face-up',
]) assert.ok(engine.includes(marker),`Motor visual no contiene ${marker}`);

for(const marker of [
  'Object.freeze({maxPlayers:5,ms:550})',
  'Object.freeze({maxPlayers:10,ms:900})',
  'Object.freeze({maxPlayers:15,ms:1400})',
  'Object.freeze({maxPlayers:25,ms:2200})',
  'poll();',
  "addEventListener('visibilitychange',onVisibility)",
  'data-classic-sync-adapter="true"',
]) assert.ok(adapter.includes(marker),`Adaptador no contiene ${marker}`);

assert.ok(guard.includes('memory_match_classic_sync_cs21a189.jsx?v=CS21A189'));
assert.ok(guard.includes('english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx?v=CS21A189'));
assert.ok(guard.includes('__cs21a188SharedDiscovery=true'),'El guard debe preservar compatibilidad del stack previo.');
assert.ok(css.includes('.elmm-card.is-mismatch'));
assert.ok(css.includes('.elmm-flipback-banner'));

const result={
  verdict:'PASS_CONTRACT_CS21A189',
  classic_memory:true,
  first_reveal_global:true,
  mismatch_reveal_global:true,
  mismatch_flip_back:true,
  mismatch_reveal_ms:2200,
  persistent_discovery:false,
  correct_pair_stays_face_up:true,
  correct_pair_keeps_turn:true,
  next_turn_waits_for_flipback:true,
  adaptive_poll_ms:{5:550,10:900,15:1400,25:2200},
  immediate_poll:true,
  visibility_resume_poll:true,
};
console.log(JSON.stringify(result,null,2));
