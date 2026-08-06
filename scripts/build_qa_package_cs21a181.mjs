#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const baseName = 'CAMPUS_QA_CS21A180_CANDIDATO_ENGLISH_LAB_ESTADO_RAPIDO';
const packageName = 'CAMPUS_QA_CS21A181_CANDIDATO_ENGLISH_LAB_UX_PAREJAS_EDITABLES';
const baseTarget = path.join(root, 'dist', baseName);
const target = path.join(root, 'dist', packageName);
const verifyOnly = process.argv.includes('--verify');
const sourceHeadSha = process.env.SOURCE_HEAD_SHA || process.env.GITHUB_SHA || 'local-uncommitted';
const testMergeSha = process.env.TEST_MERGE_SHA || process.env.GITHUB_SHA || 'local';
const sourceBranch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || 'fix/cs21a181-english-lab-ux-words';

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}
function write(relative, content) {
  const file = path.join(target, relative);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, content, 'utf8');
}
function copy(source, relative) {
  assert.equal(fs.existsSync(source), true, `Falta ${source}`);
  const destination = path.join(target, relative);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.copyFileSync(source, destination);
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
  return files.sort((a, b) => a.localeCompare(b));
}
function removeIfExists(relative) {
  fs.rmSync(path.join(target, relative), {recursive:true, force:true});
}

