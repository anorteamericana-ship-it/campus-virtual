import fs from 'node:fs';

const path = 'src/cronograma_grupo.jsx';
let src = fs.readFileSync(path, 'utf8');

function replaceExact(before, after, label) {
  const count = src.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src = src.replace(before, after);
}

const anchor = '// Sentinel para la vista "Todos los grupos" (solo admin/superadmin).';
const helper = `function cronoSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw?.message ?? raw ?? '').trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|error de red|error de conexi[oó]n|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request_id|file_id|base64|sha-?256|mime|apollo\\.|grupos\\.docente/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[Cronograma] Detalle técnico oculto al usuario.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n\n`;
replaceExact(anchor, helper + anchor, 'insert safe-error helper');

replaceExact(
  'if (d.mensaje && !mapped.length) setErrorGrupos(d.mensaje);',
  "if (d.mensaje && !mapped.length) setErrorGrupos(cronoSafeUserError(d.mensaje, 'No hay grupos en curso o proyectados asignados a este docente.', 'cargar_grupos_docente'));",
  'teacher empty-message boundary'
);
replaceExact(
  "setErrorGrupos(d?.mensaje || d?.error || 'No hay grupos en curso o proyectados para este docente según APOLLO.GRUPOS. Revisá columna DOCENTE y fechas de inicio.');",
  "setErrorGrupos(cronoSafeUserError(d?.mensaje || d?.error, 'No hay grupos en curso o proyectados asignados a este docente.', 'cargar_grupos_docente'));",
  'teacher groups boundary'
);
replaceExact(
  ".catch(e => setErrorGrupos('Error de conexión cargando grupos docentes desde GRUPOS: ' + (e?.message || e)))",
  ".catch(e => setErrorGrupos(cronoSafeUserError(e, 'No pudimos cargar los grupos asignados. Intentá de nuevo.', 'cargar_grupos_docente')))",
  'teacher groups network boundary'
);
replaceExact(
  "setErrorGrupos(d?.error || 'No se pudo cargar el calendario académico.');",
  "setErrorGrupos(cronoSafeUserError(d?.error, 'No se pudo cargar el calendario académico. Intentá de nuevo.', 'cargar_grupos_admin'));",
  'admin groups boundary'
);
replaceExact(
  "if (!cacheVigente) setErrorGrupos('Error de red: ' + (e?.message || e));",
  "if (!cacheVigente) setErrorGrupos(cronoSafeUserError(e, 'No se pudo cargar el calendario académico. Intentá de nuevo.', 'cargar_grupos_admin'));",
  'admin groups network boundary'
);
replaceExact(
  ": ('No se pudieron cargar las lecciones. ' + (e?.message || '')));",
  ": cronoSafeUserError(e, 'No se pudieron cargar las lecciones. Intentá de nuevo.', 'cargar_lecciones'));",
  'individual lessons boundary'
);
replaceExact(
  "return { ok:false, grupo:g, nivel:nivelG, error:d?.error || 'sin_lecciones', lecciones:[] };",
  "return { ok:false, grupo:g, nivel:nivelG, error:cronoSafeUserError(d?.mensaje || d?.error, 'No se pudieron cargar las lecciones de este grupo.', 'agenda_grupo'), lecciones:[] };",
  'agenda group response boundary'
);
replaceExact(
  ".catch(e => ({ ok:false, grupo:g, nivel:nivelG, error:e?.message || String(e || 'error_red'), lecciones:[] }));",
  ".catch(e => ({ ok:false, grupo:g, nivel:nivelG, error:cronoSafeUserError(e, 'No se pudieron cargar las lecciones de este grupo.', 'agenda_grupo'), lecciones:[] }));",
  'agenda group network boundary'
);
replaceExact(
  "setErrorAgenda('No se pudo cargar la agenda docente: ' + (e?.message || e));",
  "setErrorAgenda(cronoSafeUserError(e, 'No se pudo cargar la agenda docente. Intentá de nuevo.', 'agenda_docente'));",
  'agenda aggregate boundary'
);
replaceExact(
  "setErr((res && res.error) || 'No se pudo asignar la cobertura.');",
  "setErr(cronoSafeUserError(res?.error, 'No se pudo asignar la cobertura. Intentá de nuevo.', 'asignar_cobertura'));",
  'coverage boundary'
);
replaceExact(
  "if (vivo) { setErrCarga(r?.error || 'No se pudieron cargar los estudiantes.'); setCargando(false); }",
  "if (vivo) { setErrCarga(cronoSafeUserError(r?.error, 'No se pudieron cargar los estudiantes. Intentá de nuevo.', 'cargar_estudiantes')); setCargando(false); }",
  'student roster response boundary'
);
replaceExact(
  "if (vivo) { setErrCarga('Error de red: ' + e.message); setCargando(false); }",
  "if (vivo) { setErrCarga(cronoSafeUserError(e, 'No se pudieron cargar los estudiantes. Intentá de nuevo.', 'cargar_estudiantes')); setCargando(false); }",
  'student roster network boundary'
);
replaceExact(
  "setErrEnvio(e.message || 'Error guardando cambios.');",
  "setErrEnvio(cronoSafeUserError(e, 'No se pudieron guardar los cambios. Intentá de nuevo.', 'guardar_leccion'));",
  'lesson save boundary'
);

fs.writeFileSync(path, src);
console.log('CS21A200C exact patch applied');
