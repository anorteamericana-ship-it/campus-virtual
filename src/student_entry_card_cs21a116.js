// F98.4-Z6-CS21A116 · Activa la entrada visual unificada en Mi Campus.
(function () {
  'use strict';

  let queued = false;

  function patch() {
    const section = document.querySelector('.campus-d-root > #panel-actualizar-datos.campus-d-student-section');
    if (!section) return;

    section.classList.add('st116-entry-card');
    section.setAttribute('aria-label', 'Identidad del estudiante');

    const actions = section.querySelector('.campus-d-actions');
    if (actions) {
      const current = typeof window.getSesion === 'function' ? (window.getSesion() || {}) : {};
      const code = String(current.codigo || current.rec_m || current.cedula || 'Pendiente').trim();
      actions.setAttribute('data-st116-code', code);
      actions.setAttribute('aria-label', 'Código del estudiante');
    }

    const photo = section.querySelector('.campus-d-photo-button');
    if (photo) photo.title = 'Cambiar fotografía';

    window.CS21A116_STUDENT_ENTRY_CARD = 'F98.4-Z6-CS21A116';
  }

  function queuePatch() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      patch();
    });
  }

  window.addEventListener('an:lazy-module-loaded', queuePatch);
  window.addEventListener('an:session-changed', queuePatch);
  window.addEventListener('popstate', queuePatch);

  new MutationObserver(queuePatch).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', queuePatch, { once: true });
  } else {
    queuePatch();
  }
})();
