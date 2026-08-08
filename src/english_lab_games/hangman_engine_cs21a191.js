// CS21A191 · Motor puro de Ahorcado para English LAB Live.
// Sin fetch, sin Sheets, sin respuestas curriculares embebidas y sin autorización.
(function installHangmanEngineCS21A191(global) {
  'use strict';

  if (!global || global.EnglishLabHangmanEngineCS21A191) return;

  const VERSION = 'CS21A191';
  const GAME_ID = 'HANGMAN';
  const LETTERS = Object.freeze('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function canonicalAnswer(value) {
    return upper(value)
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function canonicalSolve(value) {
    return canonicalAnswer(value);
  }

  function isLetter(value) {
    return /^[A-Z]$/.test(upper(value));
  }

  function uniqueLetters(value) {
    const seen = new Set();
    const output = [];
    canonicalAnswer(value).split('').forEach((char) => {
      if (!isLetter(char) || seen.has(char)) return;
      seen.add(char);
      output.push(char);
    });
    return output;
  }

  function normalizeGuesses(values) {
    const source = Array.isArray(values) ? values : [];
    const seen = new Set();
    return source.map(upper).filter((letter) => {
      if (!isLetter(letter) || seen.has(letter)) return false;
      seen.add(letter);
      return true;
    });
  }

  function countOccurrences(answer, letter) {
    const wanted = upper(letter);
    if (!isLetter(wanted)) return 0;
    return canonicalAnswer(answer).split('').filter((char) => char === wanted).length;
  }

  function buildMask(answer, guesses) {
    const guessed = new Set(normalizeGuesses(guesses));
    const canonical = canonicalAnswer(answer);
    const cells = canonical.split('').map((char, index) => {
      const letter = isLetter(char);
      return Object.freeze({
        index,
        kind:letter ? 'LETTER' : (char === ' ' ? 'SPACE' : 'PUNCTUATION'),
        value:letter ? (guessed.has(char) ? char : '') : char,
        revealed:!letter || guessed.has(char),
      });
    });
    const display = cells.map((cell) => {
      if (cell.kind === 'SPACE') return '  ';
      if (cell.kind === 'PUNCTUATION') return cell.value;
      return cell.revealed ? cell.value : '_';
    }).join(' ');
    return Object.freeze({cells:Object.freeze(cells), display});
  }

  function solvedByLetters(answer, guesses) {
    const required = uniqueLetters(answer);
    const guessed = new Set(normalizeGuesses(guesses));
    return required.length > 0 && required.every((letter) => guessed.has(letter));
  }

  function scoreLetter(answer, letter) {
    return countOccurrences(answer, letter) * 10;
  }

  function scoreSolve(maxErrors, errorsUsed) {
    const max = Math.max(1, Number(maxErrors || 6) || 6);
    const used = Math.max(0, Math.min(max, Number(errorsUsed || 0) || 0));
    return 100 + (max - used) * 10;
  }

  function livesRemaining(maxErrors, errorsUsed) {
    const max = Math.max(1, Number(maxErrors || 6) || 6);
    return Math.max(0, max - Math.max(0, Number(errorsUsed || 0) || 0));
  }

  function normalizePublicState(input) {
    const source = input && typeof input === 'object' ? input : {};
    const maxErrors = Math.max(1, Math.min(12, Number(source.max_errors || source.maxErrors || 6) || 6));
    const errorsUsed = Math.max(0, Math.min(maxErrors, Number(source.errors_used || source.errorsUsed || 0) || 0));
    const guessed = normalizeGuesses(source.guessed_letters || source.guessedLetters || []);
    const wrong = normalizeGuesses(source.wrong_letters || source.wrongLetters || []);
    const phase = upper(source.phase || 'READY');
    return Object.freeze({
      version:clean(source.version || VERSION),
      gameId:GAME_ID,
      roundId:clean(source.round_id || source.roundId),
      index:Math.max(0, Number(source.index || 0) || 0),
      total:Math.max(0, Number(source.total || 0) || 0),
      clue:clean(source.clue),
      pattern:clean(source.pattern || source.display_pattern),
      guessedLetters:Object.freeze(guessed),
      wrongLetters:Object.freeze(wrong),
      errorsUsed,
      maxErrors,
      livesRemaining:livesRemaining(maxErrors, errorsUsed),
      phase,
      completed:source.completed === true || phase === 'COMPLETE',
      won:source.won === true,
      answer:clean(source.answer || source.revealed_answer),
      turnState:source.turn_state || source.turnState || null,
      scores:source.scores || null,
      actionSeq:Math.max(0, Number(source.action_seq || source.actionSeq || 0) || 0),
    });
  }

  function activePlayerId(state) {
    const normalized = normalizePublicState(state);
    return clean(normalized.turnState && (normalized.turnState.active_player_id || normalized.turnState.activePlayerId));
  }

  function activeTeamId(state) {
    const normalized = normalizePublicState(state);
    return clean(normalized.turnState && (normalized.turnState.active_team_id || normalized.turnState.activeTeamId));
  }

  function canPlayerAct(state, player) {
    const normalized = normalizePublicState(state);
    if (normalized.completed || normalized.phase !== 'OPEN') return false;
    const p = player && typeof player === 'object' ? player : {};
    const id = clean(p.player_id || p.playerId || p.cod_estudiante || p.COD_ESTUDIANTE);
    const team = clean(p.team_id || p.teamId || p.team || p.TEAM);
    const turn = normalized.turnState || {};
    const policy = upper(turn.participation_policy || turn.policy);
    if (policy === 'EVERYONE') return true;
    if (!id || id !== clean(turn.active_player_id)) return false;
    if (policy === 'TEAM_ALTERNATING' && clean(turn.active_team_id) && team !== clean(turn.active_team_id)) return false;
    return true;
  }

  function remainingMs(state, nowMs) {
    const normalized = normalizePublicState(state);
    const raw = normalized.turnState && (normalized.turnState.turn_ends_at || normalized.turnState.turnEndsAt);
    const end = raw ? Date.parse(raw) : 0;
    if (!Number.isFinite(end) || !end) return 0;
    return Math.max(0, end - (Number(nowMs || Date.now()) || Date.now()));
  }

  global.EnglishLabHangmanEngineCS21A191 = Object.freeze({
    VERSION,
    GAME_ID,
    LETTERS,
    clean,
    upper,
    canonicalAnswer,
    canonicalSolve,
    isLetter,
    uniqueLetters,
    normalizeGuesses,
    countOccurrences,
    buildMask,
    solvedByLetters,
    scoreLetter,
    scoreSolve,
    livesRemaining,
    normalizePublicState,
    activePlayerId,
    activeTeamId,
    canPlayerAct,
    remainingMs,
  });
})(window);
