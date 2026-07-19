// F98.4-Z6-CS21A136 · Sincroniza U01–U16 y carga la barra superior refinada.
(function(){
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A136';
  const BUTTON_SELECTOR = '.an-book-unit-button-cs21a135';
  const LEGACY_SELECTOR = '[data-cs21a135-legacy-unit-strip]';
  const LEGACY_SECTION_SELECTOR = 'section[data-screen-label*="CS21A58"]';
  let queued = false;

  function loadToolbar(){
    if (window.__AN_TEACHER_BOOK_TOOLBAR_CS21A136) {
      window.__AN_TEACHER_BOOK_TOOLBAR_CS21A136.refresh?.();
      return;
    }
    const src = 'src/teacher_books_toolbar_cs21a136.js?v=F98.4Z6CS21A136';
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.cs21a136 = 'teacher-book-toolbar';
    script.onerror = () => console.error('CS21A136: no se pudo cargar el diseño superior de libros.');
    document.head.appendChild(script);
  }

  function inlineActive(button){
    const color = String(button?.style?.color || '').trim().toLowerCase();
    if (!color) return null;
    if (color === '#fff' || color === '#ffffff' || color === 'white' || color.includes('255, 255, 255')) return true;
    return false;
  }

  function syncButton(button){
    if (!button || button.closest(LEGACY_SELECTOR)) return;
    const active = inlineActive(button);
    if (active == null) return;
    const next = active ? 'true' : 'false';
    if (button.getAttribute('data-active') !== next) button.setAttribute('data-active', next);
    if (active) {
      if (button.getAttribute('aria-current') !== 'page') button.setAttribute('aria-current', 'page');
    } else if (button.hasAttribute('aria-current')) {
      button.removeAttribute('aria-current');
    }
  }

  function nativeUnitHeading(section, legacy){
    return Array.from(section.querySelectorAll('strong')).find(node => {
      if (legacy && legacy.contains(node)) return false;
      return /inicio oficial por unidad|selecciona la unidad para ubicar el libro/i.test(String(node.textContent || '').replace(/\s+/g, ' ').trim());
    }) || null;
  }

  function removeLegacyDuplicate(section){
    const legacy = section.querySelector(LEGACY_SELECTOR);
    if (!legacy || !nativeUnitHeading(section, legacy)) return;
    legacy.remove();
  }

  function syncAll(){
    queued = false;
    document.querySelectorAll(LEGACY_SECTION_SELECTOR).forEach(removeLegacyDuplicate);
    document.querySelectorAll(BUTTON_SELECTOR).forEach(syncButton);
    window.__AN_TEACHER_BOOK_TOOLBAR_CS21A136?.refresh?.();
  }

  function queue(){
    if (queued) return;
    queued = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(syncAll);
    else setTimeout(syncAll, 16);
  }

  loadToolbar();
  queue();
  ['an:lazy-module-loaded','an:teacher-material-tab','an:admin-resource-tab'].forEach(name => {
    window.addEventListener(name, () => setTimeout(queue, 90));
  });

  const observer = new MutationObserver(queue);
  observer.observe(document.documentElement, {
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['style','class','aria-pressed','disabled'],
  });

  window.addEventListener('pagehide', () => observer.disconnect(), { once:true });
  window.__AN_TEACHER_BOOK_VISUAL_STATE_CS21A135 = {
    version:VERSION,
    syncAll,
    removeLegacyDuplicate,
    loadToolbar,
  };
})();
