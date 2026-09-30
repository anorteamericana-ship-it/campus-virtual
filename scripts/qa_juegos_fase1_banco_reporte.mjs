// QA juegos fase 1 · reporte de SOLO LECTURA del banco de preguntas de English LAB.
// Analiza el banco local (AP_FLOWS en src/academia_play.jsx) y, opcionalmente, exportaciones CSV de las hojas
// (pestaña PLAY_ITEMS de las bases pedagógicas o ACADEMIA_PLAY_BANK). No edita hojas ni llama a la red.
//
// Uso:
//   node scripts/qa_juegos_fase1_banco_reporte.mjs [--csv PLAY_ITEMS_B1.csv ...] [--out reporte.md] [--json reporte.json]
// Exportar una pestaña como CSV desde Google Sheets: abrir la pestaña → Archivo → Descargar → CSV (solo la hoja actual).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadAcademiaPlay, plain } from './qa_juegos_fase1_modulo.mjs';

const LETTERS = ['A', 'B', 'C', 'D'];
const LIST_LIMIT = 25;

export function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const rows = [];
  let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const header = (rows.shift() || []).map(h => String(h).trim().toUpperCase());
  return rows.filter(r => r.some(v => String(v).trim())).map(r => Object.fromEntries(header.map((h, i) => [h, String(r[i] ?? '').trim()])));
}

// Fila de hoja → ítem normalizado.
export function itemFromSheetRow(o, index) {
  const options = LETTERS.map(l => o['OPTION_' + l] || '');
  const type = String(o.ITEM_TYPE || '').toUpperCase() || (o.MATCH_LEFT || o.MATCH_RIGHT ? 'MATCH' : o.CORRECT_SENTENCE ? 'ORDER' : options.some(Boolean) ? 'MCQ' : '');
  return {
    id: o.PLAY_ITEM_ID || o.ITEM_ID || `fila ${index + 2}`,
    game: o.GAME_ID || '',
    level: o.LEVEL_ID || '',
    unit: o.UNIT_ID || '',
    status: String(o.STATUS || '').toUpperCase(),
    type,
    options,
    correctLetter: String(o.CORRECT_OPTION || '').trim().toUpperCase(),
    matchLeft: o.MATCH_LEFT || '',
    matchRight: o.MATCH_RIGHT || '',
    words: o.WORDS_TO_ORDER || '',
    sentence: o.CORRECT_SENTENCE || '',
  };
}

// Banco local (AP_FLOWS): las preguntas no tienen nivel/unidad estructurados; la tarjeta del juego trae texto libre.
export function itemsFromLocalBank(ap) {
  const flows = plain(ap.AP_FLOWS);
  const games = plain(ap.AP_GAMES);
  const items = [];
  Object.entries(flows).forEach(([gameId, flow]) => {
    const card = games.find(g => g.id === gameId) || {};
    const base = { game: gameId, level: '', unit: '', status: 'LOCAL', cardUnit: card.unit || '', cardLevel: card.level || '' };
    if (flow.kind === 'choice') flow.questions.forEach((q, i) => items.push({ ...base, id: `${gameId}#${i + 1}`, type: 'MCQ', options: q.options.concat(['', '', '', '']).slice(0, 4), correctLetter: LETTERS[q.correct] || String(q.correct) }));
    if (flow.kind === 'match') flow.pairs.forEach((p, i) => items.push({ ...base, id: `${gameId}#${i + 1}`, type: 'MATCH', matchLeft: p.en, matchRight: p.es, options: [] }));
    if (flow.kind === 'order') flow.questions.forEach((q, i) => items.push({ ...base, id: `${gameId}#${i + 1}`, type: 'ORDER', words: q.words.join(' | '), sentence: q.answer.join(' '), options: [] }));
  });
  return items;
}

const norm = v => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?¿¡]+$/g, '');
// Igual que apSplitOrderWords del runner: separa por / | ; , y si no, por espacios.
function splitWords(words, sentence) {
  const raw = String(words || '').trim();
  if (raw) {
    const parts = /[\/|;,]/.test(raw) ? raw.split(/\s*[\/|;,]\s*/g) : raw.split(/\s+/g);
    const clean = parts.map(x => x.trim()).filter(Boolean);
    if (clean.length) return clean;
  }
  return String(sentence || '').trim().split(/\s+/g).filter(Boolean);
}

