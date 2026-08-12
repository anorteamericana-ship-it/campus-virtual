#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.QA_BASE_URL||'http://127.0.0.1:4209').replace(/\/$/,'');
const out=path.resolve('qa-output/cs21a209-sentence-order');
fs.mkdirSync(out,{recursive:true});

function commandEscape(value){
  return String(value||'').replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
}

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
let student=null;
let teacher=null;

try{
  student=await browser.newPage({viewport:{width:390,height:844}});
  let response=await student.goto(`${base}/src/english_lab_games/sentence_order_preview_cs21a209.html?role=student`,{waitUntil:'networkidle'});
  assert.ok(response&&response.ok(),'preview estudiante cargó');
  await student.locator('#qaJoin').click();
  await student.waitForSelector('[aria-label="Palabras disponibles"] .elso183-token');

  const submit=student.getByRole('button',{name:'Enviar respuesta'});
  assert.equal(await submit.isDisabled(),true,'respuesta incompleta no puede enviarse');

  const pool=student.locator('[aria-label="Palabras disponibles"]');
  await pool.getByRole('button',{name:'I',exact:true}).click();
  await pool.getByRole('button',{name:'am',exact:true}).click();
  await pool.getByRole('button',{name:'ready',exact:true}).click();
  assert.equal(await submit.isEnabled(),true,'respuesta completa habilita submit');

  const built=await student.locator('[aria-label="Oración construida"] .elso183-token').allTextContents();
  assert.deepEqual(built,['I','am','ready'],'tokens se ordenan por interacción real');

  await student.evaluate(()=>{
    const button=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()==='Enviar respuesta');
    if(!button) throw new Error('submit no encontrado');
    button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    button.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  });

  await student.waitForFunction(()=>document.body.textContent.includes('¡Correcto!'));
  const qa=await student.evaluate(()=>window.__sentenceQa);
  assert.equal(qa.submitCalls,1,'doble clic síncrono produce un solo submit');
  assert.deepEqual(qa.lastSubmit.ordered_token_ids,['tok-1','tok-2','tok-3'],'submit usa token_id en orden, no texto');
  assert.match(await student.locator('body').innerText(),/¡Correcto! Sumaste 100 puntos\./,'estado autoritativo posterior se renderiza');

  const overflow=await student.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(overflow.scroll<=overflow.client+2,`sin overflow horizontal a 390 px: ${JSON.stringify(overflow)}`);
  await student.screenshot({path:path.join(out,'student-390.png'),fullPage:true});

  teacher=await browser.newPage({viewport:{width:1366,height:900}});
  response=await teacher.goto(`${base}/src/english_lab_games/sentence_order_preview_cs21a209.html?role=teacher`,{waitUntil:'networkidle'});
  assert.ok(response&&response.ok(),'preview docente cargó');
  await teacher.waitForSelector('.elso183-shell');
  assert.equal(await teacher.locator('.elso183-shell').count(),1,'consola Sentence Order docente se monta una sola vez');
  assert.equal(await teacher.locator('[data-base-teacher="true"]').count(),1,'vista Live base docente permanece integrada');
  await teacher.screenshot({path:path.join(out,'teacher-desktop.png'),fullPage:true});

  const result={
    ok:true,
    version:'CS21A209',
    browser:'chromium',
    student_viewport:'390x844',
    teacher_viewport:'1366x900',
    incomplete_submit_blocked:true,
    token_id_order:true,
    synchronous_double_click_single_submit:true,
    authoritative_result_rendered:true,
    no_horizontal_overflow_390:true,
    teacher_console_single_mount:true
  };
  fs.writeFileSync(path.join(out,'browser_result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}catch(error){
  const detail=String(error&&error.stack||error);
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({ok:false,version:'CS21A209',error:detail},null,2)+'\n');
  if(student){try{await student.screenshot({path:path.join(out,'failure-student.png'),fullPage:true});}catch(_){}}
  if(teacher){try{await teacher.screenshot({path:path.join(out,'failure-teacher.png'),fullPage:true});}catch(_){}}
  console.error(`::error title=CS21A209 Sentence Order browser::${commandEscape(detail)}`);
  throw error;
}finally{
  await browser.close();
}
