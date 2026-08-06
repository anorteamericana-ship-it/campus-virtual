#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root = process.cwd();
const baseName = 'CAMPUS_QA_CS21A182_CANDIDATO_ENGLISH_LAB_LIMPIEZA_VISUAL';
const packageName = 'CAMPUS_QA_CS21A183_CANDIDATO_SENTENCE_ORDER_LIVE';
const baseTarget = path.join(root, 'dist', baseName);
const target = path.join(root, 'dist', packageName);
const verifyOnly = process.argv.includes('--verify');
const sourceHeadSha = process.env.SOURCE_HEAD_SHA || process.env.GITHUB_SHA || 'local-uncommitted';
const testMergeSha = process.env.TEST_MERGE_SHA || process.env.GITHUB_SHA || 'local';
const sourceBranch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || 'feat/cs21a183-sentence-order-live';

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
  const baseBuild = spawnSync(process.execPath, ['scripts/build_qa_package_cs21a182.mjs'], {
    cwd:root,
    stdio:'inherit',
    env:process.env,
  });
  assert.equal(baseBuild.status, 0, 'No se pudo construir la base CS21A182.');
  assert.equal(fs.existsSync(baseTarget), true, 'Falta el paquete base CS21A182.');

  fs.rmSync(target, {recursive:true, force:true});
  fs.cpSync(baseTarget, target, {recursive:true});

  remove('LEEME_PRIMERO_CS21A182.txt');
  remove('REGISTRO_PRUEBA_AUTENTICADA_CS21A182.txt');
  remove('VERSION.txt');
  remove('SHA256SUMS.txt');

  const oldLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A182.cmd');
  const newLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A183.cmd');
  assert.equal(fs.existsSync(oldLauncher), true, 'Falta launcher CS21A182.');
  const launcher = fs.readFileSync(oldLauncher, 'utf8')
    .replaceAll('127.0.0.1:4180', '127.0.0.1:4181')
    .replaceAll('PORT=4180', 'PORT=4181');
  fs.writeFileSync(newLauncher, launcher, 'utf8');
  fs.rmSync(oldLauncher);

  const serverPath = path.join(target, 'serve.mjs');
  fs.writeFileSync(serverPath, fs.readFileSync(serverPath, 'utf8')
    .replace("process.env.PORT || 4180", "process.env.PORT || 4181")
    .replace("process.env.PORT || '4180'", "process.env.PORT || '4181'"), 'utf8');

  copy(path.join(root, 'src', 'runtime_config.js'), 'src/runtime_config.js');
  copy(path.join(root, 'src', 'english_lab_sentence_order_cs21a183.js'), 'src/english_lab_sentence_order_cs21a183.js');
  copy(path.join(root, 'apps_script_patches', '99_ACTUALIZACION_QA_CS21A183.gs'), 'BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs');
  copy(path.join(root, '00_DOCUMENTACION', 'ENGLISH_LAB_SENTENCE_ORDER_CS21A183.md'), 'INFORME_CAMBIOS_CS21A183.md');

  write('LEEME_PRIMERO_CS21A183.txt', `CAMPUS QA CS21A183 - ORDENA LA ORACION LIVE
============================================

ESTADO REAL
- Candidato QA apilado sobre CS21A182.
- No modifica main ni producción.
- Mantiene Memory Match, carga visible y limpieza visual anteriores.
- Agrega Ordena la oración como sala Live real.
- Usa sugerencias del banco GRAM_02 y permite editarlas.
- Todos responden una vez por oración; docente controla el avance.
- No genera notas oficiales ni afecta pagos o certificados.

APPS SCRIPT QA
1. Mantenga 97_ACTUALIZACION_QA.gs.
2. Mantenga 98_ACTUALIZACION_QA_CS21A181.gs.
3. Cree un archivo nuevo: 99_ACTUALIZACION_QA_CS21A183.gs.
4. Copie BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs completo.
5. Ejecute verificarActualizacionQA().
6. Debe devolver version=CS21A183 y sentence_order_live_supported=true.
7. Actualice el mismo deployment QA. No cambie la URL /exec.

FRONTEND QA
1. Extraiga completamente el ZIP.
2. Ejecute ABRIR_CAMPUS_QA_CS21A183.cmd.
3. Mantenga abierta la ventana negra.
4. Se abrirá http://127.0.0.1:4181/qa-setup.html
5. Use la misma URL /exec QA actualizada.

PRUEBA PRINCIPAL
1. Entre como Profe y abra English LAB Live.
2. Abra Preparar juego en Ordena la oración.
3. Seleccione B1/U01 y cargue sugerencias.
4. Edite una oración y cree una sala individual.
5. Comparta el código con Naty y leo.
6. Inicie, responda con ambos perfiles y avance.
7. Confirme respuesta única, puntaje y ranking.
8. Cierre la sala y revise resultados.
9. Repita una sala en modo equipos.
10. Revise docente y estudiante a 390 px.

NO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A183.txt', `REGISTRO DE ACEPTACIÓN QA CS21A183
=====================================

Estado inicial: PENDIENTE
Fecha:
URL /exec QA confirmada: SI / NO
Docente:
Estudiante 1:
Estudiante 2:
Sala individual:
Sala equipos:

BACKEND
[ ] verificarActualizacionQA devolvió CS21A183 y ok=true.
[ ] sentence_order_live_supported=true.
[ ] editable_sentences_supported=true.
[ ] simultaneous_answers_supported=true.

DOCENTE
[ ] Aparece Ordena la oración en English LAB Live.
[ ] Cargar sugerencias usa B1/U01 GRAM_02.
[ ] Se puede editar una sugerencia.
[ ] Cantidad incorrecta bloquea crear sala.
[ ] Crear sala devuelve código real.
[ ] Copiar código y mensaje funciona.
[ ] Iniciar actividad funciona.
[ ] Siguiente oración funciona.
[ ] Cerrar sala funciona.

ESTUDIANTE
[ ] Ambos perfiles ingresan por el código estándar.
[ ] Ambos reciben los mismos tokens desordenados.
[ ] Las palabras se agregan y retiran.
[ ] No permite enviar sin usar todos los tokens.
[ ] Respuesta correcta suma puntos.
[ ] Respuesta incorrecta queda en cero.
[ ] Segundo envío de la misma ronda se rechaza como duplicado.
[ ] La respuesta correcta se revela después de enviar.
[ ] La siguiente oración aparece sin salir de la sala.
[ ] Ranking se actualiza.

EQUIPOS
[ ] Cuatro perfiles quedan repartidos en equipos.
[ ] El ranking por equipos suma puntos correctamente.

REGRESIÓN
[ ] Memory Match CS21A181 sigue operativo.
[ ] Limpieza visual CS21A182 permanece aplicada.
[ ] No aparecen salas o estudiantes ficticios.
[ ] No se afecta ninguna vista fuera de English LAB.

MÓVIL
[ ] Docente usable a 390 px.
[ ] Estudiante usable a 390 px.
[ ] Tokens conservan tamaño táctil y no desbordan.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Captura o evidencia:
`);

  write('VERSION.txt', `VERSION=CS21A183
STATUS=QA_CANDIDATE_NOT_FINAL
BASE_VERSION=CS21A182
PURPOSE=Sentence Order Live with editable curricular suggestions
FRONTEND_LAYER=F98.4-Z6-CS21A183
BACKEND_LAYER=CS21A183
SOURCE_BRANCH=${sourceBranch}
SOURCE_HEAD_SHA=${sourceHeadSha}
TEST_MERGE_SHA=${testMergeSha}
QA_PORT=4181
APPS_SCRIPT_CHANGE=YES_QA_ONLY_ADD_99_AFTER_98
AUTHENTICATED_QA_STATUS=PENDING
PRODUCTION_TOUCHED=NO
`);

  write('SHA256SUMS.txt', packageFiles().map(file =>
    `${sha256(file)}  ./${path.relative(target, file).split(path.sep).join('/')}`
  ).join('\n') + '\n');
}

function verify() {
  for (const relative of [
    'ABRIR_CAMPUS_QA_CS21A183.cmd',
    'LEEME_PRIMERO_CS21A183.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A183.txt',
    'INFORME_CAMBIOS_CS21A183.md',
    'VERSION.txt',
    'SHA256SUMS.txt',
    'src/runtime_config.js',
    'src/english_lab_live.jsx',
    'src/english_lab_ux_cs21a181.js',
    'src/english_lab_visual_cleanup_cs21a182.js',
    'src/english_lab_sentence_order_cs21a183.js',
    'BACKEND_QA/97_ACTUALIZACION_QA.gs',
    'BACKEND_QA/98_ACTUALIZACION_QA_CS21A181.gs',
    'BACKEND_QA/99_ACTUALIZACION_QA_CS21A183.gs',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);

  assert.equal(fs.existsSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A182.cmd')), false);
  assert.match(fs.readFileSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A183.cmd'), 'utf8'), /127\.0\.0\.1:4181\/qa-setup\.html[\s\S]*PORT=4181/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'runtime_config.js'), 'utf8'), /english_lab_sentence_order_cs21a183\.js\?v=F98\.4Z6CS21A183/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'english_lab_sentence_order_cs21a183.js'), 'utf8'), /Ordena la oración/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'english_lab_sentence_order_cs21a183.js'), 'utf8'), /englishLabSentenceOrderSubmit/);
  assert.match(fs.readFileSync(path.join(target, 'BACKEND_QA', '99_ACTUALIZACION_QA_CS21A183.gs'), 'utf8'), /ELSO183_VERSION = 'CS21A183'/);
  assert.match(fs.readFileSync(path.join(target, 'BACKEND_QA', '99_ACTUALIZACION_QA_CS21A183.gs'), 'utf8'), /sentence_order_live_supported:true/);
  assert.match(fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8'), /APPS_SCRIPT_CHANGE=YES_QA_ONLY_ADD_99_AFTER_98/);
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
    base:'CS21A182',
    frontend:'F98.4-Z6-CS21A183',
    backend:'CS21A183',
    authenticatedQa:'PENDING',
  }, null, 2));
}

if (!verifyOnly) build();
verify();
