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
<title>QA · Document Scanner CS21A149</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;background:#f4f6f9;color:#172033}main{max-width:980px;margin:auto;padding:18px}.intro,.card{background:#fff;border:1px solid #d8dee8;border-radius:16px;padding:16px;margin-bottom:16px}.intro{background:#eaf4ff}.grid{display:grid;grid-template-columns:1fr;gap:16px}.doc-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.status{font-size:13px;font-weight:700;padding:6px 10px;border-radius:999px;background:#eef2f7}.status.ready{background:#e8f7ed;color:#176b36}.status.bad{background:#fff0ee;color:#9d2c24}.stage{position:relative;width:100%;overflow:hidden;border-radius:14px;background:#111;touch-action:none;user-select:none;margin-top:14px}.stage>img{display:block;width:100%;height:auto;pointer-events:none}.poly{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.poly polygon{fill:rgba(37,99,235,.12);stroke:#2563eb;stroke-width:.9;vector-effect:non-scaling-stroke}.handle{position:absolute;transform:translate(-50%,-50%);width:42px;height:42px;border-radius:50%;border:3px solid #fff;background:#2563eb;color:#fff;font-weight:800;box-shadow:0 2px 10px rgba(0,0,0,.4);touch-action:none;padding:0}.magnifier{display:none;position:absolute;z-index:8;left:10px;top:10px;width:128px;height:128px;border:3px solid #fff;border-radius:50%;box-shadow:0 4px 16px rgba(0,0,0,.55);background-repeat:no-repeat;pointer-events:none;overflow:hidden}.magnifier.show{display:block}.magnifier:before,.magnifier:after{content:"";position:absolute;background:#111;opacity:.8}.magnifier:before{left:50%;top:12px;bottom:12px;width:1px}.magnifier:after{top:50%;left:12px;right:12px;height:1px}.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}button{padding:10px 14px;border:0;border-radius:10px;font-weight:700;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.primary{background:#2563eb;color:#fff}.secondary{background:#e7edf7;color:#172033}.danger{background:#fff0ee;color:#9d2c24}.result{margin-top:12px;padding:12px;border-radius:12px;line-height:1.45}.pass{background:#e8f7ed;border:1px solid #a7d7b4}.warn{background:#fff8dd;border:1px solid #e4ce7e}.fail{background:#fff0ee;border:1px solid #e5aaa3}.preview{margin-top:14px;border-radius:14px;background:#f7f8fa;padding:12px}.preview img{display:block;width:100%;max-height:460px;object-fit:contain;background:#e5e7eb;border-radius:10px}.muted{color:#667085;font-size:13px}.small{font-size:12px}.confirmed{border:2px solid #4aa568}.confirmed .status{background:#e8f7ed;color:#176b36}.metrics{width:100%;border-collapse:collapse;margin-top:10px;font-size:13px}.metrics td{border-top:1px solid #dde3ec;padding:6px 4px}.metrics td:first-child{font-weight:700;width:45%}.fixture-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}@media(max-width:700px){main{padding:10px}.handle{width:46px;height:46px}.doc-head{align-items:flex-start;flex-direction:column}.magnifier{width:112px;height:112px}}
</style>
</head>
<body><main>
<h1>Document Scanner Academia · CS21A149</h1>
<div class="intro">
<strong>Contrato:</strong> foto fuente temporal en memoria → ajuste de 4 esquinas → corrección de perspectiva → vista final → confirmación → subir una sola imagen final. El recorte manual es nativo y no carga OpenCV.
<div class="fixture-actions"><button class="secondary" id="fixture90">Prueba reproducible 90°</button><button class="secondary" id="fixture180">Prueba reproducible 180°</button></div>
<div class="small">Las pruebas sintéticas cargan una tarjeta con una flecha “ARRIBA”. El scanner no debe enderezarla por su cuenta: usá <b>Rotar 90°</b> una o dos veces y verificá la vista final.</div>
</div>
<div id="engine" class="result pass">Motor manual CS21A149 listo · sin OpenCV · sin red.</div>
<div id="labs" class="grid"></div>
</main>
<script>window.__AN_SCANNER_QA__=true;</script>
<script src="../src/document-scanner.js?v=CS21A149-1"></script>
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
function perfNow(){return performance&&typeof performance.now==='function'?performance.now():Date.now()}
function fmtMs(v){return Number.isFinite(Number(v))?Number(v).toFixed(1)+' ms':'N/A'}
function fmtBytes(v){const n=Number(v);if(!Number.isFinite(n))return'N/A';if(n>=1048576)return(n/1048576).toFixed(2)+' MB';if(n>=1024)return(n/1024).toFixed(1)+' KB';return Math.round(n)+' B'}
function geometryText(code){
  const map={scanner_puntos_cruzados:'Las líneas se cruzarían. Mantené cada punto en su esquina.',scanner_cuadrilatero_no_convexo:'La forma dejó de ser un cuadrilátero convexo.',scanner_geometria_degenerada:'Las esquinas están demasiado juntas o casi alineadas.',scanner_puntos_duplicados:'Dos esquinas están demasiado juntas.',scanner_coordenada_no_finita:'Una coordenada no es válida.',scanner_esquina_fuera_rango:'Una esquina salió fuera de la foto.'};
  return map[code]||'La geometría de las cuatro esquinas no es válida.';
}
function shell(def){
  const el=document.createElement('section');el.className='card';el.id='card_'+def.id;
  el.innerHTML='<div class="doc-head"><h2>'+def.title+'</h2><span class="status" id="st_'+def.id+'">Sin foto</span></div><p class="muted">La foto no se sube todavía. Primero marcá las cuatro esquinas y revisá el resultado.</p><input id="file_'+def.id+'" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"><div id="out_'+def.id+'"></div>';
  labs.appendChild(el);
  document.getElementById('file_'+def.id).addEventListener('change',e=>loadFile(def,e.target.files&&e.target.files[0]));
}
defs.forEach(shell);

