/* global React */
// CS21A199-R2 · Word Search UI reutilizable. Sin red propia: el padre inyecta estado autoritativo y mutaciones.
(function installEnglishLabWordSearchGameCS21A199(global){
  'use strict';
  if(!global||global.EnglishLabWordSearchGameCS21A199)return;
  const Engine=global.EnglishLabWordSearchEngineCS21A199,Contract=global.EnglishLabWordSearchCurriculumCS21A199;
  if(!Engine||!Contract)throw new Error('Word Search CS21A199 requiere contrato y motor.');

  function cx(){return [...arguments].filter(Boolean).join(' ');}
  function formatTime(total){const s=Math.max(0,Math.floor(total||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  function actionId(roundId,puzzleId,wordId){return `WS199-${String(roundId||'ROUND').replace(/[^A-Za-z0-9]/g,'').slice(-10)}-${String(puzzleId||'PUZZLE').replace(/[^A-Za-z0-9]/g,'').slice(-10)}-${String(wordId||'WORD').replace(/[^A-Za-z0-9]/g,'').slice(-10)}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;}
  function keySet(cells){return new Set((cells||[]).map(c=>Engine.cellKey(c.row,c.col)));}
  function asTime(value){if(value==null||value==='')return NaN;if(typeof value==='number')return value;const parsed=Date.parse(value);return Number.isFinite(parsed)?parsed:NaN;}
  function reverse(text){return String(text||'').split('').reverse().join('');}
  function publicMatch(puzzle,cells,claimedIds){if(!puzzle||!cells?.length)return null;const letters=Engine.lettersAt(puzzle.grid,cells),used=new Set(claimedIds||[]);return (puzzle.words||[]).find(word=>!used.has(word.wordId)&&(word.gridWord===letters||word.gridWord===reverse(letters)))||null;}
  function normalizeClaims(state){const rows=Array.isArray(state?.claimed_words)?state.claimed_words:Array.isArray(state?.claimedWords)?state.claimedWords:[];const map=new Map();rows.forEach(row=>{const id=String(row?.word_id||row?.wordId||'').trim();if(id)map.set(id,row);});return map;}

  function WordSearchGameCS21A199({rows,words,seed='B1-U01-DEMO',durationSeconds=180,readOnly=false,onClaim,onComplete,title="What's your name?",publicPuzzle,authoritativeState,roundId,serverNow,roundEndsAt}){
    const sourceWords=React.useMemo(()=>{
      if(publicPuzzle)return null;
      if(Array.isArray(words)&&words.length)return Engine.normalizeWords(words);
      const validation=Contract.validatePool(rows||[]);if(!validation.ok)throw new Error(`Pool Word Search B1-U01 inválido (${validation.count}/${Contract.WORD_COUNT}).`);return Contract.vocabularyFromRows(rows||[]);
    },[rows,words,publicPuzzle]);
    const previewSecret=React.useMemo(()=>publicPuzzle?null:Engine.buildPuzzle(sourceWords,seed,{size:Contract.GRID_SIZE,directions:Contract.DIRECTIONS}),[sourceWords,seed,publicPuzzle]);
    const puzzle=React.useMemo(()=>publicPuzzle||Engine.publicPuzzle(previewSecret),[publicPuzzle,previewSecret]);
    if(!puzzle||!Array.isArray(puzzle.grid)||!Array.isArray(puzzle.words))throw new Error('Word Search requiere un puzzle público válido.');

    const isLive=!!publicPuzzle||!!authoritativeState||typeof onClaim==='function';
    const effectiveRoundId=String(roundId||authoritativeState?.round_id||authoritativeState?.roundId||(isLive?'':'PREVIEW-ROUND')).trim();
    if(isLive&&!effectiveRoundId)throw new Error('Word Search Live requiere round_id.');
    const authoritativeClaims=React.useMemo(()=>normalizeClaims(authoritativeState),[authoritativeState]);
    const [previewClaims,setPreviewClaims]=React.useState(()=>new Map());
    const claimed=isLive?authoritativeClaims:previewClaims;
    const [pending,setPending]=React.useState(()=>new Map());
    const [drag,setDrag]=React.useState(null),[anchor,setAnchor]=React.useState(null),[feedback,setFeedback]=React.useState('');
    const [focusCell,setFocusCell]=React.useState({row:0,col:0});
    const [localSeconds,setLocalSeconds]=React.useState(Math.max(15,Number(durationSeconds)||180));
    const [tick,setTick]=React.useState(0),completeRef=React.useRef('');
    const phase=String(authoritativeState?.phase||'OPEN').toUpperCase();
    const serverBase=asTime(serverNow??authoritativeState?.server_now??authoritativeState?.serverNow),clientBase=React.useMemo(()=>Date.now(),[serverBase]);
    const endsAt=asTime(roundEndsAt??authoritativeState?.round_ends_at??authoritativeState?.roundEndsAt);
    const authoritativeSeconds=Number.isFinite(endsAt)?Math.max(0,Math.ceil((endsAt-(Date.now()+(Number.isFinite(serverBase)?serverBase-clientBase:0)))/1000)):NaN;
    const seconds=Number.isFinite(authoritativeSeconds)?authoritativeSeconds:localSeconds;
    const complete=claimed.size===puzzle.words.length||phase==='COMPLETE';
    const canInteract=!readOnly&&!complete&&seconds>0&&phase==='OPEN'&&pending.size===0;

    React.useEffect(()=>{setPreviewClaims(new Map());setPending(new Map());setDrag(null);setAnchor(null);setFeedback('');setFocusCell({row:0,col:0});setLocalSeconds(Math.max(15,Number(durationSeconds)||180));completeRef.current='';},[puzzle.puzzleId,effectiveRoundId,durationSeconds]);
    React.useEffect(()=>{if(Number.isFinite(endsAt)){const id=setInterval(()=>setTick(v=>v+1),250);return()=>clearInterval(id);}if(readOnly||complete||localSeconds<=0)return undefined;const id=setInterval(()=>setLocalSeconds(v=>Math.max(0,v-1)),1000);return()=>clearInterval(id);},[endsAt,readOnly,complete,localSeconds<=0]);
    React.useEffect(()=>{setPending(prev=>{if(!prev.size)return prev;const next=new Map(prev);let changed=false;claimed.forEach((_,id)=>{if(next.delete(id))changed=true;});return changed?next:prev;});},[claimed]);
    React.useEffect(()=>{if(!complete||typeof onComplete!=='function')return;const marker=`${effectiveRoundId}|${puzzle.puzzleId}`;if(completeRef.current===marker)return;completeRef.current=marker;onComplete({roundId:effectiveRoundId,puzzleId:puzzle.puzzleId,claimed:[...claimed.values()]});},[complete,effectiveRoundId,puzzle.puzzleId,claimed,onComplete]);

    const currentCells=React.useMemo(()=>drag?Engine.lineBetween(drag.start,drag.end):anchor?[anchor]:[],[drag,anchor]);
    const currentKeys=React.useMemo(()=>keySet(currentCells),[currentCells]);
    const foundKeys=React.useMemo(()=>{const set=new Set();claimed.forEach(item=>(item.cells||item.claimed_cells||[]).forEach(c=>set.add(Engine.cellKey(c.row,c.col))));return set;},[claimed]);
    const pendingEntry=React.useMemo(()=>pending.size?[...pending.values()][0]:null,[pending]);

    function removePending(wordId){setPending(previous=>{const next=new Map(previous);next.delete(wordId);return next;});}
    function dispatchClaim(entry){
      if(!entry||typeof onClaim!=='function')return;
      setPending(previous=>{const next=new Map(previous);next.set(entry.word.wordId,{...entry,status:'SENDING',error:''});return next;});setFeedback(`Validando “${entry.word.label}”…`);
      Promise.resolve(onClaim(entry.action,{...entry.word,cells:entry.cells})).then(result=>{
        if(result&&result.ok===false){removePending(entry.word.wordId);setFeedback(result.mensaje||result.error||`“${entry.word.label}” no fue aceptada.`);return;}
        setPending(previous=>{const next=new Map(previous),current=next.get(entry.word.wordId);if(current)next.set(entry.word.wordId,{...current,status:'AWAITING_SNAPSHOT',error:''});return next;});setFeedback(`“${entry.word.label}” enviada. Esperando confirmación de la sala…`);
      }).catch(error=>{setPending(previous=>{const next=new Map(previous),current=next.get(entry.word.wordId);if(current)next.set(entry.word.wordId,{...current,status:'ERROR',error:error?.message||'NETWORK_ERROR'});return next;});setFeedback(error?.message||`No se pudo confirmar “${entry.word.label}”. Podés reintentar la misma jugada.`);});
    }
    function retryPending(){if(!pendingEntry||pendingEntry.status!=='ERROR')return;dispatchClaim(pendingEntry);}
    function finish(cells){
      if(!canInteract||!cells?.length)return;const word=publicMatch(puzzle,cells,[...claimed.keys()]);
      if(!word){setFeedback(cells.length>1?`“${Engine.lettersAt(puzzle.grid,cells)}” no coincide con una palabra pendiente.`:'Elegí una segunda casilla en línea recta.');return;}
      if(!isLive){const claim={...word,cells:cells.map(c=>({...c})),claimed_at:Date.now(),player_id:'PREVIEW'};setPreviewClaims(previous=>{const next=new Map(previous);next.set(word.wordId,claim);return next;});setFeedback(`¡Encontraste ${word.label}! ${word.hintEs?`· ${word.hintEs}`:''}`);return;}
      const id=actionId(effectiveRoundId,puzzle.puzzleId,word.wordId),action=Engine.buildClaimAction(puzzle,word,cells,id,effectiveRoundId),entry={action,word,cells,status:'SENDING',error:''};setPending(new Map([[word.wordId,entry]]));dispatchClaim(entry);
    }
    function cellFromPoint(x,y){const el=document.elementFromPoint(x,y)?.closest?.('[data-ws199-cell]');if(!el)return null;const row=Number(el.getAttribute('data-row')),col=Number(el.getAttribute('data-col'));return Number.isInteger(row)&&Number.isInteger(col)?{row,col}:null;}
    function pointerDown(event,row,col){if(!canInteract)return;event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);setFocusCell({row,col});setAnchor(null);setDrag({start:{row,col},end:{row,col},pointerId:event.pointerId});}
    function pointerMove(event){if(!drag||drag.pointerId!==event.pointerId)return;const cell=cellFromPoint(event.clientX,event.clientY);if(cell)setDrag(prev=>prev?{...prev,end:cell}:prev);}
    function pointerUp(event){if(!drag||drag.pointerId!==event.pointerId)return;const cell=cellFromPoint(event.clientX,event.clientY)||drag.end,cells=Engine.lineBetween(drag.start,cell);setDrag(null);finish(cells);}
    function keyboardCell(row,col){if(!canInteract)return;if(!anchor){setAnchor({row,col});setFeedback('Ahora elegí la última letra de la palabra.');return;}const cells=Engine.lineBetween(anchor,{row,col});setAnchor(null);finish(cells);}
    function moveFocus(row,col){const r=Math.max(0,Math.min(puzzle.size-1,row)),c=Math.max(0,Math.min(puzzle.size-1,col));setFocusCell({row:r,col:c});requestAnimationFrame(()=>document.querySelector(`[data-ws199-cell][data-row="${r}"][data-col="${c}"]`)?.focus());}
    function keyboardNav(event,row,col){
      if(!canInteract)return;let next=null;
      if(event.key==='ArrowUp')next={row:row-1,col};else if(event.key==='ArrowDown')next={row:row+1,col};else if(event.key==='ArrowLeft')next={row,col:col-1};else if(event.key==='ArrowRight')next={row,col:col+1};else if(event.key==='Home')next={row,col:0};else if(event.key==='End')next={row,col:puzzle.size-1};
      if(next){event.preventDefault();moveFocus(next.row,next.col);}
    }

    return <section className="ws199-shell" data-game="WORD_SEARCH" data-version="CS21A199-R2" data-phase={phase} data-pending={pending.size?'true':'false'}>
      <header className="ws199-header"><div><span className="ws199-kicker">English LAB · B1 · U01</span><h2>Word Search</h2><p>{title} · Vocabulary & spelling</p></div><div className="ws199-metrics"><div><small>Tiempo</small><strong>{formatTime(seconds)}</strong></div><div><small>Encontradas</small><strong>{claimed.size}/{puzzle.words.length}</strong></div><div><small>Puntos</small><strong>{claimed.size*100}</strong></div></div></header>
      <div className="ws199-progress" aria-label={`${claimed.size} de ${puzzle.words.length} palabras`}><span style={{width:`${(claimed.size/puzzle.words.length)*100}%`}}/></div>
      <div className="ws199-layout"><div className="ws199-board-card"><div className="ws199-instruction"><b>Buscá las palabras</b><span>Arrastrá desde la primera hasta la última letra. Con teclado usá flechas para moverte y Enter/Espacio para marcar inicio y fin.</span></div>
        <div className={cx('ws199-board',readOnly&&'readonly',seconds<=0&&'expired',pending.size&&'has-pending')} role="grid" aria-label="Sopa de letras" aria-busy={pending.size?'true':'false'} style={{'--ws-size':puzzle.size}} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>setDrag(null)}>
          {puzzle.grid.map((row,r)=>row.map((letter,c)=>{const key=Engine.cellKey(r,c),isCurrent=currentKeys.has(key),isFound=foundKeys.has(key),isAnchor=anchor?.row===r&&anchor?.col===c,isFocus=focusCell.row===r&&focusCell.col===c;return <button key={key} type="button" role="gridcell" data-ws199-cell data-row={r} data-col={c} className={cx('ws199-cell',isCurrent&&'selecting',isFound&&'found',isAnchor&&'anchor')} onPointerDown={e=>pointerDown(e,r,c)} onFocus={()=>setFocusCell({row:r,col:c})} onKeyDown={e=>keyboardNav(e,r,c)} onClick={e=>{if(e.detail===0)keyboardCell(r,c);}} disabled={!canInteract} tabIndex={canInteract&&isFocus?0:-1} aria-label={`Fila ${r+1}, columna ${c+1}, letra ${letter}`}>{letter}</button>;}))}
        </div>
        <div className={cx('ws199-feedback',complete&&'success',seconds<=0&&!complete&&'warn')} aria-live="polite"><span>{complete?'¡Excelente! La ronda quedó completa.':seconds<=0?'Tiempo terminado. El servidor cerrará la ronda para todos.':feedback||'Las palabras pueden estar horizontales, verticales o diagonales.'}</span>{pendingEntry?.status==='ERROR'?<button type="button" className="ws199-retry" onClick={retryPending}>Reintentar misma jugada</button>:null}</div>
      </div>
      <aside className="ws199-wordbank"><div className="ws199-wordbank-head"><span>Banco de palabras</span><strong>{puzzle.words.length-claimed.size} pendientes</strong></div><div className="ws199-word-list">{puzzle.words.map((word,index)=>{const item=claimed.get(word.wordId),waiting=pending.has(word.wordId),waitState=pending.get(word.wordId)?.status;return <div key={word.wordId} className={cx('ws199-word',item&&'done',waiting&&'pending')}><span className="ws199-word-index">{String(index+1).padStart(2,'0')}</span><div><b>{word.label}</b><small>{waiting?(waitState==='ERROR'?'Sin confirmar · reintento disponible':'Validando…'):(word.hintEs||'Vocabulario de la unidad')}</small></div><i aria-hidden="true">{item?'✓':waiting?'…':'·'}</i></div>;})}</div><div className="ws199-curriculum"><span>Ruta curricular</span><b>Básico I · Unidad 1</b><p>Reconocimiento visual, ortografía y asociación de vocabulario.</p><small>Práctica formativa · no nota oficial</small></div></aside></div>
    </section>;
  }

  global.EnglishLabWordSearchGameCS21A199=Object.freeze({VERSION:'CS21A199-R2',GAME_ID:'WORD_SEARCH',WordSearchGameCS21A199});
})(window);
