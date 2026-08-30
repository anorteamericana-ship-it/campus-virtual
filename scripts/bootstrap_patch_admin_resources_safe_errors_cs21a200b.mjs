import fs from 'node:fs';

const path = 'src/book_unit_starts_cs21a60.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(before, after);
}

const anchor = "  function inferStudentLevel(user) {";
const helper = `  function bookResourcesSafeUserError(raw, fallback, context = '') {\n    const msg = String(raw?.message ?? raw ?? '').trim();\n    if (!msg) return fallback;\n    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request_id|file_id|base64|sha-?256|mime/i.test(msg);\n    if (technicalCode || technicalText) {\n      console.warn('[BookResources] Detalle técnico oculto al usuario.', { context, error: msg });\n      return fallback;\n    }\n    return msg;\n  }\n\n`;
replaceExact(anchor, helper + anchor, 'insert safe error helper');

replaceExact(
  "        setError(String(reason?.message || reason || 'No se pudo cargar el libro.'));",
  "        setError(bookResourcesSafeUserError(reason, 'No se pudo cargar el libro. Reintentá.', 'cargar_libro'));",
  'sanitize load error'
);

replaceExact(
  "        setMessage(''); setError(String(reason?.message || reason || 'No se pudo guardar el inicio de la unidad.'));",
  "        setMessage(''); setError(bookResourcesSafeUserError(reason, 'No se pudo guardar el inicio de la unidad. Intentá de nuevo.', 'guardar_inicio_unidad'));",
  'sanitize unit save error'
);

replaceExact(
  "        setMessage(''); setError(String(reason?.message || reason || 'No se pudo actualizar el libro desde Drive.'));",
  "        setMessage(''); setError(bookResourcesSafeUserError(reason, 'No se pudo actualizar el libro. Intentá de nuevo.', 'actualizar_libro'));",
  'sanitize refresh error'
);

fs.writeFileSync(path, src);
console.log('CS21A200B exact patch applied');
