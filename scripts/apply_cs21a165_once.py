# Activación controlada con workflow previamente publicado.
from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    source = path.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: se esperó 1 coincidencia y se encontraron {count}')
    path.write_text(source.replace(old, new, 1), encoding='utf-8')


planning = Path('src/teacher_cs21a_planeamiento_grouped.jsx')
source = planning.read_text(encoding='utf-8')
start_marker = '  function getScreen(){'
end_marker = '  setTimeout(install, 0);\n})();'
start = source.find(start_marker)
end = source.find(end_marker, start)
if start < 0 or end < 0:
    raise SystemExit(f'No se localizaron límites del wrapper CS21A9: start={start}, end={end}')
end += len(end_marker)
replacement = """  window.PlaneamientoGroupedViewCS21A140 = PlaneamientoGroupedView;
  window.__AN_TEACHER_PLANNING_GROUPED_VERSION__ = VERSION;
})();"""
source = source[:start] + replacement + source[end:]
source = source.replace('/* global React, getSesion, MaterialesView */', '/* global React */', 1)
planning.write_text(source, encoding='utf-8')

teacher = Path('src/teacher_cs21a.jsx')
replace_once(
    teacher,
    "    const BookResources = window.__AN_BOOK_RESOURCES_COMPONENT__;\n    const titles = {\n",
    "    const BookResources = window.__AN_BOOK_RESOURCES_COMPONENT__;\n    const PlanningView = window.PlaneamientoGroupedViewCS21A140;\n    const titles = {\n",
    'TeacherHub obtiene Planeamiento canónico',
)
replace_once(
    teacher,
    "      {['syllabus','planeamiento','cronograma_modulo','cronograma_general'].includes(screen) && <LevelCards type={screen} onNavigate={props.onNavigate}/>} \n      {screen === 'libros'",
    "      {['syllabus','cronograma_modulo','cronograma_general'].includes(screen) && <LevelCards type={screen} onNavigate={props.onNavigate}/>} \n      {screen === 'planeamiento' && (typeof PlanningView === 'function' ? <PlanningView /> : <div role=\"status\" style={{ padding:18, border:'1px solid var(--line)', borderRadius:14, background:'#fff' }}>Preparando Planeamiento por lección…</div>)}\n      {screen === 'libros'",
    'TeacherHub renderiza Planeamiento canónico',
)

test = Path('scripts/test_teacher_resources_canonical_cs21a157.mjs')
test_source = test.read_text(encoding='utf-8')
replace_once(
    test,
    "const teacher = read('src/teacher_cs21a.jsx');\n",
    "const teacher = read('src/teacher_cs21a.jsx');\nconst planning = read('src/teacher_cs21a_planeamiento_grouped.jsx');\n",
    'Carga del módulo Planeamiento',
)
needle = "assert.doesNotMatch(teacher, /\\['syllabus','planeamiento','cronograma_modulo','cronograma_general','libros'\\]/);\n"
addition = needle + "assert.match(teacher, /const\\s+PlanningView\\s*=\\s*window\\.PlaneamientoGroupedViewCS21A140/);\nassert.match(teacher, /screen\\s*===\\s*['\"]planeamiento['\"][\\s\\S]{0,220}?<PlanningView\\s*\\/>/);\nassert.doesNotMatch(teacher, /\\['syllabus','planeamiento','cronograma_modulo','cronograma_general'\\]/);\n\nassert.match(planning, /window\\.PlaneamientoGroupedViewCS21A140\\s*=\\s*PlaneamientoGroupedView/);\nassert.match(planning, /__AN_TEACHER_PLANNING_GROUPED_VERSION__/);\nassert.doesNotMatch(planning, /(?:window\\.)?MaterialesView\\s*=|MaterialesViewCS21A9|__base\\s*=|__cs21a9|an:lazy-module-loaded|setTimeout\\(install/);\n"
if test_source.count(needle) != 1:
    raise SystemExit(f'Contrato base de TeacherHub no único: {test_source.count(needle)}')
test_source = test_source.replace(needle, addition, 1)
test.write_text(test_source, encoding='utf-8')
