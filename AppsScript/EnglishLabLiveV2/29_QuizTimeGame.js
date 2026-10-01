/** English LAB LIVE v2 · Quiz Time production GamePlugin (E6-QUIZ). */
var ELV2_QUIZ_AREA_SPECS = Object.freeze([
  Object.freeze({ area_id: 'VOCAB', template_id: 'VOCAB_01', item_type: 'MCQ' }),
  Object.freeze({ area_id: 'GRAM', template_id: 'GRAM_01', item_type: 'MCQ' }),
  Object.freeze({ area_id: 'SPEAK', template_id: 'SPEAK_02', item_type: 'MCQ' }),
  Object.freeze({ area_id: 'LISTEN', template_id: 'LISTEN_01', item_type: 'DIALOGUE_MCQ' }),
  Object.freeze({ area_id: 'READ', template_id: 'READ_01', item_type: 'READING_MCQ' })
]);

var ELV2_QuizTimeGame = Object.freeze({
  gameId: function () {
    return 'QUIZ_TIME';
  },

  gameVersion: function () {
    return '2.0.0';
  },

  validateContent: function (content) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('ELV2_CONTENT_INVALID');
    if (content.content_type !== 'QUIZ_TIME_POOL') throw new Error('ELV2_CONTENT_INVALID');
    if (!Array.isArray(content.items) || content.items.length !== 25) throw new Error('ELV2_CONTENT_INVALID');

    var counts = {};
    var playIds = {};
    var sourceIds = {};
    ELV2_QUIZ_AREA_SPECS.forEach(function (spec) { counts[spec.area_id] = 0; });

    content.items.forEach(function (item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('ELV2_CONTENT_INVALID');
      var spec = ELV2_quizSpec_(item.area_id, item.template_id, item.item_type);
      if (!spec) throw new Error('ELV2_CONTENT_INVALID');
      var playId = ELV2_quizText_(item.play_item_id);
      var sourceId = ELV2_quizText_(item.source_item_id);
      var stem = ELV2_quizText_(item.stem);
      var correct = ELV2_quizUpper_(item.correct_option);
      if (!playId || !sourceId || playIds[playId] || sourceIds[sourceId] || !stem || !/^[ABCD]$/.test(correct)) {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some(function (option) {
        return !ELV2_quizText_(option);
      })) {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      if ((spec.item_type === 'DIALOGUE_MCQ' || spec.item_type === 'READING_MCQ') &&
          !ELV2_quizText_(item.mini_text_or_dialogue)) {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      playIds[playId] = true;
      sourceIds[sourceId] = true;
      counts[spec.area_id] += 1;
    });

    ELV2_QUIZ_AREA_SPECS.forEach(function (spec) {
      if (counts[spec.area_id] !== 5) throw new Error('ELV2_CONTENT_INVALID');
    });
    return true;
  },

  validateSettings: function (settings) {
    if (settings == null) return true;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.keys(settings).length !== 0) {
      throw new Error('ELV2_SETTINGS_INVALID');
    }
    return true;
  },

  validateAttempt: function (attempt) {
    if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)) throw new Error('ELV2_ATTEMPT_INVALID');
    var keys = Object.keys(attempt).sort();
    if (keys.length !== 2 || keys[0] !== 'action_type' || keys[1] !== 'answers') throw new Error('ELV2_ATTEMPT_INVALID');
    if (attempt.action_type !== 'SUBMIT_QUIZ') throw new Error('ELV2_ATTEMPT_INVALID');
    if (!Array.isArray(attempt.answers) || attempt.answers.length !== 10) throw new Error('ELV2_ATTEMPT_INVALID');
    var questionIds = {};
    attempt.answers.forEach(function (answer) {
      if (!answer || typeof answer !== 'object' || Array.isArray(answer)) throw new Error('ELV2_ATTEMPT_INVALID');
      var answerKeys = Object.keys(answer).sort();
      if (answerKeys.length !== 2 || answerKeys[0] !== 'option_id' || answerKeys[1] !== 'question_id') {
        throw new Error('ELV2_ATTEMPT_INVALID');
      }
      if (typeof answer.question_id !== 'string' || !answer.question_id || answer.question_id.length > 128 ||
          typeof answer.option_id !== 'string' || !answer.option_id || answer.option_id.length > 128 ||
          questionIds[answer.question_id]) {
        throw new Error('ELV2_ATTEMPT_INVALID');
      }
      questionIds[answer.question_id] = true;
    });
    return true;
  },

  createRound: function (content, settings, context) {
    this.validateContent(content);
    this.validateSettings(settings || {});
    if (!context || typeof context.opaque_id_factory !== 'function') throw new Error('ELV2_GAME_CONTEXT_INVALID');

    var selected = [];
    ELV2_QUIZ_AREA_SPECS.forEach(function (spec) {
      content.items.filter(function (item) {
        return item.area_id === spec.area_id && item.template_id === spec.template_id && item.item_type === spec.item_type;
      }).slice().sort(function (a, b) {
        return ELV2_quizText_(a.play_item_id).localeCompare(ELV2_quizText_(b.play_item_id));
      }).slice(0, 2).forEach(function (item) {
        selected.push(item);
      });
    });
    if (selected.length !== 10) throw new Error('ELV2_CONTENT_INVALID');

    var seenOpaqueIds = {};
    function opaqueId_() {
      var value = context.opaque_id_factory();
      if (typeof value !== 'string' || !value || value.length > 128 || seenOpaqueIds[value]) {
        throw new Error('ELV2_GAME_TOKEN_ID_INVALID');
      }
      seenOpaqueIds[value] = true;
      return value;
    }

    var questions = selected.map(function (item) {
      var questionId = opaqueId_();
      var optionLetters = ['A', 'B', 'C', 'D'];
      var options = optionLetters.map(function (letter, index) {
        return {
          option_id: opaqueId_(),
          source_letter: letter,
          label: ELV2_quizText_(item.options[index])
        };
      });
      var correctLetter = ELV2_quizUpper_(item.correct_option);
      var correctOption = options.filter(function (option) { return option.source_letter === correctLetter; })[0];
      if (!correctOption) throw new Error('ELV2_CONTENT_INVALID');
      var publicOptions = options.map(function (option) {
        return { option_id: option.option_id, label: option.label };
      }).sort(function (a, b) {
        return String(a.option_id).localeCompare(String(b.option_id));
      });
      return {
        question_id: questionId,
        play_item_id: ELV2_quizText_(item.play_item_id),
        source_item_id: ELV2_quizText_(item.source_item_id),
        area_id: item.area_id,
        template_id: item.template_id,
        item_type: item.item_type,
        prompt: ELV2_quizText_(item.prompt_es),
        stem: ELV2_quizText_(item.stem),
        context_text: ELV2_quizText_(item.mini_text_or_dialogue),
        options: publicOptions,
        correct_option_id: correctOption.option_id,
        correct_option_label: correctOption.label,
        feedback: ELV2_quizText_(item.explanation_es)
      };
    }).sort(function (a, b) {
      return String(a.question_id).localeCompare(String(b.question_id));
    });

    return Object.freeze({
      private_state: {
        question_count: questions.length,
        questions: questions,
        submissions: {}
      },
      scoring_policy: ELV2_SCORING_POLICY.SCORE_ON_REVEAL,
      visibility_model: ELV2_VISIBILITY_MODEL.PRIVATE_RESPONSE,
      submission_policy: ELV2_SUBMISSION_POLICY.SINGLE_FINAL
    });
  },

  applyAttempt: function (state, attempt, actor, context) {
    this.validateAttempt(attempt);
    if (!state || typeof state !== 'object' || !Array.isArray(state.questions) || state.questions.length !== 10 || !state.submissions) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    if (!actor || typeof actor.student_id !== 'string' || !actor.student_id) throw new Error('ELV2_ACTOR_INVALID');
    if (Object.prototype.hasOwnProperty.call(state.submissions, actor.student_id)) throw new Error('ELV2_ALREADY_SUBMITTED');

    var questionMap = {};
    state.questions.forEach(function (question) { questionMap[question.question_id] = question; });
    var seenQuestions = {};
    var results = attempt.answers.map(function (answer) {
      var question = questionMap[answer.question_id];
      if (!question || seenQuestions[answer.question_id]) throw new Error('ELV2_INVALID_SELECTION');
      seenQuestions[answer.question_id] = true;
      var option = question.options.filter(function (candidate) { return candidate.option_id === answer.option_id; })[0];
      if (!option) throw new Error('ELV2_INVALID_SELECTION');
      var isCorrect = answer.option_id === question.correct_option_id;
      return {
        question_id: answer.question_id,
        selected_option_id: answer.option_id,
        is_correct: isCorrect,
        points_delta: isCorrect ? 10 : 0
      };
    });
    if (Object.keys(seenQuestions).length !== state.questions.length) throw new Error('ELV2_INVALID_SELECTION');

    var points = results.reduce(function (sum, result) { return sum + result.points_delta; }, 0);
    var nextState = JSON.parse(JSON.stringify(state));
    nextState.submissions[actor.student_id] = {
      answers: results,
      points_delta: points,
      correct_count: points / 10
    };

    return Object.freeze({
      next_private_state: nextState,
      attempt_result_private: Object.freeze({
        answers: results,
        points_delta: points,
        correct_count: points / 10
      }),
      points_delta: points,
      public_effects: Object.freeze({}),
      completion_hint: false
    });
  },

  publicView: function (state, viewer, phase, context) {
    var studentId = viewer && viewer.student_id;
    var ownSubmission = studentId && state.submissions ? state.submissions[studentId] : null;
    var view = {
      question_count: state.question_count,
      questions: state.questions.map(function (question) {
        return {
          question_id: question.question_id,
          area_id: question.area_id,
          prompt: question.prompt,
          stem: question.stem,
          context_text: question.context_text,
          options: question.options.map(function (option) {
            return { option_id: option.option_id, label: option.label };
          })
        };
      }),
      response_count: Object.keys(state.submissions || {}).length
    };
    if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) view.has_submitted = !!ownSubmission;

    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      view.answer_key = state.questions.map(function (question) {
        return {
          question_id: question.question_id,
          correct_option_id: question.correct_option_id,
          correct_option_label: question.correct_option_label,
          explanation: question.feedback
        };
      });
      if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) {
        view.viewer_result = ownSubmission ? {
          answers: ownSubmission.answers.map(function (answer) {
            return {
              question_id: answer.question_id,
              selected_option_id: answer.selected_option_id,
              is_correct: answer.is_correct,
              points_awarded: answer.points_delta
            };
          }),
          correct_count: ownSubmission.correct_count,
          score: ownSubmission.points_delta
        } : null;
      }
    }
    return view;
  },

  publicSchema: function (viewer, phase, context) {
    var schema = {
      question_count: true,
      questions: { $array: {
        question_id: true,
        area_id: true,
        prompt: true,
        stem: true,
        context_text: true,
        options: { $array: { option_id: true, label: true } }
      } },
      response_count: true
    };
    if (viewer && viewer.view_mode === ELV2_VIEW_MODE.STUDENT) schema.has_submitted = true;
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      schema.answer_key = true;
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

function ELV2_quizText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function ELV2_quizUpper_(value) {
  return ELV2_quizText_(value).toUpperCase();
}

function ELV2_quizSpec_(areaId, templateId, itemType) {
  var area = ELV2_quizUpper_(areaId);
  var template = ELV2_quizUpper_(templateId);
  var type = ELV2_quizUpper_(itemType);
  for (var i = 0; i < ELV2_QUIZ_AREA_SPECS.length; i += 1) {
    var spec = ELV2_QUIZ_AREA_SPECS[i];
    if (spec.area_id === area && spec.template_id === template && spec.item_type === type) return spec;
  }
  return null;
}
