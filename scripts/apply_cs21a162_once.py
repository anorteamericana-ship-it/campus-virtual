from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: se esperó 1 coincidencia y se encontraron {count}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


source_path = Path('src/teacher_books_unit_guard_cs21a134.js')
replace_once(source_path, "  var TAB_KEY = 'an_teacher_materiales_tab';\n", "", 'Retiro TAB_KEY')
replace_once(source_path, "  var authorityTimer = null;\n", "", 'Retiro authorityTimer')
replace_once(
    source_path,
    "  function teacherRole(){\n    var role = currentRole();\n    return role === 'TEACHER' || role === 'DOCENTE';\n  }\n",
    "",
    'Retiro teacherRole',
)
replace_once(
    source_path,
    "  function activeScreen(){\n    try { return sessionStorage.getItem(TAB_KEY) || 'info'; }\n    catch (_) { return 'info'; }\n  }\n\n",
    "",
    'Retiro activeScreen',
)
old_authority = """  function installAuthority(){
    var Current = window.MaterialesView;
    if (typeof Current !== 'function' || !window.React || typeof window.React.createElement !== 'function') return false;
    if (Current.__cs21a135BookAuthority) return true;

    var Base = Current;
    var Wrapped = function MaterialesViewCS21A135(props){
      var screen = activeScreen();
      var Viewer = window.__AN_BOOK_RESOURCES_COMPONENT__;
      if (teacherRole() && (screen === 'libros' || screen === 'biblioteca') && typeof Viewer === 'function') {
        return window.React.createElement(Viewer, Object.assign({}, props || {}, {
          initialType: screen === 'biblioteca' ? 'TB' : 'SB',
          navigationVersion: VERSION
        }));
      }
      return window.React.createElement(Base, props || {});
    };

    Wrapped.__cs21a135BookAuthority = true;
    Wrapped.__cs21a75UnitStarts = true;
    Wrapped.__cs21a60UnitStarts = true;
    Wrapped.__cs21a58books = true;
    Wrapped.__base = Base;
    window.MaterialesView = Wrapped;
    window.__AN_CS21A59_TEACHER_MATERIALS_BASE__ = Wrapped;
    try { MaterialesView = Wrapped; } catch (_) {}
    return true;
  }
"""
new_authority = """  function installAuthority(){
    // Compatibilidad de API: desde CS21A162 la autoridad visual pertenece a
    // TeacherHubCS21A. Este guard confirma la publicación del visor y nunca
    // redefine MaterialesView.
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function';
  }
"""
replace_once(source_path, old_authority, new_authority, 'Retiro wrapper CS21A135')
replace_once(
    source_path,
    "  function reinstall(){\n    installStyles();\n    installAuthority();\n    queueEnhancement();\n  }\n\n  installStyles();\n  installAuthority();\n  queueEnhancement();\n",
    "  function reinstall(){\n    installStyles();\n    queueEnhancement();\n  }\n\n  installStyles();\n  queueEnhancement();\n",
    'Reinstall sin wrapper',
)
replace_once(
    source_path,
    "  authorityTimer = window.setInterval(function(){\n    installAuthority();\n    queueEnhancement();\n  }, 600);\n\n",
    "",
    'Retiro sondeo',
)
replace_once(
    source_path,
    "  window.addEventListener('pagehide', function(){\n    if (authorityTimer) window.clearInterval(authorityTimer);\n    if (observer) observer.disconnect();\n  }, { once:true });\n",
    "  window.addEventListener('pagehide', function(){\n    if (observer) observer.disconnect();\n  }, { once:true });\n",
    'Limpieza pagehide',
)
replace_once(
    source_path,
    "    installAuthority:installAuthority,\n    enhanceAll:enhanceAll,\n",
    "    installAuthority:installAuthority,\n    authorityMode:'TEACHER_PORTAL_OWNS_VIEWER',\n    enhanceAll:enhanceAll,\n",
    'Marca de autoridad',
)

test_path = Path('scripts/test_teacher_books_unit_guard_cs21a134.mjs')
replace_once(test_path, "let activeTab = 'libros';\n", "", 'Retiro activeTab')
replace_once(
    test_path,
    "    if (key === 'an_teacher_materiales_tab') return activeTab;\n",
    "",
    'Retiro almacenamiento de subruta',
)
old_test = """role = 'teacher';
assert.equal(context.window.MaterialesView.__cs21a135BookAuthority, true);
assert.equal(context.window.MaterialesView.__cs21a58books, true, 'La marca debe bloquear el regreso del visor antiguo.');
let rendered = context.window.MaterialesView({ sample:1 });
assert.equal(rendered.type, Viewer, 'Libros del docente deben usar el visor institucional.');
assert.equal(rendered.props.initialType, 'SB');

activeTab = 'biblioteca';
rendered = context.window.MaterialesView({ sample:2 });
assert.equal(rendered.type, Viewer);
assert.equal(rendered.props.initialType, 'TB');

context.window.MaterialesView = function LegacyCS21A58(){};
assert.equal(guard.installAuthority(), true);
assert.equal(context.window.MaterialesView.__cs21a135BookAuthority, true, 'La autoridad debe recuperarse después de una reinstalación tardía del legado.');
assert.equal(context.window.MaterialesView.__cs21a58books, true);
"""
new_test = """role = 'teacher';
assert.equal(context.window.MaterialesView, BaseMateriales, 'El guard no debe envolver MaterialesView.');
assert.equal(guard.authorityMode, 'TEACHER_PORTAL_OWNS_VIEWER');
assert.equal(guard.installAuthority(), true, 'El visor reutilizable debe estar publicado.');

const LegacyCS21A58 = function LegacyCS21A58(){};
context.window.MaterialesView = LegacyCS21A58;
assert.equal(guard.installAuthority(), true);
assert.equal(context.window.MaterialesView, LegacyCS21A58, 'El verificador no debe reemplazar una vista montada.');
"""
replace_once(test_path, old_test, new_test, 'Contrato sin wrapper')
replace_once(
    test_path,
    "console.log('OK: 12 mapas, autoridad del visor, TB/WB persistentes y diseño CS21A135 validados.');\n",
    "console.log('OK CS21A162: 12 mapas, reparación TB/WB y diseño CS21A135 validados sin envolver MaterialesView.');\n",
    'Mensaje del test',
)
