/* End-to-end live URL smoke, no student identity or external writes. */
const assert=require('node:assert/strict'),{chromium}=require('playwright');
const URL='https://anorteamerican.com/campus-virtual/toeic-integrado/';
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
 const ctx=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone'],acceptDownloads:true});
 const page=await ctx.newPage(),errors=[],failures=[],post=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&/toeic-integrado|exam_prep_lab|toeic-4-skills/.test(r.url()))failures.push(r.status()+' '+r.url())});
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method())&&!r.url().includes('/cdn-cgi/rum'))post.push(r.method()+' '+r.url())});
 let n=0;async function pass(label,fn){await fn();console.log('PASS '+(++n)+' '+label)}
 await pass('HTTPS official domain and assets loaded',async()=>{
  const resp=await page.goto(URL,{waitUntil:'load',timeout:35000});assert.equal(resp.status(),200);
  const source=await page.evaluate(()=>({a:EPL_FORMS.A.items.length,b:EPL_FORMS.B.items.length,s:AN_FOUR_SKILLS_TASKS.speaking.length,w:AN_FOUR_SKILLS_TASKS.writing.length}));
  assert.deepEqual(source,{a:200,b:200,s:11,w:8});
 });
 await pass('Start integrated Listening stage 1 25',async()=>{
  await page.locator('#begin').click();
  assert.match(await page.locator('#question-index').innerText(),/de 25/);
  assert.match(await page.locator('#phase-label').innerText(),/LISTENING/);
 });
 await pass('Production MP3 exists and decodes in Chrome',async()=>{
  const r=page.waitForResponse(resp=>resp.url().endsWith('.mp3')&&resp.status()===200,{timeout:10000});
  await page.locator('audio').evaluate(a=>a.load());await r;
  const a=page.locator('audio');
  await a.evaluate(async el=>{await new Promise((resolve,reject)=>{if(el.readyState>=2)return resolve();el.onloadeddata=resolve;el.onerror=reject;setTimeout(()=>reject(new Error('timeout')),10000)})});
  assert.ok(await a.evaluate(el=>el.readyState>=2));
 });
 await pass('Listening 45 answers across 2 stages',async()=>{
  for(let i=0;i<25;i++){await page.locator('input[name="answer"]').first().check();await page.locator('#next').click();}
  assert.match(await page.locator('#phase-label').innerText(),/Unidad 2\/2/);
  for(let i=0;i<20;i++)await page.locator('#next').click();
  assert.match(await page.locator('#phase-label').innerText(),/READING/);
 });
 await pass('Reading 45 questions with complete passages',async()=>{
  for(let i=0;i<45;i++){
   const current=await page.evaluate(()=>{const s=TOEIC4Debug.state(),it=s.unitIds.reading[s.stage-1][s.index],f=EPL_FORMS[it[0]].items.find(x=>x.item_id===it);return {part:f.part,group:f.passage_group_id}});
   if(current.part===6||current.part===7)assert.ok((await page.locator('#question-context').innerText()).trim().length>=20,'Missing passage '+current.group);
   await page.locator('#next').click();
  }
  assert.match(await page.locator('#phase-label').innerText(),/SPEAKING/);
 });
 await pass('Speaking 11 and fake microphone recording',async()=>{
  await page.locator('[data-act="record"]').click();await page.waitForTimeout(1000);await page.locator('[data-act="stop"]').click();
  const dl=page.locator('a[download]');await dl.waitFor({timeout:10000});
  const down=page.waitForEvent('download');await dl.click();assert.match((await down).suggestedFilename(),/^S01/);
  for(let i=0;i<11;i++)await page.locator('#next').click();
  assert.match(await page.locator('#phase-label').innerText(),/WRITING/);
 });
 await pass('Writing drafts survive HTTPS reload',async()=>{
  await page.locator('#writing').fill('The woman is using her laptop at a table.');
  await page.reload({waitUntil:'load'});assert.match(await page.locator('#writing').inputValue(),/using her laptop/);
 });
 await pass('Writing sections and summary/export complete',async()=>{
  for(let i=0;i<8;i++)await page.locator('#next').click();
  assert.equal(await page.locator('#done').isVisible(),true);
  const down=page.waitForEvent('download');await page.locator('#export').click();assert.match((await down).suggestedFilename(),/integrado/);
 });
 await pass('No unexpected 4xx or JS exceptions or content POST',async()=>{
  assert.deepEqual(failures,[]);assert.deepEqual(errors,[]);assert.deepEqual(post,[]);
 });
 await pass('390px live mobile viewport no horizontal overflow',async()=>{
  const w=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(w.scroll<=w.width+3,JSON.stringify(w));
 });
 console.log('TOEIC_INTEGRADO_LIVE_QA='+n+'/'+n+' PASS');
 await browser.close();
})().catch(e=>{console.error('LIVE QA FAIL: '+e.stack);process.exitCode=1});
