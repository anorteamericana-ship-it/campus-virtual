#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base=process.env.QA_BASE_URL||'http://127.0.0.1:4178';
const output=path.resolve('qa-output/cs21a188-shared-discovery');
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{if(response.status()>=500) errors.push(`HTTP ${response.status()} ${response.url()}`);});

function panel(id){return page.locator(`[data-panel="${id}"]`);}
function card(id,index){return panel(id).locator('.elmm-card').nth(index);}
async function expectState(id,index,state){
  await page.waitForFunction(({id,index,state})=>{
    const p=document.querySelector(`[data-panel="${id}"]`);
    const c=p && p.querySelectorAll('.elmm-card')[index];
    return c && c.getAttribute('data-card-state')===state;
  },{id,index,state},{timeout:8000});
}
async function states(id){return panel(id).locator('.elmm-card').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('data-card-state')));}

try{
  await page.goto(`${base}/src/english_lab_games/memory_match_shared_discovery_preview_cs21a188.html`,{waitUntil:'networkidle'});
  await page.locator('[data-shared-discovery="true"]').first().waitFor({state:'visible',timeout:15000});
  assert.equal(await page.locator('[data-shared-discovery="true"]').count(),3,'Deben existir Chu, Naty y docente sobre el mismo tablero.');
  for(const id of ['chu','naty','teacher']) assert.deepEqual(await states(id),['HIDDEN','HIDDEN','HIDDEN','HIDDEN']);

  // Chu descubre bicycle. Debe quedar público en las tres vistas, sin dueño final.
  await card('chu',0).click();
  for(const id of ['chu','naty','teacher']) await expectState(id,0,'DISCOVERED');
  for(const id of ['chu','naty','teacher']) assert.match(await card(id,0).innerText(),/Descubierta por Chu/i);
  let canonical=await page.evaluate(()=>window.__QA_SHARED_DISCOVERY_STATE__);
  assert.equal(canonical.discovered['P1-L'].discovered_by,'P1');
  assert.equal(canonical.claimed['PAIR-1'],undefined);

  // Chu falla bicycle + teacher. Las dos quedan públicas y el turno pasa a Naty.
  await card('chu',1).click();
  await page.waitForFunction(()=>window.__QA_SHARED_DISCOVERY_STATE__?.turn?.active_player_id==='P2',{timeout:8000});
  for(const id of ['chu','naty','teacher']){
    await expectState(id,0,'DISCOVERED');
    await expectState(id,1,'DISCOVERED');
  }
  canonical=await page.evaluate(()=>window.__QA_SHARED_DISCOVERY_STATE__);
  assert.equal(canonical.discovered['P1-L'].discovered_by,'P1');
  assert.equal(canonical.discovered['P2-L'].discovered_by,'P1');
  assert.equal(canonical.turn.active_player_id,'P2');
  assert.equal(canonical.points.P1,0);
  await panel('naty').getByText(/Tu turno: Naty/i).waitFor({state:'visible',timeout:8000});

  // Naty aprovecha bicycle ya descubierto y encuentra bicicleta.
  await card('naty',0).click();
  await card('naty',2).click();
  await page.waitForFunction(()=>window.__QA_SHARED_DISCOVERY_STATE__?.claimed?.['PAIR-1']?.claimed_by==='P2',{timeout:8000});
  for(const id of ['chu','naty','teacher']){
    await expectState(id,0,'CLAIMED');
    await expectState(id,2,'CLAIMED');
    assert.match(await card(id,0).innerText(),/Naty.*\+1/i);
    assert.match(await card(id,2).innerText(),/Naty.*\+1/i);
  }
  canonical=await page.evaluate(()=>window.__QA_SHARED_DISCOVERY_STATE__);
  assert.equal(canonical.discovered['P1-L'].discovered_by,'P1','El descubridor original de bicycle debe seguir siendo Chu.');
  assert.equal(canonical.discovered['P1-R'].discovered_by,'P2','La segunda carta la descubrió Naty.');
  assert.equal(canonical.claimed['PAIR-1'].claimed_by,'P2','Naty debe reclamar la pareja que completó.');
  assert.equal(canonical.points.P2,1);
  assert.equal(canonical.turn.active_player_id,'P2','Acierto conserva el turno de Naty.');
  assert.equal(canonical.turn.active_team_id,'Equipo Rojo');
  assert.ok(Number(canonical.turn.turn_number)>=3);
  assert.equal(await card('naty',0).isDisabled(),true,'Una carta reclamada ya no puede reutilizarse.');
  assert.equal(await card('naty',2).isDisabled(),true,'La segunda carta reclamada ya no puede reutilizarse.');
  await panel('naty').getByText(/Tu turno: Naty/i).waitFor({state:'visible',timeout:8000});

  // Las tres pantallas deben derivar exactamente los mismos estados del tablero.
  const chuStates=await states('chu');
  const natyStates=await states('naty');
  const teacherStates=await states('teacher');
  assert.deepEqual(chuStates,natyStates);
  assert.deepEqual(chuStates,teacherStates);
  assert.deepEqual(chuStates,['CLAIMED','DISCOVERED','CLAIMED','HIDDEN']);
  assert.deepEqual(errors,[],`Errores de navegador: ${errors.join(' | ')}`);

  const timerText=await panel('naty').locator('[role="timer"]').innerText();
  assert.match(timerText,/([12][0-9]|30)s/,'Después del acierto Naty debe conservar tiempo útil.');

  await page.screenshot({path:path.join(output,'shared-discovery-pass.png'),fullPage:true});
  const result={
    verdict:'PASS_BROWSER_CS21A188',
    viewers:3,
    hidden_to_discovered_global:true,
    discoverer_preserved:true,
    mismatch_keeps_cards_public:true,
    mismatch_rotates_turn:true,
    matcher_can_use_previous_discovery:true,
    matcher_claims_both_cards:true,
    claimant_differs_from_original_discoverer:true,
    claimed_cards_disabled:true,
    correct_pair_points:1,
    correct_pair_keeps_turn:true,
    all_views_identical:true,
    timer_resets_after_claim:true,
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  await context.close();
  await browser.close();
}
