import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const jsxPath = path.join(root, 'src', 'inscripcion.jsx');
const cssPath = path.join(root, 'styles', 'inscripcion.css');
const htmlPath = path.join(root, 'inscripcion.html');

let jsx = fs.readFileSync(jsxPath, 'utf8').replace(/\r\n/g, '\n');
let css = fs.readFileSync(cssPath, 'utf8').replace(/\r\n/g, '\n');
let html = fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');

function once(text, oldText, newText, label) {
  const first = text.indexOf(oldText);
  if (first < 0) throw new Error(`No encontré preimagen exacta: ${label}`);
  if (text.indexOf(oldText, first + oldText.length) >= 0) throw new Error(`Preimagen duplicada: ${label}`);
  return text.slice(0, first) + newText + text.slice(first + oldText.length);
}

function blockOnce(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  if (start < 0) throw new Error(`No encontré inicio de bloque: ${label}`);
  if (text.indexOf(startMarker, start + startMarker.length) >= 0) throw new Error(`Inicio de bloque duplicado: ${label}`);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (end < 0) throw new Error(`No encontré fin de bloque: ${label}`);
  return text.slice(0, start) + replacement + text.slice(end);
}

jsx = once(jsx, "const INS_VERSION = 'F98.4-Z6-IP3J';", "const INS_VERSION = 'F98.4-Z6-IP4A';", 'INS_VERSION');

const newUploader = [
  'function FilePhoto({label, value, onChange, hint}){',
  '  const [busy,setBusy]=React.useState(false);',
  "  const [name,setName]=React.useState('');",
  "  const [err,setErr]=React.useState('');",
  '  const cameraRef=React.useRef(null);',
  '  const fileRef=React.useRef(null);',
  '  async function handleFile(file){',
  "    setErr(''); setName('');",
  '    if(!file) return;',
  "    const mime = String(file.type || '').toLowerCase();",
  "    if(!/^image\\//.test(mime)){ setErr('Subí una imagen JPG, PNG, GIF o WebP.'); return; }",
  "    if(file.size > 7 * 1024 * 1024){ setErr('La imagen supera 7 MB.'); return; }",
  '    setBusy(true);',
  '    try{',
  '      const data = await resizeImage(file, 1400, .78);',
  "      onChange(data); setName(file.name || 'foto lista');",
  "    }catch(e){ setErr(e.message || 'No se pudo procesar la imagen.'); }",
  '    finally{ setBusy(false); }',
  '  }',
  "  function clear(){ onChange(''); setName(''); setErr(''); }",
  "  return <div className={`ins-upload ${value?'has-file':''}`}>",
  '    <div className="ins-upload-body">',
  "      <span>{value ? 'Documento cargado' : label}</span>",
  "      <small>{busy?'Procesando imagen…':(name || hint || 'JPG/PNG/GIF/WebP')}</small>",
  '      {!value && <div className="ins-upload-choices">',
  '        <button type="button" className="ins-upload-choice" onClick={()=>cameraRef.current?.click()} disabled={busy}>📷 Tomar foto</button>',
  '        <button type="button" className="ins-upload-choice" onClick={()=>fileRef.current?.click()} disabled={busy}>📁 Subir archivo</button>',
  '      </div>}',
  '    </div>',
  '    <input ref={cameraRef} className="ins-file-hidden" type="file" accept="image/*" capture="environment" onChange={e=>{handleFile(e.target.files && e.target.files[0]); e.target.value=\'\';}} />',
  '    <input ref={fileRef} className="ins-file-hidden" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e=>{handleFile(e.target.files && e.target.files[0]); e.target.value=\'\';}} />',
  '    {value && <button type="button" className="ins-upload-remove" onClick={clear}>Quitar</button>}',
  '    {err && <em>{err}</em>}',
  '  </div>;',
  '}'
].join('\n');

jsx = blockOnce(
  jsx,
  'function FilePhoto({label, value, onChange, hint}){',
  '\n\nfunction resizeImage(',
  newUploader,
  'FilePhoto selector cámara/archivo'
);