export function analyze(items) {
  const mcq = items.filter(it => !['MATCH', 'ORDER'].includes(it.type));
  const match = items.filter(it => it.type === 'MATCH');
  const order = items.filter(it => it.type === 'ORDER');
  const positions = { A: 0, B: 0, C: 0, D: 0, invalida: 0 };
  const out = {
    total: items.length,
    byType: {}, byStatus: {}, byLevel: {},
    mcq: mcq.length, positions, positionsByLevel: {},
    invalidCorrect: [], correctPointsToEmpty: [], fewerThan4: [], duplicateOptions: [],
    noLevel: [], noUnit: [], unitLevelMismatch: [],
    matchIncomplete: [], matchDuplicates: [],
    orderNoWords: [], orderAlreadySolved: [], orderUnsolvable: [],
  };
  items.forEach(it => {
    out.byType[it.type || '(vacío)'] = (out.byType[it.type || '(vacío)'] || 0) + 1;
    out.byStatus[it.status || '(vacío)'] = (out.byStatus[it.status || '(vacío)'] || 0) + 1;
    out.byLevel[it.level || '(sin nivel)'] = (out.byLevel[it.level || '(sin nivel)'] || 0) + 1;
    if (!it.level) out.noLevel.push(it.id + (it.cardLevel ? ` (tarjeta: "${it.cardLevel}")` : ''));
    if (!it.unit) out.noUnit.push(it.id + (it.cardUnit ? ` (tarjeta: "${it.cardUnit}")` : ''));
    if (it.level && it.unit && !String(it.unit).toUpperCase().startsWith(String(it.level).toUpperCase() + '-')) out.unitLevelMismatch.push(`${it.id} (${it.level} / ${it.unit})`);
  });
  mcq.forEach(it => {
    const levelKey = it.level || '(sin nivel)';
    const byLevel = out.positionsByLevel[levelKey] || (out.positionsByLevel[levelKey] = { A: 0, B: 0, C: 0, D: 0, invalida: 0 });
    const idx = LETTERS.indexOf(it.correctLetter);
    if (idx < 0) { positions.invalida += 1; byLevel.invalida += 1; out.invalidCorrect.push(`${it.id} ("${it.correctLetter}")`); }
    else { positions[it.correctLetter] += 1; byLevel[it.correctLetter] += 1; if (!it.options[idx]) out.correctPointsToEmpty.push(`${it.id} (${it.correctLetter})`); }
    const filled = it.options.filter(o => String(o).trim()).length;
    if (filled < 4) out.fewerThan4.push(`${it.id} (${filled})`);
    const seen = new Map();
    it.options.filter(o => String(o).trim()).forEach(o => seen.set(norm(o), (seen.get(norm(o)) || 0) + 1));
    const dup = [...seen.entries()].filter(([, n]) => n > 1).map(([t]) => t);
    if (dup.length) out.duplicateOptions.push(`${it.id} ("${dup.join('", "')}")`);
  });
  const matchByGame = {};
  match.forEach(it => {
    if (!it.matchLeft || !it.matchRight) out.matchIncomplete.push(it.id);
    (matchByGame[it.game] || (matchByGame[it.game] = [])).push(it);
  });
  Object.entries(matchByGame).forEach(([game, list]) => {
    ['matchLeft', 'matchRight'].forEach(side => {
      const counts = new Map();
      list.forEach(it => { const k = norm(it[side]); if (k) counts.set(k, (counts.get(k) || 0) + 1); });
      counts.forEach((n, text) => { if (n > 1) out.matchDuplicates.push(`${game}: "${text}" ×${n} (${side === 'matchLeft' ? 'inglés' : 'español'})`); });
    });
  });
  order.forEach(it => {
    const answer = String(it.sentence || '').trim().split(/\s+/g).filter(Boolean);
    const words = splitWords(it.words, it.sentence);
    if (!String(it.words || '').trim()) out.orderNoWords.push(it.id);
    else if (words.join(' ') === answer.join(' ')) out.orderAlreadySolved.push(it.id);
    // El runner compara la frase armada como texto: una ficha puede tener varias palabras ("Costa Rica").
    const tokens = words.join(' ').split(/\s+/g).filter(Boolean);
    if (answer.length && [...tokens].sort().join(' ') !== [...answer].sort().join(' ')) out.orderUnsolvable.push(`${it.id} (palabras en fichas: ${tokens.length}, en la respuesta: ${answer.length})`);
  });
  return out;
}

const pct = (n, total) => total ? `${Math.round((100 * n) / total)}%` : '—';
function list(title, arr, note) {
  if (!arr.length) return [`- ${title}: **0**`];
  const shown = arr.slice(0, LIST_LIMIT).map(x => `  - ${x}`);
  const more = arr.length > LIST_LIMIT ? [`  - … y ${arr.length - LIST_LIMIT} más (lista completa en el JSON)`] : [];
  return [`- ${title}: **${arr.length}**${note ? ' — ' + note : ''}`, ...shown, ...more];
}

