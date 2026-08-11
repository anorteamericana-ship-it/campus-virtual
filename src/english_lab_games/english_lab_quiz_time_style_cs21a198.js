// CS21A198 · carga aditiva de estilos Quiz Time.
(function installQuizTimeStyleCS21A198(global){
  'use strict';
  if(!global || !global.document || global.__ENGLISH_LAB_QUIZ_STYLE_CS21A198__) return;
  function add(id,href){
    if(global.document.getElementById(id)) return;
    var link=global.document.createElement('link');
    link.id=id; link.rel='stylesheet'; link.href=href;
    global.document.head.appendChild(link);
  }
  add('elq198-style','styles/english_lab_quiz_time_cs21a198.css?v=CS21A198');
  add('elq198-gateway-style','styles/english_lab_quiz_time_gateway_cs21a198.css?v=CS21A198');
  global.__ENGLISH_LAB_QUIZ_STYLE_CS21A198__=Object.freeze({version:'CS21A198',installed:true});
})(window);
