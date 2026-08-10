#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseName='CAMPUS_QA_CS21A195_CANDIDATO_MEMORY_MATCH_CONVERGENCE';
const packageName='CAMPUS_QA_CS21A196_CANDIDATO_MEMORY_MATCH_CONFLICT_RECONCILIATION';
const base=path.join(root,'dist',baseName);
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const testMergeSha=process.env.TEST_MERGE_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'fix/cs21a196-memory-match-conflict-reconciliation';
const verifyOnly=process.argv.includes('--verify');

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function write(relative,value){const out=path.join(target,relative);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,value,'utf8');}
function copy(relative,destination=relative){const source=path.join(root,relative);assert.equal(fs.existsSync(source),true,`Falta ${relative}`);const out=path.join(target,destination);fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(source,out);}
function setVersion(source,key,value){const cleaned=source.replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'').replace(/\s*$/,'');return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');}
function replaceExact(relative,oldText,newText,label){
  const file=path.join(target,relative);
  assert.equal(fs.existsSync(file),true,`Falta ${relative}`);
  const source=fs.readFileSync(file,'utf8');
  assert.ok(source.includes(oldText),`No se encontró ${label} en ${relative}`);
  fs.writeFileSync(file,source.replace(oldText,newText),'utf8');
}
function files(){const out=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const abs=path.join(dir,entry.name);if(entry.isDirectory())walk(abs);else if(entry.name!=='SHA256SUMS.txt')out.push(abs);}};walk(target);return out.sort((a,b)=>a.localeCompare(b));}
function writeManifest(){write('SHA256SUMS.txt',files().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n');}

const K_DISCOVER_OLD=`      room = _cs21a189WritePackage_(found, room, current, pkg);

      _elive180AppendEvent_`;
const K_DISCOVER_NEW=`      room = _cs21a189WritePackage_(found, room, current, pkg);
      // CS21A196: adoptar la revisión realmente escrita por 99O antes de responder.
      if (typeof _cs21a196AlignWrittenPackage_ === 'function') {
        pkg = _cs21a196AlignWrittenPackage_(room, pkg);
        shared = pkg && pkg.shared_state || shared;
        turnState = pkg && pkg.turn_state || turnState;
      }

      _elive180AppendEvent_`;
const K_PAIR_OLD=`    room = _elive180SetCells_(found, patch);

    _elive180AppendEvent_`;
const K_PAIR_NEW=`    room = _elive180SetCells_(found, patch);
    // CS21A196: SUBMIT_PAIR también responde con la revisión persistida.
    if (typeof _cs21a196AlignWrittenPackage_ === 'function') {
      pkg = _cs21a196AlignWrittenPackage_(room, pkg);
      shared = pkg && pkg.shared_state || shared;
      nextTurn = pkg && pkg.turn_state || nextTurn;
    }

    _elive180AppendEvent_`;

function patchFrontend(){
  replaceExact('src/english_lab_live.jsx',
`      if(!res.ok || !data || data.ok === false) throw new Error((data && (data.mensaje || data.error)) || \`HTTP \${res.status}\`);
      return data;`,
`      if(!res.ok || !data) throw new Error((data && (data.mensaje || data.error)) || \`HTTP \${res.status}\`);
      // CS21A196: un rechazo de dominio con room_package es reconciliación autoritativa.
      if(data.ok === false && !(data.room_package && typeof data.room_package === 'object')){
        throw new Error(data.mensaje || data.error || \`HTTP \${res.status}\`);
      }
      return data;`,'postLive domain result');

  const adapter='src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx';
  replaceExact(adapter,
`      if(!candidate||typeof candidate!=='object'||candidate.ok===false) return {accepted:false,reason:'INVALID'};
      const details=meta||{};`,
`      if(!candidate||typeof candidate!=='object') return {accepted:false,reason:'INVALID'};
      if(candidate.ok===false&&!(candidate.room_package&&typeof candidate.room_package==='object')) return {accepted:false,reason:'INVALID'};
      const stateCandidate=candidate.ok===false?(()=>{
        const copy={...candidate,ok:true};
        delete copy.error;delete copy.mensaje;delete copy.retry_after_ms;
        return copy;
      })():candidate;
      const details=meta||{};`,'applyCandidate domain envelope');
  replaceExact(adapter,'const compared=compareRevision(candidate,current);','const compared=compareRevision(stateCandidate,current);','compare stateCandidate');
  replaceExact(adapter,'if(compared===0&&serverStamp(candidate)&&serverStamp(current)&&serverStamp(candidate)<serverStamp(current)){','if(compared===0&&serverStamp(stateCandidate)&&serverStamp(current)&&serverStamp(stateCandidate)<serverStamp(current)){','serverStamp stateCandidate');
  replaceExact(adapter,'const merged=mergeState(current,candidate);','const merged=mergeState(current,stateCandidate);','merge stateCandidate');

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
  replaceExact(adapter,handleOld,handleNew,'handleSubmit conflict retry');
  replaceExact(adapter,'        authoritativeOnly={true}\n        onReady={props.onReady}','        authoritativeOnly={true}\n        mutationBusy={busy}\n        onReady={props.onReady}','mutationBusy prop');

  const classic='src/english_lab_games/memory_match_classic_sync_cs21a189.jsx';
  replaceExact(classic,
`    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !(props&&props.readOnly);`,
`    const authoritativeBusy=!!(props&&props.mutationBusy);
    const canPlay=phase==='OPEN' && isMyTurn && remainingMs>0 && turnReady && !authoritativeBusy && !(props&&props.readOnly);`,'authoritativeBusy canPlay');
  replaceExact(classic,'if(!canPlay || pairPendingRef.current || syncing || isClaimed(shared,card) || waitingForFlipback) return;','if(!canPlay || authoritativeBusy || pairPendingRef.current || syncing || isClaimed(shared,card) || waitingForFlipback) return;','select busy guard');
  replaceExact(classic,
`        .finally(()=>{
          if(interactionEpochRef.current===interactionEpoch) setSyncing(false);
          pairPendingRef.current=false;
        });`,
`        .finally(()=>{
          if(interactionEpochRef.current===interactionEpoch){
            setSyncing(false);
            pairPendingRef.current=false;
          }
        });`,'epoch-scoped pending release');
  replaceExact(classic,'},[canPlay,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction]);','},[canPlay,authoritativeBusy,syncing,waitingForFlipback,localFirstId,cards,shared,send,buildAction]);','callback dependency');
  replaceExact(classic,'disabled={!canPlay||syncing||waitingForFlipback||(serverFirstId===card.id)}','disabled={!canPlay||authoritativeBusy||syncing||waitingForFlipback||(serverFirstId===card.id)}','card busy disabled');
}

function build(){
  assert.equal(fs.existsSync(base),true,`Falta paquete base ${baseName}.`);
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(base,target,{recursive:true});
  for(const name of fs.readdirSync(target)){
    if(name==='SHA256SUMS.txt'||/^(?:LEEME_PRIMERO|REGISTRO_PRUEBA_AUTENTICADA|ABRIR_CAMPUS_QA)_CS21A\d+/i.test(name))fs.rmSync(path.join(target,name),{recursive:true,force:true});
  }
  fs.rmSync(path.join(target,'EVIDENCIA_AUTOMATICA'),{recursive:true,force:true});

  patchFrontend();
  for(const relative of ['apps_script_patches/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs','BACKEND_QA/99K_MEMORY_MATCH_CLASSIC_SYNC_QA_CS21A189.gs']){
    replaceExact(relative,K_DISCOVER_OLD,K_DISCOVER_NEW,'99K DISCOVER response revision');
    replaceExact(relative,K_PAIR_OLD,K_PAIR_NEW,'99K PAIR response revision');
  }

  copy('apps_script_patches/99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs');
  copy('apps_script_patches/99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs','BACKEND_QA/99R_MEMORY_MATCH_CONFLICT_RECONCILIATION_QA_CS21A196.gs');
  copy('apps_script_patches/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs');
  copy('apps_script_patches/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs','BACKEND_QA/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs');
  copy('00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_CONFLICT_RECONCILIATION_CS21A196.md');

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A195.cmd');
  assert.equal(fs.existsSync(oldLauncher),true,'Falta launcher CS21A195.');
  write('ABRIR_CAMPUS_QA_CS21A196.cmd',fs.readFileSync(oldLauncher,'utf8').replaceAll('4195','4196').replaceAll('CS21A195','CS21A196'));
  let serve=fs.readFileSync(path.join(base,'serve.mjs'),'utf8');
  assert.match(serve,/4195/,'serve.mjs base no usa puerto 4195.');
  write('serve.mjs',serve.replaceAll('4195','4196'));

  write('LEEME_PRIMERO_CS21A196.txt',`CAMPUS QA CS21A196 - MEMORY MATCH CONFLICT RECONCILIATION
============================================================

- QA aislada, no producción.
- Base exacta CS21A195.
- Corrige revisión de respuesta, preserva state_conflict canónico, retry único y bloqueo de tercera carta.
- Instalar BACKEND_QA/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs sólo después del PASS automático.
- Versionar el MISMO deployment QA y conservar el mismo /exec.
- Cerrar 4195 y ejecutar ABRIR_CAMPUS_QA_CS21A196.cmd en puerto 4196.
- Crear sala NUEVA con docente + Naty + Chu.
- No usar Actualizar manual.
- Tras el segundo click ninguna tercera carta puede quedar habilitada hasta resolver/reconciliar.
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A196.txt',`REGISTRO QA CS21A196
======================
Estado inicial: PENDIENTE
Sala:
[ ] Backend CS21A196-MM-CONFLICT-RECONCILIATION-1
[ ] 2 participantes antes de iniciar
[ ] primera/segunda carta fluidas
[ ] tercera carta imposible durante resolución
[ ] mismatch visible en los tres
[ ] match +1 conserva turno
[ ] cero refresh manual
[ ] Ahorcado sin regresión
Resultado: PASS / FAIL / BLOCKED
`);

  let version=fs.readFileSync(path.join(base,'VERSION.txt'),'utf8');
  for(const [key,value] of [
    ['VERSION','CS21A196'],['PACKAGE_REVISION','1'],['STATUS','QA_CANDIDATE_NOT_FINAL'],
    ['PURPOSE','Memory Match conflict reconciliation QA candidate'],['PACKAGE_BASE',baseName],['QA_PORT','4196'],
    ['SOURCE_BRANCH',sourceBranch],['SOURCE_HEAD_SHA',sourceHeadSha],['TEST_MERGE_SHA',testMergeSha],
    ['FRONTEND_LAYER','CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION'],['BACKEND_LAYER','CS21A196-MM-CONFLICT-RECONCILIATION-1'],
    ['APPS_SCRIPT_CHANGE','YES_QA_ONLY'],['APPS_SCRIPT_ACTION','INSTALL_COMPLETE_CS21A196_QA_FILE_AFTER_AUTOMATED_PASS'],
    ['APPS_SCRIPT_COMPLETE_FILE','BACKEND_QA/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs'],
    ['MEMORY_MATCH_SYNC_BASE','CS21A195-MM-CONVERGENCE-RELAY-1'],['MEMORY_MATCH_RECONCILIATION_VERSION','CS21A196-MM-CONFLICT-RECONCILIATION-1'],
    ['MEMORY_MATCH_AUTHENTICATED_QA_STATUS','PENDING_CS21A196'],
  ])version=setVersion(version,key,value);
  write('VERSION.txt',version.replace(/\s*$/,'')+'\n');
  writeManifest();
}

function verify(){
  for(const relative of ['VERSION.txt','SHA256SUMS.txt','serve.mjs','ABRIR_CAMPUS_QA_CS21A196.cmd','LEEME_PRIMERO_CS21A196.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A196.txt','src/english_lab_live.jsx','src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx','src/english_lab_games/memory_match_classic_sync_cs21a189.jsx','BACKEND_QA/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs'])assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta en paquete: ${relative}`);
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.match(version,/VERSION=CS21A196/);assert.match(version,/QA_PORT=4196/);assert.match(version,/BACKEND_LAYER=CS21A196-MM-CONFLICT-RECONCILIATION-1/);
  const backend=fs.readFileSync(path.join(target,'BACKEND_QA/99_CS21A196_MEMORY_MATCH_CONFLICT_RECONCILIATION_COMPLETO.gs'),'utf8');
  assert.match(backend,/CS21A196_MM_RECONCILIATION_VERSION = 'CS21A196-MM-CONFLICT-RECONCILIATION-1'/);
  assert.ok((backend.match(/_cs21a196AlignWrittenPackage_\(room, pkg\)/g)||[]).length>=2);
  const live=fs.readFileSync(path.join(target,'src/english_lab_live.jsx'),'utf8');
  const adapter=fs.readFileSync(path.join(target,'src/english_lab_games/english_lab_live_memory_match_authoritative_sync_adapter_cs21a192.jsx'),'utf8');
  const classic=fs.readFileSync(path.join(target,'src/english_lab_games/memory_match_classic_sync_cs21a189.jsx'),'utf8');
  assert.match(live,/rechazo de dominio con room_package/);
  assert.match(adapter,/STATE_CONFLICT/);assert.match(adapter,/mutationBusy=\{busy\}/);
  assert.match(classic,/authoritativeBusy/);
  const manifest=fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/);
  for(const line of manifest){const match=line.match(/^([a-f0-9]{64})\s+\.\/(.+)$/);assert.ok(match,`Manifest inválido: ${line}`);assert.equal(sha256(path.join(target,match[2])),match[1],`Hash inválido: ${match[2]}`);}
  console.log(JSON.stringify({ok:true,packageName,files:manifest.length,port:4196,backend:'CS21A196-MM-CONFLICT-RECONCILIATION-1'},null,2));
}

if(!verifyOnly)build();
verify();
