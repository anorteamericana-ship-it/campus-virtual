// QA reproducible de integridad editorial: NO sustituye revisión docente ni escucha humana.
// Fuente única: forms/form_a.js y forms/form_b.js generados desde content/*.src.js.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const context = vm.createContext({ window: {} });
for (const f of ['a','b']) vm.runInContext(fs.readFileSync(path.join(root,'forms','form_'+f+'.js'),'utf8'),context);
vm.runInContext(fs.readFileSync(path.join(root,'audio_manifest.js'),'utf8'),context);
const banks = context.window.EPL_FORMS;
const clips = context.window.EPL_AUDIO.clips;
const expected = [0,6,25,39,30,30,16,54];
const errs = [], facts = [], seen = new Set(), fingerprints = new Map(), referenced = new Set();
const fail = (id,why) => errs.push({ id,why });
const norm = s => String(s??'').normalize('NFD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
let humanReviewed=0, images=0, groupCount=0, checks=0;
for (const [form,bank] of Object.entries(banks)) {
  const ids = new Map(bank.items.map(i=>[i.item_id,i]));
  const groups = new Map(bank.groups.map(g=>[g.passage_group_id,g]));
  groupCount += groups.size;
  checks++;
  if(bank.items.length!==200 || groups.size!==42) fail(form,'COUNT_WRONG');
  for(let part=1;part<=7;part++){
    checks++;
    const n=bank.items.filter(i=>i.part===part).length;
    if(n!==expected[part]) fail(form+'-P'+part,'PART_COUNT '+n);
  }
  for(const item of bank.items){
    checks++;
    const id=item.item_id, opts=item.options||[], target=Array.from({length:item.part===2?3:4},(_,n)=>String.fromCharCode(97+n));
    if(seen.has(id))fail(id,'DUPLICATE_ID');
    seen.add(id);
    if(!id.startsWith(form+'-')||item.form!==form)fail(id,'WRONG_FORM');
    if(item.review_status!=='DRAFT')humanReviewed++;
    if(opts.length!==target.length||opts.some((o,n)=>o.id!==target[n]))fail(id,'INVALID_OPTIONS');
    if(!opts.some(o=>o.id===item.correct))fail(id,'CORRECT_NOT_FOUND');
    if(new Set(opts.map(o=>norm(o.text))).size!==opts.length||opts.some(o=>!o.text?.trim()))fail(id,'DUPLICATE_OR_EMPTY_OPTIONS');
    if(!item.explanation?.trim())fail(id,'NO_EXPLANATION');
    // Antes sólo comprobábamos que existiera una explicación, no si su UTF-8 estaba dañado.
    const visibleText=[item.stem,item.explanation,...opts.map(o=>o.text)].filter(Boolean);
    if(visibleText.some(s=>/[\p{L}]\?[\p{L}]|^\?[\p{L}]/u.test(s)))fail(id,'BROKEN_TEXT_ENCODING');
    if(Object.keys(item.distractors||{}).length!==opts.length-1)fail(id,'DISTRACTOR_COUNT');
    for(const o of opts.filter(x=>x.id!==item.correct))if(!item.distractors?.[o.id]?.why||!item.distractors?.[o.id]?.cat)fail(id,'DISTRACTOR_MISSING_'+o.id);
    if(item.part<=2){
      const phrases=(item.script||[]).filter(s=>s.t).map(s=>norm(s.t));
      if(phrases.length<4)fail(id,'SHORT_AUDIO_SCRIPT');
      for(const [n,o] of opts.entries()){
        if(!phrases.includes(norm(String.fromCharCode(65+n)+'. '+o.text)))fail(id,'SCRIPT_OPTION_MISMATCH_'+o.id);
      }
      const f=path.join(root,item.audio_asset||'');
      if(!fs.existsSync(f))fail(id,'NO_AUDIO_FILE');
      referenced.add(id);
      if(item.part===1){
        images++;
        if(!fs.existsSync(path.join(root,item.image_asset||'')))fail(id,'NO_IMAGE_FILE');
      }
    }else if(item.part!==5){
      const g=groups.get(item.passage_group_id);
      if(!g||!g.item_ids.includes(id)||g.part!==item.part)fail(id,'INVALID_GROUP_REF');
      if(!item.stem?.trim())fail(id,'NO_STEM');
    }else if(!item.stem?.includes('---'))fail(id,'P5_BLANK_MISSING');
    const fingerprint=norm((item.stem||'')+' '+opts.map(o=>o.text).join(' ')+(item.part<=2?' '+(item.script||[]).filter(s=>s.t).map(s=>s.t).join(' '):''));
    if(fingerprints.has(fingerprint))fail(id,'EXACT_CONTENT_DUP_'+fingerprints.get(fingerprint));
    fingerprints.set(fingerprint,id);
  }
  for(const group of bank.groups){
    checks++;
    const gid=group.passage_group_id;
    for(const id of group.item_ids||[])if(!ids.has(id)||ids.get(id).passage_group_id!==gid)fail(gid,'INVALID_GROUP_ITEM_'+id);
    if(group.part<=4){
      if(!group.audio_asset||!fs.existsSync(path.join(root,group.audio_asset)))fail(gid,'MISSING_GROUP_AUDIO');
      if(!(group.script||[]).some(s=>s.t))fail(gid,'NO_TRANSCRIPT');
      referenced.add(gid);
    }
    if(group.part>=6){
      if(!group.passage && !(group.passages&&group.passages.length>=2))fail(gid,'MISSING_DOCUMENTS');
      if(group.part===6){
        const passage=JSON.stringify(group.passage);
        for(const id of group.item_ids){
          const blank=ids.get(id)?.blank;
          if(!blank||!passage.includes('[['+blank+']]'))fail(id,'MISSING_BLANK_MARKER');
        }
      }
    }
  }
  const b14=ids.get('B-P5-14'),b15=ids.get('B-P5-15'),b218=ids.get('B-P2-18'),b712=ids.get('B-G7-12-Q5'),b29=ids.get('B-P5-29');
  if(form==='B'){
    if(b14.correct!=='a'||!b14.stem.includes('information about'))fail('B-P5-14','REGRESSION');
    if(b15.correct!=='a'||!b15.stem.includes('two professional')||!b15.stem.includes('résumé')||!b15.explanation.includes('después'))fail('B-P5-15','REGRESSION');
    if(b14.explanation.includes('?')||b14.topic.includes('?'))fail('B-P5-14','BROKEN_COPY_REGRESSION');
    if(b29.correct!=='a'||!b29.stem.includes('expected to begin in March'))fail('B-P5-29','SEMANTIC_CONSTRUCTION_REGRESSION');
    if(!b218.explanation.includes('se lo regaló'))fail('B-P2-18','EXPLANATION_REGRESSION');
    if(b712.correct!=='b'||b712.options[1].text!=='routinely')fail('B-G7-12-Q5','VOCABULARY_REGRESSION');
  }
  facts.push({form,items:bank.items.length,groups:bank.groups.length,
    parts:expected.slice(1).map((_,p)=>bank.items.filter(i=>i.part===p+1).length)});
}
// Cuatro clips de instrucciones comunes también pertenecen al manifiesto.
for(const p of [1,2,3,4]) referenced.add('DIR-P'+p);
for(const [key,clip] of Object.entries(clips)){
  checks++;
  if(!referenced.has(key))fail(key,'ORPHANED_AUDIO');
  const audio=path.join(root,clip.file||'');
  if(!fs.existsSync(audio)){fail(key,'MISSING_AUDIO');continue;}
  const buf=fs.readFileSync(audio);
  if(buf.length!==clip.bytes)fail(key,'AUDIO_BYTES_MISMATCH');
  if(crypto.createHash('sha256').update(buf).digest('hex')!==clip.sha256)fail(key,'AUDIO_HASH_MISMATCH');
}
if(referenced.size!==112||Object.keys(clips).length!==112)fail('AUDIO','MANIFEST_COVERAGE');
console.log('EDITORIAL_QA_400='+JSON.stringify({
  itemCount:seen.size,parts:expected.slice(1),groupCount,images,referencedAudio:referenced.size,
  manifestAudio:Object.keys(clips).length,structuralChecks:checks,
  humanReviewed,uniqueFingerprints:fingerprints.size,problems:errs.length,errors:errs.slice(0,25),facts
}));
if(errs.length)process.exitCode=1;
