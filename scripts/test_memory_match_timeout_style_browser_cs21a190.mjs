#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4179';
const output=path.resolve('qa-output/cs21a190-timeout-style');
fs.mkdirSync(output,{recursive:true});
const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const context=await browser.newContext({viewport:{width:1600,height:1000}});

try{
  // 1) El guard debe instalar ambos CSS aunque la página no precargue ninguno.
  const stylePage=await context.newPage();
  const styleErrors=[];
  stylePage.on('pageerror',error=>styleErrors.push(error.message));
  await stylePage.goto(`${base}/src/english_lab_games/memory_match_style_guard_preview_cs21a190.html`,{waitUntil:'networkidle'});
  await stylePage.waitForFunction(()=>window.__QA_CS21A190_STYLE__&&window.__QA_CS21A190_STYLE__.base&&window.__QA_CS21A190_STYLE__.classic,{timeout:8000});
  const styleState=await stylePage.evaluate(()=>window.__QA_CS21A190_STYLE__);
  assert.equal(styleState.baseHref,'/styles/english_lab_memory_match_cs21a173.css?v=CS21A190');
  assert.equal(styleState.classicHref,'/styles/english_lab_memory_match_classic_sync_cs21a189.css?v=CS21A190');
  const styleHttp=await stylePage.evaluate(async()=>{
    const links=[...document.querySelectorAll('link[rel="stylesheet"]')].map(link=>link.href);
    const statuses=[];
    for(const url of links){const response=await fetch(url,{cache:'no-store'});statuses.push({url,status:response.status});}
    return statuses;
  });
  assert.ok(styleHttp.length>=2);
  assert.ok(styleHttp.every(row=>row.status===200),`CSS no disponible: ${JSON.stringify(styleHttp)}`);
  assert.deepEqual(styleErrors,[]);
  await stylePage.close();

  // 2) Una primera carta abierta debe desaparecer para TODOS cuando el turno vence.
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400) errors.push(`HTTP ${response.status()} ${response.url()}`);});
  await page.goto(`${base}/src/english_lab_games/memory_match_classic_sync_preview_cs21a189.html`,{waitUntil:'networkidle'});
  await page.locator('[data-classic-sync="true"]').first().waitFor({state:'visible',timeout:15000});
  const panel=id=>page.locator(`[data-panel="${id}"]`);
  const card=(id,index)=>panel(id).locator('.elmm-card').nth(index);
  async function expectState(id,index,state,timeout=7000){
    await page.waitForFunction(({id,index,state})=>{
      const p=document.querySelector(`[data-panel="${id}"]`);
      const c=p&&p.querySelectorAll('.elmm-card')[index];
      return c&&c.getAttribute('data-card-state')===state;
    },{id,index,state},{timeout});
  }

  await card('chu',0).click();
  for(const id of ['chu','naty','teacher']) await expectState(id,0,'REVEALED');

  await page.evaluate(()=>{
    const state=window.__QA_CLASSIC_SYNC_STATE__;
    const now=Date.now();
    state.activeAttempt=null;
    state.boardVersion+=1;
    state.turn={
      ...state.turn,
      turn_number:Number(state.turn.turn_number||1)+1,
      active_player_id:'P2',
      active_team_id:'Equipo Rojo',
      last_player_id:'P1',
      last_team_id:'Equipo Azul',
      reason:'TURN_TIMEOUT',
      turn_started_at:new Date(now).toISOString(),
      turn_ends_at:new Date(now+30000).toISOString(),
    };
    window.updateQaState();
  });

  for(const id of ['chu','naty','teacher']) await expectState(id,0,'HIDDEN',5000);
  await panel('naty').getByText(/Tu turno: Naty/i).waitFor({state:'visible',timeout:5000});
  const finalState=await page.evaluate(()=>window.__QA_CLASSIC_SYNC_STATE__);
  assert.equal(finalState.activeAttempt,null);
  assert.equal(finalState.turn.active_player_id,'P2');
  assert.equal(finalState.turn.reason,'TURN_TIMEOUT');
  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);

  await page.screenshot({path:path.join(output,'timeout-style-pass.png'),fullPage:true});
  const result={
    verdict:'PASS_BROWSER_CS21A190',
    base_style_loaded:true,
    classic_style_loaded:true,
    first_reveal_visible_everywhere:true,
    timeout_hides_first_reveal_everywhere:true,
    timeout_rotates_to_next_player:true,
    stale_attempt_absent:true,
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  await page.close();
}finally{
  await context.close();
  await browser.close();
}
