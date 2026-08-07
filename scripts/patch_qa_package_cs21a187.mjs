#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root,'dist','CAMPUS_QA_CS21A183_CANDIDATO_SENTENCE_ORDER_LIVE');
if(!fs.existsSync(target)) throw new Error('Falta paquete CS21A183 construido.');

function copy(relative){
  const source = path.join(root,relative);
  const destination = path.join(target,relative);
  if(!fs.existsSync(source)) throw new Error(`Falta ${relative}`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}

[
  'src/english_lab_live_product_guard_cs21a187.js',
  'src/english_lab_games/english_lab_runtime_cs21a173.js',
  'src/english_lab_games/memory_match_engine_cs21a173.jsx',
  'src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx',
  'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js',
  'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx',
  'styles/english_lab_memory_match_cs21a173.css',
  'apps_script_patches/99H_FIX_ENGLISH_LAB_LIFECYCLE_QA_CS21A187.gs',
  'apps_script_patches/99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs',
  'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
].forEach(copy);

const campusPath = path.join(target,'campus.html');
let campus = fs.readFileSync(campusPath,'utf8');
const oldTags = [
  '<script src="src/english_lab_live_product_guard_cs21a187.js?v=F98.4Z6CS21A187"></script>',
  '<script src="src/english_lab_live_product_guard_cs21a187.js?v=F98.4Z6CS21A188"></script>',
];
for(const oldTag of oldTags) campus = campus.replace(oldTag,'');
const tag = '<script src="src/english_lab_live_product_guard_cs21a187.js?v=F98.4Z6CS21A188"></script>';
const anchor = '<script src="src/teacher_delivery_guard_cs21a133.js?v=F98.4Z6CS21A133"></script>';
if(!campus.includes(anchor)) throw new Error('No se encontró ancla para product guard CS21A188.');
campus = campus.replace(anchor, `${tag}\n${anchor}`);
fs.writeFileSync(campusPath,campus,'utf8');

const versionPath = path.join(target,'VERSION.txt');
let version = fs.existsSync(versionPath) ? fs.readFileSync(versionPath,'utf8').replace(/\s*$/,'') : '';
version = version
  .replace(/^ENGLISH_LAB_PRODUCT_GUARD=.*$/gm,'')
  .replace(/^MEMORY_MATCH_CACHE_EPOCH=.*$/gm,'')
  .replace(/^MEMORY_MATCH_SHARED_DISCOVERY=.*$/gm,'')
  .replace(/\n{3,}/g,'\n\n')
  .replace(/\s*$/,'');
const lines = [
  'ENGLISH_LAB_PRODUCT_GUARD=F98.4-Z6-CS21A188',
  'ENGLISH_LAB_NO_STALE_ROOM_RESTORE=true',
  'ENGLISH_LAB_CLOSED_ROOM_AUTO_EXIT=true',
  'MEMORY_MATCH_CACHE_EPOCH=CS21A188',
  'MEMORY_MATCH_SHARED_DISCOVERY=HIDDEN>DISCOVERED>CLAIMED',
  'MEMORY_MATCH_DISCOVERER_DOES_NOT_OWN=true',
  'MEMORY_MATCH_MATCHER_CLAIMS_PAIR=true',
  'MEMORY_MATCH_MAX_CANONICAL_PAIRS=6',
  'RECENT_LIVE_ROOMS=true',
];
for(const line of lines){ if(!version.includes(line)) version += `\n${line}`; }
fs.writeFileSync(versionPath,version.replace(/^\n/,'')+'\n','utf8');

const checks = [
  ['campus.html','english_lab_live_product_guard_cs21a187.js?v=F98.4Z6CS21A188'],
  ['src/english_lab_live_product_guard_cs21a187.js','memory_match_shared_discovery_cs21a188.jsx?v=CS21A188'],
  ['src/english_lab_live_product_guard_cs21a187.js','an:english-lab-detach-room'],
  ['src/english_lab_live_product_guard_cs21a187.js','MAX_MEMORY_PAIRS = 6'],
  ['src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx','data-shared-discovery="true"'],
  ['src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx','DISCOVER_CARD'],
  ['src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx','SUBMIT_PAIR'],
  ['src/english_lab_games/english_lab_runtime_cs21a173.js','CS21A186-MEMORY-CLOCK-FIX1'],
  ['apps_script_patches/99H_FIX_ENGLISH_LAB_LIFECYCLE_QA_CS21A187.gs','CS21A187-LIVE-LIFECYCLE-FIX1'],
  ['apps_script_patches/99I_MEMORY_MATCH_SHARED_DISCOVERY_QA_CS21A188.gs','CS21A188-MM-SHARED-DISCOVERY-1'],
  ['apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs','99I SHARED DISCOVERY'],
];
for(const [relative,marker] of checks){
  const text = fs.readFileSync(path.join(target,relative),'utf8');
  if(!text.includes(marker)) throw new Error(`${relative} no contiene ${marker}`);
}

console.log(JSON.stringify({
  ok:true,target,version:'CS21A188',cacheEpoch:'CS21A188',maxPairs:6,
  sharedDiscovery:true,states:['HIDDEN','DISCOVERED','CLAIMED'],
  discovererDoesNotOwn:true,matcherClaimsPair:true,
  closedRoomAutoExit:true,noStaleRestore:true
},null,2));
