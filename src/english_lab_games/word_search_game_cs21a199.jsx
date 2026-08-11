/* global React */
// CS21A199 · Word Search UI reutilizable. No hace llamadas de red.
(function installEnglishLabWordSearchGameCS21A199(global){
  'use strict';
  if(!global||global.EnglishLabWordSearchGameCS21A199)return;
  const Engine=global.EnglishLabWordSearchEngineCS21A199;
  const Contract=global.EnglishLabWordSearchCurriculumCS21A199;
  if(!Engine||!Contract)throw new Error('Word Search CS21A199 requiere contrato y motor.');

  function cx(){return [...arguments].filter(Boolean).join(' ');}
  function formatTime(total){const s=Math.max(0,Math.floor(total||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
  function actionId(wordId){return `WS199-${Date.now()}-${String(wordId||'WORD').replace(/[^A-Za-z0-9]/g,'').slice(-12)}-${Math.random().toString(36).slice(2,8)}`;}
  function keySet(cells){return new Set((cells||[]).map(c=>Engine.cellKey(c.row,c.col)));}

  function WordSearchGameCS21A199({rows,words,seed='B1-U01-DEMO',durationSeconds=180,readOnly=false,onClaim,onComplete,title="What's your name?"}){
    const sourceWords=React.useMemo(()=>{
      if(Array.isArray(words)&&words.length)return words;
      const validation=Contract.validatePool(rows||[]);
      if(!validation.ok)throw new Error(`Pool Word Search B1-U01 inválido (${validation.count}/${Contract.WORD_COUNT}).`);
      return Contract.vocabularyFromRows(rows||[]);
    },[rows,words]);
    const puzzle=React.useMemo(()=>Engine.buildPuzzle(sourceWords,seed,{size:Contract.GRID_SIZE,directions:Contract.DIRECTIONS}),[sourceWords,seed]);
    const [found,setFound]=React.useState(()=>new Map());
    const [drag,setDrag]=React.useState(null);
    const [anchor,setAnchor]=React.useState(null);
    const [feedback,setFeedback]=React.useState('');
    const [seconds,setSeconds]=React.useState(Math.max(15,Number(durationSeconds)||180));
    const boardRef=React.useRef(null);
    const complete=found.size===puzzle.words.length;

    React.useEffect(()=>{setFound(new Map());setDrag(null);setAnchor(null);setFeedback('');setSeconds(Math.max(15,Number(durationSeconds)||180));},[puzzle.puzzleId,durationSeconds]);
    React.useEffect(()=>{
      if(readOnly||complete||seconds<=0)return undefined;
      const id=setInterval(()=>setSeconds(v=>Math.max(0,v-1)),1000);return()=>clearInterval(id);
    },[readOnly,complete,seconds<=0]);
    React.useEffect(()=>{if(complete&&typeof onComplete==='function')onComplete({puzzleId:puzzle.puzzleId,found:[...found.values()],elapsedSeconds:Math.max(0,(Number(durationSeconds)||180)-seconds)});},[complete]);

    const currentCells=React.useMemo(()=>drag?Engine.lineBetween(drag.start,drag.end):anchor?[anchor]:[],[drag,anchor]);
    const currentKeys=React.useMemo(()=>keySet(currentCells),[currentCells]);
    const foundKeys=React.useMemo(()=>{
      const set=new Set();found.forEach(item=>(item.cells||[]).forEach(c=>set.add(Engine.cellKey(c.row,c.col))));return set;
    },[found]);

    function finish(cells){
      if(readOnly||complete||seconds<=0||!cells?.length)return;
      const match=Engine.matchSelection(puzzle,cells,[...found.keys()]);
      if(!match){setFeedback(cells.length>1?`“${Engine.lettersAt(puzzle.grid,cells)}” no es una palabra pendiente.`:'Elegí una segunda casilla en línea recta.');return;}
      const claim={...match,foundAt:Date.now()};
      setFound(previous=>{const next=new Map(previous);next.set(match.wordId,claim);return next;});
      setFeedback(`¡Encontraste ${match.label}! ${match.hintEs?`· ${match.hintEs}`:''}`);
      if(typeof onClaim==='function')onClaim(Engine.buildClaimAction(puzzle,match,cells,actionId(match.wordId)),claim);
    }
    function cellFromPoint(x,y){
      const el=document.elementFromPoint(x,y)?.closest?.('[data-ws199-cell]'); if(!el)return null;
      const row=Number(el.getAttribute('data-row')),col=Number(el.getAttribute('data-col'));return Number.isInteger(row)&&Number.isInteger(col)?{row,col}:null;
    }
    function pointerDown(event,row,col){
      if(readOnly||complete||seconds<=0)return;
      event.preventDefault();event.currentTarget.setPointerCapture?.(event.pointerId);setAnchor(null);setDrag({start:{row,col},end:{row,col},pointerId:event.pointerId});
    }
    function pointerMove(event){if(!drag||drag.pointerId!==event.pointerId)return;const cell=cellFromPoint(event.clientX,event.clientY);if(cell)setDrag(prev=>prev?{...prev,end:cell}:prev);}
    function pointerUp(event){
      if(!drag||drag.pointerId!==event.pointerId)return;const cell=cellFromPoint(event.clientX,event.clientY)||drag.end;const cells=Engine.lineBetween(drag.start,cell);setDrag(null);finish(cells);
    }
    function keyboardCell(row,col){
      if(readOnly||complete||seconds<=0)return;
      if(!anchor){setAnchor({row,col});setFeedback('Ahora elegí la última letra de la palabra.');return;}
      const cells=Engine.lineBetween(anchor,{row,col});setAnchor(null);finish(cells);
    }

    return <section className="ws199-shell" data-game="WORD_SEARCH" data-version="CS21A199">
      <header className="ws199-header">
        <div><span className="ws199-kicker">English LAB · B1 · U01</span><h2>Word Search</h2><p>{title} · Vocabulary & spelling</p></div>
        <div className="ws199-metrics"><div><small>Tiempo</small><strong>{formatTime(seconds)}</strong></div><div><small>Encontradas</small><strong>{found.size}/{puzzle.words.length}</strong></div><div><small>Puntos</small><strong>{found.size*100}</strong></div></div>
      </header>
      <div className="ws199-progress" aria-label={`${found.size} de ${puzzle.words.length} palabras`}><span style={{width:`${(found.size/puzzle.words.length)*100}%`}}/></div>
      <div className="ws199-layout">
        <div className="ws199-board-card">
          <div className="ws199-instruction"><b>Buscá las palabras</b><span>Arrastrá desde la primera hasta la última letra. También podés marcar inicio y fin con dos clics.</span></div>
          <div ref={boardRef} className={cx('ws199-board',readOnly&&'readonly',seconds<=0&&'expired')} style={{'--ws-size':puzzle.size}} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>setDrag(null)}>
            {puzzle.grid.map((row,r)=>row.map((letter,c)=>{
              const key=Engine.cellKey(r,c),isCurrent=currentKeys.has(key),isFound=foundKeys.has(key),isAnchor=anchor?.row===r&&anchor?.col===c;
              return <button key={key} type="button" data-ws199-cell data-row={r} data-col={c} className={cx('ws199-cell',isCurrent&&'selecting',isFound&&'found',isAnchor&&'anchor')} onPointerDown={e=>pointerDown(e,r,c)} onClick={e=>{if(e.detail===0)keyboardCell(r,c);}} aria-label={`Fila ${r+1}, columna ${c+1}, letra ${letter}`}>{letter}</button>;
            }))}
          </div>
          <div className={cx('ws199-feedback',complete&&'success',seconds<=0&&!complete&&'warn')} aria-live="polite">
            {complete?'¡Excelente! Encontraste todo el vocabulario de esta ronda.':seconds<=0?'Tiempo terminado. En Live, el servidor cerrará la ronda para todos.':feedback||'Las palabras pueden estar horizontales, verticales o diagonales.'}
          </div>
        </div>
        <aside className="ws199-wordbank">
          <div className="ws199-wordbank-head"><span>Banco de palabras</span><strong>{puzzle.words.length-found.size} pendientes</strong></div>
          <div className="ws199-word-list">{puzzle.words.map((word,index)=>{
            const item=found.get(word.wordId);return <div key={word.wordId} className={cx('ws199-word',item&&'done')}><span className="ws199-word-index">{String(index+1).padStart(2,'0')}</span><div><b>{word.label}</b><small>{word.hintEs||'Vocabulario de la unidad'}</small></div><i aria-hidden="true">{item?'✓':'·'}</i></div>;
          })}</div>
          <div className="ws199-curriculum"><span>Ruta curricular</span><b>Básico I · Unidad 1</b><p>Reconocimiento visual, ortografía y asociación de vocabulario.</p><small>Práctica formativa · no nota oficial</small></div>
        </aside>
      </div>
    </section>;
  }

  global.EnglishLabWordSearchGameCS21A199=Object.freeze({VERSION:'CS21A199',GAME_ID:'WORD_SEARCH',WordSearchGameCS21A199});
})(window);
