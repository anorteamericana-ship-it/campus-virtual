const assert=require('node:assert/strict'),{chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),mime={'.html':'text/html;charset=utf-8','.js':'application/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.mp3':'audio/mpeg','.json':'application/json'};
const server=http.createServer((req,res)=>{let name=decodeURI((req.url||'/').split('?')[0]);if(name.endsWith('/'))name+='index.html';let p=path.resolve(root,'.'+name);
if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}
fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'application/octet-stream'});res.end(b)})});
(async()=>{
await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']});
const ctx=await browser.newContext({viewport:{width:390,height:844},permissions:['microphone'],acceptDownloads:true});
const page=await ctx.newPage(),errors=[],posts=[];let checks=0;
page.on('pageerror',e=>errors.push(String(e.message)));page.on('request',r=>{if(r.method()!=='GET'&&r.method()!=='HEAD')posts.push(r.url())});
async function pass(label,fn){await fn();console.log('PASS '+(++checks)+' '+label)}
await pass('HTML and real source banks open',async()=>{
 const r=await page.goto('http://127.0.0.1:'+port+'/toeic-integrado/',{waitUntil:'load'});assert.equal(r.status(),200);
 assert.equal(await page.locator('#begin').count(),1);
 assert.match(await page.locator('#welcome').innerText(),/109 preguntas/);
});
await pass('Start and select Listening 25-item stage 1',async()=>{
 await page.locator('#begin').click();
 assert.match(await page.locator('#phase-label').innerText(),/LISTENING · Unidad 1\/2/);
 assert.match(await page.locator('#question-index').innerText(),/de 25/);
 assert.ok(await page.locator('audio').count()>=1);
});
await pass('Answer through all 25 Listening questions, route foundation',async()=>{
 for(let i=0;i<25;i++){await page.locator('input[name="answer"]').first().check();await page.locator('#next').click()}
 assert.match(await page.locator('#phase-label').innerText(),/LISTENING · Unidad 2\/2/);
 assert.match(await page.locator('#question-index').innerText(),/de 20/);
});
await pass('Complete L2 and transition to Reading',async()=>{
 for(let i=0;i<20;i++)await page.locator('#next').click();
 assert.match(await page.locator('#phase-label').innerText(),/READING · Unidad 1\/2/);
});
await pass('Reading renders original passage with 25 items',async()=>{
 for(let i=0;i<25;i++)await page.locator('#next').click();
 assert.match(await page.locator('#phase-label').innerText(),/READING · Unidad 2\/2/);
 assert.match(await page.locator('#question-index').innerText(),/de 20/);
 for(let i=0;i<7;i++)await page.locator('#next').click();
 const html=await page.locator('#question-context').innerHTML();assert.ok(html.length>0);
});
await pass('Finish Reading and start Speaking',async()=>{
 for(let i=7;i<20;i++)await page.locator('#next').click();
 assert.match(await page.locator('#phase-label').innerText(),/SPEAKING/);
 assert.match(await page.locator('#question-index').innerText(),/de 11/);
});
await pass('Record and download Speaking audio, fake mic',async()=>{
 await page.locator('[data-act="record"]').click();
 await page.locator('[data-act="stop"]').waitFor({state:'visible'});
 await page.waitForTimeout(1100);await page.locator('[data-act="stop"]').click();
 const link=page.locator('a.download');await link.waitFor({timeout:13000});
 const download=page.waitForEvent('download');await link.click();
 assert.match((await download).suggestedFilename(),/^S01\./);
});
await pass('Speaking 11 questions and Writing 8 questions',async()=>{
 for(let i=0;i<11;i++)await page.locator('#next').click();
 assert.match(await page.locator('#phase-label').innerText(),/WRITING/);
 assert.match(await page.locator('#question-index').innerText(),/de 8/);
 await page.locator('#writing').fill('The woman is using her laptop at a table.');
 await page.reload({waitUntil:'load'});assert.match(await page.locator('#writing').inputValue(),/using her laptop/);
 for(let i=0;i<8;i++)await page.locator('#next').click();
 assert.equal(await page.locator('#done').isVisible(),true);
});
await pass('Local results and export TXT',async()=>{
 assert.match(await page.locator('#results').innerText(),/45/);
 assert.match(await page.locator('#results').innerText(),/Speaking/);
 const dl=page.waitForEvent('download');await page.locator('#export').click();assert.equal((await dl).suggestedFilename(),'academia-toeic-integrado-respuestas.txt');
});
await pass('Mobile screen and privacy boundaries',async()=>{
 const widths=await page.evaluate(()=>({w:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert.ok(widths.scroll<=widths.w+3,JSON.stringify(widths));assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);
});
console.log('TOEIC_INTEGRATED_BROWSER_QA='+checks+'/'+checks+' PASS');
await browser.close();server.close();
})().catch(e=>{console.error('FAIL',e.stack);server.close();process.exitCode=1});
