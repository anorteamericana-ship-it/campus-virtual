#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('src/english_lab_ux_cs21a181.js','utf8');
const calls=[];

function node(tag){
  return {
    tagName:String(tag||'').toUpperCase(),
    id:'',
    dataset:{},
    textContent:'',
    innerHTML:'',
    childNodes:[],
    style:{},
    setAttribute(){},
    addEventListener(){},
    querySelector(){return {textContent:''};},
    querySelectorAll(){return [];},
  };
}
const byId=new Map();
const document={
  readyState:'complete',
  documentElement:{},
  createElement:node,
  getElementById(id){return byId.get(id)||null;},
  querySelectorAll(){return [];},
  addEventListener(){},
  head:{appendChild(el){if(el&&el.id)byId.set(el.id,el);}},
  body:{appendChild(el){if(el&&el.id)byId.set(el.id,el);}},
};

function responseFor(body){
  const fn=String(body&&body.fn||'');
  if(fn==='englishLabMemoryMatchGetRoomControl'){
    return body.__fixture_response || {ok:true,memory_match:true,room:{room_code:'LAB-203',game_code:'MEMORY_MATCH',status:'CREATED'}};
  }
  if(fn==='englishLabMemoryMatchStartRoom'){
    return {ok:true,memory_match:true,room:{room_code:body.room_id||'LAB-203',game_code:'MEMORY_MATCH',status:'LIVE'},room_package:{room:{room_code:body.room_id||'LAB-203',game_id:'MEMORY_MATCH'}}};
  }
  return {ok:true};
}

async function baseFetch(input,init={}){
  const body=typeof init.body==='string'?JSON.parse(init.body):{};
  calls.push({input:String(input),body});
  return new Response(JSON.stringify(responseFor(body)),{status:200,headers:{'Content-Type':'application/json'}});
}

const context={
  console,
  document,
  location:{href:'http://qa.local/campus.html'},
  fetch:baseFetch,
  Response,
  Request,
  URL,
  setTimeout,
  clearTimeout,
};
context.window=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:'english_lab_ux_cs21a181.js'});

async function wrapped(body){
  const res=await context.fetch('http://qa.local/__live?fn='+encodeURIComponent(body.fn),{
    method:'POST',
    body:JSON.stringify(body),
  });
  return res.json();
}

// 1) Sala curricular normal: CS21A181 no puede inventar custom_pairs ni bloquear Start.
let before=calls.length;
let out=await wrapped({fn:'englishLabMemoryMatchStartRoom',room_id:'LAB-CURRICULAR'});
assert.equal(out.ok,true,'Start curricular sin suggested_pairs fue bloqueado.');
assert.equal(calls.length,before+1,'Start curricular no llegó al fetch real.');
assert.equal(Object.prototype.hasOwnProperty.call(calls.at(-1).body,'custom_pairs'),false,'Start curricular inventó custom_pairs.');

// 2) Editor activo pero incompleto: debe seguir bloqueando localmente.
const incomplete=Array.from({length:3},(_,i)=>({left:'word'+(i+1),right:'significado'+(i+1)}));
await wrapped({
  fn:'englishLabMemoryMatchGetRoomControl',
  __fixture_response:{ok:true,memory_match:true,pair_count:6,suggested_pairs:incomplete,room:{room_code:'LAB-CUSTOM-BAD',game_code:'MEMORY_MATCH',status:'CREATED'}},
});
before=calls.length;
out=await wrapped({fn:'englishLabMemoryMatchStartRoom',room_id:'LAB-CUSTOM-BAD'});
assert.equal(out.ok,false,'Parejas personalizadas incompletas no fueron bloqueadas.');
assert.equal(out.error,'parejas_personalizadas_invalidas');
assert.match(out.mensaje,/exactamente 6 parejas/i);
assert.equal(calls.length,before,'Start personalizado inválido llegó indebidamente a red.');

// 3) Editor válido: conserva la función CS21A181 y adjunta exactamente las parejas editables.
const complete=Array.from({length:6},(_,i)=>({left:'term'+(i+1),right:'meaning'+(i+1)}));
await wrapped({
  fn:'englishLabMemoryMatchGetRoomControl',
  __fixture_response:{ok:true,memory_match:true,pair_count:6,suggested_pairs:complete,room:{room_code:'LAB-CUSTOM-OK',game_code:'MEMORY_MATCH',status:'CREATED'}},
});
before=calls.length;
out=await wrapped({fn:'englishLabMemoryMatchStartRoom',room_id:'LAB-CUSTOM-OK'});
assert.equal(out.ok,true,'Parejas personalizadas válidas fueron bloqueadas.');
assert.equal(calls.length,before+1,'Start personalizado válido no llegó a red.');
assert.equal(Array.isArray(calls.at(-1).body.custom_pairs),true);
assert.equal(calls.at(-1).body.custom_pairs.length,6);

console.log(JSON.stringify({
  ok:true,
  version:'CS21A203-CUSTOM-PAIR-START-GUARD-1',
  curricular_start_passthrough:true,
  curricular_start_invents_custom_pairs:false,
  incomplete_custom_pairs_blocked:true,
  valid_custom_pairs_preserved:true,
},null,2));
