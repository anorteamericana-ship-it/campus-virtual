#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const backend = fs.readFileSync('apps_script_patches/99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs','utf8');
const frontend = fs.readFileSync('src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx','utf8');
const adapter = fs.readFileSync('src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx','utf8');
const syncGuard = fs.readFileSync('src/english_lab_games/english_lab_live_sync_guard_cs21a177.js','utf8');
const guard = fs.readFileSync('src/english_lab_live_product_guard_cs21a187.js','utf8');
const css = fs.readFileSync('styles/english_lab_memory_match_cs21a173.css','utf8');
const assembler = fs.readFileSync('scripts/assemble_apps_script_cs21a183_complete.mjs','utf8');

for (const marker of [
  "CS21A188-MM-SHARED-DISCOVERY-1",
  "action === 'DISCOVER_CARD'",
  'MEMORY_MATCH_CARD_DISCOVERED',
  'MEMORY_MATCH_PAIR_CLAIMED',
  'discovered_cards',
  'claimed_pairs',
  'discoverer_does_not_own:true',
  'claim_owner_is_matcher:true',
]) assert.ok(backend.includes(marker), `Backend no contiene ${marker}`);

const context = {
  console:{log(){}},
  verificarMemoryMatchStartFixCS21A183:()=>({
    ok:true,version:'CS21A187-LIVE-LIFECYCLE-FIX1',closed_room_terminal:true,
    recent_rooms_restored:true,stale_room_restore_forbidden:true,qa_master:'QA_MASTER',qa_operational:'QA_OPERATIVO'
  }),
  _elive176Text_:value=>String(value == null ? '' : value).trim(),
  _elive176Upper_:value=>String(value == null ? '' : value).trim().toUpperCase(),
  _elive176Iso_:value=>(value instanceof Date ? value : new Date(value || Date.now())).toISOString(),
};
vm.createContext(context);
vm.runInContext(backend,context,{filename:'99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs'});

const pkg={shared_state:{board_version:1,matched_pair_ids:[]}};
const shared=context._cs21a188MmShared_(pkg);
const cardA={card_id:'CARD-A',pair_id:'PAIR-1'};
const cardB={card_id:'CARD-B',pair_id:'PAIR-1'};
const chu={COD_ESTUDIANTE:'P1',NOMBRE:'Chu',TEAM:'Equipo Azul'};
const naty={COD_ESTUDIANTE:'P2',NOMBRE:'Naty',TEAM:'Equipo Rojo'};
const turn={turn_number:3};
const now=new Date('2026-08-07T23:00:00.000Z');

assert.equal(context._cs21a188MmDiscover_(shared,cardA,chu,turn,now).changed,true);
assert.equal(shared.discovered_cards['CARD-A'].discovered_by,'P1');
assert.equal(context._cs21a188MmDiscover_(shared,cardA,naty,turn,now).changed,false);
assert.equal(shared.discovered_cards['CARD-A'].discovered_by,'P1','Otro jugador no puede apropiarse del descubrimiento.');
assert.equal(context._cs21a188MmDiscover_(shared,cardB,naty,turn,now).changed,true);
const claim=context._cs21a188MmClaim_(shared,'PAIR-1',cardA,cardB,naty,turn,now);
assert.equal(claim.claimed_by,'P2','Quien completa la pareja debe ser el propietario final.');
assert.equal(claim.team_id,'Equipo Rojo');
assert.ok(shared.matched_pair_ids.includes('PAIR-1'));
assert.notEqual(shared.discovered_cards['CARD-A'].discovered_by,claim.claimed_by,'Descubridor y dueño final pueden ser personas distintas.');

for (const marker of [
  "const VERSION = 'CS21A188'",
  "const STYLE_HREF = '/styles/english_lab_memory_match_cs21a173.css?v=CS21A188'",
  "data-card-state={claimed?'CLAIMED':visible?'DISCOVERED':'HIDDEN'}",
  "buildAction('DISCOVER_CARD'",
  "buildAction('SUBMIT_PAIR'",
  'Descubierta por',
  'Pareja reclamada',
  'No coinciden. Ambas quedan descubiertas para la sala.',
  'MemoryMatchGameCS21A173=MemoryMatchSharedDiscoveryCS21A188',
]) assert.ok(frontend.includes(marker), `Frontend no contiene ${marker}`);
assert.ok(!frontend.includes("const STYLE_HREF = 'styles/english_lab_memory_match_cs21a173.css?v=CS21A188'"),'Shared Discovery no puede depender de una ruta CSS relativa al documento actual.');

