// F111 R32: B1 PC02 must be a REAL digital quiz, same functional pattern as B1 PC01.
// Original-source check: ic5_intro_wq_u3to4.pdf, units 3–4, 25 points.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import http from 'node:http';
import path from 'node:path';

const html=fs.readFileSync('modulos/qz_b1_pc02_preview.html','utf8');
const admin=fs.readFileSync('modulos/examenes.html','utf8');
const teacher=fs.readFileSync('src/teacher_quiz_review_f111.js','utf8');
const ref=fs.readFileSync('modulos/qz_b1_pc01_digital.html','utf8');
const audio=fs.readFileSync('media/qz32/b1_pc02_listening_track02.mp3');
let checks=0;
function ok(value,reason){assert.ok(value,reason);checks++}
function eq(a,b,msg){assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),msg);checks++}
function includes(source,part,msg){ok(source.includes(part),msg)}
const begin=html.indexOf('const sections=[');
const end=html.indexOf('\nconst matchOptions=',begin);
ok(begin>=0&&end>begin,'sections present in new digital quiz');
const sections=vm.runInNewContext(html.slice(begin,end)+'\nsections;',{});
eq(sections.map(s=>s.id),['A','B','C','D','E'],'original five sections');
eq(sections.map(s=>s.items.length),[4,5,5,5,6],'4+5+5+5+6=25 responses');
eq(sections.reduce((n,s)=>n+s.points,0),25,'25 score points');
eq(sections.reduce((n,s)=>n+s.items.length,0),25,'25 answer entries');
eq(sections[0].items[0][1],'Where is Justine from?','A original question');
eq(sections[0].items[0][2].length,3,'A original three choices');
eq(sections[0].items[0][2][0],"She's from Canada.",'A choice text, not PDF placeholder');
eq(sections[1].items[4][2],['interesting','pretty','handsome'],'B real answer choices');
eq(sections[2].items[4][1],"Are these Peter's and Kathy's coats?",'C matching original question');
eq(sections[3].items[3][0],'D4a','D4 must have two answers');
eq(sections[3].items[4][0],'D4b','D4 second answer');
eq(sections[4].items[5][1],"B: He's shy and very quiet.",'E sixth original prompt');
eq(audio.length,1464170,'original file bytes');
ok(audio.subarray(0,3).toString()==='ID3','real MP3 starts with ID3');
eq(crypto.createHash('sha256').update(audio).digest('hex').toUpperCase(),
 '5B6E07F8B9531B2D0CB5F632BD177B43556E236B3EE9C692A9B7345774960943',
 'MP3 SHA-256 from institution source');
includes(html,'b1_pc02_listening_track02.mp3','listening in section A');
includes(html,'matchOptions.forEach','C displays complete text of each match');
includes(html,'<button type="button" id="finish"','same B1 PC01 finish-preview behavior');
ok(!/s\.locked|locked:true|Opción \d del PDF|según el PDF/i.test(html),'no locked A or generic PDF controls');
ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|postMessage|localStorage|sessionStorage/.test(html),
 'preview has no network writes, token or persistence');
includes(admin,"button.textContent='Ver Progress Check'","simple admin button");
includes(admin,'qz_b1_pc02_preview.html','admin links B1 PC02');
includes(teacher,"make('button','Ver Progress Check'","teacher direct view button");
ok(!/grupo=B1-KJ18/.test(admin),'no hardcoded group');
includes(ref,"const sections=[".replace('const','var'),'reference B1 PC01 digital flow');
console.log('F111_B1_PC02_R32_STATIC_PASS '+checks+'/'+checks+
 '; source PDF questions, 25 answers, original MP3, one-click, no group/no writes');

