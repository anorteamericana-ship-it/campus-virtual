#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.QA_BASE_URL||'http://127.0.0.1:4204').replace(/\/$/,'');
const out=path.resolve('qa-output/cs21a204-browser-smoke');
fs.mkdirSync(out,{recursive:true});

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const result={ok:false,version:'CS21A204-NON-MEMORY-BROWSER-1',quiz:{},word_search:{}};

try{
  // Quiz Time: render real CS198 component and verify that explanation is hidden in OPEN,
  // then appears only after switching the preview to REVEAL.
  {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
    const response=await page.goto(`${base}/src/english_lab_games/english_lab_quiz_time_preview_cs21a198.html`,{waitUntil:'networkidle'});
    assert.ok(response&&response.ok(),'Quiz preview no cargó.');
    await page.waitForFunction(()=>document.body.innerText.includes('Elegí la opción que completa correctamente una presentación.'),null,{timeout:10000});
    let text=await page.locator('body').innerText();
    assert.match(text,/My/,'Quiz OPEN no renderizó opciones.');
    assert.doesNotMatch(text,/Usamos [“\"]my[”\"] para hablar de nuestro propio nombre/i,'Quiz filtró explicación antes de REVEAL.');
    await page.locator('#revealBtn').click();
    await page.waitForFunction(()=>document.body.innerText.includes('Usamos “my” para hablar de nuestro propio nombre.'),null,{timeout:5000});
    text=await page.locator('body').innerText();
    assert.match(text,/Usamos “my” para hablar de nuestro propio nombre\./,'Quiz no mostró explicación en REVEAL.');
    assert.equal(errors.length,0,`Quiz produjo pageerror: ${errors.join(' | ')}`);
    await page.screenshot({path:path.join(out,'quiz_390_reveal.png'),fullPage:true});
    result.quiz={
      rendered:true,
      viewport:'390x844',
      options_visible:true,
      explanation_hidden_during_open:true,
      explanation_visible_during_reveal:true,
      page_errors:0,
    };
    await page.close();
  }

  // Word Search: this page mounts the real CS199/CS200 Live stack and self-checks
  // 14x14 rendering, CLAIM_WORD payload, round/puzzle ids and authoritative ranking.
  {
    const page=await browser.newPage({viewport:{width:1440,height:900}});
    const errors=[];
    page.on('pageerror',e=>errors.push(String(e&&e.message||e)));
    const response=await page.goto(`${base}/src/english_lab_games/word_search_live_browser_qa_cs21a200.html`,{waitUntil:'domcontentloaded'});
    assert.ok(response&&response.ok(),'Word Search Live QA no cargó.');
    await page.waitForFunction(()=>document.body.dataset.qaStatus==='PASS' || ['FAIL','ERROR'].includes(document.body.dataset.qaStatus),null,{timeout:15000});
    const status=await page.locator('body').getAttribute('data-qa-status');
    const log=await page.locator('#qa-log').innerText();
    assert.equal(status,'PASS',`Word Search browser QA terminó ${status}: ${log}`);
    for(const marker of [
      'PASS Live renderiza 14x14',
      'PASS Live envía un CLAIM_WORD',
      'PASS Live conserva round_id',
      'PASS Live conserva puzzle_id',
      'PASS snapshot backend convierte claim en 1/10',
      'PASS ranking refleja claim autoritativo',
      'DONE CS21A200'
    ]) assert.match(log,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`Word Search sin evidencia: ${marker}`);
    assert.equal(errors.length,0,`Word Search produjo pageerror: ${errors.join(' | ')}`);
    await page.screenshot({path:path.join(out,'word_search_live_1440.png'),fullPage:true});
    result.word_search={
      rendered:true,
      viewport:'1440x900',
      grid:'14x14',
      claim_word:true,
      round_id:true,
      puzzle_id:true,
      authoritative_claim:'1/10',
      authoritative_ranking:'100 pt',
      page_errors:0,
    };
    await page.close();
  }

  result.ok=true;
  fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
} finally {
  await browser.close();
}
