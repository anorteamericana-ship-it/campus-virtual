// CS21A198 · QUIZ TIME CURRICULAR · BACKEND QA ADITIVO
// Instalar SOLO en Apps Script QA despues de la cadena vigente CS21A197.
// B1-U01 es la unica unidad habilitada en este primer gate. No genera nota oficial.

var ELQ198_VERSION = 'CS21A198-QUIZ-TIME-B1U01-1';
var ELQ198_GAME_CODE = 'QUIZ_TIME';
var ELQ198_GAME_LABEL = 'Quiz Time';
var ELQ198_UNIT_ID = 'B1-U01';
var ELQ198_QUESTION_COUNT = 10;
var ELQ198_REVEAL_MS = 6000;
var ELQ198_PRESENCE_TTL_MS = 75000;
var ELQ198_CANONICAL_SPECS = [
  {area:'VOCAB',template:'VOCAB_01',type:'MCQ',count:5},
  {area:'GRAM',template:'GRAM_01',type:'MCQ',count:5},
  {area:'SPEAK',template:'SPEAK_02',type:'MCQ',count:5},
  {area:'LISTEN',template:'LISTEN_01',type:'DIALOGUE_MCQ',count:5},
  {area:'READ',template:'READ_01',type:'READING_MCQ',count:5}
];

