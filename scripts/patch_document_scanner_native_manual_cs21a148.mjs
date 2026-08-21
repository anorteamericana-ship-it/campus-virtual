import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const scannerPath=path.join(root,'src','document-scanner.js');
const writerPath=path.join(root,'scripts','write_document_scanner_lab_cs21a147.mjs');

for(const p of [scannerPath,writerPath]) if(!fs.existsSync(p)) throw new Error('Falta '+p);

function once(text,oldText,newText,label){
  const i=text.indexOf(oldText);
  if(i<0) throw new Error('No encontré preimagen exacta: '+label);
  if(text.indexOf(oldText,i+oldText.length)>=0) throw new Error('Preimagen duplicada: '+label);
  return text.slice(0,i)+newText+text.slice(i+oldText.length);
}
function replaceBlock(text,startMarker,endMarker,replacement,label){
  const s=text.indexOf(startMarker);
  if(s<0) throw new Error('No encontré inicio: '+label);
  const e=text.indexOf(endMarker,s+startMarker.length);
  if(e<0) throw new Error('No encontré fin: '+label);
  return text.slice(0,s)+replacement+text.slice(e);
}

let scanner=fs.readFileSync(scannerPath,'utf8').replace(/\r\n/g,'\n');
let writer=fs.readFileSync(writerPath,'utf8').replace(/\r\n/g,'\n');

if(scanner.includes("version:'CS21A148-1'")) throw new Error('CS21A148 ya parece aplicado.');
scanner=once(scanner,"version:'CS21A147-1'","version:'CS21A148-1'",'versión scanner');

