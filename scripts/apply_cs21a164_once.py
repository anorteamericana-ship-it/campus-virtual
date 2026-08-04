from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: se esperó 1 coincidencia y se encontraron {count}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


viewer = Path('src/book_unit_starts_cs21a60.jsx')
replace_once(viewer, "  const ADMIN_OPEN_KEY = 'an_admin_resources_open';\n", "", 'Retiro ADMIN_OPEN_KEY')
replace_once(viewer, "  const ADMIN_TAB_KEY = 'an_admin_resources_tab';\n", "", 'Retiro ADMIN_TAB_KEY')
old_install = """  function installMaterialPatch() {
    const Current = window.MaterialesView || (typeof MaterialesView === 'function' ? MaterialesView : null);
    if (!Current || Current.__cs21a75UnitStarts) return false;
    if (Current.__cs21a60UnitStarts && !Current.__cs21a75UnitStarts) {
      window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Current;
      return true;
    }
    const Base = Current;
    const Wrapped = function MaterialesViewCS21A75(props) {
      const user = currentSession();
      const role = roleOf(user);
      const adminOpen = sessionStorage.getItem(ADMIN_OPEN_KEY) === '1';
      const adminTab = sessionStorage.getItem(ADMIN_TAB_KEY) || 'libros';
      if ((role === 'admin' || role === 'superadmin') && adminOpen) return <BookResourcesCS21A60 initialType={adminTab === 'audios' ? 'SB' : 'SB'} />;
      if (role === 'student' || role === 'estudiante') return <><BookResourcesCS21A60 studentMode initialType=\"SB\" /><Base {...props} /></>;
      return <Base {...props} />;
    };
    Wrapped.__cs21a75UnitStarts = true;
    Wrapped.__cs21a60UnitStarts = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Wrapped;
    try { MaterialesView = Wrapped; } catch (_) {}
    return true;
  }

  function install() { installMaterialPatch(); }
  install();
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(install, 20));
  window.addEventListener('an:teacher-material-tab', () => setTimeout(install, 20));
  window.addEventListener('an:admin-resource-tab', () => setTimeout(install, 20));
  const probe = setInterval(() => { if (installMaterialPatch()) clearInterval(probe); }, 250);
  setTimeout(() => clearInterval(probe), 20000);
  window.__AN_BOOK_UNIT_STARTS_VERSION__ = VERSION;
})();
"""
new_install = """  function installMaterialPatch() {
    // Compatibilidad de API. Las rutas estudiante, docente y administración
    // consumen BookResourcesCS21A60 de forma explícita y este módulo no captura
    // ni sustituye MaterialesView.
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function';
  }

  function install() { return installMaterialPatch(); }
  install();
  window.__AN_BOOK_UNIT_STARTS_VERSION__ = VERSION;
  window.__AN_BOOK_UNIT_STARTS_MODE__ = 'REUSABLE_COMPONENT_ONLY';
})();
"""
replace_once(viewer, old_install, new_install, 'Conversión a componente reutilizable puro')

test = Path('scripts/test_teacher_resources_canonical_cs21a157.mjs')
needle = "assert.doesNotMatch(viewer, /role\\s*===\\s*['\"]docente['\"][\\s\\S]{0,180}?BookResourcesCS21A60/);\n"
addition = needle + "assert.doesNotMatch(viewer, /MaterialesViewCS21A75|window\\.MaterialesView\\s*=|__base\\s*=|__AN_CS21A59_TEACHER_MATERIALS_BASE__/);\nassert.doesNotMatch(viewer, /setInterval\\s*\\(|an:teacher-material-tab|an:admin-resource-tab/);\nassert.match(viewer, /__AN_BOOK_UNIT_STARTS_MODE__\\s*=\\s*['\"]REUSABLE_COMPONENT_ONLY['\"]/);\n"
replace_once(test, needle, addition, 'Contrato de componente reutilizable puro')
