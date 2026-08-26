/**
 * English LAB LIVE v2 · read-only Apollo curricular ContentSource (E5).
 *
 * Authority: CONFIG_UNIDADES + ACADEMIA_PLAY_BANK in the same Campus/Apollo
 * spreadsheet. This adapter never writes and never builds game state; it only
 * resolves a logical content_ref into a private typed curriculum snapshot.
 */
var ELV2_APOLLO_CONTENT_VERSION = 'APOLLO_PLAY_V1';
var ELV2_APOLLO_CONTENT_KIND = Object.freeze({
  SENTENCE_ORDER: 'SENTENCE_ORDER',
  VOCABULARY: 'VOCABULARY',
  QUIZ_TIME: 'QUIZ_TIME'
});

var ELV2_APOLLO_GAME_CONTENT_KIND = Object.freeze({
  SENTENCE_ORDER: ELV2_APOLLO_CONTENT_KIND.SENTENCE_ORDER,
  HANGMAN: ELV2_APOLLO_CONTENT_KIND.VOCABULARY,
  WORD_SEARCH: ELV2_APOLLO_CONTENT_KIND.VOCABULARY,
  QUIZ_TIME: ELV2_APOLLO_CONTENT_KIND.QUIZ_TIME
});

var ELV2_APOLLO_UNIT_REQUIRED_HEADERS = Object.freeze([
  'LEVEL_ID', 'UNIT_ID', 'STATUS'
]);
var ELV2_APOLLO_BANK_REQUIRED_HEADERS = Object.freeze([
  'PLAY_ITEM_ID', 'SOURCE_ITEM_ID', 'LEVEL_ID', 'UNIT_ID', 'AREA_ID',
  'TEMPLATE_ID', 'ITEM_TYPE', 'STATUS'
]);
var ELV2_APOLLO_SENTENCE_REQUIRED_HEADERS = Object.freeze([
  'GAME_ID', 'WORDS_TO_ORDER', 'CORRECT_SENTENCE'
]);
var ELV2_APOLLO_VOCAB_REQUIRED_HEADERS = Object.freeze([
  'STEM', 'CORRECT_OPTION', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D',
  'MATCH_LEFT', 'MATCH_RIGHT'
]);
var ELV2_APOLLO_QUIZ_REQUIRED_HEADERS = Object.freeze([
  'STEM', 'OPTION_A', 'OPTION_B', 'OPTION_C', 'OPTION_D', 'CORRECT_OPTION',
  'MINI_TEXT_OR_DIALOGUE'
]);

var ELV2_APOLLO_QUIZ_SPECS = Object.freeze([
  Object.freeze({ area_id: 'VOCAB', template_id: 'VOCAB_01', item_type: 'MCQ', expected: 5 }),
  Object.freeze({ area_id: 'GRAM', template_id: 'GRAM_01', item_type: 'MCQ', expected: 5 }),
  Object.freeze({ area_id: 'SPEAK', template_id: 'SPEAK_02', item_type: 'MCQ', expected: 5 }),
  Object.freeze({ area_id: 'LISTEN', template_id: 'LISTEN_01', item_type: 'DIALOGUE_MCQ', expected: 5 }),
  Object.freeze({ area_id: 'READ', template_id: 'READ_01', item_type: 'READING_MCQ', expected: 5 })
]);

function ELV2_apolloText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}
function ELV2_apolloUpper_(value) {
  return ELV2_apolloText_(value).toUpperCase();
}
function ELV2_apolloClone_(value) {
  return JSON.parse(JSON.stringify(value));
}

function ELV2_apolloContentRef(levelId, unitId, contentKind) {
  var level = ELV2_apolloUpper_(levelId);
  var unit = ELV2_apolloUpper_(unitId);
  var kind = ELV2_apolloUpper_(contentKind);
  if (!/^(B1|B2|I1|I2)$/.test(level) ||
      !/^(B1|B2|I1|I2)-U(?:0[1-9]|1[0-6])$/.test(unit) ||
      unit.indexOf(level + '-') !== 0 ||
      !Object.prototype.hasOwnProperty.call(ELV2_APOLLO_CONTENT_KIND, kind)) {
    throw new Error('ELV2_CONTENT_REF_INVALID');
  }
  return ELV2_APOLLO_CONTENT_VERSION + ':' + level + ':' + unit + ':' + kind;
}

