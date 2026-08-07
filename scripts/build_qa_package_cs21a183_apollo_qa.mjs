#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const packageName = 'CAMPUS_QA_CS21A183_CANDIDATO_SENTENCE_ORDER_LIVE';
const target = path.join(root, 'dist', packageName);
const verifyOnly = process.argv.includes('--verify');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function packageFiles() {
  const files = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name !== 'SHA256SUMS.txt') files.push(absolute);
    }
  };
  walk(target);
  return files.sort((a,b)=>a.localeCompare(b));
}
function appendOnce(relative, marker, content) {
  const file = path.join(target, relative);
  assert.equal(fs.existsSync(file), true, `Falta ${relative}`);
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(marker)) {
    fs.writeFileSync(file, current.replace(/\s*$/, '') + '\n\n' + content.trim() + '\n', 'utf8');
  }
}
function writeManifest() {
  fs.writeFileSync(path.join(target, 'SHA256SUMS.txt'), packageFiles().map(file =>
    `${sha256(file)}  ./${path.relative(target, file).split(path.sep).join('/')}`
  ).join('\n') + '\n', 'utf8');
}

function normalizeReleaseInstructions() {
  const readmePath = path.join(target, 'LEEME_PRIMERO_CS21A183.txt');
  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = readme.replace(
    /APPS SCRIPT QA\n[\s\S]*?\n\nFRONTEND QA/,
    `APPS SCRIPT QA\n1. Usar únicamente el archivo completo 99_CS21A183_SENTENCE_ORDER_COMPLETO.gs después de 98. No pegar parches manuales.\n2. Su orden interno obligatorio es 99 + 99B + 99C + 99D.\n3. 99C lee CONFIG_UNIDADES y ACADEMIA_PLAY_BANK exclusivamente desde QA_STAGING_MASTER_ID y falla cerrado si no coincide con SHEET_ID.\n4. 99D FIX3 corrige el inicio real de Memory Match sin delegar a wrappers históricos.\n5. 99D FIX3 separa jugadores registrados de conectados usando LAST_SEEN_AT con TTL de 60 segundos.\n6. Para equipos exige al menos dos estudiantes presentes en los últimos 60 segundos.\n7. Antes de desplegar QA ejecutar verificarActualizacionQA() y confirmar 64 unidades/320 ítems; luego verificarMemoryMatchStartFixCS21A183() y confirmar FIX3, direct_start_no_legacy_delegate=true, presence_ttl_seconds=60 y preserves_curriculum_verifier=true.\n8. No usar estos módulos QA en producción.\n\nFRONTEND QA`
  );
  readme = readme.replace(
    /INSTALACIÓN APPS SCRIPT QA (?:VALIDADA|ACTUAL)\n[-]+\n[\s\S]*?(?=\n\nHOTFIX APOLLO QA VALIDADO|$)/,
    `INSTALACIÓN APPS SCRIPT QA ACTUAL\n-----------------------------------\n- Archivo único: 99_CS21A183_SENTENCE_ORDER_COMPLETO.gs.\n- Reemplazar todo el contenido; no agregar bloques debajo.\n- Orden interno: 99 + 99B + 99C + 99D FIX3.\n- Fuente curricular: QA_STAGING_MASTER_ID.\n- Presencia Memory Match: LAST_SEEN_AT, TTL 60 s.\n- Inicio Memory Match: directo, sin delegado histórico.\n- Ejecutar primero verificarActualizacionQA() y luego verificarMemoryMatchStartFixCS21A183().\n- No usar estos módulos QA en producción.`
  );
  readme = readme.replace(/\n\nHOTFIX APOLLO QA VALIDADO\n[-]+\n[\s\S]*$/, '');
  fs.writeFileSync(readmePath, readme.replace(/\s*$/, '') + '\n', 'utf8');

  const versionPath = path.join(target, 'VERSION.txt');
  let version = fs.readFileSync(versionPath, 'utf8');
  version = version
    .replace('APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_AFTER_98', 'APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_THEN_99D_AFTER_98')
    .replace('APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_AFTER_98', 'APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_THEN_99D_AFTER_98')
    .replace('CURRICULUM_QA_STATUS=PENDING', 'CURRICULUM_QA_STATUS=PASS_2026-08-06');
  fs.writeFileSync(versionPath, version.replace(/\s*$/, '') + '\n', 'utf8');
}

function build() {
  const base = spawnSync(process.execPath, ['scripts/build_qa_package_cs21a183_curriculum.mjs'], {
    cwd:root,
    stdio:'inherit',
    env:process.env,
  });
  assert.equal(base.status, 0, 'No se pudo construir el paquete curricular CS21A183.');
  assert.equal(fs.existsSync(target), true, 'Falta el paquete base CS21A183.');

  for (const name of [
    '99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs',
    '99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs',
  ]) {
    const source = path.join(root, 'apps_script_patches', name);
    const destination = path.join(target, 'BACKEND_QA', name);
    assert.equal(fs.existsSync(source), true, `Falta ${name}`);
    fs.mkdirSync(path.dirname(destination), {recursive:true});
    fs.copyFileSync(source, destination);
  }

  normalizeReleaseInstructions();

  appendOnce('VERSION.txt', 'APOLLO_QA_SOURCE_FIX=', `APOLLO_QA_SOURCE_FIX=CS21A183-APOLLO-QA-FIX\nCURRICULUM_SOURCE=QA_STAGING_MASTER_ID\nAPPS_SCRIPT_QA_VERIFIER=PASS_2026-08-06`);
  appendOnce('VERSION.txt', 'MEMORY_MATCH_START_FIX=', `MEMORY_MATCH_START_FIX=CS21A183-MM-START-FIX3\nMEMORY_MATCH_START_QA=SEPARATE_VERIFIER\nMEMORY_MATCH_START_VERIFIER=verificarMemoryMatchStartFixCS21A183\nMEMORY_MATCH_DIRECT_START=true\nMEMORY_MATCH_PRESENCE_TTL_SECONDS=60`);

  writeManifest();
}

