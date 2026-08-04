// F98.4-Z6-CS21A168 · Cargador diferido con contrato canónico de materiales reutilizables.
// Base preservada: F98.4-Z6-CS21A124.
(function(){
  const loaded = new Set();
  const loading = new Map();
  const VERSION = 'F98.4-Z6-CS21A168';
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

  function waitUntil(test, timeoutMs, label){
    const started = Date.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let ready = false;
        try { ready = !!test(); } catch(_){ ready = false; }
        if (ready) { resolve(true); return; }
        if (Date.now() - started >= timeoutMs) {
          reject(new Error('No se pudo preparar ' + (label || 'la pantalla') + '.'));
          return;
        }
        setTimeout(tick, 20);
      };
      tick();
    });
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
    if (needsUnifiedMaterials(component)) return unifiedMaterialsReady();
    if (component === 'ICANViewNew') {
      return typeof window.ICANViewNew === 'function' && window.ICANViewNew.__cs21a122 === true;
    }
    if (component === 'ClubICANDocenteView') {
      return typeof window.ClubICANDocenteView === 'function' && window.ClubICANDocenteView.__cs21a122 === true;
    }
    return true;
  }

  function waitForRouteEnhancers(component){
    if (!needsUnifiedMaterials(component) && !needsClubICANEnhancer(component)) return Promise.resolve(true);
    return waitUntil(() => routeEnhancerReady(component), 5000,
      needsClubICANEnhancer(component) ? 'Club I CAN' : 'Libros y Audios');
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
    const depsReady = () => list.every(f => loaded.has(f));
    const routeReady = () => routeEnhancerReady(component);
    const [state, setState] = React.useState(() => ({
      ready: typeof window[component] === 'function' && depsReady() && routeReady(),
      error:''
    }));
    React.useEffect(() => {
      let live = true;
      if (!depsReady() || !routeReady()) setState({ ready:false, error:'' });
      loadMany(list)
        .then(() => waitForRouteEnhancers(component))
        .then(() => {
          if(!live) return;
          if (typeof window[component] === 'function') setState({ ready:true, error:'' });
          else setState({ ready:false, error:'El módulo cargó, pero no publicó el componente ' + component + '.' });
        })
        .catch(e => live && setState({ ready:false, error:e?.message || String(e) }));
      return () => { live = false; };
    }, [component, JSON.stringify(list)]);
    if (!state.ready) {
      return React.createElement('div', { style:{ maxWidth:680, margin:'56px auto', padding:'26px 28px', border:'1px solid var(--line)', borderRadius:18, background:'var(--surface)', boxShadow:'var(--sh-1)', fontFamily:'var(--f-sans)', textAlign:'center' } },
        React.createElement('div', { style:{ fontSize:11, fontWeight:900, letterSpacing:'.14em', color:'var(--an-granate)', textTransform:'uppercase' } }, 'Cargando módulo'),
        React.createElement('div', { style:{ marginTop:8, fontFamily:'var(--f-serif)', fontSize:26, color:'var(--an-navy-ink)' } }, title || component),
        state.error ? React.createElement('div', { style:{ marginTop:10, color:'#C0392B', fontSize:13, lineHeight:1.5 } }, state.error) : React.createElement('div', { style:{ marginTop:10, color:'var(--ink-3)', fontSize:13 } }, 'Preparando pantalla…'),
        state.error ? React.createElement('button', { type:'button', className:'btn btn-primary', style:{ marginTop:16 }, onClick:() => window.location.reload() }, 'Recargar') : null
      );
    }
    const C = window[component];
    return React.createElement(C, props || {});
  }

  window.anLazyCampus = { loadOne, loadMany, validateMap, loaded, VERSION, getStatus };
  window.LazyModuleView = LazyModuleView;
})();