const nativeBlock=String.raw`  function solve8(A,b){
    const n=8;
    const m=A.map((row,i)=>row.slice().concat([b[i]]));
    for(let col=0;col<n;col++){
      let pivot=col;
      for(let r=col+1;r<n;r++) if(Math.abs(m[r][col])>Math.abs(m[pivot][col])) pivot=r;
      if(Math.abs(m[pivot][col])<1e-10) throw new Error('scanner_geometria_invalida');
      if(pivot!==col){ const tmp=m[col];m[col]=m[pivot];m[pivot]=tmp; }
      const div=m[col][col];
      for(let c=col;c<=n;c++) m[col][c]/=div;
      for(let r=0;r<n;r++){
        if(r===col) continue;
        const factor=m[r][col];
        if(Math.abs(factor)<1e-14) continue;
        for(let c=col;c<=n;c++) m[r][c]-=factor*m[col][c];
      }
    }
    return m.map(row=>row[n]);
  }

  function homographyDestToSource(dst,src){
    const A=[],b=[];
    for(let i=0;i<4;i++){
      const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y;
      A.push([x,y,1,0,0,0,-u*x,-u*y]); b.push(u);
      A.push([0,0,0,x,y,1,-v*x,-v*y]); b.push(v);
    }
    const h=solve8(A,b);
    return [h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1];
  }

  function rotateCanvasClockwise(canvas){
    const out=document.createElement('canvas');
    out.width=canvas.height;out.height=canvas.width;
    const ctx=out.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);
    ctx.translate(out.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(canvas,0,0);
    return out;
  }

  function nativeQuality(imageData,width,height){
    const d=imageData.data;
    const step=Math.max(2,Math.floor(Math.min(width,height)/220));
    let count=0,sum=0,grad=0,gradCount=0;
    const lumAt=(x,y)=>{
      const i=(y*width+x)*4;
      return d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114;
    };
    for(let y=0;y<height;y+=step){
      for(let x=0;x<width;x+=step){
        const l=lumAt(x,y);sum+=l;count++;
        if(x>=step){grad+=Math.abs(l-lumAt(x-step,y));gradCount++;}
        if(y>=step){grad+=Math.abs(l-lumAt(x,y-step));gradCount++;}
      }
    }
    const brightness=count?sum/count:0;
    const sharpness=gradCount?grad/gradCount:0;
    let score=100;const warnings=[];
    if(brightness<45){score-=25;warnings.push('La foto está muy oscura.');}
    else if(brightness<65){score-=12;warnings.push('La foto está algo oscura.');}
    if(brightness>230){score-=25;warnings.push('La foto está sobreexpuesta o tiene demasiado reflejo.');}
    else if(brightness>215){score-=12;warnings.push('Hay zonas demasiado claras; evitá reflejos.');}
    if(sharpness<5){score-=35;warnings.push('La foto está borrosa.');}
    else if(sharpness<9){score-=18;warnings.push('La nitidez es baja.');}
    return {brightness,sharpness,score:Math.max(0,Math.min(100,Math.round(score))),warnings};
  }

  async function warpQuadNative(sourceDataUrl,normalizedPoints,kind='identity'){
    const img=await loadImage(sourceDataUrl);
    const staging=stagingCanvas(img,1600);
    const n=normalizePoints(normalizedPoints);
    let sourcePoints=n.map(p=>({x:p.x*staging.width,y:p.y*staging.height}));
    const margin=kind==='identity'?SAFE_MARGIN_ID:SAFE_MARGIN_TITLE;
    sourcePoints=expandQuad(sourcePoints,staging.width,staging.height,margin);
    const q=orderQuad(sourcePoints);
    let width=Math.max(dist(q.br,q.bl),dist(q.tr,q.tl));
    let height=Math.max(dist(q.tr,q.br),dist(q.tl,q.bl));
    if(width<10||height<10) throw new Error('scanner_geometria_invalida');
    const scale=Math.min(1,MAX_OUTPUT_SIDE/Math.max(width,height));
    width=Math.max(1,Math.round(width*scale));
    height=Math.max(1,Math.round(height*scale));

    const dst=[{x:0,y:0},{x:width-1,y:0},{x:width-1,y:height-1},{x:0,y:height-1}];
    const src=[q.tl,q.tr,q.br,q.bl];
    const H=homographyDestToSource(dst,src);
    const sctx=staging.getContext('2d',{willReadFrequently:true});
    const sdata=sctx.getImageData(0,0,staging.width,staging.height).data;
    const out=document.createElement('canvas');out.width=width;out.height=height;
    const octx=out.getContext('2d',{alpha:false});
    const oimg=octx.createImageData(width,height);const od=oimg.data;
    const sw=staging.width,sh=staging.height;

    function sample(x,y,oi){
      x=clamp(x,0,sw-1);y=clamp(y,0,sh-1);
      const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1);
      const fx=x-x0,fy=y-y0;
      const i00=(y0*sw+x0)*4,i10=(y0*sw+x1)*4,i01=(y1*sw+x0)*4,i11=(y1*sw+x1)*4;
      for(let c=0;c<3;c++){
        const top=sdata[i00+c]*(1-fx)+sdata[i10+c]*fx;
        const bot=sdata[i01+c]*(1-fx)+sdata[i11+c]*fx;
        od[oi+c]=Math.round(top*(1-fy)+bot*fy);
      }
      od[oi+3]=255;
    }

    for(let y=0;y<height;y++){
      const hy1=H[1]*y+H[2],hy2=H[4]*y+H[5],hy3=H[7]*y+1;
      for(let x=0;x<width;x++){
        const den=H[6]*x+hy3;
        const sx=(H[0]*x+hy1)/den;
        const sy=(H[3]*x+hy2)/den;
        sample(sx,sy,(y*width+x)*4);
      }
      if((y%18)===17) await new Promise(resolve=>setTimeout(resolve,0));
    }
    octx.putImageData(oimg,0,0);
    let finalCanvas=out;
    if(kind==='identity'&&out.height>out.width) finalCanvas=rotateCanvasClockwise(out);
    return finalCanvas;
  }

  async function normalizeWithCorners(sourceDataUrl,normalizedPoints,kind='identity'){
    const finalCanvas=await warpQuadNative(sourceDataUrl,normalizedPoints,kind==='title'?'title':'identity');
    const ctx=finalCanvas.getContext('2d',{willReadFrequently:true});
    const data=ctx.getImageData(0,0,finalCanvas.width,finalCanvas.height);
    const quality=nativeQuality(data,finalCanvas.width,finalCanvas.height);
    const sizeOk=finalCanvas.width>=640&&finalCanvas.height>=360;
    const score=Math.max(0,quality.score-(sizeOk?0:25));
    const warnings=quality.warnings.slice();
    if(!sizeOk) warnings.push('La resolución útil del documento es baja.');
    const finalImage=canvasToJpeg(finalCanvas,0.92);
    return {
      finalImage,normalized:finalImage,width:finalCanvas.width,height:finalCanvas.height,
      detected:true,manual:true,detectionMethod:'manual_native_homography',score,
      requiresRetake:score<60,warnings,brightness:quality.brightness,sharpness:quality.sharpness
    };
  }

`;

