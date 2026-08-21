/* CS21A145 · Document Scanner Academia
 * Procesamiento local en navegador: original inmutable + copia normalizada.
 * No OCR, no IA generativa y ningún documento sale a servicios externos.
 */
(function(global){
  'use strict';

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_OUTPUT_SIDE = 1800;
  const JPEG_QUALITY = 0.9;

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

  function wait(ms){ return new Promise(resolve=>setTimeout(resolve,ms)); }

  async function getCv(timeoutMs=12000){
    const started = Date.now();
    while(Date.now() - started < timeoutMs){
      let api = global.cv;
      if(api && typeof api.then === 'function'){
        try { api = await api; } catch(_){ api = null; }
      }
      if(api && api.Mat && api.imread && api.findContours) return api;
      await wait(120);
    }
    throw new Error('scanner_cv_no_disponible');
  }

  function dist(a,b){
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  function orderQuad(points){
    const pts = points.slice();
    const sum = p=>p.x+p.y;
    const diff = p=>p.x-p.y;
    return {
      tl: pts.reduce((a,b)=>sum(a)<sum(b)?a:b),
      br: pts.reduce((a,b)=>sum(a)>sum(b)?a:b),
      tr: pts.reduce((a,b)=>diff(a)>diff(b)?a:b),
      bl: pts.reduce((a,b)=>diff(a)<diff(b)?a:b)
    };
  }

  function canvasToJpeg(canvas, quality=JPEG_QUALITY){
    return canvas.toDataURL('image/jpeg', quality);
  }

  async function fallbackNormalize(originalDataUrl){
    const img = await loadImage(originalDataUrl);
    const ratio = Math.min(1, MAX_OUTPUT_SIDE / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * ratio));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * ratio));
    const ctx = canvas.getContext('2d', {alpha:false});
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    return {
      normalized: canvasToJpeg(canvas),
      width: canvas.width,
      height: canvas.height,
      detected: false,
      score: 45,
      requiresRetake: true,
      warnings: ['No pudimos detectar con seguridad los cuatro bordes. Tomá otra foto sobre un fondo contrastante.']
    };
  }

  function qualityFromMat(cv, src){
    const gray = new cv.Mat();
    const lap = new cv.Mat();
    const mean = new cv.Mat();
    const std = new cv.Mat();
    try{
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      const brightness = cv.mean(gray)[0];
      cv.Laplacian(gray, lap, cv.CV_64F);
      cv.meanStdDev(lap, mean, std);
      const stdValue = std.doubleAt ? std.doubleAt(0,0) : Number(std.data64F && std.data64F[0] || 0);
      const sharpness = stdValue * stdValue;
      let score = 100;
      const warnings = [];
      if(brightness < 45){ score -= 25; warnings.push('La foto está muy oscura.'); }
      else if(brightness < 65){ score -= 12; warnings.push('La foto está algo oscura.'); }
      if(brightness > 230){ score -= 25; warnings.push('La foto está sobreexpuesta o tiene demasiado reflejo.'); }
      else if(brightness > 215){ score -= 12; warnings.push('Hay zonas demasiado claras; evitá reflejos.'); }
      if(sharpness < 35){ score -= 35; warnings.push('La foto está borrosa.'); }
      else if(sharpness < 70){ score -= 18; warnings.push('La nitidez es baja.'); }
      return {brightness, sharpness, score:Math.max(0,Math.min(100,Math.round(score))), warnings};
    } finally {
      gray.delete(); lap.delete(); mean.delete(); std.delete();
    }
  }

  function detectLargestQuad(cv, src){
    const gray = new cv.Mat();
    const blur = new cv.Mat();
    const edges = new cv.Mat();
    const closed = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    const kernel = cv.Mat.ones(5,5,cv.CV_8U);
    let best = null;
    let bestArea = 0;
    try{
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0, 0, cv.BORDER_DEFAULT);
      cv.Canny(blur, edges, 55, 165, 3, false);
      cv.morphologyEx(edges, closed, cv.MORPH_CLOSE, kernel);
      cv.findContours(closed, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
      const imageArea = src.cols * src.rows;
      for(let i=0;i<contours.size();i++){
        const contour = contours.get(i);
        const area = Math.abs(cv.contourArea(contour, false));
        if(area < imageArea * 0.12 || area <= bestArea){ contour.delete(); continue; }
        const peri = cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, 0.02 * peri, true);
        if(approx.rows === 4 && cv.isContourConvex(approx)){
          const pts=[];
          for(let r=0;r<4;r++) pts.push({x:approx.intAt(r,0), y:approx.intAt(r,1)});
          best = pts;
          bestArea = area;
        }
        approx.delete(); contour.delete();
      }
      return best;
    } finally {
      gray.delete(); blur.delete(); edges.delete(); closed.delete(); contours.delete(); hierarchy.delete(); kernel.delete();
    }
  }

  function warpQuad(cv, src, points, kind){
    const q = orderQuad(points);
    let width = Math.max(dist(q.br,q.bl), dist(q.tr,q.tl));
    let height = Math.max(dist(q.tr,q.br), dist(q.tl,q.bl));
    if(width < 10 || height < 10) throw new Error('scanner_geometria_invalida');
    const scale = Math.min(1, MAX_OUTPUT_SIDE / Math.max(width,height));
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));

    const srcPts = cv.matFromArray(4,1,cv.CV_32FC2,[
      q.tl.x,q.tl.y,
      q.tr.x,q.tr.y,
      q.br.x,q.br.y,
      q.bl.x,q.bl.y
    ]);
    const dstPts = cv.matFromArray(4,1,cv.CV_32FC2,[
      0,0,
      width-1,0,
      width-1,height-1,
      0,height-1
    ]);
    const M = cv.getPerspectiveTransform(srcPts,dstPts);
    const dst = new cv.Mat();
    try{
      cv.warpPerspective(src,dst,M,new cv.Size(width,height),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255,255));
      if(kind === 'identity' && dst.rows > dst.cols){
        const rotated = new cv.Mat();
        cv.rotate(dst,rotated,cv.ROTATE_90_CLOCKWISE);
        dst.delete();
        return rotated;
      }
      return dst;
    } finally {
      srcPts.delete(); dstPts.delete(); M.delete();
    }
  }

  function matToJpeg(cv, mat){
    const canvas = document.createElement('canvas');
    cv.imshow(canvas,mat);
    return {dataUrl:canvasToJpeg(canvas), width:canvas.width, height:canvas.height};
  }

  async function normalizeImage(originalDataUrl, kind){
    let cv;
    try{ cv = await getCv(); }
    catch(_){ return fallbackNormalize(originalDataUrl); }

    const img = await loadImage(originalDataUrl);
    const staging = document.createElement('canvas');
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const ratio = Math.min(1, 1600 / Math.max(naturalW,naturalH));
    staging.width = Math.max(1,Math.round(naturalW*ratio));
    staging.height = Math.max(1,Math.round(naturalH*ratio));
    staging.getContext('2d',{alpha:false}).drawImage(img,0,0,staging.width,staging.height);

    const src = cv.imread(staging);
    let warped = null;
    try{
      const quad = detectLargestQuad(cv,src);
      if(!quad) return fallbackNormalize(originalDataUrl);
      warped = warpQuad(cv,src,quad,kind);
      const quality = qualityFromMat(cv,warped);
      const rendered = matToJpeg(cv,warped);
      const sizeOk = rendered.width >= 640 && rendered.height >= 360;
      const score = Math.max(0, quality.score - (sizeOk ? 0 : 25));
      const warnings = quality.warnings.slice();
      if(!sizeOk) warnings.push('La resolución útil del documento es baja.');
      return {
        normalized: rendered.dataUrl,
        width: rendered.width,
        height: rendered.height,
        detected: true,
        score,
        requiresRetake: score < 60,
        warnings,
        brightness: quality.brightness,
        sharpness: quality.sharpness
      };
    } finally {
      src.delete();
      if(warped) warped.delete();
    }
  }

  async function processFile(file, options={}){
    if(!file) throw new Error('Seleccioná un archivo.');
    if(Number(file.size || 0) > MAX_FILE_BYTES) throw new Error('El archivo supera 10 MB.');
    const mime = String(file.type || '').toLowerCase();
    const name = String(file.name || 'documento');
    const original = await readFileDataUrl(file);

    if(mime === 'application/pdf' || /\.pdf$/i.test(name)){
      return {
        ok:true,
        type:'pdf',
        original,
        mime:'application/pdf',
        name,
        size:Number(file.size || 0),
        status:'PDF_ORIGINAL_REQUIERE_REVISION_ASESOR'
      };
    }

    if(!/^image\//.test(mime)) throw new Error('Usá una imagen JPG/PNG/WebP o un PDF.');
    const kind = options.kind === 'title' ? 'title' : 'identity';
    const normalized = await normalizeImage(original,kind);
    return {
      ok:true,
      type:'image',
      original,
      normalized:normalized.normalized,
      name,
      mime,
      size:Number(file.size || 0),
      width:normalized.width,
      height:normalized.height,
      detected:normalized.detected,
      score:normalized.score,
      requiresRetake:normalized.requiresRetake,
      warnings:normalized.warnings || [],
      brightness:normalized.brightness,
      sharpness:normalized.sharpness
    };
  }

  global.ANDocumentScanner = Object.freeze({
    version:'CS21A145-1',
    processFile,
    normalizeImage,
    readFileDataUrl
  });
})(window);
