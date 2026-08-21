import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const scannerPath = path.join(root, 'src', 'document-scanner.js');
const jsxPath = path.join(root, 'src', 'inscripcion.jsx');
const cssPath = path.join(root, 'styles', 'inscripcion.css');

for (const p of [scannerPath, jsxPath, cssPath]) {
  if (!fs.existsSync(p)) throw new Error('Falta archivo requerido: ' + p);
}

function once(text, oldText, newText, label) {
  const i = text.indexOf(oldText);
  if (i < 0) throw new Error('No encontré preimagen exacta: ' + label);
  if (text.indexOf(oldText, i + oldText.length) >= 0) throw new Error('Preimagen duplicada: ' + label);
  return text.slice(0, i) + newText + text.slice(i + oldText.length);
}

let scanner = fs.readFileSync(scannerPath, 'utf8').replace(/\r\n/g, '\n');
let jsx = fs.readFileSync(jsxPath, 'utf8').replace(/\r\n/g, '\n');
let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');

if (!jsx.includes("const INS_VERSION = 'F98.4-Z6-IP4B';")) {
  throw new Error('CS21A146 requiere que CS21A145/IP4B esté aplicado primero.');
}

if (!scanner.includes('async function normalizeWithCorners(')) {
  const manualScanner = `
  function clamp01(v){
    return Math.max(0, Math.min(1, Number(v || 0)));
  }

  function validateManualCorners(points){
    if(!Array.isArray(points) || points.length !== 4) throw new Error('scanner_esquinas_manual_invalida');
    return points.map(p=>({x:clamp01(p && p.x), y:clamp01(p && p.y)}));
  }

  async function normalizeWithCorners(originalDataUrl, normalizedPoints, kind='identity'){
    const cv = await getCv();
    const img = await loadImage(originalDataUrl);
    const naturalW = img.naturalWidth || img.width;
    const naturalH = img.naturalHeight || img.height;
    const ratio = Math.min(1, 1600 / Math.max(naturalW, naturalH));
    const staging = document.createElement('canvas');
    staging.width = Math.max(1, Math.round(naturalW * ratio));
    staging.height = Math.max(1, Math.round(naturalH * ratio));
    staging.getContext('2d', {alpha:false}).drawImage(img, 0, 0, staging.width, staging.height);

    const normalized = validateManualCorners(normalizedPoints);
    const points = normalized.map(p=>({
      x: p.x * staging.width,
      y: p.y * staging.height
    }));

    const src = cv.imread(staging);
    let warped = null;
    try{
      warped = warpQuad(cv, src, points, kind === 'title' ? 'title' : 'identity');
      const quality = qualityFromMat(cv, warped);
      const rendered = matToJpeg(cv, warped);
      const sizeOk = rendered.width >= 640 && rendered.height >= 360;
      const score = Math.max(0, quality.score - (sizeOk ? 0 : 25));
      const warnings = quality.warnings.slice();
      if(!sizeOk) warnings.push('La resolución útil del documento es baja.');
      return {
        normalized: rendered.dataUrl,
        width: rendered.width,
        height: rendered.height,
        detected: true,
        manual: true,
        detectionMethod: 'manual_corners',
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
`;

  scanner = once(
    scanner,
    '\n  async function processFile(file, options={}){',
    manualScanner + '\n  async function processFile(file, options={}){',
    'scanner normalizeWithCorners'
  );

  scanner = once(
    scanner,
    '    normalizeImage,\n    readFileDataUrl',
    '    normalizeImage,\n    normalizeWithCorners,\n    readFileDataUrl',
    'export normalizeWithCorners'
  );
}

