from pathlib import Path

p = Path('src/ventas_data.jsx')
s = p.read_text()

marker = "async function getProspectoDetalle(cedula) {"
helper = r'''function normalizarDocsExtraVentas(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map((doc, index) => {
    const d = doc && typeof doc === 'object' ? doc : {};
    const nombre = String(d.nombre_archivo || d.nombre || d.name || `Documento ${index + 1}`).trim();
    const mime = String(d.mime_type || d.mime || d.tipo || '').trim().toLowerCase()
      || (/\.pdf$/i.test(nombre) ? 'application/pdf' : '');
    return {
      ...d,
      nombre_archivo:nombre,
      mime_type:mime,
      url:String(d.url || d.webViewLink || '').trim(),
      fecha:d.fecha || d.created_at || d.fecha_subida || '',
    };
  });
}

async function getProspectoDetalle(cedula) {'''
if s.count(marker) != 1:
    raise SystemExit(f'expected one getProspectoDetalle marker, found {s.count(marker)}')
s = s.replace(marker, helper)

old = """  const p = d && (d.prospecto || (d.ok !== false ? d : null));
  if (p && typeof p === 'object') {
    const norm = normalizarProspecto(p);
    if (d.prospecto) { d.prospecto = norm; return d; }
    return { ...d, ok: d.ok !== false, prospecto: norm };
  }
  return d;"""
new = """  const p = d && (d.prospecto || (d.ok !== false ? d : null));
  if (p && typeof p === 'object') {
    const docsExtra = normalizarDocsExtraVentas(
      Array.isArray(d?.docs_extra) ? d.docs_extra : p.docs_extra
    );
    const norm = { ...normalizarProspecto(p), docs_extra: docsExtra };
    if (d.prospecto) { d.prospecto = norm; return d; }
    return { ...d, ok: d.ok !== false, prospecto: norm };
  }
  return d;"""
if s.count(old) != 1:
    raise SystemExit(f'expected one wrapper body, found {s.count(old)}')
s = s.replace(old, new)

p.write_text(s)
print('PATCHED SEC-002 ventas docs_extra contract')
