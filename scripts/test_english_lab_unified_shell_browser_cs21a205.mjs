#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('.');
const output=path.resolve('qa-output/cs21a205-unified-shell');
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
const errors=[];
const results={};
const preview='/src/english_lab_games/english_lab_unified_shell_preview_cs21a205.html';
const expected=['Memory Match','Sentence Order','Hangman','Quiz Time','Word Search'];

async function gameLabels(page){return page.locator('.el205-game-copy strong').allTextContents();}
async function clickGame(page,label){
  await page.locator('button[role="tab"]',{hasText:label}).click();
  await page.waitForFunction(expectedLabel=>{
    const current=document.querySelector('.el205-current strong');
    return current&&current.textContent.trim()===expectedLabel;
  },label);
}

try{
  {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`teacher pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`teacher HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}${preview}?role=teacher`,{waitUntil:'networkidle'});
    await page.locator('.el205-shell[data-version="CS21A205"]').waitFor({state:'visible',timeout:10000});

    assert.equal(await page.locator('button[role="tab"]').count(),5,'Docente debe ver exactamente cinco juegos.');
    assert.deepEqual(await gameLabels(page),expected,'Las etiquetas docentes deben coincidir con el catálogo vigente.');
    assert.equal(await page.locator('button[role="tab"][aria-selected="true"] .el205-game-copy strong').textContent(),'Memory Match','Memory Match debe ser la selección inicial.');
    await page.locator('[data-mock="Memory control"]').waitFor({state:'visible'});
    await page.locator('button',{hasText:'Vocabulary Sprint'}).waitFor({state:'hidden'});
    await page.locator('button',{hasText:'Word Match'}).waitFor({state:'hidden'});
    await page.locator('.card',{hasText:'Banco pedagógico'}).waitFor({state:'hidden'});

    await clickGame(page,'Sentence Order');
    await page.locator('[data-mock="Sentence Order"]').waitFor({state:'visible'});
    await page.locator('[data-mock="Sentence control"]').waitFor({state:'visible'});
    await page.locator('[data-mock="Legacy duplicate"]').waitFor({state:'hidden'});
    assert.match(page.url(),/[?&]game=SENTENCE_ORDER(?:&|$)/,'Sentence Order debe reflejarse en la URL.');

    await clickGame(page,'Hangman');
    await page.locator('[data-mock="Hangman"]').waitFor({state:'visible'});
    assert.match(page.url(),/[?&]game=HANGMAN(?:&|$)/);

    await clickGame(page,'Quiz Time');
    await page.locator('[data-mock="Quiz Time"]').waitFor({state:'visible'});
    assert.match(page.url(),/[?&]game=QUIZ_TIME(?:&|$)/);

    await clickGame(page,'Word Search');
    await page.locator('[data-mock="Word Search"]').waitFor({state:'visible'});
    assert.match(page.url(),/[?&]game=WORD_SEARCH(?:&|$)/);
    assert.equal(await page.locator('.ws200-gateway:visible,.qt198-gateway:visible,.elh191-tabs:visible').count(),0,'No deben quedar switchers históricos visibles dentro del shell.');

    results.teacher={games:await gameLabels(page),finalGame:'Word Search',legacyControlsHidden:true};
    await page.screenshot({path:path.join(output,'teacher-desktop.png'),fullPage:true});
    await context.close();
  }

  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(`student pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`student HTTP ${response.status()} ${response.url()}`);});
    await page.goto(`${base}${preview}?role=student`,{waitUntil:'networkidle'});
    await page.locator('.el205-shell[data-version="CS21A205"]').waitFor({state:'visible',timeout:10000});

    assert.equal(await page.locator('button[role="tab"]').count(),5,'Estudiante debe ver exactamente cinco juegos.');
    assert.deepEqual(await gameLabels(page),expected,'Las etiquetas estudiante deben coincidir con el catálogo vigente.');
    await page.locator('[data-mock="Ingreso por código"]').waitFor({state:'visible'});
    assert.equal(await page.locator('.ws200-gateway:visible,.qt198-gateway:visible,.elh191-tabs:visible').count(),0,'El ingreso legacy no debe reintroducir switchers históricos.');

    await clickGame(page,'Sentence Order');
    await page.locator('[data-mock="Ingreso por código"]').waitFor({state:'visible'});
    await clickGame(page,'Hangman');
    await page.locator('[data-mock="Ingreso por código"]').waitFor({state:'visible'});

    await clickGame(page,'Quiz Time');
    await page.locator('[data-mock="Quiz Time student"]').waitFor({state:'visible'});
    await clickGame(page,'Word Search');
    await page.locator('[data-mock="Word Search student"]').waitFor({state:'visible'});
    assert.match(page.url(),/[?&]role=student(?:&|$)|[?&]game=WORD_SEARCH(?:&|$)/,'La navegación no debe perder el modo estudiante.');

    results.student={games:await gameLabels(page),legacyEntryPreserved:true,directQuiz:true,directWordSearch:true};
    await page.screenshot({path:path.join(output,'student-mobile.png'),fullPage:true});
    await context.close();
  }

  assert.deepEqual(errors,[],errors.join(' | '));
  console.log(JSON.stringify({ok:true,version:'CS21A205',...results},null,2));
}finally{
  await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
}
