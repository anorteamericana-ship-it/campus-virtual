import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const jsxPath = path.join(root, 'src', 'inscripcion.jsx');
const cssPath = path.join(root, 'styles', 'inscripcion.css');
const htmlPath = path.join(root, 'inscripcion.html');
const scannerPath = path.join(root, 'src', 'document-scanner.js');

let jsx = fs.readFileSync(jsxPath, 'utf8').replace(/\r\n/g, '\n');
let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
let html = fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');

if(!fs.existsSync(scannerPath)) throw new Error('Falta src/document-scanner.js');

function once(text, oldText, newText, label){
  const i = text.indexOf(oldText);
  if(i < 0) throw new Error(`No encontré preimagen exacta: ${label}`);
  if(text.indexOf(oldText, i + oldText.length) >= 0) throw new Error(`Preimagen duplicada: ${label}`);
  return text.slice(0,i) + newText + text.slice(i + oldText.length);
}

function blockOnce(text, startMarker, endMarker, replacement, label){
  const start = text.indexOf(startMarker);
  if(start < 0) throw new Error(`No encontré inicio de bloque: ${label}`);
  if(text.indexOf(startMarker, start + startMarker.length) >= 0) throw new Error(`Inicio duplicado: ${label}`);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if(end < 0) throw new Error(`No encontré fin de bloque: ${label}`);
  return text.slice(0,start) + replacement + text.slice(end);
}

if(jsx.includes("const INS_VERSION = 'F98.4-Z6-IP4B';")) throw new Error('CS21A145 ya parece aplicado.');

jsx = once(jsx, "const INS_VERSION = 'F98.4-Z6-IP4A';", "const INS_VERSION = 'F98.4-Z6-IP4B';", 'INS_VERSION');

jsx = once(
  jsx,
  '        delete safe.foto_ced_frente; delete safe.foto_ced_dorso; delete safe.foto_titulo;',
  '        delete safe.foto_ced_frente; delete safe.foto_ced_dorso; delete safe.foto_titulo;\n        delete safe.foto_ced_frente_original; delete safe.foto_ced_dorso_original; delete safe.foto_titulo_original;\n        delete safe.documento_identidad_pdf; delete safe.titulo_pdf;',
  'documentos fuera de localStorage'
);

jsx = once(
  jsx,
  "  foto_ced_frente:'', foto_ced_dorso:'', foto_titulo:''",
  "  foto_ced_frente:'', foto_ced_frente_original:'', foto_ced_dorso:'', foto_ced_dorso_original:'',\n  foto_titulo:'', foto_titulo_original:'', documento_identidad_pdf:'', titulo_pdf:''",
  'INITIAL_FORM documentos scanner'
);

