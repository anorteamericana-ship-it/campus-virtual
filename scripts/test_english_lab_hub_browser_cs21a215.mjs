#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('.');
const output=path.resolve('qa-output/cs21a215-english-lab-hub');
const legacyBrand=['Academia','Play'].join(' ');
const legacyBrandRe=new RegExp(legacyBrand,'i');
fs.mkdirSync(output,{recursive:true});
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
let server=null;
let base=process.env.QA_BASE_URL||'';
if(!base){
  server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://127.0.0.1');
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
      response.writeHead(404,{'content-type':'text/plain; charset=utf-8'});response.end('not found');return;
    }
    response.writeHead(200,{'content-type':types[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
}

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const preview='/src/english_lab_hub_preview_cs21a215.html';
const errors=[];
const results={};

async function assertNoLegacyBrand(page,label){
  const text=(await page.locator('body').innerText()).replace(/\s+/g,' ');
  assert.equal(legacyBrandRe.test(text),false,`${label}: no debe aparecer la marca histórica.`);
}
async function assertNoHorizontalOverflow(page,label){
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(dims.scroll<=dims.client+1,`${label}: overflow horizontal ${dims.scroll}>${dims.client}`);
}
async function clickCard(page,text){
  await page.locator('button.el215-mode-card',{hasText:text}).click();
}

try{
  {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`student pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`student HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}${preview}?role=student`,{waitUntil:'networkidle'});
    await page.locator('.el215-shell[data-el215-mode="home"]').waitFor({state:'visible',timeout:10000});

    assert.equal(await page.locator('button.el215-mode-card').count(),3,'Estudiante debe ver tres modos English LAB.');
    const modes=await page.locator('button.el215-mode-card strong').allTextContents();
    assert.deepEqual(modes,['Practicar & Competir','Jugar en equipos','Clase en vivo']);
    await assertNoLegacyBrand(page,'student home');

    await clickCard(page,'Practicar & Competir');
    await page.locator('[data-mock="practice"]').waitFor({state:'visible'});
    assert.equal((await page.locator('[data-mock="free-games"]').textContent()).trim(),'5 juegos gratis');
    assert.match(await page.locator('[data-mock="units"]').textContent(),/16 unidades · 12 juegos por unidad/);
    await assertNoLegacyBrand(page,'student practice');
    await page.locator('button.el215-back').click();

    await clickCard(page,'Jugar en equipos');
    const teamTitles=await page.locator('.el215-mini-card strong').allTextContents();
    assert.deepEqual(teamTitles,['Hangman · Equipos','Quiz Time','Taboo','Categories Battle','Vocabulary Bingo','Conversation Cards']);
    assert.equal(await page.locator('.el215-mini-card.is-soon').count(),4,'Cuatro dinámicas nuevas deben seguir marcadas como próximas.');
    await page.locator('.el215-mini-card',{hasText:'Hangman · Equipos'}).locator('button').click();
    await page.locator('[data-mock="student-class"]').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-mock="student-class"]').getAttribute('data-game'),'HANGMAN','La entrada de equipos no debe abrir Memory compartido.');
    assert.match(page.url(),/[?&]game=HANGMAN(?:&|$)/);
    await assertNoLegacyBrand(page,'student live');

    results.student={modes,practicePreserved:true,teamTitles,defaultClassGame:'HANGMAN',legacyBrandVisible:false};
    await page.screenshot({path:path.join(output,'student-desktop.png'),fullPage:true});
    await context.close();
  }

  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`mobile pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`mobile HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}${preview}?role=student`,{waitUntil:'networkidle'});
    await page.locator('.el215-shell[data-el215-mode="home"]').waitFor({state:'visible',timeout:10000});
    await assertNoHorizontalOverflow(page,'student 390 home');
    const cards=page.locator('button.el215-mode-card');
    const a=await cards.nth(0).boundingBox();
    const b=await cards.nth(1).boundingBox();
    assert.ok(a&&b,'No se pudo medir tarjetas móviles.');
    assert.ok(b.y>a.y+a.height-4,'A 390 px los modos deben apilarse verticalmente.');

    await clickCard(page,'Jugar en equipos');
    await assertNoHorizontalOverflow(page,'student 390 teams');
    const mini=page.locator('.el215-mini-card');
    const m1=await mini.nth(0).boundingBox();
    const m2=await mini.nth(1).boundingBox();
    assert.ok(m1&&m2&&m2.y>m1.y+m1.height-4,'A 390 px las dinámicas deben apilarse.');
    results.mobile={width:390,noOverflow:true,stackedModes:true,stackedTeams:true};
    await page.screenshot({path:path.join(output,'student-mobile-390.png'),fullPage:true});
    await context.close();
  }

  {
    const context=await browser.newContext({viewport:{width:1366,height:768}});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`teacher pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`teacher HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}${preview}?role=teacher`,{waitUntil:'networkidle'});
    await page.locator('.el215-shell[data-el215-mode="home"]').waitFor({state:'visible',timeout:10000});
    await assertNoLegacyBrand(page,'teacher home');
    await clickCard(page,'Clase en vivo');
    await page.locator('[data-mock="teacher-class"]').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-mock="teacher-class"]').getAttribute('data-game'),'HANGMAN');
    assert.match(await page.locator('.el215-subhead h2').textContent(),/Preparar actividad/);
    results.teacher={classEntry:'HANGMAN',hubVisible:true};
    await page.screenshot({path:path.join(output,'teacher-1366.png'),fullPage:true});
    await context.close();
  }

  assert.deepEqual(errors,[],errors.join(' | '));
  const report={ok:true,version:'CS21A215',...results};
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{
  await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
}
