import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const qaDir=path.join(root,'qa');
fs.mkdirSync(qaDir,{recursive:true});

const html=`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>QA Scanner Manual CS21A146</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f4f6f9;color:#172033}main{max-width:980px;margin:auto;padding:20px}.intro,.card{background:#fff;border:1px solid #d8dee8;border-radius:16px;padding:16px;margin-bottom:16px}.intro{background:#eaf4ff}.compare{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}figure{margin:0;background:#f7f8fa;padding:10px;border-radius:12px}figcaption{font-weight:800;margin-bottom:8px}img{display:block;width:100%;height:auto;object-fit:contain}.result{margin-top:12px;padding:12px;border-radius:12px;background:#f3f5f7;line-height:1.45}.pass{background:#e8f7ed;border:1px solid #a7d7b4}.fail{background:#fff0ee;border:1px solid #e5aaa3}.warn{background:#fff8dd;border:1px solid #e4ce7e}button{padding:10px 14px;border:0;border-radius:10px;font-weight:700;cursor:pointer}.primary{background:#2563eb;color:#fff}.secondary{background:#e7edf7;color:#172033}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.manual{margin-top:14px;padding:12px;border:1px solid #cdd8e6;border-radius:14px;background:#f8fafc}.stage{position:relative;width:100%;overflow:hidden;border-radius:12px;background:#111;touch-action:none;user-select:none}.stage>img{width:100%;pointer-events:none}.poly{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.poly polygon{fill:rgba(37,99,235,.12);stroke:#2563eb;stroke-width:.8;vector-effect:non-scaling-stroke}.handle{position:absolute;transform:translate(-50%,-50%);width:38px;height:38px;border-radius:50%;border:3px solid #fff;background:#2563eb;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.35);touch-action:none;padding:0}.muted{color:#667085;font-size:13px}@media(max-width:700px){.compare{grid-template-columns:1fr}main{padding:12px}.handle{width:42px;height:42px}}
</style>
</head>
<body><main>
<h1>Document Scanner Academia · QA manual</h1>
<div class="intro"><strong>LABORATORIO LOCAL.</strong><br>El documento no se envía a Apps Script ni Drive. Si el automático falla, podés mover cuatro puntos y generar una copia recortada sin alterar el original.</div>
<div class="card">
<h2>Cédula / documento de identidad</h2>
<input id="file" type="file" accept="image/jpeg,image/png,image/webp">
<div id="out"></div>
</div>
</main>
<script src="https://docs.opencv.org/4.10.0/opencv.js"></script>
<script src="../src/document-scanner.js"></script>
<script>
const out=document.getElementById('out');
let current=null;
let points=[{x:.16,y:.20},{x:.84,y:.20},{x:.84,y:.80},{x:.16,y:.80}];
let dragging=-1;
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function qualityHtml(r){const tone=r.requiresRetake?'fail':(r.score>=80?'pass':'warn');return '<div class="result '+tone+'"><strong>Calidad: '+r.score+'/100</strong><br>Bordes detectados: '+(r.detected?'SÍ':'NO')+'<br>Método: '+esc(r.detectionMethod||'none')+'<br>Resolución normalizada: '+r.width+' × '+r.height+'<br>Repetir foto: '+(r.requiresRetake?'SÍ':'NO')+(r.warnings||[]).map(w=>'<div>• '+esc(w)+'</div>').join('')+'</div>'}
function renderResult(r){current=r;out.innerHTML='<div class="compare"><figure><figcaption>ORIGINAL</figcaption><img src="'+r.original+'"></figure><figure><figcaption>COPIA NORMALIZADA</figcaption><img src="'+r.normalized+'"></figure></div>'+qualityHtml(r)+'<div class="actions"><button class="secondary" id="manualBtn">Ajustar 4 esquinas</button></div>';document.getElementById('manualBtn').onclick=renderManual}
function renderManual(){if(!current)return;out.innerHTML='<div class="manual"><strong>Ajustá las cuatro esquinas</strong><div class="muted">Mové los puntos 1–4 exactamente hasta las esquinas reales del documento.</div><div id="stage" class="stage"><img src="'+current.original+'"><svg class="poly" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon id="polygon"></polygon></svg><div id="handles"></div></div><div class="actions"><button class="secondary" id="cancelBtn">Cancelar</button><button class="primary" id="applyBtn">Aplicar recorte</button></div></div>';const stage=document.getElementById('stage');const handles=document.getElementById('handles');const poly=document.getElementById('polygon');function draw(){poly.setAttribute('points',points.map(p=>(p.x*100)+','+(p.y*100)).join(' '));handles.innerHTML='';points.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='handle';b.textContent=String(i+1);b.style.left=(p.x*100)+'%';b.style.top=(p.y*100)+'%';b.onpointerdown=e=>{e.preventDefault();dragging=i;try{stage.setPointerCapture(e.pointerId)}catch(_){}};handles.appendChild(b)})}function pos(e){const rect=stage.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-rect.left)/Math.max(1,rect.width))),y:Math.max(0,Math.min(1,(e.clientY-rect.top)/Math.max(1,rect.height)))}}stage.onpointermove=e=>{if(dragging<0)return;e.preventDefault();points[dragging]=pos(e);draw()};stage.onpointerup=stage.onpointercancel=()=>{dragging=-1};draw();document.getElementById('cancelBtn').onclick=()=>renderResult(current);document.getElementById('applyBtn').onclick=async()=>{document.getElementById('applyBtn').disabled=true;try{const adjusted=await window.ANDocumentScanner.normalizeWithCorners(current.original,points,'identity');renderResult({...current,...adjusted,original:current.original})}catch(e){alert(e.message||e)}}}
document.getElementById('file').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;out.innerHTML='<div class="result warn">Procesando…</div>';try{const r=await window.ANDocumentScanner.processFile(file,{kind:'identity'});renderResult(r)}catch(err){out.innerHTML='<div class="result fail">'+esc(err.message||err)+'</div>'}})
</script></body></html>`;

const server=`import http from 'node:http';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport {fileURLToPath} from 'node:url';\nconst here=path.dirname(fileURLToPath(import.meta.url));\nconst root=path.resolve(here,'..');\nconst host='127.0.0.1',port=4173;\nconst mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};\nhttp.createServer((req,res)=>{const u=new URL(req.url,'http://'+host+':'+port);let rel=decodeURIComponent(u.pathname);if(rel==='/')rel='/qa/document-scanner-local.html';const file=path.resolve(root,'.'+rel);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end('Forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('404');return}res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)})}).listen(port,host,()=>{console.log('QA Scanner listo: http://'+host+':'+port+'/qa/document-scanner-local.html');console.log('Sin Apps Script · sin Drive · sin PROD')});\n`;

fs.writeFileSync(path.join(qaDir,'document-scanner-local.html'),html,'utf8');
fs.writeFileSync(path.join(qaDir,'serve-scanner-local.mjs'),server,'utf8');
console.log('PASS laboratorio local CS21A146 escrito');
console.log('URL http://127.0.0.1:4173/qa/document-scanner-local.html');
