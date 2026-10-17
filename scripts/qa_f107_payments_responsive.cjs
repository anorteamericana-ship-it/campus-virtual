const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),http=require('http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const Babel=require('../vendor/babel.js');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const src=read('src/student_modules.jsx');
const a=src.indexOf('function PagosContenido({ data })');
const b=src.indexOf('// CertificadosView',a);
assert(a>=0&&b>a,'F107 payment component section must exist');
const snippet=src.slice(a,b);
const code=Babel.transform(snippet,{presets:['react'],plugins:['transform-block-scoping']}).code;
for(const fragment of ['student-payment-concept-list','student-payment-concept-value','student-payment-finance-notice','minmax(min(100%,300px),1fr)']){
 assert(snippet.includes(fragment),'F107 missing payment invariant: '+fragment);
}
assert(read('styles/student_unified.css').includes('F107 pagos responsive'));
assert(read('campus.html').includes('F107PAYMENTSRESPONSIVE20261010'));
assert(read('src/app.jsx').includes('student_modules.jsx?v=F109AINAGRADES20261010'));
const fixture={
 pendientes:{matricula:0,cuotas_pendiente:172000,cuota_mensual:43000,certificado:15000,
   nivel_activo:'B1',por_nivel:{B1:{certificado_exigible:true}}},
 niveles:{B1:{estatus:'CA'}},
 pagos:[{concepto:'Matrícula',monto:10000,fecha:'15/09/2026'}],otrosPagos:[],
 estudiante:{},contactos_campus:{}
};
(async()=>{
 const server=http.createServer((req,res)=>{
  const f=path.join(root,decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,''));
  if(fs.existsSync(f)&&fs.statSync(f).isFile())return res.end(fs.readFileSync(f));
  res.writeHead(200,{'Content-Type':'text/html'});res.end('<div id="root"></div>');
 }).listen(0,'127.0.0.1');
 const browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL||'chrome',headless:true});
 try{
  const base='http://127.0.0.1:'+server.address().port+'/';
  for(const width of [360,390,768,1024,1280,1536]){
   const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base,{waitUntil:'domcontentloaded'});
   await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="'+base+'styles/tokens.css"><link rel="stylesheet" href="'+base+'styles/campus.css"><link rel="stylesheet" href="'+base+'styles/student_unified.css"></head><body><div id="root"></div></body></html>');
   await page.addScriptTag({path:path.join(root,'vendor/react.js')});
   await page.addScriptTag({path:path.join(root,'vendor/react-dom.js')});
   await page.evaluate(()=>{
     window.calcularNivelActivoSM=()=> 'B1';
     window.NIVEL_COLOR_SM={B1:'#EDB426'};
     window.NIVEL_NOMBRE_SM={B1:'Básico I'};
     window.PAGO_NIVEL_ORDEN_SM=['B1','B2','I1','I2'];
     window.NIVEL_LIBRO_SM={B1:'Interchange Intro'};
     window.agruparPagosPorModuloSM=()=>[{nivel:'B1',movimientos:1,total:10000,comprobantes:[{comprobante:'BCR-79041559-15/09/2026-OP-PAGO-20260915-202952-0FA0EC82',movimientos:[{id:'p1',concepto:'Matrícula',fecha:'15/09/2026',monto:10000}]}]}];
     window.ContactoAdmin=()=>null;
   });
   await page.addScriptTag({content:code});
   await page.evaluate(data=>window.F107_FIXTURE=data,fixture);
   await page.evaluate(()=>ReactDOM.createRoot(document.getElementById('root')).render(
     React.createElement('div',{className:'app'},
       React.createElement('aside',{className:'sb student-sb'},'Campus del estudiante'),
       React.createElement('main',{className:'main'},React.createElement('div',{className:'student-page-payments student-payments-responsive'},
         React.createElement('h1',null,'Pagos y estado de cuenta'),React.createElement(PagosContenido,{data:window.F107_FIXTURE}))))));
   await page.waitForTimeout(250);
   const result=await page.evaluate(()=>{
     const container=document.getElementById('root');
     const texts=['₡172000','₡15000','FUTURO'];
     const values=[...container.querySelectorAll('.student-payment-concept-value')];
     const cards=[...container.querySelectorAll('.student-payment-history-card')];
     const legal=container.querySelector('.student-payment-finance-notice');
     const viewport=document.documentElement.clientWidth;
     const elements=[...values,...cards,legal].filter(Boolean);
     return {viewport,pageScrollWidth:document.documentElement.scrollWidth,amounts:values.map(e=>e.innerText),
       rightEdgeMax:Math.ceil(Math.max(...elements.map(e=>e.getBoundingClientRect().right))),
       leftEdgeMin:Math.floor(Math.min(...elements.map(e=>e.getBoundingClientRect().left))),
       paymentCount:values.length,historyCount:cards.length,legalWidth:legal?.getBoundingClientRect().width,
       cardsFit:elements.every(e=>e.getBoundingClientRect().right<=viewport+2 && e.getBoundingClientRect().left>=-2),
       amountsVisible:texts.every(t=>container.innerText.replace(/[\s.]/g,'').toUpperCase().includes(t)),
       labelFuture:container.innerText.includes('Certificado futuro · aún no exigible')};
   });
   console.log('QA_F107_VIEWPORT_DIAGNOSTIC',width,JSON.stringify(result));
   assert.equal(errors.length,0,'React errors at '+width+': '+errors.join(';'));
   assert.equal(result.paymentCount,2,'Expected quota and certificate at '+width);
   assert.equal(result.historyCount,1,'Expected payment history at '+width);
   assert(result.cardsFit,'Clipped payment element at '+width+': '+JSON.stringify(result));
   assert(result.pageScrollWidth<=width+2,'Document horizontal overflow at '+width+': '+JSON.stringify(result));
   assert(result.amountsVisible,'Missing amount/state '+width);
   assert(result.labelFuture,'Certificate future status '+width);
   console.log('QA_F107_VIEWPORT_PASS',width,JSON.stringify(result));
   await page.close();
  }
  console.log('QA_F107_RESPONSIVE_RENDER_PASS');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});