# Transformación única con límites estructurales validados.
from pathlib import Path


viewer = Path('src/book_unit_starts_cs21a60.jsx')
source = viewer.read_text(encoding='utf-8')
for constant in (
    "  const ADMIN_OPEN_KEY = 'an_admin_resources_open';\n",
    "  const ADMIN_TAB_KEY = 'an_admin_resources_tab';\n",
):
    count = source.count(constant)
    if count != 1:
        raise SystemExit(f'Constante esperada no única: {constant.strip()} ({count})')
    source = source.replace(constant, '', 1)

start_marker = '  function installMaterialPatch() {'
end_marker = "  window.__AN_BOOK_UNIT_STARTS_VERSION__ = VERSION;\n})();"
start = source.find(start_marker)
end = source.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit(f'No se localizaron límites del instalador: start={start}, end={end}')
end += len(end_marker)
replacement = """  function installMaterialPatch() {
    // Compatibilidad de API. Las rutas estudiante, docente y administración
    // consumen BookResourcesCS21A60 de forma explícita y este módulo no captura
    // ni sustituye MaterialesView.
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function';
  }

  function install() { return installMaterialPatch(); }
  install();
  window.__AN_BOOK_UNIT_STARTS_VERSION__ = VERSION;
  window.__AN_BOOK_UNIT_STARTS_MODE__ = 'REUSABLE_COMPONENT_ONLY';
})();"""
source = source[:start] + replacement + source[end:]
viewer.write_text(source, encoding='utf-8')

test = Path('scripts/test_teacher_resources_canonical_cs21a157.mjs')
test_source = test.read_text(encoding='utf-8')
needle = "assert.doesNotMatch(viewer, /role\\s*===\\s*['\"]docente['\"][\\s\\S]{0,180}?BookResourcesCS21A60/);\n"
addition = needle + "assert.doesNotMatch(viewer, /MaterialesViewCS21A75|window\\.MaterialesView\\s*=|__base\\s*=|__AN_CS21A59_TEACHER_MATERIALS_BASE__/);\nassert.doesNotMatch(viewer, /setInterval\\s*\\(|an:teacher-material-tab|an:admin-resource-tab/);\nassert.match(viewer, /__AN_BOOK_UNIT_STARTS_MODE__\\s*=\\s*['\"]REUSABLE_COMPONENT_ONLY['\"]/);\n"
if addition not in test_source:
    count = test_source.count(needle)
    if count != 1:
        raise SystemExit(f'Contrato base no único: {count}')
    test_source = test_source.replace(needle, addition, 1)
test.write_text(test_source, encoding='utf-8')
