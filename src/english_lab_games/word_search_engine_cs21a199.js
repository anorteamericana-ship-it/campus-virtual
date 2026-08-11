// CS21A199-R2 · Motor puro y determinista de Word Search.
(function installEnglishLabWordSearchEngineCS21A199(global){
  'use strict';
  if(!global || global.EnglishLabWordSearchEngineCS21A199) return;

  const VERSION='CS21A199-R2',GAME_ID='WORD_SEARCH';
  const Contract=global.EnglishLabWordSearchCurriculumCS21A199||null;
  const LETTERS='EEEEEEEEEEEEAAAAAAAAAARRRRRRRRIIIIIIIIOOOOOOOOTTTTTTTNNNNNNSSSSSSLLLLCCUUDDPPMMHHGGFBYVWJKXQZ';
  const VECTORS=Object.freeze({E:Object.freeze([0,1]),S:Object.freeze([1,0]),SE:Object.freeze([1,1]),SW:Object.freeze([1,-1]),W:Object.freeze([0,-1]),N:Object.freeze([-1,0]),NW:Object.freeze([-1,-1]),NE:Object.freeze([-1,1])});

  function clean(v){return String(v==null?'':v).trim();}
  function hash32(value){let h=2166136261;const text=clean(value);for(let i=0;i<text.length;i+=1){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function rng(seedText){let state=hash32(seedText)||1;return function(){state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
  function shuffle(values,seedText){const out=[...(Array.isArray(values)?values:[])],random=rng(seedText);for(let i=out.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function cellKey(row,col){return row+':'+col;}
  function pathKey(cells){return (cells||[]).map(c=>cellKey(c.row,c.col)).join('|');}
  function canonicalPathKey(cells){const a=pathKey(cells),b=pathKey([...(cells||[])].reverse());return a<b?a:b;}
  function inBounds(size,row,col){return row>=0&&col>=0&&row<size&&col<size;}
  function cellsFor(size,row,col,dr,dc,length){const cells=[];for(let i=0;i<length;i+=1){const r=row+dr*i,c=col+dc*i;if(!inBounds(size,r,c))return null;cells.push({row:r,col:c});}return cells;}
  function blankGrid(size){return Array.from({length:size},()=>Array(size).fill(''));}
  function copyGrid(grid){return grid.map(row=>row.slice());}

  function candidatePlacements(grid,word,directions){
    const size=grid.length,candidates=[];
    for(const direction of directions){const vector=VECTORS[direction];if(!vector)continue;const [dr,dc]=vector;
      for(let row=0;row<size;row+=1)for(let col=0;col<size;col+=1){const cells=cellsFor(size,row,col,dr,dc,word.length);if(!cells)continue;let overlap=0,blocked=false;
        for(let i=0;i<cells.length;i+=1){const c=cells[i],existing=grid[c.row][c.col];if(existing&&existing!==word[i]){blocked=true;break;}if(existing===word[i])overlap+=1;}
        if(!blocked){const end=cells[cells.length-1],center=(size-1)/2,midpointDistance=Math.abs((row+end.row)/2-center)+Math.abs((col+end.col)/2-center);candidates.push({direction,cells,overlap,midpointDistance});}
      }}return candidates;
  }
  function placeOnce(words,size,directions,seedText){
    const grid=blankGrid(size),solutions={};const ordered=[...words].sort((a,b)=>b.gridWord.length-a.gridWord.length||(hash32(seedText+'|'+a.wordId)-hash32(seedText+'|'+b.wordId)));
    for(let index=0;index<ordered.length;index+=1){const item=ordered[index],candidates=candidatePlacements(grid,item.gridWord,directions);if(!candidates.length)return null;const random=rng(seedText+'|PLACE|'+item.wordId+'|'+index);candidates.forEach(c=>{c.rank=c.overlap*100-c.midpointDistance+random()*0.25;});candidates.sort((a,b)=>b.rank-a.rank);const top=candidates.slice(0,Math.min(8,candidates.length)),chosen=top[Math.floor(random()*top.length)]||candidates[0];chosen.cells.forEach((cell,i)=>{grid[cell.row][cell.col]=item.gridWord[i];});solutions[item.wordId]=Object.freeze({wordId:item.wordId,direction:chosen.direction,cells:Object.freeze(chosen.cells.map(Object.freeze)),token:item.gridWord});}
    return {grid,solutions};
  }
  function occurrences(grid,token){const size=grid.length,found=new Map();Object.values(VECTORS).forEach(([dr,dc])=>{for(let row=0;row<size;row+=1)for(let col=0;col<size;col+=1){const cells=cellsFor(size,row,col,dr,dc,token.length);if(!cells)continue;let ok=true;for(let i=0;i<cells.length;i+=1){const c=cells[i];if(grid[c.row][c.col]!==token[i]){ok=false;break;}}if(ok)found.set(canonicalPathKey(cells),cells);}});return [...found.values()];}
  function fillAndValidate(placed,words,seedText){for(let attempt=0;attempt<80;attempt+=1){const grid=copyGrid(placed.grid),random=rng(seedText+'|FILL|'+attempt);for(let r=0;r<grid.length;r+=1)for(let c=0;c<grid.length;c+=1){if(!grid[r][c])grid[r][c]=LETTERS[Math.floor(random()*LETTERS.length)]||'E';}if(words.every(item=>occurrences(grid,item.gridWord).length===1))return grid;}return null;}

  function normalizeWords(input){
    const rows=Array.isArray(input)?input:[],seenIds=new Set(),seenTokens=new Set();
    return rows.map(item=>({wordId:clean(item.wordId||item.word_id||item.sourceItemId||item.source_item_id),sourceItemId:clean(item.sourceItemId||item.source_item_id||item.wordId||item.word_id),label:clean(item.label||item.word||item.term),gridWord:clean(item.gridWord||item.grid_word||(Contract&&Contract.gridWord?Contract.gridWord(item.label||item.word||item.term):item.label)).toUpperCase().replace(/[^A-Z]/g,''),hintEs:clean(item.hintEs||item.hint_es||item.translation||item.meaning),templateId:clean(item.templateId||item.template_id)}))
      .filter(item=>item.wordId&&item.gridWord.length>=3&&!seenIds.has(item.wordId)&&!seenTokens.has(item.gridWord)&&(seenIds.add(item.wordId),seenTokens.add(item.gridWord),true));
  }
  function puzzleFingerprint(words,seed,size,directions){const ids=words.map(w=>`${w.sourceItemId||w.wordId}:${w.gridWord}`).sort().join('|');return [VERSION,Contract?.UNIT_ID||'',size,directions.join(','),ids,clean(seed)].join('::');}

  function buildPuzzle(inputWords,seedText,options){
    const words=normalizeWords(inputWords);if(words.length<4)throw new Error('Word Search requiere al menos 4 palabras.');
    const maxLength=Math.max(...words.map(w=>w.gridWord.length)),requested=Number(options?.size||Contract?.GRID_SIZE||14)||14,size=Math.max(requested,maxLength+1);
    const directions=(Array.isArray(options?.directions)&&options.directions.length?options.directions:(Contract?.DIRECTIONS||['E','S','SE','SW'])).filter(d=>VECTORS[d]),seed=clean(seedText)||'WORD-SEARCH-CS21A199';
    const puzzleId='WS-'+hash32(puzzleFingerprint(words,seed,size,directions)).toString(16).toUpperCase();
    for(let layoutAttempt=0;layoutAttempt<64;layoutAttempt+=1){const placed=placeOnce(words,size,directions,seed+'|LAYOUT|'+layoutAttempt);if(!placed)continue;const grid=fillAndValidate(placed,words,seed+'|LAYOUT|'+layoutAttempt);if(!grid)continue;return Object.freeze({version:VERSION,gameId:GAME_ID,puzzleId,seed,size,grid:Object.freeze(grid.map(row=>Object.freeze(row.slice()))),words:Object.freeze(words.map(item=>Object.freeze({...item}))),solutions:Object.freeze({...placed.solutions}),directions:Object.freeze(directions.slice())});}
    throw new Error('No se pudo construir una cuadrícula Word Search sin ocurrencias ambiguas.');
  }

  function lineBetween(start,end){const a=start||{},b=end||{},r0=Number(a.row),c0=Number(a.col),r1=Number(b.row),c1=Number(b.col);if(![r0,c0,r1,c1].every(Number.isInteger))return [];const dr=Math.sign(r1-r0),dc=Math.sign(c1-c0),rd=Math.abs(r1-r0),cd=Math.abs(c1-c0);if(!(r0===r1||c0===c1||rd===cd))return [];const length=Math.max(rd,cd)+1;return Array.from({length},(_,i)=>({row:r0+dr*i,col:c0+dc*i}));}
  function lettersAt(grid,cells){return (cells||[]).map(c=>grid?.[c.row]?.[c.col]||'').join('');}
  function matchSelection(puzzle,cells,foundWordIds){if(!puzzle||!Array.isArray(cells)||cells.length<2)return null;const used=new Set(Array.isArray(foundWordIds)?foundWordIds:[]),key=canonicalPathKey(cells);for(const word of puzzle.words){if(used.has(word.wordId))continue;const solution=puzzle.solutions?.[word.wordId];if(solution&&canonicalPathKey(solution.cells)===key)return Object.freeze({...word,cells:Object.freeze(cells.map(Object.freeze))});}return null;}
  function publicPuzzle(puzzle){if(!puzzle)return null;return Object.freeze({version:puzzle.version,gameId:puzzle.gameId,puzzleId:puzzle.puzzleId,size:puzzle.size,grid:puzzle.grid,words:puzzle.words,directions:puzzle.directions});}
  function buildClaimAction(puzzle,word,cells,actionId,roundId){
    if(!puzzle||!word||!cells?.length)throw new Error('Selección Word Search incompleta.');const first=cells[0],last=cells[cells.length-1],id=clean(actionId),round=clean(roundId);if(!id)throw new Error('Word Search requiere action_id.');if(!round)throw new Error('Word Search requiere round_id.');
    return Object.freeze({action:'CLAIM_WORD',action_id:id,game_id:GAME_ID,round_id:round,puzzle_id:puzzle.puzzleId,word_id:word.wordId,start:Object.freeze({row:first.row,col:first.col}),end:Object.freeze({row:last.row,col:last.col})});
  }

  global.EnglishLabWordSearchEngineCS21A199=Object.freeze({VERSION,GAME_ID,VECTORS,clean,hash32,rng,shuffle,cellKey,pathKey,canonicalPathKey,cellsFor,occurrences,normalizeWords,puzzleFingerprint,buildPuzzle,lineBetween,lettersAt,matchSelection,publicPuzzle,buildClaimAction});
})(window);
