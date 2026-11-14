// F111 D5-R12: 8 quizzes B1, mock/snapshot only; no requests to production.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const schemas=JSON.parse(fs.readFileSync(new URL('./fixtures/qz_b1_sections_e1.json',import.meta.url),'utf8'));
const html=fs.readFileSync(new URL('../modulos/quiz_progress.html',import.meta.url),'utf8');
assert.equal(Object.keys(schemas).length,8);
const expected=[25,25,26,23,25,25,25,25];
let count=0,total=0;
for(let i=1;i<=8;i++){
 const id='IC5_B1_WQ'+String(i).padStart(2,'0'),sections=schemas[id];
 assert.ok(Array.isArray(sections)&&sections.length>=5,id);
 const keys=[];
 for(const sec of sections){
  assert.match(sec.id,/^[A-Z]$/);
  const items=sec.tipo_respuesta==='ITEMS_NUMERADOS'&&sec.items.length>=2?sec.items:[null];
  for(const item of items){
   const k=sec.id+(item==null?'':String(item));
   assert.match(k,/^[A-Z](?:[0-9]{0,2}|[0-9]{1,2}[ab])$/,id+'/'+k);
   keys.push(k);
   if(item!==null&&sec.etiquetas_items?.[String(item)])
    assert.ok(sec.etiquetas_items[String(item)].length>5);
  }
 }
 assert.equal(new Set(keys).size,keys.length);
 assert.equal(keys.length,expected[i-1],id);
 count++;total+=keys.length;
}
assert.equal(count,8);assert.equal(total,199);
for(const token of [
 "if(!/^[A-Z](?:[0-9]{0,2}|[0-9]{1,2}[ab])$/.test(key))continue;",
 "section.etiquetas_items&&section.etiquetas_items[String(num)]",
 "qzProgressSaveDraft","qzProgressSubmit","qzProgressMyAttempt",
 "audioRequired&&!audioReady","teacherPreview","quiz_id!==expectedId","peso_oficial!==0"
])assert.ok(html.includes(token),'Missing frontend contract '+token);
assert.ok(!html.includes('F111 QA</title>'),'Teacher/student title must not expose QA internals');
assert.ok(!html.includes('Vista QA todavía no habilitada'));
assert.ok(!/\b(?:Cambridge key|answer key|guion privado)\b/i.test(html));
console.log('F111_B1_UI_STRUCTURAL_PASS 8/8; 199 item slots; suffixes E1a and D4b supported; no production writes');
