// Exam Prep Lab (preparación TOEIC® L&R) · vista del Campus · PREPARADA, NO PUBLICADA.
// Este archivo todavía no está en F96_LAZY ni en ningún menú de main: se conecta en una liberación autorizada
// (ver 00_DOCUMENTACION/EXAM_PREP_LAB_ESTADO.md, sección de integración).
// - Usa la sesión vigente del Campus (window.getSessionToken). No envía código, cédula ni grupo: el servidor
//   resuelve la identidad y decide si la persona tiene acceso (CERT_PREP_ACCESS), qué ve y qué puede hacer.
// - No carga el banco de preguntas en el navegador: las claves y explicaciones llegan solo cuando el servidor lo permite.
// - No escribe en notas, asistencias, ESTATUS, pagos, CONAPE ni certificados.
(function () {
  const EPL_BASE = 'prototipos/exam_prep_lab/';
  const EPL_VER = 'EPL20261119B';
  function loadScript(file) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[data-epl="' + file + '"]')) return resolve();
      const s = document.createElement('script');
      s.src = EPL_BASE + file + '?v=' + EPL_VER; s.dataset.epl = file;
      s.onload = () => resolve(); s.onerror = () => reject(new Error('No se pudo cargar ' + file));
      document.head.appendChild(s);
    });
  }
  function loadCss() {
    if (document.querySelector('link[data-epl]')) return;
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = EPL_BASE + 'epl.css?v=' + EPL_VER; l.dataset.epl = 'css';
    document.head.appendChild(l);
  }

  function ExamPrepLabView(props) {
    const ref = React.useRef(null);
    const [error, setError] = React.useState('');
    React.useEffect(() => {
      let alive = true;
      loadCss();
      (async () => {
        try {
          for (const f of ['epl_engine.js', 'audio_manifest.js', 'epl_apps_script_adapter.js', 'epl_app.js']) await loadScript(f);
          if (!alive || !ref.current) return;
          const token = () => (typeof window.getSessionToken === 'function' ? window.getSessionToken() : '');
          const u = props.usuario || {};
          // Solo para mostrar el nombre; los permisos los decide certPrepApi en el servidor.
          const user = { usuario: String(u.usuario || ''), nombre: String(u.nombre || ''), rol: String(u.rol || '').toLowerCase() };
          window.EPLApp.mount(ref.current, {
            api: window.EPLAppsScript.api(token), user, embedded: true, assetBase: EPL_BASE,
            activationBase: location.origin + location.pathname.replace(/[^/]*$/, '') + EPL_BASE + 'index.html?backend=apps-script'
          }).route();
        } catch (e) { if (alive) setError(String((e && e.message) || e)); }
      })();
      return () => { alive = false; };
    }, []);
    return (
      <div className="epl-embedded">
        <header className="top"><div className="top-in">
          <div className="brand"><b>EXAM PREP LAB</b><small>Preparación para el test TOEIC® Listening and Reading</small></div>
          <nav className="tabs" id="epl-tabs" aria-label="Secciones de Exam Prep Lab"></nav>
          <div className="who" id="epl-who"></div>
        </div></header>
        <div id="epl-offline" className="offline" role="status" hidden></div>
        {error ? <div className="note bad">No se pudo abrir Exam Prep Lab: {error}</div> : null}
        <main ref={ref} tabIndex="-1"></main>
        <div id="epl-live" className="sr" aria-live="polite"></div>
        <p className="small mute" style={{ marginTop: 16 }}>
          TOEIC® es una marca registrada de ETS. Este producto no está respaldado ni aprobado por ETS. Los resultados de práctica no son puntajes oficiales y no afectan notas, asistencia ni expedientes.
        </p>
      </div>
    );
  }
  window.ExamPrepLabView = ExamPrepLabView;
})();
