// QA de recursos multimedia (E1): cada pregunta con audio/imagen tiene su archivo, el archivo corresponde al guion
// vigente (huella text_sha), no hay archivos vacíos ni duplicados, la duración real coincide y el habla es plausible.
// NO reemplaza la escucha humana: un audio puede pasar todo esto y aun así sonar mal.
// Uso: node prototipos/exam_prep_lab/qa_media.mjs   (requiere ffprobe)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const man = (() => { const t = fs.readFileSync(path.join(root, 'audio_manifest.js'), 'utf8'); return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); })();
const forms = ['a', 'b'].filter(f => fs.existsSync(path.join(root, 'forms', `form_${f}.json`))).map(f => JSON.parse(fs.readFileSync(path.join(root, 'forms', `form_${f}.json`), 'utf8')));
const SPEED = v => v === 'NARR' ? 0.95 : 0.94;
const canon = (s, voices) => 'mark' in s ? 'M|' + s.mark : 'gap' in s ? 'G|' + s.gap.toFixed(2) : `S|${voices[s.v].voice}|${voices[s.v].lang}|${SPEED(s.v).toFixed(2)}|${s.say || s.t}`;
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function segmentsFor(bank, key) {
  const g = bank.groups.find(x => x.passage_group_id === key);
  if (g) { const by = Object.fromEntries(bank.items.map(i => [i.item_id, i])); let s = [{ gap: 0.5 }, { v: 'NARR', t: g.intro }, { gap: 0.4 }, ...g.script, { mark: 'questions_at' }]; g.item_ids.forEach(id => { s = s.concat([{ v: 'NARR', t: by[id].stem }, { gap: 8 }]); }); return s; }
  return [{ gap: 0.5 }, ...bank.items.find(i => i.item_id === key).script];
}
const results = []; const t = (n, f) => { try { f(); results.push(['PASS', n]); } catch (e) { results.push(['FAIL', n + ' → ' + e.message.replace(/\s+/g, ' ').slice(0, 300)]); } };
const probe = f => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim());

for (const bank of forms) {
  const F = bank.form;
  const keys = bank.items.filter(i => i.part <= 2).map(i => i.item_id).concat(bank.groups.filter(g => g.part <= 4).map(g => g.passage_group_id));
  t(`Forma ${F}: cada pregunta de Listening tiene clip (${keys.length} clips para 100 preguntas)`, () => {
    assert.equal(keys.length, bank.items.filter(i => i.part <= 2).length + bank.groups.filter(g => g.part <= 4).length);
    const covered = new Set(); keys.forEach(k => { assert.ok(man.clips[k], 'sin clip ' + k); (bank.groups.find(g => g.passage_group_id === k) || { item_ids: [k] }).item_ids.forEach(id => covered.add(id)); });
    assert.equal(covered.size, 100);
  });
  t(`Forma ${F}: el audio corresponde al guion, opciones y preguntas vigentes (huella)`, () => { const bad = keys.filter(k => man.clips[k].text_sha !== sha(segmentsFor(bank, k).map(s => canon(s, bank.voices)).join('\n'))); assert.deepEqual(bad, []); });
  t(`Forma ${F}: archivos existen, no están vacíos y coinciden con su SHA-256`, () => { keys.forEach(k => { const c = man.clips[k]; const p = path.join(root, c.file); assert.ok(fs.existsSync(p), 'falta ' + c.file); const b = fs.readFileSync(p); assert.ok(b.length > 4000, 'archivo muy pequeño ' + c.file); assert.equal(sha(b), c.sha256, 'sha distinto ' + c.file); }); });
  t(`Forma ${F}: duración real (ffprobe) = manifiesto ± 0,35 s; habla 1,4–4 palabras/s`, () => { keys.forEach(k => { const c = man.clips[k]; const d = probe(path.join(root, c.file)); assert.ok(Math.abs(d - c.seconds) < 0.35, `${k}: ${d} vs ${c.seconds}`); const r = c.words / c.speech_seconds; assert.ok(r > 1.4 && r < 4, `${k}: ${r.toFixed(2)} palabras/s`); }); });
  t(`Forma ${F}: conjuntos 3/4 marcan dónde empiezan las preguntas leídas`, () => { bank.groups.filter(g => g.part <= 4).forEach(g => { const c = man.clips[g.passage_group_id]; assert.ok(c.questions_at > 10 && c.questions_at < c.seconds - 24, g.passage_group_id); }); });
  t(`Forma ${F}: imágenes de Parte 1 originales, válidas y distintas`, () => { const shas = new Set(); bank.items.filter(i => i.part === 1).forEach(i => { const p = path.join(root, i.image_asset); assert.ok(fs.existsSync(p), 'falta ' + i.image_asset); const s = fs.readFileSync(p, 'utf8'); assert.match(s, /^<svg[\s\S]*<\/svg>\s*$/); assert.match(s, /Ilustración original/); assert.ok(!/<image|href="http/.test(s), 'imagen externa incrustada'); const h = sha(s); assert.ok(!shas.has(h), 'imagen repetida'); shas.add(h); }); });
}
t('Instrucciones de las 4 partes de Listening (texto original de la Academia)', () => { ['P1', 'P2', 'P3', 'P4'].forEach(p => { const c = man.clips['DIR-' + p]; assert.ok(c && fs.existsSync(path.join(root, c.file))); }); });
t('Sin audios duplicados ni huérfanos en disco', () => {
  const s = new Set(); Object.entries(man.clips).forEach(([k, c]) => { assert.ok(!s.has(c.sha256), 'duplicado ' + k); s.add(c.sha256); });
  const listed = new Set(Object.values(man.clips).map(c => path.normalize(c.file)));
  const disk = []; for (const d of ['A', 'B', 'common']) { const p = path.join(root, 'audio', d); if (fs.existsSync(p)) fs.readdirSync(p).forEach(f => disk.push(path.normalize(`audio/${d}/${f}`))); }
  assert.deepEqual(disk.filter(f => !listed.has(f)), []);
});
t('El manifiesto declara que la revisión auditiva humana está PENDIENTE', () => { assert.equal(man.human_review, 'PENDIENTE'); });
results.forEach(([s, n]) => console.log(s, n));
const fail = results.filter(r => r[0] === 'FAIL').length; console.log(`\n${results.length - fail}/${results.length} PASS`); process.exit(fail ? 1 : 0);
