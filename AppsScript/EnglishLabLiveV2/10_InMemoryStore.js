/** English LAB LIVE v2 · test-only in-memory Store adapter for E1 domain tests. */
function ELV2_createInMemoryStore() {
  var roomsById = {};
  var roomIdByCode = {};
  var playersById = {};
  var playerIdByRoomStudent = {};
  var roundsById = {};
  var roundIdByRoomSequence = {};
  var attemptsById = {};
  var attemptIdByKey = {};

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  return Object.freeze({
    createRoom: function (room) {
      if (roomsById[room.room_id] || roomIdByCode[room.room_code]) throw new Error('ELV2_STORE_ROOM_CONFLICT');
      roomsById[room.room_id] = clone(room);
      roomIdByCode[room.room_code] = room.room_id;
      return clone(room);
    },

    updateRoom: function (room) {
      if (!roomsById[room.room_id]) throw new Error('ELV2_STORE_ROOM_NOT_FOUND');
      var previous = roomsById[room.room_id];
      if (previous.room_code !== room.room_code) throw new Error('ELV2_STORE_ROOM_CODE_IMMUTABLE');
      roomsById[room.room_id] = clone(room);
      return clone(room);
    },

    getRoom: function (roomId) {
      return clone(roomsById[roomId] || null);
    },

    findRoomByCode: function (roomCode) {
      var roomId = roomIdByCode[roomCode];
      return roomId ? clone(roomsById[roomId]) : null;
    },

    createPlayer: function (player) {
      var key = player.room_id + '|' + player.student_id;
      if (playersById[player.player_id] || playerIdByRoomStudent[key]) throw new Error('ELV2_STORE_PLAYER_CONFLICT');
      playersById[player.player_id] = clone(player);
      playerIdByRoomStudent[key] = player.player_id;
      return clone(player);
    },

    updatePlayer: function (player) {
      if (!playersById[player.player_id]) throw new Error('ELV2_STORE_PLAYER_NOT_FOUND');
      playersById[player.player_id] = clone(player);
      return clone(player);
    },

    getPlayer: function (playerId) {
      return clone(playersById[playerId] || null);
    },

    getPlayerByRoomStudent: function (roomId, studentId) {
      var playerId = playerIdByRoomStudent[roomId + '|' + studentId];
      return playerId ? clone(playersById[playerId]) : null;
    },

    listPlayersByRoom: function (roomId) {
      return Object.keys(playersById).map(function (playerId) {
        return playersById[playerId];
      }).filter(function (player) {
        return player.room_id === roomId;
      }).map(clone);
    },

    createRound: function (round) {
      var key = round.room_id + '|' + round.sequence_no;
      if (roundsById[round.round_id] || roundIdByRoomSequence[key]) throw new Error('ELV2_STORE_ROUND_CONFLICT');
      roundsById[round.round_id] = clone(round);
      roundIdByRoomSequence[key] = round.round_id;
      return clone(round);
    },

    updateRound: function (round) {
      if (!roundsById[round.round_id]) throw new Error('ELV2_STORE_ROUND_NOT_FOUND');
      roundsById[round.round_id] = clone(round);
      return clone(round);
    },

    getRound: function (roundId) {
      return clone(roundsById[roundId] || null);
    },

    listRoundsByRoom: function (roomId) {
      return Object.keys(roundsById).map(function (roundId) {
        return roundsById[roundId];
      }).filter(function (round) {
        return round.room_id === roomId;
      }).sort(function (a, b) {
        return a.sequence_no - b.sequence_no;
      }).map(clone);
    },

    createAttempt: function (attempt) {
      if (attemptsById[attempt.attempt_id] || attemptIdByKey[attempt.attempt_key]) throw new Error('ELV2_STORE_ATTEMPT_CONFLICT');
      attemptsById[attempt.attempt_id] = clone(attempt);
      attemptIdByKey[attempt.attempt_key] = attempt.attempt_id;
      return clone(attempt);
    },

    updateAttempt: function (attempt) {
      if (!attemptsById[attempt.attempt_id]) throw new Error('ELV2_STORE_ATTEMPT_NOT_FOUND');
      attemptsById[attempt.attempt_id] = clone(attempt);
      return clone(attempt);
    },

    getAttemptByKey: function (attemptKey) {
      var attemptId = attemptIdByKey[attemptKey];
      return attemptId ? clone(attemptsById[attemptId]) : null;
    },

    listAttemptsByRound: function (roundId) {
      return Object.keys(attemptsById).map(function (attemptId) {
        return attemptsById[attemptId];
      }).filter(function (attempt) {
        return attempt.round_id === roundId;
      }).map(clone);
    }
  });
}
