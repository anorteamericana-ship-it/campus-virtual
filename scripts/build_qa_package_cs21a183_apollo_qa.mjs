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

function build() {
  const base = spawnSync(process.execPath, ['scripts/build_qa_package_cs21a183_curriculum.mjs'], {
    cwd:root,
    stdio:'inherit',
    env:process.env,
  });
  assert.equal(base.status, 0, 'No se pudo construir el paquete curricular CS21A183.');
  assert.equal(fs.existsSync(target), true, 'Falta el paquete base CS21A183.');

  const source = path.join(root, 'apps_script_patches', '99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs');
  const destination = path.join(target, 'BACKEND_QA', '99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs');
  assert.equal(fs.existsSync(source), true, 'Falta 99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs');
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.copyFileSync(source, destination);

  appendOnce('LEEME_PRIMERO_CS21A183.txt', 'HOTFIX APOLLO QA VALIDADO', `HOTFIX APOLLO QA VALIDADO\n--------------------------\n18. Después de 99 y 99B, pegue también BACKEND_QA/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs al final del MISMO archivo 99_CS21A183_SENTENCE_ORDER_COMPLETO.\n19. 99C obliga a leer CONFIG_UNIDADES y ACADEMIA_PLAY_BANK desde QA_STAGING_MASTER_ID y falla cerrado si no coincide con SHEET_ID.\n20. El verificador final debe reportar curriculum_source=QA_STAGING_MASTER_ID y curriculum_source_fix=CS21A183-APOLLO-QA-FIX.\n21. Esta composición 99 + 99B + 99C es la misma validada manualmente en Apps Script QA el 2026-08-06.`);

  appendOnce('VERSION.txt', 'APOLLO_QA_SOURCE_FIX=', `APOLLO_QA_SOURCE_FIX=CS21A183-APOLLO-QA-FIX\nCURRICULUM_SOURCE=QA_STAGING_MASTER_ID\nAPPS_SCRIPT_INSTALL_MODE=SINGLE_FILE_99_THEN_99B_THEN_99C_AFTER_98\nAPPS_SCRIPT_QA_VERIFIER=PASS_2026-08-06`);

  writeManifest();
}

function verify() {
  for (const relative of [
    'BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs',
    'BACKEND_QA/99B_VALIDACION_CURRICULAR_CS21A183.gs',
    'BACKEND_QA/99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs',
    'LEEME_PRIMERO_CS21A183.txt',
    'VERSION.txt',
    'SHA256SUMS.txt',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);

  const fix = fs.readFileSync(path.join(target, 'BACKEND_QA', '99C_FIX_FUENTE_APOLLO_QA_CS21A183.gs'), 'utf8');
  const readme = fs.readFileSync(path.join(target, 'LEEME_PRIMERO_CS21A183.txt'), 'utf8');
  const version = fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8');

  assert.match(fix, /CS21A183-APOLLO-QA-FIX/);
  assert.match(fix, /getProperty\('QA_STAGING_MASTER_ID'\)/);
  assert.match(fix, /SpreadsheetApp\.openById\(masterId\)/);
  assert.match(fix, /_elso183ApolloRows_\('CONFIG_UNIDADES'\)/);
  assert.match(fix, /_elso183ApolloRows_\('ACADEMIA_PLAY_BANK'\)/);
  assert.match(fix, /curriculum_source:'QA_STAGING_MASTER_ID'/);
  assert.match(readme, /99 \+ 99B \+ 99C/);
  assert.match(version, /APOLLO_QA_SOURCE_FIX=CS21A183-APOLLO-QA-FIX/);
  assert.match(version, /CURRICULUM_SOURCE=QA_STAGING_MASTER_ID/);
  assert.match(version, /SINGLE_FILE_99_THEN_99B_THEN_99C_AFTER_98/);
  assert.match(version, /APPS_SCRIPT_QA_VERIFIER=PASS_2026-08-06/);

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
    appsScriptQaVerifier:'PASS_2026-08-06',
    appsScriptComposition:'99+99B+99C',
    curriculumSource:'QA_STAGING_MASTER_ID',
    apolloQaSourceFix:'CS21A183-APOLLO-QA-FIX',
    authenticatedFrontendQa:'PENDING',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
