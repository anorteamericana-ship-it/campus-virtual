// QA E1 del motor (sin navegador): composición de formas, validación del banco, barajado, simulacros exactos,
// diagnóstico, repetición entre formas, repaso espaciado y SHA-256.  Uso: node prototipos/exam_prep_lab/qa_engine.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
globalThis.window = globalThis;
const E = require(path.join(here, 'epl_engine.js'));
const FORMS = ['a', 'b'].filter(f => fs.existsSync(path.join(here, 'forms', `form_${f}.json`))).map(f => JSON.parse(fs.readFileSync(path.join(here, 'forms', `form_${f}.json`), 'utf8')));
const A = FORMS.find(f => f.form === 'A');
const legacy = (() => { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(here, 'content', 'legacy_demo36.js'), 'utf8'), c); return c.window.EPL_BANK; })();
const clone = o => JSON.parse(JSON.stringify(o));
const codes = b => E.validate(b, null).errors.map(x => x.code);
const results = []; const t = (n, f) => { try { f(); results.push(['PASS', n]); } catch (e) { results.push(['FAIL', n + ' → ' + e.message.replace(/\s+/g, ' ').slice(0, 300)]); } };

for (const F of FORMS) {
  t(`Forma ${F.form}: 200 preguntas con la distribución exacta 6/25/39/30/30/16/54`, () => { const c = E.formCheck(F); assert.deepEqual(c.errors, []); assert.deepEqual(c.byPart, { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 }); });
  t(`Forma ${F.form}: composición oficial de conjuntos (13 conversaciones, 10 charlas, 4 textos P6, P7 10+2+3)`, () => {
    const g = F.groups; assert.equal(g.filter(x => x.part === 3).length, 13); assert.equal(g.filter(x => x.part === 4).length, 10); assert.equal(g.filter(x => x.part === 6).length, 4);
    const p7 = g.filter(x => x.part === 7); assert.equal(p7.filter(x => x.set_kind === 'single').length, 10); assert.equal(p7.filter(x => x.set_kind === 'double').length, 2); assert.equal(p7.filter(x => x.set_kind === 'triple').length, 3);
    assert.equal(p7.filter(x => x.set_kind === 'single').reduce((s, x) => s + x.item_ids.length, 0), 29);
    assert.ok(g.filter(x => x.part === 3 && x.graphic).length >= 3 && g.filter(x => x.part === 4 && x.graphic).length >= 2);
  });
  t(`Forma ${F.form}: validación técnica sin errores (claves, opciones, distractores, huérfanas, audio/opción)`, () => { const v = E.validate(F, null); assert.deepEqual(v.errors, []); assert.equal(v.checked, 200); });
  t(`Forma ${F.form}: todo es BORRADOR de IA, sin revisora, con fuente y licencia`, () => { F.items.forEach(i => { assert.equal(i.review_status, 'DRAFT'); assert.equal(i.reviewer, null); assert.equal(i.source_type, 'ORIGINAL_IA'); assert.ok(i.license && i.author && i.version && i.created_at && i.form === F.form && i.subskill); }); });
  t(`Forma ${F.form}: ninguna letra domina las respuestas de una parte (>45 %)`, () => { assert.deepEqual(E.formCheck(F).warnings, []); });
  t(`Forma ${F.form}: simulacro integral exacto (200, en orden, 75 min) y secciones de 100`, () => {
    const ix = E.index(F); const full = E.buildSim(ix, 'full'); assert.ok(full.ok); assert.equal(full.n, 200); assert.equal(full.reading_minutes, 75);
    const ids = full.units.flatMap(u => u.item_ids); assert.equal(new Set(ids).size, 200); assert.deepEqual(full.units.map(u => u.part), full.units.map(u => u.part).slice().sort((a, b) => a - b));
    assert.equal(full.number[ids[0]], 1); assert.equal(full.number[ids[199]], 200);
    assert.equal(E.buildSim(ix, 'listening').n, 100); assert.equal(E.buildSim(ix, 'reading').n, 100);
    full.units.filter(u => u.kind === 'group').forEach(u => assert.deepEqual(u.item_ids, ix.groups[u.id].item_ids, 'conjunto partido'));
  });
  t(`Forma ${F.form}: diagnóstico equilibrado de 20 preguntas en las 7 partes`, () => { const d = E.diagnosticUnits(E.index(F)); assert.equal(d.reduce((n, u) => n + u.item_ids.length, 0), 20); assert.deepEqual([...new Set(d.map(u => u.part))], [1, 2, 3, 4, 5, 6, 7]); });
  t(`Forma ${F.form}: barajado seguro (1.000 órdenes por pregunta) y Partes 1–2 nunca se barajan`, () => {
    const ix = E.index(F); const rand = E.rng(99);
    ix.list.forEach(it => { for (let k = 0; k < (it.shuffle ? 1000 : 50); k++) { const ord = E.optionOrder(it, true, rand); assert.equal(new Set(ord).size, it.options.length); if (it.part <= 2) assert.deepEqual(ord, it.options.map(o => o.id)); assert.ok(E.isCorrect(it, it.correct)); } });
  });
}
t('Las 36 preguntas del prototipo v1 están en la Forma A una sola vez, con id nuevo', () => {
  const ids = A.items.filter(i => i.legacy_id).map(i => i.legacy_id); assert.equal(ids.length, 36); assert.equal(new Set(ids).size, 36);
  assert.equal(JSON.stringify([...ids].sort()), JSON.stringify(legacy.items.map(i => i.item_id).sort()));
  const byLeg = Object.fromEntries(A.items.filter(i => i.legacy_id).map(i => [i.legacy_id, i])); legacy.items.forEach(o => { assert.equal(byLeg[o.item_id].correct, o.correct); assert.equal(JSON.stringify(byLeg[o.item_id].options), JSON.stringify(o.options)); });
});
t('Sin repetición entre formas (ids, preguntas, textos, guiones)', () => { const x = E.crossFormCheck(FORMS); assert.deepEqual(x.errors, []); });
t('Detecta opciones duplicadas, clave inexistente o mal codificada', () => { const b = clone(A); b.items[150].options[1].text = b.items[150].options[0].text; b.items[151].correct = 'z'; const c = codes(b); assert.ok(c.includes('OPCION_DUPLICADA') && c.includes('CLAVE_INVALIDA')); const b2 = clone(A); const it = b2.items.find(i => i.part === 5); it.correct = Object.keys(it.distractors)[0]; assert.ok(codes(b2).includes('CLAVE_CON_DISTRACTOR')); });
t('Detecta audio inexistente con el manifiesto', () => { const man = { clips: {} }; const v = E.validate(A, man); assert.ok(v.errors.filter(x => x.code === 'AUDIO_INEXISTENTE').length >= 54); });
t('Detecta imagen sin origen autorizado, pregunta huérfana y conjuntos incompletos', () => { const b = clone(A); b.items[0].source_type = 'WEB'; b.items.find(i => i.part === 7).passage_group_id = 'NO-EXISTE'; b.items = b.items.filter(i => !/-G3-05-Q2|-G6-02-Q4|-G7-13-Q5/.test(i.item_id)); const c = codes(b); assert.ok(c.includes('IMAGEN_LICENCIA') && c.includes('HUERFANA')); assert.ok(c.filter(x => x === 'CONJUNTO_INCOMPLETO').length >= 3); });
t('Detecta barajado en Partes 1–2 y audio/opción desalineados', () => { const b = clone(A); const it = b.items.find(i => i.part === 2); it.shuffle = true; it.options.reverse(); const c = codes(b); assert.ok(c.includes('BARAJADO_ORAL') && c.includes('AUDIO_TEXTO')); });
t('Detecta ítem de IA publicado sin revisión humana', () => { const b = clone(A); b.items[10].review_status = 'PUBLISHED'; assert.ok(codes(b).includes('IA_SIN_REVISION')); });
t('La composición incompleta bloquea el simulacro integral (no se rellena repitiendo)', () => { const b = clone(A); b.items = b.items.filter(i => i.part !== 5 || !/P5-30/.test(i.item_id)); const p = E.buildSim(E.index(b), 'full'); assert.equal(p.ok, false); assert.match(p.error, /199\/200/); });
t('Detecta repetición entre formas', () => { const b = clone(A); b.form = 'Z'; b.items.forEach(i => { i.item_id = 'Z' + i.item_id; }); assert.ok(E.crossFormCheck([A, b]).errors.length > 100); });
t('Repaso espaciado: 1, 3, 7… días; tres aciertos = dominado; error reinicia', () => { const t0 = Date.UTC(2026, 10, 19); let c = E.srsUpdate(null, false, t0); assert.equal(c.due, t0 + 86400000); c = E.srsUpdate(c, true, t0); assert.equal(c.due, t0 + 3 * 86400000); c = E.srsUpdate(c, true, t0); c = E.srsUpdate(c, true, t0); assert.equal(c.state, 'DOMINADO'); c = E.srsUpdate(c, false, t0); assert.equal(c.box, 0); });
t('SHA-256 propio = SHA-256 de Node (texto con acentos y largo)', () => { for (const s of ['', 'abc', 'Cédula ñ — “x”', 'x'.repeat(5000)]) assert.equal(E.sha256(s), crypto.createHash('sha256').update(s).digest('hex')); });
t('No hay fechas de examen ni cuentas regresivas en la interfaz', () => { const src = fs.readFileSync(path.join(here, 'epl_app.js'), 'utf8'); assert.ok(!/exam_date|cuenta regresiva|días para tu examen|Fecha de tu examen/i.test(src)); });
results.forEach(([s, n]) => console.log(s, n));
const fail = results.filter(r => r[0] === 'FAIL').length; console.log(`\n${results.length - fail}/${results.length} PASS`); process.exit(fail ? 1 : 0);
