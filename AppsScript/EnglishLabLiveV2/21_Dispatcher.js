/** English LAB LIVE v2 · isolated internal dispatcher. No doPost/doGet ownership. */
function ELV2_createDispatcher(deps) {
  if (!deps || !deps.roomEngine || !deps.roundEngine || !deps.roundLifecycle || !deps.stateService ||
      !deps.contentResolver || !deps.idempotencyService || !deps.clock || typeof deps.traceIdFactory !== 'function') {
    throw new Error('ELV2_DISPATCHER_DEPS_INVALID');
  }

  function successEnvelope_(request, traceId, state, data) {
    return Object.freeze({
      ok: true,
      api_version: ELV2_API_VERSION,
      service_version: ELV2_SERVICE_VERSION,
      action: request.action,
      request_id: request.request_id || '',
      trace_id: traceId,
      server_now: deps.clock.nowMs(),
      state_revision: state && state.state_revision != null ? state.state_revision : null,
      data: data || {},
      view: state || null
    });
  }

  function errorEnvelope_(request, traceId, code) {
    return Object.freeze({
      ok: false,
      api_version: ELV2_API_VERSION,
      service_version: ELV2_SERVICE_VERSION,
      action: request && request.action ? request.action : '',
      request_id: request && request.request_id ? request.request_id : '',
      trace_id: traceId,
      server_now: deps.clock.nowMs(),
      state_revision: null,
      error: Object.freeze({
        code: code,
        message: ELV2_safeErrorMessage_(code)
      })
    });
  }

  function execute_(request, actor) {
    var payload = request.payload || {};
    if (request.action === 'createRoom') {
      return deps.roomEngine.createRoom(actor, { title: payload.title || '', config: payload.config || {} });
    }
    if (request.action === 'joinRoom') {
      return deps.roomEngine.joinRoom(actor, { room_id: request.room_id || '', room_code: request.room_code || '' });
    }
    if (request.action === 'getState') {
      return deps.stateService.getState(actor, {
        room_id: request.room_id,
        known_revision: request.client_seen_revision,
        view_mode: payload.view_mode
      });
    }
    if (request.action === 'startRoom') {
      return deps.roomEngine.startRoom(actor, request.room_id, payload.expected_revision);
    }
    if (request.action === 'prepareRound') {
      var resolved = deps.contentResolver.resolve(payload.content_ref, payload.game_id, {
        actor_user_id: actor.user_id,
        room_id: request.room_id
      });
      return deps.roundEngine.prepareRound(actor, {
        room_id: request.room_id,
        expected_revision: payload.expected_revision,
        game_id: payload.game_id,
        content_ref: resolved.content_ref,
        content_version: resolved.content_version,
        resolved_content: resolved.content,
        settings: payload.settings || {}
      });
    }
    if (request.action === 'openRound') {
      return deps.roundEngine.openRound(actor, {
        room_id: request.room_id,
        round_id: request.round_id,
        expected_revision: payload.expected_revision,
        duration_ms: payload.duration_ms
      });
    }
    if (request.action === 'lockRound') {
      return deps.roundEngine.lockRound(actor, {
        room_id: request.room_id,
        round_id: request.round_id,
        expected_revision: payload.expected_revision
      });
    }
    if (request.action === 'revealRound') {
      return deps.roundEngine.revealRound(actor, {
        room_id: request.room_id,
        round_id: request.round_id,
        expected_revision: payload.expected_revision,
        reveal_duration_ms: payload.reveal_duration_ms
      });
    }
    if (request.action === 'submitAttempt') {
      return deps.roundEngine.submitAttempt(actor, {
        room_id: request.room_id,
        round_id: request.round_id,
        request_id: request.request_id,
        client_seen_revision: request.client_seen_revision,
        attempt: payload
      });
    }
    if (request.action === 'closeRound') {
      return deps.roundLifecycle.closeRound(actor, {
        room_id: request.room_id,
        round_id: request.round_id,
        expected_revision: payload.expected_revision,
        reason: payload.reason || ''
      });
    }
    if (request.action === 'closeRoom') {
      return deps.roomEngine.closeRoom(actor, {
        room_id: request.room_id,
        expected_revision: payload.expected_revision,
        reason: payload.reason || ''
      });
    }
    throw new Error('ELV2_INVALID_ACTION');
  }

  function effectFromResult_(action, result) {
    var room = result && result.room ? result.room : (result && result.room_id ? result : null);
    var round = result && result.round ? result.round : null;
    var player = result && result.player ? result.player : null;
    var attempt = result && result.attempt ? result.attempt : null;

    if (action === 'createRoom' && result && result.room_id) {
      return { effect_type: 'ROOM', effect_id: result.room_id, room_id: result.room_id, round_id: '', revision_after: result.state_revision };
    }
    if (action === 'joinRoom') {
      return { effect_type: 'PLAYER', effect_id: player ? player.player_id : '', room_id: room ? room.room_id : '', round_id: '', revision_after: room ? room.state_revision : null };
    }
    if (action === 'submitAttempt') {
      return { effect_type: 'ATTEMPT', effect_id: attempt ? attempt.attempt_id : '', room_id: room ? room.room_id : '', round_id: round ? round.round_id : '', revision_after: room ? room.state_revision : null };
    }
    if (round) {
      return { effect_type: 'ROUND', effect_id: round.round_id, room_id: room ? room.room_id : round.room_id, round_id: round.round_id, revision_after: room ? room.state_revision : null };
    }
    if (room) {
      return { effect_type: 'ROOM', effect_id: room.room_id, room_id: room.room_id, round_id: '', revision_after: room.state_revision };
    }
    return { effect_type: 'MUTATION', effect_id: '', room_id: '', round_id: '', revision_after: null };
  }

  function freshState_(actor, roomId, requestedMode) {
    if (!roomId) return null;
    return deps.stateService.getState(actor, {
      room_id: roomId,
      view_mode: requestedMode || undefined
    });
  }

  function dispatch(rawRequest, actor) {
    var traceId = deps.traceIdFactory();
    var request;
    try {
      request = ELV2_validateRequestEnvelope(rawRequest);
    } catch (error) {
      return errorEnvelope_(rawRequest || {}, traceId, ELV2_publicErrorCode_(error));
    }

    if (!actor || typeof actor.user_id !== 'string' || !actor.user_id) {
      return errorEnvelope_(request, traceId, 'AUTH_REQUIRED');
    }

    if (request.action === 'getState') {
      try {
        var stateOnly = execute_(request, actor);
        return successEnvelope_(request, traceId, stateOnly, { replayed: false });
      } catch (readError) {
        return errorEnvelope_(request, traceId, ELV2_publicErrorCode_(readError));
      }
    }

    var idempotency;
    try {
      idempotency = deps.idempotencyService.begin({
        action: request.action,
        actor_user_id: actor.user_id,
        request_id: request.request_id,
        room_id: request.room_id,
        round_id: request.round_id,
        payload: {
          room_id: request.room_id,
          room_code: request.room_code,
          round_id: request.round_id,
          client_seen_revision: request.client_seen_revision,
          payload: request.payload
        }
      });
    } catch (idempotencyError) {
      return errorEnvelope_(request, traceId, ELV2_publicErrorCode_(idempotencyError));
    }

    if (idempotency.decision === ELV2_IDEMPOTENCY_DECISION.CONFLICT) {
      return errorEnvelope_(request, traceId, 'REQUEST_ID_CONFLICT');
    }
    if (idempotency.decision === ELV2_IDEMPOTENCY_DECISION.IN_PROGRESS) {
      return errorEnvelope_(request, traceId, 'BUSY_RETRY');
    }
    if (idempotency.decision === ELV2_IDEMPOTENCY_DECISION.REPLAY_COMMITTED) {
      var replayRecord = idempotency.record;
      if (replayRecord.result_code && replayRecord.result_code !== 'OK') {
        return errorEnvelope_(request, traceId, replayRecord.result_code);
      }
      try {
        var replayState = freshState_(actor, replayRecord.room_id, request.payload && request.payload.view_mode);
        return successEnvelope_(request, traceId, replayState, {
          replayed: true,
          effect: Object.freeze({ type: replayRecord.effect_type, id: replayRecord.effect_id })
        });
      } catch (replayStateError) {
        return errorEnvelope_(request, traceId, ELV2_publicErrorCode_(replayStateError));
      }
    }

    try {
      var result = execute_(request, actor);
      var effect = effectFromResult_(request.action, result);
      effect.result_code = 'OK';
      deps.idempotencyService.commit(idempotency.record, effect);
      var requestedMode = request.payload && request.payload.view_mode;
      var state = freshState_(actor, effect.room_id, requestedMode);
      return successEnvelope_(request, traceId, state, {
        replayed: false,
        effect: Object.freeze({ type: effect.effect_type, id: effect.effect_id })
      });
    } catch (mutationError) {
      var code = ELV2_publicErrorCode_(mutationError);
      try {
        if (ELV2_isDeterministicMutationError_(code)) {
          deps.idempotencyService.commit(idempotency.record, {
            effect_type: 'REJECTION',
            effect_id: '',
            room_id: request.room_id,
            round_id: request.round_id,
            revision_after: null,
            result_code: code
          });
        } else {
          deps.idempotencyService.fail(idempotency.record, code);
        }
      } catch (idempotencyFinalizeError) {
        return errorEnvelope_(request, traceId, 'INTERNAL_ERROR');
      }
      return errorEnvelope_(request, traceId, code);
    }
  }

  return Object.freeze({ dispatch: dispatch });
}

