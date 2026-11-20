// QA E1: módulo de revisión de borradores visible únicamente en ruta Superadmin.
// Ejecuta un servidor HTTP localhost con datos ficticios. Nunca consulta Apps Script ni producción.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
const mime={'.html':'text/html','.js':'text/javascript','.jsx':'text/plain','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.svg':'image/svg+xml'};
const server=createServer((req,res)=>{
 let full;
 try{ full=path.resolve(repo,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
 catch{res.writeHead(400);return res.end();}
 if(!full.startsWith(repo+path.sep)||!existsSync(full)||!statSync(full).isFile()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'content-type':mime[path.extname(full)]||'application/octet-stream'});
 res.end(readFileSync(full));
}).listen(0);
const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage();
const results=[];
async function t(name,fn){
 try{await fn();results.push(['PASS',name]);}
 catch(e){results.push(['FAIL',name,String(e.message).slice(0,250)]);}
 console.log(results.at(-1).join(' '));
}
try{
 await t('01 La entrada directa de revisión no muestra preguntas',async()=>{
  await page.goto(origin+'/prototipos/exam_prep_lab/index.html?review=superadmin');
  await page.getByText('Acceso desde Campus Virtual').waitFor();
  assert.equal(await page.locator('button[data-demo]').count(),0);
 });
 await page.goto(origin+'/login.html');
 await page.setContent('<div id="root"></div>');
 await page.addScriptTag({url:origin+'/vendor/react.js'});
 await page.addScriptTag({url:origin+'/vendor/react-dom.js'});
 await page.addScriptTag({url:origin+'/vendor/babel.js'});
 await page.evaluate(async()=>{
   const source=await fetch('/src/exam_prep_lab.jsx').then(r=>r.text());
   const js=Babel.transform(source,{presets:['react']}).code;
   (0,eval)(js);
 });
 for(const role of ['student','teacher','admin']){
  await t('02 Rol '+role+' no puede montar laboratorio',async()=>{
   await page.evaluate((role)=>{
    window.getSesion=()=>({rol:role});
    ReactDOM.render(React.createElement(ExamPrepLabView,{usuario:{rol:role},rolReal:role,previewMode:'superadmin'}),document.getElementById('root'));
   },role);
   await page.getByText('Acceso restringido').waitFor();
   assert.equal(await page.locator('iframe[data-epl-preview-frame]').count(),0);
  });
 }
 await t('03 Solo Superadmin abre la vista simulada como estudiante Ana',async()=>{
   await page.evaluate(()=>{
    window.getSesion=()=>({rol:'superadmin'});
    ReactDOM.render(React.createElement(ExamPrepLabView,{usuario:{rol:'superadmin'},rolReal:'superadmin',previewMode:'superadmin'}),document.getElementById('root'));
   });
   await page.locator('iframe[data-epl-preview-frame]').waitFor();
   const frame=page.frameLocator('iframe[data-epl-preview-frame]');
   await frame.getByText(/Hola, Ana/).waitFor({timeout:25000});
   await frame.getByText(/Entorno de demostraci[oó]n/).waitFor({timeout:25000});
 });
 await t('04 Separación de menú y rutas por rol real',async()=>{
   const app=readFileSync(path.join(repo,'src','app.jsx'),'utf8');
   const side=readFileSync(path.join(repo,'src','sidebar.jsx'),'utf8');
   assert.match(side,/esSuperadmin\s*\?\s*\[\{\s*id:\s*'exam_prep_lab'/);
   assert.match(app,/exam_prep_lab:\s*rolReal\s*===\s*'superadmin'/);
   assert.match(app,/F96_LAZY\.exam_prep_lab/);
   assert.match(app,/ExamPrepLabView/);
 });
}finally{await browser.close();server.close();}
const fail=results.filter(r=>r[0]==='FAIL').length;
console.log((results.length-fail)+'/'+results.length+' PASS');
process.exitCode=fail?1:0;
