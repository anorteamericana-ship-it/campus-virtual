import fs from 'node:fs';

const path = 'src/becas_admin.jsx';
let s = fs.readFileSync(path, 'utf8');
function one(label, oldText, newText) {
  const n = s.split(oldText).length - 1;
  if (n !== 1) throw new Error(`${label}: expected 1 exact preimage, found ${n}`);
  s = s.replace(oldText, newText);
}

const helper = `function bkSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|no se pudo conectar con el servidor|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request[_ -]?id|crearBeca|editarBeca|cambiarBeca|getBecas/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[AdminBecas] Detalle técnico oculto al operador.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n`;

one('insert Becas sanitizer', "})();\n\nconst BK_RUBROS = [", "})();\n\n" + helper + "\nconst BK_RUBROS = [");

one(
  'create opens protected block',
  "  const crear = async () => {\n    setEnviando(true);\n    const res = await window.crearBeca({",
  "  const crear = async () => {\n    setEnviando(true);\n    try {\n      const res = await window.crearBeca({"
);
one(
  'create closes await and defers sending release',
  "    });\n    setEnviando(false); setConfirm(false);",
  "      });\n      setConfirm(false);"
);
one(
  'create backend response safe copy',
  "      onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo crear la beca.' });",
  "      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo crear la beca. Intentá de nuevo.', 'crear_beca') });"
);
one(
  'create closes protected block',
  "      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo crear la beca. Intentá de nuevo.', 'crear_beca') });\n    }\n  };",
  "      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo crear la beca. Intentá de nuevo.', 'crear_beca') });\n    }\n    } catch (e) {\n      console.error('[AdminBecas] Error técnico creando beca.', e);\n      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(e?.message || String(e), 'No se pudo crear la beca. Intentá de nuevo.', 'crear_beca') });\n    } finally { setEnviando(false); }\n  };"
);

one(
  'load backend response',
  "      if (!r || !r.ok) { setErr((r && r.error) || 'No se pudo cargar la lista de becas.'); return; }",
  "      if (!r || !r.ok) { console.warn('[AdminBecas] Respuesta de lista no disponible.', r?.error || r?.mensaje || r); setErr(bkSafeUserError(r?.error || r?.mensaje, 'No se pudo cargar la lista de becas. Intentá de nuevo.', 'cargar_becas')); return; }"
);
one(
  'load exception boundary',
  "    }).catch(e => setErr(e.message));",
  "    }).catch(e => { console.error('[AdminBecas] Error técnico cargando becas.', e); setErr(bkSafeUserError(e?.message || String(e), 'No se pudo cargar la lista de becas. Intentá de nuevo.', 'cargar_becas')); });"
);

one(
  'toggle active protected action',
  "  const toggleActiva = async (b) => {\n    setBusy(b.id);\n    const res = await window.cambiarBecaActivo({ id: b.id, activo: !b.activa });\n    setBusy(null);\n    if (res && res.ok) { cargar(); onToast && onToast({ tipo: 'ok', msg: `Beca ${b.activa ? 'desactivada' : 'activada'}.` }); }\n    else onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo cambiar el estado.' });\n  };",
  "  const toggleActiva = async (b) => {\n    setBusy(b.id);\n    try {\n      const res = await window.cambiarBecaActivo({ id: b.id, activo: !b.activa });\n      if (res && res.ok) { cargar(); onToast && onToast({ tipo: 'ok', msg: `Beca ${b.activa ? 'desactivada' : 'activada'}.` }); }\n      else onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo cambiar el estado. Intentá de nuevo.', 'cambiar_estado_beca') });\n    } catch (e) {\n      console.error('[AdminBecas] Error técnico cambiando estado.', e);\n      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(e?.message || String(e), 'No se pudo cambiar el estado. Intentá de nuevo.', 'cambiar_estado_beca') });\n    } finally { setBusy(null); }\n  };"
);

one(
  'toggle visibility protected action',
  "  const toggleVisible = async (b) => {\n    setBusy(b.id);\n    const res = await window.cambiarBecaVisibilidad({ id: b.id, visible: !b.visible_inscripcion });\n    setBusy(null);\n    if (res && res.ok) { cargar(); onToast && onToast({ tipo: 'ok', msg: `Visibilidad ${b.visible_inscripcion ? 'desactivada' : 'activada'}.` }); }\n    else onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo cambiar la visibilidad.' });\n  };",
  "  const toggleVisible = async (b) => {\n    setBusy(b.id);\n    try {\n      const res = await window.cambiarBecaVisibilidad({ id: b.id, visible: !b.visible_inscripcion });\n      if (res && res.ok) { cargar(); onToast && onToast({ tipo: 'ok', msg: `Visibilidad ${b.visible_inscripcion ? 'desactivada' : 'activada'}.` }); }\n      else onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo cambiar la visibilidad. Intentá de nuevo.', 'cambiar_visibilidad_beca') });\n    } catch (e) {\n      console.error('[AdminBecas] Error técnico cambiando visibilidad.', e);\n      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(e?.message || String(e), 'No se pudo cambiar la visibilidad. Intentá de nuevo.', 'cambiar_visibilidad_beca') });\n    } finally { setBusy(null); }\n  };"
);

one(
  'edit opens protected block',
  "  const guardar = async () => {\n    setEnviando(true);\n    const res = await window.editarBeca({",
  "  const guardar = async () => {\n    setEnviando(true);\n    try {\n      const res = await window.editarBeca({"
);
one(
  'edit closes await and defers sending release',
  "    });\n    setEnviando(false);\n    if (res && res.ok) onGuardada();",
  "      });\n      if (res && res.ok) onGuardada();"
);
one(
  'edit backend response safe copy',
  "    else onToast && onToast({ tipo: 'err', msg: (res && res.error) || 'No se pudo guardar.' });",
  "      else onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo guardar la beca. Intentá de nuevo.', 'editar_beca') });"
);
one(
  'edit closes protected block',
  "      else onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo guardar la beca. Intentá de nuevo.', 'editar_beca') });\n  };",
  "      else onToast && onToast({ tipo: 'err', msg: bkSafeUserError(res?.error || res?.mensaje, 'No se pudo guardar la beca. Intentá de nuevo.', 'editar_beca') });\n    } catch (e) {\n      console.error('[AdminBecas] Error técnico editando beca.', e);\n      onToast && onToast({ tipo: 'err', msg: bkSafeUserError(e?.message || String(e), 'No se pudo guardar la beca. Intentá de nuevo.', 'editar_beca') });\n    } finally { setEnviando(false); }\n  };"
);

fs.writeFileSync(path, s, 'utf8');
console.log('CS21A198 exact Becas safe-action patch applied');
