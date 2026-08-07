#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const guardFile = 'src/english_lab_live_student_dependency_guard_cs21a184.js';
const campusFile = 'campus.html';
const accessFile = 'src/english_lab_free_access_cs21a66.js';

for (const file of [guardFile, campusFile, accessFile]) {
  assert.equal(fs.existsSync(file), true, `Falta ${file}`);
}

const guard = fs.readFileSync(guardFile, 'utf8');
const campus = fs.readFileSync(campusFile, 'utf8');
const access = fs.readFileSync(accessFile, 'utf8');

const requiredPrerequisites = [
  'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
  'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
  'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A178',
  'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A178',
];

for (const source of requiredPrerequisites) {
  assert.match(guard, new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `La guardia no exige ${source}`);
}
assert.match(guard, /F98\.4-Z6-CS21A184/);
assert.match(guard, /EnglishLabMemoryMatchLiveCS21A174/);
assert.match(guard, /MemoryMatchLiveRoundCS21A174/);
assert.match(access, /anLazyCampus\.loadOne\(LIVE_FILE\)/,
  'La entrada #academia_play cambió de contrato y la guardia debe revisarse.');

const lazyIndex = campus.indexOf('src/lazy_loader.jsx');
const guardIndex = campus.indexOf('src/english_lab_live_student_dependency_guard_cs21a184.js');
const appIndex = campus.indexOf('src/app.jsx');
assert.ok(lazyIndex >= 0 && guardIndex > lazyIndex && appIndex > guardIndex,
  'La guardia debe cargarse después del lazy loader y antes de app.jsx.');

const calls = [];
const window = {
  anLazyCampus: {
    loadMany: async files => {
      calls.push(...files.map(file => `many:${file}`));
      window.EnglishLabMemoryMatchLiveCS21A174 = { VERSION:'CS21A177' };
      window.MemoryMatchLiveRoundCS21A174 = function MemoryMatchLiveRoundCS21A174() {};
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
  calls.slice(0, requiredPrerequisites.length),
  requiredPrerequisites.map(file => `many:${file}`),
  'Las dependencias Memory Match no se cargaron antes del Live estudiante.'
);
assert.equal(calls[requiredPrerequisites.length], 'one:src/english_lab_live.jsx?v=F98.4Z6CS20H');
assert.equal(typeof window.MemoryMatchLiveRoundCS21A174, 'function');
assert.ok(window.EnglishLabMemoryMatchLiveCS21A174);

const beforePlain = calls.length;
await window.anLazyCampus.loadOne('src/otro_modulo.js?v=1');
assert.equal(calls.length, beforePlain + 1, 'La guardia no debe cargar prerequisitos para módulos ajenos.');
assert.equal(calls.at(-1), 'one:src/otro_modulo.js?v=1');

console.log(JSON.stringify({
  ok:true,
  contract:'CS21A184_STUDENT_LIVE_DEPENDENCIES',
  historical_entry:'#academia_play -> anLazyCampus.loadOne(english_lab_live.jsx)',
  prerequisites:requiredPrerequisites,
  memory_match_adapter_required:true,
  campus_order:'lazy_loader -> dependency_guard -> app',
}, null, 2));
