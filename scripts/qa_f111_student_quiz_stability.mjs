import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CAMPUS_PLAYWRIGHT_MODULE||'playwright');
const source=process.env.F111_TEST_BASE_REF?execFileSync('git',['show',process.env.F111_TEST_BASE_REF+':src/student_b1_progress_f111.js'],{encoding:'utf8'}):fs.readFileSync(new URL('../src/student_b1_progress_f111.js',import.meta.url),'utf8');
const ROOT='https://f111-stability.invalid';
const browser=await chromium.launch({headless:true,executablePath:process.env.CAMPUS_CHROME_EXECUTABLE||undefined});
let checks=0;
const ck=(condition,name)=>{assert.ok(condition,name);checks++;console.log('PASS '+name)};
const item=(n,l,state)=>({quiz_id:'IC5_B1_WQ'+n,grupo:'QA-GROUP',nivel:'B1',leccion:l,peso_oficial:0,estado_intento:state});
const fixtures=[item('02',8,'SIN_INICIAR'),item('03',13,'BORRADOR'),item('04',16,'ENTREGADO')];
const errors=[],calls=[];let items=fixtures;
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(u.origin!==ROOT)return r.abort();
  if(u.pathname==='/'){return r.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><div id="root"><aside data-role="student"><button data-nav-id="evaluaciones">Evaluaciones</button></aside><section data-screen-label="Estudiante \u00b7 Evaluaciones"><div role="tablist"></div></section></div><script>window.qaToken='SYNTHETIC';window.getSessionToken=()=>window.qaToken;window.F111_QZ_API_URL='${ROOT}/api';window.observerCalls=0;window.observerTripped=false;const MO=window.MutationObserver;window.MutationObserver=class extends MO{constructor(cb){super((records,observer)=>{if(++window.observerCalls>40){window.observerTripped=true;observer.disconnect();return}cb(records,observer)})}};</script><script src="/student.js"></script>`})}
  if(u.pathname==='/student.js')return r.fulfill({contentType:'application/javascript',body:source});
  if(u.pathname==='/api'){const b=r.request().postDataJSON();calls.push(b.fn);assert.equal(b.token,'SYNTHETIC');assert.equal(b.fn,'qzProgressStudentB1Active');return r.fulfill({json:{ok:true,quizzes:items}})}
  return r.abort();
 });
 await page.goto(ROOT);const badge=page.locator('[data-f111-quiz-menu-badge]'),section=page.locator('[data-f111-student-b1-pc-extra]'),cards=page.locator('.f111-b1-extra-card');
 await cards.nth(2).waitFor();await page.waitForTimeout(150);
 ck(!await page.evaluate(()=>window.observerTripped),'observer settles with pending quizzes');
 ck(await badge.innerText()==='2 quizzes pendientes','pending counter accurate');
 ck(await cards.count()===3&&await cards.locator('button').count()===2,'delivered quiz cannot restart');
 await page.evaluate(()=>{window.originalCard=document.querySelector('.f111-b1-extra-card');window.originalBadge=document.querySelector('[data-f111-quiz-menu-badge]');window.before=window.observerCalls;document.getElementById('root').append(document.createElement('span'))});await page.waitForTimeout(100);
 ck(await page.evaluate(()=>window.originalBadge===document.querySelector('[data-f111-quiz-menu-badge]')&&window.originalCard===document.querySelector('.f111-b1-extra-card')&&window.observerCalls-window.before<=2),'unrelated mutation preserves nodes and settles');
 await page.getByRole('button',{name:'ACTUALIZAR INVITACIONES'}).click();await page.waitForTimeout(150);
 ck(await page.evaluate(()=>window.originalCard===document.querySelector('.f111-b1-extra-card')),'unchanged refresh preserves cards');
 items=[item('02',8,'ENTREGADO'),fixtures[1],fixtures[2]];await page.getByRole('button',{name:'ACTUALIZAR INVITACIONES'}).click();await page.waitForFunction(()=>document.querySelector('[data-f111-quiz-menu-badge]')?.textContent==='1 quiz pendiente');
 ck(await cards.locator('button').count()===1,'changed attempt state updates counter and controls');
 items=[];await page.getByRole('button',{name:'ACTUALIZAR INVITACIONES'}).click();await section.waitFor({state:'hidden'});await page.waitForTimeout(100);
 ck(await badge.count()===0&&await section.evaluate(e=>e.childNodes.length)===0&&!await page.evaluate(()=>window.observerTripped),'empty result is stable and clears counter');
 await page.evaluate(()=>{document.querySelector('[data-screen-label]').innerHTML='<div><div role="tablist"></div></div>'});await page.waitForTimeout(100);
 ck(await section.count()===1&&await section.isHidden(),'nested tablist remounts without insertBefore error');
 items=fixtures;await page.evaluate(()=>window.dispatchEvent(new Event('an:session-changed')));await cards.nth(2).waitFor();await page.evaluate(()=>{window.qaToken='';window.dispatchEvent(new Event('an:session-changed'))});await section.waitFor({state:'hidden'});
 ck(await badge.count()===0&&!await page.evaluate(()=>window.observerTripped),'logout clears list and badge without loop');
 ck(errors.length===0&&calls.every(x=>x==='qzProgressStudentB1Active'),'no browser exceptions or write requests');
 console.log('TOTAL '+checks+' PASS synthetic browser');
}finally{await browser.close()}
