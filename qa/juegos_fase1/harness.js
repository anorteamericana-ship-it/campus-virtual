// QA juegos fase 1 · harness local de English LAB (Academia Play).
// Carga src/academia_play.jsx igual que src/lazy_loader.jsx (fetch + Babel preset react + transform-block-scoping)
// y monta la vista de estudiante o un runner con datos ficticios. No parchea el código servido ni llama al backend.
//
// Parámetros:
//   ?view=student              vista completa de estudiante (catálogo → juego)
//   ?game=<id de AP_FLOWS>     runner de un juego local
//   ?flow=<fixture>            runner con un flujo de fixtures.js (single4, matchLong)
//   ?bank=<fixture>            runner con ítems con forma de banco (mcq, reading, match, order) vía apFlowFromBankGame
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const qa = window.__apQA = { ready: false, error: '', results: [], backs: 0 };

  // Cualquier apPost cae en una ruta local inexistente; nunca en Apps Script.
  window.APPS_SCRIPT_URL = location.origin + '/__qa_sin_backend__';

  async function injectCampusStyles() {
    const html = await (await fetch('campus.html', { cache: 'no-cache' })).text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const hrefs = [...doc.querySelectorAll('link[rel="stylesheet"]')].map(l => l.getAttribute('href'));
    await Promise.all(hrefs.map(href => new Promise(resolve => {
      const el = document.createElement('link');
      el.rel = 'stylesheet';
      el.href = href;
      el.onload = el.onerror = resolve;
      document.head.appendChild(el);
    })));
  }

  async function loadAcademiaPlay() {
    const src = 'src/academia_play.jsx';
    const res = await fetch(src, { cache: 'no-cache' });
    if (!res.ok) throw new Error('No se pudo cargar ' + src + ' (' + res.status + ')');
    const code = await res.text();
    const js = window.Babel.transform(code, { presets: ['react'], plugins: ['transform-block-scoping'] }).code;
    const s = document.createElement('script');
    s.text = js + '\n//# sourceURL=' + src;
    document.head.appendChild(s);
  }

  function runnerFor(flow) {
    if (flow.kind === 'match') return window.APMatchRunner;
    if (flow.kind === 'order') return window.APOrderRunner;
    return window.APChoiceRunner;
  }

  function buildElement() {
    const h = React.createElement;
    const common = {
      isFreeUser: false,
      soundOn: false,
      onBack: () => { qa.backs += 1; },
      onComplete: (result) => { qa.results.push(result); },
      onNextGame: null,
      nextGame: null,
    };
    const shell = (className, child) => h('div', { className: 'aplay-shell', 'data-screen-label': 'QA harness' }, h('div', { className }, child));

    if (params.get('view') === 'student') {
      const usuario = { rol: 'student', nombre: 'QA Estudiante', cedula: 'QA-000', codigo: 'QA-STUDENT', grupo: 'QA-B1', nivel_activo: 'B1', tipoUsuario: 'estudiante' };
      return h(window.AcademiaPlayView, { usuario, role: 'student', rolReal: 'student', onNavigate: () => {} });
    }
    if (params.get('game')) {
      return h('div', { className: 'aplay-shell' }, h(window.APGameRunner, Object.assign({ gameId: params.get('game') }, common)));
    }
    if (params.get('flow')) {
      const flow = window.AP_QA_FIXTURES.flows[params.get('flow')];
      if (!flow) throw new Error('Fixture de flujo desconocido: ' + params.get('flow'));
      return shell('ap-practice-wrap', h(runnerFor(flow), Object.assign({ flow }, common)));
    }
    if (params.get('bank')) {
      const fx = window.AP_QA_FIXTURES.bank[params.get('bank')];
      if (!fx) throw new Error('Fixture de banco desconocido: ' + params.get('bank'));
      const flow = window.apFlowFromBankGame(fx.game, fx.items);
      return shell('ap-practice-wrap ap-bank-practice-wrap', h(runnerFor(flow), Object.assign({ flow }, common)));
    }
    throw new Error('Falta ?view, ?game, ?flow o ?bank');
  }

  (async function main() {
    try {
      await injectCampusStyles();
      await loadAcademiaPlay();
      ReactDOM.createRoot(document.getElementById('root')).render(buildElement());
      qa.ready = true;
    } catch (err) {
      qa.error = String(err && err.stack || err);
      document.getElementById('root').textContent = 'Error del harness: ' + qa.error;
    }
  })();
})();
