// QA E1 del núcleo del servidor (Node, en memoria, reloj simulado, usuarios ficticios). No toca el Campus.
// Uso: node prototipos/exam_prep_lab/qa_server.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
globalThis.window = globalThis;
const EPL = require(path.join(here, 'epl_engine.js'));
const EPLServer = require(path.join(here, 'epl_server_core.js'));
const FORMS = {};
for (const f of ['a', 'b']) { const p = path.join(here, 'forms', `form_${f}.json`); if (fs.existsSync(p)) FORMS[f.toUpperCase()] = JSON.parse(fs.readFileSync(p, 'utf8')); }

function world(env = 'DEMO') {
  const T = {}; let clock = Date.UTC(2026, 10, 20, 15, 0, 0); let n = 0;
  const db = { read: t => (T[t] || []).map(r => ({ ...r })), upsert(t, pk, row) { T[t] = T[t] || []; const i = T[t].findIndex(r => String(r[pk]) === String(row[pk])); if (i >= 0) T[t][i] = { ...row }; else T[t].push({ ...row }); }, append(t, row) { (T[t] = T[t] || []).push({ ...row }); }, lock: fn => fn() };
  const deps = { now: () => clock, uuid: () => crypto.randomUUID(), sha256: s => crypto.createHash('sha256').update(s).digest('hex'), forms: () => FORMS, pepper: 'qa',
    searchPeople: q => [{ codigo: '17901', nombre: 'Ana Demo', usuario: 'ana.demo' }, { codigo: '16502', nombre: 'Bruno Demo', usuario: null }].filter(p => p.codigo.includes(q) || p.nombre.toLowerCase().includes(q)),
    usernameExists: u => ['ana.demo', 'leo.demo'].includes(u), hashPassword: p => 'h$' + crypto.createHash('sha256').update('s' + p).digest('hex'), verifyPassword: (h, p) => h === 'h$' + crypto.createHash('sha256').update('s' + p).digest('hex') };
  const core = EPLServer.create({ db, deps, config: { ENV: env } });
  const leo = { usuario: 'leo.demo', rol: 'superadmin' }, ana = { usuario: 'ana.demo', rol: 'student', codigo: '17901', grupo: 'B1-OLD-GROUP' };
  const W = { T, core, leo, ana, tick: ms => { clock += ms; }, call: (ctx, a, p) => core.handle(ctx, a, p) };
  W.setup = () => {
    const a = W.call(leo, 'adminRegister', { codigo: '17901', nombre: 'Ana Demo', cedula: '100000901' });
    W.call(leo, 'adminGrant', { candidate_id: a.candidate.candidate_id, forms: Object.keys(FORMS), sim_forms: ['A'] });
    const b = W.call(leo, 'adminRegister', { codigo: '16502', nombre: 'Bruno Demo', cedula: '100000502' });
    W.call(leo, 'adminGrant', { candidate_id: b.candidate.candidate_id, forms: ['A'], sim_forms: ['A'] });
    const link = W.call(leo, 'adminActivationLink', { candidate_id: b.candidate.candidate_id });
    const act = W.call(null, 'activate', { token: link.token, usuario: 'bruno.demo', clave: 'Clave2026x' });
    const login = W.call(null, 'verifyLogin', { usuario: 'bruno.demo', clave: 'Clave2026x' });
    W.anaId = a.candidate.candidate_id; W.brunoId = b.candidate.candidate_id; W.link = link; W.act = act;
    W.bruno = { usuario: login.usuario, rol: login.rol, codigo: login.codigo };
    return W;
  };
  return W;
}
const results = [];
const t = (name, fn) => { try { fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', `${name} → ${e.message.replace(/\s+/g, ' ').slice(0, 300)}`]); } };
const answerAll = (W, ctx, view, pick = 'correct') => {
  view.attempt.units.forEach(u => u.items.forEach(it => { const real = EPL.index(FORMS[u.form]).items[it.item_id]; const opt = pick === 'correct' ? real.correct : real.options.map(o => o.id).find(x => x !== real.correct); const r = W.call(ctx, 'answer', { attempt_id: view.attempt.attempt_id, item_id: it.item_id, option: opt }); assert.ok(r.ok, JSON.stringify(r)); }));
};
const LEAK = /"(correct|explanation|distractors|script|confusion|strategy|image_desc_after|vocabulary)"/;

t('Forma A disponible y completa (200)', () => { assert.ok(FORMS.A); assert.equal(FORMS.A.items.length, 200); });
t('01 acceso autorizado: estudiante con cuenta del Campus inicia práctica', () => { const W = world().setup(); const r = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); assert.ok(r.ok, JSON.stringify(r)); assert.equal(r.attempt.total_items, 5); });
t('02 acceso denegado: estudiante sin autorización, ventas y sin sesión', () => {
  const W = world().setup();
  assert.equal(W.call({ usuario: 'carla.demo', rol: 'student', codigo: '16610' }, 'me', {}).error, 'sin_acceso');
  assert.equal(W.call({ usuario: 'v', rol: 'ventas' }, 'me', {}).error, 'no_es_candidato');
  assert.equal(W.call(null, 'me', {}).error, 'sesion_requerida');
  assert.equal(W.call({ usuario: 'v', rol: 'ventas' }, 'adminList', {}).error, 'no_autorizado');
});
t('03 egresado sin grupo ni cuenta: activación de un solo uso → rol cert_candidate → práctica', () => {
  const W = world().setup();
  assert.ok(W.act.ok); assert.equal(W.bruno.rol, 'cert_candidate'); assert.equal(W.bruno.codigo, '16502');
  assert.ok(W.call(W.bruno, 'me', {}).ok);
  assert.equal(W.call(null, 'activate', { token: W.link.token, usuario: 'otro.user', clave: 'Clave2026x' }).error, 'enlace_invalido', 'el enlace se reusó');
  const l2 = W.call(W.leo, 'adminActivationLink', { candidate_id: W.brunoId }); W.tick(73 * 3600000);
  assert.equal(W.call(null, 'activate', { token: l2.token, usuario: 'bruno2', clave: 'Clave2026x' }).error, 'enlace_invalido', 'el enlace no venció');
  const l3 = W.call(W.leo, 'adminActivationLink', { candidate_id: W.brunoId });
  assert.equal(W.call(null, 'activate', { token: l3.token, usuario: 'bruno3', clave: 'corta' }).error, 'clave_debil');
  assert.equal(W.call(null, 'activate', { token: l3.token, usuario: 'ana.demo', clave: 'Clave2026x' }).error, 'usuario_ocupado');
  assert.ok(!JSON.stringify(W.T.CERT_ACTIVATIONS).includes(l3.token), 'el token se guardó en claro');
  assert.ok(!JSON.stringify(W.T.CERT_AUDIT).includes(l3.token), 'el token quedó en auditoría');
});
t('04 grupo histórico desactualizado en la sesión no afecta: la identidad es el código', () => { const W = world().setup(); const r = W.call({ ...W.ana, grupo: 'B9-ZZ-NO-EXISTE' }, 'me', {}); assert.ok(r.ok); assert.equal(r.candidate.nombre, 'Ana Demo'); });
t('05 dos alumnos: uno no puede leer ni responder intentos del otro', () => {
  const W = world().setup(); const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 });
  const id = a.attempt.units[0].items[0].item_id;
  assert.equal(W.call(W.bruno, 'answer', { attempt_id: a.attempt.attempt_id, item_id: id, option: 'a' }).error, 'no_autorizado');
  assert.equal(W.call(W.bruno, 'attempt', { attempt_id: a.attempt.attempt_id }).error, 'no_autorizado');
  W.call(W.ana, 'answer', { attempt_id: a.attempt.attempt_id, item_id: id, option: 'a' });
  assert.equal(W.call(W.bruno, 'dashboard', {}).report.answered, 0);
});
t('06 respuesta repetida (reintento por conexión) no duplica filas', () => {
  const W = world().setup(); const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); const id = a.attempt.units[0].items[0].item_id;
  for (let k = 0; k < 3; k++) W.call(W.ana, 'answer', { attempt_id: a.attempt.attempt_id, item_id: id, option: 'b' });
  assert.equal(W.T.CERT_RESPONSES.filter(r => r.ITEM_ID === id).length, 1);
});
t('07 reanudación: el intento devuelve respuestas guardadas y retroalimentación ya revelada', () => {
  const W = world().setup(); const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); const u = a.attempt.units[0];
  W.call(W.ana, 'answer', { attempt_id: a.attempt.attempt_id, item_id: u.items[0].item_id, option: 'c' }); W.call(W.ana, 'reveal', { attempt_id: a.attempt.attempt_id, unit_id: u.unit_id });
  const v = W.call(W.ana, 'attempt', { attempt_id: a.attempt.attempt_id }); assert.equal(v.attempt.answers[u.items[0].item_id].opt, 'c'); assert.equal(v.attempt.feedback.length, 1);
});
t('08 audio que no carga: la unidad se puede saltar y no cuenta', () => {
  const W = world().setup(); const a = W.call(W.ana, 'start', { tipo: 'practice', part: 2, size: 5 }); const n = a.attempt.units.length;
  const v = W.call(W.ana, 'skip', { attempt_id: a.attempt.attempt_id, unit_id: a.attempt.units[0].unit_id, motivo: 'audio_no_carga' }); assert.equal(v.attempt.units.length, n - 1);
});
t('10 Reading por tiempo: el servidor rechaza respuestas tardías y cierra con TIEMPO', () => {
  const W = world().setup(); const s = W.call(W.ana, 'start', { tipo: 'sim_reading', form: 'A' }); assert.ok(s.ok, JSON.stringify(s));
  assert.equal(s.attempt.total_items, 100); assert.equal(s.attempt.reading_deadline - s.attempt.created, 75 * 60000);
  const first = s.attempt.units[0].items[0].item_id; assert.ok(W.call(W.ana, 'answer', { attempt_id: s.attempt.attempt_id, item_id: first, option: 'a' }).ok);
  W.tick(76 * 60000);
  assert.equal(W.call(W.ana, 'answer', { attempt_id: s.attempt.attempt_id, item_id: s.attempt.units[1].items[0].item_id, option: 'a' }).error, 'tiempo_agotado');
  assert.equal(W.call(W.ana, 'answer', { attempt_id: s.attempt.attempt_id, item_id: first, option: 'b' }).error, 'intento_cerrado');
  const r = W.call(W.ana, 'result', { attempt_id: s.attempt.attempt_id }); assert.ok(r.result.timeout); assert.equal(r.result.n, 100); assert.equal(r.result.unanswered, 99);
  assert.ok(r.result.byCat.TIEMPO >= 99);
});
t('11 las claves no salen antes de tiempo: simulacro integral, práctica y Partes 1–2 sin texto', () => {
  const W = world().setup(); const s = W.call(W.ana, 'start', { tipo: 'sim_full', form: 'A' }); assert.ok(s.ok, JSON.stringify(s));
  assert.equal(s.attempt.total_items, 200); assert.ok(!LEAK.test(JSON.stringify(s)), 'fuga en simulacro');
  s.attempt.units.filter(u => u.part <= 2).forEach(u => u.items.forEach(i => i.options.forEach(o => assert.equal(o.text, undefined))));
  assert.equal(W.call(W.ana, 'reveal', { attempt_id: s.attempt.attempt_id, unit_id: s.attempt.units[0].unit_id }).error, 'no_permitido_en_simulacro');
  assert.equal(W.call(W.ana, 'result', { attempt_id: s.attempt.attempt_id }).error, 'intento_no_finalizado');
  const p = W.call(W.ana, 'start', { tipo: 'practice', part: 3, size: 5 }); assert.ok(!LEAK.test(JSON.stringify(p)), 'fuga en práctica');
});
t('12 Listening: solo se responde el audio en curso; el audio no retrocede; interrumpido no cuenta', () => {
  const W = world().setup(); const s = W.call(W.ana, 'start', { tipo: 'sim_listening', form: 'A' }); const id = s.attempt.attempt_id; const U = s.attempt.units;
  assert.equal(s.attempt.total_items, 100);
  assert.equal(W.call(W.ana, 'answer', { attempt_id: id, item_id: U[3].items[0].item_id, option: 'a' }).error, 'fuera_de_turno');
  assert.ok(W.call(W.ana, 'cursor', { attempt_id: id, index: 0 }).ok);
  assert.ok(W.call(W.ana, 'answer', { attempt_id: id, item_id: U[0].items[0].item_id, option: 'a' }).ok);
  assert.ok(W.call(W.ana, 'cursor', { attempt_id: id, index: 1 }).ok);
  assert.equal(W.call(W.ana, 'cursor', { attempt_id: id, index: 0 }).error, 'cursor_invalido');
  assert.ok(W.call(W.ana, 'cursor', { attempt_id: id, index: 1, interrupted: true }).ok);
  assert.equal(W.call(W.ana, 'answer', { attempt_id: id, item_id: U[1].items[0].item_id, option: 'a' }).error, 'interrumpida');
  W.tick(10000); assert.equal(W.call(W.ana, 'answer', { attempt_id: id, item_id: U[0].items[0].item_id, option: 'b' }).error, 'fuera_de_turno');
  const r = W.call(W.ana, 'finish', { attempt_id: id }); assert.equal(r.result.interrupted, 1); assert.equal(r.result.n, 99);
});
t('13 simulacro integral: 200 exactas, Listening se cierra al iniciar Reading y Reading dura 75 min', () => {
  const W = world().setup(); const s = W.call(W.ana, 'start', { tipo: 'sim_full', form: 'A' }); const id = s.attempt.attempt_id; const U = s.attempt.units;
  const ids = U.flatMap(u => u.items.map(i => i.item_id)); assert.equal(ids.length, 200); assert.equal(new Set(ids).size, 200);
  const parts = {}; U.forEach(u => { parts[u.part] = (parts[u.part] || 0) + u.items.length; }); assert.deepEqual(parts, EPL.FORM_SPEC.parts);
  assert.deepEqual(U.map(u => u.part), U.map(u => u.part).slice().sort((a, b) => a - b), 'orden de partes');
  const firstReading = U.find(u => u.part === 5).items[0].item_id;
  assert.equal(W.call(W.ana, 'answer', { attempt_id: id, item_id: firstReading, option: 'a' }).error, 'reading_no_iniciado');
  const v = W.call(W.ana, 'startReading', { attempt_id: id }); assert.equal(v.attempt.reading_deadline - v.attempt.reading_started, 75 * 60000);
  assert.equal(W.call(W.ana, 'answer', { attempt_id: id, item_id: U[0].items[0].item_id, option: 'a' }).error, 'listening_cerrado');
  assert.ok(W.call(W.ana, 'answer', { attempt_id: id, item_id: firstReading, option: 'a' }).ok);
  assert.equal(W.call(W.ana, 'start', { tipo: 'sim_reading', form: 'A' }).error, 'simulacro_en_curso');
  const r = W.call(W.ana, 'finish', { attempt_id: id }); assert.equal(r.result.n, 200); assert.equal(r.review.length, U.length); assert.ok(LEAK.test(JSON.stringify(r)), 'al final sí se muestran claves');
  const r2 = W.call(W.ana, 'finish', { attempt_id: id }); assert.deepEqual(r2.result, r.result, 'finalizar dos veces cambia el resultado');
});
t('14 identificadores manipulados en el payload se ignoran', () => {
  const W = world().setup(); W.call(W.bruno, 'start', { tipo: 'practice', part: 5, size: 5, codigo: '17901', candidate_id: W.anaId, usuario: 'ana.demo' });
  const ana = W.call(W.ana, 'dashboard', { candidate_id: W.brunoId }); assert.equal(ana.report.history.length, 0); assert.equal(W.T.CERT_ATTEMPTS[0].CANDIDATE_ID, W.brunoId);
  assert.equal(W.call({ ...W.ana, rol: 'student' }, 'adminGrant', { candidate_id: W.anaId }).error, 'no_autorizado');
});
t('15 suspender conserva el historial; reactivar lo recupera', () => {
  const W = world().setup(); const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); answerAll(W, W.ana, a, 'wrong'); a.attempt.units.forEach(u => W.call(W.ana, 'reveal', { attempt_id: a.attempt.attempt_id, unit_id: u.unit_id })); W.call(W.ana, 'finish', { attempt_id: a.attempt.attempt_id });
  W.call(W.leo, 'adminRevoke', { candidate_id: W.anaId, motivo: 'prueba' }); assert.equal(W.call(W.ana, 'me', {}).error, 'sin_acceso');
  assert.equal(W.call(W.leo, 'adminCandidateReport', { candidate_id: W.anaId }).report.answered, 5);
  W.call(W.leo, 'adminGrant', { candidate_id: W.anaId, forms: ['A'], sim_forms: ['A'] }); assert.equal(W.call(W.ana, 'dashboard', {}).report.history.length, 1);
});
t('16 acceso con fecha de vencimiento opcional (decisión de Dirección, no fecha de examen)', () => {
  const W = world().setup(); W.call(W.leo, 'adminGrant', { candidate_id: W.anaId, forms: ['A'], sim_forms: ['A'], hasta: '2026-11-25' });
  assert.ok(W.call(W.ana, 'me', {}).ok); W.tick(6 * 86400000); assert.match(W.call(W.ana, 'me', {}).mensaje, /venció/);
});
t('17 cert_candidate no reemplaza roles: quien ya tiene cuenta sigue con su usuario y rol', () => {
  const W = world().setup(); assert.equal(W.call(W.leo, 'adminActivationLink', { candidate_id: W.anaId }).error, 'ya_tiene_cuenta');
  assert.ok(!(W.T.CERT_ACCOUNTS || []).some(a => a.CANDIDATE_ID === W.anaId));
});
t('18 duplicados: misma cédula o mismo código no crean otro candidato', () => {
  const W = world().setup(); const r = W.call(W.leo, 'adminRegister', { nombre: 'Ana Otra', cedula: '1-0000-0901' }); assert.ok(r.duplicado); assert.equal(W.T.CERT_CANDIDATES.length, 2);
  assert.ok(!JSON.stringify(W.T.CERT_CANDIDATES).includes('100000901'), 'cédula guardada en claro');
});
t('19 PRODUCCION: candidatos solo ven PUBLISHED; la vista previa interna sí ve borradores', () => {
  const W = world('PRODUCCION').setup();
  assert.equal(W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }).error, 'sin_material');
  assert.equal(W.call(W.ana, 'start', { tipo: 'sim_full', form: 'A' }).error, 'material_no_publicado');
  assert.equal(W.call(W.ana, 'start', { tipo: 'diagnostic' }).error, 'sin_material');
  assert.equal(W.call(W.ana, 'start', { tipo: 'preview' }).error, 'no_autorizado');
  W.T.CERT_EDITORS = [{ USUARIO: 'profe.demo', ROL_EDITORIAL: 'REVISOR', ACTIVO: 'true' }];
  const profe = { usuario: 'profe.demo', rol: 'teacher' };
  assert.ok(W.call(profe, 'start', { tipo: 'preview', part: 5, size: 3 }).ok);
  const p5 = FORMS.A.items.filter(i => i.part === 5).map(i => i.item_id);
  assert.equal(W.call(profe, 'editorSetStatus', { item_ids: p5, status: 'PUBLISHED' }).updated.length, 0, 'la revisora no puede publicar');
  assert.equal(W.call(profe, 'editorSetStatus', { item_ids: p5, status: 'IN_REVIEW' }).updated.length, 30);
  assert.equal(W.call(profe, 'editorSetStatus', { item_ids: p5, status: 'APPROVED' }).updated.length, 30);
  assert.equal(W.call(W.leo, 'editorSetStatus', { item_ids: p5, status: 'PUBLISHED' }).updated.length, 30);
  const s = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); assert.ok(s.ok, JSON.stringify(s)); assert.equal(s.attempt.units.some(u => u.draft), false);
  assert.equal(W.T.CERT_ITEM_STATUS.find(r => r.ITEM_ID === p5[0]).REVISOR, 'profe.demo');
  assert.equal(W.T.CERT_REVIEWS.length, 90);
});
t('20 docente: solo candidatos asignados; admin lee pero no habilita', () => {
  const W = world().setup(); const profe = { usuario: 'profe.demo', rol: 'teacher' };
  assert.equal(W.call(profe, 'adminCandidateReport', { candidate_id: W.anaId }).error, 'no_autorizado');
  W.call(W.leo, 'adminAssign', { docente_usuario: 'profe.demo', candidate_id: W.anaId });
  assert.ok(W.call(profe, 'adminCandidateReport', { candidate_id: W.anaId }).ok); assert.equal(W.call(profe, 'adminCandidateReport', { candidate_id: W.brunoId }).error, 'no_autorizado');
  assert.equal(W.call(profe, 'teacherList', {}).candidates.length, 1);
  const admin = { usuario: 'admin.demo', rol: 'admin' }; assert.ok(W.call(admin, 'adminList', {}).ok); assert.equal(W.call(admin, 'adminGrant', { candidate_id: W.anaId }).error, 'no_autorizado');
});
t('21 auditoría de accesos y cambios', () => { const W = world().setup(); W.call(W.leo, 'adminRevoke', { candidate_id: W.brunoId }); const acc = W.T.CERT_AUDIT.map(r => r.ACCION); ['REGISTER', 'GRANT', 'ACTIVATION_LINK', 'ACTIVATE', 'REVOKE'].forEach(x => assert.ok(acc.includes(x), x)); });
t('22 barajado seguro: el orden cambia y la calificación sigue por id', () => {
  const W = world().setup(); let changed = 0;
  for (let k = 0; k < 6; k++) { const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); a.attempt.units.forEach(u => u.items.forEach(i => { if (i.options.map(o => o.id).join('') !== 'abcd') changed++; })); answerAll(W, W.ana, a, 'correct'); a.attempt.units.forEach(u => { const f = W.call(W.ana, 'reveal', { attempt_id: a.attempt.attempt_id, unit_id: u.unit_id }); f.feedback.items.forEach(x => assert.ok(x.ok)); }); W.call(W.ana, 'finish', { attempt_id: a.attempt.attempt_id }); }
  assert.ok(changed > 5, 'nunca se barajó');
});
t('23 diagnóstico equilibrado: 20 preguntas de las 7 partes', () => { const W = world().setup(); const d = W.call(W.ana, 'start', { tipo: 'diagnostic' }); assert.ok(d.ok, JSON.stringify(d)); assert.equal(d.attempt.total_items, 20); assert.deepEqual([...new Set(d.attempt.units.map(u => u.part))], [1, 2, 3, 4, 5, 6, 7]); });
t('24 práctica prefiere preguntas no vistas y avisa si debe repetir', () => {
  const W = world().setup(); const seen = new Set();
  for (let k = 0; k < 6; k++) { const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 10 }); a.attempt.units.forEach(u => u.items.forEach(i => { if (k < 5) assert.ok(!seen.has(i.item_id) || seen.size >= FORMS.A.items.filter(x => x.part === 5).length * Object.keys(FORMS).length, 'repitió ' + i.item_id); seen.add(i.item_id); })); answerAll(W, W.ana, a); a.attempt.units.forEach(u => W.call(W.ana, 'reveal', { attempt_id: a.attempt.attempt_id, unit_id: u.unit_id })); W.call(W.ana, 'finish', { attempt_id: a.attempt.attempt_id }); }
});
t('25 errores → repaso espaciado → repaso de hoy', () => {
  const W = world().setup(); const a = W.call(W.ana, 'start', { tipo: 'practice', part: 5, size: 5 }); answerAll(W, W.ana, a, 'wrong'); a.attempt.units.forEach(u => W.call(W.ana, 'reveal', { attempt_id: a.attempt.attempt_id, unit_id: u.unit_id })); W.call(W.ana, 'finish', { attempt_id: a.attempt.attempt_id });
  assert.equal(W.call(W.ana, 'reviewQueue', {}).cards.length, 5);
  assert.equal(W.call(W.ana, 'start', { tipo: 'review', only_due: true }).error, 'sin_repasos'); W.tick(86400000 + 1000);
  const r = W.call(W.ana, 'start', { tipo: 'review', only_due: true }); assert.ok(r.ok); assert.equal(r.attempt.total_items, 5);
});
t('26 reportes por habilidad, subhabilidad y categoría de error; historial completo', () => {
  const W = world().setup();
  for (const part of [2, 5, 7]) { const a = W.call(W.ana, 'start', { tipo: 'practice', part, size: 5 }); answerAll(W, W.ana, a, 'wrong'); a.attempt.units.forEach(u => W.call(W.ana, 'reveal', { attempt_id: a.attempt.attempt_id, unit_id: u.unit_id })); W.call(W.ana, 'finish', { attempt_id: a.attempt.attempt_id }); }
  const rep = W.call(W.ana, 'dashboard', {}).report; assert.equal(rep.history.length, 3); assert.ok(rep.bySkill.listening.n > 0 && rep.bySkill.reading.n > 0);
  assert.ok(Object.keys(rep.bySubskill).length >= 3); assert.ok(Object.values(rep.byCat).reduce((a, b) => a + b, 0) >= 15);
});

results.forEach(([s, n]) => console.log(s, n));
const fail = results.filter(r => r[0] === 'FAIL').length; console.log(`\n${results.length - fail}/${results.length} PASS`); process.exit(fail ? 1 : 0);
