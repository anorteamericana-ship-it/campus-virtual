/* F98.4-Z6-CS21A20E · Formato humano de grupos en toda la vista de Ventas.
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
  const DAY_CODES = Object.keys(DAY_LABELS).sort((a, b) => b.length - a.length);

  const GROUP_RE = /\b(?:B1|B2|I1|I2)-([A-Z0-9]{2,7})(?:-[A-Z0-9]+)*-(\d{4})\b/gi;

  function compactHour(hour) {
    const h = Number(hour);
    if (!Number.isFinite(h) || h < 0 || h > 23) return '';
    if (h === 0) return '12am';
    if (h < 12) return `${h}am`;
    if (h === 12) return '12pm';
    return `${h - 12}pm`;
  }

  function parseSchedule(schedule) {
    const raw = String(schedule || '').toUpperCase();
    const known = DAY_CODES.find(code => raw.startsWith(code));
    if (known) return { dayCode: known, hourToken: raw.slice(known.length) };

    const fallback = raw.match(/^([A-Z]{1,3})(\d{1,4})$/);
    return fallback ? { dayCode: fallback[1], hourToken: fallback[2] } : null;
  }

  function timeLabel(dayCode, token) {
    const raw = String(token || '').toUpperCase();
    if (!raw) return '';

    // Formatos históricos conocidos del Campus.
    if (raw === '18' || raw === '69' || raw === '1821') return '6a9pm';
    if (raw === '94') return '9a4pm';
    if (raw === '912') return '9a12pm';
    if (raw === '9') return dayCode === 'SA' ? '9a4pm' : '9a12pm';

    // Rango ya codificado, por ejemplo 6A9 o 18A21.
    const range = raw.match(/^(\d{1,2})A(\d{1,2})$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start <= 23 && end <= 23) {
        return `${compactHour(start).replace(/(am|pm)$/i, '')}a${compactHour(end)}`;
      }
    }

    // Hora de inicio de 24 horas: las clases regulares duran 3 horas.
    if (/^\d{1,2}$/.test(raw)) {
      const start = Number(raw);
      if (start >= 0 && start <= 23) {
        if (dayCode === 'SA') return compactHour(start);
        const end = (start + 3) % 24;
        return `${compactHour(start).replace(/(am|pm)$/i, '')}a${compactHour(end)}`;
      }
    }

    return raw.toLowerCase();
  }

  function formatGroupCode(code) {
    const original = String(code == null ? '' : code);
    GROUP_RE.lastIndex = 0;
    return original.replace(GROUP_RE, function (full, schedule, realCode) {
      const parsed = parseSchedule(schedule);
      if (!parsed) return full;
      const day = DAY_LABELS[parsed.dayCode] || parsed.dayCode;
      const time = timeLabel(parsed.dayCode, parsed.hourToken);
      return `${day}${time ? ` ${time}` : ''} - ${realCode}`;
    });
  }

  function processTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const parent = node.parentElement;
    if (!parent || parent.closest('script,style,textarea')) return;
    const current = node.nodeValue || '';
    GROUP_RE.lastIndex = 0;
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

  function processPage() {
    if (document.body) processElement(document.body);
  }

  window.formatGrupoVentas = formatGroupCode;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processPage, { once: true });
  } else {
    processPage();
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
    if (document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
