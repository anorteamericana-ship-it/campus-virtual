#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();

function read(relative){
  return fs.readFileSync(path.join(root,relative),'utf8');
}
function write(relative,content){
  fs.writeFileSync(path.join(root,relative),content,'utf8');
}
function replaceExact(relative,oldText,newText,label){
  const source=read(relative);
  if(source.includes(newText)){
    console.log(`SKIP ${label}: ya aplicado`);
    return false;
  }
  assert.ok(source.includes(oldText),`No se encontró ${label} en ${relative}`);
  write(relative,source.replace(oldText,newText));
  console.log(`PATCH ${label}: ${relative}`);
  return true;
}

let changed=false;

changed=replaceExact('src/english_lab_live.jsx',
`      if(!res.ok || !data || data.ok === false) throw new Error((data && (data.mensaje || data.error)) || \`HTTP \${res.status}\`);\n      return data;`,
`      if(!res.ok || !data) throw new Error((data && (data.mensaje || data.error)) || \`HTTP \${res.status}\`);\n      // CS21A202: un rechazo de dominio con room_package es reconciliación autoritativa, no error de transporte.\n      if(data.ok === false && !(data.room_package && typeof data.room_package === 'object')){\n        throw new Error(data.mensaje || data.error || \`HTTP \${res.status}\`);\n      }\n      return data;`,'postLive domain envelope')||changed;

const adapter='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx';
changed=replaceExact(adapter,
`      if(!candidate||typeof candidate!=='object'||candidate.ok===false) return {accepted:false,reason:'INVALID'};\n      const details=meta||{};`,
`      if(!candidate||typeof candidate!=='object') return {accepted:false,reason:'INVALID'};\n      if(candidate.ok===false&&!(candidate.room_package&&typeof candidate.room_package==='object')) return {accepted:false,reason:'INVALID'};\n      const stateCandidate=candidate.ok===false?(()=>{\n        const copy={...candidate,ok:true};\n        delete copy.error;delete copy.mensaje;delete copy.retry_after_ms;\n        return copy;\n      })():candidate;\n      const details=meta||{};`,'applyCandidate domain envelope')||changed;
changed=replaceExact(adapter,'const compared=compareRevision(candidate,current);','const compared=compareRevision(stateCandidate,current);','compare stateCandidate')||changed;
changed=replaceExact(adapter,'if(compared===0&&serverStamp(candidate)&&serverStamp(current)&&serverStamp(candidate)<serverStamp(current)){','if(compared===0&&serverStamp(stateCandidate)&&serverStamp(current)&&serverStamp(stateCandidate)<serverStamp(current)){','serverStamp stateCandidate')||changed;
changed=replaceExact(adapter,'const merged=mergeState(current,candidate);','const merged=mergeState(current,stateCandidate);','merge stateCandidate')||changed;

const handleOld=`    async function handleSubmit(submission){
      if(typeof postLive!=='function')throw new Error('postLive no está disponible.');
      setBusy(true);setError('');
      const mutationEpoch=mutationEpochRef.current+1;
      mutationEpochRef.current=mutationEpoch;
      const requestSeq=++requestSeqRef.current;
      const currentRevision=revisionOf(stateRef.current);
      const actionId=\`MM-\${code}-\${pid}-\${currentRevision.turnNumber}-\${requestSeq}-\${Date.now()}\`;
      try{
        invalidateClientReadCache('CS21A192_AUTHORITATIVE_MUTATION');
        const payload={
          ...base.submitPayload(submission,room,pkg,player),
          action_id:actionId,
          client_request_id:actionId,
          expected_state_revision:currentRevision.stateRevision,
          expected_turn_number:currentRevision.turnNumber,
          sync_policy:SYNC_VERSION,
        };
        const startedMono=monoNow();
        const result=await postLive(ENDPOINTS.submitPair,payload,MUTATION_TIMEOUT_MS);
        const received=decorateResponse(result,{startedMono,receivedMono:monoNow(),receivedWall:Date.now()});
        setLastResult(received||null);
        applyCandidate(received,{source:'mutation',requestSeq,issuedMutationEpoch:mutationEpoch});
        wakePollRef.current();
        return received;
      }catch(err){
        const message=err&&err.message?err.message:String(err);
        setError(message);wakePollRef.current();throw err;
      }finally{setBusy(false);}
    }`;
