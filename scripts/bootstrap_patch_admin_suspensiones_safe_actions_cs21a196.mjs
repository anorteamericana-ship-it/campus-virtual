import fs from 'node:fs';

const path = 'src/panel_suspensiones.jsx';
let s = fs.readFileSync(path, 'utf8');
function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
}

const helper = `function psuSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|fetchResolverSolicitudSuspension|fetchGetSolicitudesSuspension/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[AdminSuspensiones] Detalle técnico oculto al operador.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n`;

one(
  'insert suspensiones sanitizer',
  "}\n\nfunction PanelSuspensiones({ embedded = false } = {}) {",
  "}\n\n" + helper + "\nfunction PanelSuspensiones({ embedded = false } = {}) {"
);

one(
  'queue backend error',
  "          setErr(r?.error || 'No se pudo cargar la cola.');",
  "          console.warn('[AdminSuspensiones] Respuesta de cola no disponible.', r?.error || r?.mensaje || r);\n          setErr(psuSafeUserError(r?.error || r?.mensaje, 'No se pudo cargar la cola. Intentá de nuevo.', 'cargar_cola'));"
);
one(
  'queue network error',
  ".catch(e => { setErr('Error de red: ' + e.message); setLista([]); })",
  ".catch(e => { console.error('[AdminSuspensiones] Error técnico cargando cola.', e); setErr(psuSafeUserError(e?.message || String(e), 'No se pudo cargar la cola. Intentá de nuevo.', 'cargar_cola')); setLista([]); })"
);

one(
  'approve opens protected block',
  "    setResolviendo({ id: sol.id, accion: 'aprobar' });\n    const res = await window.fetchResolverSolicitudSuspension({",
  "    setResolviendo({ id: sol.id, accion: 'aprobar' });\n    try {\n      const res = await window.fetchResolverSolicitudSuspension({"
);
one(
  'approve releases legacy busy position',
  "    setResolviendo(null);\n    setConfirmAprobar(null);",
  "      setConfirmAprobar(null);"
);
one(
  'approve response error',
  "      showToast(res?.error || 'No se pudo aprobar la solicitud.', 'err');",
  "      showToast(psuSafeUserError(res?.error || res?.mensaje, 'No se pudo aprobar la solicitud. Intentá de nuevo.', 'aprobar_solicitud'), 'err');"
);
one(
  'approve closes protected block',
  "    showToast(`Aplicada · ${mensaje}`, 'ok');\n  };",
  "    showToast(`Aplicada · ${mensaje}`, 'ok');\n    } catch (e) {\n      console.error('[AdminSuspensiones] Error técnico aprobando solicitud.', e);\n      showToast(psuSafeUserError(e?.message || String(e), 'No se pudo aprobar la solicitud. Intentá de nuevo.', 'aprobar_solicitud'), 'err');\n    } finally { setResolviendo(null); }\n  };"
);

one(
  'reject opens protected block',
  "    setResolviendo({ id: sol.id, accion: 'rechazar' });\n    const res = await window.fetchResolverSolicitudSuspension({",
  "    setResolviendo({ id: sol.id, accion: 'rechazar' });\n    try {\n      const res = await window.fetchResolverSolicitudSuspension({"
);
one(
  'reject releases legacy busy position',
  "    setResolviendo(null);\n    setModalRechazar(null);",
  "      setModalRechazar(null);"
);
one(
  'reject response error',
  "      showToast(res?.error || 'No se pudo rechazar la solicitud.', 'err');",
  "      showToast(psuSafeUserError(res?.error || res?.mensaje, 'No se pudo rechazar la solicitud. Intentá de nuevo.', 'rechazar_solicitud'), 'err');"
);
one(
  'reject closes protected block',
  "    showToast('Rechazada · el calendario no cambió.', 'ok');\n  };",
  "    showToast('Rechazada · el calendario no cambió.', 'ok');\n    } catch (e) {\n      console.error('[AdminSuspensiones] Error técnico rechazando solicitud.', e);\n      showToast(psuSafeUserError(e?.message || String(e), 'No se pudo rechazar la solicitud. Intentá de nuevo.', 'rechazar_solicitud'), 'err');\n    } finally { setResolviendo(null); }\n  };"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A196 exact suspensiones safe-action patch applied');
