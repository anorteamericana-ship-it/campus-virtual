// CS21A176 · Motor compartido de turnos y rondas para English LAB Live.
// Componente puro: no consulta backend, no contiene preguntas y no decide autorización real.
(function (global) {
  'use strict';

  const VERSION = 'CS21A176';
  const POLICIES = Object.freeze({
    EVERYONE: 'EVERYONE',
    ROUND_ROBIN: 'ROUND_ROBIN',
    RANDOM_PLAYER: 'RANDOM_PLAYER',
    TEAM_ALTERNATING: 'TEAM_ALTERNATING',
  });

  function clean(value) {
    return String(value == null ? '' : value).trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function finiteNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number(fallback || 0);
  }

  function playerId(player, index) {
    return clean(player && (
      player.player_id || player.playerId || player.cod_estudiante ||
      player.codigo_estudiante || player.COD_ESTUDIANTE || player.id
    )) || `PLAYER-${index + 1}`;
  }

  function playerName(player, index) {
    return clean(player && (
      player.name || player.nombre || player.player_name || player.playerName || player.NOMBRE
    )) || `Jugador ${index + 1}`;
  }

  function teamId(player) {
    return clean(player && (
      player.team_id || player.teamId || player.team || player.equipo || player.EQUIPO
    )) || 'NO_TEAM';
  }

  function normalizePlayers(players) {
    const seen = new Set();
    return (Array.isArray(players) ? players : []).map((player, index) => {
      const id = playerId(player, index);
      if (seen.has(id)) throw new Error(`Jugador duplicado: ${id}`);
      seen.add(id);
      return Object.freeze({
        player_id: id,
        name: playerName(player, index),
        team_id: teamId(player),
        joined_at: clean(player && (player.joined_at || player.joinedAt || player.CREATED_AT)),
      });
    });
  }

  function hash(text) {
    const value = clean(text);
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return result >>> 0;
  }

  function shuffled(values, seedText) {
    const output = values.slice();
    let seed = hash(seedText) || 1;
    function random() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (let index = output.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      const temp = output[index];
      output[index] = output[target];
      output[target] = temp;
    }
    return output;
  }

  function groupTeams(players) {
    const grouped = new Map();
    players.forEach((player) => {
      const id = player.team_id || 'NO_TEAM';
      if (!grouped.has(id)) grouped.set(id, []);
      grouped.get(id).push(player);
    });
    return Array.from(grouped.entries()).map(([id, members]) => Object.freeze({
      team_id: id,
      name: id === 'NO_TEAM' ? 'Sin equipo' : id,
      members: Object.freeze(members.slice()),
    }));
  }

  function normalizePolicy(value) {
    const policy = upper(value || POLICIES.ROUND_ROBIN);
    if (!Object.prototype.hasOwnProperty.call(POLICIES, policy)) {
      throw new Error(`Política de participación inválida: ${policy}`);
    }
    return policy;
  }

  function buildOrders(players, policy, seedText) {
    const playerOrder = shuffled(players.map((player) => player.player_id), `${seedText}|PLAYERS`);
    if (policy !== POLICIES.TEAM_ALTERNATING) {
      return {
        player_order: playerOrder,
        team_order: [],
        team_player_orders: {},
      };
    }

    const teams = groupTeams(players).filter((team) => team.team_id !== 'NO_TEAM');
    const teamOrder = shuffled(teams.map((team) => team.team_id), `${seedText}|TEAMS`);
    const teamPlayerOrders = {};
    teams.forEach((team) => {
      teamPlayerOrders[team.team_id] = shuffled(
        team.members.map((member) => member.player_id),
        `${seedText}|TEAM|${team.team_id}`
      );
    });
    return {
      player_order: playerOrder,
      team_order: teamOrder,
      team_player_orders: teamPlayerOrders,
    };
  }

  function activeForTeam(state, teamIdValue) {
    const order = state.team_player_orders[teamIdValue] || [];
    if (!order.length) return '';
    const cursors = state.team_player_cursors || {};
    const cursor = Math.max(0, finiteNumber(cursors[teamIdValue], 0)) % order.length;
    return order[cursor];
  }

  function normalizeTurnState(input) {
    const source = input || {};
    const policy = normalizePolicy(source.participation_policy || source.participationPolicy || source.policy);
    const playerOrder = Array.isArray(source.player_order) ? source.player_order.map(clean).filter(Boolean) : [];
    const teamOrder = Array.isArray(source.team_order) ? source.team_order.map(clean).filter(Boolean) : [];
    const teamPlayerOrders = source.team_player_orders && typeof source.team_player_orders === 'object'
      ? Object.keys(source.team_player_orders).reduce((out, key) => {
        out[clean(key)] = (Array.isArray(source.team_player_orders[key]) ? source.team_player_orders[key] : []).map(clean).filter(Boolean);
        return out;
      }, {})
      : {};
    const normalized = {
      version: clean(source.version) || VERSION,
      participation_policy: policy,
      player_order: playerOrder,
      player_cursor: Math.max(0, finiteNumber(source.player_cursor, 0)),
      team_order: teamOrder,
      team_cursor: Math.max(0, finiteNumber(source.team_cursor, 0)),
      team_player_orders: teamPlayerOrders,
      team_player_cursors: source.team_player_cursors && typeof source.team_player_cursors === 'object'
        ? Object.assign({}, source.team_player_cursors)
        : {},
      active_player_id: clean(source.active_player_id || source.activePlayerId),
      active_team_id: clean(source.active_team_id || source.activeTeamId),
      turn_number: Math.max(1, finiteNumber(source.turn_number || source.turnNumber, 1)),
      turn_started_at: clean(source.turn_started_at || source.turnStartedAt),
      turn_ends_at: clean(source.turn_ends_at || source.turnEndsAt),
      last_player_id: clean(source.last_player_id || source.lastPlayerId),
      last_team_id: clean(source.last_team_id || source.lastTeamId),
      reason: clean(source.reason),
    };

    if (!normalized.active_player_id && policy !== POLICIES.EVERYONE) {
      if (policy === POLICIES.TEAM_ALTERNATING) {
        normalized.active_team_id = normalized.active_team_id || normalized.team_order[normalized.team_cursor] || '';
        normalized.active_player_id = activeForTeam(normalized, normalized.active_team_id);
      } else {
        normalized.active_player_id = normalized.player_order[normalized.player_cursor] || '';
      }
    }
    return Object.freeze(normalized);
  }

  function createTurnState(options) {
    const source = options || {};
    const players = normalizePlayers(source.players);
    const policy = normalizePolicy(source.participation_policy || source.participationPolicy || source.policy);
    const seed = clean(source.seed) || `${clean(source.room_code || source.roomCode)}|${clean(source.round_id || source.roundId)}`;
    const orders = buildOrders(players, policy, seed);
    const nowMs = finiteNumber(source.now_ms || source.nowMs, Date.now());
    const durationMs = Math.max(1000, finiteNumber(source.turn_duration_ms || source.turnDurationMs, 30000));
    const state = {
      version: VERSION,
      participation_policy: policy,
      player_order: orders.player_order,
      player_cursor: 0,
      team_order: orders.team_order,
      team_cursor: 0,
      team_player_orders: orders.team_player_orders,
      team_player_cursors: {},
      active_player_id: '',
      active_team_id: '',
      turn_number: 1,
      turn_started_at: new Date(nowMs).toISOString(),
      turn_ends_at: new Date(nowMs + durationMs).toISOString(),
      last_player_id: '',
      last_team_id: '',
      reason: 'ROUND_STARTED',
    };
    if (policy === POLICIES.TEAM_ALTERNATING) {
      state.team_order.forEach((id) => { state.team_player_cursors[id] = 0; });
      state.active_team_id = state.team_order[0] || '';
      state.active_player_id = activeForTeam(state, state.active_team_id);
    } else if (policy !== POLICIES.EVERYONE) {
      state.active_player_id = state.player_order[0] || '';
    }
    return normalizeTurnState(state);
  }

  function nextTurn(input, options) {
    const state = normalizeTurnState(input);
    const source = options || {};
    const nowMs = finiteNumber(source.now_ms || source.nowMs, Date.now());
    const durationMs = Math.max(1000, finiteNumber(source.turn_duration_ms || source.turnDurationMs, 30000));
    const next = Object.assign({}, state, {
      turn_number: state.turn_number + 1,
      turn_started_at: new Date(nowMs).toISOString(),
      turn_ends_at: new Date(nowMs + durationMs).toISOString(),
      last_player_id: state.active_player_id,
      last_team_id: state.active_team_id,
      reason: clean(source.reason) || 'ACTION_COMPLETED',
    });

    if (state.participation_policy === POLICIES.EVERYONE) {
      next.active_player_id = '';
      next.active_team_id = '';
      return normalizeTurnState(next);
    }

    if (state.participation_policy === POLICIES.TEAM_ALTERNATING) {
      if (!state.team_order.length) return normalizeTurnState(next);
      const previousTeam = state.active_team_id || state.team_order[state.team_cursor] || '';
      const previousMembers = state.team_player_orders[previousTeam] || [];
      next.team_player_cursors = Object.assign({}, state.team_player_cursors);
      if (previousMembers.length) {
        next.team_player_cursors[previousTeam] = (Math.max(0, finiteNumber(next.team_player_cursors[previousTeam], 0)) + 1) % previousMembers.length;
      }
      next.team_cursor = (state.team_cursor + 1) % state.team_order.length;
      next.active_team_id = state.team_order[next.team_cursor] || '';
      next.active_player_id = activeForTeam(next, next.active_team_id);
      return normalizeTurnState(next);
    }

    if (!state.player_order.length) return normalizeTurnState(next);
    next.player_cursor = (state.player_cursor + 1) % state.player_order.length;
    next.active_player_id = state.player_order[next.player_cursor] || '';
    next.active_team_id = '';
    return normalizeTurnState(next);
  }

  function canPlayerAct(input, player, options) {
    const state = normalizeTurnState(input);
    const viewer = player || {};
    const settings = options || {};
    if (settings.readOnly) return false;
    const id = playerId(viewer, 0);
    if (!id) return false;
    if (state.participation_policy === POLICIES.EVERYONE) return true;
    if (state.active_player_id !== id) return false;
    if (state.participation_policy === POLICIES.TEAM_ALTERNATING) {
      return !state.active_team_id || teamId(viewer) === state.active_team_id;
    }
    return true;
  }

  function describeTurn(input, players) {
    const state = normalizeTurnState(input);
    const normalizedPlayers = normalizePlayers(players);
    const byId = new Map(normalizedPlayers.map((player) => [player.player_id, player]));
    const activePlayer = byId.get(state.active_player_id) || null;
    let nextPlayerId = '';
    if (state.participation_policy === POLICIES.TEAM_ALTERNATING && state.team_order.length) {
      const nextTeamCursor = (state.team_cursor + 1) % state.team_order.length;
      const nextTeamId = state.team_order[nextTeamCursor] || '';
      const temporary = Object.assign({}, state, {active_team_id: nextTeamId});
      nextPlayerId = activeForTeam(temporary, nextTeamId);
    } else if (state.player_order.length) {
      nextPlayerId = state.player_order[(state.player_cursor + 1) % state.player_order.length] || '';
    }
    return Object.freeze({
      active_player: activePlayer,
      active_team_id: state.active_team_id,
      next_player: byId.get(nextPlayerId) || null,
      turn_number: state.turn_number,
      participation_policy: state.participation_policy,
    });
  }

  const api = Object.freeze({
    VERSION,
    POLICIES,
    normalizePlayers,
    normalizePolicy,
    normalizeTurnState,
    createTurnState,
    nextTurn,
    canPlayerAct,
    describeTurn,
    groupTeams,
    shuffled,
  });

  global.EnglishLabTurnEngineCS21A176 = api;
})(window);
