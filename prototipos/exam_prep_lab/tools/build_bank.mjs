// Construye las formas canónicas (A, B) desde el formato de autoría compacto de content/*.src.js.
// Uso: node tools/build_bank.mjs [A|B ...]   → forms/form_<x>.js (navegador) y forms/form_<x>.json (backend)
// El formato de autoría existe para escribir rápido sin perder campos: el constructor completa el
// esquema (fuente, licencia, autoría, estado DRAFT, versión, fechas), numera, ordena y valida.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
globalThis.window = globalThis;
const EPL = require(path.join(root, 'epl_engine.js'));

const CAT = { G: 'GRAMATICA', V: 'VOCABULARIO', I: 'INFERENCIA', E: 'INFO_EXPLICITA', A: 'CONFUSION_AUDITIVA', D: 'DISTRACTOR' };
const IDS = ['a', 'b', 'c', 'd'];
const TODAY = '2026-11-19';
const COMMON = {
  source_type: 'ORIGINAL_IA', source_url: null,
  license: 'Contenido original de Academia Norteamericana. Uso interno del Exam Prep Lab. Sin material de ETS ni de terceros.',
  attribution: 'Academia Norteamericana · Exam Prep Lab', author: 'Claude (IA, Anthropic)', reviewer: null,
  review_status: 'DRAFT', version: 1, created_at: TODAY, updated_at: TODAY
};
const PART_DIR = {
  1: 'Look at the picture and listen to the four statements.',
  2: 'Listen to the question or statement and the three responses.'
};

function loadSrc(form) {
  const ctx = { window: {}, EPL_SRC: {} }; ctx.window.EPL_SRC = ctx.EPL_SRC;
  const files = fs.readdirSync(path.join(root, 'content')).filter(f => f.startsWith(`form_${form.toLowerCase()}_`) && f.endsWith('.src.js')).sort();
  files.forEach(f => vm.runInNewContext(fs.readFileSync(path.join(root, 'content', f), 'utf8'), ctx, { filename: f }));
  return { src: ctx.EPL_SRC[form] || {}, files };
}
const dx = (map, correct, id) => {
  const out = {};
  Object.entries(map || {}).forEach(([k, v]) => {
    const m = /^([GVIEAD]):\s*(.+)$/s.exec(v); if (!m) throw new Error(`${id}: distractor ${k} sin categoría válida: ${v}`);
    out[k] = { cat: CAT[m[1]], why: m[2].trim() };
  });
  return out;
};
const opts = (arr, id) => { if (!Array.isArray(arr) || arr.length < 3) throw new Error(id + ': opciones'); return arr.map((t, i) => ({ id: IDS[i], text: t })); };
const pad = n => String(n).padStart(2, '0');