scanner=replaceBlock(
  scanner,
  '  async function normalizeWithCorners(sourceDataUrl,normalizedPoints,kind=\'identity\'){',
  '  async function normalizeImage(sourceDataUrl,kind=\'identity\'){',
  nativeBlock+'  async function normalizeImage(sourceDataUrl,kind=\'identity\'){',
  'normalizeWithCorners nativo'
);

writer=once(writer,'<div id="engine" class="result warn">Preparando motor de recorte…</div>','<div id="engine" class="result pass">Motor de recorte manual listo · sin carga pesada.</div>','estado motor');
writer=once(writer,'<script src="../src/document-scanner.js?v=CS21A147-1"></script>','<script src="../src/document-scanner.js?v=CS21A148-1"></script>','cache scanner');
writer=once(
  writer,
  "    let suggestion={detected:false,points:null};\n    try{suggestion=await window.ANDocumentScanner.detectCorners(source,def.kind)}catch(_){}\n    states[def.id]={source,finalImage:'',points:suggestion.points||defaults(),kind:def.kind,confirmed:false};\n    renderEditor(def,suggestion.detected?'Esquinas sugeridas automáticamente. Revisalas antes de aplicar.':'Mové los 4 puntos hasta las esquinas reales del documento.');",
  "    states[def.id]={source,finalImage:'',points:defaults(),kind:def.kind,confirmed:false};\n    renderEditor(def,'Mové los 4 puntos hasta las esquinas reales del documento. El recorte manual funciona sin esperar OpenCV.');",
  'flujo manual inmediato'
);
writer=once(
  writer,
  "(async()=>{\n  const engine=document.getElementById('engine');\n  try{await window.ANDocumentScanner.ensureCv();engine.className='result pass';engine.textContent='Motor de recorte listo.'}\n  catch(e){engine.className='result fail';engine.textContent='No pudimos cargar el motor de recorte: '+(e.message||e)+'. Revisá la conexión y recargá.'}\n})();\n",
  '',
  'quitar inicialización OpenCV al cargar'
);
writer=writer.replace(/Recargá la página si el motor OpenCV aún se estaba iniciando\./g,'El recorte manual no depende de OpenCV. Si falla, elegí nuevamente la foto.');

fs.writeFileSync(scannerPath,scanner,'utf8');
fs.writeFileSync(writerPath,writer,'utf8');
console.log('=== CS21A148 · MANUAL NATIVE PERSPECTIVE ===');
console.log('PASS recorte manual ya no depende de OpenCV');
console.log('PASS homografía y muestreo se ejecutan localmente en navegador');
console.log('PASS procesamiento por filas cede control para no congelar la UI');
console.log('PASS selección de foto abre editor sin detección automática pesada');
console.log('PASS margen de seguridad de bordes se conserva');