function ELV2_parseApolloContentRef_(contentRef) {
  var raw = ELV2_apolloUpper_(contentRef);
  var match = raw.match(/^APOLLO_PLAY_V1:(B1|B2|I1|I2):((?:B1|B2|I1|I2)-U(?:0[1-9]|1[0-6])):(SENTENCE_ORDER|VOCABULARY|QUIZ_TIME)$/);
  if (!match || match[2].indexOf(match[1] + '-') !== 0) {
    throw new Error('ELV2_CONTENT_REF_INVALID');
  }
  return Object.freeze({
    content_ref: raw,
    level_id: match[1],
    unit_id: match[2],
    content_kind: match[3]
  });
}

function ELV2_apolloNormalizeHeaders_(headers) {
  if (!Array.isArray(headers) || headers.length === 0) {
    throw new Error('ELV2_CURRICULUM_SCHEMA_INVALID');
  }
  var seen = {};
  return headers.map(function (header) {
    var normalized = ELV2_apolloUpper_(header);
    if (!normalized || seen[normalized]) throw new Error('ELV2_CURRICULUM_SCHEMA_INVALID');
    seen[normalized] = true;
    return normalized;
  });
}

function ELV2_apolloNormalizeRow_(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) {
    throw new Error('ELV2_CURRICULUM_ROW_INVALID');
  }
  var normalized = {};
  Object.keys(row).forEach(function (key) {
    var header = ELV2_apolloUpper_(key);
    if (!header || Object.prototype.hasOwnProperty.call(normalized, header)) {
      throw new Error('ELV2_CURRICULUM_ROW_INVALID');
    }
    normalized[header] = row[key];
  });
  return normalized;
}

function ELV2_apolloRequireHeaders_(headers, required) {
  var present = {};
  headers.forEach(function (header) { present[header] = true; });
  required.forEach(function (header) {
    if (!present[header]) throw new Error('ELV2_CURRICULUM_SCHEMA_INVALID');
  });
}

function ELV2_apolloReadSheet_(reader, sheetName, requiredHeaders) {
  if (!reader || typeof reader.readSheet !== 'function') {
    throw new Error('ELV2_CURRICULUM_READER_INVALID');
  }
  var data = reader.readSheet(sheetName);
  if (!data || !Array.isArray(data.headers) || !Array.isArray(data.rows)) {
    throw new Error('ELV2_CURRICULUM_SCHEMA_INVALID');
  }
  var headers = ELV2_apolloNormalizeHeaders_(data.headers);
  ELV2_apolloRequireHeaders_(headers, requiredHeaders);
  return Object.freeze({
    headers: headers,
    rows: data.rows.map(ELV2_apolloNormalizeRow_)
  });
}

function ELV2_apolloReadBank_(reader, extraHeaders) {
  return ELV2_apolloReadSheet_(
    reader,
    'ACADEMIA_PLAY_BANK',
    ELV2_APOLLO_BANK_REQUIRED_HEADERS.concat(extraHeaders || [])
  );
}

function ELV2_apolloUnit_(reader, levelId, unitId) {
  var data = ELV2_apolloReadSheet_(reader, 'CONFIG_UNIDADES', ELV2_APOLLO_UNIT_REQUIRED_HEADERS);
  var matches = data.rows.filter(function (row) {
    return ELV2_apolloUpper_(row.LEVEL_ID) === levelId &&
      ELV2_apolloUpper_(row.UNIT_ID) === unitId &&
      ELV2_apolloUpper_(row.STATUS) === 'ACTIVE';
  });
  if (matches.length !== 1) throw new Error('ELV2_CURRICULUM_UNIT_NOT_AVAILABLE');
  var row = matches[0];
  return Object.freeze({
    level_id: levelId,
    unit_id: unitId,
    unit_number: Number(row.UNIT_NUMBER || unitId.slice(-2)) || 0,
    unit_name: ELV2_apolloText_(row.UNIT_NAME),
    unit_objective_es: ELV2_apolloText_(row.UNIT_OBJECTIVE_ES),
    program_topic: ELV2_apolloText_(row.PROGRAM_TOPIC),
    source_reference: ELV2_apolloText_(row.SOURCE_REFERENCE),
    status: 'ACTIVE'
  });
}

