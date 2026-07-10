/* F98.4-Z6-CS21A20D · Formato humano de grupos en toda la vista de Ventas.
   SOLO cambia texto visible. Los value, payloads y códigos enviados al backend
   conservan siempre el código técnico completo, por ejemplo B1-LM18-C3-0726. */
(function () {
  'use strict';

  const DAY_LABELS = {
    LM: 'LUN/MIE',
    KJ: 'MAR/JUE',
    MJ: 'MAR/JUE',
    LJ: 'LUN/JUE',
    L4: 'LUN A JUE',
    SA: 'SAB',
    VI: 'VIE',
    LU: 'LUN',
    MA: 'MAR',
    MI: 'MIE',
    JU: 'JUE',
  };

  const GROUP_RE = /\b(?:B1|B2|I1|I2)-([A-Z]{1,3}\d{1,4})(?:-[A-Z0-9]+)*-(\d{4})\b/gi;

  function compactHour(hour) {
    const h = Number(hour);
    if (!Number.isFinite(h) || h < 0 || h > 23) return '';
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  }

  function timeLabel(dayCode, token) {
    const raw = String(token || '').toUpperCase();

    // Formatos históricos conocidos del Campus.
    if (raw === '18' || raw === '69' || raw === '1821') return '6a9pm';
    if (raw === '94') return '9a4pm';
    if (raw === '912') return '9a12pm';
    if (raw === '9') return dayCode === 'SA' ? '9a4pm' : '9a12pm';

    // Hora de inicio de 24 horas: las clases regulares duran 3 horas.
    if (/^\d{1,2}$/.test(raw)) {
      const start = Number(raw);
      if (start >= 0 && start <= 23) {
        if (dayCode === 'SA') return compactHour(start);
        const end = (start + 3) % 24;
        return `${compactHour(start).replace(/(am|pm)$/i, '')}a${compactHour(end)}`;
      }
    }

    // Rango ya codificado, por ejemplo 6A9 o 18A21.
    const range = raw.match(/^(\d{1,2})A(\d{1,2})$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start <= 23 && end <= 23) {
        return `${compactHour(start).replace(/(am|pm)$/i, '')}a${compactHour(end)}`;
      }
    }

    return raw ? raw.toLowerCase() : '';
  }

  function formatGroupCode(code) {
    const original = String(code == null ? '' : code);
    return original.replace(GROUP_RE, function (full, schedule, realCode) {
      const parsed = String(schedule).match(/^([A-Z]{1,3})(\d{1,4})$/i);
      if (!parsed) return full;
      const dayCode = parsed[1].toUpperCase();
      const hourToken = parsed[2];
      const day = DAY_LABELS[dayCode] || dayCode;
      const time = timeLabel(dayCode, hourToken);
      return `${day}${time ? ` ${time}` : ''} - ${realCode}`;
    });
  }

  function processTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea')) return;
    const current = node.nodeValue || '';
    if (!GROUP_RE.test(current)) {
      GROUP_RE.lastIndex = 0;
      return;
    }
    GROUP_RE.lastIndex = 0;
    const next = formatGroupCode(current);
    if (next !== current) node.nodeValue = next;
  }

  function processElement(el) {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    if (el.matches('script,style,textarea')) return;

    // El texto de OPTION cambia; su value conserva el código técnico real.
    if (el.matches('option')) {
      const current = el.textContent || '';
      const next = formatGroupCode(current);
      if (next !== current) el.textContent = next;
    }

    ['title', 'aria-label'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      const current = el.getAttribute(attr) || '';
      const next = formatGroupCode(current);
      if (next !== current) el.setAttribute(attr, next);
    });

    Array.from(el.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) processTextNode(child);
      else if (child.nodeType === Node.ELEMENT_NODE) processElement(child);
    });
  }

  function processRoot() {
    const root = document.getElementById('root') || document.body;
    processElement(root);
  }

  window.formatGrupoVentas = formatGroupCode;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processRoot, { once: true });
  } else {
    processRoot();
  }

  const observer = new MutationObserver(records => {
    records.forEach(record => {
      if (record.type === 'characterData') processTextNode(record.target);
      record.addedNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
        else if (node.nodeType === Node.ELEMENT_NODE) processElement(node);
      });
    });
  });

  const observe = () => {
    const root = document.getElementById('root') || document.body;
    observer.observe(root, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
