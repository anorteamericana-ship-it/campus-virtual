#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';

const base=(process.env.QA_BASE_URL||'http://127.0.0.1:4193').replace(/\/$/,'');
const output=path.resolve('qa-output/cs21a193-package-entry');
fs.mkdirSync(output,{recursive:true});
const qaBackend='https://script.google.com/macros/s/CS21A193_BROWSER_QA/exec';
const englishLabStylePaths=[
  '/styles/english_lab_memory_match_cs21a173.css',
  '/styles/english_lab_memory_match_classic_sync_cs21a189.css',
  '/styles/english_lab_hangman_cs21a191.css',
];
const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;

function session(role){
  if(role==='teacher')return {
    rol:'teacher',role:'teacher',token:'QA-CS21A193-TEACHER',codigo:'QA-DOC-CS193',cod_docente:'QA-DOC-CS193',nombre:'QA DOCENTE CS193',grupo:'B1-QA-CS193',grupos:['B1-QA-CS193'],
  };
  return {
    rol:'student',role:'student',token:'QA-CS21A193-STUDENT',codigo:'QA-STU-CS193',cod_estudiante:'QA-STU-CS193',nombre:'QA ESTUDIANTE CS193',grupo:'B1-QA-CS193',matricula:'ACTIVA',nivel_activo:'B1',
  };
}

function endpoint(request){
  const url=new URL(request.url());
  const query=url.searchParams.get('fn');
  if(query)return query;
  try{return JSON.parse(request.postData()||'{}').fn||'';}catch(_){return '';}
}

function backendPayload(fn,user){
  const key=String(fn||'').toLowerCase();
  if(key==='validarsesion')return {ok:true,usuario:user,rol:user.rol};
  if(key==='englishlabaccessstatus')return {ok:true,allowed:true,autorizado:true,estado:'AL_DIA',mensaje:'Acceso QA confirmado.',version:'CS21A193'};
  if(key==='englishlablivegetteacherdata')return {
    ok:true,
    grupos:[{code:'B1-QA-CS193',cod_grupo:'B1-QA-CS193',nivel:'B1',dias:'Lunes',hora_i:'18:00',hora_f:'21:00'}],
    rooms:[],
    question_bank:{total:0,active:0,areas:{},sources:{}},
  };
  if(/sesiondocente|sesionactiva|leccionactiva/.test(key))return {ok:true,sesion:null,leccion:null};
  if(key==='cerrarsesion')return {ok:true};
  return {ok:true,items:[],rows:[],data:[],grupos:[],rooms:[],solicitudes:[],tareas:[],totales:{},question_bank:{total:0,active:0,areas:{},sources:{}}};
}

async function contextFor(browser,role,viewport,initialRoute='dashboard',options={}){
  const user=session(role);
  let accessCalls=0;
  const context=await browser.newContext({viewport,ignoreHTTPSErrors:true});
  await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({status:200,contentType:'text/css; charset=utf-8',body:''}));
  await context.route('https://fonts.gstatic.com/**',route=>route.abort('blockedbyclient'));
  await context.addInitScript(({user,qaBackend,initialRoute})=>{
    window.__CAMPUS_RUNTIME_CONFIG__={environment:'qa',appsScriptUrl:qaBackend};
    sessionStorage.setItem('an_qa_apps_script_url',qaBackend);
    sessionStorage.setItem('an_usuario',JSON.stringify(user));
    localStorage.setItem('an_academia_play_piloto','1');
    localStorage.setItem('an_welcome_dismissed','1');
    localStorage.setItem('an_active',initialRoute);
    localStorage.setItem(`an_active_${user.rol}`,initialRoute);
  },{user,qaBackend,initialRoute});
  await context.route('https://script.google.com/**',async route=>{
    const fn=endpoint(route.request());
    if(String(fn).toLowerCase()==='englishlabaccessstatus'){
      accessCalls+=1;
      if(options.transientAccessFirst===true&&accessCalls<=2){
        await route.abort('timedout');
        return;
      }
    }
    await route.fulfill({
      status:200,
      headers:{'access-control-allow-origin':'*','cache-control':'no-store'},
      contentType:'application/json; charset=utf-8',
      body:JSON.stringify(backendPayload(fn,user)),
    });
  });
  return {context,user,getAccessCalls:()=>accessCalls};
}

function observe(page,label){
  const errors=[];
  const requests=[];
  page.on('pageerror',error=>errors.push(`${label}: ${error.message}`));
  page.on('console',message=>{
    if(message.type()==='error'&&/English LAB|CS21A19|Uncaught|adaptador autoritativo/i.test(message.text()))errors.push(`${label}: ${message.text()}`);
  });
  page.on('request',request=>requests.push(request.url()));
  return {errors,requests};
}