function ELV2_publicErrorCode_(error) {
  var message = error && error.message ? String(error.message) : '';
  if (message.indexOf('ELV2_FORBIDDEN') === 0) return 'FORBIDDEN';
  if (message.indexOf('ELV2_AUTH_REQUIRED') === 0) return 'AUTH_REQUIRED';
  if (message.indexOf('ELV2_ROOM_NOT_AVAILABLE') === 0 || message.indexOf('ELV2_ROOM_NOT_LIVE') === 0) return 'ROOM_NOT_AVAILABLE';
  if (message.indexOf('ELV2_ROOM_CLOSED') === 0) return 'ROOM_CLOSED';
  if (message.indexOf('ELV2_DEADLINE_PASSED') === 0) return 'DEADLINE_PASSED';
  if (message.indexOf('ELV2_STATE_CHANGED') === 0) return 'STATE_CHANGED';
  if (message.indexOf('ELV2_REQUEST_ID_CONFLICT') === 0) return 'REQUEST_ID_CONFLICT';
  if (message.indexOf('ELV2_BUSY_RETRY') === 0) return 'BUSY_RETRY';
  if (message.indexOf('ELV2_GAME_NOT_AVAILABLE') === 0) return 'GAME_NOT_AVAILABLE';
  if (message.indexOf('ELV2_CONTENT_NOT_COMPATIBLE') === 0) return 'CONTENT_NOT_COMPATIBLE';
  if (message.indexOf('ELV2_CONTENT_INVALID') === 0) return 'CONTENT_INVALID';
  if (message.indexOf('ELV2_SCHEMA_UNHEALTHY') === 0) return 'SCHEMA_UNHEALTHY';
  if (message.indexOf('ELV2_ALREADY_SUBMITTED') === 0) return 'ALREADY_SUBMITTED';
  if (message.indexOf('ELV2_ALREADY_GUESSED') === 0) return 'ALREADY_GUESSED';
  if (message.indexOf('ELV2_ALREADY_CLAIMED') === 0) return 'ALREADY_CLAIMED';
  if (message.indexOf('ELV2_INVALID_SELECTION') === 0) return 'INVALID_SELECTION';
  if (message.indexOf('ELV2_ROUND_NOT_OPEN') === 0 || message.indexOf('ELV2_ROUND_NOT_AVAILABLE') === 0 ||
      message.indexOf('ELV2_ROUND_NOT_CURRENT') === 0 || message.indexOf('ELV2_INVALID_ROUND_TRANSITION') === 0) return 'ROUND_NOT_OPEN';
  if (message.indexOf('ELV2_INVALID') === 0 || message.indexOf('ELV2_REQUEST_ID_') === 0 || message.indexOf('ELV2_REQUIRED_STRING_') === 0) return 'INVALID_REQUEST';
  return 'INTERNAL_ERROR';
}

