/** English LAB LIVE v2 · Word Search production GamePlugin (E6-WORD-SEARCH). */
var ELV2_WORD_SEARCH_GRID_SIZE = 14;
var ELV2_WORD_SEARCH_WORD_COUNT = 10;
var ELV2_WORD_SEARCH_DIRECTIONS = Object.freeze(['E', 'S', 'SE', 'SW']);
var ELV2_WORD_SEARCH_VECTORS = Object.freeze({
  E: Object.freeze([0, 1]),
  S: Object.freeze([1, 0]),
  SE: Object.freeze([1, 1]),
  SW: Object.freeze([1, -1]),
  W: Object.freeze([0, -1]),
  N: Object.freeze([-1, 0]),
  NW: Object.freeze([-1, -1]),
  NE: Object.freeze([-1, 1])
});
var ELV2_WORD_SEARCH_FILL_LETTERS = 'EEEEEEEEEEEEAAAAAAAAAARRRRRRRRIIIIIIIIOOOOOOOOTTTTTTTNNNNNNSSSSSSLLLLCCUUDDPPMMHHGGFBYVWJKXQZ';

var ELV2_WordSearchGame = Object.freeze({
  gameId: function () {
    return 'WORD_SEARCH';
  },

  gameVersion: function () {
    return '2.0.0';
  },

  validateContent: function (content) {
    if (!content || typeof content !== 'object' || Array.isArray(content)) throw new Error('ELV2_CONTENT_INVALID');
    if (content.content_type !== 'VOCABULARY_SET') throw new Error('ELV2_CONTENT_INVALID');
    if (!Array.isArray(content.items) || content.items.length !== ELV2_WORD_SEARCH_WORD_COUNT) {
      throw new Error('ELV2_CONTENT_INVALID');
    }
    var sourceIds = {};
    var gridWords = {};
    var templateCounts = { VOCAB_01: 0, VOCAB_02: 0 };
    content.items.forEach(function (item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('ELV2_CONTENT_INVALID');
      var sourceId = ELV2_wsText_(item.source_item_id);
      var label = ELV2_wsText_(item.label);
      var hint = ELV2_wsText_(item.hint_es);
      var templateId = ELV2_wsUpper_(item.template_id);
      var itemType = ELV2_wsUpper_(item.item_type);
      var token = ELV2_wsGridWord_(label);
      if (!sourceId || sourceIds[sourceId] || !label || !hint ||
          token.length < 3 || token.length > ELV2_WORD_SEARCH_GRID_SIZE || gridWords[token]) {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      if (!((templateId === 'VOCAB_01' && itemType === 'MCQ') ||
            (templateId === 'VOCAB_02' && itemType === 'MATCH'))) {
        throw new Error('ELV2_CONTENT_INVALID');
      }
      sourceIds[sourceId] = true;
      gridWords[token] = true;
      templateCounts[templateId] += 1;
    });
    if (templateCounts.VOCAB_01 !== 5 || templateCounts.VOCAB_02 !== 5) {
      throw new Error('ELV2_CONTENT_INVALID');
    }
    return true;
  },

  validateSettings: function (settings) {
    if (settings == null) return true;
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new Error('ELV2_SETTINGS_INVALID');
    if (Object.keys(settings).length !== 0) throw new Error('ELV2_SETTINGS_INVALID');
    return true;
  },

  validateAttempt: function (attempt) {
    if (!attempt || typeof attempt !== 'object' || Array.isArray(attempt)) throw new Error('ELV2_ATTEMPT_INVALID');
    var keys = Object.keys(attempt).sort();
    var expected = ['action_type', 'end_col', 'end_row', 'start_col', 'start_row'];
    if (keys.length !== expected.length || keys.some(function (key, index) { return key !== expected[index]; })) {
      throw new Error('ELV2_ATTEMPT_INVALID');
    }
    if (attempt.action_type !== 'CLAIM_PATH') throw new Error('ELV2_ATTEMPT_INVALID');
    ['start_row', 'start_col', 'end_row', 'end_col'].forEach(function (key) {
      if (!Number.isInteger(attempt[key]) || attempt[key] < 0 || attempt[key] >= ELV2_WORD_SEARCH_GRID_SIZE) {
        throw new Error('ELV2_ATTEMPT_INVALID');
      }
    });
    var cells = ELV2_wsLineBetween_(
      { row: attempt.start_row, col: attempt.start_col },
      { row: attempt.end_row, col: attempt.end_col }
    );
    if (cells.length < 3 || cells.length > ELV2_WORD_SEARCH_GRID_SIZE) throw new Error('ELV2_ATTEMPT_INVALID');
    return true;
  },

  createRound: function (content, settings, context) {
    this.validateContent(content);
    this.validateSettings(settings || {});
    if (!context || typeof context.opaque_id_factory !== 'function') throw new Error('ELV2_GAME_CONTEXT_INVALID');
    var seed = ELV2_wsText_(context.opaque_id_factory());
    if (!seed) throw new Error('ELV2_GAME_CONTEXT_INVALID');
    var words = content.items.map(function (item) {
      var targetId = ELV2_wsText_(context.opaque_id_factory());
      if (!targetId) throw new Error('ELV2_GAME_CONTEXT_INVALID');
      return {
        target_id: targetId,
        source_item_id: ELV2_wsText_(item.source_item_id),
        label: ELV2_wsText_(item.label),
        hint_es: ELV2_wsText_(item.hint_es),
        grid_word: ELV2_wsGridWord_(item.label)
      };
    });
    var targetIds = {};
    words.forEach(function (item) {
      if (targetIds[item.target_id]) throw new Error('ELV2_GAME_CONTEXT_INVALID');
      targetIds[item.target_id] = true;
    });
    var puzzle = ELV2_wsBuildPuzzle_(words, seed);
    return Object.freeze({
      private_state: {
        grid_size: ELV2_WORD_SEARCH_GRID_SIZE,
        grid: puzzle.grid,
        words: words,
        placements: puzzle.placements,
        claims_by_target: {},
        claimed_count: 0,
        completed: false
      },
      scoring_policy: ELV2_SCORING_POLICY.SCORE_IMMEDIATE_PUBLIC,
      visibility_model: ELV2_VISIBILITY_MODEL.SHARED_BOARD,
      submission_policy: ELV2_SUBMISSION_POLICY.MULTI_ACTION
    });
  },

  applyAttempt: function (state, attempt, actor, context) {
    this.validateAttempt(attempt);
    if (!state || typeof state !== 'object' || !Array.isArray(state.words) ||
        !state.placements || !state.claims_by_target || !Array.isArray(state.grid)) {
      throw new Error('ELV2_STATE_INTEGRITY_FAILED');
    }
    if (!actor || typeof actor.student_id !== 'string' || !actor.student_id) throw new Error('ELV2_ACTOR_INVALID');
    if (state.completed === true) throw new Error('ELV2_ROUND_NOT_OPEN');
    var cells = ELV2_wsLineBetween_(
      { row: attempt.start_row, col: attempt.start_col },
      { row: attempt.end_row, col: attempt.end_col }
    );
    if (!cells.length) throw new Error('ELV2_INVALID_SELECTION');
    var pathKey = ELV2_wsCanonicalPathKey_(cells);
    var matches = state.words.filter(function (word) {
      var placement = state.placements[word.target_id];
      return placement && ELV2_wsCanonicalPathKey_(placement.cells || []) === pathKey;
    });
    if (matches.length !== 1) throw new Error('ELV2_INVALID_SELECTION');
    var target = matches[0];
    if (Object.prototype.hasOwnProperty.call(state.claims_by_target, target.target_id)) {
      throw new Error('ELV2_ALREADY_CLAIMED');
    }
    var nextState = JSON.parse(JSON.stringify(state));
    nextState.claims_by_target[target.target_id] = {
      student_id: actor.student_id,
      player_id: actor.player_id || '',
      claimed_at: context && Number.isFinite(context.server_now) ? context.server_now : null,
      points_delta: 10
    };
    nextState.claimed_count = Object.keys(nextState.claims_by_target).length;
    nextState.completed = nextState.claimed_count === nextState.words.length;
    return Object.freeze({
      next_private_state: nextState,
      attempt_result_private: Object.freeze({
        is_correct: true,
        target_id: target.target_id,
        source_item_id: target.source_item_id
      }),
      points_delta: 10,
      public_effects: Object.freeze({}),
      completion_hint: nextState.completed
    });
  },

  publicView: function (state, viewer, phase, context) {
    var view = {
      grid_size: state.grid_size,
      grid: state.grid.map(function (row) { return row.slice(); }),
      words: state.words.map(function (word) {
        return {
          target_id: word.target_id,
          label: word.label,
          hint_es: word.hint_es,
          claimed: Object.prototype.hasOwnProperty.call(state.claims_by_target, word.target_id)
        };
      }),
      claimed_count: state.claimed_count,
      completed: state.completed === true
    };
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      view.revealed_paths = state.words.map(function (word) {
        var placement = state.placements[word.target_id];
        return {
          target_id: word.target_id,
          cells: (placement && placement.cells ? placement.cells : []).map(function (cell) {
            return { row: cell.row, col: cell.col };
          })
        };
      });
    }
    return view;
  },

  publicSchema: function (viewer, phase, context) {
    var schema = {
      grid_size: true,
      grid: { $array: { $array: true } },
      words: { $array: { target_id: true, label: true, hint_es: true, claimed: true } },
      claimed_count: true,
      completed: true
    };
    if (phase === ELV2_ROUND_STATUS.REVEAL || phase === ELV2_ROUND_STATUS.CLOSED) {
      schema.revealed_paths = { $array: { target_id: true, cells: { $array: { row: true, col: true } } } };
    }
    return schema;
  },

  isComplete: function (state, context) {
    return !!(state && state.completed === true);
  }
});

