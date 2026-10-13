// F111 UI-1 · Playwright local (localhost + fixtures; never Campus PROD).
// Screenshots outside repository: f111_handoff_20261012/review/UI1.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
const review=path.resolve(root,'../../review/UI1');
fs.mkdirSync(review,{recursive:true});
const playwrightFile=process.env.F111_PLAYWRIGHT_MODULE;
if(!playwrightFile || !fs.existsSync(playwrightFile))throw Error('Set F111_PLAYWRIGHT_MODULE to local Playwright index.mjs');
const {chromium}=await import(pathToFileURL(playwrightFile).href);
const photoMarkup='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><rect width="240" height="240" fill="#C3D9F3"/><circle cx="120" cy="83" r="43" fill="#D09A79"/><path d="M36 240Q39 134 120 137Q203 134 204 240Z" fill="#001E47"/><path d="M75 65Q120 10 165 65" fill="none" stroke="#53352F" stroke-width="24"/></svg>';
const src=fs.readFileSync(path.join(root,'src/student_dashboard.jsx'),'utf8');
const begin=src.indexOf('function DatosAcademicosInicio(');
const end=src.indexOf('\nfunction OrientacionInicialCampus(',begin);
assert(begin>=0&&end>begin,'Student component must exist');
const ringStart=src.indexOf('function ExecutiveProgressRingD(');
const ringEnd=src.indexOf('\n// ─────────────────────────────────────────────────────────────────────────',ringStart);
assert(ringStart>=0 && ringEnd>ringStart,'real progress ring found');
const studentSource=src.slice(ringStart,ringEnd)+'\n'+src.slice(begin,end)+'\nwindow.__StudentCard = DatosAcademicosInicio;';
const teacherSource=fs.readFileSync(path.join(root,'src/teacher_profile_cs21a76.jsx'),'utf8');
const fixtureHtml=[
 '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Prueba UI-1 · Campus Virtual</title>',
 '<meta name="viewport" content="width=device-width,initial-scale=1">',
 '<link rel="stylesheet" href="/styles/tokens.css">',
 '<link rel="stylesheet" href="/styles/campus.css">',
 '<link rel="stylesheet" href="/styles/campus_d_compact.css">',
 '<link rel="stylesheet" href="/styles/academy_identity_card.css">',
 '<style>body{font-family:Poppins,Arial,sans-serif;max-width:none;padding:20px;margin:0;background:#F7F4EF}*{box-sizing:border-box}#root{width:100%}.btn{font:inherit;cursor:pointer}</style>',
 '</head><body><main id="root"></main>',
 '<script src="/vendor/react.js"></script><script src="/vendor/react-dom.js"></script>',
 '<script src="/vendor/babel.js"></script>',
 '<script src="/src/academy_mark.js"></script><script src="/src/academy_photo_crop.js"></script>',
 '</body></html>'
].join('');
let croppedPhoto=null;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1');
 if(url.pathname==='/qa'){res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});res.end(fixtureHtml);return;}
 if(url.pathname==='/qa/student-source'){res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8'});res.end(studentSource);return;}
 if(url.pathname==='/qa/teacher-source'){res.writeHead(200,{'Content-Type':'text/plain;charset=utf-8'});res.end(teacherSource);return;}
 if(url.pathname==='/qa/cropped-photo.jpg'){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(photoMarkup);return;}
 if(url.pathname==='/qa/cropped-photo.jpg'){
  if(!croppedPhoto){res.writeHead(404);res.end('not cropped');return;}
  res.writeHead(200,{'Content-Type':'image/jpeg'});res.end(croppedPhoto);return;
 }
 if(url.pathname==='/api'){
  let body='';req.on('data',chunk=>{body+=chunk;});req.on('end',()=>{
   const photo=body.includes('QA_WITH_PHOTO');
   const out={ok:true,docente:{nombre:'Docente QA',cedula:'0001111234',activo:true,titular:'Docente ficticio de inglés',
     especialidad:'Inglés',experiencia:'',presentacion:''},foto:{disponible:photo,url:'/qa/cropped-photo.jpg'},
     documentos:{},materiales:[]};
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(out));
  });return;
 }
 const requested=path.resolve(root,'.'+decodeURIComponent(url.pathname));
 if(!requested.startsWith(root+path.sep)||!fs.existsSync(requested)||!fs.statSync(requested).isFile()){
  res.writeHead(404);res.end('not found');return;
 }
 const ext=path.extname(requested).toLowerCase();
 const type=ext==='.js'?'text/javascript':ext==='.css'?'text/css':ext==='.svg'?'image/svg+xml':'text/plain';
 res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});fs.createReadStream(requested).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const base='http://127.0.0.1:'+port;