const handleNew=`    async function handleSubmit(submission){
      if(typeof postLive!=='function')throw new Error('postLive no está disponible.');
      setBusy(true);setError('');
      const mutationEpoch=mutationEpochRef.current+1;
      mutationEpochRef.current=mutationEpoch;
      const initialSeq=++requestSeqRef.current;
      const currentRevision=revisionOf(stateRef.current);
      const actionId=\`MM-\${code}-\${pid}-\${currentRevision.turnNumber}-\${initialSeq}-\${Date.now()}\`;
      const initialPayload={
        ...base.submitPayload(submission,room,pkg,player),
        action_id:actionId,
        client_request_id:actionId,
        expected_state_revision:currentRevision.stateRevision,
        expected_turn_number:currentRevision.turnNumber,
        sync_policy:SYNC_VERSION,
      };
      async function executeMutation(payload,requestSeq){
        invalidateClientReadCache('CS21A192_AUTHORITATIVE_MUTATION');
        const startedMono=monoNow();
        const result=await postLive(ENDPOINTS.submitPair,payload,MUTATION_TIMEOUT_MS);
        const received=decorateResponse(result,{startedMono,receivedMono:monoNow(),receivedWall:Date.now()});
        applyCandidate(received,{source:'mutation',requestSeq,issuedMutationEpoch:mutationEpoch});
        return received;
      }
      try{
        let received=await executeMutation(initialPayload,initialSeq);
        if(received&&received.ok===false&&upper(received.error)==='STATE_CONFLICT'&&received.room_package){
          const fresh=revisionOf(received);
          if(fresh.stateRevision>0){
            const retrySeq=++requestSeqRef.current;
            received=await executeMutation({
              ...initialPayload,
              client_request_id:\`\${actionId}-R1\`,
              expected_state_revision:fresh.stateRevision,
              expected_turn_number:fresh.turnNumber,
            },retrySeq);
          }
        }
        setLastResult(received||null);
        if(received&&received.ok===false)setError(received.mensaje||received.message||received.error||'La jugada no fue aceptada.');
        else setError('');
        wakePollRef.current();
        return received;
      }catch(err){
        const message=err&&err.message?err.message:String(err);
        setError(message);wakePollRef.current();throw err;
      }finally{setBusy(false);}
    }`;
changed=replaceExact(adapter,handleOld,handleNew,'handleSubmit conflict retry')||changed;
changed=replaceExact(adapter,'        authoritativeOnly={true}\n        onReady={props.onReady}','        authoritativeOnly={true}\n        mutationBusy={busy}\n        onReady={props.onReady}','mutationBusy prop')||changed;

const classic='src/english_lab_games/memory_match_classic_sync_cs21a189.jsx';
changed=replaceExact(classic,
`    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !(props&&props.readOnly);`,
`    const authoritativeBusy=!!(props&&props.mutationBusy);\n    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !authoritativeBusy && !(props&&props.readOnly);`,'authoritativeBusy canPlay')||changed;
changed=replaceExact(classic,'if(!canPlay || pairPendingRef.current || syncing || isClaimed(shared,card) || waitingForFlipback) return;','if(!canPlay || authoritativeBusy || pairPendingRef.current || syncing || isClaimed(shared,card) || waitingForFlipback) return;','select busy guard')||changed;
changed=replaceExact(classic,
`        .finally(()=>{\n          if(interactionEpochRef.current===interactionEpoch) setSyncing(false);\n          pairPendingRef.current=false;\n        });`,
`        .finally(()=>{\n          if(interactionEpochRef.current===interactionEpoch){\n            setSyncing(false);\n            pairPendingRef.current=false;\n          }\n        });`,'epoch-scoped pending release')||changed;
changed=replaceExact(classic,'},[canPlay,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction]);','},[canPlay,authoritativeBusy,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction]);','callback dependency')||changed;
changed=replaceExact(classic,'disabled={!canPlay||syncing||waitingForFlipback||(serverFirstId===card.id)}','disabled={!canPlay||authoritativeBusy||syncing||waitingForFlipback||(serverFirstId===card.id)}','card busy disabled')||changed;

const live=read('src/english_lab_live.jsx');
const adapterSource=read(adapter);
const classicSource=read(classic);
assert.match(live,/CS21A202: un rechazo de dominio con room_package/);
assert.doesNotMatch(live,/!res\.ok \|\| !data \|\| data\.ok === false/);
assert.match(adapterSource,/const stateCandidate=candidate\.ok===false/);
assert.match(adapterSource,/mutationBusy=\{busy\}/);
assert.match(adapterSource,/client_request_id:`\$\{actionId\}-R1`/);
assert.match(classicSource,/const authoritativeBusy=!!\(props&&props\.mutationBusy\)/);
assert.match(classicSource,/if\(interactionEpochRef\.current===interactionEpoch\)\{\s*setSyncing\(false\);\s*pairPendingRef\.current=false;/s);

console.log(JSON.stringify({ok:true,version:'CS21A202-SOURCE-RECOVERY-1',changed,source_of_truth:'src',memory_match_conflict_reconciliation:true},null,2));
