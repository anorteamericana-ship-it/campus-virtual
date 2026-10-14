// F111 UI-1: emblema institucional y cámara SVG reutilizable.
(function (global) {
  'use strict';
  const e = global.React.createElement;
  global.AcademyMark = function AcademyMark({variant='color',className=''}={}) {
    return e('svg',{
      className:'academy-mark academy-mark--'+variant+(className?' '+className:''),
      viewBox:'0 0 294 246',xmlns:'http://www.w3.org/2000/svg',
      fill:'none',preserveAspectRatio:'xMidYMid meet',
      role:variant==='watermark'?'presentation':'img',
      'aria-label':variant==='watermark'?undefined:'Academia Norteamericana',
      'aria-hidden':variant==='watermark'?true:undefined
    },
      e('path',{className:'academy-a__right',d:'M92 2 L136 2 L223 241 L178 236 Z'}),
      e('path',{className:'academy-a__left',d:'M92 2 L117 70 L49 237 L3 243 Z'}),
      e('path',{className:'academy-a__swoosh',d:'M15.5 144.0 C15.9 144.1 16.4 144.2 18.2 144.8 C20.0 145.5 22.6 146.6 26.3 147.9 C30.0 149.2 34.7 150.7 40.4 152.5 C46.1 154.3 53.8 156.8 60.4 158.7 C67.1 160.6 73.8 162.3 80.4 163.8 C87.1 165.2 93.7 166.4 100.4 167.3 C107.0 168.3 113.6 168.9 120.2 169.4 C126.9 169.8 133.5 170.2 140.1 170.3 C146.7 170.3 153.3 170.1 159.8 169.7 C166.4 169.3 173.0 168.6 179.5 167.6 C186.1 166.6 192.6 165.4 199.2 163.9 C205.7 162.4 212.3 160.5 218.8 158.6 C225.4 156.6 232.3 154.3 238.4 152.1 C244.6 149.8 250.8 147.3 256.0 145.0 C261.1 142.7 265.4 140.3 269.5 138.1 C273.5 135.9 276.3 133.2 280.1 131.9 C284.0 130.5 290.5 130.5 292.6 130.2 L291.2 142.4 C290.3 142.3 288.6 140.8 285.9 141.7 C283.1 142.6 278.8 145.7 274.5 147.9 C270.2 150.0 265.5 152.4 260.0 154.6 C254.5 156.8 248.0 159.1 241.6 161.1 C235.1 163.2 228.0 165.3 221.2 167.0 C214.4 168.8 207.6 170.4 200.8 171.7 C194.0 173.0 187.2 174.1 180.5 174.8 C173.7 175.6 166.9 176.1 160.2 176.3 C153.4 176.5 146.7 176.4 139.9 176.1 C133.2 175.9 126.5 175.4 119.8 174.6 C113.0 173.9 106.3 173.1 99.6 171.9 C92.9 170.7 86.2 169.1 79.6 167.4 C72.9 165.8 66.2 163.8 59.6 161.7 C52.9 159.6 45.3 156.8 39.6 154.7 C34.0 152.6 29.4 150.8 25.7 149.3 C22.1 147.8 19.5 146.5 17.8 145.6 C16.1 144.7 15.9 144.3 15.5 144.0Z'})
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
