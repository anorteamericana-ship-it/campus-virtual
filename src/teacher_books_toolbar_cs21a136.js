// F98.4-Z6-CS21A136 · Jerarquía visual de niveles, tipos y acciones PDF.
// Simplifica U01–U16 sin alterar saltos, permisos, Drive ni Apps Script.
(function(){
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A136';
  const STYLE_ID = 'an-teacher-books-toolbar-cs21a136';
  const VIEWER_SELECTOR = [
    'section[data-book-viewer="institutional"]',
    'section[data-screen-label*="CS21A75"][data-screen-label*="Libros"]',
    'section[data-screen-label*="CS21A58"]',
  ].join(',');
  let queued = false;

  if (window.__AN_TEACHER_BOOK_TOOLBAR_CS21A136) {
    window.__AN_TEACHER_BOOK_TOOLBAR_CS21A136.refresh?.();
    return;
  }

  function compact(value){
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function buttonText(button){
    return compact(button?.textContent);
  }

  function installStyles(){
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* Encabezado principal del visor */
      ${VIEWER_SELECTOR} .an-book-toolbar-head-cs21a136 {
        padding:16px 18px !important;
        gap:18px !important;
        border-bottom:1px solid rgba(0,47,108,.12) !important;
        background:
          radial-gradient(circle at 92% 0%,rgba(47,107,224,.08),transparent 34%),
          linear-gradient(180deg,#FFFFFF 0%,#FBFCFE 100%) !important;
      }
      ${VIEWER_SELECTOR} .an-book-toolbar-actions-cs21a136 {
        display:flex !important;
        align-items:center !important;
        justify-content:flex-end !important;
        gap:9px !important;
        padding:7px !important;
        border:1px solid rgba(0,47,108,.12) !important;
        border-radius:15px !important;
        background:rgba(247,249,252,.94) !important;
        box-shadow:inset 0 1px 0 #fff,0 8px 22px rgba(0,31,71,.07) !important;
      }

      /* SB / TB / WB */
      ${VIEWER_SELECTOR} .an-book-type-button-cs21a136 {
        --book-type:#0B4A8B;
        --book-type-dark:#003566;
        --book-type-soft:#E8F2FC;
        position:relative !important;
        min-width:72px !important;
        height:48px !important;
        padding:0 17px !important;
        border:1px solid color-mix(in srgb,var(--book-type) 42%,#D6DEE8) !important;
        border-radius:12px !important;
        background:linear-gradient(180deg,#FFFFFF,var(--book-type-soft)) !important;
        color:var(--book-type-dark) !important;
        font-size:14px !important;
        font-weight:950 !important;
        letter-spacing:.025em !important;
        box-shadow:inset 0 3px 0 color-mix(in srgb,var(--book-type) 78%,white),0 4px 10px rgba(0,31,71,.07) !important;
        transform:translateY(0);
        transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease,filter .16s ease !important;
      }
      ${VIEWER_SELECTOR} .an-book-type-button-cs21a136[data-book-type="TB"] { --book-type:#A22A3D; --book-type-dark:#70192A; --book-type-soft:#F9EDEF; }
      ${VIEWER_SELECTOR} .an-book-type-button-cs21a136[data-book-type="WB"] { --book-type:#238044; --book-type-dark:#145A2A; --book-type-soft:#EAF6ED; }
      ${VIEWER_SELECTOR} .an-book-type-button-cs21a136:hover:not(:disabled) {
        transform:translateY(-2px);
        border-color:var(--book-type) !important;
        box-shadow:inset 0 3px 0 var(--book-type),0 10px 20px color-mix(in srgb,var(--book-type) 18%,transparent) !important;
      }
      ${VIEWER_SELECTOR} .an-book-type-button-cs21a136[data-active="true"] {
        border-color:var(--book-type-dark) !important;
        background:linear-gradient(145deg,var(--book-type),var(--book-type-dark)) !important;
        color:#fff !important;
        box-shadow:0 0 0 3px color-mix(in srgb,var(--book-type) 15%,transparent),0 12px 24px color-mix(in srgb,var(--book-type) 28%,transparent) !important;
        transform:translateY(-2px);
      }

      /* Acciones */
      ${VIEWER_SELECTOR} .an-book-action-cs21a136 {
        min-height:48px !important;
        padding:0 17px !important;
        border-radius:12px !important;
        font-size:12.5px !important;
        font-weight:900 !important;
        letter-spacing:-.01em !important;
        display:inline-flex !important;
        align-items:center !important;
        justify-content:center !important;
        gap:8px !important;
        transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease !important;
      }
      ${VIEWER_SELECTOR} .an-book-action-cs21a136::before {
        width:23px;
        height:23px;
        display:grid;
        place-items:center;
        border-radius:7px;
        font-size:13px;
        font-weight:950;
      }
      ${VIEWER_SELECTOR} .an-book-open-pdf-cs21a136 {
        border:1px solid rgba(0,47,108,.22) !important;
        background:#fff !important;
        color:#003B7A !important;
        box-shadow:0 5px 12px rgba(0,31,71,.06) !important;
      }
      ${VIEWER_SELECTOR} .an-book-open-pdf-cs21a136::before { content:'↗'; background:#EAF2FB; color:#0B4A8B; }
      ${VIEWER_SELECTOR} .an-book-download-pdf-cs21a136 {
        border:1px solid #002F6C !important;
        background:linear-gradient(145deg,#064B93,#001E47) !important;
        color:#fff !important;
        box-shadow:0 10px 21px rgba(0,47,108,.22) !important;
      }
      ${VIEWER_SELECTOR} .an-book-download-pdf-cs21a136::before { content:'↓'; background:rgba(255,255,255,.15); color:#fff; }
      ${VIEWER_SELECTOR} .an-book-images-drive-cs21a136 {
        border:1px solid rgba(95,105,119,.2) !important;
        background:#F8F9FB !important;
        color:#4F5B69 !important;
      }
      ${VIEWER_SELECTOR} .an-book-images-drive-cs21a136::before { content:'▦'; background:#ECEFF3; color:#596575; }
      ${VIEWER_SELECTOR} .an-book-action-cs21a136:hover:not(:disabled) { transform:translateY(-2px); }
      ${VIEWER_SELECTOR} .an-book-open-pdf-cs21a136:hover:not(:disabled) { border-color:#0B4A8B !important; box-shadow:0 10px 20px rgba(0,47,108,.13) !important; }
      ${VIEWER_SELECTOR} .an-book-download-pdf-cs21a136:hover:not(:disabled) { box-shadow:0 14px 28px rgba(0,47,108,.29) !important; }

      /* Niveles B1 / B2 / I1 / I2 */
      ${VIEWER_SELECTOR} .an-book-level-bar-cs21a136 {
        padding:10px 14px !important;
        border-bottom:1px solid rgba(0,47,108,.11) !important;
        background:linear-gradient(180deg,#F8F5EF 0%,#F2EEE7 100%) !important;
      }
      ${VIEWER_SELECTOR} .an-book-level-list-cs21a136 {
        display:grid !important;
        grid-template-columns:repeat(4,minmax(155px,1fr)) !important;
        gap:8px !important;
        width:100% !important;
      }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136 {
        --level-accent:#F2C94C;
        min-height:48px !important;
        padding:0 15px !important;
        border:1px solid color-mix(in srgb,var(--level-accent) 35%,#D8DDE5) !important;
        border-radius:12px !important;
        background:linear-gradient(180deg,#FFFFFF 0%,color-mix(in srgb,var(--level-accent) 8%,white) 100%) !important;
        color:#16263B !important;
        font-size:12.5px !important;
        font-weight:850 !important;
        box-shadow:inset 0 3px 0 var(--level-accent),0 4px 11px rgba(0,31,71,.055) !important;
        transform:translateY(0);
        transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease !important;
      }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136[data-level="B2"] { --level-accent:#DA291C; }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136[data-level="I1"] { --level-accent:#2F6BE0; }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136[data-level="I2"] { --level-accent:#2E7D32; }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136 > span:first-child {
        width:11px !important;
        height:11px !important;
        margin-right:9px !important;
        box-shadow:0 0 0 4px color-mix(in srgb,var(--level-accent) 15%,transparent);
      }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136:hover:not(:disabled) {
        transform:translateY(-2px);
        border-color:var(--level-accent) !important;
        box-shadow:inset 0 3px 0 var(--level-accent),0 10px 19px color-mix(in srgb,var(--level-accent) 17%,transparent) !important;
      }
      ${VIEWER_SELECTOR} .an-book-level-button-cs21a136[data-active="true"] {
        border-color:#001E47 !important;
        background:linear-gradient(145deg,#064B93,#001E47) !important;
        color:#fff !important;
        box-shadow:0 0 0 3px color-mix(in srgb,var(--level-accent) 18%,transparent),0 12px 23px rgba(0,47,108,.23) !important;
        transform:translateY(-2px);
      }

      /* Navegación por unidad: una sola línea limpia U01–U16 */
      ${VIEWER_SELECTOR} .an-book-unit-strip-cs21a135 {
        padding:8px 14px 10px !important;
        border-top:0 !important;
        border-bottom:1px solid rgba(0,47,108,.11) !important;
        background:#F8F6F1 !important;
        box-shadow:none !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-header-cs21a135 {
        display:none !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-grid-cs21a135 {
        display:grid !important;
        grid-template-columns:repeat(16,minmax(46px,1fr)) !important;
        gap:5px !important;
        overflow-x:auto !important;
        padding:0 !important;
        scrollbar-width:none !important;
        overscroll-behavior-x:contain;
      }
      ${VIEWER_SELECTOR} .an-book-unit-grid-cs21a135::-webkit-scrollbar { display:none !important; width:0 !important; height:0 !important; }
      ${VIEWER_SELECTOR} .an-book-unit-grid-cs21a135 > div {
        min-width:46px !important;
        grid-template-rows:38px !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-grid-cs21a135 > div:has(.an-book-unit-update-cs21a135) {
        grid-template-rows:38px 21px !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-button-cs21a135 {
        width:100% !important;
        min-width:46px !important;
        height:38px !important;
        min-height:38px !important;
        padding:0 4px !important;
        border-radius:9px !important;
        font-size:10.5px !important;
        letter-spacing:.015em !important;
        box-shadow:inset 0 2px 0 var(--book-unit-accent),0 3px 8px rgba(0,31,71,.06) !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-button-cs21a135::before,
      ${VIEWER_SELECTOR} .an-book-unit-button-cs21a135::after {
        content:none !important;
        display:none !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-button-cs21a135:hover:not(:disabled) {
        transform:translateY(-1px) !important;
        box-shadow:inset 0 2px 0 var(--book-unit-accent),0 7px 13px color-mix(in srgb,var(--book-unit-accent) 14%,transparent) !important;
      }
      ${VIEWER_SELECTOR} .an-book-unit-button-cs21a135[data-active="true"] {
        transform:translateY(-1px) !important;
        box-shadow:0 0 0 2px rgba(242,201,76,.24),0 8px 15px color-mix(in srgb,var(--book-unit-accent) 22%,transparent) !important;
      }

      @media (max-width:980px) {
        ${VIEWER_SELECTOR} .an-book-toolbar-head-cs21a136 { align-items:flex-start !important; }
        ${VIEWER_SELECTOR} .an-book-toolbar-actions-cs21a136 { width:100%; justify-content:flex-start !important; overflow-x:auto; scrollbar-width:none; }
        ${VIEWER_SELECTOR} .an-book-toolbar-actions-cs21a136::-webkit-scrollbar { display:none; }
        ${VIEWER_SELECTOR} .an-book-level-list-cs21a136 { grid-template-columns:repeat(4,minmax(145px,1fr)) !important; overflow-x:auto; scrollbar-width:none; }
        ${VIEWER_SELECTOR} .an-book-level-list-cs21a136::-webkit-scrollbar { display:none; }
      }
      @media (max-width:620px) {
        ${VIEWER_SELECTOR} .an-book-toolbar-head-cs21a136 { padding:14px 12px !important; }
        ${VIEWER_SELECTOR} .an-book-toolbar-actions-cs21a136 { padding:6px !important; gap:7px !important; }
        ${VIEWER_SELECTOR} .an-book-type-button-cs21a136 { min-width:62px !important; height:44px !important; padding:0 13px !important; }
        ${VIEWER_SELECTOR} .an-book-action-cs21a136 { min-height:44px !important; white-space:nowrap; }
        ${VIEWER_SELECTOR} .an-book-level-bar-cs21a136 { padding:9px 10px !important; overflow:hidden; }
        ${VIEWER_SELECTOR} .an-book-level-list-cs21a136 { grid-template-columns:repeat(4,145px) !important; }
        ${VIEWER_SELECTOR} .an-book-unit-strip-cs21a135 { padding:7px 10px 9px !important; }
        ${VIEWER_SELECTOR} .an-book-unit-grid-cs21a135 { grid-template-columns:repeat(16,48px) !important; }
        ${VIEWER_SELECTOR} .an-book-unit-grid-cs21a135 > div { min-width:48px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function setActive(button, active){
    const value = active ? 'true' : 'false';
    if (button.getAttribute('data-active') !== value) button.setAttribute('data-active', value);
  }

  function enhanceViewer(section){
    if (!section) return;
    section.setAttribute('data-book-toolbar', VERSION);

    const buttons = Array.from(section.querySelectorAll('button'));
    const typeButtons = buttons.filter(button => /^(SB|TB|WB)$/.test(buttonText(button)));
    const levelButtons = buttons.filter(button => /^(B1|B2|I1|I2)\s*·/.test(buttonText(button)));

    typeButtons.forEach(button => {
      const type = buttonText(button);
      button.classList.add('an-book-type-button-cs21a136');
      button.setAttribute('data-book-type', type);
      setActive(button, button.getAttribute('aria-pressed') === 'true');
    });

    levelButtons.forEach(button => {
      const level = buttonText(button).match(/^(B1|B2|I1|I2)/)?.[1] || 'B1';
      button.classList.add('an-book-level-button-cs21a136');
      button.setAttribute('data-level', level);
      setActive(button, button.classList.contains('btn-primary'));
    });

    const actionMap = [
      ['Imágenes Drive','an-book-images-drive-cs21a136'],
      ['Abrir PDF','an-book-open-pdf-cs21a136'],
      ['Descargar PDF','an-book-download-pdf-cs21a136'],
    ];
    actionMap.forEach(([label, className]) => {
      buttons.filter(button => buttonText(button) === label).forEach(button => {
        button.classList.add('an-book-action-cs21a136', className);
      });
    });

    const actionAnchor = typeButtons[0] || buttons.find(button => ['Abrir PDF','Descargar PDF','Imágenes Drive'].includes(buttonText(button)));
    const actionParent = actionAnchor?.parentElement;
    if (actionParent) {
      actionParent.classList.add('an-book-toolbar-actions-cs21a136');
      actionParent.parentElement?.classList.add('an-book-toolbar-head-cs21a136');
    }

    const levelParent = levelButtons[0]?.parentElement;
    if (levelParent) {
      levelParent.classList.add('an-book-level-list-cs21a136');
      levelParent.parentElement?.classList.add('an-book-level-bar-cs21a136');
    }

    section.querySelectorAll('.an-book-unit-header-cs21a135').forEach(header => {
      header.setAttribute('aria-hidden', 'true');
    });
    section.querySelectorAll('.an-book-unit-button-cs21a135').forEach(button => {
      const match = buttonText(button).match(/^U\d{2}$/);
      if (match && button.textContent !== match[0]) button.textContent = match[0];
    });
  }

  function refresh(){
    queued = false;
    document.querySelectorAll(VIEWER_SELECTOR).forEach(enhanceViewer);
  }

  function queue(){
    if (queued) return;
    queued = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(refresh);
    else setTimeout(refresh, 16);
  }

  installStyles();
  queue();
  ['an:lazy-module-loaded','an:teacher-material-tab','an:admin-resource-tab'].forEach(name => {
    window.addEventListener(name, () => setTimeout(queue, 60));
  });

  const observer = new MutationObserver(queue);
  observer.observe(document.documentElement, {
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','aria-pressed','disabled'],
  });

  window.addEventListener('pagehide', () => observer.disconnect(), { once:true });
  window.__AN_TEACHER_BOOK_TOOLBAR_CS21A136 = { version:VERSION, refresh, enhanceViewer, styleId:STYLE_ID };
})();