if (!jsx.includes('function ManualCornerEditor(')) {
  const editor = `function ManualCornerEditor({src,onApply,onCancel}){
  const wrapRef=React.useRef(null);
  const [dragging,setDragging]=React.useState(-1);
  const [points,setPoints]=React.useState([
    {x:.16,y:.20}, {x:.84,y:.20}, {x:.84,y:.80}, {x:.16,y:.80}
  ]);

  function pointFromEvent(e){
    const rect=wrapRef.current.getBoundingClientRect();
    return {
      x:Math.max(0,Math.min(1,(e.clientX-rect.left)/Math.max(1,rect.width))),
      y:Math.max(0,Math.min(1,(e.clientY-rect.top)/Math.max(1,rect.height)))
    };
  }

  function begin(e,index){
    e.preventDefault();
    setDragging(index);
    try{ wrapRef.current.setPointerCapture(e.pointerId); }catch(_){}
  }

  function move(e){
    if(dragging < 0) return;
    e.preventDefault();
    const p=pointFromEvent(e);
    setPoints(prev=>prev.map((old,i)=>i===dragging?p:old));
  }

  function end(e){
    if(dragging < 0) return;
    try{ wrapRef.current.releasePointerCapture(e.pointerId); }catch(_){}
    setDragging(-1);
  }

  const polygon=points.map(p=>\`${'${p.x*100},${p.y*100}'}\`).join(' ');

  return <div className="ins-manual-crop">
    <div className="ins-manual-help"><strong>Ajustá las 4 esquinas</strong><span>Mové cada punto hasta la esquina real del documento. No recortés ninguna parte útil.</span></div>
    <div ref={wrapRef} className="ins-corner-stage" onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <img src={src} alt="Documento para ajustar esquinas" draggable="false" />
      <svg className="ins-corner-polygon" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points={polygon}/></svg>
      {points.map((p,i)=><button
        key={i}
        type="button"
        className="ins-corner-handle"
        style={{left:\`${'${p.x*100}%'}\`,top:\`${'${p.y*100}%'}\`}}
        onPointerDown={e=>begin(e,i)}
        aria-label={\`Esquina ${'${i+1}'}\`}
      >{i+1}</button>)}
    </div>
    <div className="ins-scan-actions">
      <button type="button" className="ins-btn ghost compact" onClick={onCancel}>Cancelar ajuste</button>
      <button type="button" className="ins-btn primary compact" onClick={()=>onApply(points)}>Aplicar recorte</button>
    </div>
  </div>;
}

`;

  jsx = once(
    jsx,
    'function DocumentImageUpload({label, kind=\'identity\', value, originalValue, onAccept, onClear, hint}){',
    editor + 'function DocumentImageUpload({label, kind=\'identity\', value, originalValue, onAccept, onClear, hint}){',
    'ManualCornerEditor component'
  );

  jsx = once(
    jsx,
    "  const [preview,setPreview]=React.useState(null);\n  const cameraRef=React.useRef(null);",
    "  const [preview,setPreview]=React.useState(null);\n  const [manualMode,setManualMode]=React.useState(false);\n  const cameraRef=React.useRef(null);",
    'estado manualMode'
  );

  jsx = once(
    jsx,
    "      setPreview(result);\n      setName(file.name || 'foto');",
    "      setPreview(result);\n      setManualMode(false);\n      setName(file.name || 'foto');",
    'reset manual al cargar archivo'
  );

  jsx = once(
    jsx,
    "  function acceptPreview(){\n    if(!preview || preview.requiresRetake) return;\n    onAccept(preview.normalized, preview.original, preview);\n    setPreview(null);\n  }",
    `  async function applyManual(points){
    if(!preview || !preview.original) return;
    setBusy(true); setErr('');
    try{
      const adjusted=await window.ANDocumentScanner.normalizeWithCorners(preview.original,points,kind);
      setPreview({...preview,...adjusted,original:preview.original});
      setManualMode(false);
    }catch(e){ setErr(e.message || 'No se pudo aplicar el recorte manual.'); }
    finally{ setBusy(false); }
  }

  function acceptPreview(){
    if(!preview || preview.requiresRetake) return;
    onAccept(preview.normalized, preview.original, preview);
    setPreview(null); setManualMode(false);
  }`,
    'applyManual'
  );

  jsx = once(
    jsx,
    "    setPreview(null); setName(''); setErr('');\n    onClear();",
    "    setPreview(null); setManualMode(false); setName(''); setErr('');\n    onClear();",
    'clear manualMode'
  );

  const oldReview = `      {preview && <div className="ins-scan-review">
        <div className="ins-scan-compare">
          <figure><figcaption>Original</figcaption><img src={preview.original} alt="Original sin modificar" /></figure>
          <figure><figcaption>Ajustada</figcaption><img src={preview.normalized} alt="Copia normalizada" /></figure>
        </div>
        <ScannerQuality preview={preview}/>
        <div className="ins-scan-actions">
          <button type="button" className="ins-btn ghost compact" onClick={()=>setPreview(null)}>Tomar/elegir otra</button>
          <button type="button" className="ins-btn primary compact" onClick={acceptPreview} disabled={preview.requiresRetake}>Usar esta foto</button>
        </div>
      </div>}`;

  const newReview = `      {preview && <div className="ins-scan-review">
        {!manualMode && <>
          <div className="ins-scan-compare">
            <figure><figcaption>Original</figcaption><img src={preview.original} alt="Original sin modificar" /></figure>
            <figure><figcaption>Ajustada</figcaption><img src={preview.normalized} alt="Copia normalizada" /></figure>
          </div>
          <ScannerQuality preview={preview}/>
          <div className="ins-scan-actions">
            <button type="button" className="ins-btn ghost compact" onClick={()=>{setPreview(null);setManualMode(false);}}>Tomar/elegir otra</button>
            <button type="button" className="ins-btn ghost compact" onClick={()=>setManualMode(true)}>Ajustar esquinas</button>
            <button type="button" className="ins-btn primary compact" onClick={acceptPreview} disabled={preview.requiresRetake}>Usar esta foto</button>
          </div>
        </>}
        {manualMode && <ManualCornerEditor src={preview.original} onApply={applyManual} onCancel={()=>setManualMode(false)}/>} 
      </div>}`;

  jsx = once(jsx, oldReview, newReview, 'review con ajuste manual');
}

