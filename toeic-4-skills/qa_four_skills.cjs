// QA reproducible: Speaking/Writing on the local preview only; no actual users or backend writes.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const context=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone'],acceptDownloads:true});
 const page=await context.newPage(),errors=[],nonGet=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))nonGet.push(r.method()+' '+r.url())});
 const base='http://127.0.0.1:8765/toeic-4-skills/';
 let checks=0;
 async function pass(label,fn){await fn();checks++;console.log('PASS '+String(checks).padStart(2,'0')+' '+label)}
 await pass('HTTP page and original test data',async()=>{
  const res=await page.goto(base,{waitUntil:'load',timeout:22000});
  assert.equal(res.status(),200);
  const data=await page.evaluate(()=>({speaking:AN_FOUR_SKILLS_TASKS.speaking.length,writing:AN_FOUR_SKILLS_TASKS.writing.length,original:AN_FOUR_SKILLS_TASKS.original}));
  assert.deepEqual(data,{speaking:11,writing:8,original:true});
 });
 await pass('Eleven speaking controls and clear notices',async()=>{
  assert.equal(await page.locator('#task-nav button').count(),11);
  assert.match(await page.locator('.hero').innerText(),/11 tareas orales/);
  assert.match(await page.locator('.principles').innerText(),/no se suben a servidores/);
 });
 await pass('Speaking tasks 1–11 in sequence',async()=>{
  for(let i=0;i<11;i++){
   assert.match(await page.locator('#task-number').innerText(),new RegExp((i+1)+'/11'));
   if(i<10)await page.locator('#next').click();
  }
  assert.match(await page.locator('.prompt').innerText(),/flexible working hours/);
 });
 await pass('Speaking pictures and schedule render',async()=>{
  await page.locator('#task-nav button[data-index="2"]').click();
  const image=page.locator('.visual img');await image.waitFor();assert.equal(await image.evaluate(el=>el.complete&&el.naturalWidth>0),true);
  await page.locator('#task-nav button[data-index="7"]').click();
  assert.equal(await page.locator('.info-table tbody tr').count(),6);
 });
 await pass('Microphone opt-in can record and stop',async()=>{
  await page.locator('#task-nav button[data-index="0"]').click();
  await page.locator('[data-action="record"]').click();
  await page.locator('[data-action="stop"]').waitFor({state:'visible',timeout:10000});
  await page.waitForTimeout(1000);
  await page.locator('[data-action="stop"]').click();
  await page.locator('.playback').waitFor({state:'visible',timeout:11000});
  assert.equal(await page.locator('a[download^="S01."]').count(),1);
 });
 await pass('Recording exists only in memory and downloadable',async()=>{
  const dl=page.waitForEvent('download');
  await page.locator('a[download^="S01."]').click();
  const file=await dl;assert.match(file.suggestedFilename(),/^S01\./);
  const stream=await page.evaluate(()=>({storedInLocal:localStorage.getItem('an_toeic_four_skills_recordings')}));
  assert.equal(stream.storedInLocal,null);
 });
 await pass('Switch to all eight writing tasks',async()=>{
  await page.locator('#choose-writing').click();
  assert.equal(await page.locator('#task-nav button').count(),8);
  assert.match(await page.locator('#task-number').innerText(),/1\/8/);
 });
 await pass('Writing image and pair of required words',async()=>{
  assert.match(await page.locator('.required-words').innerText(),/woman/);
  assert.match(await page.locator('.required-words').innerText(),/laptop/);
  const image=page.locator('.visual img');assert.equal(await image.evaluate(el=>el.complete&&el.naturalWidth>0),true);
 });
 await pass('Local writing draft saved and restored',async()=>{
  await page.locator('#response').fill('The woman is working on her laptop near a window.');
  await page.locator('#next').click();await page.locator('#previous').click();
  assert.match(await page.locator('#response').inputValue(),/working on her laptop/);
  await page.reload({waitUntil:'load'});
  await page.locator('#choose-writing').click();
  assert.match(await page.locator('#response').inputValue(),/working on her laptop/);
 });
 await pass('One shared 8-minute window across writing items 1–5',async()=>{
  await page.locator('[data-action="writing-timer"]').click();
  const a=await page.locator('#countdown').innerText();
  await page.locator('#next').click();
  const b=await page.locator('#countdown').innerText();
  assert.match(a,/^(8:00|7:5[0-9])$/);assert.match(b,/^(8:00|7:5[0-9])$/);
 });
 await pass('Professional email and separate timing',async()=>{
  await page.locator('#task-nav button[data-index="5"]').click();
  assert.match(await page.locator('.email').innerText(),/Training Coordinator/);
  assert.match(await page.locator('#time-advice').innerText(),/10 min/);
 });
 await pass('Essay guidance and accurate word counter',async()=>{
  await page.locator('#task-nav button[data-index="7"]').click();
  assert.match(await page.locator('#time-advice').innerText(),/30 min/);
  await page.locator('#response').fill('I think online training is useful because it is flexible.');
  assert.match(await page.locator('#wordcount').innerText(),/10 palabras/);
 });
 await pass('Export writing answers as local text',async()=>{
  const dl=page.waitForEvent('download');
  await page.locator('[data-action="download-writing"]').click();
  const file=await dl;assert.equal(file.suggestedFilename(),'academia-toeic-writing-practice.txt');
 });
 await pass('No data submitted to external services',async()=>{assert.deepEqual(nonGet,[]);assert.deepEqual(errors,[])});
 await pass('Mobile viewport has no horizontal overflow',async()=>{const widths=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(widths.scroll<=widths.w+3,JSON.stringify(widths))});
 await browser.close();
 console.log('QA_FOUR_SKILLS='+checks+'/15 PASS');
})().catch(e=>{console.error('QA_FOUR_SKILLS_FAIL '+String(e.stack).slice(0,1800));process.exitCode=1});