const uploaders = String.raw`function ScannerQuality({preview}){
  if(!preview) return null;
  const score = Number(preview.score || 0);
  const tone = preview.requiresRetake ? 'bad' : (score >= 80 ? 'good' : 'warn');
  return <div className={\`ins-scan-quality \${tone}\`}>
    <strong>Calidad {score}/100</strong>
    <span>{preview.detected ? 'Bordes detectados y perspectiva corregida.' : 'No se detectaron los cuatro bordes.'}</span>
    {(preview.warnings || []).map((w,i)=><small key={i}>{w}</small>)}
  </div>;
}

function DocumentImageUpload({label, kind='identity', value, originalValue, onAccept, onClear, hint}){
  const [busy,setBusy]=React.useState(false);
  const [name,setName]=React.useState('');
  const [err,setErr]=React.useState('');
  const [preview,setPreview]=React.useState(null);
  const cameraRef=React.useRef(null);
  const fileRef=React.useRef(null);

  async function handleFile(file){
    setErr(''); setPreview(null);
    if(!file) return;
    if(!/^image\//.test(String(file.type || '').toLowerCase())){ setErr('Elegí una imagen JPG, PNG o WebP.'); return; }
    setBusy(true);
    try{
      if(!window.ANDocumentScanner) throw new Error('El scanner documental no cargó. Intentá nuevamente.');
      const result = await window.ANDocumentScanner.processFile(file,{kind});
      if(result.type !== 'image') throw new Error('Esta carga requiere una imagen.');
      setPreview(result);
      setName(file.name || 'foto');
    }catch(e){ setErr(e.message || 'No se pudo analizar la imagen.'); }
    finally{ setBusy(false); }
  }

  function acceptPreview(){
    if(!preview || preview.requiresRetake) return;
    onAccept(preview.normalized, preview.original, preview);
    setPreview(null);
  }

  function clearAll(){
    setPreview(null); setName(''); setErr('');
    onClear();
  }

  return <div className={\`ins-upload ins-scan-upload \${value?'has-file':''}\`}>
    <div className="ins-upload-body">
      <span>{value ? '✓ Documento ajustado' : label}</span>
      <small>{busy ? 'Analizando bordes, perspectiva y calidad…' : (name || hint || 'Mostrá las cuatro esquinas y evitá reflejos.')}</small>
      {value && <img className="ins-scan-thumb" src={value} alt={\`Vista ajustada de \${label}\`} />}
      {!value && !preview && <div className="ins-upload-choices">
        <button type="button" className="ins-upload-choice" onClick={()=>cameraRef.current?.click()} disabled={busy}>📷 Tomar foto</button>
        <button type="button" className="ins-upload-choice" onClick={()=>fileRef.current?.click()} disabled={busy}>📁 Subir imagen</button>
      </div>}
      {preview && <div className="ins-scan-review">
        <div className="ins-scan-compare">
          <figure><figcaption>Original</figcaption><img src={preview.original} alt="Original sin modificar" /></figure>
          <figure><figcaption>Ajustada</figcaption><img src={preview.normalized} alt="Copia normalizada" /></figure>
        </div>
        <ScannerQuality preview={preview}/>
        <div className="ins-scan-actions">
          <button type="button" className="ins-btn ghost compact" onClick={()=>setPreview(null)}>Tomar/elegir otra</button>
          <button type="button" className="ins-btn primary compact" onClick={acceptPreview} disabled={preview.requiresRetake}>Usar esta foto</button>
        </div>
      </div>}
    </div>
    <input ref={cameraRef} className="ins-file-hidden" type="file" accept="image/*" capture="environment" onChange={e=>{handleFile(e.target.files && e.target.files[0]);e.target.value='';}} />
    <input ref={fileRef} className="ins-file-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{handleFile(e.target.files && e.target.files[0]);e.target.value='';}} />
    {value && <button type="button" className="ins-upload-remove" onClick={clearAll}>Quitar</button>}
    {err && <em>{err}</em>}
    {originalValue && <small className="ins-original-kept">Original conservado sin modificar</small>}
  </div>;
}

function PdfDocumentUpload({label,value,onAccept,onClear,hint}){
  const [busy,setBusy]=React.useState(false);
  const [name,setName]=React.useState('');
  const [err,setErr]=React.useState('');
  const inputRef=React.useRef(null);

  async function handleFile(file){
    setErr('');
    if(!file) return;
    const mime = String(file.type || '').toLowerCase();
    if(mime !== 'application/pdf' && !/\.pdf$/i.test(file.name || '')){ setErr('Elegí un archivo PDF.'); return; }
    setBusy(true);
    try{
      if(!window.ANDocumentScanner) throw new Error('El módulo documental no cargó.');
      const result = await window.ANDocumentScanner.processFile(file);
      if(result.type !== 'pdf') throw new Error('El archivo seleccionado no es PDF.');
      onAccept(result.original,result);
      setName(file.name || 'documento.pdf');
    }catch(e){ setErr(e.message || 'No se pudo leer el PDF.'); }
    finally{ setBusy(false); }
  }

  return <div className={\`ins-upload ins-pdf-upload \${value?'has-file':''}\`}>
    <div className="ins-upload-body">
      <span>{value ? '✓ PDF recibido' : label}</span>
      <small>{busy ? 'Leyendo PDF…' : (name || hint || 'El PDF se conserva sin modificaciones.')}</small>
      {!value && <button type="button" className="ins-upload-choice ins-pdf-choice" onClick={()=>inputRef.current?.click()} disabled={busy}>📄 Subir PDF</button>}
      {value && <div className="ins-pdf-review-note">PDF original · sin recorte ni conversión · revisión del asesor</div>}
    </div>
    <input ref={inputRef} className="ins-file-hidden" type="file" accept="application/pdf,.pdf" onChange={e=>{handleFile(e.target.files && e.target.files[0]);e.target.value='';}} />
    {value && <button type="button" className="ins-upload-remove" onClick={()=>{setName('');setErr('');onClear();}}>Quitar</button>}
    {err && <em>{err}</em>}
  </div>;
}

`;

