#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const file = 'apps_script_patches/99E_FIX_MEMORY_MATCH_PAIR_METADATA_QA_CS21A183.gs';
assert.equal(fs.existsSync(file), true, `Falta ${file}`);
const source = fs.readFileSync(file, 'utf8');

const room = {
  ROOM_ID:'ELIVE-FIX4-ROOM',
  ROOM_CODE:'LAB-FIX4',
  STATUS:'CREATED',
  GAME_CODE:'MEMORY_MATCH',
  UNIT:'U01',
  SETTINGS_JSON:'{"unit":"U01","pair_count":3}'
};

const sixSuggestions = Array.from({length:6}, (_,index)=>({left:`word-${index+1}`,right:`meaning-${index+1}`}));
const context = {
  console,
  JSON,
  Math,
  Number,
  String,
  Array,
  Object,
  _cs21a183MmJson_:(value,fallback)=>{
    try { return value ? JSON.parse(String(value)) : (fallback || {}); }
    catch (_) { return fallback || {}; }
  },
  _elive176NormalizeUnit_:value=>String(value || 'MIX').toUpperCase(),
  _elive176Upper_:value=>String(value || '').trim().toUpperCase(),
  _elive181SuggestedPairs_:()=>sixSuggestions,
  ELMM174_GAME_CODE:'MEMORY_MATCH',
  _elive180RoomIdFromBody_:body=>body && body.room_id,
  _elive180FindRoom_:()=>({row:room}),
  englishLabMemoryMatchGetRoomControlCS21A180:()=>({ok:true,room:{room_code:'LAB-FIX4'},stats:{players:2}}),
  verificarMemoryMatchStartFixCS21A183:()=>({
    ok:true,
    version:'CS21A183-MM-START-FIX3',
    memory_match_start_guard:true,
    direct_start_no_legacy_delegate:true,
    presence_ttl_seconds:60,
    qa_master:'QA_APOLLO',
    qa_operational:'QA_OPERATIVO'
  }),
};
vm.createContext(context);
vm.runInContext(source, context, {filename:file});

const response = context.englishLabMemoryMatchGetRoomControlCS21A180({room_id:room.ROOM_ID});
assert.equal(response.ok, true);
assert.equal(response.version, 'CS21A183-MM-PAIR-METADATA-FIX4');
assert.equal(response.pair_metadata_version, 'CS21A183-MM-PAIR-METADATA-FIX4');
assert.equal(response.pair_count, 3, 'el control debe respetar pair_count=3 de la sala');
assert.equal(response.settings.pair_count, 3, 'settings debe conservar pair_count=3');
assert.equal(response.suggested_pairs.length, 3, 'las sugerencias deben recortarse al pair_count canónico');

const verifier = context.verificarMemoryMatchStartFixCS21A183();
assert.equal(verifier.ok, true);
assert.equal(verifier.version, 'CS21A183-MM-PAIR-METADATA-FIX4');
assert.equal(verifier.previous_version, 'CS21A183-MM-START-FIX3');
assert.equal(verifier.control_pair_metadata, true);
assert.equal(verifier.canonical_pair_count_from_room, true);
assert.equal(verifier.synthetic_pair_count, 3);
assert.equal(verifier.stale_default_six_blocked, true);

assert.match(source, /response\.pair_count = metadata\.pair_count/);
assert.match(source, /response\.settings = metadata\.settings/);
assert.match(source, /response\.suggested_pairs = suggestions\.slice\(0, metadata\.pair_count\)/);

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A183_MEMORY_MATCH_PAIR_METADATA_FIX4',
  room_pair_count:3,
  source_suggestions:6,
  control_pair_count:response.pair_count,
  returned_suggestions:response.suggested_pairs.length,
  stale_default_six_blocked:true,
}, null, 2));
