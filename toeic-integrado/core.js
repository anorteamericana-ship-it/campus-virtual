/* TOEIC 4-Skills integrated formative practice. Not ETS adaptive scoring. */
(function(root){
'use strict';
const PLAN=Object.freeze({
 listening:[{1:3,2:4,3:9,4:9},{2:5,3:9,4:6}],
 reading:[{5:5,6:4,7:16},{5:7,6:4,7:9}]
});
const MINUTES={listening:[14,11],reading:[23,14],speaking:20,writing:60};
function assert(ok,msg){if(!ok)throw new Error(msg)}
function rank(x){const n=Number(x.difficulty);return Number.isFinite(n)?n:2}
function chooseGroupSets(groups,target){
 const answer=[];
 function recurse(at,left){
  if(!left)return true;
  if(at>=groups.length||left<0)return false;
  for(let i=at;i<groups.length;i++){
   const g=groups[i];if(g.items.length>left)continue;
   answer.push(g);
   if(recurse(i+1,left-g.items.length))return true;
   answer.pop();
  }
  return false;
 }
 assert(recurse(0,target),'No complete source groups for quota '+target);
 return answer;
}
function pick(bank,skill,unit,usedIds,branch){
 assert(PLAN[skill]&&[1,2].includes(unit),'Invalid skill or stage');
 const selected=[],used=new Set(usedIds||[]);
 const quotas=PLAN[skill][unit-1];
 for(const [partString,qty] of Object.entries(quotas)){
  const part=Number(partString), pool=bank.items.filter(x=>x.part===part&&!used.has(x.item_id));
  const preferred=branch==='upper'?-1:1;
  if([3,4,6,7].includes(part)){
   const indexed=new Map(pool.map(x=>[x.item_id,x]));
   const groups=bank.groups.filter(g=>g.part===part)
    .map(g=>({g,items:g.item_ids.map(id=>indexed.get(id)).filter(Boolean)}))
    .filter(entry=>entry.items.length===entry.g.item_ids.length)
    .sort((a,b)=>preferred*(avg(a.items)-avg(b.items))||a.g.passage_group_id.localeCompare(b.g.passage_group_id));
   const chosen=chooseGroupSets(groups,qty);
   for(const group of chosen)for(const item of group.items){assert(!used.has(item.item_id),'Duplicate source item');used.add(item.item_id);selected.push(item)}
  }else{
   pool.sort((a,b)=>preferred*(rank(a)-rank(b))||a.item_id.localeCompare(b.item_id));
   assert(pool.length>=qty,'Not enough items for part '+part);
   for(const item of pool.slice(0,qty)){used.add(item.item_id);selected.push(item)}
  }
 }
 assert(selected.length===(unit===1?25:20),'Wrong stage length');
 return selected;
}
function avg(xs){return xs.reduce((s,x)=>s+rank(x),0)/xs.length}
function route(stage1Answers,questions){const answered=questions.filter(q=>stage1Answers[q.item_id]!=null);const correct=answered.filter(q=>stage1Answers[q.item_id]===q.correct).length;
 return {branch: correct/questions.length>=.68?'upper':'foundation',correct,total:questions.length,answered:answered.length,threshold:0.68};
}
function validate(units,bankA,bankB,skill){
 const all=units.flat();assert(all.length===45,'Section must contain 45 questions');
 const ids=new Set(all.map(x=>x.item_id));assert(ids.size===45,'Repeated question');
 for(let i=0;i<2;i++){const selected=units[i],counts=PLAN[skill][i];
  for(const [p,n] of Object.entries(counts))assert(selected.filter(x=>x.part===Number(p)).length===n,'Part quota mismatch '+p);
  const bankGroups=[...bankA.groups,...bankB.groups];
  for(const group of bankGroups){if(![3,4,6,7].includes(group.part))continue;
   const have=selected.filter(x=>group.item_ids.includes(x.item_id)).length;
   assert(have===0||have===group.item_ids.length,'Split group '+group.passage_group_id);
  }
 }
 return true;
}
root.TOEIC4Core=Object.freeze({PLAN,MINUTES,pick,route,validate});
})(typeof window!=='undefined'?window:globalThis);
