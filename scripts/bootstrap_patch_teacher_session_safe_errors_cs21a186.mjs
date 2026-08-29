import fs from 'node:fs';

function patchFile(path, patches) {
  let s = fs.readFileSync(path, 'utf8');
  for (const [oldText, newText, label] of patches) {
    const count = s.split(oldText).length - 1;
    if (count !== 1) throw new Error(`${path} · ${label}: expected exact preimage once, found ${count}`);
    s = s.replace(oldText, newText);
  }
  fs.writeFileSync(path, s, 'utf8');
}

const helperViews = `const SCRIPT_URL_TV = window.APPS_SCRIPT_URL;\n\nfunction teacherSessionSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|apollo\\.|getDocente|getAsistencia|getFechas|getEstudiantes|sec00|policy_unbound/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[TeacherSession] Detalle técnico oculto al docente.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}`;

patchFile('src/teacher_views.jsx', [
  [
    'const SCRIPT_URL_TV = window.APPS_SCRIPT_URL;',
    helperViews,
    'insert teacherSessionSafeUserError'
  ],
  [
    "          setErrorGroups(d.mensaje || 'No hay grupos marcados En curso para este docente en APOLLO.GRUPOS.');",
    "          setErrorGroups(teacherSessionSafeUserError(d?.mensaje, 'No hay grupos activos asignados en este momento.', 'sin_grupos'));",
    'safe empty-groups copy'
  ],
  [
    "      .catch(e => { if (!cancel) setErrorGroups(e?.message || String(e)); })",
    "      .catch(e => { if (!cancel) setErrorGroups(teacherSessionSafeUserError(e?.message || String(e), 'No pudimos cargar tus grupos. Intentá de nuevo.', 'cargar_grupos')); })",
    'safe groups error'
  ],
  [
    "      .catch(e => { if (!cancel) setErrorPanel(e?.message || String(e)); })",
    "      .catch(e => { if (!cancel) setErrorPanel(teacherSessionSafeUserError(e?.message || String(e), 'No pudimos cargar la información del grupo. Intentá de nuevo.', 'cargar_panel')); })",
    'safe panel error'
  ],
]);

const helperBridge = `const A=window.ANAtt77;\nfunction att77SafeUserError(raw,fallback,context){\n const msg=String(raw==null?'':raw).trim();\n if(!msg)return fallback;\n const technicalCode=/^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n const technicalText=/loader|cargador|fuente docente|apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|sec00|policy_unbound/i.test(msg);\n if(technicalCode||technicalText){console.warn('[Attendance77] Detalle técnico oculto al docente.',{context,error:msg});return fallback;}\n return msg;\n}`;

patchFile('src/att77_bridge.js', [
  [
    'const A=window.ANAtt77;',
    helperBridge,
    'insert att77SafeUserError'
  ],
  [
    "ensure().then(()=>{if(live)setS(typeof window.useTeacherSession==='function'?{ready:true,error:''}:{ready:false,error:'No se publicó la fuente docente.'})}).catch(e=>live&&setS({ready:false,error:e.message||String(e)}));",
    "ensure().then(()=>{if(live)setS(typeof window.useTeacherSession==='function'?{ready:true,error:''}:{ready:false,error:'No pudimos preparar el seguimiento académico. Intentá de nuevo.'})}).catch(e=>live&&setS({ready:false,error:att77SafeUserError(e?.message||String(e),'No pudimos preparar el seguimiento académico. Intentá de nuevo.','cargar_modulos')}));",
    'safe attendance bridge error'
  ],
]);

console.log('CS21A186 exact patch applied');
