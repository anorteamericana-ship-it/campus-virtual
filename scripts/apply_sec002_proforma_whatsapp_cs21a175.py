from pathlib import Path


def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(f'{label}: expected {expected} preimage(s), found {count}')
    return text.replace(old, new, expected)


ventas_path = Path('src/ventas_drawer.jsx')
ventas = ventas_path.read_text(encoding='utf-8')
ventas = replace_exact(
    ventas,
    """  // Enviar por WhatsApp: si falta teléfono → error amigable, nunca rompe la UI.
  const enviarWa = () => {
    if (!waNum) { onToast && onToast({ tipo: 'err', msg: 'Este prospecto no tiene WhatsApp/teléfono registrado.' }); return; }
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg || '')}`, '_blank', 'noopener');
  };""",
    """  // SEC-002 CS21A175 · WhatsApp abre el chat, pero nunca recibe la URL pública
  // de la proforma. El asesor adjunta manualmente el PDF descargado.
  const enviarWa = () => {
    if (!waNum) { onToast && onToast({ tipo: 'err', msg: 'Este prospecto no tiene WhatsApp/teléfono registrado.' }); return; }
    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg || '')}`, '_blank', 'noopener');
    onToast && onToast({ tipo: 'ok', msg: 'WhatsApp abierto. Adjuntá el PDF descargado. Por seguridad no enviamos enlaces públicos de documentos.' });
  };""",
    'Ventas WhatsApp handler',
)
ventas = replace_exact(
    ventas,
    '<window.Vico d={window.VI.wa} size={14} fill="currentColor" /> Enviar por WhatsApp',
    '<window.Vico d={window.VI.wa} size={14} fill="currentColor" /> WhatsApp · adjuntar PDF',
    'Ventas WhatsApp label',
)
ventas = replace_exact(
    ventas,
    """                const waMsgCurso = `Hola! Te envío la proforma del curso de inglés. Podés verla aquí: ${d.proforma_url || ''}`;
                const waMsgEquipo = `Hola! Te envío la proforma del equipo (${equipoLabel}). Podés verla aquí: ${d.proforma_equipo_url || ''}`;""",
    """                const waMsgCurso = 'Hola! Te envío la proforma del curso de inglés. Te la adjunto como PDF en este chat.';
                const waMsgEquipo = `Hola! Te envío la proforma del equipo (${equipoLabel}). Te la adjunto como PDF en este chat.`;""",
    'Ventas WhatsApp messages',
)
ventas_path.write_text(ventas, encoding='utf-8')


admin_path = Path('src/matriculas_admin.jsx')
admin = admin_path.read_text(encoding='utf-8')
admin = replace_exact(
    admin,
    "else onToast('El backend no devolvió la URL de la proforma.', 'err');",
    "else { console.warn('[Matrículas CS21A175] Respuesta de proforma no apta para mostrar.', r); onToast('No se pudo preparar la proforma. Intentá nuevamente.', 'err'); }",
    'Admin missing proforma URL',
)
admin = replace_exact(
    admin,
    "} else onToast((r && r.error) || 'No se pudo generar la proforma.', 'err');",
    "} else { console.warn('[Matrículas CS21A175] Respuesta de proforma no apta para mostrar.', r); onToast('No se pudo generar la proforma. Intentá nuevamente.', 'err'); }",
    'Admin backend proforma error',
)
admin = replace_exact(
    admin,
    "} catch (e) { onToast('Error de conexión: ' + e.message, 'err'); }\n      finally { setLoading(false); }\n    };\n\n    const msg = tipo === 'curso'",
    """} catch (e) {
        console.error('[Matrículas CS21A175] Error técnico generando proforma.', e);
        onToast('No se pudo generar la proforma. Revisá tu conexión e intentá nuevamente.', 'err');
      }
      finally { setLoading(false); }
    };

    const msg = tipo === 'curso'""",
    'Admin proforma catch',
)
admin = replace_exact(
    admin,
    """    const msg = tipo === 'curso'
      ? `Hola! Te envío la proforma del curso de inglés. Podés verla aquí: ${url}`
      : `Hola! Te envío la proforma del equipo (${planLabel}). Podés verla aquí: ${url}`;""",
    """    // SEC-002 CS21A175 · no propagar el enlace Drive público al prospecto.
    // El PDF se descarga por la ruta staff legacy y se adjunta manualmente al chat.
    const msg = tipo === 'curso'
      ? 'Hola! Te envío la proforma del curso de inglés. Te la adjunto como PDF en este chat.'
      : `Hola! Te envío la proforma del equipo (${planLabel}). Te la adjunto como PDF en este chat.`;""",
    'Admin WhatsApp messages',
)
admin = replace_exact(
    admin,
    '>Enviar por WhatsApp</a>}',
    '>WhatsApp · adjuntar PDF</a>}',
    'Admin WhatsApp label',
)
admin_path.write_text(admin, encoding='utf-8')