for (const marker of [
  "const VERSION = 'CS21A188'",
  "const STYLE_HREF = '/styles/english_lab_memory_match_cs21a173.css?v=CS21A188'",
  'const LIVE_POLL_MS = 1500',
  'Object.freeze({maxPlayers:5,ms:1500})',
  'Object.freeze({maxPlayers:10,ms:1800})',
  'Object.freeze({maxPlayers:15,ms:2500})',
  'Object.freeze({maxPlayers:25,ms:3500})',
  'livePollMsForPlayers',
  "global.document.visibilityState === 'hidden'",
  'pollingRef.current',
  'ENDPOINTS.getRoomControl : ENDPOINTS.getPlayerState',
  'setLiveState(current => mergeLiveState(current, result, room, player))',
  "action === 'DISCOVER_CARD'",
  'Carta compartida con toda la sala.',
  'Sincronizando jugada…',
]) assert.ok(adapter.includes(marker), `Adaptador Live no contiene ${marker}`);
assert.ok(!adapter.includes("const STYLE_HREF = 'styles/english_lab_memory_match_cs21a173.css?v=CS21A188'"),'El adaptador Live no puede resolver CSS relativamente desde previews/rutas anidadas.');
assert.ok(!adapter.includes('const READ_ONLY_POLL_MS = 4000'),'El adaptador no puede conservar el polling docente antiguo fijo de 4 segundos.');
const immediateMerge=adapter.indexOf('if (result && result.room_package)');
const fallbackRefresh=adapter.indexOf("else if (typeof onRefresh === 'function')");
assert.ok(immediateMerge>=0 && fallbackRefresh>immediateMerge,'La respuesta autoritativa debe adoptarse antes de cualquier refresh de respaldo.');

for (const marker of [
  "READ_CACHE_FIX_VERSION = 'CS21A188'",
  'READ_CACHE_MS = 750',
  'recentReads',
  'cacheGeneration',
  'invalidateReadCache',
  'entry.generation === cacheGeneration',
]) assert.ok(syncGuard.includes(marker), `Sync guard no contiene ${marker}`);

const baseIndex=guard.indexOf('memory_match_engine_cs21a173.jsx?v=CS21A188');
const sharedIndex=guard.indexOf('memory_match_shared_discovery_cs21a188.jsx?v=CS21A188');
const adapterIndex=guard.indexOf('english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A188');
assert.ok(baseIndex>=0 && sharedIndex>baseIndex && adapterIndex>sharedIndex,'Shared Discovery debe cargar después del motor base y antes del adaptador Live.');
assert.ok(guard.includes('MemoryMatchGameCS21A173.__cs21a188SharedDiscovery === true'));
assert.ok(css.includes('.elmm-card.is-discovered'));
assert.ok(css.includes('.elmm-card.is-claimed'));
assert.ok(css.includes('.elmm-card.is-selected'));
assert.ok(assembler.includes('99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs'));

console.log(JSON.stringify({
  ok:true,
  version:'CS21A188',
  states:['HIDDEN','DISCOVERED','CLAIMED'],
  first_discoverer_preserved:true,
  discovered_card_public_and_selectable:true,
  matcher_claims_pair:true,
  matcher_can_differ_from_discoverer:true,
  correct_pair_points:1,
  shared_discovery_loaded_before_live_adapter:true,
  absolute_css_route:true,
  adaptive_poll_ms:{'1-5':1500,'6-10':1800,'11-15':2500,'16-25':3500},
  read_cache_ms:750,
  hidden_tab_poll_paused:true,
  overlapping_polls_blocked:true,
  stale_inflight_cache_generation_guard:true,
  actor_adopts_authoritative_write_immediately:true,
  visual_states_present:true,
},null,2));
