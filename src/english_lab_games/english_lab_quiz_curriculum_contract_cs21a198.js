// CS21A198 · Contrato curricular de Quiz Time.
// Fundación QA: no hace fetch, no contiene claves correctas ni modifica otros juegos.
(function installEnglishLabQuizCurriculumContractCS21A198(global) {
  'use strict';

  if (!global || global.EnglishLabQuizCurriculumContractCS21A198) return;

  const VERSION = 'CS21A198';
  const GAME_ID = 'QUIZ_TIME';
  const INITIAL_UNIT_ID = 'B1-U01';
  const QUESTIONS_PER_ROUND = 10;
  const QUESTIONS_PER_AREA = 2;

  const AREA_SPECS = Object.freeze([
    Object.freeze({areaId:'VOCAB', templateId:'VOCAB_01', label:'Vocabulary', itemType:'MCQ', expectedItems:5}),
    Object.freeze({areaId:'GRAM', templateId:'GRAM_01', label:'Grammar', itemType:'MCQ', expectedItems:5}),
    Object.freeze({areaId:'SPEAK', templateId:'SPEAK_02', label:'Communication', itemType:'MCQ', expectedItems:5}),
    Object.freeze({areaId:'LISTEN', templateId:'LISTEN_01', label:'Listening', itemType:'DIALOGUE_MCQ', expectedItems:5}),
    Object.freeze({areaId:'READ', templateId:'READ_01', label:'Reading', itemType:'READING_MCQ', expectedItems:5}),
  ]);

  const INITIAL_CURRICULUM = Object.freeze({
    levelId:'B1',
    unitId:INITIAL_UNIT_ID,
    unitNumber:1,
    unitTitle:"What's your name?",
    lessons:Object.freeze([1,2]),
    book:'Interchange Intro · Fifth Edition',
    studentBookPages:'2–7',
    workbookPages:'1–4',
    teacherBookPages:'T-2–T-7',
    objectiveEs:'Presentarse, intercambiar saludos formales e informales, solicitar y brindar información personal básica y deletrear nombres en conversaciones breves.',
    topics:Object.freeze([
      'Alphabet', 'Greetings and farewells', 'Names and courtesy titles',
      'Numbers 0–10', 'Phone numbers', 'Email addresses',
    ]),
    grammar:Object.freeze(['Verb be', 'Affirmative statements', 'Contractions', 'Possessive adjectives my/your/his/her']),
    speaking:Object.freeze(['Introduce yourself', 'Introduce friends', 'Say hello and goodbye', 'Ask for names and phone numbers']),
    listening:Object.freeze(['Linked sounds', 'Spelling names', 'Phone numbers', 'Email addresses']),
    readingWriting:Object.freeze(['Names', 'Phone numbers', 'Email addresses']),
    source:'APOLLO_G3 · DETALLE DEL PROGRAMA + CONFIG_UNIDADES + ACADEMIA_PLAY_BANK',
    status:'QA_ONLY',
  });

  const FORBIDDEN_PUBLIC_KEYS = Object.freeze(new Set([
    'correct','correct_option','correctoption','correct_answer','correctanswer',
    'answer_key','answerkey','solution','is_correct','iscorrect','correct_index','correctindex',
  ]));

  function clean(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function upper(value) {
    return clean(value).toUpperCase();
  }

  function normalizeUnitId(value, levelId) {
    const raw = upper(value);
    const level = upper(levelId || raw.split('-')[0] || 'B1');
    const match = raw.match(/U(\d{1,2})$/);
    if (!match) return '';
    return `${level}-U${String(Math.max(1, Math.min(99, Number(match[1]) || 1))).padStart(2, '0')}`;
  }

  function isEnabledUnit(levelId, unitId) {
    return upper(levelId) === 'B1' && normalizeUnitId(unitId, levelId) === INITIAL_UNIT_ID;
  }

  function specFor(areaId, templateId) {
    const area = upper(areaId);
    const template = upper(templateId);
    return AREA_SPECS.find(spec => spec.areaId === area && (!template || spec.templateId === template)) || null;
  }

  function canonicalRow(row) {
    const source = row && typeof row === 'object' ? row : {};
    return Object.freeze({
      playItemId:clean(source.play_item_id || source.PLAY_ITEM_ID),
      sourceItemId:clean(source.source_item_id || source.SOURCE_ITEM_ID),
      levelId:upper(source.level_id || source.LEVEL_ID),
      unitId:upper(source.unit_id || source.UNIT_ID),
      areaId:upper(source.area_id || source.AREA_ID),
      templateId:upper(source.template_id || source.TEMPLATE_ID),
      itemType:upper(source.item_type || source.ITEM_TYPE),
      status:upper(source.status || source.STATUS || 'ACTIVE'),
    });
  }

  function isCanonicalPoolRow(row) {
    const item = canonicalRow(row);
    const spec = specFor(item.areaId, item.templateId);
    return !!(
      spec && item.levelId === 'B1' && item.unitId === INITIAL_UNIT_ID &&
      item.itemType === spec.itemType && item.status === 'ACTIVE' &&
      item.playItemId && item.sourceItemId
    );
  }

  function validateCanonicalPool(rows) {
    const source = Array.isArray(rows) ? rows : [];
    const pool = source.filter(isCanonicalPoolRow).map(canonicalRow);
    const counts = {};
    const duplicates = [];
    const seenPlay = new Set();
    const seenSourceByArea = new Map();

    AREA_SPECS.forEach(spec => {
      counts[spec.areaId] = 0;
      seenSourceByArea.set(spec.areaId, new Set());
    });

    pool.forEach(item => {
      counts[item.areaId] = (counts[item.areaId] || 0) + 1;
      if (seenPlay.has(item.playItemId)) duplicates.push(`PLAY_ITEM_ID:${item.playItemId}`);
      seenPlay.add(item.playItemId);
      const areaSeen = seenSourceByArea.get(item.areaId) || new Set();
      if (areaSeen.has(item.sourceItemId)) duplicates.push(`SOURCE_ITEM_ID:${item.areaId}:${item.sourceItemId}`);
      areaSeen.add(item.sourceItemId);
      seenSourceByArea.set(item.areaId, areaSeen);
    });

    const missing = AREA_SPECS.filter(spec => counts[spec.areaId] !== spec.expectedItems)
      .map(spec => `${spec.areaId}:${counts[spec.areaId] || 0}/${spec.expectedItems}`);

    return Object.freeze({
      ok:pool.length === 25 && missing.length === 0 && duplicates.length === 0,
      unitId:INITIAL_UNIT_ID,
      poolSize:pool.length,
      counts:Object.freeze({...counts}),
      missing:Object.freeze(missing),
      duplicates:Object.freeze(duplicates),
    });
  }

  // FNV-1a simple para un orden determinista entre clientes; no es seguridad.
  function hash32(value) {
    let hash = 2166136261;
    const text = clean(value);
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededOrder(values, seed) {
    return [...values].sort((a, b) => {
      const aKey = hash32(`${seed}|${clean(a.playItemId || a.play_item_id || a.PLAY_ITEM_ID || a)}`);
      const bKey = hash32(`${seed}|${clean(b.playItemId || b.play_item_id || b.PLAY_ITEM_ID || b)}`);
      return aKey - bKey || clean(a.playItemId || a).localeCompare(clean(b.playItemId || b));
    });
  }

  function buildRoundBlueprint(rows, seed) {
    const validation = validateCanonicalPool(rows);
    if (!validation.ok) {
      const error = new Error(`Pool curricular B1-U01 inválido: ${[...validation.missing, ...validation.duplicates].join(', ') || validation.poolSize}`);
      error.code = 'QUIZ_CURRICULUM_POOL_INVALID';
      throw error;
    }
    const canonical = rows.filter(isCanonicalPoolRow).map(canonicalRow);
    const selected = [];
    AREA_SPECS.forEach(spec => {
      const areaRows = canonical.filter(item => item.areaId === spec.areaId);
      seededOrder(areaRows, `${seed}|${spec.areaId}`).slice(0, QUESTIONS_PER_AREA).forEach(item => selected.push(item));
    });
    const finalOrder = seededOrder(selected, `${seed}|FINAL`);
    const sourceIds = new Set(finalOrder.map(item => item.sourceItemId));
    if (finalOrder.length !== QUESTIONS_PER_ROUND || sourceIds.size !== finalOrder.length) {
      throw new Error('La ronda Quiz Time no logró 10 fuentes curriculares únicas.');
    }
    return Object.freeze(finalOrder.map((item, index) => Object.freeze({
      position:index + 1,
      playItemId:item.playItemId,
      sourceItemId:item.sourceItemId,
      areaId:item.areaId,
      templateId:item.templateId,
      itemType:item.itemType,
    })));
  }

  function hasForbiddenPublicKey(value) {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(hasForbiddenPublicKey);
    return Object.entries(value).some(([key, child]) => FORBIDDEN_PUBLIC_KEYS.has(upper(key).toLowerCase()) || hasForbiddenPublicKey(child));
  }

  function publicContract() {
    return Object.freeze({
      version:VERSION,
      gameId:GAME_ID,
      enabledUnits:Object.freeze([INITIAL_UNIT_ID]),
      questionsPerRound:QUESTIONS_PER_ROUND,
      questionsPerArea:QUESTIONS_PER_AREA,
      canonicalPoolSize:25,
      areas:AREA_SPECS,
      curriculum:INITIAL_CURRICULUM,
    });
  }

  global.EnglishLabQuizCurriculumContractCS21A198 = Object.freeze({
    VERSION,
    GAME_ID,
    INITIAL_UNIT_ID,
    QUESTIONS_PER_ROUND,
    QUESTIONS_PER_AREA,
    AREA_SPECS,
    INITIAL_CURRICULUM,
    clean,
    upper,
    normalizeUnitId,
    isEnabledUnit,
    specFor,
    canonicalRow,
    isCanonicalPoolRow,
    validateCanonicalPool,
    hash32,
    seededOrder,
    buildRoundBlueprint,
    hasForbiddenPublicKey,
    publicContract,
  });
})(window);
