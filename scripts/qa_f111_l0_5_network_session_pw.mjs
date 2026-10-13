// F111 L0-5 · Playwright real (sin acceso a Campus ni Apps Script PROD).
// Ejecutar con Playwright instalado: node scripts/qa_f111_l0_5_network_session_pw.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const moduleName=process.env.F111_PLAYWRIGHT_MODULE
 ? pathToFileURL(process.env.F111_PLAYWRIGHT_MODULE).href : 'playwright';
const { chromium } = await import(moduleName);
const source=fs.readFileSync(new URL('../src/data.jsx',import.meta.url),'utf8');
const start=source.indexOf('async function validarSesionServidor() {');
const end=source.indexOf('\n// Cierra la sesión en el backend',start);
assert(start>=0&&end>start,'No se encuentra validador');
const fnSource=source.slice(start,end);
const browser=await chromium.launch({
 headless:true,
 ...(process.env.F111_CHROME_PATH ? {executablePath:process.env.F111_CHROME_PATH}:{})
});
let checks=0;
try {
 const page=await browser.newPage();
 await page.route('http://campus.test/',r=>r.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>F111 QA</title>'}));
 await page.goto('http://campus.test/');
 const scenarios=[
  {name:'abort',kind:'abort',expectedNetwork:true},
  {name:'invalid_json',kind:'html',expectedNetwork:true},
  {name:'expired',kind:'expired',expectedNetwork:false,expectedError:'sesion_expirada'},
  {name:'valid',kind:'valid',expectedNetwork:false,expectedOk:true},
 ];
 for(const item of scenarios){
  await page.unroute('http://campus.test/exec').catch(()=>{});
  await page.route('http://campus.test/exec',route=>{
   if(item.kind==='abort')return route.abort('failed');
   if(item.kind==='html')return route.fulfill({status:502,contentType:'text/html',body:'<html>Temporalmente no disponible</html>'});
   if(item.kind==='expired')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:false,error:'sesion_expirada'})});
   return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,rol:'student'})});
  });
  const r=await page.evaluate(async fn=>{
   localStorage.setItem('f111-qa-session','valid-student-session');
   window.APPS_SCRIPT_URL='http://campus.test/exec';
   window.getSessionToken=()=> 'SYNTHETIC_SESSION_TOKEN';
   const f=new Function(fn+'\nreturn validarSesionServidor;')();
   const response=await f();
   return {response,localSession:localStorage.getItem('f111-qa-session')};
  },fnSource);
  assert.equal(Boolean(r.response.network_error),item.expectedNetwork,item.name+': network_error');
  assert.equal(r.localSession,'valid-student-session',item.name+': no clear on network error');
  if(item.expectedError)assert.equal(r.response.error,item.expectedError,item.name);
  if(item.expectedOk)assert.equal(r.response.ok,true,item.name);
  checks++;
 }
 console.log('PASS_PLAYWRIGHT_F111_L0_5 checks='+checks);
} finally { await browser.close(); }
