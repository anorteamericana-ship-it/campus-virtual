#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.QA_BASE_URL||'http://127.0.0.1:4191').replace(/\/$/,'');
const out=path.resolve('qa-output/cs21a191-hangman');
fs.mkdirSync(out,{recursive:true});

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const response=await page.goto(`${base}/src/english_lab_games/hangman_preview_cs21a191.html`,{waitUntil:'networkidle'});
  assert.ok(response&&response.ok(),'preview cargó');
  await page.waitForSelector('.elh191-key');
  assert.equal(await page.locator('.elh191-key').count(),26,'teclado A-Z completo');
  assert.equal(await page.locator('.elh191-life').count(),6,'seis vidas iniciales');
  const initial=await page.locator('#pattern').innerText();
  assert.ok(!initial.includes('C'),'respuesta oculta al inicio');

  await page.locator('.elh191-key',{hasText:/^C$/}).click();
  const afterC=await page.locator('#pattern').innerText();
  assert.ok(afterC.includes('C'),'letra correcta se revela');
  assert.equal((afterC.match(/C/g)||[]).length,2,'se revelan todas las apariciones');
  assert.equal((await page.locator('#score').innerText()).trim(),'20 pts');
  assert.match(await page.locator('#message').innerText(),/Conservás el turno/i);

  await page.locator('#solve').fill('CHECK IN');
  await page.locator('#solveBtn').click();
  assert.match(await page.locator('#message').innerText(),/¡Resuelto! CHECK IN/i);
  assert.equal((await page.locator('#score').innerText()).trim(),'180 pts');

  const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(overflow.scroll<=overflow.client+2,`sin overflow horizontal a 390 px: ${JSON.stringify(overflow)}`);
  await page.screenshot({path:path.join(out,'hangman_preview_390.png'),fullPage:true});
  fs.writeFileSync(path.join(out,'browser_result.json'),JSON.stringify({ok:true,version:'CS21A191',viewport:'390x844',keyboard:26,lives:6,all_occurrences_revealed:true,solve:true,score_after_letter:20,score_after_solve:180,no_horizontal_overflow:true},null,2)+'\n');
  console.log(JSON.stringify({ok:true,version:'CS21A191',package_browser:true,viewport:390,keyboard:26,lives:6,score:180,noHorizontalOverflow:true},null,2));
}finally{
  await browser.close();
}
