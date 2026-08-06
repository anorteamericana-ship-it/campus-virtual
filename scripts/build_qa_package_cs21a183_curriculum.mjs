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
  return files.sort((a,b)=>a.localeCompare(b));
}
function appendOnce(relative, marker, content) {
  const file = path.join(target, relative);
  assert.equal(fs.existsSync(file), true, `Falta ${relative}`);
  const current = fs.readFileSync(file, 'utf8');
  if (!current.includes(marker)) fs.writeFileSync(file, current.replace(/\s*$/, '') + '\n\n' + content.replace(/^\s+|\s+$/g, '') + '\n', 'utf8');
}
function writeManifest() {
  fs.writeFileSync(path.join(target, 'SHA256SUMS.txt'), packageFiles().map(file =>
    `${sha256(file)}  ./${path.relative(target, file).split(path.sep).join('/')}`
  ).join('\n') + '\n', 'utf8');
}

function build() {
  const base = spawnSync(process.execPath, ['scripts/build_qa_package_cs21a183.mjs'], {
    cwd:root,
    stdio:'inherit',
    env:process.env,
  });
  assert.equal(base.status, 0, 'No se pudo construir el paquete base CS21A183.');
  assert.equal(fs.existsSync(target), true, 'Falta el paquete base CS21A183.');

  copy(path.join(root, 'src', 'runtime_config.js'), 'src/runtime_config.js');
  copy(path.join(root, 'src', 'english_lab_sentence_order_curriculum_guard_cs21a183.js'), 'src/english_lab_sentence_order_curriculum_guard_cs21a183.js');
  copy(path.join(root, 'src', 'english_lab_sentence_order_polish_cs21a183.js'), 'src/english_lab_sentence_order_polish_cs21a183.js');
  copy(path.join(root, 'apps_script_patches', '99B_VALIDACION_CURRICULAR_CS21A183.gs'), 'BACKEND_QA/99B_VALIDACION_CURRICULAR_CS21A183.gs');
  copy(path.join(root, '00_DOCUMENTACION', 'ENGLISH_LAB_VALIDACION_CURRICULAR_CS21A183.md'), 'INFORME_VALIDACION_CURRICULAR_CS21A183.md');

  appendOnce('LEEME_PRIMERO_CS21A183.txt', 'GUARDIA CURRICULAR APOLLO', `GUARDIA CURRICULAR APOLLO
-------------------------
8. Cree después un archivo nuevo: 99B_VALIDACION_CURRICULAR_CS21A183.gs.
9. Copie BACKEND_QA/99B_VALIDACION_CURRICULAR_CS21A183.gs completo.
10. Ejecute nuevamente verificarActualizacionQA().
11. Además de version=CS21A183, debe devolver curriculum_guard=true, curriculum_units=64, active_gram_02_items=320 y five_items_per_unit=true.
12. En el frontend, cargue sugerencias y confirme el tema oficial antes de crear la sala.
13. La cantidad válida por unidad es de 3 a 5 oraciones.
14. Un reintento duplicado debe conservar tablero, respuesta y ranking completos.`);

  appendOnce('REGISTRO_PRUEBA_AUTENTICADA_CS21A183.txt', 'VALIDACIÓN CURRICULAR APOLLO', `VALIDACIÓN CURRICULAR APOLLO
[ ] Apollo reporta 64 unidades activas.
[ ] Apollo reporta 320 ítems GRAM_02 activos.
[ ] Cada unidad tiene exactamente 5 ítems ORDER completos.
[ ] B1-U01 muestra presentaciones y saludos.
[ ] B1-U14 muestra actividades pasadas.
[ ] B2-U10 muestra experiencias de vida.
[ ] I1-U07 muestra tecnología y herramientas.
[ ] I2-U15 muestra reglas, leyes y opiniones.
[ ] Cambiar unidad invalida las sugerencias cargadas anteriormente.
[ ] Crear sin cargar sugerencias falla.
[ ] Crear sin confirmar el tema falla.
[ ] El selector no ofrece más de 5 oraciones.
[ ] La sala guarda curriculum_verified=true y source_game_id.
[ ] Un doble envío conserva el estado completo y se marca duplicate=true.
[ ] La tarjeta de respuesta final conserva el estilo elso183-card.`);

  appendOnce('VERSION.txt', 'CURRICULUM_GUARD=', `CURRICULUM_GUARD=CS21A183-CURRICULUM
CURRICULUM_UNITS_REQUIRED=64
GRAM_02_ITEMS_REQUIRED=320
GRAM_02_ITEMS_PER_UNIT=5
SENTENCE_COUNT_LIMITS=3-5
DUPLICATE_RESPONSE_PRESERVES_STATE=YES
VISUAL_POLISH=F98.4-Z6-CS21A183-POLISH
CURRICULUM_QA_STATUS=PENDING`);

  writeManifest();
}

function verify() {
  for (const relative of [
    'src/runtime_config.js',
    'src/english_lab_sentence_order_cs21a183.js',
    'src/english_lab_sentence_order_curriculum_guard_cs21a183.js',
    'src/english_lab_sentence_order_polish_cs21a183.js',
    'BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs',
    'BACKEND_QA/99B_VALIDACION_CURRICULAR_CS21A183.gs',
    'INFORME_CAMBIOS_CS21A183.md',
    'INFORME_VALIDACION_CURRICULAR_CS21A183.md',
    'LEEME_PRIMERO_CS21A183.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A183.txt',
    'VERSION.txt',
    'SHA256SUMS.txt',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);

  const runtime = fs.readFileSync(path.join(target, 'src', 'runtime_config.js'), 'utf8');
  const guard = fs.readFileSync(path.join(target, 'src', 'english_lab_sentence_order_curriculum_guard_cs21a183.js'), 'utf8');
  const polish = fs.readFileSync(path.join(target, 'src', 'english_lab_sentence_order_polish_cs21a183.js'), 'utf8');
  const backend = fs.readFileSync(path.join(target, 'BACKEND_QA', '99B_VALIDACION_CURRICULAR_CS21A183.gs'), 'utf8');
  const version = fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8');
  assert.match(runtime, /english_lab_sentence_order_curriculum_guard_cs21a183\.js\?v=F98\.4Z6CS21A183CURRICULUM/);
  assert.match(runtime, /english_lab_sentence_order_polish_cs21a183\.js\?v=F98\.4Z6CS21A183POLISH/);
  assert.match(guard, /Tema oficial de la unidad/);
  assert.match(guard, /curriculum_source_required/);
  assert.match(polish, /\.elso183-shell \.elso-card/);
  assert.match(polish, /classList\.add\('elso183-card'\)/);
  assert.match(backend, /curriculum_units:units\.length/);
  assert.match(backend, /active_gram_02_items:rows\.length/);
  assert.match(backend, /five_items_per_unit:exactFive/);
  assert.match(backend, /duplicate_response_preserves_state:true/);
  assert.match(version, /CURRICULUM_UNITS_REQUIRED=64/);
  assert.match(version, /GRAM_02_ITEMS_REQUIRED=320/);
  assert.match(version, /SENTENCE_COUNT_LIMITS=3-5/);
  assert.match(version, /DUPLICATE_RESPONSE_PRESERVES_STATE=YES/);

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
    curriculumGuard:'CS21A183-CURRICULUM',
    curriculumUnitsRequired:64,
    gram02ItemsRequired:320,
    itemsPerUnitRequired:5,
    sentenceCountLimits:'3-5',
    duplicateResponsePreservesState:true,
    visualPolish:'F98.4-Z6-CS21A183-POLISH',
    authenticatedQa:'PENDING',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
