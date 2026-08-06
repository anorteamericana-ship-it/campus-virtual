#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('apps_script_patches/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs', 'utf8');

assert.match(source, /ELSO183_APOLLO_SOURCE_FIX_VERSION\s*=\s*'CS21A183-APOLLO-QA-FIX'/);
assert.match(source, /getProperty\('QA_STAGING_MASTER_ID'\)/);
assert.match(source, /Falta la propiedad QA_STAGING_MASTER_ID/);
assert.match(source, /QA_STAGING_MASTER_ID no coincide con SHEET_ID del staging/);
assert.match(source, /SpreadsheetApp\.openById\(masterId\)\.getSheetByName\(sheetName\)/);
assert.match(source, /_elso183ApolloRows_\('CONFIG_UNIDADES'\)/);
assert.match(source, /_elso183ApolloRows_\('ACADEMIA_PLAY_BANK'\)/);
assert.match(source, /_elso183CurriculumUnits_\s*=\s*function/);
assert.match(source, /_elso183CurriculumSourceRows_\s*=\s*function/);
assert.match(source, /curriculum_units:units\.length/);
assert.match(source, /active_gram_02_items:rows\.length/);
assert.match(source, /five_items_per_unit:exactFive/);
assert.match(source, /curriculum_source:'QA_STAGING_MASTER_ID'/);
assert.match(source, /curriculum_source_fix:ELSO183_APOLLO_SOURCE_FIX_VERSION/);
assert.doesNotMatch(source, /ENGLISH_LAB_GAME_DB_ID[^\n]*CONFIG_UNIDADES/);

console.log(JSON.stringify({
  ok: true,
  version: 'CS21A183-APOLLO-QA-FIX',
  source: 'QA_STAGING_MASTER_ID',
  failClosed: true,
  curriculumSheets: ['CONFIG_UNIDADES', 'ACADEMIA_PLAY_BANK'],
}, null, 2));
