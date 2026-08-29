from pathlib import Path


def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{label}: expected {expected} preimage(s), found {count}')
    return text.replace(old, new)


drawer_path = Path('src/ventas_drawer.jsx')
drawer = drawer_path.read_text(encoding='utf-8')

drawer = replace_exact(
    drawer,
    "const sleep = ms => new Promise(r => setTimeout(r, ms));\n",
    """const sleep = ms => new Promise(r => setTimeout(r, ms));

// CS21A173 · los detalles técnicos quedan en consola; la UI conserva mensajes
// de negocio legibles y usa un fallback estable para códigos internos.
function vxSafeUserError(raw, fallback, context = '') {
  const msg = String(raw == null ? '' : raw).trim();
  if (!msg) return fallback;
  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);
  const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|<html|\\bjson\\b|\\btoken\\b|sesion_requerida|unauthorized|forbidden|internal server|status\\s*\\d{3}|sha-?256|\\bmime\\b|base64|file_id|respuesta_vacia|integridad_|sec004_|demo_read_only|policy_unbound/i.test(msg);
  if (technicalCode || technicalText) {
    console.warn('[Ventas] Detalle técnico oculto al usuario.', { context, error: msg });
    return fallback;
  }
  return msg;
}
""",
    'insert safe-user helper',
)

replacements = [
    ("const m = (r && (r.mensaje || r.error)) || msgFalla;", "const m = vxSafeUserError(r && (r.mensaje || r.error), msgFalla, `documento:${tipo}`);", 'document generation', 1),
    ("const m = (r && (r.mensaje || r.error)) || 'No se pudo subir la matrícula firmada.';", "const m = vxSafeUserError(r && (r.mensaje || r.error), 'No se pudo subir la matrícula firmada.', 'subir_matricula_firmada');", 'signed upload', 1),
    ("if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir la matrícula firmada.');", "if (!r?.ok || !r.blob) throw new Error(vxSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir la matrícula firmada.', 'abrir_matricula_firmada'));", 'signed open response', 1),
    ("const m = e?.message || 'No se pudo abrir la matrícula firmada.';", "const m = vxSafeUserError(e?.message, 'No se pudo abrir la matrícula firmada.', 'abrir_matricula_firmada');", 'signed open catch', 1),
    ("const m = (r && (r.mensaje || r.error)) || 'No se pudo enviar la notificación.';", "const m = vxSafeUserError(r && (r.mensaje || r.error), 'No se pudo enviar la notificación.', `notificar_matricula:${canal}`);", 'signed notify', 1),
    ("setErr((r && r.error) || 'No se pudo registrar el cobro. Intentá de nuevo.');", "setErr(vxSafeUserError(r && r.error, 'No se pudo registrar el cobro. Intentá de nuevo.', 'cobrar_matricula'));", 'charge', 1),
    ("else setErr((r && r.error) || 'No se pudo activar. Intentá de nuevo.');", "else setErr(vxSafeUserError(r && r.error, 'No se pudo activar. Intentá de nuevo.', 'activar_estudiante'));", 'activate', 1),
    ("else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo agregar la nota' });", "else onToast({ tipo: 'err', msg: vxSafeUserError(r && r.error, 'No se pudo agregar la nota', 'agregar_nota') });", 'notes', 2),
    ("setErr((res && res.error) || 'No se pudo reportar el pago. Intentá de nuevo.');", "setErr(vxSafeUserError(res && res.error, 'No se pudo reportar el pago. Intentá de nuevo.', 'reportar_pago'));", 'payment report', 1),
    ("} else setErr((res && res.error) || 'No se pudo cancelar el prospecto.');", "} else setErr(vxSafeUserError(res && res.error, 'No se pudo cancelar el prospecto.', 'cancelar_prospecto'));", 'cancel prospect', 1),
    ("else setError((d && d.error) || 'No se pudo cargar el prospecto.');", "else setError(vxSafeUserError(d && d.error, 'No se pudo cargar el prospecto.', 'cargar_prospecto'));", 'load prospect', 1),
    ("if (!r?.ok || !r.blob) throw new Error(r?.mensaje || r?.error || 'No se pudo abrir el documento.');", "if (!r?.ok || !r.blob) throw new Error(vxSafeUserError(r?.mensaje || r?.error, 'No se pudo abrir el documento.', 'abrir_documento_extra'));", 'private extra response', 1),
    ("onToast({ tipo:'err', msg:e?.message || 'No se pudo abrir el documento.' });", "onToast({ tipo:'err', msg:vxSafeUserError(e?.message, 'No se pudo abrir el documento.', 'abrir_documento_extra') });", 'private extra catch', 1),
    ("} else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo subir el documento' });", "} else onToast({ tipo: 'err', msg: vxSafeUserError(r && r.error, 'No se pudo subir el documento', 'subir_documento') });", 'upload extra', 1),
    ("} else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo actualizar la etapa' });", "} else onToast({ tipo: 'err', msg: vxSafeUserError(r && r.error, 'No se pudo actualizar la etapa', 'actualizar_etapa') });", 'stage update', 1),
    ("msg: (r && (r.mensaje || r.error)) || 'No se pudo generar la proforma.',", "msg: vxSafeUserError(r && (r.mensaje || r.error), 'No se pudo generar la proforma.', `generar_proforma:${tipo}`),", 'proforma response', 1),
    ("onToast({ tipo: 'err', msg: (err && err.message) || 'Error de conexión.' });", "onToast({ tipo: 'err', msg: vxSafeUserError(err && err.message, 'Error de conexión.', `generar_proforma:${tipo}`) });", 'proforma catch', 1),
    ("} else onToast({ tipo: 'err', msg: (r && r.error) || 'No se pudo actualizar la beca.' });", "} else onToast({ tipo: 'err', msg: vxSafeUserError(r && r.error, 'No se pudo actualizar la beca.', 'actualizar_beca') });", 'scholarship', 1),
]
for old, new, label, expected in replacements:
    drawer = replace_exact(drawer, old, new, label, expected)

