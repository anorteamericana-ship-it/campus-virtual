#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
function read(relative){return fs.readFileSync(path.join(root,relative),'utf8');}
function write(relative,content){fs.writeFileSync(path.join(root,relative),content,'utf8');}
function replaceExact(relative,oldText,newText,label){
  const source=read(relative);
  if(source.includes(newText)){console.log(`SKIP ${label}: ya aplicado`);return false;}
  assert.ok(source.includes(oldText),`No se encontró ${label} en ${relative}`);
  write(relative,source.replace(oldText,newText));
  console.log(`PATCH ${label}: ${relative}`);
  return true;
}
let changed=false;

const preview='src/english_lab_games/memory_match_authoritative_sync_preview_cs21a192.html';
changed=replaceExact(preview,
`        if(!response.ok||!data||data.ok===false)throw new Error(data&&data.mensaje||data&&data.error||\`HTTP \${response.status}\`);\n        return data;`,
`        if(!response.ok||!data)throw new Error(data&&data.mensaje||data&&data.error||\`HTTP \${response.status}\`);\n        // CS21A202 fixture: el mismo contrato de reconciliación que src/english_lab_live.jsx, sin parche runtime del test.\n        if(data.ok===false&&!(data.room_package&&typeof data.room_package==='object'))throw new Error(data.mensaje||data.error||\`HTTP \${response.status}\`);\n        return data;`,'preview domain reconciliation fixture')||changed;

const test='scripts/test_memory_match_conflict_reconciliation_browser_cs21a196.mjs';
const oldBlock=`  // El preview histórico CS192 contiene su propio postLive inline y no carga
  // src/english_lab_live.jsx. Para este test interceptamos sólo esa página y
  // sustituimos el contrato de transporte por el mismo de CS21A196: un
  // ok:false con room_package es un resultado de dominio reconciliable, no un
  // error de red. El candidato distribuido real sigue usando english_lab_live.jsx.
  const context=await browser.newContext({viewport:{width:520,height:850}});
  client={context,page:await context.newPage()};
  await context.route('**/__cs21a192_live?*',routeHandler);
  await context.route('**/memory_match_authoritative_sync_preview_cs21a192.html?*',async route=>{
    const response=await route.fetch();
    const original=await response.text();
    const oldTransport="if(!response.ok||!data||data.ok===false)throw new Error(data&&data.mensaje||data&&data.error||\`HTTP \${response.status}\`);";
    const newTransport="if(!response.ok||!data)throw new Error(data&&data.mensaje||data&&data.error||\`HTTP \${response.status}\`);if(data.ok===false&&!(data.room_package&&typeof data.room_package==='object'))throw new Error(data.mensaje||data.error||\`HTTP \${response.status}\`);";
    assert.ok(original.includes(oldTransport),'El preview histórico cambió y ya no coincide con el transporte CS192 esperado.');
    await route.fulfill({response,body:original.replace(oldTransport,newTransport),headers:{...response.headers(),'content-type':'text/html; charset=utf-8'}});
  });`;
const newBlock=`  // CS21A202: NO se modifica HTML ni código del producto en tiempo de ejecución.
  // El fixture declara explícitamente el contrato de reconciliación y el gate
  // source-of-truth verifica por separado que src/english_lab_live.jsx tenga
  // exactamente la semántica autoritativa recuperada.
  const context=await browser.newContext({viewport:{width:520,height:850}});
  client={context,page:await context.newPage()};
  await context.route('**/__cs21a192_live?*',routeHandler);`;
changed=replaceExact(test,oldBlock,newBlock,'remove runtime source replacement')||changed;
changed=replaceExact(test,"previewTransport:'CS21A196_DOMAIN_RECONCILIATION',","previewTransport:'CS21A202_SOURCE_FIXTURE_NO_RUNTIME_PATCH',",'evidence transport label')||changed;

const previewSource=read(preview);
const testSource=read(test);
assert.match(previewSource,/CS21A202 fixture: el mismo contrato de reconciliación/);
assert.doesNotMatch(testSource,/original\.replace\(oldTransport,newTransport\)/);
assert.doesNotMatch(testSource,/oldTransport=/);
assert.doesNotMatch(testSource,/newTransport=/);
console.log(JSON.stringify({ok:true,version:'CS21A202-TEST-RECOVERY-1',changed,runtime_code_replacement:false},null,2));
