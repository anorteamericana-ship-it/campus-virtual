/* Repeatable adaptive bank QA, no student data or backend. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..','prototipos','exam_prep_lab','forms'),ctx={window:{}};
for(const name of ['form_a.js','form_b.js'])vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),ctx);
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'core.js'),'utf8'),ctx);
const {A,B}=ctx.window.EPL_FORMS,CORE=ctx.window.TOEIC4Core;let passes=0;
function check(label,fn){fn();passes++;console.log('PASS '+passes+' '+label)}
check('Source original bank remains 400 items',()=>{assert.equal(A.items.length,200);assert.equal(B.items.length,200)});
check('Speaking and Writing not duplicated',()=>{assert.ok(fs.existsSync(path.join(__dirname,'..','toeic-4-skills','tasks.js')))});
for(const skill of ['listening','reading']){
 check(skill+' first stage 25 complete grouped questions',()=>{
  const first=CORE.pick(A,skill,1,[],'foundation');
  assert.equal(first.length,25);CORE.validate([first,CORE.pick(B,skill,2,first.map(q=>q.item_id),'upper')],A,B,skill)
 });
 for(const branch of ['foundation','upper']){
  check(skill+' '+branch+' adaptive stage 25+20, unique/group-safe',()=>{
   const stage1=CORE.pick(A,skill,1,[],'foundation'),used=stage1.map(x=>x.item_id);
   const stage2=CORE.pick(branch==='upper'?B:A,skill,2,used,branch);
   assert.equal(stage2.length,20);assert.equal(CORE.validate([stage1,stage2],A,B,skill),true);
   assert.equal(new Set([...stage1,...stage2].map(x=>x.item_id)).size,45);
  });
 }
}
check('Upper/foundation routing responds to correctness',()=>{
 const first=CORE.pick(A,'reading',1,[],'foundation');
 assert.equal(CORE.route({},first).branch,'foundation');
 const all=Object.fromEntries(first.map(x=>[x.item_id,x.correct]));
 assert.equal(CORE.route(all,first).branch,'upper');
});
console.log('TOEIC_INTEGRATED_CORE_QA='+passes+'/'+passes+' PASS');
