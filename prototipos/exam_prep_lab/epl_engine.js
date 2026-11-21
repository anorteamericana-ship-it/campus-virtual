/* EXAM PREP LAB · motor sin interfaz (se prueba en Node y en el navegador).
 * Contiene: perfiles de examen, validación del banco, selección de sesiones, calificación por id,
 * repaso espaciado, almacenamiento local por estudiante y reportes.
 * No conoce el Campus ni el backend: en la integración, `EPL.store` se reemplaza por el adaptador
 * de Apps Script (ver EXAM_PREP_LAB_ESTADO.md §F).
 */
(function (root) {
  'use strict';
  const EPL = {};

  /* ── Perfiles de examen (configurables; la modalidad contratada está pendiente de confirmar) ── */
  EPL.PROFILES = {
    TOEIC_LR_LINEAR_2H: {
      id: 'TOEIC_LR_LINEAR_2H',
      label: 'TOEIC® Listening and Reading · formato lineal de 2 horas (papel o computadora)',
      confirmed: false,
      sections: [
        { id: 'listening', minutes: 45, parts: [{ part: 1, n: 6, options: 4 }, { part: 2, n: 25, options: 3 }, { part: 3, n: 39, options: 4 }, { part: 4, n: 30, options: 4 }],
          rules: { replay: false, pause: false, transcript: false, navigateBack: false } },
        { id: 'reading', minutes: 75, parts: [{ part: 5, n: 30, options: 4 }, { part: 6, n: 16, options: 4 }, { part: 7, n: 54, options: 4 }],
          rules: { replay: null, pause: false, transcript: false, navigateBack: true } }
      ],
      scale_note: 'Puntaje oficial 10–990 (5–495 por sección). Este laboratorio NO convierte aciertos a esa escala.'
    }
  };
  EPL.PART_NAMES = { 1: 'Photographs', 2: 'Question–Response', 3: 'Conversations', 4: 'Talks', 5: 'Incomplete Sentences', 6: 'Text Completion', 7: 'Reading Comprehension' };
  EPL.PART_SKILL = { 1: 'listening', 2: 'listening', 3: 'listening', 4: 'listening', 5: 'reading', 6: 'reading', 7: 'reading' };
  EPL.CATEGORIES = {
    GRAMATICA: 'Error gramatical', VOCABULARIO: 'Error de vocabulario', INFERENCIA: 'Inferencia incorrecta',
    INFO_EXPLICITA: 'Información explícita omitida', CONFUSION_AUDITIVA: 'Confusión auditiva', DISTRACTOR: 'Cayó en un distractor',
    TIEMPO: 'Manejo del tiempo (sin responder)'
  };
  EPL.PUBLISHABLE = ['APPROVED', 'PUBLISHED'];
  EPL.STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'];

  /* ── Utilidades ── */
  const norm = s => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9$' ]+/g, ' ').replace(/\s+/g, ' ').trim();
  EPL.norm = norm;
  EPL.rng = function (seed) { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  EPL.shuffle = function (arr, rand) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  EPL.uid = p => (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  EPL.dayKey = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };

  /* ── Índice del banco ── */
  EPL.index = function (bank) {
    const items = {}, groups = {};
    (bank.items || []).forEach(it => { items[it.item_id] = Object.assign({}, bank.common || {}, it); });
    (bank.groups || []).forEach(g => { groups[g.passage_group_id] = g; });
    return { bank, items, groups, list: Object.values(items) };
  };

  /* ── Validación del banco ── */
  EPL.validate = function (bank, audio) {
    const out = []; const add = (sev, id, code, msg) => out.push({ sev, id, code, msg });
    const ix = EPL.index(bank); const clips = (audio && audio.clips) || null;
    const profile = EPL.PROFILES[bank.exam_profile];
    if (!profile) add('error', bank.bank_id, 'PERFIL', 'Perfil de examen desconocido: ' + bank.exam_profile);
    const optCount = p => p === 2 ? 3 : 4;
    const seen = {};
    ix.list.forEach(it => {
      const id = it.item_id;
      if (seen[id]) add('error', id, 'ID_DUPLICADO', 'item_id repetido'); seen[id] = 1;
      if (!(it.part >= 1 && it.part <= 7)) add('error', id, 'PARTE', 'Parte inválida');
      if (EPL.PART_SKILL[it.part] !== it.skill) add('error', id, 'HABILIDAD', 'skill no corresponde a la parte');
      const opts = it.options || [];
      if (opts.length !== optCount(it.part)) add('error', id, 'N_OPCIONES', `Parte ${it.part} requiere ${optCount(it.part)} opciones; tiene ${opts.length}`);
      const ids = opts.map(o => o.id); const texts = opts.map(o => norm(o.text));
      if (new Set(ids).size !== ids.length) add('error', id, 'ID_OPCION_DUPLICADO', 'Ids de opción repetidos');
      if (new Set(texts).size !== texts.length) add('error', id, 'OPCION_DUPLICADA', 'Dos opciones con el mismo texto');
      if (texts.some(t => !t)) add('error', id, 'OPCION_VACIA', 'Opción vacía');
      if (!ids.includes(it.correct)) add('error', id, 'CLAVE_INVALIDA', 'La respuesta correcta no existe entre las opciones');
      if (!String(it.explanation || '').trim()) add('error', id, 'SIN_EXPLICACION', 'Falta la explicación');
      ids.filter(x => x !== it.correct).forEach(x => {
        const d = (it.distractors || {})[x];
        if (!d || !String(d.why || '').trim()) add('error', id, 'DISTRACTOR_SIN_EXPLICACION', `Opción ${x} sin explicación`);
        else if (!EPL.CATEGORIES[d.cat]) add('error', id, 'CATEGORIA', `Categoría desconocida en ${x}: ${d.cat}`);
      });
      if ((it.distractors || {})[it.correct]) add('error', id, 'CLAVE_CON_DISTRACTOR', 'La opción correcta tiene explicación de distractor: posible clave mal codificada');
      // Explicación contradictoria: la explicación cita textualmente una opción incorrecta y no la correcta.
      const ex = norm(it.explanation); const right = norm((opts.find(o => o.id === it.correct) || {}).text);
      opts.filter(o => o.id !== it.correct && norm(o.text).length > 12).forEach(o => {
        if (ex.includes(norm(o.text)) && !ex.includes(right)) add('warn', id, 'EXPLICACION_CONTRADICTORIA', `La explicación cita la opción incorrecta “${o.text}”`);
      });
      if (it.part <= 2) {
        if (it.shuffle !== false) add('error', id, 'BARAJADO_ORAL', 'Partes 1–2: las opciones se dicen en el audio; no se pueden barajar');
        const spoken = (it.script || []).filter(s => /^[A-D]\.\s/.test(s.t || ''));
        if (spoken.length !== opts.length) add('error', id, 'AUDIO_OPCIONES', 'El guion no dice todas las opciones');
        spoken.forEach((s, k) => {
          const L = 'ABCD'[k];
          if (!s.t.startsWith(L + '.')) add('error', id, 'AUDIO_ORDEN', `La opción hablada ${k + 1} no empieza con ${L}.`);
          if (norm(s.t.slice(2)) !== norm((opts[k] || {}).text)) add('error', id, 'AUDIO_TEXTO', `El audio de ${L} no coincide con el texto de la opción`);
        });
        if (clips && !clips[id]) add('error', id, 'AUDIO_INEXISTENTE', 'No hay archivo de audio generado');
      }
      if (it.part === 1) {
        if (!it.image_asset) add('error', id, 'IMAGEN', 'Parte 1 sin imagen');
        if (!/^ORIGINAL|^LICENCIADO/.test(String(it.source_type || ''))) add('error', id, 'IMAGEN_LICENCIA', 'Imagen sin origen autorizado declarado');
      }
      if (it.passage_group_id) {
        const g = ix.groups[it.passage_group_id];
        if (!g) add('error', id, 'HUERFANA', 'passage_group_id no existe');
        else {
          if (!(g.item_ids || []).includes(id)) add('error', id, 'HUERFANA', 'El conjunto no lista esta pregunta');
          if (g.part !== it.part) add('error', id, 'PARTE_CONJUNTO', 'La parte del ítem no coincide con la del conjunto');
        }
      } else if (it.part >= 3 && it.part !== 5) add('error', id, 'SIN_CONJUNTO', `Parte ${it.part} requiere conjunto`);
      if (!EPL.STATUSES.includes(it.review_status)) add('error', id, 'ESTADO', 'Estado editorial inválido');
      if (EPL.PUBLISHABLE.includes(it.review_status) && !it.reviewer) add('error', id, 'SIN_REVISOR', 'Publicable sin revisor humano');
      if (/IA/.test(it.source_type || '') && EPL.PUBLISHABLE.includes(it.review_status) && !it.reviewer) add('error', id, 'IA_SIN_REVISION', 'Ítem de IA publicado sin revisión humana');
    });
    Object.values(ix.groups).forEach(g => {
      const n = (g.item_ids || []).length;
      (g.item_ids || []).forEach(iid => { if (!ix.items[iid]) add('error', g.passage_group_id, 'CONJUNTO_INCOMPLETO', `Falta la pregunta ${iid}`); });
      if ((g.part === 3 || g.part === 4) && n !== 3) add('error', g.passage_group_id, 'CONJUNTO_TAMANO', 'Partes 3–4: 3 preguntas por conjunto');
      if (g.part === 6 && n !== 4) add('error', g.passage_group_id, 'CONJUNTO_TAMANO', 'Parte 6: 4 preguntas por texto');
      if (g.part === 7 && (n < 2 || n > 5)) add('error', g.passage_group_id, 'CONJUNTO_TAMANO', 'Parte 7: 2 a 5 preguntas por conjunto');
      if ((g.part === 3 || g.part === 4) && clips && !clips[g.passage_group_id]) add('error', g.passage_group_id, 'AUDIO_INEXISTENTE', 'No hay audio del conjunto');
      if (g.part === 6) {
        const blanks = (JSON.stringify(g.passage || {}).match(/\[\[\d\]\]/g) || []).length;
        if (blanks !== n) add('error', g.passage_group_id, 'ESPACIOS', `El texto tiene ${blanks} espacios y ${n} preguntas`);
      }
    });
    // Barajado: la calificación por id debe ser invariante a cualquier orden de presentación.
    ix.list.filter(it => it.shuffle && (it.options || []).some(o => o.id === it.correct)).forEach(it => {
      const rand = EPL.rng(7);
      for (let t = 0; t < 40; t++) {
        const order = EPL.shuffle(it.options, rand);
        const shownIdx = order.findIndex(o => o.id === it.correct);
        if (!EPL.isCorrect(it, order[shownIdx].id)) { add('error', it.item_id, 'BARAJADO_ALTERA_CLAVE', 'El barajado cambia la respuesta'); break; }
      }
    });
    return { ok: !out.some(x => x.sev === 'error'), errors: out.filter(x => x.sev === 'error'), warnings: out.filter(x => x.sev === 'warn'), checked: ix.list.length, groups: Object.keys(ix.groups).length };
  };

  /* ── Disponibilidad para el simulacro integral ── */
  EPL.readiness = function (bank, profileId) {
    const p = EPL.PROFILES[profileId || bank.exam_profile]; const ix = EPL.index(bank);
    const rows = [];
    p.sections.forEach(s => s.parts.forEach(pp => {
      const all = ix.list.filter(i => i.part === pp.part);
      const pub = all.filter(i => EPL.PUBLISHABLE.includes(i.review_status));
      rows.push({ part: pp.part, need: pp.n, have: all.length, publishable: pub.length });
    }));
    const need = rows.reduce((a, r) => a + r.need, 0), pub = rows.reduce((a, r) => a + Math.min(r.publishable, r.need), 0);
    return { rows, need, publishable: pub, ready: rows.every(r => r.publishable >= r.need) };
  };

  EPL.isCorrect = (item, optionId) => optionId === item.correct;

  /* ── Unidades de presentación: un ítem suelto o un conjunto completo ── */
  EPL.units = function (ix, filter) {
    const used = {}; const units = [];
    ix.list.forEach(it => {
      if (filter && !filter(it)) return;
      if (it.passage_group_id) {
        if (used[it.passage_group_id]) return; used[it.passage_group_id] = 1;
        const g = ix.groups[it.passage_group_id];
        units.push({ kind: 'group', id: g.passage_group_id, part: g.part, item_ids: g.item_ids.slice() });
      } else units.push({ kind: 'item', id: it.item_id, part: it.part, item_ids: [it.item_id] });
    });
    return units;
  };
  EPL.pickUnits = function (units, target, rand) {
    const pool = EPL.shuffle(units, rand); const out = []; let n = 0;
    for (const u of pool) { if (n >= target) break; if (n + u.item_ids.length > target + 2 && n > 0) continue; out.push(u); n += u.item_ids.length; }
    return out.sort((a, b) => a.part - b.part);
  };
  EPL.optionOrder = function (item, shuffleOn, rand) {
    const ids = item.options.map(o => o.id);
    return (shuffleOn && item.shuffle) ? EPL.shuffle(ids, rand) : ids;
  };

  /* ── Repaso espaciado (Leitner): 1, 3, 7, 14, 30 días ── */
  EPL.SRS_DAYS = [1, 3, 7, 14, 30];
  EPL.srsUpdate = function (card, wasCorrect, now) {
    now = now || Date.now();
    const c = Object.assign({ box: 0, reviews: 0, lapses: 0, state: 'PENDIENTE' }, card || {});
    if (wasCorrect) c.box = Math.min(c.box + 1, EPL.SRS_DAYS.length); else { c.box = 0; c.lapses++; }
    c.reviews++; c.last = now;
    c.state = c.box >= 3 ? 'DOMINADO' : c.box > 0 ? 'EN_REPASO' : 'PENDIENTE';
    const days = EPL.SRS_DAYS[Math.max(0, Math.min(c.box, EPL.SRS_DAYS.length - 1))];
    c.due = now + days * 86400000;
    return c;
  };

  /* ── Almacenamiento local por estudiante (solo prototipo) ── */
  EPL.Store = function (backend, studentId) {
    if (!/^[a-z0-9_-]{2,40}$/.test(studentId)) throw new Error('id de estudiante inválido');
    const KEY = 'epl_v1_' + studentId;
    const blank = () => ({ v: 1, student: studentId, attempts: [], answers: [], cards: {}, sessions: [], resume: null, sim: null, diagnostic: null, settings: {} });
    let state;
    try { state = JSON.parse(backend.getItem(KEY) || 'null') || blank(); } catch (_) { state = blank(); state._recovered = true; }
    if (state.v !== 1 || state.student !== studentId) state = blank();
    const save = () => { try { backend.setItem(KEY, JSON.stringify(state)); return true; } catch (_) { return false; } };
    return {
      get state() { return state; },
      save,
      /* Respuesta idempotente: misma (attempt_id, item_id) no se duplica. */
      recordAnswer(a) {
        const key = a.attempt_id + '|' + a.item_id;
        if (state.answers.some(x => x.key === key)) return false;
        state.answers.push(Object.assign({ key, at: Date.now() }, a));
        return save();
      },
      reset() { state = blank(); save(); }
    };
  };

  /* ── Reportes ── */
  EPL.report = function (state, ix) {
    const byPart = {}, byCat = {}, bySkill = { listening: { ok: 0, n: 0 }, reading: { ok: 0, n: 0 } };
    for (let p = 1; p <= 7; p++) byPart[p] = { ok: 0, n: 0 };
    state.answers.forEach(a => {
      const it = ix.items[a.item_id]; if (!it) return;
      byPart[it.part].n++; bySkill[it.skill].n++;
      if (a.correct) { byPart[it.part].ok++; bySkill[it.skill].ok++; } else if (a.category) byCat[a.category] = (byCat[a.category] || 0) + 1;
    });
    const seconds = state.attempts.reduce((s, t) => s + (t.seconds || 0), 0);
    const days = new Set(state.answers.map(a => EPL.dayKey(a.at))).size;
    const dueCards = Object.entries(state.cards).filter(([, c]) => c.state !== 'DOMINADO');
    return { byPart, byCat, bySkill, seconds, days, answered: state.answers.length, attempts: state.attempts.length, pending: dueCards.length };
  };
  EPL.pct = (ok, n) => n ? Math.round((ok / n) * 100) : null;

  EPL.suggest = function (rep, state, ix) {
    if (!state.diagnostic) return { kind: 'diagnostic', text: 'Hacé el diagnóstico breve (12 preguntas) para saber por dónde empezar.' };
    const now = Date.now();
    const due = Object.entries(state.cards).filter(([, c]) => c.state !== 'DOMINADO' && c.due <= now);
    if (due.length) return { kind: 'review', text: `Tenés ${due.length} ${due.length === 1 ? 'error' : 'errores'} para repasar hoy.` };
    let worst = null;
    for (let p = 1; p <= 7; p++) {
      const r = rep.byPart[p]; const avail = ix.list.filter(i => i.part === p).length;
      const score = r.n ? r.ok / r.n : -1; // -1 = sin práctica: prioridad
      if (!worst || score < worst.score) worst = { part: p, score, avail, n: r.n };
    }
    return worst.n ? { kind: 'part', part: worst.part, text: `Tu parte más débil hasta ahora es la ${worst.part} (${EPL.PART_NAMES[worst.part]}): ${EPL.pct(rep.byPart[worst.part].ok, rep.byPart[worst.part].n)} % de aciertos en ${worst.n} respuestas.` }
      : { kind: 'part', part: worst.part, text: `Todavía no practicás la Parte ${worst.part} (${EPL.PART_NAMES[worst.part]}).` };
  };

  EPL.achievements = function (state, ix) {
    const rep = EPL.report(state, ix);
    const partsDone = Object.values(rep.byPart).filter(p => p.n > 0).length;
    const list = [
      { id: 'diag', label: 'Punto de partida', desc: 'Completaste el diagnóstico.', done: !!state.diagnostic },
      { id: 'seven', label: 'Las siete partes', desc: 'Respondiste al menos una pregunta de cada parte.', done: partsDone === 7, progress: `${partsDone}/7` },
      { id: 'days', label: 'Constancia', desc: 'Practicaste en 3 días distintos.', done: rep.days >= 3, progress: `${Math.min(rep.days, 3)}/3` },
      { id: 'review', label: 'Error corregido', desc: 'Respondiste bien en repaso una pregunta que antes fallaste.', done: Object.values(state.cards).some(c => c.box > 0) },
      { id: 'sim', label: 'Bajo reloj', desc: 'Terminaste un simulacro parcial.', done: state.attempts.some(a => a.type === 'sim' && a.status === 'FINALIZADO') }
    ];
    return list;
  };


  /* ── Especificación de una forma completa (composición del formato lineal) ── */
  EPL.FORM_SPEC = {
    parts: { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 },
    sets: { 3: 13, 4: 10, 6: 4 },
    p7: { single: { sets: 10, items: 29, min: 2, max: 4 }, double: { sets: 2, items: 10 }, triple: { sets: 3, items: 15 } },
    graphics: { 3: 3, 4: 2 },
    reading_minutes: 75, listening_minutes_ref: 45
  };
  EPL.DIRECTIONS = {
    P5: 'Part 5. Choose the word or phrase that best completes each sentence.',
    P6: 'Part 6. Read the texts. Choose the best answer for each blank. One question in each text asks you to choose a sentence.',
    P7: 'Part 7. Read the texts and answer the questions. Some questions refer to more than one text.'
  };
  EPL.formCheck = function (bank) {
    const S = EPL.FORM_SPEC, ix = EPL.index(bank), e = [], w = [];
    const byPart = {}; ix.list.forEach(i => { byPart[i.part] = (byPart[i.part] || 0) + 1; });
    Object.entries(S.parts).forEach(([p, n]) => { if ((byPart[p] || 0) !== n) e.push(`Parte ${p}: ${byPart[p] || 0} preguntas; se requieren ${n}`); });
    const total = ix.list.length; if (total !== 200) e.push(`Total ${total}; se requieren 200`);
    const groups = Object.values(ix.groups);
    Object.entries(S.sets).forEach(([p, n]) => { const c = groups.filter(g => g.part === Number(p)).length; if (c !== n) e.push(`Parte ${p}: ${c} conjuntos; se requieren ${n}`); });
    Object.entries(S.graphics).forEach(([p, n]) => { const c = groups.filter(g => g.part === Number(p) && g.graphic).length; if (c < n) e.push(`Parte ${p}: ${c} conjuntos con gráfico; se requieren ${n}`); });
    const p7 = groups.filter(g => g.part === 7);
    ['single', 'double', 'triple'].forEach(k => {
      const gs = p7.filter(g => (g.set_kind || (g.passages ? (g.passages.length === 2 ? 'double' : 'triple') : 'single')) === k);
      const items = gs.reduce((a, g) => a + g.item_ids.length, 0);
      if (gs.length !== S.p7[k].sets || items !== S.p7[k].items) e.push(`Parte 7 ${k}: ${gs.length} conjuntos / ${items} preguntas; se requieren ${S.p7[k].sets} / ${S.p7[k].items}`);
      if (k === 'single') gs.forEach(g => { if (g.item_ids.length < 2 || g.item_ids.length > 4) e.push(`${g.passage_group_id}: texto individual con ${g.item_ids.length} preguntas (2–4)`); });
      else gs.forEach(g => { if (g.item_ids.length !== 5) e.push(`${g.passage_group_id}: conjunto múltiple con ${g.item_ids.length} preguntas (5)`); });
    });
    groups.filter(g => g.part === 6).forEach(g => {
      const ins = g.item_ids.filter(id => /sentence/i.test(ix.items[id].stem || '')).length;
      if (ins !== 1) e.push(`${g.passage_group_id}: ${ins} preguntas de inserción de oración (se requiere 1)`);
    });
    for (let p = 1; p <= 7; p++) {
      const list = ix.list.filter(i => i.part === p); if (!list.length) continue;
      const c = {}; list.forEach(i => { c[i.correct] = (c[i.correct] || 0) + 1; });
      const max = Math.max(...Object.values(c)); if (list.length >= 6 && max / list.length > 0.45) w.push(`Parte ${p}: la letra ${Object.keys(c).find(k => c[k] === max)} es correcta en ${max}/${list.length}`);
    }
    return { ok: !e.length, errors: e, warnings: w, byPart, total };
  };

  /* Simulacro exacto: todas las unidades de la forma (o de una sección), en orden del examen, sin repetir ni completar. */
  EPL.buildSim = function (ix, section) {
    const all = EPL.units(ix).sort((a, b) => a.part - b.part || (a.id < b.id ? -1 : 1));
    const units = all.filter(u => section === 'listening' ? u.part <= 4 : section === 'reading' ? u.part >= 5 : true);
    const n = units.reduce((k, u) => k + u.item_ids.length, 0);
    const need = section === 'full' ? 200 : 100;
    const spec = EPL.FORM_SPEC.parts; const cnt = {}; units.forEach(u => { cnt[u.part] = (cnt[u.part] || 0) + u.item_ids.length; });
    const bad = Object.keys(spec).filter(p => (section === 'listening' ? p <= 4 : section === 'reading' ? p >= 5 : true) && cnt[p] !== spec[p]);
    if (n !== need || bad.length) return { ok: false, error: `La forma no está completa para este simulacro (${n}/${need}; partes ${bad.join(', ') || '—'}).`, n, need };
    const ids = units.flatMap(u => u.item_ids); if (new Set(ids).size !== ids.length) return { ok: false, error: 'Preguntas repetidas en la forma.' };
    const number = {}; ids.forEach((id, k) => { number[id] = (section === 'reading' ? 101 : 1) + k; });
    return { ok: true, units, n, number, reading_minutes: section === 'listening' ? 0 : EPL.FORM_SPEC.reading_minutes, listening_units: units.filter(u => u.part <= 4).length };
  };

  /* Diagnóstico equilibrado: 20 preguntas de las 7 partes, dificultad media, determinístico por forma. */
  EPL.DIAG_PLAN = [[1, 'item', 1], [2, 'item', 3], [3, 'group', 1], [4, 'group', 1], [5, 'item', 4], [6, 'group', 1], [7, 'single2', 1]];
  EPL.diagnosticUnits = function (ix, allow) {
    allow = allow || (() => true);
    const units = EPL.units(ix, it => allow(it));
    const avgD = u => u.item_ids.reduce((s, id) => s + (ix.items[id].difficulty || 2), 0) / u.item_ids.length;
    const pick = []; 
    EPL.DIAG_PLAN.forEach(([part, kind, n]) => {
      let pool = units.filter(u => u.part === part && (kind === 'item' ? u.kind === 'item' : u.kind === 'group'));
      if (kind === 'single2') pool = pool.filter(u => u.item_ids.length === 2 && !(ix.groups[u.id].passages));
      if (kind === 'group4') pool = pool.filter(u => u.kind === 'group' && u.item_ids.length === 4);
      pool.sort((a, b) => Math.abs(avgD(a) - 2) - Math.abs(avgD(b) - 2) || (a.id < b.id ? -1 : 1));
      // reparte temas: no repite el mismo tema dentro de la parte si hay alternativa
      const chosen = [], topics = new Set();
      pool.forEach(u => { const t = ix.items[u.item_ids[0]].topic; if (chosen.length < n && !topics.has(t)) { chosen.push(u); topics.add(t); } });
      pool.forEach(u => { if (chosen.length < n && !chosen.includes(u)) chosen.push(u); });
      pick.push(...chosen);
    });
    return pick;
  };

  /* Repetición entre formas: ids, enunciados, textos, guiones y archivos no pueden duplicarse. */
  EPL.crossFormCheck = function (banks, audio) {
    const e = [], w = []; const seen = { id: {}, stem: {}, passage: {}, script: {}, sha: {} };
    const tok = s => new Set(norm(s).split(' ').filter(x => x.length > 2));
    const jac = (a, b) => { let i = 0; a.forEach(x => { if (b.has(x)) i++; }); return i / (a.size + b.size - i || 1); };
    const stems = [];
    banks.forEach(b => {
      b.items.forEach(it => {
        if (seen.id[it.item_id]) e.push(`id repetido ${it.item_id}`); seen.id[it.item_id] = b.form;
        const optsKey = (it.options || []).map(o => norm(o.text)).join('|');
        const key = norm((it.stem || '') + '||' + optsKey);
        if (key.length > 20) { if (seen.stem[key] && seen.stem[key] !== it.item_id) e.push(`pregunta duplicada ${seen.stem[key]} = ${it.item_id}`); seen.stem[key] = it.item_id; }
        if (it.part === 5) stems.push([it.item_id, tok(it.stem)]);
        if (it.script) { const k = norm(it.script.map(s => s.t || '').join(' ')); if (seen.script[k]) e.push(`guion repetido ${seen.script[k]} = ${it.item_id}`); seen.script[k] = it.item_id; }
      });
      b.groups.forEach(g => {
        const txt = g.script ? g.script.map(s => s.t).join(' ') : JSON.stringify(g.passages || g.passage);
        const k = norm(txt); const map = g.script ? seen.script : seen.passage;
        if (map[k]) e.push(`texto repetido ${map[k]} = ${g.passage_group_id}`); map[k] = g.passage_group_id;
      });
    });
    for (let i = 0; i < stems.length; i++) for (let j = i + 1; j < stems.length; j++) { const s = jac(stems[i][1], stems[j][1]); if (s > 0.75) w.push(`Parte 5 muy parecidas: ${stems[i][0]} ~ ${stems[j][0]} (${Math.round(s * 100)} %)`); }
    if (audio) Object.entries(audio.clips || {}).forEach(([k, c]) => { if (seen.sha[c.sha256]) e.push(`audio idéntico ${seen.sha[c.sha256]} = ${k}`); seen.sha[c.sha256] = k; });
    return { ok: !e.length, errors: e, warnings: w };
  };

  /* SHA-256 sincrónico (UTF-8 → hex). Mismo resultado en Node, navegador y Apps Script. */
  EPL.sha256 = function (str) {
    const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
    const bytes = []; const s = unescape(encodeURIComponent(String(str))); for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    const l = bytes.length * 8; bytes.push(0x80); while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i > 3 ? 0 : (l >>> (i * 8)) & 0xff);
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const r = (x, n) => (x >>> n) | (x << (32 - n)); const w = new Array(64);
    for (let o = 0; o < bytes.length; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = (bytes[o + i * 4] << 24) | (bytes[o + i * 4 + 1] << 16) | (bytes[o + i * 4 + 2] << 8) | bytes[o + i * 4 + 3];
      for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
      let [a, b, c, d, e, f, g, hh] = h;
      for (let i = 0; i < 64; i++) { const S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[i] + w[i]) | 0, S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) | 0; hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0; }
      h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x | 0);
    }
    return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  };

  root.EPL = EPL;
  if (typeof module !== 'undefined') module.exports = EPL;
})(typeof window !== 'undefined' ? window : globalThis);
