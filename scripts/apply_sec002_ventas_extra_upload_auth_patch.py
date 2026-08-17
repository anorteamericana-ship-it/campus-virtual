from pathlib import Path

p = Path('src/ventas_data.jsx')
s = p.read_text()
old = "const subirDocumentoExtra     = (cedula, nombre_archivo, mime_type, base64) => { ventasDashCacheClear(); return postVentas({ fn:'subirDocumentoExtra', cedula, nombre_archivo, mime_type, base64 }); };"
new = "const subirDocumentoExtra     = (cedula, nombre_archivo, mime_type, base64) => { ventasDashCacheClear(); return postVentasData('subirDocumentoExtra', { cedula, nombre_archivo, mime_type, base64 }); };"
if s.count(old) != 1:
    raise SystemExit(f'expected one legacy subirDocumentoExtra wrapper, found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

p = Path('src/ventas_drawer.jsx')
s = p.read_text()
old = "const nuevo = { nombre_archivo: file.name, mime_type: file.type, url: base64, fecha: window.HOY };"
new = """const nuevo = {
            nombre_archivo: r.nombre || file.name,
            mime_type: r.mime_type || file.type,
            file_id: r.file_id || '',
            size_bytes: Number(r.size_bytes || file.size || 0),
            url: r.url || '',
            fecha: window.HOY,
          };"""
if s.count(old) != 1:
    raise SystemExit(f'expected one local docs_extra object, found {s.count(old)}')
s = s.replace(old, new)
p.write_text(s)

print('PATCHED SEC-002 docs_extra upload auth + metadata')
