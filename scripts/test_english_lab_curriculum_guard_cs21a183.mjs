#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const frontend = fs.readFileSync(path.join(root, 'src', 'english_lab_sentence_order_curriculum_guard_cs21a183.js'), 'utf8');
const polish = fs.readFileSync(path.join(root, 'src', 'english_lab_sentence_order_polish_cs21a183.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'apps_script_patches', '99B_VALIDACION_CURRICULAR_CS21A183.gs'), 'utf8');
const runtime = fs.readFileSync(path.join(root, 'src', 'runtime_config.js'), 'utf8');
const baseFrontend = fs.readFileSync(path.join(root, 'src', 'english_lab_sentence_order_cs21a183.js'), 'utf8');
const baseBackend = fs.readFileSync(path.join(root, 'apps_script_patches', '99_ACTUALIZACION_QA_CS21A183.gs'), 'utf8');
const failures = [];

function check(condition, message) {
  if (condition) console.log(`CS21A183 CURRICULUM OK: ${message}`);
  else {
    failures.push(message);
    console.error(`CS21A183 CURRICULUM FAIL: ${message}`);
  }
}

for (const [name, source] of [
  ['guardia frontend', frontend],
  ['pulido visual', polish],
  ['guardia Apps Script', backend],
  ['runtime_config', runtime],
]) {
  try {
    new Function(source);
    check(true, `${name} conserva sintaxis JavaScript válida`);
  } catch (error) {
    check(false, `${name} compila: ${error.message}`);
  }
}

check(frontend.includes('F98.4-Z6-CS21A183-CURRICULUM'), 'frontend está versionado como guardia curricular');
check(frontend.includes('Tema oficial de la unidad'), 'muestra el tema oficial antes de crear la sala');
check(frontend.includes('curriculum_acknowledged'), 'adjunta confirmación docente explícita');
check(frontend.includes('curriculum_source_loaded'), 'exige haber cargado la fuente curricular');
check(frontend.includes("source_game_id = source.gameId"), 'adjunta el GAME_ID curricular exacto');
check(frontend.includes('source_item_ids = source.itemIds.slice()'), 'adjunta evidencia de ítems fuente');
check(frontend.includes('B1|B2|I1|I2') && frontend.includes('GRAM-02$/'), 'solo acepta GAME_ID GRAM_02 de los cuatro niveles');
check(frontend.includes('Number(option.value || 0) > 5'), 'retira opciones superiores a las cinco oraciones existentes por unidad');
check(frontend.includes("name === 'englishlabsentenceordercreateroom'"), 'bloquea la creación antes de enviar cuando falta evidencia');
check(frontend.includes("name === 'academiaplaybankgetgame'"), 'captura la fuente real devuelta por Apollo');
check(frontend.includes("name === 'englishlabsentenceorderteacherdata'"), 'recibe la matriz curricular oficial');
check(!frontend.includes('QA-STU-') && !frontend.includes('120180140'), 'no contiene excepciones por estudiante');

check(polish.includes('F98.4-Z6-CS21A183-POLISH'), 'pulido visual está versionado');
check(polish.includes("doc.querySelectorAll('.elso183-shell .elso-card')"), 'pulido se limita al contenedor Sentence Order');
check(polish.includes("node.classList.add('elso183-card')"), 'normaliza la clase final al estilo oficial');
check(!polish.includes('fetch') && !polish.includes('APPS_SCRIPT_URL'), 'pulido no modifica solicitudes ni backend');

check(backend.includes("_elive176Rows_('CONFIG_UNIDADES')"), 'backend lee las unidades oficiales de Apollo');
check(backend.includes("_elive176Rows_('ACADEMIA_PLAY_BANK')"), 'backend valida el banco real de juegos');
check(backend.includes("_elso183Upper_(row.TEMPLATE_ID) === 'GRAM_02'"), 'backend limita la fuente a GRAM_02');
check(backend.includes("_elso183Upper_(row.ITEM_TYPE) === 'ORDER'"), 'backend exige ítems ORDER');
check(backend.includes('sourceRows.length !== 5'), 'backend exige cinco ítems por unidad');
check(backend.includes('units.length === 64'), 'verificador exige las 64 unidades del programa');
check(backend.includes('rows.length === 320'), 'verificador exige los 320 ítems GRAM_02');
check(backend.includes('five_items_per_unit:exactFive'), 'verificador reporta cobertura exacta por unidad');
check(backend.includes("CONTENT_SOURCE:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK|GRAM_02'"), 'la sala conserva trazabilidad de la fuente');
check(backend.includes('SENTENCE_ORDER_CURRICULUM_VERIFIED'), 'registra evidencia curricular en la bitácora Live');
check(backend.includes('curriculum_acknowledgement_required:true'), 'verificador confirma la revisión docente');
check(backend.includes('_elso183CurriculumSubmitBase_'), 'envuelve el envío base para reintentos seguros');
check(backend.includes('duplicate_response_preserves_state:true'), 'verificador declara estado completo ante duplicado');
check(backend.includes('englishLabSentenceOrderGetPlayerStateCS21A183(body)'), 'duplicado reconstruye el estado completo del jugador');
check(!backend.includes('QA-STU-') && !backend.includes('120180140'), 'backend no contiene excepciones por usuario');

check(runtime.includes('english_lab_sentence_order_cs21a183.js?v=F98.4Z6CS21A183'), 'runtime mantiene el juego base');
check(runtime.includes('english_lab_sentence_order_curriculum_guard_cs21a183.js?v=F98.4Z6CS21A183CURRICULUM'), 'runtime carga la guardia curricular');
check(runtime.includes('english_lab_sentence_order_polish_cs21a183.js?v=F98.4Z6CS21A183POLISH'), 'runtime carga el pulido visual');
check(runtime.indexOf('english_lab_sentence_order_curriculum_guard_cs21a183.js') > runtime.indexOf('english_lab_sentence_order_cs21a183.js'), 'orden de carga conserva juego antes de guardia');
check(runtime.indexOf('english_lab_sentence_order_polish_cs21a183.js') > runtime.indexOf('english_lab_sentence_order_curriculum_guard_cs21a183.js'), 'pulido carga después de la guardia');
check(baseFrontend.includes("var GAME_CODE = 'SENTENCE_ORDER'"), 'el juego base permanece separado de la guardia');
check(baseBackend.includes("var ELSO183_GAME_CODE = 'SENTENCE_ORDER'"), 'el backend base permanece intacto');

if (failures.length) {
  console.error(JSON.stringify({ok:false,version:'CS21A183-CURRICULUM',failures}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok:true,
  version:'CS21A183-CURRICULUM',
  checks:42,
  curriculum_units_required:64,
  gram_02_items_required:320,
  items_per_unit_required:5,
  sentence_count_limits:'3-5',
  duplicate_response_preserves_state:true,
  visual_polish:'F98.4-Z6-CS21A183-POLISH'
}, null, 2));
