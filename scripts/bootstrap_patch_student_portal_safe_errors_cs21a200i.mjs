import fs from 'node:fs';

const path = 'src/student_portal.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(before, after);
}

const anchor = `function usePortalEstudianteData(codigo) {`;
const helper = `function studentPortalSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|getportalestudiantecompleto|getestudiante|request_id|file_id|base64|sha-?256|mime/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[StudentPortal] Detalle técnico oculto al estudiante.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n\n`;
replaceExact(anchor, helper + anchor, 'insert portal safe-error helper');

replaceExact(
  "        else setState({ loading:false, data:null, error:d?.error || base?.error || 'No se pudo cargar el portal.' });",
  "        else setState({ loading:false, data:null, error:studentPortalSafeUserError(d?.error || base?.error, 'No pudimos cargar tu portal. Intentá de nuevo.', 'portal_y_fallback') });",
  'portal raw error boundary'
);

fs.writeFileSync(path, src);
console.log('CS21A200I exact student portal safe-error patch applied');