async function packageSnapshot(page){
  return page.evaluate(()=>{
    const loader=window.EnglishLabLiveCanonicalLoaderCS21A193;
    const scripts=[...document.scripts].map(node=>node.getAttribute('src')||'').filter(Boolean);
    const ordered=[
      'src/lazy_loader.jsx',
      'src/english_lab_live_canonical_loader_cs21a193.js',
      'src/english_lab_live_product_guard_cs21a187.js',
      'src/english_lab_live_classic_sync_guard_cs21a189.js',
      'src/english_lab_live_timeout_style_guard_cs21a190.js',
      'src/english_lab_live_authoritative_sync_guard_cs21a192.js',
      'src/english_lab_live_student_dependency_guard_cs21a184.js',
      'src/app.jsx',
    ];
    const indexes=ordered.map(file=>scripts.findIndex(src=>src.split('?')[0]===file));
    return {
      loaderPresent:!!loader,
      ready:!!loader&&loader.isReady(),
      manifest:loader?loader.manifest.slice():[],
      f96Manifest:window.F96_LAZY_MAP&&window.F96_LAZY_MAP.english_lab_live||[],
      ownerAuthoritative:window.EnglishLabMemoryMatchLiveCS21A174===window.EnglishLabMemoryMatchAuthoritativeSyncCS21A192,
      componentAuthoritative:typeof window.MemoryMatchLiveRoundCS21A174==='function'&&window.MemoryMatchLiveRoundCS21A174.__cs21a192AuthoritativeSyncAdapter===true,
      canonicalLoadOne:window.anLazyCampus&&window.anLazyCampus.loadOne.__cs21a193CanonicalOwner===true,
      canonicalLoadMany:window.anLazyCampus&&window.anLazyCampus.loadMany.__cs21a193CanonicalOwner===true,
      loaded:window.anLazyCampus&&window.anLazyCampus.getStatus().loaded||[],
      scriptOrder:indexes,
      scriptOrderValid:indexes.every((value,index)=>value>=0&&(index===0||value>indexes[index-1])),
      route:location.hash,
      horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    };
  });
}

function assertCanonical(snapshot,label){
  assert.equal(snapshot.loaderPresent,true,`${label}: falta loader CS21A193.`);
  assert.equal(snapshot.ready,true,`${label}: stack CS21A193 no quedó listo.`);
  assert.equal(snapshot.manifest.length,12,`${label}: manifiesto incompleto.`);
  assert.ok(snapshot.manifest.every(source=>new URL(source,'http://local/').searchParams.get('v')==='CS21A193'),`${label}: hay epochs mezclados.`);
  assert.deepEqual(snapshot.f96Manifest,snapshot.manifest,`${label}: F96 no usa el manifiesto canónico.`);
  assert.equal(snapshot.ownerAuthoritative,true,`${label}: API final no es CS21A192.`);
  assert.equal(snapshot.componentAuthoritative,true,`${label}: componente final no es CS21A192.`);
  assert.equal(snapshot.canonicalLoadOne,true,`${label}: loadOne no pertenece a CS21A193.`);
  assert.equal(snapshot.canonicalLoadMany,true,`${label}: loadMany no pertenece a CS21A193.`);
  assert.equal(snapshot.scriptOrderValid,true,`${label}: orden de scripts incorrecto ${JSON.stringify(snapshot.scriptOrder)}.`);
  assert.deepEqual(snapshot.loaded.filter(source=>snapshot.manifest.includes(source)),snapshot.manifest,`${label}: recursos fuera de orden o faltantes.`);
  assert.equal(snapshot.horizontalOverflow,false,`${label}: overflow horizontal.`);
}

function assertSingleStyleRequest(requests,label){
  const matching=requests.filter(raw=>{
    try{return englishLabStylePaths.includes(new URL(raw).pathname);}catch(_){return false;}
  });
  for(const pathname of englishLabStylePaths){
    const byPath=matching.filter(raw=>new URL(raw).pathname===pathname);
    assert.equal(byPath.length,1,`${label}: ${pathname} se solicitó ${byPath.length} veces: ${JSON.stringify(byPath)}.`);
    const epoch=new URL(byPath[0]).searchParams.get('v')||'';
    assert.match(epoch,/CS21A193$/,`${label}: ${pathname} no usa el epoch CS21A193 (${epoch}).`);
  }
  const legacy=matching.filter(raw=>/^(?:CS21A189|CS21A190|CS21A191)$/.test(new URL(raw).searchParams.get('v')||''));
  assert.deepEqual(legacy,[],`${label}: estilos English LAB duplicados con epochs históricos: ${JSON.stringify(legacy)}.`);
}

