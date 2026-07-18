// F98.4-Z6-CS21A135 · Sincroniza el resaltado visual U01–U16 con React.
(function(){
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A135';
  const BUTTON_SELECTOR = '.an-book-unit-button-cs21a135';
  const LEGACY_SELECTOR = '[data-cs21a135-legacy-unit-strip]';
  const LEGACY_SECTION_SELECTOR = 'section[data-screen-label*="CS21A58"]';
  const LAYOUT_STYLE_ID = 'an-book-unit-layout-cs21a135';
  let queued = false;

  function installLayoutFix(){
    if (document.getElementById(LAYOUT_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = LAYOUT_STYLE_ID;
    style.textContent = `
      .an-book-unit-grid-cs21a135 > div {
        display:grid !important;
        grid-template-rows:52px auto !important;
        gap:5px !important;
        align-content:start !important;
      }
    `;
    document.head.appendChild(style);
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
  }

  function queue(){
    if (queued) return;
    queued = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(syncAll);
    else setTimeout(syncAll, 16);
  }

  installLayoutFix();
  queue();
  ['an:lazy-module-loaded','an:teacher-material-tab','an:admin-resource-tab'].forEach(name => {
    window.addEventListener(name, () => setTimeout(queue, 90));
  });

  const observer = new MutationObserver(queue);
  observer.observe(document.documentElement, {
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['style','aria-pressed','disabled'],
  });

  window.addEventListener('pagehide', () => observer.disconnect(), { once:true });
  window.__AN_TEACHER_BOOK_VISUAL_STATE_CS21A135 = {
    version:VERSION,
    syncAll,
    removeLegacyDuplicate,
    layoutStyleId:LAYOUT_STYLE_ID,
  };
})();
