/** English LAB LIVE v2 · test-only plugin proving the game contract. */
var ELV2_ContractProbeGame = Object.freeze({
  gameId: function () {
    return 'CONTRACT_PROBE';
  },

  gameVersion: function () {
    return '1.0.0-test';
  },

  validateContent: function (content) {
    if (!content || typeof content !== 'object') throw new Error('ELV2_CONTENT_INVALID');
    if (typeof content.prompt !== 'string' || !content.prompt.trim()) throw new Error('ELV2_CONTENT_INVALID');
    if (!Array.isArray(content.options) || content.options.length < 2) throw new Error('ELV2_CONTENT_INVALID');
    if (typeof content.solution_option_id !== 'string' || !content.solution_option_id) throw new Error('ELV2_CONTENT_INVALID');

    var optionIds = {};
    content.options.forEach(function (option) {
      if (!option || typeof option.id !== 'string' || !option.id || typeof option.label !== 'string') {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      if (optionIds[option.id]) throw new Error('ELV2_CONTENT_INVALID');
      optionIds[option.id] = true;
    });
    if (!optionIds[content.solution_option_id]) throw new Error('ELV2_CONTENT_INVALID');
    return true;
  },

  validateSettings: function (settings) {
    if (settings == null) return true;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('ELV2_SETTINGS_INVALID');
    if (Object.keys(settings).length !== 0) throw new Error('ELV2_SETTINGS_INVALID');
    return true;
  },

  validateAttempt: function (action) {
    if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('ELV2_ATTEMPT_INVALID');
    var keys = Object.keys(action).sort();
    if (keys.length !== 2 || keys[0] !== 'action_type' || keys[1] !== 'option_id') throw new Error('ELV2_ATTEMPT_INVALID');
    if (action.action_type !== 'SELECT_OPTION') throw new Error('ELV2_ATTEMPT_INVALID');
    if (typeof action.option_id !== 'string' || !action.option_id) throw new Error('ELV2_ATTEMPT_INVALID');
    return true;
  },

  createRound: function (content, settings, context) {
    this.validateContent(content);
    this.validateSettings(settings);
    var state = {
      prompt: content.prompt,
      options: content.options.map(function (option) {
        return { id: option.id, label: option.label };
      }),
      solution_option_id: content.solution_option_id,
      submissions: {}
    };
    return Object.freeze({
      private_state: state,
      scoring_policy: ELV2_SCORING_POLICY.SCORE_ON_REVEAL,
      visibility_model: ELV2_VISIBILITY_MODEL.PRIVATE_RESPONSE,
      submission_policy: ELV2_SUBMISSION_POLICY.SINGLE_FINAL
    });
  },

  applyAttempt: function (state, action, actor, context) {
    this.validateAttempt(action);
    if (!actor || typeof actor.student_id !== 'string' || !actor.student_id) {
      throw new Error('ELV2_ACTOR_INVALID');
    }
    var optionExists = state.options.some(function (option) { return option.id === action.option_id; });
    if (!optionExists) throw new Error('ELV2_ATTEMPT_INVALID');
    if (Object.prototype.hasOwnProperty.call(state.submissions, actor.student_id)) {
      throw new Error('ELV2_ALREADY_SUBMITTED');
    }

    var nextState = JSON.parse(JSON.stringify(state));
    var isCorrect = action.option_id === state.solution_option_id;
    nextState.submissions[actor.student_id] = {
      option_id: action.option_id,
      is_correct: isCorrect,
      points_delta: isCorrect ? 10 : 0
    };

    return Object.freeze({
      next_private_state: nextState,
      attempt_result_private: Object.freeze({ is_correct: isCorrect, option_id: action.option_id }),
      points_delta: isCorrect ? 10 : 0,
      public_effects: Object.freeze({}),
      completion_hint: false
    });
  },

  publicView: function (state, viewer, phase, context) {
    var studentId = viewer && viewer.student_id;
    var ownSubmission = studentId && state.submissions[studentId] ? state.submissions[studentId] : null;
    var view = {
      prompt: state.prompt,
      options: state.options.map(function (option) { return { id: option.id, label: option.label }; }),
      has_submitted: !!ownSubmission
    };

    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      view.solution_option_id = state.solution_option_id;
      view.viewer_result = ownSubmission ? {
        option_id: ownSubmission.option_id,
        is_correct: ownSubmission.is_correct,
        points_awarded: ownSubmission.points_delta
      } : null;
    }
    return view;
  },

  publicSchema: function (viewer, phase, context) {
    var schema = {
      prompt: true,
      options: { $array: { id: true, label: true } },
      has_submitted: true
    };
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      schema.solution_option_id = true;
      schema.viewer_result = true;
    }
    return schema;
  },

  isComplete: function (state, context) {
    if (!context || !Array.isArray(context.active_student_ids)) return false;
    if (context.active_student_ids.length === 0) return false;
    return context.active_student_ids.every(function (studentId) {
      return Object.prototype.hasOwnProperty.call(state.submissions, studentId);
    });
  }
});
