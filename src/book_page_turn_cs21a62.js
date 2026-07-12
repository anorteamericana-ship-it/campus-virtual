// F98.4-Z6-CS21A62 · Efecto visual de paso de hoja para el visor de libros
(function () {
  'use strict';

  const VERSION = 'F98.4-Z6-CS21A62';
  const STYLE_ID = 'an-book-page-turn-cs21a62';
  const VIEWER_SELECTOR = 'section[data-screen-label*="CS21A60"][data-screen-label*="Libros"]';
  const LOCK_MS = 760;

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @keyframes anBookTurnNextCS21A62 {
        0% {
          transform: rotateY(0deg) translateZ(1px);
          box-shadow: 7px 8px 22px rgba(0,0,0,.20);
        }
        22% {
          box-shadow: 18px 12px 35px rgba(0,0,0,.34);
        }
        52% {
          box-shadow: 35px 15px 48px rgba(0,0,0,.43);
        }
        100% {
          transform: rotateY(-180deg) translateZ(1px);
          box-shadow: -8px 8px 20px rgba(0,0,0,.18);
        }
      }

      @keyframes anBookTurnPreviousCS21A62 {
        0% {
          transform: rotateY(0deg) translateZ(1px);
          box-shadow: -7px 8px 22px rgba(0,0,0,.20);
        }
        22% {
          box-shadow: -18px 12px 35px rgba(0,0,0,.34);
        }
        52% {
          box-shadow: -35px 15px 48px rgba(0,0,0,.43);
        }
        100% {
          transform: rotateY(180deg) translateZ(1px);
          box-shadow: 8px 8px 20px rgba(0,0,0,.18);
        }
      }

      @keyframes anBookGutterPulseCS21A62 {
        0%, 100% { filter: brightness(1); }
        45% { filter: brightness(.72); }
      }

      .an-book-spread-cs21a62 {
        position: relative !important;
        perspective: 2200px;
        transform-style: preserve-3d;
        isolation: isolate;
      }

      .an-book-spread-cs21a62.an-book-spread-turning-cs21a62 > [aria-hidden="true"] {
        animation: anBookGutterPulseCS21A62 680ms ease both;
      }

      .an-book-turn-sheet-cs21a62 {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 50%;
        z-index: 45;
        pointer-events: none;
        transform-style: preserve-3d;
        will-change: transform, box-shadow;
      }

      .an-book-turn-sheet-cs21a62[data-direction="next"] {
        left: 50%;
        transform-origin: left center;
        animation: anBookTurnNextCS21A62 680ms cubic-bezier(.22,.72,.16,1) both;
      }

      .an-book-turn-sheet-cs21a62[data-direction="previous"] {
        left: 0;
        transform-origin: right center;
        animation: anBookTurnPreviousCS21A62 680ms cubic-bezier(.22,.72,.16,1) both;
      }

      .an-book-turn-face-cs21a62 {
        position: absolute;
        inset: 0;
        overflow: hidden;
        background: #fff;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }

      .an-book-turn-front-cs21a62::after,
      .an-book-turn-back-cs21a62::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .an-book-turn-sheet-cs21a62[data-direction="next"] .an-book-turn-front-cs21a62::after {
        background: linear-gradient(90deg, rgba(0,0,0,.02), rgba(255,255,255,.04) 55%, rgba(0,0,0,.24));
      }

      .an-book-turn-sheet-cs21a62[data-direction="previous"] .an-book-turn-front-cs21a62::after {
        background: linear-gradient(90deg, rgba(0,0,0,.24), rgba(255,255,255,.04) 45%, rgba(0,0,0,.02));
      }

      .an-book-turn-back-cs21a62 {
        transform: rotateY(180deg);
        background: linear-gradient(90deg, #ece6da, #fff 18%, #f7f3eb 82%, #ded5c6);
      }

      .an-book-turn-back-cs21a62::after {
        background: linear-gradient(90deg, rgba(0,0,0,.20), rgba(255,255,255,.14) 46%, rgba(0,0,0,.06));
      }

      .an-book-turn-face-cs21a62 > .an-book-turn-page-clone-cs21a62 {
        width: 100% !important;
        height: 100% !important;
        min-width: 0 !important;
        aspect-ratio: auto !important;
        box-shadow: none !important;
        border-radius: 0 !important;
      }

      .an-book-turn-back-cs21a62 .an-book-turn-page-clone-cs21a62 {
        transform: scaleX(-1);
        filter: saturate(.35) brightness(1.08) contrast(.88);
        opacity: .28;
      }

      .an-book-turn-back-cs21a62 .an-book-turn-page-clone-cs21a62 span {
        display: none !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .an-book-turn-sheet-cs21a62,
        .an-book-spread-cs21a62.an-book-spread-turning-cs21a62 > [aria-hidden="true"] {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function textOf(node) {
    return String(node?.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function sourceFromImage(image) {
    const match = String(image?.getAttribute('alt') || '').match(/Página\s+(\d+)/i);
    return match ? Number(match[1]) : null;
  }

  function findSpread(viewer) {
    const images = Array.from(viewer?.querySelectorAll('img[alt^="Página "]') || []);
    if (!images.length) return null;

    const pageNodes = [];
    images.forEach(image => {
      const page = image.parentElement;
      if (page && !pageNodes.includes(page)) pageNodes.push(page);
    });

    const spread = pageNodes[0]?.parentElement;
    if (!spread) return null;

    const validPages = pageNodes.filter(page => page.parentElement === spread);
    if (!validPages.length) return null;

    return { spread, pageNodes: validPages, images };
  }

  function directionFor(button, viewer, images) {
    const label = textOf(button);
    if (label === 'Siguiente') return 'next';
    if (label === 'Anterior') return 'previous';

    if (!/^U\d{2}$/.test(label)) return null;

    const targetMatch = String(button.getAttribute('title') || '').match(/hoja\s+(\d+)/i);
    const target = targetMatch ? Number(targetMatch[1]) : null;
    const currentSources = images.map(sourceFromImage).filter(Number.isFinite);
    const current = currentSources.length ? Math.max.apply(null, currentSources) : null;

    if (!target || !current || target === current) return null;
    return target > current ? 'next' : 'previous';
  }

  function prepareClone(pageNode, backSide) {
    const clone = pageNode.cloneNode(true);
    clone.classList.add('an-book-turn-page-clone-cs21a62');
    clone.removeAttribute('id');
    clone.setAttribute('aria-hidden', 'true');

    Array.from(clone.querySelectorAll('[id]')).forEach(node => node.removeAttribute('id'));
    Array.from(clone.querySelectorAll('img')).forEach(image => {
      image.loading = 'eager';
      image.decoding = 'sync';
      image.draggable = false;
      image.style.display = 'block';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.objectFit = 'contain';
    });

    if (backSide) {
      Array.from(clone.querySelectorAll('span')).forEach(node => { node.style.display = 'none'; });
    }
    return clone;
  }

  function animateTurn(viewer, direction) {
    if (!direction) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const found = findSpread(viewer);
    if (!found) return;

    const { spread, pageNodes } = found;
    if (spread.dataset.anBookTurnLock === '1') return;

    const pageNode = direction === 'next'
      ? pageNodes[pageNodes.length - 1]
      : pageNodes[0];
    if (!pageNode) return;

    spread.dataset.anBookTurnLock = '1';
    spread.classList.add('an-book-spread-cs21a62', 'an-book-spread-turning-cs21a62');

    const sheet = document.createElement('div');
    sheet.className = 'an-book-turn-sheet-cs21a62';
    sheet.dataset.direction = direction;
    sheet.setAttribute('aria-hidden', 'true');

    const front = document.createElement('div');
    front.className = 'an-book-turn-face-cs21a62 an-book-turn-front-cs21a62';
    front.appendChild(prepareClone(pageNode, false));

    const back = document.createElement('div');
    back.className = 'an-book-turn-face-cs21a62 an-book-turn-back-cs21a62';
    back.appendChild(prepareClone(pageNode, true));

    sheet.appendChild(front);
    sheet.appendChild(back);
    spread.appendChild(sheet);

    let removed = false;
    const cleanup = () => {
      if (removed) return;
      removed = true;
      sheet.remove();
      spread.classList.remove('an-book-spread-turning-cs21a62');
      delete spread.dataset.anBookTurnLock;
    };

    sheet.addEventListener('animationend', cleanup, { once: true });
    window.setTimeout(cleanup, LOCK_MS);
  }

  function onClickCapture(event) {
    const button = event.target?.closest?.('button');
    if (!button || button.disabled) return;

    const viewer = button.closest(VIEWER_SELECTOR);
    if (!viewer) return;

    const found = findSpread(viewer);
    if (!found) return;

    const direction = directionFor(button, viewer, found.images);
    animateTurn(viewer, direction);
  }

  installStyles();
  document.addEventListener('click', onClickCapture, true);
  window.__AN_BOOK_PAGE_TURN_VERSION__ = VERSION;
})();
