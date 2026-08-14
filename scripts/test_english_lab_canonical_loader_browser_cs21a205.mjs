#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('.');
const output=path.resolve('qa-output/cs21a205-canonical-loader');
fs.mkdirSync(output,{recursive:true});

const EXPECTED_MANIFEST=Object.freeze([
  'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A193',
  'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A193',
  'src/english_lab_games/memory_match_shared_discovery_cs21a188.jsx?v=CS21A193',
  'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A193',
  'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A193',
  'src/english_lab_games/english_lab_game_registry_cs21a191.js?v=CS21A193',
  'src/english_lab_games/hangman_engine_cs21a191.js?v=CS21A193',
  'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx?v=CS21A193',
  'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx?v=CS21A213',
  'src/english_lab_games/english_lab_live_memory_match_classic_sync_adapter_cs21a189.jsx?v=CS21A193',
  'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx?v=CS21A213',
  'src/english_lab_games/english_lab_quiz_curriculum_contract_cs21a198.js?v=CS21A198',
  'src/english_lab_games/english_lab_quiz_engine_cs21a198.js?v=CS21A198',
  'src/english_lab_games/english_lab_quiz_time_style_cs21a198.js?v=CS21A198',
  'src/english_lab_games/english_lab_quiz_time_live_cs21a198.jsx?v=CS21A198',
  'src/english_lab_games/word_search_curriculum_contract_cs21a199.js?v=CS21A200',
  'src/english_lab_games/word_search_engine_cs21a199.js?v=CS21A200',
  'src/english_lab_games/word_search_game_cs21a199.jsx?v=CS21A200',
  'src/english_lab_games/english_lab_word_search_style_cs21a200.js?v=CS21A200',
  'src/english_lab_games/english_lab_word_search_live_cs21a200.jsx?v=CS21A200',
  'src/english_lab_live.jsx?v=CS21A200',
  'src/english_lab_sentence_order_cs21a183.js?v=CS21A205',
  'src/english_lab_games/english_lab_quiz_time_gateway_cs21a198.jsx?v=CS21A198',
  'src/english_lab_games/english_lab_word_search_gateway_cs21a200.jsx?v=CS21A200',
  'src/english_lab_games/english_lab_unified_shell_cs21a205.jsx?v=CS21A205',
]);
const EXPECTED_EPOCH_COUNTS=Object.freeze({CS21A193:9,CS21A213:2,CS21A198:5,CS21A200:7,CS21A205:2});
assert.equal(EXPECTED_MANIFEST.length,25);
assert.equal(new Set(EXPECTED_MANIFEST.map(source=>new URL(source,'http://local/').pathname)).size,25,'El contrato esperado no puede repetir rutas.');

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
let server=null;
let base=process.env.QA_BASE_URL||'';
if(!base){
  server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://127.0.0.1');
    const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){
      response.writeHead(404,{'content-type':'text/plain; charset=utf-8'});response.end('not found');return;
    }
    response.writeHead(200,{'content-type':types[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    fs.createReadStream(file).pipe(response);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base=`http://127.0.0.1:${server.address().port}`;
}

function scripts(values){return values.map(src=>`<script src="${src}"></script>`).join('\n');}
const common=['vendor/react.js?v=CS21A205','vendor/react-dom.js?v=CS21A205','vendor/babel.js?v=CS21A205'];
const guards=[
  'src/english_lab_live_product_guard_cs21a187.js?v=CS21A193',
  'src/english_lab_live_classic_sync_guard_cs21a189.js?v=CS21A193',
  'src/english_lab_live_timeout_style_guard_cs21a190.js?v=CS21A193',
  'src/english_lab_live_authoritative_sync_guard_cs21a192.js?v=CS21A193',
  'src/english_lab_live_student_dependency_guard_cs21a184.js?v=CS21A193',
];
function harness(mode){
  if(mode==='before-lazy'){
    return `<!doctype html><html><head><meta charset="utf-8">${scripts(common)}</head><body>
      <script src="src/english_lab_live_canonical_loader_cs21a193.js?v=CS21A205"></script>
      <script src="src/lazy_loader.jsx?v=CS21A193"></script>
      <script>${`window.F96_LAZY_MAP={english_lab_live:window.EnglishLabLiveCanonicalLoaderCS21A193.manifest.slice()};
        window.__CS205_BEFORE_LAZY__=window.anLazyCampus.resolveRoute(window.F96_LAZY_MAP.english_lab_live,'EnglishLabLiveTeacherView').then(View=>({
          same:View===window.EnglishLabLiveTeacherView,
          ready:window.EnglishLabLiveCanonicalLoaderCS21A193.isReady(),
          one:window.anLazyCampus.loadOne.__cs21a193CanonicalOwner===true,
          many:window.anLazyCampus.loadMany.__cs21a193CanonicalOwner===true,
          owner:window.EnglishLabMemoryMatchLiveCS21A174===window.EnglishLabMemoryMatchAuthoritativeSyncCS21A192,
          manifest:window.EnglishLabLiveCanonicalLoaderCS21A193.manifest.slice(),
          loaded:window.anLazyCampus.getStatus().loaded.slice()
        }));window.__HARNESS_READY__=true;`}</script>
    </body></html>`;
  }
  return `<!doctype html><html><head><meta charset="utf-8">${scripts(common)}</head><body><div id="root"></div>
    <script>
      window.getSesion=()=>({rol:'teacher',role:'teacher',codigo:'QA-DOC',nombre:'QA Docente'});
      window.getSessionToken=()=> 'QA-TOKEN';
      window.APPS_SCRIPT_URL='/__cs21a205_backend';
      window.PageHeader=function PageHeader(){return React.createElement('div',null);};
      window.AcademiaPlayView=function AcademiaPlayView(){return React.createElement('div',{'data-academia-play-base':'true'},'Academia Play');};
    </script>
    <script src="src/english_lab_free_access_cs21a66.js?v=CS21A193"></script>
    <script src="src/lazy_loader.jsx?v=CS21A193"></script>
    <script src="src/english_lab_live_canonical_loader_cs21a193.js?v=CS21A205"></script>
    ${scripts(guards)}
    <script>
      window.F96_LAZY_MAP={english_lab_live:window.EnglishLabLiveCanonicalLoaderCS21A193.manifest.slice()};
      ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(window.AcademiaPlayView,{usuario:window.getSesion()}));
      window.__HARNESS_READY__=true;
    </script>
  </body></html>`;
}

function epochCounts(manifest){
  const counts={};
  for(const source of manifest){const epoch=new URL(source,'http://local/').searchParams.get('v')||'';counts[epoch]=(counts[epoch]||0)+1;}
  return counts;
}
function expectedEpochByPath(){
  const map=new Map();
  for(const source of EXPECTED_MANIFEST){const url=new URL(source,'http://local/');map.set(url.pathname,url.searchParams.get('v'));}
  return map;
}

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const errors=[];
const results={};
try{
  {
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    const page=await context.newPage();
    const localErrors=[];
    page.on('pageerror',error=>localErrors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)localErrors.push(`HTTP ${response.status()} ${response.url()}`);});
    await page.route('**/__cs21a205_harness?mode=before-lazy',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:harness('before-lazy')}));
    await page.goto(`${base}/__cs21a205_harness?mode=before-lazy`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__HARNESS_READY__===true);
    const before=await Promise.race([
      page.evaluate(()=>window.__CS205_BEFORE_LAZY__),
      new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),12000)),
    ]);
    assert.equal(before.timeout,undefined,'La ruta inmediata se bloqueó cuando el loader canónico apareció antes de lazy_loader.');
    assert.equal(before.same,true);assert.equal(before.ready,true);assert.equal(before.one,true);assert.equal(before.many,true);assert.equal(before.owner,true);
    assert.deepEqual(before.manifest,EXPECTED_MANIFEST,'El orden before-lazy debe usar el manifiesto CS205 exacto.');
    assert.deepEqual(before.loaded.filter(source=>EXPECTED_MANIFEST.includes(source)),EXPECTED_MANIFEST,'Before-lazy debe cargar el manifiesto una sola vez y en orden.');
    assert.deepEqual(localErrors,[],localErrors.join(' | '));
    results.beforeLazy={ready:true,authoritativeOwner:true,manifestEntries:before.manifest.length};
    await context.close();
  }

  for(const viewport of [{name:'mobile390',width:390,height:844},{name:'desktop1440',width:1440,height:900}]){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
    const page=await context.newPage();
    const requests=[];
    page.on('request',request=>requests.push(request.url()));
    page.on('pageerror',error=>errors.push(`${viewport.name} pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`${viewport.name} HTTP ${response.status()} ${response.url()}`);});
    await page.route('**/__cs21a205_harness?mode=route',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:harness('route')}));
    await page.goto(`${base}/__cs21a205_harness?mode=route`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__HARNESS_READY__===true);
    await page.locator('button').filter({hasText:'Ingresar con c'}).first().waitFor({state:'visible',timeout:5000});

    await page.evaluate(()=>{
      window.__CS205_ONE_BEFORE__=window.anLazyCampus.loadOne;
      window.__CS205_MANY_BEFORE__=window.anLazyCampus.loadMany;
      document.querySelectorAll('button').forEach(button=>{if(button.textContent.includes('Ingresar con c'))button.click();});
      window.__CS205_ROUTE__=window.anLazyCampus.resolveRoute(window.F96_LAZY_MAP.english_lab_live,'EnglishLabLiveStudentView').then(View=>View===window.EnglishLabLiveStudentView);
    });
    await page.locator('input[placeholder="LAB-5937"]').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.evaluate(()=>window.__CS205_ROUTE__),true,`${viewport.name}: la ruta final no resolvió EnglishLabLiveStudentView.`);

    const snapshot=await page.evaluate(async()=>{
      const loader=window.EnglishLabLiveCanonicalLoaderCS21A193;
      const firstOwner=loader.getOwner();
      const firstComponent=window.MemoryMatchLiveRoundCS21A174;
      const firstOne=window.anLazyCampus.loadOne;
      const firstMany=window.anLazyCampus.loadMany;
      for(let index=0;index<20;index+=1){
        window.dispatchEvent(new CustomEvent('an:lazy-module-loaded',{detail:{src:'cs205-synthetic-'+index}}));
        window.__ENGLISH_LAB_PRODUCT_GUARD_CS21A188__?.install?.();
        window.__ENGLISH_LAB_CLASSIC_SYNC_GUARD_CS21A189__?.install?.();
        window.__ENGLISH_LAB_AUTHORITATIVE_SYNC_GUARD_CS21A192__?.install?.();
        window.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__?.install?.();
      }
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      return {
        version:loader.version,
        epoch:loader.cacheEpoch,
        manifest:loader.manifest.slice(),
        ready:loader.isReady(),
        routeUsesManifest:JSON.stringify(window.F96_LAZY_MAP.english_lab_live)===JSON.stringify(loader.manifest),
        loaderStable:firstOne===window.anLazyCampus.loadOne&&firstMany===window.anLazyCampus.loadMany,
        canonicalMarkers:window.anLazyCampus.loadOne.__cs21a193CanonicalOwner===true&&window.anLazyCampus.loadMany.__cs21a193CanonicalOwner===true,
        ownerStable:firstOwner===loader.getOwner()&&firstComponent===window.MemoryMatchLiveRoundCS21A174,
        ownerAuthoritative:window.EnglishLabMemoryMatchLiveCS21A174===window.EnglishLabMemoryMatchAuthoritativeSyncCS21A192,
        accessGateOuter:window.EnglishLabLiveStudentView.__cs21a144AccessGate===true,
        accessGateInChain:window.EnglishLabUnifiedShellCS21A205.chainContainsMarker(window.EnglishLabLiveStudentView,'__cs21a144AccessGate'),
        unifiedShell:!!window.EnglishLabUnifiedShellCS21A205,
        shellGames:window.EnglishLabUnifiedShellCS21A205.games.map(game=>game.id),
        loaded:window.anLazyCampus.getStatus().loaded.slice(),
        overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
      };
    });
    assert.equal(snapshot.version,'F98.4-Z6-CS21A205');
    assert.equal(snapshot.epoch,'CS21A205');
    assert.deepEqual(snapshot.manifest,EXPECTED_MANIFEST,`${viewport.name}: manifiesto CS205 inesperado.`);
    assert.deepEqual(epochCounts(snapshot.manifest),EXPECTED_EPOCH_COUNTS,`${viewport.name}: distribución de epochs inesperada.`);
    assert.equal(snapshot.ready,true);assert.equal(snapshot.routeUsesManifest,true);assert.equal(snapshot.loaderStable,true);assert.equal(snapshot.canonicalMarkers,true);
    assert.equal(snapshot.ownerStable,true);assert.equal(snapshot.ownerAuthoritative,true);assert.equal(snapshot.accessGateOuter,true,`${viewport.name}: el marcador del guard financiero no llegó a la envoltura final.`);
    assert.equal(snapshot.accessGateInChain,true,`${viewport.name}: no existe guard financiero real dentro de la cadena final.`);
    assert.equal(snapshot.unifiedShell,true);
    assert.deepEqual(snapshot.shellGames,['MEMORY_MATCH','SENTENCE_ORDER','HANGMAN','QUIZ_TIME','WORD_SEARCH']);
    assert.equal(snapshot.overflow,false);
    assert.deepEqual(snapshot.loaded.filter(source=>EXPECTED_MANIFEST.includes(source)),EXPECTED_MANIFEST,`${viewport.name}: orden de carga incompleto.`);
    assert.equal(await page.evaluate(()=>window.__CS205_ONE_BEFORE__===window.anLazyCampus.loadOne&&window.__CS205_MANY_BEFORE__===window.anLazyCampus.loadMany),true);

    const epochByPath=expectedEpochByPath();
    const counts={};
    for(const requestUrl of requests){
      const parsed=new URL(requestUrl);if(!epochByPath.has(parsed.pathname))continue;
      counts[parsed.pathname]=(counts[parsed.pathname]||0)+1;
      assert.equal(parsed.searchParams.get('v'),epochByPath.get(parsed.pathname),`${viewport.name}: epoch incorrecto en ${requestUrl}`);
    }
    assert.equal(Object.keys(counts).length,25,`${viewport.name}: faltan recursos del manifiesto.`);
    assert.ok(Object.values(counts).every(count=>count===1),`${viewport.name}: hubo cargas duplicadas ${JSON.stringify(counts)}.`);
    results[viewport.name]={...snapshot,requestCounts:counts};
    await page.screenshot({path:path.join(output,`${viewport.name}-canonical.png`),fullPage:true});
    await context.close();
  }

  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);
  const result={
    verdict:'PASS_ENGLISH_LAB_CANONICAL_LOADER_CS21A205',
    loaderVersion:'F98.4-Z6-CS21A205',
    cacheEpoch:'CS21A205',
    manifestEntries:25,
    epochCounts:EXPECTED_EPOCH_COUNTS,
    canonicalBeforeLazyRace:true,
    accessGatePreserved:true,
    authoritativeOwner:'CS21A192',
    exactlyOncePerManifestPath:true,
    mobile390:true,
    desktop1440:true,
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({result,details:results},null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
}
