// F111 QZ32 · QA E1 de vista estudiante y docente (sin red, sin credenciales).
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL('../'+x,import.meta.url),'utf8');
const student=read('modulos/quiz_progress.html');
const teacher=read('modulos/quiz_progress_docente.html');
const view=read('src/vista_docente.jsx');
for(const [name,html] of [['student',student],['teacher',teacher]]){
 const m=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(m,'script present '+name);
 new Function(m[1]);
 assert.ok(html.includes('window.F111_QZ_QA_API_URL'),name+' requires explicit QA endpoint injection');
 assert.ok(!html.includes('AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ'),name+' does not target PROD URL');
 assert.ok(!html.includes('_Key.pdf')&&!html.includes('correct:'),name+' has no correct answers');
}

const firstDigital=read('modulos/qz_b1_pc01_digital.html');
assert.match(firstDigital,/Quiz 1 · Básico I/,'first digital quiz title B1');
assert.ok(!firstDigital.includes('<iframe')&&!firstDigital.includes('<embed')&&!firstDigital.includes('.pdf'),'the first digital quiz never displays a PDF');
const firstQuestionIds=['A1','A2','A3','A4','B1','B2','B3','C1','C2','C3','C4',
  'D1','D2','D3','D4','E1a','E1b','E2a','E2b','E3a','E3b','F1','F2','F3','F4'];
for(const qid of firstQuestionIds)assert.ok(firstDigital.includes("['"+qid+"'"),'real quiz item '+qid);
assert.equal(firstQuestionIds.length,25);
assert.ok(firstDigital.includes('sessionStorage.setItem'),'preview state local only');
assert.ok(!firstDigital.includes('fetch(')&&!firstDigital.includes('qzProgressSubmit'),'preview never writes backend or student grades');
const firstScript=firstDigital.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(firstScript,'digital page script exists');
new Function(firstScript[1]);

assert.ok(student.includes('0 %'),'student understands zero official weight');
// Los mismos 8 PC por nivel alimentan las 32 rutas del mismo módulo,
// sin 32 copias HTML ni preguntas/soluciones distribuidas en Pages.
const schedule=student.match(/const STEPS=(\{[^;]+\});/);
assert.ok(schedule,'calendar schedule for eight quizzes');
const mapping=JSON.parse(schedule[1].replace(/([0-9]+):/g,'"$1":'));
assert.equal(Object.keys(mapping).length,8,'eight lesson slots');
const routes=[];
for(const nivel of ['B1','B2','I1','I2'])
 for(const leccion of Object.keys(mapping)){
  const quiz=String(Object.keys(mapping).indexOf(leccion)+1).padStart(2,'0');
  routes.push('IC5_'+nivel+'_WQ'+quiz);
  assert.ok(mapping[leccion].length===2,'two units per PC');
 }
