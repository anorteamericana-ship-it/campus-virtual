#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const target=path.join(root,'dist','CAMPUS_QA_CS21A183_CANDIDATO_SENTENCE_ORDER_LIVE');
if(!fs.existsSync(target)) throw new Error('Falta paquete CS21A183 construido.');
function copy(relative){const source=path.join(root,relative);const destination=path.join(target,relative);if(!fs.existsSync(source))throw new Error(`Falta ${relative}`);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.copyFileSync(source,destination);}
[
  'src/english_lab_live_classic_sync_guard_cs21a189.js',
  'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx',
  'src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx',
  'styles/english_lab_memory_match_classic_sync_cs21a189.css',
  'apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs',
  'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
].forEach(copy);

const campusPath=path.join(target,'campus.html');
let campus=fs.readFileSync(campusPath,'utf8');
campus=campus.replace(/\n?<script src="src\/english_lab_live_classic_sync_guard_cs21a189\.js\?v=[^"]+"><\/script>/g,'');
const oldGuard='<script src="src/english_lab_live_product_guard_cs21a187.js?v=F98.4Z6CS21A188"></script>';
if(!campus.includes(oldGuard)) throw new Error('No se encontró product guard CS21A188 para insertar Classic Sync.');
const classicTag='<script src="src/english_lab_live_classic_sync_guard_cs21a189.js?v=F98.4Z6CS21A189"></script>';
campus=campus.replace(oldGuard,`${oldGuard}\n${classicTag}`);
fs.writeFileSync(campusPath,campus,'utf8');

const versionPath=path.join(target,'VERSION.txt');
let version=fs.existsSync(versionPath)?fs.readFileSync(versionPath,'utf8').replace(/\s*$/,''):'';
version=version
  .replace(/^ENGLISH_LAB_CLASSIC_SYNC_GUARD=.*$/gm,'')
  .replace(/^MEMORY_MATCH_CACHE_EPOCH=.*$/gm,'')
  .replace(/^MEMORY_MATCH_SHARED_DISCOVERY=.*$/gm,'')
  .replace(/^MEMORY_MATCH_DISCOVERER_DOES_NOT_OWN=.*$/gm,'')
  .replace(/^MEMORY_MATCH_MATCHER_CLAIMS_PAIR=.*$/gm,'')
  .replace(/^MEMORY_MATCH_MODE=.*$/gm,'')
  .replace(/^MEMORY_MATCH_TRANSIENT_REVEAL=.*$/gm,'')
  .replace(/^MEMORY_MATCH_MISMATCH_REVEAL_MS=.*$/gm,'')
  .replace(/^MEMORY_MATCH_PERSISTENT_DISCOVERY=.*$/gm,'')
  .replace(/^MEMORY_MATCH_POLL_TIERS_MS=.*$/gm,'')
  .replace(/\n{3,}/g,'\n\n').replace(/\s*$/,'');
const lines=[
  'ENGLISH_LAB_CLASSIC_SYNC_GUARD=F98.4-Z6-CS21A189',
  'MEMORY_MATCH_CACHE_EPOCH=CS21A189',
  'MEMORY_MATCH_MODE=CLASSIC_SYNC',
  'MEMORY_MATCH_TRANSIENT_REVEAL=FIRST_REVEALED>MISMATCH_REVEAL>HIDDEN',
  'MEMORY_MATCH_MISMATCH_REVEAL_MS=2200',
  'MEMORY_MATCH_PERSISTENT_DISCOVERY=false',
  'MEMORY_MATCH_MATCHED_PAIR_STAYS_FACE_UP=true',
  'MEMORY_MATCH_POLL_TIERS_MS=5:550,10:900,15:1400,25:2200',
];
for(const line of lines){if(!version.includes(line))version+=`\n${line}`;}
fs.writeFileSync(versionPath,version.replace(/^\n/,'')+'\n','utf8');

const checks=[
  ['campus.html','english_lab_live_classic_sync_guard_cs21a189.js?v=F98.4Z6CS21A189'],
  ['src/english_lab_live_classic_sync_guard_cs21a189.js','memory_match_classic_sync_cs21a189.jsx?v=CS21A189'],
  ['src/english_lab_live_classic_sync_guard_cs21a189.js','english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx?v=CS21A189'],
  ['src/english_lab_games/memory_match_classic_sync_cs21a189.jsx','data-classic-sync="true"'],
  ['src/english_lab_games/memory_match_classic_sync_cs21a189.jsx','MISMATCH_REVEAL'],
  ['src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx','Object.freeze({maxPlayers:5,ms:550})'],
  ['styles/english_lab_memory_match_classic_sync_cs21a189.css','.elmm-card.is-mismatch'],
  ['apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','CS21A189-MM-CLASSIC-SYNC-1'],
  ['apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','persistent_discovery:false'],
  ['apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs','99K CLASSIC SYNC'],
];
for(const [relative,marker] of checks){const text=fs.readFileSync(path.join(target,relative),'utf8');if(!text.includes(marker))throw new Error(`${relative} no contiene ${marker}`);}
const versionCheck=fs.readFileSync(versionPath,'utf8');
for(const marker of lines){if(!versionCheck.includes(marker))throw new Error(`VERSION.txt no contiene ${marker}`);}
if(versionCheck.includes('MEMORY_MATCH_SHARED_DISCOVERY=HIDDEN>DISCOVERED>CLAIMED'))throw new Error('VERSION.txt conserva Shared Discovery como modo vigente.');

console.log(JSON.stringify({ok:true,target,version:'CS21A189',classicSync:true,mismatchRevealMs:2200,persistentDiscovery:false,matchedPairStaysFaceUp:true,adaptivePollMs:{5:550,10:900,15:1400,25:2200}},null,2));
