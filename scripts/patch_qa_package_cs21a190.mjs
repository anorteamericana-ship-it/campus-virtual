#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const target=path.join(root,'dist','CAMPUS_QA_CS21A183_CANDIDATO_SENTENCE_ORDER_LIVE');
if(!fs.existsSync(target)) throw new Error('Falta paquete CS21A183/189 construido.');
function copy(relative){
  const source=path.join(root,relative);
  const destination=path.join(target,relative);
  if(!fs.existsSync(source)) throw new Error(`Falta ${relative}`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}
[
  'src/english_lab_live_timeout_style_guard_cs21a190.js',
  'apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs',
  'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
].forEach(copy);

const campusPath=path.join(target,'campus.html');
let campus=fs.readFileSync(campusPath,'utf8');
campus=campus
  .replace(/\n?<script src="src\/english_lab_live_timeout_style_guard_cs21a190\.js\?v=[^"]+"><\/script>/g,'')
  .replace(/\n?<link rel="stylesheet" href="styles\/english_lab_memory_match_cs21a173\.css\?v=CS21A190">/g,'')
  .replace(/\n?<link rel="stylesheet" href="styles\/english_lab_memory_match_classic_sync_cs21a189\.css\?v=CS21A190">/g,'');
const classicTag='<script src="src/english_lab_live_classic_sync_guard_cs21a189.js?v=F98.4Z6CS21A189"></script>';
if(!campus.includes(classicTag)) throw new Error('No se encontró Classic Sync CS21A189 para insertar CS21A190.');
const styleTags='<link rel="stylesheet" href="styles/english_lab_memory_match_cs21a173.css?v=CS21A190">\n<link rel="stylesheet" href="styles/english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A190">';
if(!campus.includes('</head>')) throw new Error('campus.html no tiene </head>.');
campus=campus.replace('</head>',`${styleTags}\n</head>`);
const guardTag='<script src="src/english_lab_live_timeout_style_guard_cs21a190.js?v=F98.4Z6CS21A190"></script>';
campus=campus.replace(classicTag,`${classicTag}\n${guardTag}`);
fs.writeFileSync(campusPath,campus,'utf8');

const versionPath=path.join(target,'VERSION.txt');
let version=fs.existsSync(versionPath)?fs.readFileSync(versionPath,'utf8').replace(/\s*$/,''):'';
version=version
  .replace(/^ENGLISH_LAB_TIMEOUT_STYLE_GUARD=.*$/gm,'')
  .replace(/^MEMORY_MATCH_TIMEOUT_CLEANUP=.*$/gm,'')
  .replace(/^MEMORY_MATCH_TIMEOUT_FIRST_REVEAL_CLEAR=.*$/gm,'')
  .replace(/^MEMORY_MATCH_STYLE_BASE=.*$/gm,'')
  .replace(/^MEMORY_MATCH_STYLE_CLASSIC=.*$/gm,'')
  .replace(/^MEMORY_MATCH_CACHE_EPOCH=.*$/gm,'')
  .replace(/\n{3,}/g,'\n\n').replace(/\s*$/,'');
const lines=[
  'ENGLISH_LAB_TIMEOUT_STYLE_GUARD=F98.4-Z6-CS21A190',
  'MEMORY_MATCH_CACHE_EPOCH=CS21A190',
  'MEMORY_MATCH_TIMEOUT_CLEANUP=CS21A190-MM-TIMEOUT-CLEANUP-1',
  'MEMORY_MATCH_TIMEOUT_FIRST_REVEAL_CLEAR=true',
  'MEMORY_MATCH_STYLE_BASE=english_lab_memory_match_cs21a173.css',
  'MEMORY_MATCH_STYLE_CLASSIC=english_lab_memory_match_classic_sync_cs21a189.css',
];
for(const line of lines){if(!version.includes(line))version+=`\n${line}`;}
fs.writeFileSync(versionPath,version.replace(/^\n/,'')+'\n','utf8');

const checks=[
  ['campus.html','english_lab_memory_match_cs21a173.css?v=CS21A190'],
  ['campus.html','english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A190'],
  ['campus.html','english_lab_live_timeout_style_guard_cs21a190.js?v=F98.4Z6CS21A190'],
  ['src/english_lab_live_timeout_style_guard_cs21a190.js','BASE_STYLE_HREF'],
  ['src/english_lab_live_timeout_style_guard_cs21a190.js','CLASSIC_STYLE_HREF'],
  ['apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs','timeout_clears_first_reveal:true'],
  ['apps_script_patches/99L_FIX_MEMORY_MATCH_TIMEOUT_CLEANUP_QA_CS21A190.gs','stale_snapshot_sanitized:true'],
  ['apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs','99L TIMEOUT CLEANUP'],
];
for(const [relative,marker] of checks){
  const text=fs.readFileSync(path.join(target,relative),'utf8');
  if(!text.includes(marker)) throw new Error(`${relative} no contiene ${marker}`);
}
const versionCheck=fs.readFileSync(versionPath,'utf8');
for(const marker of lines){if(!versionCheck.includes(marker))throw new Error(`VERSION.txt no contiene ${marker}`);}

console.log(JSON.stringify({
  ok:true,
  target,
  version:'CS21A190',
  timeoutClearsFirstReveal:true,
  staleSnapshotSanitized:true,
  baseStyleGuaranteed:true,
  classicStyleGuaranteed:true,
  cacheEpoch:'CS21A190'
},null,2));