function ELV2_apolloAssertUnique_(items, fieldName) {
  var seen = {};
  items.forEach(function (item) {
    var value = ELV2_apolloText_(item[fieldName]);
    if (!value || seen[value]) throw new Error('ELV2_CURRICULUM_POOL_INVALID');
    seen[value] = true;
  });
}

function ELV2_apolloSentencePackage_(reader, ref, unit) {
  var data = ELV2_apolloReadBank_(reader, ELV2_APOLLO_SENTENCE_REQUIRED_HEADERS);
  var expectedGameId = ref.unit_id + '-GRAM-02';
  var rows = data.rows.filter(function (row) {
    return ELV2_apolloUpper_(row.LEVEL_ID) === ref.level_id &&
      ELV2_apolloUpper_(row.UNIT_ID) === ref.unit_id &&
      ELV2_apolloUpper_(row.AREA_ID) === 'GRAM' &&
      ELV2_apolloUpper_(row.TEMPLATE_ID) === 'GRAM_02' &&
      ELV2_apolloUpper_(row.ITEM_TYPE) === 'ORDER' &&
      ELV2_apolloUpper_(row.GAME_ID) === expectedGameId &&
      ELV2_apolloUpper_(row.STATUS) === 'ACTIVE';
  });
  if (rows.length !== 5) throw new Error('ELV2_CURRICULUM_POOL_INVALID');

  var items = rows.map(function (row) {
    var words = ELV2_apolloText_(row.WORDS_TO_ORDER);
    var correctSentence = ELV2_apolloText_(row.CORRECT_SENTENCE);
    var playItemId = ELV2_apolloText_(row.PLAY_ITEM_ID);
    if (!playItemId || !words || !correctSentence) throw new Error('ELV2_CURRICULUM_ROW_INVALID');
    return {
      play_item_id: playItemId,
      source_item_id: ELV2_apolloText_(row.SOURCE_ITEM_ID) || playItemId,
      template_id: 'GRAM_02',
      item_type: 'ORDER',
      prompt_es: ELV2_apolloText_(row.PROMPT_ES),
      stem: ELV2_apolloText_(row.STEM),
      words_to_order: words,
      correct_sentence: correctSentence,
      explanation_es: ELV2_apolloText_(row.EXPLANATION_ES)
    };
  });
  ELV2_apolloAssertUnique_(items, 'play_item_id');

  return {
    content_type: 'SENTENCE_ORDER_SET',
    source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
    level_id: ref.level_id,
    unit_id: ref.unit_id,
    curriculum: unit,
    items: items
  };
}

function ELV2_apolloCorrectOption_(row) {
  var letter = ELV2_apolloUpper_(row.CORRECT_OPTION);
  if (!/^[ABCD]$/.test(letter)) throw new Error('ELV2_CURRICULUM_ROW_INVALID');
  var answer = ELV2_apolloText_(row['OPTION_' + letter]);
  if (!answer) throw new Error('ELV2_CURRICULUM_ROW_INVALID');
  return { letter: letter, value: answer };
}

