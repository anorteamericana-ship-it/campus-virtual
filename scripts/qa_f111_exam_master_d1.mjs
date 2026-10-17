// F111 EXAM MASTER PR-D1 · QA sintético, jamás producción.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const root=process.cwd();
const names=['examenes_css.jsx','examenes_appcss.jsx','examenes_data.jsx','examenes_render.jsx','examenes_modes.jsx','examenes_app.jsx'];
const sources=names.map(x=>fs.readFileSync(path.join(root,'src',x),'utf8'));
const bundle=fs.readFileSync(path.join(root,'src/examenes_bundle.jsx'),'utf8');
const header=bundle.slice(0,bundle.indexOf('// ===== '+names[0]+' ====='));
const rebuilt=header+names.map((x,i)=>'// ===== '+x+' =====\n\n'+sources[i]+'\n').join('');
assert.equal(bundle,rebuilt,'El bundle debe reproducir 6/6 archivos byte a byte');
const modes=sources[4],app=sources[5],css=sources[1];
assert.match(modes,/F111_PC_SCHEDULE_D1/);
assert.match(modes,/F111_ORAL_LESSONS_D1/);
assert.match(modes,/aria-label="Matriz de exámenes escritos"/);
assert.match(modes,/Progress Check/);
assert.match(modes,/0 % de nota oficial/);
assert.match(modes,/getExam\(selected\.nivel,/);
assert.match(modes,/String\(session\.rol \|\| ''\)\.trim\(\)\.toLowerCase\(\) === 'superadmin'/);
assert.match(app,/previewKey, setPreviewKey\] = React\.useState\(false\)/);
assert.match(app,/setPreviewKey\(!!showKey\)/);
assert.doesNotMatch(app,/Premium.*Compacto.*Hoja/);
assert.match(css,/max-width:500px/);
assert.match(css,/\.d1-B1\{background:#E5A823;color:#392900\}/);
const schedule=[[1,4],[2,8],[3,13],[4,16],[5,21],[6,24],[7,28],[8,30]];
for(const [quiz,lesson] of schedule)assert(modes.includes('['+quiz+','+lesson+','),'Falta el Progress Check '+quiz);
assert.equal((modes.match(/function AdminMode\(/g)||[]).length,1);
console.log('PR-D1 STATIC PASS: bundle 6/6, 16 escritos, 4 niveles, PC 8×4, preview oculta, estilos 390px');

if(process.env.F111_BROWSER!=='1')process.exit(0);

const {chromium}=await import('playwright');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.jsx':'text/plain; charset=utf-8','.jpg':'image/jpeg','.png':'image/png'};
const fixture=role=>'<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA LOCAL D1</title><style>body{margin:0;background:#F4F6FA}iframe{width:100%;height:1800px;border:0;display:block}</style></head><body>'
  +'<script src="/vendor/react.js"></script><script src="/vendor/react-dom.js"></script><script src="/vendor/babel.js"></script>'
  +'<script>window.getSesion=function(){return {rol:'+JSON.stringify(role)+'}};window.APPS_SCRIPT_URL="";window.getSessionToken=function(){return ""};</script>'
  +'<iframe title="EXAM QA" id="exam" src="/modulos/examenes.html?view=admin"></iframe></body></html>';
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1:8765');
  if(url.pathname==='/__qa/f111-d1'){
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(fixture(url.searchParams.get('role')==='superadmin'?'superadmin':'admin'));return;
  }
  const rel=decodeURIComponent(url.pathname).replace(/^\/+/,'');
  const full=path.resolve(root,rel);
  if(!full.startsWith(root+path.sep)||!fs.existsSync(full)||!fs.statSync(full).isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(full)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(full).pipe(res);
});
await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const out=path.join(root,'qa-capturas');
fs.mkdirSync(out,{recursive:true});
try{
  for(const width of [1280,390]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:8765/__qa/f111-d1?role=superadmin');
    const frame=page.frameLocator('#exam');
    await frame.getByRole('heading',{name:'Centro de exámenes'}).waitFor({timeout:45000});
    assert.equal(await frame.locator('.d1-matrix-choice').count(),16,'16 opciones escritas');
    assert.equal(await frame.locator('.d1-level-cell').count(),4,'4 niveles');
    assert.equal(await frame.locator('.d1-inspector').count(),1,'panel lateral');
    await frame.getByRole('tab',{name:'Progress Check'}).click();
    assert.equal(await frame.locator('.d1-pc-grid .d1-eval-card').count(),8,'8 quizzes por nivel');
    await frame.getByRole('tab',{name:'Orales'}).click();
    assert.equal(await frame.locator('.d1-oral-grid .d1-eval-card').count(),4,'4 orales por nivel');
    await frame.getByRole('tab',{name:'Escritos'}).click();
    await frame.locator('.d1-matrix-choice').nth(4).click();
    assert.match(await frame.locator('.d1-inspector').innerText(),/Básico II/);
    await page.screenshot({path:path.join(out,'pr-d1-'+width+'-centro.png'),fullPage:false});
    if(width===1280){
      await frame.getByRole('button',{name:'Ver como estudiante'}).click();
      await frame.getByRole('button',{name:'Mostrar respuestas (personal autorizado)'}).waitFor({timeout:20000});
      assert.equal(await frame.locator('.d1-cbar-warning').count(),0,'clave oculta por defecto');
      await frame.getByRole('button',{name:'Mostrar respuestas (personal autorizado)'}).click();
      assert.equal(await frame.locator('.d1-cbar-warning').count(),1,'aviso de claves');
      await frame.getByRole('button',{name:'← Catálogo'}).click();
    }
    assert.equal(errors.length,0,'JavaScript errors: '+errors.join('; '));
    await page.close();
  }
  const normal=await browser.newPage({viewport:{width:1280,height:900}});
  await normal.goto('http://127.0.0.1:8765/__qa/f111-d1?role=admin');
  const normalFrame=normal.frameLocator('#exam');
  await normalFrame.getByRole('heading',{name:'Centro de exámenes'}).waitFor({timeout:45000});
  assert.equal(await normalFrame.getByRole('button',{name:/Diagnóstico técnico/}).count(),0,'diagnóstico solo superadmin');
  await normal.close();
  console.log('PR-D1 PLAYWRIGHT PASS: 1280/390, catálogo, 3 modalidades, preview sin clave, rol admin/superadmin');
  console.log('Capturas: qa-capturas/pr-d1-1280-centro.png, qa-capturas/pr-d1-390-centro.png');
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
