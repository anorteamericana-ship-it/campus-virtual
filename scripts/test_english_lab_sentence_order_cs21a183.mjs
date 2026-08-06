#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const frontend = fs.readFileSync(path.join(root, 'src', 'english_lab_sentence_order_cs21a183.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'apps_script_patches', '99_ACTUALIZACION_QA_CS21A183.gs'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'src', 'runtime_config.js'), 'utf8');
const live = fs.readFileSync(path.join(root, 'src', 'english_lab_live.jsx'), 'utf8');
const cleanup = fs.readFileSync(path.join(root, 'src', 'english_lab_visual_cleanup_cs21a182.js'), 'utf8');
const failures = [];
let checks = 0;

function check(condition, message) {
  checks += 1;
  if (condition) console.log(`CS21A183 OK: ${message}`);
  else {
    failures.push(message);
    console.error(`CS21A183 FAIL: ${message}`);
  }
}

try {
  new Function(frontend);
  check(true, 'frontend compila como JavaScript plano');
} catch (error) {
  check(false, `frontend compila: ${error.message}`);
}
try {
  new Function(backend);
  check(true, 'backend compila en JavaScript/V8');
} catch (error) {
  check(false, `backend compila: ${error.message}`);
}
try {
  new Function(runtime);
  check(true, 'runtime conserva sintaxis válida');
} catch (error) {
  check(false, `runtime conserva sintaxis válida: ${error.message}`);
}

check(frontend.includes('F98.4-Z6-CS21A183'), 'frontend versionado CS21A183');
check(backend.includes("ELSO183_VERSION = 'CS21A183'"), 'backend versionado CS21A183');
check(frontend.includes("var GAME_CODE = 'SENTENCE_ORDER'"), 'frontend usa código SENTENCE_ORDER');
check(backend.includes("ELSO183_GAME_CODE = 'SENTENCE_ORDER'"), 'backend usa código SENTENCE_ORDER');
check(frontend.includes("upper(game.template_id || game.TEMPLATE_ID) === 'GRAM_02'"), 'sugerencias provienen del template curricular GRAM_02');
check(frontend.includes("post('academiaPlayBankCatalog'"), 'consulta catálogo real del banco');
check(frontend.includes("post('academiaPlayBankGetGame'"), 'consulta ítems reales del juego');
check(frontend.includes('correct_sentence || item.CORRECT_SENTENCE'), 'lee la oración canónica del banco');
check(frontend.includes('Una oración por línea'), 'editor explica el formato al docente');
check(frontend.includes('3 a 18 palabras') || frontend.includes('3 y 18 palabras'), 'editor documenta límites de longitud');
check(frontend.includes("post('englishLabSentenceOrderCreateRoom'"), 'docente crea sala especializada');
check(
  frontend.includes("roomAction('englishLabSentenceOrderStartRoom')") &&
  frontend.includes('async function roomAction(fn)') &&
  frontend.includes("post(fn, {room_id:roomCode(control.room)}"),
  'docente inicia la actividad mediante el helper de control'
);
check(frontend.includes("roomAction('englishLabSentenceOrderNextSentence')"), 'docente avanza a la siguiente oración');
check(frontend.includes("roomAction('englishLabSentenceOrderCloseRoom')"), 'docente cierra la sala');
check(frontend.includes("post('englishLabSentenceOrderSubmit'"), 'estudiante envía el orden construido');
check(frontend.includes('ordered_token_ids'), 'la respuesta usa identificadores de token y no texto ambiguo');
check(frontend.includes('moveToAnswer') && frontend.includes('moveToPool'), 'las palabras se pueden agregar y retirar');
check(frontend.includes('Usá todas las palabras antes de enviar.'), 'impide respuestas incompletas');
check(frontend.includes('Ranking temporal'), 'muestra ranking de práctica');
check(frontend.includes('wrapTeacher') && frontend.includes('wrapStudent'), 'se integra con ambas vistas lazy oficiales');
check(frontend.includes("data.rooms = data.rooms.filter(function (room) { return !isSentenceRoom(room); })"), 'evita duplicar salas especializadas en el control genérico');
check(frontend.includes('setInterval') && frontend.includes('2600'), 'estado del estudiante usa polling ligero');
check(frontend.includes('3500'), 'control docente usa polling ligero');
check(frontend.includes('@media(max-width:820px)'), 'incluye diseño móvil');
check(backend.includes('function _elso183Sentences_('), 'backend normaliza oraciones editables');
check(backend.includes('words.length < 3 || words.length > 18'), 'backend valida longitud de cada oración');
check(backend.includes("error:'cantidad_oraciones_invalida'"), 'backend rechaza cantidad incorrecta');
check(backend.includes('function _elso183TokenId_('), 'tokens tienen identificadores deterministas no posicionales visibles');
check(backend.includes('function _elso183SameTokenSet_('), 'backend exige usar cada palabra exactamente una vez');
check(backend.includes('function _elso183EqualOrder_('), 'backend valida el orden exacto');
check(backend.includes('SENTENCE_ORDER_ANSWER'), 'backend registra evento de respuesta');
check(backend.includes('ELIVE_ANSWERS_SHEET'), 'respuestas usan la tabla Live existente');
check(backend.includes('POINTS:points'), 'puntaje se guarda en el contrato Live');
check(backend.includes('response.can_answer'), 'estado del estudiante controla respuesta única');
check(backend.includes("fn === 'englishlablivejoinroom' && _elso183IsRoom_(body)"), 'el ingreso estándar detecta salas Sentence Order');
check(backend.includes("fn === 'englishlablivegetplayerstate' && _elso183IsRoom_(body)"), 'el polling estándar detecta salas Sentence Order');
check(backend.includes('sentence_order_live_supported:true'), 'verificador Apps Script cubre el nuevo juego');
check(runtime.includes('english_lab_sentence_order_cs21a183.js?v=F98.4Z6CS21A183'), 'runtime carga CS21A183');
check(runtime.indexOf('english_lab_visual_cleanup_cs21a182.js?v=F98.4Z6CS21A182') < runtime.indexOf('english_lab_sentence_order_cs21a183.js?v=F98.4Z6CS21A183'), 'CS21A183 carga después de la limpieza CS21A182');
check(live.includes("const VERSION = 'F98.4-Z6-CS21A180'"), 'motor Live CS21A180 permanece intacto');
check(cleanup.includes('F98.4-Z6-CS21A182'), 'limpieza CS21A182 permanece incluida');
check(!frontend.includes('PLAY-4821') && !frontend.includes('Camila Otoya'), 'frontend no contiene sala o estudiantes ficticios');
check(!backend.includes('QA-STU-') && !backend.includes('120180140'), 'backend no contiene excepciones por usuario');
check(!backend.includes('official_grade:true'), 'no convierte la actividad en nota oficial');
check(backend.includes('affects_certificates:false') && backend.includes('affects_payments:false'), 'no afecta certificados ni pagos');

if (failures.length) {
  console.error(JSON.stringify({ok:false,version:'CS21A183',checks,failures}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ok:true,version:'CS21A183',checks}, null, 2));
