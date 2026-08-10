#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {chromium} from 'playwright';

const root=path.resolve('.');
const output=path.resolve('qa-output/cs21a193-canonical-loader');
fs.mkdirSync(output,{recursive:true});

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jsx':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
let server=null;
let base=process.env.QA_BASE_URL||'';
if(!base){
  server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://127.0.0.1');
    if(url.pathname==='/__cs21a193_backend'){
      response.writeHead(200,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      response.end(JSON.stringify({ok:true,allowed:true,autorizado:true,estado:'AL_DIA'}));
      return;
    }
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

function harness(mode){
  const common=[
    'vendor/react.js?v=CS21A193',
    'vendor/react-dom.js?v=CS21A193',
    'vendor/babel.js?v=CS21A193',
  ];
  if(mode==='canonical-before-lazy'){
    return `<!doctype html><html><head><meta charset="utf-8"><title>${mode}</title>${scripts(common)}</head><body>
      <script>
        window.__CS193_NATIVE_TIMERS__={
          setInterval:window.setInterval.bind(window),
          clearInterval:window.clearInterval.bind(window),
          setTimeout:window.setTimeout.bind(window),
          clearTimeout:window.clearTimeout.bind(window),
        };
        window.__CS193_RETAINED_TIMERS__=[];
        window.__CS193_TIMER_CALLBACKS_RAN__=0;
        window.setInterval=(callback,delay)=>{
          const timer={id:9100+window.__CS193_RETAINED_TIMERS__.length,type:'interval',callback,delay,cleared:false};
          window.__CS193_RETAINED_TIMERS__.push(timer);
          return timer.id;
        };
        window.setTimeout=(callback,delay)=>{
          const timer={id:9200+window.__CS193_RETAINED_TIMERS__.length,type:'timeout',callback,delay,cleared:false};
          window.__CS193_RETAINED_TIMERS__.push(timer);
          return timer.id;
        };
        window.clearInterval=id=>{const timer=window.__CS193_RETAINED_TIMERS__.find(item=>item.id===id);if(timer)timer.cleared=true;};
        window.clearTimeout=id=>{const timer=window.__CS193_RETAINED_TIMERS__.find(item=>item.id===id);if(timer)timer.cleared=true;};
      </script>
      <script src="src/english_lab_live_canonical_loader_cs21a193.js?v=CS21A193"></script>
      <script src="src/lazy_loader.jsx?v=CS21A193"></script>
      <script>
        window.__CS193_OWNER_AT_PUBLICATION__=!!(
          window.anLazyCampus &&
          window.anLazyCampus.loadOne.__cs21a193CanonicalOwner===true &&
          window.anLazyCampus.loadMany.__cs21a193CanonicalOwner===true
        );
        window.setInterval=window.__CS193_NATIVE_TIMERS__.setInterval;
        window.clearInterval=window.__CS193_NATIVE_TIMERS__.clearInterval;
        window.setTimeout=window.__CS193_NATIVE_TIMERS__.setTimeout;
        window.clearTimeout=window.__CS193_NATIVE_TIMERS__.clearTimeout;
        window.F96_LAZY_MAP={english_lab_live:window.EnglishLabLiveCanonicalLoaderCS21A193.manifest.slice()};
        window.__CS193_IMMEDIATE_ROUTE__=window.anLazyCampus.resolveRoute(
          window.F96_LAZY_MAP.english_lab_live,
          'EnglishLabLiveTeacherView'
        ).then(View=>({
          routeResolved:View===window.EnglishLabLiveTeacherView,
          ready:window.EnglishLabLiveCanonicalLoaderCS21A193.isReady(),
          canonicalLoadOne:window.anLazyCampus.loadOne.__cs21a193CanonicalOwner===true,
          canonicalLoadMany:window.anLazyCampus.loadMany.__cs21a193CanonicalOwner===true,
          ownerAuthoritative:window.EnglishLabMemoryMatchLiveCS21A174===window.EnglishLabMemoryMatchAuthoritativeSyncCS21A192,
          loaded:window.anLazyCampus.getStatus().loaded,
        }));
        window.__HARNESS_READY__=true;
      </script>
    </body></html>`;
  }
  const legacy=[
    'src/lazy_loader.jsx?v=CS21A179',
    'src/english_lab_live_product_guard_cs21a187.js?v=CS21A188',
    'src/english_lab_live_classic_sync_guard_cs21a189.js?v=CS21A189',
    'src/english_lab_live_timeout_style_guard_cs21a190.js?v=CS21A190',
    'src/english_lab_live_authoritative_sync_guard_cs21a192.js?v=CS21A192R2',
    'src/english_lab_live_student_dependency_guard_cs21a184.js?v=CS21A184',
  ];
  const canonical=[
    'src/lazy_loader.jsx?v=CS21A193',
    'src/english_lab_live_canonical_loader_cs21a193.js?v=CS21A193',
    'src/english_lab_live_product_guard_cs21a187.js?v=CS21A193',
    'src/english_lab_live_classic_sync_guard_cs21a189.js?v=CS21A193',
    'src/english_lab_live_timeout_style_guard_cs21a190.js?v=CS21A193',
    'src/english_lab_live_authoritative_sync_guard_cs21a192.js?v=CS21A193',
    'src/english_lab_live_student_dependency_guard_cs21a184.js?v=CS21A193',
  ];
  const direct=mode==='new' ? `
    <script>
      window.getSesion=()=>({rol:'teacher',role:'teacher',codigo:'QA-DOC',nombre:'QA Docente'});
      window.getSessionToken=()=> 'QA-TOKEN';
      window.APPS_SCRIPT_URL='/__cs21a193_backend';
      window.PageHeader=function PageHeader(){return React.createElement('div',null);};
      window.AcademiaPlayView=function AcademiaPlayView(){return React.createElement('div',{'data-academia-play-base':'true'},'Academia Play');};
    </script>
    <script src="src/english_lab_free_access_cs21a66.js?v=CS21A193"></script>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"><title>${mode}</title>${scripts(common)}</head><body><div id="root"></div>
    ${direct}
    ${scripts(mode==='new'?canonical:legacy)}
    <script>
      window.__HARNESS_MODE__=${JSON.stringify(mode)};
      window.__HARNESS_READY__=true;
      if(window.__HARNESS_MODE__==='new'){
        window.F96_LAZY_MAP={english_lab_live:window.EnglishLabLiveCanonicalLoaderCS21A193.manifest.slice()};
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(window.AcademiaPlayView,{usuario:window.getSesion()}));
      }
    </script>
  </body></html>`;
}

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH)launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
const errors=[];
const results={};
try{
  const legacyContext=await browser.newContext({viewport:{width:390,height:844}});
  const legacyPage=await legacyContext.newPage();
  const legacyRequests=[];
  const legacyErrors=[];
  legacyPage.on('request',request=>legacyRequests.push(request.url()));
  legacyPage.on('pageerror',error=>legacyErrors.push(error.message));
  await legacyPage.route('**/__cs21a193_harness?mode=legacy',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:harness('legacy')}));
  await legacyPage.goto(`${base}/__cs21a193_harness?mode=legacy`,{waitUntil:'domcontentloaded'});
  await legacyPage.waitForFunction(()=>window.__HARNESS_READY__===true);
  results.legacy=await legacyPage.evaluate(async()=>{
    const list=[
      'src/english_lab_games/english_lab_runtime_cs21a173.js?v=CS21A173',
      'src/english_lab_games/memory_match_engine_cs21a173.jsx?v=CS21A174',
      'src/english_lab_games/english_lab_live_sync_guard_cs21a177.js?v=CS21A178',
      'src/english_lab_games/english_lab_live_memory_match_adapter_cs21a174.jsx?v=CS21A178',
      'src/english_lab_live.jsx?v=F98.4Z6CS21A192R2',
    ];
    const timeout=new Promise(resolve=>setTimeout(()=>resolve([{status:'rejected',reason:{message:'TIMEOUT_REV2'}}]),12000));
    const operations=Promise.allSettled([
      window.anLazyCampus.loadOne('src/english_lab_live.jsx?v=F98.4Z6CS20H'),
      window.anLazyCampus.loadMany(list),
    ]);
    const settled=await Promise.race([operations,timeout]);
    return {
      canonicalPresent:!!window.EnglishLabLiveCanonicalLoaderCS21A193,
      settled:settled.map(item=>({status:item.status,error:item.reason&&item.reason.message||''})),
      ownerIsAuthoritative:window.EnglishLabMemoryMatchLiveCS21A174===window.EnglishLabMemoryMatchAuthoritativeSyncCS21A192,
      loaded:window.anLazyCampus.getStatus().loaded,
    };
  });
  const legacyEpochs=new Set(legacyRequests
    .filter(url=>/english_lab_(runtime|live_sync_guard|live_memory_match_adapter)|memory_match_(engine|shared|classic)|english_lab_live\.jsx/.test(url))
    .map(url=>new URL(url).searchParams.get('v')).filter(Boolean));
  results.legacy.epochs=[...legacyEpochs].sort();
  results.legacy.browserErrors=legacyErrors;
  assert.equal(results.legacy.canonicalPresent,false,'La reproducción REV2 no debe incluir el loader CS21A193.');
  assert.ok(legacyEpochs.size>1,`REV2 debía mezclar epochs; recibió ${JSON.stringify([...legacyEpochs])}.`);
  await legacyPage.screenshot({path:path.join(output,'legacy-rev2.png'),fullPage:true});
  await legacyContext.close();

  {
    const raceContext=await browser.newContext({viewport:{width:1440,height:900}});
    const racePage=await raceContext.newPage();
    const raceErrors=[];
    racePage.on('pageerror',error=>raceErrors.push(error.message));
    await racePage.route('**/__cs21a193_harness?mode=canonical-before-lazy',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:harness('canonical-before-lazy')}));
    await racePage.goto(`${base}/__cs21a193_harness?mode=canonical-before-lazy`,{waitUntil:'domcontentloaded'});
    await racePage.waitForFunction(()=>window.__HARNESS_READY__===true);
    results.canonicalBeforeLazy=await racePage.evaluate(async()=>{
      const timeout=new Promise(resolve=>setTimeout(()=>resolve({timeout:true}),12000));
      const route=await Promise.race([window.__CS193_IMMEDIATE_ROUTE__,timeout]);
      return {
        ...route,
        ownerAtPublication:window.__CS193_OWNER_AT_PUBLICATION__,
        retainedTimers:window.__CS193_RETAINED_TIMERS__.map(timer=>({type:timer.type,delay:timer.delay,cleared:timer.cleared})),
        timerCallbacksRan:window.__CS193_TIMER_CALLBACKS_RAN__,
      };
    });
    assert.equal(results.canonicalBeforeLazy.timeout,undefined,'Immediate route blocked when canonical loaded before lazy.');
    assert.equal(results.canonicalBeforeLazy.ownerAtPublication,true,'lazy_loader did not synchronously hand ownership to CS21A193.');
    assert.equal(results.canonicalBeforeLazy.routeResolved,true,'Immediate route did not resolve the teacher view.');
    assert.equal(results.canonicalBeforeLazy.ready,true,'Canonical stack was not ready in canonical-before-lazy order.');
    assert.equal(results.canonicalBeforeLazy.canonicalLoadOne,true);
    assert.equal(results.canonicalBeforeLazy.canonicalLoadMany,true);
    assert.equal(results.canonicalBeforeLazy.ownerAuthoritative,true);
    assert.equal(results.canonicalBeforeLazy.retainedTimers.length,2,'Harness must retain both canonical polling timers.');
    assert.equal(results.canonicalBeforeLazy.retainedTimers.some(timer=>timer.type==='interval'&&timer.cleared===true),true,'Synchronous handoff must cancel the retained polling interval.');
    assert.equal(results.canonicalBeforeLazy.timerCallbacksRan,0,'Test must not depend on retained timer callbacks.');
    const canonicalManifest=await racePage.evaluate(()=>window.EnglishLabLiveCanonicalLoaderCS21A193.manifest.slice());
    assert.deepEqual(results.canonicalBeforeLazy.loaded.filter(source=>canonicalManifest.includes(source)),canonicalManifest,'Immediate route must load the complete ordered manifest.');
    assert.deepEqual(raceErrors,[],raceErrors.join(' | '));
    await racePage.screenshot({path:path.join(output,'canonical-before-lazy.png'),fullPage:true});
    await raceContext.close();
  }

  for(const viewport of [{name:'mobile390',width:390,height:844},{name:'desktop1440',width:1440,height:900}]){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
    const page=await context.newPage();
    const requests=[];
    page.on('request',request=>requests.push(request.url()));
    page.on('pageerror',error=>errors.push(`${viewport.name} pageerror: ${error.message}`));
    page.on('response',response=>{if(response.status()>=400)errors.push(`${viewport.name} HTTP ${response.status()} ${response.url()}`);});
    await page.route('**/__cs21a193_harness?mode=new',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:harness('new')}));
    await page.goto(`${base}/__cs21a193_harness?mode=new`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__HARNESS_READY__===true);
    await page.locator('button').filter({hasText:'Ingresar con c'}).first().waitFor({state:'visible',timeout:5000});

    await page.evaluate(()=>{
      window.__CS193_LOADER_ONE_BEFORE__=window.anLazyCampus.loadOne;
      window.__CS193_LOADER_MANY_BEFORE__=window.anLazyCampus.loadMany;
    });
    await page.evaluate(()=>{
      const button=[...document.querySelectorAll('button')].find(node=>node.textContent.includes('Ingresar con c'));
      button.click();
      window.__F96_ROUTE_RESULT__=window.anLazyCampus.resolveRoute(
        window.F96_LAZY_MAP.english_lab_live,
        'EnglishLabLiveStudentView',
      ).then(View=>View===window.EnglishLabLiveStudentView);
    });
    await page.locator('input[placeholder="LAB-5937"]').waitFor({state:'visible',timeout:20000});
    assert.equal(await page.evaluate(()=>window.__F96_ROUTE_RESULT__),true,`${viewport.name}: la ruta F96 no resolvió la vista final.`);

    const snapshot=await page.evaluate(async()=>{
      const loader=window.EnglishLabLiveCanonicalLoaderCS21A193;
      const firstOwner=loader.getOwner();
      const firstComponent=window.MemoryMatchLiveRoundCS21A174;
      window.MemoryMatchLiveRoundCS21A174=window.EnglishLabMemoryMatchClassicSyncAdapterCS21A189.component;
      window.EnglishLabMemoryMatchLiveCS21A174=window.EnglishLabMemoryMatchClassicSyncAdapterCS21A189;
      await loader.load();
      const one=window.anLazyCampus.loadOne;
      const many=window.anLazyCampus.loadMany;
      for(let index=0;index<20;index+=1){
        window.dispatchEvent(new CustomEvent('an:lazy-module-loaded',{detail:{src:'synthetic-'+index}}));
        window.__ENGLISH_LAB_PRODUCT_GUARD_CS21A188__.install();
        window.__ENGLISH_LAB_CLASSIC_SYNC_GUARD_CS21A189__.install();
        window.__ENGLISH_LAB_AUTHORITATIVE_SYNC_GUARD_CS21A192__.install();
        window.__ENGLISH_LAB_STUDENT_DEP_GUARD_CS21A184__.install();
      }
      return {
        version:loader.version,
        epoch:loader.cacheEpoch,
        manifest:loader.manifest.slice(),
        ready:loader.isReady(),
        routeUsesManifest:JSON.stringify(window.F96_LAZY_MAP.english_lab_live)===JSON.stringify(loader.manifest),
        loaderStable:one===window.anLazyCampus.loadOne&&many===window.anLazyCampus.loadMany,
        canonicalMarkers:one.__cs21a193CanonicalOwner===true&&many.__cs21a193CanonicalOwner===true,
        ownerStable:firstOwner===loader.getOwner()&&firstComponent===window.MemoryMatchLiveRoundCS21A174,
        ownerAuthoritative:window.EnglishLabMemoryMatchLiveCS21A174===window.EnglishLabMemoryMatchAuthoritativeSyncCS21A192,
        componentAuthoritative:window.MemoryMatchLiveRoundCS21A174.__cs21a192AuthoritativeSyncAdapter===true,
        loaded:window.anLazyCampus.getStatus().loaded,
        horizontalOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
      };
    });
    assert.equal(snapshot.ready,true,`${viewport.name}: stack canónico incompleto.`);
    assert.equal(snapshot.routeUsesManifest,true,`${viewport.name}: F96 no usa el manifiesto único.`);
    assert.equal(snapshot.loaderStable,true,`${viewport.name}: un guard volvió a envolver el loader.`);
    assert.equal(snapshot.canonicalMarkers,true,`${viewport.name}: el owner final no es CS21A193.`);
    assert.equal(snapshot.ownerStable,true,`${viewport.name}: CS21A192 no fue reafirmado como dueño estable.`);
    assert.equal(snapshot.ownerAuthoritative,true);
    assert.equal(snapshot.componentAuthoritative,true);
    assert.equal(snapshot.horizontalOverflow,false);
    assert.equal(snapshot.manifest.length,12);
    assert.ok(snapshot.manifest.every(source=>new URL(source,'http://local/').searchParams.get('v')==='CS21A193'),'Cada entrada del manifiesto debe usar exactamente CS21A193.');
    assert.deepEqual(snapshot.loaded.filter(source=>snapshot.manifest.includes(source)),snapshot.manifest,'El loader debe ejecutar el manifiesto una vez y en orden.');
    assert.equal(await page.evaluate(()=>window.__CS193_LOADER_ONE_BEFORE__===window.anLazyCampus.loadOne&&window.__CS193_LOADER_MANY_BEFORE__===window.anLazyCampus.loadMany),true);

    const manifestPaths=new Set(snapshot.manifest.map(source=>new URL(source,'http://local/').pathname));
    const manifestRequests=requests.filter(url=>manifestPaths.has(new URL(url).pathname));
    const requestCounts={};
    for(const url of manifestRequests){
      const parsed=new URL(url);const key=parsed.pathname;requestCounts[key]=(requestCounts[key]||0)+1;
      assert.equal(parsed.searchParams.get('v'),'CS21A193',`${viewport.name}: epoch mezclado en ${url}`);
    }
    assert.equal(Object.keys(requestCounts).length,12,`${viewport.name}: faltan recursos del manifiesto.`);
    assert.ok(Object.values(requestCounts).every(count=>count===1),`${viewport.name}: hubo cargas duplicadas ${JSON.stringify(requestCounts)}.`);
    results[viewport.name]={...snapshot,requestCounts};
    await page.screenshot({path:path.join(output,`${viewport.name}-canonical.png`),fullPage:true});
    await context.close();
  }

  assert.deepEqual(errors,[],`Errores navegador: ${errors.join(' | ')}`);
  const result={
    verdict:'PASS_ENGLISH_LAB_CANONICAL_LOADER_CS21A193',
    legacyRev2Reproduced:true,
    legacyEpochs:results.legacy.epochs,
    directAcademiaPlay:true,
    f96Route:true,
    singleEpoch:'CS21A193',
    manifestEntries:12,
    authoritativeOwner:'CS21A192',
    loaderIdentityStable:true,
    canonicalBeforeLazyRace:true,
    immediateRouteWithoutTimer:true,
    mobile390:true,
    desktop1440:true,
  };
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({result,details:results},null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}finally{
  await browser.close();
  if(server)await new Promise(resolve=>server.close(resolve));
}
