// F98.4-Z6-CS21A80 · Integridad visual del Calendario académico
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A80';

  function resetCalendarCache() {
    const current = window.__AN_CAL_GRUPOS_CACHE;
    if (current && typeof current === 'object') {
      current.at = 0;
      current.data = null;
      current.version = VERSION;
      return;
    }
    window.__AN_CAL_GRUPOS_CACHE = { at:0, data:null, version:VERSION };
  }

  function globalFunction(name) {
    if (typeof window[name] === 'function') return window[name];
    try {
      const value = (0, eval)(`typeof ${name} === 'function' ? ${name} : null`);
      return typeof value === 'function' ? value : null;
    } catch (_) {
      return null;
    }
  }

  function assignGlobal(name, value) {
    window[name] = value;
    try { (0, eval)(`${name} = window[${JSON.stringify(name)}]`); } catch (_) {}
  }

  function uniqueGroups(groups) {
    const map = new Map();
    (Array.isArray(groups) ? groups : []).forEach(group => {
      const code = String(group && (group.code || group.cod_grupo) || '').trim();
      if (!code) return;
      if (!map.has(code)) map.set(code, group);
      else {
        const previous = map.get(code) || {};
        const previousLessons = Array.isArray(previous.lecciones) ? previous.lecciones.length : 0;
        const nextLessons = Array.isArray(group.lecciones) ? group.lecciones.length : 0;
        if (nextLessons > previousLessons) map.set(code, group);
      }
    });
    return Array.from(map.values());
  }

  function installShortCode() {
    const current = globalFunction('todosShortCode');
    if (typeof current !== 'function') return false;
    if (current.__cs21a80FullCode) return true;
    const fullCode = function todosShortCodeCS21A80(code) {
      return String(code || '—').trim() || '—';
    };
    fullCode.__cs21a80FullCode = true;
    fullCode.__base = current;
    assignGlobal('todosShortCode', fullCode);
    return true;
  }

  function installWeekView() {
    const Base = globalFunction('TodosVistaSemana');
    if (typeof Base !== 'function') return false;
    if (Base.__cs21a80PersistentRows) return true;

    function TodosVistaSemanaCS21A80(props) {
      const rootRef = React.useRef(null);
      const complete = String(props && props.alcance || '').toLowerCase() === 'completo';
      const groups = uniqueGroups(props && props.gruposOrdenados);
      const safeProps = Object.assign({}, props, {
        gruposOrdenados: groups,
        // La vista antigua ocultaba los COMPLETADOS en "Cronograma completo"
        // cuando no tenían una lección dentro de la semana visible. Dentro del
        // componente base, "completados" es el único modo que no aplica ese recorte.
        alcance: complete ? 'completados' : props.alcance,
      });

      React.useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        root.querySelectorAll('div').forEach(node => {
          const value = String(node.textContent || '').trim();
          if (/^\d+ grupos en esta semana$/i.test(value)) {
            node.textContent = complete
              ? `${groups.length} grupos visibles · inventario completo`
              : value;
          }
        });
      }, [complete, groups.length, props && props.weekStart, props && props.alcance]);

      const note = complete
        ? React.createElement('div', {
            style: {
              margin:'0 0 9px', padding:'9px 12px', borderRadius:10,
              border:'1px solid #C9D9F1', background:'#EEF4FF', color:'#244A7C',
              fontSize:10.5, fontWeight:750, lineHeight:1.45,
              display:'flex', justifyContent:'space-between', gap:10, flexWrap:'wrap'
            }
          },
          React.createElement('span', null, 'Inventario persistente: los grupos sin clase en esta semana permanecen en su fila.'),
          React.createElement('strong', { style:{fontFamily:'var(--f-mono)'} }, `${groups.length} grupos`)
        )
        : null;

      return React.createElement(
        'div',
        { ref:rootRef, 'data-cs21a80-calendar-week':'true' },
        note,
        React.createElement(Base, safeProps)
      );
    }

    TodosVistaSemanaCS21A80.__cs21a80PersistentRows = true;
    TodosVistaSemanaCS21A80.__base = Base;
    assignGlobal('TodosVistaSemana', TodosVistaSemanaCS21A80);
    return true;
  }

  function installAllGroupsView() {
    const Base = globalFunction('TodosLosGruposView');
    if (typeof Base !== 'function') return false;
    if (Base.__cs21a80DeduplicatedInventory) return true;

    function TodosLosGruposViewCS21A80(props) {
      const groups = uniqueGroups(props && props.gruposReales);
      return React.createElement(Base, Object.assign({}, props, { gruposReales:groups }));
    }

    TodosLosGruposViewCS21A80.__cs21a80DeduplicatedInventory = true;
    TodosLosGruposViewCS21A80.__base = Base;
    assignGlobal('TodosLosGruposView', TodosLosGruposViewCS21A80);
    return true;
  }

  function install() {
    const a = installShortCode();
    const b = installWeekView();
    const c = installAllGroupsView();
    if (a || b || c) window.__AN_CALENDAR_INTEGRITY_VERSION__ = VERSION;
    return a && b && c;
  }

  resetCalendarCache();
  window.addEventListener('an:lazy-module-loaded', () => {
    [0, 20, 60, 140, 320].forEach(delay => window.setTimeout(install, delay));
  });
  [0, 50, 150, 400, 900].forEach(delay => window.setTimeout(install, delay));
  const probe = window.setInterval(() => {
    if (install()) window.clearInterval(probe);
  }, 200);
  window.setTimeout(() => window.clearInterval(probe), 30000);
})();