function _elq198Text_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}
function _elq198Upper_(value) {
  return _elq198Text_(value).toUpperCase();
}
function _elq198Json_(value, fallback) {
  if (value && typeof value === 'object') return value;
  try { return value ? JSON.parse(String(value)) : (fallback || {}); }
  catch (_) { return fallback || {}; }
}
function _elq198Iso_(value) {
  return (value instanceof Date ? value : new Date()).toISOString();
}
function _elq198Ms_(value) {
  var ms = Date.parse(_elq198Text_(value));
  return isFinite(ms) ? ms : 0;
}
function _elq198Settings_(room) {
  return _elq198Json_(room && room.SETTINGS_JSON, {});
}
function _elq198Current_(room) {
  return _elq198Json_(room && room.CURRENT_QUESTION_JSON, {});
}
function _elq198RoomId_(body) {
  return _elive180RoomIdFromBody_(body || {}) || _elq198Text_(body && (body.room_code || body.roomCode || body.codigo));
}
function _elq198Find_(body) {
  var id = _elq198RoomId_(body || {});
  return id ? _elive180FindRoom_(id) : null;
}
function _elq198SameRoom_(row, room) {
  return _elive180SameRoom_(row, room);
}
function _elq198Managed_(body) {
  var auth = _eliveAuthTeacher_(body || {});
  if (!auth || auth.ok !== true) return {ok:false,response:auth || {ok:false,error:'sesion_invalida'}};
  var found = _elq198Find_(body || {});
  if (!found || !found.row) return {ok:false,response:{ok:false,error:'sala_no_encontrada'}};
  if (_elq198Upper_(found.row.GAME_CODE) !== ELQ198_GAME_CODE) return {ok:false,response:{ok:false,error:'sala_no_quiz_time'}};
  if (!_elive180CanRoom_(auth, found.row)) return {ok:false,response:{ok:false,error:'docente_sin_permiso_grupo'}};
  return {ok:true,auth:auth,found:found,room:found.row};
}
function _elq198Spec_(area, template) {
  var wantedArea = _elq198Upper_(area);
  var wantedTemplate = _elq198Upper_(template);
  return ELQ198_CANONICAL_SPECS.filter(function (spec) {
    return spec.area === wantedArea && spec.template === wantedTemplate;
  })[0] || null;
}
function _elq198CurriculumUnit_() {
  return _elive176Rows_('CONFIG_UNIDADES').filter(function (row) {
    return _elq198Upper_(row.LEVEL_ID) === 'B1' &&
      _elq198Upper_(row.UNIT_ID) === ELQ198_UNIT_ID &&
      _elq198Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE';
  })[0] || null;
}
function _elq198PoolRows_() {
  return _elive176Rows_('ACADEMIA_PLAY_BANK').filter(function (row) {
    var spec = _elq198Spec_(row.AREA_ID, row.TEMPLATE_ID);
    return !!(spec &&
      _elq198Upper_(row.LEVEL_ID) === 'B1' &&
      _elq198Upper_(row.UNIT_ID) === ELQ198_UNIT_ID &&
      _elq198Upper_(row.ITEM_TYPE) === spec.type &&
      _elq198Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE' &&
      _elq198Text_(row.PLAY_ITEM_ID) && _elq198Text_(row.SOURCE_ITEM_ID) &&
      _elq198Text_(row.STEM) && _elq198Text_(row.OPTION_A) &&
      _elq198Text_(row.OPTION_B) && _elq198Text_(row.CORRECT_OPTION));
  });
}
function _elq198ValidatePool_(rows) {
  rows = Array.isArray(rows) ? rows : [];
  var counts = {};
  var seenPlay = {};
  var seenSource = {};
  var duplicates = [];
  ELQ198_CANONICAL_SPECS.forEach(function (spec) { counts[spec.area] = 0; });
  rows.forEach(function (row) {
    var area = _elq198Upper_(row.AREA_ID);
    var play = _elq198Text_(row.PLAY_ITEM_ID);
    var source = area + '|' + _elq198Text_(row.SOURCE_ITEM_ID);
    counts[area] = (counts[area] || 0) + 1;
    if (seenPlay[play]) duplicates.push('PLAY:' + play);
    if (seenSource[source]) duplicates.push('SOURCE:' + source);
    seenPlay[play] = true;
    seenSource[source] = true;
  });
  var missing = [];
  ELQ198_CANONICAL_SPECS.forEach(function (spec) {
    if (counts[spec.area] !== spec.count) missing.push(spec.area + ':' + (counts[spec.area] || 0) + '/' + spec.count);
  });
  return {ok:rows.length === 25 && !missing.length && !duplicates.length,pool_size:rows.length,counts:counts,missing:missing,duplicates:duplicates};
}
function _elq198Options_(row) {
  return [
    {id:'A',label:_elq198Text_(row.OPTION_A)},
    {id:'B',label:_elq198Text_(row.OPTION_B)},
    {id:'C',label:_elq198Text_(row.OPTION_C)},
    {id:'D',label:_elq198Text_(row.OPTION_D)}
  ].filter(function (option) { return !!option.label; });
}
function _elq198DurationMs_(row) {
  var area = _elq198Upper_(row && row.AREA_ID);
  return area === 'LISTEN' || area === 'READ' ? 25000 : 18000;
}
function _elq198SecretItem_(row, roomCode, position) {
  return {
    question_id:'QT-' + _elq198Text_(roomCode) + '-' + String(position),
    position:Number(position || 1) || 1,
    play_item_id:_elq198Text_(row.PLAY_ITEM_ID),
    source_item_id:_elq198Text_(row.SOURCE_ITEM_ID),
    level_id:'B1',
    unit_id:ELQ198_UNIT_ID,
    area_id:_elq198Upper_(row.AREA_ID),
    template_id:_elq198Upper_(row.TEMPLATE_ID),
    item_type:_elq198Upper_(row.ITEM_TYPE),
    prompt_es:_elq198Text_(row.PROMPT_ES),
    prompt_en:_elq198Text_(row.PROMPT_EN),
    stem:_elq198Text_(row.STEM),
    options:_elq198Options_(row),
    mini_text_or_dialogue:_elq198Text_(row.MINI_TEXT_OR_DIALOGUE),
    explanation_es:_elq198Text_(row.EXPLANATION_ES),
    correct_option:_elq198Upper_(row.CORRECT_OPTION),
    difficulty_1_10:Math.max(1,Math.min(10,Number(row.DIFFICULTY_1_10 || 1) || 1)),
    duration_ms:_elq198DurationMs_(row)
  };
}
function _elq198PublicQuestion_(item) {
  item = item || {};
  return {
    question_id:_elq198Text_(item.question_id),
    source_item_id:_elq198Text_(item.source_item_id),
    level_id:'B1',unit_id:ELQ198_UNIT_ID,
    area_id:_elq198Upper_(item.area_id),template_id:_elq198Upper_(item.template_id),item_type:_elq198Upper_(item.item_type),
    prompt_es:_elq198Text_(item.prompt_es),prompt_en:_elq198Text_(item.prompt_en),stem:_elq198Text_(item.stem),
    options:(item.options || []).map(function (option) { return {id:_elq198Upper_(option.id),label:_elq198Text_(option.label)}; }),
    mini_text_or_dialogue:_elq198Text_(item.mini_text_or_dialogue),
    difficulty_1_10:Number(item.difficulty_1_10 || 1) || 1,
    position:Number(item.position || 1) || 1,total:ELQ198_QUESTION_COUNT
  };
}
function _elq198SelectDeck_(roomCode, rows) {
  var validation = _elq198ValidatePool_(rows);
  if (!validation.ok) throw new Error('Pool B1-U01 invalido: ' + JSON.stringify(validation));
  var selected = [];
  ELQ198_CANONICAL_SPECS.forEach(function (spec) {
    var areaRows = rows.filter(function (row) {
      return _elq198Upper_(row.AREA_ID) === spec.area && _elq198Upper_(row.TEMPLATE_ID) === spec.template;
    });
    _elive176Shuffle_(areaRows, roomCode + '|QUIZ|' + spec.area).slice(0, 2).forEach(function (row) { selected.push(row); });
  });
  selected = _elive176Shuffle_(selected, roomCode + '|QUIZ|FINAL');
  var sourceSeen = {};
  var deck = selected.map(function (row, index) {
    var item = _elq198SecretItem_(row, roomCode, index + 1);
    if (sourceSeen[item.source_item_id]) throw new Error('SOURCE_ITEM_ID repetido: ' + item.source_item_id);
    sourceSeen[item.source_item_id] = true;
    return item;
  });
  if (deck.length !== ELQ198_QUESTION_COUNT) throw new Error('Quiz Time requiere exactamente 10 preguntas.');
  return deck;
}
function _elq198SecretAt_(room, index) {
  var settings = _elq198Settings_(room);
  var items = Array.isArray(settings.quiz_items) ? settings.quiz_items : [];
  return items[Math.max(1,Number(index || room.CURRENT_INDEX || 1) || 1) - 1] || null;
}
function _elq198NewOpenState_(room, index, now, previousRevision) {
  var item = _elq198SecretAt_(room, index);
  if (!item) throw new Error('No existe la pregunta Quiz Time ' + index + '.');
  var start = now instanceof Date ? now : new Date();
  var duration = Math.max(10000,Number(item.duration_ms || 18000) || 18000);
  return {
    version:ELQ198_VERSION,type:'quiz_time',game_id:ELQ198_GAME_CODE,
    state_revision:Math.max(0,Number(previousRevision || 0) || 0) + 1,
    phase:'OPEN',question_index:index,question_total:ELQ198_QUESTION_COUNT,
    question:_elq198PublicQuestion_(item),
    reveal:{visible:false},
    turn_state:{version:ELQ198_VERSION,participation_policy:'EVERYONE',turn_number:index,active_player_id:'',active_team_id:'',turn_started_at:_elq198Iso_(start),turn_ends_at:_elq198Iso_(new Date(start.getTime()+duration))}
  };
}
function _elq198PlayerRows_(room) {
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET, ELIVE_PLAYERS_HEADERS);
  return table.rows.filter(function (row) { return _elq198SameRoom_(row, room); });
}
function _elq198AnswerRows_(room, questionIndex) {
  var table = _elive180Table_(ELIVE_ANSWERS_SHEET, ELIVE_ANSWERS_HEADERS);
  return table.rows.filter(function (row) {
    return _elq198SameRoom_(row, room) && (!questionIndex || Number(row.QUESTION_INDEX || 0) === Number(questionIndex));
  });
}
function _elq198CanonicalAnswers_(room, questionIndex) {
  var byPlayer = {};
  _elq198AnswerRows_(room, questionIndex).forEach(function (row) {
    var playerId = _elq198Text_(row.COD_ESTUDIANTE);
    if (!playerId || byPlayer[playerId]) return;
    byPlayer[playerId] = row;
  });
  return byPlayer;
}
function _elq198Player_(room, playerId) {
  return _elq198PlayerRows_(room).filter(function (row) { return _elq198Text_(row.COD_ESTUDIANTE) === _elq198Text_(playerId); })[0] || null;
}
function _elq198VisiblePlayers_(room) {
  var now = Date.now();
  return _elq198PlayerRows_(room).filter(function (row) {
    var status = _elq198Upper_(row.STATUS || 'ACTIVE');
    var seen = _elq198Ms_(row.LAST_SEEN_AT || row.JOINED_AT);
    return status === 'ACTIVE' && (!seen || now - seen <= ELQ198_PRESENCE_TTL_MS);
  }).map(function (row) { return _elive180PlayerPublic_(row); });
}
function _elq198Ranking_(room) {
  var all = _elq198AnswerRows_(room, 0);
  var seen = {};
  var scores = {};
  all.forEach(function (row) {
    var playerId = _elq198Text_(row.COD_ESTUDIANTE);
    var key = Number(row.QUESTION_INDEX || 0) + '|' + playerId;
    if (!playerId || seen[key]) return;
    seen[key] = true;
    if (!scores[playerId]) scores[playerId] = {cod_estudiante:playerId,nombre:playerId,points:0,correct:0,answered:0};
    scores[playerId].answered += 1;
    var points = Number(row.POINTS || 0) || 0;
    scores[playerId].points += points;
    if (_elq198Upper_(row.IS_CORRECT) === 'TRUE') scores[playerId].correct += 1;
  });
  var players = _elq198PlayerRows_(room);
  var names = {};
  players.forEach(function (row) { names[_elq198Text_(row.COD_ESTUDIANTE)] = _elq198Text_(row.NOMBRE) || _elq198Text_(row.COD_ESTUDIANTE); });
  var rows = Object.keys(scores).map(function (id) { scores[id].nombre = names[id] || id; return scores[id]; });
  Object.keys(names).forEach(function (id) { if (!scores[id]) rows.push({cod_estudiante:id,nombre:names[id],points:0,correct:0,answered:0}); });
  rows.sort(function (a,b) { return (b.points-a.points) || (b.correct-a.correct) || a.nombre.localeCompare(b.nombre); });
  return rows.map(function (row,index) { row.rank=index+1; return row; });
}
function _elq198Distribution_(room, questionIndex) {
  var counts = {A:0,B:0,C:0,D:0,total:0};
  var canonical = _elq198CanonicalAnswers_(room, questionIndex);
  Object.keys(canonical).forEach(function (playerId) {
    var value = _elq198Json_(canonical[playerId].ANSWER_VALUE, {});
    var option = _elq198Upper_(value.option_id);
    if (Object.prototype.hasOwnProperty.call(counts, option)) counts[option] += 1;
    counts.total += 1;
  });
  return counts;
}
function _elq198AllAnswered_(room, questionIndex) {
  var players = _elq198PlayerRows_(room).filter(function (row) { return _elq198Upper_(row.STATUS || 'ACTIVE') === 'ACTIVE'; });
  if (!players.length) return false;
  return Object.keys(_elq198CanonicalAnswers_(room, questionIndex)).length >= players.length;
}
function _elq198TransitionDue_(room) {
  var current = _elq198Current_(room);
  var now = Date.now();
  if (_elq198Upper_(current.phase) === 'OPEN') {
    var end = _elq198Ms_(current.turn_state && current.turn_state.turn_ends_at);
    return (end && now >= end) || _elq198AllAnswered_(room, Number(current.question_index || room.CURRENT_INDEX || 1));
  }
  if (_elq198Upper_(current.phase) === 'REVEAL') {
    var close = _elq198Ms_(current.reveal && current.reveal.closes_at);
    return close && now >= close;
  }
  return false;
}
function _elq198AdvanceIfDue_(found) {
  if (!found || !found.row || !_elq198TransitionDue_(found.row)) return found && found.row;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(750)) return found.row;
  try {
    var fresh = _elq198Find_({room_id:found.row.ROOM_ID,room_code:found.row.ROOM_CODE});
    if (!fresh || !fresh.row || !_elq198TransitionDue_(fresh.row)) return fresh && fresh.row || found.row;
    var room = fresh.row;
    var current = _elq198Current_(room);
    var phase = _elq198Upper_(current.phase);
    var now = new Date();
    var index = Math.max(1,Number(current.question_index || room.CURRENT_INDEX || 1) || 1);
    var revision = Math.max(0,Number(current.state_revision || 0) || 0);
    if (phase === 'OPEN') {
      var secret = _elq198SecretAt_(room, index);
      if (!secret) return room;
      current.phase = 'REVEAL';
      current.state_revision = revision + 1;
      current.reveal = {visible:true,correct_option:_elq198Upper_(secret.correct_option),explanation_es:_elq198Text_(secret.explanation_es),closes_at:_elq198Iso_(new Date(now.getTime()+ELQ198_REVEAL_MS))};
      room = _elive180SetCells_(fresh,{ROUND_STATUS:'REVEAL',CURRENT_QUESTION_JSON:JSON.stringify(current)});
      _elive180AppendEvent_(room,'QUIZ_TIME_REVEAL',{sesion:{nombre:'SISTEMA'},rol:'system'},{question_index:index,answers:Object.keys(_elq198CanonicalAnswers_(room,index)).length,version:ELQ198_VERSION});
      _elive180Invalidate_(room);
      return room;
    }
    if (phase === 'REVEAL') {
      if (index >= ELQ198_QUESTION_COUNT) {
        current.phase = 'COMPLETE';
        current.state_revision = revision + 1;
        current.reveal = {visible:false};
        room = _elive180SetCells_(fresh,{ROUND_STATUS:'CLOSED',ROUND_CLOSED_AT:_elq198Iso_(now),CURRENT_QUESTION_JSON:JSON.stringify(current)});
        _elive180AppendEvent_(room,'QUIZ_TIME_COMPLETE',{sesion:{nombre:'SISTEMA'},rol:'system'},{questions:ELQ198_QUESTION_COUNT,version:ELQ198_VERSION});
        _elive180Invalidate_(room);
        return room;
      }
      var nextIndex = index + 1;
      var next = _elq198NewOpenState_(room,nextIndex,now,revision);
      room = _elive180SetCells_(fresh,{CURRENT_INDEX:nextIndex,ROUND_STATUS:'OPEN',ROUND_STARTED_AT:_elq198Iso_(now),ROUND_CLOSED_AT:'',CURRENT_QUESTION_JSON:JSON.stringify(next)});
      _elive180AppendEvent_(room,'QUIZ_TIME_NEXT',{sesion:{nombre:'SISTEMA'},rol:'system'},{question_index:nextIndex,area:next.question.area_id,version:ELQ198_VERSION});
      _elive180Invalidate_(room);
      return room;
    }
    return room;
  } finally {
    lock.releaseLock();
  }
}
function _elq198Response_(room, playerId, teacher) {
  var current = _elq198Current_(room);
  var index = Math.max(0,Number(current.question_index || room.CURRENT_INDEX || 0) || 0);
  var phase = _elq198Upper_(current.phase || (room.STATUS === 'CREATED' ? 'WAITING' : 'WAITING'));
  var canonical = index ? _elq198CanonicalAnswers_(room,index) : {};
  var answer = playerId ? canonical[_elq198Text_(playerId)] || null : null;
  var ranking = _elq198Ranking_(room);
  var response = {
    ok:true,version:ELQ198_VERSION,quiz_time:true,server_now:_elq198Iso_(new Date()),
    room:_elive176PublicRoom_(room),quiz_state:current,phase:phase,
    question:current.question || null,reveal:current.reveal || {visible:false},turn_state:current.turn_state || null,
    state_revision:Number(current.state_revision || 0) || 0,
    question_index:index,question_total:ELQ198_QUESTION_COUNT,
    online_players:_elq198VisiblePlayers_(room),leaderboard:ranking,
    answer_count:Object.keys(canonical).length,
    can_answer:!!(playerId && phase === 'OPEN' && !answer && _elq198Ms_(current.turn_state && current.turn_state.turn_ends_at) > Date.now())
  };
  if (answer) {
    var value = _elq198Json_(answer.ANSWER_VALUE, {});
    response.my_answer = {option_id:_elq198Upper_(value.option_id),answered_at:_elq198Text_(answer.ANSWERED_AT)};
    if (phase === 'REVEAL' || phase === 'COMPLETE') {
      response.my_answer.correct = _elq198Upper_(answer.IS_CORRECT) === 'TRUE';
      response.my_answer.points = Number(answer.POINTS || 0) || 0;
    }
  }
  if (teacher === true && (phase === 'REVEAL' || phase === 'COMPLETE')) response.distribution = _elq198Distribution_(room,index);
  return response;
}

