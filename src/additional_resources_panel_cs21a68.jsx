// F98.4-Z6-CS21A154 · Recursos adicionales como componente independiente.
// No redefine MaterialesView, no inserta navegación por DOM y no instala observers.
/* global React */
(function additionalResourcesModuleCS21A154() {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A154';
  const LEVEL_NAMES = { B1:'Básico I', B2:'Básico II', I1:'Intermedio I', I2:'Intermedio II' };
  const LEVELS = ['B1','B2','I1','I2'];
  const CACHE = window.__AN_ADDITIONAL_RESOURCES_PANEL_CACHE_CS21A68__ ||
    (window.__AN_ADDITIONAL_RESOURCES_PANEL_CACHE_CS21A68__ = Object.create(null));

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function currentSession() {
    try {
      const stored = sessionStorage.getItem('an_usuario');
      if (stored) return JSON.parse(stored) || {};
    } catch (_) {}
    try {
      return (typeof window.getSesion === 'function' && window.getSesion()) || {};
    } catch (_) {
      return {};
    }
  }

  function roleOf(user) {
    return clean(user?.rol || user?.role).toLowerCase();
  }

  function sessionToken() {
    return typeof window.getSessionToken === 'function' ? window.getSessionToken() : '';
  }

  function activeGroup(user) {
    try {
      if (typeof window.getGrupoActivoDocente === 'function') {
        const selected = clean(window.getGrupoActivoDocente());
        if (selected) return selected;
      }
    } catch (_) {}
    return clean(user?.grupoActivo || user?.grupo || user?.grupos?.[0]);
  }

  function inferLevel(user) {
    const direct = clean(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL).toUpperCase();
    if (LEVELS.includes(direct)) return direct;
    const match = activeGroup(user).toUpperCase().match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  async function post(fn, payload = {}, timeout = 90000) {
    const endpoint = window.APPS_SCRIPT_URL;
    if (!endpoint) throw new Error('No está configurada la URL de Apps Script.');

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
    try {
      const response = await fetch(`${endpoint}?fn=${encodeURIComponent(fn)}`, {
        method:'POST',
        headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body:JSON.stringify({ fn, token:sessionToken(), ...payload }),
        signal:controller ? controller.signal : undefined,
      });
      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; }
      catch (_) { throw new Error('Apps Script devolvió una respuesta inválida.'); }
      if (!response.ok || data?.ok !== true) {
        throw new Error(data?.mensaje || data?.error || `HTTP ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('La carga tardó demasiado.');
      throw error;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function resourceName(item) {
    const raw = clean(item?.nombre || item?.name || item?.titulo || 'Recurso adicional');
    return /WORD\s+BY\s+WORD\s+DICTIONARY/i.test(raw) ? 'Diccionario Word by Word' : raw;
  }

  function isDictionary(item) {
    return /DICCIONARIO|DICTIONARY|WORD\s+BY\s+WORD/i.test(resourceName(item));
  }

  function flatten(items, output = []) {
    (Array.isArray(items) ? items : []).forEach(item => {
      output.push(item);
      if (Array.isArray(item?.children)) flatten(item.children, output);
    });
    return output;
  }

  function resourcesForRole(catalog, role) {
    const resources = Array.isArray(catalog?.recursos) ? catalog.recursos : [];
    if (role === 'teacher' || role === 'docente') {
      return flatten(resources, []).filter(isDictionary).slice(0, 1);
    }
    return resources;
  }

  function resourceUrl(item) {
    return item?.tipo === 'folder'
      ? clean(item?.url)
      : clean(item?.preview_url || item?.url || item?.stream_url);
  }

  function ResourceItem({ item, depth = 0 }) {
    const children = Array.isArray(item?.children) ? item.children : [];
    const folder = item?.tipo === 'folder' || children.length > 0;
    const url = resourceUrl(item);
    const open = () => {
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
      <div style={{
        marginLeft: depth ? Math.min(depth, 3) * 14 : 0,
        marginTop: 9,
        padding: folder ? '13px 14px' : 0,
        border: folder ? '1px solid #E5D6A9' : 'none',
        borderRadius: folder ? 14 : 0,
        background: folder ? '#FFFDF6' : 'transparent',
      }}>
        <button
          type="button"
          onClick={open}
          disabled={!url}
          style={{
            width:'100%', minHeight:46, display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
            padding:'10px 12px', border:'1px solid #DDE4EC', borderRadius:11, background:'#fff',
            color:'#001E47', cursor:url ? 'pointer' : 'default', textAlign:'left', fontFamily:'inherit',
          }}
        >
          <span style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
            <span aria-hidden="true" style={{ fontSize:17, color:folder ? '#B98913' : '#7A1E2C' }}>{folder ? '▣' : '▤'}</span>
            <span style={{ fontSize:12.5, fontWeight:850, overflow:'hidden', textOverflow:'ellipsis' }}>{resourceName(item)}</span>
          </span>
          <span style={{ flex:'0 0 auto', fontSize:10.5, fontWeight:950, color:'#7A1E2C' }}>
            {url ? (folder ? 'Abrir carpeta' : 'Abrir') : 'Sin enlace'}
          </span>
        </button>
        {children.length > 0 && (
          <div style={{ marginTop:6 }}>
            {children.map((child, index) => (
              <ResourceItem key={`${child?.id || child?.nombre || index}-${index}`} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  function AdditionalResourcesPanel() {
    const user = React.useMemo(currentSession, []);
    const role = roleOf(user);
    const group = activeGroup(user);
    const identity = clean(user?.codigo || user?.CODIGO || user?.cedula || user?.CEDULA);
    const canChooseLevel = role === 'admin' || role === 'superadmin';
    const [level, setLevel] = React.useState(() => inferLevel(user));
    const [state, setState] = React.useState({ loading:true, error:'', catalog:null });

    const load = React.useCallback(() => {
      let live = true;
      const view = role === 'student' || role === 'estudiante' ? 'estudiante' : 'docente';
      const cacheKey = `${role}:${view}:${level}:${group}:${identity}`;
      setState({ loading:true, error:'', catalog:null });

      const request = CACHE[cacheKey]
        ? Promise.resolve(CACHE[cacheKey])
        : post('getBibliotecaNivelEstudiante', {
            nivel:level,
            codigo:identity,
            cod_grupo:group,
            vista:view,
          }).then(response => {
            const catalog = response?.catalogo || null;
            if (!catalog) throw new Error('El catálogo no devolvió recursos para este nivel.');
            CACHE[cacheKey] = catalog;
            return catalog;
          });

      request
        .then(catalog => { if (live) setState({ loading:false, error:'', catalog }); })
        .catch(error => {
          if (live) setState({
            loading:false,
            error:clean(error?.message || error || 'No se pudieron cargar los recursos.'),
            catalog:null,
          });
        });

      return () => { live = false; };
    }, [role, level, group, identity]);

    React.useEffect(load, [load]);

    const resources = resourcesForRole(state.catalog, role);
    const teacher = role === 'teacher' || role === 'docente';

    return (
      <section data-screen-label={`Recursos Didácticos · Recursos adicionales · ${level}`} style={{ padding:'18px', minHeight:'calc(100vh - 36px)' }}>
        <div style={{
          padding:'20px 22px', border:'1px solid var(--line,#E4DDD2)', borderRadius:18,
          background:'var(--surface,#fff)', boxShadow:'var(--sh-1,0 8px 30px rgba(0,0,0,.08))',
        }}>
          <div style={{ fontSize:10.5, fontWeight:950, letterSpacing:'.15em', color:'#7A1E2C', textTransform:'uppercase' }}>Recursos Didácticos</div>
          <div style={{ marginTop:4, fontFamily:'var(--f-serif,Georgia,serif)', fontSize:30, fontWeight:650, color:'#001E47' }}>Recursos adicionales</div>
          <div style={{ marginTop:5, fontSize:13, color:'#687386' }}>
            {teacher ? 'Diccionario de apoyo para el docente.' : `Material complementario oficial de ${LEVEL_NAMES[level] || level}.`}
          </div>

          {canChooseLevel && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:17 }}>
              {LEVELS.map(code => (
                <button
                  key={code}
                  type="button"
                  className={`btn ${level === code ? 'btn-primary' : ''}`}
                  onClick={() => setLevel(code)}
                  style={{ minWidth:120, fontWeight:900 }}
                >
                  {code} · {LEVEL_NAMES[code]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{
          marginTop:14, padding:'18px 20px 24px', border:'1px solid var(--line,#E4DDD2)', borderRadius:18,
          background:'var(--surface,#fff)', boxShadow:'var(--sh-1,0 8px 30px rgba(0,0,0,.08))',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:10.5, fontWeight:950, letterSpacing:'.12em', color:'#B98913', textTransform:'uppercase' }}>{level} · {LEVEL_NAMES[level]}</div>
              <div style={{ marginTop:3, fontSize:20, fontWeight:900, color:'#001E47' }}>{teacher ? 'Diccionario' : 'Material disponible'}</div>
            </div>
            {!state.loading && !state.error && (
              <span style={{ fontSize:11, fontWeight:850, color:'#687386' }}>{resources.length} recurso{resources.length === 1 ? '' : 's'}</span>
            )}
          </div>

          {state.loading && (
            <div style={{ marginTop:16, padding:'28px 20px', border:'1px dashed #D8C99E', borderRadius:14, background:'#FFFDF7', textAlign:'center', color:'#687386', fontWeight:750 }}>
              Cargando recursos del nivel…
            </div>
          )}

          {state.error && (
            <div role="alert" style={{ marginTop:16, padding:'15px 16px', border:'1px solid #D98B8B', borderRadius:12, background:'#FFF1F1', color:'#8D1E1E', fontSize:12.5, fontWeight:750 }}>
              {state.error}
            </div>
          )}

          {!state.loading && !state.error && resources.length === 0 && (
            <div style={{ marginTop:16, padding:'28px 20px', border:'1px dashed #D8C99E', borderRadius:14, background:'#FFFDF7', textAlign:'center' }}>
              <strong style={{ display:'block', color:'#001E47' }}>{teacher ? 'Diccionario no disponible' : 'No hay recursos publicados'}</strong>
              <span style={{ display:'block', marginTop:6, fontSize:12, color:'#687386' }}>
                {teacher ? 'No se encontró el Diccionario Word by Word en el nivel actual.' : 'La carpeta oficial del nivel no contiene materiales visibles.'}
              </span>
            </div>
          )}

          {!state.loading && !state.error && resources.map((item, index) => (
            <ResourceItem key={`${item?.id || item?.nombre || index}-${index}`} item={item} />
          ))}
        </div>
      </section>
    );
  }

  window.AdditionalResourcesPanel = AdditionalResourcesPanel;
  window.__AN_ADDITIONAL_RESOURCES_PANEL_VERSION__ = VERSION;
})();
