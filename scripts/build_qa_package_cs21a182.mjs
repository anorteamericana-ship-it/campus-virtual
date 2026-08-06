#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const baseName = 'CAMPUS_QA_CS21A181_CANDIDATO_ENGLISH_LAB_UX_PAREJAS_EDITABLES';
const packageName = 'CAMPUS_QA_CS21A182_CANDIDATO_ENGLISH_LAB_LIMPIEZA_VISUAL';
const baseTarget = path.join(root, 'dist', baseName);
const target = path.join(root, 'dist', packageName);
const verifyOnly = process.argv.includes('--verify');
const sourceHeadSha = process.env.SOURCE_HEAD_SHA || process.env.GITHUB_SHA || 'local-uncommitted';
const testMergeSha = process.env.TEST_MERGE_SHA || process.env.GITHUB_SHA || 'local';
const sourceBranch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || 'fix/cs21a182-english-lab-visual-cleanup';

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
function remove(relative) {
  fs.rmSync(path.join(target, relative), {recursive:true, force:true});
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

function build() {
  const baseBuild = spawnSync(process.execPath, ['scripts/build_qa_package_cs21a181.mjs'], {
    cwd:root,
    stdio:'inherit',
    env:process.env,
  });
  assert.equal(baseBuild.status, 0, 'No se pudo construir la base CS21A181.');
  assert.equal(fs.existsSync(baseTarget), true, 'Falta el paquete base CS21A181.');

  fs.rmSync(target, {recursive:true, force:true});
  fs.cpSync(baseTarget, target, {recursive:true});

  remove('LEEME_PRIMERO_CS21A181.txt');
  remove('REGISTRO_PRUEBA_AUTENTICADA_CS21A181.txt');
  remove('VERSION.txt');
  remove('SHA256SUMS.txt');

  const oldLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A181.cmd');
  const newLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A182.cmd');
  assert.equal(fs.existsSync(oldLauncher), true, 'Falta launcher CS21A181.');
  const launcher = fs.readFileSync(oldLauncher, 'utf8')
    .replaceAll('127.0.0.1:4179', '127.0.0.1:4180')
    .replaceAll('PORT=4179', 'PORT=4180');
  fs.writeFileSync(newLauncher, launcher, 'utf8');
  fs.rmSync(oldLauncher);

  const serverPath = path.join(target, 'serve.mjs');
  fs.writeFileSync(serverPath, fs.readFileSync(serverPath, 'utf8')
    .replace("process.env.PORT || 4179", "process.env.PORT || 4180")
    .replace("process.env.PORT || '4179'", "process.env.PORT || '4180'"), 'utf8');

  copy(path.join(root, 'src', 'runtime_config.js'), 'src/runtime_config.js');
  copy(path.join(root, 'src', 'english_lab_visual_cleanup_cs21a182.js'), 'src/english_lab_visual_cleanup_cs21a182.js');
  copy(path.join(root, '00_DOCUMENTACION', 'ENGLISH_LAB_LIMPIEZA_VISUAL_CS21A182.md'), 'INFORME_CAMBIOS_CS21A182.md');

  write('LEEME_PRIMERO_CS21A182.txt', `CAMPUS QA CS21A182 - LIMPIEZA VISUAL ENGLISH LAB
================================================

ESTADO REAL
- Candidato QA apilado sobre CS21A181.
- No modifica main ni producción.
- Mantiene el motor Live CS21A180 y parejas editables CS21A181.
- Simplifica textos en catálogo, estudiante y docente.
- Oculta diagnósticos internos del banco en la vista docente.
- Retira del estudiante controles de importación, métricas de sincronización y nombres internos.
- Oculta tarjetas Próximamente y la entrada Live Trivia con sala ficticia.
- La vista demo heredada dirige a la ruta real English LAB Live.
- No modifica backend ni reglas de acceso.

FRONTEND QA
1. Extraiga completamente el ZIP.
2. Ejecute ABRIR_CAMPUS_QA_CS21A182.cmd.
3. Mantenga abierta la ventana negra.
4. Se abrirá http://127.0.0.1:4180/qa-setup.html
5. Use la misma URL /exec QA de CS21A181.

PRUEBA DOCENTE
1. Entre como Profe y abra English LAB Live.
2. Confirme ausencia de CS20H, versiones y Banco pedagógico.
3. Cree una sala y pruebe copiar código, mensaje y enlace.
4. Abra el control y confirme participantes, botones y resultados.

PRUEBA ESTUDIANTE LIVE
1. Entre con Naty o leo.
2. Abra English LAB Live e ingrese a la sala.
3. Confirme textos breves de espera, respuesta y actualización.

PRUEBA ESTUDIANTE INDIVIDUAL
1. Abra English LAB.
2. Confirme que no aparecen Banco total, 768 esperados, estado local/sincronizado ni controles de importación.
3. Confirme que Juegos por unidad, mapa de progreso y filtros siguen funcionando.
4. Confirme ausencia de tarjetas Próximamente y Live Trivia demo.
5. Abra un juego real y confirme ausencia de ACADEMIA_PLAY_BANK, GAME_ID y CS14.
6. Revise escritorio y móvil a 390 px.

NO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A182.txt', `REGISTRO DE ACEPTACIÓN QA CS21A182
=====================================

Estado inicial: PENDIENTE
Fecha:
URL /exec QA confirmada: SI / NO
Docente:
Estudiante:
Código de sala:

[ ] No aparece CS20H ni versión interna.
[ ] No aparece Banco pedagógico al docente.
[ ] Crear sala funciona.
[ ] Copiar código funciona.
[ ] Copiar mensaje funciona.
[ ] Copiar enlace funciona.
[ ] Salas recientes siguen visibles.
[ ] El control de ronda conserva todos los botones.
[ ] El estudiante Live ve estados breves y claros.
[ ] No aparecen controles de importación ni métricas de sincronización al estudiante.
[ ] No aparecen Banco total, 768 esperados, ACADEMIA_PLAY_BANK, GAME_ID o CS14.
[ ] Juegos por unidad, mapa y filtros siguen operativos.
[ ] No aparecen tarjetas Próximamente ni Live Trivia demo.
[ ] La sala demo heredada no muestra código o participantes ficticios.
[ ] La línea de logros no está duplicada.
[ ] Vista móvil usable a 390 px sin ensanchar fichas de juego.
[ ] CS21A181 conserva carga y parejas editables.
[ ] CS21A180 conserva turnos y sincronización.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Captura o evidencia:
`);

  write('VERSION.txt', `VERSION=CS21A182
STATUS=QA_CANDIDATE_NOT_FINAL
BASE_VERSION=CS21A181
PURPOSE=English LAB visual cleanup
FRONTEND_LAYER=F98.4-Z6-CS21A182
BACKEND_LAYER=UNCHANGED_CS21A181
SOURCE_BRANCH=${sourceBranch}
SOURCE_HEAD_SHA=${sourceHeadSha}
TEST_MERGE_SHA=${testMergeSha}
QA_PORT=4180
APPS_SCRIPT_CHANGE=NO
AUTHENTICATED_QA_STATUS=PENDING
PRODUCTION_TOUCHED=NO
`);

  write('SHA256SUMS.txt', packageFiles().map(file =>
    `${sha256(file)}  ./${path.relative(target, file).split(path.sep).join('/')}`
  ).join('\n') + '\n');
}

function verify() {
  for (const relative of [
    'ABRIR_CAMPUS_QA_CS21A182.cmd',
    'LEEME_PRIMERO_CS21A182.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A182.txt',
    'INFORME_CAMBIOS_CS21A182.md',
    'VERSION.txt',
    'SHA256SUMS.txt',
    'src/runtime_config.js',
    'src/english_lab_live.jsx',
    'src/english_lab_ux_cs21a181.js',
    'src/english_lab_visual_cleanup_cs21a182.js',
    'BACKEND_QA/98_ACTUALIZACION_QA_CS21A181.gs',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);

  assert.equal(fs.existsSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A181.cmd')), false);
  assert.match(fs.readFileSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A182.cmd'), 'utf8'), /127\.0\.0\.1:4180\/qa-setup\.html[\s\S]*PORT=4180/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'runtime_config.js'), 'utf8'), /english_lab_visual_cleanup_cs21a182\.js\?v=F98\.4Z6CS21A182/);
  const cleanup = fs.readFileSync(path.join(target, 'src', 'english_lab_visual_cleanup_cs21a182.js'), 'utf8');
  assert.match(cleanup, /Banco pedagógico/);
  assert.match(cleanup, /Las actividades en vivo están en English LAB Live/);
  assert.match(cleanup, /\.ap-live-preview,\.ap-stats-grid,\.ap-medal-shelf,\.ap-bank-unit-summary/);
  assert.match(cleanup, /Próximamente\|Live Trivia/);
  assert.match(fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8'), /APPS_SCRIPT_CHANGE=NO/);
  assert.match(fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8'), /PRODUCTION_TOUCHED=NO/);

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
    files:files.length,
    base:'CS21A181',
    frontend:'F98.4-Z6-CS21A182',
    backend:'UNCHANGED_CS21A181',
    authenticatedQa:'PENDING',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