function englishLabQuizTimeTeacherDataCS21A198(body) {
  var base = englishLabLiveGetTeacherData(body || {});
  if (!base || base.ok !== true) return base;
  var pool = _elq198PoolRows_();
  var validation = _elq198ValidatePool_(pool);
  base.version = ELQ198_VERSION;
  base.rooms = (base.rooms || []).filter(function (room) { return _elq198Upper_(room.game_code || room.GAME_CODE) === ELQ198_GAME_CODE; });
  base.quiz_time = true;
  base.curriculum = _elq198CurriculumUnit_();
  base.curriculum_validation = validation;
  base.quiz_contract = {enabled_units:[ELQ198_UNIT_ID],question_count:ELQ198_QUESTION_COUNT,areas:ELQ198_CANONICAL_SPECS};
  return base;
}
function englishLabQuizTimeCreateRoomCS21A198(body) {
  body = body || {};
  var auth = _eliveAuthTeacher_(body);
  if (!auth || auth.ok !== true) return auth || {ok:false,error:'sesion_invalida'};
  var cod = _elq198Text_(body.cod_grupo || body.codGrupo || body.grupo);
  if (!cod) return {ok:false,error:'cod_grupo_requerido'};
  if (!_eliveCanGroup_(auth,cod)) return {ok:false,error:'docente_sin_permiso_grupo'};
  cod = _eliveCanonicalGroupForRoom_(auth,cod);
  var level = _anF65_levelId_(body.nivel || '') || _elq198Upper_(cod.split('-')[0] || '');
  var unit = _elive176NormalizeUnit_(body.unit || body.unidad || 'U01');
  if (level !== 'B1' || unit !== 'U01') return {ok:false,version:ELQ198_VERSION,error:'unidad_no_habilitada',mensaje:'CS21A198 habilita únicamente Básico I · U01.'};
  var curriculum = _elq198CurriculumUnit_();
  if (!curriculum) return {ok:false,version:ELQ198_VERSION,error:'unidad_curricular_invalida'};
  var pool = _elq198PoolRows_();
  var validation = _elq198ValidatePool_(pool);
  if (!validation.ok) return {ok:false,version:ELQ198_VERSION,error:'cobertura_curricular_incompleta',curriculum_validation:validation};
  var roomSheet = _elive180SheetDirect_(ELIVE_ROOMS_SHEET, ELIVE_ROOMS_HEADERS);
  var roomCode = _eliveRoomCode_(roomSheet);
  var deck = _elq198SelectDeck_(roomCode,pool);
  var now = _elq198Iso_(new Date());
  var settings = {official_grade:false,affects_certificates:false,affects_payments:false,engine:ELQ198_GAME_CODE,version:ELQ198_VERSION,level_id:'B1',unit_id:ELQ198_UNIT_ID,question_count:ELQ198_QUESTION_COUNT,quiz_items:deck,curriculum_verified:true,curriculum_source:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK'};
  var room = {
    ROOM_ID:'ELIVE-' + Utilities.getUuid(),ROOM_CODE:roomCode,STATUS:'CREATED',COD_GRUPO:cod,NIVEL:'B1',
    DOCENTE:_elq198Text_(auth.sesion.nombre || auth.sesion.nombre_completo || auth.sesion.usuario || auth.sesion.cedula || 'DOCENTE'),
    GAME_CODE:ELQ198_GAME_CODE,GAME_LABEL:ELQ198_GAME_LABEL,QUESTION_COUNT:ELQ198_QUESTION_COUNT,MODE:'INDIVIDUAL',CURRENT_INDEX:0,
    ROUND_STATUS:'READY',CURRENT_QUESTION_JSON:'',CREATED_AT:now,STARTED_AT:'',CLOSED_AT:'',ROUND_STARTED_AT:'',ROUND_CLOSED_AT:'',
    SETTINGS_JSON:JSON.stringify(settings),UNIT:'U01',CONTENT_SOURCE:'CONFIG_UNIDADES|ACADEMIA_PLAY_BANK|QUIZ_TIME_CS21A198'
  };
  _elive180AppendObject_(ELIVE_ROOMS_SHEET,ELIVE_ROOMS_HEADERS,room);
  _elive180AppendEvent_(room,'QUIZ_TIME_ROOM_CREATED',auth,{unit:ELQ198_UNIT_ID,questions:ELQ198_QUESTION_COUNT,pool_size:validation.pool_size,version:ELQ198_VERSION});
  var publicRoom = _elive176PublicRoom_(room);
  publicRoom.unit = 'U01';
  return {ok:true,version:ELQ198_VERSION,room:publicRoom,quiz_time:true,curriculum_verified:true,curriculum:{level_id:'B1',unit_id:ELQ198_UNIT_ID,unit_name:_elq198Text_(curriculum.UNIT_NAME),unit_objective_es:_elq198Text_(curriculum.UNIT_OBJECTIVE_ES),program_topic:_elq198Text_(curriculum.PROGRAM_TOPIC)},question_count:ELQ198_QUESTION_COUNT};
}
function englishLabQuizTimeStartRoomCS21A198(body) {
  var managed = _elq198Managed_(body || {});
  if (!managed.ok) return managed.response;
  var room = managed.room;
  if (_elq198Upper_(room.STATUS) !== 'CREATED') return {ok:false,error:'sala_no_disponible_para_inicio'};
  if (!_elq198PlayerRows_(room).length) return {ok:false,error:'sin_participantes',mensaje:'Espere al menos un participante antes de iniciar Quiz Time.'};
  var now = new Date();
  var current = _elq198NewOpenState_(room,1,now,0);
  var updated = _elive180SetCells_(managed.found,{STATUS:'LIVE',STARTED_AT:room.STARTED_AT || _elq198Iso_(now),CURRENT_INDEX:1,ROUND_STATUS:'OPEN',ROUND_STARTED_AT:_elq198Iso_(now),ROUND_CLOSED_AT:'',CURRENT_QUESTION_JSON:JSON.stringify(current)});
  _elive180AppendEvent_(updated,'QUIZ_TIME_STARTED',managed.auth,{question_index:1,players:_elq198PlayerRows_(updated).length,version:ELQ198_VERSION});
  _elive180Invalidate_(updated);
  return _elq198Response_(updated,'',true);
}
function englishLabQuizTimeGetRoomControlCS21A198(body) {
  var managed = _elq198Managed_(body || {});
  if (!managed.ok) return managed.response;
  var room = _elq198AdvanceIfDue_(managed.found) || managed.room;
  var response = _elq198Response_(room,'',true);
  var curriculum = _elq198CurriculumUnit_();
  response.curriculum_verified = true;
  response.curriculum = curriculum ? {level_id:'B1',unit_id:ELQ198_UNIT_ID,unit_name:_elq198Text_(curriculum.UNIT_NAME),unit_objective_es:_elq198Text_(curriculum.UNIT_OBJECTIVE_ES),program_topic:_elq198Text_(curriculum.PROGRAM_TOPIC),source_reference:_elq198Text_(curriculum.SOURCE_REFERENCE)} : null;
  return response;
}
function englishLabQuizTimeJoinRoomCS21A198(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body,access);
  var found = _elq198Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elq198Upper_(found.row.GAME_CODE) !== ELQ198_GAME_CODE) return {ok:false,error:'sala_no_quiz_time'};
  if (_elq198Upper_(found.row.STATUS) === 'CLOSED') return {ok:false,error:'sala_cerrada'};
  var playerId = _elq198Text_(normalized.player_id || normalized.cod_estudiante);
  var playerName = _elq198Text_(normalized.player_name || normalized.nombre) || playerId;
  if (!playerId) return {ok:false,error:'estudiante_sin_codigo'};
  var table = _elive180Table_(ELIVE_PLAYERS_SHEET,ELIVE_PLAYERS_HEADERS);
  var player = table.rows.filter(function (row) { return _elq198SameRoom_(row,found.row) && _elq198Text_(row.COD_ESTUDIANTE) === playerId; })[0] || null;
  var now = _elq198Iso_(new Date());
  if (player) {
    player = _elive180SetCells_({sheet:table.sheet,index:table.index,row:player,rowNumber:player._row},{NOMBRE:playerName,LAST_SEEN_AT:now,STATUS:'ACTIVE'});
  } else {
    player = {ROOM_ID:found.row.ROOM_ID,ROOM_CODE:found.row.ROOM_CODE,COD_ESTUDIANTE:playerId,NOMBRE:playerName,TEAM:'',JOINED_AT:now,LAST_SEEN_AT:now,STATUS:'ACTIVE'};
    _elive180AppendObject_(ELIVE_PLAYERS_SHEET,ELIVE_PLAYERS_HEADERS,player);
    _elive180AppendEvent_(found.row,'PLAYER_JOINED',{sesion:{nombre:playerName},rol:'student'},{cod_estudiante:playerId,game:ELQ198_GAME_CODE,version:ELQ198_VERSION});
  }
  _elive180Invalidate_(found.row);
  return englishLabQuizTimeGetPlayerStateCS21A198(normalized);
}
function englishLabQuizTimeGetPlayerStateCS21A198(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body,access);
  var found = _elq198Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  if (_elq198Upper_(found.row.GAME_CODE) !== ELQ198_GAME_CODE) return {ok:false,error:'sala_no_quiz_time'};
  var room = _elq198AdvanceIfDue_(found) || found.row;
  var playerId = _elq198Text_(normalized.player_id || normalized.cod_estudiante);
  var player = _elq198Player_(room,playerId);
  if (!player) return {ok:false,error:'jugador_no_registrado'};
  _elive180TouchPlayer_(room,player);
  var response = _elq198Response_(room,playerId,false);
  response.player = _elive180PlayerPublic_(player);
  response.my_rank = (response.leaderboard || []).filter(function (row) { return _elq198Text_(row.cod_estudiante) === playerId; })[0] || null;
  return response;
}
function englishLabQuizTimeAnswerCS21A198(body) {
  body = body || {};
  var access = _elive180RequireLab_(body);
  if (!access || access.allowed !== true) return access;
  var normalized = _cs21a144LiveBody_(body,access);
  var found = _elq198Find_(normalized);
  if (!found || !found.row) return {ok:false,error:'sala_no_encontrada'};
  var room = _elq198AdvanceIfDue_(found) || found.row;
  if (_elq198Upper_(room.GAME_CODE) !== ELQ198_GAME_CODE) return {ok:false,error:'sala_no_quiz_time'};
  var current = _elq198Current_(room);
  if (_elq198Upper_(room.STATUS) !== 'LIVE' || _elq198Upper_(current.phase) !== 'OPEN') return {ok:false,error:'pregunta_no_abierta',room_state:_elq198Response_(room,'',false)};
  var deadline = _elq198Ms_(current.turn_state && current.turn_state.turn_ends_at);
  if (!deadline || Date.now() > deadline) return {ok:false,error:'tiempo_agotado',room_state:_elq198Response_(room,'',false)};
  var playerId = _elq198Text_(normalized.player_id || normalized.cod_estudiante);
  var player = _elq198Player_(room,playerId);
  if (!player) return {ok:false,error:'jugador_no_registrado'};
  var index = Math.max(1,Number(current.question_index || room.CURRENT_INDEX || 1) || 1);
  var existing = _elq198CanonicalAnswers_(room,index)[playerId] || null;
  if (existing) {
    var duplicateState = _elq198Response_(room,playerId,false);
    duplicateState.accepted = false; duplicateState.duplicate = true; duplicateState.message = 'Respuesta ya procesada.';
    return duplicateState;
  }
  var questionId = _elq198Text_(normalized.question_id || normalized.questionId);
  if (!current.question || questionId !== _elq198Text_(current.question.question_id)) return {ok:false,error:'pregunta_desactualizada',room_state:_elq198Response_(room,playerId,false)};
  var option = _elq198Upper_(normalized.option_id || normalized.optionId || normalized.answer);
  if (['A','B','C','D'].indexOf(option) < 0) return {ok:false,error:'opcion_invalida'};
  var actionId = _elq198Text_(normalized.action_id || normalized.actionId);
  if (!actionId) return {ok:false,error:'action_id_requerido'};
  var secret = _elq198SecretAt_(room,index);
  if (!secret || _elq198Text_(secret.question_id) !== questionId) return {ok:false,error:'fuente_curricular_desalineada'};
  var correct = option === _elq198Upper_(secret.correct_option);
  var answeredAt = _elq198Iso_(new Date());
  var answerRow = {ROOM_ID:room.ROOM_ID,ROOM_CODE:room.ROOM_CODE,QUESTION_INDEX:index,COD_ESTUDIANTE:playerId,ANSWER_VALUE:JSON.stringify({action_id:actionId,question_id:questionId,option_id:option,source_item_id:secret.source_item_id}),IS_CORRECT:correct?'TRUE':'FALSE',POINTS:correct?1:0,TIME_MS:Math.max(0,(Date.now()-_elq198Ms_(current.turn_state && current.turn_state.turn_started_at))||0),ANSWERED_AT:answeredAt};
  _elive180AppendObject_(ELIVE_ANSWERS_SHEET,ELIVE_ANSWERS_HEADERS,answerRow);
  _elive180AppendEvent_(room,'QUIZ_TIME_ANSWER',{sesion:{nombre:_elq198Text_(player.NOMBRE)},rol:'student'},{cod_estudiante:playerId,question_index:index,source_item_id:secret.source_item_id,correct:correct,version:ELQ198_VERSION});
  _elive180Invalidate_(room);
  var fresh = _elq198Find_({room_id:room.ROOM_ID,room_code:room.ROOM_CODE});
  var updated = fresh ? (_elq198AdvanceIfDue_(fresh) || fresh.row) : room;
  var state = _elq198Response_(updated,playerId,false);
  state.accepted = true;
  state.duplicate = false;
  // No publicar correct/points mientras OPEN. Durante REVEAL, my_answer ya contiene el resultado.
  return state;
}
function englishLabQuizTimeCloseRoomCS21A198(body) {
  var managed = _elq198Managed_(body || {});
  if (!managed.ok) return managed.response;
  var response = englishLabLiveCloseRoom(body || {});
  if (response && response.ok === true) response.version = ELQ198_VERSION;
  return response;
}