async function loadFile(def,file){
  if(!file)return;
  const selectedAt=perfNow();
  const out=document.getElementById('out_'+def.id),st=document.getElementById('st_'+def.id);
  out.innerHTML='<div class="result warn">Leyendo foto…</div>';st.textContent='Ajustando';st.className='status';
  try{
    const source=await window.ANDocumentScanner.readFileDataUrl(file);
    states[def.id]={source,finalImage:'',points:defaults(),kind:def.kind,confirmed:false,rotation:0,editorMs:perfNow()-selectedAt,fixtureDegrees:null};
    renderEditor(def,'Mové los 4 puntos hasta las esquinas reales. No hay autorrotación silenciosa.');
  }catch(e){out.innerHTML='<div class="result fail">'+esc(e.message||e)+'</div>';st.textContent='Error';st.className='status bad'}
}

function renderEditor(def,note){
  const state=states[def.id],out=document.getElementById('out_'+def.id);
  out.innerHTML='<div class="result warn"><strong>Ajustá las 4 esquinas</strong><div class="small">'+esc(note)+'</div><div class="small">Dejá visible todo el borde físico. Si la foto está girada, corregila vos con <b>Rotar 90°</b>.</div></div><div id="geom_'+def.id+'" class="result pass" role="status" aria-live="polite"></div><div id="stage_'+def.id+'" class="stage"><img id="img_'+def.id+'" src="'+state.source+'" alt="Foto fuente temporal"><svg class="poly" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon id="poly_'+def.id+'"></polygon></svg><div id="handles_'+def.id+'"></div><div id="mag_'+def.id+'" class="magnifier" aria-hidden="true"></div></div><div class="actions"><button class="secondary" id="other_'+def.id+'">Elegir otra foto</button><button class="secondary" id="rotate_'+def.id+'">Rotar 90°</button><button class="secondary" id="reset_'+def.id+'">Reiniciar esquinas</button><button class="primary" id="apply_'+def.id+'">Ver recorte final</button></div>';
  const stage=document.getElementById('stage_'+def.id),handles=document.getElementById('handles_'+def.id),poly=document.getElementById('poly_'+def.id),mag=document.getElementById('mag_'+def.id),geom=document.getElementById('geom_'+def.id),apply=document.getElementById('apply_'+def.id);
  let dragging=-1;

  function validation(){return window.ANDocumentScanner.validateQuad(state.points,state.kind)}
  function updateGeometry(extra){
    const v=validation();
    apply.disabled=!v.valid;
    if(!v.valid){geom.className='result fail';geom.textContent=extra||geometryText(v.code);return v}
    if(v.borderRisk){geom.className='result warn';geom.textContent='Posible borde cortado: una esquina está muy cerca del límite de la foto. Verificá que el borde físico completo exista en la toma.';return v}
    geom.className='result pass';geom.textContent=extra||'Geometría válida · cuadrilátero convexo y sin cruces.';return v;
  }
  function showMagnifier(p){
    const zoom=3,size=mag.offsetWidth||128,w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
    mag.style.backgroundImage='url("'+state.source.replace(/"/g,'%22')+'")';
    mag.style.backgroundSize=(w*zoom)+'px '+(h*zoom)+'px';
    mag.style.backgroundPosition=(size/2-p.x*w*zoom)+'px '+(size/2-p.y*h*zoom)+'px';
    mag.classList.add('show');
  }
  function hideMagnifier(){mag.classList.remove('show')}
  function tryMove(index,next){
    const candidate=state.points.map((p,i)=>i===index?next:p);
    const v=window.ANDocumentScanner.validateQuad(candidate,state.kind);
    if(!v.valid){updateGeometry(geometryText(v.code));return false}
    state.points=candidate;return true;
  }
  function draw(){
    poly.setAttribute('points',state.points.map(p=>(p.x*100)+','+(p.y*100)).join(' '));handles.innerHTML='';
    state.points.forEach((p,i)=>{
      const b=document.createElement('button');b.type='button';b.className='handle';b.textContent=String(i+1);b.style.left=(p.x*100)+'%';b.style.top=(p.y*100)+'%';b.setAttribute('aria-label','Esquina '+(i+1)+' de 4');
      b.onpointerdown=e=>{e.preventDefault();dragging=i;showMagnifier(state.points[i]);try{stage.setPointerCapture(e.pointerId)}catch(_){}};
      b.onkeydown=e=>{
        const dirs={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(!dirs[e.key])return;e.preventDefault();const step=e.shiftKey?.02:.005;const d=dirs[e.key],cur=state.points[i];const next={x:Math.max(0,Math.min(1,cur.x+d[0]*step)),y:Math.max(0,Math.min(1,cur.y+d[1]*step))};if(tryMove(i,next)){draw();showMagnifier(state.points[i])}
      };
      handles.appendChild(b);
    });
    updateGeometry();
  }
  function pos(e){const r=stage.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-r.left)/Math.max(1,r.width))),y:Math.max(0,Math.min(1,(e.clientY-r.top)/Math.max(1,r.height)))}}
  stage.onpointermove=e=>{if(dragging<0)return;e.preventDefault();const next=pos(e);if(tryMove(dragging,next)){draw();showMagnifier(state.points[dragging])}};
  stage.onpointerup=stage.onpointercancel=()=>{dragging=-1;hideMagnifier()};
  draw();
  document.getElementById('other_'+def.id).onclick=()=>document.getElementById('file_'+def.id).click();
  document.getElementById('reset_'+def.id).onclick=()=>{state.points=defaults();draw();geom.textContent='Esquinas reiniciadas.'};
  document.getElementById('rotate_'+def.id).onclick=async()=>{
    const btn=document.getElementById('rotate_'+def.id);btn.disabled=true;geom.className='result warn';geom.textContent='Rotando 90°…';
    try{const r=await window.ANDocumentScanner.rotateSource90(state.source);state.source=r.dataUrl;state.rotation=(state.rotation+90)%360;state.points=defaults();state.finalImage='';renderEditor(def,'Rotación manual: '+state.rotation+'°. Revisá nuevamente las cuatro esquinas.');}
    catch(e){geom.className='result fail';geom.textContent=esc(e.message||e);btn.disabled=false}
  };
  apply.onclick=()=>applyCrop(def);
}

