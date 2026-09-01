import fs from 'node:fs';
import crypto from 'node:crypto';

const files = [
  ['src/examenes_modes.jsx', 'e9009020f4d081f000205b52028d8907f4b3c8d4'],
  ['src/examenes_bundle.jsx', '76e4017b73de426530fca6ed09ae6bf76c195cbf'],
];

function gitBlobSha(text) {
  const body = Buffer.from(text, 'utf8');
  return crypto.createHash('sha1').update(`blob ${body.length}\0`).update(body).digest('hex');
}

const helperAnchor = 'function TeacherWrittenBackendReviewF940({ row, onBack, onDone }) {';
const helper = `function examTeacherSafeUserError(raw, fallback, context) {\n  const detail = String(raw == null ? '' : raw).trim();\n  if (detail) console.warn(\`[CS21A210BA][TeacherWritten][\${context || 'unknown'}]\`, detail);\n  return fallback;\n}\n\n`;

const replacements = [
  ["setErr((attRes && (attRes.mensaje || attRes.error)) || 'No se pudo abrir la entrega.');", "setErr(examTeacherSafeUserError(attRes && (attRes.mensaje || attRes.error), 'No se pudo abrir la entrega. Intentá nuevamente.', 'get_attempt'));"],
  ["setErr((createRes && (createRes.mensaje || createRes.error)) || 'No se pudo preparar la revisión.');", "setErr(examTeacherSafeUserError(createRes && (createRes.mensaje || createRes.error), 'No se pudo preparar la revisión. Intentá nuevamente.', 'create_review'));"],
  ["setErr((revRes && (revRes.mensaje || revRes.error)) || 'No se pudo cargar la revisión.');", "setErr(examTeacherSafeUserError(revRes && (revRes.mensaje || revRes.error), 'No se pudo cargar la revisión. Intentá nuevamente.', 'get_review'));"],
  ["setErr((closeRes && (closeRes.mensaje || closeRes.error)) || 'No se pudo cerrar la revisión.');", "setErr(examTeacherSafeUserError(closeRes && (closeRes.mensaje || closeRes.error), 'No se pudo cerrar la revisión. Intentá nuevamente.', 'close_review'));"],
  ["setErr((pushRes && (pushRes.mensaje || pushRes.error)) || 'La revisión se cerró, pero no se pudo registrar la nota. Presioná Enviar Nota nuevamente.');", "setErr(examTeacherSafeUserError(pushRes && (pushRes.mensaje || pushRes.error), 'La revisión se cerró, pero no se pudo registrar la nota. Presioná Enviar Nota nuevamente.', 'push_after_close'));"],
  ["if (!r || r.ok === false) { setErr((r && (r.mensaje || r.error)) || 'No se pudo enviar la nota.'); return; }", "if (!r || r.ok === false) { setErr(examTeacherSafeUserError(r && (r.mensaje || r.error), 'No se pudo enviar la nota. Intentá nuevamente.', 'push_retry')); return; }"],
  ["setErr((r && (r.mensaje || r.error)) || 'No se pudo consultar la bandeja de entregas.');", "setErr(examTeacherSafeUserError(r && (r.mensaje || r.error), 'No se pudo consultar la bandeja de entregas. Intentá nuevamente.', 'review_inbox'));"],
];

for (const [path, expectedSha] of files) {
  let src = fs.readFileSync(path, 'utf8');
  const before = gitBlobSha(src);
  if (before !== expectedSha) throw new Error(`${path}: preimage blob ${before} != ${expectedSha}`);
  if ((src.split(helperAnchor).length - 1) !== 1) throw new Error(`${path}: helper anchor not unique`);
  src = src.replace(helperAnchor, helper + helperAnchor);
  for (const [oldText, newText] of replacements) {
    const count = src.split(oldText).length - 1;
    if (count !== 1) throw new Error(`${path}: expected one sink, found ${count}: ${oldText.slice(0,70)}`);
    src = src.replace(oldText, newText);
  }
  fs.writeFileSync(path, src);
  console.log(`${path}: ${before} -> ${gitBlobSha(src)}`);
}
