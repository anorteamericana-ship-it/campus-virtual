// QA juegos fase 1 · pruebas unitarias (Node, sin navegador): mezcla de opciones, pareo y reporte del banco.
// Ejecuta el código real de src/academia_play.jsx transpilado con vendor/babel.js.
// Uso: node scripts/qa_juegos_fase1_unitarias.mjs
import fs from 'node:fs';
import { loadAcademiaPlay, plain } from './qa_juegos_fase1_modulo.mjs';
import { parseCsv, itemFromSheetRow, itemsFromLocalBank, analyze } from './qa_juegos_fase1_banco_reporte.mjs';

const ATTEMPTS = 100;
const { context: ap, source } = loadAcademiaPlay();
let failures = 0;

function check(name, ok, detail = '') {
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`);
}

// Generador reproducible (mulberry32) para las pruebas deterministas.
function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sorted = list => [...list].map(String).sort().join('\u0001');

// 1) Existen las funciones nuevas y ya no queda la "mezcla" alfabética ni el cálculo fijo de 58 px.
['apShuffle', 'apShuffleChoiceQuestion', 'apBuildChoiceDeck', 'apBuildMatchDeck', 'apUseAttemptDeck'].forEach(fn => {
  check(`existe ${fn}`, typeof ap[fn] === 'function');
});
check('sin apShuffleStatic (orden alfabético)', !/apShuffleStatic/.test(source));
check('sin cálculo fijo de 58 px en el pareo', !/\*\s*58\b/.test(source));
check('sin preserveAspectRatio="none"', !/preserveAspectRatio="none"/.test(source));
check('el pareo mide con getBoundingClientRect y ResizeObserver', /getBoundingClientRect\(\)/.test(source) && /new ResizeObserver\(/.test(source));

// 2) Fisher-Yates: no muta la entrada, conserva elementos y es reproducible con semilla.
{
  const input = ['a', 'b', 'c', 'd', 'e'];
  const copy = [...input];
  const out = plain(ap.apShuffle(input, seeded(7)));
  check('apShuffle no muta la entrada', input.join() === copy.join());
  check('apShuffle conserva los elementos', sorted(out) === sorted(input));
  check('apShuffle es reproducible con la misma semilla', plain(ap.apShuffle(input, seeded(7))).join() === out.join());
  const counts = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  const rng = seeded(2026);
  const N = 8000;
  for (let i = 0; i < N; i++) plain(ap.apShuffle([0, 1, 2, 3], rng)).forEach((v, pos) => { counts[v][pos] += 1; });
  const min = Math.min(...counts.flat()); const max = Math.max(...counts.flat());
  check('apShuffle uniforme: cada valor cae en cada posición ~25% (±3 pp)', min / N > 0.22 && max / N < 0.28, `min ${(100 * min / N).toFixed(1)}% · max ${(100 * max / N).toFixed(1)}%`);
}

// 3) Cada pregunta de opción múltiple (banco local y forma de banco con todas en A):
//    en 100 intentos la correcta aparece en las 4 posiciones y siempre apunta al texto correcto.
function choiceFlows() {
  const flows = Object.entries(ap.AP_FLOWS).filter(([, f]) => f.kind === 'choice').map(([id, f]) => ({ id, flow: f }));
  const bankItems = ['A', 'A', 'A', 'B', 'D'].map((letter, i) => ({
    play_item_id: 'QA-' + i, item_type: 'MCQ', stem: 'stem ' + i, prompt_es: 'Elige.',
    option_a: 'a' + i, option_b: 'b' + i, option_c: 'c' + i, option_d: 'd' + i, correct_option: letter,
  }));
  flows.push({ id: 'banco(A,A,A,B,D)', flow: ap.apFlowFromBankGame({ game_id: 'QA' }, bankItems) });
  return flows;
}
{
  let questions = 0; let incomplete = []; let wrongText = 0; let changedSet = 0;
  for (const { id, flow } of choiceFlows()) {
    const perQuestion = flow.questions.map(() => [0, 0, 0, 0]);
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const deck = plain(ap.apBuildChoiceDeck(flow));
      deck.forEach((q, qi) => {
        const orig = flow.questions[qi];
        if (q.options[q.correct] !== orig.options[orig.correct]) wrongText += 1;
        if (sorted(q.options) !== sorted(orig.options)) changedSet += 1;
        if (q.correct >= 0) perQuestion[qi][q.correct] += 1;
      });
    }
    perQuestion.forEach((p, qi) => { questions += 1; if (p.some(x => x === 0)) incomplete.push(`${id}#${qi + 1} ${p.join('/')}`); });
  }
  check(`${questions} preguntas × ${ATTEMPTS} intentos: la correcta aparece en A, B, C y D`, !incomplete.length, incomplete.slice(0, 5).join(' | '));
  check('el índice correcto recalculado siempre apunta al texto correcto', wrongText === 0, `${wrongText} errores`);
  check('la mezcla conserva exactamente las mismas opciones', changedSet === 0, `${changedSet} errores`);
}