function verify() {
  for (const relative of [
    'BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs',
    'BACKEND_QA/99B_VALIDACION_CURRICULAR_CS21A183.gs',
    'BACKEND_QA/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs',
    'BACKEND_QA/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs',
    'LEEME_PRIMERO_CS21A183.txt',
    'VERSION.txt',
    'SHA256SUMS.txt',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);

  const fix = fs.readFileSync(path.join(target, 'BACKEND_QA', '99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs'), 'utf8');
  const startFix = fs.readFileSync(path.join(target, 'BACKEND_QA', '99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs'), 'utf8');
  const readme = fs.readFileSync(path.join(target, 'LEEME_PRIMERO_CS21A183.txt'), 'utf8');
  const version = fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8');

  assert.match(fix, /CS21A183-APOLLO-QA-FIX/);
  assert.match(fix, /getProperty\('QA_STAGING_MASTER_ID'\)/);
  assert.match(fix, /SpreadsheetApp\.openById\(masterId\)/);
  assert.match(fix, /_elso183ApolloRows_\('CONFIG_UNIDADES'\)/);
  assert.match(fix, /_elso183ApolloRows_\('ACADEMIA_PLAY_BANK'\)/);
  assert.match(fix, /curriculum_source:'QA_STAGING_MASTER_ID'/);

  assert.match(startFix, /CS21A183-MM-START-FIX3/);
  assert.match(startFix, /room && room\.SETTINGS_JSON/);
  assert.match(startFix, /englishLabMemoryMatchStartRoomCS21A176 = function \(body\)/);
  assert.match(startFix, /getProperty\('QA_STAGING_OPERATIVO_ID'\)/);
  assert.match(startFix, /memory_match_start_fix3_error/);
  assert.match(startFix, /CS21A183_MM_PRESENCE_TTL_MS = 60000/);
  assert.match(startFix, /players_online/);
  assert.match(startFix, /players_registered/);
  assert.match(startFix, /direct_start_no_legacy_delegate:true/);
  assert.doesNotMatch(startFix, /_cs21a183MmStartBase_/);
  assert.match(startFix, /function verificarMemoryMatchStartFixCS21A183\(\)/);
  assert.doesNotMatch(startFix, /verificarActualizacionQA\s*=\s*function/);
  assert.match(startFix, /preserves_curriculum_verifier:true/);

  assert.match(readme, /99 \+ 99B \+ 99C \+ 99D FIX3/i);
  assert.match(readme, /TTL de 60 segundos/i);
  assert.match(readme, /verificarMemoryMatchStartFixCS21A183/);
  assert.doesNotMatch(readme, /Cree un archivo nuevo: 99_ACTUALIZACION_QA_CS21A183/i);
  assert.match(version, /APOLLO_QA_SOURCE_FIX=CS21A183-APOLLO-QA-FIX/);
  assert.match(version, /CURRICULUM_SOURCE=QA_STAGING_MASTER_ID/);
  assert.match(version, /APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_THEN_99D_AFTER_98/);
  assert.doesNotMatch(version, /APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_AFTER_98\s*$/m);
  assert.match(version, /CURRICULUM_QA_STATUS=PASS_2026-08-06/);
  assert.match(version, /APPS_SCRIPT_QA_VERIFIER=PASS_2026-08-06/);
  assert.match(version, /MEMORY_MATCH_START_FIX=CS21A183-MM-START-FIX3/);
  assert.match(version, /MEMORY_MATCH_START_QA=SEPARATE_VERIFIER/);
  assert.match(version, /MEMORY_MATCH_START_VERIFIER=verificarMemoryMatchStartFixCS21A183/);
  assert.match(version, /MEMORY_MATCH_DIRECT_START=true/);
  assert.match(version, /MEMORY_MATCH_PRESENCE_TTL_SECONDS=60/);

  const manifest = new Map();
  for (const line of fs.readFileSync(path.join(target, 'SHA256SUMS.txt'), 'utf8').trim().split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{64})  \.\/(.+)$/);
    assert.ok(match, `Línea SHA inválida: ${line}`);
    manifest.set(match[2], match[1]);
  }
  const files = packageFiles();
  assert.equal(manifest.size, files.length, 'El manifiesto debe cubrir cada archivo exactamente una vez.');
  for (const file of files) {
    const relative = path.relative(target, file).split(path.sep).join('/');
    assert.equal(manifest.get(relative), sha256(file), `Hash inválido: ${relative}`);
  }

  console.log(JSON.stringify({
    verdict:'APTO_CON_RESERVAS',
    package:packageName,
    appsScriptQaVerifier:'CURRICULUM_AND_99D_SEPARATE',
    appsScriptComposition:'99+99B+99C+99D',
    curriculumSource:'QA_STAGING_MASTER_ID',
    apolloQaSourceFix:'CS21A183-APOLLO-QA-FIX',
    memoryMatchStartFix:'CS21A183-MM-START-FIX3',
    memoryMatchStartVerifier:'verificarMemoryMatchStartFixCS21A183',
    directStart:true,
    presenceTtlSeconds:60,
    authenticatedFrontendQa:'IN_PROGRESS',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
