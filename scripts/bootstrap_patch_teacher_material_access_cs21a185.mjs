import fs from 'node:fs';

const path = 'src/teacher_cs21a.jsx';
let s = fs.readFileSync(path, 'utf8');

function replaceOnce(oldText, newText, label) {
  const count = s.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exact preimage once, found ${count}`);
  s = s.replace(oldText, newText);
}

const anchor = "  const BLUE = 'var(--an-navy-ink, #001E47)';";
const helper = `  const BLUE = 'var(--an-navy-ink, #001E47)';\n\n  function teacherMaterialSafeUserError(raw, fallback, context = '') {\n    const msg = String(raw == null ? '' : raw).trim();\n    if (!msg) return fallback;\n    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|sha-?256|\\bmime\\b|base64|respuesta inv[aá]lida|servidor.*(?:fn|getDocente|getAsistencia|getFechas)|sec00|policy_unbound/i.test(msg);\n    if (technicalCode || technicalText) {\n      console.warn('[Teacher] Detalle técnico oculto al docente.', { context, error: msg });\n      return fallback;\n    }\n    return msg;\n  }`;
replaceOnce(anchor, helper, 'insert safe teacher helper');

replaceOnce(
  "      } catch(e) { setState(s=>({ ...s, loading:false, error:e?.message || String(e) })); }",
  "      } catch(e) { setState(s=>({ ...s, loading:false, error:teacherMaterialSafeUserError(e?.message || String(e), 'No se pudo cargar el resumen docente. Intentá de nuevo.', 'resumen_asistencia') })); }",
  'safe attendance error'
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A185 exact patch applied');
