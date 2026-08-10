// F98.4-Z6-CS21A193 · Cargador diferido con owner dinámico para rutas canónicas.
// Base preservada: F98.4-Z6-CS21A168.
(function(){
  const loaded = new Set();
  const loading = new Map();
  const VERSION = 'F98.4-Z6-CS21A193';
  const ROUTE_STABLE_MS = 64;
  const ROUTE_TIMEOUT_MS = 5000;
  const normalize = (src) => {
    const value = String(src || '').trim();
    if (/^src\/importador_banco\.jsx(?:\?.*)?$/i.test(value)) {
      return 'src/importador_banco.jsx?v=F98.4Z6CS21A124';
    }
    return value;
  };

  function loadOne(src){
    src = normalize(src);
    if(!src) return Promise.resolve();
    if(loaded.has(src)) return Promise.resolve();
    if(loading.has(src)) return loading.get(src);
    const p = fetch(src, { cache: 'no-cache' })
      .then(r => {
        if(!r.ok) throw new Error('No se pudo cargar ' + src + ' (' + r.status + ')');
        return r.text();
      })
      .then(code => {
        let js = code;
        if (window.Babel && typeof window.Babel.transform === 'function') {
          js = window.Babel.transform(code, { presets: ['react'], plugins: ['transform-block-scoping'] }).code;
        }
        const s = document.createElement('script');
        s.type = 'text/javascript';
        s.text = js + '\n//# sourceURL=' + src;
        document.head.appendChild(s);
        loaded.add(src);
        loading.delete(src);
        try { window.dispatchEvent(new CustomEvent('an:lazy-module-loaded', { detail:{ src, version:VERSION } })); } catch(_){ }
      })
      .catch(err => { loading.delete(src); throw err; });
    loading.set(src, p);
    return p;
  }

  async function loadMany(files){
    for (const f of (files || [])) await loadOne(f);
  }

  function needsUnifiedMaterials(component){
    return component === 'MaterialesView' || component === 'StudentCourseView';
  }

  function needsClubICANEnhancer(component){
    return component === 'ICANViewNew' || component === 'ClubICANDocenteView';
  }

  function unifiedMaterialsReady(){
    return typeof window.MaterialesView === 'function' &&
      typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function' &&
      window.__AN_BOOK_UNIT_STARTS_MODE__ === 'REUSABLE_COMPONENT_ONLY';
  }

  function routeEnhancerReady(component){
    const candidate = window[component];
    if (typeof candidate !== 'function') return false;
    if (needsUnifiedMaterials(component)) return unifiedMaterialsReady();
    if (component === 'ICANViewNew') {
      return candidate.__cs21a122 === true;
    }
    if (component === 'ClubICANDocenteView') {
      return candidate.__cs21a122 === true;
    }
    if (component === 'PerfilView') return candidate.__cs21a76TeacherProfile === true;
    if (component === 'AcademiaPlayView' || component === 'EnglishLabLiveStudentView') {
      return candidate.__cs21a144AccessGate === true;
    }
    if (component === 'AdminGruposView') return candidate.__cs21a20AperturasWrapper === true;
    if (component === 'CronogramaGrupo') return candidate.__a77 === true;
    return true;
  }

  function routeLabel(component){
    if (needsClubICANEnhancer(component)) return 'Club I CAN';
    if (needsUnifiedMaterials(component)) return 'Libros y Audios';
    if (component === 'PerfilView') return 'Mi Perfil';
    if (component === 'AcademiaPlayView' || component === 'EnglishLabLiveStudentView') return 'English LAB';
    if (component === 'AdminGruposView') return 'Grupos';
    if (component === 'CronogramaGrupo') return 'Cronograma';
    return component;
  }

  function waitForCanonicalRoute(component){
    const started = Date.now();
    let candidate = null;
    let stableSince = 0;
    return new Promise((resolve, reject) => {
      const tick = () => {
        const current = window[component];
        const ready = typeof current === 'function' && routeEnhancerReady(component);
        if (!ready) {
          candidate = null;
          stableSince = 0;
        } else if (current !== candidate) {
          candidate = current;
          stableSince = Date.now();
        } else if (Date.now() - stableSince >= ROUTE_STABLE_MS) {
          resolve(current);
          return;
        }
        if (Date.now() - started >= ROUTE_TIMEOUT_MS) {
          reject(new Error('No se pudo preparar ' + routeLabel(component) + '.'));
          return;
        }
        setTimeout(tick, 16);
      };
      tick();
    });
  }

  async function resolveRoute(files, component){
    const list = (files || []).map(normalize);
    const activeLoadMany = window.anLazyCampus && typeof window.anLazyCampus.loadMany === 'function'
      ? window.anLazyCampus.loadMany
      : loadMany;
    await activeLoadMany(list);
    return waitForCanonicalRoute(component);
  }

  async function validateMap(map){
    const startedAt = Date.now();
    const groups = map || window.F96_LAZY_MAP || {};
    const files = [];
    Object.keys(groups).forEach(k => (groups[k] || []).forEach(f => { const normalized = normalize(f); if(files.indexOf(normalized) < 0) files.push(normalized); }));
    const ok = [];
    const errors = [];
    for (const f of files) {
      try { await loadOne(f); ok.push(f); }
      catch(e){ errors.push({ file:f, error:e && e.message ? e.message : String(e) }); }
    }
    return { version: VERSION, total: files.length, ok: ok.length, errors, ms: Date.now() - startedAt };
  }

  function getStatus(){
    return { version: VERSION, loaded: Array.from(loaded), loading: Array.from(loading.keys()) };
  }

  function LazyModuleView({ files, component, props, title }){
    const React = window.React;
    const list = (files || []).map(normalize);
    const routeKey = component + '|' + JSON.stringify(list);
    const depsReady = () => list.every(f => loaded.has(f));
    const routeReady = () => routeEnhancerReady(component);
    const [state, setState] = React.useState(() => ({
      routeKey,
      View: typeof window[component] === 'function' && depsReady() && routeReady() ? window[component] : null,
      error:''
    }));
    React.useEffect(() => {
      let live = true;
      setState({ routeKey, View:null, error:'' });
      resolveRoute(list, component)
        .then(View => {
          if(!live) return;
          if (typeof View === 'function') {
            setState({ routeKey, View, error:'' });
            try {
              window.dispatchEvent(new CustomEvent('an:lazy-route-committed', {
                detail:{ component, routeKey, view:View.name || 'anonymous', version:VERSION }
              }));
            } catch(_) {}
          }
          else setState({ routeKey, View:null, error:'El módulo cargó, pero no publicó el componente ' + component + '.' });
        })
        .catch(e => live && setState({ routeKey, View:null, error:e?.message || String(e) }));
      return () => { live = false; };
    }, [component, JSON.stringify(list)]);
    const View = state.routeKey === routeKey ? state.View : null;
    const error = state.routeKey === routeKey ? state.error : '';
    if (!View) {
      return React.createElement('div', { 'data-lazy-route-state':'loading', 'data-lazy-route-component':component, style:{ maxWidth:680, margin:'56px auto', padding:'26px 28px', border:'1px solid var(--line)', borderRadius:18, background:'var(--surface)', boxShadow:'var(--sh-1)', fontFamily:'var(--f-sans)', textAlign:'center' } },
        React.createElement('div', { style:{ fontSize:11, fontWeight:900, letterSpacing:'.14em', color:'var(--an-granate)', textTransform:'uppercase' } }, 'Cargando módulo'),
        React.createElement('div', { style:{ marginTop:8, fontFamily:'var(--f-serif)', fontSize:26, color:'var(--an-navy-ink)' } }, title || component),
        error ? React.createElement('div', { style:{ marginTop:10, color:'#C0392B', fontSize:13, lineHeight:1.5 } }, error) : React.createElement('div', { style:{ marginTop:10, color:'var(--ink-3)', fontSize:13 } }, 'Preparando pantalla…'),
        error ? React.createElement('button', { type:'button', className:'btn btn-primary', style:{ marginTop:16 }, onClick:() => window.location.reload() }, 'Recargar') : null
      );
    }
    return React.createElement(View, props || {});
  }

  window.anLazyCampus = { loadOne, loadMany, resolveRoute, validateMap, loaded, VERSION, getStatus };
  try {
    const canonical = window.EnglishLabLiveCanonicalLoaderCS21A193;
    if (canonical && typeof canonical.install === 'function') canonical.install();
  } catch(_) {}
  window.LazyModuleView = LazyModuleView;
})();
