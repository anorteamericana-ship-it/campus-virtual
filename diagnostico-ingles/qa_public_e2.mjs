import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:8765/diagnostico-ingles/';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',err=>errors.push(String(err.message)));
let checks=0;
let inboundOnline=false;
// Interceptamos el receptor real: QA offline/online sin escribir nombres ficticios en producción.
await page.route('https://script.google.com/macros/s/**', route => inboundOnline ? route.fulfill({status:200,headers:{'content-type':'application/json','access-control-allow-origin':'*'},body:JSON.stringify({ok:true,received:'issue'})}) : route.abort());
async function pass(label,run){await run();checks++;console.log('PASS '+label)}
try{
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:25000});
 await pass('01 portada pública sin contraseña',async()=>{
   await page.locator('#guest-name').waitFor();assert.equal(await page.locator('#entry').isVisible(),true);
   assert.equal(await page.locator('#entry input[type=password]').count(),0);
 });
 await page.locator('#guest-name').fill('Rebeca');
 await page.locator('#entry-form button[type=submit]').click();
 await pass('02 perfil creado y saludo personalizado',async()=>{
  await page.getByText('Hola, Rebeca',{exact:true}).waitFor({timeout:18000});
  assert.equal(await page.locator('#workspace').isVisible(),true);
 });
 await pass('03 diagnóstico y acceso 400',async()=>{
   assert.equal((await page.locator('#app').innerText()).includes('25 preguntas'),true);
   await page.getByRole('link',{name:'Mis 400 preguntas'}).click();
   await page.getByText(/0 de 400 preguntas únicas/).waitFor({timeout:15000});
   assert.equal(await page.locator('#app').getByText('Forma A · 200 preguntas').count(),1);
   assert.equal(await page.locator('#app').getByText('Forma B · 200 preguntas').count(),1);
 });
 await page.locator('button[data-tipo=diagnostic]').click();
 await pass('04 diagnóstico tiene exactamente 25 preguntas',async()=>{
   await page.locator('.q').first().waitFor({timeout:14000});
   const total=await page.locator('.qhead').innerText();
   assert.match(total,/de 25\b/);
 });
 await pass('04b diagnóstico reparte las 25 preguntas en siete partes',async()=>{
   const plan=await page.evaluate(()=>EPL.DIAG_PLAN);
   const parts=plan.map(([part,kind,n])=>n*(kind==='item'?1:part===6?4:kind==='group4'?4:3));
   assert.deepEqual(parts,[1,3,6,3,4,4,4]);
   assert.equal(parts.reduce((s,n)=>s+n,0),25);
 });
 await pass('05 reporte por pregunta se abre con contexto',async()=>{
   await page.locator('.q .qa-report').first().click();
   await page.locator('#qa-modal').waitFor({state:'visible'});
   assert.match(await page.locator('#qa-item-label').innerText(),/Pregunta:/);
 });
 await page.locator('#qa-type').selectOption('audio');
 await page.locator('#qa-comment').fill('Prueba interna del formulario, no es un error real.');
 await page.locator('#qa-form button[type=submit]').click();
 await pass('06 reporte queda almacenado sin fingir sincronización',async()=>{
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('epl_public_issues_v1')||'[]').length===1);
   const r=await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_issues_v1'))[0]);
   assert.equal(r.category,'audio');assert.equal(r.synced,false);
 });
 await page.locator('#qa-form').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 await pass('06b doble envío no crea otro evento',async()=>{
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_issues_v1')).length),1);
 });
 await pass('07 perfil único persistente',async()=>{
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_people_v1')).length),1);
 });
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#change-profile').click();
 await pass('08 cambio de participante sin borrar el avance anterior',async()=>{
   await page.locator('#entry').waitFor({state:'visible'});
   assert.equal(await page.locator('#profile-list .profile-card').count(),1);
 });
 await page.locator('#guest-name').fill('Rebeca');
 await page.locator('#entry-form button').click();
 await pass('08b no duplicar silenciosamente un nombre existente',async()=>{
   assert.match(await page.locator('#entry-error').innerText(),/Ya existe un perfil/);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_people_v1')).length),1);
 });
 await page.locator('#guest-name').fill('Juan');
 await page.locator('#entry-form button').click();
 await pass('09 segundo participante independiente en mismo dispositivo',async()=>{
   await page.getByText('Hola, Juan',{exact:true}).waitFor();
   const people=await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_people_v1')));
   assert.equal(people.length,2);assert.notEqual(people[0].id,people[1].id);
 });
 inboundOnline=true;
 await page.reload();
 await pass('10 recordar a Juan tras recargar sin pedir su nombre',async()=>{
   await page.getByText('Hola, Juan',{exact:true}).waitFor({timeout:15000});
   assert.equal(await page.locator('#entry').isVisible(),false);
 });
 await pass('10b reenviar tras reconexión y recarga',async()=>{
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('epl_public_issues_v1')||'[]')[0]?.synced===true,{timeout:12000});
 });
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#change-profile').click();
 await page.locator('#entry').waitFor({state:'visible'});
 await page.locator('#profile-list .profile-card').filter({hasText:'Rebeca'}).click();
 await pass('11 Rebeca vuelve a su perfil anterior',async()=>{
   await page.getByText('Hola, Rebeca',{exact:true}).waitFor({timeout:15000});
   const list=await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_issues_v1')));
   assert.equal(list[0].name,'Rebeca');
 });
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('link',{name:'Mis 400 preguntas'}).click();
 await pass('12 interfaz móvil sin desbordes laterales',async()=>{
   await page.locator('#app').getByText(/0 de 400/).waitFor({timeout:12000});
   const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,win:innerWidth}));
   assert.ok(dims.scroll<=dims.win+4,JSON.stringify(dims));
 });
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('#change-profile').click();
 await page.locator('#entry').waitFor({state:'visible'});
 await page.locator('#guest-name').fill('Sof\u00eda');
 await page.locator('#entry-form button').click();
 await pass('13 nombres con tilde y perfiles nuevos',async()=>{
   await page.getByText('Hola, Sof\u00eda',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('epl_public_people_v1')).length),3);
 });
 console.log('PASS_TOTAL='+checks+'/'+checks);
 if(errors.length){console.error('PAGE_ERRORS '+JSON.stringify(errors.slice(0,5)));process.exitCode=1;}
}catch(err){console.log('FAIL '+String(err.stack).slice(0,1600));console.log('PAGE_ERRORS '+JSON.stringify(errors.slice(0,5)));process.exitCode=1;}
finally{await browser.close();}