function ELV2_apolloVocabularyPackage_(reader, ref, unit) {
  var data = ELV2_apolloReadBank_(reader, ELV2_APOLLO_VOCAB_REQUIRED_HEADERS);
  var rows = data.rows.filter(function (row) {
    var template = ELV2_apolloUpper_(row.TEMPLATE_ID);
    var type = ELV2_apolloUpper_(row.ITEM_TYPE);
    return ELV2_apolloUpper_(row.LEVEL_ID) === ref.level_id &&
      ELV2_apolloUpper_(row.UNIT_ID) === ref.unit_id &&
      ELV2_apolloUpper_(row.AREA_ID) === 'VOCAB' &&
      ELV2_apolloUpper_(row.STATUS) === 'ACTIVE' &&
      ((template === 'VOCAB_01' && type === 'MCQ') ||
       (template === 'VOCAB_02' && type === 'MATCH'));
  });
  if (rows.length !== 10) throw new Error('ELV2_CURRICULUM_POOL_INVALID');

  var counts = { VOCAB_01: 0, VOCAB_02: 0 };
  var items = rows.map(function (row) {
    var template = ELV2_apolloUpper_(row.TEMPLATE_ID);
    var label = '';
    var hint = '';
    if (template === 'VOCAB_01') {
      label = ELV2_apolloText_(row.STEM);
      hint = ELV2_apolloCorrectOption_(row).value;
    } else {
      label = ELV2_apolloText_(row.MATCH_LEFT);
      hint = ELV2_apolloText_(row.MATCH_RIGHT);
    }
    var playItemId = ELV2_apolloText_(row.PLAY_ITEM_ID);
    var sourceItemId = ELV2_apolloText_(row.SOURCE_ITEM_ID);
    if (!playItemId || !sourceItemId || !label || !hint) throw new Error('ELV2_CURRICULUM_ROW_INVALID');
    counts[template] += 1;
    return {
      play_item_id: playItemId,
      source_item_id: sourceItemId,
      template_id: template,
      item_type: ELV2_apolloUpper_(row.ITEM_TYPE),
      label: label,
      hint_es: hint
    };
  });
  if (counts.VOCAB_01 !== 5 || counts.VOCAB_02 !== 5) {
    throw new Error('ELV2_CURRICULUM_POOL_INVALID');
  }
  ELV2_apolloAssertUnique_(items, 'play_item_id');
  ELV2_apolloAssertUnique_(items, 'source_item_id');

  return {
    content_type: 'VOCABULARY_SET',
    source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
    level_id: ref.level_id,
    unit_id: ref.unit_id,
    curriculum: unit,
    items: items
  };
}

function ELV2_apolloQuizSpec_(row) {
  var area = ELV2_apolloUpper_(row.AREA_ID);
  var template = ELV2_apolloUpper_(row.TEMPLATE_ID);
  var type = ELV2_apolloUpper_(row.ITEM_TYPE);
  for (var i = 0; i < ELV2_APOLLO_QUIZ_SPECS.length; i += 1) {
    var spec = ELV2_APOLLO_QUIZ_SPECS[i];
    if (spec.area_id === area && spec.template_id === template && spec.item_type === type) return spec;
  }
  return null;
}

function ELV2_apolloQuizPackage_(reader, ref, unit) {
  var data = ELV2_apolloReadBank_(reader, ELV2_APOLLO_QUIZ_REQUIRED_HEADERS);
  var rows = data.rows.filter(function (row) {
    return ELV2_apolloUpper_(row.LEVEL_ID) === ref.level_id &&
      ELV2_apolloUpper_(row.UNIT_ID) === ref.unit_id &&
      ELV2_apolloUpper_(row.STATUS) === 'ACTIVE' &&
      !!ELV2_apolloQuizSpec_(row);
  });
  if (rows.length !== 25) throw new Error('ELV2_CURRICULUM_POOL_INVALID');

  var counts = {};
  ELV2_APOLLO_QUIZ_SPECS.forEach(function (spec) { counts[spec.area_id] = 0; });
  var items = rows.map(function (row) {
    var spec = ELV2_apolloQuizSpec_(row);
    var correct = ELV2_apolloCorrectOption_(row);
    var context = ELV2_apolloText_(row.MINI_TEXT_OR_DIALOGUE);
    var options = ['A', 'B', 'C', 'D'].map(function (letter) {
      return ELV2_apolloText_(row['OPTION_' + letter]);
    });
    if (options.some(function (option) { return !option; })) throw new Error('ELV2_CURRICULUM_ROW_INVALID');
    if ((spec.item_type === 'DIALOGUE_MCQ' || spec.item_type === 'READING_MCQ') && !context) {
      throw new Error('ELV2_CURRICULUM_ROW_INVALID');
    }
    var playItemId = ELV2_apolloText_(row.PLAY_ITEM_ID);
    var sourceItemId = ELV2_apolloText_(row.SOURCE_ITEM_ID);
    var stem = ELV2_apolloText_(row.STEM);
    if (!playItemId || !sourceItemId || !stem) throw new Error('ELV2_CURRICULUM_ROW_INVALID');
    counts[spec.area_id] += 1;
    return {
      play_item_id: playItemId,
      source_item_id: sourceItemId,
      area_id: spec.area_id,
      template_id: spec.template_id,
      item_type: spec.item_type,
      prompt_es: ELV2_apolloText_(row.PROMPT_ES),
      stem: stem,
      mini_text_or_dialogue: context,
      options: options,
      correct_option: correct.letter,
      explanation_es: ELV2_apolloText_(row.EXPLANATION_ES)
    };
  });

  ELV2_APOLLO_QUIZ_SPECS.forEach(function (spec) {
    if (counts[spec.area_id] !== spec.expected) throw new Error('ELV2_CURRICULUM_POOL_INVALID');
  });
  ELV2_apolloAssertUnique_(items, 'play_item_id');
  ELV2_apolloAssertUnique_(items, 'source_item_id');

  return {
    content_type: 'QUIZ_TIME_POOL',
    source_id: 'APOLLO_G3/ACADEMIA_PLAY_BANK',
    level_id: ref.level_id,
    unit_id: ref.unit_id,
    curriculum: unit,
    items: items
  };
}