function metricsHtml(state,r){
  const m=r.metrics||{},lt=m.longTasks||{};
  return '<table class="metrics"><tr><td>Tiempo hasta editor</td><td>'+fmtMs(state.editorMs)+'</td></tr><tr><td>Tiempo de recorte</td><td>'+fmtMs(m.cropMs)+'</td></tr><tr><td>Long tasks</td><td>'+(lt.supported?(lt.count+' · '+fmtMs(lt.totalMs)+' total'):'N/A en este navegador')+'</td></tr><tr><td>Memoria aproximada</td><td>'+(m.memorySupported?fmtBytes(m.memoryDeltaBytes)+' delta':'N/A en este navegador')+'</td></tr><tr><td>Fuente de trabajo</td><td>'+esc(m.sourceWidth)+' × '+esc(m.sourceHeight)+'</td></tr><tr><td>JPG final</td><td>'+esc(m.outputWidth)+' × '+esc(m.outputHeight)+' · '+fmtBytes(m.jpgBytes)+'</td></tr></table>';
}

async function applyCrop(def){
  const state=states[def.id],out=document.getElementById('out_'+def.id),st=document.getElementById('st_'+def.id);
  out.insertAdjacentHTML('afterbegin','<div id="working_'+def.id+'" class="result warn">Generando vista final…</div>');
  try{
    const r=await window.ANDocumentScanner.normalizeWithCorners(state.source,state.points,state.kind);
    state.finalImage=r.finalImage;state.result=r;state.confirmed=false;
    const tone=r.requiresRetake?'fail':(r.score>=80?'pass':'warn');
    out.innerHTML='<div class="preview"><strong>FOTOGRAFÍA FINAL QUE SE ENVIARÁ</strong><img src="'+r.finalImage+'" alt="Fotografía final"></div><div class="result '+tone+'"><strong>Calidad orientativa '+r.score+'/100</strong><br><span class="small">Umbrales de nitidez/iluminación aún no calibrados; solo la resolución mínima bloquea confirmación en CS21A149.</span><br>Resolución: '+r.width+' × '+r.height+'<br>Repetir foto por resolución: '+(r.requiresRetake?'SÍ':'NO')+(r.warnings||[]).map(w=>'<div>• '+esc(w)+'</div>').join('')+metricsHtml(state,r)+'</div><div class="actions"><button class="secondary" id="adjust_'+def.id+'">Volver a ajustar esquinas</button><button class="danger" id="retake_'+def.id+'">Tomar/elegir otra</button><button class="primary" id="confirm_'+def.id+'" '+(r.requiresRetake?'disabled':'')+'>Subir esta foto</button></div>';
    st.textContent=r.requiresRetake?'Revisar resolución':'Lista para confirmar';st.className='status '+(r.requiresRetake?'bad':'ready');
    document.getElementById('adjust_'+def.id).onclick=()=>renderEditor(def,'Ajustá de nuevo los puntos y conservá todos los bordes.');
    document.getElementById('retake_'+def.id).onclick=()=>document.getElementById('file_'+def.id).click();
    document.getElementById('confirm_'+def.id).onclick=()=>confirmFinal(def);
  }catch(e){out.innerHTML='<div class="result fail"><strong>No se pudo recortar.</strong><br>'+esc(geometryText(String(e.message||e)))+'<br><span class="small">No se genera una imagen parcial cuando la geometría o la homografía son inválidas.</span></div>';st.textContent='Error';st.className='status bad'}
}

