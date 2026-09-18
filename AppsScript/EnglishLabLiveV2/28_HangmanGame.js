/** English LAB LIVE v2 · Hangman production GamePlugin (E6-HANGMAN). */
var ELV2_HangmanGame = Object.freeze({
  gameId: function () {
    return 'HANGMAN';
  },

  gameVersion: function () {
    return '2.0.0';
  },

  validateContent: function (content) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('ELV2_CONTENT_INVALID');
    if (content.content_type !== 'VOCABULARY_SET') throw new Error('ELV2_CONTENT_INVALID');
    if (!Array.isArray(content.items) || content.items.length !== 10) throw new Error('ELV2_CONTENT_INVALID');
    var sourceIds = {};
    content.items.forEach(function (item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('ELV2_CONTENT_INVALID');
      var sourceId = ELV2_hangText_(item.source_item_id);
      var label = ELV2_hangText_(item.label);
      var hint = ELV2_hangText_(item.hint_es);
      var answer = ELV2_hangCanonical_(label);
      if (!sourceId || sourceIds[sourceId] || !label || !hint || answer.length > 48 || ELV2_hangUniqueLetters_(answer).length === 0) {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      sourceIds[sourceId] = true;
    });
    return true;
  },

  validateSettings: function (settings) {
    if (settings == null) return true;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('ELV2_SETTINGS_INVALID');
    var keys = Object.keys(settings).sort();
    keys.forEach(function (key) {
      if (key !== 'item_index' && key !== 'max_errors') throw new Error('ELV2_SETTINGS_INVALID');
    });
    if (Object.prototype.hasOwnProperty.call(settings, 'item_index') &&
        (!Number.isInteger(settings.item_index) || settings.item_index < 1 || settings.item_index > 10)) {
      throw new Error('ELV2_SETTINGS_INVALID');
    }
    if (Object.prototype.hasOwnProperty.call(settings, 'max_errors') &&
        (!Number.isInteger(settings.max_errors) || settings.max_errors < 3 || settings.max_errors > 9)) {
      throw new Error('ELV2_SETTINGS_INVALID');
    }
    return true;
  },

  validateAttempt: function (attempt) {
    if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)) throw new Error('ELV2_ATTEMPT_INVALID');
    var keys = Object.keys(attempt).sort();
    if (keys.length !== 2 || keys[0] !== 'action_type' || keys[1] !== 'letter') throw new Error('ELV2_ATTEMPT_INVALID');
    if (attempt.action_type !== 'GUESS_LETTER') throw new Error('ELV2_ATTEMPT_INVALID');
    if (!ELV2_hangIsLetter_(attempt.letter)) throw new Error('ELV2_ATTEMPT_INVALID');
    return true;
  },

  createRound: function (content, settings, context) {
    this.validateContent(content);
    this.validateSettings(settings || {});
    var itemIndex = settings && settings.item_index ? settings.item_index : 1;
    var item = content.items[itemIndex - 1];
    if (!item) throw new Error('ELV2_CONTENT_INVALID');
    var answer = ELV2_hangCanonical_(item.label);
    return Object.freeze({
      private_state: {
        item_index: itemIndex,
        item_total: content.items.length,
        source_item_id: ELV2_hangText_(item.source_item_id),
        source_term: ELV2_hangText_(item.label),
        clue: ELV2_hangText_(item.hint_es),
        answer: answer,
        guessed_letters: [],
        wrong_letters: [],
        errors_used: 0,
        max_errors: settings && settings.max_errors ? settings.max_errors : 6,
        guesses_by_letter: {},
        action_count: 0,
        completed: false,
        won: false
      },
      scoring_policy: ELV2_SCORING_POLICY.SCORE_IMMEDIATE_PUBLIC,
      visibility_model: ELV2_VISIBILITY_MODEL.SHARED_BOARD,
      submission_policy: ELV2_SUBMISSION_POLICY.MULTI_ACTION
    });
  },

  applyAttempt: function (state, attempt, actor, context) {
    this.validateAttempt(attempt);
    if (!state || typeof state !== 'object' || typeof state.answer !== 'string' || !state.guesses_by_letter) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    if (!actor || typeof actor.student_id !== 'string' || !actor.student_id) throw new Error('ELV2_ACTOR_INVALID');
    if (state.completed === true) throw new Error('ELV2_ROUND_NOT_OPEN');

    var letter = ELV2_hangUpper_(attempt.letter);
    if (Object.prototype.hasOwnProperty.call(state.guesses_by_letter, letter)) {
      throw new Error('ELV2_ALREADY_GUESSED');
    }

    var occurrences = ELV2_hangOccurrences_(state.answer, letter);
    var points = occurrences * 10;
    var nextState = JSON.parse(JSON.stringify(state));
    nextState.guessed_letters.push(letter);
    nextState.action_count = Math.max(0, Number(nextState.action_count || 0)) + 1;
    if (occurrences === 0) {
      nextState.wrong_letters.push(letter);
      nextState.errors_used = Math.max(0, Number(nextState.errors_used || 0)) + 1;
    }
    nextState.guesses_by_letter[letter] = {
      student_id: actor.student_id,
      occurrences: occurrences,
      points_delta: points
    };

    var solved = ELV2_hangSolved_(nextState.answer, nextState.guessed_letters);
    var lost = nextState.errors_used >= nextState.max_errors;
    nextState.completed = solved || lost;
    nextState.won = solved;

    return Object.freeze({
      next_private_state: nextState,
      attempt_result_private: Object.freeze({
        is_correct: occurrences > 0,
        letter: letter,
        occurrences: occurrences
      }),
      points_delta: points,
      public_effects: Object.freeze({}),
      completion_hint: nextState.completed
    });
  },

  publicView: function (state, viewer, phase, context) {
    var mask = ELV2_hangMask_(state.answer, state.guessed_letters || []);
    var view = {
      clue: state.clue,
      item_number: state.item_index,
      item_total: state.item_total,
      pattern: mask.display,
      cells: mask.cells,
      guessed_letters: (state.guessed_letters || []).slice(),
      wrong_letters: (state.wrong_letters || []).slice(),
      errors_used: state.errors_used,
      max_errors: state.max_errors,
      action_count: state.action_count,
      completed: state.completed === true,
      won: state.won === true
    };
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      view.term = state.source_term;
    }
    return view;
  },

  publicSchema: function (viewer, phase, context) {
    var schema = {
      clue: true,
      item_number: true,
      item_total: true,
      pattern: true,
      cells: { $array: { index: true, kind: true, value: true, revealed: true } },
      guessed_letters: { $array: true },
      wrong_letters: { $array: true },
      errors_used: true,
      max_errors: true,
      action_count: true,
      completed: true,
      won: true
    };
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) schema.term = true;
    return schema;
  },

  isComplete: function (state, context) {
    return !!(state && state.completed === true);
  }
});