function ELV2_isDeterministicMutationError_(code) {
  return [
    'AUTH_REQUIRED', 'FORBIDDEN', 'ROOM_NOT_AVAILABLE', 'ROOM_CLOSED', 'ROUND_NOT_OPEN',
    'DEADLINE_PASSED', 'STATE_CHANGED', 'INVALID_REQUEST', 'REQUEST_ID_CONFLICT',
    'GAME_NOT_AVAILABLE', 'CONTENT_INVALID', 'CONTENT_NOT_COMPATIBLE', 'ALREADY_SUBMITTED',
    'ALREADY_GUESSED', 'ALREADY_CLAIMED', 'INVALID_SELECTION'
  ].indexOf(code) !== -1;
}

function ELV2_safeErrorMessage_(code) {
  var messages = {
    AUTH_REQUIRED: 'Necesitas volver a iniciar sesión.',
    FORBIDDEN: 'No tienes permiso para realizar esta acción.',
    ROOM_NOT_AVAILABLE: 'No pudimos acceder a esa sala.',
    ROOM_CLOSED: 'Esta sala ya terminó.',
    ROUND_NOT_OPEN: 'La ronda ya no acepta esta acción.',
    DEADLINE_PASSED: 'La ronda ya no acepta respuestas.',
    STATE_CHANGED: 'La sala cambió. Actualiza el estado e inténtalo de nuevo.',
    INVALID_REQUEST: 'La solicitud no es válida.',
    REQUEST_ID_CONFLICT: 'La solicitud no coincide con el intento original.',
    GAME_NOT_AVAILABLE: 'Este juego no está disponible.',
    CONTENT_INVALID: 'El contenido de esta actividad no es válido.',
    CONTENT_NOT_COMPATIBLE: 'No hay contenido compatible para esta actividad.',
    SCHEMA_UNHEALTHY: 'English LAB no puede modificar datos hasta validar su estructura.',
    BUSY_RETRY: 'Estamos confirmando la acción. Intenta de nuevo.',
    ALREADY_SUBMITTED: 'Tu respuesta ya fue registrada.',
    ALREADY_GUESSED: 'Esa letra ya fue utilizada.',
    ALREADY_CLAIMED: 'Ese objetivo ya fue encontrado.',
    INVALID_SELECTION: 'Esa selección no es válida.',
    INTERNAL_ERROR: 'No pudimos completar la acción.'
  };
  return messages[code] || messages.INTERNAL_ERROR;
}
