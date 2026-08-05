#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';

const adapter = fs.readFileSync('src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx', 'utf8');
const guard = fs.readFileSync('src/english_lab_games/english_lab_live_sync_guard_cs21a177.js', 'utf8');

assert.match(adapter, /const VERSION = 'CS21A177'/);
assert.match(adapter, /roomGameId\(room\) === GAME_ID/);
assert.match(adapter, /roomGameLabel\(room\) === GAME_LABEL/);
assert.match(adapter, /memory_match === true/);
assert.match(adapter, /EnglishLabLiveSyncCS21A177/);
assert.doesNotMatch(adapter, /SpreadsheetApp|PropertiesService|ENGLISH_LAB_GAME_DB_ID/);
assert.doesNotMatch(guard, /SpreadsheetApp|PropertiesService|ENGLISH_LAB_GAME_DB_ID|AKfycb|script\.google\.com\/macros/i);
assert.doesNotMatch(adapter, /GAME_ID\s*=\s*'VOCAB_SPRINT'/);
assert.doesNotMatch(guard, /MEMORY_GAME_ID\s*=\s*'VOCAB_SPRINT'/);

console.log('CS21A174/177 MEMORY MATCH LIVE CONTRACT: APTO');
