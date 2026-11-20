import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const p=await b.newPage();
const consoleErrors=[];p.on('pageerror',e=>consoleErrors.push(e.message));
try{
 await p.goto('http://127.0.0.1:8765/diagnostico-ingles/',{waitUntil:'load',timeout:25000});
 const result=await p.evaluate(async()=>{
  const uuid=()=>crypto.randomUUID();
  const p1=EPLMock.loginPublicGuest(uuid(),'Rebeca');
  const p2=EPLMock.loginPublicGuest(uuid(),'Rebeca');
  if(!p1.ok||!p2.ok||p1.candidate_id===p2.candidate_id) throw new Error('duplicate profile identity');
  const direct=(a,data)=>EPLMock.core.handle(p1.user,a,data);
  const finish=(type,params)=>{
    const start=direct('start',{tipo:type,...params});if(!start.ok)throw new Error('START '+JSON.stringify(start).slice(0,280));
    const att=start.attempt;
    if(!att||!att.units?.length)throw new Error('missing units');
    let n=0;
    for(const u of att.units){
      for(const it of u.items){
        let r=direct('answer',{attempt_id:att.attempt_id,item_id:it.item_id,option:it.options[0].id});
        if(!r.ok)throw new Error('ANSWER '+it.item_id+' '+JSON.stringify(r).slice(0,120));
        n++;
      }
      const rev=direct('reveal',{attempt_id:att.attempt_id,unit_id:u.unit_id});
      if(!rev.ok)throw new Error('REVEAL '+JSON.stringify(rev).slice(0,190));
    }
    const end=direct('finish',{attempt_id:att.attempt_id});
    if(!end.ok)throw new Error('FINISH '+JSON.stringify(end).slice(0,190));
    return n;
  };
  const nDiag=finish('diagnostic',{});
  const all0=direct('publicCoverage',{});
  if(nDiag!==25)throw new Error('DIAG='+nDiag);
  const original=all0.seen_total;
  const loops=[];let total=0;
  for(let i=0;i<80;i++){
    const r=direct('publicCoverage',{});
    if(!r.ok)throw new Error('COVERAGE');
    if(r.seen_total===400)break;
    const next=r.rows.find(x=>x.seen<x.total);
    if(!next)throw new Error('NO NEXT at '+r.seen_total);
    const n=finish('practice',{form:next.form,part:next.part,size:15,only_unseen:true});
    if(n===0)throw new Error('NO PROGRESS');
    const after=direct('publicCoverage',{});
    if(after.seen_total<=r.seen_total) throw new Error('STUCK '+JSON.stringify(next)+' '+r.seen_total+' -> '+after.seen_total);
    total+=n;loops.push({section:next.form+next.part,questions:n,seen:after.seen_total});
  }
  const coverage=direct('publicCoverage',{});
  const untouched=EPLMock.core.handle(p2.user,'publicCoverage',{});
  return {diagnostic:nDiag,initialCoverage:original,loops:loops.length,lastLoops:loops.slice(-5),coverage:coverage.seen_total,parts:coverage.rows.length,totalAvailable:coverage.total,otherSameNameProfile:untouched.seen_total,answeredInExtraBlocks:total};
 });
 console.log('COVERAGE_RESULT='+JSON.stringify(result));
 assert.equal(result.diagnostic,25);assert.equal(result.totalAvailable,400);assert.equal(result.coverage,400);assert.equal(result.otherSameNameProfile,0);assert.equal(result.parts,14);
 console.log('FULL_400_QA_PASS');if(consoleErrors.length){console.error('PAGEERRORS '+consoleErrors.slice(0,5).join(' | '));process.exitCode=1;}
}catch(e){console.error('FULL_400_QA_FAIL '+String(e.stack).slice(0,1900));process.exitCode=1;}
finally{await b.close();}