function ELV2_wsText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}
function ELV2_wsUpper_(value) {
  return ELV2_wsText_(value).toUpperCase();
}
function ELV2_wsGridWord_(value) {
  var text = ELV2_wsUpper_(value);
  try { text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
  return text.replace(/[^A-Z]/g, '');
}
function ELV2_wsHash32_(value) {
  var hash = 2166136261;
  var text = ELV2_wsText_(value);
  for (var i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function ELV2_wsRng_(seedText) {
  var state = ELV2_wsHash32_(seedText) || 1;
  return function () {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
function ELV2_wsBlankGrid_(size) {
  var grid = [];
  for (var row = 0; row < size; row += 1) {
    var line = [];
    for (var col = 0; col < size; col += 1) line.push('');
    grid.push(line);
  }
  return grid;
}
function ELV2_wsCopyGrid_(grid) {
  return grid.map(function (row) { return row.slice(); });
}
function ELV2_wsInBounds_(size, row, col) {
  return row >= 0 && col >= 0 && row < size && col < size;
}
function ELV2_wsCellsFor_(size, row, col, dr, dc, length) {
  var cells = [];
  for (var index = 0; index < length; index += 1) {
    var nextRow = row + dr * index;
    var nextCol = col + dc * index;
    if (!ELV2_wsInBounds_(size, nextRow, nextCol)) return null;
    cells.push({ row: nextRow, col: nextCol });
  }
  return cells;
}
function ELV2_wsPathKey_(cells) {
  return (cells || []).map(function (cell) { return String(cell.row) + ':' + String(cell.col); }).join('|');
}
function ELV2_wsCanonicalPathKey_(cells) {
  var forward = ELV2_wsPathKey_(cells);
  var reverse = ELV2_wsPathKey_((cells || []).slice().reverse());
  return forward < reverse ? forward : reverse;
}
function ELV2_wsLineBetween_(start, end) {
  start = start || {};
  end = end || {};
  var row0 = Number(start.row);
  var col0 = Number(start.col);
  var row1 = Number(end.row);
  var col1 = Number(end.col);
  if (![row0, col0, row1, col1].every(function (value) {
    return Number.isInteger(value) && value >= 0 && value < ELV2_WORD_SEARCH_GRID_SIZE;
  })) return [];
  var rowDistance = Math.abs(row1 - row0);
  var colDistance = Math.abs(col1 - col0);
  if (!(row0 === row1 || col0 === col1 || rowDistance === colDistance)) return [];
  var dr = Math.sign(row1 - row0);
  var dc = Math.sign(col1 - col0);
  var length = Math.max(rowDistance, colDistance) + 1;
  var cells = [];
  for (var index = 0; index < length; index += 1) cells.push({ row: row0 + dr * index, col: col0 + dc * index });
  return cells;
}
function ELV2_wsCandidatePlacements_(grid, word) {
  var size = grid.length;
  var candidates = [];
  ELV2_WORD_SEARCH_DIRECTIONS.forEach(function (direction) {
    var vector = ELV2_WORD_SEARCH_VECTORS[direction];
    var dr = vector[0];
    var dc = vector[1];
    for (var row = 0; row < size; row += 1) {
      for (var col = 0; col < size; col += 1) {
        var cells = ELV2_wsCellsFor_(size, row, col, dr, dc, word.length);
        if (!cells) continue;
        var overlap = 0;
        var blocked = false;
        for (var index = 0; index < cells.length; index += 1) {
          var cell = cells[index];
          var existing = grid[cell.row][cell.col];
          if (existing && existing !== word[index]) { blocked = true; break; }
          if (existing === word[index]) overlap += 1;
        }
        if (!blocked) {
          var end = cells[cells.length - 1];
          var center = (size - 1) / 2;
          var midpointDistance = Math.abs((row + end.row) / 2 - center) + Math.abs((col + end.col) / 2 - center);
          candidates.push({ direction: direction, cells: cells, overlap: overlap, midpoint_distance: midpointDistance });
        }
      }
    }
  });
  return candidates;
}
function ELV2_wsPlaceOnce_(words, seedText) {
  var grid = ELV2_wsBlankGrid_(ELV2_WORD_SEARCH_GRID_SIZE);
  var placements = {};
  var ordered = words.slice().sort(function (left, right) {
    return right.grid_word.length - left.grid_word.length ||
      (ELV2_wsHash32_(seedText + '|' + left.target_id) - ELV2_wsHash32_(seedText + '|' + right.target_id));
  });
  for (var index = 0; index < ordered.length; index += 1) {
    var item = ordered[index];
    var candidates = ELV2_wsCandidatePlacements_(grid, item.grid_word);
    if (!candidates.length) return null;
    var random = ELV2_wsRng_(seedText + '|PLACE|' + item.target_id + '|' + index);
    candidates.forEach(function (candidate) {
      candidate.rank = candidate.overlap * 100 - candidate.midpoint_distance + random() * 0.25;
    });
    candidates.sort(function (left, right) { return right.rank - left.rank; });
    var top = candidates.slice(0, Math.min(8, candidates.length));
    var chosen = top[Math.floor(random() * top.length)] || candidates[0];
    chosen.cells.forEach(function (cell, cellIndex) { grid[cell.row][cell.col] = item.grid_word[cellIndex]; });
    placements[item.target_id] = {
      direction: chosen.direction,
      cells: chosen.cells.map(function (cell) { return { row: cell.row, col: cell.col }; })
    };
  }
  return { grid: grid, placements: placements };
}
function ELV2_wsOccurrences_(grid, token) {
  var found = {};
  var size = grid.length;
  Object.keys(ELV2_WORD_SEARCH_VECTORS).forEach(function (direction) {
    var vector = ELV2_WORD_SEARCH_VECTORS[direction];
    var dr = vector[0];
    var dc = vector[1];
    for (var row = 0; row < size; row += 1) {
      for (var col = 0; col < size; col += 1) {
        var cells = ELV2_wsCellsFor_(size, row, col, dr, dc, token.length);
        if (!cells) continue;
        var matches = true;
        for (var index = 0; index < cells.length; index += 1) {
          var cell = cells[index];
          if (grid[cell.row][cell.col] !== token[index]) { matches = false; break; }
        }
        if (matches) found[ELV2_wsCanonicalPathKey_(cells)] = cells;
      }
    }
  });
  return Object.keys(found).map(function (key) { return found[key]; });
}
function ELV2_wsFillAndValidate_(placed, words, seedText) {
  for (var attempt = 0; attempt < 80; attempt += 1) {
    var grid = ELV2_wsCopyGrid_(placed.grid);
    var random = ELV2_wsRng_(seedText + '|FILL|' + attempt);
    for (var row = 0; row < grid.length; row += 1) {
      for (var col = 0; col < grid.length; col += 1) {
        if (!grid[row][col]) {
          grid[row][col] = ELV2_WORD_SEARCH_FILL_LETTERS[Math.floor(random() * ELV2_WORD_SEARCH_FILL_LETTERS.length)] || 'E';
        }
      }
    }
    var unique = words.every(function (item) { return ELV2_wsOccurrences_(grid, item.grid_word).length === 1; });
    if (unique) return grid;
  }
  return null;
}
function ELV2_wsBuildPuzzle_(words, seedText) {
  for (var layoutAttempt = 0; layoutAttempt < 64; layoutAttempt += 1) {
    var layoutSeed = seedText + '|LAYOUT|' + layoutAttempt;
    var placed = ELV2_wsPlaceOnce_(words, layoutSeed);
    if (!placed) continue;
    var grid = ELV2_wsFillAndValidate_(placed, words, layoutSeed);
    if (grid) return { grid: grid, placements: placed.placements };
  }
  throw new Error('ELV2_CONTENT_INVALID');
}
