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
assert.match(view,/Aplicar escrito pendiente','Apply pending written exam'/);
assert.match(view,/F111_QZ_focusWrittenApplication/);
assert.match(app,/teacher_views\.jsx\?v=[^'\n]*F111WRITTENPENDING20261125/);
assert.equal((html.match(/pending=F111WRITTENPENDING20261125/g)||[]).length,2);

const site='http://localhost:43199';
const group='QA-ESCRITO-0001';
const requests=[];
const errors=[];
let state='DRAFT';
const browser=await playwright.chromium.launch({headless:true,
  ...(process.env.CAMPUS_CHROME_EXECUTABLE?{executablePath:process.env.CAMPUS_CHROME_EXECUTABLE}:{})});
try{
  const context=await browser.newContext({viewport:{width:390,height:780}});
  await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==site)return route.abort();
    if(url.pathname==='/docente')return route.fulfill({contentType:'text/html; charset=utf-8',body:
      '<main id="root"><section data-screen-label="Docente · Exámenes"><div data-f111-exams-apply-slot></div></section></main>'+
      '<script>window.getSessionToken=()=>"qa-docente";window.APPS_SCRIPT_URL="'+site+'/core";</script>'+
      '<script src="/src/teacher_quiz_review_f111.js" defer></script>'});
    if(url.pathname==='/src/teacher_quiz_review_f111.js')
      return route.fulfill({contentType:'application/javascript; charset=utf-8',body:bridge});
    if(url.pathname==='/core'){
      const request=route.request().postDataJSON();
      requests.push(request);
      if(request.fn==='getDocenteGruposActuales')return route.fulfill({json:{ok:true,
        grupos:[{cod_grupo:group,nivelId:'B2',puede_curso:true}]}});
      if(request.fn==='examTeacherWrittenActivationF111'){
        if(request.accion==='abrir')state='OPEN';
        return route.fulfill({json:{ok:true,estado:state,modo_manual:true,opcion:'A'}});
      }
    }
    return route.fulfill({status:404,body:''});
  });
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(site+'/docente');
  const panel=page.locator('[data-f111-teacher-application]');
  await panel.getByText('Listo para abrir.').waitFor();
  assert.equal(await page.evaluate(group=>window.F111_QZ_focusWrittenApplication({
    grupo:group,nivel:'B2',leccion:18}),group),true);
  await panel.getByText('Listo para abrir.').waitFor();
  assert.equal(await panel.getByLabel('Evaluación').inputValue(),'0');
  assert.equal(requests.some(request=>request.accion==='abrir'),false,
    'Selecting Apply pending cannot open an exam');
  assert.equal(await page.evaluate(()=>window.F111_QZ_focusWrittenApplication({
    grupo:'QA-AJENO',nivel:'B2',leccion:18})),true);
  await panel.getByText('El servidor no confirmó este grupo y nivel para aplicar el escrito.').waitFor();
  assert.equal(await panel.getByRole('button',{name:'Abrir para estudiantes'}).isDisabled(),true);
  assert.equal(await page.evaluate(group=>window.F111_QZ_focusWrittenApplication({
    grupo:group,nivel:'B2',leccion:18}),group),true);
  await panel.getByText('Listo para abrir.').waitFor();
  await panel.getByRole('button',{name:'Abrir para estudiantes'}).click();
  await panel.getByRole('button',{name:'Cerrar para estudiantes'}).waitFor();
  const opens=requests.filter(request=>request.accion==='abrir');
  assert.equal(opens.length,1);
  assert.equal(opens[0].cod_grupo,group);
  assert.equal(opens[0].nivel,'B2');
  assert.equal(opens[0].leccion,18);
  assert.equal(opens[0].opcion,undefined,'The browser cannot pick option B');
  assert.equal(requests.some(request=>/oral/i.test(request.fn)),false,
    'Unfinished oral never blocks or changes the written action');
  assert.deepEqual(errors,[]);
  console.log('PASS: pending written button selects B2 A, rejects foreign group, opens only after confirmation; simulated services only.');
}finally{
  await browser.close();
}