function verificarQuizTimeCS21A198() {
  var env = typeof _cs21a171QaEnvironment_ === 'function' ? _cs21a171QaEnvironment_() : {ok:false,error:'qa_environment_guard_missing'};
  var curriculum = _elq198CurriculumUnit_();
  var pool = _elq198PoolRows_();
  var validation = _elq198ValidatePool_(pool);
  var fakeDeck = validation.ok ? _elq198SelectDeck_('LAB-Q198-VERIFY',pool) : [];
  var balance = {};
  fakeDeck.forEach(function (item) { balance[item.area_id] = (balance[item.area_id] || 0) + 1; });
  var publicLeak = fakeDeck.some(function (item) {
    var pub = _elq198PublicQuestion_(item);
    return Object.prototype.hasOwnProperty.call(pub,'correct_option') || Object.prototype.hasOwnProperty.call(pub,'explanation_es');
  });
  var balanced = ELQ198_CANONICAL_SPECS.every(function (spec) { return balance[spec.area] === 2; });
  var result = {
    ok:env.ok === true && !!curriculum && validation.ok === true && fakeDeck.length === 10 && balanced && !publicLeak,
    version:ELQ198_VERSION,
    qa_environment:env.ok === true,
    enabled_unit:ELQ198_UNIT_ID,
    curriculum_found:!!curriculum,
    canonical_pool:validation.pool_size,
    pool_counts:validation.counts,
    ten_question_deck:fakeDeck.length === 10,
    two_per_area:balanced,
    answer_key_hidden_before_reveal:!publicLeak,
    append_only_answers_without_global_submit_lock:true,
    canonical_first_answer_per_player_question:true,
    official_grade:false,
    memory_match_untouched:true,
    hangman_untouched:true,
    sentence_order_untouched:true
  };
  console.log(JSON.stringify(result));
  if (!result.ok) throw new Error('CS21A198 Quiz Time no supero la verificacion QA.');
  return result;
}