const cssMarker = '/* CS21A146 · ajuste manual de cuatro esquinas */';
if (!css.includes(cssMarker)) {
  css += `\n\n${cssMarker}\n` + [
    '.ins-manual-crop{margin-top:14px;padding:12px;border:1px solid var(--line);border-radius:14px;background:#f8fafc}',
    '.ins-manual-help{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}',
    '.ins-manual-help span{font-size:12px;color:var(--muted)}',
    '.ins-corner-stage{position:relative;width:100%;overflow:hidden;border-radius:12px;background:#111;touch-action:none;user-select:none}',
    '.ins-corner-stage>img{display:block;width:100%;height:auto;max-height:none;object-fit:contain;pointer-events:none}',
    '.ins-corner-polygon{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}',
    '.ins-corner-polygon polygon{fill:rgba(37,99,235,.12);stroke:#2563eb;stroke-width:.8;vector-effect:non-scaling-stroke}',
    '.ins-corner-handle{position:absolute;transform:translate(-50%,-50%);width:34px;height:34px;border-radius:50%;border:3px solid #fff;background:#2563eb;color:#fff;font-weight:800;box-shadow:0 2px 10px rgba(0,0,0,.35);touch-action:none;cursor:grab}',
    '.ins-corner-handle:active{cursor:grabbing;transform:translate(-50%,-50%) scale(1.08)}',
    '@media(max-width:640px){.ins-corner-handle{width:40px;height:40px}.ins-manual-crop{padding:10px}}'
  ].join('\n');
}

fs.writeFileSync(scannerPath, scanner, 'utf8');
fs.writeFileSync(jsxPath, jsx, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8');

console.log('=== CS21A146 · MANUAL CORNERS ===');
console.log('PASS normalizeWithCorners agregado al scanner');
console.log('PASS editor táctil de 4 esquinas agregado al frontend');
console.log('PASS originales permanecen inmutables');
console.log('PASS el recorte manual solo genera una copia derivada');