function build() {
  const baseBuild = spawnSync(process.execPath, ['scripts/build_qa_package_cs21a180.mjs'], {
    cwd:root,
    stdio:'inherit',
    env:process.env,
  });
  assert.equal(baseBuild.status, 0, 'No se pudo construir la base CS21A180.');
  assert.equal(fs.existsSync(baseTarget), true, 'Falta el paquete base CS21A180.');

  fs.rmSync(target, {recursive:true, force:true});
  fs.cpSync(baseTarget, target, {recursive:true});

  removeIfExists('LEEME_PRIMERO_CS21A180.txt');
  removeIfExists('ESTADO_VALIDACION_CS21A180.txt');
  removeIfExists('REGISTRO_PRUEBA_AUTENTICADA_CS21A180.txt');
  removeIfExists('VERSION.txt');
  removeIfExists('SHA256SUMS.txt');

  const oldLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A180.cmd');
  const newLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A181.cmd');
  assert.equal(fs.existsSync(oldLauncher), true, 'Falta launcher CS21A180.');
  const launcher = fs.readFileSync(oldLauncher, 'utf8')
    .replaceAll('127.0.0.1:4178', '127.0.0.1:4179')
    .replaceAll('PORT=4178', 'PORT=4179');
  fs.writeFileSync(newLauncher, launcher, 'utf8');
  fs.rmSync(oldLauncher);

  const serverPath = path.join(target, 'serve.mjs');
  fs.writeFileSync(serverPath, fs.readFileSync(serverPath, 'utf8')
    .replace("process.env.PORT || 4178", "process.env.PORT || 4179")
    .replace("process.env.PORT || '4178'", "process.env.PORT || '4179'"), 'utf8');

  copy(path.join(root, 'src', 'runtime_config.js'), 'src/runtime_config.js');
  copy(path.join(root, 'src', 'english_lab_ux_cs21a181.js'), 'src/english_lab_ux_cs21a181.js');
  copy(path.join(root, 'apps_script_patches', '98_ACTUALIZACION_QA_CS21A181.gs'), 'BACKEND_QA/98_ACTUALIZACION_QA_CS21A181.gs');
  copy(path.join(root, '00_DOCUMENTACION', 'ENGLISH_LAB_UX_CS21A181.md'), 'INFORME_CAMBIOS_CS21A181.md');

  write('LEEME_PRIMERO_CS21A181.txt', `CAMPUS QA CS21A181 - ENGLISH LAB UX Y PAREJAS EDITABLES
=========================================================

ESTADO REAL
- Candidato QA apilado sobre CS21A180.
- No modifica main ni produccion.
- Mantiene intacto el motor de turnos y sincronizacion CS21A180.
- Agrega un indicador visual unico para esperas de English LAB.
- Elimina el rotulo Acceso financiero dentro de English LAB.
- Permite revisar y editar parejas antes de iniciar Memory Match.

APPS SCRIPT QA
1. Mantenga sin cambios 97_ACTUALIZACION_QA.gs de CS21A180.
2. Cree un archivo nuevo: 98_ACTUALIZACION_QA_CS21A181.gs.
3. Copie BACKEND_QA/98_ACTUALIZACION_QA_CS21A181.gs completo.
4. Ejecute verificarActualizacionQA().
5. Debe devolver version=CS21A181, previous_version=CS21A180,
   custom_pairs_supported=true y suggested_pairs_editable=true.
6. Actualice el mismo deployment QA. No cambie la URL /exec.

FRONTEND QA
1. Extraiga completamente el ZIP.
2. Ejecute ABRIR_CAMPUS_QA_CS21A181.cmd.
3. Mantenga abierta la ventana negra.
4. Se abrira http://127.0.0.1:4179/qa-setup.html
5. Use la misma URL /exec QA actualizada.

PRUEBA
1. Entre como Profe y cree una sala Memory Match B1, U01, 6 parejas, Individual.
2. Confirme que aparece Palabras sugeridas antes de iniciar.
3. Cambie una linea usando palabra = significado.
4. Confirme que una linea incompleta o una cantidad incorrecta bloquea el inicio.
5. Complete seis parejas e inicie.
6. Entre con Naty y leo.
7. Confirme acceso, spinner/barra durante esperas y ausencia de Acceso financiero.
8. Confirme que la pareja editada aparece en el tablero y que los turnos rotan.

NO FUSIONAR NI PASAR A PRODUCCION SIN PASS AUTENTICADO.
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A181.txt', `REGISTRO DE ACEPTACION QA CS21A181
=====================================

Estado inicial: PENDIENTE
Fecha:
URL /exec QA confirmada: SI / NO
Docente: Profe
Estudiante 1: Naty
Estudiante 2: leo
Codigo de sala nueva:

[ ] verificarActualizacionQA devolvio CS21A181 y ok=true.
[ ] Aparecio Palabras sugeridas antes de iniciar.
[ ] El editor exigio palabra = significado.
[ ] Una lista incompleta impidio iniciar.
[ ] Una pareja modificada aparecio en el tablero.
[ ] Naty ingreso sin bloqueo de cuenta.
[ ] leo ingreso sin bloqueo de cuenta.
[ ] Las esperas largas mostraron spinner y barra.
[ ] No aparecio Acceso financiero.
[ ] Los turnos y la sincronizacion CS21A180 continuaron funcionando.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Captura o evidencia:
`);

  write('VERSION.txt', `VERSION=CS21A181
STATUS=QA_CANDIDATE_NOT_FINAL
BASE_VERSION=CS21A180
PURPOSE=English LAB visual loading and editable Memory Match pairs
FRONTEND_LAYER=F98.4-Z6-CS21A181
BACKEND_LAYER=CS21A181
SOURCE_BRANCH=${sourceBranch}
SOURCE_HEAD_SHA=${sourceHeadSha}
TEST_MERGE_SHA=${testMergeSha}
QA_PORT=4179
APPS_SCRIPT_CHANGE=YES_QA_ONLY_ADD_98_AFTER_97
AUTHENTICATED_QA_STATUS=PENDING
PRODUCTION_TOUCHED=NO
`);

  write('SHA256SUMS.txt', packageFiles().map(file =>
    `${sha256(file)}  ./${path.relative(target, file).split(path.sep).join('/')}`
  ).join('\n') + '\n');
}

function verify() {
  for (const relative of [
    'ABRIR_CAMPUS_QA_CS21A181.cmd',
    'LEEME_PRIMERO_CS21A181.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A181.txt',
    'INFORME_CAMBIOS_CS21A181.md',
    'VERSION.txt',
    'SHA256SUMS.txt',
    'BACKEND_QA/97_ACTUALIZACION_QA.gs',
    'BACKEND_QA/98_ACTUALIZACION_QA_CS21A181.gs',
    'src/runtime_config.js',
    'src/english_lab_live.jsx',
    'src/english_lab_ux_cs21a181.js',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);

  assert.equal(fs.existsSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A180.cmd')), false);
  assert.match(fs.readFileSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A181.cmd'), 'utf8'), /127\.0\.0\.1:4179\/qa-setup\.html[\s\S]*PORT=4179/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'runtime_config.js'), 'utf8'), /english_lab_ux_cs21a181\.js\?v=F98\.4Z6CS21A181/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'english_lab_ux_cs21a181.js'), 'utf8'), /Palabras sugeridas/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'english_lab_ux_cs21a181.js'), 'utf8'), /custom_pairs:parsed\.pairs/);
  assert.match(fs.readFileSync(path.join(target, 'BACKEND_QA', '98_ACTUALIZACION_QA_CS21A181.gs'), 'utf8'), /ELIVE181_VERSION = 'CS21A181'/);
  assert.match(fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8'), /APPS_SCRIPT_CHANGE=YES_QA_ONLY_ADD_98_AFTER_97/);
  assert.match(fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8'), /PRODUCTION_TOUCHED=NO/);

  const manifest = new Map();
  for (const line of fs.readFileSync(path.join(target, 'SHA256SUMS.txt'), 'utf8').trim().split(/\r?\n/)) {
    const match = line.match(/^([0-9a-f]{64})  \.\/(.+)$/);
    assert.ok(match, `Linea SHA invalida: ${line}`);
    manifest.set(match[2], match[1]);
  }
  const files = packageFiles();
  assert.equal(manifest.size, files.length, 'El manifiesto debe cubrir cada archivo exactamente una vez.');
  for (const file of files) {
    const relative = path.relative(target, file).split(path.sep).join('/');
    assert.equal(manifest.get(relative), sha256(file), `Hash invalido: ${relative}`);
  }

  console.log(JSON.stringify({
    verdict:'APTO_CON_RESERVAS',
    package:packageName,
    files:files.length,
    base:'CS21A180',
    frontend:'F98.4-Z6-CS21A181',
    backend:'CS21A181',
    authenticatedQa:'PENDING',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
