const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),http=require('http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const Babel=require('../vendor/babel.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8').replace(/\r\n/g,'\n');
const app=read('src/app.jsx');
const compile=s=>Babel.transform(s,{presets:['react'],plugins:['transform-block-scoping']}).code;
for(const f of ['src/app.jsx','src/student_menu_academic_cs21a120.jsx','src/student_content_access_cs21a125.jsx'])compile(read(f));
const studentMap=app.slice(app.indexOf('const map = {',app.indexOf('let content')),app.indexOf("} else if (role === 'teacher')",app.indexOf('let content')));
assert(studentMap.includes('component="CertificadosView"'));
assert(!studentMap.includes('component="PerfilView"'));
assert(!read('src/student_menu_academic_cs21a120.jsx').includes('component="PerfilView"'));
const aliases=app.slice(app.indexOf('const STUDENT_ROUTE_ALIASES_F984'),app.indexOf('function esUsuarioGratisSesion'));
const navigate=app.slice(app.indexOf('  const navigateTo ='),app.indexOf('  const cambiarPestanaEstudiante'));
const historyEffect=app.slice(app.indexOf('  useEffect(() => {',app.indexOf('// F98.4-A: atrás/adelante')),app.indexOf('\n\n  useEffect',app.indexOf('// F98.4-A: atrás/adelante')));
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.join(__dirname,'..',req.url.split('?')[0]);if(fs.existsSync(f)&&fs.statSync(f).isFile()){res.end(fs.readFileSync(f));}else res.end('<div id="root"></div>');}).listen(0,'127.0.0.1');
 const browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL||'msedge',headless:true});
 try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
 await page.goto(`http://127.0.0.1:${server.address().port}/`);
 await page.addScriptTag({path:path.join(__dirname,'../vendor/react.js')});await page.addScriptTag({path:path.join(__dirname,'../vendor/react-dom.js')});
 await page.evaluate(()=>{window.getSesion=()=>({rol:'student',codigo:'SYNTHETIC-QA',nombre:'Synthetic QA',nivel_activo:'B1'});window.__AN_CONTENT_ACCESS_CS21A125__={value:{niveles_autorizados:[],nivel_maximo:''},promise:null};window.fetch=async()=>({ok:true,text:async()=>JSON.stringify({ok:true,catalogo:{},catalog:{}})});window.Icon=()=>null;});
 for(const f of ['src/student_menu_academic_cs21a120.jsx','src/student_content_access_cs21a125.jsx'])await page.addScriptTag({content:compile(read(f))});
 await page.addScriptTag({content:compile(`${aliases}
 const {useState,useEffect}=React;
 function Harness(){const role='student';const [active,setActive]=useState('dashboard');const [studentCourseTab,setStudentCourseTab]=useState('cronograma');const [studentEvalTab,setStudentEvalTab]=useState('proximas');const [studentDocsTab,setStudentDocsTab]=useState('programa');const setPendingLesson=()=>{},setPendingGrupo=()=>{},setPendingSeguimiento=()=>{},setPendingOral=()=>{},scrollCampusTopF91=()=>{};
 ${navigate}
 ${historyEffect}
 window.qaNavigate=navigateTo;
 return <div className="app"><window.Sidebar usuario={getSesion()} active={active} setActive={navigateTo}/><main className="main" id="native">{active}</main></div>;}
 ReactDOM.createRoot(document.getElementById('root')).render(<Harness/>);`)});
 const check=async(id)=>{await page.waitForFunction(id=>{const a=[...document.querySelectorAll('.student-sb .sb-item.active')];return a.length===1&&a[0].dataset.navId===id;},id);assert.equal(await page.locator('.student-sb .sb-item.active').count(),1);};
 await check('dashboard');
 await page.addScriptTag({content:read('src/student_tasks_menu_cs21a126.js')});
 for(let cycle=0;cycle<2;cycle++)for(const id of ['syllabus_estudiante','planeamiento_estudiante','libros_audios_estudiante','recursos_adicionales','evaluaciones','certificados','dashboard']){
 await page.locator(`[data-nav-id="${id}"]`).click();await check(id);const len=await page.evaluate(()=>history.length);await page.locator(`[data-nav-id="${id}"]`).click();await check(id);assert.equal(await page.evaluate(()=>history.length),len);}
 for(const id of ['syllabus_estudiante','planeamiento_estudiante','libros_audios_estudiante','recursos_adicionales','dashboard']){await page.locator(`[data-nav-id="${id}"]`).click();await check(id);}
 for(const id of ['recursos_adicionales','libros_audios_estudiante','planeamiento_estudiante','syllabus_estudiante','dashboard']){await page.goBack();await check(id);}
 for(const id of ['syllabus_estudiante','planeamiento_estudiante','libros_audios_estudiante','recursos_adicionales','dashboard']){await page.goForward();await check(id);}
 for(const alias of ['perfil','perfil_estudiante']){await page.evaluate(alias=>{location.hash=alias;},alias);await page.waitForFunction(()=>location.hash==='#dashboard');await check('dashboard');assert.equal(await page.locator('#native').textContent(),'dashboard');}
 for(const id of ['tareas_estudiante','planeamiento_estudiante','tareas_estudiante','syllabus_estudiante','dashboard']){await page.locator(`[data-nav-id="${id}"]`).click();await check(id);assert.equal(await page.locator('#an-student-academic-host-cs21a120, #an-content-access-host-cs21a125, #an-student-tasks-host-cs21a126').count(),id==='dashboard'?0:1);}
 await page.locator('[data-nav-id="libros_audios_estudiante"]').click();await check('libros_audios_estudiante');await page.evaluate(()=>qaNavigate('perfil'));await check('dashboard');assert.equal(await page.locator('#an-content-access-host-cs21a125').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS: JSX, profile aliases, unique active menu, repeated clicks, native/custom transitions, Back/Forward (synthetic browser; no production data).');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1)});

