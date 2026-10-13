// F111 UI-1: emblema institucional y cámara SVG reutilizable.
(function (global) {
  'use strict';
  const e = global.React.createElement;
  global.AcademyMark = function AcademyMark({variant='color',className=''}={}) {
    return e('svg',{
      className:'academy-mark academy-mark--'+variant+(className?' '+className:''),
      viewBox:'0 0 291 246',xmlns:'http://www.w3.org/2000/svg',
      fill:'none',preserveAspectRatio:'xMidYMid meet',
      role:variant==='watermark'?'presentation':'img',
      'aria-label':variant==='watermark'?undefined:'Academia Norteamericana',
      'aria-hidden':variant==='watermark'?true:undefined
    },
      e('path',{className:'academy-mark__left',d:'M91 1H138L51 239 1 245Z'}),
      e('path',{className:'academy-mark__right',d:'M91 1H138L229 245 178 239Z'}),
      e('path',{className:'academy-mark__curve',d:'M14 142C86 177 205 195 285 134',
        strokeWidth:6,strokeLinecap:'round'})
    );
  };
  global.AcademyCameraIcon=function AcademyCameraIcon(){
    return e('svg',{viewBox:'0 0 24 24',width:20,height:20,fill:'none',
      stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',
      strokeLinejoin:'round','aria-hidden':true},
      e('path',{d:'M14.5 4h-5L7.7 6.2H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.2a2 2 0 0 0-2-2h-3.7L14.5 4Z'}),
      e('circle',{cx:12,cy:13,r:3.5})
    );
  };
  global.AcademyMaskCedula = function AcademyMaskCedula(raw) {
    const digits=String(raw==null?'':raw).replace(/\D/g,'');
    return digits ? '•••-•••-'+digits.slice(-4) : 'Pendiente';
  };
  // Reutilizado por estudiante y docente: única composición de portada.
  global.AcademyIdentityHeader = function AcademyIdentityHeader({kind='student',photo,details}) {
    return e('div',{className:'academy-id-header academy-id-'+kind},
      e('div',{className:'academy-id-brand'},
        e('span',{className:'academy-id-brand-full'},'ACADEMIA NORTEAMERICANA · MI CAMPUS'),
        e('span',{className:'academy-id-brand-mobile'},'MI CAMPUS')),
      e('div',{className:'academy-id-main'},photo,details),
      e(global.AcademyMark,{variant:'watermark',className:'academy-id-mark'})
    );
  };
})(window);
