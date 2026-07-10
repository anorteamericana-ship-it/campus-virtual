/* F98.4-Z6-CS21A21 · Orden visual del selector Grupo en Calendario académico.
   No modifica datos, cronogramas ni llamadas al backend. Solo reordena las
   opciones visibles del selector administrativo y permite volver al orden
   original del calendario. */
(function () {
  'use strict';

  const STORAGE_KEY = 'an_calendario_orden_grupos';
  const MODE_CHRONO = 'cronologico';
  const MODE_NUMBER = 'numero';
  const PATCH_ATTR = 'data-an-cg-sort-patched';
  const BUTTON_CLASS = 'an-cg-sort-button';
  let observer = null;
  let scheduled = false;

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) === MODE_NUMBER ? MODE_NUMBER : MODE_CHRONO;
    } catch (_) {
      return MODE_CHRONO;
    }
  }

  function setMode(mode) {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch (_) {}
  }

  // El código final NNAA significa: consecutivo NN + año AA.
  // Ej.: 0125 = grupo 01 del 2025; 0226 = grupo 02 del 2026.
  function numberKey(value) {
    const raw = String(value || '').trim().toUpperCase();
    const match = raw.match(/(\d{2})(\d{2})$/);
    if (!match) return null;
    const sequence = Number(match[1]);
    const year = Number(match[2]);
    if (!Number.isFinite(sequence) || !Number.isFinite(year)) return null;
    return { year, sequence };
  }

  function optionValues(select) {
    return Array.from(select.options || []).map(option => String(option.value || ''));
  }

  function sameValueSet(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const aa = [...a].sort();
    const bb = [...b].sort();
    return aa.every((value, index) => value === bb[index]);
  }

  function rememberOriginalOrder(select) {
    const current = optionValues(select);
    if (!Array.isArray(select.__anCgOriginalOrder) || !sameValueSet(select.__anCgOriginalOrder, current)) {
      select.__anCgOriginalOrder = current;
    }
  }

  function isSpecialOption(option) {
    const value = String(option && option.value || '');
    return !value || value === '__TODOS__' || !numberKey(value);
  }

  function sortByNumber(options) {
    const special = options.filter(isSpecialOption);
    const groups = options.filter(option => !isSpecialOption(option));

    groups.sort((a, b) => {
      const ka = numberKey(a.value);
      const kb = numberKey(b.value);
      if (ka.year !== kb.year) return ka.year - kb.year;
      if (ka.sequence !== kb.sequence) return ka.sequence - kb.sequence;
      return String(a.value || '').localeCompare(String(b.value || ''), 'es', { numeric:true, sensitivity:'base' });
    });

    return [...special, ...groups];
  }

  function restoreOriginal(options, originalOrder) {
    const position = new Map((originalOrder || []).map((value, index) => [String(value), index]));
    return [...options].sort((a, b) => {
      const pa = position.has(String(a.value)) ? position.get(String(a.value)) : Number.MAX_SAFE_INTEGER;
      const pb = position.has(String(b.value)) ? position.get(String(b.value)) : Number.MAX_SAFE_INTEGER;
      return pa - pb;
    });
  }

  function reorderSelect(select, mode) {
    if (!select || !select.options || !select.options.length) return;
    rememberOriginalOrder(select);

    const selectedValue = select.value;
    const options = Array.from(select.options);
    const ordered = mode === MODE_NUMBER
      ? sortByNumber(options)
      : restoreOriginal(options, select.__anCgOriginalOrder);

    // Desconectar mientras movemos nodos para evitar ciclos del observer.
    if (observer) observer.disconnect();
    ordered.forEach(option => select.appendChild(option));
    select.value = selectedValue;
    startObserver();
  }

  function updateButton(button, mode) {
    const numberMode = mode === MODE_NUMBER;
    button.textContent = numberMode ? 'Nº grupo ↑' : 'Ordenar por Nº';
    button.setAttribute('aria-pressed', numberMode ? 'true' : 'false');
    button.title = numberMode
      ? 'Orden actual: número de grupo, del más viejo al más nuevo. Presioná para volver al orden cronológico.'
      : 'Ordenar por número de grupo, del más viejo al más nuevo.';
    button.classList.toggle('is-active', numberMode);
  }

  function findGroupLabel(select) {
    const parent = select && select.parentElement;
    if (!parent) return null;
    return Array.from(parent.children).find(element => {
      if (element === select || element.nodeType !== 1) return false;
      return String(element.textContent || '').trim().toLowerCase() === 'grupo';
    }) || null;
  }

  function isCalendarGroupSelect(select) {
    if (!select || !select.closest('[data-screen-label="Cronograma de grupo"]')) return false;
    const label = findGroupLabel(select);
    if (!label) return false;
    return Array.from(select.options || []).some(option => {
      const value = String(option.value || '');
      return value === '__TODOS__' || !!numberKey(value);
    });
  }

  function injectStyles() {
    if (document.getElementById('an-cg-sort-style')) return;
    const style = document.createElement('style');
    style.id = 'an-cg-sort-style';
    style.textContent = `
      .an-cg-sort-label-row {
        display:flex !important;
        align-items:center !important;
        justify-content:space-between !important;
        gap:10px !important;
      }
      .${BUTTON_CLASS} {
        appearance:none;
        border:1px solid var(--line, #ded8ce);
        background:var(--surface, #fff);
        color:var(--an-navy, #002f6c);
        border-radius:999px;
        padding:4px 9px;
        font-family:inherit;
        font-size:9px;
        font-weight:800;
        line-height:1.2;
        letter-spacing:.03em;
        text-transform:none;
        cursor:pointer;
        white-space:nowrap;
        transition:background .15s ease, color .15s ease, border-color .15s ease;
      }
      .${BUTTON_CLASS}:hover {
        border-color:var(--an-navy, #002f6c);
        background:#eef4ff;
      }
      .${BUTTON_CLASS}.is-active {
        background:var(--an-navy, #002f6c);
        border-color:var(--an-navy, #002f6c);
        color:#fff;
      }
      .${BUTTON_CLASS}:focus-visible {
        outline:3px solid color-mix(in srgb, var(--an-navy, #002f6c) 24%, transparent);
        outline-offset:2px;
      }
    `;
    document.head.appendChild(style);
  }

  function patchSelect(select) {
    if (!isCalendarGroupSelect(select)) return;
    const label = findGroupLabel(select);
    if (!label) return;

    rememberOriginalOrder(select);
    label.classList.add('an-cg-sort-label-row');

    let button = label.querySelector(`.${BUTTON_CLASS}`);
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = BUTTON_CLASS;
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        const nextMode = getMode() === MODE_NUMBER ? MODE_CHRONO : MODE_NUMBER;
        setMode(nextMode);
        document.querySelectorAll('[data-screen-label="Cronograma de grupo"] select').forEach(candidate => {
          if (!isCalendarGroupSelect(candidate)) return;
          reorderSelect(candidate, nextMode);
          const candidateLabel = findGroupLabel(candidate);
          const candidateButton = candidateLabel && candidateLabel.querySelector(`.${BUTTON_CLASS}`);
          if (candidateButton) updateButton(candidateButton, nextMode);
        });
      });
      label.appendChild(button);
    }

    select.setAttribute(PATCH_ATTR, 'true');
    const mode = getMode();
    updateButton(button, mode);
    reorderSelect(select, mode);
  }

  function patchPage() {
    scheduled = false;
    injectStyles();
    document.querySelectorAll('[data-screen-label="Cronograma de grupo"] select').forEach(patchSelect);
  }

  function schedulePatch() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(patchPage);
  }

  function startObserver() {
    if (!document.body) return;
    if (!observer) observer = new MutationObserver(schedulePatch);
    observer.disconnect();
    observer.observe(document.body, { childList:true, subtree:true });
  }

  function init() {
    injectStyles();
    patchPage();
    startObserver();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();

  // Expuesto únicamente para QA manual desde consola.
  window.__AN_CALENDARIO_ORDEN_GRUPOS__ = {
    numberKey,
    apply: patchPage,
    setMode(mode) {
      const safeMode = mode === MODE_NUMBER ? MODE_NUMBER : MODE_CHRONO;
      setMode(safeMode);
      patchPage();
    },
  };
})();
