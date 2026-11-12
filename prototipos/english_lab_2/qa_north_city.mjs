// QA North City, staging independiente. Chrome real, sin backend y sin escrituras académicas.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const BASE=(process.env.QA_BASE_URL||'http://127.0.0.1:4217')+'/prototipos/english_lab_2/';
const browser=await chromium.launch({channel:'chrome'});
const logs=[];
const ok=(name,detail='')=>{logs.push(name);console.log('PASS',name,detail)};
async function create(width=1280,height=800){
 const c=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
 const p=await c.newPage(),errors=[],back=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text())});
 p.on('request',req=>{if(/script\.google|googleusercontent/i.test(req.url()))back.push(req.url())});
 return {p,c,errors,back};
}
async function noOverflow(p){return p.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1)}
try{
 let {p,c,errors,back}=await create();
 await p.goto(BASE+'north-city.html',{waitUntil:'load'});
 assert.equal(await p.locator('.gp-header .gp-brand img[src="../../assets/academy_a.svg"]').count(),1);
 assert.equal(await p.locator('.gp-hero h1').count(),1);
 assert.equal(await p.locator('#gp-play-story').count(),1);
 assert.equal(await p.locator('.gp-story-journey .gp-journey-card').count(),4);
 assert.equal(await p.locator('main>section').count(),3);
 assert.equal(await p.locator('a[href^="https://wa.me/50686860097"]').count(),1);
 assert(!(await p.locator('body').innerText()).includes('Port Hazel'));
 assert(!(await p.locator('body').innerText()).includes('Comparar formato anterior'));
 assert(!(await p.locator('body').innerText()).includes('Ver en silencio'));
 assert(await noOverflow(p));
 ok('presentación institucional','A real, tres bloques, niveles integrados, solo CTA al juego y matrícula');
 await p.click('#gp-play-story');
 await p.waitForSelector('#gp-trailer:not([hidden])');
 await p.waitForFunction(()=>{let v=document.getElementById('gp-trailer-video');return v.currentTime>.5 && v.videoWidth===1280&&window.NBIntroAudio.state().active},null,{timeout:15000});
 await p.waitForFunction(()=>window.NBIntroAudio.state().rms>.00005,null,{timeout:4000});
 ok('video y audio','MP4 de North City se reproduce tras un clic con señal sonora real');
 await p.click('#gp-trailer-skip');
 await p.waitForURL(/north-001\.html\?intro=skip/);
 await p.waitForSelector('#gp-name-stage:not([hidden])');
 assert.equal(await p.locator('#gp-game-video').evaluate(v=>!!v.getAttribute('src')),false,'video no se repite después del tráiler');
 await p.fill('#gp-name','Ana');
 await p.click('#gp-begin');
 await p.waitForSelector('.l2-step',{timeout:15000});
 assert.equal(await p.locator('.l2-episode').count(),0,'entra directo a la primera escena, sin lista intermedia');
 assert.equal(await p.evaluate(()=>window.LAB2_CONTENT.city),'North City');
 assert.equal(await p.evaluate(()=>window.LAB2_CONTENT.episodes[0].place),'North Coffee · North City');
 assert.deepEqual(await p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('an_english_lab_2'))),['an_english_lab_2_v1_NC001PLAY'],'avance en clave propia');
 assert(await p.locator('#nb-sound button').count()>=3,'controles de sonido del juego');
 assert(!(await p.locator('body').innerText()).includes('Port Hazel'));
 assert(!(await p.locator('body').innerText()).includes('The Corner Cup'));
 assert(!(await p.locator('body').innerText()).match(/Guaria|La Esquina|Detalles de la Plaza/));
 ok('juego continuo','tráiler -> nombre -> primera escena, sin lista intermedia ni video repetido');
 await p.click('.l2-step .l2-btn-go');
 await p.waitForSelector('.l2-option');
 const px=await p.evaluate(()=>({opt:parseFloat(getComputedStyle(document.querySelector('.l2-option')).fontSize),ask:parseFloat(getComputedStyle(document.querySelector('.l2-ask')).fontSize),face:document.querySelector('.nb-portrait').getBoundingClientRect().width}));
 assert(px.opt>=18&&px.ask>=18&&px.face>=100,'letra y retrato grandes: '+JSON.stringify(px));
 ok('primera escena','opciones de '+px.opt+' px, pregunta de '+px.ask+' px, retrato de '+px.face+' px');
 const clips=[];p.on('response',r=>{if(/media\/voice\/.+\.mp3/.test(r.url()))clips.push(r.status())});
 await p.click('.l2-listen-row .l2-listen:not(.l2-listen-slow)');
 await p.waitForFunction(()=>{const v=window.LAB2.voice.state();return v.source==='file'&&v.playing},null,{timeout:8000});
 assert(/media\/voice\/r\d+\.mp3$/.test(await p.evaluate(()=>window.LAB2.voice.state().file)),'suena la línea grabada de Ms. Rivera');
 assert.equal(await p.evaluate(()=>window.NB.audio.state().ducked),true,'el ambiente baja mientras habla');
 await p.click('.l2-listen-slow');
 await p.waitForFunction(()=>window.LAB2.voice.state().playing);
 assert.equal(await p.evaluate(()=>{window.LAB2.voice.stop();return window.LAB2.voice.state().playing}),false);
 await p.click('#nb-sound button[data-k="voice"]');
 await p.click('.l2-listen-row .l2-listen:not(.l2-listen-slow)');
 await p.waitForTimeout(300);
 assert.equal(await p.evaluate(()=>window.LAB2.voice.state().playing),false,'con Voz apagada no suena');
 await p.click('#nb-sound button[data-k="voice"]');
 assert(clips.length>=1&&clips.every(c=>c===200||c===206),'clips servidos: '+clips);
 const cov=await p.evaluate(()=>{const L=window.LAB2,e=window.LAB2_CONTENT.episodes[0];let hit=0,miss=0;
  for(const sc of e.scenes)for(const st of sc.steps){const xs=[];if(st.who&&st.say)xs.push([st.who,st.say]);if(st.then)xs.push([st.who,st.then]);
   for(const o of st.options||[]){if(o.react)xs.push([st.who,o.react]);if(o.then)xs.push([st.who,o.then])}
   for(const [w,t] of xs){window.LAB2_VOICE.files[L.voice.keyFor(w,t)]?hit++:miss++}}return{hit,miss}});
 assert.equal(cov.miss,0,'toda línea de personaje tiene grabación');
 ok('voces grabadas',cov.hit+' líneas con archivo propio; Escuchar y Más lento reproducen el clip; Voz apagada lo silencia; el ambiente cede');
 // Paso oral: el navegador escucha (reconocedor simulado) y la barra llega a check verde solo si se entendió
 await p.evaluate(()=>{
  window.__sr={say:'',deny:false};
  window.SpeechRecognition=window.webkitSpeechRecognition=class{start(){setTimeout(()=>{
    if(window.__sr.deny){this.onerror({error:'not-allowed'});this.onend();return}
    if(window.__sr.say)this.onresult({results:[Object.assign([{transcript:window.__sr.say}],{isFinal:true})]});
    this.onend();},40)}stop(){}abort(){}};
  window.__mountSay=()=>{const old=document.getElementById('qa-say');if(old)old.remove();const d=document.createElement('div');d.id='qa-say';d.className='l2-root';document.body.appendChild(d);window.__done=null;
   window.ReactDOM.createRoot(d).render(window.React.createElement(window.LAB2.steps.say,{step:{kind:'say',who:'rivera',say:'What\'s your name?',phrase:'What\'s your name?',ask_es:'Decilo'},
    ctx:{player:{name:'Ana'},cast:window.LAB2_CONTENT.episodes[0].cast,content:window.LAB2_CONTENT},onDone:r=>{window.__done=r}}))};
  window.__mountSay();});
 const level=()=>p.getAttribute('#qa-say .l2-hear-bar','aria-valuenow').then(Number);
 await p.click('#qa-say .l2-hear-btn'); await p.waitForFunction(()=>/No escuché nada/.test(document.querySelector('#qa-say').innerText));
 assert.equal(await level(),0); assert.equal(await p.locator('#qa-say .l2-hear.is-ok').count(),0);
 await p.evaluate(()=>{window.__sr.say='I like bananas'}); await p.click('#qa-say .l2-hear-btn');
 await p.waitForFunction(()=>/No se entendió|Casi/.test(document.querySelector('#qa-say').innerText));
 assert(await level()<60,'una frase distinta no llena la barra'); assert.equal(await p.locator('#qa-say .l2-hear.is-ok').count(),0);
 await p.evaluate(()=>{window.__sr.say='wats your naem'}); await p.click('#qa-say .l2-hear-btn');
 await p.waitForSelector('#qa-say .l2-hear.is-ok');
 assert.equal(await level(),100); assert.equal((await p.textContent('#qa-say .l2-hear-check')).trim(),'✓');
 assert(!/\d+\s*%|\/10/.test(await p.locator('#qa-say').innerText()),'sin número ni porcentaje a la vista');
 assert(!(await p.locator('#qa-say').innerText()).includes('wats'),'no muestra lo que entendió');
 await p.click('#qa-say .l2-btn-go'); assert.equal(await p.evaluate(()=>window.__done&&window.__done.heard),true);
 await p.evaluate(()=>{window.__sr.deny=true;window.__mountSay()}); await p.waitForSelector('#qa-say .l2-hear-btn'); await p.click('#qa-say .l2-hear-btn');
 await p.waitForFunction(()=>/No hay permiso/.test(document.querySelector('#qa-say').innerText));
 await p.click('#qa-say .l2-say-manual'); assert.equal(await p.evaluate(()=>window.__done&&window.__done.spoken&&!window.__done.heard),true);
 await p.evaluate(()=>{delete window.SpeechRecognition;delete window.webkitSpeechRecognition;window.SpeechRecognition=window.webkitSpeechRecognition=undefined;window.__mountSay()});
 await p.waitForSelector('#qa-say .l2-say-manual');
 assert.equal(await p.locator('#qa-say .l2-hear-btn').count(),0); assert.equal(await p.locator('#qa-say .l2-say-manual').count(),1);
 await p.evaluate(()=>document.getElementById('qa-say').remove());
 ok('paso oral','silencio y frase distinta no dan check; "wats your naem" sí; sin número ni transcripción; sin permiso o sin reconocedor queda la marca manual');
 await p.click('.l2-scene-bar .l2-back');
 await p.waitForSelector('.l2-episode');
 assert((await p.locator('.l2-episode').innerText()).includes('North Coffee'));
 ok('salir a la lista','desde la escena se puede volver a la lista de escenas');
 assert.deepEqual(errors,[]); assert.deepEqual(back,[]);
 ok('aislamiento','cero errores JS y cero backend');
 await c.close();

 ({p,c,errors,back}=await create(390,844));
 await p.goto(BASE+'north-city.html',{waitUntil:'load'});
 assert(await noOverflow(p));
 assert(await p.locator('#gp-play-story').isVisible());
 await p.click('#gp-play-story');
 await p.waitForFunction(()=>document.getElementById('gp-trailer-video').currentTime>.2,null,{timeout:15000});
 assert(await noOverflow(p));
 await p.click('#gp-trailer-skip');
 await p.waitForSelector('#gp-name-stage:not([hidden])');
 assert(await noOverflow(p));
 await p.fill('#gp-name','Leo');
 await p.click('#gp-begin');
 await p.waitForSelector('.l2-step');
 assert(await noOverflow(p));
 assert.deepEqual(errors,[]);assert.deepEqual(back,[]);
 ok('móvil 390 px','presentación, tráiler, nombre y juego sin desborde');
 await c.close();

 ({p,c,errors,back}=await create());
 await p.goto(BASE+'north-002.html?intro=skip');
 await p.waitForSelector('#gp-name-stage:not([hidden])');
 await p.fill('#gp-name','Raquel');
 await p.click('#gp-begin');
 await p.waitForSelector('.l2-step');
 const second=await p.evaluate(()=>({city:window.LAB2_CONTENT.city,title:window.LAB2_CONTENT.episodes[0].title_es,place:window.LAB2_CONTENT.episodes[0].place}));
 assert.equal(second.city,'North City');
 assert(second.title.includes('North City') && second.place.includes('City Gifts'));
 assert.deepEqual(errors,[]);assert.deepEqual(back,[]);
 ok('segunda aventura','misma ciudad, tienda City Gifts, entra directo a la escena');
 await c.close();
 ({p,c,errors,back}=await create());
 for(const [old,now] of [['presentacion-guaria.html','north-city.html'],['guaria-001.html?intro=skip','north-001.html?intro=skip'],['guaria-002.html','north-002.html']]){
  await p.goto(BASE+old); await p.waitForURL(u=>u.href.endsWith(now),{timeout:8000});
 }
 ok('rutas anteriores','las tres rutas de Ciudad Guaria redirigen a North City');
 await c.close();
 console.log('NORTH CITY PASS',logs.length,'grupos');
}finally{await browser.close()}
