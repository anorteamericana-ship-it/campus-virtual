import fs from 'node:fs';

const path = 'src/aperturas_admin_cs21a20.jsx';
let s = fs.readFileSync(path, 'utf8');
function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
}

const helper = `function apSafeUserError(raw, fallback, context = '') {\n    const msg = String(raw == null ? '' : raw).trim();\n    if (!msg) return fallback;\n    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|getAperturasAdmin|actualizarAperturaAdmin/i.test(msg);\n    if (technicalCode || technicalText) {\n      console.warn('[AdminAperturas] Detalle técnico oculto al operador.', { context, error: msg });\n      return fallback;\n    }\n    return msg;\n  }\n`;

one(
  'insert Aperturas sanitizer',
  "  function apMoney(value) {",
  helper + "\n  function apMoney(value) {"
);

one(
  'save exception boundary',
  "        setError(e && e.message ? e.message : 'No se pudo actualizar la apertura.');",
  "        setError(apSafeUserError(e?.message || String(e), 'No se pudo actualizar la apertura. Intentá de nuevo.', 'guardar_apertura'));"
);

one(
  'load exception boundary',
  "        .catch(e => { if (live) { setError(e && e.message ? e.message : 'No se pudieron cargar las aperturas.'); setItems([]); } });",
  "        .catch(e => { if (live) { setError(apSafeUserError(e?.message || String(e), 'No se pudieron cargar las aperturas. Intentá de nuevo.', 'cargar_aperturas')); setItems([]); } });"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A197 exact Aperturas safe-error patch applied');