function ELV2_hangText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function ELV2_hangUpper_(value) {
  return ELV2_hangText_(value).toUpperCase();
}

function ELV2_hangCanonical_(value) {
  return ELV2_hangUpper_(value)
    .replace(/[’‘]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/[ÁÀÂÄÃÅ]/g, 'A')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[ÓÒÔÖÕ]/g, 'O')
    .replace(/[ÚÙÛÜ]/g, 'U')
    .replace(/Ñ/g, 'N')
    .replace(/Ç/g, 'C');
}

function ELV2_hangIsLetter_(value) {
  return /^[A-Z]$/.test(ELV2_hangUpper_(value));
}

function ELV2_hangUniqueLetters_(answer) {
  var seen = {};
  var result = [];
  ELV2_hangCanonical_(answer).split('').forEach(function (char) {
    if (ELV2_hangIsLetter_(char) && !seen[char]) {
      seen[char] = true;
      result.push(char);
    }
  });
  return result;
}

function ELV2_hangOccurrences_(answer, letter) {
  var wanted = ELV2_hangUpper_(letter);
  if (!ELV2_hangIsLetter_(wanted)) return 0;
  return ELV2_hangCanonical_(answer).split('').filter(function (char) { return char === wanted; }).length;
}

function ELV2_hangSolved_(answer, guessedLetters) {
  var guessed = {};
  (guessedLetters || []).forEach(function (letter) { guessed[ELV2_hangUpper_(letter)] = true; });
  var required = ELV2_hangUniqueLetters_(answer);
  return required.length > 0 && required.every(function (letter) { return guessed[letter] === true; });
}

function ELV2_hangMask_(answer, guessedLetters) {
  var guessed = {};
  (guessedLetters || []).forEach(function (letter) { guessed[ELV2_hangUpper_(letter)] = true; });
  var cells = ELV2_hangCanonical_(answer).split('').map(function (char, index) {
    if (ELV2_hangIsLetter_(char)) {
      return { index: index, kind: 'LETTER', value: guessed[char] ? char : '', revealed: guessed[char] === true };
    }
    if (char === ' ') return { index: index, kind: 'SPACE', value: ' ', revealed: true };
    return { index: index, kind: 'PUNCTUATION', value: char, revealed: true };
  });
  return {
    cells: cells,
    display: cells.map(function (cell) {
      if (cell.kind === 'SPACE') return '  ';
      if (cell.kind === 'PUNCTUATION') return cell.value;
      return cell.revealed ? cell.value : '_';
    }).join(' ')
  };
}
