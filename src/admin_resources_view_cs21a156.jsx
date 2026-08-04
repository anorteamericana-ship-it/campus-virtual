// F98.4-Z6-CS21A156 · Ruta canónica de Recursos Didácticos administrativos.
/* global React */
(function adminResourcesViewModuleCS21A156() {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A156';

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function session() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function roleOf(props) {
    const user = session();
    return clean(props?.rolReal || user?.rol || user?.role).toLowerCase();
  }

  function Status({ title, detail, retry }) {
    return (
      <section data-screen-label={`Admin · Recursos Didácticos · ${VERSION}`} style={{
        maxWidth:760, margin:'54px auto', padding:'28px 30px',
        border:'1px solid var(--line,#e5e0d8)', borderRadius:18,
        background:'#fff', boxShadow:'0 10px 34px rgba(0,0,0,.08)', textAlign:'center',
      }}>
        <div style={{ fontSize:10.5, fontWeight:950, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--an-granate,#7A1E2C)' }}>
          Recursos Didácticos
        </div>
        <div style={{ marginTop:7, fontFamily:'var(--f-serif,Georgia,serif)', fontSize:27, color:'var(--an-navy-ink,#001E47)' }}>
          {title}
        </div>
        <div style={{ marginTop:9, fontSize:13, lineHeight:1.55, color:'var(--ink-3,#6f6a63)' }}>
          {detail}
        </div>
        {retry && <button type="button" className="btn btn-primary" onClick={retry} style={{ marginTop:17 }}>Reintentar</button>}
      </section>
    );
  }

  function AdminResourcesView(props) {
    const role = roleOf(props);
    const [revision, setRevision] = React.useState(0);
    const allowed = role === 'admin' || role === 'superadmin';
    const Viewer = typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function'
      ? window.__AN_BOOK_RESOURCES_COMPONENT__
      : null;

    if (!allowed) {
      return <Status title="Acceso restringido" detail="Esta biblioteca administrativa requiere permisos de administración." />;
    }

    if (!Viewer) {
      return <Status
        title="No se pudo preparar la biblioteca"
        detail="El visor institucional no quedó disponible después de cargar la ruta."
        retry={() => {
          try { window.dispatchEvent(new CustomEvent('an:lazy-module-loaded')); } catch (_) {}
          setRevision(value => value + 1);
        }}
      />;
    }

    return (
      <div key={revision} data-screen-label={`Admin · Recursos Didácticos · Ruta canónica · ${VERSION}`}>
        <Viewer initialType="SB" />
      </div>
    );
  }

  window.AdminResourcesView = AdminResourcesView;
  window.__AN_ADMIN_RESOURCES_CANONICAL_VERSION__ = VERSION;
})();
