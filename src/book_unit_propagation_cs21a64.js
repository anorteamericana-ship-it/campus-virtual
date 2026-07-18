// F98.4-Z6-CS21A135 · Propagación UXX–U16 + autoridad del visor docente
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A135';
  const VIEWER_SELECTOR = [
    'section[data-book-viewer="institutional"]',
    'section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]',
    'section[data-screen-label*="CS21A58"][data-screen-label*="libros"]',
  ].join(',');
  const ENDPOINT = 'superadminBooksSetUnitStart';
  const ORIGINAL_FETCH = window.fetch.bind(window);
  let pending = null;
  let lastSuccess = null;

  function loadTeacherUnitGuard() {
    if (window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135) {
      window.__AN_TEACHER_BOOK_NAVIGATION_CS21A135.reinstall?.();
      return;
    }
    const src = 'src/teacher_books_unit_guard_cs21a134.js?v=F98.4Z6CS21A135';
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.cs21a135 = 'teacher-book-navigation';
    script.onerror = () => console.error('CS21A135: no se pudo cargar la autoridad del visor docente.');
    document.head.appendChild(script);
  }
  loadTeacherUnitGuard();

  function textOf(node) {
    return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function unitFromButton(button) {
    const title = String(button?.getAttribute('title') || '');
    const match = title.match(/\bU(\d{2})\b/i);
    return match ? Number(match[1]) : null;
  }

  function pageFromButton(button) {
    const title = String(button?.getAttribute('title') || '');
    const match = title.match(/hoja\s+visible\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  function stopClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
  }

  function askPropagation(event, button) {
    if (textOf(button) !== 'Actualizar' || button.disabled) return;
    const viewer = button.closest(VIEWER_SELECTOR);
    if (!viewer) return;

    const unit = unitFromButton(button);
    const sourcePage = pageFromButton(button);
    if (!unit || !sourcePage || unit >= 16) {
      pending = null;
      return;
    }

    const currentLabel = `U${String(unit).padStart(2, '0')}`;
    const nextLabel = `U${String(unit + 1).padStart(2, '0')}`;
    const propagate = window.confirm(
      `Vas a guardar ${currentLabel} en la hoja ${sourcePage}.\n\n` +
      `¿Querés recalcular también ${nextLabel}–U16 usando la misma cantidad de clics de “Siguiente” entre cada unidad?\n\n` +
      `Aceptar = recalcular las siguientes.\nCancelar = guardar solamente ${currentLabel}.`
    );

    if (!propagate) {
      pending = null;
      return;
    }

    const raw = window.prompt(
      `¿Cuántos clics de “Siguiente” querés dejar entre cada unidad?\n\n` +
      `Cada clic avanza 2 hojas.\n` +
      `Ejemplo desde hoja 27:\n` +
      `• 4 clics → ${nextLabel} en hoja 35\n` +
      `• 3 clics → ${nextLabel} en hoja 33\n\n` +
      `Se recalculará desde ${currentLabel} hasta U16.`,
      '4'
    );

    if (raw === null) {
      pending = null;
      stopClick(event);
      return;
    }

    const clicks = Number(String(raw).trim());
    if (!Number.isInteger(clicks) || clicks < 1) {
      pending = null;
      window.alert('Indicá un número entero de clics mayor o igual a 1. No se guardó ningún cambio.');
      stopClick(event);
      return;
    }

    pending = {
      unit,
      sourcePage,
      clicks,
      viewer,
      createdAt: Date.now(),
    };
  }

  function isTargetRequest(input) {
    const url = typeof input === 'string' ? input : String(input?.url || input || '');
    try {
      const parsed = new URL(url, window.location.href);
      return String(parsed.searchParams.get('fn') || '').toLowerCase() === ENDPOINT.toLowerCase();
    } catch (_) {
      return url.toLowerCase().includes(`fn=${ENDPOINT.toLowerCase()}`);
    }
  }

  function successText(data, request) {
    const selected = Number(data?.updated_unit || request.unit);
    const count = Number(data?.updated_units_count || (16 - selected + 1));
    const through = Number(data?.propagated_through_unit || 16);
    const clicks = Number(data?.clicks_between_units || request.clicks);
    const source = Number(data?.updated_source_page || request.sourcePage);
    return (
      `U${String(selected).padStart(2, '0')} quedó guardada en la hoja ${source}. ` +
      `${count} unidades fueron recalculadas hasta U${String(through).padStart(2, '0')} ` +
      `con ${clicks} clic${clicks === 1 ? '' : 's'} de Siguiente entre cada una.`
    );
  }

  function applySuccessMessage() {
    if (!lastSuccess || Date.now() - lastSuccess.createdAt > 12000) return;
    const viewer = lastSuccess.viewer?.isConnected
      ? lastSuccess.viewer
      : document.querySelector(VIEWER_SELECTOR);
    if (!viewer) return;

    const statusNodes = Array.from(viewer.querySelectorAll('[role="status"]'));
    const node = statusNodes.find(item => /quedó guardada en la hoja/i.test(textOf(item))) || statusNodes[0];
    if (!node) return;
    node.textContent = lastSuccess.message;
  }

  window.fetch = function cs21a135Fetch(input, init) {
    if (pending && Date.now() - pending.createdAt > 8000) pending = null;
    if (!pending || !isTargetRequest(input) || !init || typeof init.body !== 'string') {
      return ORIGINAL_FETCH(input, init);
    }

    let body = null;
    try { body = JSON.parse(init.body); } catch (_) { body = null; }
    if (!body || Number(body.unit || body.unidad) !== pending.unit) {
      return ORIGINAL_FETCH(input, init);
    }

    const request = pending;
    pending = null;
    const nextBody = {
      ...body,
      propagate_following: true,
      clicks_between_units: request.clicks,
    };
    const nextInit = { ...init, body: JSON.stringify(nextBody) };

    return ORIGINAL_FETCH(input, nextInit).then(response => {
      try {
        response.clone().json().then(data => {
          if (!data?.ok || !data?.unit_start_propagated) return;
          lastSuccess = {
            viewer: request.viewer,
            message: successText(data, request),
            createdAt: Date.now(),
          };
          [80, 220, 600, 1200].forEach(delay => window.setTimeout(applySuccessMessage, delay));
        }).catch(() => {});
      } catch (_) {}
      return response;
    });
  };

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('button');
    if (button) askPropagation(event, button);
  }, true);

  const observer = new MutationObserver(applySuccessMessage);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  window.__AN_BOOK_UNIT_PROPAGATION_VERSION__ = VERSION;
})();
