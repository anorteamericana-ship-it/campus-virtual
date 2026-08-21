/* CS21A147 · Document Scanner Academia
 * Preprocesamiento local antes de subir: el prospecto confirma UNA imagen final.
 * La foto fuente vive solo en memoria del navegador durante el ajuste; no se
 * envía ni se conserva como copia adicional. No OCR, no IA generativa.
 */
(function(global){
  'use strict';

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_OUTPUT_SIDE = 1800;
  const JPEG_QUALITY = 0.92;
  const ID_ASPECT = 85.60 / 53.98;
  const SAFE_MARGIN_ID = 0.018;
  const SAFE_MARGIN_TITLE = 0.012;
  const CV_URLS = [
    'https://docs.opencv.org/4.10.0/opencv.js',
    'https://docs.opencv.org/4.x/opencv.js'
  ];

  function wait(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }
  function clamp(v,min,max){ return Math.max(min,Math.min(max,Number(v))); }
  function clamp01(v){ return clamp(v,0,1); }

  function readFileDataUrl(file){
    return new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onerror = ()=>reject(new Error('No se pudo leer el archivo.'));
      reader.onload = ()=>resolve(String(reader.result || ''));
      reader.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = ()=>reject(new Error('La imagen no se pudo abrir.'));
      img.src = dataUrl;
    });
  }

  async function resolveCvValue(value){
    let api = value;
    if(api && typeof api.then === 'function'){
      try{ api = await api; }catch(_){ api = null; }
    }
    return api;
  }

  function isCvReady(api){
    return !!(api && api.Mat && api.imread && api.findContours && api.getPerspectiveTransform);
  }

  async function getCv(timeoutMs=12000){
    const started = Date.now();
    while(Date.now() - started < timeoutMs){
      const api = await resolveCvValue(global.cv);
      if(isCvReady(api)) return api;
      await wait(120);
    }
    throw new Error('scanner_cv_no_disponible');
  }

  function loadScript(url){
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=url;
      s.async=true;
      s.dataset.anDocumentScannerCv='1';
      s.onload=()=>resolve();
      s.onerror=()=>reject(new Error('scanner_cv_script_error'));
      document.head.appendChild(s);
    });
  }

  let cvPromise = null;
  async function ensureCv(){
    try{ return await getCv(2500); }catch(_){}
    if(cvPromise) return cvPromise;
    cvPromise=(async()=>{
      // Si la página ya incluyó OpenCV, darle tiempo de terminar WASM antes de
      // cargar un respaldo. Esto evita el error observado en QA al pulsar recorte.
      const existing=[...document.scripts].some(s=>/opencv\.js(?:$|\?)/i.test(String(s.src||'')));
      if(existing){
        try{ return await getCv(10000); }catch(_){}
      }
      let lastErr=null;
      for(const url of CV_URLS){
        try{
          await loadScript(url);
          return await getCv(30000);
        }catch(e){ lastErr=e; }
      }
      throw lastErr || new Error('scanner_cv_no_disponible');
    })();
    try{ return await cvPromise; }
    catch(e){ cvPromise=null; throw e; }
  }

  function dist(a,b){
    const dx=a.x-b.x, dy=a.y-b.y;
    return Math.sqrt(dx*dx+dy*dy);
  }

  function orderQuad(points){
    const pts=points.slice();
    const sum=p=>p.x+p.y;
    const diff=p=>p.x-p.y;
    return {
      tl:pts.reduce((a,b)=>sum(a)<sum(b)?a:b),
      br:pts.reduce((a,b)=>sum(a)>sum(b)?a:b),
      tr:pts.reduce((a,b)=>diff(a)>diff(b)?a:b),
      bl:pts.reduce((a,b)=>diff(a)<diff(b)?a:b)
    };
  }

  function orderedArray(points){
    const q=orderQuad(points);
    return [q.tl,q.tr,q.br,q.bl];
  }

  function quadArea(points){
    const p=orderedArray(points);
    let area=0;
    for(let i=0;i<4;i++){
      const a=p[i],b=p[(i+1)%4];
      area+=a.x*b.y-b.x*a.y;
    }
    return Math.abs(area)/2;
  }

  function expandQuad(points,cols,rows,ratio){
    const p=orderedArray(points);
    const cx=p.reduce((s,v)=>s+v.x,0)/4;
    const cy=p.reduce((s,v)=>s+v.y,0)/4;
    return p.map(v=>({
      x:clamp(v.x+(v.x-cx)*ratio,0,Math.max(0,cols-1)),
      y:clamp(v.y+(v.y-cy)*ratio,0,Math.max(0,rows-1))
    }));
  }

  function quadMetrics(points,cols,rows){
    const q=orderQuad(points);
    const width=Math.max(dist(q.tl,q.tr),dist(q.bl,q.br));
    const height=Math.max(dist(q.tl,q.bl),dist(q.tr,q.br));
    const longSide=Math.max(width,height);
    const shortSide=Math.max(1,Math.min(width,height));
    const aspect=longSide/shortSide;
    const cx=(q.tl.x+q.tr.x+q.br.x+q.bl.x)/4;
    const cy=(q.tl.y+q.tr.y+q.br.y+q.bl.y)/4;
    const dx=Math.abs(cx-cols/2)/(cols/2);
    const dy=Math.abs(cy-rows/2)/(rows/2);
    const centerScore=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/1.2);
    return {aspect,centerScore,area:quadArea(points)};
  }

  function scoreQuad(points,cols,rows,kind){
    const m=quadMetrics(points,cols,rows);
    const areaRatio=m.area/(cols*rows);
    if(areaRatio<0.035||areaRatio>0.90) return -Infinity;
    if(m.aspect<1.08||m.aspect>2.7) return -Infinity;
    const areaScore=Math.min(1,areaRatio/0.20);
    let aspectScore=0.65;
    if(kind==='identity'){
      aspectScore=Math.max(0,1-Math.abs(m.aspect-ID_ASPECT)/0.85);
      if(m.aspect<1.25||m.aspect>2.15) aspectScore*=0.25;
    }else{
      aspectScore=Math.max(0.25,1-Math.abs(m.aspect-1.414)/1.2);
    }
    return areaScore*4+aspectScore*3+m.centerScore*1.5;
  }

  function pointsFromApprox(approx){
    const pts=[];
    const d=approx.data32S||[];
    if(d.length>=8){
      for(let r=0;r<4;r++) pts.push({x:Number(d[r*2]),y:Number(d[r*2+1])});
      return pts;
    }
    for(let r=0;r<4;r++) pts.push({x:approx.intAt(r,0),y:approx.intAt(r,1)});
    return pts;
  }

  function bestQuadFromMask(cv,mask,src,kind,method){
    const contours=new cv.MatVector();
    const hierarchy=new cv.Mat();
    let best=null,bestScore=-Infinity;
    try{
      cv.findContours(mask,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      const imageArea=src.cols*src.rows;
      const epsilons=[0.012,0.018,0.025,0.035,0.05,0.07];
      for(let i=0;i<contours.size();i++){
        const contour=contours.get(i);
        try{
          const area=Math.abs(cv.contourArea(contour,false));
          if(area<imageArea*0.03||area>imageArea*0.93) continue;
          const peri=cv.arcLength(contour,true);
          for(const eps of epsilons){
            const approx=new cv.Mat();
            try{
              cv.approxPolyDP(contour,approx,eps*peri,true);
              if(approx.rows!==4||!cv.isContourConvex(approx)) continue;
              const pts=pointsFromApprox(approx);
              const score=scoreQuad(pts,src.cols,src.rows,kind);
              if(score>bestScore){ bestScore=score; best={points:pts,score,method}; }
            }finally{ approx.delete(); }
          }
        }finally{ contour.delete(); }
      }
      return best;
    }finally{ contours.delete(); hierarchy.delete(); }
  }

  function detectDocumentQuad(cv,src,kind){
    const gray=new cv.Mat(),blur=new cv.Mat(),edges=new cv.Mat(),expanded=new cv.Mat();
    const closed=new cv.Mat(),binary=new cv.Mat(),binaryInv=new cv.Mat();
    const smallKernel=cv.Mat.ones(3,3,cv.CV_8U),closeKernel=cv.Mat.ones(9,9,cv.CV_8U);
    let best=null;
    const keep=c=>{ if(c&&(!best||c.score>best.score)) best=c; };
    try{
      cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY,0);
      cv.GaussianBlur(gray,blur,new cv.Size(5,5),0,0,cv.BORDER_DEFAULT);
      const cannyPasses=[[25,85],[40,125],[55,165],[75,215],[95,245]];
      for(const pair of cannyPasses){
        cv.Canny(blur,edges,pair[0],pair[1],3,false);
        cv.dilate(edges,expanded,smallKernel);
        cv.morphologyEx(expanded,closed,cv.MORPH_CLOSE,closeKernel);
        keep(bestQuadFromMask(cv,closed,src,kind,'canny_'+pair[0]+'_'+pair[1]));
      }
      cv.threshold(blur,binary,0,255,cv.THRESH_BINARY+cv.THRESH_OTSU);
      cv.morphologyEx(binary,closed,cv.MORPH_CLOSE,closeKernel);
      keep(bestQuadFromMask(cv,closed,src,kind,'otsu_light'));
      cv.bitwise_not(binary,binaryInv);
      cv.morphologyEx(binaryInv,closed,cv.MORPH_CLOSE,closeKernel);
      keep(bestQuadFromMask(cv,closed,src,kind,'otsu_dark'));
      return best&&best.score>=3.5?best:null;
    }finally{
      gray.delete();blur.delete();edges.delete();expanded.delete();closed.delete();binary.delete();binaryInv.delete();
      smallKernel.delete();closeKernel.delete();
    }
  }

  function canvasToJpeg(canvas,quality=JPEG_QUALITY){
    return canvas.toDataURL('image/jpeg',quality);
  }

  function stagingCanvas(img,maxSide=1600){
    const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
    const ratio=Math.min(1,maxSide/Math.max(w,h));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(w*ratio));
    canvas.height=Math.max(1,Math.round(h*ratio));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return canvas;
  }

  function qualityFromMat(cv,src){
    const gray=new cv.Mat(),lap=new cv.Mat(),mean=new cv.Mat(),std=new cv.Mat();
    try{
      cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY,0);
      const brightness=cv.mean(gray)[0];
      cv.Laplacian(gray,lap,cv.CV_64F);
      cv.meanStdDev(lap,mean,std);
      const stdValue=std.doubleAt?std.doubleAt(0,0):Number(std.data64F&&std.data64F[0]||0);
      const sharpness=stdValue*stdValue;
      let score=100;const warnings=[];
      if(brightness<45){score-=25;warnings.push('La foto está muy oscura.');}
      else if(brightness<65){score-=12;warnings.push('La foto está algo oscura.');}
      if(brightness>230){score-=25;warnings.push('La foto está sobreexpuesta o tiene demasiado reflejo.');}
      else if(brightness>215){score-=12;warnings.push('Hay zonas demasiado claras; evitá reflejos.');}
      if(sharpness<35){score-=35;warnings.push('La foto está borrosa.');}
      else if(sharpness<70){score-=18;warnings.push('La nitidez es baja.');}
      return {brightness,sharpness,score:Math.max(0,Math.min(100,Math.round(score))),warnings};
    }finally{ gray.delete();lap.delete();mean.delete();std.delete(); }
  }

  function warpQuad(cv,src,points,kind){
    const margin=kind==='identity'?SAFE_MARGIN_ID:SAFE_MARGIN_TITLE;
    const safe=expandQuad(points,src.cols,src.rows,margin);
    const q=orderQuad(safe);
    let width=Math.max(dist(q.br,q.bl),dist(q.tr,q.tl));
    let height=Math.max(dist(q.tr,q.br),dist(q.tl,q.bl));
    if(width<10||height<10) throw new Error('scanner_geometria_invalida');
    const scale=Math.min(1,MAX_OUTPUT_SIDE/Math.max(width,height));
    width=Math.max(1,Math.round(width*scale));
    height=Math.max(1,Math.round(height*scale));
    const srcPts=cv.matFromArray(4,1,cv.CV_32FC2,[q.tl.x,q.tl.y,q.tr.x,q.tr.y,q.br.x,q.br.y,q.bl.x,q.bl.y]);
    const dstPts=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,width-1,0,width-1,height-1,0,height-1]);
    const M=cv.getPerspectiveTransform(srcPts,dstPts);
    const dst=new cv.Mat();
    try{
      cv.warpPerspective(src,dst,M,new cv.Size(width,height),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
      if(kind==='identity'&&dst.rows>dst.cols){
        const rotated=new cv.Mat();cv.rotate(dst,rotated,cv.ROTATE_90_CLOCKWISE);dst.delete();return rotated;
      }
      return dst;
    }finally{ srcPts.delete();dstPts.delete();M.delete(); }
  }

  function matToJpeg(cv,mat){
    const canvas=document.createElement('canvas');
    cv.imshow(canvas,mat);
    return {dataUrl:canvasToJpeg(canvas),width:canvas.width,height:canvas.height};
  }

  function normalizePoints(points){
    if(!Array.isArray(points)||points.length!==4) throw new Error('scanner_esquinas_manual_invalida');
    return points.map(p=>({x:clamp01(p&&p.x),y:clamp01(p&&p.y)}));
  }

  async function detectCorners(sourceDataUrl,kind='identity'){
    const cv=await ensureCv();
    const img=await loadImage(sourceDataUrl);
    const staging=stagingCanvas(img,1600);
    const src=cv.imread(staging);
    try{
      const detection=detectDocumentQuad(cv,src,kind==='title'?'title':'identity');
      if(!detection) return {detected:false,points:null,method:'none'};
      const margin=kind==='identity'?SAFE_MARGIN_ID:SAFE_MARGIN_TITLE;
      const safe=expandQuad(detection.points,src.cols,src.rows,margin);
      return {
        detected:true,
        method:detection.method,
        points:orderedArray(safe).map(p=>({x:p.x/src.cols,y:p.y/src.rows}))
      };
    }finally{ src.delete(); }
  }

  async function normalizeWithCorners(sourceDataUrl,normalizedPoints,kind='identity'){
    const cv=await ensureCv();
    const img=await loadImage(sourceDataUrl);
    const staging=stagingCanvas(img,1600);
    const n=normalizePoints(normalizedPoints);
    const points=n.map(p=>({x:p.x*staging.width,y:p.y*staging.height}));
    const src=cv.imread(staging);
    let warped=null;
    try{
      // Los puntos manuales se expanden otra vez un margen de seguridad para que
      // ningún borde físico quede rasurado aunque el usuario marque justo encima.
      warped=warpQuad(cv,src,points,kind==='title'?'title':'identity');
      const quality=qualityFromMat(cv,warped);
      const rendered=matToJpeg(cv,warped);
      const sizeOk=rendered.width>=640&&rendered.height>=360;
      const score=Math.max(0,quality.score-(sizeOk?0:25));
      const warnings=quality.warnings.slice();
      if(!sizeOk) warnings.push('La resolución útil del documento es baja.');
      return {
        finalImage:rendered.dataUrl,
        normalized:rendered.dataUrl,
        width:rendered.width,
        height:rendered.height,
        detected:true,
        manual:true,
        detectionMethod:'manual_corners',
        score,
        requiresRetake:score<60,
        warnings,
        brightness:quality.brightness,
        sharpness:quality.sharpness
      };
    }finally{ src.delete();if(warped)warped.delete(); }
  }

  async function normalizeImage(sourceDataUrl,kind='identity'){
    const cv=await ensureCv();
    const img=await loadImage(sourceDataUrl);
    const staging=stagingCanvas(img,1600);
    const src=cv.imread(staging);
    let warped=null;
    try{
      const detection=detectDocumentQuad(cv,src,kind==='title'?'title':'identity');
      if(!detection){
        return {finalImage:'',normalized:'',width:0,height:0,detected:false,detectionMethod:'none',score:0,requiresRetake:true,warnings:['Ajustá manualmente las cuatro esquinas del documento.']};
      }
      warped=warpQuad(cv,src,detection.points,kind==='title'?'title':'identity');
      const quality=qualityFromMat(cv,warped);
      const rendered=matToJpeg(cv,warped);
      const sizeOk=rendered.width>=640&&rendered.height>=360;
      const score=Math.max(0,quality.score-(sizeOk?0:25));
      const warnings=quality.warnings.slice();
      if(!sizeOk) warnings.push('La resolución útil del documento es baja.');
      return {
        finalImage:rendered.dataUrl,
        normalized:rendered.dataUrl,
        width:rendered.width,
        height:rendered.height,
        detected:true,
        detectionMethod:detection.method,
        score,
        requiresRetake:score<60,
        warnings,
        brightness:quality.brightness,
        sharpness:quality.sharpness
      };
    }finally{ src.delete();if(warped)warped.delete(); }
  }

  async function processFile(file,options={}){
    if(!file) throw new Error('Seleccioná un archivo.');
    if(Number(file.size||0)>MAX_FILE_BYTES) throw new Error('El archivo supera 10 MB.');
    const mime=String(file.type||'').toLowerCase();
    const name=String(file.name||'documento');
    const source=await readFileDataUrl(file);
    if(mime==='application/pdf'||/\.pdf$/i.test(name)){
      return {ok:true,type:'pdf',fileData:source,mime:'application/pdf',name,size:Number(file.size||0),status:'PDF_ORIGINAL_REQUIERE_REVISION_ASESOR'};
    }
    if(!/^image\//.test(mime)) throw new Error('Usá una imagen JPG, PNG o WebP, o un PDF.');
    const kind=options.kind==='title'?'title':'identity';
    const automatic=await normalizeImage(source,kind);
    return {
      ok:true,type:'image',source,original:source,
      finalImage:automatic.finalImage,normalized:automatic.normalized,
      name,mime,size:Number(file.size||0),
      width:automatic.width,height:automatic.height,detected:automatic.detected,
      detectionMethod:automatic.detectionMethod,score:automatic.score,
      requiresRetake:automatic.requiresRetake,warnings:automatic.warnings||[],
      brightness:automatic.brightness,sharpness:automatic.sharpness
    };
  }

  global.ANDocumentScanner=Object.freeze({
    version:'CS21A147-1',
    ensureCv,
    processFile,
    detectCorners,
    normalizeImage,
    normalizeWithCorners,
    readFileDataUrl
  });
})(window);
