// F98.4-Z6-CS21A114 · Carga anticipada de la sustitución segura del importador BCR.
(function(){
  'use strict';
  const src='src/importador_banco_integridad_cs21a114.jsx?v=F98.4Z6CS21A114';
  if(window.CS21A114_IMPORTADOR_LOADER)return;
  window.CS21A114_IMPORTADOR_LOADER=true;
  fetch(src,{cache:'no-cache'})
    .then(function(r){if(!r.ok)throw new Error('No se pudo cargar '+src);return r.text();})
    .then(function(code){
      if(!window.Babel||typeof window.Babel.transform!=='function')throw new Error('Babel no disponible para CS21A114.');
      const js=window.Babel.transform(code,{presets:['react'],plugins:['transform-block-scoping']}).code;
      const script=document.createElement('script');
      script.type='text/javascript';
      script.text=js+'\n//# sourceURL='+src;
      document.head.appendChild(script);
    })
    .catch(function(error){console.error('CS21A114 importador',error);});
})();
