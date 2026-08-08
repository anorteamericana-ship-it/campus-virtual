#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4178';
const output=path.resolve('qa-output/cs21a189-classic-sync');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=400) errors.push(`HTTP ${response.status()} ${response.url()}`);});

function panel(id){return page.locator(`[data-panel="${id}"]`);}
function card(id,index){return panel(id).locator('.elmm-card').nth(index);}
async function expectState(id,index,state,timeout=7000){
  await page.waitForFunction(({id,index,state})=>{
    const p=document.querySelector(`[data-panel="${id}"]`);const c=p&&p.querySelectorAll('.elmm-card')[index];return c&&c.getAttribute('data-card-state')===state;
  },{id,index,state},{timeout});
}
async function states(id){return panel(id).locator('.elmm-card').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-card-state')));}

try{
  await page.goto(`${base}/src/english_lab_games/memory_match_classic_sync_preview_cs21a189.html`,{waitUntil:'networkidle'});
  await page.locator('[data-classic-sync="true"]').first().waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('[data-classic-sync="true"]').count(),3,'Deben existir Chu, Naty y docente.');
  for(const id of ['chu','naty','teacher']) assert.deepEqual(await states(id),['HIDDEN','HIDDEN','HIDDEN','HIDDEN']);
  assert.equal(await page.locator('[data-classic-sync-adapter="true"]').first().getAttribute('data-live-poll-ms'),'550');

  // 1) Chu abre una carta: los tres clientes deben verla abierta.
  const firstStarted=Date.now();
  await card('chu',0).click();
  for(const id of ['chu','naty','teacher']) await expectState(id,0,'REVEALED');
  const firstRemoteMs=Date.now()-firstStarted;
  assert.ok(firstRemoteMs<=2200,`Primera carta remota tardó ${firstRemoteMs}ms.`);
  for(const id of ['chu','naty','teacher']) assert.match(await card(id,0).innerText(),/bicycle/i);

  // 2) Chu abre una segunda incorrecta: todos deben ver ambas simultáneamente.
  const mismatchStarted=Date.now();
  await card('chu',1).click();
  for(const id of ['chu','naty','teacher']){
    await expectState(id,0,'REVEALED');
    await expectState(id,1,'REVEALED');
    assert.match(await card(id,1).innerText(),/teacher/i);
  }
  await page.locator('.elmm-flipback-banner').first().waitFor({state:'visible',timeout:3000});
  const mismatchRemoteMs=Date.now()-mismatchStarted;
  assert.ok(mismatchRemoteMs<=2200,`Mismatch remoto tardó ${mismatchRemoteMs}ms.`);

  // Durante la pausa las dos siguen abiertas; luego deben cerrarse en las tres vistas.
  await page.waitForTimeout(900);
  for(const id of ['chu','naty','teacher']){
    assert.equal(await card(id,0).getAttribute('data-card-state'),'REVEALED');
    assert.equal(await card(id,1).getAttribute('data-card-state'),'REVEALED');
  }
  for(const id of ['chu','naty','teacher']){
    await expectState(id,0,'HIDDEN',5000);
    await expectState(id,1,'HIDDEN',5000);
  }
  await panel('naty').getByText(/Tu turno: Naty/i).waitFor({state:'visible',timeout:5000});
  const afterMismatch=await page.evaluate(()=>window.__QA_CLASSIC_SYNC_STATE__);
  assert.equal(afterMismatch.points.P1,0);
  assert.equal(afterMismatch.turn.active_player_id,'P2');

  // 3) Naty encuentra bicycle + bicicleta. Quedan abiertas definitivamente y conserva turno.
  await card('naty',0).click();
  for(const id of ['chu','naty','teacher']) await expectState(id,0,'REVEALED');
  await card('naty',2).click();
  for(const id of ['chu','naty','teacher']){
    await expectState(id,0,'CLAIMED');
    await expectState(id,2,'CLAIMED');
    assert.match(await card(id,0).innerText(),/Naty.*\+1/i);
  }
  const afterMatch=await page.evaluate(()=>window.__QA_CLASSIC_SYNC_STATE__);
  assert.equal(afterMatch.points.P2,1);
  assert.equal(afterMatch.turn.active_player_id,'P2','Acierto conserva turno de Naty.');
  await panel('naty').getByText(/Tu turno: Naty/i).waitFor({state:'visible',timeout:5000});
  assert.equal(await card('naty',0).isDisabled(),true);
  assert.equal(await card('naty',2).isDisabled(),true);

  const chu=await states('chu');const naty=await states('naty');const teacher=await states('teacher');
  assert.deepEqual(chu,naty);assert.deepEqual(chu,teacher);assert.deepEqual(chu,['CLAIMED','HIDDEN','CLAIMED','HIDDEN']);

  const pollCalls=await page.evaluate(()=>window.__QA_POLL_CALLS__||[]);
  assert.ok(pollCalls.some(call=>call.fn==='englishLabMemoryMatchGetPlayerState'&&call.player_id==='P1'));
  assert.ok(pollCalls.some(call=>call.fn==='englishLabMemoryMatchGetPlayerState'&&call.player_id==='P2'));
  assert.ok(pollCalls.some(call=>call.fn==='englishLabMemoryMatchGetRoomControl'));
  assert.deepEqual(errors,[],`Errores de navegador: ${errors.join(' | ')}`);

  await page.screenshot({path:path.join(output,'classic-sync-pass.png'),fullPage:true});
  const result={
    verdict:'PASS_BROWSER_CS21A189',
    independent_clients:3,
    live_poll_ms:550,
    first_reveal_remote_ms:firstRemoteMs,
    mismatch_remote_ms:mismatchRemoteMs,
    first_card_visible_everywhere:true,
    mismatch_two_cards_visible_everywhere:true,
    mismatch_flip_back_everywhere:true,
    mismatch_rotates_turn_after_flipback:true,
    match_stays_face_up_everywhere:true,
    correct_pair_points:1,
    correct_pair_keeps_turn:true,
    all_views_identical:true,
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  await context.close();await browser.close();
}
