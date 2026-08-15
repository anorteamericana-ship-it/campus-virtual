#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { validateEnglishLabCanonicalManifestCS21A193 } from './f96_lazy_map_parser_cs21a193.mjs';

const guardFile = 'src/english_lab_live_student_dependency_guard_cs21a184.js';
const canonicalFile = 'src/english_lab_live_canonical_loader_cs21a193.js';
const campusFile = 'campus.html';
const accessFile = 'src/english_lab_free_access_cs21a66.js';

for (const file of [guardFile, canonicalFile, campusFile, accessFile]) {
  assert.equal(fs.existsSync(file), true, `Falta ${file}`);
}

const guard = fs.readFileSync(guardFile, 'utf8');
const canonical = fs.readFileSync(canonicalFile, 'utf8');
const campus = fs.readFileSync(campusFile, 'utf8');
const access = fs.readFileSync(accessFile, 'utf8');

const fallbackPrerequisites = [
  'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
  'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
  'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A178',
  'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A178',
  'src/english_lab_games/english_lab_game_registry_cs21a191.js?v=CS21A191',
  'src/english_lab_games/hangman_engine_cs21a191.js?v=CS21A191',
  'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx?v=CS21A191',
];

for (const source of fallbackPrerequisites) {
  assert.match(guard, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `La guardia no exige ${source}`);
}
assert.match(guard, /F98\.4-Z6-CS21A184/);
assert.match(guard, /EnglishLabMemoryMatchLiveCS21A174/);
assert.match(guard, /MemoryMatchLiveRoundCS21A174/);
assert.match(access, /EnglishLabLiveCanonicalLoaderCS21A193/,
  'La entrada #academia_play debe usar el loader canónico CS21A193.');
assert.match(access, /loadStudent\(\)/,
  'La entrada #academia_play debe solicitar la vista estudiante al API canónico.');
assert.doesNotMatch(access, /anLazyCampus\.loadOne\(LIVE_FILE\)/,
  'La entrada #academia_play no debe volver al archivo live histórico.');
const manifestBlock = canonical.match(/const\s+MANIFEST\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(manifestBlock, 'No se encontró el manifiesto canónico de English LAB.');
const canonicalManifest = Function(`"use strict";return (${manifestBlock[1]});`)();
validateEnglishLabCanonicalManifestCS21A193(canonicalManifest);

const lazyIndex = campus.indexOf('src/lazy_loader.jsx');
const canonicalIndex = campus.indexOf(canonicalFile);
const guardIndex = campus.indexOf('src/english_lab_live_student_dependency_guard_cs21a184.js');
const appIndex = campus.indexOf('src/app.jsx');
assert.ok(lazyIndex >= 0 && canonicalIndex > lazyIndex && guardIndex > canonicalIndex && appIndex > guardIndex,
  'El orden debe ser lazy loader -> canonical CS21A193 -> guardia estudiante -> app.jsx.');

const calls = [];
const window = {
  anLazyCampus: {
    loadMany: async files => {
      calls.push(...files.map(file => `many:${file}`));
      window.EnglishLabMemoryMatchLiveCS21A174 = { VERSION:'CS21A177' };
      window.MemoryMatchLiveRoundCS21A174 = function MemoryMatchLiveRoundCS21A174() {};
      window.EnglishLabGameRegistryCS21A191 = {};
      window.EnglishLabHangmanEngineCS21A191 = {};
      window.EnglishLabHangmanCS21A191 = { install:() => true };
    },
    loadOne: async src => {
      calls.push(`one:${src}`);
      if (/english_lab_live\.jsx/.test(src)) {
        window.EnglishLabLiveStudentView = function EnglishLabLiveStudentView() {};
      }
      return src;
    },
  },
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: () => 1,
  addEventListener: () => {},
};

vm.runInNewContext(guard, { window, console }, { filename:guardFile });
assert.ok(window.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__, 'La guardia no publicó su contrato.');
assert.equal(window.anLazyCampus.loadOne.__cs21a184StudentDependencies, true,
  'loadOne no quedó protegido para la entrada estudiante.');

await window.anLazyCampus.loadOne('src/english_lab_live.jsx?v=F98.4Z6CS20H');
assert.deepEqual(
  calls.slice(0, fallbackPrerequisites.length),
  fallbackPrerequisites.map(file => `many:${file}`),
  'Las dependencias Memory Match no se cargaron antes del Live estudiante.'
);
assert.equal(calls[fallbackPrerequisites.length], 'one:src/english_lab_live.jsx?v=F98.4Z6CS20H');
assert.equal(typeof window.MemoryMatchLiveRoundCS21A174, 'function');
assert.ok(window.EnglishLabMemoryMatchLiveCS21A174);

const beforePlain = calls.length;
await window.anLazyCampus.loadOne('src/otro_modulo.js?v=1');
assert.equal(calls.length, beforePlain + 1, 'La guardia no debe cargar prerequisitos para módulos ajenos.');
assert.equal(calls.at(-1), 'one:src/otro_modulo.js?v=1');

let canonicalInstallCalls = 0;
const rawLoadOne = async src => src;
const rawLoadMany = async files => files;
const canonicalWindow = {
  anLazyCampus:{loadOne:rawLoadOne,loadMany:rawLoadMany},
  EnglishLabLiveCanonicalLoaderCS21A193:{install:()=>{canonicalInstallCalls+=1;return true;}},
  localStorage:{getItem:()=>'',removeItem:()=>{},setItem:()=>{}},
  fetch:async()=>({clone:()=>({json:async()=>({})})}),
  document:{addEventListener:()=>{}},
  setInterval:()=>1,
  clearInterval:()=>{},
  setTimeout:()=>1,
};
vm.runInNewContext(guard, {window:canonicalWindow,console,URL,Date}, {filename:guardFile});
assert.ok(canonicalInstallCalls>=1, 'La guardia debe delegar al loader canónico cuando está presente.');
assert.equal(canonicalWindow.anLazyCampus.loadOne,rawLoadOne,'La guardia no debe reenvolver loadOne bajo CS21A193.');
assert.equal(canonicalWindow.anLazyCampus.loadMany,rawLoadMany,'La guardia no debe reenvolver loadMany bajo CS21A193.');

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A193_CANONICAL_STUDENT_LIVE_DEPENDENCIES',
  canonical_entry:'#academia_play -> EnglishLabLiveCanonicalLoaderCS21A193.loadStudent()',
  fallback_prerequisites:fallbackPrerequisites,
  canonical_manifest:canonicalManifest,
  canonical_guard_delegation:true,
  memory_match_adapter_required:true,
  campus_order:'lazy_loader -> canonical_loader -> dependency_guard -> app',
}, null, 2));
