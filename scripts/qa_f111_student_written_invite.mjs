import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const playwright=require(process.env.CAMPUS_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/student_written_invite_f111.js'),'utf8');
const html=fs.readFileSync(path.join(root,'campus.html'),'utf8');
assert.match(html,/student_written_invite_f111\.js\?v=F111WRITTENINVITE20261125/);
const site='http://localhost:43199';
const requests=[],errors=[];
let open=false;
const browser=await playwright.chromium.launch({headless:true,
 ...(process.env.CAMPUS_CHROME_EXECUTABLE?{executablePath:process.env.CAMPUS_CHROME_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({viewport:{width:390,height:780}});
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==site)return route.abort();
  if(url.pathname==='/student')return route.fulfill({contentType:'text/html; charset=utf-8',body:
   '<main id="root"><aside data-role="student"><button data-nav-id="evaluaciones">Evaluaciones</button></aside></main>'+
   '<script>window.APPS_SCRIPT_URL="'+site+'/core";window.qaToken="";window.qaRole="student";window.tabClicks=0;'+
   'window.getSessionToken=()=>window.qaToken;window.getSesion=()=>({rol:window.qaRole});'+
   'document.querySelector("[data-nav-id=evaluaciones]").onclick=()=>{if(!document.querySelector("[data-screen-label=\'Estudiante · Evaluaciones\']")){'+
   'const s=document.createElement("section");s.setAttribute("data-screen-label","Estudiante · Evaluaciones");'+
   's.innerHTML="<div role=tablist><button type=button>Próximas y activas</button></div><div data-screen-label=\'Estudiante · Exámenes\'>Formulario</div>";'+
   'document.getElementById("root").append(s);s.querySelector("button").onclick=()=>window.tabClicks++;}};</script>'+
   '<script src="/src/student_written_invite_f111.js" defer></script>'});
  if(url.pathname==='/src/student_written_invite_f111.js')return route.fulfill({contentType:'application/javascript; charset=utf-8',body:source});
  if(url.pathname==='/core'){
   const body=route.request().postDataJSON();requests.push(body);
   return route.fulfill({json:open?{ok:true,active:true,activation_id:'ACT-DOCENTE-QA-1',
    grupo:'QA-CURSO-01',nivel:'B2',leccion:18,opcion:'A',time_limit_min:90,started:false}:
    {ok:true,active:false}});
  }
  return route.fulfill({status:404,body:''});
 });
 const page=await context.newPage();
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(site+'/student');
 assert.equal(requests.length,0,'no session makes no request');
 await page.evaluate(()=>{window.qaToken='QA-TOKEN-1';window.dispatchEvent(new Event('an:session-changed'));});
 await page.waitForTimeout(250);
 assert.equal(await page.getByRole('alertdialog',{name:'Examen escrito habilitado'}).count(),0,
  'closed exam never shows a popup');
 open=true;
 await page.evaluate(()=>window.dispatchEvent(new Event('an:session-changed')));
 const dialog=page.getByRole('alertdialog',{name:'Examen escrito habilitado'});
 await dialog.getByRole('heading',{name:'Tu profesor habilitó el Examen Escrito 1'}).waitFor();
 assert.match(await dialog.textContent(),/Básico 2 · Modelo A · 90 minutos/);
 assert.match(await dialog.textContent(),/El tiempo comienza cuando presionés/);
 assert.equal(requests.every(x=>x.fn==='examGetStudentWrittenInviteF111'),true,
  'polling cannot start an attempt or write an exam');
 assert.equal(requests.every(x=>!x.cod_grupo&&!x.activation_id&&!x.cedula),true,
  'browser cannot choose the student or exam');
 await dialog.getByRole('button',{name:'IR AL EXAMEN'}).click();
 await page.getByText('Formulario').waitFor();
 await page.waitForFunction(()=>window.tabClicks===1);
 assert.equal(await page.evaluate(()=>window.tabClicks),1,'popup opens active evaluations tab');
 await page.evaluate(()=>window.dispatchEvent(new Event('an:session-changed')));
 await page.waitForTimeout(200);
 assert.equal(await dialog.count(),0,'same login does not repeat the popup');
 await page.evaluate(()=>{window.qaToken='QA-TOKEN-2';window.dispatchEvent(new Event('an:session-changed'));});
 await dialog.waitFor();
 open=false;
 await page.evaluate(()=>window.dispatchEvent(new Event('an:session-changed')));
 await page.waitForTimeout(200);
 assert.equal(await dialog.count(),0,'closed opening removes the popup');
 assert.equal(await page.locator('[data-f111-written-badge]').count(),0,'closed opening removes the badge');
 const count=requests.length;
 await page.evaluate(()=>{window.qaRole='teacher';window.dispatchEvent(new Event('an:session-changed'));});
 await page.waitForTimeout(200);
 assert.equal(requests.length,count,'teacher cannot poll the student invitation');
 assert.deepEqual(errors,[]);
 console.log('PASS: student popup on activation and new login, navigation, closed state, no timer start; simulated services only.');
}finally{await browser.close();}
