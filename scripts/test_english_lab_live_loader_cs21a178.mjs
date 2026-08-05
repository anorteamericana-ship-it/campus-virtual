#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/app.jsx', 'utf8');
const live = fs.readFileSync('src/english_lab_live.jsx', 'utf8');

const block = app.match(/english_lab_live:\s*\[([\s\S]*?)\n\s*\],/);
assert.ok(block, 'No se encontró la lista diferida de English LAB Live.');

const files = [...block[1].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
const guardIndex = files.findIndex(file => file.includes('english_lab_live_sync_guard_cs21a177.js'));
const adapterIndex = files.findIndex(file => file.includes('english_lab_live_memory_match_adapter_cs21a174.jsx'));
const viewIndex = files.findIndex(file => file.includes('src/english_lab_live.jsx'));

assert.ok(guardIndex >= 0, 'El guard de sincronización debe estar en la carga diferida canónica.');
assert.ok(adapterIndex > guardIndex, 'El adaptador debe cargar después del guard.');
assert.ok(viewIndex > adapterIndex, 'La vista debe cargar después del guard y del adaptador.');
assert.match(files[guardIndex], /[?&]v=CS21A178(?:$|&)/);
assert.match(files[adapterIndex], /[?&]v=CS21A178(?:$|&)/);
assert.match(files[viewIndex], /[?&]v=F98\.4Z6CS21A178(?:$|&)/);
assert.match(live, /const VERSION = 'F98\.4-Z6-CS21A178'/);
assert.match(live, /Boolean\(myRank \|\| leaderboard\.length \|\| teamLeaderboard\.length\)/);

console.log(JSON.stringify({
  verdict: 'APTO',
  order: files,
  guardBeforeAdapter: true,
  guardBeforeStudentView: true,
  cacheVersion: 'CS21A178',
}, null, 2));
