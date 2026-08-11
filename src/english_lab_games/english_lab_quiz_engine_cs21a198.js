// CS21A198 · Motor público puro de Quiz Time.
// No hace fetch, no conoce respuestas correctas y no autoriza por sí mismo acciones.
(function installEnglishLabQuizEngineCS21A198(global) {
  'use strict';

  if (!global || global.EnglishLabQuizEngineCS21A198) return;

  const VERSION = 'CS21A198';
  const GAME_ID = 'QUIZ_TIME';
  const Contract = global.EnglishLabQuizCurriculumContractCS21A198 || null;
  const PHASES = Object.freeze(['WAITING','OPEN','LOCKED','REVEAL','COMPLETE','CLOSED']);
  const OPTION_IDS = Object.freeze(['A','B','C','D']);

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function int(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  }

  function bool(value) {
    return value === true || ['TRUE','1','YES','SI','SÍ'].includes(upper(value));
  }

  function normalizeOptions(input) {
    const source = Array.isArray(input) ? input : [];
    return Object.freeze(source.slice(0, 4).map((item, index) => {
      const raw = item && typeof item === 'object' ? item : {label:item};
      const id = upper(raw.id || raw.option_id || raw.key || OPTION_IDS[index]);
      return Object.freeze({
        id:OPTION_IDS.includes(id) ? id : OPTION_IDS[index],
        label:clean(raw.label || raw.text || raw.value),
        imageUrl:clean(raw.image_url || raw.imageUrl),
      });
    }).filter(item => item.id && (item.label || item.imageUrl)));
  }

  // Lista blanca: ningún campo de respuesta correcta puede atravesar este borde.
  function sanitizePublicQuestion(input) {
    const source = input && typeof input === 'object' ? input : {};
    const question = Object.freeze({
      questionId:clean(source.question_id || source.questionId || source.id),
      sourceItemId:clean(source.source_item_id || source.sourceItemId),
      levelId:upper(source.level_id || source.levelId),
      unitId:upper(source.unit_id || source.unitId),
      areaId:upper(source.area_id || source.areaId),
      templateId:upper(source.template_id || source.templateId),
      itemType:upper(source.item_type || source.itemType || 'MCQ'),
      promptEs:clean(source.prompt_es || source.promptEs),
      promptEn:clean(source.prompt_en || source.promptEn),
      stem:clean(source.stem || source.question || source.prompt),
      miniTextOrDialogue:clean(source.mini_text_or_dialogue || source.miniTextOrDialogue),
      options:normalizeOptions(source.options || [source.option_a,source.option_b,source.option_c,source.option_d]),
      difficulty:Math.max(1, Math.min(10, int(source.difficulty_1_10 || source.difficulty, 1))),
      position:Math.max(1, int(source.position || source.question_number, 1)),
      total:Math.max(1, int(source.total || source.question_total, 10)),
    });
    if (Contract && Contract.hasForbiddenPublicKey && Contract.hasForbiddenPublicKey(question)) {
      throw new Error('La pregunta pública contiene una clave de respuesta prohibida.');
    }
    return question;
  }

  function normalizeReveal(input) {
    const source = input && typeof input === 'object' ? input : {};
    const visible = bool(source.visible || source.revealed || source.is_reveal);
    if (!visible) return Object.freeze({visible:false, correctOption:'', explanationEs:'', closesAt:''});
    const correct = upper(source.correct_option || source.correctOption);
    return Object.freeze({
      visible:true,
      correctOption:OPTION_IDS.includes(correct) ? correct : '',
      explanationEs:clean(source.explanation_es || source.explanationEs),
      closesAt:clean(source.closes_at || source.closesAt || source.reveal_until),
    });
  }

  function normalizeTurn(input) {
    const source = input && typeof input === 'object' ? input : {};
    return Object.freeze({
      turnNumber:Math.max(0, int(source.turn_number || source.turnNumber, 0)),
      activePlayerId:clean(source.active_player_id || source.activePlayerId),
      activeTeamId:clean(source.active_team_id || source.activeTeamId),
      policy:upper(source.participation_policy || source.policy || 'EVERYONE'),
      startsAt:clean(source.turn_started_at || source.startsAt),
      endsAt:clean(source.turn_ends_at || source.endsAt),
    });
  }

  function normalizePublicState(input) {
    const source = input && typeof input === 'object' ? input : {};
    const rawPhase = upper(source.phase || source.quiz_phase || 'WAITING');
    const phase = PHASES.includes(rawPhase) ? rawPhase : 'WAITING';
    const question = source.question || source.current_question || source.currentQuestion;
    const normalized = {
      version:clean(source.version || VERSION),
      gameId:GAME_ID,
      roomCode:clean(source.room_code || source.roomCode || source.room?.room_code),
      roundId:clean(source.round_id || source.roundId),
      phase,
      stateRevision:Math.max(0, int(source.state_revision || source.stateRevision, 0)),
      question:question ? sanitizePublicQuestion(question) : null,
      reveal:normalizeReveal(source.reveal || source.answer_reveal),
      turn:normalizeTurn(source.turn_state || source.turnState),
      answeredPlayerIds:Object.freeze((Array.isArray(source.answered_player_ids || source.answeredPlayerIds) ? (source.answered_player_ids || source.answeredPlayerIds) : []).map(clean).filter(Boolean)),
      questionIndex:Math.max(0, int(source.question_index || source.questionIndex, 0)),
      questionTotal:Math.max(0, int(source.question_total || source.questionTotal, 10)),
      scores:source.scores && typeof source.scores === 'object' ? Object.freeze({...source.scores}) : Object.freeze({}),
      completed:phase === 'COMPLETE' || phase === 'CLOSED' || bool(source.completed),
    };
    if (normalized.phase !== 'REVEAL' && normalized.reveal.visible) {
      throw new Error('Quiz Time intentó exponer una respuesta fuera de la fase REVEAL.');
    }
    if (Contract && Contract.hasForbiddenPublicKey && normalized.question && Contract.hasForbiddenPublicKey(normalized.question)) {
      throw new Error('El estado público de Quiz Time expuso una clave correcta.');
    }
    return Object.freeze(normalized);
  }

  function playerId(player) {
    const source = player && typeof player === 'object' ? player : {};
    return clean(source.player_id || source.playerId || source.cod_estudiante || source.COD_ESTUDIANTE);
  }

  function teamId(player) {
    const source = player && typeof player === 'object' ? player : {};
    return clean(source.team_id || source.teamId || source.team || source.TEAM);
  }

  function alreadyAnswered(state, player) {
    const normalized = normalizePublicState(state);
    const id = playerId(player);
    return !!id && normalized.answeredPlayerIds.includes(id);
  }

  function canPlayerAnswer(state, player, nowMs = Date.now()) {
    const normalized = normalizePublicState(state);
    if (normalized.phase !== 'OPEN' || normalized.completed || !normalized.question) return false;
    const id = playerId(player);
    if (!id || normalized.answeredPlayerIds.includes(id)) return false;
    if (remainingMs(normalized, nowMs) <= 0) return false;
    const turn = normalized.turn;
    if (turn.policy === 'EVERYONE') return true;
    if (turn.activePlayerId && turn.activePlayerId !== id) return false;
    if (turn.policy === 'TEAM_ALTERNATING' && turn.activeTeamId && teamId(player) !== turn.activeTeamId) return false;
    return true;
  }

  function remainingMs(state, nowMs = Date.now()) {
    const normalized = state && state.gameId === GAME_ID && state.turn ? state : normalizePublicState(state);
    const rawEnd = normalized.phase === 'REVEAL' && normalized.reveal.visible && normalized.reveal.closesAt
      ? normalized.reveal.closesAt
      : normalized.turn.endsAt;
    const end = rawEnd ? Date.parse(rawEnd) : 0;
    return Number.isFinite(end) && end > 0 ? Math.max(0, end - Number(nowMs || Date.now())) : 0;
  }

  function buildAnswerAction(state, player, optionId, actionId) {
    const normalized = normalizePublicState(state);
    const id = playerId(player);
    const option = upper(optionId);
    if (!id) throw new Error('Quiz Time requiere identidad de estudiante.');
    if (!OPTION_IDS.includes(option)) throw new Error('Opción inválida.');
    if (!normalized.question || !normalized.question.questionId) throw new Error('No hay pregunta activa.');
    const action = clean(actionId);
    if (!action) throw new Error('Quiz Time requiere action_id idempotente.');
    return Object.freeze({
      action:'ANSWER',
      action_id:action,
      room_code:normalized.roomCode,
      player_id:id,
      question_id:normalized.question.questionId,
      option_id:option,
      expected_state_revision:normalized.stateRevision,
    });
  }

  function resultTone(result) {
    const source = result && typeof result === 'object' ? result : {};
    if (source.correct === true) return 'CORRECT';
    if (source.correct === false) return 'INCORRECT';
    return 'NEUTRAL';
  }

  global.EnglishLabQuizEngineCS21A198 = Object.freeze({
    VERSION,
    GAME_ID,
    PHASES,
    OPTION_IDS,
    clean,
    upper,
    normalizeOptions,
    sanitizePublicQuestion,
    normalizeReveal,
    normalizeTurn,
    normalizePublicState,
    playerId,
    teamId,
    alreadyAnswered,
    canPlayerAnswer,
    remainingMs,
    buildAnswerAction,
    resultTone,
  });
})(window);
