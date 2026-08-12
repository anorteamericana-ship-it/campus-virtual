#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base=(process.env.QA_BASE_URL||'http://127.0.0.1:4210').replace(/\/$/,'');
const out=path.resolve('qa-output/cs21a210-quiz-time');
fs.mkdirSync(out,{recursive:true});

function commandEscape(value){
  return String(value||'').replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A');
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

const launchOptions={headless:true};
if(process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser=await chromium.launch(launchOptions);
let student=null;
const qa={answerCalls:0,stateCalls:0,payloads:[],acceptedOption:'',requests:[]};

function buildResponse(){
  const now=Date.now();
  const answered=!!qa.acceptedOption;
  return {
    ok:true,
    quiz_time:true,
    answer_count:answered?1:0,
    room:{room_code:'QT-210',status:'LIVE'},
    player:{cod_estudiante:'QA-STU-007',player_id:'QA-STU-007',nombre:'Naty'},
    can_answer:!answered,
    my_answer:answered?{
      question_id:'QT-QA-210-1',
      option_id:qa.acceptedOption,
      action_id:qa.payloads[0]?.action_id||''
    }:null,
    leaderboard:[{rank:1,cod_estudiante:'QA-STU-007',nombre:'Naty',points:0,correct:0}],
    quiz_state:{
      version:'CS21A198',
      room_code:'QT-210',
      phase:'OPEN',
      state_revision:210,
      question_index:1,
      question_total:10,
      question:{
        question_id:'QT-QA-210-1',
        source_item_id:'GRAM-B1-U01-QA210',
        level_id:'B1',unit_id:'B1-U01',area_id:'GRAM',template_id:'GRAM_01',item_type:'MCQ',
        prompt_es:'Elegí una respuesta para probar el bloqueo de doble envío.',
        stem:'Complete: “___ name is Ana.”',
        options:[{id:'A',label:'My'},{id:'B',label:'Your'},{id:'C',label:'His'},{id:'D',label:'Her'}],
        difficulty_1_10:1,position:1,total:10
      },
      reveal:{visible:false},
      turn_state:{
        participation_policy:'EVERYONE',turn_number:1,
        turn_started_at:new Date(now-2000).toISOString(),
        turn_ends_at:new Date(now+60000).toISOString()
      },
      answered_player_ids:answered?['QA-STU-007']:[]
    },
    curriculum:{unit_name:"What's your name?",unit_objective_es:'Presentarse y compartir información personal básica.'}
  };
}

try{
  student=await browser.newPage({viewport:{width:390,height:844}});
  await student.route('**/__cs21a210_quiz_mock__**',async route=>{
    const request=route.request();
    const url=new URL(request.url());
    const fn=url.searchParams.get('fn')||'';
    let payload={};
    try{payload=JSON.parse(request.postData()||'{}');}catch(_){payload={};}
    qa.requests.push({fn,payload});

    if(fn==='englishLabQuizTimeGetPlayerState'){
      qa.stateCalls+=1;
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(buildResponse())});
      return;
    }
    if(fn==='englishLabQuizTimeAnswer'){
      qa.answerCalls+=1;
      qa.payloads.push(payload);
      const callNumber=qa.answerCalls;
      await sleep(180);
      if(callNumber===1) qa.acceptedOption=payload.option_id||'';
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(buildResponse())});
      return;
    }
    await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({ok:false,error:'MOCK_FN_NO_SOPORTADA',fn})});
  });

  const response=await student.goto(`${base}/src/english_lab_games/quiz_time_preview_cs21a210.html`,{waitUntil:'domcontentloaded'});
  assert.ok(response&&response.ok(),'preview Quiz Time estudiante cargó');
  await student.waitForSelector('.qt198-option');
  const options=student.locator('.qt198-option');
  assert.equal(await options.count(),4,'Quiz Time muestra cuatro opciones');
  assert.equal(await options.nth(0).isEnabled(),true,'opción A está habilitada');
  assert.equal(await options.nth(1).isEnabled(),true,'opción B está habilitada');

  await student.evaluate(()=>{
    const buttons=[...document.querySelectorAll('.qt198-option')];
    if(buttons.length<2) throw new Error('faltan opciones Quiz Time');
    buttons[0].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    buttons[1].dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  });

  await sleep(450);
  fs.writeFileSync(path.join(out,'network_observation.json'),JSON.stringify(qa,null,2)+'\n');

  assert.equal(qa.answerCalls,1,`doble clic síncrono debe producir un solo englishLabQuizTimeAnswer; observado=${qa.answerCalls}`);
  assert.equal(qa.payloads.length,1,'solo existe un payload ANSWER');
  const payload=qa.payloads[0];
  assert.equal(payload.action,'ANSWER','payload conserva action ANSWER');
  assert.equal(payload.room_code,'QT-210','payload conserva sala');
  assert.equal(payload.player_id,'QA-STU-007','payload conserva estudiante');
  assert.equal(payload.question_id,'QT-QA-210-1','payload conserva question_id');
  assert.equal(payload.option_id,'A','primer toque gana; B no genera segundo submit');
  assert.equal(payload.expected_state_revision,210,'payload conserva revisión autoritativa');
  assert.match(String(payload.action_id||''),/^QT198-QT-QA-210-1-QA-STU-007-/,'action_id mantiene contrato CS198');

  await student.waitForFunction(()=>document.body.textContent.includes('Respuesta enviada'));
  assert.equal(await options.nth(0).isDisabled(),true,'respuesta queda bloqueada tras aceptar A');
  assert.equal(await options.nth(1).isDisabled(),true,'resto de opciones queda bloqueado');

  const overflow=await student.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(overflow.scroll<=overflow.client+2,`sin overflow horizontal a 390 px: ${JSON.stringify(overflow)}`);
  await student.screenshot({path:path.join(out,'student-390.png'),fullPage:true});

  const result={
    ok:true,
    version:'CS21A210',
    browser:'chromium',
    viewport:'390x844',
    synchronous_double_click_single_submit:true,
    first_touch_wins:true,
    answer_contract_preserved:true,
    authoritative_answer_rendered:true,
    no_horizontal_overflow_390:true,
    answer_calls:qa.answerCalls,
    state_calls:qa.stateCalls
  };
  fs.writeFileSync(path.join(out,'browser_result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
}catch(error){
  const detail=String(error&&error.stack||error);
  fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({ok:false,version:'CS21A210',error:detail,observation:qa},null,2)+'\n');
  if(student){try{await student.screenshot({path:path.join(out,'failure-student.png'),fullPage:true});}catch(_){}}
  console.error(`::error title=CS21A210 Quiz Time browser::${commandEscape(detail)}`);
  throw error;
}finally{
  await browser.close();
}