drawer = replace_exact(
    drawer,
    "      } catch (_) { if (!cancel) setGrupos(window.DEMO_GRUPOS); }",
    """      } catch (err) {
        console.error('[Ventas CS21A173] Falló la carga real de grupos disponibles.', err);
        if (!cancel) setGrupos([]);
      }""",
    'real groups fallback',
)
drawer = replace_exact(
    drawer,
    "    <select className=\"vx-select\" style={{ width: '100%' }} value={value} onChange={e => onChange(e.target.value)}>",
    "    <select className=\"vx-select\" style={{ width: '100%' }} value={value} disabled={grupos.length === 0} onChange={e => onChange(e.target.value)}>",
    'group select disabled',
)
drawer = replace_exact(
    drawer,
    "      <option value=\"\">Seleccioná un grupo…</option>",
    "      <option value=\"\">{grupos.length ? 'Seleccioná un grupo…' : 'No hay grupos disponibles'}</option>",
    'group empty label',
)
drawer_path.write_text(drawer, encoding='utf-8')


dashboard_path = Path('src/ventas_dashboard.jsx')
dashboard = dashboard_path.read_text(encoding='utf-8')
dashboard = replace_exact(
    dashboard,
    "        if (!data || !data.ok) throw new Error((data && data.error) || 'No se pudo cargar el panel.');",
    """        if (!data || !data.ok) {
          console.error('[Ventas CS21A173] No se pudo cargar el dashboard real.', data && (data.error || data.mensaje));
          throw new Error('ventas_dashboard_unavailable');
        }""",
    'dashboard backend error',
)
dashboard = replace_exact(
    dashboard,
    "        if (!cancel) setErrorCarga(e.message || 'No pudimos cargar tu panel desde el servidor.');",
    """        console.error('[Ventas CS21A173] Falló la carga del dashboard real.', e);
        if (!cancel) setErrorCarga('No pudimos cargar tu panel. Recargá la página e intentá nuevamente.');""",
    'dashboard visible error',
)
dashboard_path.write_text(dashboard, encoding='utf-8')
