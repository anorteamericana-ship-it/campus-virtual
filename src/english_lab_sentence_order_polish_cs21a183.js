/* global window, document, MutationObserver */
// F98.4-Z6-CS21A183-POLISH · Corrección visual mínima para Sentence Order.
// Normaliza la clase de la tarjeta final sin alterar estado, solicitudes ni respuestas.
(function installSentenceOrderPolishCS21A183(global, doc) {
  'use strict';

  if (!global || !doc || global.__ENGLISH_LAB_SENTENCE_ORDER_POLISH_CS21A183__) return;
  var scheduled = false;

  function run() {
    scheduled = false;
    Array.prototype.forEach.call(doc.querySelectorAll('.elso183-shell .elso-card'), function (node) {
      node.classList.add('elso183-card');
      node.setAttribute('data-cs21a183-polished', 'true');
    });
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    if (typeof global.requestAnimationFrame === 'function') global.requestAnimationFrame(run);
    else global.setTimeout(run, 0);
  }

  if (typeof MutationObserver === 'function') {
    new MutationObserver(schedule).observe(doc.documentElement, {subtree:true,childList:true});
  }
  global.addEventListener('hashchange', schedule);
  global.__ENGLISH_LAB_SENTENCE_ORDER_POLISH_CS21A183__ = {
    version:'F98.4-Z6-CS21A183-POLISH',
    run:run
  };
  schedule();
})(window, document);
