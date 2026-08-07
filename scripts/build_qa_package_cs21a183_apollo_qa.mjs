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
    `APPS SCRIPT QA\n1. El backend QA base fue validado y desplegado el 2026-08-06.\n2. Durante QA autenticada se detectó un defecto real al iniciar Memory Match y se añadió 99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs.\n3. La composición QA actual es un único archivo 99_CS21A183_SENTENCE_ORDER_COMPLETO después de 98, con orden interno obligatorio: 99 + 99B + 99C + 99D.\n4. 99C lee CONFIG_UNIDADES y ACADEMIA_PLAY_BANK exclusivamente desde QA_STAGING_MASTER_ID y falla cerrado si no coincide con SHEET_ID.\n5. 99D blinda SETTINGS_JSON en salas CREATED y solo se habilita cuando QA_STAGING_MASTER_ID y QA_STAGING_OPERATIVO_ID demuestran QA/STAGING.\n6. Antes de continuar la QA autenticada se debe ejecutar verificarActualizacionQA() y confirmar memory_match_start_guard=true.\n7. No usar estos módulos QA en producción.\n\nFRONTEND QA`
  );
  readme = readme.replace(
    /INSTALACIÓN APPS SCRIPT QA VALIDADA\n[-]+\n[\s\S]*?(?=\n\nHOTFIX APOLLO QA VALIDADO|$)/,
    `INSTALACIÓN APPS SCRIPT QA ACTUAL\n-----------------------------------\n- Archivo Apps Script: 99_CS21A183_SENTENCE_ORDER_COMPLETO.\n- Orden interno: BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs + BACKEND_QA/99B_VALIDACION_CURRICULAR_CS21A183.gs + BACKEND_QA/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs + BACKEND_QA/99D_FIX_MEMORY_MATCH_START_QA_CS21A183.gs.\n- Ubicación: después de 98_ACTUALIZACION_QA_CS21A181.\n- Fuente curricular: QA_STAGING_MASTER_ID.\n- 99D es exclusivo QA y falla cerrado fuera de QA/STAGING.\n- Ejecutar verificarActualizacionQA() después de añadir 99D.\n- No usar estos módulos QA en producción.`
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
  appendOnce('VERSION.txt', 'MEMORY_MATCH_START_FIX=', `MEMORY_MATCH_START_FIX=CS21A183-MM-START-FIX\nMEMORY_MATCH_START_QA=REQUIRES_VERIFIER_AFTER_99D`);

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

  assert.match(startFix, /CS21A183-MM-START-FIX/);
  assert.match(startFix, /var raw = room && room\.SETTINGS_JSON/);
  assert.match(startFix, /englishLabMemoryMatchStartRoomCS21A176 = function\(body\)/);
  assert.match(startFix, /getProperty\('QA_STAGING_OPERATIVO_ID'\)/);
  assert.match(startFix, /memory_match_start_guard_error/);

  assert.match(readme, /99 \+ 99B \+ 99C \+ 99D/i);
  assert.match(readme, /memory_match_start_guard=true/i);
  assert.doesNotMatch(readme, /Cree un archivo nuevo: 99_ACTUALIZACION_QA_CS21A183/i);
  assert.match(version, /APOLLO_QA_SOURCE_FIX=CS21A183-APOLLO-QA-FIX/);
  assert.match(version, /CURRICULUM_SOURCE=QA_STAGING_MASTER_ID/);
  assert.match(version, /APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_THEN_99D_AFTER_98/);
  assert.doesNotMatch(version, /APPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_AFTER_98\s*$/m);
  assert.match(version, /CURRICULUM_QA_STATUS=PASS_2026-08-06/);
  assert.match(version, /APPS_SCRIPT_QA_VERIFIER=PASS_2026-08-06/);
  assert.match(version, /MEMORY_MATCH_START_FIX=CS21A183-MM-START-FIX/);
  assert.match(version, /MEMORY_MATCH_START_QA=REQUIRES_VERIFIER_AFTER_99D/);

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
    appsScriptQaVerifier:'REQUIRES_99D_VERIFIER',
    appsScriptComposition:'99+99B+99C+99D',
    curriculumSource:'QA_STAGING_MASTER_ID',
    apolloQaSourceFix:'CS21A183-APOLLO-QA-FIX',
    memoryMatchStartFix:'CS21A183-MM-START-FIX',
    authenticatedFrontendQa:'IN_PROGRESS',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
