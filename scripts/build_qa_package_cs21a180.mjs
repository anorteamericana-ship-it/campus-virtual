#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'dist', 'qa-staging');
const packageName = 'CAMPUS_QA_CS21A180_CANDIDATO_ENGLISH_LAB_ESTADO_RAPIDO';
const target = path.join(root, 'dist', packageName);
const verifyOnly = process.argv.includes('--verify');
const sourceHeadSha = process.env.SOURCE_HEAD_SHA || process.env.GITHUB_SHA || 'local-uncommitted';
const testMergeSha = process.env.TEST_MERGE_SHA || process.env.GITHUB_SHA || 'local';
const sourceBranch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || 'fix/cs21a180-english-lab-fast-state';

function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function write(relative, content) {
  const file = path.join(target, relative);
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, content, 'utf8');
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

function build() {
  assert.equal(fs.existsSync(source), true, 'Primero debe generarse dist/qa-staging.');
  fs.rmSync(target, {recursive:true, force:true});
  fs.cpSync(source, target, {recursive:true});
  fs.rmSync(path.join(target, '.nojekyll'), {force:true});

  // Compatibilidad de reconstrucción: el source vigente usa el manifiesto único
  // CS21A193, pero este artefacto intermedio debe conservar la lista histórica
  // que las capas CS21A181-CS21A192 esperan parchear. No modifica app.jsx fuente.
  const appPath = path.join(target, 'src', 'app.jsx');
  let appSource = fs.readFileSync(appPath, 'utf8');
  if (appSource.includes('english_lab_live: F96_ENGLISH_LAB_LIVE_CS21A193')) {
    appSource = appSource
      .replace(/const F96_ENGLISH_LAB_LIVE_CS21A193 = window\.EnglishLabLiveCanonicalLoaderCS21A193 &&[\s\S]*?\s: \[\];\r?\n/, '')
      .replace('  english_lab_live: F96_ENGLISH_LAB_LIVE_CS21A193,', `  english_lab_live: [
    'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
    'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
    'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A178',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A178',
    'src/english_lab_live.jsx?v=F98.4Z6CS21A180'
  ],`);
    fs.writeFileSync(appPath, appSource, 'utf8');
  }

  const oldLauncher = path.join(target, 'INICIAR_QA_STAGING.cmd');
  const newLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A180.cmd');
  const launcher = fs.readFileSync(oldLauncher, 'utf8').replace(/^\uFEFF/, '')
    .replaceAll('127.0.0.1:4173', '127.0.0.1:4178')
    .replace('node serve.mjs', 'set PORT=4178\r\nnode serve.mjs');
  fs.writeFileSync(newLauncher, launcher, 'utf8');
  fs.rmSync(oldLauncher);
  const serverPath = path.join(target, 'serve.mjs');
  fs.writeFileSync(serverPath, fs.readFileSync(serverPath, 'utf8')
    .replace('process.env.PORT || 4173', 'process.env.PORT || 4178')
    .replace("process.env.PORT || '4173'", "process.env.PORT || '4178'"), 'utf8');

  const backendSource = path.join(root, 'apps_script_patches', '97_ACTUALIZACION_QA.gs');
  assert.equal(fs.existsSync(backendSource), true, 'Falta el backend QA CS21A180.');
  fs.mkdirSync(path.join(target, 'BACKEND_QA'), {recursive:true});
  fs.copyFileSync(backendSource, path.join(target, 'BACKEND_QA', '97_ACTUALIZACION_QA.gs'));

  write('LEEME_PRIMERO_CS21A180.txt', `CAMPUS QA CS21A180 - ENGLISH LAB MEMORY MATCH SIN TIMEOUTS REPETIDOS
====================================================================

ESTADO REAL
- Este paquete corrige el timeout observado en docente y estudiante.
- Tambien elimina la pregunta generica que aparecia en salas Memory Match.
- Es un CANDIDATO QA. No autoriza produccion ni modifica main.
- Esta entrega SI requiere actualizar el archivo temporal del Apps Script QA.

INSTALAR EL BACKEND QA
1. Abra el proyecto Apps Script QA que ya utiliza el Campus QA.
2. Abra el archivo temporal 97_ACTUALIZACION_QA.gs.
3. Reemplace TODO su contenido por BACKEND_QA/97_ACTUALIZACION_QA.gs.
4. No cambie ningun otro archivo de Apps Script.
5. Guarde y ejecute verificarActualizacionQA().
6. Debe devolver ok=true, version=CS21A180, header_aligned=true y generic_questions_in_memory_state=0.
7. Actualice el MISMO deployment QA para que la URL /exec no cambie.
8. No edite ni despliegue produccion.

ABRIR EL FRONTEND QA
1. Cierre la ventana negra del paquete CS21A179.
2. Extraiga completamente este ZIP en una carpeta nueva.
3. Ejecute ABRIR_CAMPUS_QA_CS21A180.cmd.
4. Mantenga abierta la ventana negra.
5. Se abrira http://127.0.0.1:4178/qa-setup.html
6. Pegue la misma URL /exec del Apps Script QA actualizado.

PRUEBA OBLIGATORIA
1. Entre como docente QA y abra English LAB.
2. Cree una SALA NUEVA: Memory Match, Unidad 1, 6 pares, Individual.
3. Haga entrar a dos estudiantes antes de iniciar.
4. Docente y estudiantes deben permanecer sin error y sin pregunta generica.
5. Ningun estudiante debe ver el boton Enviar respuesta.
6. Inicie la sala: los tres deben ver el tablero compartido inmediatamente.
7. Pruebe un par, confirme la rotacion de turno y pulse Actualizar diez veces.
8. Complete REGISTRO_PRUEBA_AUTENTICADA_CS21A180.txt.

IMPORTANTE
- LAB-9682 fue creada con el esquema defectuoso anterior. No sirve para aprobar la creacion nueva.
- No probar 25 estudiantes todavia.
- No fusionar los PR apilados.
- No declarar solucion final antes del PASS autenticado con dos estudiantes.
`);

  write('ESTADO_VALIDACION_CS21A180.txt', `MATRIZ DE EVIDENCIA CS21A180
================================

CAUSA EN DATOS QA                         CONFIRMADA
FILA LAB-9682 DESALINEADA                 CONFIRMADA
CREACION INTERMEDIA WORD_MATCH            ELIMINADA
CREACION POR ENCABEZADO REAL              APROBADA
CONTROL SIN ESTADO GENERICO               APROBADO
ESTUDIANTE SIN ESTADO GENERICO            APROBADO
LECTURAS POR SNAPSHOT                      1 PLAYERS / 1 ANSWERS / 1 EVENTS
CACHE COMPARTIDO                           3 SEGUNDOS
ESCRITURA LAST_SEEN                        MAXIMO CADA 30 SEGUNDOS
PREGUNTAS GENERICAS EN MEMORY MATCH        0
AUTORIZACION ACADEMICA                     CONSERVADA
REGRESION TURNOS/EQUIPOS/IDEMPOTENCIA      APROBADA
FRONTEND                                   F98.4-Z6-CS21A180
BACKEND QA                                 CS21A180
PRODUCCION                                 SIN CAMBIOS
QA AUTENTICADA                             PENDIENTE

VEREDICTO: APTO CON RESERVAS PARA QA AUTENTICADA
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A180.txt', `REGISTRO DE ACEPTACION QA CS21A180
=====================================

Estado inicial: PENDIENTE
Fecha:
URL /exec QA confirmada: SI / NO
Docente QA:
Estudiante QA 1:
Estudiante QA 2:
Codigo de SALA NUEVA:

[ ] verificarActualizacionQA devolvio version CS21A180 y ok=true.
[ ] La sala nueva se creo como Memory Match, U01, 6 pares, Individual.
[ ] Ambos estudiantes entraron antes de iniciar.
[ ] Docente sin mensaje de timeout antes de iniciar.
[ ] Estudiante 1 sin mensaje de timeout antes de iniciar.
[ ] Estudiante 2 sin mensaje de timeout antes de iniciar.
[ ] Ninguna vista mostro Choose the best meaning of greeting.
[ ] Ningun estudiante mostro Enviar respuesta.
[ ] Los tres mostraron el tablero al iniciar.
[ ] Un par se sincronizo en las tres vistas.
[ ] El turno cambio al siguiente estudiante.
[ ] Diez actualizaciones consecutivas no produjeron timeout.

Latencia control docente (ms, 10 muestras):
Latencia estudiante 1 (ms, 10 muestras):
Latencia estudiante 2 (ms, 10 muestras):

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Captura o evidencia:
`);

  write('VERSION.txt', `VERSION=CS21A180
STATUS=QA_CANDIDATE_NOT_FINAL
PURPOSE=English LAB Memory Match aligned creation and fast shared state
BASE_FRONTEND_VERSION=CS21A179
FRONTEND_VERSION=F98.4-Z6-CS21A180
BASE_BACKEND_VERSION=CS21A176
BACKEND_VERSION=CS21A180
SOURCE_BRANCH=${sourceBranch}
SOURCE_HEAD_SHA=${sourceHeadSha}
TEST_MERGE_SHA=${testMergeSha}
QA_PORT=4178
APPS_SCRIPT_CHANGE=YES_QA_ONLY_REPLACE_97
AUTHENTICATED_QA_STATUS=PENDING
PRODUCTION_TOUCHED=NO
`);

  const report = path.join(root, '00_DOCUMENTACION', 'ENGLISH_LAB_ESTADO_RAPIDO_CS21A180.md');
  assert.equal(fs.existsSync(report), true, 'Falta el informe canonico CS21A180.');
  fs.copyFileSync(report, path.join(target, 'INFORME_AUDITORIA_CS21A180.md'));

  for (const evidenceName of ['cs21a176-live-turns', 'cs21a178-student-sync']) {
    const evidence = path.join(root, 'qa-output', evidenceName);
    if (fs.existsSync(evidence)) fs.cpSync(evidence, path.join(target, 'EVIDENCIA_AUTOMATICA', evidenceName), {recursive:true});
  }

  write('SHA256SUMS.txt', packageFiles().map(file => `${sha256(file)}  ./${path.relative(target, file).split(path.sep).join('/')}`).join('\n') + '\n');
}

function verify() {
  for (const relative of [
    'ABRIR_CAMPUS_QA_CS21A180.cmd', 'LEEME_PRIMERO_CS21A180.txt', 'ESTADO_VALIDACION_CS21A180.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A180.txt', 'INFORME_AUDITORIA_CS21A180.md', 'VERSION.txt', 'SHA256SUMS.txt',
    'BACKEND_QA/97_ACTUALIZACION_QA.gs', 'src/app.jsx', 'src/english_lab_live.jsx',
  ]) assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);
  assert.equal(fs.existsSync(path.join(target, 'INICIAR_QA_STAGING.cmd')), false);
  assert.equal(fs.existsSync(path.join(target, '.nojekyll')), false);
  assert.match(fs.readFileSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A180.cmd'), 'utf8'), /127\.0\.0\.1:4178\/qa-setup\.html[\s\S]*set PORT=4178/);
  assert.match(fs.readFileSync(path.join(target, 'src', 'app.jsx'), 'utf8'), /english_lab_live\.jsx\?v=F98\.4Z6CS21A180/);
  const live = fs.readFileSync(path.join(target, 'src', 'english_lab_live.jsx'), 'utf8');
  assert.match(live, /const VERSION = 'F98\.4-Z6-CS21A180'/);
  assert.match(live, /const memoryMatch = !!\(data\?\.memory_match/);
  assert.match(live, /question=\{memoryMatch \? null :/);
  const backend = fs.readFileSync(path.join(target, 'BACKEND_QA', '97_ACTUALIZACION_QA.gs'), 'utf8');
  assert.match(backend, /ELIVE180_VERSION = 'CS21A180'/);
  assert.match(backend, /function englishLabMemoryMatchCreateRoomCS21A180/);
  assert.match(backend, /questions:\[\], question:null, current_question:null/);
  const version = fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8');
  assert.match(version, /STATUS=QA_CANDIDATE_NOT_FINAL/);
  assert.match(version, /APPS_SCRIPT_CHANGE=YES_QA_ONLY_REPLACE_97/);
  assert.match(version, /PRODUCTION_TOUCHED=NO/);

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
  console.log(JSON.stringify({verdict:'APTO_CON_RESERVAS',package:packageName,files:files.length,backend:'CS21A180',authenticatedQa:'PENDING'}, null, 2));
}

if (!verifyOnly) build();
verify();
