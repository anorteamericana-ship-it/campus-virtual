// F111 UI-1 · Recorte cuadrado compartido estudiante/docente. Sin dependencias.
(function (global) {
  'use strict';
  const React = global.React;
  const h = React.createElement;
  const SIZE = 320;
  function scaleFor(bitmap, zoom) {
    return Math.max(SIZE / bitmap.width, SIZE / bitmap.height) * zoom;
  }
  function limitOffsets(bitmap, zoom, offset) {
    if (!bitmap) return {x:0,y:0};
    const s = scaleFor(bitmap, zoom);
    const mx = Math.max(0, (bitmap.width * s - SIZE) / 2);
    const my = Math.max(0, (bitmap.height * s - SIZE) / 2);
    return {x:Math.max(-mx,Math.min(mx,offset.x)),y:Math.max(-my,Math.min(my,offset.y))};
  }
  function draw(bitmap, canvas, zoom, offset, size) {
    if (!bitmap || !canvas) return;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el recorte.');
    const s = scaleFor(bitmap, zoom) * (size / SIZE);
    const off = limitOffsets(bitmap, zoom, offset);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,size,size);
    ctx.drawImage(bitmap,
      size/2 - bitmap.width*s/2 + off.x*(size/SIZE),
      size/2 - bitmap.height*s/2 + off.y*(size/SIZE),
      bitmap.width*s,bitmap.height*s);
  }
  global.AcademyPhotoCrop = function AcademyPhotoCrop({file,onAccept,onCancel}) {
    const preview = React.useRef(null);
    const cancelButton = React.useRef(null);
    const imageRef = React.useRef(null);
    const dragRef = React.useRef(null);
    const [bitmap,setBitmap] = React.useState(null);
    const [zoom,setZoom] = React.useState(1);
    const [offset,setOffset] = React.useState({x:0,y:0});
    const [busy,setBusy] = React.useState(false);
    const [error,setError] = React.useState('');
    React.useEffect(() => {
      let cancelled = false;
      let image = null;
      cancelButton.current?.focus();
      async function open() {
        try {
          if (typeof createImageBitmap === 'function') {
            image = await createImageBitmap(file,{imageOrientation:'from-image'});
          } else {
            image = await new Promise((resolve,reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error('No se pudo abrir la foto.'));
              reader.onload = () => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Formato no soportado.'));
                img.src = String(reader.result||'');
              };
              reader.readAsDataURL(file);
            });
          }
          if (cancelled) {image.close?.();return;}
          imageRef.current = image;
          setBitmap(image);
        } catch (_) { if(!cancelled)setError('No se pudo leer la fotografía.'); }
      }
      open();
      return () => {cancelled=true;image?.close?.();imageRef.current=null;};
    },[file]);
    React.useEffect(() => {
      if(bitmap && preview.current)draw(bitmap,preview.current,zoom,offset,SIZE);
    },[bitmap,zoom,offset]);
    function changeOffset(dx,dy){
      if (!bitmap) return;
      setOffset(prev => limitOffsets(bitmap,zoom,{x:prev.x+dx,y:prev.y+dy}));
    }
    function startDrag(event) {
      if (!bitmap || busy)return;
      dragRef.current = {id:event.pointerId,x:event.clientX,y:event.clientY};
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    function moveDrag(event) {
      const prev=dragRef.current;
      if(!prev || prev.id!==event.pointerId)return;
      const rect=event.currentTarget.getBoundingClientRect();
      changeOffset((event.clientX-prev.x)*SIZE/rect.width,(event.clientY-prev.y)*SIZE/rect.height);
      dragRef.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    }
    function accept() {
      if(!bitmap || busy)return;
      setBusy(true);
      try {
        const output=document.createElement('canvas');
        draw(bitmap,output,zoom,offset,640);
        const dataUrl=output.toDataURL('image/jpeg',0.85);
        const base64=dataUrl.split(',')[1];
        if(!base64)throw Error('empty');
        onAccept({dataUrl,base64,mime:'image/jpeg',nombre:'foto_perfil_640.jpg',width:640,height:640});
      }catch(_){setError('No se pudo preparar el recorte.');setBusy(false);}
    }
    return h('div',{className:'an-crop-backdrop',role:'presentation',onMouseDown:event=>{
      if(event.target===event.currentTarget)onCancel();
    }},
      h('section',{className:'an-crop-dialog',role:'dialog','aria-modal':true,'aria-label':'Recortar fotografía',onKeyDown:event=>{
        if(event.key==='Escape'){event.preventDefault();onCancel();}
      }},
        h('h2',null,'Acomodar fotografía'),
        h('p',{id:'an-crop-help'},'Arrastrá para centrar la foto. Usá el zoom o las flechas del teclado.'),
        h('canvas',{
          ref:preview,width:SIZE,height:SIZE,tabIndex:0,
          role:'img','aria-label':'Vista previa del recorte cuadrado',
          'aria-describedby':'an-crop-help',
          onPointerDown:startDrag,onPointerMove:moveDrag,
          onPointerUp:()=>{dragRef.current=null;},
          onPointerCancel:()=>{dragRef.current=null;},
          onKeyDown:event=>{
            const m={ArrowUp:[0,-8],ArrowDown:[0,8],ArrowLeft:[-8,0],ArrowRight:[8,0]};
            if(m[event.key]){event.preventDefault();changeOffset(...m[event.key]);}
          }
        }),
        h('label',{htmlFor:'an-crop-zoom'},'Zoom: '+Math.round(zoom*100)+' %'),
        h('input',{type:'range',id:'an-crop-zoom',min:1,max:3,step:0.05,value:zoom,
          onChange:event=>{const z=Number(event.target.value);setZoom(z);setOffset(prev=>limitOffsets(bitmap,z,prev));}}),
        error?h('p',{role:'alert',className:'an-crop-error'},error):null,
        h('div',{className:'an-crop-actions'},
          h('button',{ref:cancelButton,type:'button',onClick:onCancel},'Cancelar'),
          h('button',{type:'button',disabled:!bitmap||busy,onClick:accept},busy?'Preparando…':'Aceptar recorte')
        )
      )
    );
  };
  global.__F111_CROP_TEST__={draw,scaleFor,limitOffsets};
})(window);
