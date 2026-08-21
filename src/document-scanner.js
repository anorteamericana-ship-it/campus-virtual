/* CS21A149 · Document Scanner Academia
 * Scanner documental manual, local y sin OpenCV.
 * La foto fuente vive solo en memoria durante el ajuste; el resultado de producto
 * expone únicamente la imagen final confirmable y métricas del procesamiento.
 * No OCR, no IA generativa, no subida de red.
 */
(function(global){
  'use strict';

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_OUTPUT_SIDE = 1800;
  const ROTATION_WORK_SIDE = 2400;
  const JPEG_QUALITY = 0.92;
  const SAFE_MARGIN_ID = 0.018;
  const SAFE_MARGIN_TITLE = 0.012;
  const GEOMETRY_EPS = 1e-9;
  const MIN_NORMALIZED_AREA = 0.005;
  const MIN_NORMALIZED_SIDE = 0.015;
  const MIN_POINT_DISTANCE = 0.002;

  const longTasks=[];
  let longTaskSupported=false;
  try{
    const PO=global.PerformanceObserver;
    if(PO && Array.isArray(PO.supportedEntryTypes) && PO.supportedEntryTypes.includes('longtask')){
      longTaskSupported=true;
      const observer=new PO(list=>{
        for(const entry of list.getEntries()){
          longTasks.push({startTime:Number(entry.startTime)||0,duration:Number(entry.duration)||0});
          if(longTasks.length>120) longTasks.shift();
        }
      });
      observer.observe({entryTypes:['longtask']});
    }
  }catch(_){ longTaskSupported=false; }

  function now(){
    const p=global.performance;
    return p && typeof p.now==='function' ? p.now() : Date.now();
  }

  function heapUsed(){
    const p=global.performance;
    const value=p && p.memory && Number(p.memory.usedJSHeapSize);
    return Number.isFinite(value) ? value : null;
  }

  function finite(value,code='scanner_coordenada_no_finita'){
    const n=Number(value);
    if(!Number.isFinite(n)) throw new Error(code);
    return n;
  }

  function clampFinite(value,min,max){
    const n=finite(value);
    return Math.max(min,Math.min(max,n));
  }

  function yieldUi(){ return new Promise(resolve=>setTimeout(resolve,0)); }

  function readFileDataUrl(file){
    return new Promise((resolve,reject)=>{
      if(!file){ reject(new Error('Seleccioná una imagen.')); return; }
      const size=Number(file.size||0);
      if(size>MAX_FILE_BYTES){ reject(new Error('El archivo supera 10 MB.')); return; }
      const mime=String(file.type||'').toLowerCase();
      if(mime && !/^image\/(jpeg|png|webp)$/.test(mime)){
        reject(new Error('Usá una imagen JPG, PNG o WebP.'));
        return;
      }
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('No se pudo leer el archivo.'));
      reader.onload=()=>resolve(String(reader.result||''));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl){
    return new Promise((resolve,reject)=>{
      if(typeof dataUrl!=='string'||!dataUrl.startsWith('data:image/')){
        reject(new Error('scanner_imagen_fuente_invalida'));
        return;
      }
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error('La imagen no se pudo abrir.'));
      img.src=dataUrl;
    });
  }

  function canvasFromImage(img,maxSide){
    const sourceWidth=finite(img.naturalWidth||img.width,'scanner_imagen_fuente_invalida');
    const sourceHeight=finite(img.naturalHeight||img.height,'scanner_imagen_fuente_invalida');
    if(sourceWidth<1||sourceHeight<1) throw new Error('scanner_imagen_fuente_invalida');
    const ratio=Math.min(1,maxSide/Math.max(sourceWidth,sourceHeight));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(sourceWidth*ratio));
    canvas.height=Math.max(1,Math.round(sourceHeight*ratio));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx) throw new Error('scanner_canvas_no_disponible');
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas;
  }

  function dataUrlBytes(dataUrl){
    const text=String(dataUrl||'');
    const comma=text.indexOf(',');
    if(comma<0) return 0;
    const payload=text.slice(comma+1);
    if(/;base64,/i.test(text.slice(0,comma+1))){
      const padding=(payload.endsWith('==')?2:(payload.endsWith('=')?1:0));
      return Math.max(0,Math.floor(payload.length*3/4)-padding);
    }
    try{ return new TextEncoder().encode(decodeURIComponent(payload)).length; }
    catch(_){ return payload.length; }
  }

  function dist(a,b){
    const dx=finite(a.x)-finite(b.x),dy=finite(a.y)-finite(b.y);
    return Math.hypot(dx,dy);
  }

  function cross(a,b,c){
    return (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  }

  function orientation(a,b,c,eps=GEOMETRY_EPS){
    const value=cross(a,b,c);
    if(Math.abs(value)<=eps) return 0;
    return value>0?1:-1;
  }

  function segmentsProperlyCross(a,b,c,d){
    const o1=orientation(a,b,c),o2=orientation(a,b,d),o3=orientation(c,d,a),o4=orientation(c,d,b);
    return o1!==0&&o2!==0&&o3!==0&&o4!==0&&o1!==o2&&o3!==o4;
  }

  function polygonAreaOrdered(points){
    let sum=0;
    for(let i=0;i<4;i++){
      const a=points[i],b=points[(i+1)%4];
      sum+=a.x*b.y-b.x*a.y;
    }
    return Math.abs(sum)/2;
  }

  function normalizePoints(points){
    if(!Array.isArray(points)||points.length!==4) throw new Error('scanner_esquinas_manual_invalida');
    return points.map(p=>{
      const x=finite(p&&p.x),y=finite(p&&p.y);
      if(x<0||x>1||y<0||y>1) throw new Error('scanner_esquina_fuera_rango');
      return {x,y};
    });
  }

  function validateQuad(points,kind='identity'){
    let p;
    try{ p=normalizePoints(points); }
    catch(err){ return {valid:false,code:String(err&&err.message||'scanner_esquinas_manual_invalida'),borderRisk:false}; }

    for(let i=0;i<4;i++){
      for(let j=i+1;j<4;j++){
        if(dist(p[i],p[j])<MIN_POINT_DISTANCE) return {valid:false,code:'scanner_puntos_duplicados',borderRisk:false};
      }
    }
    for(let i=0;i<4;i++){
      if(dist(p[i],p[(i+1)%4])<MIN_NORMALIZED_SIDE) return {valid:false,code:'scanner_geometria_degenerada',borderRisk:false};
    }
    if(segmentsProperlyCross(p[0],p[1],p[2],p[3])||segmentsProperlyCross(p[1],p[2],p[3],p[0])){
      return {valid:false,code:'scanner_puntos_cruzados',borderRisk:false};
    }
    const turns=[cross(p[0],p[1],p[2]),cross(p[1],p[2],p[3]),cross(p[2],p[3],p[0]),cross(p[3],p[0],p[1])];
    const positive=turns.every(v=>v>GEOMETRY_EPS);
    const negative=turns.every(v=>v<-GEOMETRY_EPS);
    if(!positive&&!negative) return {valid:false,code:'scanner_cuadrilatero_no_convexo',borderRisk:false};
    const area=polygonAreaOrdered(p);
    if(!Number.isFinite(area)||area<MIN_NORMALIZED_AREA) return {valid:false,code:'scanner_geometria_degenerada',borderRisk:false};
    const margin=kind==='title'?SAFE_MARGIN_TITLE:SAFE_MARGIN_ID;
    const borderRisk=p.some(v=>v.x<=margin||v.x>=1-margin||v.y<=margin||v.y>=1-margin);
    return {valid:true,code:null,borderRisk,area,points:p};
  }

  function assertValidQuad(points,kind){
    const result=validateQuad(points,kind);
    if(!result.valid) throw new Error(result.code||'scanner_geometria_invalida');
    return result;
  }

  function expandQuad(points,cols,rows,ratio){
    const cx=points.reduce((s,v)=>s+v.x,0)/4;
    const cy=points.reduce((s,v)=>s+v.y,0)/4;
    let clipped=false;
    const expanded=points.map(v=>{
      const rawX=v.x+(v.x-cx)*ratio;
      const rawY=v.y+(v.y-cy)*ratio;
      if(rawX<0||rawX>cols-1||rawY<0||rawY>rows-1) clipped=true;
      return {x:clampFinite(rawX,0,Math.max(0,cols-1)),y:clampFinite(rawY,0,Math.max(0,rows-1))};
    });
    return {points:expanded,clipped};
  }

  function solve8(A,b){
    const n=8;
    if(!Array.isArray(A)||A.length!==n||!Array.isArray(b)||b.length!==n) throw new Error('scanner_geometria_invalida');
    const m=A.map((row,i)=>{
      if(!Array.isArray(row)||row.length!==n) throw new Error('scanner_geometria_invalida');
      return row.map(v=>finite(v,'scanner_geometria_invalida')).concat([finite(b[i],'scanner_geometria_invalida')]);
    });
    for(let col=0;col<n;col++){
      let pivot=col;
      for(let r=col+1;r<n;r++) if(Math.abs(m[r][col])>Math.abs(m[pivot][col])) pivot=r;
      const pivotValue=finite(m[pivot][col],'scanner_geometria_invalida');
      if(Math.abs(pivotValue)<1e-10) throw new Error('scanner_geometria_invalida');
      if(pivot!==col){ const tmp=m[col];m[col]=m[pivot];m[pivot]=tmp; }
      const div=finite(m[col][col],'scanner_geometria_invalida');
      if(Math.abs(div)<1e-10) throw new Error('scanner_geometria_invalida');
      for(let c=col;c<=n;c++) m[col][c]=finite(m[col][c]/div,'scanner_geometria_invalida');
      for(let r=0;r<n;r++){
        if(r===col) continue;
        const factor=finite(m[r][col],'scanner_geometria_invalida');
        if(Math.abs(factor)<1e-14) continue;
        for(let c=col;c<=n;c++) m[r][c]=finite(m[r][c]-factor*m[col][c],'scanner_geometria_invalida');
      }
    }
    return m.map(row=>finite(row[n],'scanner_geometria_invalida'));
  }

  function homographyDestToSource(dst,src){
    if(!Array.isArray(dst)||dst.length!==4||!Array.isArray(src)||src.length!==4) throw new Error('scanner_geometria_invalida');
    const A=[],b=[];
    for(let i=0;i<4;i++){
      const x=finite(dst[i].x,'scanner_geometria_invalida');
      const y=finite(dst[i].y,'scanner_geometria_invalida');
      const u=finite(src[i].x,'scanner_geometria_invalida');
      const v=finite(src[i].y,'scanner_geometria_invalida');
      A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);
      A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v);
    }
    const h=solve8(A,b);
    const H=[h[0],h[1],h[2],h[3],h[4],h[5],h[6],h[7],1];
    if(!H.every(Number.isFinite)) throw new Error('scanner_geometria_invalida');
    return H;
  }

  function projectPoint(H,x,y){
    if(!Array.isArray(H)||H.length!==9||!H.every(Number.isFinite)) throw new Error('scanner_geometria_invalida');
    x=finite(x,'scanner_coordenada_no_finita');
    y=finite(y,'scanner_coordenada_no_finita');
    const den=finite(H[6]*x+H[7]*y+H[8],'scanner_geometria_invalida');
    if(Math.abs(den)<1e-9) throw new Error('scanner_geometria_invalida');
    const sx=finite((H[0]*x+H[1]*y+H[2])/den,'scanner_geometria_invalida');
    const sy=finite((H[3]*x+H[4]*y+H[5])/den,'scanner_geometria_invalida');
    return {x:sx,y:sy};
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
    if(sharpness<5){score-=35;warnings.push('La foto parece borrosa.');}
    else if(sharpness<9){score-=18;warnings.push('La nitidez parece baja.');}
    return {brightness,sharpness,score:Math.max(0,Math.min(100,Math.round(score))),warnings};
  }

  function longTaskMetrics(start,end){
    if(!longTaskSupported) return {supported:false,count:0,totalMs:0,maxMs:0};
    const hits=longTasks.filter(v=>v.startTime>=start-2&&v.startTime<=end+2);
    return {
      supported:true,
      count:hits.length,
      totalMs:Number(hits.reduce((s,v)=>s+v.duration,0).toFixed(1)),
      maxMs:Number((hits.reduce((m,v)=>Math.max(m,v.duration),0)).toFixed(1))
    };
  }

  async function rotateSource90(sourceDataUrl){
    const img=await loadImage(sourceDataUrl);
    const source=canvasFromImage(img,ROTATION_WORK_SIDE);
    const out=document.createElement('canvas');
    out.width=source.height;out.height=source.width;
    const ctx=out.getContext('2d',{alpha:false});
    if(!ctx) throw new Error('scanner_canvas_no_disponible');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);
    ctx.translate(out.width,0);
    ctx.rotate(Math.PI/2);
    ctx.drawImage(source,0,0);
    return {dataUrl:out.toDataURL('image/png'),width:out.width,height:out.height};
  }

  async function warpQuadNative(sourceDataUrl,normalizedPoints,kind='identity'){
    const validation=assertValidQuad(normalizedPoints,kind);
    const img=await loadImage(sourceDataUrl);
    const staging=canvasFromImage(img,1600);
    const sourcePoints=validation.points.map(p=>({x:p.x*(staging.width-1),y:p.y*(staging.height-1)}));
    const margin=kind==='title'?SAFE_MARGIN_TITLE:SAFE_MARGIN_ID;
    const expanded=expandQuad(sourcePoints,staging.width,staging.height,margin);
    const q=expanded.points;

    const widthRaw=Math.max(dist(q[2],q[3]),dist(q[1],q[0]));
    const heightRaw=Math.max(dist(q[1],q[2]),dist(q[0],q[3]));
    if(!Number.isFinite(widthRaw)||!Number.isFinite(heightRaw)||widthRaw<10||heightRaw<10) throw new Error('scanner_geometria_invalida');
    const scale=Math.min(1,MAX_OUTPUT_SIDE/Math.max(widthRaw,heightRaw));
    const width=Math.max(1,Math.round(widthRaw*scale));
    const height=Math.max(1,Math.round(heightRaw*scale));
    if(width<2||height<2) throw new Error('scanner_geometria_invalida');

    const dst=[{x:0,y:0},{x:width-1,y:0},{x:width-1,y:height-1},{x:0,y:height-1}];
    const H=homographyDestToSource(dst,q);
    const sctx=staging.getContext('2d',{willReadFrequently:true});
    if(!sctx) throw new Error('scanner_canvas_no_disponible');
    const sdata=sctx.getImageData(0,0,staging.width,staging.height).data;
    const out=document.createElement('canvas');out.width=width;out.height=height;
    const octx=out.getContext('2d',{alpha:false});
    if(!octx) throw new Error('scanner_canvas_no_disponible');
    const oimg=octx.createImageData(width,height),od=oimg.data;
    const sw=staging.width,sh=staging.height;

    function sample(x,y,oi){
      x=finite(x,'scanner_geometria_invalida');
      y=finite(y,'scanner_geometria_invalida');
      x=Math.max(0,Math.min(sw-1,x));
      y=Math.max(0,Math.min(sh-1,y));
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
      for(let x=0;x<width;x++){
        const mapped=projectPoint(H,x,y);
        sample(mapped.x,mapped.y,(y*width+x)*4);
      }
      if((y%18)===17) await yieldUi();
    }
    octx.putImageData(oimg,0,0);
    return {canvas:out,borderRisk:validation.borderRisk||expanded.clipped,sourceWidth:staging.width,sourceHeight:staging.height};
  }

  async function normalizeWithCorners(sourceDataUrl,normalizedPoints,kind='identity'){
    kind=kind==='title'?'title':'identity';
    const started=now();
    const memoryBefore=heapUsed();
    const warped=await warpQuadNative(sourceDataUrl,normalizedPoints,kind);
    const finalCanvas=warped.canvas;
    const ctx=finalCanvas.getContext('2d',{willReadFrequently:true});
    if(!ctx) throw new Error('scanner_canvas_no_disponible');
    const data=ctx.getImageData(0,0,finalCanvas.width,finalCanvas.height);
    const quality=nativeQuality(data,finalCanvas.width,finalCanvas.height);
    const resolutionOk=Math.min(finalCanvas.width,finalCanvas.height)>=360&&Math.max(finalCanvas.width,finalCanvas.height)>=640;
    const warnings=quality.warnings.slice();
    if(!resolutionOk) warnings.push('La resolución útil del documento es demasiado baja.');
    if(warped.borderRisk) warnings.push('Alguna esquina está muy cerca del borde de la foto. Verificá que el documento no haya quedado cortado desde la toma original.');
    if(quality.score<60) warnings.push('La calidad calculada es solo orientativa; revisá visualmente la foto final.');
    const finalImage=finalCanvas.toDataURL('image/jpeg',JPEG_QUALITY);
    await yieldUi();
    const ended=now();
    const memoryAfter=heapUsed();
    const tasks=longTaskMetrics(started,ended);
    return {
      finalImage,
      width:finalCanvas.width,
      height:finalCanvas.height,
      manual:true,
      detectionMethod:'manual_native_homography',
      score:quality.score,
      qualityCalibrated:false,
      qualityAdvisory:true,
      requiresRetake:!resolutionOk,
      warnings,
      brightness:quality.brightness,
      sharpness:quality.sharpness,
      borderRisk:warped.borderRisk,
      metrics:{
        cropMs:Number((ended-started).toFixed(1)),
        longTasks:tasks,
        memorySupported:memoryBefore!==null&&memoryAfter!==null,
        memoryBeforeBytes:memoryBefore,
        memoryAfterBytes:memoryAfter,
        memoryDeltaBytes:memoryBefore!==null&&memoryAfter!==null?memoryAfter-memoryBefore:null,
        sourceWidth:warped.sourceWidth,
        sourceHeight:warped.sourceHeight,
        outputWidth:finalCanvas.width,
        outputHeight:finalCanvas.height,
        jpgBytes:dataUrlBytes(finalImage)
      }
    };
  }

  const api={
    version:'CS21A149-1',
    readFileDataUrl,
    rotateSource90,
    validateQuad,
    normalizeWithCorners
  };
  if(global.__AN_SCANNER_QA__){
    api.__qa=Object.freeze({
      solve8,
      homographyDestToSource,
      projectPoint,
      validateQuad,
      segmentsProperlyCross,
      polygonAreaOrdered
    });
  }
  global.ANDocumentScanner=Object.freeze(api);
})(window);
