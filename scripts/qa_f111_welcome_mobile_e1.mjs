// F111 · Bienvenida responsive. Chromium local con estudiante sintético; nunca consulta producción.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const source = read('src/syllabus_views.jsx');
const start = source.indexOf('function WelcomeBanner({ onClose }) {');
const end = source.indexOf('// INFO PROGRAMA', start);
assert(start >= 0 && end > start, 'WelcomeBanner exists');
const snippet = source.slice(start, end).replace(/\/\/ ─+\n(?=\/\/ INFO PROGRAMA)/g, '');
const css = read('styles/tokens.css') + '\n' + read('styles/campus.css') + '\n' + read('styles/mobile_navigation_cs21a111.css');
const app = read('src/app.jsx');
const campus = read('campus.html');
assert(app.includes('src/syllabus_views.jsx?v=F111WELCOMEMOBILE20261023'), 'lazy loader cache updated');
assert(campus.includes('styles/campus.css?v=F111WELCOMEMOBILE20261023'), 'style cache updated');
assert(snippet.includes('ReactDOM.createPortal') && snippet.includes('document.body'), 'portal escapes app shell stacking context');

const browser = await chromium.launch({headless:true});
const sizes = [
  [320,568], [375,667], [390,844], [430,932], [768,1024], [1280,800]
];
try {
  for (const [width,height] of sizes) {
    const page = await browser.newPage({viewport:{width,height}, deviceScaleFactor:1, isMobile:width < 700, hasTouch:width < 700});
    await page.route('https://f111-welcome.synthetic.invalid/**', route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="root"></main></body></html>'}));
    await page.goto('https://f111-welcome.synthetic.invalid/campus.html');
    await page.addStyleTag({content:css});
    await page.addScriptTag({path:new URL('../vendor/react.js', import.meta.url).pathname});
    await page.addScriptTag({path:new URL('../vendor/react-dom.js', import.meta.url).pathname});
    await page.addScriptTag({path:new URL('../vendor/babel.js', import.meta.url).pathname});
    const transformed=await page.evaluate(text=>Babel.transform(text,{presets:['react']}).code,snippet);
    await page.addScriptTag({content:transformed+'\nwindow.__WelcomeBanner=WelcomeBanner;'});
    await page.evaluate(() => {
      sessionStorage.setItem('an_usuario',JSON.stringify({
        nombre:'ESTUDIANTE FICTICIO CON NOMBRE MUY LARGO PARA VISUALIZACION',
        cedula:'100000001',codigo:'90001',grupo:'B1-TEST-GROUP-2026-EXTRA-LONG',
        nivel_activo:'Básico I'
      }));
      window.PRIORITY_BLOCK={items:[
        {id:'r',code:'1.1',required:true,title:'Reglamento estudiantil',desc:'Derechos, deberes y conducta académica.',minutes:20},
        {id:'n',code:'1.2',required:true,title:'Reglamento de netiqueta',desc:'Normas de comportamiento en sesiones virtuales.',minutes:10},
        {id:'v',code:'1.3',required:true,title:'Video de bienvenida al Programa',desc:'Introducción al Campus Virtual y al programa.',minutes:6}
      ]};
      const host=document.querySelector('#root');
      host.innerHTML='<div class="app"><div class="main" style="isolation:isolate"><div id="child"></div></div></div>';
      const root=ReactDOM.createRoot(document.querySelector('#child'));
      root.render(React.createElement(window.__WelcomeBanner,{
        onClose:()=>{window.__closed=true;root.render(null);}
      }));
    });
    const dialog=page.getByRole('dialog',{name:'Bienvenida y material obligatorio del Campus'});
    await dialog.waitFor();
    assert.equal(await dialog.isVisible(),true,'dialog visible '+width);
    assert.equal(await page.evaluate(()=>document.querySelector('.f111-welcome-overlay').parentElement===document.body),true,'portal root '+width);
    const info=await page.evaluate(()=>{
      const rect=sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
      const overlay=document.querySelector('.f111-welcome-overlay');
      const panel=document.querySelector('.f111-welcome-panel');
      const body=document.querySelector('.f111-welcome-body');
      const actions=document.querySelector('.f111-welcome-actions');
      return {
        viewport:{w:innerWidth,h:innerHeight,scrollWidth:document.documentElement.scrollWidth},
        overlayZ:Number(getComputedStyle(overlay).zIndex),
        panel:rect('.f111-welcome-panel'),actions:rect('.f111-welcome-actions'),
        columns:getComputedStyle(body).gridTemplateColumns.split(/\s+/).length,
        bodyScroll:body.scrollHeight>body.clientHeight,
        buttons:[...actions.querySelectorAll('button')].map(b=>{const r=b.getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,w:r.width};})
      };
    });
    assert(info.viewport.scrollWidth <= width+1,'no page horizontal overflow '+width+': '+JSON.stringify(info));
    assert(info.overlayZ>1410,'modal above mobile navbar '+width);
    assert(info.panel.x>=-1 && info.panel.right<=width+1,'panel within viewport '+width);
    assert(info.panel.y>=-1 && info.panel.bottom<=height+1,'panel fits viewport '+width);
    assert.equal(info.columns,width<=700?1:2,'grid responsive '+width);
    assert.equal(info.buttons.length,2,'two buttons '+width);
    for(const b of info.buttons){
      assert(b.x>=-1 && b.right<=width+1,'button fits width '+width);
      assert(b.y>=-1 && b.bottom<=height+1,'footer always visible '+width);
      assert(b.w>=42,'tap target nonzero width '+width);
    }
    await dialog.getByText('Reglamento estudiantil').scrollIntoViewIfNeeded();
    await dialog.getByText('Nivel', {exact:true}).scrollIntoViewIfNeeded();
    const v=await page.locator('.f111-welcome-value').last().innerText();
    assert.equal(v,'Básico I','data stays visible when scrolled '+width);
    await dialog.getByRole('button',{name:/Entendido, revisaré el material/}).click();
    assert.equal(await dialog.count(),0,'button actually dismisses modal '+width);
    assert.equal(await page.evaluate(()=>window.__closed),true,'onClose called '+width);
    console.log('WELCOME_MOBILE_PASS',width,height,info.bodyScroll?'scroll':'fits');
    await page.close();
  }
} finally { await browser.close(); }
console.log('F111_WELCOME_MOBILE_CHROMIUM_PASS 6 widths, 2 actions, no real students');