// 4) Opciones repetidas: el índice correcto se recalcula por posición original, no por texto.
{
  const q = { options: ['same', 'same', 'other', 'x'], correct: 1 };
  let ok = true;
  for (let i = 0; i < 200; i++) {
    const s = plain(ap.apShuffleChoiceQuestion(q));
    if (s.optionOrder[s.correct] !== 1) ok = false;
  }
  check('con opciones repetidas se conserva la opción original correcta', ok);
}

// 5) Pareo: ambas columnas mezcladas, permutaciones válidas y nunca todas alineadas fila a fila.
{
  const pairs = Array.from({ length: 6 }, (_, i) => ({ id: 'p' + i, en: 'en' + i, es: 'es' + i }));
  const leftOrders = new Set(); const rightOrders = new Set();
  let invalid = 0; let aligned = 0; let leftFirstPositions = new Set();
  for (let i = 0; i < ATTEMPTS; i++) {
    const deck = plain(ap.apBuildMatchDeck(pairs));
    if (sorted(deck.left.map(p => p.id)) !== sorted(pairs.map(p => p.id)) || sorted(deck.right.map(p => p.id)) !== sorted(pairs.map(p => p.id))) invalid += 1;
    if (deck.left.every((p, idx) => deck.right[idx].id === p.id)) aligned += 1;
    leftOrders.add(deck.left.map(p => p.id).join()); rightOrders.add(deck.right.map(p => p.id).join());
    leftFirstPositions.add(deck.left.findIndex(p => p.id === 'p0'));
  }
  check('pareo: columnas son permutaciones de los mismos pares', invalid === 0);
  check('pareo: columna de inglés mezclada', leftOrders.size > 50 && leftFirstPositions.size === 6, `${leftOrders.size} órdenes distintos en ${ATTEMPTS}`);
  check('pareo: columna de español mezclada', rightOrders.size > 50, `${rightOrders.size} órdenes distintos en ${ATTEMPTS}`);
  check('pareo: nunca todas las parejas alineadas fila a fila', aligned === 0);
  const two = [{ id: 'a' }, { id: 'b' }];
  let twoAligned = 0;
  for (let i = 0; i < 200; i++) { const d = plain(ap.apBuildMatchDeck(two)); if (d.left[0].id === d.right[0].id) twoAligned += 1; }
  check('pareo de 2: nunca queda cada palabra frente a su pareja', twoAligned === 0);
}

// 6) Reporte del banco: la muestra sintética (qa/juegos_fase1/banco_muestra.csv) da exactamente los conteos esperados.
{
  const rows = parseCsv(fs.readFileSync('qa/juegos_fase1/banco_muestra.csv', 'utf8'));
  check('CSV: comillas con coma y salto de línea se leen como un solo campo', rows.length === 13 && rows[5].OPTION_D === 'Sí, claro' && rows[0].MINI_TEXT_OR_DIALOGUE.includes('\n'));
  const r = analyze(rows.map(itemFromSheetRow));
  const got = {
    mcq: r.mcq, positions: r.positions, invalidCorrect: r.invalidCorrect.length, fewerThan4: r.fewerThan4.length,
    duplicateOptions: r.duplicateOptions.length, noLevel: r.noLevel.length, noUnit: r.noUnit.length, unitLevelMismatch: r.unitLevelMismatch.length,
    matchIncomplete: r.matchIncomplete.length, matchDuplicates: r.matchDuplicates.length,
    orderNoWords: r.orderNoWords.length, orderAlreadySolved: r.orderAlreadySolved.length, orderUnsolvable: r.orderUnsolvable.length,
  };
  const expected = {
    mcq: 7, positions: { A: 3, B: 1, C: 1, D: 1, invalida: 1 }, invalidCorrect: 1, fewerThan4: 1,
    duplicateOptions: 1, noLevel: 1, noUnit: 2, unitLevelMismatch: 1,
    matchIncomplete: 1, matchDuplicates: 1,
    orderNoWords: 1, orderAlreadySolved: 1, orderUnsolvable: 1,
  };
  check('reporte: conteos de la muestra', JSON.stringify(got) === JSON.stringify(expected), JSON.stringify(got));
  const local = analyze(itemsFromLocalBank(ap));
  const localPositions = Object.values(ap.AP_FLOWS).filter(f => f.kind === 'choice').flatMap(f => f.questions.map(q => 'ABCD'[q.correct]));
  check('reporte: banco local cuenta las posiciones tal como están en AP_FLOWS', local.mcq === localPositions.length && local.positions.A === localPositions.filter(x => x === 'A').length, JSON.stringify(local.positions));
  check('reporte: "Costa Rica" como una sola ficha no se marca sin solución', local.orderUnsolvable.length === 0, local.orderUnsolvable.join(' | '));
}

if (process.env.QA_OUT) fs.writeFileSync(process.env.QA_OUT, JSON.stringify({ failures }, null, 2));
console.log(failures ? `\n${failures} FALLA(S)` : '\nTODO OK');
process.exit(failures ? 1 : 0);