export function renderMarkdown(sections) {
  const lines = ['# Reporte del banco de preguntas · English LAB', '', `Generado: ${new Date().toISOString()} · solo lectura (no se editó ninguna hoja).`, ''];
  lines.push('## Resumen', '', '| Fuente | Ítems | Opción múltiple | A | B | C | D | Letra inválida | < 4 opciones | Opciones repetidas | Sin nivel | Sin unidad |', '|---|---|---|---|---|---|---|---|---|---|---|---|');
  sections.forEach(({ name, report: r }) => {
    const p = r.positions;
    lines.push(`| ${name} | ${r.total} | ${r.mcq} | ${p.A} (${pct(p.A, r.mcq)}) | ${p.B} (${pct(p.B, r.mcq)}) | ${p.C} (${pct(p.C, r.mcq)}) | ${p.D} (${pct(p.D, r.mcq)}) | ${p.invalida} | ${r.fewerThan4.length} | ${r.duplicateOptions.length} | ${r.noLevel.length} | ${r.noUnit.length} |`);
  });
  sections.forEach(({ name, file, report: r }) => {
    lines.push('', `## ${name}`, '');
    if (file) lines.push(`Archivo: \`${file}\``, '');
    lines.push(`- Por tipo: ${Object.entries(r.byType).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    lines.push(`- Por estado: ${Object.entries(r.byStatus).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    lines.push(`- Por nivel: ${Object.entries(r.byLevel).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    lines.push('', '### Posición de la respuesta correcta (opción múltiple)', '', '| Nivel | A | B | C | D | Inválida |', '|---|---|---|---|---|---|');
    Object.entries(r.positionsByLevel).forEach(([lvl, p]) => { const t = p.A + p.B + p.C + p.D + p.invalida; lines.push(`| ${lvl} | ${p.A} (${pct(p.A, t)}) | ${p.B} (${pct(p.B, t)}) | ${p.C} (${pct(p.C, t)}) | ${p.D} (${pct(p.D, t)}) | ${p.invalida} |`); });
    lines.push('', '### Hallazgos', '');
    lines.push(...list('Letra correcta vacía o fuera de A–D', r.invalidCorrect, 'el runner la trata como A (apCorrectIndex)'));
    lines.push(...list('Letra correcta apunta a una opción vacía', r.correctPointsToEmpty));
    lines.push(...list('Preguntas con menos de 4 opciones', r.fewerThan4, 'apFlowFromBankGame las descarta sin aviso'));
    lines.push(...list('Preguntas con opciones repetidas', r.duplicateOptions));
    lines.push(...list('Ítems sin nivel', r.noLevel));
    lines.push(...list('Ítems sin unidad', r.noUnit));
    lines.push(...list('Unidad que no corresponde al nivel', r.unitLevelMismatch));
    lines.push(...list('Pareo con lado vacío', r.matchIncomplete));
    lines.push(...list('Pareo con textos repetidos dentro del juego', r.matchDuplicates, 'dos botones iguales hacen ambiguo el par'));
    lines.push(...list('Ordenar sin WORDS_TO_ORDER', r.orderNoWords, 'el runner arma las fichas partiendo la oración correcta (desde fase 1 las mezcla)'));
    lines.push(...list('Ordenar con fichas ya en el orden correcto', r.orderAlreadySolved, 'desde fase 1 el runner las mezcla, pero conviene corregir la fuente'));
    lines.push(...list('Ordenar sin solución (fichas ≠ palabras de la respuesta)', r.orderUnsolvable));
  });
  return lines.join('\n') + '\n';
}

function parseArgs(argv) {
  const args = { csv: [], out: '', json: '' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--csv') args.csv.push(argv[++i]);
    else if (argv[i] === '--out') args.out = argv[++i];
    else if (argv[i] === '--json') args.json = argv[++i];
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { context } = loadAcademiaPlay();
  const sections = [{ name: 'Banco local (AP_FLOWS)', file: 'src/academia_play.jsx', report: analyze(itemsFromLocalBank(context)) }];
  args.csv.forEach(file => {
    const rows = parseCsv(fs.readFileSync(file, 'utf8'));
    sections.push({ name: path.basename(file), file: path.basename(file), report: analyze(rows.map(itemFromSheetRow)) });
  });
  const md = renderMarkdown(sections);
  if (args.out) fs.writeFileSync(args.out, md); else process.stdout.write(md);
  if (args.json) fs.writeFileSync(args.json, JSON.stringify(sections, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main();
