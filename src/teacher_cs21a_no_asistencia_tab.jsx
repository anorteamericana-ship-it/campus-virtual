// F98.4-Z6-CS21A3 · Oculta Asistencia de cejillas internas del hub docente
// Frontend-only: Asistencia queda en el menú principal bajo Gestión Académica.
(function(){
  const VERSION = 'F98.4-Z6-CS21A3';
  function ocultarAsistenciaEnCejillas(){
    try {
      const scopes = document.querySelectorAll('main .teacher-page-materiales section[data-screen-label^="Docente · CS21A"]');
      scopes.forEach(scope => {
        const buttons = scope.querySelectorAll('button');
        buttons.forEach(btn => {
          const txt = String(btn.textContent || '').trim().replace(/\s+/g, ' ');
          if (txt === 'Asistencia') {
            btn.style.display = 'none';
            btn.setAttribute('aria-hidden', 'true');
            btn.setAttribute('data-cs21a-hidden-tab', VERSION);
          }
        });
      });
    } catch(_) {}
  }
  ocultarAsistenciaEnCejillas();
  const obs = new MutationObserver(ocultarAsistenciaEnCejillas);
  try { obs.observe(document.body, { childList:true, subtree:true }); } catch(_) {}
  window.addEventListener('an:teacher-material-tab', () => setTimeout(ocultarAsistenciaEnCejillas, 0));
  window.addEventListener('an:lazy-module-loaded', () => setTimeout(ocultarAsistenciaEnCejillas, 0));
  try { window.CS21A3_NO_ASISTENCIA_TAB = { version: VERSION, refresh: ocultarAsistenciaEnCejillas }; } catch(_) {}
})();
