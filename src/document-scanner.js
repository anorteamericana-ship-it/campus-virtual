/* CS21A145 · Document Scanner Academia
 * Procesamiento local en navegador: original inmutable + copia normalizada.
 * No OCR, no IA generativa y ningún documento sale a servicios externos.
 */
(function(global){
  'use strict';

  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const MAX_OUTPUT_SIDE = 1800;
  const JPEG_QUALITY = 0.9;
  const ID_ASPECT = 85.60 / 53.98; // ISO/IEC 7810 ID-1 ≈ 1.586

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

  function quadArea(points){
    const q = orderQuad(points);
    const p = [q.tl,q.tr,q.br,q.bl];
    let area = 0;
    for(let i=0;i<4;i++){
      const a=p[i], b=p[(i+1)%4];
      area += a.x*b.y - b.x*a.y;
    }
    return Math.abs(area)/2;
  }

  function quadMetrics(points, cols, rows){
    const q = orderQuad(points);
    const width = Math.max(dist(q.tl,q.tr),dist(q.bl,q.br));
    const height = Math.max(dist(q.tl,q.bl),dist(q.tr,q.br));
    const longSide = Math.max(width,height);
    const shortSide = Math.max(1,Math.min(width,height));
    const aspect = longSide/shortSide;
    const cx = (q.tl.x+q.tr.x+q.br.x+q.bl.x)/4;
    const cy = (q.tl.y+q.tr.y+q.br.y+q.bl.y)/4;
    const dx = Math.abs(cx-cols/2)/(cols/2);
    const dy = Math.abs(cy-rows/2)/(rows/2);
    const centerScore = Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/1.2);
    return {q,width,height,aspect,centerScore,area:quadArea(points)};
  }

  function scoreQuad(points, cols, rows, kind){
    const m = quadMetrics(points,cols,rows);
    const imageArea = cols*rows;
    const areaRatio = m.area/imageArea;
    if(areaRatio < 0.035 || areaRatio > 0.90) return -Infinity;
    if(m.aspect < 1.08 || m.aspect > 2.7) return -Infinity;

    const areaScore = Math.min(1,areaRatio/0.20);
    let aspectScore = 0.65;
    if(kind === 'identity'){
      aspectScore = Math.max(0,1-Math.abs(m.aspect-ID_ASPECT)/0.85);
      if(m.aspect < 1.25 || m.aspect > 2.15) aspectScore *= 0.25;
    }else{
      const commonPaper = 1.414;
      aspectScore = Math.max(0.25,1-Math.abs(m.aspect-commonPaper)/1.2);
    }
    return areaScore*4 + aspectScore*3 + m.centerScore*1.5;
  }

  function pointsFromApprox(approx){
    const pts=[];
    const d=approx.data32S || [];
    if(d.length >= 8){
      for(let r=0;r<4;r++) pts.push({x:Number(d[r*2]),y:Number(d[r*2+1])});
      return pts;
    }
    for(let r=0;r<4;r++) pts.push({x:approx.intAt(r,0),y:approx.intAt(r,1)});
    return pts;
  }

  function bestQuadFromMask(cv, mask, src, kind, method){
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    let best=null;
    let bestScore=-Infinity;
    try{
      cv.findContours(mask,contours,hierarchy,cv.RETR_LIST,cv.CHAIN_APPROX_SIMPLE);
      const imageArea=src.cols*src.rows;
      const epsilons=[0.012,0.018,0.025,0.035,0.05,0.07];
      for(let i=0;i<contours.size();i++){
        const contour=contours.get(i);
        try{
          const area=Math.abs(cv.contourArea(contour,false));
          if(area < imageArea*0.03 || area > imageArea*0.93) continue;
          const peri=cv.arcLength(contour,true);
          for(const eps of epsilons){
            const approx=new cv.Mat();
            try{
              cv.approxPolyDP(contour,approx,eps*peri,true);
              if(approx.rows!==4 || !cv.isContourConvex(approx)) continue;
              const pts=pointsFromApprox(approx);
              const score=scoreQuad(pts,src.cols,src.rows,kind);
              if(score>bestScore){
                bestScore=score;
                best={points:pts,score,method};
              }
            } finally { approx.delete(); }
          }
        } finally { contour.delete(); }
      }
      return best;
    } finally {
      contours.delete(); hierarchy.delete();
    }
  }

  function detectDocumentQuad(cv, src, kind){
    const gray=new cv.Mat();
    const blur=new cv.Mat();
    const edges=new cv.Mat();
    const expanded=new cv.Mat();
    const closed=new cv.Mat();
    const binary=new cv.Mat();
    const binaryInv=new cv.Mat();
    const smallKernel=cv.Mat.ones(3,3,cv.CV_8U);
    const closeKernel=cv.Mat.ones(9,9,cv.CV_8U);
    let best=null;

    function keep(candidate){
      if(candidate && (!best || candidate.score>best.score)) best=candidate;
    }

    try{
      cv.cvtColor(src,gray,cv.COLOR_RGBA2GRAY,0);
      cv.GaussianBlur(gray,blur,new cv.Size(5,5),0,0,cv.BORDER_DEFAULT);

      // Varias sensibilidades Canny: fotos reales pueden tener piel, estampados,
      // sombras y bordes redondeados que fragmentan un único contorno.
      const cannyPasses=[[25,85],[40,125],[55,165],[75,215],[95,245]];
      for(const pair of cannyPasses){
        cv.Canny(blur,edges,pair[0],pair[1],3,false);
        cv.dilate(edges,expanded,smallKernel);
        cv.morphologyEx(expanded,closed,cv.MORPH_CLOSE,closeKernel);
        keep(bestQuadFromMask(cv,closed,src,kind,'canny_'+pair[0]+'_'+pair[1]));
      }

      // Segunda familia de pases: separa documentos claros contra fondos
      // complejos. Otsu + cierre ayuda cuando la arista física no forma un
      // contorno continuo (por ejemplo una cédula sostenida con la mano).
      cv.threshold(blur,binary,0,255,cv.THRESH_BINARY+cv.THRESH_OTSU);
      cv.morphologyEx(binary,closed,cv.MORPH_CLOSE,closeKernel);
      keep(bestQuadFromMask(cv,closed,src,kind,'otsu_light'));

      cv.bitwise_not(binary,binaryInv);
      cv.morphologyEx(binaryInv,closed,cv.MORPH_CLOSE,closeKernel);
      keep(bestQuadFromMask(cv,closed,src,kind,'otsu_dark'));

      if(best && best.score>=3.5) return best;
      return null;
    } finally {
      gray.delete(); blur.delete(); edges.delete(); expanded.delete(); closed.delete();
      binary.delete(); binaryInv.delete(); smallKernel.delete(); closeKernel.delete();
    }
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
      detectionMethod:'none',
      score: 45,
      requiresRetake: true,
      warnings: ['No pudimos detectar con seguridad los cuatro bordes. La vista de la derecha aún no está recortada; tomá otra foto sobre un fondo contrastante.']
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
    const ctx=staging.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff';
    ctx.fillRect(0,0,staging.width,staging.height);
    ctx.drawImage(img,0,0,staging.width,staging.height);

    const src = cv.imread(staging);
    let warped = null;
    try{
      const detection = detectDocumentQuad(cv,src,kind);
      if(!detection) return fallbackNormalize(originalDataUrl);
      warped = warpQuad(cv,src,detection.points,kind);
      const quality = qualityFromMat(cv,warped);
      const rendered = matToJpeg(cv,warped);
      const sizeOk = rendered.width >= 640 && rendered.height >= 360;
      const ratioMeasured = Math.max(rendered.width,rendered.height)/Math.max(1,Math.min(rendered.width,rendered.height));
      let geometryPenalty=0;
      const warnings = quality.warnings.slice();
      if(kind==='identity' && (ratioMeasured<1.30 || ratioMeasured>2.05)){
        geometryPenalty=20;
        warnings.push('El recorte detectado no conserva una proporción típica de documento de identidad. Repetí la foto si ves contenido fuera del borde.');
      }
      const score = Math.max(0, quality.score - (sizeOk ? 0 : 25) - geometryPenalty);
      if(!sizeOk) warnings.push('La resolución útil del documento es baja.');
      return {
        normalized: rendered.dataUrl,
        width: rendered.width,
        height: rendered.height,
        detected: true,
        detectionMethod:detection.method,
        detectionScore:Math.round(detection.score*100)/100,
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
      detectionMethod:normalized.detectionMethod || 'none',
      detectionScore:normalized.detectionScore || 0,
      score:normalized.score,
      requiresRetake:normalized.requiresRetake,
      warnings:normalized.warnings || [],
      brightness:normalized.brightness,
      sharpness:normalized.sharpness
    };
  }

  global.ANDocumentScanner = Object.freeze({
    version:'CS21A145-2',
    processFile,
    normalizeImage,
    readFileDataUrl
  });
})(window);