function confirmFinal(def){
  const state=states[def.id],out=document.getElementById('out_'+def.id),card=document.getElementById('card_'+def.id),st=document.getElementById('st_'+def.id);
  const finalImage=state.finalImage;
  state.source='';state.points=[];state.confirmed=true;
  card.classList.add('confirmed');st.textContent='Foto final confirmada';st.className='status ready';
  out.innerHTML='<div class="preview"><strong>✓ ESTA ES LA ÚNICA IMAGEN QUE SE SUBIRÁ</strong><img src="'+finalImage+'" alt="Única imagen final"></div><div class="result pass">La foto fuente ya fue descartada del estado. El contrato de producto recibe únicamente esta imagen final ajustada.</div><div class="actions"><button class="secondary" id="replace_'+def.id+'">Reemplazar foto</button></div>';
  document.getElementById('replace_'+def.id).onclick=()=>{card.classList.remove('confirmed');document.getElementById('file_'+def.id).click()};
}

function fixtureBase(){
  const c=document.createElement('canvas');c.width=1000;c.height=640;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.strokeStyle='#111';x.lineWidth=14;x.strokeRect(18,18,c.width-36,c.height-36);x.fillStyle='#111';x.textAlign='center';x.font='bold 66px Arial';x.fillText('ARRIBA ↑',500,110);x.font='bold 42px Arial';x.fillText('DOCUMENTO QA ORIENTACIÓN',500,330);x.font='32px Arial';x.textAlign='left';x.fillText('TL',55,70);x.textAlign='right';x.fillText('TR',945,70);x.textAlign='right';x.fillText('BR',945,590);x.textAlign='left';x.fillText('BL',55,590);return c;
}
function rotateFixture(canvas,degrees){
  let out=canvas;for(let i=0;i<((degrees%360+360)%360)/90;i++){const n=document.createElement('canvas');n.width=out.height;n.height=out.width;const x=n.getContext('2d');x.translate(n.width,0);x.rotate(Math.PI/2);x.drawImage(out,0,0);out=n}return out;
}
function loadFixture(degrees){
  const def=defs[0],source=rotateFixture(fixtureBase(),degrees).toDataURL('image/png');states[def.id]={source,finalImage:'',points:defaults(),kind:def.kind,confirmed:false,rotation:degrees%360,editorMs:0,fixtureDegrees:degrees};document.getElementById('st_'+def.id).textContent='Fixture '+degrees+'°';renderEditor(def,'Fixture reproducible '+degrees+'°. Sin tocar Rotar 90°, la vista final debe conservar esa orientación. Después corregila manualmente.');document.getElementById('card_'+def.id).scrollIntoView({behavior:'smooth',block:'start'});
}
document.getElementById('fixture90').onclick=()=>loadFixture(90);
document.getElementById('fixture180').onclick=()=>loadFixture(180);
</script>
</body></html>`;

const server=`import http from 'node:http';\nimport fs from 'node:fs';\nimport path from 'node:path';\nimport {fileURLToPath} from 'node:url';\nconst here=path.dirname(fileURLToPath(import.meta.url));\nconst root=path.resolve(here,'..');\nconst host='127.0.0.1',port=4173;\nconst mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};\nhttp.createServer((req,res)=>{const u=new URL(req.url,'http://'+host+':'+port);let rel=decodeURIComponent(u.pathname);if(rel==='/')rel='/qa/document-scanner-local.html';const file=path.resolve(root,'.'+rel);const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end('Forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('404');return}res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});res.end(data)})}).listen(port,host,()=>{console.log('QA Scanner listo: http://'+host+':'+port+'/qa/document-scanner-local.html');console.log('CS21A149 · sin Apps Script · sin Drive · sin PROD')});\n`;

fs.writeFileSync(path.join(qaDir,'document-scanner-local.html'),html,'utf8');
fs.writeFileSync(path.join(qaDir,'serve-scanner-local.mjs'),server,'utf8');
console.log('PASS laboratorio local CS21A149 actualizado sobre los mismos dos archivos QA');
console.log('PASS rotación manual + reinicio + lupa + geometría convexa');
console.log('PASS fixtures reproducibles 90° / 180°');
console.log('PASS benchmark editor/recorte/long tasks/memoria/JPG');
console.log('URL http://127.0.0.1:4173/qa/document-scanner-local.html');
