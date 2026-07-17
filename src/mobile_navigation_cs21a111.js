// F98.4-Z6-CS21A111 · Menú móvil lateral accesible para estudiante, docente y administración.
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A111';
  const MOBILE_QUERY = '(max-width: 900px)';
  const media = window.matchMedia(MOBILE_QUERY);
  let currentIconKey = '';
  let mutationQueued = false;

  function getSidebar() {
    return document.querySelector('.app > .sb') || document.querySelector('.sb');
  }

  function isOpen() {
    return document.body.classList.contains('an-mobile-nav-open');
  }

  function currentLabel(sidebar) {
    const active = sidebar && sidebar.querySelector('.sb-item.active:not([disabled])');
    const label = active && active.querySelector('.sb-label');
    if (label && label.textContent.trim()) return label.textContent.trim();
    const role = String(sidebar && sidebar.dataset && sidebar.dataset.role || '').toLowerCase();
    if (role === 'teacher') return 'Menú docente';
    if (role === 'admin') return 'Menú administrativo';
    return 'Mi Campus';
  }

  function updateCurrentIcon(sidebar) {
    const holder = document.querySelector('.an-mobile-nav-current-icon');
    if (!holder) return;
    const active = sidebar && sidebar.querySelector('.sb-item.active:not([disabled])');
    const source = active && (active.querySelector('svg') || active.querySelector('.sb-english-lab-icon'));
    const label = currentLabel(sidebar);
    const key = `${label}|${active && active.getAttribute('data-nav-id') || ''}`;
    if (key === currentIconKey) return;
    currentIconKey = key;
    holder.replaceChildren();
    if (source) {
      const clone = source.cloneNode(true);
      clone.removeAttribute('class');
      clone.setAttribute('aria-hidden', 'true');
      holder.appendChild(clone);
    } else {
      holder.textContent = '⌂';
    }
  }

  function updateHeader() {
    const sidebar = getSidebar();
    const title = document.querySelector('.an-mobile-nav-title');
    const label = currentLabel(sidebar);
    if (title && title.textContent !== label) title.textContent = label;
    updateCurrentIcon(sidebar);
  }

  function applyAccessibility(open) {
    const sidebar = getSidebar();
    if (!sidebar) return;
    if (!sidebar.id) sidebar.id = 'an-campus-navigation';
    sidebar.setAttribute('aria-label', 'Navegación principal del Campus');

    if (!media.matches) {
      sidebar.removeAttribute('aria-hidden');
      try { sidebar.inert = false; } catch (_) {}
      return;
    }

    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
    try { sidebar.inert = !open; } catch (_) {}
  }

  function setOpen(next, options) {
    const open = !!next && media.matches;
    document.body.classList.toggle('an-mobile-nav-open', open);

    const toggle = document.querySelector('.an-mobile-nav-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú del Campus' : 'Abrir menú del Campus');
    }

    const overlay = document.querySelector('.an-mobile-nav-overlay');
    if (overlay) overlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    applyAccessibility(open);

    if (open) {
      window.setTimeout(function () {
        const sidebar = getSidebar();
        const target = sidebar && (sidebar.querySelector('.sb-item.active:not([disabled])') || sidebar.querySelector('.sb-item:not([disabled])'));
        if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
      }, 260);
    } else if (!(options && options.keepFocus)) {
      const sidebar = getSidebar();
      if (sidebar && sidebar.contains(document.activeElement)) {
        window.setTimeout(function () {
          const btn = document.querySelector('.an-mobile-nav-toggle');
          if (btn && typeof btn.focus === 'function') btn.focus({ preventScroll: true });
        }, 0);
      }
    }
  }

  function buildControls() {
    if (!document.querySelector('.an-mobile-nav-bar')) {
      const bar = document.createElement('header');
      bar.className = 'an-mobile-nav-bar';
      bar.setAttribute('aria-label', 'Navegación móvil del Campus');

      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'an-mobile-nav-toggle';
      toggle.setAttribute('aria-controls', 'an-campus-navigation');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú del Campus');
      const lines = document.createElement('span');
      lines.className = 'an-mobile-nav-toggle-lines';
      lines.setAttribute('aria-hidden', 'true');
      toggle.appendChild(lines);

      const brand = document.createElement('div');
      brand.className = 'an-mobile-nav-brand';
      const logoWrap = document.createElement('span');
      logoWrap.className = 'an-mobile-nav-logo-wrap';
      const logo = document.createElement('img');
      logo.className = 'an-mobile-nav-logo';
      logo.src = 'assets/logo_oficial_transparent.png';
      logo.alt = '';
      logoWrap.appendChild(logo);
      const copy = document.createElement('span');
      copy.className = 'an-mobile-nav-copy';
      const kicker = document.createElement('span');
      kicker.className = 'an-mobile-nav-kicker';
      kicker.textContent = 'Campus Virtual';
      const title = document.createElement('span');
      title.className = 'an-mobile-nav-title';
      title.textContent = 'Mi Campus';
      copy.append(kicker, title);
      brand.append(logoWrap, copy);

      const icon = document.createElement('span');
      icon.className = 'an-mobile-nav-current-icon';
      icon.setAttribute('aria-hidden', 'true');

      bar.append(toggle, brand, icon);
      document.body.appendChild(bar);
      toggle.addEventListener('click', function () { setOpen(!isOpen()); });
    }

    if (!document.querySelector('.an-mobile-nav-overlay')) {
      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'an-mobile-nav-overlay';
      overlay.setAttribute('aria-label', 'Cerrar menú del Campus');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.addEventListener('click', function () { setOpen(false); });
      document.body.appendChild(overlay);
    }

    if (!document.querySelector('.an-mobile-nav-close')) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'an-mobile-nav-close';
      close.setAttribute('aria-label', 'Cerrar menú del Campus');
      close.innerHTML = '<span aria-hidden="true">×</span>';
      close.addEventListener('click', function () { setOpen(false); });
      document.body.appendChild(close);
    }
  }

  function ensure() {
    buildControls();
    const sidebar = getSidebar();
    if (sidebar && !sidebar.id) sidebar.id = 'an-campus-navigation';
    updateHeader();
    applyAccessibility(isOpen());
  }

  function queueEnsure() {
    if (mutationQueued) return;
    mutationQueued = true;
    window.requestAnimationFrame(function () {
      mutationQueued = false;
      ensure();
    });
  }

  document.addEventListener('click', function (event) {
    if (!media.matches || !isOpen()) return;
    const item = event.target && event.target.closest ? event.target.closest('.sb-item:not([disabled])') : null;
    if (item) window.setTimeout(function () { setOpen(false, { keepFocus: true }); }, 20);
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) setOpen(false);
  });

  function onMediaChange() {
    if (!media.matches) setOpen(false, { keepFocus: true });
    else applyAccessibility(false);
    updateHeader();
  }

  if (typeof media.addEventListener === 'function') media.addEventListener('change', onMediaChange);
  else if (typeof media.addListener === 'function') media.addListener(onMediaChange);

  const observer = new MutationObserver(queueEnsure);
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-role'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ensure, { once: true });
  else ensure();

  window.CS21A111_MOBILE_NAV = {
    version: VERSION,
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    refresh: ensure,
  };
})();
