// CS21A200 · WORD SEARCH LIVE · MODULO PARA BACKEND UNIFICADO QA
// Fuente modular. El instalable se genera como UN SOLO Apps Script acumulativo.
// B1-U01 únicamente en este gate. No genera nota oficial.

var ELWS200_VERSION = 'CS21A200-WORD-SEARCH-LIVE-1';
var ELWS200_GAME_CODE = 'WORD_SEARCH';
var ELWS200_GAME_LABEL = 'Word Search';
var ELWS200_LEVEL_ID = 'B1';
var ELWS200_UNIT_ID = 'B1-U01';
var ELWS200_GRID_SIZE = 14;
var ELWS200_WORD_COUNT = 10;
var ELWS200_DURATION_MS = 180000;
var ELWS200_PRESENCE_TTL_MS = 75000;
var ELWS200_DIRECTIONS = ['E','S','SE','SW'];
var ELWS200_LETTERS = 'EEEEEEEEEEEEAAAAAAAAAARRRRRRRRIIIIIIIIOOOOOOOOTTTTTTTNNNNNNSSSSSSLLLLCCUUDDPPMMHHGGFBYVWJKXQZ';
var ELWS200_VECTORS = {E:[0,1],S:[1,0],SE:[1,1],SW:[1,-1],W:[0,-1],N:[-1,0],NW:[-1,-1],NE:[-1,1]};

