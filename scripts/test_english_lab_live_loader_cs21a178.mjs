#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/app.jsx', 'utf8');
const live = fs.readFileSync('src/english_lab_live.jsx', 'utf8');
const canonical = fs.readFileSync('src/english_lab_live_canonical_loader_cs21a193.js', 'utf8');
const lazy = fs.readFileSync('src/lazy_loader.jsx', 'utf8');

assert.match(app,/english_lab_live:\s*F96_ENGLISH_LAB_LIVE_CS21A193/,
  'F96 debe consumir la fuente canónica CS21A193.');
const block = canonical.match(/const\s+MANIFEST\s*=\s*Object\.freeze\((\[[\s\S]*?\])\);/);
assert.ok(block, 'No se encontró el manifiesto canónico de English LAB Live.');

const files = [...block[1].matchAll(/['"]([^'"]+)['"]/g)].map(match => match[1]);
assert.equal(files.length,12,'El manifiesto CS21A193 debe contener 12 archivos.');
const guardIndex = files.findIndex(file => file.includes('english_lab_live_sync_guard_cs21a177.js'));
const adapterIndex = files.findIndex(file => file.includes('english_lab_live_memory_match_adapter_cs21a174.jsx'));
const classicIndex = files.findIndex(file => file.includes('english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx'));
const authoritativeIndex = files.findIndex(file => file.includes('english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx'));
const viewIndex = files.findIndex(file => file.includes('src/english_lab_live.jsx'));

assert.ok(guardIndex >= 0, 'El guard de sincronización debe estar en la carga diferida canónica.');
assert.ok(adapterIndex > guardIndex, 'El adaptador debe cargar después del guard.');
assert.ok(classicIndex > adapterIndex, 'El adaptador clásico debe cargar después del base.');
assert.ok(authoritativeIndex > classicIndex, 'CS21A192 debe quedar después del adaptador clásico.');
assert.equal(viewIndex,files.length-1,'La vista debe ser la última entrada del manifiesto.');
assert.ok(files.every(file=>new URL(file,'https://qa.invalid/').searchParams.get('v')==='CS21A193'),
  'Todas las dependencias deben compartir el epoch CS21A193.');
assert.match(lazy,/const\s+activeLoadMany\s*=\s*window\.anLazyCampus/,
  'resolveRoute debe consultar el owner loadMany instalado en tiempo de ejecución.');
assert.match(lazy,/await\s+activeLoadMany\(list\)/,
  'resolveRoute no debe saltarse el owner canónico CS21A193.');
assert.match(lazy,/window\.anLazyCampus\s*=\s*\{[^}]+\};\s*try\s*\{[\s\S]*EnglishLabLiveCanonicalLoaderCS21A193[\s\S]*canonical\.install\(\)/,
  'lazy_loader must synchronously install the canonical owner when it is published.');
assert.match(live, /const VERSION = 'F98\.4-Z6-CS21A180'/);
assert.match(live, /Boolean\(myRank \|\| leaderboard\.length \|\| teamLeaderboard\.length\)/);

console.log(JSON.stringify({
  verdict: 'PASS_CANONICAL_LOADER_CS21A193',
  order: files,
  guardBeforeAdapter: true,
  authoritativeAdapterLast: true,
  viewLast: true,
  dynamicLoadManyOwner: true,
  synchronousCanonicalHandoff: true,
  cacheVersion: 'CS21A193',
}, null, 2));
