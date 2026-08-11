// CS21A200 · carga explícita de estilos Word Search y capa Live.
(function installWordSearchStylesCS21A200(global){
  'use strict';
  if(!global||!global.document)return;
  const styles=[
    ['ws199-style','styles/word_search_cs21a199.css?v=CS21A199R2'],
    ['ws200-live-style','styles/english_lab_word_search_live_cs21a200.css?v=CS21A200'],
  ];
  styles.forEach(([id,href])=>{if(global.document.getElementById(id))return;const link=global.document.createElement('link');link.id=id;link.rel='stylesheet';link.href=href;global.document.head.appendChild(link);});
  global.EnglishLabWordSearchStyleCS21A200=Object.freeze({VERSION:'CS21A200',loaded:true});
})(window);
