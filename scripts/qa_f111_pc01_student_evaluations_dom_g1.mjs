// F111 PC01 G1. Browser regression against the exact React screen DOM contract.
// Synthetic backend only: no real accounts, deliveries, or spreadsheet changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const student=fs.readFileSync(new URL('../src/student_pc01_f111.js',import.meta.url),'utf8');
const experience=fs.readFileSync(new URL('../src/student_experience.jsx',import.meta.url),'utf8');
assert.match(experience,/<div className="student-page student-page-evaluations" data-screen-label="Estudiante · Evaluaciones"/,
 'actual React Evaluaciones must still render a div');
assert.ok(!student.includes('section[data-screen-label="Estudiante · Evaluaciones"]'),
 'selector must not require a section element');

const browser=await chromium.launch({headless:true});
let count=0;
try{
 for(const state of ['SIN_INICIAR','BORRADOR','ENTREGADO','REVISADO','DESCONOCIDO']){
  const page=await browser.newPage();
  await page.route('https://f111-g1.invalid/**',async route=>route.fulfill({
    status:200,contentType:'text/html',body:'<!doctype html><html><body></body></html>'
  }));
  await page.goto('https://f111-g1.invalid/campus.html');
  await page.setContent('<main id="root"><div class="student-page student-page-evaluations" data-screen-label="Estudiante · Evaluaciones"><div role="tablist"></div><div role="tabpanel"></div></div></main>');
  await page.evaluate(s=>{
   window.__state=s;window.__apiCalls=[];
   window.F111_QZ_API_URL='https://qz.synthetic.invalid/exec';
   window.getSessionToken=()=> 'SYNTHETIC_ONLY';
   window.fetch=async (_url,options)=>{
    const body=JSON.parse(options.body);
    window.__apiCalls.push(body.fn);
    const response=body.fn==='qzProgressStudentActive'
     ?{ok:true,disponible:true,grupo:'B1-KJ18-C3-0826',nivel:'B1',leccion:4,peso_oficial:0}
     :{ok:true,quiz_id:'IC5_B1_WQ01',estado:window.__state,peso_oficial:0};
    return {ok:true,json:async()=>response};
   };
   const Original=window.MutationObserver;
   window.__rootCallbacks=0;
   window.MutationObserver=class extends Original{
    constructor(fn){super((...args)=>{window.__rootCallbacks++;fn(...args);});}
   };
  },state);
  await page.addScriptTag({content:student});
  const card=page.locator('[data-f111-student-pc01]');
  await card.waitFor();
  await page.waitForFunction(()=>document.querySelector('[data-f111-student-pc01] p')?.textContent!=='Lección 4 · Unidades 1–2 · 25 preguntas');
  await page.waitForTimeout(250);
  assert.equal(await card.isVisible(),true,state+': visible in Evaluaciones');
  assert.equal(await card.count(),1,state+': exactly one card');
  const btn=card.locator('button');
  const invite=page.locator('.f111-pc01-invite');
  if(state==='SIN_INICIAR'){
   assert.equal(await btn.isVisible(),true);
   assert.match(await btn.innerText(),/INICIAR/);
   assert.equal(await invite.count(),1);
   await invite.getByText('VER MÁS TARDE').click();
   assert.equal(await invite.count(),0);
   assert.equal(await btn.isVisible(),true,'Later preserves the card');
   await btn.click();
   assert.equal(await page.locator('.f111-pc01-modal').count(),1);
   await page.getByRole('button',{name:'Cerrar'}).click();
  }else if(state==='BORRADOR'){
   assert.equal(await btn.isVisible(),true,'saved draft must resume');
   assert.match(await btn.innerText(),/CONTINUAR/);
   assert.equal(await invite.count(),0);
   await btn.click();
   assert.equal(await page.locator('.f111-pc01-modal').count(),1);
   await page.getByRole('button',{name:'Cerrar'}).click();
  }else{
   assert.equal(await btn.isVisible(),false,state+': no resubmit');
   assert.equal(await invite.count(),0,state+': no reinvite');
   if(state==='ENTREGADO')assert.match(await card.locator('p').innerText(),/Pendiente de revisión docente/);
   if(state==='REVISADO')assert.match(await card.locator('p').innerText(),/entregada y revisada/);
  }
  const initial=await page.evaluate(()=>window.__rootCallbacks);
  await page.evaluate(()=>document.querySelector('[role="tabpanel"]').appendChild(document.createElement('span')));
  await page.waitForTimeout(250);
  const after=await page.evaluate(()=>window.__rootCallbacks);
  assert.ok(after-initial<15,state+': unbounded observer callbacks: '+(after-initial));
  // React may remove an injected child without replacing its enclosing DIV.
  // The observer must restore the card without producing duplicates or new API calls.
  await card.evaluate(node=>node.remove());
  await page.waitForFunction(()=>!!document.querySelector('[data-f111-student-pc01]'));
  assert.equal(await card.count(),1,state+': card should recover after React child replacement');
  assert.equal(await card.isVisible(),true,state+': recovered card remains visible');
  assert.deepEqual(await page.evaluate(()=>window.__apiCalls),
   ['qzProgressStudentActive','qzProgressMyAttempt'],state+': no repeated polling');
  count++;
  await page.close();
 }
}finally{await browser.close();}
console.log('PASS F111 PC01 G1: '+count+' states, synthetic DOM/Chromium, no real student writes');
