/* EXAM PREP LAB · núcleo del servidor (una sola implementación para Node, navegador simulado y Apps Script).
 *
 * Reglas que este archivo garantiza (y que qa_server.mjs prueba):
 *  - La identidad SIEMPRE viene de `ctx` (sesión validada por el servidor). Ningún campo del payload decide de quién son los datos.
 *  - La respuesta correcta, las explicaciones y las transcripciones nunca salen antes de cerrar la pregunta (práctica)
 *    o antes de finalizar (simulacros).
 *  - El reloj de Reading vive en el servidor. Respuestas fuera de tiempo se rechazan.
 *  - Escrituras idempotentes: misma (intento, pregunta) actualiza la fila, no la duplica; finalizar dos veces devuelve lo mismo.
 *  - Suspender un acceso no borra historial. Ningún dato académico oficial (F111, notas, ESTATUS, pagos, CONAPE) se toca.
 *  - En entorno PRODUCCION los candidatos solo reciben preguntas PUBLISHED; las demás solo se ven en vista previa interna.
 *
 * Dependencias inyectadas (deps): now, uuid, sha256, forms, searchPeople, usernameExists, hashPassword, verifyPassword, pepper.
 * Base de datos (db): read(table) → filas, upsert(table, pk, row), append(table, row), lock(fn).
 */
