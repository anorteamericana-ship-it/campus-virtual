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

  function ExamPrepLabBackendView(props) {
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
  // Revisión E1 dentro del menú Superadmin, reutilizando el prototipo sin copiar contenido.
  function ExamPrepLabReviewView({ usuario, rolReal }) {
    const current = (typeof window.getSesion === 'function' && window.getSesion()) || {};
    const effective = String(rolReal || usuario?.rol || '').trim().toLowerCase();
    const actual = String(current.rol || '').trim().toLowerCase();
    if (effective !== 'superadmin' || actual !== 'superadmin') {
      return <section role="alert" style={{padding:24}}><h2>Acceso restringido</h2><p>Esta revisión es exclusiva de Superadmin.</p></section>;
    }
    return <section className="epl-superadmin-review" data-epl-superadmin="true">
      <div style={{padding:'14px 18px',marginBottom:12,border:'1px solid #d7c8a4',borderRadius:12,background:'#fffaf0',color:'#654915'}}>
        <div style={{fontWeight:800,fontSize:16}}>Exam Prep Lab · TOEIC — revisión desde Superadmin</div>
        <p style={{margin:'5px 0 0',fontSize:13,lineHeight:1.5}}>
          Vista como estudiante ficticia <strong>Ana Demo</strong>. Banco: <strong>400 preguntas DRAFT</strong> y 112 audios
          sintéticos. No se registran notas, pagos ni estudiantes reales.
        </p>
      </div>
      <iframe
        title="Exam Prep Lab · revisión como estudiante ficticia"
        data-epl-preview-frame="true"
        src="prototipos/exam_prep_lab/index.html?review=superadmin&v=EPL20261120A"
        loading="eager"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
        style={{width:'100%',minHeight:'min(1000px,85vh)',height:'calc(100vh - 210px)',border:'1px solid #e5e7eb',borderRadius:12,background:'#fff'}}
      />
      <p style={{fontSize:12,color:'#6b7280',marginTop:8}}>
        Modo E1 ficticio. Menú limitado a Superadmin; las preguntas estáticas no están protegidas por autorización backend.
        No habilitar candidatos reales antes de completar la liberación protegida.
      </p>
    </section>;
  }
  function ExamPrepLabView(props) {
    return props.previewMode === 'superadmin'
      ? <ExamPrepLabReviewView usuario={props.usuario} rolReal={props.rolReal} />
      : <ExamPrepLabBackendView {...props} />;
  }
  window.ExamPrepLabView = ExamPrepLabView;
})();
