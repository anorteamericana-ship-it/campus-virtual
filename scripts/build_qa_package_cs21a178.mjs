#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'dist', 'qa-staging');
const packageName = 'CAMPUS_QA_CS21A178_CANDIDATO_DOS_ESTUDIANTES';
const target = path.join(root, 'dist', packageName);
const verifyOnly = process.argv.includes('--verify');
const sourceHeadSha = process.env.SOURCE_HEAD_SHA || process.env.GITHUB_SHA || 'local-uncommitted';
const testMergeSha = process.env.TEST_MERGE_SHA || process.env.GITHUB_SHA || 'local';
const sourceBranch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || 'fix/cs21a178-audited-student-sync-package';

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function packageFiles() {
  const files = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else if (entry.name !== 'SHA256SUMS.txt') files.push(absolute);
    }
  }
  walk(target);
  return files.sort((a,b) => a.localeCompare(b));
}

function write(relative, content) {
  const destination = path.join(target, relative);
  fs.mkdirSync(path.dirname(destination), {recursive:true});
  fs.writeFileSync(destination, content, 'utf8');
}

function build() {
  assert.equal(fs.existsSync(source), true, 'Primero debe generarse dist/qa-staging.');
  fs.rmSync(target, {recursive:true, force:true});
  fs.cpSync(source, target, {recursive:true});
  fs.rmSync(path.join(target, '.nojekyll'), {force:true});

  const oldLauncher = path.join(target, 'INICIAR_QA_STAGING.cmd');
  const newLauncher = path.join(target, 'ABRIR_CAMPUS_QA_CS21A178.cmd');
  let launcher = fs.readFileSync(oldLauncher, 'utf8').replace(/^\uFEFF/, '');
  launcher = launcher
    .replaceAll('127.0.0.1:4173', '127.0.0.1:4176')
    .replace('node serve.mjs', 'set PORT=4176\r\nnode serve.mjs');
  fs.writeFileSync(newLauncher, launcher, 'utf8');
  fs.rmSync(oldLauncher);

  const serverPath = path.join(target, 'serve.mjs');
  const server = fs.readFileSync(serverPath, 'utf8')
    .replace('process.env.PORT || 4173', 'process.env.PORT || 4176')
    .replace("process.env.PORT || '4173'", "process.env.PORT || '4176'");
  fs.writeFileSync(serverPath, server, 'utf8');

  write('LEEME_PRIMERO_CS21A178.txt', `CAMPUS QA CS21A178 · CANDIDATO DE SINCRONIZACIÓN PARA DOS ESTUDIANTES
=======================================================================

ESTADO REAL
- Este paquete es un CANDIDATO QA. No es una entrega final ni está autorizado para producción.
- El backend QA existente debe seguir en CS21A176, ya verificado con ok:true.
- Este corte no modifica Apps Script, hojas, main ni producción.
- Las pruebas automáticas y dos navegadores simulados pasan.
- La prueba autenticada con docente y dos estudiantes sigue pendiente y es obligatoria.

QUÉ CORRIGE RESPECTO A CS21A177
- El guard de sincronización carga antes del adaptador y antes de la vista del estudiante.
- Las tres piezas usan una versión de caché CS21A178 coherente.
- La auditoría histórica funciona igual en Windows y Linux.
- La entrega distingue evidencia automática, sintética y autenticada.

ABRIR EL FRONTEND QA
1. Cierre cualquier ventana negra de paquetes QA anteriores.
2. Extraiga completamente este ZIP en una carpeta nueva.
3. Ejecute ABRIR_CAMPUS_QA_CS21A178.cmd.
4. Mantenga abierta la ventana negra.
5. Debe abrirse http://127.0.0.1:4176/qa-setup.html
6. Pegue manualmente la misma URL /exec del Apps Script QA.

PRUEBA AUTENTICADA OBLIGATORIA
1. Entre como docente QA y cree una sala NUEVA Memory Match.
2. Use Básico I, Unidad 1, 6 pares y modo Individual.
3. Haga entrar a dos estudiantes QA antes de iniciar la ronda.
4. Inicie la ronda.
5. Ambos estudiantes deben ver el tablero Memory Match inmediatamente.
6. Ninguno debe ver Pregunta, Elegir una opción o Enviar respuesta.
7. Solo el estudiante activo puede tocar tarjetas; el otro debe ver Esperando turno.
8. Un intento debe rotar el turno y conservar el mismo tablero en ambas pantallas.
9. Repita en modo Equipos únicamente después de aprobar Individual.

NO HACER TODAVÍA
- No probar 25 estudiantes antes de aprobar dos.
- No reemplazar 97_ACTUALIZACION_QA.gs.
- No crear otro hotfix de Apps Script.
- No modificar la implementación productiva.
- No fusionar los PR apilados.
`);

  write('ESTADO_VALIDACION_CS21A178.txt', `MATRIZ DE EVIDENCIA CS21A178
================================

ESTÁTICA / CONTRATOS           APROBADO
- Guard antes del adaptador y de la vista.
- Contrato CS21A177 preservado.
- Contrato Memory Match Live preservado.
- Auditoría de archivos retirados portable entre LF y CRLF.

NAVEGADOR SINTÉTICO            APROBADO
- Estudiante 1: escritorio 1440x900.
- Estudiante 2: móvil 390x844.
- Ambos reciben el tablero especializado.
- La pantalla genérica Enviar respuesta no aparece.
- El segundo estudiante ve Esperando turno.

QA AUTENTICADA                 PENDIENTE
- Docente QA real.
- Dos cuentas de estudiante QA reales.
- Apps Script QA CS21A176.
- Sala nueva Individual y luego Equipos.

CAPACIDAD 5 / 10 / 25          NO INICIADA
PRODUCCIÓN                     NO TOCADA
VEREDICTO DE ENTREGA           APTO CON RESERVAS PARA PRUEBA QA DE DOS ESTUDIANTES
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A178.txt', `REGISTRO DE ACEPTACIÓN QA CS21A178
=====================================

Estado inicial: PENDIENTE
Fecha:
Sala nueva:
Docente QA:
Estudiante QA 1:
Estudiante QA 2:

[ ] Ambos ven el tablero Memory Match.
[ ] No aparece Enviar respuesta.
[ ] Solo el jugador activo puede tocar.
[ ] El segundo jugador ve Esperando turno.
[ ] El turno rota después del intento.
[ ] El tablero se mantiene sincronizado.
[ ] Modo Equipos aprobado después de Individual.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Latencias relevantes de window.__ENGLISH_LAB_LIVE_METRICS__:
`);

  write('VERSION.txt', `VERSION=CS21A178
STATUS=QA_CANDIDATE_NOT_FINAL
PURPOSE=Deterministic student sync loader, cross-platform audit and evidence-complete package
BASE_FRONTEND_VERSION=CS21A177
BASE_BACKEND_VERSION=CS21A176
SOURCE_BRANCH=${sourceBranch}
SOURCE_HEAD_SHA=${sourceHeadSha}
TEST_MERGE_SHA=${testMergeSha}
QA_PORT=4176
APPS_SCRIPT_CHANGE=NO
AUTHENTICATED_QA_STATUS=PENDING
PRODUCTION_TOUCHED=NO
`);

  const auditSource = path.join(root, '00_DOCUMENTACION', 'AUDITORIA_INTEGRAL_Y_ENTREGA_CS21A178.md');
  assert.equal(fs.existsSync(auditSource), true, 'Falta el informe canónico CS21A178.');
  fs.copyFileSync(auditSource, path.join(target, 'INFORME_AUDITORIA_CS21A178.md'));

  const sums = packageFiles().map(file => {
    const relative = `./${path.relative(target, file).split(path.sep).join('/')}`;
    return `${sha256(file)}  ${relative}`;
  });
  write('SHA256SUMS.txt', `${sums.join('\n')}\n`);
}

function verify() {
  const required = [
    'ABRIR_CAMPUS_QA_CS21A178.cmd',
    'LEEME_PRIMERO_CS21A178.txt',
    'ESTADO_VALIDACION_CS21A178.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A178.txt',
    'INFORME_AUDITORIA_CS21A178.md',
    'VERSION.txt',
    'SHA256SUMS.txt',
    'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js',
    'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx',
    'src/english_lab_games/memory_match_student_sync_preview_cs21a178.html',
    'src/english_lab_live.jsx',
  ];
  for (const relative of required) {
    assert.equal(fs.existsSync(path.join(target, relative)), true, `Falta ${relative}`);
  }
  assert.equal(fs.existsSync(path.join(target, 'INICIAR_QA_STAGING.cmd')), false);
  assert.equal(fs.existsSync(path.join(target, '.nojekyll')), false);

  const launcher = fs.readFileSync(path.join(target, 'ABRIR_CAMPUS_QA_CS21A178.cmd'), 'utf8');
  assert.match(launcher, /127\.0\.0\.1:4176\/qa-setup\.html/);
  assert.match(launcher, /set PORT=4176/);
  const version = fs.readFileSync(path.join(target, 'VERSION.txt'), 'utf8');
  assert.match(version, /STATUS=QA_CANDIDATE_NOT_FINAL/);
  assert.match(version, /AUTHENTICATED_QA_STATUS=PENDING/);
  const readme = fs.readFileSync(path.join(target, 'LEEME_PRIMERO_CS21A178.txt'), 'utf8');
  assert.doesNotMatch(readme, /AKfycb/i, 'El instructivo no debe publicar la URL QA.');

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
  console.log(JSON.stringify({verdict:'APTO_CON_RESERVAS',package:packageName,files:files.length,authenticatedQa:'PENDING'},null,2));
}

if (!verifyOnly) build();
verify();
