/* Northbound · enlace PILOTO en la pantalla de login.
 * La variable de URL ?reto=piloto habilita la UX de revisión, NO es autenticación.
 * No envía datos ni modifica login. No mostrar a visitantes ordinarios.
 */
(function () {
  'use strict';
  var params;
  try { params = new URLSearchParams(window.location.search); } catch (_) { return; }
  if (params.get('reto') !== 'piloto') return;

  var dest = 'prototipos/english_lab_2/reto-semana.html?revision=1';
  var style = document.createElement('style');
  style.id = 'an-weekly-pilot-style';
  style.textContent = [
    '#an-weekly-pilot-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:11px 14px;border-radius:8px;border:2px solid #c8a45f;background:#fff8eb;color:#1d2a50;text-decoration:none;font-weight:800;text-align:center}',
    '#an-weekly-pilot-btn:hover{background:#fff0cf}',
    '#an-weekly-pilot-btn:focus-visible,#an-weekly-dock:focus-visible{outline:3px solid #e5b960;outline-offset:3px}',
    '#an-weekly-dock{position:fixed;right:18px;bottom:20px;z-index:9999;display:flex;align-items:center;gap:10px;min-height:52px;padding:10px 18px 10px 14px;border-radius:99px;background:#7b2137;color:#fff;text-decoration:none;box-shadow:0 12px 35px #1117;border:1px solid #f6d69a;transform:translateX(calc(100% - 52px));transition:transform .24s ease}',
    '#an-weekly-dock:hover,#an-weekly-dock:focus-visible{transform:translateX(0)}',
    '#an-weekly-dock strong{white-space:nowrap;font-size:13px}',
    '#an-weekly-dock .an-weekly-dock-icon{font-size:22px}',
    '@media(hover:none), (max-width:650px){#an-weekly-dock{transform:none;right:10px;bottom:10px;padding:8px 13px;min-height:44px}#an-weekly-dock strong{font-size:11px}}',
    '@media(prefers-reduced-motion:reduce){#an-weekly-dock{transition:none}}'
  ].join('\n');
  document.head.appendChild(style);

  var dock = document.createElement('a');
  dock.id = 'an-weekly-dock';
  dock.href = dest;
  dock.setAttribute('aria-label', 'Abrir Reto de la Semana, piloto en revisión');
  dock.innerHTML = '<span class="an-weekly-dock-icon" aria-hidden="true">☕</span><strong>Reto de la Semana</strong>';
  document.body.appendChild(dock);

  function renderButton() {
    var actions = document.querySelector('.login-card .btns');
    if (!actions || actions.querySelector('#an-weekly-pilot-btn')) return;
    var matricula = Array.from(actions.querySelectorAll('button'))
      .find(function (button) { return /matric[uú]late/i.test(button.textContent || ''); });
    if (!matricula) return;
    var link = document.createElement('a');
    link.id = 'an-weekly-pilot-btn';
    link.href = dest;
    link.textContent = '☕ Reto de la Semana (piloto)';
    link.setAttribute('aria-label', 'Probar el Reto de la Semana (piloto de Northbound)');
    matricula.insertAdjacentElement('afterend', link);
  }
  renderButton();
  var observer = new MutationObserver(renderButton);
  observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
})();