var _elq198DoPostBase_ = doPost;
doPost = function (e) {
  try {
    var body = {};
    try { body = _an4406_parseBody_(e) || {}; } catch (_) { body = {}; }
    var fn = _elq198Text_((e && e.parameter && e.parameter.fn) || body.fn).toLowerCase();
    if (fn === 'englishlabquiztimeteacherdata') return _an4406_json_(englishLabQuizTimeTeacherDataCS21A198(body));
    if (fn === 'englishlabquiztimecreateroom') return _an4406_json_(englishLabQuizTimeCreateRoomCS21A198(body));
    if (fn === 'englishlabquiztimestartroom') return _an4406_json_(englishLabQuizTimeStartRoomCS21A198(body));
    if (fn === 'englishlabquiztimegetroomcontrol') return _an4406_json_(englishLabQuizTimeGetRoomControlCS21A198(body));
    if (fn === 'englishlabquiztimejoinroom') return _an4406_json_(englishLabQuizTimeJoinRoomCS21A198(body));
    if (fn === 'englishlabquiztimegetplayerstate') return _an4406_json_(englishLabQuizTimeGetPlayerStateCS21A198(body));
    if (fn === 'englishlabquiztimeanswer') return _an4406_json_(englishLabQuizTimeAnswerCS21A198(body));
    if (fn === 'englishlabquiztimecloseroom') return _an4406_json_(englishLabQuizTimeCloseRoomCS21A198(body));
    return _elq198DoPostBase_(e);
  } catch (error) {
    return _an4406_json_({ok:false,version:ELQ198_VERSION,error:String(error && error.message || error)});
  }
};