assert.equal(routes.length,32);
assert.equal(new Set(routes).size,32);
assert.ok(student.includes("meta.peso_oficial!==0"),'never accept weighted official quiz');
assert.ok(student.includes('el.readOnly=submitted||uncertainSubmit||expired'),'lock answered form after submit/date');
assert.ok(student.includes("async function verifySubmit()"),'uncertain submit can reconcile by read');
assert.ok(student.includes('!uncertainSubmit')&&student.includes("qzProgressMyAttempt"),'do not resend unknown submit');
assert.ok(student.includes('id="verifyBtn"'),'teacher may help after read-only verification');
for(const id of [4,8,13,16,21,24,28,30])assert.ok(student.includes(String(id)+':['),'progress lesson '+id);
for(const name of ['qzProgressGet','qzProgressPaper','qzProgressMyAttempt','qzProgressSaveDraft','qzProgressSubmit'])assert.ok(student.includes(name),'student API '+name);
for(const name of ['qzProgressTeacherList','qzProgressTeacherReview','qzProgressTeacherMaterials'])assert.ok(teacher.includes(name),'teacher API '+name);
assert.ok(!view.includes('pcQuizReviewSuggestionsF111'),'protected classroom closure unchanged');
assert.ok(teacher.includes('navigator.clipboard.writeText'),'teacher can transfer reviewed observation to Progress Check');
// R10: fallos o formatos inesperados del roster auxiliar no deben ocultar entregas.
assert.match(teacher,/const list=await api\('qzProgressTeacherList'\)/,'la lista de entregas se consulta primero');
assert.match(teacher,/try\{roster=await api\('getEstudiantesParaCierre'\)\}/,'el roster opcional tiene su propio try');
assert.match(teacher,/catch\(_\)\{\$\('status'\)/,'roster fallido presenta estado no fatal');
assert.ok(teacher.includes('Array.isArray(roster?.estudiantes)'),'roster malformed is tolerated');
assert.ok(!teacher.includes("Promise.all([api('qzProgressTeacherList'),api('getEstudiantesParaCierre')]"),'una falla de roster no borra entregas');
assert.ok(!teacher.includes('registrarNotaComponenteOficial'));
console.log('PASS F111 QZ32 client QA: 32/32 level/lesson routes, guarded submit/verification, teacher feedback, no grades/keys/PROD, no duplicate HTML');

if(process.env.F111_QZ_BROWSER==='1'){
 const {chromium}=await import('playwright');
 const {resolve}=await import('node:path');
 const {pathToFileURL}=await import('node:url');
 const {mkdirSync}=await import('node:fs');
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:850}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  for(const nivel of ['B1','B2','I1','I2']){
   for(const leccion of Object.keys(mapping).map(Number)){
    const query='?preview=1&nivel='+nivel+'&leccion='+leccion+'&grupo=QA_SYNTHETIC';
    const studentUrl=pathToFileURL(resolve('modulos/quiz_progress.html')).href+query;
    const teacherUrl=pathToFileURL(resolve('modulos/quiz_progress_docente.html')).href+query;
    await page.goto(studentUrl);
    await page.waitForFunction(()=>document.querySelector('#badge')?.textContent.includes('Vista previa QA'));
    assert.equal((await page.locator('#lessonTag').textContent()).includes('L'+leccion),true);
    assert.equal((await page.locator('#unitsTag').textContent()).includes(mapping[leccion].join('–')),true);
    assert.equal(await page.locator('#submitBtn').isDisabled(),true,'preview cannot submit');
    if(nivel==='B1'&&leccion===4){
     mkdirSync('qa-capturas',{recursive:true});
     await page.screenshot({path:'qa-capturas/QZ32_estudiante_B1_WQ01_1280.png',fullPage:true});
    }
    await page.goto(teacherUrl);
    await page.waitForFunction(()=>document.querySelector('#people')?.textContent.includes('Estudiante de muestra'));
    if(nivel==='I2'&&leccion===30){
     await page.setViewportSize({width:390,height:844});
     await page.screenshot({path:'qa-capturas/QZ32_docente_I2_WQ08_390.png',fullPage:true});
     await page.setViewportSize({width:1280,height:850});
    }
   }
  }
  // R10: navegador real, servidor simulado. Nunca se usan sesiones ni datos productivos.
  // El fallo del roster auxiliar no puede anular la bandeja de entregas.
  let rosterMode='error';
  await page.route('https://qz32-qa.test/modulos/quiz_progress_docente.html*',
    route=>route.fulfill({status:200,contentType:'text/html',body:teacher}));
  await page.route('https://qz32-qa.test/api*',route=>{
    const fn=new URL(route.request().url()).searchParams.get('fn');
    const result=fn==='qzProgressTeacherList'
      ?{ok:true,intentos:[{COD_ESTUDIANTE:'QA-001',ESTADO:'ENTREGADO',RESPUESTAS_JSON:'{"A":"respuesta sintética"}'}]}
      :fn==='getEstudiantesParaCierre'
        ?(rosterMode==='error'?{ok:false,error:'roster_qa_no_disponible'}:{ok:true,estudiantes:{formato:'inesperado'}})
        :{ok:false,error:'funcion_fuera_del_fixture'};
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(result)});
  });
  await page.addInitScript(()=>{
    window.F111_QZ_QA_API_URL='https://qz32-qa.test/api';
    sessionStorage.setItem('an_usuario',JSON.stringify({token:'SOLO_TOKEN_SINTETICO_R10'}));
  });
  const teacherQaUrl='https://qz32-qa.test/modulos/quiz_progress_docente.html?grupo=QA-GRUPO&nivel=B1&leccion=4';
  await page.goto(teacherQaUrl);
  await page.waitForFunction(()=>document.querySelector('#total')?.textContent==='1 entregados');
  assert.equal(await page.locator('#people .person').count(),1,'entrega visible aun cuando el roster falla');
  assert.match(await page.locator('#status').textContent(),/nombres de matrícula no disponibles/);
  rosterMode='malformed';
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#total')?.textContent==='1 entregados');
  assert.equal(await page.locator('#people .person').count(),1,'entrega visible con roster malformado');
  // R12: render del formulario REAL (sin preview=1) contra un API simulado.
  // 32 rutas distintas: comprueba metadata, PDF, guardado, entrega y bloqueo.
  // Nunca comunica con Google ni transmite credenciales productivas.
  const live=await browser.newPage({viewport:{width:1280,height:850}});
  const liveErrors=[];live.on('pageerror',e=>liveErrors.push(e.message));
  const base='https://qz32-r12.test',apiBase=base+'/api';
  const pdfFixture=Buffer.from('%PDF-1.4\n%F111-QA-SYNTHETIC-ONLY\n'+('synthetic x '.repeat(12))+'\n%%EOF').toString('base64');
  const stats={metadata:0,pdf:0,draft:0,submit:0,teacherList:0,teacherReview:0,teacherKey:0};
  let responseMode='ok';
  await live.route(base+'/modulos/quiz_progress.html*',
    route=>route.fulfill({status:200,contentType:'text/html',body:student}));
  await live.route(base+'/modulos/quiz_progress_docente.html*',
    route=>route.fulfill({status:200,contentType:'text/html',body:teacher}));
  await live.route(apiBase+'*',route=>{
    const u=new URL(route.request().url()),fn=u.searchParams.get('fn');
    const req=JSON.parse(route.request().postData()||'{}');
    assert.equal(req.token,'F111_R12_SYNTHETIC_TOKEN','no production session in browser QA');
    const idx=[4,8,13,16,21,24,28,30].indexOf(Number(req.leccion))+1;
    const quizId='IC5_'+req.nivel+'_WQ'+String(idx).padStart(2,'0');
    assert.equal(req.cod_grupo,'QA-F111-E3');
    let data;
    switch(fn){
      case 'qzProgressGet':
        stats.metadata++;
        data={ok:true,quiz_id:responseMode==='wrong-metadata'?'IC5_I2_WQ08':quizId,
          nivel:req.nivel,leccion:req.leccion,peso_oficial:0,
          fecha:'2026-10-18',disponible_hoy:true,
          secciones:['A','B','C','D','E'].map(id=>({id,tipo_respuesta:'TEXTO_GUIADO',items:[]}))};
        break;
      case 'qzProgressMyAttempt':
        data={ok:true,estado:'SIN_INICIAR',respuestas:{}};break;
      case 'qzProgressPaper':
        stats.pdf++;
        data={ok:true,quiz_id:responseMode==='wrong-pdf'?'IC5_I2_WQ08':quizId,
          mime:'application/pdf',peso_oficial:0,pdf_base64:pdfFixture};break;
      case 'qzProgressSaveDraft':
        stats.draft++;
        assert.ok(String(req.respuestas?.A||'').includes('Respuesta ficticia'),
          'student sent expected synthetic answer');
        data={ok:true,estado:'BORRADOR',peso_oficial:0};break;
      case 'qzProgressSubmit':
        stats.submit++;
        assert.ok(String(req.respuestas?.A||'').includes('Respuesta ficticia'));
        data={ok:true,estado:'ENTREGADO',peso_oficial:0};break;
      case 'qzProgressTeacherList':
        stats.teacherList++;
        data={ok:true,quiz_id:quizId,intentos:[{COD_ESTUDIANTE:'QA-001',
          ESTADO:'ENTREGADO',RESPUESTAS_JSON:JSON.stringify({A:'Respuesta ficticia '+quizId})}]};
        break;
      case 'getEstudiantesParaCierre':
        data={ok:true,estudiantes:[{codigo:'QA-001',nombre:'Estudiante sintético'}]};break;
      case 'qzProgressTeacherReview':
        stats.teacherReview++;
        assert.equal(req.cod_estudiante,'QA-001');
        assert.equal(req.resultado,'EN_PROCESO');
        data={ok:true,estado:'REVISADO',resultado:req.resultado,comentario_sugerido:req.comentario,peso_oficial:0};
        break;
      case 'qzProgressTeacherMaterials':
        stats.teacherKey++;
        data={ok:true,quiz_id:responseMode==='wrong-key'?'IC5_I2_WQ08':quizId,
          mime:'application/pdf',material:req.material,pdf_base64:pdfFixture,solo_docente:true};
        break;
      default:data={ok:false,error:'endpoint_no_fixture'};
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
  });
  await live.addInitScript(url=>{
    window.F111_QZ_QA_API_URL=url;
    sessionStorage.setItem('an_usuario',JSON.stringify({token:'F111_R12_SYNTHETIC_TOKEN'}));
  },apiBase);
  live.on('dialog',dialog=>dialog.accept());
  for(const nivel of ['B1','B2','I1','I2']){
    for(const leccion of [4,8,13,16,21,24,28,30]){
      const quizNo=[4,8,13,16,21,24,28,30].indexOf(leccion)+1;
      const expected='IC5_'+nivel+'_WQ'+String(quizNo).padStart(2,'0');
      const uri=base+'/modulos/quiz_progress.html?grupo=QA-F111-E3&nivel='+nivel+'&leccion='+leccion;
      await live.goto(uri);
      await live.waitForFunction(()=>document.querySelector('#pdfBox iframe')?.title==='Cuestionario original');
      assert.equal(await live.locator('#answers textarea').count(),5,
        'five editable sections rendered for '+expected);
      await live.locator('[data-section="A"]').fill('Respuesta ficticia '+expected);
      await live.locator('#saveBtn').click();
      await live.waitForFunction(()=>document.querySelector('#saveState')?.textContent.includes('Avance guardado'));
      await live.locator('#submitBtn').click();
      await live.waitForFunction(()=>document.querySelector('#badge')?.textContent==='Entregado');
      assert.equal(await live.locator('#submitBtn').isDisabled(),true,'no second submit');
      assert.equal(await live.locator('#answers textarea').first().isEditable(),false,
        'submitted quiz immutable');
    }
  }
  assert.deepEqual({metadata:stats.metadata,pdf:stats.pdf,draft:stats.draft,submit:stats.submit},
    {metadata:32,pdf:32,draft:32,submit:32},
    '32 complete browser workflows with synthetic QA API');
  // R12: even syntactically valid IDs must match the requested level and PC.
  const negative=base+'/modulos/quiz_progress.html?grupo=QA-F111-E3&nivel=B1&leccion=4';
  responseMode='wrong-metadata';
  await live.goto(negative);
  await live.waitForFunction(()=>document.querySelector('#errorBox')?.textContent.includes('no coincide'));
  assert.equal(await live.locator('#pdfBox iframe').count(),0,'wrong metadata blocks PDF');
  responseMode='wrong-pdf';
  await live.goto(negative);
  await live.waitForFunction(()=>document.querySelector('#errorBox')?.textContent.includes('no corresponde'));
  assert.equal(await live.locator('#pdfBox iframe').count(),0,'wrong PDF never displayed');
  // R12: 32 revisiones docentes completas con la misma interfaz, sin notas oficiales.
  responseMode='ok';
  for(const nivel of ['B1','B2','I1','I2'])for(const leccion of [4,8,13,16,21,24,28,30]){
    const uri=base+'/modulos/quiz_progress_docente.html?grupo=QA-F111-E3&nivel='+nivel+'&leccion='+leccion;
    await live.goto(uri);
    await live.waitForFunction(()=>document.querySelector('#total')?.textContent==='1 entregados');
    await live.locator('#outcome').selectOption('EN_PROCESO');
    await live.locator('#comments').fill('Diagnóstico ficticio; lectura y escucha pendientes.');
    await live.locator('#save').click();
    await live.waitForFunction(()=>document.querySelector('#status')?.textContent.includes('Revisión guardada'));
    assert.equal(await live.locator('#save').isDisabled(),true);
  }
  // Test key isolation in the same real teacher renderer (never a Cambridge PDF).
  const teacherUri=base+'/modulos/quiz_progress_docente.html?grupo=QA-F111-E3&nivel=B1&leccion=4';
  await live.goto(teacherUri);
  await live.waitForFunction(()=>document.querySelector('#total')?.textContent==='1 entregados');
  await live.locator('#key').click();
  await live.waitForFunction(()=>document.querySelector('#modal')?.classList.contains('visible'));
  assert.equal(await live.locator('#frame').count(),1,'synthetic teacher PDF can be displayed');
  await live.locator('#close').click();
  responseMode='wrong-key';
  await live.locator('#key').click();
  await live.waitForFunction(()=>document.querySelector('#error')?.textContent.includes('no corresponde'));
  assert.equal(await live.locator('#modal').getAttribute('class'),'pdf','mismatched key never displayed');
  assert.deepEqual({teacherList:stats.teacherList,teacherReview:stats.teacherReview,teacherKey:stats.teacherKey},
    {teacherList:33,teacherReview:32,teacherKey:2},
    '32 teacher reviews and two private-document checks');

  // B1 PC01: real text-based UI in the public static artifact; no iframe/PDF or server write.
  await live.goto(base+'/modulos/qz_b1_pc01_digital.html?preview=1');
  await live.waitForFunction(()=>document.querySelector('#tabs')?.children.length===6);
  assert.equal(await live.locator('#page .question').count(),4,'A has 4 authentic listening questions');
  await live.locator('input[name="A1"]').first().check();
  await live.locator('#tabs button').nth(2).click();
  assert.equal(await live.locator('#page .question input[type="text"]').count(),4,'C has 4 fill-in fields');
  await live.locator('#page input[type="text"]').first().fill('Are');
  await live.locator('#tabs button').nth(5).click();
  assert.equal(await live.locator('#page .question').count(),4,'F has 4 preposition questions');
  assert.equal(await live.locator('iframe').count(),0,'digital quiz includes no PDF viewer');
  await live.screenshot({path:'qa-capturas/QZ32_B1_PC01_DIGITAL_PREVIEW_1280.png',fullPage:true});
  await live.locator('#submit').click();
  assert.ok((await live.locator('#note').textContent()).includes('Sin envío real'),'submission is visibly preview-only');

  assert.deepEqual(liveErrors,[],'no browser uncaught errors across student and teacher synthetic flows');
  await live.close();
  console.log('F111 QZ32 R12 ACTIVE_UI_SYNTHETIC_PASS: 32/32 metadata+PDF+save+submit+lock and two cross-quiz rejection cases');
    assert.deepEqual(errors,[],'No frontend uncaught errors across 64 QA route previews y R10 roster simulado');
  console.log('F111_QZ32_BROWSER_PASS: 32/32 estudiante + 32/32 docente, escritorio/móvil; solo fixture vista previa sin red');
 }finally{await browser.close();}
}
