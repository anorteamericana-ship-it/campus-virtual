/** English LAB LIVE v2 · Sentence Order production GamePlugin (E6-SO). */
var ELV2_SentenceOrderGame = Object.freeze({
  gameId: function () {
    return 'SENTENCE_ORDER';
  },

  gameVersion: function () {
    return '2.0.0';
  },

  validateContent: function (content) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('ELV2_CONTENT_INVALID');
    if (content.content_type !== 'SENTENCE_ORDER_SET') throw new Error('ELV2_CONTENT_INVALID');
    if (!Array.isArray(content.items) || content.items.length !== 5) throw new Error('ELV2_CONTENT_INVALID');

    var playIds = {};
    var sourceIds = {};
    content.items.forEach(function (item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('ELV2_CONTENT_INVALID');
      if (item.template_id !== 'GRAM_02' || item.item_type !== 'ORDER') throw new Error('ELV2_CONTENT_INVALID');
      var playId = ELV2_soText_(item.play_item_id);
      var sourceId = ELV2_soText_(item.source_item_id);
      var sentence = ELV2_soText_(item.correct_sentence);
      var wordsToOrder = ELV2_soText_(item.words_to_order);
      var words = ELV2_soSentenceWords_(sentence);
      if (!playId || !sourceId || playIds[playId] || sourceIds[sourceId]) throw new Error('ELV2_CONTENT_INVALID');
      if (!wordsToOrder || words.length < 3 || words.length > 18) throw new Error('ELV2_CONTENT_INVALID');
      if (ELV2_soDistinctLabels_(words) < 2) throw new Error('ELV2_CONTENT_INVALID');
      playIds[playId] = true;
      sourceIds[sourceId] = true;
    });
    return true;
  },

  validateSettings: function (settings) {
    if (settings == null) return true;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('ELV2_SETTINGS_INVALID');
    var keys = Object.keys(settings);
    if (keys.length > 1 || (keys.length === 1 && keys[0] !== 'item_index')) throw new Error('ELV2_SETTINGS_INVALID');
    if (Object.prototype.hasOwnProperty.call(settings, 'item_index') &&
        (!Number.isInteger(settings.item_index) || settings.item_index < 1 || settings.item_index > 5)) {
      throw new Error('ELV2_SETTINGS_INVALID');
    }
    return true;
  },

  validateAttempt: function (attempt) {
    if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)) throw new Error('ELV2_ATTEMPT_INVALID');
    var keys = Object.keys(attempt).sort();
    if (keys.length !== 2 || keys[0] !== 'action_type' || keys[1] !== 'token_ids') throw new Error('ELV2_ATTEMPT_INVALID');
    if (attempt.action_type !== 'SUBMIT_ORDER') throw new Error('ELV2_ATTEMPT_INVALID');
    if (!Array.isArray(attempt.token_ids) || attempt.token_ids.length < 3 || attempt.token_ids.length > 18) {
      throw new Error('ELV2_ATTEMPT_INVALID');
    }
    var seen = {};
    attempt.token_ids.forEach(function (tokenId) {
      if (typeof tokenId !== 'string' || !tokenId || tokenId.length > 128 || seen[tokenId]) {
        throw new Error('ELV2_ATTEMPT_INVALID');
      }
      seen[tokenId] = true;
    });
    return true;
  },

  createRound: function (content, settings, context) {
    this.validateContent(content);
    this.validateSettings(settings || {});
    if (!context || typeof context.opaque_id_factory !== 'function') {
      throw new Error('ELV2_GAME_CONTEXT_INVALID');
    }

    var itemIndex = settings && settings.item_index ? settings.item_index : 1;
    var item = content.items[itemIndex - 1];
    if (!item) throw new Error('ELV2_CONTENT_INVALID');
    var words = ELV2_soSentenceWords_(item.correct_sentence);
    var seenTokenIds = {};
    var canonicalTokens = words.map(function (word) {
      var tokenId = context.opaque_id_factory();
      if (typeof tokenId !== 'string' || !tokenId || tokenId.length > 128 || seenTokenIds[tokenId]) {
        throw new Error('ELV2_GAME_TOKEN_ID_INVALID');
      }
      seenTokenIds[tokenId] = true;
      return { token_id: tokenId, label: word };
    });
    var solutionTokenIds = canonicalTokens.map(function (token) { return token.token_id; });
    var displayTokens = canonicalTokens.slice().sort(function (a, b) {
      return String(a.token_id).localeCompare(String(b.token_id));
    });
    if (ELV2_soEqualOrder_(displayTokens.map(function (token) { return token.token_id; }), solutionTokenIds)) {
      displayTokens.push(displayTokens.shift());
    }

    return Object.freeze({
      private_state: {
        item_index: itemIndex,
        item_total: content.items.length,
        play_item_id: ELV2_soText_(item.play_item_id),
        source_item_id: ELV2_soText_(item.source_item_id),
        prompt: ELV2_soText_(item.prompt_es) || 'Ordená las palabras para formar la oración.',
        stem: ELV2_soText_(item.stem),
        display_tokens: displayTokens.map(function (token) {
          return { token_id: token.token_id, label: token.label };
        }),
        solution_token_ids: solutionTokenIds,
        answer_sentence: ELV2_soText_(item.correct_sentence),
        feedback: ELV2_soText_(item.explanation_es),
        submissions: {}
      },
      scoring_policy: ELV2_SCORING_POLICY.SCORE_ON_REVEAL,
      visibility_model: ELV2_VISIBILITY_MODEL.PRIVATE_RESPONSE,
      submission_policy: ELV2_SUBMISSION_POLICY.SINGLE_FINAL
    });
  },

  applyAttempt: function (state, attempt, actor, context) {
    this.validateAttempt(attempt);
    if (!state || typeof state !== 'object' || !Array.isArray(state.display_tokens) || !Array.isArray(state.solution_token_ids)) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    if (!actor || typeof actor.student_id !== 'string' || !actor.student_id) throw new Error('ELV2_ACTOR_INVALID');
    if (Object.prototype.hasOwnProperty.call(state.submissions || {}, actor.student_id)) {
      throw new Error('ELV2_ALREADY_SUBMITTED');
    }

    var availableTokenIds = state.display_tokens.map(function (token) { return token.token_id; });
    if (!ELV2_soSameTokenSet_(attempt.token_ids, availableTokenIds)) throw new Error('ELV2_INVALID_SELECTION');

    var isCorrect = ELV2_soEqualOrder_(attempt.token_ids, state.solution_token_ids);
    var nextState = JSON.parse(JSON.stringify(state));
    nextState.submissions[actor.student_id] = {
      token_ids: attempt.token_ids.slice(),
      is_correct: isCorrect,
      points_delta: isCorrect ? 10 : 0
    };

    return Object.freeze({
      next_private_state: nextState,
      attempt_result_private: Object.freeze({
        is_correct: isCorrect,
        token_ids: attempt.token_ids.slice()
      }),
      points_delta: isCorrect ? 10 : 0,
      public_effects: Object.freeze({}),
      completion_hint: false
    });
  },

  publicView: function (state, viewer, phase, context) {
    var studentId = viewer && viewer.student_id;
    var submissions = state && state.submissions ? state.submissions : {};
    var ownSubmission = studentId && submissions[studentId] ? submissions[studentId] : null;
    var view = {
      prompt: state.prompt,
      stem: state.stem,
      item_number: state.item_index,
      item_total: state.item_total,
      tokens: state.display_tokens.map(function (token) {
        return { token_id: token.token_id, label: token.label };
      }),
      response_count: Object.keys(submissions).length
    };
    if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) {
      view.has_submitted = !!ownSubmission;
    }

    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      view.answer_sentence = state.answer_sentence;
      view.answer_token_ids = state.solution_token_ids.slice();
      if (state.feedback) view.feedback = state.feedback;
      if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) {
        view.viewer_result = ownSubmission ? {
          submitted_token_ids: ownSubmission.token_ids.slice(),
          is_correct: ownSubmission.is_correct,
          points_awarded: ownSubmission.points_delta
        } : null;
      }
    }
    return view;
  },

  publicSchema: function (viewer, phase, context) {
    var schema = {
      prompt: true,
      stem: true,
      item_number: true,
      item_total: true,
      tokens: { $array: { token_id: true, label: true } },
      response_count: true
    };
    if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) schema.has_submitted = true;
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      schema.answer_sentence = true;
      schema.answer_token_ids = { $array: true };
      schema.feedback = true;
      if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) schema.viewer_result = true;
    }
    return schema;
  },

  isComplete: function (state, context) {
    if (!state || !state.submissions || !context || !Array.isArray(context.active_student_ids)) return false;
    if (context.active_student_ids.length === 0) return false;
    return context.active_student_ids.every(function (studentId) {
      return Object.prototype.hasOwnProperty.call(state.submissions, studentId);
    });
  }
});

function ELV2_soText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function ELV2_soSentenceWords_(sentence) {
  return ELV2_soText_(sentence).split(/\s+/g).filter(function (word) { return !!word; });
}

function ELV2_soDistinctLabels_(words) {
  var seen = {};
  words.forEach(function (word) { seen[ELV2_soText_(word).toLowerCase()] = true; });
  return Object.keys(seen).length;
}

function ELV2_soEqualOrder_(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
  for (var i = 0; i < expected.length; i += 1) {
    if (actual[i] !== expected[i]) return false;
  }
  return true;
}

function ELV2_soSameTokenSet_(actual, expected) {
  if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
  var seen = {};
  for (var i = 0; i < actual.length; i += 1) {
    if (seen[actual[i]]) return false;
    seen[actual[i]] = true;
  }
  for (var j = 0; j < expected.length; j += 1) {
    if (!seen[expected[j]]) return false;
  }
  return true;
}