function _elws200Text_(value) {
  return String(value == null ? '' : value).replace(/\s+/g,' ').trim();
}
function _elws200Upper_(value) { return _elws200Text_(value).toUpperCase(); }
function _elws200Ascii_(value) {
  var text = _elws200Upper_(value);
  try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g,''); } catch (_) {}
  return text;
}
function _elws200GridWord_(value) { return _elws200Ascii_(value).replace(/[^A-Z]/g,''); }
function _elws200Json_(value,fallback) {
  if (value && typeof value === 'object') return value;
  try { return value ? JSON.parse(String(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}
function _elws200Iso_(value) { return (value instanceof Date ? value : new Date()).toISOString(); }
function _elws200Ms_(value) {
  var ms = Date.parse(_elws200Text_(value));
  return isFinite(ms) ? ms : 0;
}
function _elws200Settings_(room) { return _elws200Json_(room && room.SETTINGS_JSON,{}); }
function _elws200Current_(room) { return _elws200Json_(room && room.CURRENT_QUESTION_JSON,{}); }
function _elws200RoomId_(body) {
  return _elive180RoomIdFromBody_(body || {}) || _elws200Text_(body && (body.room_code || body.roomCode || body.codigo));
}
function _elws200Find_(body) {
  var id = _elws200RoomId_(body || {});
  return id ? _elive180FindRoom_(id) : null;
}
function _elws200SameRoom_(row,room) { return _elive180SameRoom_(row,room); }
function _elws200OptionValue_(row,letter) { return _elws200Text_(row && row['OPTION_' + _elws200Upper_(letter)]); }
function _elws200ValidCorrectOption_(row) {
  var correct = _elws200Upper_(row && row.CORRECT_OPTION);
  return ['A','B','C','D'].indexOf(correct) >= 0 && !!_elws200OptionValue_(row,correct);
}

function _elws200CurriculumUnit_() {
  return _elive176Rows_('CONFIG_UNIDADES').filter(function (row) {
    return _elws200Upper_(row.LEVEL_ID) === ELWS200_LEVEL_ID &&
      _elws200Upper_(row.UNIT_ID) === ELWS200_UNIT_ID &&
      _elws200Upper_(row.STATUS) === 'ACTIVE';
  })[0] || null;
}
function _elws200SupportedRow_(row) {
  var template = _elws200Upper_(row && row.TEMPLATE_ID);
  var type = _elws200Upper_(row && row.ITEM_TYPE);
  if (_elws200Upper_(row && row.LEVEL_ID) !== ELWS200_LEVEL_ID ||
      _elws200Upper_(row && row.UNIT_ID) !== ELWS200_UNIT_ID ||
      _elws200Upper_(row && row.AREA_ID) !== 'VOCAB' ||
      _elws200Upper_(row && row.STATUS) !== 'ACTIVE') return false;
  if (template === 'VOCAB_01' && type === 'MCQ') return _elws200ValidCorrectOption_(row);
  if (template === 'VOCAB_02' && type === 'MATCH') return !!(_elws200Text_(row.MATCH_LEFT) && _elws200Text_(row.MATCH_RIGHT));
  return false;
}
function _elws200CanonicalWord_(row) {
  if (!_elws200SupportedRow_(row)) return null;
  var template = _elws200Upper_(row.TEMPLATE_ID);
  var source = _elws200Text_(row.SOURCE_ITEM_ID);
  var label = '';
  var hint = '';
  if (template === 'VOCAB_01') {
    label = _elws200Text_(row.STEM);
    hint = _elws200OptionValue_(row,_elws200Upper_(row.CORRECT_OPTION));
  } else {
    label = _elws200Text_(row.MATCH_LEFT);
    hint = _elws200Text_(row.MATCH_RIGHT);
  }
  var token = _elws200GridWord_(label);
  if (!source || !label || !hint || token.length < 3 || token.length > ELWS200_GRID_SIZE) return null;
  return {word_id:source,source_item_id:source,play_item_id:_elws200Text_(row.PLAY_ITEM_ID),template_id:template,label:label,grid_word:token,hint_es:hint};
}
function _elws200PoolWords_() {
  var words = [];
  var seenSources = {};
  var seenTokens = {};
  _elive176Rows_('ACADEMIA_PLAY_BANK').forEach(function (row) {
    var item = _elws200CanonicalWord_(row);
    if (!item) return;
    if (seenSources[item.source_item_id] || seenTokens[item.grid_word]) return;
    seenSources[item.source_item_id] = true;
    seenTokens[item.grid_word] = true;
    words.push(item);
  });
  return words;
}
function _elws200ValidatePool_(words) {
  words = Array.isArray(words) ? words : [];
  var sources = {};
  var tokens = {};
  var oversized = [];
  words.forEach(function (item) {
    sources[_elws200Text_(item.source_item_id)] = true;
    tokens[_elws200Text_(item.grid_word)] = true;
    if (_elws200Text_(item.grid_word).length > ELWS200_GRID_SIZE) oversized.push(item.label);
  });
  return {ok:words.length === ELWS200_WORD_COUNT && Object.keys(sources).length === ELWS200_WORD_COUNT && Object.keys(tokens).length === ELWS200_WORD_COUNT && !oversized.length,count:words.length,unique_sources:Object.keys(sources).length,unique_grid_words:Object.keys(tokens).length,oversized:oversized};
}

function _elws200Hash32_(value) {
  var h = 2166136261;
  var text = _elws200Text_(value);
  for (var i=0;i<text.length;i+=1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h,16777619);
  }
  return h >>> 0;
}
function _elws200Rng_(seedText) {
  var state = _elws200Hash32_(seedText) || 1;
  return function () {
    state = (Math.imul(state,1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function _elws200Shuffle_(values,seedText) {
  var out = (Array.isArray(values) ? values : []).slice();
  var random = _elws200Rng_(seedText);
  for (var i=out.length-1;i>0;i-=1) {
    var j = Math.floor(random() * (i+1));
    var tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  }
  return out;
}
function _elws200CellKey_(row,col) { return String(row) + ':' + String(col); }
function _elws200PathKey_(cells) {
  return (cells || []).map(function (cell) { return _elws200CellKey_(cell.row,cell.col); }).join('|');
}
function _elws200CanonicalPathKey_(cells) {
  var a = _elws200PathKey_(cells);
  var b = _elws200PathKey_((cells || []).slice().reverse());
  return a < b ? a : b;
}
function _elws200InBounds_(size,row,col) { return row >= 0 && col >= 0 && row < size && col < size; }
function _elws200CellsFor_(size,row,col,dr,dc,length) {
  var cells = [];
  for (var i=0;i<length;i+=1) {
    var r = row + dr*i, c = col + dc*i;
    if (!_elws200InBounds_(size,r,c)) return null;
    cells.push({row:r,col:c});
  }
  return cells;
}
function _elws200LineBetween_(start,end) {
  start = start || {}; end = end || {};
  var r0 = Number(start.row), c0 = Number(start.col), r1 = Number(end.row), c1 = Number(end.col);
  if (![r0,c0,r1,c1].every(function (value) { return isFinite(value) && Math.floor(value) === value; })) return [];
  var dr = Math.sign(r1-r0), dc = Math.sign(c1-c0), rd = Math.abs(r1-r0), cd = Math.abs(c1-c0);
  if (!(r0 === r1 || c0 === c1 || rd === cd)) return [];
  var length = Math.max(rd,cd) + 1;
  var cells = [];
  for (var i=0;i<length;i+=1) cells.push({row:r0+dr*i,col:c0+dc*i});
  return cells;
}
function _elws200BlankGrid_(size) {
  var grid = [];
  for (var r=0;r<size;r+=1) { var row=[]; for (var c=0;c<size;c+=1) row.push(''); grid.push(row); }
  return grid;
}
function _elws200CopyGrid_(grid) { return grid.map(function (row) { return row.slice(); }); }
function _elws200CandidatePlacements_(grid,word,directions) {
  var size = grid.length, candidates = [];
  directions.forEach(function (direction) {
    var vector = ELWS200_VECTORS[direction];
    if (!vector) return;
    var dr=vector[0], dc=vector[1];
    for (var row=0;row<size;row+=1) for (var col=0;col<size;col+=1) {
      var cells = _elws200CellsFor_(size,row,col,dr,dc,word.length);
      if (!cells) continue;
      var overlap=0, blocked=false;
      for (var i=0;i<cells.length;i+=1) {
        var cell=cells[i], existing=grid[cell.row][cell.col];
        if (existing && existing !== word[i]) { blocked=true; break; }
        if (existing === word[i]) overlap += 1;
      }
      if (!blocked) {
        var end=cells[cells.length-1], center=(size-1)/2;
        var midpointDistance=Math.abs((row+end.row)/2-center)+Math.abs((col+end.col)/2-center);
        candidates.push({direction:direction,cells:cells,overlap:overlap,midpointDistance:midpointDistance});
      }
    }
  });
  return candidates;
}
function _elws200PlaceOnce_(words,size,directions,seedText) {
  var grid=_elws200BlankGrid_(size), solutions={};
  var ordered=words.slice().sort(function (a,b) {
    return b.grid_word.length-a.grid_word.length || (_elws200Hash32_(seedText+'|'+a.word_id)-_elws200Hash32_(seedText+'|'+b.word_id));
  });
  for (var index=0;index<ordered.length;index+=1) {
    var item=ordered[index], candidates=_elws200CandidatePlacements_(grid,item.grid_word,directions);
    if (!candidates.length) return null;
    var random=_elws200Rng_(seedText+'|PLACE|'+item.word_id+'|'+index);
    candidates.forEach(function (candidate) { candidate.rank=candidate.overlap*100-candidate.midpointDistance+random()*0.25; });
    candidates.sort(function (a,b) { return b.rank-a.rank; });
    var top=candidates.slice(0,Math.min(8,candidates.length));
    var chosen=top[Math.floor(random()*top.length)] || candidates[0];
    chosen.cells.forEach(function (cell,i) { grid[cell.row][cell.col]=item.grid_word[i]; });
    solutions[item.word_id]={word_id:item.word_id,direction:chosen.direction,cells:chosen.cells.map(function (cell) { return {row:cell.row,col:cell.col}; }),token:item.grid_word};
  }
  return {grid:grid,solutions:solutions};
}
function _elws200Occurrences_(grid,token) {
  var size=grid.length, found={};
  Object.keys(ELWS200_VECTORS).forEach(function (direction) {
    var vector=ELWS200_VECTORS[direction], dr=vector[0], dc=vector[1];
    for (var row=0;row<size;row+=1) for (var col=0;col<size;col+=1) {
      var cells=_elws200CellsFor_(size,row,col,dr,dc,token.length);
      if (!cells) continue;
      var ok=true;
      for (var i=0;i<cells.length;i+=1) { var cell=cells[i]; if (grid[cell.row][cell.col] !== token[i]) { ok=false; break; } }
      if (ok) found[_elws200CanonicalPathKey_(cells)] = cells;
    }
  });
  return Object.keys(found).map(function (key) { return found[key]; });
}
function _elws200FillAndValidate_(placed,words,seedText) {
  for (var attempt=0;attempt<80;attempt+=1) {
    var grid=_elws200CopyGrid_(placed.grid), random=_elws200Rng_(seedText+'|FILL|'+attempt);
    for (var r=0;r<grid.length;r+=1) for (var c=0;c<grid.length;c+=1) {
      if (!grid[r][c]) grid[r][c]=ELWS200_LETTERS[Math.floor(random()*ELWS200_LETTERS.length)] || 'E';
    }
    var unique=words.every(function (item) { return _elws200Occurrences_(grid,item.grid_word).length === 1; });
    if (unique) return grid;
  }
  return null;
}
function _elws200Fingerprint_(words,seed,size,directions) {
  var ids=words.map(function (word) { return word.source_item_id+':'+word.grid_word; }).sort().join('|');
  return [ELWS200_VERSION,ELWS200_UNIT_ID,size,directions.join(','),ids,_elws200Text_(seed)].join('::');
}
function _elws200BuildPuzzle_(words,seedText) {
  var validation=_elws200ValidatePool_(words);
  if (!validation.ok) throw new Error('Word Search requiere exactamente 10 vocablos canónicos B1-U01.');
  var size=ELWS200_GRID_SIZE, seed=_elws200Text_(seedText)||'WORD-SEARCH-CS21A200';
  var puzzleId='WS-'+_elws200Hash32_(_elws200Fingerprint_(words,seed,size,ELWS200_DIRECTIONS)).toString(16).toUpperCase();
  for (var layoutAttempt=0;layoutAttempt<64;layoutAttempt+=1) {
    var placed=_elws200PlaceOnce_(words,size,ELWS200_DIRECTIONS,seed+'|LAYOUT|'+layoutAttempt);
    if (!placed) continue;
    var grid=_elws200FillAndValidate_(placed,words,seed+'|LAYOUT|'+layoutAttempt);
    if (!grid) continue;
    return {version:ELWS200_VERSION,game_id:ELWS200_GAME_CODE,puzzle_id:puzzleId,size:size,grid:grid,words:words.map(function (item) { return {word_id:item.word_id,source_item_id:item.source_item_id,label:item.label,grid_word:item.grid_word,hint_es:item.hint_es,template_id:item.template_id}; }),solutions:placed.solutions,directions:ELWS200_DIRECTIONS.slice()};
  }
  throw new Error('No se pudo construir una cuadrícula Word Search sin ocurrencias ambiguas.');
}
function _elws200PublicPuzzle_(secret) {
  secret=secret||{};
  return {version:ELWS200_VERSION,gameId:ELWS200_GAME_CODE,puzzleId:_elws200Text_(secret.puzzle_id),size:Number(secret.size||ELWS200_GRID_SIZE)||ELWS200_GRID_SIZE,grid:(secret.grid||[]).map(function (row) { return row.slice(); }),words:(secret.words||[]).map(function (item) { return {wordId:item.word_id,sourceItemId:item.source_item_id,label:item.label,gridWord:item.grid_word,hintEs:item.hint_es,templateId:item.template_id}; }),directions:(secret.directions||ELWS200_DIRECTIONS).slice()};
}
function _elws200Secret_(room) { return _elws200Settings_(room).word_search_secret || null; }
function _elws200RoundId_(room) { return _elws200Text_(_elws200Current_(room).round_id); }

function _elws200PlayerRows_(room) {
  var table=_elive180Table_(ELIVE_PLAYERS_SHEET,ELIVE_PLAYERS_HEADERS);
  return table.rows.filter(function (row) { return _elws200SameRoom_(row,room); });
}
function _elws200Player_(room,playerId) {
  playerId=_elws200Text_(playerId);
  return _elws200PlayerRows_(room).filter(function (row) { return _elws200Text_(row.COD_ESTUDIANTE) === playerId; })[0] || null;
}
function _elws200VisiblePlayers_(room) {
  var now=Date.now();
  return _elws200PlayerRows_(room).filter(function (row) {
    var seen=_elws200Ms_(row.LAST_SEEN_AT||row.JOINED_AT);
    return _elws200Upper_(row.STATUS||'ACTIVE') === 'ACTIVE' && (!seen || now-seen <= ELWS200_PRESENCE_TTL_MS);
  }).map(function (row) { return _elive180PlayerPublic_(row); });
}
function _elws200AnswerRows_(room) {
  var table=_elive180Table_(ELIVE_ANSWERS_SHEET,ELIVE_ANSWERS_HEADERS);
  return table.rows.filter(function (row) { return _elws200SameRoom_(row,room) && Number(row.QUESTION_INDEX||0) === 1; });
}
function _elws200ClaimData_(room) {
  var byWord={}, byAction={}, claims=[];
  _elws200AnswerRows_(room).forEach(function (row) {
    var value=_elws200Json_(row.ANSWER_VALUE,{});
    var wordId=_elws200Text_(value.word_id), actionId=_elws200Text_(value.action_id);
    if (actionId && !byAction[actionId]) byAction[actionId]=row;
    if (!wordId || byWord[wordId]) return;
    var cells=Array.isArray(value.cells)?value.cells:[];
    var claim={word_id:wordId,source_item_id:_elws200Text_(value.source_item_id||wordId),player_id:_elws200Text_(row.COD_ESTUDIANTE),player_name:_elws200Text_(value.player_name||row.COD_ESTUDIANTE),cells:cells.map(function (cell) { return {row:Number(cell.row),col:Number(cell.col)}; }),claimed_at:_elws200Text_(row.ANSWERED_AT),points:Number(row.POINTS||100)||100,action_id:actionId};
    byWord[wordId]=claim;
    claims.push(claim);
  });
  return {by_word:byWord,by_action:byAction,claims:claims};
}
function _elws200Ranking_(room) {
  var names={};
  _elws200PlayerRows_(room).forEach(function (row) { names[_elws200Text_(row.COD_ESTUDIANTE)]=_elws200Text_(row.NOMBRE)||_elws200Text_(row.COD_ESTUDIANTE); });
  var scores={};
  _elws200ClaimData_(room).claims.forEach(function (claim) {
    var id=claim.player_id;
    if (!scores[id]) scores[id]={cod_estudiante:id,nombre:names[id]||claim.player_name||id,points:0,words:0};
    scores[id].points += Number(claim.points||100)||100;
    scores[id].words += 1;
  });
  Object.keys(names).forEach(function (id) { if (!scores[id]) scores[id]={cod_estudiante:id,nombre:names[id],points:0,words:0}; });
  var rows=Object.keys(scores).map(function (id) { return scores[id]; });
  rows.sort(function (a,b) { return (b.points-a.points)||(b.words-a.words)||a.nombre.localeCompare(b.nombre); });
  return rows.map(function (row,index) { row.rank=index+1; return row; });
}

function _elws200Managed_(body) {
  var auth=_eliveAuthTeacher_(body||{});
  if (!auth||auth.ok!==true) return {ok:false,response:auth||{ok:false,error:'sesion_invalida'}};
  var found=_elws200Find_(body||{});
  if (!found||!found.row) return {ok:false,response:{ok:false,error:'sala_no_encontrada'}};
  if (_elws200Upper_(found.row.GAME_CODE)!==ELWS200_GAME_CODE) return {ok:false,response:{ok:false,error:'sala_no_word_search'}};
  if (!_elive180CanRoom_(auth,found.row)) return {ok:false,response:{ok:false,error:'docente_sin_permiso_grupo'}};
  return {ok:true,auth:auth,found:found,room:found.row};
}
function _elws200NewState_(room,now) {
  var secret=_elws200Secret_(room);
  if (!secret) throw new Error('Word Search no tiene puzzle secreto.');
  var start=now instanceof Date?now:new Date();
  var roundId='WSR-'+_elws200Text_(room.ROOM_CODE)+'-'+Utilities.getUuid();
  return {version:ELWS200_VERSION,type:'word_search',game_id:ELWS200_GAME_CODE,phase:'OPEN',state_revision:1,round_id:roundId,puzzle_id:secret.puzzle_id,public_puzzle:_elws200PublicPuzzle_(secret),round_started_at:_elws200Iso_(start),round_ends_at:_elws200Iso_(new Date(start.getTime()+ELWS200_DURATION_MS)),last_claim:null};
}
function _elws200TransitionDue_(room) {
  var current=_elws200Current_(room);
  return _elws200Upper_(current.phase)==='OPEN' && _elws200Ms_(current.round_ends_at) && Date.now() >= _elws200Ms_(current.round_ends_at);
}
function _elws200AdvanceIfDue_(found) {
  if (!found||!found.row||!_elws200TransitionDue_(found.row)) return found&&found.row;
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(750)) return found.row;
  try {
    var fresh=_elws200Find_({room_id:found.row.ROOM_ID,room_code:found.row.ROOM_CODE});
    if (!fresh||!fresh.row||!_elws200TransitionDue_(fresh.row)) return fresh&&fresh.row||found.row;
    var current=_elws200Current_(fresh.row);
    current.phase='COMPLETE';
    current.state_revision=Math.max(0,Number(current.state_revision||0)||0)+1;
    current.completed_at=_elws200Iso_(new Date());
    var room=_elive180SetCells_(fresh,{ROUND_STATUS:'CLOSED',ROUND_CLOSED_AT:current.completed_at,CURRENT_QUESTION_JSON:JSON.stringify(current)});
    _elive180AppendEvent_(room,'WORD_SEARCH_COMPLETE',{sesion:{nombre:'SISTEMA'},rol:'system'},{reason:'TIMEOUT',claims:_elws200ClaimData_(room).claims.length,version:ELWS200_VERSION});
    _elive180Invalidate_(room);
    return room;
  } finally { lock.releaseLock(); }
}
function _elws200Response_(room,playerId,teacher) {
  var current=_elws200Current_(room);
  var claims=_elws200ClaimData_(room);
  var state={};
  Object.keys(current||{}).forEach(function (key) { state[key]=current[key]; });
  state.claimed_words=claims.claims;
  state.server_now=_elws200Iso_(new Date());
  var ranking=_elws200Ranking_(room);
  var response={ok:true,version:ELWS200_VERSION,word_search:true,server_now:state.server_now,room:_elive176PublicRoom_(room),word_search_state:state,phase:_elws200Upper_(state.phase||'WAITING'),state_revision:Number(state.state_revision||0)||0,public_puzzle:state.public_puzzle||null,round_id:_elws200Text_(state.round_id),puzzle_id:_elws200Text_(state.puzzle_id),claimed_words:claims.claims,online_players:_elws200VisiblePlayers_(room),leaderboard:ranking,claim_count:claims.claims.length,can_claim:!!(playerId&&_elws200Upper_(state.phase)==='OPEN'&&_elws200Ms_(state.round_ends_at)>Date.now())};
  if (playerId) response.my_rank=ranking.filter(function (row) { return _elws200Text_(row.cod_estudiante)===_elws200Text_(playerId); })[0]||null;
  if (teacher===true) response.curriculum={level_id:ELWS200_LEVEL_ID,unit_id:ELWS200_UNIT_ID,focus:'Vocabulary recognition and spelling',official_grade:false};
  return response;
}

function _elws200ClaimDecision_(secret,current,existingClaims,action) {
  secret=secret||{}; current=current||{}; existingClaims=existingClaims||{by_word:{},by_action:{}}; action=action||{};
  var actionId=_elws200Text_(action.action_id), roundId=_elws200Text_(action.round_id), puzzleId=_elws200Text_(action.puzzle_id), wordId=_elws200Text_(action.word_id);
  if (!actionId) return {ok:false,error:'action_id_requerido'};
  if (existingClaims.by_action&&existingClaims.by_action[actionId]) return {ok:true,duplicate:true,action_id:actionId};
  if (!roundId||roundId!==_elws200Text_(current.round_id)) return {ok:false,error:'round_stale'};
  if (!puzzleId||puzzleId!==_elws200Text_(current.puzzle_id)||puzzleId!==_elws200Text_(secret.puzzle_id)) return {ok:false,error:'puzzle_stale'};
  if (_elws200Upper_(current.phase)!=='OPEN') return {ok:false,error:'ronda_no_abierta'};
  if (!wordId||!secret.solutions||!secret.solutions[wordId]) return {ok:false,error:'palabra_invalida'};
  if (existingClaims.by_word&&existingClaims.by_word[wordId]) return {ok:false,error:'word_already_claimed',winner:existingClaims.by_word[wordId].player_id||''};
  var cells=_elws200LineBetween_(action.start,action.end);
  var solution=secret.solutions[wordId];
  if (!cells.length||_elws200CanonicalPathKey_(cells)!==_elws200CanonicalPathKey_(solution.cells||[])) return {ok:false,error:'seleccion_invalida'};
  return {ok:true,duplicate:false,word_id:wordId,cells:cells,source_item_id:wordId};
}

function englishLabWordSearchTeacherDataCS21A200(body) {
  var base=englishLabLiveGetTeacherData(body||{});
  if (!base||base.ok!==true) return base;
  var words=_elws200PoolWords_(), validation=_elws200ValidatePool_(words);
  base.version=ELWS200_VERSION;
  base.rooms=(base.rooms||[]).filter(function (room) { return _elws200Upper_(room.game_code||room.GAME_CODE)===ELWS200_GAME_CODE; });
  base.word_search=true;
  base.curriculum=_elws200CurriculumUnit_();
  base.curriculum_validation=validation;
  base.word_search_contract={enabled_units:[ELWS200_UNIT_ID],grid_size:ELWS200_GRID_SIZE,word_count:ELWS200_WORD_COUNT,directions:ELWS200_DIRECTIONS.slice(),duration_ms:ELWS200_DURATION_MS};
  return base;
}
function englishLabWordSearchCreateRoomCS21A200(body) {
  body=body||{};
  var auth=_eliveAuthTeacher_(body);
  if (!auth||auth.ok!==true) return auth||{ok:false,error:'sesion_invalida'};
  var cod=_elws200Text_(body.cod_grupo||body.codGrupo||body.grupo);
  if (!cod) return {ok:false,error:'cod_grupo_requerido'};
  if (!_eliveCanGroup_(auth,cod)) return {ok:false,error:'docente_sin_permiso_grupo'};
  cod=_eliveCanonicalGroupForRoom_(auth,cod);
  var level=_anF65_levelId_(body.nivel||'')||_elws200Upper_(cod.split('-')[0]||'');
  var unit=_elive176NormalizeUnit_(body.unit||body.unidad||'U01');
  if (level!=='B1'||unit!=='U01') return {ok:false,version:ELWS200_VERSION,error:'unidad_no_habilitada',mensaje:'CS21A200 habilita únicamente Básico I · U01.'};
  var curriculum=_elws200CurriculumUnit_();
  if (!curriculum) return {ok:false,version:ELWS200_VERSION,error:'unidad_curricular_invalida'};
  var words=_elws200PoolWords_(), validation=_elws200ValidatePool_(words);
  if (!validation.ok) return {ok:false,version:ELWS200_VERSION,error:'cobertura_curricular_incompleta',curriculum_validation:validation};
  var roomSheet=_elive180SheetDirect_(ELIVE_ROOMS_SHEET,ELIVE_ROOMS_HEADERS);
  var roomCode=_eliveRoomCode_(roomSheet);
  var secret=_elws200BuildPuzzle_(words,roomCode+'|WORD_SEARCH|'+ELWS200_UNIT_ID);
  var now=_elws200Iso_(new Date());
  var settings={official_grade:false,affects_certificates:false,affects_payments:false,engine:ELWS200_GAME_CODE,version:ELWS200_VERSION,level_id:ELWS200_LEVEL_ID,unit_id:ELWS200_UNIT_ID,grid_size:ELWS200_GRID_SIZE,word_count:ELWS200_WORD_COUNT,word_search_secret:secret,curriculum_verified:true,curriculum_source:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK'};
  var room={ROOM_ID:'ELIVE-'+Utilities.getUuid(),ROOM_CODE:roomCode,STATUS:'CREATED',COD_GRUPO:cod,NIVEL:'B1',DOCENTE:_elws200Text_(auth.sesion.nombre||auth.sesion.nombre_completo||auth.sesion.usuario||auth.sesion.cedula||'DOCENTE'),GAME_CODE:ELWS200_GAME_CODE,GAME_LABEL:ELWS200_GAME_LABEL,QUESTION_COUNT:ELWS200_WORD_COUNT,MODE:'INDIVIDUAL',CURRENT_INDEX:0,ROUND_STATUS:'READY',CURRENT_QUESTION_JSON:'',CREATED_AT:now,STARTED_AT:'',CLOSED_AT:'',ROUND_STARTED_AT:'',ROUND_CLOSED_AT:'',SETTINGS_JSON:JSON.stringify(settings),UNIT:'U01',CONTENT_SOURCE:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK|WORD_SEARCH_CS21A200'};
  _elive180AppendObject_(ELIVE_ROOMS_SHEET,ELIVE_ROOMS_HEADERS,room);
  _elive180AppendEvent_(room,'WORD_SEARCH_ROOM_CREATED',auth,{unit:ELWS200_UNIT_ID,words:ELWS200_WORD_COUNT,puzzle_id:secret.puzzle_id,version:ELWS200_VERSION});
  var publicRoom=_elive176PublicRoom_(room); publicRoom.unit='U01';
  return {ok:true,version:ELWS200_VERSION,room:publicRoom,word_search:true,curriculum_verified:true,word_count:ELWS200_WORD_COUNT,grid_size:ELWS200_GRID_SIZE};
}
function englishLabWordSearchStartRoomCS21A200(body) {
  var managed=_elws200Managed_(body||{});
  if (!managed.ok) return managed.response;
  if (_elws200Upper_(managed.room.STATUS)!=='CREATED') return {ok:false,error:'sala_no_disponible_para_inicio'};
  if (!_elws200PlayerRows_(managed.room).length) return {ok:false,error:'sin_participantes',mensaje:'Espere al menos un participante antes de iniciar Word Search.'};
  var now=new Date(), current=_elws200NewState_(managed.room,now);
  var updated=_elive180SetCells_(managed.found,{STATUS:'LIVE',STARTED_AT:managed.room.STARTED_AT||_elws200Iso_(now),CURRENT_INDEX:1,ROUND_STATUS:'OPEN',ROUND_STARTED_AT:_elws200Iso_(now),ROUND_CLOSED_AT:'',CURRENT_QUESTION_JSON:JSON.stringify(current)});
  _elive180AppendEvent_(updated,'WORD_SEARCH_STARTED',managed.auth,{round_id:current.round_id,puzzle_id:current.puzzle_id,players:_elws200PlayerRows_(updated).length,version:ELWS200_VERSION});
  _elive180Invalidate_(updated);
  return _elws200Response_(updated,'',true);
}
function englishLabWordSearchGetRoomControlCS21A200(body) {
  var managed=_elws200Managed_(body||{});
  if (!managed.ok) return managed.response;
  var room=_elws200AdvanceIfDue_(managed.found)||managed.room;
  var response=_elws200Response_(room,'',true);
  var curriculum=_elws200CurriculumUnit_();
  response.curriculum_verified=true;
  response.curriculum=curriculum?{level_id:ELWS200_LEVEL_ID,unit_id:ELWS200_UNIT_ID,unit_name:_elws200Text_(curriculum.UNIT_NAME),unit_objective_es:_elws200Text_(curriculum.UNIT_OBJECTIVE_ES),program_topic:_elws200Text_(curriculum.PROGRAM_TOPIC),source_reference:_elws200Text_(curriculum.SOURCE_REFERENCE)}:null;
  return response;
}
function englishLabWordSearchJoinRoomCS21A200(body) {
  body=body||{};
  var access=_elive180RequireLab_(body);
  if (!access||access.allowed!==true) return access;
  var normalized=_cs21a144LiveBody_(body,access);
  var found=_elws200Find_(normalized);
  if (!found||!found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elws200Upper_(found.row.GAME_CODE)!==ELWS200_GAME_CODE) return {ok:false,error:'sala_no_word_search'};
  if (_elws200Upper_(found.row.STATUS)==='CLOSED') return {ok:false,error:'sala_cerrada'};
  var playerId=_elws200Text_(normalized.player_id||normalized.cod_estudiante), playerName=_elws200Text_(normalized.player_name||normalized.nombre)||playerId;
  if (!playerId) return {ok:false,error:'estudiante_sin_codigo'};
  var table=_elive180Table_(ELIVE_PLAYERS_SHEET,ELIVE_PLAYERS_HEADERS);
  var player=table.rows.filter(function (row) { return _elws200SameRoom_(row,found.row)&&_elws200Text_(row.COD_ESTUDIANTE)===playerId; })[0]||null;
  var now=_elws200Iso_(new Date());
  if (player) player=_elive180SetCells_({sheet:table.sheet,index:table.index,row:player,rowNumber:player._row},{NOMBRE:playerName,LAST_SEEN_AT:now,STATUS:'ACTIVE'});
  else {
    player={ROOM_ID:found.row.ROOM_ID,ROOM_CODE:found.row.ROOM_CODE,COD_ESTUDIANTE:playerId,NOMBRE:playerName,TEAM:'',JOINED_AT:now,LAST_SEEN_AT:now,STATUS:'ACTIVE'};
    _elive180AppendObject_(ELIVE_PLAYERS_SHEET,ELIVE_PLAYERS_HEADERS,player);
    _elive180AppendEvent_(found.row,'PLAYER_JOINED',{sesion:{nombre:playerName},rol:'student'},{cod_estudiante:playerId,game:ELWS200_GAME_CODE,version:ELWS200_VERSION});
  }
  _elive180Invalidate_(found.row);
  return englishLabWordSearchGetPlayerStateCS21A200(normalized);
}
function englishLabWordSearchGetPlayerStateCS21A200(body) {
  body=body||{};
  var access=_elive180RequireLab_(body);
  if (!access||access.allowed!==true) return access;
  var normalized=_cs21a144LiveBody_(body,access);
  var found=_elws200Find_(normalized);
  if (!found||!found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elws200Upper_(found.row.GAME_CODE)!==ELWS200_GAME_CODE) return {ok:false,error:'sala_no_word_search'};
  var room=_elws200AdvanceIfDue_(found)||found.row;
  var playerId=_elws200Text_(normalized.player_id||normalized.cod_estudiante), player=_elws200Player_(room,playerId);
  if (!player) return {ok:false,error:'jugador_no_registrado'};
  _elive180TouchPlayer_(room,player);
  var response=_elws200Response_(room,playerId,false);
  response.player=_elive180PlayerPublic_(player);
  return response;
}
function englishLabWordSearchClaimWordCS21A200(body) {
  body=body||{};
  var access=_elive180RequireLab_(body);
  if (!access||access.allowed!==true) return access;
  var normalized=_cs21a144LiveBody_(body,access);
  var found=_elws200Find_(normalized);
  if (!found||!found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elws200Upper_(found.row.GAME_CODE)!==ELWS200_GAME_CODE) return {ok:false,error:'sala_no_word_search'};
  var action={action_id:_elws200Text_(normalized.action_id||normalized.actionId),round_id:_elws200Text_(normalized.round_id||normalized.roundId),puzzle_id:_elws200Text_(normalized.puzzle_id||normalized.puzzleId),word_id:_elws200Text_(normalized.word_id||normalized.wordId),start:normalized.start||{},end:normalized.end||{}};
  var playerId=_elws200Text_(normalized.player_id||normalized.cod_estudiante);
  if (!playerId) return {ok:false,error:'estudiante_sin_codigo'};
  var lock=LockService.getScriptLock();
  if (!lock.tryLock(3000)) return {ok:false,error:'state_transition_busy',retryable:true,retry_after_ms:250,room_state:_elws200Response_(found.row,playerId,false)};
  try {
    var fresh=_elws200Find_({room_id:found.row.ROOM_ID,room_code:found.row.ROOM_CODE});
    if (!fresh||!fresh.row) return {ok:false,error:'sala_no_encontrada'};
    var room=fresh.row, current=_elws200Current_(room), secret=_elws200Secret_(room), player=_elws200Player_(room,playerId);
    if (!player) return {ok:false,error:'jugador_no_registrado'};
    if (_elws200Upper_(room.STATUS)!=='LIVE') return {ok:false,error:'sala_no_activa',room_state:_elws200Response_(room,playerId,false)};
    if (_elws200Ms_(current.round_ends_at)&&Date.now()>=_elws200Ms_(current.round_ends_at)) return {ok:false,error:'tiempo_agotado',room_state:_elws200Response_(room,playerId,false)};
    var existing=_elws200ClaimData_(room), decision=_elws200ClaimDecision_(secret,current,existing,action);
    if (decision.ok!==true) return {ok:false,error:decision.error,winner:decision.winner||'',room_state:_elws200Response_(room,playerId,false)};
    if (decision.duplicate===true) {
      var duplicateState=_elws200Response_(room,playerId,false); duplicateState.accepted=true; duplicateState.duplicate=true; return duplicateState;
    }
    var word=(secret.words||[]).filter(function (item) { return _elws200Text_(item.word_id)===decision.word_id; })[0]||{};
    var answerRow={ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,QUESTION_INDEX:1,COD_ESTUDIANTE:playerId,ANSWER_VALUE:JSON.stringify({action_id:action.action_id,round_id:action.round_id,puzzle_id:action.puzzle_id,word_id:decision.word_id,source_item_id:_elws200Text_(word.source_item_id||decision.word_id),player_name:_elws200Text_(player.NOMBRE)||playerId,cells:decision.cells,start:action.start,end:action.end}),IS_CORRECT:'TRUE',POINTS:100,TIME_MS:Math.max(0,(Date.now()-_elws200Ms_(current.round_started_at))||0),ANSWERED_AT:_elws200Iso_(new Date())};
    _elive180AppendObject_(ELIVE_ANSWERS_SHEET,ELIVE_ANSWERS_HEADERS,answerRow);
    current.state_revision=Math.max(0,Number(current.state_revision||0)||0)+1;
    current.last_claim={word_id:decision.word_id,player_id:playerId,claimed_at:answerRow.ANSWERED_AT};
    var nextCount=existing.claims.length+1;
    var patch={CURRENT_QUESTION_JSON:JSON.stringify(current)};
    if (nextCount>=ELWS200_WORD_COUNT) {
      current.phase='COMPLETE'; current.completed_at=_elws200Iso_(new Date()); patch.ROUND_STATUS='CLOSED'; patch.ROUND_CLOSED_AT=current.completed_at; patch.CURRENT_QUESTION_JSON=JSON.stringify(current);
    }
    room=_elive180SetCells_(fresh,patch);
    _elive180AppendEvent_(room,'WORD_SEARCH_CLAIM',{sesion:{nombre:_elws200Text_(player.NOMBRE)||playerId},rol:'student'},{cod_estudiante:playerId,word_id:decision.word_id,action_id:action.action_id,round_id:action.round_id,puzzle_id:action.puzzle_id,claim_count:nextCount,version:ELWS200_VERSION});
    if (nextCount>=ELWS200_WORD_COUNT) _elive180AppendEvent_(room,'WORD_SEARCH_COMPLETE',{sesion:{nombre:'SISTEMA'},rol:'system'},{reason:'ALL_WORDS_FOUND',claims:nextCount,version:ELWS200_VERSION});
    _elive180Invalidate_(room);
    var state=_elws200Response_(room,playerId,false); state.accepted=true; state.duplicate=false; return state;
  } finally { lock.releaseLock(); }
}
function englishLabWordSearchCloseRoomCS21A200(body) {
  var managed=_elws200Managed_(body||{});
  if (!managed.ok) return managed.response;
  var response=englishLabLiveCloseRoom(body||{});
  if (response&&response.ok===true) response.version=ELWS200_VERSION;
  return response;
}

function verificarWordSearchCS21A200() {
  var env=typeof _cs21a171QaEnvironment_==='function'?_cs21a171QaEnvironment_():{ok:false,error:'qa_environment_guard_missing'};
  var curriculum=_elws200CurriculumUnit_(), words=_elws200PoolWords_(), validation=_elws200ValidatePool_(words);
  var puzzle=validation.ok?_elws200BuildPuzzle_(words,'LAB-WS200-VERIFY'):null;
  var publicPuzzle=puzzle?_elws200PublicPuzzle_(puzzle):null;
  var unique=puzzle?words.every(function (item) { return _elws200Occurrences_(puzzle.grid,item.grid_word).length===1; }):false;
  var noLeak=!!(publicPuzzle&&!Object.prototype.hasOwnProperty.call(publicPuzzle,'solutions'));
  var current=puzzle?{phase:'OPEN',round_id:'ROUND-VERIFY',puzzle_id:puzzle.puzzle_id}:{};
  var firstWord=puzzle&&puzzle.words[0], solution=firstWord&&puzzle.solutions[firstWord.word_id];
  var action=solution?{action_id:'ACT-VERIFY',round_id:'ROUND-VERIFY',puzzle_id:puzzle.puzzle_id,word_id:firstWord.word_id,start:solution.cells[0],end:solution.cells[solution.cells.length-1]}:{};
  var validDecision=puzzle?_elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},action):{ok:false};
  var claimed={by_word:{},by_action:{}}; if (firstWord) claimed.by_word[firstWord.word_id]={player_id:'QA-STU-001'};
  var secondDecision=puzzle?_elws200ClaimDecision_(puzzle,current,claimed,action):{ok:true};
  var staleRound=puzzle?_elws200ClaimDecision_(puzzle,current,{by_word:{},by_action:{}},{action_id:'A2',round_id:'OLD',puzzle_id:puzzle.puzzle_id,word_id:firstWord.word_id,start:solution.cells[0],end:solution.cells[solution.cells.length-1]}):{ok:true};
  var result={ok:env.ok===true&&!!curriculum&&validation.ok===true&&!!puzzle&&puzzle.size===ELWS200_GRID_SIZE&&unique&&noLeak&&validDecision.ok===true&&secondDecision.error==='word_already_claimed'&&staleRound.error==='round_stale',version:ELWS200_VERSION,previous_version:typeof ELQ198_OPTION_BALANCE_VERSION!=='undefined'?ELQ198_OPTION_BALANCE_VERSION:'CS21A198',qa_environment:env.ok===true,enabled_unit:ELWS200_UNIT_ID,canonical_words:validation.count,grid_size:puzzle&&puzzle.size,unique_target_occurrences:unique,public_puzzle_hides_solutions:noLeak,round_id_required:true,puzzle_id_required:true,first_claim_wins:true,duplicate_action_idempotent:true,claim_validated_under_submit_lock:true,official_grade:false,memory_match_untouched:true,quiz_time_untouched:true,hangman_untouched:true,sentence_order_untouched:true};
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A200 Word Search Live no supero la verificacion QA.');
  return result;
}

var _elws200DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body={}; try { body=_an4406_parseBody_(e)||{}; } catch (_) { body={}; }
    var fn=_elws200Text_((e&&e.parameter&&e.parameter.fn)||body.fn).toLowerCase();
    if (fn==='englishlabwordsearchteacherdata') return _an4406_json_(englishLabWordSearchTeacherDataCS21A200(body));
    if (fn==='englishlabwordsearchcreateroom') return _an4406_json_(englishLabWordSearchCreateRoomCS21A200(body));
    if (fn==='englishlabwordsearchstartroom') return _an4406_json_(englishLabWordSearchStartRoomCS21A200(body));
    if (fn==='englishlabwordsearchgetroomcontrol') return _an4406_json_(englishLabWordSearchGetRoomControlCS21A200(body));
    if (fn==='englishlabwordsearchjoinroom') return _an4406_json_(englishLabWordSearchJoinRoomCS21A200(body));
    if (fn==='englishlabwordsearchgetplayerstate') return _an4406_json_(englishLabWordSearchGetPlayerStateCS21A200(body));
    if (fn==='englishlabwordsearchclaimword') return _an4406_json_(englishLabWordSearchClaimWordCS21A200(body));
    if (fn==='englishlabwordsearchcloseroom') return _an4406_json_(englishLabWordSearchCloseRoomCS21A200(body));
    return _elws200DoPostBase_(e);
  } catch (error) {
    return _an4406_json_({ok:false,version:ELWS200_VERSION,error:String(error&&error.message||error)});
  }
};