jsx = blockOnce(
  jsx,
  '    <div className="ins-group-toolbar">',
  '    {loading &&',
  '',
  'toolbar redundante Curso/Actualizar horarios'
);

const newDocs = [
  'function DocsStep({form,setForm,setStep}){',
  "  const [err,setErr]=React.useState('');",
  '  function next(){',
  '    const missing=[];',
  "    if(!form.foto_ced_frente) missing.push('foto de cédula frente');",
  "    if(!form.foto_ced_dorso) missing.push('foto de cédula dorso');",
  "    if(!form.foto_titulo) missing.push('foto de título o último grado');",
  "    if(missing.length){ setErr('No podés continuar sin cargar: ' + missing.join(', ') + '.'); return; }",
  "    setErr(''); setStep(5);",
  '  }',
  '  return <section className="ins-card ins-step-card">',
  '    <div className="ins-card-head"><span>Paso 5</span><h2>Documentación importante</h2><p>Podés tomar las fotos en el momento o elegir imágenes que ya tengas guardadas en el teléfono.</p></div>',
  '    <div className="ins-doc-panel">',
  "      <div className=\"ins-doc-panel-head\"><span>Documento de identidad del solicitante</span><strong>{form.foto_ced_frente && form.foto_ced_dorso ? '✓ Listo' : 'Obligatorio'}</strong></div>",
  '      <p>Conservamos las imágenes originales del frente y dorso. Cuando estén las dos, el sistema generará además un único PDF de una página para CONAPE.</p>',
  '      <div className="ins-id-sides">',
  '        <FilePhoto label="Cédula · frente" value={form.foto_ced_frente} onChange={v=>setForm({foto_ced_frente:v})} hint="Tomá una foto o elegí un JPG/PNG guardado" />',
  '        <FilePhoto label="Cédula · dorso" value={form.foto_ced_dorso} onChange={v=>setForm({foto_ced_dorso:v})} hint="Tomá una foto o elegí un JPG/PNG guardado" />',
  '      </div>',
  '    </div>',
  '    <div className="ins-doc-panel">',
  "      <div className=\"ins-doc-panel-head\"><span>Título / último grado</span><strong>{form.foto_titulo ? '✓ Listo' : 'Obligatorio'}</strong></div>",
  '      <p>Podés tomar una foto o elegir una imagen guardada.</p>',
  '      <FilePhoto label="Título / último grado" value={form.foto_titulo} onChange={v=>setForm({foto_titulo:v})} hint="Tomá una foto o elegí una imagen" />',
  '    </div>',
  '    <Alert>Las fotos JPG/PNG siguen siendo los documentos originales. El PDF de identidad será un archivo adicional generado automáticamente con frente + dorso.</Alert>',
  '    {err && <Alert type="error">{err}</Alert>}',
  '    <div className="ins-actions"><button type="button" className="ins-btn ghost" onClick={()=>setStep(3)}>Atrás</button><button type="button" className="ins-btn primary" onClick={next}>Ver resumen</button></div>',
  '  </section>;',
  '}'
].join('\n');

jsx = blockOnce(
  jsx,
  'function DocsStep({form,setForm,setStep}){',
  '\n\nfunction SummaryRow(',
  newDocs,
  'DocsStep documentos CONAPE'
);

jsx = once(
  jsx,
  "        origen_web: 'INSCRIPCION_PUBLICA_IP3J',",
  "        origen_web: 'INSCRIPCION_PUBLICA_IP4A',\n        generar_pdf_identidad_conape: true,",
  'origen + flag backend'
);

html = once(html, 'styles/inscripcion.css?v=F98.4Z6IP3J', 'styles/inscripcion.css?v=F98.4Z6IP4A', 'cache CSS');
html = once(html, 'src/inscripcion.jsx?v=F98.4Z6IP3J', 'src/inscripcion.jsx?v=F98.4Z6IP4A', 'cache JSX');

