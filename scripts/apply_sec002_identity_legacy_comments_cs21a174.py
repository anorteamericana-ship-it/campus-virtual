from pathlib import Path


def replace_exact(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 preimage, found {count}')
    return text.replace(old, new, 1)


ventas_path = Path('src/ventas_parts.jsx')
ventas = ventas_path.read_text(encoding='utf-8')
ventas_old = '''// ── BLOQUE DE DOCUMENTOS (3 fotos) ──────────────────────────────────────────
// ── Bug B · carga robusta de fotos de Drive en el drawer ───────────────────
// Mismo patrón que el modal del admin: si la URL lh3 falla (foto con permisos
// privados o URL mal armada), reintenta con patrones alternativos de Drive antes
// de mostrar "Foto no disponible". (El fix de fondo —permisos públicos al subir—
// es de backend.)'''
ventas_new = '''// ── BLOQUE DE DOCUMENTOS (3 fotos) ──────────────────────────────────────────
// SEC-002 CS21A174 · CONSUMIDOR LEGACY TEMPORAL.
// Cédula frente/dorso y título todavía llegan como URL Drive/LH3 histórica y este
// componente prueba variantes del MISMO ID solo para preservar la operación actual.
// Esto NO autoriza ampliar ACL ni publicar archivos como solución. El destino es
// entrega privada autenticada expediente+document_type -> Blob/ObjectURL; Issue #111
// gobierna el backend y la ACL no se retira hasta migrar/probar ambos consumidores.'''
ventas = replace_exact(ventas, ventas_old, ventas_new, 'Ventas legacy comment')
ventas_path.write_text(ventas, encoding='utf-8')

admin_path = Path('src/matriculas_admin.jsx')
admin = admin_path.read_text(encoding='utf-8')
admin_old = '''  // ── Bug B · carga robusta de documentos adjuntos (fotos de Drive) ───────────
  // Las URLs lh3.googleusercontent.com/d/{ID} solo cargan si el archivo es público
  // ("cualquiera con el link"). Si una foto se subió con permisos privados, o la URL
  // viene mal armada, la imagen no carga. Defensa del lado cliente: ante un error,
  // probamos patrones alternativos de Drive con el mismo ID antes de mostrar
  // "Foto no disponible". (El fix de fondo —setSharing público al subir— es backend.)'''
admin_new = '''  // SEC-002 CS21A174 · CONSUMIDOR LEGACY TEMPORAL.
  // Cédula frente/dorso y título todavía llegan como URL Drive/LH3 histórica. Los
  // candidatos alternativos conservan la operación actual, pero NO son el arreglo
  // de seguridad y NO autorizan setSharing público ni ampliar ACL. El destino es
  // entrega privada autenticada expediente+document_type -> Blob/ObjectURL. Issue
  // #111 gobierna el backend; retirar ACL solo después de migrar y probar consumidores.'''
admin = replace_exact(admin, admin_old, admin_new, 'Admin legacy comment')
admin_path.write_text(admin, encoding='utf-8')