function ELV2_createApolloContentSource(reader) {
  if (!reader || typeof reader.readSheet !== 'function') {
    throw new Error('ELV2_CURRICULUM_READER_INVALID');
  }
  return Object.freeze({
    getByRef: function (contentRef, gameId) {
      var ref = ELV2_parseApolloContentRef_(contentRef);
      var normalizedGameId = ELV2_apolloUpper_(gameId);
      var expectedKind = ELV2_APOLLO_GAME_CONTENT_KIND[normalizedGameId];
      if (!expectedKind || expectedKind !== ref.content_kind) return null;

      var unit = ELV2_apolloUnit_(reader, ref.level_id, ref.unit_id);
      var content;
      if (ref.content_kind === ELV2_APOLLO_CONTENT_KIND.SENTENCE_ORDER) {
        content = ELV2_apolloSentencePackage_(reader, ref, unit);
      } else if (ref.content_kind === ELV2_APOLLO_CONTENT_KIND.VOCABULARY) {
        content = ELV2_apolloVocabularyPackage_(reader, ref, unit);
      } else if (ref.content_kind === ELV2_APOLLO_CONTENT_KIND.QUIZ_TIME) {
        content = ELV2_apolloQuizPackage_(reader, ref, unit);
      } else {
        return null;
      }
      return Object.freeze({
        game_id: normalizedGameId,
        content_version: ELV2_APOLLO_CONTENT_VERSION,
        content: ELV2_apolloClone_(content)
      });
    }
  });
}

function ELV2_createAppsScriptApolloReader(spreadsheetId) {
  var id = ELV2_apolloText_(spreadsheetId);
  if (!id) throw new Error('ELV2_CURRICULUM_SPREADSHEET_REQUIRED');

  return Object.freeze({
    readSheet: function (sheetName) {
      if (typeof SpreadsheetApp === 'undefined' || !SpreadsheetApp ||
          typeof SpreadsheetApp.openById !== 'function') {
        throw new Error('ELV2_CURRICULUM_SPREADSHEET_UNAVAILABLE');
      }
      var spreadsheet = SpreadsheetApp.openById(id);
      var sheet = spreadsheet && spreadsheet.getSheetByName(sheetName);
      if (!sheet) throw new Error('ELV2_CURRICULUM_SHEET_NOT_FOUND');
      var lastRow = sheet.getLastRow();
      var lastColumn = sheet.getLastColumn();
      if (lastRow < 1 || lastColumn < 1) throw new Error('ELV2_CURRICULUM_SCHEMA_INVALID');

      var values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
      if (!Array.isArray(values) || values.length < 1) throw new Error('ELV2_CURRICULUM_SCHEMA_INVALID');
      var headers = values[0].map(ELV2_apolloText_);
      var normalizedHeaders = ELV2_apolloNormalizeHeaders_(headers);
      var rows = values.slice(1).filter(function (row) {
        return row.some(function (cell) { return !!ELV2_apolloText_(cell); });
      }).map(function (row) {
        var out = {};
        normalizedHeaders.forEach(function (header, index) { out[header] = row[index]; });
        return out;
      });
      return { headers: normalizedHeaders, rows: rows };
    }
  });
}

function ELV2_createAppsScriptApolloContentSource(spreadsheetId) {
  return ELV2_createApolloContentSource(ELV2_createAppsScriptApolloReader(spreadsheetId));
}