const cssMarker = '/* CS21A144 · selector cámara/archivo + PDF identidad generado */';
if (css.includes(cssMarker)) throw new Error('CSS CS21A144 ya aplicado.');
css += '\n\n' + cssMarker + '\n' + [
  '.ins-doc-panel{margin:14px 0 18px;padding:18px;border:1px solid var(--line);border-radius:24px;background:var(--surface-2)}',
  '.ins-doc-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}',
  '.ins-doc-panel-head span{font-size:16px;font-weight:800;color:var(--an-navy-ink)}',
  '.ins-doc-panel-head strong{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--an-navy);background:var(--info-bg);padding:6px 9px;border-radius:999px}',
  '.ins-doc-panel>p{margin:0 0 14px;color:var(--ink-3);font-size:13px;line-height:1.55}',
  '.ins-id-sides{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}',
  '.ins-upload{padding:18px;min-height:154px;gap:10px}',
  '.ins-upload-body{display:flex;flex:1;flex-direction:column;justify-content:center;align-items:center;gap:8px;text-align:center}',
  '.ins-upload-body:before{content:"📄";font-size:30px}',
  '.ins-upload-body>span{font-weight:800;color:var(--an-navy-ink)}',
  '.ins-upload-body>small{color:var(--ink-3);line-height:1.45}',
  '.ins-upload-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%;margin-top:6px}',
  '.ins-upload .ins-upload-choice{border:1px solid var(--line-2);background:#fff;color:var(--an-navy-ink);border-radius:13px;padding:10px 9px;font-size:12px;font-weight:800}',
  '.ins-upload .ins-upload-choice:hover{border-color:rgba(0,47,108,.4);background:var(--info-bg)}',
  '.ins-upload .ins-upload-remove{border:0;border-radius:12px;background:rgba(0,0,0,.06);padding:9px;font-weight:800;color:var(--ink-2)}',
  '.ins-file-hidden{display:none!important}',
  '@media (max-width:760px){.ins-id-sides{grid-template-columns:1fr}.ins-upload-choices{grid-template-columns:1fr}.ins-doc-panel{padding:14px}.ins-doc-panel-head{align-items:flex-start}}'
].join('\n') + '\n';

if (jsx.includes('Ahora escogé uno de los horarios disponibles.')) throw new Error('Sigue el texto eliminado de Paso 2.');
if (jsx.includes('>Actualizar horarios</button>')) throw new Error('Sigue el botón Actualizar horarios.');
if (!jsx.includes("title:'Curso intensivo'")) throw new Error('Se eliminó por error la tarjeta Curso intensivo.');
if (!jsx.includes('📷 Tomar foto') || !jsx.includes('📁 Subir archivo')) throw new Error('Faltan opciones explícitas de carga.');
if (!jsx.includes('type="file" accept="image/*" capture="environment"')) throw new Error('Falta input de cámara dedicado.');
if (!jsx.includes('accept="image/jpeg,image/png,image/gif,image/webp"')) throw new Error('Falta input de archivo de imagen sin capture.');
if (jsx.includes('documento_identidad_pdf')) throw new Error('No debe existir reemplazo manual PDF en frontend.');
if (!jsx.includes('generar_pdf_identidad_conape: true')) throw new Error('Falta flag para PDF adicional.');
if (!html.includes('F98.4Z6IP4A')) throw new Error('Cache-buster no actualizado.');

fs.writeFileSync(jsxPath, jsx, 'utf8');
fs.writeFileSync(cssPath, css, 'utf8');
fs.writeFileSync(htmlPath, html, 'utf8');

console.log('=== CS21A144 · INSCRIPCIÓN DOCUMENTOS CONAPE ===');
console.log('PASS aplicador estructural independiente de CRLF/template literal');
console.log('PASS Paso 2: toolbar redundante eliminado; tarjeta Curso intensivo preservada');
console.log('PASS Paso 5: Tomar foto / Subir archivo antes de abrir cámara');
console.log('PASS imágenes frente+dorso preservadas como entrada obligatoria');
console.log('PASS PDF identidad definido como salida adicional generada por backend');
console.log('PASS cache-buster IP4A');
console.log('Archivos modificados: src/inscripcion.jsx, styles/inscripcion.css, inscripcion.html');
