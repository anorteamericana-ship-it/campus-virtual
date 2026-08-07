#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4178';
const output = path.resolve('qa-output/cs21a187-product-lifecycle');
fs.mkdirSync(output,{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1280,height:900}});
const page = await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{ if(response.status()>=500) errors.push(`HTTP ${response.status()} ${response.url()}`); });

try{
  await page.goto(`${base}/src/english_lab_games/english_lab_product_lifecycle_preview_cs21a187.html`,{waitUntil:'networkidle'});

  const roomInput = page.getByLabel('Código de sala');
  await roomInput.waitFor({state:'visible',timeout:15000});
  assert.equal(await roomInput.inputValue(),'','Una sala histórica no puede restaurarse automáticamente.');
  const initialStorage = await page.evaluate(()=>({
    last:localStorage.getItem('elive_last_room'),
    oldPlayer:localStorage.getItem('elive_player_LAB-OLD'),
    wrapped:!!(window.EnglishLabLiveStudentView&&window.EnglishLabLiveStudentView.__cs21a187LifecycleWrapper),
  }));
  assert.equal(initialStorage.last,null);
  assert.equal(initialStorage.oldPlayer,null);
  assert.equal(initialStorage.wrapped,true);
  assert.equal((await page.locator('body').innerText()).includes('LAB-OLD'),false);

  await roomInput.fill('LAB-A');
  await page.getByRole('button',{name:'Entrar a sala'}).click();
  await page.getByText('LAB-A',{exact:true}).first().waitFor({state:'visible',timeout:15000});
  await page.locator('[data-game-engine="MEMORY_MATCH"]').waitFor({state:'visible',timeout:15000});
  const timerText = await page.locator('[role="timer"]').innerText();
  assert.match(timerText,/([12][0-9]|30)s/,'El turno nuevo debe conservar tiempo útil, no iniciar en 0s.');

  const card1=page.getByRole('button',{name:/Tarjeta 1, cerrada/i});
  const card2=page.getByRole('button',{name:/Tarjeta 2, cerrada/i});
  await card1.click();
  await page.getByRole('button',{name:/Tarjeta 1, abierta/i}).waitFor({state:'visible',timeout:5000});
  assert.equal(await page.getByRole('button',{name:/Tarjeta 1, abierta/i}).getAttribute('aria-pressed'),'true');
  await card2.click();
  await page.getByText(/1 \/ 2 pares/).waitFor({state:'visible',timeout:8000});
  const turnCopy = await page.locator('body').innerText();
  assert.match(turnCopy,/Tu turno: Chu QA|Tu turno.*Chu QA/i,'Un acierto debe conservar al mismo jugador.');

  await page.getByRole('button',{name:'Cerrar LAB-A en backend QA'}).click();
  await roomInput.waitFor({state:'visible',timeout:10000});
  const closedStorage = await page.evaluate(()=>({
    last:localStorage.getItem('elive_last_room'),
    playerA:localStorage.getItem('elive_player_LAB-A'),
  }));
  assert.equal(closedStorage.last,null);
  assert.equal(closedStorage.playerA,null);
  const afterClose = await page.locator('body').innerText();
  assert.match(afterClose,/La sala terminó|Entrar a English LAB/i);
  assert.equal(afterClose.includes('0 / 2 pares'),false,'El tablero cerrado no puede seguir pegado en pantalla.');

  await page.evaluate(()=>{ window.__QA_STALE_A_SEEN__=false; window.__QA_TRACK_STALE_A__=true; });
  await roomInput.fill('LAB-B');
  await page.getByRole('button',{name:'Entrar a sala'}).click();
  await page.getByText('LAB-B',{exact:true}).first().waitFor({state:'visible',timeout:15000});
  await page.waitForTimeout(1200);
  const transition = await page.evaluate(()=>({
    staleA:window.__QA_STALE_A_SEEN__,
    last:localStorage.getItem('elive_last_room'),
    playerB:localStorage.getItem('elive_player_LAB-B'),
    calls:window.__QA_CALLS__||[],
  }));
  assert.equal(transition.staleA,false,'LAB-A reapareció durante la entrada a LAB-B.');
  assert.equal(transition.last,'LAB-B');
  assert.equal(transition.playerB,'QA-P1');
  assert.ok(transition.calls.some(call=>call.code==='LAB-A'));
  assert.ok(transition.calls.some(call=>call.code==='LAB-B'));
  assert.deepEqual(errors,[],`Errores de navegador: ${errors.join(' | ')}`);

  await page.screenshot({path:path.join(output,'lifecycle-pass.png'),fullPage:true});
  const result={
    verdict:'PASS_BROWSER_CS21A187',
    stale_room_initially_blocked:true,
    stale_player_identity_removed:true,
    active_card_flips:true,
    correct_pair_visible:true,
    correct_pair_keeps_turn:true,
    closed_room_returns_to_lobby:true,
    closed_room_storage_removed:true,
    next_room_has_no_previous_room_flash:true,
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  await context.close();
  await browser.close();
}