if(process.env.F111_BROWSER!=='1')process.exit(0);
const {chromium}=await import('playwright');
const base=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.mp3':'audio/mpeg','.js':'text/javascript'};
const server=http.createServer((req,res)=>{
 let u;try{u=new URL(req.url,'http://127.0.0.1');}catch(_){res.writeHead(400);res.end();return}
 const rel=decodeURIComponent(u.pathname).replace(/^\/+/,'');
 const file=path.resolve(base,rel);
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
  res.writeHead(404);res.end('not found');return;
 }
 const type=mime[path.extname(file)]||'application/octet-stream';
 const stat=fs.statSync(file);
 // Chrome seeks MP3 files with HTTP Range; a raw 200-only test server can
 // report Infinity/NaN duration even when the underlying MP3 is genuine.
 const range=path.extname(file)==='.mp3'?String(req.headers.range||'').match(/^bytes=(\d+)-(\d*)$/):null;
 if(range){
  const start=Number(range[1]),stop=range[2]?Math.min(Number(range[2]),stat.size-1):stat.size-1;
  if(start>=stat.size||stop<start){res.writeHead(416);res.end();return}
  res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes',
    'Content-Range':'bytes '+start+'-'+stop+'/'+stat.size,
    'Content-Length':stop-start+1,'Cache-Control':'no-store'});
  fs.createReadStream(file,{start,end:stop}).pipe(res);return;
 }
 res.writeHead(200,{'Content-Type':type,'Accept-Ranges':'bytes',
  'Content-Length':stat.size,'Cache-Control':'no-store'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const httpWrites=[];
 const pageErrors=[];
 page.on('request',req=>{if(req.method()!=='GET')httpWrites.push(req.method()+' '+req.url())});
 page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
 await page.goto('http://127.0.0.1:'+server.address().port+'/modulos/qz_b1_pc02_preview.html?preview=1');
 await page.getByRole('heading',{name:/Progress Check 02/}).waitFor({timeout:15000});
 eq(await page.locator('nav button').count(),5,'browser has five tabs');
 eq(await page.locator('.item').count(),4,'A has four listening questions');
 eq(await page.locator('.item input[type=radio]:enabled').count(),12,'A all twelve options enabled');
 const player=page.locator('audio');
 eq(await player.count(),1,'original audio control visible');
 await page.waitForFunction(()=>document.querySelector('audio')?.readyState>=1,{timeout:15000});
 const duration=await player.evaluate(el=>el.duration);
 ok(Number.isFinite(duration)&&duration>80&&duration<110,'real audio metadata duration');
 await player.evaluate(el=>el.play());
 await page.waitForFunction(()=>!document.querySelector('audio')?.paused,{timeout:10000});
 ok(await player.evaluate(el=>!el.paused),'original MP3 actually starts playing');
 await page.locator('.item input[type=radio]').first().check();
 includes(await page.locator('#state').innerText(),'1 de 25','answer counted');
 await page.getByRole('button',{name:/B ·/}).click();
 eq(await page.locator('.item').count(),5,'B 5 questions');
 await page.getByRole('button',{name:/C ·/}).click();
 eq(await page.locator('select').count(),5,'C 5 matching prompts');
 includes(await page.locator('select').first().locator('option').nth(1).innerText(),
 'Maybe they','C option fully written');
 await page.getByRole('button',{name:/D ·/}).click();
 eq(await page.locator('input[type=text]').count(),5,'D 5 text fields incl. D4a/D4b');
 await page.getByRole('button',{name:/E ·/}).click();
 eq(await page.locator('input[type=text]').count(),6,'E 6 written questions');
 ok(await page.getByRole('button',{name:'Finalizar vista previa'}).isVisible(),'preview finish exists');
 await page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Finalizar vista previa'}).click();
 includes(await page.locator('.notice[role=status]').innerText(),'Sin guardado','finish never persists');
 eq(httpWrites,[],'no backend writes');
 eq(pageErrors,[],'zero JavaScript page errors');
 console.log('F111_B1_PC02_R32_BROWSER_PASS: 5 tabs, 25 answers, 91s original audio playable, no writes');
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