const browser=await chromium.launch(launchOptions);
const details={};
try{
  {
    const {context}=await contextFor(browser,'student',{width:390,height:844});
    const page=await context.newPage();
    const observed=observe(page,'student');
    await page.goto(`${base}/campus.html#dashboard`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('.an-mobile-nav-toggle').waitFor({state:'visible',timeout:20000});
    await page.locator('.an-mobile-nav-toggle').click();
    await page.locator('[data-nav-id="academia_play"]').waitFor({state:'visible',timeout:20000});
    await page.locator('[data-nav-id="academia_play"]').click();
    await page.locator('button').filter({hasText:'Ingresar con c'}).first().waitFor({state:'visible',timeout:20000});
    await page.locator('button').filter({hasText:'Ingresar con c'}).first().click();
    await page.locator('input[placeholder="LAB-5937"]').waitFor({state:'visible',timeout:30000});
    const snapshot=await packageSnapshot(page);
    assertCanonical(snapshot,'student/English LAB');
    assertSingleStyleRequest(observed.requests,'student/English LAB');
    assert.deepEqual(observed.errors,[],observed.errors.join(' | '));
    await page.screenshot({path:path.join(output,'student-academia-play-mobile390.png'),fullPage:true});
    details.student={snapshot,requests:observed.requests.filter(url=>/english_lab/i.test(url))};
    await context.close();
  }

  {
    const {context,getAccessCalls}=await contextFor(browser,'student',{width:720,height:900},'dashboard',{transientAccessFirst:true});
    const page=await context.newPage();
    const observed=observe(page,'student-transient');
    await page.goto(`${base}/campus.html#dashboard`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('.an-mobile-nav-toggle').waitFor({state:'visible',timeout:20000});
    await page.locator('.an-mobile-nav-toggle').click();
    await page.locator('[data-nav-id="academia_play"]').waitFor({state:'visible',timeout:20000});
    await page.locator('[data-nav-id="academia_play"]').click();
    await page.getByText('No pudimos confirmar tu acceso',{exact:true}).waitFor({state:'visible',timeout:20000});
    await page.getByRole('button',{name:'Verificar de nuevo'}).waitFor({state:'visible'});
    const temporaryText=await page.locator('body').innerText();
    assert.doesNotMatch(temporaryText,/signal is aborted/i,'El error técnico no debe llegar al estudiante.');
    assert.doesNotMatch(temporaryText,/English LAB no disponible/i,'Una falla temporal no es una denegación financiera.');
    await page.getByRole('button',{name:'Verificar de nuevo'}).click();
    await page.locator('button').filter({hasText:'Ingresar con c'}).first().waitFor({state:'visible',timeout:20000});
    await page.locator('button').filter({hasText:'Ingresar con c'}).first().click();
    await page.locator('input[placeholder="LAB-5937"]').waitFor({state:'visible',timeout:30000});
    const snapshot=await packageSnapshot(page);
    assertCanonical(snapshot,'student/retry transitorio');
    assertSingleStyleRequest(observed.requests,'student/retry transitorio');
    assert.ok(getAccessCalls()>=3,`El reintento debía emitir una nueva verificación; llamadas=${getAccessCalls()}.`);
    assert.deepEqual(observed.errors,[],observed.errors.join(' | '));
    await page.screenshot({path:path.join(output,'student-transient-retry-720.png'),fullPage:true});
    details.studentTransient={snapshot,accessCalls:getAccessCalls(),temporaryMessageHuman:true};
    await context.close();
  }

  {
    const {context}=await contextFor(browser,'teacher',{width:1440,height:900},'english_lab_live');
    const page=await context.newPage();
    const observed=observe(page,'teacher');
    await page.goto(`${base}/campus.html#english_lab_live`,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('button').filter({hasText:'Crear sala live'}).waitFor({state:'visible',timeout:30000});
    const snapshot=await packageSnapshot(page);
    assertCanonical(snapshot,'teacher/F96');
    assertSingleStyleRequest(observed.requests,'teacher/F96');
    assert.deepEqual(observed.errors,[],observed.errors.join(' | '));
    await page.screenshot({path:path.join(output,'teacher-f96-desktop1440.png'),fullPage:true});
    details.teacher={snapshot,requests:observed.requests.filter(url=>/english_lab/i.test(url))};
    await context.close();
  }

  const result={
    verdict:'PASS_ENGLISH_LAB_PACKAGE_ENTRY_CS21A193',
    realCampusHtml:true,
    realAppRouter:true,
    realSidebarNavigation:true,
    studentAcademiaPlayDirect:true,
    studentTransientRetry:true,
    teacherF96Route:true,
    mobile390:true,
    desktop1440:true,
    singleEpoch:'CS21A193',
    authoritativeOwner:'CS21A192',
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({result,details},null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
}