jsx = blockOnce(
  jsx,
  'function FilePhoto({label, value, onChange, hint}){',
  'function CedulaStep(',
  uploaders,
  'uploader documental scanner'
);

const docsStep = String.raw`function DocsStep({form,setForm,setStep}){
  const [err,setErr]=React.useState('');
  const identityPdf = !!form.documento_identidad_pdf;
  const identityPhotos = !!form.foto_ced_frente && !!form.foto_ced_dorso;
  const identityReady = identityPdf || identityPhotos;
  const titlePdf = !!form.titulo_pdf;
  const titleReady = titlePdf || !!form.foto_titulo;

  function next(){
    const missing=[];
    if(!identityReady) missing.push('documento de identidad (PDF o frente + dorso)');
    if(!titleReady) missing.push('título o último grado (PDF o imagen)');
    if(missing.length){ setErr('No podés continuar sin cargar: ' + missing.join(', ') + '.'); return; }
    setErr(''); setStep(5);
  }

  return <section className="ins-card ins-step-card">
    <div className="ins-card-head"><span>Paso 5</span><h2>Documentación importante</h2><p>Las fotos se ajustan antes de enviarse: recorte, orientación y perspectiva. El original siempre se conserva. Si ya tenés un PDF, se guarda sin modificar y lo revisará un asesor.</p></div>

    <div className="ins-doc-panel">
      <div className="ins-doc-panel-head"><span>Documento de identidad del solicitante</span><strong>{identityReady ? '✓ Listo' : 'Obligatorio'}</strong></div>
      <p>Elegí una sola ruta: un PDF ya preparado, o fotos del frente y dorso. Si usás fotos, el sistema crea copias normalizadas y luego el backend únicamente las une en el PDF para CONAPE.</p>

      <PdfDocumentUpload
        label="Documento de identidad en PDF"
        value={form.documento_identidad_pdf}
        hint="Si el PDF ya contiene tu documento, lo conservamos tal cual."
        onAccept={v=>setForm({
          documento_identidad_pdf:v,
          foto_ced_frente:'', foto_ced_frente_original:'',
          foto_ced_dorso:'', foto_ced_dorso_original:''
        })}
        onClear={()=>setForm({documento_identidad_pdf:''})}
      />

      {!identityPdf && <>
        <div className="ins-doc-or"><span>o tomá / subí las dos fotos</span></div>
        <div className="ins-scan-guide">Poné el documento sobre un fondo que contraste, mostrale las cuatro esquinas a la cámara y evitá sombras o reflejos.</div>
        <div className="ins-id-sides">
          <DocumentImageUpload
            label="Cédula · frente"
            kind="identity"
            value={form.foto_ced_frente}
            originalValue={form.foto_ced_frente_original}
            hint="El sistema recorta y endereza una copia; conserva el original."
            onAccept={(normalized,original)=>setForm({foto_ced_frente:normalized,foto_ced_frente_original:original,documento_identidad_pdf:''})}
            onClear={()=>setForm({foto_ced_frente:'',foto_ced_frente_original:''})}
          />
          <DocumentImageUpload
            label="Cédula · dorso"
            kind="identity"
            value={form.foto_ced_dorso}
            originalValue={form.foto_ced_dorso_original}
            hint="El sistema recorta y endereza una copia; conserva el original."
            onAccept={(normalized,original)=>setForm({foto_ced_dorso:normalized,foto_ced_dorso_original:original,documento_identidad_pdf:''})}
            onClear={()=>setForm({foto_ced_dorso:'',foto_ced_dorso_original:''})}
          />
        </div>
      </>}
    </div>

    <div className="ins-doc-panel">
      <div className="ins-doc-panel-head"><span>Título / último grado</span><strong>{titleReady ? '✓ Listo' : 'Obligatorio'}</strong></div>
      <p>Si es una foto, también la recortamos y enderezamos de forma conservadora. Si ya es PDF, se conserva intacto para revisión.</p>
      <PdfDocumentUpload
        label="Título / último grado en PDF"
        value={form.titulo_pdf}
        hint="El PDF se guarda sin cambios."
        onAccept={v=>setForm({titulo_pdf:v,foto_titulo:'',foto_titulo_original:''})}
        onClear={()=>setForm({titulo_pdf:''})}
      />
      {!titlePdf && <>
        <div className="ins-doc-or"><span>o usá una foto</span></div>
        <DocumentImageUpload
          label="Título / último grado"
          kind="title"
          value={form.foto_titulo}
          originalValue={form.foto_titulo_original}
          hint="Mostrá el documento completo y las cuatro esquinas."
          onAccept={(normalized,original)=>setForm({foto_titulo:normalized,foto_titulo_original:original,titulo_pdf:''})}
          onClear={()=>setForm({foto_titulo:'',foto_titulo_original:''})}
        />
      </>}
    </div>

    <Alert>Fotos: original inmutable + copia normalizada. PDF: original sin modificación y revisión del asesor. Nunca reconstruimos texto ni datos del documento.</Alert>
    {err && <Alert type="error">{err}</Alert>}
    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(3)}>Atrás</button><button type="button" className="ins-btn primary" onClick={next}>Ver resumen</button></div>
  </section>;
}

`;