const browser=await chromium.launch({
 headless:true,
 ...(process.env.F111_CHROME_PATH?{executablePath:process.env.F111_CHROME_PATH}:{})
});
let checks=0;
function assertContrast(fg,bg){
 const lum=s=>{
  const parts=[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
  return .2126*parts[0]+.7152*parts[1]+.0722*parts[2];
 };
 const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
const serverHost='127.0.0.1';
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('**/*',route=>{
  let host='';
  try{host=new URL(route.request().url()).hostname;}catch(_){}
  return host===serverHost?route.continue():route.abort('blockedbyclient');
 });
 page.on('pageerror',e=>{console.log('BROWSER_PAGE_ERROR '+String(e).slice(0,180));});
 await page.goto(base+'/qa',{waitUntil:'load'});
 await page.waitForFunction(()=>!!window.Babel&&!!window.React&&!!window.ReactDOM&&!!window.AcademyPhotoCrop);
 const setup=await page.evaluate(async()=>{
  const source=await (await fetch('/qa/student-source')).text();
  const code=Babel.transform(source,{presets:['react'],plugins:['transform-block-scoping']}).code;
  window.buildProgramaFichaSD=()=>({horario:'Lunes y miércoles 18–21',horasSemanales:'6 h',modalidad:'Intensivo',programaNombre:'Inglés Conversacional'});
  window.NIVEL_NOMBRE={B1:'Básico I'};
  window.postStudentDash=async(fn,payload)=>{
   if(fn==='uploadFotoPerfilEstudiante'){window.__lastUploaded=payload;return {ok:true,foto_url:'/qa/cropped-photo.jpg'};}
   return {ok:true};
  };
  (0,eval)(code);
  window.__ui1ReactRoot=ReactDOM.createRoot?ReactDOM.createRoot(document.getElementById('root')):null;
  window.__renderStudent=function(photo,codeValue,progress=72){
   const est={CORREO:'qa@example.invalid',TEL1:'8888-0000',
     ESTATUS:'CA',PROGRAMA:'INA',FOTO_PERFIL_URL:photo?'/qa/cropped-photo.jpg':''};
   const props={est,grupo:{},nombreCompleto:'Estudiante de prueba',codigo:codeValue===undefined?'QA-001':codeValue,
     cedula:'0001111234',codGrupo:'B1-LM-TEST',nivelReal:'B1',nivelSeleccionado:'B1',
     nivelNombre:'Básico I',libroNivel:'Intro',docente:'Docente QA',
     horario:'Lunes y miércoles',programa:'Inglés Conversacional',
     contactos:{correo_principal:'qa@example.invalid',telefono_principal:'8888-0000'},
     progresoPct:progress,cerradas:23,totalLecciones:32,onNavigate:()=>{},onReload:()=>{}};
   window.__renderSerial=(window.__renderSerial||0)+1;
   const element=React.createElement(window.__StudentCard,{...props,key:'qa-'+window.__renderSerial});
   if(window.__ui1ReactRoot)window.__ui1ReactRoot.render(element);
   else ReactDOM.render(element,document.getElementById('root'));
  };
  return !!window.__StudentCard;
 });
 assert.equal(setup,true,'student source compiles and registers');checks++;
 await page.evaluate(()=>window.__renderStudent(false,'QA-001'));
 const input=page.locator('#panel-actualizar-datos input[type=file]');
 const imgBase64=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,1280,720);
  ctx.fillStyle='#C3A48A';ctx.fillRect(0,120,1280,480);
  ctx.fillStyle='#214D83';ctx.fillRect(400,160,480,390);
  return canvas.toDataURL('image/png').split(',')[1];
 });
 await input.setInputFiles({name:'synthetic_letterbox.png',mimeType:'image/png',buffer:Buffer.from(imgBase64,'base64')});
 await page.getByRole('dialog',{name:'Recortar fotografía'}).waitFor();
 await page.locator('#an-crop-zoom').fill('1.6');
 await page.locator('.an-crop-dialog canvas').focus();
 await page.keyboard.press('ArrowLeft');
 await page.getByRole('button',{name:'Aceptar recorte'}).click();
 await page.waitForFunction(()=>!!window.__lastUploaded);
 const dimension=await page.evaluate(async()=>{
  const payload=window.__lastUploaded;
  const bitmap=await createImageBitmap(await (await fetch('data:image/jpeg;base64,'+payload.archivo_base64)).blob());
  const result=[bitmap.width,bitmap.height,payload.archivo_mime];bitmap.close();return result;
 });
 assert.deepEqual(dimension,[640,640,'image/jpeg'],'crop must produce 640 x 640 JPEG');checks++;
 croppedPhoto=Buffer.from(await page.evaluate(()=>window.__lastUploaded.archivo_base64),'base64');
 fs.writeFileSync(path.join(review,'qa_cropped_640.jpg'),croppedPhoto);

 const widths=[1440,768,375];
 const axePath=process.env.F111_AXE_SOURCE;
 if(!axePath||!fs.existsSync(axePath))throw Error('F111_AXE_SOURCE required for UI-1');
 const axeCode=fs.readFileSync(axePath,'utf8');
 const axeResults={};
 const checkAxe=async(kind)=>{
  await page.addScriptTag({content:axeCode});
  const result=await page.evaluate(async()=>{
   const out=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});
   return out.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,targets:v.nodes.map(n=>n.target).slice(0,8)}));
  });
  axeResults[kind]=result;
  const severe=result.filter(v=>v.impact==='serious'||v.impact==='critical');
  assert.equal(severe.length,0,'axe serious/critical '+kind+': '+JSON.stringify(severe));
  checks++;
 };
 for(const width of widths){
  await page.setViewportSize({width,height:920});
  for(const hasPhoto of [false,true]){
   await page.evaluate(photo=>window.__renderStudent(photo),hasPhoto);
   await page.locator('#panel-actualizar-datos').waitFor();
   const actions=page.locator('.campus-d-actions');
   assert(await actions.isVisible(),'actions visible');
   if(width===375)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'student 375px must not overflow');
   const btn=page.getByRole('button',{name:'ACTUALIZAR DATOS'});
   assert(await btn.isVisible(),'edit button visible');
   await page.locator('#panel-actualizar-datos').screenshot({
    path:path.join(review,'student_'+width+'_'+(hasPhoto?'photo':'no_photo')+'.png')
   });
   checks++;
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.evaluate(()=>window.__renderStudent(false,'QA-001',null));
 await page.locator('#panel-actualizar-datos').waitFor();
 assert.equal(await page.getByRole('progressbar',{name:'Avance del nivel'}).count(),0,'no progress without data');
 checks++;
 await page.evaluate(()=>window.__renderStudent(false,''));
 await page.getByRole('progressbar',{name:'Avance del nivel'}).waitFor();
 assert.equal(await page.getByRole('progressbar',{name:'Avance del nivel'}).getAttribute('aria-valuenow'),'72');
 checks++;
 await checkAxe('student');
 const studentTouch=await page.locator('.campus-d-camera-icon').boundingBox();
 assert(studentTouch && studentTouch.width>=44 && studentTouch.height>=44,'student camera must have 44x44 hit target');
 const [studentPicker]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:'Subir foto'}).click()]);
 assert(studentPicker,'student camera button opens file chooser');
 checks+=2;
 await page.getByRole('button',{name:'ACTUALIZAR DATOS'}).click();
 assert(await page.locator('[aria-label="Datos personales"]').isVisible());
 assert(!(await page.locator('#panel-actualizar-datos').textContent()).includes('0001111234'),'student default view never leaks full cedula');
 checks++;
 await page.getByRole('button',{name:'DATOS DEL PROGRAMA'}).click();
 assert(await page.locator('[aria-label="Datos del programa"]').isVisible());
 checks++;
 const privacy=await page.evaluate(()=>{
  const cover=document.querySelector('.campus-d-welcome-chips')?.textContent||'';
  const contact=document.querySelector('.campus-d-contact-strip')?.textContent||'';
  return {cover,contact};
 });
 assert(!privacy.cover.includes('0001111234'),'cedula must never be student code');
 assert(privacy.contact.includes('•••-•••-1234'),'cedula is masked');
 checks+=2;
 await page.getByRole('button',{name:'Mostrar'}).click();
 assert((await page.locator('.campus-d-contact-strip').textContent()).includes('0001111234'));
 checks++;
 // Docente: componente original y API ficticia local, no sesión real.
 await page.goto(base+'/qa',{waitUntil:'load'});
 await page.waitForFunction(()=>!!window.Babel&&!!window.ReactDOM);
 const setupTeacher=await page.evaluate(async()=>{
  window.APPS_SCRIPT_URL='/api';
  window.getSesion=()=>({rol:'teacher',nombre:'Docente QA'});
  window.getSessionToken=()=> 'QA_ONLY_TOKEN';
  window.PerfilView=function BasePerfil(){return React.createElement('div',null,'Base');};
  const src=await (await fetch('/qa/teacher-source')).text();
  const code=Babel.transform(src,{presets:['react'],plugins:['transform-block-scoping']}).code;
  (0,eval)(code);
  window.__teacherRoot=ReactDOM.createRoot?ReactDOM.createRoot(document.getElementById('root')):null;
  window.__renderTeacher=(photo)=>{
   window.__photo=photo;
   const el=React.createElement(window.PerfilView,{key:photo?'with-photo':'without-photo'});
   if(window.__teacherRoot)window.__teacherRoot.render(el);
   else ReactDOM.render(el,document.getElementById('root'));
  };
  return !!window.PerfilView?.__cs21a76TeacherProfile;
 });
 assert(setupTeacher,'teacher JSX compiles and registers');checks++;
 for(const width of widths){
  await page.setViewportSize({width,height:920});
  for(const photo of [false,true]){
   // Use a new mount with mocked backend reply.
   await page.evaluate(photo=>{
    const oldFetch=window.fetch;
    window.fetch=async(input,opts)=>{
      if(String(input).includes('/api')){
        return {ok:true,status:200,text:async()=>JSON.stringify({ok:true,docente:{nombre:'Docente QA',cedula:'0001111234',activo:true,
          titular:'Docente ficticio',especialidad:'Inglés',experiencia:''},
          foto:{disponible:photo,url:'/qa/cropped-photo.jpg'},documentos:{}})};
      }
      return oldFetch(input,opts);
    };
    window.__renderTeacher(photo);
   },photo);
   await page.locator('.tp76-hero-card').waitFor();
   await page.waitForTimeout(180);
   assert(await page.getByRole('button',{name:photo ? 'Cambiar foto' : 'Subir foto'}).isVisible());
   if(width===375)assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'teacher 375px must not overflow');
   const cam=await page.locator('.tp76-camera').boundingBox();
   assert(cam && cam.width>=44 && cam.height>=44,'teacher camera hit-area >=44x44');
   assert(!(await page.locator('.tp76-info-strip').textContent()).includes('0001111234'),'teacher cedula masked by default');
   await page.locator('.tp76-hero-card').screenshot({
    path:path.join(review,'teacher_'+width+'_'+(photo?'photo':'no_photo')+'.png')
   });
   checks++;
  }
 }
 await checkAxe('teacher');
 await page.getByRole('button',{name:'Mostrar'}).click();
 assert((await page.locator('.tp76-info-strip').textContent()).includes('0001111234'),'teacher can explicitly show cedula');
 await page.getByRole('button',{name:'Ocultar'}).click();
 assert(!(await page.locator('.tp76-info-strip').textContent()).includes('0001111234'),'teacher hides cedula again');
 const [teacherPicker]=await Promise.all([page.waitForEvent('filechooser'),page.getByRole('button',{name:'Cambiar foto'}).click()]);
 assert(teacherPicker,'teacher camera button opens file chooser');
 checks+=3;
 fs.writeFileSync(path.join(review,'UI1_AXE.json'),JSON.stringify(axeResults,null,2));
 const contrastTable=[['Azul oscuro','#001E47'],['Azul medio','#0B4A8B'],['Rojo','#9A2032']].map(([label,bg])=>({label,bg,fg:'#FFFFFF',ratio:Math.round(assertContrast('#FFFFFF',bg)*100)/100}));
 fs.writeFileSync(path.join(review,'UI1_CONTRAST.md'),'# F111 UI-1: contraste sobre gradiente\n\n| Fondo | Texto | Contraste | Requisito |\n|---|---|---|---|\n'+contrastTable.map(x=>`| ${x.label} (${x.bg}) | ${x.fg} | ${x.ratio}:1 | 4.5:1 |`).join('\n')+'\n');
 const contrast=Math.min(
  assertContrast('#FFFFFF','#001E47'),
  assertContrast('#FFFFFF','#0B4A8B'),
  assertContrast('#FFFFFF','#9A2032')
 );
 assert(contrast>=4.5,'Text contrast against all gradient stops >= 4.5');
 checks++;
 const report={ok:true,checks,contrast,shots:fs.readdirSync(review).filter(n=>/^(student|teacher)_(1440|768|375)_(photo|no_photo)\.png$/.test(n)).length,
  qaMode:'localhost fixtures, actual production JSX components',axe:'serious-critical-zero'};
 fs.writeFileSync(path.join(review,'UI1_LOCAL_RESULTS.json'),JSON.stringify(report,null,2));
 console.log('UI1_PLAYWRIGHT_PASS '+JSON.stringify(report));
} finally {
 await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