function build(form) {
  const F = form.toUpperCase(); const { src, files } = loadSrc(F);
  const items = [], groups = [];
  const base = (o) => Object.assign({}, COMMON, { form: F, exam_profile: 'TOEIC_LR_LINEAR_2H' }, o);
  const audio = id => `audio/${F}/${id}.mp3`;

  // Legado: las 36 preguntas del primer prototipo entran a la Forma A con ids nuevos.
  const legacy = F === 'A' ? loadLegacy() : null;

  // Parte 1
  (src.p1 || []).forEach((s, i) => {
    const id = `${F}-P1-${pad(s.n || i + 1)}`;
    const v = s.v || 'US_F';
    items.push(base({ item_id: id, part: 1, skill: 'listening', subskill: s.sk || 'describir fotografía', difficulty: s.d, topic: s.topic,
      image_asset: `img/${F}/${id}.svg`, image_alt: 'Fotografía de práctica (descripción disponible después de responder).', image_desc_after: s.desc,
      audio_asset: audio(id), shuffle: false,
      script: [{ v: 'NARR', t: 'Look at the picture.' }].concat(...s.s.map((t, k) => [{ v, t: `${'ABCD'[k]}. ${t}` }, { gap: k < 3 ? 0.6 : 5 }])),
      options: opts(s.s, id), correct: s.k, explanation: s.ex, distractors: dx(s.dx, s.k, id), confusion: s.cf || [], strategy: s.st || null }));
  });
  // Parte 2
  (src.p2 || []).forEach((s, i) => {
    const id = `${F}-P2-${pad(s.n || i + 1)}`;
    const [qv, qt, qsay] = s.q; const rv = s.r;
    const line = (v, t) => (qsay && t === qt) ? { v, t, say: qsay } : { v, t };
    items.push(base({ item_id: id, part: 2, skill: 'listening', subskill: s.sk || 'pregunta-respuesta', difficulty: s.d, topic: s.topic,
      audio_asset: audio(id), shuffle: false,
      script: [line(qv, qt), { gap: 0.6 }].concat(...s.s.map((t, k) => [{ v: rv, t: `${'ABC'[k]}. ${t}` }, { gap: k < 2 ? 0.5 : 5 }])),
      options: opts(s.s, id), correct: s.k, explanation: s.ex, distractors: dx(s.dx, s.k, id), confusion: s.cf || [], strategy: s.st || null }));
  });
  // Partes 3 y 4 (conjuntos con audio)
  [[3, src.p3 || [], 'conversation'], [4, src.p4 || [], 'talk']].forEach(([part, sets, kind]) => {
    sets.forEach((s, i) => {
      const gid = `${F}-G${part}-${pad(s.n || i + 1)}`;
      const ids = s.qs.map((q, k) => `${gid}-Q${k + 1}`);
      const intro = s.intro || (part === 3 ? (s.graphic ? 'Listen to the following conversation. Then look at the graphic.' : (Object.keys(s.voices).length > 2 ? 'Listen to the following conversation with three speakers.' : 'Listen to the following conversation.'))
        : (s.graphic ? `Listen to the following ${s.kind || 'talk'}. Then look at the graphic.` : `Listen to the following ${s.kind || 'talk'}.`));
      groups.push({ passage_group_id: gid, form: F, part, topic: s.topic, audio_asset: audio(gid), intro, graphic: s.graphic || null,
        script: s.lines.map(([who, t, say]) => Object.assign({ v: s.voices[who], t, who }, say ? { say } : {})), item_ids: ids, vocabulary: s.voc || [] });
      s.qs.forEach((q, k) => items.push(base({ item_id: ids[k], part, skill: 'listening', subskill: q.sk || 'detalle', difficulty: q.d || s.d || 2, topic: s.topic,
        passage_group_id: gid, stem: q.q, options: opts(q.s, ids[k]), correct: q.k, explanation: q.ex, distractors: dx(q.dx, q.k, ids[k]), strategy: q.st || null, shuffle: true })));
    });
  });
  // Parte 5
  (src.p5 || []).forEach((s, i) => {
    const id = `${F}-P5-${pad(s.n || i + 1)}`;
    items.push(base({ item_id: id, part: 5, skill: 'reading', subskill: s.sk, difficulty: s.d, topic: s.topic, stem: s.q, shuffle: true,
      options: opts(s.s, id), correct: s.k, explanation: s.ex, distractors: dx(s.dx, s.k, id), strategy: s.st || null }));
  });
  // Partes 6 y 7
  [[6, src.p6 || []], [7, src.p7 || []]].forEach(([part, sets]) => {
    sets.forEach((s, i) => {
      const gid = `${F}-G${part}-${pad(s.n || i + 1)}`;
      const ids = s.qs.map((q, k) => `${gid}-Q${k + 1}`);
      const ps = s.passages || [s.passage];
      const kind = ps.length === 1 ? 'single' : ps.length === 2 ? 'double' : 'triple';
      const intro = s.intro || (part === 6 ? `Read the following ${ps[0].label || ps[0].kind}.` : `Read the following ${ps.map(p => p.label || p.kind).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`);
      groups.push(Object.assign({ passage_group_id: gid, form: F, part, topic: s.topic, intro, item_ids: ids, vocabulary: s.voc || [], set_kind: part === 7 ? kind : 'text' },
        ps.length === 1 ? { passage: ps[0] } : { passages: ps }));
      s.qs.forEach((q, k) => items.push(base(Object.assign({ item_id: ids[k], part, skill: 'reading', subskill: q.sk || 'detalle', difficulty: q.d || s.d || 2, topic: s.topic,
        passage_group_id: gid, stem: q.q || (part === 6 ? (q.ins ? 'Choose the sentence that best fits the blank.' : 'Choose the best answer for the blank.') : ''), shuffle: true,
        options: opts(q.s, ids[k]), correct: q.k, explanation: q.ex, distractors: dx(q.dx, q.k, ids[k]), strategy: q.st || null }, part === 6 ? { blank: q.b || k + 1 } : {}))));
    });
  });

  if (legacy) mergeLegacy(legacy, items, groups, F, base);
  const order = it => [it.part, it.passage_group_id || it.item_id, it.item_id].join('|');
  items.sort((a, b) => order(a) < order(b) ? -1 : 1);
  groups.sort((a, b) => a.passage_group_id < b.passage_group_id ? -1 : 1);
  const voices = { US_F: { engine: 'kokoro', voice: 'af_heart', lang: 'en-us', label: 'Mujer · EE. UU.' }, US_M: { engine: 'kokoro', voice: 'am_michael', lang: 'en-us', label: 'Hombre · EE. UU.' },
    US_F2: { engine: 'kokoro', voice: 'af_sarah', lang: 'en-us', label: 'Mujer 2 · EE. UU.' }, US_M2: { engine: 'kokoro', voice: 'am_eric', lang: 'en-us', label: 'Hombre 2 · EE. UU.' },
    UK_F: { engine: 'kokoro', voice: 'bf_emma', lang: 'en-gb', label: 'Mujer · Reino Unido' }, UK_M: { engine: 'kokoro', voice: 'bm_george', lang: 'en-gb', label: 'Hombre · Reino Unido' },
    UK_F2: { engine: 'kokoro', voice: 'bf_isabella', lang: 'en-gb', label: 'Mujer 2 · Reino Unido' }, UK_M2: { engine: 'kokoro', voice: 'bm_lewis', lang: 'en-gb', label: 'Hombre 2 · Reino Unido' },
    NARR: { engine: 'kokoro', voice: 'am_adam', lang: 'en-us', label: 'Narrador' } };
  const bank = { bank_id: `EPL-FORM-${F}`, form: F, version: `${F}.1.0-draft`, built_at: new Date().toISOString(), exam_profile: 'TOEIC_LR_LINEAR_2H', sources: files, voices, common: {}, groups, items };
  return bank;
}