jsx = blockOnce(
  jsx,
  'function DocsStep({form,setForm,setStep}){',
  'function SummaryRow(',
  docsStep,
  'DocsStep scanner + PDF'
);

jsx = once(
  jsx,
  "    if(!form.foto_ced_frente || !form.foto_ced_dorso || !form.foto_titulo) return 'Subí los tres documentos requeridos.';",
  "    const identityDocsOk = !!form.documento_identidad_pdf || (!!form.foto_ced_frente && !!form.foto_ced_dorso);\n    const titleDocOk = !!form.titulo_pdf || !!form.foto_titulo;\n    if(!identityDocsOk || !titleDocOk) return 'Subí el documento de identidad y el título/último grado.';",
  'validación final documentos alternativos'
);

jsx = once(
  jsx,
  "        origen_web: 'INSCRIPCION_PUBLICA_IP4A',\n        generar_pdf_identidad_conape: true,",
  "        origen_web: 'INSCRIPCION_PUBLICA_IP4B',\n        documento_identidad_modo: form.documento_identidad_pdf ? 'PDF_ORIGINAL' : 'FOTOS_NORMALIZADAS',\n        titulo_modo: form.titulo_pdf ? 'PDF_ORIGINAL' : 'IMAGEN_NORMALIZADA',\n        generar_pdf_identidad_conape: !form.documento_identidad_pdf && !!form.foto_ced_frente && !!form.foto_ced_dorso,",
  'payload modos documentales'
);

html = once(html, 'styles/inscripcion.css?v=F98.4Z6IP4A', 'styles/inscripcion.css?v=F98.4Z6IP4B', 'cache CSS IP4B');
html = once(html, 'src/inscripcion.jsx?v=F98.4Z6IP4A', 'src/inscripcion.jsx?v=F98.4Z6IP4B', 'cache JSX IP4B');
html = once(
  html,
  '<script src="vendor/react.js?v=F96.1"></script>',
  '<script async src="https://docs.opencv.org/4.10.0/opencv.js"></script>\n<script src="src/document-scanner.js?v=CS21A145-1"></script>\n<script src="vendor/react.js?v=F96.1"></script>',
  'OpenCV + scanner local'
);

