import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require=createRequire(import.meta.url);
const playwright=require(process.env.CAMPUS_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const view=fs.readFileSync(path.join(root,'src/teacher_views.jsx'),'utf8');
const bridge=fs.readFileSync(path.join(root,'src/teacher_quiz_review_f111.js'),'utf8');
const app=fs.readFileSync(path.join(root,'src/app.jsx'),'utf8');
const html=fs.readFileSync(path.join(root,'campus.html'),'utf8');
assert.match(view,/data-f111-written-card-slot/);
assert.doesNotMatch(app,/data-f111-exams-apply-slot/);
assert.doesNotMatch(bridge,/buildTeacherWrittenApplicationPanel/);
assert.match(app,/teacher_views\.jsx\?v=[^'\n]*F111CARDOPEN20261125/);
assert.equal((html.match(/cards=F111CARDOPEN20261125/g)||[]).length,2);

const site='http://localhost:43199';
const group='QA-ESCRITO-0001';
const requests=[];
const errors=[];
const states={18:'DRAFT',32:'DRAFT'};
const browser=await playwright.chromium.launch({headless:true,
  ...(process.env.CAMPUS_CHROME_EXECUTABLE?{executablePath:process.env.CAMPUS_CHROME_EXECUTABLE}:{})});
try{
  const context=await browser.newContext({viewport:{width:390,height:780}});
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==site)return route.abort();
    if(url.pathname==='/docente')return route.fulfill({contentType:'text/html; charset=utf-8',body:
      '<main id="root"><section data-screen-label="Docente \u00b7 Ex\u00e1menes">'+
      '<article id="w1"><span data-f111-written-card-slot data-group="'+group+'" data-level="B2" data-lesson="18" data-lang="es"></span></article>'+
      '<article id="w2"><span data-f111-written-card-slot data-group="'+group+'" data-level="B2" data-lesson="32" data-lang="en"></span></article>'+
      '<article id="other"><span data-f111-written-card-slot data-group="QA-AJENO" data-level="B2" data-lesson="18" data-lang="es"></span></article></section></main>'+
      '<script>window.getSessionToken=()=>"qa-docente";window.APPS_SCRIPT_URL="'+site+'/core";</script>'+
      '<script src="/src/teacher_quiz_review_f111.js" defer></script>'});
    if(url.pathname==='/src/teacher_quiz_review_f111.js')
      return route.fulfill({contentType:'application/javascript; charset=utf-8',body:bridge});
    if(url.pathname==='/core'){
      const request=route.request().postDataJSON();
      requests.push(request);
      if(request.fn==='examTeacherWrittenActivationF111'){
        if(request.cod_grupo!==group)return route.fulfill({json:{ok:false,error:'grupo_nivel_no_autorizado_o_no_en_curso'}});
        if(request.accion==='abrir')states[request.leccion]='OPEN';
        if(request.accion==='cerrar')states[request.leccion]='CLOSED';
        return route.fulfill({json:{ok:true,estado:states[request.leccion],modo_manual:request.leccion===18,opcion:'A',motivo:request.leccion===32?'test2_antes_leccion_25':''}});
      }
    }
    return route.fulfill({status:404,body:''});
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(site+'/docente');
  const w1=page.locator('#w1'),w2=page.locator('#w2'),other=page.locator('#other');
  await page.waitForFunction(()=>!document.querySelector('#w1 button')?.disabled&&!!document.querySelector('#w1 button'));
  assert.equal(await w2.getByRole('button',{name:'Open for students'}).isDisabled(),true);
  assert.equal(await other.getByRole('button',{name:'Abrir para estudiantes'}).isDisabled(),true);
  assert.equal(requests.some(request=>request.accion==='abrir'),false,'Mounting cards is read-only');
  await w1.getByRole('button',{name:'Abrir para estudiantes'}).click();
  await w1.getByRole('button',{name:'Cerrar para estudiantes'}).waitFor();
  const opens=requests.filter(request=>request.accion==='abrir');
  assert.equal(opens.length,1);
  assert.equal(opens[0].cod_grupo,group);
  assert.equal(opens[0].nivel,'B2');
  assert.equal(opens[0].leccion,18);
  assert.equal(opens[0].opcion,undefined,'The browser cannot pick option B');
  assert.equal(requests.some(request=>/oral/i.test(request.fn)),false,
    'Unfinished oral never blocks or changes the written action');
  await w1.getByRole('button',{name:'Cerrar para estudiantes'}).click();
  await w1.getByText('Ordinario cerrado.').waitFor();
  assert.equal(await w1.getByRole('button',{name:'Abrir para estudiantes'}).isDisabled(),true);
  assert.equal(requests.filter(r=>r.accion==='cerrar').length,1);
  assert.deepEqual(errors,[]);
  console.log('PASS: card-local written controls, separate groups/tests, EN/ES, open and close only after confirmation; simulated services only.');
}finally{
  await browser.close();
}
