// CS21A173 · Runtime liviano y determinista para English LAB.
// No contiene contenido pedagógico, no consulta Sheets y no realiza fetch.
(function (global) {
  'use strict';

  const VERSION = 'CS21A173';
  const PHASES = Object.freeze(['LOBBY', 'COUNTDOWN', 'OPEN', 'REVEAL', 'COMPLETE', 'PAUSED']);

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function number(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function timestamp(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function normalizePhase(value) {
    const phase = clean(value).toUpperCase();
    return PHASES.includes(phase) ? phase : 'LOBBY';
  }

  function createServerClock(config) {
    const source = config || {};
    const serverNow = timestamp(source.server_now || source.serverNow || source.now);
    const receivedAt = number(source.received_at_ms || source.receivedAtMs, Date.now());
    const offsetMs = serverNow ? serverNow - receivedAt : number(source.server_offset_ms || source.serverOffsetMs, 0);

    return Object.freeze({
      offsetMs,
      now(localNow) {
        return number(localNow, Date.now()) + offsetMs;
      },
      remainingMs(endsAt, localNow) {
        const end = timestamp(endsAt);
        if (!end) return 0;
        return Math.max(0, end - (number(localNow, Date.now()) + offsetMs));
      },
      elapsedMs(startedAt, localNow) {
        const start = timestamp(startedAt);
        if (!start) return 0;
        return Math.max(0, (number(localNow, Date.now()) + offsetMs) - start);
      },
    });
  }

  function normalizeRules(input) {
    const source = input || {};
    return Object.freeze({
      autoStartDelayMs: Math.max(0, number(source.auto_start_delay_ms, number(source.auto_start_delay, 5) * 1000)),
      roundDurationMs: Math.max(1000, number(source.round_duration_ms, number(source.timer_seconds, 15) * 1000)),
      revealDurationMs: Math.max(0, number(source.reveal_duration_ms, number(source.reveal_seconds, 3) * 1000)),
      autoNextDelayMs: Math.max(0, number(source.auto_next_delay_ms, number(source.auto_next_delay, 2) * 1000)),
      discussionDurationMs: Math.max(0, number(source.discussion_duration_ms, number(source.discussion_seconds, 0) * 1000)),
      teamSize: Math.max(1, number(source.team_size, 1)),
      pauseAllowed: source.pause_allowed !== false && clean(source.pause_allowed).toUpperCase() !== 'NO',
      teacherOverride: source.teacher_override !== false && clean(source.teacher_override).toUpperCase() !== 'NO',
    });
  }

  function normalizeRoomPackage(input) {
    const source = input || {};
    const room = source.room || {};
    const round = source.round || {};
    const state = source.state || {};
    const rules = normalizeRules(source.rules || {});
    const clock = createServerClock({
      server_now: source.server_now || state.server_now,
      received_at_ms: source.received_at_ms || Date.now(),
      server_offset_ms: source.server_offset_ms || state.server_offset_ms,
    });

    return Object.freeze({
      version: clean(source.version || VERSION),
      room: Object.freeze({
        roomCode: clean(room.room_code || room.roomCode),
        gameId: clean(room.game_id || room.gameId).toUpperCase(),
        mode: clean(room.mode || 'INDIVIDUAL').toUpperCase(),
        levelId: clean(room.level_id || room.levelId || 'B1').toUpperCase(),
      }),
      round: Object.freeze({
        roundId: clean(round.round_id || round.roundId),
        index: Math.max(0, number(round.index, 0)),
        cards: Array.isArray(round.cards) ? round.cards.slice() : [],
      }),
      state: Object.freeze({
        phase: normalizePhase(state.phase),
        startedAt: state.started_at || state.startedAt || '',
        endsAt: state.ends_at || state.endsAt || '',
        activeTeamId: clean(state.active_team_id || state.activeTeamId),
      }),
      rules,
      teams: Array.isArray(source.teams) ? source.teams.slice() : [],
      player: source.player || null,
      clock,
    });
  }

  function buildSubmission(input) {
    const source = input || {};
    return Object.freeze({
      room_code: clean(source.roomCode || source.room_code),
      round_id: clean(source.roundId || source.round_id),
      player_id: clean(source.playerId || source.player_id),
      team_id: clean(source.teamId || source.team_id),
      answer_type: clean(source.answerType || source.answer_type || 'PAIR').toUpperCase(),
      answer_value: source.answerValue || source.answer_value || null,
      time_ms: Math.max(0, number(source.timeMs || source.time_ms, 0)),
      client_sent_at: new Date().toISOString(),
    });
  }

  global.EnglishLabRuntimeCS21A173 = Object.freeze({
    VERSION,
    PHASES,
    clean,
    timestamp,
    normalizePhase,
    normalizeRules,
    normalizeRoomPackage,
    createServerClock,
    buildSubmission,
  });
})(window);
