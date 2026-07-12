// F98.4-Z6-CS21A65 · Abrir y descargar PDF en el visor del estudiante
(function () {
  'use strict';

  const VIEWER_SELECTOR = 'section[data-screen-label*="CS21A60"][data-screen-label*="Libros"]';
  const BOOKS = {
    B1: { SB:'1zVPOGcCca5Ti8M8LtCpEO65-bO0m2_oF', WB:'1J8TAHdFbZudX-VXjMCR6-dPRNyXOEA2d' },
    B2: { SB:'1uU5ta9FVEVIw7YvxtmT08NIbSHfA73e2', WB:'1gb4ks-D66QW9d9EuL8yB8GDRezOMCOpp' },
    I1: { SB:'14vdLNY9uuivBs2MPYnj0-k1jcjy31Uch', WB:'18griDamY2oTzNFwmxhP10Ie4BfKJTiIY' },
    I2: { SB:'1rt9zr_fCmQtpnFexdKBp732rVNGU5HWB', WB:'1VX-4nsWPnY4jO_U4E0OzdhY0u6EG8gaE' },
  };

  function textOf(node) {
    return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function session() {
    try {
      return (typeof window.getSesion === 'function'
        ? window.getSesion()
        : JSON.parse(sessionStorage.getItem('an_usuario') || 'null')) || {};
    } catch (_) {
      return {};
    }
  }

  function roleOf(user) {
    return String(user?.rol || user?.role || '').trim().toLowerCase();
  }

  function inferLevel(user) {
    const direct = String(user?.nivel_activo || user?.NIVEL_ACTIVO || user?.nivel || user?.NIVEL || '').toUpperCase();
    if (BOOKS[direct]) return direct;
    const group = String(user?.grupo || user?.grupoActivo || user?.grupos?.[0] || '').toUpperCase();
    const match = group.match(/(?:^|[-_])(B1|B2|I1|I2)(?:[-_]|$)/);
    return match ? match[1] : 'B1';
  }

  function activeType(viewer) {
    const button = Array.from(viewer.querySelectorAll('button')).find(node =>
      /^(SB|WB)$/.test(textOf(node)) && node.getAttribute('aria-pressed') === 'true'
    );
    return button ? textOf(button) : 'SB';
  }

  function openBook(viewer, download) {
    const user = session();
    const id = BOOKS[inferLevel(user)]?.[activeType(viewer)];
    if (!id) return;
    const url = download
      ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`
      : `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function attach(viewer) {
    const user = session();
    const role = roleOf(user);
    if (role !== 'student' && role !== 'estudiante') return;
    if (viewer.querySelector('[data-student-pdf-cs21a65]')) return;

    const typeButton = Array.from(viewer.querySelectorAll('button')).find(node => /^(SB|WB)$/.test(textOf(node)));
    const typeRoot = typeButton?.parentElement;
    const controls = typeRoot?.parentElement;
    if (!controls) return;

    const box = document.createElement('div');
    box.setAttribute('data-student-pdf-cs21a65', '1');
    Object.assign(box.style, { display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' });

    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'btn';
    open.textContent = 'Abrir PDF';
    open.addEventListener('click', () => openBook(viewer, false));

    const download = document.createElement('button');
    download.type = 'button';
    download.className = 'btn btn-primary';
    download.textContent = 'Descargar PDF';
    download.addEventListener('click', () => openBook(viewer, true));

    box.append(open, download);
    controls.appendChild(box);
  }

  let scheduled = false;
  function scan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      document.querySelectorAll(VIEWER_SELECTOR).forEach(attach);
    });
  }

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('an:lazy-module-loaded', scan);
  window.addEventListener('an:session-changed', scan);
  scan();

  window.__AN_STUDENT_BOOK_PDF_VERSION__ = 'F98.4-Z6-CS21A65';
})();