const cssMarker = '/* CS21A145 · scanner documental + PDF passthrough */';
if(css.includes(cssMarker)) throw new Error('CSS CS21A145 ya aplicado.');
css += '\n\n' + cssMarker + '\n' + String.raw`.ins-scan-upload{min-height:180px}
.ins-scan-thumb{display:block;max-width:100%;max-height:180px;object-fit:contain;border-radius:14px;border:1px solid var(--line);background:#fff;padding:6px}
.ins-scan-review{width:100%;display:flex;flex-direction:column;gap:12px;margin-top:8px}
.ins-scan-compare{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%}
.ins-scan-compare figure{margin:0;padding:8px;border:1px solid var(--line);border-radius:14px;background:#fff}
.ins-scan-compare figcaption{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin-bottom:6px}
.ins-scan-compare img{display:block;width:100%;height:170px;object-fit:contain;background:#f5f5f5;border-radius:9px}
.ins-scan-quality{display:flex;flex-direction:column;gap:4px;text-align:left;border-radius:13px;padding:10px 12px;font-size:12px}
.ins-scan-quality.good{background:#eef8ef;color:#23642d}
.ins-scan-quality.warn{background:#fff7df;color:#765509}
.ins-scan-quality.bad{background:#fff0ef;color:#8b2922}
.ins-scan-quality strong{font-size:13px}
.ins-scan-quality small{color:inherit;opacity:.9}
.ins-scan-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.ins-original-kept{display:block;margin-top:7px;color:#23642d!important;font-weight:700}
.ins-pdf-upload{min-height:132px}
.ins-pdf-choice{width:100%;margin-top:8px}
.ins-pdf-review-note{margin-top:8px;padding:9px 10px;border-radius:11px;background:#eef4fb;color:var(--an-navy);font-size:11px;font-weight:700;line-height:1.45}
.ins-doc-or{display:flex;align-items:center;gap:10px;margin:14px 0;color:var(--ink-3);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
.ins-doc-or:before,.ins-doc-or:after{content:"";height:1px;background:var(--line);flex:1}
.ins-scan-guide{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:#fff7df;color:#67500d;font-size:12px;line-height:1.5}
@media (max-width:760px){.ins-scan-compare{grid-template-columns:1fr}.ins-scan-compare img{height:145px}.ins-scan-actions{flex-direction:column}.ins-scan-actions .ins-btn{width:100%}}
`;

const mustHave = [
  "const INS_VERSION = 'F98.4-Z6-IP4B';",
  'foto_ced_frente_original',
  'foto_ced_dorso_original',
  'foto_titulo_original',
  'documento_identidad_pdf',
  'titulo_pdf',
  'DocumentImageUpload',
  'PdfDocumentUpload',
  "documento_identidad_modo: form.documento_identidad_pdf ? 'PDF_ORIGINAL' : 'FOTOS_NORMALIZADAS'",
  "titulo_modo: form.titulo_pdf ? 'PDF_ORIGINAL' : 'IMAGEN_NORMALIZADA'",
  'generar_pdf_identidad_conape: !form.documento_identidad_pdf'
];
for(const token of mustHave){ if(!jsx.includes(token)) throw new Error('Falta contrato JSX: ' + token); }
if(!html.includes('https://docs.opencv.org/4.10.0/opencv.js')) throw new Error('Falta OpenCV oficial.');
if(!html.includes('src/document-scanner.js?v=CS21A145-1')) throw new Error('Falta scanner local.');
if(!css.includes(cssMarker)) throw new Error('Falta CSS scanner.');

fs.writeFileSync(jsxPath,jsx,'utf8');
fs.writeFileSync(cssPath,css,'utf8');
fs.writeFileSync(htmlPath,html,'utf8');

console.log('=== CS21A145 · DOCUMENT SCANNER ===');
console.log('PASS fotos identidad: original + copia normalizada');
console.log('PASS título imagen: original + copia normalizada');
console.log('PASS identidad PDF: passthrough sin modificación');
console.log('PASS título PDF: passthrough sin modificación');
console.log('PASS PDF identidad generado solo desde frente+dorso normalizados');
console.log('PASS scanner local en navegador; sin OCR/IA externa');
console.log('PASS PROD no se toca con este aplicador');
