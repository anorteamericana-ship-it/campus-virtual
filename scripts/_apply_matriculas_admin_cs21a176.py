from pathlib import Path

path = Path('src/matriculas_admin.jsx')
s = path.read_text(encoding='utf-8')


def rep(old, new, count=1, label='replacement'):
    global s
    found = s.count(old)
    if found != count:
        raise SystemExit(f'{label}: expected {count}, found {found}')
    s = s.replace(old, new)

# 1) Central safe-user error filter.
old = """  const boolTxt = (v) => (v === true || /^(true|s[ií]|1)$/i.test(String(v))) ? 'Sí'\n    : (v === false || /^(false|no|0)$/i.test(String(v))) ? 'No' : (v || '');\n"""
new = old + """\n  // CS21A176 · conservar diagnóstico técnico sin convertirlo en copy visible.\n  function matSafeUserError(raw, fallback, context = '') {\n    const msg = String(raw == null ? '' : raw).trim();\n    if (!msg) return fallback;\n    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|sesion_requerida|no autorizado|unauthorized|forbidden|internal server|status\\s*\\d{3}|respuesta_vacia|integridad_|policy_unbound|demo_read_only/i.test(msg);\n    if (technicalCode || technicalText) {\n      console.warn('[Matrículas] Detalle técnico oculto al usuario.', { context, error: msg });\n      return fallback;\n    }\n    return msg;\n  }\n"""
rep(old, new, label='safe helper insertion')

# 2) MatProspectoModal no simula edición sin endpoint de persistencia.
rep("    const canEditAll = rol === 'admin' || rol === 'superadmin';\n", "", label='remove fake edit role')
rep("    const [edited, setEdited] = useState({});\n", "", label='remove fake edited state')
rep("""    const val = (f) => {\n      if (edited[f.k] !== undefined) return edited[f.k];\n      let v = get(...(f.al || [f.k]));\n      if (f.bool) v = boolTxt(v);\n      return v == null ? '' : v;\n    };\n    const onCh = (f) => (nv) => setEdited(e => ({ ...e, [f.k]: nv }));\n    const editableOf = (f) => canEditAll && !f.ro && !f.bool;\n""", """    const val = (f) => {\n      let v = get(...(f.al || [f.k]));\n      if (f.bool) v = boolTxt(v);\n      return v == null ? '' : v;\n    };\n    // No existe hoy un endpoint contractual de actualización general del prospecto.\n    // La ficha queda fail-closed en lectura hasta que exista persistencia real + QA.\n    const onCh = () => () => {};\n    const editableOf = () => false;\n""", label='readonly value contract')

rep("""        else onToast((r && r.error) || 'No se pudo guardar la nota.', 'err');\n      } catch (e) { onToast('Error de conexión: ' + e.message, 'err'); }\n""", """        else onToast(matSafeUserError(r && r.error, 'No se pudo guardar la nota.', 'guardar_nota'), 'err');\n      } catch (e) {\n        console.error('[Matrículas CS21A176] Error técnico guardando nota.', e);\n        onToast('No se pudo guardar la nota. Revisá tu conexión e intentá nuevamente.', 'err');\n      }\n""", label='safe note errors')
rep("    const guardarCambios = () => onToast('Próximamente: guardado completo de campos.', 'info');\n", "", label='remove fake save handler')

rep("""    const footer = loading || error ? (\n      <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n    ) : isVentas ? (\n      <>\n        <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n        <button className=\"btn btn-primary\" onClick={guardarNota} disabled={saving || !notaNueva.trim()}>\n          {saving ? 'Guardando…' : 'Guardar nota'}\n        </button>\n      </>\n    ) : canEditAll ? (\n      <>\n        <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n        <button className=\"btn btn-primary\" onClick={guardarCambios}>Guardar cambios</button>\n      </>\n    ) : (\n      <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n    );\n""", """    const footer = loading || error ? (\n      <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n    ) : isVentas ? (\n      <>\n        <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n        <button className=\"btn btn-primary\" onClick={guardarNota} disabled={saving || !notaNueva.trim()}>\n          {saving ? 'Guardando…' : 'Guardar nota'}\n        </button>\n      </>\n    ) : (\n      <button className=\"btn btn-ghost\" onClick={onClose}>Cerrar</button>\n    );\n""", label='remove fake save button')

sales_banner = """            {isVentas && (\n              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>\n                Como asesor de ventas solo podés editar el bloque de <b>notas</b>. El resto es de solo lectura.\n              </div>\n            )}\n\n"""
staff_banner = sales_banner + """            {!isVentas && (\n              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 16, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>\n                Datos generales · solo lectura en esta vista.\n              </div>\n            )}\n\n"""
rep(sales_banner, staff_banner, label='readonly staff banner')

# 3) All generic detail loaders stop exposing backend/exception text.
rep("setError((d && d.error) || 'No se pudo cargar el prospecto.')", "setError(matSafeUserError(d && d.error, 'No se pudo cargar el prospecto. Intentá nuevamente.', 'cargar_prospecto'))", count=3, label='prospect detail response errors')
rep("setError((d && d.error) || 'No se pudo cargar la ficha.')", "setError(matSafeUserError(d && d.error, 'No se pudo cargar la ficha. Intentá nuevamente.', 'cargar_ficha'))", label='record response error')
rep(".catch(e => { if (!cancel) setError(e.message); })", ".catch(e => { if (!cancel) { console.error('[Matrículas CS21A176] Error técnico cargando datos.', e); setError('No pudimos cargar la información. Intentá nuevamente.'); } })", count=4, label='generic load exception errors')

# 4) CONAPE status must not surface r.error/e.message.
rep("""          else { setError((r && r.error) || 'No se pudo consultar el estado CONAPE.'); onToast && onToast((r && r.error) || 'No se pudo consultar el estado CONAPE.', 'err'); }\n        })\n        .catch(e => { if (!cancel) { setError(e.message); onToast && onToast('Error de conexión: ' + e.message, 'err'); } })\n""", """          else { const msg = matSafeUserError(r && r.error, 'No se pudo consultar el estado CONAPE.', 'consultar_conape'); setError(msg); onToast && onToast(msg, 'err'); }\n        })\n        .catch(e => { if (!cancel) { console.error('[Matrículas CS21A176] Error técnico consultando CONAPE.', e); const msg = 'No se pudo consultar el estado CONAPE. Intentá nuevamente.'; setError(msg); onToast && onToast(msg, 'err'); } })\n""", label='safe CONAPE errors')

# 5) Matrícula generation catch remains actionable, never raw.
rep("""      } catch (e) {\n        onToast('Error de conexión: ' + (e && e.message ? e.message : 'desconocido'), 'err');\n        setSubmitting(false);\n      }\n""", """      } catch (e) {\n        console.error('[Matrículas CS21A176] Error técnico generando matrícula.', e);\n        onToast('No se pudo generar la matrícula. Revisá tu conexión e intentá nuevamente.', 'err');\n        setSubmitting(false);\n      }\n""", label='safe enrollment generation exception')

path.write_text(s, encoding='utf-8')
print('CS21A176 exact source patch applied')