(function (root) {
  'use strict';
  const EPL = root.EPL || (typeof require === 'function' ? require('./epl_engine.js') : null);
  const T = { ACCESS: 'CERT_PREP_ACCESS', CAND: 'CERT_CANDIDATES', ACCT: 'CERT_ACCOUNTS', ACTV: 'CERT_ACTIVATIONS', ASSIGN: 'CERT_ASSIGN', EDIT: 'CERT_EDITORS',
    STATUS: 'CERT_ITEM_STATUS', REVIEWS: 'CERT_REVIEWS', ATT: 'CERT_ATTEMPTS', RESP: 'CERT_RESPONSES', SRS: 'CERT_SRS', AUDIT: 'CERT_AUDIT', CONFIG: 'CERT_CONFIG' };
  const PK = { CERT_PREP_ACCESS: 'CANDIDATE_ID', CERT_CANDIDATES: 'CANDIDATE_ID', CERT_ACCOUNTS: 'USUARIO', CERT_ACTIVATIONS: 'TOKEN_HASH', CERT_ASSIGN: 'KEY', CERT_EDITORS: 'USUARIO',
    CERT_ITEM_STATUS: 'ITEM_ID', CERT_ATTEMPTS: 'ATTEMPT_ID', CERT_RESPONSES: 'KEY', CERT_SRS: 'KEY', CERT_CONFIG: 'KEY' };
  const SIM_TYPES = ['sim_listening', 'sim_reading', 'sim_full'];
  const PRACTICE_TYPES = ['practice', 'mini', 'diagnostic', 'review', 'preview'];
  const READING_MIN_PER_ITEM = 0.75; // 75 min / 100 preguntas
  const GRACE_MS = 5000;
  const ACTIVATION_HOURS = 72;
  const CANDIDATE_ROLES = ['student', 'cert_candidate'];

  function create(opts) {
    const db = opts.db, d = opts.deps;
    const now = () => d.now();
    const J = (s, def) => { try { return s ? JSON.parse(s) : def; } catch (_) { return def; } };
    const err = (code, msg) => ({ ok: false, error: code, mensaje: msg || code });
    const audit = (ctx, accion, sujeto, detalle) => db.append(T.AUDIT, { AUDIT_ID: d.uuid(), FECHA: new Date(now()).toISOString(), USUARIO: (ctx && ctx.usuario) || 'publico', ROL: (ctx && ctx.rol) || '', ACCION: accion, SUJETO: sujeto || '', DETALLE: JSON.stringify(detalle || {}).slice(0, 2000) });
    const rows = t => db.read(t);
    const one = (t, k, v) => rows(t).find(r => String(r[k]) === String(v)) || null;
    const put = (t, row) => db.upsert(t, PK[t], row);

    /* ── configuración ── */
    const CONFIG_DEFAULTS = { ENV: 'PRODUCCION', DIAGNOSTIC_FORM: '', DEFAULT_PRACTICE_FORMS: '["B"]', DEFAULT_SIM_FORMS: '["A"]' };
    const cfg = k => { const r = one(T.CONFIG, 'KEY', k); return r ? r.VALUE : (opts.config && k in opts.config ? opts.config[k] : CONFIG_DEFAULTS[k]); };
    const isProd = () => String(cfg('ENV')).toUpperCase() !== 'DEMO';

    /* ── banco: formas + estado editorial vigente ── */
    let _forms = null;
    function forms() {
      if (_forms) return _forms;
      const status = {}; rows(T.STATUS).forEach(r => { status[r.ITEM_ID] = r; });
      _forms = {};
      Object.entries(d.forms() || {}).forEach(([f, bank]) => {
        const b = JSON.parse(JSON.stringify(bank));
        b.items.forEach(it => { const s = status[it.item_id]; if (s) { it.review_status = s.ESTADO; it.reviewer = s.REVISOR || null; } });
        _forms[f] = { bank: b, ix: EPL.index(b) };
      });
      return _forms;
    }
    const itemById = id => { for (const f of Object.values(forms())) if (f.ix.items[id]) return f.ix.items[id]; return null; };
    const groupById = id => { for (const f of Object.values(forms())) if (f.ix.groups[id]) return f.ix.groups[id]; return null; };
    const formOf = id => { const it = itemById(id) || groupById(id); return it ? it.form : null; };
    const visibleForCandidate = it => isProd() ? it.review_status === 'PUBLISHED' : it.review_status !== 'ARCHIVED';

    /* ── identidad ── */
    function roleOf(ctx) { return String((ctx && ctx.rol) || '').toLowerCase(); }
    function requireSession(ctx) { if (!ctx || !ctx.usuario || !ctx.rol) throw { code: 'sesion_requerida' }; }
    function candidateOf(ctx) {
      requireSession(ctx);
      const rol = roleOf(ctx);
      if (!CANDIDATE_ROLES.includes(rol)) throw { code: 'no_es_candidato' };
      let c = null;
      if (rol === 'cert_candidate') { const a = one(T.ACCT, 'USUARIO', ctx.usuario); c = a && one(T.CAND, 'CANDIDATE_ID', a.CANDIDATE_ID); }
      else if (ctx.codigo) c = rows(T.CAND).find(x => String(x.CODIGO) === String(ctx.codigo)) || null;
      if (!c) throw { code: 'sin_acceso', msg: 'No tenés acceso a Exam Prep Lab. La Academia lo habilita individualmente.' };
      return c;
    }
    function accessOf(cid) {
      const a = one(T.ACCESS, 'CANDIDATE_ID', cid);
      if (!a) return null;
      const out = Object.assign({}, a, { forms: J(a.FORMS, []), sim_forms: J(a.SIM_FORMS, []) });
      if (out.ESTADO === 'ACTIVO' && out.HASTA && Date.parse(out.HASTA + 'T23:59:59') < now()) out.ESTADO = 'VENCIDO';
      return out;
    }
    function requireCandidateAccess(ctx) {
      const c = candidateOf(ctx); const a = accessOf(c.CANDIDATE_ID);
      if (!a || a.ESTADO !== 'ACTIVO') throw { code: 'sin_acceso', msg: a && a.ESTADO === 'VENCIDO' ? 'Tu acceso venció. Consultá con la Academia.' : 'Tu acceso a Exam Prep Lab no está activo.' };
      return { c, a };
    }
    const isSuper = ctx => roleOf(ctx) === 'superadmin';
    const isAdmin = ctx => ['admin', 'superadmin'].includes(roleOf(ctx));
    const isEditor = ctx => isSuper(ctx) || !!(ctx && rows(T.EDIT).find(r => r.USUARIO === ctx.usuario && String(r.ACTIVO) !== 'false'));
    const editorRole = ctx => isSuper(ctx) ? 'EDITOR' : ((rows(T.EDIT).find(r => r.USUARIO === ctx.usuario && String(r.ACTIVO) !== 'false') || {}).ROL_EDITORIAL || null);
    const assigned = (ctx, cid) => !!rows(T.ASSIGN).find(r => r.DOCENTE_USUARIO === ctx.usuario && r.CANDIDATE_ID === cid && String(r.ACTIVO) !== 'false');

    /* ── selección de unidades ── */
    function unitsOf(f, filter) { return EPL.units(forms()[f].ix, filter); }
    function seenItems(cid) { const s = new Set(); rows(T.RESP).forEach(r => { if (r.CANDIDATE_ID === cid && r.MODO !== 'preview') s.add(r.ITEM_ID); }); return s; }
    function exposure(cid, f) { const seen = seenItems(cid); const list = forms()[f] ? forms()[f].ix.list : []; return { form: f, seen: list.filter(i => seen.has(i.item_id)).length, total: list.length }; }
    function rngFor(s) { return EPL.rng(parseInt(d.sha256(String(s)).slice(0, 8), 16)); }

    function buildUnits(tipo, p, cid, a, preview) {
      const fs = forms();
      const allow = it => preview ? it.review_status !== 'ARCHIVED' : visibleForCandidate(it);
      if (SIM_TYPES.includes(tipo) || tipo === 'preview_sim') {
        const f = p.form; if (!fs[f]) throw { code: 'forma_inexistente' };
        if (!preview && !a.sim_forms.includes(f)) throw { code: 'forma_no_autorizada', msg: 'Esta forma no está habilitada para simulacro en tu acceso.' };
        const sec = tipo === 'sim_listening' ? 'listening' : tipo === 'sim_reading' ? 'reading' : 'full';
        const plan = EPL.buildSim(fs[f].ix, sec);
        if (!plan.ok) throw { code: 'simulacro_incompleto', msg: plan.error };
        if (plan.units.some(u => u.item_ids.some(id => !allow(fs[f].ix.items[id])))) throw { code: 'material_no_publicado', msg: 'Esta forma todavía no tiene todas sus preguntas publicadas.' };
        return { form: f, units: plan.units, plan };
      }
      if (tipo === 'diagnostic') {
        const f = cfg('DIAGNOSTIC_FORM') || (preview ? 'A' : a.forms[0]); if (!fs[f]) throw { code: 'forma_inexistente' };
        const units = EPL.diagnosticUnits(fs[f].ix, allow);
        if (!units.length) throw { code: 'sin_material', msg: 'Todavía no hay material publicado para el diagnóstico.' };
        return { form: f, units };
      }
      const formsAllowed = preview ? Object.keys(fs) : a.forms;
      const seen = cid ? seenItems(cid) : new Set();
      const rand = rngFor(d.uuid());
      if (tipo === 'review') {
        const due = rows(T.SRS).filter(r => r.CANDIDATE_ID === cid && r.ESTADO !== 'DOMINADO' && (!p.only_due || Number(r.DUE) <= now())).map(r => r.ITEM_ID);
        const out = [], used = {};
        due.forEach(id => { const it = itemById(id); if (!it || !allow(it)) return; const gid = it.passage_group_id || id; if (used[gid]) return; used[gid] = 1;
          out.push(it.passage_group_id ? Object.assign(unitOfGroup(groupById(gid))) : { kind: 'item', id, part: it.part, item_ids: [id] }); });
        if (!out.length) throw { code: 'sin_repasos', msg: 'No tenés errores pendientes de repaso.' };
        return { form: null, units: out.sort((x, y) => x.part - y.part).slice(0, 15) };
      }
      let pool = [];
      formsAllowed.forEach(f => { if (!fs[f]) return; pool = pool.concat(unitsOf(f, it => allow(it) && (tipo === 'mini' ? [2, 5].includes(it.part) : (!p.part || it.part === Number(p.part))) && (!p.difficulty || it.difficulty === Number(p.difficulty)) && (!p.topic || it.topic === p.topic))); });
      if (!pool.length) throw { code: 'sin_material', msg: 'No hay preguntas disponibles con esos filtros.' };
      const unseen = pool.filter(u => u.item_ids.every(id => !seen.has(id)));
      const size = tipo === 'mini' ? 5 : Math.min(Math.max(Number(p.size) || 5, 1), 15);
      let picked = EPL.pickUnits(unseen.length ? unseen : pool, size, rand);
      if (unseen.length && picked.reduce((n, u) => n + u.item_ids.length, 0) < size) {
        const more = EPL.pickUnits(pool.filter(u => !picked.includes(u)), size - picked.reduce((n, u) => n + u.item_ids.length, 0), rand);
        picked = picked.concat(more).sort((x, y) => x.part - y.part);
      }
      return { form: null, units: picked, repeated: !unseen.length };
    }
    const unitOfGroup = g => ({ kind: 'group', id: g.passage_group_id, part: g.part, item_ids: g.item_ids.slice() });

    /* ── vista del estudiante: nada que revele la respuesta ── */
    function publicUnit(u, order, preview) {
      const g = u.kind === 'group' ? groupById(u.id) : null;
      const items = u.item_ids.map(id => itemById(id));
      const first = items[0];
      const out = { unit_id: u.id, kind: u.kind, part: u.part, form: formOf(u.id), intro: g ? g.intro : null, draft: items.some(i => i.review_status !== 'PUBLISHED') };
      if (u.part <= 4) out.audio = u.kind === 'group' ? g.audio_asset : first.audio_asset;
      if (u.part === 1) out.image = first.image_asset;
      if (g && g.graphic) out.graphic = g.graphic;
      if (g && (u.part === 6 || u.part === 7)) { out.passages = g.passages || [g.passage]; out.set_kind = g.set_kind || null; }
      out.items = items.map(it => ({ item_id: it.item_id, part: it.part, stem: it.part <= 2 ? null : it.stem, blank: it.blank || null, subskill: preview ? it.subskill : undefined,
        options: (order[it.item_id] || it.options.map(o => o.id)).map(id => it.part <= 2 ? { id } : { id, text: it.options.find(o => o.id === id).text }) }));
      return out;
    }
    function feedbackUnit(u, answers) {
      const g = u.kind === 'group' ? groupById(u.id) : null;
      const items = u.item_ids.map(id => itemById(id));
      return { unit_id: u.id, transcript: (g ? g.script : items[0].script || null), vocabulary: g ? (g.vocabulary || []) : [], image_desc: items[0].image_desc_after || null,
        items: items.map(it => { const ans = answers[it.item_id] || {}; return { item_id: it.item_id, chosen: ans.opt || null, correct: it.correct, ok: ans.opt === it.correct,
          category: ans.opt && ans.opt !== it.correct ? ((it.distractors || {})[ans.opt] || {}).cat || null : (ans.state === 'INTERRUMPIDA' ? null : ans.opt ? null : ans.timeout ? 'TIEMPO' : null),
          state: ans.state || null, options: it.options, explanation: it.explanation, distractors: it.distractors, strategy: it.strategy || null, confusion: it.confusion || [], subskill: it.subskill, stem: it.stem || null }; }) };
    }

    /* ── intentos ── */
    function attemptRow(id) { const r = one(T.ATT, 'ATTEMPT_ID', id); if (!r) throw { code: 'intento_inexistente' }; return r; }
    function ownAttempt(ctx, id) {
      const r = attemptRow(id);
      if (r.TIPO === 'preview' || r.TIPO === 'preview_sim') { if (r.CANDIDATE_ID !== 'STAFF:' + ctx.usuario) throw { code: 'no_autorizado' }; return r; }
      const { c } = requireCandidateAccess(ctx);
      if (r.CANDIDATE_ID !== c.CANDIDATE_ID) throw { code: 'no_autorizado', msg: 'Ese intento no es tuyo.' };
      return r;
    }
    function answersOf(id) { const m = {}; rows(T.RESP).forEach(r => { if (r.ATTEMPT_ID === id) m[r.ITEM_ID] = { opt: r.OPCION || null, state: r.ESTADO, correct: r.CORRECTA === true || r.CORRECTA === 'true', category: r.CATEGORIA || null, timeout: r.ESTADO === 'FUERA_DE_TIEMPO' }; }); return m; }
    function deadlineOf(r) { return Number(r.READING_DEADLINE) || null; }
    function sectionOfIndex(units, idx) { return units[idx] && units[idx].part <= 4 ? 'listening' : 'reading'; }

    function viewAttempt(r) {
      const units = J(r.UNITS_JSON, []), order = J(r.ORDER_JSON, {}), revealed = J(r.REVEALED_JSON, {}), ans = answersOf(r.ATTEMPT_ID);
      const preview = r.TIPO.startsWith('preview');
      return { ok: true, attempt: { attempt_id: r.ATTEMPT_ID, tipo: r.TIPO, form: r.FORM || null, title: r.TITULO, estado: r.ESTADO, created: Number(r.CREADO),
        listening_cursor: Number(r.LISTENING_CURSOR || 0), cursor_started: r.CURSOR_STARTED === true || r.CURSOR_STARTED === 'true', reading_started: Number(r.READING_STARTED) || null, reading_deadline: deadlineOf(r),
        reading_minutes: Number(r.READING_MIN) || null, server_now: now(), total_items: units.reduce((n, u) => n + u.item_ids.length, 0),
        units: units.map(u => publicUnit(u, order, preview)), answers: Object.fromEntries(Object.entries(ans).map(([k, v]) => [k, { opt: v.opt, state: v.state }])),
        feedback: Object.keys(revealed).map(uid => feedbackUnit(units.find(u => u.id === uid), ans)) } };
    }

    function start(ctx, p) {
      const tipo = String(p.tipo || '');
      const preview = tipo === 'preview' || tipo === 'preview_sim';
      let cid, a;
      if (preview) { if (!isEditor(ctx)) throw { code: 'no_autorizado' }; cid = 'STAFF:' + ctx.usuario; a = null; }
      else { const r = requireCandidateAccess(ctx); cid = r.c.CANDIDATE_ID; a = r.a; }
      if (![...SIM_TYPES, ...PRACTICE_TYPES, 'preview_sim'].includes(tipo)) throw { code: 'tipo_invalido' };
      return db.lock(() => {
        if (!preview) {
          const open = rows(T.ATT).find(x => x.CANDIDATE_ID === cid && x.ESTADO === 'EN_CURSO' && SIM_TYPES.includes(x.TIPO));
          if (open && SIM_TYPES.includes(tipo)) throw { code: 'simulacro_en_curso', msg: 'Ya tenés un simulacro en curso. Terminalo antes de iniciar otro.', attempt_id: open.ATTEMPT_ID };
        }
        const sel = buildUnits(preview && p.form && p.sim ? 'preview_sim' : (preview ? (p.subtipo || 'practice') : tipo), p, preview ? null : cid, a, preview);
        const id = 'EPL-' + d.uuid();
        const rand = rngFor(id);
        const order = {};
        const shuffle = !SIM_TYPES.includes(tipo) && !(preview && p.sim);
        sel.units.forEach(u => u.item_ids.forEach(iid => { order[iid] = EPL.optionOrder(itemById(iid), shuffle, rand); }));
        const n = sel.units.reduce((k, u) => k + u.item_ids.length, 0);
        const readingN = sel.units.filter(u => u.part >= 5).reduce((k, u) => k + u.item_ids.length, 0);
        const titles = { practice: p.part ? `Parte ${p.part} · ${EPL.PART_NAMES[p.part]}` : 'Práctica', mini: 'Mini-reto mixto', diagnostic: 'Diagnóstico equilibrado', review: 'Repaso de errores',
          sim_listening: `Simulacro parcial · Listening · Forma ${sel.form}`, sim_reading: `Simulacro parcial · Reading · Forma ${sel.form}`, sim_full: `Simulacro integral · Forma ${sel.form}`, preview: 'Vista previa interna', preview_sim: 'Vista previa interna de simulacro' };
        const readingMin = tipo === 'sim_full' ? 75 : tipo === 'sim_reading' ? Math.ceil(readingN * READING_MIN_PER_ITEM) : null;
        const row = { ATTEMPT_ID: id, CANDIDATE_ID: cid, TIPO: preview && p.sim ? 'preview_sim' : tipo, FORM: sel.form || '', TITULO: `${titles[tipo] || tipo} (${n} preguntas)`, ESTADO: 'EN_CURSO', CREADO: now(),
          UNITS_JSON: JSON.stringify(sel.units), ORDER_JSON: JSON.stringify(order), REVEALED_JSON: '{}', LISTENING_CURSOR: 0, CURSOR_STARTED: false,
          READING_MIN: readingMin || '', READING_STARTED: tipo === 'sim_reading' ? now() : '', READING_DEADLINE: tipo === 'sim_reading' ? now() + readingMin * 60000 : '', BANK_VERSION: sel.form ? forms()[sel.form].bank.version : 'mixta', REPETIDAS: sel.repeated ? 'true' : '' };
        put(T.ATT, row);
        if (!preview) audit(ctx, 'START', id, { tipo, form: sel.form, n });
        const v = viewAttempt(row); if (sel.repeated) v.notice = 'Ya respondiste todas las preguntas disponibles con estos filtros: esta sesión repite material.';
        return v;
      });
    }

    function checkTime(r) {
      const dl = deadlineOf(r);
      if (dl && now() > dl + GRACE_MS && r.ESTADO === 'EN_CURSO') { finishInternal(r, true); return false; }
      return true;
    }
    function answer(ctx, p) {
      return db.lock(() => {
        const r = ownAttempt(ctx, p.attempt_id);
        if (r.ESTADO !== 'EN_CURSO') throw { code: 'intento_cerrado' };
        if (!checkTime(r)) throw { code: 'tiempo_agotado', msg: 'Se terminó el tiempo de Reading. El simulacro se cerró.' };
        const units = J(r.UNITS_JSON, []); const idx = units.findIndex(u => u.item_ids.includes(p.item_id));
        if (idx < 0) throw { code: 'pregunta_ajena', msg: 'La pregunta no pertenece a este intento.' };
        const it = itemById(p.item_id); if (!it.options.some(o => o.id === p.option)) throw { code: 'opcion_invalida' };
        if (J(r.REVEALED_JSON, {})[units[idx].id]) throw { code: 'unidad_revisada', msg: 'Esta pregunta ya fue revisada.' };
        if (SIM_TYPES.includes(r.TIPO) || r.TIPO === 'preview_sim') {
          const sec = sectionOfIndex(units, idx);
          if (sec === 'listening') {
            if (r.TIPO !== 'sim_full' && r.TIPO !== 'sim_listening' && r.TIPO !== 'preview_sim') throw { code: 'seccion_invalida' };
            if (Number(r.READING_STARTED)) throw { code: 'listening_cerrado', msg: 'Listening ya terminó.' };
            const cur = Number(r.LISTENING_CURSOR || 0);
            const lateOk = idx === cur - 1 && now() - Number(r.CURSOR_AT || 0) < GRACE_MS;
            if (idx !== cur && !lateOk) throw { code: 'fuera_de_turno', msg: 'Solo se puede responder la pregunta del audio en curso.' };
            const prev = answersOf(r.ATTEMPT_ID)[p.item_id]; if (prev && prev.state === 'INTERRUMPIDA') throw { code: 'interrumpida' };
          } else if (r.TIPO === 'sim_full' && !Number(r.READING_STARTED)) throw { code: 'reading_no_iniciado' };
        }
        const key = r.ATTEMPT_ID + '|' + p.item_id;
        put(T.RESP, { KEY: key, ATTEMPT_ID: r.ATTEMPT_ID, CANDIDATE_ID: r.CANDIDATE_ID, ITEM_ID: p.item_id, OPCION: p.option, CORRECTA: '', CATEGORIA: '', MODO: r.TIPO, GUARDADA: now(), ESTADO: 'GUARDADA' });
        return { ok: true, saved: p.item_id, server_now: now() };
      });
    }

    function cursor(ctx, p) {
      return db.lock(() => {
        const r = ownAttempt(ctx, p.attempt_id);
        if (r.ESTADO !== 'EN_CURSO') throw { code: 'intento_cerrado' };
        const units = J(r.UNITS_JSON, []); const cur = Number(r.LISTENING_CURSOR || 0); const k = Number(p.index);
        const started = r.CURSOR_STARTED === true || r.CURSOR_STARTED === 'true';
        if (p.interrupted) {
          // El audio de la unidad en curso se cortó (recarga, falla): sus preguntas quedan INTERRUMPIDAS y no cuentan.
          if (k !== cur) throw { code: 'cursor_invalido' };
          units[k].item_ids.forEach(id => put(T.RESP, { KEY: r.ATTEMPT_ID + '|' + id, ATTEMPT_ID: r.ATTEMPT_ID, CANDIDATE_ID: r.CANDIDATE_ID, ITEM_ID: id, OPCION: (answersOf(r.ATTEMPT_ID)[id] || {}).opt || '', CORRECTA: '', CATEGORIA: '', MODO: r.TIPO, GUARDADA: now(), ESTADO: 'INTERRUMPIDA' }));
          r.LISTENING_CURSOR = k + 1; r.CURSOR_STARTED = false; r.CURSOR_AT = now(); put(T.ATT, r);
          return { ok: true, listening_cursor: k + 1 };
        }
        if (!(k === cur && !started) && !(k === cur + 1)) throw { code: 'cursor_invalido', msg: 'El audio solo avanza; no se repite.' };
        if (sectionOfIndex(units, k) !== 'listening') throw { code: 'cursor_invalido' };
        r.LISTENING_CURSOR = k; r.CURSOR_STARTED = true; r.CURSOR_AT = now(); put(T.ATT, r);
        return { ok: true, listening_cursor: k };
      });
    }
    function startReading(ctx, p) {
      return db.lock(() => {
        const r = ownAttempt(ctx, p.attempt_id);
        if (r.ESTADO !== 'EN_CURSO') throw { code: 'intento_cerrado' };
        if (r.TIPO !== 'sim_full' && r.TIPO !== 'preview_sim') throw { code: 'seccion_invalida' };
        if (!Number(r.READING_STARTED)) { r.READING_STARTED = now(); r.READING_DEADLINE = now() + Number(r.READING_MIN || 75) * 60000; r.CURSOR_STARTED = false; put(T.ATT, r); }
        return viewAttempt(r);
      });
    }

    function gradeItems(r, ids, timeout) {
      const ans = answersOf(r.ATTEMPT_ID); const cid = r.CANDIDATE_ID; const counted = !r.TIPO.startsWith('preview');
      ids.forEach(id => {
        const it = itemById(id); const a = ans[id] || {};
        if (a.state === 'INTERRUMPIDA') return;
        const ok = a.opt === it.correct;
        const cat = ok ? '' : a.opt ? (((it.distractors || {})[a.opt] || {}).cat || '') : (timeout ? 'TIEMPO' : 'SIN_RESPUESTA');
        put(T.RESP, { KEY: r.ATTEMPT_ID + '|' + id, ATTEMPT_ID: r.ATTEMPT_ID, CANDIDATE_ID: cid, ITEM_ID: id, OPCION: a.opt || '', CORRECTA: ok, CATEGORIA: cat, MODO: r.TIPO, GUARDADA: now(), ESTADO: a.opt ? 'CALIFICADA' : (timeout ? 'FUERA_DE_TIEMPO' : 'SIN_RESPUESTA') });
        if (!counted) return;
        const sk = cid + '|' + id; const prev = one(T.SRS, 'KEY', sk);
        const card = prev ? { box: Number(prev.BOX), reviews: Number(prev.REVIEWS), lapses: Number(prev.LAPSES), state: prev.ESTADO, due: Number(prev.DUE) } : null;
        let next = null;
        if (!ok) next = EPL.srsUpdate(card, false, now());
        else if (card && card.state !== 'DOMINADO') next = EPL.srsUpdate(card, true, now());
        if (next) put(T.SRS, { KEY: sk, CANDIDATE_ID: cid, ITEM_ID: id, BOX: next.box, DUE: next.due, ESTADO: next.state, REVIEWS: next.reviews, LAPSES: next.lapses, LAST: now() });
      });
    }
    function reveal(ctx, p) {
      return db.lock(() => {
        const r = ownAttempt(ctx, p.attempt_id);
        if (SIM_TYPES.includes(r.TIPO) || r.TIPO === 'preview_sim') throw { code: 'no_permitido_en_simulacro', msg: 'En simulacro las respuestas se muestran al final.' };
        if (r.ESTADO !== 'EN_CURSO') throw { code: 'intento_cerrado' };
        const units = J(r.UNITS_JSON, []); const u = units.find(x => x.id === p.unit_id); if (!u) throw { code: 'unidad_ajena' };
        const revealed = J(r.REVEALED_JSON, {});
        if (!revealed[u.id]) {
          const ans = answersOf(r.ATTEMPT_ID);
          if (u.item_ids.some(id => !ans[id] || !ans[id].opt)) throw { code: 'faltan_respuestas', msg: 'Respondé todas las preguntas de esta unidad antes de revisar.' };
          gradeItems(r, u.item_ids, false);
          revealed[u.id] = now(); r.REVEALED_JSON = JSON.stringify(revealed); put(T.ATT, r);
        }
        return { ok: true, feedback: feedbackUnit(u, answersOf(r.ATTEMPT_ID)) };
      });
    }
    function skip(ctx, p) {
      return db.lock(() => {
        const r = ownAttempt(ctx, p.attempt_id);
        if (SIM_TYPES.includes(r.TIPO)) throw { code: 'no_permitido_en_simulacro' };
        const units = J(r.UNITS_JSON, []).filter(u => u.id !== p.unit_id);
        r.UNITS_JSON = JSON.stringify(units); put(T.ATT, r);
        audit(ctx, 'SKIP_UNIT', r.ATTEMPT_ID, { unit: p.unit_id, motivo: String(p.motivo || '').slice(0, 80) });
        return viewAttempt(r);
      });
    }

    function summarize(r, ids) {
      const ans = answersOf(r.ATTEMPT_ID); const s = { n: 0, ok: 0, unanswered: 0, interrupted: 0, byPart: {}, bySkill: {}, bySubskill: {}, byCat: {} };
      ids.forEach(id => {
        const it = itemById(id); const a = ans[id] || {};
        if (a.state === 'INTERRUMPIDA') { s.interrupted++; return; }
        s.n++; const ok = a.correct === true;
        if (ok) s.ok++; if (!a.opt) s.unanswered++;
        [['byPart', it.part], ['bySkill', it.skill], ['bySubskill', it.subskill || it.topic]].forEach(([k, v]) => { s[k][v] = s[k][v] || { ok: 0, n: 0 }; s[k][v].n++; if (ok) s[k][v].ok++; });
        if (!ok && a.category && a.category !== 'SIN_RESPUESTA') s.byCat[a.category] = (s.byCat[a.category] || 0) + 1;
      });
      return s;
    }
    function finishInternal(r, timeout) {
      if (r.ESTADO === 'FINALIZADO') return J(r.RESULT_JSON, null);
      const units = J(r.UNITS_JSON, []); const revealed = J(r.REVEALED_JSON, {});
      const pending = units.filter(u => !revealed[u.id]).flatMap(u => u.item_ids);
      const isSim = SIM_TYPES.includes(r.TIPO) || r.TIPO === 'preview_sim';
      if (isSim) gradeItems(r, pending, true);
      else {
        // En práctica, lo no revisado no se califica: queda fuera del resultado.
        const ans = answersOf(r.ATTEMPT_ID); pending.forEach(id => { if (ans[id]) put(T.RESP, Object.assign(one(T.RESP, 'KEY', r.ATTEMPT_ID + '|' + id), { ESTADO: 'NO_REVISADA' })); });
      }
      const counted = isSim ? units.flatMap(u => u.item_ids) : units.filter(u => revealed[u.id]).flatMap(u => u.item_ids);
      const sum = summarize(r, counted);
      const fin = Math.min(now(), deadlineOf(r) ? deadlineOf(r) + GRACE_MS : now());
      const result = Object.assign({ attempt_id: r.ATTEMPT_ID, tipo: r.TIPO, form: r.FORM, title: r.TITULO, created: Number(r.CREADO), finished: fin, seconds: Math.round((fin - Number(r.CREADO)) / 1000), timeout: !!timeout }, sum);
      r.ESTADO = 'FINALIZADO'; r.FINALIZADO = fin; r.RESULT_JSON = JSON.stringify(result); put(T.ATT, r);
      return result;
    }
    function finish(ctx, p) {
      return db.lock(() => {
        const r = ownAttempt(ctx, p.attempt_id);
        const timeout = !!(deadlineOf(r) && now() > deadlineOf(r));
        const result = finishInternal(r, timeout);
        if (!r.TIPO.startsWith('preview')) audit(ctx, 'FINISH', r.ATTEMPT_ID, { n: result.n, ok: result.ok, timeout: result.timeout });
        return resultView(r);
      });
    }
    function resultView(r) {
      if (r.ESTADO !== 'FINALIZADO') throw { code: 'intento_no_finalizado', msg: 'Las respuestas se muestran al terminar.' };
      const units = J(r.UNITS_JSON, []); const ans = answersOf(r.ATTEMPT_ID); const revealed = J(r.REVEALED_JSON, {});
      const isSim = SIM_TYPES.includes(r.TIPO) || r.TIPO === 'preview_sim';
      const shown = isSim ? units : units.filter(u => revealed[u.id]);
      return { ok: true, result: J(r.RESULT_JSON, {}), review: shown.map(u => ({ unit: publicUnit(u, J(r.ORDER_JSON, {}), r.TIPO.startsWith('preview')), feedback: feedbackUnit(u, ans) })) };
    }

    /* ── reportes ── */
    function reportFor(cid) {
      const atts = rows(T.ATT).filter(r => r.CANDIDATE_ID === cid);
      const resp = rows(T.RESP).filter(r => r.CANDIDATE_ID === cid && ['CALIFICADA', 'FUERA_DE_TIEMPO'].includes(r.ESTADO));
      const rep = { byPart: {}, bySkill: { listening: { ok: 0, n: 0 }, reading: { ok: 0, n: 0 } }, bySubskill: {}, byCat: {}, answered: 0, days: 0, seconds: 0 };
      for (let k = 1; k <= 7; k++) rep.byPart[k] = { ok: 0, n: 0 };
      const days = new Set(); const firstSeen = {};
      resp.slice().sort((a, b) => Number(a.GUARDADA) - Number(b.GUARDADA)).forEach(r => {
        const it = itemById(r.ITEM_ID); if (!it) return; const ok = r.CORRECTA === true || r.CORRECTA === 'true';
        rep.answered++; days.add(EPL.dayKey(Number(r.GUARDADA)));
        rep.byPart[it.part].n++; rep.bySkill[it.skill].n++; const sk = it.subskill || it.topic; rep.bySubskill[sk] = rep.bySubskill[sk] || { ok: 0, n: 0 }; rep.bySubskill[sk].n++;
        if (ok) { rep.byPart[it.part].ok++; rep.bySkill[it.skill].ok++; rep.bySubskill[sk].ok++; }
        else if (r.CATEGORIA && r.CATEGORIA !== 'SIN_RESPUESTA') rep.byCat[r.CATEGORIA] = (rep.byCat[r.CATEGORIA] || 0) + 1;
        if (!(r.ITEM_ID in firstSeen)) firstSeen[r.ITEM_ID] = ok;
      });
      rep.days = days.size;
      const fin = atts.filter(a => a.ESTADO === 'FINALIZADO');
      rep.seconds = fin.reduce((s, a) => s + (J(a.RESULT_JSON, {}).seconds || 0), 0);
      const fs = Object.values(firstSeen); rep.first_try = { ok: fs.filter(Boolean).length, n: fs.length };
      rep.history = fin.sort((a, b) => Number(b.FINALIZADO) - Number(a.FINALIZADO)).map(a => { const x = J(a.RESULT_JSON, {}); return { attempt_id: a.ATTEMPT_ID, tipo: a.TIPO, form: a.FORM, title: a.TITULO, finished: Number(a.FINALIZADO), n: x.n, ok: x.ok, seconds: x.seconds, timeout: x.timeout, unanswered: x.unanswered, interrupted: x.interrupted, byPart: x.byPart }; });
      rep.attempts = fin.length;
      const srs = rows(T.SRS).filter(r => r.CANDIDATE_ID === cid);
      rep.srs = { pending: srs.filter(r => r.ESTADO !== 'DOMINADO').length, due: srs.filter(r => r.ESTADO !== 'DOMINADO' && Number(r.DUE) <= now()).length, mastered: srs.filter(r => r.ESTADO === 'DOMINADO').length };
      rep.open = atts.filter(a => a.ESTADO === 'EN_CURSO').map(a => ({ attempt_id: a.ATTEMPT_ID, tipo: a.TIPO, title: a.TITULO, created: Number(a.CREADO) }));
      rep.diagnostic = fin.some(a => a.TIPO === 'diagnostic');
      return rep;
    }

    /* ── acciones del candidato ── */
    const candidateActions = {
      me(ctx) {
        const { c, a } = requireCandidateAccess(ctx);
        const fs = forms();
        const formInfo = Object.keys(fs).map(f => { const list = fs[f].ix.list; const vis = list.filter(visibleForCandidate).length; const plan = EPL.buildSim(fs[f].ix, 'full');
          return { form: f, total: list.length, visible: vis, practice: a.forms.includes(f), sim: a.sim_forms.includes(f), sim_ready: plan.ok && vis === list.length, exposure: exposure(c.CANDIDATE_ID, f) }; });
        const topics = {}; a.forms.forEach(f => { if (!fs[f]) return; fs[f].ix.list.filter(visibleForCandidate).forEach(it => { (topics[it.part] = topics[it.part] || new Set()).add(it.topic); }); });
        Object.keys(topics).forEach(k => { topics[k] = [...topics[k]].sort(); });
        return { ok: true, topics, candidate: { id: c.CANDIDATE_ID, nombre: c.NOMBRE, tipo: c.TIPO }, access: { estado: a.ESTADO, forms: a.forms, sim_forms: a.sim_forms, hasta: a.HASTA || null }, env: isProd() ? 'PRODUCCION' : 'DEMO', forms: formInfo };
      },
      dashboard(ctx) { const { c } = requireCandidateAccess(ctx); return { ok: true, report: reportFor(c.CANDIDATE_ID) }; },
      start, answer, cursor, startReading, reveal, skip, finish,
      attempt(ctx, p) { return db.lock(() => { const r = ownAttempt(ctx, p.attempt_id); checkTime(r); const rr = attemptRow(p.attempt_id); return rr.ESTADO === 'FINALIZADO' ? Object.assign(resultView(rr), { finished: true }) : viewAttempt(rr); }); },
      result(ctx, p) { return resultView(ownAttempt(ctx, p.attempt_id)); },
      reviewQueue(ctx) {
        const { c } = requireCandidateAccess(ctx);
        const lastWrong = {}; rows(T.RESP).forEach(r => { if (r.CANDIDATE_ID === c.CANDIDATE_ID && (r.CORRECTA === false || r.CORRECTA === 'false')) lastWrong[r.ITEM_ID] = r; });
        const tries = {}; rows(T.RESP).forEach(r => { if (r.CANDIDATE_ID === c.CANDIDATE_ID && ['CALIFICADA', 'FUERA_DE_TIEMPO'].includes(r.ESTADO)) tries[r.ITEM_ID] = (tries[r.ITEM_ID] || 0) + 1; });
        return { ok: true, server_now: now(), cards: rows(T.SRS).filter(r => r.CANDIDATE_ID === c.CANDIDATE_ID).map(r => { const it = itemById(r.ITEM_ID); const w = lastWrong[r.ITEM_ID] || {};
          return { item_id: r.ITEM_ID, part: it.part, subskill: it.subskill, stem: it.part <= 2 ? null : it.stem, estado: r.ESTADO, due: Number(r.DUE), tries: tries[r.ITEM_ID] || 0, last_category: w.CATEGORIA || null, last_wrong_at: Number(w.GUARDADA) || null }; }).sort((x, y) => x.due - y.due) };
      }
    };

    /* ── administración (superadmin; admin solo lectura) ── */
    const maskCed = s => { s = String(s || '').replace(/\D/g, ''); return s ? '•'.repeat(Math.max(0, s.length - 3)) + s.slice(-3) : ''; };
    const cedHash = s => { s = String(s || '').replace(/\D/g, ''); return s ? d.sha256('cedula|' + (d.pepper || '') + '|' + s) : ''; };
    function candidateSummary(c) {
      const a = accessOf(c.CANDIDATE_ID); const rep = reportFor(c.CANDIDATE_ID); const last = rep.history[0];
      return { candidate_id: c.CANDIDATE_ID, codigo: c.CODIGO, nombre: c.NOMBRE, tipo: c.TIPO, cedula: c.CEDULA_MASK || '', correo: c.CORREO || '', usuario_campus: c.USUARIO_CAMPUS || '',
        cuenta_preparacion: !!rows(T.ACCT).find(x => x.CANDIDATE_ID === c.CANDIDATE_ID && String(x.ACTIVA) !== 'false'),
        acceso: a ? { estado: a.ESTADO, forms: a.forms, sim_forms: a.sim_forms, desde: a.DESDE, hasta: a.HASTA || null } : null,
        actividad: { respuestas: rep.answered, intentos: rep.attempts, ultima: last ? last.finished : null, listening: rep.bySkill.listening, reading: rep.bySkill.reading, pendientes: rep.srs.pending } };
    }
    const adminActions = {
      adminSearch(ctx, p) {
        if (!isAdmin(ctx)) throw { code: 'no_autorizado' };
        const q = String(p.q || '').trim().toLowerCase(); if (q.length < 2) return { ok: true, candidates: [], people: [] };
        const cands = rows(T.CAND).filter(c => [c.CODIGO, c.NOMBRE, c.CORREO, c.USUARIO_CAMPUS].some(v => String(v || '').toLowerCase().includes(q)) || (q.replace(/\D/g, '').length >= 9 && c.CEDULA_HASH === cedHash(q)));
        const known = new Set(cands.map(c => String(c.CODIGO)));
        const people = (d.searchPeople ? d.searchPeople(q) : []).filter(x => !known.has(String(x.codigo))).slice(0, 20);
        return { ok: true, candidates: cands.slice(0, 30).map(candidateSummary), people };
      },
      adminRegister(ctx, p) {
        if (!isSuper(ctx)) throw { code: 'no_autorizado' };
        return db.lock(() => {
          const nombre = String(p.nombre || '').trim(); if (nombre.length < 3) throw { code: 'datos_incompletos', msg: 'Falta el nombre.' };
          const hash = cedHash(p.cedula);
          let codigo = String(p.codigo || '').trim();
          const dupCod = codigo && rows(T.CAND).find(c => String(c.CODIGO) === codigo);
          if (dupCod) return { ok: true, duplicado: true, candidate: candidateSummary(dupCod), mensaje: 'Ya estaba registrado con ese código.' };
          const dupCed = hash && rows(T.CAND).find(c => c.CEDULA_HASH === hash);
          if (dupCed) return { ok: true, duplicado: true, candidate: candidateSummary(dupCed), mensaje: 'Ya existe un candidato con esa cédula. No se creó otro.' };
          const person = codigo && d.searchPeople ? (d.searchPeople(codigo) || []).find(x => String(x.codigo) === codigo) : null;
          const tipo = person && person.usuario ? 'CAMPUS_CUENTA' : person ? 'EGRESADO_SIN_CUENTA' : 'EXTERNO';
          if (!codigo) codigo = 'EPL-' + String(rows(T.CAND).filter(c => /^EPL-/.test(c.CODIGO)).length + 1).padStart(5, '0');
          const c = { CANDIDATE_ID: 'C-' + d.uuid().slice(0, 12), CODIGO: codigo, NOMBRE: nombre, TIPO: tipo, CEDULA_HASH: hash, CEDULA_MASK: maskCed(p.cedula), CORREO: String(p.correo || '').trim(),
            USUARIO_CAMPUS: person && person.usuario ? person.usuario : '', CREADO: new Date(now()).toISOString(), CREADO_POR: ctx.usuario };
          put(T.CAND, c); audit(ctx, 'REGISTER', c.CANDIDATE_ID, { tipo, codigo });
          return { ok: true, candidate: candidateSummary(c) };
        });
      },
      adminGrant(ctx, p) {
        if (!isSuper(ctx)) throw { code: 'no_autorizado' };
        return db.lock(() => {
          const c = one(T.CAND, 'CANDIDATE_ID', p.candidate_id); if (!c) throw { code: 'candidato_inexistente' };
          const fs = Object.keys(forms()); const clean = arr => (Array.isArray(arr) ? arr : []).filter(f => fs.includes(f));
          const prev = accessOf(c.CANDIDATE_ID);
          const row = { CANDIDATE_ID: c.CANDIDATE_ID, ESTADO: 'ACTIVO', FORMS: JSON.stringify(clean(p.forms || J(cfg('DEFAULT_PRACTICE_FORMS'), [])).length ? clean(p.forms || J(cfg('DEFAULT_PRACTICE_FORMS'), [])) : fs.slice(0, 1)),
            SIM_FORMS: JSON.stringify(clean(p.sim_forms || J(cfg('DEFAULT_SIM_FORMS'), []))), DESDE: prev && prev.DESDE ? prev.DESDE : new Date(now()).toISOString().slice(0, 10),
            HASTA: p.hasta ? String(p.hasta).slice(0, 10) : '', OTORGADO_POR: ctx.usuario, MOTIVO: String(p.motivo || '').slice(0, 200), ACTUALIZADO: new Date(now()).toISOString() };
          put(T.ACCESS, row); audit(ctx, prev ? 'GRANT_UPDATE' : 'GRANT', c.CANDIDATE_ID, { forms: row.FORMS, sim_forms: row.SIM_FORMS, hasta: row.HASTA });
          return { ok: true, candidate: candidateSummary(c) };
        });
      },
      adminRevoke(ctx, p) {
        if (!isSuper(ctx)) throw { code: 'no_autorizado' };
        return db.lock(() => {
          const a = one(T.ACCESS, 'CANDIDATE_ID', p.candidate_id); if (!a) throw { code: 'sin_acceso_previo' };
          a.ESTADO = 'SUSPENDIDO'; a.MOTIVO = String(p.motivo || '').slice(0, 200); a.ACTUALIZADO = new Date(now()).toISOString(); put(T.ACCESS, a);
          audit(ctx, 'REVOKE', p.candidate_id, { motivo: a.MOTIVO });
          return { ok: true, candidate: candidateSummary(one(T.CAND, 'CANDIDATE_ID', p.candidate_id)), nota: 'El historial se conserva.' };
        });
      },
      adminActivationLink(ctx, p) {
        if (!isSuper(ctx)) throw { code: 'no_autorizado' };
        return db.lock(() => {
          const c = one(T.CAND, 'CANDIDATE_ID', p.candidate_id); if (!c) throw { code: 'candidato_inexistente' };
          if (c.USUARIO_CAMPUS) throw { code: 'ya_tiene_cuenta', msg: 'Este candidato ya tiene cuenta del Campus: entra con su usuario de siempre.' };
          rows(T.ACTV).filter(x => x.CANDIDATE_ID === c.CANDIDATE_ID && String(x.USADA) !== 'true').forEach(x => { x.USADA = 'anulada'; put(T.ACTV, x); });
          const token = d.uuid().replace(/-/g, '') + d.uuid().replace(/-/g, '');
          put(T.ACTV, { TOKEN_HASH: d.sha256('act|' + token), CANDIDATE_ID: c.CANDIDATE_ID, EXPIRA: now() + ACTIVATION_HOURS * 3600000, USADA: 'false', CREADA_POR: ctx.usuario, CREADA: new Date(now()).toISOString() });
          audit(ctx, 'ACTIVATION_LINK', c.CANDIDATE_ID, { expira_horas: ACTIVATION_HOURS });
          return { ok: true, token, expira: now() + ACTIVATION_HOURS * 3600000, nota: 'El enlace se muestra una sola vez. Vence en 72 horas y sirve una sola vez.' };
        });
      },
      adminList(ctx) { if (!isAdmin(ctx)) throw { code: 'no_autorizado' }; return { ok: true, candidates: rows(T.CAND).map(candidateSummary) }; },
      adminCandidateReport(ctx, p) {
        if (!(isAdmin(ctx) || (roleOf(ctx) === 'teacher' && assigned(ctx, p.candidate_id)))) throw { code: 'no_autorizado' };
        const c = one(T.CAND, 'CANDIDATE_ID', p.candidate_id); if (!c) throw { code: 'candidato_inexistente' };
        audit(ctx, 'VIEW_REPORT', c.CANDIDATE_ID, {});
        return { ok: true, candidate: candidateSummary(c), report: reportFor(c.CANDIDATE_ID), forms_available: Object.keys(forms()) };
      },
      adminAssign(ctx, p) {
        if (!isSuper(ctx)) throw { code: 'no_autorizado' };
        const key = p.docente_usuario + '|' + p.candidate_id;
        put(T.ASSIGN, { KEY: key, DOCENTE_USUARIO: p.docente_usuario, CANDIDATE_ID: p.candidate_id, ACTIVO: p.activo === false ? 'false' : 'true' });
        audit(ctx, 'ASSIGN', p.candidate_id, { docente: p.docente_usuario, activo: p.activo !== false }); return { ok: true };
      },
      adminAudit(ctx, p) { if (!isAdmin(ctx)) throw { code: 'no_autorizado' }; return { ok: true, rows: rows(T.AUDIT).slice(-Math.min(Number(p.limit) || 100, 500)).reverse() }; },
      adminConfig(ctx, p) {
        if (!isSuper(ctx)) throw { code: 'no_autorizado' };
        if (p.set) Object.entries(p.set).forEach(([k, v]) => { if (k in CONFIG_DEFAULTS) { put(T.CONFIG, { KEY: k, VALUE: String(v) }); audit(ctx, 'CONFIG', k, { value: String(v) }); } });
        _forms = null;
        return { ok: true, config: Object.fromEntries(Object.keys(CONFIG_DEFAULTS).map(k => [k, cfg(k)])) };
      },
      teacherList(ctx) {
        if (roleOf(ctx) !== 'teacher') throw { code: 'no_autorizado' };
        const ids = new Set(rows(T.ASSIGN).filter(r => r.DOCENTE_USUARIO === ctx.usuario && String(r.ACTIVO) !== 'false').map(r => r.CANDIDATE_ID));
        return { ok: true, candidates: rows(T.CAND).filter(c => ids.has(c.CANDIDATE_ID)).map(c => { const s = candidateSummary(c); delete s.cedula; delete s.correo; return s; }) };
      }
    };

    /* ── gestión editorial ── */
    const TRANSITIONS = { REVISOR: { DRAFT: ['IN_REVIEW'], IN_REVIEW: ['APPROVED', 'DRAFT'], APPROVED: ['IN_REVIEW'] }, EDITOR: { DRAFT: ['IN_REVIEW', 'ARCHIVED'], IN_REVIEW: ['APPROVED', 'DRAFT', 'ARCHIVED'], APPROVED: ['PUBLISHED', 'IN_REVIEW', 'ARCHIVED'], PUBLISHED: ['ARCHIVED', 'IN_REVIEW'], ARCHIVED: ['DRAFT'] } };
    const editorActions = {
      editorItems(ctx, p) {
        if (!isEditor(ctx)) throw { code: 'no_autorizado' };
        const f = forms()[p.form]; if (!f) throw { code: 'forma_inexistente' };
        const items = f.ix.list.filter(i => (!p.part || i.part === Number(p.part)) && (!p.status || i.review_status === p.status));
        const counts = {}; f.ix.list.forEach(i => { counts[i.review_status] = (counts[i.review_status] || 0) + 1; });
        // La validación corre en el servidor: el navegador del editor no necesita (ni recibe) el banco completo de otras formas.
        const all = Object.keys(forms()); const audio = d.audio ? d.audio() : null; const v = EPL.validate(f.bank, audio); const fc = EPL.formCheck(f.bank);
        const xf = EPL.crossFormCheck(all.map(k => forms()[k].bank), audio);
        const validation = { errors: v.errors.slice(0, 50), warnings: v.warnings.slice(0, 50), n_errors: v.errors.length, n_warnings: v.warnings.length, composition: { ok: fc.ok, total: fc.total, errors: fc.errors }, cross: { ok: xf.ok, errors: xf.errors.slice(0, 30) } };
        return { ok: true, form: p.form, forms: all, total: f.ix.list.length, version: f.bank.version, counts, readiness: EPL.readiness(f.bank), items, groups: Object.values(f.ix.groups), editor_role: editorRole(ctx), validation };
      },
      editorSetStatus(ctx, p) {
        if (!isEditor(ctx)) throw { code: 'no_autorizado' };
        const role = editorRole(ctx); const to = String(p.status || '');
        return db.lock(() => {
          const done = [], refused = [];
          (p.item_ids || []).slice(0, 300).forEach(id => {
            const it = itemById(id); if (!it) { refused.push({ id, motivo: 'no_existe' }); return; }
            const from = it.review_status; const allowed = (TRANSITIONS[role] || {})[from] || [];
            if (!allowed.includes(to)) { refused.push({ id, motivo: `${role} no puede pasar de ${from} a ${to}` }); return; }
            put(T.STATUS, { ITEM_ID: id, VERSION: it.version, ESTADO: to, REVISOR: ['APPROVED', 'PUBLISHED'].includes(to) ? (to === 'APPROVED' ? ctx.usuario : (it.reviewer || ctx.usuario)) : (it.reviewer || ''), FECHA: new Date(now()).toISOString(), NOTA: String(p.nota || '').slice(0, 300) });
            db.append(T.REVIEWS, { REVIEW_ID: d.uuid(), ITEM_ID: id, DE: from, A: to, USUARIO: ctx.usuario, FECHA: new Date(now()).toISOString(), NOTA: String(p.nota || '').slice(0, 300) });
            done.push(id);
          });
          _forms = null;
          audit(ctx, 'ITEM_STATUS', to, { n: done.length, rechazadas: refused.length });
          return { ok: true, updated: done, refused };
        });
      }
    };

    /* ── activación pública (sin sesión) ── */
    const publicActions = {
      activationInfo(p) {
        const r = one(T.ACTV, 'TOKEN_HASH', d.sha256('act|' + String(p.token || '')));
        if (!r || String(r.USADA) !== 'false' || Number(r.EXPIRA) < now()) return err('enlace_invalido', 'El enlace no es válido, ya se usó o venció. Pedile uno nuevo a la Academia.');
        const c = one(T.CAND, 'CANDIDATE_ID', r.CANDIDATE_ID);
        return { ok: true, nombre: c ? c.NOMBRE.split(' ')[0] : '' };
      },
      activate(p) {
        return db.lock(() => {
          const r = one(T.ACTV, 'TOKEN_HASH', d.sha256('act|' + String(p.token || '')));
          if (!r || String(r.USADA) !== 'false' || Number(r.EXPIRA) < now()) return err('enlace_invalido', 'El enlace no es válido, ya se usó o venció.');
          const usuario = String(p.usuario || '').trim().toLowerCase();
          if (!/^[a-z0-9._-]{4,30}$/.test(usuario)) return err('usuario_invalido', 'El usuario debe tener de 4 a 30 caracteres: letras, números, punto, guion.');
          if (one(T.ACCT, 'USUARIO', usuario) || (d.usernameExists && d.usernameExists(usuario))) return err('usuario_ocupado', 'Ese usuario ya existe. Elegí otro.');
          const clave = String(p.clave || '');
          if (clave.length < 8 || !/[a-zA-Z]/.test(clave) || !/\d/.test(clave)) return err('clave_debil', 'La clave debe tener al menos 8 caracteres, con letras y números.');
          rows(T.ACCT).filter(a => a.CANDIDATE_ID === r.CANDIDATE_ID).forEach(a => { a.ACTIVA = 'false'; put(T.ACCT, a); });
          put(T.ACCT, { USUARIO: usuario, CANDIDATE_ID: r.CANDIDATE_ID, CLAVE_HASH: d.hashPassword(clave), ACTIVA: 'true', CREADA: new Date(now()).toISOString(), ULTIMO_ACCESO: '' });
          r.USADA = 'true'; put(T.ACTV, r);
          audit({ usuario, rol: 'cert_candidate' }, 'ACTIVATE', r.CANDIDATE_ID, {});
          return { ok: true, usuario };
        });
      },
      /* Lo usa la capa de Apps Script para emitir una sesión con rol cert_candidate. */
      verifyLogin(p) {
        const a = one(T.ACCT, 'USUARIO', String(p.usuario || '').trim().toLowerCase());
        if (!a || String(a.ACTIVA) !== 'true' || !d.verifyPassword(a.CLAVE_HASH, String(p.clave || ''))) return err('credenciales_invalidas');
        const c = one(T.CAND, 'CANDIDATE_ID', a.CANDIDATE_ID); const acc = accessOf(a.CANDIDATE_ID);
        if (!acc || acc.ESTADO !== 'ACTIVO') return err('sin_acceso', 'Tu acceso a Exam Prep Lab no está activo.');
        a.ULTIMO_ACCESO = new Date(now()).toISOString(); put(T.ACCT, a);
        return { ok: true, usuario: a.USUARIO, rol: 'cert_candidate', codigo: c.CODIGO, nombre: c.NOMBRE };
      }
    };

    const ACTIONS = Object.assign({}, candidateActions, adminActions, editorActions);
    function handle(ctx, action, payload) {
      _forms = null;
      try {
        if (publicActions[action]) return publicActions[action](payload || {});
        const fn = ACTIONS[action]; if (!fn) return err('accion_desconocida');
        requireSession(ctx);
        return fn(ctx, payload || {});
      } catch (e) {
        if (e && e.code) return Object.assign(err(e.code, e.msg), e.attempt_id ? { attempt_id: e.attempt_id } : {});
        return err('error_interno', String(e && e.message || e));
      }
    }
    return { handle, TABLES: T, PK, actions: Object.keys(ACTIONS).concat(Object.keys(publicActions)) };
  }

  const API = { create, version: '1.0.0' };
  root.EPLServer = API;
  if (typeof module !== 'undefined') module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
