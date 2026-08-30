import fs from 'node:fs';

const path='src/admin_resources_direct_cs21a74.js';
let src=fs.readFileSync(path,'utf8');
function replaceExact(before,after,label){
  const count=src.split(before).length-1;
  if(count!==1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src=src.replace(before,after);
}

replaceExact(
  "  const EVENT_NAME = 'an:admin-resource-tab';",
  "  const EVENT_NAME = 'an:admin-resource-tab';\n  const ADDITIONAL_MODE_KEY = 'an_resources_panel_mode_cs21a68';\n  const ADDITIONAL_EVENT = 'an:resources-panel-mode';",
  'additional route constants'
);

replaceExact(
`  function viewerComponent() {
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function'
      ? window.__AN_BOOK_RESOURCES_COMPONENT__
      : null;
  }

  function StatusView({ error = '', onRetry }) {`,
`  function readAdditionalMode() {
    try { return sessionStorage.getItem(ADDITIONAL_MODE_KEY) === 'additional' ? 'additional' : 'books'; }
    catch (_) { return 'books'; }
  }

  function viewerComponent() {
    return typeof window.__AN_BOOK_RESOURCES_COMPONENT__ === 'function'
      ? window.__AN_BOOK_RESOURCES_COMPONENT__
      : null;
  }

  function additionalComponent() {
    return typeof window.AdditionalResourcesPanel === 'function'
      ? window.AdditionalResourcesPanel
      : null;
  }

  function StatusView({ error = '', onRetry, pendingTitle = 'Preparando Libros y Audios…', pendingText = 'Esperando el visor institucional de libros.' }) {`,
  'mode/component helpers'
);

replaceExact(
  "      }, error ? 'No se pudo completar la carga' : 'Preparando Libros y Audios…'),",
  "      }, error ? 'No se pudo completar la carga' : pendingTitle),",
  'pending title'
);
replaceExact(
  "      }, error || 'Esperando el visor institucional de libros.'),",
  "      }, error || pendingText),",
  'pending text'
);
replaceExact(
  "    const [route, setRoute] = React.useState(() => ({ open: isOpen(), tab: readTab() }));",
  "    const [route, setRoute] = React.useState(() => ({ open: isOpen(), tab: readTab(), mode: readAdditionalMode() }));",
  'initial route state'
);
replaceExact(
`        setRoute({
          open: isOpen(),
          tab: event?.detail?.tab === 'audios' ? 'audios' : readTab(),
        });`,
`        setRoute({
          open: isOpen(),
          tab: event?.detail?.tab === 'audios' ? 'audios' : readTab(),
          mode: event?.detail?.mode === 'additional' ? 'additional' : readAdditionalMode(),
        });`,
  'sync route mode'
);
replaceExact(
`      window.addEventListener(EVENT_NAME, sync);
      window.addEventListener('an:lazy-module-loaded', sync);
      window.addEventListener('storage', sync);`,
`      window.addEventListener(EVENT_NAME, sync);
      window.addEventListener(ADDITIONAL_EVENT, sync);
      window.addEventListener('an:lazy-module-loaded', sync);
      window.addEventListener('storage', sync);`,
  'add mode listener'
);
replaceExact(
`        window.removeEventListener(EVENT_NAME, sync);
        window.removeEventListener('an:lazy-module-loaded', sync);
        window.removeEventListener('storage', sync);`,
`        window.removeEventListener(EVENT_NAME, sync);
        window.removeEventListener(ADDITIONAL_EVENT, sync);
        window.removeEventListener('an:lazy-module-loaded', sync);
        window.removeEventListener('storage', sync);`,
  'remove mode listener'
);

replaceExact(
`    React.useEffect(() => {
      if (!route.open || viewerComponent()) return undefined;
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        if (viewerComponent()) {
          window.clearInterval(timer);
          setTick(value => value + 1);
        } else if (attempts >= 200) {
          window.clearInterval(timer);
          setError('El visor institucional no terminó de inicializarse.');
        }
      }, 100);
      return () => window.clearInterval(timer);
    }, [route.open, route.tab, tick]);`,
`    React.useEffect(() => {
      const current = route.mode === 'additional' ? additionalComponent() : viewerComponent();
      if (!route.open || current) return undefined;
      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        const ready = route.mode === 'additional' ? additionalComponent() : viewerComponent();
        if (ready) {
          window.clearInterval(timer);
          setTick(value => value + 1);
        } else if (attempts >= 200) {
          window.clearInterval(timer);
          setError(route.mode === 'additional'
            ? 'Los recursos adicionales no terminaron de inicializarse.'
            : 'El visor institucional no terminó de inicializarse.');
        }
      }, 100);
      return () => window.clearInterval(timer);
    }, [route.open, route.tab, route.mode, tick]);`,
  'mode-aware readiness'
);

replaceExact(
`    const Viewer = viewerComponent();
    if (!Viewer) return React.createElement(StatusView, { error, onRetry: retry });

    return React.createElement(Viewer, {
      key: \`admin-books-\${route.tab}\`,
      initialType: 'SB',
      adminMode: true,
    });`,
`    const Viewer = route.mode === 'additional' ? additionalComponent() : viewerComponent();
    if (!Viewer) return React.createElement(StatusView, {
      error,
      onRetry: retry,
      pendingTitle: route.mode === 'additional' ? 'Preparando recursos adicionales…' : 'Preparando Libros y Audios…',
      pendingText: route.mode === 'additional' ? 'Esperando el panel de recursos adicionales.' : 'Esperando el visor institucional de libros.',
    });

    const viewerProps = route.mode === 'additional' ? {} : {
      key: \`admin-books-\${route.tab}\`,
      initialType: 'SB',
      adminMode: true,
    };
    return React.createElement(Viewer, viewerProps);`,
  'effective component selection'
);

fs.writeFileSync(path,src);
console.log('CS21A200D exact admin additional-resources routing patch applied');