function loadLegacy() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'content', 'legacy_demo36.js'), 'utf8'), ctx);
  return ctx.window.EPL_BANK;
}
// Mapa de ids del prototipo v1 → Forma A. Los conjuntos con gráfico van al final de su parte, como en el examen.
const LEGACY_MAP = {
  'P1-01': 'A-P1-01', 'P1-02': 'A-P1-02', 'P2-01': 'A-P2-01', 'P2-02': 'A-P2-02', 'P2-03': 'A-P2-03', 'P2-04': 'A-P2-04',
  'P5-01': 'A-P5-01', 'P5-02': 'A-P5-02', 'P5-03': 'A-P5-03', 'P5-04': 'A-P5-04', 'P5-05': 'A-P5-05', 'P5-06': 'A-P5-06',
  'G-P3-01': 'A-G3-01', 'G-P3-02': 'A-G3-11', 'G-P4-01': 'A-G4-01', 'G-P4-02': 'A-G4-02', 'G-P6-01': 'A-G6-01', 'G-P7-01': 'A-G7-01', 'G-P7-02': 'A-G7-11'
};
function mergeLegacy(L, items, groups, F, base) {
  const gNew = {};
  L.groups.forEach(g => {
    const gid = LEGACY_MAP[g.passage_group_id]; if (!gid) throw new Error('legado sin mapa ' + g.passage_group_id);
    const ids = g.item_ids.map((x, k) => `${gid}-Q${k + 1}`); gNew[g.passage_group_id] = { gid, ids, old: g.item_ids };
    const ng = Object.assign({}, g, { passage_group_id: gid, form: F, item_ids: ids, legacy_id: g.passage_group_id });
    if (g.part === 3 || g.part === 4) { ng.audio_asset = `audio/${F}/${gid}.mp3`; ng.script = g.script.map(l => Object.assign({}, l, { who: l.v })); }
    if (g.part === 7) ng.set_kind = g.passages ? (g.passages.length === 2 ? 'double' : 'triple') : 'single';
    if (g.part === 6) ng.set_kind = 'text';
    groups.push(ng);
  });
  L.items.forEach(it => {
    let id = LEGACY_MAP[it.item_id], gid = null;
    if (it.passage_group_id) { const m = gNew[it.passage_group_id]; gid = m.gid; id = m.ids[m.old.indexOf(it.item_id)]; }
    if (!id) throw new Error('legado sin mapa ' + it.item_id);
    const o = Object.assign({}, it, { item_id: id, legacy_id: it.item_id, form: F, subskill: it.subskill || it.topic });
    if (gid) o.passage_group_id = gid;
    if (it.audio_asset) o.audio_asset = `audio/${F}/${id}.mp3`;
    if (it.image_asset) o.image_asset = `img/${F}/${id}.svg`;
    if (it.part <= 2) o.script = it.script.filter(s => !(s.v === 'NARR' && /^Number/.test(s.t)));
    items.push(base(o));
  });
}

const forms = process.argv.slice(2).length ? process.argv.slice(2) : ['A'];
let failed = false;
for (const f of forms) {
  const bank = build(f);
  const v = EPL.validate(bank, null);
  const dist = {}; bank.items.forEach(i => { dist[i.part] = (dist[i.part] || 0) + 1; });
  fs.writeFileSync(path.join(root, 'forms', `form_${f.toLowerCase()}.json`), JSON.stringify(bank));
  fs.writeFileSync(path.join(root, 'forms', `form_${f.toLowerCase()}.js`), `/* Generado por tools/build_bank.mjs desde content/. No editar a mano. Contenido BORRADOR IA, sin revisión docente. */\nwindow.EPL_FORMS = window.EPL_FORMS || {};\nwindow.EPL_FORMS[${JSON.stringify(f)}] = ${JSON.stringify(bank)};\n`);
  console.log(`Forma ${f}: ${bank.items.length} ítems · ${bank.groups.length} conjuntos · partes ${JSON.stringify(dist)} · errores ${v.errors.length} · advertencias ${v.warnings.length}`);
  v.errors.slice(0, 30).forEach(e => console.log('  ERROR', e.id, e.code, e.msg));
  v.warnings.slice(0, 15).forEach(e => console.log('  aviso', e.id, e.code, e.msg));
  if (v.errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
